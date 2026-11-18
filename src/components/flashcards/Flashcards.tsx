import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Layers, 
  Plus, 
  Sparkles, 
  BrainCircuit, 
  Clock, 
  CheckCircle2, 
  BookOpen, 
  FolderPlus, 
  Search, 
  ChevronRight, 
  RotateCw,
  Eye,
  EyeOff,
  Flame,
  Scale,
  Shield,
  Filter,
  Check,
  X,
  ArrowLeft,
  GraduationCap,
  Sparkle,
  TrendingUp,
  Target,
  Trash2,
  AlertTriangle,
  Download,
  Upload,
  FileText,
  FileJson,
  FileSpreadsheet,
  Copy,
  Briefcase,
  Pencil
} from 'lucide-react';
import { Flashcard, Deck, Disciplina, Assunto, Concurso, NavigationTab } from '../../types';
import { Button } from '../../design-system/Button';
import { Modal } from '../../design-system/Modal';
import { FlashcardPlayer, ReviewSessionStats } from './FlashcardPlayer';
import { useTheme } from '../../contexts/ThemeContext';
import { DatabaseService } from '../../services/db';
import { MenuBannerFrame } from '../common/MenuBannerFrame';
import { parseApkgFile } from '../../utils/apkgParser';
import {
  GmailRichTextEditor,
  FlashcardRichContent,
  stripHtmlToPlainText,
  sanitizeFlashcardHtml,
} from './GmailRichTextEditor';

export const FLASHCARDS_BANNER_THEMES: Record<string, string> = {
  verde: "https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Flashcards/Banner-Flashcard-verde.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBGbGFzaGNhcmRzL0Jhbm5lci1GbGFzaGNhcmQtdmVyZGUucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc5MjY3MzAxOCwiZXhwIjo0OTQ2MjczMDE4fQ.bUX6pEhu81GWiSFf7TSYaSRDmwR77OUyqM2p9GqMXq-dKP0mDbjAFRwny2WwZnzAvDl397t51dWbYdaKEG4PVQ",

  azul: "https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Flashcards/Banner-Flashcard-azul.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBGbGFzaGNhcmRzL0Jhbm5lci1GbGFzaGNhcmQtYXp1bC5wbmciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzkyNjczMDQ1LCJleHAiOjQ5NDYyNzMwNDV9.WsS0ZwZJtyT8nblcFoK52WVh3ro2JkA8SOSqwM9EDfUk0JedEdE4R-lb1NI-9S5K4RvEocQIuJgryHZwKPs1HA",

  rosa: "https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Flashcards/Banner-Flashcard-rosa.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBGbGFzaGNhcmRzL0Jhbm5lci1GbGFzaGNhcmQtcm9zYS5wbmciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzkyNjczMDU5LCJleHAiOjQ5NDYyNzMwNTl9.sMJL9sVHBzjmrOHOkO7qPZsCtht4EYjAU33kar3g2W0ux86PBL-6kSduBZ_pmXfCc-Klxjf_fjGnWFOwJlG-EQ",

  roxo: "https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Flashcards/Banner-Flashcard-roxo.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBGbGFzaGNhcmRzL0Jhbm5lci1GbGFzaGNhcmQtcm94by5wbmciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzkyNjczMDcyLCJleHAiOjQ5NDYyNzMwNzJ9.QDm0refGe36TQV3evtSlYWQhU4HCGBDAHDK_-_ZxUW11xP44w2I9YiOjodEMiI1GBDORAYzxJpyLjATqwqJRPQ",

  laranja: "https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Flashcards/Banner-Flashcard-laranja.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBGbGFzaGNhcmRzL0Jhbm5lci1GbGFzaGNhcmQtbGFyYW5qYS5wbmciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzkyNjczNDU4LCJleHAiOjI2NTY2NzM0NTh9.3tsgwLoVmtZapR0_79uXisVqov5cDS7n4gVl1GolY640z1RRwJdpSx6dPh8hsn5zDt7EDXfhuJeJFfHyvMBicg"
};

export interface FlashcardsProps {
  disciplinas?: Disciplina[];
  assuntos?: Assunto[];
  concursos?: Concurso[];
  activeConcursoId?: string;
  onSelectConcurso?: (id: string) => Promise<void> | void;
  onNavigateTab?: (tab: NavigationTab) => void;
  onSaveStudySession?: (session: any) => Promise<void> | void;
}

interface ParsedImportCard {
  frente: string;
  verso: string;
  disciplina?: string;
  topico?: string;
  deckName?: string;
  dificuldade?: 'facil' | 'bom' | 'dificil' | 'errei';
  intervaloDias?: number;
  proximaRevisao?: string;
  revisoesTotal?: number;
}

const STORAGE_KEY_FLASHCARDS = '@gabarita:flashcards';
const STORAGE_KEY_DECKS = '@gabarita:decks';

// Helper para selecionar ícone temático conforme a disciplina
const getDisciplinaIcon = (disciplinaNome: string) => {
  const norm = (disciplinaNome || '').toLowerCase();
  if (norm.includes('constitucional') || norm.includes('juríd') || norm.includes('direito')) {
    return Scale;
  }
  if (norm.includes('portug') || norm.includes('redação') || norm.includes('gramát')) {
    return BookOpen;
  }
  if (norm.includes('administrativ') || norm.includes('gestão') || norm.includes('públic')) {
    return Shield;
  }
  if (norm.includes('lógic') || norm.includes('matemát') || norm.includes('estatíst')) {
    return BrainCircuit;
  }
  return Layers;
};

// Helper para formatar nome amigável de concurso
const getConcursoDisplayName = (c?: Concurso): string => {
  if (!c) return 'Concurso Selecionado';
  const organ = c.organ || c.orgao || c.nome || c.title || 'Concurso';
  const role = c.role || c.cargo || '';
  if (role && !organ.toLowerCase().includes(role.toLowerCase())) {
    return `${organ} - ${role}`;
  }
  return organ;
};

// Helper para sanitizar nome do arquivo de exportação
const slugifyConcursoName = (name: string): string => {
  return (name || 'concurso')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'concurso';
};

// Helper para atribuir com segurança baralhos/cartões legados sem concurso_id ao seu concurso correspondente
const resolveLegacyConcursoId = (
  disciplinaName: string,
  deckOrTopicName: string,
  allDisciplinas: Disciplina[],
  allAssuntos: Assunto[],
  allConcursos: Concurso[],
  fallbackConcursoId?: string
): string => {
  const normDisc = (disciplinaName || '').trim().toLowerCase();
  const normDeck = (deckOrTopicName || '').trim().toLowerCase();

  // 1. Verificar se o nome do baralho/tópico bate com algum assunto de uma disciplina com concursoId
  if (normDeck && allAssuntos.length > 0) {
    const matchedAssunto = allAssuntos.find(a => {
      const aName = (a.name || '').trim().toLowerCase();
      return aName === normDeck || aName.includes(normDeck) || (normDeck.length >= 3 && aName.includes(normDeck));
    });
    if (matchedAssunto) {
      const parentDisc = allDisciplinas.find(d => d.id === matchedAssunto.disciplinaId && d.concursoId);
      if (parentDisc?.concursoId) {
        return parentDisc.concursoId;
      }
    }
  }

  // 2. Verificar correspondência exata do nome da disciplina nas disciplinas cadastradas
  if (normDisc && allDisciplinas.length > 0) {
    const exactMatches = allDisciplinas.filter(
      d => d.concursoId && (d.name || '').trim().toLowerCase() === normDisc
    );
    if (exactMatches.length === 1 && exactMatches[0].concursoId) {
      return exactMatches[0].concursoId;
    }
    if (exactMatches.length > 1) {
      // Se houver mais de um concurso com essa disciplina, priorizar aquele que não seja o recém-criado se o nome tiver caixa/estilo idêntico
      const exactCaseMatch = exactMatches.find(d => (d.name || '').trim() === (disciplinaName || '').trim());
      if (exactCaseMatch?.concursoId) {
        return exactCaseMatch.concursoId;
      }
      if (exactMatches[0].concursoId) {
        return exactMatches[0].concursoId;
      }
    }

    // 3. Correspondência parcial (ex: "CONHECIMENTOS ESPECÍFICOS - AGENTE EDUCATIVO" -> concurso de Agente Educativo)
    const partialDiscMatch = allDisciplinas.find(d => {
      const dName = (d.name || '').trim().toLowerCase();
      return d.concursoId && (normDisc.includes(dName) || dName.includes(normDisc));
    });
    if (partialDiscMatch?.concursoId) {
      return partialDiscMatch.concursoId;
    }
  }

  // 4. Verificar se o nome da disciplina menciona o cargo/órgão de algum concurso cadastrado
  if (normDisc && allConcursos.length > 0) {
    const matchedConcursoByRole = allConcursos.find(c => {
      const role = (c.role || c.cargo || '').trim().toLowerCase();
      const organ = (c.organ || c.orgao || c.title || '').trim().toLowerCase();
      return (role.length > 3 && normDisc.includes(role)) || (organ.length > 3 && normDisc.includes(organ));
    });
    if (matchedConcursoByRole) {
      return matchedConcursoByRole.id;
    }
  }

  return fallbackConcursoId || allConcursos[0]?.id || 'default';
};

// Remove formatação markdown residual de campos de texto (negrito, numeração inicial, aspas)
const cleanCardField = (val: string, isFront = false): string => {
  let cleaned = (val || '').trim();
  // Remove aspas envolventes
  cleaned = cleaned.replace(/^["'“”]+|["'“”]+$/g, '').trim();
  // Remove negrito envolvendo todo o campo
  cleaned = cleaned.replace(/^\*\*(.+)\*\*$/s, '$1').trim();
  if (isFront) {
    // Remove numeração ou marcadores no início da pergunta (ex: "1. ", "01) ", "- ", "• ", "Card 1: ")
    cleaned = cleaned
      .replace(/^(?:(?:card|flashcard|cart[aã]o)\s*#?\d+\s*[:\-\–\—]?\s*)/i, '')
      .replace(/^(?:\d+[\.\)\-]\s+|[-•*]\s+)/, '')
      .replace(/^\*\*(?:P|Pergunta|Frente|Front|Q|Question)\s*\d*\s*:?\*\*\s*/i, '')
      .replace(/^(?:P|Pergunta|Frente|Front|Q|Question)\s*\d*\s*:\s*/i, '')
      .trim();
  } else {
    cleaned = cleaned
      .replace(/^\*\*(?:R|Resposta|Verso|Back|A|Answer)\s*\d*\s*:?\*\*\s*/i, '')
      .replace(/^(?:R|Resposta|Verso|Back|A|Answer)\s*\d*\s*:\s*/i, '')
      .trim();
  }
  return cleaned.replace(/^\*\*(.+)\*\*$/s, '$1').trim();
};

// Divide um segmento fundido "Topico + PróximaPergunta" (quando o texto colado perdeu as quebras de linha)
const splitFusedSegment = (fused: string, referencePrefix?: string): [string, string] | null => {
  const trimmed = (fused || '').trim();
  if (!trimmed) return null;

  // 1. Se conhecemos o Tópico/Disciplina final (ex: "Poderes Administrativos") e o segmento começa com ele
  if (referencePrefix) {
    const ref = referencePrefix.trim();
    if (ref.length >= 2 && trimmed.length > ref.length && trimmed.toLowerCase().startsWith(ref.toLowerCase())) {
      const firstPart = trimmed.slice(0, ref.length).trim();
      const secondPart = trimmed.slice(ref.length).replace(/^[\s\-–—•*]+/, '').trim();
      if (firstPart && secondPart) {
        return [firstPart, secondPart];
      }
    }
  }

  // 2. Fronteira colada (camelCase / pontuação colada): letra minúscula, número ou parêntese seguido imediatamente de Maiúscula ou número de questão
  // Ex: "Poderes AdministrativosQual a diferença..." ou "(art. 13).Qual o..."
  const jammedRegex = /([a-záéíóúâêôãõç0-9\)\]\.\!\?])(\d+[\.\)\-]\s*[A-ZÁÉÍÓÚÂÊÔÃÕÇ]|[A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõçA-Z])/g;
  let match: RegExpExecArray | null;
  let bestSplitIdx = -1;
  while ((match = jammedRegex.exec(trimmed)) !== null) {
    const candidateIdx = match.index + 1;
    const left = trimmed.slice(0, candidateIdx).trim();
    const right = trimmed.slice(candidateIdx).trim();
    // Evitar quebrar siglas como "Art. 5º" ou "Lei nº"
    if (left.length >= 3 && right.length >= 5) {
      bestSplitIdx = candidateIdx;
      break;
    }
  }
  if (bestSplitIdx > 0) {
    return [trimmed.slice(0, bestSplitIdx).trim(), trimmed.slice(bestSplitIdx).trim()];
  }

  // 3. Início de pergunta comum em português precedido por espaço ou pontuação
  const questionStartMatch = trimmed.match(
    /^(.{3,}?)(?:\s+|(?<=[.!?]))((?:\d+[\.\)\-]\s*)?(?:O que |Qual |Quais |Como |Quando |Onde |Por que |Quem |De acordo |Segundo |Conforme |A respeito |No que |Acerca |Diferencie |Explique |Conceitue |Defina |Cite |Em quais |Em que |Para que |A quem |Um |Uma |A |O |Os |As |Na |No |Nas |Nos |Sobre |Quanto )[\s\S]+\?)$/i
  );
  if (questionStartMatch) {
    return [questionStartMatch[1].trim(), questionStartMatch[2].trim()];
  }

  // 4. Fim de frase (. ! ?) seguido de espaço e letra maiúscula
  const sentenceMatch = trimmed.match(/^(.+?[.!?])\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇ][\s\S]+)$/);
  if (sentenceMatch) {
    return [sentenceMatch[1].trim(), sentenceMatch[2].trim()];
  }

  return null;
};

