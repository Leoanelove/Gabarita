import dotenv from 'dotenv';
dotenv.config({ override: true });
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { sanitizeSyllabusData, parseSyllabusLocally, type ParsedSyllabusItem } from './src/services/editalParser.ts';
import { createClient } from '@supabase/supabase-js';

function sanitizeServerUrl(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  let u = raw.trim().replace(/^["']|["']$/g, '');
  if (!u) return '';
  if (!u.startsWith('http://') && !u.startsWith('https://')) {
    u = `https://${u}`;
  }
  if (u.includes('zuzzcq')) {
    u = u.replace('zuzzcq', 'zuzzoq');
  }
  try {
    const parsed = new URL(u);
    if (parsed.hostname.endsWith('.supabase.co') || parsed.pathname.includes('/rest') || parsed.pathname.includes('/auth')) {
      return parsed.origin;
    }
    return `${parsed.origin}${parsed.pathname}`.replace(/\/+(rest|auth)(\/v1)?\/?$/i, '').replace(/\/+$/, '');
  } catch {
    return u.replace(/\/+(rest|auth)(\/v1)?\/?$/i, '').replace(/\/+$/, '');
  }
}

// Normaliza o URL do Supabase garantindo a URL base limpa
const rawSupabaseUrl = 
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL || 
  'https://zuzzoqdytblgswwlevjc.supabase.co';
const SUPABASE_URL = sanitizeServerUrl(rawSupabaseUrl) || 'https://zuzzoqdytblgswwlevjc.supabase.co';
process.env.SUPABASE_URL = SUPABASE_URL;
process.env.VITE_SUPABASE_URL = SUPABASE_URL;

const rawSupabaseKey = 
  process.env.VITE_SUPABASE_KEY ||
  process.env.SUPABASE_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1enpvcWR5dGJsZ3N3d2xldmpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4MzY4ODUsImV4cCI6MjEwNzQxMjg4NX0.OJ_oDBnF7mIA16DE_5MxyJQRkfGaEMEueAwiIuXKnWQ';
const SUPABASE_KEY = rawSupabaseKey.trim().replace(/^["']|["']$/g, '');
process.env.SUPABASE_KEY = SUPABASE_KEY;
process.env.VITE_SUPABASE_KEY = SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: {
      apikey: SUPABASE_KEY,
    },
  },
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Detecção da porta: respeita estritamente a variável injetada pelo Cloud Run
function getPort(): number {
  const args = process.argv.slice(2);
  const portIdx = args.indexOf('--port');
  if (portIdx !== -1 && args[portIdx + 1]) {
    const parsed = parseInt(args[portIdx + 1], 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  const envPort = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  if (envPort === 8080) {
    return 3000;
  }
  return envPort || 3000;
}

const PORT = getPort();

const app = express();

app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Gabarita - Plataforma de Estudos para Concursos',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/editais', async (req, res) => {
  console.log('Buscando editais no Supabase...');
  try {
    const { data, error } = await supabase.from('editais').select('*');
    if (error) {
      console.error('Erro detalhado Supabase:', error);
      return res.json([]);
    }
    console.log(`Supabase retornou ${data?.length || 0} edital(is)`);
    res.json(data || []);
  } catch (err: any) {
    console.error('Erro detalhado Supabase (catch):', err?.message || err);
    res.json([]);
  }
});

app.post('/api/editais', async (req, res) => {
  console.log('Recebendo novo edital para inserção no Supabase...');
  try {
    const payload = req.body;
    if (!payload || !payload.titulo || !payload.orgao || !payload.cargo) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes (titulo, orgao, cargo).' });
    }
    const { data, error } = await supabase.from('editais').insert([payload]).select();
    if (error) {
      console.error('Erro ao inserir edital no Supabase via backend:', error);
      return res.status(500).json({ error: error.message });
    }
    console.log('Edital inserido com sucesso via backend:', data);
    res.status(201).json({ success: true, data: data?.[0] || data });
  } catch (err: any) {
    console.error('Erro na rota POST /api/editais:', err);
    res.status(500).json({ error: err?.message || 'Erro interno ao salvar edital' });
  }
});

app.get('/api/editais/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`Buscando edital por id ${id} no Supabase...`);
  try {
    const numericId = parseInt(id, 10);
    const queryId = isNaN(numericId) ? id : numericId;
    const { data, error } = await supabase.from('editais').select('*').eq('id', queryId).maybeSingle();
    if (error) {
      console.error('Erro ao buscar edital por id no Supabase:', error);
      return res.status(500).json({ error: error.message });
    }
    if (!data) {
      return res.status(404).json({ error: 'Edital não encontrado' });
    }
    res.json(data);
  } catch (err: any) {
    console.error('Erro detalhado Supabase getEditalById (catch):', err?.message || err);
    res.status(500).json({ error: err?.message || 'Erro interno' });
  }
});

app.post('/api/concursos', async (req, res) => {
  console.log('Recebendo novo concurso para inserção no Supabase...');
  try {
    const payload = req.body;
    if (!payload || !payload.title || !payload.organ) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes (title, organ).' });
    }
    // Se o novo concurso for ativo, desativa os outros concursos do usuário
    if (payload.user_id && (payload.active === true || payload.is_ativo === true)) {
      await supabase.from('concursos').update({ active: false }).eq('user_id', payload.user_id);
    }
    const { data, error } = await supabase.from('concursos').insert([payload]).select();
    if (error) {
      console.error('Erro ao inserir concurso no Supabase via backend:', error);
      return res.status(500).json({ error: error.message });
    }
    console.log('Concurso inserido com sucesso via backend:', data);
    res.status(201).json({ success: true, data: data?.[0] || data });
  } catch (err: any) {
    console.error('Erro na rota POST /api/concursos:', err);
    res.status(500).json({ error: err?.message || 'Erro interno ao salvar concurso' });
  }
});

// Endpoint: Edital parse via Gemini AI with heuristic fallback
app.post('/api/edital/parse', async (req, res) => {
  try {
    const { rawText, pdfBase64, cargo, concursoTitle } = req.body;
    if ((!rawText || typeof rawText !== 'string' || !rawText.trim()) && !pdfBase64) {
      return res.status(400).json({ error: 'Texto ou documento PDF do edital não fornecido.' });
    }
    const trimmedText = (rawText || '').trim();
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const { GoogleGenAI, Type } = await import('@google/genai');
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        const systemInstruction = `Você é o assistente oficial de análise e extração de editais do app Gabarita PRO.
Sua função é ler o PDF ou texto de um edital de concurso público e extrair o conteúdo programático do cargo solicitado, respeitando estritamente a pontuação e os pesos definidos no documento.

INSTRUÇÕES OBRIGATÓRIAS:

1. LOCALIZAÇÃO DO CARGO:
   - Identifique a seção de CONTEÚDO PROGRAMÁTICO / OBJETOS DE AVALIAÇÃO para o cargo solicitado.
   - Descarte conteúdos de outros cargos não solicitados.

2. DETERMINAÇÃO DO PESO DE CADA DISCIPLINA:
   - Localize a tabela do edital que descreve a estrutura das provas (geralmente sob os títulos "DO QUADRO DE PROVAS", "DAS PROVAS OBJETIVAS" ou "DOS CRITÉRIOS DE AVALIAÇÃO").
   - Se o edital expressar pesos distintos por disciplina ou por grupo de provas (ex: Básicos peso 1.0, Específicos peso 2.0 ou 3.0), aplique o peso oficial indicado na tabela.
   - Se o edital não atribuir peso (cada questão valer 1 ponto com peso idêntico para todas as matérias), preencha o valor padrão 1.0.

3. ESTRUTURA DOS TÓPICOS:
   - Extraia todas as disciplinas em letras maiúsculas.
   - Liste todos os tópicos e subtópicos preservando a numeração oficial do edital (ex: "1 Compreensão...", "1.1 Emprego...").
   - Não resuma, não junte linhas e não omita matérias.

FORMATO DE RESPOSTA OBRIGATÓRIO:
Responda EXCLUSIVAMENTE em formato JSON puro, sem blocos de código com markdown (sem \`\`\`json), seguindo a estrutura:
[
  {
    "nome": "NOME DA DISCIPLINA EM MAIÚSCULAS",
    "peso": 1.0,
    "topicos": [
      "1 Tópico principal",
      "1.1 Subtópico"
    ]
  }
]`;

        const promptText = `Extraia o conteúdo programático do edital conforme as instruções.
Cargo Solicitado: "${cargo || 'Cargo em Disputa / Analista'}"
Concurso/Órgão: "${concursoTitle || 'Certame'}"

${trimmedText && !trimmedText.startsWith('[Arquivo PDF') ? `CONTEÚDO DO EDITAL:\n\"\"\"\n${trimmedText.slice(0, 50000)}\n\"\"\"` : 'Analise o documento e extraia o conteúdo programático e os pesos da prova para o cargo indicado acima.'}`;

        const contents: any[] = [];
        if (pdfBase64 && typeof pdfBase64 === 'string') {
          contents.push({
            inlineData: {
              mimeType: 'application/pdf',
              data: pdfBase64,
            },
          });
        }
        contents.push(promptText);

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  nome: { type: Type.STRING },
                  peso: { type: Type.NUMBER },
                  topicos: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['nome', 'peso', 'topicos'],
              },
            },
          },
        });

        if (response.text) {
          let parsedRaw: any;
          try {
            parsedRaw = JSON.parse(response.text);
          } catch {
            const cleaned = response.text.replace(/```json/gi, '').replace(/```/g, '').trim();
            parsedRaw = JSON.parse(cleaned);
          }
          const rawItemsArray = Array.isArray(parsedRaw)
            ? parsedRaw
            : (parsedRaw.disciplinas || parsedRaw.edital || parsedRaw.syllabus || []);
          const sanitizedSyllabus: ParsedSyllabusItem[] = sanitizeSyllabusData(rawItemsArray);

          if (sanitizedSyllabus.length > 0) {
            const colors = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#14b8a6'];
            const mappedDisciplinas = sanitizedSyllabus.map((item, idx) => {
              return {
                name: item.nome,
                sigla: item.sigla,
                code: item.sigla,
                weight: item.peso || 1.0,
                color: colors[idx % colors.length],
                topicos: item.topicos.map(tStr => ({
                  name: tStr,
                  importance: 'alta' as const,
                  difficulty: 'media' as const,
                  subtopicos: []
                }))
              };
            });

            return res.json({
              source: 'gemini-ai',
              syllabus: sanitizedSyllabus,
              disciplinas: mappedDisciplinas,
              data: {
                concursoTitle: concursoTitle || 'Concurso Identificado',
                cargo: cargo || 'Cargo em Disputa',
                syllabus: sanitizedSyllabus,
                disciplinas: mappedDisciplinas
              }
            });
          }
        }
      } catch (aiErr) {
        console.warn('Gabarita Server: Erro na chamada Gemini API, acionando parser inteligente de contingência:', aiErr);
      }
    }

    // Fallback local robusto via editalParser
    const sanitizedSyllabus = parseSyllabusLocally(trimmedText);
    const colors = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#14b8a6'];
    const mappedDisciplinas = sanitizedSyllabus.map((item, idx) => {
      const upper = item.nome.toUpperCase();
      const isSpecific = upper.includes('ESPECÍF') || upper.includes('DIREITO') || upper.includes('CONTAB') || upper.includes('LEGISLAÇÃO');
      return {
        name: item.nome,
        sigla: item.sigla,
        code: item.sigla,
        weight: isSpecific ? 2.5 : 2.0,
        color: colors[idx % colors.length],
        topicos: item.topicos.map(tStr => ({
          name: tStr,
          importance: 'alta' as const,
          difficulty: 'media' as const,
          subtopicos: []
        }))
      };
    });

    const structured = {
      concursoTitle: concursoTitle || 'Certame Importado',
      cargo: cargo || 'Cargo Geral',
      syllabus: sanitizedSyllabus,
      disciplinas: mappedDisciplinas
    };

    return res.json({
      source: 'heuristic-parser',
      syllabus: sanitizedSyllabus,
      disciplinas: mappedDisciplinas,
      data: structured
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro interno ao processar edital.';
    console.error('Erro no parser de edital:', err);
    return res.status(500).json({ error: msg });
  }
});

