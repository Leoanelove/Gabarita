import JSZip from 'jszip';
import initSqlJs from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { decompress as zstdDecompress } from 'fzstd';

export interface ApkgParsedCard {
  frente: string;
  verso: string;
  disciplina?: string;
  topico?: string;
  deckName?: string;
}

export interface ApkgParseResult {
  cards: ApkgParsedCard[];
  detectedDeckNames: string[];
  suggestedDisciplina?: string;
  suggestedDeckName?: string;
}

const ANKI_UPGRADE_PLACEHOLDER_PATTERNS = [
  /please update to the latest anki version/i,
  /atualize para a versão mais recente do anki/i,
  /anki 2\.1\.50\+/i,
];

function isAnkiPlaceholderNote(text: string): boolean {
  return ANKI_UPGRADE_PLACEHOLDER_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * Converte HTML dos campos do Anki em texto limpo e legível
 */
export function cleanAnkiHtml(rawHtml: string): string {
  if (!rawHtml) return '';

  let text = rawHtml
    // Remove blocos style e script
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    // Remove tags de áudio do Anki [sound:...]
    .replace(/\[sound:[^\]]+\]/gi, '')
    // Substitui quebras de linha HTML por \n
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/\s*(div|p|li|tr|h[1-6])\s*>/gi, '\n')
    .replace(/<\s*li[^>]*>/gi, '• ')
    // Remove demais tags HTML
    .replace(/<[^>]+>/g, '');

  // Decodifica entidades HTML comuns
  if (typeof document !== 'undefined') {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    text = textarea.value;
  } else {
    text = text
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'");
  }

  return text
    .split('\n')
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
    .trim();
}

/**
 * Trata cartões do tipo Cloze (Omissão de Palavras: {{c1::resposta::dica}})
 */
function processAnkiFields(fields: string[]): { frente: string; verso: string } | null {
  const cleanedFields = fields.map(cleanAnkiHtml);
  const nonEmptyFields = cleanedFields.filter(Boolean);
  if (nonEmptyFields.length === 0) return null;

  const firstField = cleanedFields[0] || nonEmptyFields[0] || '';
  const secondField = cleanedFields[1] || nonEmptyFields[1] || '';

  if (isAnkiPlaceholderNote(firstField)) {
    return null;
  }

  const clozeRegex = /\{\{c\d+::([\s\S]*?)(?:::([\s\S]*?))?\}\}/gi;
  if (clozeRegex.test(firstField)) {
    const frente = firstField.replace(clozeRegex, (_match, _ans, hint) => {
      return hint ? `[... (${hint.trim()})]` : '[...]';
    });
    const resolvedCloze = firstField.replace(clozeRegex, (_match, ans) => ans.trim());
    const extraNotes = secondField && secondField !== firstField
      ? secondField.replace(clozeRegex, (_match, ans) => ans.trim())
      : '';
    const verso = extraNotes ? `${resolvedCloze}\n\n${extraNotes}` : resolvedCloze;
    if (frente && verso) {
      return { frente: frente.trim(), verso: verso.trim() };
    }
  }

  if (firstField && secondField) {
    return {
      frente: firstField.trim(),
      verso: secondField.trim(),
    };
  }

  if (nonEmptyFields.length >= 2) {
    return {
      frente: nonEmptyFields[0].trim(),
      verso: nonEmptyFields.slice(1).join('\n').trim(),
    };
  }

  return null;
}

/**
 * Extrai hierarquia de disciplina e sub-baralho a partir do nome do deck no Anki (ex: "Informática::Redes")
 */
function parseAnkiDeckHierarchy(
  rawDeckName: string | undefined,
  fallbackFromFileName: string
): { disciplina?: string; deckName?: string } {
  const cleanDeck = (rawDeckName || '').replace(/\x1f/g, '::').trim();
  const isDefaultDeck = !cleanDeck || /^(default|padrão)$/i.test(cleanDeck);

  const effectiveName = isDefaultDeck ? fallbackFromFileName : cleanDeck;
  if (!effectiveName) return {};

  const parts = effectiveName.split('::').map(p => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return {
      disciplina: parts[0],
      deckName: parts.slice(1).join(' - '),
    };
  }
  return {
    disciplina: parts[0],
    deckName: parts[0],
  };
}