// Expande uma linha que possui múltiplos cartões concatenados com ";" ou "|" sem quebra de linha
const extractCardsFromMultiSegmentLine = (segments: string[]): ParsedImportCard[] | null => {
  const cleanSegs = segments.map(s => s.trim()).filter(Boolean);
  if (cleanSegs.length <= 4) return null;

  // Caso A: Padrão de 4 colunas concatenado sem quebras de linha:
  // Frente_1 ; Verso_1 ; Disc_1 ; Topico_1+Frente_2 ; Verso_2 ; Disc_2 ; ... ; Disc_N ; Topico_N
  // Quantidade de segmentos = 3 * N + 1 (ex: 15 cartões = 46 segmentos)
  if ((cleanSegs.length - 1) % 3 === 0 && cleanSegs.length >= 7) {
    const numCards = (cleanSegs.length - 1) / 3;
    const finalTopic = cleanSegs[cleanSegs.length - 1];
    const cards: ParsedImportCard[] = [];
    let currentFront = cleanSegs[0];
    let valid = true;

    for (let k = 0; k < numCards; k++) {
      const verso = cleanSegs[k * 3 + 1];
      const disc = cleanSegs[k * 3 + 2];
      const fusedOrLastTopic = cleanSegs[k * 3 + 3];

      if (k === numCards - 1) {
        const frontClean = cleanCardField(currentFront, true);
        const versoClean = cleanCardField(verso, false);
        if (frontClean && versoClean) {
          cards.push({
            frente: frontClean,
            verso: versoClean,
            disciplina: cleanCardField(disc) || undefined,
            topico: cleanCardField(fusedOrLastTopic) || undefined,
            deckName: cleanCardField(fusedOrLastTopic) || undefined,
          });
        }
      } else {
        const splitRes = splitFusedSegment(fusedOrLastTopic, finalTopic);
        if (!splitRes) {
          valid = false;
          break;
        }
        const [topicPart, nextFrontPart] = splitRes;
        const frontClean = cleanCardField(currentFront, true);
        const versoClean = cleanCardField(verso, false);
        if (frontClean && versoClean) {
          cards.push({
            frente: frontClean,
            verso: versoClean,
            disciplina: cleanCardField(disc) || undefined,
            topico: cleanCardField(topicPart) || undefined,
            deckName: cleanCardField(topicPart) || undefined,
          });
        }
        currentFront = nextFrontPart;
      }
    }

    if (valid && cards.length >= 2) {
      return cards;
    }
  }

  // Caso B: Múltiplos de 4 segmentos exatos (quando houve ";" também entre Topico_k e Frente_{k+1})
  if (cleanSegs.length % 4 === 0 && cleanSegs.length >= 8) {
    const cards: ParsedImportCard[] = [];
    for (let k = 0; k < cleanSegs.length; k += 4) {
      const f = cleanCardField(cleanSegs[k], true);
      const v = cleanCardField(cleanSegs[k + 1], false);
      const d = cleanCardField(cleanSegs[k + 2]);
      const t = cleanCardField(cleanSegs[k + 3]);
      if (f && v) {
        cards.push({
          frente: f,
          verso: v,
          disciplina: d || undefined,
          topico: t || undefined,
          deckName: t || undefined,
        });
      }
    }
    if (cards.length >= 2) return cards;
  }

  // Caso C: Padrão de 3 colunas concatenado sem quebras de linha (Frente ; Verso ; Disc+Frente2 ; ...)
  if ((cleanSegs.length - 1) % 2 === 0 && cleanSegs.length >= 5) {
    const numCards = (cleanSegs.length - 1) / 2;
    const finalDisc = cleanSegs[cleanSegs.length - 1];
    const cards: ParsedImportCard[] = [];
    let currentFront = cleanSegs[0];
    let valid = true;

    for (let k = 0; k < numCards; k++) {
      const verso = cleanSegs[k * 2 + 1];
      const fusedOrLastDisc = cleanSegs[k * 2 + 2];

      if (k === numCards - 1) {
        const f = cleanCardField(currentFront, true);
        const v = cleanCardField(verso, false);
        if (f && v) {
          cards.push({
            frente: f,
            verso: v,
            disciplina: cleanCardField(fusedOrLastDisc) || undefined,
          });
        }
      } else {
        const splitRes = splitFusedSegment(fusedOrLastDisc, finalDisc);
        if (!splitRes) {
          valid = false;
          break;
        }
        const [discPart, nextFrontPart] = splitRes;
        const f = cleanCardField(currentFront, true);
        const v = cleanCardField(verso, false);
        if (f && v) {
          cards.push({
            frente: f,
            verso: v,
            disciplina: cleanCardField(discPart) || undefined,
          });
        }
        currentFront = nextFrontPart;
      }
    }

    if (valid && cards.length >= 2) {
      return cards;
    }
  }

  // Caso D: Padrão de 2 colunas concatenado sem quebras de linha (Frente1 ; Verso1+Frente2 ; Verso2)
  if (cleanSegs.length >= 3) {
    const cards: ParsedImportCard[] = [];
    let currentFront = cleanSegs[0];
    let valid = true;

    for (let k = 1; k < cleanSegs.length; k++) {
      if (k === cleanSegs.length - 1) {
        const f = cleanCardField(currentFront, true);
        const v = cleanCardField(cleanSegs[k], false);
        if (f && v) {
          cards.push({ frente: f, verso: v });
        }
      } else {
        const splitRes = splitFusedSegment(cleanSegs[k]);
        if (!splitRes) {
          valid = false;
          break;
        }
        const [versoPart, nextFrontPart] = splitRes;
        const f = cleanCardField(currentFront, true);
        const v = cleanCardField(versoPart, false);
        if (f && v) {
          cards.push({ frente: f, verso: v });
        }
        currentFront = nextFrontPart;
      }
    }

    if (valid && cards.length >= 2) {
      return cards;
    }
  }

  return null;
};

