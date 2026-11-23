import { supabase } from './supabase';
import { ConcursoSphere, ConcursoStatus, AssuntoImportance, TopicDifficulty } from '../types';
import { generateSigla } from './editalParser';

export interface ExtractedDiscipline {
  name: string;
  weight: number;
  color: string;
  code?: string;
  sigla?: string;
  topicos: Array<{
    name: string;
    importance: AssuntoImportance;
    difficulty: TopicDifficulty;
    subtopicos?: string[];
    notes?: string;
  }>;
}

export interface SupabaseEdital {
  id: string;
  titulo?: string;
  title: string;
  orgao?: string;
  organ: string;
  cargo?: string;
  role: string;
  banca: string;
  esfera?: ConcursoSphere;
  sphere: ConcursoSphere;
  status: ConcursoStatus;
  data_prova?: string;
  examDate?: string;
  remuneracao?: number;
  remuneration?: number;
  vagas?: number;
  vacantPositions?: number;
  editalUrl?: string;
  notes?: string;
  materias?: any;
  disciplinas?: any;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

/**
 * Agrupador Dinâmico Universal para o campo "materias" (JSON, string ou Array) do Supabase
 */
export function processarGradeEdital(raw: any): ExtractedDiscipline[] {
  if (!raw) return [];
  let dados = raw;

  if (typeof dados === 'string') {
    try {
      dados = JSON.parse(dados);
    } catch (e) {
      console.error('Erro parse:', e);
      return [];
    }
  }

  // Garante que seja tratado como array mesmo se vier um objeto único
  let itens: any[] = [];
  if (Array.isArray(dados)) {
    itens = dados;
  } else if (dados && typeof dados === 'object') {
    if (Array.isArray(dados.materias)) itens = dados.materias;
    else if (Array.isArray(dados.disciplinas)) itens = dados.disciplinas;
    else if (Array.isArray(dados.items)) itens = dados.items;
    else if (Array.isArray(dados.data)) itens = dados.data;
    else itens = [dados];
  } else {
    return [];
  }

  if (itens.length === 0) return [];

  const defaultColors = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#14b8a6'];

  // Se já estiver agrupado por matérias com array de topicos
  if (itens.length > 0 && itens.every(item => item && Array.isArray(item.topicos))) {
    return itens.map((m: any, idx: number) => {
      const nomeMateria = String(m.nome || m.disciplina || m.materia || m.name || `Matéria ${idx + 1}`).trim();
      const pesoVal = typeof m.peso === 'number' ? m.peso : (typeof m.weight === 'number' ? m.weight : (parseFloat(m.peso || m.weight) || 2.0));
      const sigla = generateSigla(nomeMateria);
      const topicosArray = m.topicos.filter(Boolean).map((t: any) => {
        if (typeof t === 'string') {
          return { name: t.trim(), importance: 'alta' as const, difficulty: 'media' as const, subtopicos: [] };
        }
        return {
          name: String(t.name || t.titulo || t.nome || t.topico || '').trim(),
          importance: (t.importance || t.importancia || 'alta') as any,
          difficulty: (t.difficulty || t.dificuldade || 'media') as any,
          subtopicos: Array.isArray(t.subtopicos) ? t.subtopicos : []
        };
      }).filter((t: any) => t.name.length > 0);

      return {
        name: nomeMateria,
        weight: pesoVal,
        color: m.color || m.cor || defaultColors[idx % defaultColors.length],
        code: sigla,
        sigla,
        topicos: topicosArray
      };
    });
  }

  // Agrupamento dinâmico por disciplina
  const mapaDisciplinas = new Map<string, { nome: string; peso: number; color: string; sigla: string; topicos: any[] }>();
  let colorIdx = 0;

  for (const item of itens) {
    if (!item) continue;
    if (typeof item === 'string') {
      const nomeMateria = 'Conhecimentos Gerais';
      if (!mapaDisciplinas.has(nomeMateria)) {
        const sigla = generateSigla(nomeMateria);
        mapaDisciplinas.set(nomeMateria, {
          nome: nomeMateria,
          peso: 2.0,
          color: defaultColors[colorIdx++ % defaultColors.length],
          sigla,
          topicos: []
        });
      }
      mapaDisciplinas.get(nomeMateria)!.topicos.push({ name: item.trim(), importance: 'alta', difficulty: 'media', subtopicos: [] });
      continue;
    }

    const nomeMateria = String(item.disciplina || item.materia || item.subject || item.disciplina_nome || item.materia_nome || item.nome_disciplina || 'Conhecimentos Gerais').trim();
    let tituloTopico = String(item.titulo || item.topico || item.nome || item.name || item.assunto || '').trim();
    const codigo = item.codigo || item.code || item.ordem;

    if (codigo && tituloTopico && !tituloTopico.startsWith(String(codigo))) {
      tituloTopico = `${codigo}. ${tituloTopico}`;
    }

    if (!mapaDisciplinas.has(nomeMateria)) {
      const sigla = generateSigla(nomeMateria);
      mapaDisciplinas.set(nomeMateria, {
        nome: nomeMateria,
        peso: typeof item.peso === 'number' ? item.peso : (typeof item.weight === 'number' ? item.weight : (parseFloat(item.peso || item.weight) || 2.0)),
        color: item.color || item.cor || defaultColors[colorIdx++ % defaultColors.length],
        sigla,
        topicos: []
      });
    }

    if (tituloTopico) {
      mapaDisciplinas.get(nomeMateria)!.topicos.push({
        name: tituloTopico,
        importance: (item.importance || item.importancia || 'alta') as any,
        difficulty: (item.difficulty || item.dificuldade || 'media') as any,
        subtopicos: Array.isArray(item.subtopicos) ? item.subtopicos : []
      });
    }
  }

  return Array.from(mapaDisciplinas.values()).map(group => ({
    name: group.nome,
    weight: group.peso,
    color: group.color,
    code: group.sigla,
    sigla: group.sigla,
    topicos: group.topicos
  }));
}

export const normalizarMaterias = processarGradeEdital;

export class SupabaseEditaisService {
  /**
   * Consulta os editais da rota /api/editais e diretamente do Supabase.
   * Inclui logs de console conforme solicitado.
   */
  static async getEditais(): Promise<SupabaseEdital[]> {
    console.log('Iniciando fetch para /api/editais');
    let rawList: any[] = [];

    // 1. Tenta a rota de backend /api/editais
    try {
      const res = await fetch('/api/editais', {
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const json = await res.json();
        console.log('Resultado retornado da rota /api/editais:', json);
        const items = Array.isArray(json) ? json : (json.editais || []);
        if (items.length > 0) {
          rawList = items;
        }
      } else {
        console.warn('Resposta não-ok da rota /api/editais:', res.status, res.statusText);
      }
    } catch (err) {
      console.error('Erro no fetch /api/editais:', err);
    }

    // 2. Se a rota de backend não retornou registros (por exemplo, devido a restrições de rede/DNS no container),
    // faz a consulta direta no Supabase a partir do navegador do cliente
    if (rawList.length === 0) {
      console.log('Iniciando busca direta no Supabase pelo navegador...');
      try {
        const { data, error } = await supabase.from('editais').select('*');
        if (error) {
          console.error('Erro detalhado Supabase (navegador):', error);
        } else if (Array.isArray(data) && data.length > 0) {
          console.log('Editais retornados com sucesso diretamente do Supabase no navegador:', data);
          rawList = data;
        } else {
          console.log('Nenhum registro encontrado no Supabase (navegador).');
        }
      } catch (browserErr) {
        console.error('Exceção na requisição direta ao Supabase:', browserErr);
      }
    }

    // Normalização dos dados retornado do Supabase
    return rawList.map((item: any, idx: number) => this.normalizeEdital(item, idx));
  }

  static normalizeEdital(item: any, idx = 0): SupabaseEdital {
    const organ = String(item.orgao || item.organ || item.instituicao || '').trim();
    const role = String(item.cargo || item.role || '').trim();
    const title = String(
      item.titulo || item.title || item.nome || (role ? `${organ} - ${role}` : organ) || `Edital #${idx + 1}`
    ).trim();

    const materias = item.materias ?? item.disciplinas ?? item.conteudo_programatico ?? item.syllabus ?? [];
    const extractedDisciplines = normalizarMaterias(materias);

    const parsedRemuneracao = item.salario_maximo != null ? parseFloat(item.salario_maximo) : (item.remuneracao != null ? parseFloat(item.remuneracao) : (item.salario != null ? parseFloat(item.salario) : (item.remuneration != null ? parseFloat(item.remuneration) : undefined)));

    return {
      id: String(item.id ?? `edital_${idx + 1}`),
      titulo: title,
      title,
      orgao: organ,
      organ,
      cargo: role,
      role,
      banca: String(item.banca || item.banca_examinadora || 'A Definir').trim(),
      esfera: item.esfera || item.sphere || (organ.toLowerCase().includes('cgu') || organ.toLowerCase().includes('uniao') ? 'Federal' : 'Estadual'),
      sphere: item.sphere || item.esfera || (organ.toLowerCase().includes('cgu') || organ.toLowerCase().includes('uniao') ? 'federal' : 'estadual'),
      status: item.status || item.situacao || 'edital_publicado',
      data_prova: item.data_prova || item.exam_date || item.examDate,
      examDate: item.exam_date || item.examDate || item.data_prova,
      remuneracao: parsedRemuneracao,
      remuneration: parsedRemuneracao,
      salario_maximo: item.salario_maximo ?? parsedRemuneracao,
      salario: item.salario ?? parsedRemuneracao,
      vagas: item.vagas != null ? parseInt(item.vagas, 10) : (item.vacant_positions != null ? parseInt(item.vacant_positions, 10) : undefined),
      vacantPositions: item.vacant_positions != null ? parseInt(item.vacant_positions, 10) : (item.vagas != null ? parseInt(item.vagas, 10) : undefined),
      editalUrl: item.edital_url || item.editalUrl || item.link_edital || item.url || '',
      notes: item.notes || item.observacoes || '',
      observacoes: item.observacoes || item.notes || '',
      materias,
      disciplinas: extractedDisciplines,
    };
  }

  /**
   * Busca um edital específico utilizando seu id (int8) da tabela editais
   */
  static async getEditalById(id: number | string): Promise<SupabaseEdital | null> {
    const queryId = String(id);
    console.log(`[SupabaseEditaisService] Buscando edital por id (int8):`, queryId);

    // 1. Consulta direta no Supabase pelo id (int8)
    try {
      const { data, error } = await supabase
        .from('editais')
        .select('*')
        .eq('id', queryId)
        .maybeSingle();

      if (!error && data) {
        console.log('[SupabaseEditaisService] Edital encontrado no Supabase por id:', data);
        return this.normalizeEdital(data);
      }
      if (error) {
        console.warn('[SupabaseEditaisService] Erro ao buscar edital no Supabase:', error.message);
      }
    } catch (e) {
      console.warn('[SupabaseEditaisService] Exceção ao buscar edital por id no Supabase:', e);
    }

    // 2. Consulta de contingência via backend /api/editais/:id
    try {
      const res = await fetch(`/api/editais/${encodeURIComponent(queryId)}`);
      if (res.ok) {
        const json = await res.json();
        if (json && !json.error) {
          console.log('[SupabaseEditaisService] Edital encontrado via backend por id:', json);
          return this.normalizeEdital(json);
        }
      }
    } catch (apiErr) {
      console.warn('[SupabaseEditaisService] Falha na consulta backend de edital por id:', apiErr);
    }

    return null;
  }

  static async getCatalogSyllabus(edital: SupabaseEdital): Promise<{
    edital: SupabaseEdital;
    disciplinas: ExtractedDiscipline[];
  }> {
    const current = await this.getEditalById(edital.id);
    if (current?.id === edital.id) {
      const disciplinas = this.mapToExtractedDisciplines(current);
      if (disciplinas.length > 0) return { edital: current, disciplinas };
    }
    return { edital, disciplinas: this.mapToExtractedDisciplines(edital) };
  }

  static mapToExtractedDisciplines(edital: any): ExtractedDiscipline[] {
    if (!edital) return [];
    return normalizarMaterias(edital.materias ?? edital.disciplinas);
  }
}