/**
 * Fallback em TypeScript puro para extrair notas diretamente do arquivo binário SQLite
 * caso o carregamento WebAssembly do sql.js falhe.
 */
function extractNotesFromSqliteBinaryFallback(
  dbBytes: Uint8Array,
  fallbackDeckName: string
): ApkgParsedCard[] {
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const rawText = decoder.decode(dbBytes);
  const cards: ApkgParsedCard[] = [];
  const seenFrentes = new Set<string>();

  // No SQLite do Anki, a coluna `flds` armazena os campos separados por \x1f (0x1F)
  // Vamos localizar sequências de texto legível separadas por \x1f
  const parts = rawText.split('\x1f');
  if (parts.length < 2) return [];

  const { disciplina, deckName } = parseAnkiDeckHierarchy(undefined, fallbackDeckName);

  for (let i = 0; i < parts.length - 1; i++) {
    // Extrai o sufixo legível de parts[i] (Frente) e o prefixo legível de parts[i+1] (Verso)
    const rawFrontCandidate = parts[i].slice(-1200);
    const rawBackCandidate = parts[i + 1].slice(0, 1800);

    // Limpa caracteres de controle binários do SQLite nas extremidades
    const frontMatch = rawFrontCandidate.match(/[\x20-\x7E\u00A0-\uFFFF\n\r\t]{2,}$/);
    const backMatch = rawBackCandidate.match(/^[\x20-\x7E\u00A0-\uFFFF\n\r\t]{1,}/);

    if (!frontMatch || !backMatch) continue;

    const processed = processAnkiFields([frontMatch[0], backMatch[0]]);
    if (
      processed &&
      processed.frente.length >= 2 &&
      processed.verso.length >= 1 &&
      !seenFrentes.has(processed.frente.toLowerCase())
    ) {
      seenFrentes.add(processed.frente.toLowerCase());
      cards.push({
        frente: processed.frente,
        verso: processed.verso,
        disciplina,
        topico: deckName,
        deckName,
      });
    }
  }

  return cards;
}

/**
 * Lê e extrai todos os cartões e baralhos de um arquivo .apkg do Anki
 */
