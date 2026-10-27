import { 
  UserProfile, 
  Concurso, 
  Disciplina, 
  Assunto, 
  SessaoEstudo, 
  Revisao, 
  Questao, 
  Meta, 
  Simulado, 
  Notificacao, 
  Prova, 
  ProvaStatus,
  Subtopico, 
  TopicStatus, 
  TopicDifficulty, 
  AssuntoImportance,
  EditalAiImportPayload, 
  StudyPlan, 
  PlannedSession, 
  WeeklyAvailability, 
  PlanSessionStatus, 
  StudyCycle, 
  CycleBlock,
  RegistroBlocoQuestoes,
  ItemCadernoErros,
  MotivoErro,
  ErroStatusRevisao,
  RevisionSettings,
  RevisionRating,
  SimuladoQuestao,
  SimuladoDesempenhoDisciplina,
  SimuladoDisciplinaConfig,
  SimuladoStatus,
  Conquista,
  MarcoEstudo,
  EstatisticasProgressoReal,
  StudyMethod,
  Deck,
  Flashcard
} from '../types';
import { 
  INITIAL_USER, 
  INITIAL_CONCURSOS, 
  INITIAL_DISCIPLINAS, 
  INITIAL_ASSUNTOS, 
  INITIAL_REVISOES, 
  INITIAL_REVISION_SETTINGS, 
  INITIAL_QUESTOES, 
  INITIAL_METAS, 
  INITIAL_CONQUISTAS, 
  INITIAL_MARCOS, 
  INITIAL_SIMULADOS, 
  INITIAL_NOTIFICACOES, 
  INITIAL_PROVAS, 
  INITIAL_SESSOES, 
  INITIAL_STUDY_PLAN, 
  INITIAL_STUDY_CYCLE, 
  INITIAL_BLOCOS_QUESTOES, 
  INITIAL_CADERNO_ERROS 
} from './seedData';
import { PlannerService } from './plannerService';
import { CycleService } from './cycleService';
import { supabase } from './supabaseClient';

const STORAGE_KEYS = {
  USER: 'gabarita_user',
  CONCURSOS: 'gabarita_concursos',
  ACTIVE_CONTEST: 'gabarita_active_contest',
  DISCIPLINAS: 'gabarita_disciplinas',
  ASSUNTOS: 'gabarita_assuntos',
  SESSOES: 'gabarita_sessoes',
  REVISOES: 'gabarita_revisoes',
  REVISION_SETTINGS: 'gabarita_revision_settings',
  QUESTOES: 'gabarita_questoes',
  BLOCOS_QUESTOES: 'gabarita_blocos_questoes',
  CADERNO_ERROS: 'gabarita_caderno_erros',
  METAS: 'gabarita_metas',
  CONQUISTAS: 'gabarita_conquistas',
  MARCOS: 'gabarita_marcos',
  SIMULADOS: 'gabarita_simulados',
  NOTIFICACOES: 'gabarita_notificacoes',
  PROVAS: 'gabarita_provas',
  STUDY_PLAN: 'gabarita_study_plan',
  STUDY_CYCLE: 'gabarita_study_cycle',
  DECKS: '@gabarita:decks',
  FLASHCARDS: '@gabarita:flashcards',
};

// Limpeza automática de dados fictícios legados, disciplinas órfãs ou sem concursoId válido
function checkLegacyCleanup() {
  try {
    const rawConcursos = localStorage.getItem(STORAGE_KEYS.CONCURSOS);
    const rawUser = localStorage.getItem(STORAGE_KEYS.USER);
    if (
      (rawConcursos && rawConcursos.includes('conc_tcu_2026')) ||
      (rawUser && rawUser.includes('conc_tcu_2026'))
    ) {
      Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
      localStorage.removeItem('gabarita_active_contest');
      return;
    }

    // Regra estrita de isolamento e higienização:
    // Remove qualquer matéria de exemplo pré-carregada ou órfã que não pertença a um concurso existente
    const concursos: Concurso[] = rawConcursos ? JSON.parse(rawConcursos) : [];
    const validConcursoIds = new Set(concursos.map(c => c.id).filter(Boolean));

    const rawDisciplinas = localStorage.getItem(STORAGE_KEYS.DISCIPLINAS);
    if (rawDisciplinas) {
      const disciplinas: Disciplina[] = JSON.parse(rawDisciplinas);
      // Mantém exclusivamente matérias que possuam concursoId válido pertencente à lista de concursos cadastrados
      const cleanedDisciplinas = disciplinas.filter(d => Boolean(d.concursoId && validConcursoIds.has(d.concursoId)));
      
      if (cleanedDisciplinas.length !== disciplinas.length) {
        localStorage.setItem(STORAGE_KEYS.DISCIPLINAS, JSON.stringify(cleanedDisciplinas));
        
        // Remove também assuntos órfãos de disciplinas que foram excluídas
        const validDiscIds = new Set(cleanedDisciplinas.map(d => d.id));
        const rawAssuntos = localStorage.getItem(STORAGE_KEYS.ASSUNTOS);
        if (rawAssuntos) {
          const assuntos: Assunto[] = JSON.parse(rawAssuntos);
          const cleanedAssuntos = assuntos.filter(a => validDiscIds.has(a.disciplinaId));
          localStorage.setItem(STORAGE_KEYS.ASSUNTOS, JSON.stringify(cleanedAssuntos));
        }
      }
    }

    // Limpeza de Flashcards e Baralhos fictícios de demonstração
    const mockCardIds = new Set(['card-1', 'card-2', 'card-3', 'card-4']);
    const mockDeckIds = new Set(['deck-1', 'deck-2', 'deck-3']);
    const rawFlashcards = localStorage.getItem('@gabarita:flashcards');
    if (rawFlashcards) {
      try {
        const cards = JSON.parse(rawFlashcards);
        if (Array.isArray(cards)) {
          const cleaned = cards.filter((c: any) => !mockCardIds.has(c.id));
          if (cleaned.length !== cards.length) {
            localStorage.setItem('@gabarita:flashcards', JSON.stringify(cleaned));
          }
        }
      } catch {
        localStorage.removeItem('@gabarita:flashcards');
      }
    }
    const rawDecks = localStorage.getItem('@gabarita:decks');
    if (rawDecks) {
      try {
        const decks = JSON.parse(rawDecks);
        if (Array.isArray(decks)) {
          const cleaned = decks.filter((d: any) => !mockDeckIds.has(d.id));
          if (cleaned.length !== decks.length) {
            localStorage.setItem('@gabarita:decks', JSON.stringify(cleaned));
          }
        }
      } catch {
        localStorage.removeItem('@gabarita:decks');
      }
    }
    // Limpeza de provas de demonstração antigas
    const rawProvas = localStorage.getItem(STORAGE_KEYS.PROVAS);
    if (rawProvas && (rawProvas.includes('prova_tcego_2026') || rawProvas.includes('prova_pf_2026') || rawProvas.includes('prova_inss_2025'))) {
      localStorage.removeItem(STORAGE_KEYS.PROVAS);
      localStorage.removeItem('@gabarita:provas_seeded_v2');
    }
    // Remove qualquer resquício de sessão mock legada
    localStorage.removeItem('gabarita_auth_session_v2');
  } catch (err) {
    console.warn('Gabarita: Falha na limpeza de dados legados:', err);
  }
}
checkLegacyCleanup();

async function getCurrentUserId(): Promise<string> {
  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.user?.id) {
      return data.session.user.id;
    }
  } catch {}
  try {
    const stored = localStorage.getItem('gabarita_user');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.id) return parsed.id;
    }
  } catch {}
  return '';
}

