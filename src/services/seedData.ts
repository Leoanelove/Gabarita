import { 
  UserProfile, 
  Concurso, 
  Disciplina, 
  Assunto, 
  Revisao, 
  RevisionSettings, 
  Questao, 
  Meta, 
  Notificacao, 
  Simulado, 
  Prova, 
  SessaoEstudo, 
  StudyPlan, 
  StudyCycle,
  RegistroBlocoQuestoes,
  ItemCadernoErros,
  Conquista,
  MarcoEstudo
} from '../types';

export const INITIAL_USER: UserProfile = {
  id: 'user_demo_01',
  email: 'usuario@gabarita.com.br',
  name: 'Concurseiro(a)',
  role: 'aluno',
  photoURL: '',
  bio: 'Foco total na aprovação e consistência diária nos estudos.',
  targetConcursoId: '',
  targetConcursoTitle: '',
  studyHoursPerDay: 4.0,
  streakDays: 0,
  lastStudyDate: '',
  xp: 0,
  level: 1,
  preferences: {
    theme: 'dark',
    notificationsEnabled: true,
    emailAlerts: true,
    pomodoroWorkMin: 50,
    pomodoroBreakMin: 10,
    soundEnabled: true,
    consentGiven: true,
    consentDate: new Date().toISOString(),
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const INITIAL_CONCURSOS: Concurso[] = [];

export const INITIAL_DISCIPLINAS: Disciplina[] = [];

export const INITIAL_ASSUNTOS: Assunto[] = [];

export const INITIAL_REVISION_SETTINGS: RevisionSettings = {
  autoScheduleOnStudy: true,
  autoScheduleOnQuestions: true,
  intervalDays: [1, 7, 15, 30, 60],
  performanceAdaptive: true,
  easeMultiplier: 1.8,
  hardPenaltyDays: 1,
};

export const INITIAL_REVISOES: Revisao[] = [];

export const INITIAL_METAS: Meta[] = [];

export const INITIAL_CONQUISTAS: Conquista[] = [];

export const INITIAL_MARCOS: MarcoEstudo[] = [];

export const INITIAL_QUESTOES: Questao[] = [];

export const INITIAL_SIMULADOS: Simulado[] = [];

export const INITIAL_PROVAS: Prova[] = [
  {
    id: 'prova_tcego_2026',
    organ: 'TCE-GO',
    role: 'Auditor de Controle Externo',
    banca: 'FGV',
    year: 2026,
    examDate: new Date(Date.now() + 86400000 * 42).toISOString().split('T')[0],
    category: 'CONTROLE',
    status: 'agendada',
    questionsCount: 120,
    durationMinutes: 300,
    notes: 'Prova discursiva e objetiva. Levar documento original com foto e caneta preta.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prova_pf_2026',
    organ: 'Polícia Federal',
    role: 'Agente de Polícia Federal',
    banca: 'Cebraspe',
    year: 2026,
    examDate: new Date(Date.now() + 86400000 * 85).toISOString().split('T')[0],
    category: 'POLICIAL',
    status: 'agendada',
    questionsCount: 120,
    durationMinutes: 270,
    notes: 'Estilo Certo/Errado Cebraspe. Foco em Contabilidade e Informática.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prova_inss_2025',
    organ: 'INSS',
    role: 'Técnico do Seguro Social',
    banca: 'Cebraspe',
    year: 2025,
    examDate: new Date(Date.now() - 86400000 * 18).toISOString().split('T')[0],
    category: 'ADMINISTRATIVO',
    status: 'concluida',
    questionsCount: 120,
    durationMinutes: 210,
    notes: 'Gabarito oficial conferido: 96 acertos líquidos.',
    createdAt: new Date().toISOString(),
  }
];

export const INITIAL_SESSOES: SessaoEstudo[] = [];

export const INITIAL_NOTIFICACOES: Notificacao[] = [];

export const INITIAL_STUDY_PLAN: StudyPlan = {
  id: 'plan_default',
  concursoId: '',
  concursoTitle: '',
  userId: 'user_demo_01',
  startDate: new Date().toISOString().split('T')[0],
  targetExamDate: new Date(Date.now() + 86400000 * 90).toISOString().split('T')[0],
  dailyAverageMinutes: 240,
  totalWeeks: 12,
  totalPlannedHours: 288,
  weeklyAvailability: {
    seg: 240,
    ter: 240,
    qua: 240,
    qui: 240,
    sex: 240,
    sab: 180,
    dom: 120,
  },
  disciplinasDistribution: [],
  sessions: [],
  conflicts: [],
  historyLogs: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const INITIAL_STUDY_CYCLE: StudyCycle = {
  id: 'cycle_default',
  userId: 'user_demo_01',
  concursoId: '',
  concursoTitle: 'Ciclo de Estudos Principal',
  currentBlockIndex: 0,
  completedCyclesCount: 0,
  totalCycleMinutes: 0,
  blocks: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const INITIAL_BLOCOS_QUESTOES: RegistroBlocoQuestoes[] = [];

export const INITIAL_CADERNO_ERROS: ItemCadernoErros[] = [];