export async function parseApkgFile(file: File): Promise<ApkgParseResult> {
  const fileBaseName = file.name.replace(/\.apkg$/i, '').trim() || 'Baralho Anki';
  const zip = await JSZip.loadAsync(file);

  // Prioridade de arquivos de banco de dados do Anki:
  // 1. collection.anki21b (Anki 23.10+ comprimido com Zstandard)
  // 2. collection.anki21 (Anki 2.1+ SQLite padrão)
  // 3. collection.anki2 (Anki 2.0 legado)
  const fileNames = Object.keys(zip.files);
  const anki21bEntry = fileNames.find(name => name.endsWith('collection.anki21b'));
  const anki21Entry = fileNames.find(name => name.endsWith('collection.anki21'));
  const anki2Entry = fileNames.find(name => name.endsWith('collection.anki2'));

  const candidateEntries = [anki21bEntry, anki21Entry, anki2Entry].filter(Boolean) as string[];
  if (candidateEntries.length === 0) {
    throw new Error('O arquivo .apkg não contém uma coleção válida do Anki (collection.anki21 / collection.anki2).');
  }

  let SQL: initSqlJs.SqlJsStatic | null = null;
  try {
    SQL = await initSqlJs({
      locateFile: () => wasmUrl,
    });
  } catch {
    try {
      SQL = await initSqlJs({
        locateFile: (f: string) => `https://sql.js.org/dist/${f}`,
      });
    } catch (err) {
      console.warn('Aviso: Usando parser binário nativo para SQLite do Anki:', err);
    }
  }

  for (const entryName of candidateEntries) {
    const zipObj = zip.file(entryName);
    if (!zipObj) continue;

    let dbBytes = await zipObj.async('uint8array');

    // Se for collection.anki21b, descomprimir com Zstandard (fzstd)
    if (entryName.endsWith('.anki21b')) {
      try {
        dbBytes = zstdDecompress(dbBytes);
      } catch (err) {
        console.warn('Falha ao descomprimir collection.anki21b, tentando próximo formato:', err);
        continue;
      }
    }

    if (SQL) {
      try {
        const db = new SQL.Database(dbBytes);

        // 1. Mapear IDs dos baralhos (Decks) -> Nome do Baralho
        const deckIdToName = new Map<string, string>();
        try {
          const colRes = db.exec('SELECT decks FROM col LIMIT 1');
          if (colRes.length > 0 && colRes[0].values.length > 0) {
            const decksJsonStr = String(colRes[0].values[0][0] || '{}');
            const decksObj = JSON.parse(decksJsonStr);
            Object.entries(decksObj).forEach(([id, deckData]: [string, any]) => {
              if (deckData && typeof deckData.name === 'string') {
                deckIdToName.set(String(id), deckData.name);
              }
            });
          }
        } catch {
          // No Anki 2.1.28+ / anki21b pode existir uma tabela separada `decks`
        }

        try {
          const decksTableRes = db.exec('SELECT id, name FROM decks');
          if (decksTableRes.length > 0) {
            decksTableRes[0].values.forEach(row => {
              const id = String(row[0]);
              const name = String(row[1] || '').replace(/\x1f/g, '::');
              if (name) deckIdToName.set(id, name);
            });
          }
        } catch {
          // Tabela `decks` opcional
        }

        // 2. Mapear Note ID (nid) -> Deck ID (did) através da tabela `cards`
        const noteIdToDeckId = new Map<string, string>();
        try {
          const cardsRes = db.exec('SELECT nid, did FROM cards');
          if (cardsRes.length > 0) {
            cardsRes[0].values.forEach(row => {
              const nid = String(row[0]);
              const did = String(row[1]);
              if (!noteIdToDeckId.has(nid)) {
                noteIdToDeckId.set(nid, did);
              }
            });
          }
        } catch {
          // Fallback caso tabela cards não esteja acessível
        }

        // 3. Ler todas as notas da tabela `notes`
        const notesRes = db.exec('SELECT id, flds, tags FROM notes');
        db.close();

        if (notesRes.length > 0 && notesRes[0].values.length > 0) {
          const parsedCards: ApkgParsedCard[] = [];
          const detectedDecksSet = new Set<string>();

          notesRes[0].values.forEach(row => {
            const noteId = String(row[0]);
            const rawFlds = String(row[1] || '');
            const fields = rawFlds.split('\x1f');

            const processed = processAnkiFields(fields);
            if (!processed) return;

            const did = noteIdToDeckId.get(noteId);
            const rawDeckName = did ? deckIdToName.get(did) : undefined;
            const { disciplina, deckName } = parseAnkiDeckHierarchy(rawDeckName, fileBaseName);

            if (deckName) detectedDecksSet.add(deckName);

            parsedCards.push({
              frente: processed.frente,
              verso: processed.verso,
              disciplina: disciplina || fileBaseName,
              topico: deckName || fileBaseName,
              deckName: deckName || fileBaseName,
            });
          });

          if (parsedCards.length > 0) {
            const detectedDeckNames = Array.from(detectedDecksSet);
            return {
              cards: parsedCards,
              detectedDeckNames,
              suggestedDisciplina: parsedCards[0]?.disciplina || fileBaseName,
              suggestedDeckName: detectedDeckNames[0] || fileBaseName,
            };
          }
        }
      } catch (sqlErr) {
        console.warn(`Erro ao consultar SQLite em ${entryName}:`, sqlErr);
      }
    }

    // Fallback binário caso sql.js não tenha retornado cartões neste arquivo
    const fallbackCards = extractNotesFromSqliteBinaryFallback(dbBytes, fileBaseName);
    if (fallbackCards.length > 0) {
      return {
        cards: fallbackCards,
        detectedDeckNames: [fileBaseName],
        suggestedDisciplina: fileBaseName,
        suggestedDeckName: fileBaseName,
      };
    }
  }

  throw new Error('Não foi possível encontrar cartões válidos dentro deste arquivo .apkg.');
}