// Parser universal de texto / IA / CSV / TSV / Tabelas Markdown / Q&A
const parseCardsFromText = (rawText: string): ParsedImportCard[] => {
  if (!rawText || !rawText.trim()) return [];

  // Remover cercas de código markdown (```json, ```csv, ```txt, ```)
  let text = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/^```(?:json|csv|tsv|txt|markdown|md|plaintext)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();

  // 1. Tentar interpretar como JSON caso o usuário cole um JSON na caixa de texto
  if (text.startsWith('[') || text.startsWith('{')) {
    try {
      const parsedJson = JSON.parse(text);
      const arr = Array.isArray(parsedJson)
        ? parsedJson
        : Array.isArray(parsedJson.cards)
        ? parsedJson.cards
        : Array.isArray(parsedJson.flashcards)
        ? parsedJson.flashcards
        : [];
      if (arr.length > 0) {
        return arr
          .map((item: any) => ({
            frente: String(item.frente || item.front || item.pergunta || item.question || '').trim(),
            verso: String(item.verso || item.back || item.resposta || item.answer || '').trim(),
            disciplina: item.disciplina || item.subject || item.materia || undefined,
            topico: item.topico || item.topic || item.assunto || item.deckName || undefined,
            deckName: item.deckName || item.baralho || item.topico || item.topic || undefined,
            dificuldade: item.dificuldade || undefined,
            intervaloDias: item.intervaloDias ? Number(item.intervaloDias) : undefined,
            proximaRevisao: item.proximaRevisao || undefined,
            revisoesTotal: item.revisoesTotal ? Number(item.revisoesTotal) : undefined,
          }))
          .filter((c: ParsedImportCard) => c.frente && c.verso);
      }
    } catch {
      // Continua para o parser de texto estruturado
    }
  }

  // 2. Pré-processar marcadores Q&A que tenham sido colados na mesma linha
  // Ex: "Pergunta: X? Resposta: Y. Pergunta: Z? Resposta: W."
  text = text
    .replace(
      /([^\n])\s+(?=(?:\*\*)?(?:(?:Card|Flashcard|Cart[aã]o)\s*#?\d+\s*[:\-]?\s*)?(?:\*\*)?(?:P|Pergunta|Frente|Front|Q|Question)\s*\d*\s*(?:\*\*)?\s*:)/gi,
      '$1\n'
    )
    .replace(
      /([^\n\/\|;])\s+(?=(?:\*\*)?(?:R|Resposta|Verso|Back|A|Answer)\s*\d*\s*(?:\*\*)?\s*:)/gi,
      '$1\n'
    );

  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('#')); // Ignora comentários de cabeçalho do Anki (#separator, #html, etc.)

  const results: ParsedImportCard[] = [];

  // Estado para blocos multi-linhas (Frente/Verso, Pergunta/Resposta, Disciplina/Tópico)
  let pendingQuestion: string | null = null;
  let pendingDisciplina: string | undefined = undefined;
  let pendingTopico: string | undefined = undefined;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Ignorar linhas divisórias de tabelas Markdown (ex: |---|---|---| ou ---)
    if (/^[\|\s\-:]+$/.test(line)) {
      continue;
    }

    // Ignorar cabeçalhos de "Card 1", "Flashcard #2" isolados em uma linha
    if (/^(?:\*\*)?(?:card|flashcard|cart[aã]o)\s*#?\d+(?:\*\*)?\s*:?\s*$/i.test(line)) {
      continue;
    }

    // Remover barras laterais de tabelas Markdown (| Col1 | Col2 | -> Col1 | Col2)
    if (line.startsWith('|') && line.endsWith('|') && line.length > 2) {
      line = line.slice(1, -1).trim();
    }

    // Ignorar linha de cabeçalho CSV/Tabela padrão (Frente;Verso;Disciplina;Topico)
    if (
      /^(?:\*\*)?(?:frente|front|pergunta|question|q)(?:\*\*)?\s*[;|\t,]\s*(?:\*\*)?(?:verso|back|resposta|answer|a)(?:\*\*)?/i.test(
        line
      )
    ) {
      continue;
    }

    // 1. Formato inline P: [Pergunta] / R: [Resposta] na mesma linha (com ou sem negrito markdown)
    const inlinePRMatch = line.match(
      /^(?:[-•*]\s*|\d+[\.\)\-]\s*)?(?:\*\*)?(?:P|Pergunta|Frente|Front|Q|Question)\s*\d*\s*(?:\*\*)?\s*[:\-]\s*(.+?)\s*(?:\/|\||;|\s+-\s+)\s*(?:\*\*)?(?:R|Resposta|Verso|Back|A|Answer)\s*\d*\s*(?:\*\*)?\s*[:\-]\s*(.+)$/i
    );
    if (inlinePRMatch) {
      const f = cleanCardField(inlinePRMatch[1], true);
      const v = cleanCardField(inlinePRMatch[2], false);
      if (f && v) {
        results.push({ frente: f, verso: v });
      }
      pendingQuestion = null;
      continue;
    }

    // 2. Formato multi-linhas: Frente / Pergunta / Q:
    const qStartMatch = line.match(
      /^(?:[-•*]\s*|\d+[\.\)\-]\s*)?(?:(?:card|flashcard|cart[aã]o)\s*#?\d+\s*[:\-]\s*)?(?:\*\*)?(?:P|Pergunta|Frente|Front|Q|Question)\s*\d*\s*(?:\*\*)?\s*[:\-]\s*(.+)$/i
    );
    if (qStartMatch) {
      pendingQuestion = cleanCardField(qStartMatch[1], true);
      continue;
    }

    // Formato multi-linhas: Verso / Resposta / A:
    const aStartMatch = line.match(
      /^(?:[-•*]\s*)?(?:\*\*)?(?:R|Resposta|Verso|Back|A|Answer|Gabarito)\s*\d*\s*(?:\*\*)?\s*[:\-]\s*(.+)$/i
    );
    if (aStartMatch && pendingQuestion) {
      const v = cleanCardField(aStartMatch[1], false);
      if (pendingQuestion && v) {
        results.push({
          frente: pendingQuestion,
          verso: v,
          disciplina: pendingDisciplina,
          topico: pendingTopico,
          deckName: pendingTopico,
        });
      }
      pendingQuestion = null;
      continue;
    }

    // Metadados opcionais de Disciplina/Matéria ou Tópico/Assunto em blocos gerados por IA
    const discMetaMatch = line.match(
      /^(?:[-•*]\s*)?(?:\*\*)?(?:Disciplina|Mat[eé]ria|Subject)\s*(?:\*\*)?\s*:\s*(.+)$/i
    );
    if (discMetaMatch) {
      const dVal = cleanCardField(discMetaMatch[1]);
      if (!pendingQuestion && results.length > 0 && !results[results.length - 1].disciplina) {
        results[results.length - 1].disciplina = dVal;
      } else {
        pendingDisciplina = dVal;
      }
      continue;
    }

    const topicMetaMatch = line.match(
      /^(?:[-•*]\s*)?(?:\*\*)?(?:T[oó]pico|Assunto|Baralho|Deck|Tema|Topic)\s*(?:\*\*)?\s*:\s*(.+)$/i
    );
    if (topicMetaMatch) {
      const tVal = cleanCardField(topicMetaMatch[1]);
      if (!pendingQuestion && results.length > 0 && !results[results.length - 1].topico) {
        results[results.length - 1].topico = tVal;
        results[results.length - 1].deckName = tVal;
      } else {
        pendingTopico = tVal;
      }
      continue;
    }

    // 3. Separadores clássicos da IA (::, ->, =>, →)
    const arrowOrColonMatch = line.match(/^(.+?)\s*(?:::|->|=>|→)\s*(.+)$/);
    if (arrowOrColonMatch && !line.includes(';')) {
      const f = cleanCardField(arrowOrColonMatch[1], true);
      const v = cleanCardField(arrowOrColonMatch[2], false);
      if (f && v) {
        results.push({ frente: f, verso: v });
        pendingQuestion = null;
        continue;
      }
    }

    // 4. Separadores por coluna: Tab (\t), Ponto-e-vírgula (;), Pipe (|) ou Vírgula (,)
    let parts: string[] = [];
    if (line.includes('\t')) {
      parts = line.split('\t').map(p => p.trim());
    } else if (line.includes(';')) {
      parts = line.split(';').map(p => p.trim());
    } else if (line.includes('|')) {
      parts = line.split('|').map(p => p.trim());
    } else if (line.includes(',')) {
      const csvMatches = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
      if (csvMatches && csvMatches.length >= 2 && csvMatches.length <= 5) {
        parts = csvMatches.map(s => s.replace(/^"|"$/g, '').replace(/""/g, '"').trim());
      }
    }

    // Verificar se a linha contém múltiplos cartões concatenados (ex: 15 cartões colados em 1 linha sem \n)
    if (parts.length > 4) {
      const expandedCards = extractCardsFromMultiSegmentLine(parts);
      if (expandedCards && expandedCards.length > 0) {
        results.push(...expandedCards);
        pendingQuestion = null;
        continue;
      }
    }

    if (parts.length >= 2 && parts[0] && parts[1]) {
      const cleanFirst = cleanCardField(parts[0], true);
      const cleanSecond = cleanCardField(parts[1], false);
      const cleanThird = parts[2] ? cleanCardField(parts[2]) : undefined;
      const cleanFourth = parts[3] ? cleanCardField(parts[3]) : undefined;

      if (cleanFirst && cleanSecond) {
        results.push({
          frente: cleanFirst,
          verso: cleanSecond,
          disciplina: cleanThird || undefined,
          topico: cleanFourth || undefined,
          deckName: cleanFourth || undefined,
        });
        pendingQuestion = null;
        continue;
      }
    }

    // 5. Pergunta seguida de hífen/travessão na mesma linha: "1. O que é X? - É Y."
    const questionDashMatch = line.match(/^(.+\?)\s+[-–—]\s+(.+)$/);
    if (questionDashMatch) {
      const f = cleanCardField(questionDashMatch[1], true);
      const v = cleanCardField(questionDashMatch[2], false);
      if (f && v) {
        results.push({ frente: f, verso: v });
        pendingQuestion = null;
        continue;
      }
    }

    // 6. Pares de linhas Pergunta (terminando em ?) na linha atual e Resposta na linha seguinte
    if (pendingQuestion) {
      const v = cleanCardField(line, false);
      if (v) {
        results.push({
          frente: pendingQuestion,
          verso: v,
          disciplina: pendingDisciplina,
          topico: pendingTopico,
          deckName: pendingTopico,
        });
        pendingQuestion = null;
        continue;
      }
    } else if (line.endsWith('?') && line.length >= 8) {
      pendingQuestion = cleanCardField(line, true);
    }
  }

  return results;
};

export const Flashcards: React.FC<FlashcardsProps> = ({
  disciplinas = [],
  assuntos = [],
  concursos = [],
  activeConcursoId,
  onSelectConcurso,
  onSaveStudySession,
}) => {
  const { colorSkin, palette } = useTheme();
  const currentTheme = (
    colorSkin === 'purple' ? 'roxo' :
    colorSkin === 'orange' || colorSkin === 'dbz' ? 'laranja' :
    colorSkin || palette?.id || 'laranja'
  ).toLowerCase();

  const themeKey = (currentTheme || 'laranja').toLowerCase();

  const themeGlowStyles = useMemo(() => {
    switch (themeKey) {
      case 'roxo':
        return {
          color: '#8B5CF6',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(167, 139, 250, 0.95), 0 0 18px rgba(139, 92, 246, 0.85), 0 0 32px rgba(124, 58, 237, 0.65)',
        };
      case 'laranja':
        return {
          color: '#FF6B00',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(251, 146, 60, 0.95), 0 0 18px rgba(249, 115, 22, 0.85), 0 0 32px rgba(234, 88, 12, 0.65)',
        };
      case 'azul':
        return {
          color: '#3b82f6',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(96, 165, 250, 0.95), 0 0 18px rgba(37, 99, 235, 0.8), 0 0 32px rgba(29, 78, 216, 0.6)',
        };
      case 'rosa':
        return {
          color: '#ec4899',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(244, 114, 182, 0.95), 0 0 18px rgba(219, 39, 119, 0.8), 0 0 32px rgba(190, 24, 93, 0.6)',
        };
      case 'verde':
      default:
        return {
          color: '#10b981',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(52, 211, 153, 0.95), 0 0 18px rgba(16, 185, 129, 0.8), 0 0 32px rgba(5, 150, 105, 0.6)',
        };
    }
  }, [themeKey]);

  // Concursos disponíveis (não arquivados)
  const availableConcursos = useMemo(() => {
    const nonArchived = concursos.filter(c => !c.isArquivado && c.status !== 'arquivado');
    return nonArchived.length > 0 ? nonArchived : concursos;
  }, [concursos]);

  // Concurso atualmente selecionado na tela de Flashcards (sincronizado com o foco global)
  const [selectedConcursoId, setSelectedConcursoId] = useState<string>(() => {
    return activeConcursoId || availableConcursos.find(c => c.active || c.isAtivo)?.id || availableConcursos[0]?.id || '';
  });

  useEffect(() => {
    if (activeConcursoId && activeConcursoId !== selectedConcursoId) {
      setSelectedConcursoId(activeConcursoId);
      setSelectedDeckId(null);
      setFilterDisciplina('todas');
    } else if (!selectedConcursoId && availableConcursos.length > 0) {
      const fallback = availableConcursos.find(c => c.active || c.isAtivo)?.id || availableConcursos[0].id;
      setSelectedConcursoId(fallback);
    }
  }, [activeConcursoId, availableConcursos]);

  const currentConcurso = useMemo(() => {
    return availableConcursos.find(c => c.id === selectedConcursoId) || availableConcursos[0];
  }, [availableConcursos, selectedConcursoId]);

  const currentConcursoId = currentConcurso?.id || selectedConcursoId || activeConcursoId || '';
  const currentConcursoName = getConcursoDisplayName(currentConcurso);

  const [decks, setDecks] = useState<Deck[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [filterDisciplina, setFilterDisciplina] = useState<string>('todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deckToDelete, setDeckToDelete] = useState<Deck | null>(null);
  const [cardToDelete, setCardToDelete] = useState<Flashcard | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Estados de Exportação
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'anki_csv' | 'anki_txt' | 'json'>('anki_csv');
  const [exportScope, setExportScope] = useState<'all' | 'disciplina' | 'deck'>('all');
  const [exportTargetDisciplina, setExportTargetDisciplina] = useState<string>('');
  const [exportTargetDeckId, setExportTargetDeckId] = useState<string>('');

  // Estados de Importação
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importTab, setImportTab] = useState<'file' | 'text'>('file');
  const [importConcursoId, setImportConcursoId] = useState<string>('');
  const [importDisciplina, setImportDisciplina] = useState<string>('');
  const [importCustomDisciplina, setImportCustomDisciplina] = useState<string>('');
  const [importDeckMode, setImportDeckMode] = useState<'existente' | 'novo'>('novo');
  const [importDeckId, setImportDeckId] = useState<string>('');
  const [importNewDeckName, setImportNewDeckName] = useState<string>('');
  const [importRawText, setImportRawText] = useState<string>('');
  const [importFileName, setImportFileName] = useState<string>('');
  const [importFileCards, setImportFileCards] = useState<ParsedImportCard[]>([]);
  const [isParsingFile, setIsParsingFile] = useState<boolean>(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [promptCopied, setPromptCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Modo de Revisão / Prática Interativa
  const [isReviewSessionActive, setIsReviewSessionActive] = useState(false);
  const [reviewDeckId, setReviewDeckId] = useState<string | null>(null);
  const [cardRevealedIds, setCardRevealedIds] = useState<Record<string, boolean>>({});

  // Formulário do Modal de Criação / Edição
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [formDisciplina, setFormDisciplina] = useState('');
  const [formDeckMode, setFormDeckMode] = useState<'existente' | 'novo'>('existente');
  const [formDeckId, setFormDeckId] = useState('');
  const [formNewDeckName, setFormNewDeckName] = useState('');
  const [formTopico, setFormTopico] = useState('');
  const [formFrente, setFormFrente] = useState('');
  const [formVerso, setFormVerso] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Persistência com sincronização em nuvem e cache local
  const saveDecksToStorage = (updatedDecks: Deck[]) => {
    setDecks(updatedDecks);
    DatabaseService.saveDecks(updatedDecks);
  };

  const saveCardsToStorage = (updatedCards: Flashcard[]) => {
    setFlashcards(updatedCards);
    DatabaseService.saveFlashcards(updatedCards);
  };

  // 1. Carregamento com sincronização no DatabaseService
  useEffect(() => {
    let isMounted = true;
    Promise.all([
      DatabaseService.getDecks(),
      DatabaseService.getFlashcards(),
    ]).then(([loadedDecks, loadedCards]) => {
      if (!isMounted) return;
      setDecks(loadedDecks);
      setFlashcards(loadedCards);
    });
    return () => { isMounted = false; };
  }, []);

  // Migração segura de baralhos e cartões antigos sem concurso_id definido
  useEffect(() => {
    if (decks.length === 0 && flashcards.length === 0) return;
    if (disciplinas.length === 0 && availableConcursos.length === 0) return;

    let decksChanged = false;
    const deckConcursoMap = new Map<string, string>();

    const migratedDecks = decks.map(d => {
      const existingCid = d.concursoId || d.concurso_id;
      if (existingCid) {
        deckConcursoMap.set(d.id, existingCid);
        if (d.concursoId !== existingCid || d.concurso_id !== existingCid) {
          decksChanged = true;
          return { ...d, concursoId: existingCid, concurso_id: existingCid };
        }
        return d;
      }

      const resolvedCid = resolveLegacyConcursoId(
        d.disciplina,
        d.nome,
        disciplinas,
        assuntos,
        availableConcursos,
        currentConcursoId
      );
      deckConcursoMap.set(d.id, resolvedCid);
      decksChanged = true;
      return {
        ...d,
        concursoId: resolvedCid,
        concurso_id: resolvedCid,
      };
    });

    let cardsChanged = false;
    const migratedCards = flashcards.map(c => {
      const existingCid = c.concursoId || c.concurso_id;
      if (existingCid) {
        if (c.concursoId !== existingCid || c.concurso_id !== existingCid) {
          cardsChanged = true;
          return { ...c, concursoId: existingCid, concurso_id: existingCid };
        }
        return c;
      }

      const parentDeckCid = deckConcursoMap.get(c.deckId);
      const resolvedCid = parentDeckCid || resolveLegacyConcursoId(
        c.disciplina,
        c.topico || '',
        disciplinas,
        assuntos,
        availableConcursos,
        currentConcursoId
      );
      cardsChanged = true;
      return {
        ...c,
        concursoId: resolvedCid,
        concurso_id: resolvedCid,
      };
    });

    if (decksChanged) {
      saveDecksToStorage(migratedDecks);
    }
    if (cardsChanged) {
      saveCardsToStorage(migratedCards);
    }
  }, [decks, flashcards, disciplinas, assuntos, availableConcursos, currentConcursoId]);

  // Timer para sumir toast de sucesso
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => {
        setSuccessToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  // Alternar concurso pelo Seletor Rápido
  const handleQuickSwitchConcurso = (newConcursoId: string) => {
    if (!newConcursoId || newConcursoId === selectedConcursoId) return;
    setSelectedConcursoId(newConcursoId);
    setSelectedDeckId(null);
    setFilterDisciplina('todas');
    setSearchQuery('');
    if (onSelectConcurso) {
      onSelectConcurso(newConcursoId);
    }
  };

  // Baralhos e cartões estritamente vinculados ao concurso selecionado no momento
  const concursoDecks = useMemo(() => {
    if (!currentConcursoId) return decks;
    return decks.filter(d => {
      const cid = d.concursoId || d.concurso_id;
      return cid === currentConcursoId;
    });
  }, [decks, currentConcursoId]);

  const concursoDeckIds = useMemo(() => {
    return new Set(concursoDecks.map(d => d.id));
  }, [concursoDecks]);

  const concursoFlashcards = useMemo(() => {
    if (!currentConcursoId) return flashcards;
    return flashcards.filter(c => {
      const cid = c.concursoId || c.concurso_id;
      if (cid) return cid === currentConcursoId;
      return concursoDeckIds.has(c.deckId);
    });
  }, [flashcards, currentConcursoId, concursoDeckIds]);

  // Disciplinas exclusivas do concurso selecionado atual
  const activeDisciplinas = useMemo(() => {
    if (!currentConcursoId) return disciplinas;
    return disciplinas.filter(d => d.concursoId === currentConcursoId);
  }, [disciplinas, currentConcursoId]);

  // Nomes de disciplinas exclusivamente do concurso selecionado (do edital + baralhos do próprio concurso)
  const availableDisciplinasList = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    activeDisciplinas.forEach(d => {
      const trimmed = d.name?.trim();
      if (trimmed && !seen.has(trimmed.toLowerCase())) {
        seen.add(trimmed.toLowerCase());
        list.push(trimmed);
      }
    });
    concursoDecks.forEach(d => {
      const trimmed = d.disciplina?.trim();
      if (trimmed && !seen.has(trimmed.toLowerCase())) {
        seen.add(trimmed.toLowerCase());
        list.push(trimmed);
      }
    });
    return list;
  }, [activeDisciplinas, concursoDecks]);

  useEffect(() => {
    if (
      filterDisciplina !== 'todas' &&
      !availableDisciplinasList.some(d => d.toLowerCase() === filterDisciplina.toLowerCase())
    ) {
      setFilterDisciplina('todas');
    }
  }, [currentConcursoId, availableDisciplinasList, filterDisciplina]);

  // Tópicos sugeridos baseados na disciplina selecionada no formulário
  const suggestedTopics = useMemo(() => {
    if (!formDisciplina) return [];
    const discObj = activeDisciplinas.find(
      d => d.name.toLowerCase() === formDisciplina.toLowerCase()
    );
    if (!discObj) return [];
    return assuntos
      .filter(a => a.disciplinaId === discObj.id)
      .map(a => a.name);
  }, [activeDisciplinas, assuntos, formDisciplina]);

  // Métricas do Hub (estritamente do concurso atual)
  const totalCards = concursoFlashcards.length;
  const totalDecks = concursoDecks.length;
  const pendentesHoje = useMemo(() => {
    return concursoDecks.reduce((acc, d) => acc + (d.pendentesHoje || 0), 0);
  }, [concursoDecks]);

  // Taxa de precisão / retenção calculada para o concurso atual
  const precisaoCalculada = useMemo(() => {
    if (concursoFlashcards.length === 0) return 0;
    const cardsComRevisao = concursoFlashcards.filter(c => (c.revisoesTotal || 0) > 0);
    if (cardsComRevisao.length === 0) return 90;
    const cardsDominados = cardsComRevisao.filter(
      c => c.dificuldade === 'facil' || c.dificuldade === 'bom'
    );
    return Math.round((cardsDominados.length / cardsComRevisao.length) * 100);
  }, [concursoFlashcards]);

  // Baralhos filtrados por busca (incluindo conteúdo dos cartões) e disciplina do concurso atual
  const filteredDecks = useMemo(() => {
    let result = concursoDecks;
    if (filterDisciplina !== 'todas') {
      result = result.filter(d => d.disciplina.toLowerCase() === filterDisciplina.toLowerCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchingDeckIdsFromCards = new Set(
        concursoFlashcards
          .filter(
            c =>
              stripHtmlToPlainText(c.frente).toLowerCase().includes(q) ||
              stripHtmlToPlainText(c.verso).toLowerCase().includes(q) ||
              (c.topico && c.topico.toLowerCase().includes(q))
          )
          .map(c => c.deckId)
      );
      result = result.filter(
        d =>
          d.nome.toLowerCase().includes(q) ||
          d.disciplina.toLowerCase().includes(q) ||
          matchingDeckIdsFromCards.has(d.id)
      );
    }
    return result;
  }, [concursoDecks, concursoFlashcards, filterDisciplina, searchQuery]);

  // Agrupamento dos baralhos por Disciplina
  const decksGroupedByDisciplina = useMemo(() => {
    const groups: Record<string, Deck[]> = {};
    filteredDecks.forEach(deck => {
      const disc = deck.disciplina || 'Outros';
      if (!groups[disc]) {
        groups[disc] = [];
      }
      groups[disc].push(deck);
    });
    return groups;
  }, [filteredDecks]);

  // Baralho ativo selecionado para visualização detalhada
  const activeDeck = useMemo(() => {
    return concursoDecks.find(d => d.id === selectedDeckId);
  }, [concursoDecks, selectedDeckId]);

  const activeCards = useMemo(() => {
    if (!selectedDeckId) return [];
    return concursoFlashcards.filter(c => c.deckId === selectedDeckId);
  }, [concursoFlashcards, selectedDeckId]);

  // Cards para sessão de revisão interativa (restritos ao concurso atual)
  const cardsParaRevisar = useMemo(() => {
    if (!reviewDeckId) {
      return concursoFlashcards.filter(c => (c.intervaloDias || 1) <= 2 || c.dificuldade !== 'facil');
    }
    return concursoFlashcards.filter(c => c.deckId === reviewDeckId);
  }, [concursoFlashcards, reviewDeckId]);

  // Abertura do modal de criação (com pré-seleção inteligente dentro do concurso atual)
  const handleOpenCreateModal = (preselectedDeck?: Deck, preselectedDisciplina?: string) => {
    setEditingCardId(null);
    setFormErrors({});
    if (preselectedDeck) {
      setFormDisciplina(preselectedDeck.disciplina);
      setFormDeckId(preselectedDeck.id);
      setFormDeckMode('existente');
      setFormNewDeckName('');
    } else if (preselectedDisciplina) {
      setFormDisciplina(preselectedDisciplina);
      const firstDeckOfDisc = concursoDecks.find(d => d.disciplina.toLowerCase() === preselectedDisciplina.toLowerCase());
      if (firstDeckOfDisc) {
        setFormDeckId(firstDeckOfDisc.id);
        setFormDeckMode('existente');
      } else {
        setFormDeckMode('novo');
        setFormDeckId('');
      }
      setFormNewDeckName('');
    } else {
      const defaultDisc = availableDisciplinasList[0] || 'Geral';
      setFormDisciplina(defaultDisc);
      const defaultDeck = concursoDecks.find(d => d.disciplina === defaultDisc) || concursoDecks[0];
      if (defaultDeck) {
        setFormDeckId(defaultDeck.id);
        setFormDeckMode('existente');
      } else {
        setFormDeckMode('novo');
        setFormDeckId('');
      }
      setFormNewDeckName('');
    }

    setFormTopico('');
    setFormFrente('');
    setFormVerso('');
    setIsCreateModalOpen(true);
  };

  // Abertura do modal em modo de edição para um flashcard existente
  const handleOpenEditCardModal = (card: Flashcard) => {
    setEditingCardId(card.id);
    setFormErrors({});
    setFormDisciplina(card.disciplina);
    setFormDeckMode('existente');
    setFormDeckId(card.deckId);
    setFormNewDeckName('');
    setFormTopico(card.topico || '');
    setFormFrente(card.frente);
    setFormVerso(card.verso);
    setIsCreateModalOpen(true);
  };

  // Salvar novo flashcard (ou atualizar existente) com validação e vínculo estrito ao concurso_id atual
  const handleSaveFlashcard = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    const plainFrente = stripHtmlToPlainText(formFrente).trim();
    const plainVerso = stripHtmlToPlainText(formVerso).trim();

    if (!formDisciplina.trim()) {
      errors.disciplina = 'Selecione ou informe a disciplina.';
    }
    if (formDeckMode === 'novo' && !formNewDeckName.trim()) {
      errors.deck = 'Informe o nome do novo baralho.';
    }
    if (formDeckMode === 'existente' && !formDeckId) {
      errors.deck = 'Selecione um baralho existente.';
    }
    if (!plainFrente) {
      errors.frente = 'A pergunta/frente do cartão é obrigatória.';
    }
    if (!plainVerso) {
      errors.verso = 'A resposta/verso do cartão é obrigatória.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    let targetDeckId = formDeckId;
    let targetDeckName = '';
    const targetConcursoId = currentConcursoId || 'default';
    const sanitizedFrente = sanitizeFlashcardHtml(formFrente);
    const sanitizedVerso = sanitizeFlashcardHtml(formVerso);

    if (editingCardId) {
      // Modo Edição de Flashcard existente
      if (formDeckMode === 'novo') {
        targetDeckId = `deck-${Date.now()}`;
        targetDeckName = formNewDeckName.trim();
        const newDeck: Deck = {
          id: targetDeckId,
          concursoId: targetConcursoId,
          concurso_id: targetConcursoId,
          nome: targetDeckName,
          disciplina: formDisciplina.trim(),
          totalCards: 1,
          pendentesHoje: 1,
        };
        saveDecksToStorage([newDeck, ...decks]);
      } else {
        const curDeck = decks.find(d => d.id === targetDeckId);
        targetDeckName = curDeck ? curDeck.nome : 'Baralho';
      }

      const updatedCards = flashcards.map(c => {
        if (c.id === editingCardId) {
          return {
            ...c,
            deckId: targetDeckId,
            concursoId: c.concursoId || c.concurso_id || targetConcursoId,
            concurso_id: c.concurso_id || c.concursoId || targetConcursoId,
            disciplina: formDisciplina.trim(),
            topico: formTopico.trim() || undefined,
            frente: sanitizedFrente,
            verso: sanitizedVerso,
          };
        }
        return c;
      });

      saveCardsToStorage(updatedCards);
      setEditingCardId(null);
      setFormFrente('');
      setFormVerso('');
      setFormTopico('');
      setFormErrors({});
      setIsCreateModalOpen(false);
      setSuccessToast('Flashcard atualizado com sucesso! ✨');
      return;
    }

    // Se for criar novo baralho
    if (formDeckMode === 'novo') {
      targetDeckId = `deck-${Date.now()}`;
      targetDeckName = formNewDeckName.trim();
      const newDeck: Deck = {
        id: targetDeckId,
        concursoId: targetConcursoId,
        concurso_id: targetConcursoId,
        nome: targetDeckName,
        disciplina: formDisciplina.trim(),
        totalCards: 1,
        pendentesHoje: 1,
      };
      const updatedDecks = [newDeck, ...decks];
      saveDecksToStorage(updatedDecks);
    } else {
      // Atualizar estatísticas do baralho existente
      const curDeck = decks.find(d => d.id === targetDeckId);
      targetDeckName = curDeck ? curDeck.nome : 'Baralho';
      const updatedDecks = decks.map(d => {
        if (d.id === targetDeckId) {
          return {
            ...d,
            concursoId: d.concursoId || d.concurso_id || targetConcursoId,
            concurso_id: d.concurso_id || d.concursoId || targetConcursoId,
            totalCards: (d.totalCards || 0) + 1,
            pendentesHoje: (d.pendentesHoje || 0) + 1,
          };
        }
        return d;
      });
      saveDecksToStorage(updatedDecks);
    }

    // Criar o cartão vinculado ao concurso_id atual
    const newFlashcard: Flashcard = {
      id: `card-${Date.now()}`,
      deckId: targetDeckId,
      concursoId: targetConcursoId,
      concurso_id: targetConcursoId,
      disciplina: formDisciplina.trim(),
      topico: formTopico.trim() || undefined,
      frente: sanitizedFrente,
      verso: sanitizedVerso,
      dificuldade: 'bom',
      intervaloDias: 1,
      proximaRevisao: new Date().toISOString(),
      criadoEm: new Date().toISOString(),
      revisoesTotal: 0,
    };

    saveCardsToStorage([newFlashcard, ...flashcards]);

    // Limpar campos
    setFormFrente('');
    setFormVerso('');
    setFormTopico('');
    setFormErrors({});
    setIsCreateModalOpen(false);

    // Feedback de sucesso
    setSuccessToast(`Flashcard adicionado com sucesso ao baralho "${targetDeckName}"! 🎉`);
  };

  // --- EXPORTAÇÃO DE FLASHCARDS ---
  const handleOpenExportModal = (options?: { scope?: 'all' | 'disciplina' | 'deck'; disciplina?: string; deckId?: string }) => {
    const scope = options?.scope || (selectedDeckId ? 'deck' : 'all');
    setExportScope(scope);
    setExportTargetDisciplina(options?.disciplina || availableDisciplinasList[0] || '');
    setExportTargetDeckId(options?.deckId || selectedDeckId || concursoDecks[0]?.id || '');
    setExportFormat('anki_csv');
    setIsExportModalOpen(true);
  };

  const cardsToExport = useMemo(() => {
    if (exportScope === 'deck' && exportTargetDeckId) {
      return concursoFlashcards.filter(c => c.deckId === exportTargetDeckId);
    }
    if (exportScope === 'disciplina' && exportTargetDisciplina) {
      return concursoFlashcards.filter(c => c.disciplina.toLowerCase() === exportTargetDisciplina.toLowerCase());
    }
    return concursoFlashcards;
  }, [concursoFlashcards, exportScope, exportTargetDeckId, exportTargetDisciplina]);

  const handleConfirmExport = () => {
    if (cardsToExport.length === 0) return;

    const dateStr = new Date().toISOString().split('T')[0];
    const concursoSlug = slugifyConcursoName(currentConcursoName);
    const deckMap = new Map<string, Deck>(concursoDecks.map(d => [d.id, d]));

    let content = '';
    let mimeType = 'text/plain;charset=utf-8';
    let extension = 'csv';

    if (exportFormat === 'json') {
      const exportedDeckIds = new Set(cardsToExport.map(c => c.deckId));
      const exportedDecks = concursoDecks.filter(d => exportedDeckIds.has(d.id));
      const payload = {
        app: 'Gabarita',
        version: '1.0',
        exportedAt: new Date().toISOString(),
        concurso_id: currentConcursoId,
        concursoNome: currentConcursoName,
        totalCards: cardsToExport.length,
        decks: exportedDecks,
        cards: cardsToExport.map(c => ({
          ...c,
          concurso_id: c.concurso_id || c.concursoId || currentConcursoId,
          deckName: deckMap.get(c.deckId)?.nome || c.topico || 'Geral',
        })),
      };
      content = JSON.stringify(payload, null, 2);
      mimeType = 'application/json;charset=utf-8';
      extension = 'json';
    } else {
      // Formato compatível com Anki (.csv ou .txt separado por ponto-e-vírgula)
      const header = 'Frente;Verso;Disciplina;Topico';
      const rows = cardsToExport.map(c => {
        const cleanFrente = stripHtmlToPlainText(c.frente || '').replace(/;/g, ',').replace(/\r?\n/g, ' ');
        const cleanVerso = stripHtmlToPlainText(c.verso || '').replace(/;/g, ',').replace(/\r?\n/g, ' ');
        const cleanDisc = (c.disciplina || '').replace(/;/g, ',').replace(/\r?\n/g, ' ');
        const topicOrDeck = c.topico || deckMap.get(c.deckId)?.nome || 'Geral';
        const cleanTopico = topicOrDeck.replace(/;/g, ',').replace(/\r?\n/g, ' ');
        return `${cleanFrente};${cleanVerso};${cleanDisc};${cleanTopico}`;
      });
      content = [header, ...rows].join('\n');
      mimeType = exportFormat === 'anki_csv' ? 'text/csv;charset=utf-8' : 'text/plain;charset=utf-8';
      extension = exportFormat === 'anki_csv' ? 'csv' : 'txt';
    }

    const blob = new Blob(['\uFEFF' + content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `flashcards_${concursoSlug}_${dateStr}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setIsExportModalOpen(false);
    setSuccessToast(`${cardsToExport.length} flashcards exportados com sucesso!`);
  };

  // --- IMPORTAÇÃO DE FLASHCARDS (ANKI / CSV / TXT / JSON / IA) ---
  const importTargetDisciplinas = useMemo(() => {
    const targetCid = importConcursoId || currentConcursoId;
    const discFromEdital = disciplinas
      .filter(d => !targetCid || d.concursoId === targetCid)
      .map(d => d.name.trim())
      .filter(Boolean);
    const discFromDecks = decks
      .filter(d => (d.concursoId || d.concurso_id) === targetCid)
      .map(d => d.disciplina.trim())
      .filter(Boolean);
    const unique: string[] = [];
    const seen = new Set<string>();
    [...discFromEdital, ...discFromDecks].forEach(name => {
      if (!seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        unique.push(name);
      }
    });
    return unique;
  }, [disciplinas, decks, importConcursoId, currentConcursoId]);

  const importTargetDecks = useMemo(() => {
    const targetCid = importConcursoId || currentConcursoId;
    const effectiveDisc = importDisciplina === '__nova__' ? importCustomDisciplina.trim() : importDisciplina;
    return decks.filter(
      d =>
        (d.concursoId || d.concurso_id) === targetCid &&
        (!effectiveDisc || d.disciplina.toLowerCase() === effectiveDisc.toLowerCase())
    );
  }, [decks, importConcursoId, currentConcursoId, importDisciplina, importCustomDisciplina]);

  const handleOpenImportModal = (initialTab: 'file' | 'text' = 'file') => {
    const targetCid = currentConcursoId || availableConcursos[0]?.id || '';
    setImportConcursoId(targetCid);
    const defaultDisc = availableDisciplinasList[0] || '';
    setImportDisciplina(defaultDisc || '__nova__');
    setImportCustomDisciplina('');
    const existingDecksForDisc = concursoDecks.filter(
      d => defaultDisc && d.disciplina.toLowerCase() === defaultDisc.toLowerCase()
    );
    if (existingDecksForDisc.length > 0) {
      setImportDeckMode('existente');
      setImportDeckId(existingDecksForDisc[0].id);
      setImportNewDeckName('');
    } else {
      setImportDeckMode('novo');
      setImportDeckId('');
      setImportNewDeckName(defaultDisc ? `Baralho - ${defaultDisc}` : 'Baralho Importado');
    }
    setImportTab(initialTab);
    setImportRawText('');
    setImportFileName('');
    setImportFileCards([]);
    setImportError(null);
    setPromptCopied(false);
    setIsImportModalOpen(true);
  };

  // Atualizar disciplina padrão ao trocar o concurso no modal de importação
  const handleChangeImportConcurso = (newCid: string) => {
    setImportConcursoId(newCid);
    const discs = disciplinas.filter(d => d.concursoId === newCid).map(d => d.name.trim()).filter(Boolean);
    const firstDisc = discs[0] || '';
    setImportDisciplina(firstDisc || '__nova__');
    const matchingDecks = decks.filter(
      d => (d.concursoId || d.concurso_id) === newCid && firstDisc && d.disciplina.toLowerCase() === firstDisc.toLowerCase()
    );
    if (matchingDecks.length > 0) {
      setImportDeckMode('existente');
      setImportDeckId(matchingDecks[0].id);
      setImportNewDeckName('');
    } else {
      setImportDeckMode('novo');
      setImportDeckId('');
      setImportNewDeckName(firstDisc ? `Baralho - ${firstDisc}` : 'Baralho Importado');
    }
  };

  // Processar arquivo selecionado no upload (.apkg, .txt, .csv, .json)
  const handleFileUpload = async (file: File) => {
    setImportError(null);
    setImportFileName(file.name);
    const lowerName = file.name.toLowerCase();

    if (lowerName.endsWith('.apkg')) {
      setIsParsingFile(true);
      setImportFileCards([]);
      try {
        const result = await parseApkgFile(file);
        setImportFileCards(result.cards);

        // Pré-selecionar disciplina e baralho sugeridos pelo arquivo .apkg
        if (result.suggestedDisciplina) {
          const sugNorm = result.suggestedDisciplina.toLowerCase();
          const matchedDisc = importTargetDisciplinas.find(
            d => d.toLowerCase() === sugNorm || d.toLowerCase().includes(sugNorm) || sugNorm.includes(d.toLowerCase())
          );
          if (matchedDisc) {
            setImportDisciplina(matchedDisc);
          } else {
            setImportDisciplina('__nova__');
            setImportCustomDisciplina(result.suggestedDisciplina);
          }
        }
        if (result.suggestedDeckName) {
          setImportDeckMode('novo');
          setImportNewDeckName(result.suggestedDeckName);
        }
      } catch (err: any) {
        setImportError(err?.message || 'Erro ao processar o arquivo .apkg do Anki.');
        setImportFileCards([]);
      } finally {
        setIsParsingFile(false);
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = String(event.target?.result || '');
      if (lowerName.endsWith('.json')) {
        try {
          const parsed = JSON.parse(content);
          const arr = Array.isArray(parsed)
            ? parsed
            : Array.isArray(parsed.cards)
            ? parsed.cards
            : Array.isArray(parsed.flashcards)
            ? parsed.flashcards
            : [];
          const mapped: ParsedImportCard[] = arr
            .map((item: any) => ({
              frente: String(item.frente || item.front || item.pergunta || item.question || '').trim(),
              verso: String(item.verso || item.back || item.resposta || item.answer || '').trim(),
              disciplina: item.disciplina || item.subject || undefined,
              topico: item.topico || item.topic || item.deckName || undefined,
              deckName: item.deckName || item.baralho || item.topico || undefined,
              dificuldade: item.dificuldade || undefined,
              intervaloDias: item.intervaloDias ? Number(item.intervaloDias) : undefined,
              proximaRevisao: item.proximaRevisao || undefined,
              revisoesTotal: item.revisoesTotal ? Number(item.revisoesTotal) : undefined,
            }))
            .filter((c: ParsedImportCard) => c.frente && c.verso);

          setImportFileCards(mapped);
          if (mapped.length === 0) {
            setImportError('Nenhum cartão válido encontrado no arquivo JSON.');
          }
        } catch {
          setImportError('Erro ao ler o arquivo JSON. Verifique se o formato é válido.');
          setImportFileCards([]);
        }
      } else {
        const parsed = parseCardsFromText(content);
        setImportFileCards(parsed);
        if (parsed.length === 0) {
          setImportError('Nenhum cartão identificado no arquivo. Use o formato .apkg, Frente;Verso ou Frente|Verso.');
        }
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  // Cartões identificados para pré-visualização (Preview)
  const previewImportCards = useMemo(() => {
    if (importTab === 'file') {
      return importFileCards;
    }
    return parseCardsFromText(importRawText);
  }, [importTab, importFileCards, importRawText]);

  // Copiar Prompt Modelo para IA
  const handleCopyAiPrompt = () => {
    const targetConcursoObj = availableConcursos.find(c => c.id === importConcursoId) || currentConcurso;
    const concursoLabel = getConcursoDisplayName(targetConcursoObj);
    const effectiveDisc = (importDisciplina === '__nova__' ? importCustomDisciplina.trim() : importDisciplina) || 'a disciplina solicitada';
    const effectiveTopic = importNewDeckName.trim() || 'os principais tópicos do edital';

    const promptText = `Atue como um especialista em preparação para concursos públicos. Crie 15 flashcards de alto rendimento para o concurso "${concursoLabel}", focados na disciplina "${effectiveDisc}" (${effectiveTopic}).

REGRAS OBRIGATÓRIAS DE FORMATAÇÃO:
1. Retorne APENAS as linhas dos flashcards, sem introdução ou conclusão.
2. Cada linha deve conter exatamente um cartão no formato:
Frente (Pergunta objetiva ou caso prático) ; Verso (Resposta direta, fundamentação legal ou mnemônico) ; ${effectiveDisc} ; ${effectiveTopic}
3. Use ponto-e-vírgula (;) como separador e não quebre linhas dentro do mesmo cartão.`;

    navigator.clipboard.writeText(promptText).then(() => {
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 3000);
    });
  };

  // Confirmar Importação salvando todos os cartões vinculados ao concurso_id selecionado
  const handleConfirmImport = () => {
    setImportError(null);
    if (previewImportCards.length === 0) {
      setImportError('Nenhum cartão identificado para importar.');
      return;
    }

    const targetCid = importConcursoId || currentConcursoId || 'default';
    const fallbackDisciplina = (
      importDisciplina === '__nova__' ? importCustomDisciplina.trim() : importDisciplina.trim()
    ) || availableDisciplinasList[0] || 'Geral';

    const fallbackDeckName = (
      importDeckMode === 'existente'
        ? decks.find(d => d.id === importDeckId)?.nome
        : importNewDeckName.trim()
    ) || `Baralho - ${fallbackDisciplina}`;

    const updatedDecks = [...decks];
    const newFlashcards: Flashcard[] = [];
    const nowIso = new Date().toISOString();

    const isApkgImport = importTab === 'file' && importFileName.toLowerCase().endsWith('.apkg');

    previewImportCards.forEach((rawCard, idx) => {
      // Para arquivos .apkg, respeita a Disciplina e o Baralho selecionados pelo usuário no modal
      const cardDisc = (
        isApkgImport
          ? fallbackDisciplina
          : (rawCard.disciplina || fallbackDisciplina)
      ).trim();
      const cardTopic = rawCard.topico?.trim() || undefined;
      const desiredDeckName = (
        isApkgImport
          ? (importDeckMode === 'existente' ? fallbackDeckName : (importNewDeckName.trim() || rawCard.deckName || fallbackDeckName))
          : (rawCard.deckName || rawCard.topico || fallbackDeckName)
      ).trim();

      let targetDeck: Deck | undefined;

      // Se o usuário escolheu um baralho existente
      if (importDeckMode === 'existente' && importDeckId && (isApkgImport || (!rawCard.deckName && !rawCard.disciplina))) {
        targetDeck = updatedDecks.find(d => d.id === importDeckId);
      }

      // Caso contrário, procurar um baralho existente no mesmo concurso, mesma disciplina e mesmo nome
      if (!targetDeck) {
        targetDeck = updatedDecks.find(
          d =>
            (d.concursoId || d.concurso_id) === targetCid &&
            d.disciplina.toLowerCase() === cardDisc.toLowerCase() &&
            d.nome.toLowerCase() === desiredDeckName.toLowerCase()
        );
      }

      if (!targetDeck) {
        targetDeck = {
          id: `deck-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
          concursoId: targetCid,
          concurso_id: targetCid,
          disciplina: cardDisc,
          nome: desiredDeckName,
          totalCards: 1,
          pendentesHoje: 1,
        };
        updatedDecks.unshift(targetDeck);
      } else {
        targetDeck.totalCards = (targetDeck.totalCards || 0) + 1;
        targetDeck.pendentesHoje = (targetDeck.pendentesHoje || 0) + 1;
        targetDeck.concursoId = targetCid;
        targetDeck.concurso_id = targetCid;
      }

      newFlashcards.push({
        id: `card-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        deckId: targetDeck.id,
        concursoId: targetCid,
        concurso_id: targetCid,
        disciplina: cardDisc,
        topico: cardTopic || desiredDeckName,
        frente: rawCard.frente.trim(),
        verso: rawCard.verso.trim(),
        dificuldade: rawCard.dificuldade || 'bom',
        intervaloDias: rawCard.intervaloDias || 1,
        proximaRevisao: rawCard.proximaRevisao || nowIso,
        criadoEm: nowIso,
        revisoesTotal: rawCard.revisoesTotal || 0,
      });
    });

    saveDecksToStorage(updatedDecks);
    saveCardsToStorage([...newFlashcards, ...flashcards]);

    // Se o usuário importou para outro concurso, alterna automaticamente para ele
    if (targetCid !== selectedConcursoId) {
      handleQuickSwitchConcurso(targetCid);
    }

    setIsImportModalOpen(false);
    setSuccessToast(`${newFlashcards.length} flashcards importados com sucesso! 🎉`);
  };

  // Iniciar sessão de revisão
  const handleStartReview = (deckId?: string) => {
    setReviewDeckId(deckId || null);
    setIsReviewSessionActive(true);
  };

  // Callback de finalização da sessão no FlashcardPlayer
  const handleFinishReviewSession = async (sessionStats: ReviewSessionStats) => {
    const reviewedDeck = concursoDecks.find(d => d.id === reviewDeckId) || activeDeck;
    const discName = reviewedDeck?.disciplina || cardsParaRevisar[0]?.disciplina || availableDisciplinasList[0] || 'Geral';

    // Normalizador de strings para matching inteligente de disciplina e assunto
    const norm = (s?: string) => (s || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const cleanDiscName = norm(discName);

    const matchedDisc = activeDisciplinas.find(d => {
      const c = norm(d.name);
      return c === cleanDiscName || c.includes(cleanDiscName) || cleanDiscName.includes(c);
    }) || disciplinas.find(d => {
      const c = norm(d.name);
      return c === cleanDiscName || c.includes(cleanDiscName) || cleanDiscName.includes(c);
    }) || activeDisciplinas[0] || disciplinas[0];

    const topicName = cardsParaRevisar[0]?.topico || reviewedDeck?.nome || 'Revisão de Flashcards';
    const cleanTopicName = norm(topicName);

    const matchedAssunto = assuntos.find(a => {
      if (matchedDisc && a.disciplinaId !== matchedDisc.id) return false;
      const c = norm(a.name);
      return c === cleanTopicName || c.includes(cleanTopicName) || cleanTopicName.includes(c);
    });

    const timeSpentSeconds = Math.max(1, sessionStats.timeSpentSeconds || 1);
    const durationMinutes = Math.max(1, Math.round(timeSpentSeconds / 60));
    const correctCount = (sessionStats.countBom || 0) + (sessionStats.countFacil || 0);

    const resolvedConcursoId = currentConcursoId || activeConcursoId || matchedDisc?.concursoId || undefined;
    const resolvedDisciplinaId = matchedDisc?.id || activeDisciplinas[0]?.id || disciplinas[0]?.id || 'disc_flashcards';
    const resolvedDisciplinaName = matchedDisc?.name || discName;
    const resolvedAssuntoName = matchedAssunto?.name || topicName;

    const sessionPayload = {
      concursoId: resolvedConcursoId,
      disciplinaId: resolvedDisciplinaId,
      assuntoId: matchedAssunto?.id || undefined,
      disciplinaName: resolvedDisciplinaName,
      assuntoName: resolvedAssuntoName,
      durationMinutes: durationMinutes,
      durationSeconds: timeSpentSeconds,
      type: 'flashcards',
      origem: 'flashcards',
      questionsAttempted: sessionStats.totalReviewed,
      questionsCorrect: correctCount,
      notes: `Sessão de Flashcards (${reviewedDeck?.nome || 'Revisão Diária'}): ${sessionStats.totalReviewed} cartões revisados em ${Math.floor(timeSpentSeconds / 60)}m ${timeSpentSeconds % 60}s.`,
      completedAt: new Date().toISOString(),
    };

    if (sessionStats.totalReviewed > 0 || timeSpentSeconds >= 5) {
      try {
        if (onSaveStudySession) {
          await onSaveStudySession(sessionPayload);
        } else {
          await DatabaseService.recordStudySession(sessionPayload as any);
        }
      } catch (err) {
        console.warn('Erro ao salvar sessão de flashcards no histórico:', err);
        try {
          await DatabaseService.recordStudySession(sessionPayload as any);
        } catch (fallbackErr) {
          console.error('Falha no fallback de gravação de flashcard:', fallbackErr);
        }
      }

      // Dispara eventos globais para atualização reativa instantânea de todas as abas (Histórico, Dashboard, Edital)
      window.dispatchEvent(new CustomEvent('gabarita_sessoes_updated'));
      window.dispatchEvent(new CustomEvent('gabarita_edital_verticalizado_sync'));
    }

    setIsReviewSessionActive(false);
    setReviewDeckId(null);

    // Recarregar flashcards e decks atualizados do localStorage
    try {
      const storedCards = localStorage.getItem(STORAGE_KEY_FLASHCARDS);
      if (storedCards) setFlashcards(JSON.parse(storedCards));
      const storedDecks = localStorage.getItem(STORAGE_KEY_DECKS);
      if (storedDecks) setDecks(JSON.parse(storedDecks));
    } catch (e) {
      console.warn('Erro ao atualizar estados locais após revisão:', e);
    }

    const mins = Math.floor(timeSpentSeconds / 60);
    const secs = timeSpentSeconds % 60;
    const timeFormatted = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

    setSuccessToast(
      `Sessão concluída e salva no histórico! ${sessionStats.totalReviewed} cartões revisados • Tempo: ${timeFormatted} 🏆`
    );
  };

  const toggleCardReveal = (cardId: string) => {
    setCardRevealedIds(prev => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  // Excluir Baralho completo e seus cartões vinculados
  const handleConfirmDeleteDeck = () => {
    if (!deckToDelete) return;
    const deckName = deckToDelete.nome;
    const targetId = deckToDelete.id;

    const updatedDecks = decks.filter(d => d.id !== targetId);
    const updatedCards = flashcards.filter(c => c.deckId !== targetId);

    saveDecksToStorage(updatedDecks);
    saveCardsToStorage(updatedCards);

    if (selectedDeckId === targetId) {
      setSelectedDeckId(null);
    }
    setDeckToDelete(null);
    setSuccessToast(`Baralho "${deckName}" excluído com sucesso!`);
  };

  // Excluir Cartão individual de dentro do baralho
  const handleConfirmDeleteCard = () => {
    if (!cardToDelete) return;
    const targetCardId = cardToDelete.id;
    const targetDeckId = cardToDelete.deckId;

    const updatedCards = flashcards.filter(c => c.id !== targetCardId);
    saveCardsToStorage(updatedCards);

    const remainingDeckCards = updatedCards.filter(c => c.deckId === targetDeckId);
    const updatedDecks = decks.map(d => {
      if (d.id === targetDeckId) {
        return {
          ...d,
          totalCards: remainingDeckCards.length,
          pendentesHoje: Math.min(d.pendentesHoje || 0, remainingDeckCards.length),
        };
      }
      return d;
    });
    saveDecksToStorage(updatedDecks);

    setCardToDelete(null);
    setSuccessToast('Flashcard excluído do baralho com sucesso!');
  };

  return (
    <div className="space-y-6">
      {/* Toast de Feedback de Sucesso */}
      {successToast && (
        <div className="fixed top-20 right-6 z-50 animate-bounce flex items-center gap-3 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-lg border border-emerald-500">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-semibold">{successToast}</span>
          <button 
            onClick={() => setSuccessToast(null)}
            className="ml-2 hover:opacity-80 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Banner Principal Dinâmico por Tema - Hub de Flashcards */}
      <MenuBannerFrame
        bannerThemes={FLASHCARDS_BANNER_THEMES}
        alt="Banner Hub de Flashcards"
        minHeight="min-h-[190px] md:min-h-[210px]"
        className="flashcards-banner flashcards-main-banner w-full rounded-2xl border border-slate-200/20 dark:border-slate-800 shadow-xl flex items-center bg-slate-950 p-6 md:p-8"
        bgWrapperClassName="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0"
        imgClassName="flashcards-banner-bg-img absolute -left-[7%] -top-[24%] w-[114%] h-[148%] max-w-none object-cover object-[78%_center] md:object-[74%_center] pointer-events-none select-none transition-transform duration-300"
        overlayClassName="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/50 to-slate-950/20 pointer-events-none"
        contentClassName="w-full flex flex-col justify-center items-start max-w-3xl h-full gap-4"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <div
              className="flashcards-banner-icon-box w-11 h-11 rounded-xl bg-black/50 border border-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-md"
              style={{ color: themeGlowStyles.color }}
            >
              <Layers className="w-6 h-6" />
            </div>
            <h1
              className="provas-banner-title text-xl sm:text-2xl md:text-3xl font-extrabold !text-white tracking-tight leading-tight select-none drop-shadow-md flex items-center gap-2.5 flex-wrap"
              style={{
                color: '#FFFFFF',
                textShadow: themeGlowStyles.textShadow,
              }}
            >
              <span>Hub de Flashcards</span>
              <span
                className="flashcards-banner-badge text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-black/60 text-white border border-white/25 backdrop-blur-md shadow-xs"
                style={{ color: '#FFFFFF', textShadow: 'none' }}
              >
                SM-2 Ativo
              </span>
            </h1>
          </div>
          <p
            className="flashcards-banner-desc text-xs sm:text-sm !text-white/90 leading-relaxed max-w-xl drop-shadow-xs"
            style={{ color: 'rgba(255, 255, 255, 0.92)' }}
          >
            Memorização ativa de alto rendimento por disciplinas e repetição inteligente para{' '}
            <strong className="font-extrabold text-white underline decoration-white/40 underline-offset-2">
              {currentConcursoName}
            </strong>.
          </p>
        </div>

        <div className="pt-1 flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4 shrink-0" />}
            onClick={() => handleOpenCreateModal()}
            className="theme-btn-primary h-10 px-5 !rounded-xl shadow-lg shadow-black/30 font-bold text-xs md:text-sm tracking-wide cursor-pointer whitespace-nowrap"
          >
            Criar Flashcard
          </Button>
          <button
            type="button"
            onClick={() => handleOpenImportModal('file')}
            className="btn-banner-secundario flashcards-banner-btn h-10 px-4 rounded-xl bg-black/60 hover:bg-black/80 text-white border border-white/25 backdrop-blur-md shadow-md font-bold text-xs md:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap"
          >
            <Upload className="w-4 h-4 shrink-0" />
            <span>Importar</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenExportModal({ scope: 'all' })}
            disabled={concursoFlashcards.length === 0}
            className="btn-banner-secundario flashcards-banner-btn h-10 px-4 rounded-xl bg-black/60 hover:bg-black/80 disabled:opacity-50 disabled:cursor-not-allowed text-white border border-white/25 backdrop-blur-md shadow-md font-bold text-xs md:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>Exportar</span>
          </button>
        </div>
      </MenuBannerFrame>

      {/* 2. Barra Superior com Estatísticas / Métricas Resumidas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Baralhos Ativos */}
        <div className="gabarita-card-hover-theme p-4 rounded-xl border border-l-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center gap-3.5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Baralhos Ativos
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                {totalDecks}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                decks
              </span>
            </div>
          </div>
        </div>

        {/* Total Cards */}
        <div className="gabarita-card-hover-theme p-4 rounded-xl border border-l-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center gap-3.5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Total Cards
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                {totalCards}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                memorizados
              </span>
            </div>
          </div>
        </div>

        {/* Para Revisar Hoje */}
        <div className="gabarita-card-hover-theme p-4 rounded-xl border border-l-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center gap-3.5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="w-11 h-11 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Para Revisar Hoje
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
                {pendentesHoje}
              </span>
              <span className="text-xs text-amber-600/80 dark:text-amber-400/80 font-medium">
                pendentes
              </span>
            </div>
          </div>
        </div>

        {/* Progresso / Precisão */}
        <div className="gabarita-card-hover-theme p-4 rounded-xl border border-l-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center gap-3.5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flashcards-retention-icon-box w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Progresso / Precisão
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="flashcards-retention-value text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {precisaoCalculada}%
              </span>
              <span className="flashcards-retention-label text-xs text-emerald-600/80 dark:text-emerald-400/80 font-medium">
                retenção
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Banner / Card de Destaque da "Revisão Diária" */}
      <div className="flashcards-daily-review-card relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/25 dark:border-primary/20 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col justify-center space-y-2 max-w-2xl">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              Revisão Diária de Flashcards
            </h2>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              {pendentesHoje > 0 ? (
                <>
                  Você possui <strong className="text-slate-900 dark:text-white font-bold">{pendentesHoje} {pendentesHoje === 1 ? 'cartão agendado' : 'cartões agendados'}</strong> para hoje em <strong className="text-slate-900 dark:text-white font-bold">{currentConcursoName}</strong>. Revise-os agora para fixar na memória de longo prazo e evitar a curva do esquecimento.
                </>
              ) : concursoFlashcards.length > 0 ? (
                'Excelente trabalho! Todos os seus flashcards programados para hoje neste concurso já foram revisados. Você pode iniciar um treino livre em qualquer baralho abaixo.'
              ) : (
                `Você ainda não possui cartões agendados para ${currentConcursoName}. Crie ou importe seus flashcards para iniciar seu ciclo de memorização espaçada.`
              )}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full lg:w-auto">
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Flame className="w-5 h-5 fill-current" />}
              onClick={() => handleStartReview()}
              disabled={pendentesHoje === 0 && concursoFlashcards.length === 0}
              className="font-black text-sm tracking-wide shadow-md hover:scale-[1.02] transition-transform w-full sm:w-auto justify-center"
            >
              Iniciar Revisão ({pendentesHoje} pendentes)
            </Button>
          </div>
        </div>

        {/* Efeito decorativo de fundo */}
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 4. Barra de Controles: Busca, Seletor Rápido de Concurso, Filtro de Disciplinas e Ações de Importar/Exportar */}
      <div className="flashcards-daily-review-card flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-3.5 rounded-2xl border border-primary/25 dark:border-primary/20 shadow-xs overflow-hidden">
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar baralho ou conteúdo..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-white/90 dark:bg-slate-900/80 border border-primary/20 dark:border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 min-w-0 flex-wrap max-w-full">
          {/* Seletor Rápido de Concurso */}
          {availableConcursos.length > 0 && (
            <div className="flex items-center gap-1.5 min-w-0 max-w-full sm:max-w-[260px]">
              <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 shrink-0 font-medium">
                <Briefcase className="w-3.5 h-3.5 text-primary" />
                <span className="hidden md:inline">Concurso:</span>
              </div>
              <select
                value={currentConcursoId}
                onChange={(e) => handleQuickSwitchConcurso(e.target.value)}
                title="Alternar Concurso"
                className="w-full min-w-0 truncate text-xs font-bold px-3 py-2 bg-white/90 dark:bg-slate-900/80 border border-primary/25 dark:border-primary/30 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                {availableConcursos.map(c => (
                  <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {getConcursoDisplayName(c)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filtro por Disciplina do Concurso Selecionado */}
          <div className="flex items-center gap-1.5 min-w-0 max-w-full sm:max-w-[240px]">
            <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 shrink-0 font-medium">
              <Filter className="w-3.5 h-3.5 text-primary" />
              <span className="hidden md:inline">Filtrar:</span>
            </div>
            <select
              value={filterDisciplina}
              onChange={(e) => setFilterDisciplina(e.target.value)}
              className="w-full min-w-0 truncate text-xs font-semibold px-3 py-2 bg-white/90 dark:bg-slate-900/80 border border-primary/20 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="todas">Todas as Disciplinas</option>
              {availableDisciplinasList.map(disc => (
                <option key={disc} value={disc}>{disc}</option>
              ))}
            </select>
          </div>

          {/* Botões rápidos de Importar e Exportar na barra de controles */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenImportModal('file')}
              leftIcon={<Upload className="w-3.5 h-3.5" />}
              className="text-xs font-bold whitespace-nowrap bg-white/80 dark:bg-slate-900/80"
            >
              Importar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenExportModal({ scope: 'all' })}
              disabled={concursoFlashcards.length === 0}
              leftIcon={<Download className="w-3.5 h-3.5" />}
              className="text-xs font-bold whitespace-nowrap bg-white/80 dark:bg-slate-900/80"
            >
              Exportar
            </Button>
          </div>

          {selectedDeckId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDeckId(null)}
              className="text-xs shrink-0 whitespace-nowrap bg-white/80 dark:bg-slate-900/80"
              leftIcon={<ArrowLeft className="w-3 h-3" />}
            >
              Voltar aos Baralhos
            </Button>
          )}
        </div>
      </div>

      {/* 5. Grade / Lista de Baralhos agrupados por Disciplina OU Detalhes do Baralho */}
      {!selectedDeckId ? (
        <div className="space-y-8">
          {Object.keys(decksGroupedByDisciplina).length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center mx-auto text-primary">
                <Layers className="w-7 h-7" />
              </div>
              {concursoDecks.length === 0 ? (
                <>
                  <div className="space-y-1.5">
                    <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
                      Nenhum flashcard encontrado para {currentConcursoName}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                      Nenhum flashcard encontrado para <strong className="text-slate-700 dark:text-slate-200">{currentConcursoName}</strong>. Crie seu primeiro card ou importe um baralho externo.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <Button
                      variant="primary"
                      size="md"
                      leftIcon={<Plus className="w-4 h-4" />}
                      onClick={() => handleOpenCreateModal()}
                    >
                      Criar Flashcard
                    </Button>
                    <Button
                      variant="outline"
                      size="md"
                      leftIcon={<Upload className="w-4 h-4" />}
                      onClick={() => handleOpenImportModal('file')}
                    >
                      Importar Cards
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                      Nenhum baralho encontrado para este filtro
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                      Tente ajustar o filtro de disciplina ou a busca para localizar seus baralhos em {currentConcursoName}.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFilterDisciplina('todas');
                        setSearchQuery('');
                      }}
                    >
                      Limpar Filtros
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Plus className="w-4 h-4" />}
                      onClick={() => handleOpenCreateModal()}
                    >
                      + Criar Flashcard
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            Object.entries(decksGroupedByDisciplina).map(([disciplinaNome, disciplinaDecks]) => {
              const IconComp = getDisciplinaIcon(disciplinaNome);
              const totalCardsDaDisciplina = disciplinaDecks.reduce(
                (acc, d) => acc + concursoFlashcards.filter(c => c.deckId === d.id).length, 0
              );
              const pendentesDaDisciplina = disciplinaDecks.reduce(
                (acc, d) => acc + (d.pendentesHoje || 0), 0
              );

              return (
                <div key={disciplinaNome} className="space-y-4">
                  {/* Cabeçalho da Disciplina Agrupadora */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                          {disciplinaNome}
                        </h2>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {disciplinaDecks.length} {disciplinaDecks.length === 1 ? 'baralho' : 'baralhos'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                      <span>Total: <strong className="text-slate-700 dark:text-slate-300 font-bold">{totalCardsDaDisciplina} cards</strong></span>
                      {pendentesDaDisciplina > 0 && (
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          • {pendentesDaDisciplina} para hoje
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenExportModal({ scope: 'disciplina', disciplina: disciplinaNome })}
                        title={`Exportar flashcards de ${disciplinaNome}`}
                        className="text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> Exportar matéria
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenCreateModal(undefined, disciplinaNome)}
                        className="text-primary hover:underline font-bold text-xs flex items-center gap-1 cursor-pointer ml-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Novo card nesta matéria
                      </button>
                    </div>
                  </div>

                  {/* Grade de Cards de Baralhos da Disciplina */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {disciplinaDecks.map((deck) => {
                      const deckCards = concursoFlashcards.filter(c => c.deckId === deck.id);
                      return (
                        <div
                          key={deck.id}
                          className="flashcards-daily-review-card bg-gradient-to-br from-primary/15 via-primary/5 to-transparent rounded-2xl border border-primary/25 dark:border-primary/20 p-5 flex flex-col justify-between hover:border-primary/50 dark:hover:border-primary/50 transition-all shadow-xs hover:shadow-md group"
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border border-primary/20 dark:border-slate-700/60 truncate max-w-[170px]">
                                {deck.disciplina}
                              </span>

                              {deck.pendentesHoje > 0 ? (
                                <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 shrink-0">
                                  {deck.pendentesHoje} hoje
                                </span>
                              ) : (
                                <span className="flashcards-em-dia-badge text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                                  Em dia
                                </span>
                              )}
                            </div>

                            <div>
                              <h3 className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors text-base line-clamp-2">
                                {deck.nome}
                              </h3>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                {deckCards.length} {deckCards.length === 1 ? 'cartão cadastrado' : 'cartões cadastrados'}
                              </p>
                            </div>
                          </div>

                          {/* Rodapé do Card do Baralho */}
                          <div className="pt-4 mt-4 border-t border-primary/15 dark:border-primary/20 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedDeckId(deck.id)}
                              className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" /> Ver Cards ({deckCards.length})
                            </button>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenExportModal({ scope: 'deck', deckId: deck.id });
                                }}
                                title="Exportar este baralho"
                                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-primary hover:bg-white/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeckToDelete(deck);
                                }}
                                title="Excluir baralho"
                                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenCreateModal(deck)}
                                title="Adicionar flashcard neste baralho"
                                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-primary hover:bg-white/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleStartReview(deck.id)}
                                className="text-xs font-bold"
                                rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                              >
                                Revisar
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Visualização Detalhada dos Cards do Baralho Selecionado */
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedDeckId(null)}
                  className="text-xs text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Voltar aos Baralhos
                </button>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {activeDeck?.disciplina}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {activeDeck?.nome}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {activeCards.length} {activeCards.length === 1 ? 'cartão cadastrado' : 'cartões cadastrados'} neste baralho
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {activeDeck && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenExportModal({ scope: 'deck', deckId: activeDeck.id })}
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                >
                  Exportar Baralho
                </Button>
              )}
              {activeDeck && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeckToDelete(activeDeck)}
                  className="!border-rose-200 dark:!border-rose-900/60 !text-rose-600 dark:!text-rose-400 hover:!bg-rose-50 dark:hover:!bg-rose-950/40"
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                >
                  Excluir Baralho
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenCreateModal(activeDeck)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                 Adicionar ao Baralho
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleStartReview(activeDeck?.id)}
                leftIcon={<Flame className="w-3.5 h-3.5 fill-current" />}
              >
                Revisar Agora
              </Button>
            </div>
          </div>

          {activeCards.length === 0 ? (
            <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
              <Layers className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Nenhum cartão neste baralho ainda.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleOpenCreateModal(activeDeck)}
              >
                + Criar Primeiro Cartão
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeCards.map((card, idx) => {
                const isRevealed = !!cardRevealedIds[card.id];
                return (
                  <div
                    key={card.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between space-y-4 shadow-xs"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2 text-xs text-slate-400 dark:text-slate-500">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono font-bold shrink-0"># {idx + 1}</span>
                          {card.topico && (
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded text-[10px] font-medium truncate">
                              {card.topico}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEditCardModal(card)}
                            title="Editar este cartão"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setCardToDelete(card)}
                            title="Excluir este cartão"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Excluir</span>
                          </button>
                        </div>
                      </div>

                      {/* Frente do Flashcard */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          FRENTE (PERGUNTA)
                        </span>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                          <FlashcardRichContent content={card.frente} />
                        </div>
                      </div>

                      {/* Verso do Flashcard (Resposta) */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
                        <span className="text-[10px] font-black uppercase tracking-wider text-primary-600 dark:text-primary-400 block mb-1">
                          VERSO (RESPOSTA)
                        </span>
                        {isRevealed ? (
                          <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                            <FlashcardRichContent content={card.verso} />
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggleCardReveal(card.id)}
                            className="w-full py-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> Clique para revelar resposta
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Intervalo: {card.intervaloDias || 1}d
                      </span>
                      <div className="flex items-center gap-3">
                        {isRevealed && (
                          <button
                            type="button"
                            onClick={() => toggleCardReveal(card.id)}
                            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          >
                            Ocultar resposta
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL: CRIAR / EDITAR FLASHCARD */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingCardId(null);
        }}
        title={`${editingCardId ? 'Editar Flashcard' : 'Criar Flashcard'} • ${currentConcursoName}`}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveFlashcard} className="space-y-4">
          {/* Seleção de Disciplina */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Disciplina do Edital / Plano *
            </label>
            {availableDisciplinasList.length > 0 ? (
              <select
                value={formDisciplina}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormDisciplina(val);
                  const discDecks = concursoDecks.filter(d => d.disciplina.toLowerCase() === val.toLowerCase());
                  if (discDecks.length > 0) {
                    setFormDeckId(discDecks[0].id);
                    setFormDeckMode('existente');
                  } else {
                    setFormDeckMode('novo');
                    setFormDeckId('');
                  }
                }}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-slate-100"
              >
                {availableDisciplinasList.map(dName => (
                  <option key={dName} value={dName}>
                    {dName}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={formDisciplina}
                onChange={(e) => setFormDisciplina(e.target.value)}
                placeholder="Ex: Direito Constitucional, Língua Portuguesa..."
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-slate-100"
              />
            )}
            {formErrors.disciplina && (
              <span className="text-[11px] text-rose-500 font-semibold mt-1 block">
                {formErrors.disciplina}
              </span>
            )}
          </div>

          {/* Seleção de Baralho (Existente ou Novo) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Baralho (Deck) *
              </label>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setFormDeckMode('existente')}
                  className={`px-2 py-0.5 rounded cursor-pointer font-semibold ${
                    formDeckMode === 'existente'
                      ? 'bg-primary text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Existente
                </button>
                <button
                  type="button"
                  onClick={() => setFormDeckMode('novo')}
                  className={`px-2 py-0.5 rounded cursor-pointer font-semibold ${
                    formDeckMode === 'novo'
                      ? 'bg-primary text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  + Novo Baralho
                </button>
              </div>
            </div>

            {formDeckMode === 'existente' ? (
              <select
                value={formDeckId}
                onChange={(e) => setFormDeckId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-slate-100"
              >
                {concursoDecks
                  .filter(d => !formDisciplina || d.disciplina.toLowerCase() === formDisciplina.toLowerCase())
                  .map(d => (
                    <option key={d.id} value={d.id}>
                      {d.nome} ({concursoFlashcards.filter(c => c.deckId === d.id).length} cards)
                    </option>
                  ))}
                {concursoDecks.filter(d => !formDisciplina || d.disciplina.toLowerCase() === formDisciplina.toLowerCase()).length === 0 && (
                  <option value="" disabled>Nenhum baralho cadastrado nesta disciplina</option>
                )}
              </select>
            ) : (
              <input
                type="text"
                value={formNewDeckName}
                onChange={(e) => setFormNewDeckName(e.target.value)}
                placeholder="Ex: Direitos Individuais (Art. 5º)"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-slate-100"
              />
            )}
            {formErrors.deck && (
              <span className="text-[11px] text-rose-500 font-semibold mt-1 block">
                {formErrors.deck}
              </span>
            )}
          </div>

          {/* Campo de Tópico / Assunto (opcional ou busca/sugestão) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tópico / Assunto do Edital (Opcional)
            </label>
            <input
              type="text"
              list="topicos-sugestoes"
              value={formTopico}
              onChange={(e) => setFormTopico(e.target.value)}
              placeholder="Ex: Habeas Corpus, Crase, Atos Administrativos..."
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-slate-100"
            />
            {suggestedTopics.length > 0 && (
              <datalist id="topicos-sugestoes">
                {suggestedTopics.map(t => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            )}
          </div>

          {/* Pergunta (Frente) - Editor de Texto Rico Estilo Gmail */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Pergunta / Conceito (Frente) *
            </label>
            <GmailRichTextEditor
              value={formFrente}
              onChange={(html) => {
                setFormFrente(html);
                if (formErrors.frente) {
                  setFormErrors(prev => ({ ...prev, frente: '' }));
                }
              }}
              placeholder="Digite o conceito central, pergunta-chave ou caso prático para recordar..."
              minRows={3}
              hasError={!!formErrors.frente}
            />
            {formErrors.frente && (
              <span className="text-[11px] text-rose-500 font-semibold mt-1 block">
                {formErrors.frente}
              </span>
            )}
          </div>

          {/* Resposta / Explicação (Verso) - Editor de Texto Rico Estilo Gmail */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Resposta / Explicação (Verso) *
            </label>
            <GmailRichTextEditor
              value={formVerso}
              onChange={(html) => {
                setFormVerso(html);
                if (formErrors.verso) {
                  setFormErrors(prev => ({ ...prev, verso: '' }));
                }
              }}
              placeholder="Digite a resposta objetiva, fundamentação legal, súmula ou mnemônico..."
              minRows={3}
              hasError={!!formErrors.verso}
            />
            {formErrors.verso && (
              <span className="text-[11px] text-rose-500 font-semibold mt-1 block">
                {formErrors.verso}
              </span>
            )}
          </div>

          {/* Ações do Formulário */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => {
                setIsCreateModalOpen(false);
                setEditingCardId(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              leftIcon={<Check className="w-4 h-4" />}
            >
              Salvar Flashcard
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: EXPORTAR FLASHCARDS */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Exportar Flashcards"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Salve localmente os flashcards de <strong className="font-bold text-slate-900 dark:text-white">{currentConcursoName}</strong> para utilizar no Anki, planilhas ou manter um backup completo.
          </p>

          {/* Escopo da Exportação */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              O que deseja exportar?
            </label>
            <select
              value={exportScope}
              onChange={(e) => setExportScope(e.target.value as 'all' | 'disciplina' | 'deck')}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none"
            >
              <option value="all">Todos os flashcards deste concurso ({concursoFlashcards.length} cards)</option>
              <option value="disciplina">Apenas uma Disciplina específica</option>
              <option value="deck">Apenas um Baralho específico</option>
            </select>
          </div>

          {exportScope === 'disciplina' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Selecione a Disciplina
              </label>
              <select
                value={exportTargetDisciplina}
                onChange={(e) => setExportTargetDisciplina(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none"
              >
                {availableDisciplinasList.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          )}

          {exportScope === 'deck' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Selecione o Baralho
              </label>
              <select
                value={exportTargetDeckId}
                onChange={(e) => setExportTargetDeckId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none"
              >
                {concursoDecks.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.nome} ({d.disciplina})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Formato do Arquivo */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Formato do Arquivo
            </label>

            <label
              onClick={() => setExportFormat('anki_csv')}
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                exportFormat === 'anki_csv'
                  ? 'border-primary bg-primary/5 dark:bg-primary/10'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <FileSpreadsheet className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-bold text-slate-900 dark:text-slate-100">
                  Compatível com Anki / Planilhas (.csv)
                </div>
                <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                  Separado por ponto-e-vírgula: <code className="font-mono">Frente;Verso;Disciplina;Topico</code>
                </div>
              </div>
            </label>

            <label
              onClick={() => setExportFormat('anki_txt')}
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                exportFormat === 'anki_txt'
                  ? 'border-primary bg-primary/5 dark:bg-primary/10'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <FileText className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-bold text-slate-900 dark:text-slate-100">
                  Texto Estruturado Anki (.txt)
                </div>
                <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                  Arquivo de texto plano com colunas <code className="font-mono">Frente;Verso;Disciplina;Topico</code>
                </div>
              </div>
            </label>

            <label
              onClick={() => setExportFormat('json')}
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                exportFormat === 'json'
                  ? 'border-primary bg-primary/5 dark:bg-primary/10'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <FileJson className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-bold text-slate-900 dark:text-slate-100">
                  Backup Completo Gabarita (.json)
                </div>
                <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                  Inclui todos os metadados (frente, verso, disciplina, baralho e histórico de repetição espaçada) para restauração futura.
                </div>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total selecionado: <strong className="text-slate-900 dark:text-white">{cardsToExport.length} cartões</strong>
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsExportModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={cardsToExport.length === 0}
                onClick={handleConfirmExport}
                leftIcon={<Download className="w-4 h-4" />}
              >
                Baixar Arquivo
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL: IMPORTAR FLASHCARDS (ANKI, PLANILHAS, JSON E IA) */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Importar Flashcards"
        maxWidth="lg"
      >
        <div className="space-y-4">
          {/* Seletores de Destino (Concurso, Disciplina e Baralho) */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Concurso de Destino */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Concurso de Destino *
                </label>
                <select
                  value={importConcursoId}
                  onChange={(e) => handleChangeImportConcurso(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none"
                >
                  {availableConcursos.map(c => (
                    <option key={c.id} value={c.id}>
                      {getConcursoDisplayName(c)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Disciplina Padrão */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Disciplina Padrão *
                </label>
                <select
                  value={importDisciplina}
                  onChange={(e) => {
                    const val = e.target.value;
                    setImportDisciplina(val);
                    if (val !== '__nova__') {
                      const discDecks = decks.filter(
                        d =>
                          (d.concursoId || d.concurso_id) === importConcursoId &&
                          d.disciplina.toLowerCase() === val.toLowerCase()
                      );
                      if (discDecks.length > 0) {
                        setImportDeckMode('existente');
                        setImportDeckId(discDecks[0].id);
                      } else {
                        setImportDeckMode('novo');
                        setImportDeckId('');
                        setImportNewDeckName(`Baralho - ${val}`);
                      }
                    } else {
                      setImportDeckMode('novo');
                      setImportDeckId('');
                    }
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none"
                >
                  {importTargetDisciplinas.map(dName => (
                    <option key={dName} value={dName}>{dName}</option>
                  ))}
                  <option value="__nova__">+ Informar Nova Disciplina...</option>
                </select>
              </div>
            </div>

            {importDisciplina === '__nova__' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Nome da Nova Disciplina *
                </label>
                <input
                  type="text"
                  value={importCustomDisciplina}
                  onChange={(e) => setImportCustomDisciplina(e.target.value)}
                  placeholder="Ex: Conhecimentos Bancários, Direito Constitucional..."
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>
            )}

            {/* Baralho / Tópico de Destino */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Baralho / Tópico Padrão *
                </label>
                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setImportDeckMode('existente')}
                    disabled={importTargetDecks.length === 0}
                    className={`px-2 py-0.5 rounded cursor-pointer font-semibold disabled:opacity-40 ${
                      importDeckMode === 'existente'
                        ? 'bg-primary text-white'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Existente
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportDeckMode('novo')}
                    className={`px-2 py-0.5 rounded cursor-pointer font-semibold ${
                      importDeckMode === 'novo'
                        ? 'bg-primary text-white'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    + Novo Baralho
                  </button>
                </div>
              </div>

              {importDeckMode === 'existente' && importTargetDecks.length > 0 ? (
                <select
                  value={importDeckId}
                  onChange={(e) => setImportDeckId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none"
                >
                  {importTargetDecks.map(d => (
                    <option key={d.id} value={d.id}>{d.nome}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={importNewDeckName}
                  onChange={(e) => setImportNewDeckName(e.target.value)}
                  placeholder="Nome do baralho ou tópico (ex: Sistema Financeiro Nacional)"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              )}
            </div>
          </div>

          {/* Abas de Método de Importação */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setImportTab('file');
                setImportError(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                importTab === 'file'
                  ? 'bg-white dark:bg-slate-900 text-primary shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload de Arquivo (Anki .apkg / CSV / JSON)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setImportTab('text');
                setImportError(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                importTab === 'text'
                  ? 'bg-white dark:bg-slate-900 text-primary shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Colar Texto / Gerados por IA</span>
            </button>
          </div>

          {importTab === 'file' ? (
            <div className="space-y-3">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const droppedFile = e.dataTransfer.files?.[0];
                  if (droppedFile) handleFileUpload(droppedFile);
                }}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-primary dark:hover:border-primary rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/30"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".apkg,.txt,.csv,.tsv,.json"
                  className="hidden"
                  onChange={(e) => {
                    const selected = e.target.files?.[0];
                    if (selected) handleFileUpload(selected);
                  }}
                />
                <Upload className={`w-8 h-8 text-primary mx-auto mb-2 ${isParsingFile ? 'animate-bounce' : ''}`} />
                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  {isParsingFile
                    ? `Extraindo cartões de ${importFileName}...`
                    : importFileName
                    ? `Arquivo carregado: ${importFileName}`
                    : 'Arraste um arquivo Anki (.apkg), CSV ou JSON aqui, ou clique para selecionar'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Formatos suportados: <strong>.apkg</strong> (Pacote Anki), <strong>.txt</strong> (Anki), <strong>.csv</strong> (Planilhas: Frente;Verso;Disciplina;Topico) ou <strong>.json</strong> (Backup Gabarita)
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Cole abaixo sua lista de perguntas e respostas:
                </span>
                <button
                  type="button"
                  onClick={handleCopyAiPrompt}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
                >
                  {promptCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Prompt Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Prompt Modelo para IA</span>
                    </>
                  )}
                </button>
              </div>

              <textarea
                rows={5}
                value={importRawText}
                onChange={(e) => setImportRawText(e.target.value)}
                placeholder={`Formatos de IA reconhecidos automaticamente (mesmo se colados na mesma linha):\n1) Frente ; Verso ; Disciplina ; Topico\n2) Frente | Verso  ou  Tabelas Markdown (| Frente | Verso |)\n3) Pergunta: ... / Resposta: ...  ou  Frente: ... / Verso: ...\n4) Pergunta :: Resposta  ou  Pergunta -> Resposta  ou  JSON`}
                className="w-full px-3.5 py-2.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-slate-100 resize-y"
              />
            </div>
          )}

          {importError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{importError}</span>
            </div>
          )}

          {/* Pré-visualização (Preview) dos cartões identificados */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-primary" />
                Pré-visualização da Importação
              </span>
              <span
                className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                  previewImportCards.length > 0
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {previewImportCards.length} {previewImportCards.length === 1 ? 'cartão identificado' : 'cartões identificados'}
              </span>
            </div>

            {previewImportCards.length > 0 ? (
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {previewImportCards.slice(0, 15).map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 text-[11px] flex flex-col gap-0.5"
                  >
                    <div className="font-bold text-slate-800 dark:text-slate-100 truncate">
                      #{idx + 1} P: {item.frente}
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 truncate">
                      R: {item.verso}
                    </div>
                  </div>
                ))}
                {previewImportCards.length > 15 && (
                  <div className="text-[11px] text-center text-slate-500 py-1 font-medium">
                    + {previewImportCards.length - 15} outros cartões prontos para importar...
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Selecione um arquivo ou cole o texto acima para visualizar os cartões antes de confirmar.
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsImportModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={previewImportCards.length === 0}
              onClick={handleConfirmImport}
              leftIcon={<Check className="w-4 h-4" />}
            >
              Confirmar Importação ({previewImportCards.length})
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: CONFIRMAR EXCLUSÃO DE BARALHO */}
      <Modal
        isOpen={!!deckToDelete}
        onClose={() => setDeckToDelete(null)}
        title="Excluir Baralho"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            <div className="text-xs leading-relaxed">
              Tem certeza que deseja excluir o baralho <strong className="font-bold">"{deckToDelete?.nome}"</strong>? Todos os cartões vinculados a este baralho serão removidos permanentemente.
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeckToDelete(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleConfirmDeleteDeck}
              className="!bg-rose-600 hover:!bg-rose-700 !text-white !border-rose-600"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Sim, Excluir Baralho
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: CONFIRMAR EXCLUSÃO DE CARTÃO */}
      <Modal
        isOpen={!!cardToDelete}
        onClose={() => setCardToDelete(null)}
        title="Excluir Flashcard"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            <div className="text-xs leading-relaxed">
              Deseja realmente excluir este cartão do baralho? Esta ação não poderá ser desfeita.
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCardToDelete(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleConfirmDeleteCard}
              className="!bg-rose-600 hover:!bg-rose-700 !text-white !border-rose-600"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Excluir Cartão
            </Button>
          </div>
        </div>
      </Modal>

      {/* PLAYER INTERATIVO DE REVISÃO ATIVA (SUPERMEMO SRS / ANKI) */}
      {isReviewSessionActive && (
        <FlashcardPlayer
          cards={cardsParaRevisar.length > 0 ? cardsParaRevisar : concursoFlashcards}
          deckName={activeDeck?.nome || (reviewDeckId ? concursoDecks.find(d => d.id === reviewDeckId)?.nome : 'Revisão Diária')}
          disciplinaName={activeDeck?.disciplina || (reviewDeckId ? concursoDecks.find(d => d.id === reviewDeckId)?.disciplina : 'Flashcards')}
          onFinish={handleFinishReviewSession}
          onClose={() => setIsReviewSessionActive(false)}
        />
      )}
    </div>
  );
};

export const FlashcardsView = Flashcards;