function mapConcursoFromDb(row: any): Concurso {
  const organ = (row.organ || row.orgao || row.nome || '').trim();
  const title = (row.title && row.title.length === 1 && organ.length > 1)
    ? (row.role ? `${organ} - ${row.role}` : organ)
    : (row.title || row.titulo || organ);
  return {
    id: row.id,
    userId: row.user_id,
    title: title || row.title,
    titulo: title || row.titulo,
    organ: organ || row.organ,
    orgao: organ || row.orgao,
    nome: organ || row.nome,
    role: row.role || '',
    banca: row.banca || 'FGV',
    sphere: row.sphere || 'federal',
    remuneration: Number(row.remuneration || 0),
    vacantPositions: Number(row.vacant_positions || 0),
    status: row.status || 'autorizado',
    examDate: row.exam_date || undefined,
    registrationStartDate: row.registration_start_date || undefined,
    registrationEndDate: row.registration_end_date || undefined,
    editalUrl: row.edital_url || undefined,
    active: Boolean(row.active),
    isAtivo: Boolean(row.active),
    is_ativo: Boolean(row.active),
    notes: row.notes || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

function mapDisciplinaFromDb(row: any): Disciplina {
  return {
    id: row.id,
    concursoId: row.concurso_id || undefined,
    name: row.name,
    code: row.code || undefined,
    color: row.color || '#10b981',
    icon: row.icon || 'BookOpen',
    weight: Number(row.weight || 2.0),
    order: Number(row.order || 1),
    topicsCount: Number(row.topics_count || 0),
    completedTopicsCount: Number(row.completed_topics_count || 0),
    totalStudyMinutes: Number(row.total_study_minutes || 0),
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function mapAssuntoFromDb(row: any): Assunto {
  return {
    id: row.id,
    disciplinaId: row.disciplina_id,
    name: row.name,
    order: Number(row.order || 1),
    importance: row.importance || 'alta',
    difficulty: row.difficulty || 'media',
    status: row.status || 'nao_iniciado',
    masteryLevel: Number(row.mastery_level || 0),
    totalQuestionsSolved: Number(row.total_questions_solved || 0),
    correctQuestionsSolved: Number(row.correct_questions_solved || 0),
    accuracyRate: Number(row.accuracy_rate || 0),
    completed: Boolean(row.completed),
    link: row.link || undefined,
    notes: row.notes || undefined,
    lastStudiedAt: row.last_studied_at || undefined,
    subtopicos: Array.isArray(row.subtopicos) ? row.subtopicos : [],
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function mapProvaFromDb(row: any): Prova {
  return {
    id: row.id,
    concursoId: row.concurso_id || undefined,
    organ: row.organ,
    banca: row.banca,
    year: Number(row.year),
    role: row.role,
    questionsCount: Number(row.questions_count || 0),
    durationMinutes: Number(row.duration_minutes || 0),
    examDate: row.exam_date || undefined,
    category: row.category || 'GERAL',
    status: row.status || 'agendada',
    notes: row.notes || undefined,
    fileUrl: row.file_url || undefined,
    templateFileUrl: row.template_file_url || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function mapSessaoFromDb(row: any): SessaoEstudo {
  return {
    id: row.id,
    userId: row.user_id,
    disciplinaId: row.disciplina_id,
    assuntoId: row.assunto_id || undefined,
    disciplinaName: row.disciplina_name,
    assuntoName: row.assunto_name,
    durationMinutes: Number(row.duration_minutes),
    plannedMinutes: row.planned_minutes ? Number(row.planned_minutes) : undefined,
    type: row.type || 'teoria',
    questionsAttempted: row.questions_attempted !== null ? Number(row.questions_attempted) : undefined,
    questionsCorrect: row.questions_correct !== null ? Number(row.questions_correct) : undefined,
    accuracyRate: row.accuracy_rate !== null ? Number(row.accuracy_rate) : undefined,
    notes: row.notes || undefined,
    teoriaFinalizada: Boolean(row.teoria_finalizada),
    pageIntervals: Array.isArray(row.page_intervals) ? row.page_intervals : undefined,
    videoaulas: Array.isArray(row.videoaulas) ? row.videoaulas : undefined,
    completedAt: row.completed_at || new Date().toISOString(),
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function mapRevisaoFromDb(row: any): Revisao {
  return {
    id: row.id,
    userId: row.user_id,
    disciplinaId: row.disciplina_id,
    assuntoId: row.assunto_id || undefined,
    disciplinaName: row.disciplina_name,
    assuntoName: row.assunto_name,
    method: row.method || 'intervalada',
    stage: row.stage ? Number(row.stage) : 1,
    totalStages: row.total_stages ? Number(row.total_stages) : 5,
    intervalDays: row.interval_days ? Number(row.interval_days) : 1,
    scheduledFor: row.scheduled_for,
    completedAt: row.completed_at || undefined,
    status: row.status || 'pendente',
    rating: row.rating || undefined,
    accuracyRate: row.accuracy_rate !== null ? Number(row.accuracy_rate) : undefined,
    questionsAttempted: row.questions_attempted !== null ? Number(row.questions_attempted) : undefined,
    questionsCorrect: row.questions_correct !== null ? Number(row.questions_correct) : undefined,
    notes: row.notes || undefined,
    isAutomatic: Boolean(row.is_automatic),
    nextRevisionId: row.next_revision_id || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || undefined,
  };
}

function mapBlocoFromDb(row: any): RegistroBlocoQuestoes {
  return {
    id: row.id,
    userId: row.user_id,
    disciplinaId: row.disciplina_id,
    disciplinaName: row.disciplina_name,
    assuntoId: row.assunto_id || undefined,
    assuntoName: row.assunto_name || undefined,
    banca: row.banca || 'FGV',
    difficulty: row.difficulty || 'media',
    totalQuestions: Number(row.total_questions),
    correctAnswers: Number(row.correct_answers),
    wrongAnswers: Number(row.wrong_answers),
    doubtCount: row.doubt_count ? Number(row.doubt_count) : 0,
    accuracyRate: Number(row.accuracy_rate),
    date: row.date,
    durationMinutes: row.duration_minutes ? Number(row.duration_minutes) : undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function mapCadernoFromDb(row: any): ItemCadernoErros {
  return {
    id: row.id,
    userId: row.user_id,
    blocoQuestoesId: row.bloco_questoes_id || undefined,
    statementOrExcerpt: row.statement_or_excerpt,
    disciplinaId: row.disciplina_id,
    disciplinaName: row.disciplina_name,
    assuntoId: row.assunto_id || undefined,
    assuntoName: row.assunto_name,
    banca: row.banca || undefined,
    difficulty: row.difficulty || 'media',
    motivo: row.motivo || 'falta_atencao',
    observation: row.observation || '',
    correctAnswer: row.correct_answer || undefined,
    questionUrl: row.question_url || undefined,
    statusRevisao: row.status_revisao || 'pendente',
    reincidenciaCount: Number(row.reincidencia_count || 1),
    lastReviewedAt: row.last_reviewed_at || undefined,
    nextReviewAt: row.next_review_at || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

function mapMetaFromDb(row: any): Meta {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    targetType: row.target_type,
    targetValue: Number(row.target_value),
    currentValue: Number(row.current_value || 0),
    unit: row.unit,
    deadline: row.deadline,
    period: row.period || 'semanal',
    status: row.status || 'em_progresso',
    autoCalculate: Boolean(row.auto_calculate),
    completedAt: row.completed_at || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function mapSimuladoFromDb(row: any): Simulado {
  return {
    id: row.id,
    userId: row.user_id,
    concursoId: row.concurso_id || undefined,
    concursoName: row.concurso_name || undefined,
    title: row.title,
    description: row.description || undefined,
    banca: row.banca || 'FGV',
    modalidade: row.modalidade || 'multipla_escolha',
    cebraspePenalty: Boolean(row.cebraspe_penalty),
    questionsCount: Number(row.questions_count),
    durationMinutes: Number(row.duration_minutes),
    timeRemainingSeconds: row.time_remaining_seconds ? Number(row.time_remaining_seconds) : undefined,
    elapsedSeconds: row.elapsed_seconds ? Number(row.elapsed_seconds) : undefined,
    disciplinasConfig: Array.isArray(row.disciplinas_config) ? row.disciplinas_config : [],
    questoes: Array.isArray(row.questoes) ? row.questoes : [],
    score: row.score !== null ? Number(row.score) : undefined,
    maxScore: Number(row.max_score),
    accuracyRate: row.accuracy_rate !== null ? Number(row.accuracy_rate) : undefined,
    totalCorrect: row.total_correct !== null ? Number(row.total_correct) : undefined,
    totalWrong: row.total_wrong !== null ? Number(row.total_wrong) : undefined,
    totalBlank: row.total_blank !== null ? Number(row.total_blank) : undefined,
    status: row.status || 'agendado',
    startedAt: row.started_at || undefined,
    finishedAt: row.finished_at || undefined,
    desempenhoPorDisciplina: Array.isArray(row.desempenho_por_disciplina) ? row.desempenho_por_disciplina : [],
    feedback: row.feedback || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || undefined,
  };
}

function mapDeckFromDb(row: any): Deck {
  return {
    id: row.id,
    disciplina: row.disciplina,
    nome: row.nome,
    totalCards: Number(row.total_cards || 0),
    pendentesHoje: Number(row.pendentes_hoje || 0),
    icone: row.icone || 'Layers',
  };
}

function mapFlashcardFromDb(row: any): Flashcard {
  return {
    id: row.id,
    deckId: row.deck_id,
    disciplina: row.disciplina,
    topico: row.topico || undefined,
    frente: row.frente,
    verso: row.verso,
    dificuldade: row.dificuldade || undefined,
    intervaloDias: Number(row.intervalo_dias || 1),
    proximaRevisao: row.proxima_revisao,
    revisoesTotal: Number(row.revisoes_total || 0),
    criadoEm: row.created_at || new Date().toISOString(),
  };
}

function mapStudyPlanFromDb(row: any): StudyPlan {
  return {
    id: row.id,
    userId: row.user_id,
    concursoId: row.concurso_id,
    concursoTitle: row.concurso_title,
    startDate: row.start_date || (row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
    targetExamDate: row.target_exam_date,
    dailyAverageMinutes: Number(row.daily_average_minutes || 240),
    totalWeeks: Number(row.total_weeks || 12),
    totalPlannedHours: Number(row.total_planned_hours || 288),
    weeklyAvailability: row.weekly_availability || { seg: 240, ter: 240, qua: 240, qui: 240, sex: 240, sab: 180, dom: 120 },
    disciplinasDistribution: Array.isArray(row.disciplinas_distribution) ? row.disciplinas_distribution : [],
    sessions: Array.isArray(row.sessions) ? row.sessions : [],
    conflicts: Array.isArray(row.conflicts) ? row.conflicts : [],
    historyLogs: Array.isArray(row.history_logs) ? row.history_logs : [],
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

function mapStudyCycleFromDb(row: any): StudyCycle {
  return {
    id: row.id,
    userId: row.user_id,
    concursoId: row.concurso_id,
    concursoTitle: row.concurso_title,
    currentBlockIndex: Number(row.current_block_index || 0),
    completedCyclesCount: Number(row.completed_cycles_count || 0),
    totalCycleMinutes: Number(row.total_cycle_minutes || 0),
    blocks: Array.isArray(row.blocks) ? row.blocks : [],
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

function loadStored<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch {
    return defaultValue;
  }
}

function saveStored<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`Gabarita: Erro ao persistir dados locais para a chave ${key}`, err);
  }
}

export class DatabaseService {
  // --- USER PROFILE & DATA ISOLATION ---
  static async getUserProfile(userId?: string): Promise<UserProfile> {
    const current = loadStored<UserProfile>(STORAGE_KEYS.USER, INITIAL_USER);
    const targetId = userId || await getCurrentUserId();
    if (targetId) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', targetId)
          .maybeSingle();

        if (!error && data) {
          const profile: UserProfile = {
            id: data.id,
            email: data.email || current.email,
            name: data.name || current.name,
            role: data.role || 'aluno',
            photoURL: data.photo_url || '',
            bio: data.bio || '',
            targetConcursoId: data.target_concurso_id || '',
            targetConcursoTitle: data.target_concurso_title || '',
            studyHoursPerDay: Number(data.study_hours_per_day || 4.0),
            streakDays: Number(data.streak_days || 0),
            lastStudyDate: data.last_study_date || '',
            xp: Number(data.xp || 0),
            level: Number(data.level || 1),
            preferences: data.preferences || current.preferences,
            subscription: data.subscription || current.subscription,
            createdAt: data.created_at || current.createdAt,
            updatedAt: data.updated_at || current.updatedAt,
          };
          saveStored(STORAGE_KEYS.USER, profile);
          return profile;
        }
      } catch (err) {
        console.warn('Gabarita: Falha ao carregar perfil do Supabase:', err);
      }
    }
    if (current && current.id !== targetId && targetId) {
      return { ...current, id: targetId };
    }
    return current;
  }

  static async updateUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    const current = loadStored<UserProfile>(STORAGE_KEYS.USER, INITIAL_USER);
    const updated: UserProfile = {
      ...current,
      ...profile,
      updatedAt: new Date().toISOString(),
    };
    saveStored(STORAGE_KEYS.USER, updated);

    getCurrentUserId().then(uid => {
      const targetId = updated.id || uid;
      if (targetId) {
        supabase.from('profiles').upsert({
          id: targetId,
          email: updated.email,
          name: updated.name,
          role: updated.role,
          photo_url: updated.photoURL || '',
          bio: updated.bio || '',
          target_concurso_id: updated.targetConcursoId || '',
          target_concurso_title: updated.targetConcursoTitle || '',
          study_hours_per_day: updated.studyHoursPerDay,
          streak_days: updated.streakDays,
          last_study_date: updated.lastStudyDate || null,
          xp: updated.xp,
          level: updated.level,
          preferences: updated.preferences,
          subscription: updated.subscription,
          updated_at: updated.updatedAt,
        }).then(({ error }) => {
          if (error) console.warn('Gabarita: Erro ao sincronizar perfil com Supabase:', error.message);
        });
      }
    });

    return updated;
  }

  // --- ACCOUNT DELETION (Prompt 18 Requirement) ---
  static async deleteAccountData(userId: string): Promise<void> {
    try {
      // Clear localStorage items
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      localStorage.removeItem('gabarita_auth_session');
    } catch (err) {
      console.warn('Erro ao excluir dados da conta:', err);
    }
  }

  // --- DATA EXPORT (Prompt 18 Requirement) ---
  static async exportUserData(userId: string): Promise<string> {
    const [user, concursos, disciplinas, assuntos, sessoes, revisoes, questoes, metas, simulados, caderno] = await Promise.all([
      this.getUserProfile(userId),
      this.getConcursos(),
      this.getDisciplinas(),
      this.getAssuntos(),
      this.getSessoes(),
      this.getRevisoes(),
      this.getQuestoes(),
      this.getMetas(),
      this.getSimulados(),
      this.getCadernoErros(),
    ]);

    const exportBundle = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      user,
      concursos,
      disciplinas,
      assuntos,
      sessoes,
      revisoes,
      questoes,
      metas,
      simulados,
      cadernoErros: caderno,
    };

    return JSON.stringify(exportBundle, null, 2);
  }

  // --- CONCURSOS ---
  static async getConcursos(): Promise<Concurso[]> {
    const rawStored = loadStored<Concurso[]>(STORAGE_KEYS.CONCURSOS, INITIAL_CONCURSOS);
    try {
      const { data, error } = await supabase
        .from('concursos')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const remoteList = data.map(mapConcursoFromDb);
        const remoteIds = new Set(remoteList.map(r => String(r.id)));
        const unsynced = rawStored.filter(item => !remoteIds.has(String(item.id)));
        const merged = [...remoteList, ...unsynced];

        let foundActive = false;
        const normalized = merged.map(c => {
          const isCand = Boolean(c.active || c.isAtivo || c.is_ativo);
          const isActive = isCand && !foundActive;
          if (isActive) foundActive = true;
          return {
            ...c,
            active: isActive,
            isAtivo: isActive,
            is_ativo: isActive,
          };
        });
        saveStored(STORAGE_KEYS.CONCURSOS, normalized);
        return normalized;
      }
    } catch (e) {
      console.warn('Gabarita: Falha ao buscar concursos do Supabase:', e);
    }

    let foundActive = false;
    return rawStored.map(c => {
      const organ = (c.organ || c.orgao || c.nome || '').trim();
      const title = (c.title && c.title.length === 1 && organ.length > 1)
        ? (c.role ? `${organ} - ${c.role}` : organ)
        : (c.title || c.titulo || organ);
      const isCandidateActive = Boolean(c.active || c.isAtivo || c.is_ativo);
      const isActive = isCandidateActive && !foundActive;
      if (isActive) foundActive = true;
      return {
        ...c,
        active: isActive,
        isAtivo: isActive,
        is_ativo: isActive,
        organ: organ || c.organ,
        orgao: organ || c.orgao,
        nome: organ || c.nome,
        title: title || c.title,
        titulo: title || c.titulo,
      };
    });
  }

  static async autoScheduleProvaForConcurso(concurso: Concurso): Promise<Prova | null> {
    if (!concurso.examDate) return null;
    const cleanDate = concurso.examDate.trim();
    if (!cleanDate) return null;

    try {
      const existingProvas = await this.getProvas();
      const alreadyScheduled = existingProvas.some(
        p => (p.concursoId && String(p.concursoId) === String(concurso.id)) ||
             (p.organ.toLowerCase().trim() === concurso.organ.toLowerCase().trim() &&
              p.role.toLowerCase().trim() === concurso.role.toLowerCase().trim() &&
              p.examDate?.split('T')[0] === cleanDate.split('T')[0])
      );
      if (alreadyScheduled) return null;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const examDateObj = cleanDate.includes('T') ? new Date(cleanDate) : new Date(`${cleanDate}T23:59:59`);
      const status: ProvaStatus = examDateObj < today ? 'concluida' : 'em_andamento';

      const yearFromDate = !isNaN(new Date(cleanDate).getFullYear())
        ? new Date(cleanDate).getFullYear()
        : new Date().getFullYear();

      const newProva = await this.addProva({
        concursoId: concurso.id,
        organ: concurso.organ,
        role: concurso.role,
        banca: concurso.banca || 'A Definir',
        year: yearFromDate,
        questionsCount: 100,
        durationMinutes: 240,
        examDate: cleanDate,
        category: 'CONCURSO',
        status,
        notes: `Agendamento automático gerado a partir do cadastro do edital ${concurso.organ} - ${concurso.role}.`,
      });

      return newProva;
    } catch (err) {
      console.warn('Gabarita: Erro no agendamento automático de prova:', err);
      return null;
    }
  }

  static async addConcurso(concurso: Omit<Concurso, 'id' | 'createdAt' | 'updatedAt'>): Promise<Concurso> {
    const list = await this.getConcursos();
    const organ = (concurso.organ || concurso.orgao || concurso.nome || '').trim();
    const cleanRole = (concurso.role || '').trim();
    const title = (concurso.title && concurso.title.length === 1 && organ.length > 1)
      ? (cleanRole ? `${organ} - ${cleanRole}` : organ)
      : (concurso.title || concurso.titulo || organ);

    const isNewActive = concurso.active !== undefined ? Boolean(concurso.active) : true;
    const nowIso = new Date().toISOString();
    const generatedId = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : `conc_${Date.now()}`;

    let newConcurso: Concurso = {
      ...concurso,
      id: generatedId,
      active: isNewActive,
      isAtivo: isNewActive,
      is_ativo: isNewActive,
      organ: organ || concurso.organ,
      orgao: organ || concurso.orgao,
      nome: organ || concurso.nome,
      title: title || concurso.title,
      titulo: title || concurso.titulo,
      role: cleanRole,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // 1. Executa o INSERT na tabela concursos gerando o novo registro antes de tentar qualquer ativação de foco
    const uid = await getCurrentUserId();
    if (uid) {
      try {
        if (isNewActive) {
          // Desmarca os demais concursos do usuário no Supabase para respeitar a regra de exclusividade
          await supabase.from('concursos').update({ active: false }).eq('user_id', uid);
        }

        const insertPayload: any = {
          id: newConcurso.id,
          user_id: uid,
          title: newConcurso.title,
          organ: newConcurso.organ,
          orgao: newConcurso.orgao,
          role: newConcurso.role,
          banca: newConcurso.banca,
          sphere: newConcurso.sphere,
          remuneration: newConcurso.remuneration,
          vacant_positions: newConcurso.vacantPositions,
          status: newConcurso.status,
          exam_date: newConcurso.examDate || null,
          registration_start_date: newConcurso.registrationStartDate || null,
          registration_end_date: newConcurso.registrationEndDate || null,
          edital_url: newConcurso.editalUrl || null,
          active: true,
          notes: newConcurso.notes || '',
          created_at: newConcurso.createdAt,
          updated_at: newConcurso.updatedAt,
        };

        const { data, error } = await supabase
          .from('concursos')
          .insert([insertPayload])
          .select()
          .maybeSingle();

        if (!error && data) {
          newConcurso = mapConcursoFromDb(data);
          newConcurso.active = true;
          newConcurso.isAtivo = true;
          newConcurso.is_ativo = true;
        } else if (error) {
          console.warn('Gabarita: Aviso no INSERT em concursos via Supabase client:', error.message);
          // Fallback via endpoint backend
          try {
            const beRes = await fetch('/api/concursos', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(insertPayload),
            });
            if (beRes.ok) {
              const beJson = await beRes.json();
              if (beJson.data) {
                newConcurso = mapConcursoFromDb(beJson.data);
                newConcurso.active = true;
                newConcurso.isAtivo = true;
                newConcurso.is_ativo = true;
              }
            }
          } catch (beErr) {
            console.warn('Gabarita: Falha no fallback backend de inserção:', beErr);
          }
        }
      } catch (insertErr) {
        console.warn('Gabarita: Exceção no INSERT de concursos:', insertErr);
      }
    }

    // 2. Regra de exclusividade no armazenamento local:
    // O novo concurso é colocado no topo como único ativo; os demais são desativados
    const updated = isNewActive
      ? [newConcurso, ...list.filter(c => String(c.id) !== String(newConcurso.id)).map(c => ({ ...c, active: false, isAtivo: false, is_ativo: false, updatedAt: new Date().toISOString() }))]
      : [newConcurso, ...list.filter(c => String(c.id) !== String(newConcurso.id))];

    saveStored(STORAGE_KEYS.CONCURSOS, updated);

    if (isNewActive) {
      await this.updateUserProfile({
        targetConcursoId: newConcurso.id,
        targetConcursoTitle: `${newConcurso.organ} - ${newConcurso.role}`,
      });
      await this.syncActiveContestStorage();
    }

    if (newConcurso.examDate) {
      try {
        await this.autoScheduleProvaForConcurso(newConcurso);
      } catch (e) {
        console.warn('Gabarita: Falha ao agendar prova automática para concurso:', e);
      }
    }

    return newConcurso;
  }

  static async updateConcurso(id: string, partial: Partial<Concurso>): Promise<Concurso> {
    const list = await this.getConcursos();
    let updatedItem: Concurso | null = null;
    const isActivating = partial.active === true || partial.isAtivo === true || partial.is_ativo === true;
    const updatedList = list.map(c => {
      if (String(c.id) === String(id)) {
        const activeVal = isActivating ? true : (partial.active !== undefined ? partial.active : (partial.isAtivo !== undefined ? partial.isAtivo : (partial.is_ativo !== undefined ? partial.is_ativo : c.active)));
        updatedItem = {
          ...c,
          ...partial,
          active: activeVal,
          isAtivo: activeVal,
          is_ativo: activeVal,
          updatedAt: new Date().toISOString(),
        };
        return updatedItem;
      }
      // Regra de exclusividade: ao ativar este concurso, desativa automaticamente os demais
      if (isActivating) {
        return {
          ...c,
          active: false,
          isAtivo: false,
          is_ativo: false,
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    });
    if (!updatedItem) throw new Error('Concurso não encontrado para atualização.');
    saveStored(STORAGE_KEYS.CONCURSOS, updatedList);

    const snakeObj: any = { updated_at: new Date().toISOString() };
    if (partial.title !== undefined) snakeObj.title = partial.title;
    if (partial.organ !== undefined) snakeObj.organ = partial.organ;
    if (partial.orgao !== undefined) snakeObj.orgao = partial.orgao;
    if (partial.role !== undefined) snakeObj.role = partial.role;
    if (partial.banca !== undefined) snakeObj.banca = partial.banca;
    if (partial.sphere !== undefined) snakeObj.sphere = partial.sphere;
    if (partial.remuneration !== undefined) snakeObj.remuneration = partial.remuneration;
    if (partial.vacantPositions !== undefined) snakeObj.vacant_positions = partial.vacantPositions;
    if (partial.status !== undefined) snakeObj.status = partial.status;
    if (partial.examDate !== undefined) snakeObj.exam_date = partial.examDate || null;
    if (partial.registrationStartDate !== undefined) snakeObj.registration_start_date = partial.registrationStartDate || null;
    if (partial.registrationEndDate !== undefined) snakeObj.registration_end_date = partial.registrationEndDate || null;
    if (partial.editalUrl !== undefined) snakeObj.edital_url = partial.editalUrl;
    if (isActivating) {
      snakeObj.active = true;
    } else if (partial.active !== undefined) {
      snakeObj.active = partial.active;
    }
    if (partial.notes !== undefined) snakeObj.notes = partial.notes;

    getCurrentUserId().then(uid => {
      if (uid && isActivating) {
        supabase.from('concursos').update({ active: false }).eq('user_id', uid).then(() => {
          supabase.from('concursos').update(snakeObj).eq('id', id);
        });
      } else {
        supabase.from('concursos').update(snakeObj).eq('id', id).then(({ error }) => {
          if (error) console.warn('Gabarita: Erro ao atualizar concurso no Supabase:', error.message);
        });
      }
    });

    if ((partial.title || partial.role) && (updatedItem as Concurso).active) {
      await this.updateUserProfile({
        targetConcursoTitle: `${(updatedItem as Concurso).organ} - ${(updatedItem as Concurso).role}`,
      });
    }

    if (partial.examDate && updatedItem) {
      try {
        await this.autoScheduleProvaForConcurso(updatedItem as Concurso);
      } catch (e) {
        console.warn('Gabarita: Falha ao agendar prova automática ao atualizar concurso:', e);
      }
    }

    return updatedItem;
  }

  static async deleteConcurso(id: string): Promise<Concurso[]> {
    const list = await this.getConcursos();
    const updatedList = list.filter(c => c.id !== id);
    saveStored(STORAGE_KEYS.CONCURSOS, updatedList);

    supabase.from('concursos').delete().eq('id', id).then(({ error }) => {
      if (error) console.warn('Gabarita: Erro ao remover concurso no Supabase:', error.message);
    });

    const provas = await this.getProvas();
    const updatedProvas = provas.filter(p => p.concursoId !== id);
    saveStored(STORAGE_KEYS.PROVAS, updatedProvas);

    // Limpeza estrita em cascata: remove todas as disciplinas e tópicos associados a este concurso
    const disciplinas = await this.getDisciplinas();
    const discIdsToDelete = new Set(disciplinas.filter(d => d.concursoId === id).map(d => d.id));
    const updatedDisciplinas = disciplinas.filter(d => d.concursoId !== id);
    saveStored(STORAGE_KEYS.DISCIPLINAS, updatedDisciplinas);

    const assuntos = await this.getAssuntos();
    const updatedAssuntos = assuntos.filter(a => !discIdsToDelete.has(a.disciplinaId));
    saveStored(STORAGE_KEYS.ASSUNTOS, updatedAssuntos);

    await this.syncActiveContestStorage();
    return updatedList;
  }

  static async getActiveConcurso(): Promise<Concurso | null> {
    const list = await this.getConcursos();
    if (list.length === 0) return null;
    const active = list.find(c => c.active);
    if (active) return active;
    const user = await this.getUserProfile();
    if (user?.targetConcursoId) {
      const match = list.find(c => c.id === user.targetConcursoId);
      if (match) return match;
    }
    return list[0] || null;
  }

  static async setActiveConcurso(id: string): Promise<{ concursos: Concurso[]; activeConcurso: Concurso }> {
    let list = await this.getConcursos();
    let target = list.find(c => String(c.id) === String(id));

    // Se não encontrou na lista, busca no storage local
    if (!target) {
      const localList = loadStored<Concurso[]>(STORAGE_KEYS.CONCURSOS, []);
      target = localList.find(c => String(c.id) === String(id));
      if (target) {
        list = [target, ...list.filter(c => String(c.id) !== String(id))];
      }
    }

    // Se ainda não encontrou, busca direto por ID no Supabase
    if (!target) {
      try {
        const { data } = await supabase.from('concursos').select('*').eq('id', id).maybeSingle();
        if (data) {
          target = mapConcursoFromDb(data);
          list = [target, ...list.filter(c => String(c.id) !== String(id))];
        }
      } catch {}
    }

    if (!target) {
      if (list.length > 0) {
        target = list[0];
      } else {
        throw new Error('Concurso não encontrado para ativação.');
      }
    }

    const activeConcurso: Concurso = {
      ...target,
      active: true,
      isAtivo: true,
      is_ativo: true,
      updatedAt: new Date().toISOString(),
    };

    // Regra de exclusividade: apenas o concurso selecionado terá active/isAtivo = true, os outros são desativados
    const updatedList = list.map(c => {
      const isActive = String(c.id) === String(activeConcurso.id);
      if (isActive) {
        return activeConcurso;
      }
      return { ...c, active: false, isAtivo: false, is_ativo: false, updatedAt: new Date().toISOString() };
    });

    saveStored(STORAGE_KEYS.CONCURSOS, updatedList);
    await this.updateUserProfile({
      targetConcursoId: activeConcurso.id,
      targetConcursoTitle: `${activeConcurso.organ} - ${activeConcurso.role}`,
    });
    await this.syncActiveContestStorage();

    // Sincroniza exclusividade no Supabase
    const uid = await getCurrentUserId();
    if (uid) {
      try {
        await supabase.from('concursos').update({ active: false }).eq('user_id', uid);
        await supabase.from('concursos').update({ active: true }).eq('id', activeConcurso.id);
      } catch (e) {
        console.warn('Gabarita: Erro ao sincronizar foco ativo no Supabase:', e);
      }
    }

    return { concursos: updatedList, activeConcurso };
  }

  // --- SINGLE SOURCE OF TRUTH (gabarita_active_contest) ---
  static async syncActiveContestStorage(): Promise<any> {
    const concursos = await this.getConcursos();
    const active = concursos.find(c => c.active) || concursos[0];
    if (!active) {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_CONTEST);
      return null;
    }
    const allDisciplinas = await this.getDisciplinas();
    const allAssuntos = await this.getAssuntos();
    const activeDisciplinas = allDisciplinas
      .filter(d => d.concursoId === active.id)
      .map(d => ({
        ...d,
        assuntos: allAssuntos.filter(a => a.disciplinaId === d.id),
      }));

    const bundle = {
      concurso: active,
      disciplinas: activeDisciplinas,
      updatedAt: new Date().toISOString(),
    };
    saveStored(STORAGE_KEYS.ACTIVE_CONTEST, bundle);
    return bundle;
  }

  static async getActiveContestBundle(): Promise<{
    concurso: Concurso;
    disciplinas: (Disciplina & { assuntos: Assunto[] })[];
    updatedAt: string;
  } | null> {
    const bundle = loadStored<any>(STORAGE_KEYS.ACTIVE_CONTEST, null);
    if (bundle && bundle.concurso) {
      return bundle;
    }
    return this.syncActiveContestStorage();
  }

  static async addConcursoWithDisciplinas(
    concursoData: Omit<Concurso, 'id' | 'createdAt' | 'updatedAt'>,
    disciplinasList: Array<{
      name: string;
      weight?: number;
      color?: string;
      code?: string;
      icon?: string;
      topicos?: Array<{
        name: string;
        importance?: AssuntoImportance;
        difficulty?: TopicDifficulty;
        subtopicos?: string[];
        notes?: string;
      }>;
    }>
  ): Promise<{ concurso: Concurso; disciplinas: Disciplina[]; assuntos: Assunto[] }> {
    // 1. Executa o INSERT na tabela concursos gerando o novo registro antes de tentar qualquer ativação de foco
    const newConcurso = await this.addConcurso({
      ...concursoData,
      active: true,
      isAtivo: true,
      is_ativo: true,
    });
    try {
      await this.setActiveConcurso(newConcurso.id);
    } catch (actErr) {
      console.warn('Gabarita: Ativação secundária finalizada por addConcurso:', actErr);
    }

    const createdDisciplinas: Disciplina[] = [];
    const createdAssuntos: Assunto[] = [];

    // 2. Criar Disciplinas e Tópicos vinculados
    const currentDisciplinas = await this.getDisciplinas();
    const currentAssuntos = await this.getAssuntos();

    const newDisciplinasList = [...currentDisciplinas];
    const newAssuntosList = [...currentAssuntos];

    for (let i = 0; i < disciplinasList.length; i++) {
      const discInput = disciplinasList[i];
      const discId = `disc_${Date.now()}_${i}`;
      const newDisc: Disciplina = {
        id: discId,
        concursoId: newConcurso.id,
        name: discInput.name,
        code: discInput.code || discInput.name.slice(0, 4).toUpperCase(),
        color: discInput.color || '#10b981',
        icon: discInput.icon || 'BookOpen',
        weight: discInput.weight || 2.0,
        order: newDisciplinasList.length + 1,
        topicsCount: discInput.topicos?.length || 0,
        completedTopicsCount: 0,
        totalStudyMinutes: 0,
        createdAt: new Date().toISOString(),
      };
      newDisciplinasList.push(newDisc);
      createdDisciplinas.push(newDisc);

      if (discInput.topicos && discInput.topicos.length > 0) {
        for (let j = 0; j < discInput.topicos.length; j++) {
          const topInput = discInput.topicos[j];
          const assId = `ass_${Date.now()}_${i}_${j}`;
          const newAssunto: Assunto = {
            id: assId,
            disciplinaId: discId,
            name: topInput.name,
            order: j + 1,
            masteryLevel: 0,
            totalQuestionsSolved: 0,
            correctQuestionsSolved: 0,
            accuracyRate: 0,
            completed: false,
            status: 'nao_iniciado',
            difficulty: topInput.difficulty || 'media',
            importance: topInput.importance || 'alta',
            notes: topInput.notes || '',
            subtopicos: (topInput.subtopicos || []).map((subName, sIdx) => ({
              id: `sub_${Date.now()}_${i}_${j}_${sIdx}`,
              assuntoId: assId,
              name: subName,
              order: sIdx + 1,
              status: 'nao_iniciado',
              completed: false,
              createdAt: new Date().toISOString(),
            })),
            createdAt: new Date().toISOString(),
          };
          newAssuntosList.push(newAssunto);
          createdAssuntos.push(newAssunto);
        }
      }
    }

    saveStored(STORAGE_KEYS.DISCIPLINAS, newDisciplinasList);
    saveStored(STORAGE_KEYS.ASSUNTOS, newAssuntosList);

    // 3. Sincronizar o JSON Gabarita Active Contest Single Source of Truth
    await this.syncActiveContestStorage();

    return {
      concurso: newConcurso,
      disciplinas: createdDisciplinas,
      assuntos: createdAssuntos,
    };
  }

  // --- PROVAS ANTERIORES CRUD ---
  static async getProvas(concursoId?: string): Promise<Prova[]> {
    try {
      let query = supabase.from('provas').select('*').order('created_at', { ascending: false });
      if (concursoId) {
        query = query.eq('concurso_id', concursoId);
      }
      const { data, error } = await query;
      if (!error && Array.isArray(data) && data.length > 0) {
        const list = data.map(mapProvaFromDb);
        saveStored(STORAGE_KEYS.PROVAS, list);
        return list;
      }
    } catch (e) {
      console.warn('Gabarita: Falha ao buscar provas do Supabase:', e);
    }

    const list = loadStored<Prova[]>(STORAGE_KEYS.PROVAS, INITIAL_PROVAS);
    if (concursoId) {
      return list.filter(p => p.concursoId === concursoId);
    }
    return list;
  }

  static async addProva(prova: Omit<Prova, 'id' | 'createdAt'>): Promise<Prova> {
    const list = await this.getProvas();
    const newProva: Prova = {
      ...prova,
      id: `prova_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newProva, ...list];
    saveStored(STORAGE_KEYS.PROVAS, updated);

    getCurrentUserId().then(uid => {
      if (uid) {
        supabase.from('provas').insert([{
          id: newProva.id,
          user_id: uid,
          concurso_id: newProva.concursoId || null,
          organ: newProva.organ,
          banca: newProva.banca,
          year: newProva.year,
          role: newProva.role,
          questions_count: newProva.questionsCount,
          duration_minutes: newProva.durationMinutes,
          exam_date: newProva.examDate || null,
          category: newProva.category || 'GERAL',
          status: newProva.status || 'agendada',
          notes: newProva.notes,
          file_url: newProva.fileUrl,
          template_file_url: newProva.templateFileUrl,
          created_at: newProva.createdAt,
        }]).then(({ error }) => {
          if (error) console.warn('Gabarita: Erro ao inserir prova no Supabase:', error.message);
        });
      }
    });

    return newProva;
  }

  static async updateProva(id: string, partial: Partial<Prova>): Promise<Prova> {
    const list = await this.getProvas();
    let updatedItem: Prova | null = null;
    const updated = list.map(p => {
      if (p.id === id) {
        updatedItem = { ...p, ...partial };
        return updatedItem;
      }
      return p;
    });
    if (!updatedItem) throw new Error('Prova não encontrada.');
    saveStored(STORAGE_KEYS.PROVAS, updated);

    const snakeObj: any = {};
    if (partial.organ !== undefined) snakeObj.organ = partial.organ;
    if (partial.banca !== undefined) snakeObj.banca = partial.banca;
    if (partial.year !== undefined) snakeObj.year = partial.year;
    if (partial.role !== undefined) snakeObj.role = partial.role;
    if (partial.questionsCount !== undefined) snakeObj.questions_count = partial.questionsCount;
    if (partial.durationMinutes !== undefined) snakeObj.duration_minutes = partial.durationMinutes;
    if (partial.examDate !== undefined) snakeObj.exam_date = partial.examDate || null;
    if (partial.category !== undefined) snakeObj.category = partial.category;
    if (partial.status !== undefined) snakeObj.status = partial.status;
    if (partial.notes !== undefined) snakeObj.notes = partial.notes;
    if (partial.fileUrl !== undefined) snakeObj.file_url = partial.fileUrl;
    if (partial.templateFileUrl !== undefined) snakeObj.template_file_url = partial.templateFileUrl;

    supabase.from('provas').update(snakeObj).eq('id', id).then(({ error }) => {
      if (error) console.warn('Gabarita: Erro ao atualizar prova no Supabase:', error.message);
    });

    return updatedItem;
  }

  static async deleteProva(id: string): Promise<Prova[]> {
    const list = await this.getProvas();
    const updated = list.filter(p => p.id !== id);
    saveStored(STORAGE_KEYS.PROVAS, updated);

    supabase.from('provas').delete().eq('id', id).then(({ error }) => {
      if (error) console.warn('Gabarita: Erro ao excluir prova no Supabase:', error.message);
    });

    return updated;
  }

  // --- DISCIPLINAS & ASSUNTOS ---
  static async getDisciplinas(concursoId?: string): Promise<Disciplina[]> {
    try {
      let query = supabase.from('disciplinas').select('*').order('order', { ascending: true });
      if (concursoId) {
        query = query.eq('concurso_id', concursoId);
      }
      const { data, error } = await query;
      if (!error && Array.isArray(data) && data.length > 0) {
        const list = data.map(mapDisciplinaFromDb);
        saveStored(STORAGE_KEYS.DISCIPLINAS, list);
        return list;
      }
    } catch (e) {
      console.warn('Gabarita: Falha ao buscar disciplinas do Supabase:', e);
    }

    const list = loadStored<Disciplina[]>(STORAGE_KEYS.DISCIPLINAS, INITIAL_DISCIPLINAS);
    if (concursoId) {
      return list.filter(d => d.concursoId === concursoId);
    }
    return list;
  }

  static async addDisciplina(disciplina: Omit<Disciplina, 'id' | 'createdAt' | 'topicsCount' | 'completedTopicsCount' | 'totalStudyMinutes'>): Promise<Disciplina> {
    const list = await this.getDisciplinas();
    let targetConcursoId = disciplina.concursoId;
    if (!targetConcursoId) {
      const active = await this.getActiveConcurso();
      targetConcursoId = active?.id || '';
    }
    const newDisc: Disciplina = {
      ...disciplina,
      concursoId: targetConcursoId,
      id: `disc_${Date.now()}`,
      topicsCount: 0,
      completedTopicsCount: 0,
      totalStudyMinutes: 0,
      createdAt: new Date().toISOString(),
    };
    const updated = [...list, newDisc];
    saveStored(STORAGE_KEYS.DISCIPLINAS, updated);
    await this.syncActiveContestStorage();

    getCurrentUserId().then(uid => {
      if (uid) {
        supabase.from('disciplinas').insert([{
          id: newDisc.id,
          user_id: uid,
          concurso_id: newDisc.concursoId || null,
          name: newDisc.name,
          code: newDisc.code,
          color: newDisc.color,
          icon: newDisc.icon,
          weight: newDisc.weight,
          order: newDisc.order,
          topics_count: newDisc.topicsCount,
          completed_topics_count: newDisc.completedTopicsCount,
          total_study_minutes: newDisc.totalStudyMinutes,
          created_at: newDisc.createdAt,
        }]).then(({ error }) => {
          if (error) console.warn('Gabarita: Erro ao inserir disciplina no Supabase:', error.message);
        });
      }
    });

    return newDisc;
  }

  static async addDisciplinaWithTopics(
    disciplina: Omit<Disciplina, 'id' | 'createdAt' | 'topicsCount' | 'completedTopicsCount' | 'totalStudyMinutes'>,
    topicNames: string[]
  ): Promise<{ disciplina: Disciplina; assuntos: Assunto[] }> {
    const discList = await this.getDisciplinas();
    const assList = await this.getAssuntos();

    let targetConcursoId = disciplina.concursoId;
    if (!targetConcursoId) {
      const active = await this.getActiveConcurso();
      targetConcursoId = active?.id || '';
    }

    const discId = `disc_${Date.now()}`;
    const cleanTopics = topicNames.map(t => t.trim()).filter(Boolean);

    const newDisc: Disciplina = {
      ...disciplina,
      concursoId: targetConcursoId,
      id: discId,
      topicsCount: cleanTopics.length,
      completedTopicsCount: 0,
      totalStudyMinutes: 0,
      createdAt: new Date().toISOString(),
    };

    const createdAssuntos: Assunto[] = cleanTopics.map((tName, idx) => ({
      id: `ass_${Date.now()}_${idx}`,
      disciplinaId: discId,
      name: tName,
      order: idx + 1,
      masteryLevel: 0,
      totalQuestionsSolved: 0,
      correctQuestionsSolved: 0,
      accuracyRate: 0,
      completed: false,
      status: 'nao_iniciado',
      difficulty: 'media',
      importance: 'alta',
      subtopicos: [],
      createdAt: new Date().toISOString(),
    }));

    saveStored(STORAGE_KEYS.DISCIPLINAS, [...discList, newDisc]);
    saveStored(STORAGE_KEYS.ASSUNTOS, [...assList, ...createdAssuntos]);
    await this.syncActiveContestStorage();

    getCurrentUserId().then(uid => {
      if (uid) {
        supabase.from('disciplinas').insert([{
          id: newDisc.id,
          user_id: uid,
          concurso_id: newDisc.concursoId || null,
          name: newDisc.name,
          code: newDisc.code,
          color: newDisc.color,
          icon: newDisc.icon,
          weight: newDisc.weight,
          order: newDisc.order,
          topics_count: newDisc.topicsCount,
          completed_topics_count: newDisc.completedTopicsCount,
          total_study_minutes: newDisc.totalStudyMinutes,
          created_at: newDisc.createdAt,
        }]).then(({ error }) => {
          if (error) console.warn('Gabarita: Erro ao inserir disciplina no Supabase:', error.message);
        });

        if (createdAssuntos.length > 0) {
          const assRows = createdAssuntos.map(a => ({
            id: a.id,
            user_id: uid,
            disciplina_id: a.disciplinaId,
            name: a.name,
            order: a.order,
            importance: a.importance,
            difficulty: a.difficulty,
            status: a.status,
            mastery_level: a.masteryLevel,
            total_questions_solved: a.totalQuestionsSolved,
            correct_questions_solved: a.correctQuestionsSolved,
            accuracy_rate: a.accuracyRate,
            completed: a.completed,
            subtopicos: a.subtopicos || [],
            created_at: a.createdAt,
          }));
          supabase.from('assuntos').insert(assRows).then(({ error }) => {
            if (error) console.warn('Gabarita: Erro ao inserir tópicos no Supabase:', error.message);
          });
        }
      }
    });

    return { disciplina: newDisc, assuntos: createdAssuntos };
  }

  static async updateDisciplina(id: string, partial: Partial<Disciplina>): Promise<Disciplina> {
    const list = await this.getDisciplinas();
    let updatedItem: Disciplina | null = null;
    const updated = list.map(d => {
      if (d.id === id) {
        updatedItem = { ...d, ...partial };
        return updatedItem;
      }
      return d;
    });
    if (!updatedItem) throw new Error('Disciplina não encontrada.');
    saveStored(STORAGE_KEYS.DISCIPLINAS, updated);
    await this.syncActiveContestStorage();

    const snakeObj: any = {};
    if (partial.name !== undefined) snakeObj.name = partial.name;
    if (partial.code !== undefined) snakeObj.code = partial.code;
    if (partial.color !== undefined) snakeObj.color = partial.color;
    if (partial.icon !== undefined) snakeObj.icon = partial.icon;
    if (partial.weight !== undefined) snakeObj.weight = partial.weight;
    if (partial.order !== undefined) snakeObj.order = partial.order;
    if (partial.topicsCount !== undefined) snakeObj.topics_count = partial.topicsCount;
    if (partial.completedTopicsCount !== undefined) snakeObj.completed_topics_count = partial.completedTopicsCount;
    if (partial.totalStudyMinutes !== undefined) snakeObj.total_study_minutes = partial.totalStudyMinutes;

    supabase.from('disciplinas').update(snakeObj).eq('id', id).then(({ error }) => {
      if (error) console.warn('Gabarita: Erro ao atualizar disciplina no Supabase:', error.message);
    });

    return updatedItem;
  }

  static async deleteDisciplina(id: string): Promise<Disciplina[]> {
    const list = await this.getDisciplinas();
    const updated = list.filter(d => d.id !== id);
    saveStored(STORAGE_KEYS.DISCIPLINAS, updated);

    supabase.from('disciplinas').delete().eq('id', id).then(({ error }) => {
      if (error) console.warn('Gabarita: Erro ao remover disciplina no Supabase:', error.message);
    });

    const assuntos = await this.getAssuntos();
    const updatedAssuntos = assuntos.filter(a => a.disciplinaId !== id);
    saveStored(STORAGE_KEYS.ASSUNTOS, updatedAssuntos);
    await this.syncActiveContestStorage();
    return updated;
  }

  static async duplicateDisciplina(id: string): Promise<{ disciplina: Disciplina; assuntos: Assunto[] }> {
    const disciplinas = await this.getDisciplinas();
    const originalDisc = disciplinas.find(d => d.id === id);
    if (!originalDisc) throw new Error('Disciplina original não encontrada.');
    const newDiscId = `disc_${Date.now()}`;
    const clonedDisc: Disciplina = {
      ...originalDisc,
      id: newDiscId,
      name: `${originalDisc.name} (Cópia)`,
      order: disciplinas.length + 1,
      createdAt: new Date().toISOString(),
    };
    saveStored(STORAGE_KEYS.DISCIPLINAS, [...disciplinas, clonedDisc]);
    const allAssuntos = await this.getAssuntos();
    const discAssuntos = allAssuntos.filter(a => a.disciplinaId === id);
    const clonedAssuntos: Assunto[] = discAssuntos.map((a, idx) => ({
      ...a,
      id: `ass_${Date.now()}_${idx}`,
      disciplinaId: newDiscId,
      subtopicos: a.subtopicos?.map((s, sIdx) => ({
        ...s,
        id: `sub_${Date.now()}_${idx}_${sIdx}`,
      })),
      createdAt: new Date().toISOString(),
    }));
    saveStored(STORAGE_KEYS.ASSUNTOS, [...allAssuntos, ...clonedAssuntos]);
    await this.syncActiveContestStorage();
    return { disciplina: clonedDisc, assuntos: clonedAssuntos };
  }

  static async getAssuntos(disciplinaId?: string): Promise<Assunto[]> {
    try {
      let query = supabase.from('assuntos').select('*').order('order', { ascending: true });
      if (disciplinaId) {
        query = query.eq('disciplina_id', disciplinaId);
      }
      const { data, error } = await query;
      if (!error && Array.isArray(data) && data.length > 0) {
        const list = data.map(mapAssuntoFromDb);
        saveStored(STORAGE_KEYS.ASSUNTOS, list);
        return list;
      }
    } catch (e) {
      console.warn('Gabarita: Falha ao buscar assuntos do Supabase:', e);
    }

    const list = loadStored<Assunto[]>(STORAGE_KEYS.ASSUNTOS, INITIAL_ASSUNTOS);
    const seedMap = new Map(INITIAL_ASSUNTOS.filter(a => a.link).map(a => [a.id, a.link]));
    const hydrated = list.map(a => {
      if (a.link === undefined && seedMap.has(a.id)) {
        return { ...a, link: seedMap.get(a.id) };
      }
      return a;
    });
    if (disciplinaId) {
      return hydrated.filter(a => a.disciplinaId === disciplinaId).sort((a, b) => a.order - b.order);
    }
    return hydrated.sort((a, b) => a.order - b.order);
  }

  static async addAssunto(assunto: Omit<Assunto, 'id' | 'createdAt' | 'masteryLevel' | 'totalQuestionsSolved' | 'correctQuestionsSolved' | 'accuracyRate'>): Promise<Assunto> {
    const list = await this.getAssuntos();
    const discAssuntos = list.filter(a => a.disciplinaId === assunto.disciplinaId);
    const newAssunto: Assunto = {
      ...assunto,
      id: `ass_${Date.now()}`,
      order: assunto.order || discAssuntos.length + 1,
      masteryLevel: 0,
      totalQuestionsSolved: 0,
      correctQuestionsSolved: 0,
      accuracyRate: 0,
      status: assunto.status || 'nao_iniciado',
      difficulty: assunto.difficulty || 'media',
      subtopicos: assunto.subtopicos || [],
      createdAt: new Date().toISOString(),
    };
    const updated = [...list, newAssunto];
    saveStored(STORAGE_KEYS.ASSUNTOS, updated);
    await this.syncActiveContestStorage();

    getCurrentUserId().then(uid => {
      if (uid) {
        supabase.from('assuntos').insert([{
          id: newAssunto.id,
          user_id: uid,
          disciplina_id: newAssunto.disciplinaId,
          name: newAssunto.name,
          order: newAssunto.order,
          importance: newAssunto.importance,
          difficulty: newAssunto.difficulty,
          status: newAssunto.status,
          mastery_level: newAssunto.masteryLevel,
          total_questions_solved: newAssunto.totalQuestionsSolved,
          correct_questions_solved: newAssunto.correctQuestionsSolved,
          accuracy_rate: newAssunto.accuracyRate,
          completed: newAssunto.completed,
          link: newAssunto.link,
          notes: newAssunto.notes,
          last_studied_at: newAssunto.lastStudiedAt || null,
          subtopicos: newAssunto.subtopicos || [],
          created_at: newAssunto.createdAt,
        }]).then(({ error }) => {
          if (error) console.warn('Gabarita: Erro ao inserir assunto no Supabase:', error.message);
        });
      }
    });

    return newAssunto;
  }

  static async updateAssunto(id: string, partial: Partial<Assunto>): Promise<Assunto> {
    const list = await this.getAssuntos();
    let updatedItem: Assunto | null = null;
    const updated = list.map(a => {
      if (a.id === id) {
        updatedItem = { ...a, ...partial };
        if (partial.status) {
          updatedItem.completed = partial.status === 'dominado' || partial.status === 'revisado';
        }
        return updatedItem;
      }
      return a;
    });
    if (!updatedItem) throw new Error('Assunto não encontrado.');
    saveStored(STORAGE_KEYS.ASSUNTOS, updated);
    await this.syncActiveContestStorage();

    const snakeObj: any = {};
    if (partial.name !== undefined) snakeObj.name = partial.name;
    if (partial.order !== undefined) snakeObj.order = partial.order;
    if (partial.importance !== undefined) snakeObj.importance = partial.importance;
    if (partial.difficulty !== undefined) snakeObj.difficulty = partial.difficulty;
    if (partial.status !== undefined) snakeObj.status = partial.status;
    if (partial.masteryLevel !== undefined) snakeObj.mastery_level = partial.masteryLevel;
    if (partial.totalQuestionsSolved !== undefined) snakeObj.total_questions_solved = partial.totalQuestionsSolved;
    if (partial.correctQuestionsSolved !== undefined) snakeObj.correct_questions_solved = partial.correctQuestionsSolved;
    if (partial.accuracyRate !== undefined) snakeObj.accuracy_rate = partial.accuracyRate;
    if (partial.completed !== undefined) snakeObj.completed = partial.completed;
    if (partial.link !== undefined) snakeObj.link = partial.link;
    if (partial.notes !== undefined) snakeObj.notes = partial.notes;
    if (partial.lastStudiedAt !== undefined) snakeObj.last_studied_at = partial.lastStudiedAt || null;
    if (partial.subtopicos !== undefined) snakeObj.subtopicos = partial.subtopicos;

    supabase.from('assuntos').update(snakeObj).eq('id', id).then(({ error }) => {
      if (error) console.warn('Gabarita: Erro ao atualizar assunto no Supabase:', error.message);
    });

    return updatedItem;
  }

  static async deleteAssunto(id: string): Promise<Assunto[]> {
    const list = await this.getAssuntos();
    const target = list.find(a => a.id === id);
    const updated = list.filter(a => a.id !== id);
    saveStored(STORAGE_KEYS.ASSUNTOS, updated);

    supabase.from('assuntos').delete().eq('id', id).then(({ error }) => {
      if (error) console.warn('Gabarita: Erro ao remover assunto no Supabase:', error.message);
    });
    if (target) {
      const discList = await this.getDisciplinas();
      const discAssuntos = updated.filter(a => a.disciplinaId === target.disciplinaId);
      const dominados = discAssuntos.filter(a => a.completed || a.status === 'dominado' || a.status === 'revisado').length;
      const updatedDisc = discList.map(d => {
        if (d.id === target.disciplinaId) {
          return {
            ...d,
            topicsCount: discAssuntos.length,
            completedTopicsCount: dominados,
          };
        }
        return d;
      });
      saveStored(STORAGE_KEYS.DISCIPLINAS, updatedDisc);
    }
    await this.syncActiveContestStorage();
    return updated;
  }

  static async duplicateAssunto(id: string): Promise<Assunto> {
    const list = await this.getAssuntos();
    const original = list.find(a => a.id === id);
    if (!original) throw new Error('Assunto original não encontrado.');
    const newId = `ass_${Date.now()}`;
    const cloned: Assunto = {
      ...original,
      id: newId,
      name: `${original.name} (Cópia)`,
      order: original.order + 1,
      subtopicos: original.subtopicos?.map((s, idx) => ({
        ...s,
        id: `sub_${Date.now()}_${idx}`,
        assuntoId: newId,
      })),
      createdAt: new Date().toISOString(),
    };
    const updated = [...list, cloned];
    saveStored(STORAGE_KEYS.ASSUNTOS, updated);
    await this.syncActiveContestStorage();
    return cloned;
  }

  static async reorderAssuntos(orderedIds: string[]): Promise<Assunto[]> {
    const list = await this.getAssuntos();
    const updated = list.map(a => {
      const idx = orderedIds.indexOf(a.id);
      if (idx !== -1) {
        return { ...a, order: idx + 1 };
      }
      return a;
    });
    saveStored(STORAGE_KEYS.ASSUNTOS, updated);
    await this.syncActiveContestStorage();
    return updated;
  }

  static async updateAssuntoStatus(id: string, status: TopicStatus): Promise<Assunto> {
    const completed = status === 'dominado' || status === 'revisado';
    return this.updateAssunto(id, {
      status,
      completed,
      lastStudiedAt: new Date().toISOString(),
    });
  }

  // --- SUBTÓPICOS ---
  static async addSubtopico(assuntoId: string, name: string): Promise<Assunto> {
    const list = await this.getAssuntos();
    let updatedAssunto: Assunto | null = null;
    const updated = list.map(a => {
      if (a.id === assuntoId) {
        const subs = a.subtopicos || [];
        const newSub: Subtopico = {
          id: `sub_${Date.now()}`,
          assuntoId,
          name,
          order: subs.length + 1,
          status: 'nao_iniciado',
          difficulty: 'media',
          completed: false,
          createdAt: new Date().toISOString(),
        };
        updatedAssunto = {
          ...a,
          subtopicos: [...subs, newSub],
        };
        return updatedAssunto;
      }
      return a;
    });
    if (!updatedAssunto) throw new Error('Assunto pai não encontrado.');
    saveStored(STORAGE_KEYS.ASSUNTOS, updated);
    return updatedAssunto;
  }

  static async updateSubtopico(assuntoId: string, subtopicoId: string, partial: Partial<Subtopico>): Promise<Assunto> {
    const list = await this.getAssuntos();
    let updatedAssunto: Assunto | null = null;
    const updated = list.map(a => {
      if (a.id === assuntoId) {
        const subs = (a.subtopicos || []).map(s => {
          if (s.id === subtopicoId) {
            const upd = { ...s, ...partial };
            if (partial.status) {
              upd.completed = partial.status === 'dominado' || partial.status === 'revisado';
            }
            return upd;
          }
          return s;
        });
        updatedAssunto = { ...a, subtopicos: subs };
        return updatedAssunto;
      }
      return a;
    });
    if (!updatedAssunto) throw new Error('Assunto ou subtópico não encontrado.');
    saveStored(STORAGE_KEYS.ASSUNTOS, updated);
    return updatedAssunto;
  }

  static async deleteSubtopico(assuntoId: string, subtopicoId: string): Promise<Assunto> {
    const list = await this.getAssuntos();
    let updatedAssunto: Assunto | null = null;
    const updated = list.map(a => {
      if (a.id === assuntoId) {
        const subs = (a.subtopicos || []).filter(s => s.id !== subtopicoId);
        updatedAssunto = { ...a, subtopicos: subs };
        return updatedAssunto;
      }
      return a;
    });
    if (!updatedAssunto) throw new Error('Assunto ou subtópico não encontrado.');
    saveStored(STORAGE_KEYS.ASSUNTOS, updated);
    return updatedAssunto;
  }

  static async toggleAssuntoCompleted(assuntoId: string): Promise<Assunto[]> {
    const list = await this.getAssuntos();
    const updated = list.map(a => {
      if (a.id === assuntoId) {
        const nextCompleted = !a.completed;
        const nextStatus: TopicStatus = nextCompleted ? 'dominado' : 'nao_iniciado';
        return {
          ...a,
          completed: nextCompleted,
          status: nextStatus,
          lastStudiedAt: new Date().toISOString(),
        };
      }
      return a;
    });
    saveStored(STORAGE_KEYS.ASSUNTOS, updated);
    return updated;
  }

  // --- IMPORTAÇÃO DE EDITAL ---
  static async importEditalTree(
    payload: EditalAiImportPayload,
    concursoId?: string,
    mode: 'merge' | 'replace' = 'merge'
  ): Promise<{ disciplinas: Disciplina[]; assuntos: Assunto[] }> {
    const activeConcurso = await this.getActiveConcurso();
    const targetConcursoId = concursoId || activeConcurso?.id || '';
    let currentDisciplinas = await this.getDisciplinas();
    let currentAssuntos = await this.getAssuntos();

    if (mode === 'replace') {
      if (targetConcursoId) {
        const discIdsToRemove = currentDisciplinas.filter(d => d.concursoId === targetConcursoId).map(d => d.id);
        currentDisciplinas = currentDisciplinas.filter(d => d.concursoId !== targetConcursoId);
        currentAssuntos = currentAssuntos.filter(a => !discIdsToRemove.includes(a.disciplinaId));
      } else {
        currentDisciplinas = [];
        currentAssuntos = [];
      }
    }

    const newDisciplinas: Disciplina[] = [];
    const newAssuntos: Assunto[] = [];
    const colors = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

    payload.disciplinas.forEach((discData, dIdx) => {
      let targetDisc = mode === 'merge' 
        ? currentDisciplinas.find(d => d.name.trim().toLowerCase() === discData.name.trim().toLowerCase() && d.concursoId === targetConcursoId)
        : null;
      let discId = targetDisc ? targetDisc.id : `disc_ai_${Date.now()}_${dIdx}`;
      if (!targetDisc) {
        const newDisc: Disciplina = {
          id: discId,
          concursoId: targetConcursoId,
          name: discData.name,
          code: discData.name.substring(0, 4).toUpperCase(),
          color: discData.color || colors[dIdx % colors.length],
          weight: discData.weight || 2.0,
          order: currentDisciplinas.length + newDisciplinas.length + 1,
          topicsCount: discData.topicos.length,
          completedTopicsCount: 0,
          totalStudyMinutes: 0,
          createdAt: new Date().toISOString(),
        };
        newDisciplinas.push(newDisc);
      }

      discData.topicos.forEach((topData, tIdx) => {
        const assId = `ass_ai_${Date.now()}_${dIdx}_${tIdx}`;
        const subs: Subtopico[] = (topData.subtopicos || []).map((subName, sIdx) => ({
          id: `sub_ai_${Date.now()}_${dIdx}_${tIdx}_${sIdx}`,
          assuntoId: assId,
          name: subName,
          order: sIdx + 1,
          status: 'nao_iniciado',
          difficulty: topData.difficulty || 'media',
          completed: false,
          createdAt: new Date().toISOString(),
        }));
        const newAss: Assunto = {
          id: assId,
          disciplinaId: discId,
          name: topData.name,
          order: (targetDisc ? currentAssuntos.filter(a => a.disciplinaId === discId).length : 0) + tIdx + 1,
          importance: topData.importance || 'alta',
          difficulty: topData.difficulty || 'media',
          status: 'nao_iniciado',
          masteryLevel: 0,
          totalQuestionsSolved: 0,
          correctQuestionsSolved: 0,
          accuracyRate: 0,
          completed: false,
          notes: topData.notes || '',
          subtopicos: subs,
          createdAt: new Date().toISOString(),
        };
        newAssuntos.push(newAss);
      });
    });

    const allDisciplinas = [...currentDisciplinas, ...newDisciplinas];
    const allAssuntos = [...currentAssuntos, ...newAssuntos];
    saveStored(STORAGE_KEYS.DISCIPLINAS, allDisciplinas);
    saveStored(STORAGE_KEYS.ASSUNTOS, allAssuntos);
    return { disciplinas: allDisciplinas, assuntos: allAssuntos };
  }

  // --- SESSÕES DE ESTUDO ---
  static async getSessoes(): Promise<SessaoEstudo[]> {
    try {
      const { data, error } = await supabase
        .from('sessoes_estudo')
        .select('*')
        .order('completed_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const list = data.map(mapSessaoFromDb);
        saveStored(STORAGE_KEYS.SESSOES, list);
        return list;
      }
    } catch (e) {
      console.warn('Gabarita: Falha ao buscar sessoes do Supabase:', e);
    }
    return loadStored<SessaoEstudo[]>(STORAGE_KEYS.SESSOES, INITIAL_SESSOES);
  }

  static async recordStudySession(session: Omit<SessaoEstudo, 'id' | 'createdAt'>): Promise<SessaoEstudo> {
    const list = await this.getSessoes();
    const disciplinas = await this.getDisciplinas();
    const assuntos = await this.getAssuntos();
    const disc = disciplinas.find(d => d.id === session.disciplinaId);
    const assunto = assuntos.find(a => a.id === session.assuntoId);

    const accuracyRate = (session.questionsAttempted && session.questionsAttempted > 0 && typeof session.questionsCorrect === 'number')
      ? Math.round((session.questionsCorrect / session.questionsAttempted) * 100)
      : undefined;

    const newSession: SessaoEstudo = {
      ...session,
      disciplinaName: session.disciplinaName || disc?.name || 'Geral',
      assuntoName: session.assuntoName || assunto?.name || 'Estudo Dirigido',
      accuracyRate: accuracyRate ?? session.accuracyRate,
      id: `sess_${Date.now()}`,
      createdAt: new Date().toISOString(),
      completedAt: session.completedAt || new Date().toISOString(),
    };

    const updated = [newSession, ...list];
    saveStored(STORAGE_KEYS.SESSOES, updated);

    getCurrentUserId().then(uid => {
      const targetUserId = session.userId || uid;
      if (targetUserId) {
        supabase.from('sessoes_estudo').insert([{
          id: newSession.id,
          user_id: targetUserId,
          disciplina_id: newSession.disciplinaId,
          assunto_id: newSession.assuntoId || null,
          disciplina_name: newSession.disciplinaName,
          assunto_name: newSession.assuntoName,
          duration_minutes: newSession.durationMinutes,
          planned_minutes: newSession.plannedMinutes || null,
          type: newSession.type,
          questions_attempted: newSession.questionsAttempted ?? null,
          questions_correct: newSession.questionsCorrect ?? null,
          accuracy_rate: newSession.accuracyRate ?? null,
          notes: newSession.notes,
          teoria_finalizada: newSession.teoriaFinalizada,
          page_intervals: newSession.pageIntervals || [],
          videoaulas: newSession.videoaulas || [],
          completed_at: newSession.completedAt,
          created_at: newSession.createdAt,
        }]).then(({ error }) => {
          if (error) console.warn('Gabarita: Erro ao inserir sessão de estudo no Supabase:', error.message);
        });
      }
    });

    if (disc) {
      const updatedDisciplinas = disciplinas.map(d => {
        if (d.id === session.disciplinaId) {
          const upd = {
            ...d,
            totalStudyMinutes: (d.totalStudyMinutes || 0) + session.durationMinutes,
          };
          this.updateDisciplina(d.id, { totalStudyMinutes: upd.totalStudyMinutes });
          return upd;
        }
        return d;
      });
      saveStored(STORAGE_KEYS.DISCIPLINAS, updatedDisciplinas);
    }

    if (assunto) {
      const updatedAssuntos = assuntos.map(a => {
        if (a.id === session.assuntoId) {
          const newTotalQ = (a.totalQuestionsSolved || 0) + (session.questionsAttempted || 0);
          const newCorrectQ = (a.correctQuestionsSolved || 0) + (session.questionsCorrect || 0);
          const newAcc = newTotalQ > 0 ? Math.round((newCorrectQ / newTotalQ) * 100) : a.accuracyRate || 0;
          const upd = {
            ...a,
            lastStudiedAt: new Date().toISOString(),
            status: a.status === 'nao_iniciado' ? ('em_estudo' as const) : a.status,
            totalQuestionsSolved: newTotalQ,
            correctQuestionsSolved: newCorrectQ,
            accuracyRate: newAcc,
          };
          this.updateAssunto(a.id, {
            lastStudiedAt: upd.lastStudiedAt,
            status: upd.status,
            totalQuestionsSolved: newTotalQ,
            correctQuestionsSolved: newCorrectQ,
            accuracyRate: newAcc,
          });
          return upd;
        }
        return a;
      });
      saveStored(STORAGE_KEYS.ASSUNTOS, updatedAssuntos);
    }

    const user = await this.getUserProfile(session.userId);
    const addedXp = Math.floor(session.durationMinutes * 2) + ((session.questionsCorrect || 0) * 5);
    await this.updateUserProfile({
      xp: (user.xp || 0) + addedXp,
      level: Math.floor(((user.xp || 0) + addedXp) / 1000) + 1,
      lastStudyDate: new Date().toISOString(),
    });

    return newSession;
  }

  static async deleteStudySession(sessionId: string): Promise<SessaoEstudo[]> {
    const list = await this.getSessoes();
    const updated = list.filter(s => s.id !== sessionId);
    saveStored(STORAGE_KEYS.SESSOES, updated);

    supabase.from('sessoes_estudo').delete().eq('id', sessionId).then(({ error }) => {
      if (error) console.warn('Gabarita: Erro ao remover sessão de estudo no Supabase:', error.message);
    });

    return updated;
  }

  static async updateStudySession(sessionId: string, partial: Partial<SessaoEstudo>): Promise<SessaoEstudo> {
    const list = await this.getSessoes();
    let updatedItem: SessaoEstudo | null = null;
    const updated = list.map(s => {
      if (s.id === sessionId) {
        updatedItem = { ...s, ...partial };
        return updatedItem;
      }
      return s;
    });
    if (!updatedItem) throw new Error('Sessão não encontrada.');
    saveStored(STORAGE_KEYS.SESSOES, updated);

    const snakeObj: any = {};
    if (partial.durationMinutes !== undefined) snakeObj.duration_minutes = partial.durationMinutes;
    if (partial.type !== undefined) snakeObj.type = partial.type;
    if (partial.questionsAttempted !== undefined) snakeObj.questions_attempted = partial.questionsAttempted;
    if (partial.questionsCorrect !== undefined) snakeObj.questions_correct = partial.questionsCorrect;
    if (partial.accuracyRate !== undefined) snakeObj.accuracy_rate = partial.accuracyRate;
    if (partial.notes !== undefined) snakeObj.notes = partial.notes;
    if (partial.completedAt !== undefined) snakeObj.completed_at = partial.completedAt;

    supabase.from('sessoes_estudo').update(snakeObj).eq('id', sessionId).then(({ error }) => {
      if (error) console.warn('Gabarita: Erro ao atualizar sessão de estudo no Supabase:', error.message);
    });

    return updatedItem;
  }

  // --- REVISÕES & SRS ---
  static async getRevisionSettings(): Promise<RevisionSettings> {
    return loadStored<RevisionSettings>(STORAGE_KEYS.REVISION_SETTINGS, INITIAL_REVISION_SETTINGS);
  }

  static async updateRevisionSettings(partial: Partial<RevisionSettings>): Promise<RevisionSettings> {
    const current = await this.getRevisionSettings();
    const updated: RevisionSettings = { ...current, ...partial };
    saveStored(STORAGE_KEYS.REVISION_SETTINGS, updated);

    getCurrentUserId().then(uid => {
      if (uid) {
        supabase.from('revision_settings').upsert({
          user_id: uid,
          auto_schedule_on_study: updated.autoScheduleOnStudy,
          auto_schedule_on_questions: updated.autoScheduleOnQuestions,
          interval_days: updated.intervalDays,
          performance_adaptive: updated.performanceAdaptive,
          ease_multiplier: updated.easeMultiplier,
          hard_penalty_days: updated.hardPenaltyDays,
          updated_at: new Date().toISOString(),
        }).then(({ error }) => {
          if (error) console.warn('Gabarita: Erro ao salvar configurações SRS no Supabase:', error.message);
        });
      }
    });

    return updated;
  }

  static async getRevisoes(): Promise<Revisao[]> {
    try {
      const { data, error } = await supabase
        .from('revisoes')
        .select('*')
        .order('scheduled_for', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        const list = data.map(mapRevisaoFromDb);
        saveStored(STORAGE_KEYS.REVISOES, list);
        return list;
      }
    } catch (e) {
      console.warn('Gabarita: Falha ao buscar revisões do Supabase:', e);
    }

    const list = loadStored<Revisao[]>(STORAGE_KEYS.REVISOES, INITIAL_REVISOES);
    const todayStr = PlannerService.formatLocalDate(new Date());
    let changed = false;
    const updatedList = list.map(r => {
      const scheduledDateStr = r.scheduledFor.includes('T') ? r.scheduledFor.split('T')[0] : r.scheduledFor;
      if (r.status === 'pendente' && scheduledDateStr < todayStr) {
        changed = true;
        return { ...r, status: 'atrasada' as const };
      }
      return r;
    });
    if (changed) {
      saveStored(STORAGE_KEYS.REVISOES, updatedList);
    }
    return updatedList;
  }

  static async addRevisao(rev: Omit<Revisao, 'id' | 'createdAt'>): Promise<Revisao> {
    const list = await this.getRevisoes();
    const disciplinas = await this.getDisciplinas();
    const disc = disciplinas.find(d => d.id === rev.disciplinaId);
    const newRev: Revisao = {
      ...rev,
      id: `rev_${Date.now()}`,
      disciplinaName: rev.disciplinaName || disc?.name || 'Geral',
      createdAt: new Date().toISOString(),
    };
    const updated = [newRev, ...list];
    saveStored(STORAGE_KEYS.REVISOES, updated);

    getCurrentUserId().then(uid => {
      const targetUid = rev.userId || uid;
      if (targetUid) {
        supabase.from('revisoes').insert([{
          id: newRev.id,
          user_id: targetUid,
          disciplina_id: newRev.disciplinaId,
          assunto_id: newRev.assuntoId || null,
          disciplina_name: newRev.disciplinaName,
          assunto_name: newRev.assuntoName,
          method: newRev.method,
          stage: newRev.stage,
          total_stages: newRev.totalStages,
          interval_days: newRev.intervalDays,
          scheduled_for: newRev.scheduledFor.includes('T') ? newRev.scheduledFor.split('T')[0] : newRev.scheduledFor,
          completed_at: newRev.completedAt || null,
          status: newRev.status,
          rating: newRev.rating || null,
          accuracy_rate: newRev.accuracyRate ?? null,
          questions_attempted: newRev.questionsAttempted ?? null,
          questions_correct: newRev.questionsCorrect ?? null,
          notes: newRev.notes,
          is_automatic: newRev.isAutomatic,
          next_revision_id: newRev.nextRevisionId,
          created_at: newRev.createdAt,
          updated_at: newRev.updatedAt,
        }]).then(({ error }) => {
          if (error) console.warn('Gabarita: Erro ao inserir revisão no Supabase:', error.message);
        });
      }
    });

    return newRev;
  }

  static async updateRevisao(id: string, partial: Partial<Revisao>): Promise<Revisao> {
    const list = await this.getRevisoes();
    let updatedItem: Revisao | null = null;
    const updated = list.map(r => {
      if (r.id === id) {
        updatedItem = { ...r, ...partial, updatedAt: new Date().toISOString() };
        return updatedItem;
      }
      return r;
    });
    if (!updatedItem) throw new Error('Revisão não encontrada.');
    saveStored(STORAGE_KEYS.REVISOES, updated);

    const snakeObj: any = { updated_at: new Date().toISOString() };
    if (partial.status !== undefined) snakeObj.status = partial.status;
    if (partial.rating !== undefined) snakeObj.rating = partial.rating;
    if (partial.completedAt !== undefined) snakeObj.completed_at = partial.completedAt;
    if (partial.scheduledFor !== undefined) snakeObj.scheduled_for = partial.scheduledFor.includes('T') ? partial.scheduledFor.split('T')[0] : partial.scheduledFor;
    if (partial.accuracyRate !== undefined) snakeObj.accuracy_rate = partial.accuracyRate;
    if (partial.questionsAttempted !== undefined) snakeObj.questions_attempted = partial.questionsAttempted;
    if (partial.questionsCorrect !== undefined) snakeObj.questions_correct = partial.questionsCorrect;
    if (partial.notes !== undefined) snakeObj.notes = partial.notes;
    if (partial.stage !== undefined) snakeObj.stage = partial.stage;
    if (partial.nextRevisionId !== undefined) snakeObj.next_revision_id = partial.nextRevisionId;

    supabase.from('revisoes').update(snakeObj).eq('id', id).then(({ error }) => {
      if (error) console.warn('Gabarita: Erro ao atualizar revisão no Supabase:', error.message);
    });

    return updatedItem;
  }

  static async deleteRevisao(id: string): Promise<Revisao[]> {
    const list = await this.getRevisoes();
    const updated = list.filter(r => r.id !== id);
    saveStored(STORAGE_KEYS.REVISOES, updated);

    supabase.from('revisoes').delete().eq('id', id).then(({ error }) => {
      if (error) console.warn('Gabarita: Erro ao remover revisão no Supabase:', error.message);
    });

    return updated;
  }

  static async completeRevisaoWithPerformance(
    revisaoId: string,
    rating: RevisionRating,
    accuracyRate?: number,
    questionsAttempted?: number,
    questionsCorrect?: number,
    notes?: string
  ): Promise<{ completed: Revisao; nextRevision?: Revisao; allRevisoes: Revisao[] }> {
    const list = await this.getRevisoes();
    const settings = await this.getRevisionSettings();
    const target = list.find(r => r.id === revisaoId);
    if (!target) throw new Error('Revisão não encontrada.');
    const now = new Date();
    const nowIso = now.toISOString();

    const completedRev: Revisao = {
      ...target,
      status: 'concluida',
      rating,
      completedAt: nowIso,
      accuracyRate: accuracyRate ?? (questionsAttempted && questionsAttempted > 0 ? Math.round(((questionsCorrect || 0) / questionsAttempted) * 100) : target.accuracyRate),
      questionsAttempted: questionsAttempted ?? target.questionsAttempted,
      questionsCorrect: questionsCorrect ?? target.questionsCorrect,
      notes: notes !== undefined ? notes : target.notes,
      updatedAt: nowIso,
    };

    let nextRevision: Revisao | undefined = undefined;
    const currentStage = target.stage || 1;
    const intervals = settings.intervalDays && settings.intervalDays.length > 0 
      ? settings.intervalDays 
      : [1, 7, 15, 30, 60];
    const totalStages = target.totalStages || intervals.length;
    let nextDays = 0;
    let nextStage = currentStage;
    let shouldScheduleNext = false;

    if (rating === 'errei' || rating === 'dificil') {
      nextDays = settings.hardPenaltyDays || 1;
      nextStage = 1;
      shouldScheduleNext = true;
    } else if (currentStage < totalStages) {
      nextStage = currentStage + 1;
      const baseInterval = intervals[nextStage - 1] || (intervals[intervals.length - 1] * 2);
      if (rating === 'facil' && settings.performanceAdaptive) {
        nextDays = Math.round(baseInterval * (settings.easeMultiplier || 1.8));
      } else {
        nextDays = baseInterval;
      }
      shouldScheduleNext = true;
    }

    if (shouldScheduleNext && nextDays > 0) {
      const nextDate = new Date(now.getTime() + nextDays * 86400000);
      const nextDateStr = PlannerService.formatLocalDate(nextDate);
      nextRevision = {
        id: `rev_srs_${Date.now()}`,
        userId: target.userId,
        disciplinaId: target.disciplinaId,
        disciplinaName: target.disciplinaName,
        assuntoId: target.assuntoId,
        assuntoName: target.assuntoName,
        method: nextDays <= 1 ? '24h' : nextDays <= 7 ? '7d' : nextDays <= 15 ? '15d' : nextDays <= 30 ? '30d' : '60d',
        stage: nextStage,
        totalStages,
        intervalDays: nextDays,
        scheduledFor: nextDateStr,
        status: 'pendente',
        isAutomatic: true,
        notes: `SRS Etapa ${nextStage}/${totalStages} (${nextDays}d após rating ${rating.toUpperCase()}).`,
        createdAt: nowIso,
      };
      completedRev.nextRevisionId = nextRevision.id;
    }

    const updatedList = list.map(r => r.id === revisaoId ? completedRev : r);
    if (nextRevision) {
      updatedList.unshift(nextRevision);
    }
    saveStored(STORAGE_KEYS.REVISOES, updatedList);

    if (target.assuntoId) {
      const assuntos = await this.getAssuntos();
      const updatedAssuntos = assuntos.map(a => {
        if (a.id === target.assuntoId) {
          return {
            ...a,
            lastStudiedAt: nowIso,
            status: a.status === 'nao_iniciado' ? ('em_estudo' as const) : a.status,
          };
        }
        return a;
      });
      saveStored(STORAGE_KEYS.ASSUNTOS, updatedAssuntos);
    }

    const user = await this.getUserProfile(target.userId);
    const bonusXp = (questionsCorrect || 0) * 5;
    const addedXp = 30 + bonusXp;
    await this.updateUserProfile({
      xp: (user.xp || 0) + addedXp,
      level: Math.floor(((user.xp || 0) + addedXp) / 1000) + 1,
      lastStudyDate: nowIso,
    });

    return {
      completed: completedRev,
      nextRevision,
      allRevisoes: updatedList,
    };
  }

  static async batchRescheduleOverdueRevisoes(targetDateStr?: string): Promise<Revisao[]> {
    const list = await this.getRevisoes();
    const todayStr = targetDateStr || PlannerService.formatLocalDate(new Date());
    const updated = list.map(r => {
      const sDate = r.scheduledFor.includes('T') ? r.scheduledFor.split('T')[0] : r.scheduledFor;
      if (r.status === 'atrasada' || (r.status === 'pendente' && sDate < todayStr)) {
        return {
          ...r,
          scheduledFor: todayStr,
          status: 'pendente' as const,
          notes: r.notes ? `${r.notes} (Reagendada para hoje)` : 'Reagendada para hoje.',
          updatedAt: new Date().toISOString(),
        };
      }
      return r;
    });
    saveStored(STORAGE_KEYS.REVISOES, updated);
    return updated;
  }

  static async gerarCicloCompletoRevisao(
    userId: string,
    disciplinaId: string,
    assuntoId?: string,
    assuntoName?: string
  ): Promise<Revisao[]> {
    const list = await this.getRevisoes();
    const settings = await this.getRevisionSettings();
    const disciplinas = await this.getDisciplinas();
    const disc = disciplinas.find(d => d.id === disciplinaId);
    const intervals = settings.intervalDays && settings.intervalDays.length > 0 
      ? settings.intervalDays 
      : [1, 7, 15, 30, 60];
    const firstDays = intervals[0] || 1;
    const firstDate = new Date(Date.now() + firstDays * 86400000);
    const firstDateStr = PlannerService.formatLocalDate(firstDate);
    const firstRev: Revisao = {
      id: `rev_srs_${Date.now()}`,
      userId,
      disciplinaId,
      disciplinaName: disc?.name || 'Geral',
      assuntoId,
      assuntoName: assuntoName || 'Geral',
      method: firstDays <= 1 ? '24h' : '7d',
      stage: 1,
      totalStages: intervals.length,
      intervalDays: firstDays,
      scheduledFor: firstDateStr,
      status: 'pendente',
      isAutomatic: true,
      notes: `SRS Ciclo Inicial 24h para fixação de ${assuntoName || 'conteúdo'}.`,
      createdAt: new Date().toISOString(),
    };
    const updated = [firstRev, ...list];
    saveStored(STORAGE_KEYS.REVISOES, updated);
    return updated;
  }

  // --- EDITAIS (SUPABASE) ---
  static async getEditais(): Promise<any[]> {
    try {
      const res = await fetch('/api/editais');
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          return json.data;
        }
      }
    } catch (e) {
      console.warn('Gabarita DB: Aviso ao buscar editais do Supabase:', e);
    }
    return [];
  }

  static async saveEdital(editalData: any): Promise<any> {
    try {
      const res = await fetch('/api/editais', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editalData),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {
      console.warn('Gabarita DB: Aviso ao salvar edital no Supabase:', e);
    }
    return editalData;
  }

  // --- QUESTÕES & BLOCOS ---
  static async getQuestoes(): Promise<Questao[]> {
    try {
      const res = await fetch('/api/questoes');
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          saveStored(STORAGE_KEYS.QUESTOES, json.data);
          return json.data;
        }
      }
    } catch (e) {
      // continua para fallback local
    }
    return loadStored<Questao[]>(STORAGE_KEYS.QUESTOES, INITIAL_QUESTOES);
  }

  static async addQuestao(questao: Omit<Questao, 'id' | 'createdAt'>): Promise<Questao> {
    const newQ: Questao = {
      ...questao,
      id: `q_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    try {
      await fetch('/api/questoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQ),
      });
    } catch (e) {
      console.warn('Aviso ao sincronizar questão com o Supabase:', e);
    }
    const list = await this.getQuestoes();
    const updated = [newQ, ...list];
    saveStored(STORAGE_KEYS.QUESTOES, updated);
    return newQ;
  }

  static async getBlocosQuestoes(): Promise<RegistroBlocoQuestoes[]> {
    try {
      const { data, error } = await supabase
        .from('blocos_questoes')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const list = data.map(mapBlocoFromDb);
        saveStored(STORAGE_KEYS.BLOCOS_QUESTOES, list);
        return list;
      }
    } catch (e) {
      console.warn('Gabarita: Falha ao buscar blocos de questoes do Supabase:', e);
    }
    return loadStored<RegistroBlocoQuestoes[]>(STORAGE_KEYS.BLOCOS_QUESTOES, INITIAL_BLOCOS_QUESTOES);
  }

  static async recordBlocoQuestoes(
    bloco: Omit<RegistroBlocoQuestoes, 'id' | 'createdAt' | 'wrongAnswers' | 'accuracyRate'>
  ): Promise<RegistroBlocoQuestoes> {
    const list = await this.getBlocosQuestoes();
    const disciplinas = await this.getDisciplinas();
    const assuntos = await this.getAssuntos();
    const disc = disciplinas.find(d => d.id === bloco.disciplinaId);
    const assunto = assuntos.find(a => a.id === bloco.assuntoId);
    const wrongAnswers = Math.max(0, bloco.totalQuestions - bloco.correctAnswers);
    const accuracyRate = bloco.totalQuestions > 0 
      ? Math.round((bloco.correctAnswers / bloco.totalQuestions) * 100) 
      : 0;

    const newBloco: RegistroBlocoQuestoes = {
      ...bloco,
      disciplinaName: bloco.disciplinaName || disc?.name || 'Geral',
      assuntoName: bloco.assuntoName || assunto?.name || 'Geral',
      wrongAnswers,
      accuracyRate,
      id: `bloco_q_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newBloco, ...list];
    saveStored(STORAGE_KEYS.BLOCOS_QUESTOES, updated);

    getCurrentUserId().then(uid => {
      const targetUid = bloco.userId || uid;
      if (targetUid) {
        supabase.from('blocos_questoes').insert([{
          id: newBloco.id,
          user_id: targetUid,
          disciplina_id: newBloco.disciplinaId,
          disciplina_name: newBloco.disciplinaName,
          assunto_id: newBloco.assuntoId || null,
          assunto_name: newBloco.assuntoName || null,
          banca: newBloco.banca,
          difficulty: newBloco.difficulty,
          total_questions: newBloco.totalQuestions,
          correct_answers: newBloco.correctAnswers,
          wrong_answers: newBloco.wrongAnswers,
          doubt_count: newBloco.doubtCount || 0,
          accuracy_rate: newBloco.accuracyRate,
          date: newBloco.date,
          duration_minutes: newBloco.durationMinutes || null,
          notes: newBloco.notes,
          created_at: newBloco.createdAt,
        }]).then(({ error }) => {
          if (error) console.warn('Gabarita: Erro ao inserir bloco no Supabase:', error.message);
        });
      }
    });

    if (assunto) {
      const updatedAssuntos = assuntos.map(a => {
        if (a.id === bloco.assuntoId) {
          const newTotalQ = (a.totalQuestionsSolved || 0) + bloco.totalQuestions;
          const newCorrectQ = (a.correctQuestionsSolved || 0) + bloco.correctAnswers;
          const newAcc = newTotalQ > 0 ? Math.round((newCorrectQ / newTotalQ) * 100) : a.accuracyRate || 0;
          return {
            ...a,
            lastStudiedAt: new Date().toISOString(),
            totalQuestionsSolved: newTotalQ,
            correctQuestionsSolved: newCorrectQ,
            accuracyRate: newAcc,
            status: a.status === 'nao_iniciado' ? ('em_estudo' as const) : a.status,
          };
        }
        return a;
      });
      saveStored(STORAGE_KEYS.ASSUNTOS, updatedAssuntos);
    }

    if (bloco.durationMinutes && bloco.durationMinutes > 0 && disc) {
      const updatedDisciplinas = disciplinas.map(d => {
        if (d.id === bloco.disciplinaId) {
          return {
            ...d,
            totalStudyMinutes: (d.totalStudyMinutes || 0) + (bloco.durationMinutes || 0),
          };
        }
        return d;
      });
      saveStored(STORAGE_KEYS.DISCIPLINAS, updatedDisciplinas);
    }

    const user = await this.getUserProfile(bloco.userId);
    const addedXp = (bloco.correctAnswers * 5) + (bloco.totalQuestions * 1);
    await this.updateUserProfile({
      xp: (user.xp || 0) + addedXp,
      level: Math.floor(((user.xp || 0) + addedXp) / 1000) + 1,
      lastStudyDate: new Date().toISOString(),
    });

    return newBloco;
  }

  static async deleteBlocoQuestoes(blocoId: string): Promise<RegistroBlocoQuestoes[]> {
    const list = await this.getBlocosQuestoes();
    const updated = list.filter(b => b.id !== blocoId);
    saveStored(STORAGE_KEYS.BLOCOS_QUESTOES, updated);

    supabase.from('blocos_questoes').delete().eq('id', blocoId).then(({ error }) => {
      if (error) console.warn('Gabarita: Erro ao remover bloco de questoes no Supabase:', error.message);
    });

    return updated;
  }

  static async updateBlocoQuestoes(
    blocoId: string, 
    partial: Partial<RegistroBlocoQuestoes>
  ): Promise<RegistroBlocoQuestoes> {
    const list = await this.getBlocosQuestoes();
    let updatedItem: RegistroBlocoQuestoes | null = null;
    const updated = list.map(b => {
      if (b.id === blocoId) {
        const merged = { ...b, ...partial };
        if (typeof partial.totalQuestions === 'number' || typeof partial.correctAnswers === 'number') {
          merged.wrongAnswers = Math.max(0, merged.totalQuestions - merged.correctAnswers);
          merged.accuracyRate = merged.totalQuestions > 0 
            ? Math.round((merged.correctAnswers / merged.totalQuestions) * 100) 
            : 0;
        }
        updatedItem = merged;
        return merged;
      }
      return b;
    });
    if (!updatedItem) throw new Error('Bloco de questões não encontrado.');
    saveStored(STORAGE_KEYS.BLOCOS_QUESTOES, updated);
    return updatedItem;
  }

  // --- CADERNO DE ERROS ---
  static async getCadernoErros(): Promise<ItemCadernoErros[]> {
    try {
      const { data, error } = await supabase
        .from('caderno_erros')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const list = data.map(mapCadernoFromDb);
        saveStored(STORAGE_KEYS.CADERNO_ERROS, list);
        return list;
      }
    } catch (e) {
      console.warn('Gabarita: Falha ao buscar caderno de erros do Supabase:', e);
    }
    return loadStored<ItemCadernoErros[]>(STORAGE_KEYS.CADERNO_ERROS, INITIAL_CADERNO_ERROS);
  }

  static async addCadernoErro(
    item: Omit<ItemCadernoErros, 'id' | 'createdAt' | 'updatedAt' | 'reincidenciaCount'> & { reincidenciaCount?: number }
  ): Promise<ItemCadernoErros> {
    const list = await this.getCadernoErros();
    const disciplinas = await this.getDisciplinas();
    const assuntos = await this.getAssuntos();
    const disc = disciplinas.find(d => d.id === item.disciplinaId);
    const assunto = assuntos.find(a => a.id === item.assuntoId);
    const now = new Date().toISOString();
    const newErro: ItemCadernoErros = {
      ...item,
      id: `err_${Date.now()}`,
      disciplinaName: item.disciplinaName || disc?.name || 'Geral',
      assuntoName: item.assuntoName || assunto?.name || 'Geral',
      reincidenciaCount: Math.max(1, item.reincidenciaCount || 1),
      statusRevisao: item.statusRevisao || 'pendente',
      createdAt: now,
      updatedAt: now,
    };
    const updated = [newErro, ...list];
    saveStored(STORAGE_KEYS.CADERNO_ERROS, updated);

    getCurrentUserId().then(uid => {
      const targetUid = item.userId || uid;
      if (targetUid) {
        supabase.from('caderno_erros').insert([{
          id: newErro.id,
          user_id: targetUid,
          bloco_questoes_id: newErro.blocoQuestoesId || null,
          statement_or_excerpt: newErro.statementOrExcerpt,
          disciplina_id: newErro.disciplinaId,
          disciplina_name: newErro.disciplinaName,
          assunto_id: newErro.assuntoId || null,
          assunto_name: newErro.assuntoName,
          banca: newErro.banca,
          difficulty: newErro.difficulty,
          motivo: newErro.motivo,
          observation: newErro.observation,
          correct_answer: newErro.correctAnswer,
          question_url: newErro.questionUrl,
          status_revisao: newErro.statusRevisao,
          reincidencia_count: newErro.reincidenciaCount,
          last_reviewed_at: newErro.lastReviewedAt || null,
          next_review_at: newErro.nextReviewAt || null,
          created_at: newErro.createdAt,
          updated_at: newErro.updatedAt,
        }]).then(({ error }) => {
          if (error) console.warn('Gabarita: Erro ao inserir caderno de erro no Supabase:', error.message);
        });
      }
    });

    return newErro;
  }

  static async updateCadernoErro(id: string, partial: Partial<ItemCadernoErros>): Promise<ItemCadernoErros> {
    const list = await this.getCadernoErros();
    let updatedItem: ItemCadernoErros | null = null;
    const updated = list.map(e => {
      if (e.id === id) {
        updatedItem = {
          ...e,
          ...partial,
          updatedAt: new Date().toISOString(),
        };
        return updatedItem;
      }
      return e;
    });
    if (!updatedItem) throw new Error('Item do Caderno de Erros não encontrado.');
    saveStored(STORAGE_KEYS.CADERNO_ERROS, updated);

    const snakeObj: any = { updated_at: new Date().toISOString() };
    if (partial.statementOrExcerpt !== undefined) snakeObj.statement_or_excerpt = partial.statementOrExcerpt;
    if (partial.disciplinaName !== undefined) snakeObj.disciplina_name = partial.disciplinaName;
    if (partial.assuntoName !== undefined) snakeObj.assunto_name = partial.assuntoName;
    if (partial.banca !== undefined) snakeObj.banca = partial.banca;
    if (partial.difficulty !== undefined) snakeObj.difficulty = partial.difficulty;
    if (partial.motivo !== undefined) snakeObj.motivo = partial.motivo;
    if (partial.observation !== undefined) snakeObj.observation = partial.observation;
    if (partial.correctAnswer !== undefined) snakeObj.correct_answer = partial.correctAnswer;
    if (partial.questionUrl !== undefined) snakeObj.question_url = partial.questionUrl;
    if (partial.statusRevisao !== undefined) snakeObj.status_revisao = partial.statusRevisao;
    if (partial.reincidenciaCount !== undefined) snakeObj.reincidencia_count = partial.reincidenciaCount;
    if (partial.lastReviewedAt !== undefined) snakeObj.last_reviewed_at = partial.lastReviewedAt || null;
    if (partial.nextReviewAt !== undefined) snakeObj.next_review_at = partial.nextReviewAt || null;

    supabase.from('caderno_erros').update(snakeObj).eq('id', id).then(({ error }) => {
      if (error) console.warn('Gabarita: Erro ao atualizar item do caderno de erros no Supabase:', error.message);
    });

    return updatedItem;
  }

  static async deleteCadernoErro(id: string): Promise<ItemCadernoErros[]> {
    const list = await this.getCadernoErros();
    const updated = list.filter(e => e.id !== id);
    saveStored(STORAGE_KEYS.CADERNO_ERROS, updated);

    supabase.from('caderno_erros').delete().eq('id', id).then(({ error }) => {
      if (error) console.warn('Gabarita: Erro ao remover erro no Supabase:', error.message);
    });

    return updated;
  }

  static async incrementarReincidenciaErro(id: string): Promise<ItemCadernoErros> {
    const list = await this.getCadernoErros();
    let updatedItem: ItemCadernoErros | null = null;
    const updated = list.map(e => {
      if (e.id === id) {
        updatedItem = {
          ...e,
          reincidenciaCount: (e.reincidenciaCount || 1) + 1,
          statusRevisao: 'pendente',
          updatedAt: new Date().toISOString(),
        };
        return updatedItem;
      }
      return e;
    });
    if (!updatedItem) throw new Error('Item do Caderno de Erros não encontrado.');
    saveStored(STORAGE_KEYS.CADERNO_ERROS, updated);

    if (updatedItem) {
      const target = updatedItem as ItemCadernoErros;
      supabase.from('caderno_erros').update({
        reincidencia_count: target.reincidenciaCount,
        status_revisao: 'pendente',
        updated_at: target.updatedAt,
      }).eq('id', id).then(({ error }) => {
        if (error) console.warn('Gabarita: Erro ao atualizar reincidência no Supabase:', error.message);
      });
    }

    return updatedItem;
  }

  static async marcarStatusRevisaoErro(id: string, novoStatus: ErroStatusRevisao): Promise<ItemCadernoErros> {
    const list = await this.getCadernoErros();
    let updatedItem: ItemCadernoErros | null = null;
    const updated = list.map(e => {
      if (e.id === id) {
        updatedItem = {
          ...e,
          statusRevisao: novoStatus,
          lastReviewedAt: novoStatus !== 'pendente' ? new Date().toISOString() : e.lastReviewedAt,
          updatedAt: new Date().toISOString(),
        };
        return updatedItem;
      }
      return e;
    });
    if (!updatedItem) throw new Error('Item do Caderno de Erros não encontrado.');
    saveStored(STORAGE_KEYS.CADERNO_ERROS, updated);

    if (updatedItem) {
      const target = updatedItem as ItemCadernoErros;
      supabase.from('caderno_erros').update({
        status_revisao: target.statusRevisao,
        last_reviewed_at: target.lastReviewedAt || null,
        updated_at: target.updatedAt,
      }).eq('id', id).then(({ error }) => {
        if (error) console.warn('Gabarita: Erro ao atualizar status de erro no Supabase:', error.message);
      });
    }

    return updatedItem;
  }

  static async agendarRevisaoDoAssunto(
    userId: string,
    disciplinaId: string, 
    assuntoName: string, 
    method: '24h' | '7d' | '30d' = '24h',
    notes?: string
  ): Promise<Revisao> {
    const list = await this.getRevisoes();
    const disciplinas = await this.getDisciplinas();
    const disc = disciplinas.find(d => d.id === disciplinaId);
    const newRev: Revisao = {
      id: `rev_err_${Date.now()}`,
      userId,
      disciplinaId,
      disciplinaName: disc?.name || 'Geral',
      assuntoName,
      method,
      scheduledFor: new Date().toISOString().split('T')[0],
      status: 'pendente',
      notes: notes || `Revisão focada gerada a partir do Caderno de Erros.`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newRev, ...list];
    saveStored(STORAGE_KEYS.REVISOES, updated);
    return newRev;
  }

  // --- METAS, CONQUISTAS, MARCOS & ESTATÍSTICAS REAIS ---
  static async getMetas(): Promise<Meta[]> {
    try {
      const { data, error } = await supabase
        .from('metas')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const list = data.map(mapMetaFromDb);
        saveStored(STORAGE_KEYS.METAS, list);
        return list;
      }
    } catch (e) {
      console.warn('Gabarita: Falha ao buscar metas do Supabase:', e);
    }

    const list = loadStored<Meta[]>(STORAGE_KEYS.METAS, INITIAL_METAS);
    const currentUid = await getCurrentUserId();
    const stats = await this.getEstatisticasProgressoReal(currentUid);
    const nowIso = new Date().toISOString();
    const updated = list.map(m => {
      let calcValue = m.currentValue;
      if (m.targetType === 'horas' || m.targetType === 'horas_semanais') {
        if (m.period === 'diaria') calcValue = stats.horasHoje;
        else if (m.period === 'semanal') calcValue = stats.horasSemana;
        else if (m.period === 'mensal') calcValue = stats.horasMes;
      } else if (m.targetType === 'questoes' || m.targetType === 'questoes_resolvidas') {
        if (m.period === 'diaria') calcValue = stats.questoesHoje;
        else if (m.period === 'semanal') calcValue = stats.questoesSemana;
        else if (m.period === 'mensal') calcValue = stats.questoesMes;
      } else if (m.targetType === 'revisoes') {
        if (m.period === 'diaria') calcValue = stats.revisoesHoje;
        else if (m.period === 'semanal') calcValue = stats.revisoesSemana;
        else if (m.period === 'mensal') calcValue = stats.revisoesMes;
      } else if (m.targetType === 'taxa_acerto') {
        calcValue = stats.taxaAcertoGeral;
      } else if (m.targetType === 'topicos_concluidos') {
        calcValue = stats.topicosConcluidos;
      }
      const isCompleted = calcValue >= m.targetValue;
      return {
        ...m,
        currentValue: calcValue,
        status: isCompleted ? ('concluida' as const) : m.status === 'concluida' ? ('concluida' as const) : ('em_progresso' as const),
        completedAt: isCompleted && !m.completedAt ? nowIso : m.completedAt,
      };
    });
    saveStored(STORAGE_KEYS.METAS, updated);
    return updated;
  }

  static async addMeta(meta: Omit<Meta, 'id' | 'createdAt'>): Promise<Meta> {
    const list = await this.getMetas();
    const newMeta: Meta = {
      ...meta,
      id: `meta_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newMeta, ...list];
    saveStored(STORAGE_KEYS.METAS, updated);

    getCurrentUserId().then(uid => {
      const targetUid = meta.userId || uid;
      if (targetUid) {
        supabase.from('metas').insert([{
          id: newMeta.id,
          user_id: targetUid,
          title: newMeta.title,
          target_type: newMeta.targetType,
          target_value: newMeta.targetValue,
          current_value: newMeta.currentValue,
          unit: newMeta.unit,
          deadline: newMeta.deadline,
          period: newMeta.period,
          status: newMeta.status,
          auto_calculate: newMeta.autoCalculate,
          completed_at: newMeta.completedAt || null,
          created_at: newMeta.createdAt,
        }]).then(({ error }) => {
          if (error) console.warn('Gabarita: Erro ao inserir meta no Supabase:', error.message);
        });
      }
    });

    return newMeta;
  }

  static async updateMeta(id: string, partial: Partial<Meta>): Promise<Meta> {
    const list = await this.getMetas();
    let updatedMeta: Meta | null = null;
    const updated = list.map(m => {
      if (m.id === id) {
        updatedMeta = { ...m, ...partial };
        return updatedMeta;
      }
      return m;
    });
    if (!updatedMeta) throw new Error('Meta não encontrada.');
    saveStored(STORAGE_KEYS.METAS, updated);

    const snakeObj: any = {};
    if (partial.title !== undefined) snakeObj.title = partial.title;
    if (partial.targetType !== undefined) snakeObj.target_type = partial.targetType;
    if (partial.targetValue !== undefined) snakeObj.target_value = partial.targetValue;
    if (partial.currentValue !== undefined) snakeObj.current_value = partial.currentValue;
    if (partial.unit !== undefined) snakeObj.unit = partial.unit;
    if (partial.deadline !== undefined) snakeObj.deadline = partial.deadline;
    if (partial.period !== undefined) snakeObj.period = partial.period;
    if (partial.status !== undefined) snakeObj.status = partial.status;
    if (partial.autoCalculate !== undefined) snakeObj.auto_calculate = partial.autoCalculate;
    if (partial.completedAt !== undefined) snakeObj.completed_at = partial.completedAt || null;

    supabase.from('metas').update(snakeObj).eq('id', id).then(({ error }) => {
      if (error) console.warn('Gabarita: Erro ao atualizar meta no Supabase:', error.message);
    });

    return updatedMeta;
  }

  static async deleteMeta(id: string): Promise<Meta[]> {
    const list = await this.getMetas();
    const updated = list.filter(m => m.id !== id);
    saveStored(STORAGE_KEYS.METAS, updated);

    supabase.from('metas').delete().eq('id', id).then(({ error }) => {
      if (error) console.warn('Gabarita: Erro ao remover meta no Supabase:', error.message);
    });

    return updated;
  }

  static async getConquistas(): Promise<Conquista[]> {
    const list = loadStored<Conquista[]>(STORAGE_KEYS.CONQUISTAS, INITIAL_CONQUISTAS);
    const stats = await this.getEstatisticasProgressoReal('user_demo_01');
    const simulados = await this.getSimulados();
    const caderno = await this.getCadernoErros();
    const nowIso = new Date().toISOString();
    const finishedSimulados = simulados.filter(s => s.status === 'finalizado');
    const errosDominados = caderno.filter(e => e.statusRevisao === 'dominado').length;

    const updated = list.map(ach => {
      let current = ach.currentValue;
      if (ach.id === 'ach_first_step') {
        current = stats.horasTotal > 0 ? 1 : 0;
      } else if (ach.id === 'ach_centuriao_questoes') {
        current = stats.questoesTotal;
      } else if (ach.id === 'ach_mestre_questoes') {
        current = stats.questoesTotal;
      } else if (ach.id === 'ach_ritmo_aco') {
        current = stats.streakDias;
      } else if (ach.id === 'ach_habito_inabalavel') {
        current = stats.streakDias;
      } else if (ach.id === 'ach_revisor_implacavel') {
        current = stats.revisoesTotal;
      } else if (ach.id === 'ach_gabaritando_alto') {
        current = stats.taxaAcertoGeral;
      } else if (ach.id === 'ach_caderno_limpo') {
        current = errosDominados;
      } else if (ach.id === 'ach_simulado_real') {
        current = finishedSimulados.length;
      }
      const shouldUnlock = current >= ach.requiredValue;
      return {
        ...ach,
        currentValue: current,
        unlocked: ach.unlocked || shouldUnlock,
        unlockedAt: ach.unlocked ? ach.unlockedAt : shouldUnlock ? nowIso : undefined,
      };
    });
    saveStored(STORAGE_KEYS.CONQUISTAS, updated);
    return updated;
  }

  static async getMarcos(): Promise<MarcoEstudo[]> {
    const list = loadStored<MarcoEstudo[]>(STORAGE_KEYS.MARCOS, INITIAL_MARCOS);
    const stats = await this.getEstatisticasProgressoReal('user_demo_01');
    const simulados = await this.getSimulados();
    const finishedSimulados = simulados.filter(s => s.status === 'finalizado').length;
    const nowIso = new Date().toISOString();

    const updated = list.map(marco => {
      let current = marco.currentValue;
      if (marco.category === 'simulados') {
        current = finishedSimulados;
      } else if (marco.category === 'horas') {
        current = stats.horasTotal;
      } else if (marco.category === 'questoes') {
        current = stats.questoesTotal;
      } else if (marco.category === 'edital') {
        current = stats.percentualEdital;
      }
      const isCompleted = current >= marco.targetValue;
      return {
        ...marco,
        currentValue: current,
        isCompleted: marco.isCompleted || isCompleted,
        completedAt: marco.isCompleted ? marco.completedAt : isCompleted ? nowIso : undefined,
      };
    });
    saveStored(STORAGE_KEYS.MARCOS, updated);
    return updated;
  }

  static async getEstatisticasProgressoReal(userId: string): Promise<EstatisticasProgressoReal> {
    const [
      user,
      sessoes,
      blocosQuestoes,
      revisoes,
      assuntos,
      simulados
    ] = await Promise.all([
      this.getUserProfile(userId),
      this.getSessoes(),
      this.getBlocosQuestoes(),
      this.getRevisoes(),
      this.getAssuntos(),
      this.getSimulados()
    ]);

    const now = new Date();
    const todayStr = PlannerService.formatLocalDate(now);
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    const mondayStr = PlannerService.formatLocalDate(monday);
    const firstDayMonthStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-01`;

    let minutosHoje = 0;
    let minutosSemana = 0;
    let minutosMes = 0;
    let minutosTotal = 0;

    sessoes.forEach((s: SessaoEstudo) => {
      const sDate = s.completedAt ? s.completedAt.split('T')[0] : (s.createdAt ? s.createdAt.split('T')[0] : '');
      const min = s.durationMinutes || 0;
      minutosTotal += min;
      if (sDate === todayStr) minutosHoje += min;
      if (sDate >= mondayStr) minutosSemana += min;
      if (sDate >= firstDayMonthStr) minutosMes += min;
    });

    simulados.filter((sim: Simulado) => sim.status === 'finalizado').forEach((sim: Simulado) => {
      const simDate = sim.finishedAt ? sim.finishedAt.split('T')[0] : (sim.startedAt ? sim.startedAt.split('T')[0] : '');
      const simMin = Math.round((sim.elapsedSeconds || (sim.durationMinutes * 60)) / 60);
      minutosTotal += simMin;
      if (simDate === todayStr) minutosHoje += simMin;
      if (simDate >= mondayStr) minutosSemana += simMin;
      if (simDate >= firstDayMonthStr) minutosMes += simMin;
    });

    let questoesHoje = 0;
    let questoesSemana = 0;
    let questoesMes = 0;
    let questoesTotal = 0;
    let acertosTotal = 0;

    blocosQuestoes.forEach((b: RegistroBlocoQuestoes) => {
      const bDate = b.date || (b.createdAt ? b.createdAt.split('T')[0] : '');
      const tot = b.totalQuestions || 0;
      const cor = b.correctAnswers || 0;
      questoesTotal += tot;
      acertosTotal += cor;
      if (bDate === todayStr) questoesHoje += tot;
      if (bDate >= mondayStr) questoesSemana += tot;
      if (bDate >= firstDayMonthStr) questoesMes += tot;
    });

    simulados.filter((sim: Simulado) => sim.status === 'finalizado').forEach((sim: Simulado) => {
      const simDate = sim.finishedAt ? sim.finishedAt.split('T')[0] : '';
      const tot = sim.questionsCount || (sim.questoes?.length || 0);
      const cor = sim.totalCorrect || 0;
      questoesTotal += tot;
      acertosTotal += cor;
      if (simDate === todayStr) questoesHoje += tot;
      if (simDate >= mondayStr) questoesSemana += tot;
      if (simDate >= firstDayMonthStr) questoesMes += tot;
    });

    const taxaAcertoGeral = questoesTotal > 0 ? Math.round((acertosTotal / questoesTotal) * 100) : 80;

    let revisoesHoje = 0;
    let revisoesSemana = 0;
    let revisoesMes = 0;
    let revisoesTotal = 0;

    revisoes.filter((r: Revisao) => r.status === 'concluida').forEach((r: Revisao) => {
      const rDate = r.completedAt ? r.completedAt.split('T')[0] : (r.scheduledFor ? r.scheduledFor.split('T')[0] : '');
      revisoesTotal++;
      if (rDate === todayStr) revisoesHoje++;
      if (rDate >= mondayStr) revisoesSemana++;
      if (rDate >= firstDayMonthStr) revisoesMes++;
    });

    const activeDatesSet = new Set<string>();
    sessoes.forEach((s: SessaoEstudo) => {
      const d = s.completedAt ? s.completedAt.split('T')[0] : (s.createdAt ? s.createdAt.split('T')[0] : '');
      if (d) activeDatesSet.add(d);
    });
    blocosQuestoes.forEach((b: RegistroBlocoQuestoes) => {
      const d = b.date || (b.createdAt ? b.createdAt.split('T')[0] : '');
      if (d) activeDatesSet.add(d);
    });
    revisoes.filter((r: Revisao) => r.status === 'concluida').forEach((r: Revisao) => {
      const d = r.completedAt ? r.completedAt.split('T')[0] : '';
      if (d) activeDatesSet.add(d);
    });
    simulados.filter((s: Simulado) => s.status === 'finalizado').forEach((s: Simulado) => {
      const d = s.finishedAt ? s.finishedAt.split('T')[0] : '';
      if (d) activeDatesSet.add(d);
    });

    let streakCount = 0;
    let checkDate = new Date(now);
    const hasToday = activeDatesSet.has(todayStr);
    if (!hasToday) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    while (true) {
      const dStr = PlannerService.formatLocalDate(checkDate);
      if (activeDatesSet.has(dStr)) {
        streakCount++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    if (hasToday && streakCount === 0) streakCount = 1;
    const finalStreak = Math.max(streakCount, user.streakDays || 1);

    const diasSemanaNomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const diasAtivosUltimaSemana = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dStr = PlannerService.formatLocalDate(d);
      const diaNome = diasSemanaNomes[d.getDay()];
      let minNoDia = 0;
      sessoes.filter((s: SessaoEstudo) => (s.completedAt ? s.completedAt.split('T')[0] : (s.createdAt ? s.createdAt.split('T')[0] : '')) === dStr).forEach((s: SessaoEstudo) => minNoDia += s.durationMinutes || 0);
      simulados.filter((s: Simulado) => s.status === 'finalizado' && s.finishedAt?.split('T')[0] === dStr).forEach((s: Simulado) => minNoDia += Math.round((s.elapsedSeconds || 0) / 60));
      diasAtivosUltimaSemana.push({
        data: dStr,
        diaSemana: diaNome,
        estudou: activeDatesSet.has(dStr) || minNoDia > 0,
        minutos: minNoDia,
      });
    }

    const totalTopicos = assuntos.length || 1;
    const topicosConcluidos = assuntos.filter((a: Assunto) => a.status === 'dominado' || a.status === 'revisado').length;
    const percentualEdital = Math.round((topicosConcluidos / totalTopicos) * 100);

    const xpTotal = user.xp || 3420;
    const nivelAtual = Math.floor(xpTotal / 1000) + 1;
    const xpNivelAtual = xpTotal % 1000;
    const xpProximoNivel = 1000;
    const percentualNivel = Math.round((xpNivelAtual / xpProximoNivel) * 100);
    const titulosPorNivel = [
      'Iniciante Concurseiro',
      'Estudante Comprometido',
      'Gabaritador em Ascensão',
      'Especialista em Editais',
      'Futuro Servidor de Elite',
      'Mestre da Aprovação'
    ];
    const tituloNivel = titulosPorNivel[Math.min(nivelAtual - 1, titulosPorNivel.length - 1)];

    return {
      horasHoje: Math.round((minutosHoje / 60) * 10) / 10,
      horasSemana: Math.round((minutosSemana / 60) * 10) / 10,
      horasMes: Math.round((minutosMes / 60) * 10) / 10,
      horasTotal: Math.round((minutosTotal / 60) * 10) / 10,
      questoesHoje,
      questoesSemana,
      questoesMes,
      questoesTotal,
      acertosTotal,
      taxaAcertoGeral,
      revisoesHoje,
      revisoesSemana,
      revisoesMes,
      revisoesTotal,
      streakDias: finalStreak,
      melhorStreakDias: Math.max(finalStreak, 21),
      diasAtivosUltimaSemana,
      topicosConcluidos,
      topicosTotal: totalTopicos,
      percentualEdital,
      xpTotal,
      nivelAtual,
      tituloNivel,
      xpProximoNivel,
      xpNivelAtual,
      percentualNivel,
    };
  }

  // --- SIMULADOS ---
  static async getSimulados(): Promise<Simulado[]> {
    try {
      const { data, error } = await supabase
        .from('simulados')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const list = data.map(mapSimuladoFromDb);
        saveStored(STORAGE_KEYS.SIMULADOS, list);
        return list;
      }
    } catch (e) {
      console.warn('Gabarita: Falha ao buscar simulados do Supabase:', e);
    }

    const list = loadStored<Simulado[]>(STORAGE_KEYS.SIMULADOS, INITIAL_SIMULADOS);
    return list;
  }

  static async getSimuladoById(id: string): Promise<Simulado | null> {
    const list = await this.getSimulados();
    return list.find(s => s.id === id) || null;
  }

  static async createSimulado(data: {
    userId: string;
    concursoId?: string;
    concursoName?: string;
    title: string;
    description?: string;
    banca?: string;
    modalidade?: 'multipla_escolha' | 'certo_errado';
    cebraspePenalty?: boolean;
    durationMinutes: number;
    disciplinasConfig?: SimuladoDisciplinaConfig[];
    status?: SimuladoStatus;
    customQuestoes?: SimuladoQuestao[];
    questionsCount?: number;
    totalCorrect?: number;
    totalWrong?: number;
    totalBlank?: number;
    accuracyRate?: number;
    score?: number;
    maxScore?: number;
    desempenhoPorDisciplina?: SimuladoDesempenhoDisciplina[];
    finishedAt?: string;
    createdAt?: string;
  }): Promise<Simulado> {
    const list = await this.getSimulados();
    const modalidade = data.modalidade || 'multipla_escolha';
    const createdAt = data.createdAt || new Date().toISOString();
    const finishedAt = data.finishedAt || (data.status === 'finalizado' ? createdAt : undefined);

    // Se já é um simulado registrado com desempenho por disciplina
    if (data.desempenhoPorDisciplina && data.desempenhoPorDisciplina.length > 0) {
      const questionsCount = data.questionsCount || data.desempenhoPorDisciplina.reduce((acc, d) => acc + (d.totalQuestoes || 0), 0);
      const totalCorrect = data.totalCorrect !== undefined ? data.totalCorrect : data.desempenhoPorDisciplina.reduce((acc, d) => acc + (d.acertos || 0), 0);
      const totalWrong = data.totalWrong !== undefined ? data.totalWrong : data.desempenhoPorDisciplina.reduce((acc, d) => acc + (d.erros || 0), 0);
      const totalBlank = data.totalBlank !== undefined ? data.totalBlank : data.desempenhoPorDisciplina.reduce((acc, d) => acc + (d.brancos || 0), 0);
      const accuracyRate = data.accuracyRate !== undefined 
        ? data.accuracyRate 
        : questionsCount > 0 ? Math.round((totalCorrect / questionsCount) * 100) : 0;
      const score = data.score !== undefined ? data.score : (totalCorrect - totalWrong);

      const newSimulado: Simulado = {
        id: `sim_${Date.now()}`,
        userId: data.userId,
        concursoId: data.concursoId,
        concursoName: data.concursoName,
        title: data.title,
        description: data.description || '',
        banca: data.banca || 'FGV',
        modalidade,
        cebraspePenalty: data.cebraspePenalty || false,
        questionsCount,
        durationMinutes: data.durationMinutes || 180,
        elapsedSeconds: (data.durationMinutes || 180) * 60,
        score,
        maxScore: data.maxScore || questionsCount,
        accuracyRate,
        totalCorrect,
        totalWrong,
        totalBlank,
        desempenhoPorDisciplina: data.desempenhoPorDisciplina,
        status: data.status || 'finalizado',
        createdAt,
        finishedAt,
        updatedAt: new Date().toISOString(),
      };

      const updated = [newSimulado, ...list];
      saveStored(STORAGE_KEYS.SIMULADOS, updated);

      getCurrentUserId().then(uid => {
        const targetUid = data.userId || uid;
        if (targetUid) {
          supabase.from('simulados').insert([{
            id: newSimulado.id,
            user_id: targetUid,
            concurso_id: newSimulado.concursoId || null,
            concurso_name: newSimulado.concursoName || null,
            title: newSimulado.title,
            description: newSimulado.description || null,
            banca: newSimulado.banca || 'FGV',
            modalidade: newSimulado.modalidade,
            cebraspe_penalty: newSimulado.cebraspePenalty,
            questions_count: newSimulado.questionsCount,
            duration_minutes: newSimulado.durationMinutes,
            time_remaining_seconds: newSimulado.timeRemainingSeconds ?? null,
            elapsed_seconds: newSimulado.elapsedSeconds ?? null,
            disciplinas_config: newSimulado.disciplinasConfig || [],
            questoes: newSimulado.questoes || [],
            score: newSimulado.score ?? null,
            max_score: newSimulado.maxScore,
            accuracy_rate: newSimulado.accuracyRate ?? null,
            total_correct: newSimulado.totalCorrect ?? null,
            total_wrong: newSimulado.totalWrong ?? null,
            total_blank: newSimulado.totalBlank ?? null,
            status: newSimulado.status,
            started_at: newSimulado.startedAt || null,
            finished_at: newSimulado.finishedAt || null,
            desempenho_por_disciplina: newSimulado.desempenhoPorDisciplina || [],
            feedback: newSimulado.feedback || null,
            created_at: newSimulado.createdAt,
            updated_at: newSimulado.updatedAt || newSimulado.createdAt,
          }]).then(({ error }) => {
            if (error) console.warn('Gabarita: Erro ao inserir simulado no Supabase:', error.message);
          });
        }
      });

      return newSimulado;
    }

    const allDisciplinas = await this.getDisciplinas();
    const allAssuntos = await this.getAssuntos();
    const allBancoQuestoes = await this.getQuestoes();
    let questionsCount = 0;
    const questoes: SimuladoQuestao[] = [];

    if (data.customQuestoes && data.customQuestoes.length > 0) {
      questoes.push(...data.customQuestoes.map((q, idx) => ({ ...q, numero: idx + 1 })));
      questionsCount = questoes.length;
    } else if (data.disciplinasConfig && data.disciplinasConfig.length > 0) {
      let numeroAtual = 1;
      for (const discConfig of data.disciplinasConfig) {
        const disc = allDisciplinas.find(d => d.id === discConfig.disciplinaId);
        const discName = discConfig.disciplinaName || disc?.name || 'Disciplina Geral';
        const discAssuntos = allAssuntos.filter(a => a.disciplinaId === discConfig.disciplinaId);
        const bancoMatching = allBancoQuestoes.filter(q => q.disciplinaId === discConfig.disciplinaId);

        for (let i = 0; i < discConfig.questionsCount; i++) {
          const matchingQuestao = bancoMatching[i % Math.max(1, bancoMatching.length)];
          const targetAssunto = discAssuntos.length > 0 ? discAssuntos[i % discAssuntos.length] : undefined;

          if (matchingQuestao && modalidade === 'multipla_escolha') {
            questoes.push({
              id: `sq_${Date.now()}_${numeroAtual}`,
              numero: numeroAtual,
              disciplinaId: discConfig.disciplinaId,
              disciplinaName: discName,
              assuntoId: matchingQuestao.assuntoId || targetAssunto?.id,
              assuntoName: matchingQuestao.assuntoName || targetAssunto?.name || 'Tópicos Gerais',
              banca: matchingQuestao.banca || data.banca || 'FGV',
              statement: matchingQuestao.statement,
              options: matchingQuestao.options.map(o => ({ id: o.id, text: o.text })),
              correctOptionId: matchingQuestao.correctOptionId,
              explanation: matchingQuestao.explanation,
              difficulty: matchingQuestao.difficulty,
            });
          } else if (modalidade === 'certo_errado') {
            const isCerto = i % 2 === 0;
            const assuntoTitle = targetAssunto?.name || 'Normas e Jurisprudência';
            questoes.push({
              id: `sq_${Date.now()}_${numeroAtual}`,
              numero: numeroAtual,
              disciplinaId: discConfig.disciplinaId,
              disciplinaName: discName,
              assuntoId: targetAssunto?.id,
              assuntoName: assuntoTitle,
              banca: data.banca || 'Cebraspe',
              statement: `(${data.banca || 'Cebraspe'} - Auditor/Analista) No que tange a ${assuntoTitle}, julgue o item a seguir com base na legislação e jurisprudência aplicáveis: ${
                isCerto 
                  ? `A atuação do órgão fiscalizador obedece estritamente aos preceitos da legalidade e publicidade, sendo admitida a auditoria operacional concomitante.`
                  : `É prescindível a observância do contraditório e da ampla defesa nos processos disciplinares de que possa resultar sanção gravosa.`
              }`,
              options: [
                { id: 'C', text: 'CERTO' },
                { id: 'E', text: 'ERRADO' }
              ],
              correctOptionId: isCerto ? 'C' : 'E',
              explanation: isCerto 
                ? 'Gabarito CERTO: Em perfeita consonância com os princípios constitucionais fundamentais da Administração Pública e normas de auditoria governamental.'
                : 'Gabarito ERRADO: O contraditório e a ampla defesa são garantias constitucionais expressas e inafastáveis (Art. 5º, LV, CF/88).',
              difficulty: i % 3 === 0 ? 'dificil' : 'media',
            });
          } else {
            const assuntoTitle = targetAssunto?.name || 'Conceitos Fundamentais';
            questoes.push({
              id: `sq_${Date.now()}_${numeroAtual}`,
              numero: numeroAtual,
              disciplinaId: discConfig.disciplinaId,
              disciplinaName: discName,
              assuntoId: targetAssunto?.id,
              assuntoName: assuntoTitle,
              banca: data.banca || 'FGV',
              statement: `Em relação à disciplina de ${discName}, especificamente sobre o tópico "${assuntoTitle}", assinale a alternativa que apresenta a assertiva juridicamente e tecnicamente correta segundo a doutrina e normas vigentes:`,
              options: [
                { id: 'opt_a', text: `A competência para a prática do ato administrativo relativo a ${assuntoTitle} é delegável em sua totalidade, sem qualquer ressalva legal.` },
                { id: 'opt_b', text: `Os procedimentos formais e prazos de análise aplicáveis ao tema ${assuntoTitle} devem observar rigorosamente os princípios da motivação, razoabilidade e devido processo legal.` },
                { id: 'opt_c', text: `É vedada qualquer forma de fiscalização ou controle prévio pelos órgãos centrais de controle interno.` },
                { id: 'opt_d', text: `A discricionariedade administrativa é absoluta e imune a qualquer exame de proporcionalidade pelo Poder Judiciário.` },
                { id: 'opt_e', text: `Os efeitos da decisão proferida em sede recursal produzem efeitos meramente prospectivos e sem força executiva.` }
              ],
              correctOptionId: 'opt_b',
              explanation: 'Gabarito B: A motivação explícita, a razoabilidade e a observância do devido processo legal constituem garantias estruturantes indispensáveis na ordem jurídica.',
              difficulty: i % 2 === 0 ? 'media' : 'dificil',
            });
          }
          numeroAtual++;
        }
      }
      questionsCount = questoes.length;
    } else {
      questionsCount = data.questionsCount || 0;
    }

    const newSimulado: Simulado = {
      id: `sim_${Date.now()}`,
      userId: data.userId,
      concursoId: data.concursoId,
      concursoName: data.concursoName,
      title: data.title,
      description: data.description || '',
      banca: data.banca || 'FGV',
      modalidade,
      cebraspePenalty: data.cebraspePenalty || false,
      questionsCount,
      durationMinutes: data.durationMinutes || 120,
      timeRemainingSeconds: (data.durationMinutes || 120) * 60,
      elapsedSeconds: 0,
      disciplinasConfig: data.disciplinasConfig,
      questoes,
      maxScore: questionsCount,
      status: data.status || 'agendado',
      createdAt,
      finishedAt,
      updatedAt: new Date().toISOString(),
    };

    const updated = [newSimulado, ...list];
    saveStored(STORAGE_KEYS.SIMULADOS, updated);

    getCurrentUserId().then(uid => {
      const targetUid = data.userId || uid;
      if (targetUid) {
        supabase.from('simulados').insert([{
          id: newSimulado.id,
          user_id: targetUid,
          concurso_id: newSimulado.concursoId || null,
          concurso_name: newSimulado.concursoName || null,
          title: newSimulado.title,
          description: newSimulado.description || null,
          banca: newSimulado.banca || 'FGV',
          modalidade: newSimulado.modalidade,
          cebraspe_penalty: newSimulado.cebraspePenalty,
          questions_count: newSimulado.questionsCount,
          duration_minutes: newSimulado.durationMinutes,
          time_remaining_seconds: newSimulado.timeRemainingSeconds ?? null,
          elapsed_seconds: newSimulado.elapsedSeconds ?? null,
          disciplinas_config: newSimulado.disciplinasConfig || [],
          questoes: newSimulado.questoes || [],
          score: newSimulado.score ?? null,
          max_score: newSimulado.maxScore,
          accuracy_rate: newSimulado.accuracyRate ?? null,
          total_correct: newSimulado.totalCorrect ?? null,
          total_wrong: newSimulado.totalWrong ?? null,
          total_blank: newSimulado.totalBlank ?? null,
          status: newSimulado.status,
          started_at: newSimulado.startedAt || null,
          finished_at: newSimulado.finishedAt || null,
          desempenho_por_disciplina: newSimulado.desempenhoPorDisciplina || [],
          feedback: newSimulado.feedback || null,
          created_at: newSimulado.createdAt,
          updated_at: newSimulado.updatedAt || newSimulado.createdAt,
        }]).then(({ error }) => {
          if (error) console.warn('Gabarita: Erro ao inserir simulado no Supabase:', error.message);
        });
      }
    });

    return newSimulado;
  }

  static async updateSimulado(id: string, partial: Partial<Simulado>): Promise<Simulado> {
    const list = await this.getSimulados();
    let updatedItem: Simulado | null = null;
    const updated = list.map(s => {
      if (s.id === id) {
        updatedItem = {
          ...s,
          ...partial,
          updatedAt: new Date().toISOString(),
        };
        return updatedItem;
      }
      return s;
    });
    if (!updatedItem) throw new Error('Simulado não encontrado.');
    saveStored(STORAGE_KEYS.SIMULADOS, updated);

    const snakeObj: any = { updated_at: (updatedItem as Simulado).updatedAt };
    if (partial.title !== undefined) snakeObj.title = partial.title;
    if (partial.description !== undefined) snakeObj.description = partial.description;
    if (partial.status !== undefined) snakeObj.status = partial.status;
    if (partial.score !== undefined) snakeObj.score = partial.score;
    if (partial.accuracyRate !== undefined) snakeObj.accuracy_rate = partial.accuracyRate;
    if (partial.totalCorrect !== undefined) snakeObj.total_correct = partial.totalCorrect;
    if (partial.totalWrong !== undefined) snakeObj.total_wrong = partial.totalWrong;
    if (partial.totalBlank !== undefined) snakeObj.total_blank = partial.totalBlank;
    if (partial.timeRemainingSeconds !== undefined) snakeObj.time_remaining_seconds = partial.timeRemainingSeconds;
    if (partial.elapsedSeconds !== undefined) snakeObj.elapsed_seconds = partial.elapsedSeconds;
    if (partial.finishedAt !== undefined) snakeObj.finished_at = partial.finishedAt;
    if (partial.startedAt !== undefined) snakeObj.started_at = partial.startedAt;
    if (partial.questoes !== undefined) snakeObj.questoes = partial.questoes;
    if (partial.desempenhoPorDisciplina !== undefined) snakeObj.desempenho_por_disciplina = partial.desempenhoPorDisciplina;

    supabase.from('simulados').update(snakeObj).eq('id', id).then(({ error }) => {
      if (error) console.warn('Gabarita: Erro ao atualizar simulado no Supabase:', error.message);
    });

    return updatedItem;
  }

  static async deleteSimulado(id: string): Promise<Simulado[]> {
    const list = await this.getSimulados();
    const updated = list.filter(s => s.id !== id);
    saveStored(STORAGE_KEYS.SIMULADOS, updated);

    supabase.from('simulados').delete().eq('id', id).then(({ error }) => {
      if (error) console.warn('Gabarita: Erro ao excluir simulado no Supabase:', error.message);
    });

    return updated;
  }

  static async saveSimuladoProgress(
    id: string, 
    data: {
      answers?: Record<number, string>;
      doubting?: Record<number, boolean>;
      timeRemainingSeconds?: number;
      elapsedSeconds?: number;
      status?: SimuladoStatus
    }
  ): Promise<Simulado> {
    const simulado = await this.getSimuladoById(id);
    if (!simulado) throw new Error('Simulado não encontrado.');
    const updatedQuestoes = (simulado.questoes || []).map(q => {
      const ans = data.answers ? data.answers[q.numero] : q.userAnswer;
      const dbt = data.doubting ? data.doubting[q.numero] : q.isDoubting;
      return {
        ...q,
        userAnswer: ans,
        isDoubting: dbt,
      };
    });
    return this.updateSimulado(id, {
      questoes: updatedQuestoes,
      timeRemainingSeconds: data.timeRemainingSeconds !== undefined ? data.timeRemainingSeconds : simulado.timeRemainingSeconds,
      elapsedSeconds: data.elapsedSeconds !== undefined ? data.elapsedSeconds : simulado.elapsedSeconds,
      status: data.status || simulado.status,
    });
  }

  static async finishSimulado(
    id: string,
    payload: {
      answers: Record<number, string>;
      doubting?: Record<number, boolean>;
      elapsedSeconds: number;
    }
  ): Promise<Simulado> {
    const simulado = await this.getSimuladoById(id);
    if (!simulado) throw new Error('Simulado não encontrado.');
    const allDisciplinas = await this.getDisciplinas();
    const allAssuntos = await this.getAssuntos();
    const nowIso = new Date().toISOString();

    let totalCorrect = 0;
    let totalWrong = 0;
    let totalBlank = 0;

    const discStatsMap = new Map<string, {
      disciplinaId: string;
      disciplinaName: string;
      total: number;
      correct: number;
      wrong: number;
      blank: number;
      assuntosMap: Map<string, { total: number; correct: number; wrong: number; assuntoId?: string }>;
    }>();

    const evaluatedQuestoes: SimuladoQuestao[] = (simulado.questoes || []).map(q => {
      const userAnswer = payload.answers[q.numero] || undefined;
      const isDoubting = payload.doubting ? !!payload.doubting[q.numero] : false;
      const isCorrect = userAnswer ? (userAnswer.trim().toLowerCase() === q.correctOptionId.trim().toLowerCase()) : false;
      const isBlank = !userAnswer || userAnswer.trim() === '';

      if (isBlank) {
        totalBlank++;
      } else if (isCorrect) {
        totalCorrect++;
      } else {
        totalWrong++;
      }

      const discKey = q.disciplinaId || 'disc_geral';
      if (!discStatsMap.has(discKey)) {
        discStatsMap.set(discKey, {
          disciplinaId: discKey,
          disciplinaName: q.disciplinaName,
          total: 0,
          correct: 0,
          wrong: 0,
          blank: 0,
          assuntosMap: new Map(),
        });
      }
      const discStat = discStatsMap.get(discKey)!;
      discStat.total++;
      if (isBlank) discStat.blank++;
      else if (isCorrect) discStat.correct++;
      else discStat.wrong++;

      const assuntoKey = q.assuntoName || 'Geral';
      if (!discStat.assuntosMap.has(assuntoKey)) {
        discStat.assuntosMap.set(assuntoKey, { total: 0, correct: 0, wrong: 0, assuntoId: q.assuntoId });
      }
      const assStat = discStat.assuntosMap.get(assuntoKey)!;
      assStat.total++;
      if (isCorrect) assStat.correct++;
      else if (!isBlank) assStat.wrong++;

      return {
        ...q,
        userAnswer,
        isCorrect: isBlank ? false : isCorrect,
        isDoubting,
      };
    });

    const totalQuestions = evaluatedQuestoes.length || simulado.questionsCount || 1;
    let finalScore = totalCorrect;
    if (simulado.cebraspePenalty) {
      finalScore = Math.max(0, totalCorrect - totalWrong);
    }
    const accuracyRate = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    const desempenhoPorDisciplina: SimuladoDesempenhoDisciplina[] = Array.from(discStatsMap.values()).map(d => {
      const discTaxa = d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0;
      const liquidScore = simulado.cebraspePenalty ? Math.max(0, d.correct - d.wrong) : d.correct;
      const desempenhoAssuntos = Array.from(d.assuntosMap.entries()).map(([assName, assVal]) => ({
        assuntoId: assVal.assuntoId,
        assuntoName: assName,
        totalQuestoes: assVal.total,
        acertos: assVal.correct,
        erros: assVal.wrong,
        taxaAcerto: assVal.total > 0 ? Math.round((assVal.correct / assVal.total) * 100) : 0,
      }));
      return {
        disciplinaId: d.disciplinaId,
        disciplinaName: d.disciplinaName,
        totalQuestoes: d.total,
        acertos: d.correct,
        erros: d.wrong,
        brancos: d.blank,
        taxaAcerto: discTaxa,
        pontuacaoLiquida: liquidScore,
        desempenhoAssuntos,
      };
    });

    const updatedAssuntos = allAssuntos.map(ass => {
      let addedTotal = 0;
      let addedCorrect = 0;
      evaluatedQuestoes.forEach(q => {
        if (q.assuntoId === ass.id || q.assuntoName === ass.name) {
          addedTotal++;
          if (q.isCorrect) addedCorrect++;
        }
      });
      if (addedTotal > 0) {
        const newTotalQ = (ass.totalQuestionsSolved || 0) + addedTotal;
        const newCorrectQ = (ass.correctQuestionsSolved || 0) + addedCorrect;
        const newAcc = newTotalQ > 0 ? Math.round((newCorrectQ / newTotalQ) * 100) : ass.accuracyRate || 0;
        return {
          ...ass,
          lastStudiedAt: nowIso,
          totalQuestionsSolved: newTotalQ,
          correctQuestionsSolved: newCorrectQ,
          accuracyRate: newAcc,
          status: ass.status === 'nao_iniciado' ? ('em_estudo' as const) : ass.status,
        };
      }
      return ass;
    });
    saveStored(STORAGE_KEYS.ASSUNTOS, updatedAssuntos);

    const durationMinutesGasto = Math.max(1, Math.round(payload.elapsedSeconds / 60));
    const updatedDisciplinas = allDisciplinas.map(disc => {
      const matchInSim = desempenhoPorDisciplina.find(d => d.disciplinaId === disc.id);
      if (matchInSim) {
        const discRatio = matchInSim.totalQuestoes / totalQuestions;
        const addedMin = Math.round(durationMinutesGasto * discRatio);
        return {
          ...disc,
          totalStudyMinutes: (disc.totalStudyMinutes || 0) + addedMin,
        };
      }
      return disc;
    });
    saveStored(STORAGE_KEYS.DISCIPLINAS, updatedDisciplinas);

    const user = await this.getUserProfile(simulado.userId);
    const addedXp = (totalCorrect * 15) + 50;
    await this.updateUserProfile({
      xp: (user.xp || 0) + addedXp,
      level: Math.floor(((user.xp || 0) + addedXp) / 1000) + 1,
      lastStudyDate: nowIso,
    });

    const finishedSimulado: Simulado = {
      ...simulado,
      questoes: evaluatedQuestoes,
      score: finalScore,
      maxScore: totalQuestions,
      accuracyRate,
      totalCorrect,
      totalWrong,
      totalBlank,
      elapsedSeconds: payload.elapsedSeconds,
      timeRemainingSeconds: 0,
      desempenhoPorDisciplina,
      status: 'finalizado',
      finishedAt: nowIso,
      startedAt: simulado.startedAt || nowIso,
      updatedAt: nowIso,
    };

    const list = await this.getSimulados();
    const updatedSimulados = list.map(s => s.id === id ? finishedSimulado : s);
    saveStored(STORAGE_KEYS.SIMULADOS, updatedSimulados);

    supabase.from('simulados').update({
      questoes: evaluatedQuestoes,
      score: finalScore,
      max_score: totalQuestions,
      accuracy_rate: accuracyRate,
      total_correct: totalCorrect,
      total_wrong: totalWrong,
      total_blank: totalBlank,
      elapsed_seconds: payload.elapsedSeconds,
      time_remaining_seconds: 0,
      desempenho_por_disciplina: desempenhoPorDisciplina,
      status: 'finalizado',
      finished_at: nowIso,
      started_at: finishedSimulado.startedAt || null,
      updated_at: nowIso,
    }).eq('id', id).then(({ error }) => {
      if (error) console.warn('Gabarita: Erro ao finalizar simulado no Supabase:', error.message);
    });

    return finishedSimulado;
  }

  static async addSimuladoQuestaoToCadernoErros(
    simuladoId: string, 
    questaoId: string, 
    motivo: MotivoErro = 'falta_atencao', 
    observation?: string
  ): Promise<ItemCadernoErros> {
    const simulado = await this.getSimuladoById(simuladoId);
    if (!simulado) throw new Error('Simulado não encontrado.');
    const q = (simulado.questoes || []).find(item => item.id === questaoId);
    if (!q) throw new Error('Questão não encontrada no simulado.');

    const correctOpt = q.options.find(o => o.id === q.correctOptionId);
    const userOpt = q.options.find(o => o.id === q.userAnswer);

    const fullObservation = observation || [
      `Erro no Simulado: "${simulado.title}".`,
      userOpt ? `Marcou: (${userOpt.id.toUpperCase()}) ${userOpt.text}` : 'Não respondeu / deixou em branco.',
      correctOpt ? `Gabarito Oficial: (${correctOpt.id.toUpperCase()}) ${correctOpt.text}` : '',
      q.explanation ? `\nFundamentação: ${q.explanation}` : ''
    ].filter(Boolean).join('\n');

    const createdErro = await this.addCadernoErro({
      userId: simulado.userId,
      statementOrExcerpt: `[${simulado.banca || 'Simulado'} - Q${q.numero}] ${q.statement}`,
      disciplinaId: q.disciplinaId,
      disciplinaName: q.disciplinaName,
      assuntoId: q.assuntoId,
      assuntoName: q.assuntoName || 'Geral',
      banca: q.banca || simulado.banca || 'FGV',
      difficulty: q.difficulty || 'media',
      motivo,
      observation: fullObservation,
      correctAnswer: correctOpt ? `(${correctOpt.id.toUpperCase()}) ${correctOpt.text}` : q.correctOptionId,
      statusRevisao: 'pendente',
    });

    const updatedQuestoes = (simulado.questoes || []).map(item => 
      item.id === questaoId ? { ...item, addedToCadernoErros: true } : item
    );
    await this.updateSimulado(simuladoId, { questoes: updatedQuestoes });
    return createdErro;
  }

  // --- NOTIFICAÇÕES ---
  static async getNotificacoes(): Promise<Notificacao[]> {
    return loadStored<Notificacao[]>(STORAGE_KEYS.NOTIFICACOES, INITIAL_NOTIFICACOES);
  }

  static async markNotificationAsRead(id: string): Promise<Notificacao[]> {
    const list = await this.getNotificacoes();
    const updated = list.map(n => n.id === id ? { ...n, read: true } : n);
    saveStored(STORAGE_KEYS.NOTIFICACOES, updated);
    return updated;
  }

  static async markAllNotificationsAsRead(): Promise<Notificacao[]> {
    const list = await this.getNotificacoes();
    const updated = list.map(n => ({ ...n, read: true }));
    saveStored(STORAGE_KEYS.NOTIFICACOES, updated);
    return updated;
  }

  // --- STUDY PLAN & CRONOGRAMA ---
  static async getStudyPlan(concursoId?: string): Promise<StudyPlan> {
    try {
      let query = supabase.from('study_plans').select('*');
      if (concursoId) {
        query = query.eq('concurso_id', concursoId);
      }
      const { data, error } = await query.order('updated_at', { ascending: false }).limit(1);

      if (!error && Array.isArray(data) && data.length > 0) {
        const plan = mapStudyPlanFromDb(data[0]);
        saveStored(STORAGE_KEYS.STUDY_PLAN, plan);
        return plan;
      }
    } catch (e) {
      console.warn('Gabarita: Falha ao buscar study plan do Supabase:', e);
    }

    const current = loadStored<StudyPlan>(STORAGE_KEYS.STUDY_PLAN, INITIAL_STUDY_PLAN);
    if (concursoId && current.concursoId !== concursoId) {
      const concursos = await this.getConcursos();
      const target = concursos.find(c => c.id === concursoId);
      if (target) {
        return this.recalculateStudyPlan(concursoId);
      }
    }
    return current;
  }

  static async saveStudyPlan(plan: StudyPlan): Promise<StudyPlan> {
    saveStored(STORAGE_KEYS.STUDY_PLAN, plan);

    getCurrentUserId().then(uid => {
      const targetUid = plan.userId || uid;
      if (targetUid) {
        supabase.from('study_plans').upsert([{
          id: plan.id,
          user_id: targetUid,
          concurso_id: plan.concursoId,
          concurso_title: plan.concursoTitle,
          target_exam_date: plan.targetExamDate,
          weekly_availability: plan.weeklyAvailability,
          sessions: plan.sessions,
          conflicts: plan.conflicts || [],
          history_logs: plan.historyLogs || [],
          created_at: plan.createdAt || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }]).then(({ error }) => {
          if (error) console.warn('Gabarita: Erro ao persistir study plan no Supabase:', error.message);
        });
      }
    });

    return plan;
  }

  static async recalculateStudyPlan(
    concursoId?: string,
    customAvailability?: WeeklyAvailability,
    newExamDate?: string
  ): Promise<StudyPlan> {
    const currentPlan = await this.getStudyPlan();
    const activeConcursoId = concursoId || currentPlan.concursoId;
    const [allDisciplinas, assuntos, revisoes, questoes, concursos] = await Promise.all([
      this.getDisciplinas(),
      this.getAssuntos(),
      this.getRevisoes(),
      this.getQuestoes(),
      this.getConcursos(),
    ]);
    const disciplinas = allDisciplinas.filter(d => !activeConcursoId || !d.concursoId || d.concursoId === activeConcursoId);
    const activeConcurso = concursos.find(c => c.id === activeConcursoId) || concursos[0];
    const examDate = newExamDate || activeConcurso?.examDate?.split('T')[0] || currentPlan.targetExamDate;
    const recalculated = PlannerService.recalculatePlan(
      {
        ...currentPlan,
        concursoId: activeConcurso?.id || currentPlan.concursoId,
        concursoTitle: activeConcurso ? `${activeConcurso.organ} - ${activeConcurso.role}` : currentPlan.concursoTitle,
      },
      disciplinas,
      assuntos,
      revisoes,
      questoes,
      customAvailability,
      examDate
    );
    return this.saveStudyPlan(recalculated);
  }

  static async addPlannedSession(session: Omit<PlannedSession, 'id'>): Promise<{ plan: StudyPlan; newSession: PlannedSession }> {
    const plan = await this.getStudyPlan();
    const newSession: PlannedSession = {
      ...session,
      id: `plan_ses_custom_${Date.now()}`,
    };
    const updatedSessions = [...plan.sessions, newSession];
    const assuntos = await this.getAssuntos();
    const conflicts = PlannerService.detectConflicts(updatedSessions, plan.weeklyAvailability, plan.targetExamDate, assuntos);
    const updatedPlan: StudyPlan = {
      ...plan,
      sessions: updatedSessions,
      conflicts,
      historyLogs: [
        {
          id: `log_add_${Date.now()}`,
          planId: plan.id,
          action: 'edicao_manual',
          timestamp: new Date().toISOString(),
          description: `Sessão manual adicionada para ${newSession.disciplinaName} em ${newSession.date} (${newSession.durationMinutes} min).`,
          preservedCompletedCount: plan.sessions.filter(s => s.status === 'concluida').length,
          totalStudyMinutes: plan.sessions.filter(s => s.status === 'concluida').reduce((acc, s) => acc + s.durationMinutes, 0),
        },
        ...(plan.historyLogs || []),
      ],
      updatedAt: new Date().toISOString(),
    };
    await this.saveStudyPlan(updatedPlan);
    return { plan: updatedPlan, newSession };
  }

  static async updatePlannedSession(sessionId: string, partial: Partial<PlannedSession>): Promise<StudyPlan> {
    const plan = await this.getStudyPlan();
    const updatedSessions = plan.sessions.map(s => {
      if (s.id === sessionId) {
        return { ...s, ...partial };
      }
      return s;
    });
    const assuntos = await this.getAssuntos();
    const conflicts = PlannerService.detectConflicts(updatedSessions, plan.weeklyAvailability, plan.targetExamDate, assuntos);
    const updatedPlan: StudyPlan = {
      ...plan,
      sessions: updatedSessions,
      conflicts,
      updatedAt: new Date().toISOString(),
    };
    return this.saveStudyPlan(updatedPlan);
  }

  static async deletePlannedSession(sessionId: string): Promise<StudyPlan> {
    const plan = await this.getStudyPlan();
    const updatedSessions = plan.sessions.filter(s => s.id !== sessionId);
    const assuntos = await this.getAssuntos();
    const conflicts = PlannerService.detectConflicts(updatedSessions, plan.weeklyAvailability, plan.targetExamDate, assuntos);
    const updatedPlan: StudyPlan = {
      ...plan,
      sessions: updatedSessions,
      conflicts,
      updatedAt: new Date().toISOString(),
    };
    return this.saveStudyPlan(updatedPlan);
  }

  static async reschedulePlannedSession(sessionId: string, newDateStr: string, reason?: string): Promise<StudyPlan> {
    const plan = await this.getStudyPlan();
    const parsedNewDate = PlannerService.parseLocalDate(newDateStr);
    const dayOfWeek = PlannerService.getDayOfWeekFromDate(parsedNewDate);
    let sessionName = '';
    const updatedSessions = plan.sessions.map(s => {
      if (s.id === sessionId) {
        sessionName = s.disciplinaName;
        return {
          ...s,
          originalDate: s.originalDate || s.date,
          date: newDateStr,
          dayOfWeek,
          status: 'reagendada' as PlanSessionStatus,
          rescheduledReason: reason || 'Reagendada pelo estudante.',
        };
      }
      return s;
    });
    const assuntos = await this.getAssuntos();
    const conflicts = PlannerService.detectConflicts(updatedSessions, plan.weeklyAvailability, plan.targetExamDate, assuntos);
    const updatedPlan: StudyPlan = {
      ...plan,
      sessions: updatedSessions,
      conflicts,
      historyLogs: [
        {
          id: `log_reschedule_${Date.now()}`,
          planId: plan.id,
          action: 'reagendamento',
          timestamp: new Date().toISOString(),
          description: `Sessão de ${sessionName} reagendada para ${newDateStr}. Motivo: ${reason || 'Ajuste de rotina'}.`,
          preservedCompletedCount: plan.sessions.filter(s => s.status === 'concluida').length,
          totalStudyMinutes: plan.sessions.filter(s => s.status === 'concluida').reduce((acc, s) => acc + s.durationMinutes, 0),
        },
        ...(plan.historyLogs || []),
      ],
      updatedAt: new Date().toISOString(),
    };
    return this.saveStudyPlan(updatedPlan);
  }

  static async batchRescheduleOverdue(targetDateStr?: string, mode: 'today' | 'spread' = 'spread'): Promise<StudyPlan> {
    const plan = await this.getStudyPlan();
    const destinationDate = targetDateStr || PlannerService.formatLocalDate(new Date());
    const { updatedSessions, count } = PlannerService.redistributeOverdueSessions(plan, mode, destinationDate);
    const assuntos = await this.getAssuntos();
    const conflicts = PlannerService.detectConflicts(updatedSessions, plan.weeklyAvailability, plan.targetExamDate, assuntos);
    const updatedPlan: StudyPlan = {
      ...plan,
      sessions: updatedSessions,
      conflicts,
      historyLogs: [
        {
          id: `log_batch_${Date.now()}`,
          planId: plan.id,
          action: 'reagendamento',
          timestamp: new Date().toISOString(),
          description: mode === 'today'
            ? `Reagendamento em lote: ${count} sessões atrasadas transferidas para ${destinationDate}.`
            : `Redistribuição equilibrada em lote: ${count} sessões perdidas distribuídas nos próximos dias livres.`,
          preservedCompletedCount: plan.sessions.filter(s => s.status === 'concluida').length,
          totalStudyMinutes: plan.sessions.filter(s => s.status === 'concluida').reduce((acc, s) => acc + s.durationMinutes, 0),
        },
        ...(plan.historyLogs || []),
      ],
      updatedAt: new Date().toISOString(),
    };
    return this.saveStudyPlan(updatedPlan);
  }

  static async togglePlanSessionStatus(sessionId: string, status: PlanSessionStatus): Promise<StudyPlan> {
    const plan = await this.getStudyPlan();
    let completedItem: PlannedSession | null = null;
    const updatedSessions = plan.sessions.map(s => {
      if (s.id === sessionId) {
        const isCompleting = status === 'concluida';
        completedItem = {
          ...s,
          status,
          completedAt: isCompleting ? new Date().toISOString() : undefined,
        };
        return completedItem;
      }
      return s;
    });

    if (status === 'concluida' && completedItem) {
      const item = completedItem as PlannedSession;
      await this.recordStudySession({
        userId: plan.userId,
        disciplinaId: item.disciplinaId,
        assuntoId: item.assuntoId,
        durationMinutes: item.durationMinutes,
        type: item.type === 'questoes' ? 'questoes' : item.type === 'revisao' ? 'revisao' : item.type === 'simulado' ? 'simulado' : 'teoria',
        notes: `Sessão planejada concluída: ${item.assuntoName || item.disciplinaName}`,
        completedAt: new Date().toISOString(),
      });
    }

    const assuntos = await this.getAssuntos();
    const conflicts = PlannerService.detectConflicts(updatedSessions, plan.weeklyAvailability, plan.targetExamDate, assuntos);
    const updatedPlan: StudyPlan = {
      ...plan,
      sessions: updatedSessions,
      conflicts,
      updatedAt: new Date().toISOString(),
    };
    return this.saveStudyPlan(updatedPlan);
  }

  // --- STUDY CYCLE ---
  static async getStudyCycle(concursoId?: string): Promise<StudyCycle> {
    const targetId = concursoId || (await this.getActiveConcurso())?.id;
    if (targetId) {
      try {
        const { data, error } = await supabase
          .from('study_cycles')
          .select('*')
          .eq('concurso_id', targetId)
          .order('updated_at', { ascending: false })
          .limit(1);

        if (!error && Array.isArray(data) && data.length > 0) {
          const mapped = mapStudyCycleFromDb(data[0]);
          saveStored(STORAGE_KEYS.STUDY_CYCLE, mapped);
          try {
            localStorage.setItem(`gabarita_ciclo_estudos_${targetId}`, JSON.stringify(mapped));
            localStorage.setItem(`gabarita_study_cycle_${targetId}`, JSON.stringify(mapped));
          } catch {}
          return mapped;
        }
      } catch (e) {
        console.warn('Gabarita: Falha ao buscar ciclo do Supabase:', e);
      }

      // 1. Tentar ler da chave oficial gabarita_ciclo_estudos_${targetId}
      try {
        const raw = localStorage.getItem(`gabarita_ciclo_estudos_${targetId}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.blocks) && parsed.blocks.length > 0) {
            saveStored(STORAGE_KEYS.STUDY_CYCLE, parsed);
            return parsed;
          }
        }
      } catch (e) {
        console.warn('Erro ao ler gabarita_ciclo_estudos_' + targetId, e);
      }

      // 2. Tentar ler de gabarita_study_cycle_${targetId}
      const savedForConcurso = loadStored<StudyCycle | null>(`gabarita_study_cycle_${targetId}`, null);
      if (savedForConcurso && savedForConcurso.concursoId === targetId && savedForConcurso.blocks && savedForConcurso.blocks.length > 0) {
        saveStored(STORAGE_KEYS.STUDY_CYCLE, savedForConcurso);
        try {
          localStorage.setItem(`gabarita_ciclo_estudos_${targetId}`, JSON.stringify(savedForConcurso));
        } catch {}
        return savedForConcurso;
      }
    }

    const current = loadStored<StudyCycle>(STORAGE_KEYS.STUDY_CYCLE, INITIAL_STUDY_CYCLE);
    if (targetId && current.concursoId === targetId && current.blocks && current.blocks.length > 0) {
      return current;
    }

    const currentUid = await getCurrentUserId();
    return {
      id: `cycle_${targetId || 'empty'}`,
      userId: currentUid || 'user_demo_01',
      concursoId: targetId || '',
      concursoTitle: 'Ciclo de Estudos',
      currentBlockIndex: 0,
      completedCyclesCount: 0,
      totalCycleMinutes: 0,
      blocks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  static async saveStudyCycle(cycle: StudyCycle): Promise<StudyCycle> {
    saveStored(STORAGE_KEYS.STUDY_CYCLE, cycle);
    if (cycle.concursoId) {
      try {
        localStorage.setItem(`gabarita_ciclo_estudos_${cycle.concursoId}`, JSON.stringify(cycle));
        localStorage.setItem(`gabarita_study_cycle_${cycle.concursoId}`, JSON.stringify(cycle));
      } catch (err) {
        console.warn('Erro ao salvar ciclo no localStorage:', err);
      }
      saveStored(`gabarita_study_cycle_${cycle.concursoId}`, cycle);

      getCurrentUserId().then(uid => {
        const targetUid = cycle.userId || uid;
        if (targetUid) {
          supabase.from('study_cycles').upsert([{
            id: cycle.id,
            user_id: targetUid,
            concurso_id: cycle.concursoId,
            concurso_title: cycle.concursoTitle,
            current_block_index: cycle.currentBlockIndex,
            completed_cycles_count: cycle.completedCyclesCount,
            total_cycle_minutes: cycle.totalCycleMinutes,
            blocks: cycle.blocks,
            created_at: cycle.createdAt || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }]).then(({ error }) => {
            if (error) console.warn('Gabarita: Erro ao sincronizar ciclo no Supabase:', error.message);
          });
        }
      });
    }
    return cycle;
  }

  static async advanceStudyCycle(minutesStudied?: number): Promise<StudyCycle> {
    const cycle = await this.getStudyCycle();
    const currBlock = cycle.blocks[cycle.currentBlockIndex];
    const advanced = CycleService.advanceBlock(cycle, minutesStudied);
    if (currBlock && minutesStudied && minutesStudied > 0) {
      await this.recordStudySession({
        userId: cycle.userId,
        disciplinaId: currBlock.disciplinaId,
        assuntoId: currBlock.assuntoSugeridoId,
        durationMinutes: minutesStudied,
        type: 'teoria',
        notes: `Bloco do Ciclo concluído: ${currBlock.disciplinaName} (${minutesStudied} min)`,
        completedAt: new Date().toISOString(),
      });
    }
    return this.saveStudyCycle(advanced);
  }

  static async rewindStudyCycle(): Promise<StudyCycle> {
    const cycle = await this.getStudyCycle();
    const rewound = CycleService.rewindBlock(cycle);
    return this.saveStudyCycle(rewound);
  }

  static async recordCycleProgress(additionalMinutes: number): Promise<StudyCycle> {
    const cycle = await this.getStudyCycle();
    const updated = CycleService.recordBlockProgress(cycle, additionalMinutes);
    const currBlock = cycle.blocks[cycle.currentBlockIndex];
    if (currBlock && additionalMinutes > 0) {
      await this.recordStudySession({
        userId: cycle.userId,
        disciplinaId: currBlock.disciplinaId,
        assuntoId: currBlock.assuntoSugeridoId,
        durationMinutes: additionalMinutes,
        type: 'teoria',
        notes: `Tempo de estudo no Ciclo: ${currBlock.disciplinaName} (+${additionalMinutes} min)`,
        completedAt: new Date().toISOString(),
      });
    }
    return this.saveStudyCycle(updated);
  }

  static async resetCycleCurrentLap(): Promise<StudyCycle> {
    const cycle = await this.getStudyCycle();
    const reset = CycleService.resetCurrentLap(cycle);
    return this.saveStudyCycle(reset);
  }

  static async recalculateStudyCycle(concursoId?: string, baseSlotDuration: number = 60): Promise<StudyCycle> {
    const currentCycle = await this.getStudyCycle();
    const targetConcursoId = concursoId || currentCycle.concursoId;
    const [allDisciplinas, assuntos, concursos] = await Promise.all([
      this.getDisciplinas(),
      this.getAssuntos(),
      this.getConcursos(),
    ]);
    const concursoMatch = concursos.find(c => c.id === targetConcursoId) || concursos[0];
    const concursoTitle = concursoMatch ? `${concursoMatch.organ} - ${concursoMatch.role}` : currentCycle.concursoTitle;
    const disciplinas = targetConcursoId 
      ? allDisciplinas.filter(d => d.concursoId === targetConcursoId) 
      : allDisciplinas;
    const newCycle = CycleService.generateCycle(
      currentCycle.userId,
      targetConcursoId,
      concursoTitle,
      disciplinas,
      assuntos,
      baseSlotDuration
    );
    newCycle.completedCyclesCount = currentCycle.completedCyclesCount;
    return this.saveStudyCycle(newCycle);
  }

  static async updateCycleBlock(blockId: string, partial: Partial<CycleBlock>): Promise<StudyCycle> {
    const cycle = await this.getStudyCycle();
    const updatedBlocks = cycle.blocks.map(b => {
      if (b.id === blockId) {
        return { ...b, ...partial };
      }
      return b;
    });
    const totalCycleMinutes = updatedBlocks.reduce((acc, b) => acc + b.durationMinutes, 0);
    const updatedCycle: StudyCycle = {
      ...cycle,
      blocks: updatedBlocks,
      totalCycleMinutes,
      updatedAt: new Date().toISOString(),
    };
    return this.saveStudyCycle(updatedCycle);
  }

  static async getStudyMethod(): Promise<StudyMethod> {
    try {
      const stored = localStorage.getItem('gabarita_study_method');
      if (stored === 'cronograma' || stored === 'ciclo') {
        return stored;
      }
      const profile = await this.getUserProfile('user_demo_01');
      if (profile.preferences?.studyMethod) {
        return profile.preferences.studyMethod;
      }
    } catch {
      // Fallback
    }
    return 'ciclo';
  }

  static async setStudyMethod(method: StudyMethod): Promise<StudyMethod> {
    try {
      localStorage.setItem('gabarita_study_method', method);
      const profile = await this.getUserProfile('user_demo_01');
      if (profile) {
        await this.updateUserProfile({
          preferences: {
            ...profile.preferences,
            studyMethod: method,
          }
        });
      }
    } catch (err) {
      console.warn('Erro ao persistir preferência de método:', err);
    }
    return method;
  }

  static async resetStudyCycle(clearCompletedCyclesCount: boolean = false): Promise<StudyCycle> {
    const cycle = await this.getStudyCycle();
    const updatedBlocks = cycle.blocks.map((b, idx) => ({
      ...b,
      status: (idx === 0 ? 'em_andamento' : 'aguardando') as CycleBlock['status'],
      elapsedMinutes: 0,
      completedAt: undefined,
    }));
    const resetCycle: StudyCycle = {
      ...cycle,
      currentBlockIndex: 0,
      completedCyclesCount: clearCompletedCyclesCount ? 0 : cycle.completedCyclesCount,
      blocks: updatedBlocks,
      updatedAt: new Date().toISOString(),
    };
    return this.saveStudyCycle(resetCycle);
  }

  static async removeStudyCycle(): Promise<StudyCycle> {
    const cycle = await this.getStudyCycle();
    if (cycle.concursoId) {
      try {
        localStorage.removeItem(`gabarita_ciclo_estudos_${cycle.concursoId}`);
        localStorage.removeItem(`gabarita_study_cycle_${cycle.concursoId}`);
      } catch (err) {
        console.warn('Erro ao remover ciclo do concurso no localStorage:', err);
      }
    }
    const clearedCycle: StudyCycle = {
      ...cycle,
      currentBlockIndex: 0,
      completedCyclesCount: 0,
      totalCycleMinutes: 0,
      blocks: [],
      updatedAt: new Date().toISOString(),
    };
    return this.saveStudyCycle(clearedCycle);
  }

  // --- FLASHCARDS & DECKS ---
  static async getDecks(): Promise<Deck[]> {
    try {
      const { data, error } = await supabase
        .from('decks')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const list = data.map(mapDeckFromDb);
        saveStored('@gabarita:decks', list);
        return list;
      }
    } catch (e) {
      console.warn('Gabarita: Falha ao buscar baralhos do Supabase:', e);
    }
    return loadStored<Deck[]>('@gabarita:decks', []);
  }

  static async saveDecks(decks: Deck[]): Promise<Deck[]> {
    saveStored('@gabarita:decks', decks);

    getCurrentUserId().then(uid => {
      if (uid && decks.length > 0) {
        const rows = decks.map(d => ({
          id: d.id,
          user_id: uid,
          disciplina: d.disciplina,
          nome: d.nome,
          total_cards: d.totalCards,
          pendentes_hoje: d.pendentesHoje,
          icone: d.icone || 'Layers',
          updated_at: new Date().toISOString(),
        }));
        supabase.from('decks').upsert(rows).then(({ error }) => {
          if (error) console.warn('Gabarita: Erro ao persistir baralhos no Supabase:', error.message);
        });
      }
    });
    return decks;
  }

  static async getFlashcards(): Promise<Flashcard[]> {
    try {
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const list = data.map(mapFlashcardFromDb);
        saveStored('@gabarita:flashcards', list);
        return list;
      }
    } catch (e) {
      console.warn('Gabarita: Falha ao buscar flashcards do Supabase:', e);
    }
    return loadStored<Flashcard[]>('@gabarita:flashcards', []);
  }

  static async saveFlashcards(cards: Flashcard[]): Promise<Flashcard[]> {
    saveStored('@gabarita:flashcards', cards);

    getCurrentUserId().then(uid => {
      if (uid && cards.length > 0) {
        const rows = cards.map(c => ({
          id: c.id,
          user_id: uid,
          deck_id: c.deckId,
          disciplina: c.disciplina,
          topico: c.topico || null,
          frente: c.frente,
          verso: c.verso,
          dificuldade: c.dificuldade || null,
          intervalo_dias: c.intervaloDias,
          proxima_revisao: c.proximaRevisao,
          revisoes_total: c.revisoesTotal,
          created_at: c.criadoEm || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
        supabase.from('flashcards').upsert(rows).then(({ error }) => {
          if (error) console.warn('Gabarita: Erro ao persistir flashcards no Supabase:', error.message);
        });
      }
    });
    return cards;
  }
}