// Endpoint: AI Assistant with sanitized user data handling
app.post('/api/ai/assistant', async (req, res) => {
  try {
    const { query, userData } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Pergunta não fornecida.' });
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });
        const prompt = `Você é o Assistente Especialista de Inteligência Artificial do "Gabarita", uma plataforma de estudos avançada para concursos públicos. Analise rigorosamente os DADOS REAIS DO USUÁRIO abaixo e responda à pergunta do usuário de forma clara, objetiva, motivadora e fundamentada exclusivamente nos dados. DADOS REAIS DO USUÁRIO (JSON): ${JSON.stringify(userData || {}, null, 2)} PERGUNTA DO USUÁRIO: "${query}" DIRETRIZES: 1. Responda estritamente com base nos dados fornecidos (horas, questões, revisões atrasadas, caderno de erros, evolução semanal, distribuição de tempo). 2. NUNCA invente dados ou suposições que não estejam presentes nos dados reais. Se faltarem dados, informe claramente. 3. Formate a resposta em Markdown limpo.`;
        
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });
        if (response.text) {
          return res.json({ reply: response.text, source: 'gemini-ai' });
        }
      } catch (aiErr) {
        console.warn('Gabarita Server: Erro no Gemini Assistant, usando fallback analítico:', aiErr);
      }
    }

    const fallbackReply = generateHeuristicAssistantReply(query, userData);
    return res.json({ reply: fallbackReply, source: 'heuristic-fallback' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro interno no assistente IA.';
    return res.status(500).json({ error: msg });
  }
});

function generateHeuristicAssistantReply(query: string, data: any): string {
  const q = query.toLowerCase();
  const stats = data?.stats || {};
  const revisoes = data?.revisoes || [];
  const caderno = data?.cadernoErros || [];
  const revisoesAtrasadas = revisoes.filter((r: any) => r.status === 'atrasada' || r.status === 'pendente').length;
  const totalErros = caderno.length;

  if (q.includes('estudar hoje') || q.includes('hoje')) {
    return `### 📚 O que estudar hoje\n\nCom base no seu ritmo atual:\n- **Horas hoje:** ${stats.horasHoje || 0}h registradas.\n- **Revisões pendentes/atrasadas:** ${revisoesAtrasadas} itens aguardando fixação na sua curva de esquecimento.\n\n*Recomendação:* Foque em concluir suas revisões espaçadas prioritárias do dia e dedique pelo menos 2 horas a uma disciplina de maior peso no seu edital.`;
  }
  if (q.includes('atrasada') || q.includes('revisões')) {
    return `### ⏰ Revisões & Matérias Atrasadas\n\n- Você possui **${revisoesAtrasadas} revisões** pendentes ou em atraso.\n- **Taxa de acerto global:** ${stats.taxaAcertoGeral || 0}%.\n\n*Recomendação:* Acesse a aba de **Revisões Espaçadas** para zerar sua fila e evitar o esquecimento de conteúdo acumulado.`;
  }
  if (q.includes('erros') || q.includes('questões')) {
    return `### ❌ Assuntos com Mais Erros\n\n- **Total no Caderno de Erros:** ${totalErros} itens reincidentes.\n- **Questões resolvidas no total:** ${stats.questoesTotal || 0} questões.\n\n*Recomendação:* Revise os fundamentos dos tópicos cadastrados no seu Caderno de Erros antes de realizar novos simulados.`;
  }
  if (q.includes('evolução') || q.includes('semanal') || q.includes('tempo')) {
    return `### 📈 Evolução Semanal & Distribuição de Tempo\n\n- **Horas na Semana:** ${stats.horasSemana || 0}h (Meta semanal em andamento).\n- **Sequência (Streak):** ${stats.streakDias || 0} dias consecutivos de estudos.\n- **Cobertura do Edital:** ${stats.percentualEdital || 0}%.\n\n*Recomendação:* Mantenha sua constância diária para proteger seu nível (${stats.tituloNivel || 'Concurseiro'}).`;
  }
  return `### 💡 Gabarita Assistant\n\nAnalisei seus dados atuais:\n- **Horas totais:** ${stats.horasTotal || 0}h\n- **Questões resolvidas:** ${stats.questoesTotal || 0}q\n- **Sequência:** ${stats.streakDias || 0} dias\n\nComo posso te ajudar especificamente hoje? (Pergunte sobre: o que estudar hoje, revisões atrasadas, assuntos com mais erros ou evolução semanal).`;
}

async function startServer() {
  const distPath = path.resolve(__dirname, 'dist');
  const isProd = process.env.NODE_ENV === 'production';

  let viteMiddleware: any = null;

  app.use((req, res, next) => {
    if (viteMiddleware) {
      return viteMiddleware(req, res, next);
    }
    next();
  });

  const portNumber = typeof PORT === 'string' ? parseInt(PORT, 10) : PORT;
  const server = app.listen(portNumber, '0.0.0.0', () => {
    console.log(`Gabarita server rodando com sucesso em http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err: any) => {
    console.error(`Erro no listener do servidor porta ${PORT}:`, err);
  });

  if (!isProd) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: false,
        },
        appType: 'spa',
      });
      viteMiddleware = vite.middlewares;
    } catch (viteErr) {
      console.warn('Vite dev server não pôde ser iniciado, usando fallback estático:', viteErr);
      if (fs.existsSync(distPath)) {
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
          res.sendFile(path.resolve(distPath, 'index.html'));
        });
      }
    }
  } else if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }
}

startServer().catch(err => {
  console.error('Erro ao iniciar servidor Gabarita:', err);
});

export default app;
