import React, { useState, useMemo, useEffect } from 'react';
import {
  History,
  Clock,
  CheckCircle2,
  BookOpen,
  FileText,
  Search,
  Filter,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Calendar,
  MessageSquare,
  Crown,
  Sparkles,
  Check,
  X,
  HelpCircle,
  Video,
  Layers,
  Scale,
  Shield,
  BrainCircuit,
  Calculator,
  Globe,
  Cpu,
  Award,
  RotateCcw,
  ExternalLink,
  AlertCircle,
  GraduationCap,
  CalendarClock,
} from 'lucide-react';
import {
  SessaoEstudo,
  Disciplina,
  Assunto,
  Concurso,
  Revisao,
  Simulado,
  RegistroBlocoQuestoes,
  PageInterval,
  VideoaulaRecord,
  StudySessionType,
  StudyRecordOrigin,
  TopicStatus,
  NavigationTab,
} from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { MenuBannerFrame, normalizeBannerThemeSkin } from '../common/MenuBannerFrame';
import { Button } from '../../design-system/Button';
import { handleTimeMask, normalizeTimeOnBlur } from '../estudos/StudyRegisterModal';

export const HISTORICO_BANNER_THEMES: Record<string, string> = {
  verde:
    'https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Historico/Banner-Historico-verde.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBIaXN0b3JpY28vQmFubmVyLUhpc3Rvcmljby12ZXJkZS5wbmciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzkzMjA5MjkwLCJleHAiOjQ5NDY4MDkyOTB9.7J-ygEmBbzt1UbNKoNRmufPcpB_f-r0KIZ_m1YZf0FFu0dooc4DjR0gArJcR0h8t_WAFn_519Z7fwSg2wulMpg',
  azul:
    'https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Historico/Banner-Historico-azul.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBIaXN0b3JpY28vQmFubmVyLUhpc3Rvcmljby1henVsLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3OTMyMDkzMDgsImV4cCI6NDk0NjgwOTMwOH0.9NeugzqQiG8xV8k73ZTO9Okjmu5z0YNAyHmHazaMp1LT6r7opESe2_cvN8rj62oeh1VXSehMtcrE3gvw7HzfgA',
  rosa:
    'https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Historico/Banner-Historico-rosa.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBIaXN0b3JpY28vQmFubmVyLUhpc3Rvcmljby1yb3NhLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3OTMyMDkzMjAsImV4cCI6NDk0NjgwOTMyMH0.E3vCAk6RrkC-JbzYlqbuUXVN94KYFV-b9u3LB_d3HGvj1BZmoPAbJQgTxEmSD7636ISx6TrVN1YgnWDa2GQGyQ',
  roxo:
    'https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Historico/Banner-Historico-roxo.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBIaXN0b3JpY28vQmFubmVyLUhpc3Rvcmljby1yb3hvLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3OTMyMDkzMzEsImV4cCI6NDk0NjgwOTMzMX0.0Bw3uZ5k1MDd2B0tlGCQ57Oc7kKfB4dmvXMxadf3bPRSrNVecazXGW3u_cd8P5Vtw9KnGLvsEAZBmfuLytNDAg',
  laranja:
    'https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Historico/Banner-Historico-laranja.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBIaXN0b3JpY28vQmFubmVyLUhpc3Rvcmljby1sYXJhbmphLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3OTMyMDkzNDIsImV4cCI6NDk0NjgwOTM0Mn0.3PTDDxDamF-UMfQ7kKDeZGKjKZAjidpLT-4T3HZxI43tJeBa7bIg7lMxocginTaubTYoFP6h9BWVX77NtzD1vg',
};

export interface HistoricoViewProps {
  sessoes: SessaoEstudo[];
  disciplinas: Disciplina[];
  assuntos: Assunto[];
  concursos: Concurso[];
  activeConcursoId?: string;
  revisoes?: Revisao[];
  simulados?: Simulado[];
  blocosQuestoes?: RegistroBlocoQuestoes[];
  onSaveSession: (session: {
    concursoId?: string;
    disciplinaId: string;
    assuntoId?: string;
    disciplinaName?: string;
    assuntoName?: string;
    durationMinutes: number;
    durationSeconds?: number;
    plannedMinutes?: number;
    type: StudySessionType;
    origem?: StudyRecordOrigin;
    material?: string;
    questionsAttempted?: number;
    questionsCorrect?: number;
    notes?: string;
    teoriaFinalizada?: boolean;
    programarRevisoes?: boolean;
    revisaoDays?: number[];
    contabilizarPlanejamento?: boolean;
    pageIntervals?: PageInterval[];
    videoaulas?: VideoaulaRecord[];
    completedAt?: string;
  }) => Promise<void>;
  onUpdateSession: (id: string, partial: Partial<SessaoEstudo>) => Promise<void>;
  onDeleteSession: (id: string) => Promise<void>;
  onUpdateAssunto?: (id: string, partial: Partial<Assunto>) => Promise<void>;
  onUpdateAssuntoStatus?: (id: string, status: TopicStatus) => Promise<void>;
  onNavigateTab?: (tab: NavigationTab) => void;
}

type PeriodFilter = 'todos' | 'hoje' | '7d' | '30d' | 'mes' | 'personalizado';

const DEFAULT_CATEGORIES: { value: string; label: string }[] = [
  { value: 'teoria', label: 'Teoria' },
  { value: 'questoes', label: 'Questões' },
  { value: 'revisao', label: 'Revisão' },
  { value: 'simulado', label: 'Simulado' },
  { value: 'flashcards', label: 'Flashcards' },
  { value: 'lei_seca', label: 'Lei Seca' },
  { value: 'resumo', label: 'Resumo' },
  { value: 'jurisprudencia', label: 'Jurisprudência' },
  { value: 'videoaula', label: 'Videoaula' },
  { value: 'pomodoro', label: 'Pomodoro' },
];

const ORIGIN_OPTIONS: { value: string; label: string }[] = [
  { value: 'todas', label: 'Todas as Origens' },
  { value: 'cronometro', label: 'Cronômetro / Pomodoro' },
  { value: 'manual', label: 'Lançamento Manual' },
  { value: 'edital', label: 'Edital Verticalizado' },
  { value: 'revisoes', label: 'Revisões' },
  { value: 'flashcards', label: 'Flashcards' },
  { value: 'simulados', label: 'Simulados' },
  { value: 'caderno_erros', label: 'Caderno de Erros' },
];

function resolveSubjectIconAndColor(name: string, fallbackColor?: string) {
  const n = (name || '').toLowerCase();
  if (n.includes('constitucional') || n.includes('direito') || n.includes('penal') || n.includes('civil') || n.includes('legisla')) {
    return { Icon: Scale, color: fallbackColor || '#3b82f6' };
  }
  if (n.includes('administrativ') || n.includes('públic') || n.includes('ética')) {
    return { Icon: Shield, color: fallbackColor || '#8b5cf6' };
  }
  if (n.includes('raciocínio') || n.includes('lógic')) {
    return { Icon: BrainCircuit, color: fallbackColor || '#f59e0b' };
  }
  if (n.includes('matemát') || n.includes('estatíst') || n.includes('contabil') || n.includes('financ')) {
    return { Icon: Calculator, color: fallbackColor || '#10b981' };
  }
  if (n.includes('informát') || n.includes('tecnolog') || n.includes('ti')) {
    return { Icon: Cpu, color: fallbackColor || '#06b6d4' };
  }
  if (n.includes('atualidad') || n.includes('geograf') || n.includes('histór')) {
    return { Icon: Globe, color: fallbackColor || '#ec4899' };
  }
  return { Icon: BookOpen, color: fallbackColor || '#10b981' };
}

function getCategoryMeta(type: string): {
  label: string;
  badgeClass: string;
} {
  const norm = (type || 'teoria').toLowerCase().trim();
  switch (norm) {
    case 'teoria':
      return {
        label: 'Teoria',
        badgeClass:
          'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25',
      };
    case 'questoes':
      return {
        label: 'Questões',
        badgeClass:
          'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
      };
    case 'revisao':
      return {
        label: 'Revisão',
        badgeClass:
          'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
      };
    case 'simulado':
      return {
        label: 'Simulado',
        badgeClass:
          'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25',
      };
    case 'flashcards':
      return {
        label: 'Flashcards',
        badgeClass:
          'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/25',
      };
    case 'lei_seca':
      return {
        label: 'Lei Seca',
        badgeClass:
          'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25',
      };
    case 'resumo':
      return {
        label: 'Resumo',
        badgeClass:
          'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/25',
      };
    case 'jurisprudencia':
      return {
        label: 'Jurisprudência',
        badgeClass:
          'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/25',
      };
    case 'videoaula':
      return {
        label: 'Videoaula',
        badgeClass:
          'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25',
      };
    case 'pomodoro':
      return {
        label: 'Pomodoro',
        badgeClass:
          'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/25',
      };
    default:
      return {
        label: type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' '),
        badgeClass:
          'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/25',
      };
  }
}

function formatHoursMinutes(totalMinutes: number): string {
  const safeMins = Math.max(0, Math.round(totalMinutes || 0));
  if (safeMins === 0) return '0h 00min';
  const h = Math.floor(safeMins / 60);
  const m = safeMins % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m.toString().padStart(2, '0')}min`;
}

function formatSecondsToHHMMSS(totalSeconds: number): string {
  const safeSecs = Math.max(0, Math.round(totalSeconds || 0));
  const h = Math.floor(safeSecs / 3600);
  const m = Math.floor((safeSecs % 3600) / 60);
  const s = safeSecs % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function parseHHMMSSToSeconds(hhmmss: string): number {
  const cleaned = (hhmmss || '').trim();
  const parts = cleaned.split(':').map(p => parseInt(p, 10));
  if (parts.length === 3 && !parts.some(isNaN)) {
    return Math.max(0, parts[0] * 3600 + parts[1] * 60 + parts[2]);
  }
  if (parts.length === 2 && !parts.some(isNaN)) {
    return Math.max(0, parts[0] * 60 + parts[1]);
  }
  const single = parseInt(cleaned, 10);
  if (!isNaN(single)) return Math.max(0, single * 60);
  return 0;
}

/**
 * Normaliza e formata intervalos de páginas de uma sessão.
 * Regra crítica: Nunca exibir 'null'. Se Fim estiver preenchido (ex: 46) e Início estiver vazio/null,
 * assume Início = 1 automaticamente ("p. 1 ~ 46").
 */
function normalizeSessionPages(session: SessaoEstudo): {
  totalPages: number;
  formattedLabel: string | null;
  tableLabel: string | null;
  normalizedIntervals: PageInterval[];
} {
  const rawIntervals = Array.isArray(session.pageIntervals) ? session.pageIntervals : [];
  const validIntervals: { id: string; inicio: number; fim: number }[] = [];

  for (const item of rawIntervals) {
    if (!item) continue;
    const rawFim =
      typeof item.fim === 'number' && !isNaN(item.fim)
        ? item.fim
        : item.fim !== '' && item.fim !== null && item.fim !== undefined
        ? Number(item.fim)
        : NaN;
    const rawInicio =
      typeof item.inicio === 'number' && !isNaN(item.inicio)
        ? item.inicio
        : item.inicio !== '' && item.inicio !== null && item.inicio !== undefined
        ? Number(item.inicio)
        : NaN;

    if (!isNaN(rawFim) && rawFim > 0) {
      const startPage = !isNaN(rawInicio) && rawInicio > 0 ? rawInicio : 1;
      const endPage = Math.max(startPage, rawFim);
      validIntervals.push({
        id: item.id || `p_${Math.random()}`,
        inicio: startPage,
        fim: endPage,
      });
    } else if (!isNaN(rawInicio) && rawInicio > 0) {
      validIntervals.push({
        id: item.id || `p_${Math.random()}`,
        inicio: rawInicio,
        fim: rawInicio,
      });
    }
  }

  // Fallback caso páginas tenham sido salvas apenas no texto de notes no passado
  if (validIntervals.length === 0 && session.notes) {
    const match = session.notes.match(/pág\.\s*(\d+|null)?\s*[-~]\s*(\d+)/i);
    if (match && match[2]) {
      const endP = parseInt(match[2], 10);
      const startP = match[1] && match[1] !== 'null' ? parseInt(match[1], 10) : 1;
      if (!isNaN(endP) && endP > 0) {
        validIntervals.push({
          id: 'p_legacy',
          inicio: !isNaN(startP) && startP > 0 ? startP : 1,
          fim: Math.max(!isNaN(startP) && startP > 0 ? startP : 1, endP),
        });
      }
    }
  }

  if (validIntervals.length === 0) {
    return {
      totalPages: 0,
      formattedLabel: null,
      tableLabel: null,
      normalizedIntervals: [],
    };
  }

  const totalPages = validIntervals.reduce(
    (sum, iv) => sum + Math.max(1, iv.fim - iv.inicio + 1),
    0
  );

  const rangesStr = validIntervals.map(iv => `${iv.inicio} ~ ${iv.fim}`).join(', ');
  return {
    totalPages,
    formattedLabel: `p. ${rangesStr}`,
    tableLabel: rangesStr,
    normalizedIntervals: validIntervals,
  };
}

function extractCleanUserNotes(notes?: string): string {
  if (!notes) return '';
  return notes
    .replace(/\n*\s*\[Recursos\]:.*$/is, '')
    .replace(/pág\.\s*null\s*[-~]\s*(\d+)/gi, 'pág. 1-$1')
    .trim();
}

function getAccuracyBadgeStyle(accuracy: number): string {
  if (accuracy > 75) {
    return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
  }
  if (accuracy >= 51) {
    return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
  }
  return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';
}

function getLocalYMD(isoOrDate: string): string {
  try {
    const d = new Date(isoOrDate);
    if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

export const HistoricoView: React.FC<HistoricoViewProps> = ({
  sessoes,
  disciplinas,
  assuntos,
  concursos,
  activeConcursoId,
  revisoes = [],
  onSaveSession,
  onUpdateSession,
  onDeleteSession,
  onUpdateAssunto,
  onUpdateAssuntoStatus,
}) => {
  const themeContext = useTheme();
  const { palette } = themeContext;
  const currentTheme = normalizeBannerThemeSkin(themeContext, 'verde');

  const themeGlowStyles = useMemo(() => {
    switch (currentTheme) {
      case 'roxo':
        return {
          color: '#8B5CF6',
          textShadow:
            '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(167, 139, 250, 0.95), 0 0 18px rgba(139, 92, 246, 0.85), 0 0 32px rgba(124, 58, 237, 0.65)',
        };
      case 'laranja':
        return {
          color: '#FF6B00',
          textShadow:
            '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(251, 146, 60, 0.95), 0 0 18px rgba(249, 115, 22, 0.85), 0 0 32px rgba(234, 88, 12, 0.65)',
        };
      case 'azul':
        return {
          color: '#3b82f6',
          textShadow:
            '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(96, 165, 250, 0.95), 0 0 18px rgba(37, 99, 235, 0.8), 0 0 32px rgba(29, 78, 216, 0.6)',
        };
      case 'rosa':
        return {
          color: '#ec4899',
          textShadow:
            '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(244, 114, 182, 0.95), 0 0 18px rgba(219, 39, 119, 0.8), 0 0 32px rgba(190, 24, 93, 0.6)',
        };
      case 'verde':
      default:
        return {
          color: '#10b981',
          textShadow:
            '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(52, 211, 153, 0.95), 0 0 18px rgba(16, 185, 129, 0.8), 0 0 32px rgba(5, 150, 105, 0.6)',
        };
    }
  }, [currentTheme]);

  // Concurso Ativo
  const activeConcurso = useMemo(() => {
    return (
      concursos.find(c => c.id === activeConcursoId) ||
      concursos.find(c => c.active || c.isAtivo) ||
      concursos[0] ||
      null
    );
  }, [concursos, activeConcursoId]);

  const validConcursoIds = useMemo(() => {
    return new Set(concursos.map(c => c.id).filter(Boolean));
  }, [concursos]);

  // Estado de navegação entre Visão 1 (Linha do Tempo) e Visão 2 (Detalhamento da Disciplina)
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [showAllSubjectRecords, setShowAllSubjectRecords] = useState(false);

  // Estados de Busca e Filtros Retráteis (Visão 1)
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterConcursoScope, setFilterConcursoScope] = useState<'ativo' | 'todos'>('ativo');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('todos');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [filterDisciplinaId, setFilterDisciplinaId] = useState<string>('todas');
  const [filterCategory, setFilterCategory] = useState<string>('todas');
  const [filterOrigin, setFilterOrigin] = useState<string>('todas');

  // Disciplinas estritamente vinculadas ao Concurso Ativo (ou todos os concursos válidos quando o filtro "Todos os Concursos" estiver ativo)
  const relevantDisciplinas = useMemo(() => {
    if (filterConcursoScope === 'todos') {
      return disciplinas.filter(d => Boolean(d.concursoId && validConcursoIds.has(d.concursoId)));
    }
    if (!activeConcurso) return [];
    return disciplinas.filter(d => d.concursoId === activeConcurso.id);
  }, [disciplinas, activeConcurso, filterConcursoScope, validConcursoIds]);

  // Disciplinas deduplicadas por nome normalizado dentro do escopo atual
  const uniqueDisciplinas = useMemo(() => {
    const seen = new Map<string, Disciplina>();
    for (const d of relevantDisciplinas) {
      const key = d.name
        .trim()
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      if (!seen.has(key)) {
        seen.set(key, d);
      }
    }
    return Array.from(seen.values());
  }, [relevantDisciplinas]);

  const relevantDiscIds = useMemo(() => {
    return new Set(relevantDisciplinas.map(d => d.id));
  }, [relevantDisciplinas]);

  const relevantAssuntos = useMemo(() => {
    if (relevantDiscIds.size === 0) return [];
    return assuntos.filter(a => relevantDiscIds.has(a.disciplinaId));
  }, [assuntos, relevantDiscIds]);

  const relevantAssuntoIds = useMemo(() => {
    return new Set(relevantAssuntos.map(a => a.id));
  }, [relevantAssuntos]);

  // Toast de Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Tipos personalizados salvos pelo usuário no StudyRegisterModal
  const customCategories = useMemo(() => {
    try {
      const raw = localStorage.getItem('@gabarita:custom-study-types');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.filter(Boolean) as string[];
      }
    } catch {
      // ignore
    }
    return [];
  }, []);

  const allCategoryOptions = useMemo(() => {
    const base = [...DEFAULT_CATEGORIES];
    const existingValues = new Set(base.map(b => b.value.toLowerCase()));
    for (const custom of customCategories) {
      if (!existingValues.has(custom.toLowerCase())) {
        base.push({ value: custom, label: custom });
        existingValues.add(custom.toLowerCase());
      }
    }
    return base;
  }, [customCategories]);

  // =========================================================================
  // ESTADOS DA VISÃO 3: MODAL "REGISTRO DE ESTUDO" (CRIAR, EDITAR E EXCLUIR)
  // =========================================================================
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<SessaoEstudo | null>(null);
  const [dateMode, setDateMode] = useState<'hoje' | 'ontem' | 'outro'>('hoje');
  const [modalCustomDate, setModalCustomDate] = useState<string>(() =>
    getLocalYMD(new Date().toISOString())
  );
  const [modalCategory, setModalCategory] = useState<string>('teoria');
  const [modalDisciplinaId, setModalDisciplinaId] = useState<string>('');
  const [modalTimeStr, setModalTimeStr] = useState<string>('00:25:00');
  const [modalAssuntoId, setModalAssuntoId] = useState<string>('');
  const [modalMaterial, setModalMaterial] = useState<string>('');
  const DEFAULT_REVISAO_DAYS = [1, 7, 15, 21, 30, 45, 60, 90, 120, 180, 215, 265, 315, 365];
  const [modalTopicFinished, setModalTopicFinished] = useState<boolean>(false);
  const [modalScheduleRevisions, setModalScheduleRevisions] = useState<boolean>(false);
  const [modalRevisaoDays, setModalRevisaoDays] = useState<number[]>(DEFAULT_REVISAO_DAYS);
  const [isAddingModalRevisaoDay, setIsAddingModalRevisaoDay] = useState<boolean>(false);
  const [newModalRevisaoDayInput, setNewModalRevisaoDayInput] = useState<string>('');
  const [modalCountInPlan, setModalCountInPlan] = useState<boolean>(true);
  const [modalCorrect, setModalCorrect] = useState<string>('');
  const [modalWrong, setModalWrong] = useState<string>('');
  const [modalPages, setModalPages] = useState<PageInterval[]>([
    { id: 'p_init', inicio: '', fim: '' },
  ]);
  const [modalVideos, setModalVideos] = useState<VideoaulaRecord[]>([
    { id: 'v_init', titulo: '', inicio: '00:00:00', fim: '00:00:00' },
  ]);
  const [modalComments, setModalComments] = useState<string>('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSavingModal, setIsSavingModal] = useState<boolean>(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleRemoveModalRevisaoDay = (dayToRemove: number) => {
    setModalRevisaoDays(prev => prev.filter(d => d !== dayToRemove));
  };

  const handleConfirmAddModalRevisaoDay = () => {
    const num = parseInt(newModalRevisaoDayInput.replace(/\D/g, ''), 10);
    if (!isNaN(num) && num > 0 && num <= 730) {
      if (!modalRevisaoDays.includes(num)) {
        setModalRevisaoDays(prev => [...prev, num].sort((a, b) => a - b));
      }
      setNewModalRevisaoDayInput('');
      setIsAddingModalRevisaoDay(false);
    }
  };

  // Abrir modal para Novo Registro
  const handleOpenCreateModal = (preselectedDiscId?: string, preselectedAssuntoId?: string) => {
    const defaultDiscId =
      preselectedDiscId ||
      selectedSubjectId ||
      uniqueDisciplinas[0]?.id ||
      disciplinas[0]?.id ||
      '';
    const discTopics = assuntos.filter(a => a.disciplinaId === defaultDiscId);
    const defaultTopicId = preselectedAssuntoId || discTopics[0]?.id || '';

    setEditingSession(null);
    setDateMode('hoje');
    setModalCustomDate(getLocalYMD(new Date().toISOString()));
    setModalCategory('teoria');
    setModalDisciplinaId(defaultDiscId);
    setModalTimeStr('00:25:00');
    setModalAssuntoId(defaultTopicId);
    setModalMaterial('');
    setModalTopicFinished(false);
    setModalScheduleRevisions(false);
    setModalRevisaoDays([...DEFAULT_REVISAO_DAYS]);
    setIsAddingModalRevisaoDay(false);
    setNewModalRevisaoDayInput('');
    setModalCountInPlan(true);
    setModalCorrect('');
    setModalWrong('');
    setModalPages([{ id: `p_${Date.now()}`, inicio: '', fim: '' }]);
    setModalVideos([{ id: `v_${Date.now()}`, titulo: '', inicio: '00:00:00', fim: '00:00:00' }]);
    setModalComments('');
    setModalError(null);
    setConfirmDeleteId(null);
    setIsModalOpen(true);
  };

  // Abrir modal para Editar Registro Existente
  const handleOpenEditModal = (session: SessaoEstudo) => {
    const todayYMD = getLocalYMD(new Date().toISOString());
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayYMD = getLocalYMD(yesterdayDate.toISOString());
    const sessionYMD = getLocalYMD(session.completedAt || session.createdAt);

    let detectedMode: 'hoje' | 'ontem' | 'outro' = 'outro';
    if (sessionYMD === todayYMD) detectedMode = 'hoje';
    else if (sessionYMD === yesterdayYMD) detectedMode = 'ontem';

    const totalSecs =
      session.durationSeconds && session.durationSeconds > 0
        ? session.durationSeconds
        : Math.max(60, Math.round((session.durationMinutes || 0) * 60));

    const attempted = session.questionsAttempted || 0;
    const correct = session.questionsCorrect || 0;
    const wrong = Math.max(0, attempted - correct);

    const { normalizedIntervals } = normalizeSessionPages(session);

    const linkedRevs = (revisoes || []).filter(r => {
      if (!r) return false;
      if (r.sourceSessionId && r.sourceSessionId === session.id) return true;
      if (!r.isAutomatic) return false;
      if (r.disciplinaId !== session.disciplinaId) return false;
      if ((r.assuntoId || '') !== (session.assuntoId || '')) return false;
      if (!session.assuntoId) {
        const rAssName = (r.assuntoName || '').trim().toLowerCase();
        const sAssName = (session.assuntoName || 'Estudo Geral').trim().toLowerCase();
        if (rAssName !== sAssName) return false;
      }
      const revStudyDate = r.originalStudyDate ? r.originalStudyDate.split('T')[0] : '';
      return Boolean(revStudyDate && revStudyDate === sessionYMD);
    });

    const linkedIntervalDays = Array.from(
      new Set(
        linkedRevs
          .map(r => Number(r.intervalDays))
          .filter(d => !isNaN(d) && d > 0)
      )
    ).sort((a, b) => a - b);

    const hasScheduledRevisions =
      session.programarRevisoes === false
        ? false
        : session.programarRevisoes === true
        ? true
        : linkedIntervalDays.length > 0;

    const resolvedRevisaoDays = hasScheduledRevisions
      ? session.revisaoDays && session.revisaoDays.length > 0
        ? [...session.revisaoDays].sort((a, b) => a - b)
        : linkedIntervalDays.length > 0
        ? linkedIntervalDays
        : [...DEFAULT_REVISAO_DAYS]
      : [...DEFAULT_REVISAO_DAYS];

    setEditingSession(session);
    setDateMode(detectedMode);
    setModalCustomDate(sessionYMD);
    setModalCategory(session.type || 'teoria');
    setModalDisciplinaId(session.disciplinaId || uniqueDisciplinas[0]?.id || '');
    setModalTimeStr(formatSecondsToHHMMSS(totalSecs));
    setModalAssuntoId(session.assuntoId || '');
    setModalMaterial(session.material || '');
    setModalTopicFinished(Boolean(session.teoriaFinalizada));
    setModalScheduleRevisions(hasScheduledRevisions);
    setModalRevisaoDays(resolvedRevisaoDays);
    setIsAddingModalRevisaoDay(false);
    setNewModalRevisaoDayInput('');
    setModalCountInPlan(
      session.contabilizarPlanejamento !== undefined ? session.contabilizarPlanejamento : true
    );
    setModalCorrect(attempted > 0 ? String(correct) : '');
    setModalWrong(attempted > 0 ? String(wrong) : '');
    setModalPages(
      normalizedIntervals.length > 0
        ? normalizedIntervals
        : [{ id: `p_${Date.now()}`, inicio: '', fim: '' }]
    );
    setModalVideos(
      session.videoaulas && session.videoaulas.length > 0
        ? session.videoaulas
        : [{ id: `v_${Date.now()}`, titulo: '', inicio: '00:00:00', fim: '00:00:00' }]
    );
    setModalComments(extractCleanUserNotes(session.notes));
    setModalError(null);
    setConfirmDeleteId(null);
    setIsModalOpen(true);
  };

  // Tópicos disponíveis para a disciplina selecionada no modal (estritamente dentro do concurso da disciplina)
  const modalAvailableTopics = useMemo(() => {
    if (!modalDisciplinaId) return [];
    const targetDisc = relevantDisciplinas.find(d => d.id === modalDisciplinaId) || disciplinas.find(d => d.id === modalDisciplinaId);
    if (!targetDisc) return relevantAssuntos.filter(a => a.disciplinaId === modalDisciplinaId);

    const targetKey = targetDisc.name
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const matchingDiscIds = new Set(
      disciplinas
        .filter(
          d =>
            d.concursoId === targetDisc.concursoId &&
            d.name
              .trim()
              .toUpperCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '') === targetKey
        )
        .map(d => d.id)
    );
    matchingDiscIds.add(targetDisc.id);

    const seen = new Set<string>();
    return assuntos
      .filter(a => {
        if (!matchingDiscIds.has(a.disciplinaId)) return false;
        const k = a.name.trim().toUpperCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [modalDisciplinaId, relevantDisciplinas, disciplinas, relevantAssuntos, assuntos]);

  // Salvar (Criar ou Atualizar) no Modal Visão 3
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!modalDisciplinaId) {
      setModalError('Selecione uma disciplina para salvar o registro.');
      return;
    }

    const totalSeconds = parseHHMMSSToSeconds(modalTimeStr);
    if (totalSeconds <= 0) {
      setModalError('Informe um tempo de estudo maior que 00:00:00.');
      return;
    }

    const durationMinutes = Math.max(1, Math.round(totalSeconds / 60));
    const discObj = disciplinas.find(d => d.id === modalDisciplinaId);
    const assuntoObj = assuntos.find(a => a.id === modalAssuntoId);

    // Calcular data escolhida
    const now = new Date();
    let targetDate = new Date();
    if (dateMode === 'ontem') {
      targetDate.setDate(now.getDate() - 1);
    } else if (dateMode === 'outro' && modalCustomDate) {
      const [y, m, d] = modalCustomDate.split('-').map(Number);
      if (y && m && d) {
        targetDate = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds());
      }
    }

    // Questões (Acertos + Erros)
    const numCorrect = modalCorrect.trim() !== '' ? Math.max(0, parseInt(modalCorrect, 10) || 0) : 0;
    const numWrong = modalWrong.trim() !== '' ? Math.max(0, parseInt(modalWrong, 10) || 0) : 0;
    const numAttempted =
      modalCorrect.trim() !== '' || modalWrong.trim() !== '' ? numCorrect + numWrong : 0;

    // Normalizar páginas (se Fim > 0 e Início vazio, Início = 1)
    const validPages: PageInterval[] = modalPages
      .map((p): PageInterval => {
        const fimVal: number | '' = typeof p.fim === 'number' && !isNaN(p.fim) ? p.fim : '';
        const inicioVal: number | '' =
          typeof p.inicio === 'number' && !isNaN(p.inicio) && p.inicio > 0
            ? p.inicio
            : typeof fimVal === 'number' && fimVal > 0
            ? 1
            : '';
        return {
          id: p.id,
          inicio: inicioVal,
          fim: fimVal,
        };
      })
      .filter(
        p =>
          typeof p.inicio === 'number' &&
          typeof p.fim === 'number' &&
          p.fim >= p.inicio &&
          p.fim > 0
      );

    // Filtrar videoaulas preenchidas
    const validVideos = modalVideos.filter(
      v => v.titulo.trim() !== '' || (v.fim && v.fim !== '00:00:00')
    );

    setIsSavingModal(true);
    try {
      if (editingSession) {
        await onUpdateSession(editingSession.id, {
          disciplinaId: modalDisciplinaId,
          assuntoId: modalAssuntoId || undefined,
          disciplinaName: discObj?.name || editingSession.disciplinaName || 'Geral',
          assuntoName: assuntoObj?.name || editingSession.assuntoName || 'Estudo Geral',
          durationMinutes,
          durationSeconds: totalSeconds,
          type: modalCategory,
          material: modalMaterial.trim() || undefined,
          questionsAttempted: numAttempted > 0 ? numAttempted : undefined,
          questionsCorrect: numAttempted > 0 ? numCorrect : undefined,
          accuracyRate: numAttempted > 0 ? Math.round((numCorrect / numAttempted) * 100) : undefined,
          notes: modalComments.trim() || undefined,
          teoriaFinalizada: modalTopicFinished,
          programarRevisoes: modalScheduleRevisions,
          revisaoDays: modalScheduleRevisions ? modalRevisaoDays : undefined,
          contabilizarPlanejamento: modalCountInPlan,
          pageIntervals: validPages,
          videoaulas: validVideos,
          completedAt: targetDate.toISOString(),
        });
        setToastMessage(
          modalScheduleRevisions && modalRevisaoDays.length > 0
            ? `Registro atualizado e ${modalRevisaoDays.length} revisões vinculadas no menu Revisões!`
            : 'Registro de estudo atualizado com sucesso!'
        );
      } else {
        await onSaveSession({
          concursoId: activeConcurso?.id,
          disciplinaId: modalDisciplinaId,
          assuntoId: modalAssuntoId || undefined,
          disciplinaName: discObj?.name || 'Geral',
          assuntoName: assuntoObj?.name || 'Estudo Dirigido',
          durationMinutes,
          durationSeconds: totalSeconds,
          plannedMinutes: durationMinutes,
          type: modalCategory,
          origem: 'manual',
          material: modalMaterial.trim() || undefined,
          questionsAttempted: numAttempted > 0 ? numAttempted : undefined,
          questionsCorrect: numAttempted > 0 ? numCorrect : undefined,
          notes: modalComments.trim() || undefined,
          teoriaFinalizada: modalTopicFinished,
          programarRevisoes: modalScheduleRevisions,
          revisaoDays: modalScheduleRevisions ? modalRevisaoDays : undefined,
          contabilizarPlanejamento: modalCountInPlan,
          pageIntervals: validPages,
          videoaulas: validVideos,
          completedAt: targetDate.toISOString(),
        });
        setToastMessage(
          modalScheduleRevisions && modalRevisaoDays.length > 0
            ? `Novo estudo registrado e ${modalRevisaoDays.length} revisões programadas!`
            : 'Novo estudo registrado com sucesso no histórico!'
        );
      }

      if (modalTopicFinished && modalAssuntoId && onUpdateAssuntoStatus) {
        await onUpdateAssuntoStatus(modalAssuntoId, 'dominado');
      }

      setIsModalOpen(false);
      setEditingSession(null);
    } catch (err) {
      console.error('Erro ao salvar registro de estudo:', err);
      setModalError('Ocorreu um erro ao salvar o registro. Tente novamente.');
    } finally {
      setIsSavingModal(false);
    }
  };

  const handleConfirmDelete = async (sessionId: string) => {
    await onDeleteSession(sessionId);
    setConfirmDeleteId(null);
    if (editingSession?.id === sessionId) {
      setIsModalOpen(false);
      setEditingSession(null);
    }
    setToastMessage('Registro excluído e métricas recalculadas.');
  };

  // =========================================================================
  // FILTRAGEM E CONSOLIDAÇÃO DE REGISTROS (VISÃO 1)
  // =========================================================================
  const normalizeStr = (s?: string) =>
    (s || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const filteredSessions = useMemo(() => {
    // Se não há concurso ativo ou disciplinas válidas no escopo selecionado, o histórico é estritamente vazio
    if (validConcursoIds.size === 0 || relevantDiscIds.size === 0) {
      return [];
    }
    if (filterConcursoScope === 'ativo' && !activeConcurso) {
      return [];
    }

    const now = new Date();
    const todayYMD = getLocalYMD(now.toISOString());

    return sessoes
      .filter(s => {
        // 0. Integridade Referencial & Escopo de Concurso Ativo
        if (!s || !s.id || !s.disciplinaId) return false;
        if (!relevantDiscIds.has(s.disciplinaId)) return false;
        if (s.concursoId && !validConcursoIds.has(s.concursoId)) return false;
        if (filterConcursoScope === 'ativo' && activeConcurso) {
          if (s.concursoId && s.concursoId !== activeConcurso.id) return false;
        }
        if (s.assuntoId && !relevantAssuntoIds.has(s.assuntoId)) return false;

        // 1. Filtro de Busca Textual
        if (searchQuery.trim()) {
          const q = normalizeStr(searchQuery);
          const disc = relevantDisciplinas.find(d => d.id === s.disciplinaId);
          const ass = relevantAssuntos.find(a => a.id === s.assuntoId);
          const haystack = normalizeStr(
            `${s.disciplinaName || ''} ${disc?.name || ''} ${s.assuntoName || ''} ${
              ass?.name || ''
            } ${s.material || ''} ${s.notes || ''} ${s.type || ''}`
          );
          if (!haystack.includes(q)) return false;
        }

        // 2. Filtro de Disciplina
        if (filterDisciplinaId !== 'todas') {
          const selectedDisc = relevantDisciplinas.find(d => d.id === filterDisciplinaId);
          if (selectedDisc) {
            const sDisc = relevantDisciplinas.find(d => d.id === s.disciplinaId);
            const matchById = s.disciplinaId === filterDisciplinaId;
            const matchByName =
              normalizeStr(s.disciplinaName || sDisc?.name) === normalizeStr(selectedDisc.name);
            if (!matchById && !matchByName) return false;
          } else if (s.disciplinaId !== filterDisciplinaId) {
            return false;
          }
        }

        // 3. Filtro de Categoria
        if (filterCategory !== 'todas') {
          if (normalizeStr(s.type) !== normalizeStr(filterCategory)) return false;
        }

        // 4. Filtro de Origem
        if (filterOrigin !== 'todas') {
          const sessionOrig = s.origem || (s.type === 'pomodoro' ? 'cronometro' : 'manual');
          if (filterOrigin === 'cronometro') {
            if (sessionOrig !== 'cronometro' && sessionOrig !== 'pomodoro' && s.type !== 'pomodoro')
              return false;
          } else if (normalizeStr(sessionOrig) !== normalizeStr(filterOrigin)) {
            return false;
          }
        }

        // 5. Filtro de Período
        const dateStr = s.completedAt || s.createdAt;
        const sessionYMD = getLocalYMD(dateStr);
        const sessionDate = new Date(dateStr);

        if (periodFilter === 'hoje') {
          if (sessionYMD !== todayYMD) return false;
        } else if (periodFilter === '7d') {
          const cutoff = new Date();
          cutoff.setDate(now.getDate() - 7);
          cutoff.setHours(0, 0, 0, 0);
          if (sessionDate < cutoff) return false;
        } else if (periodFilter === '30d') {
          const cutoff = new Date();
          cutoff.setDate(now.getDate() - 30);
          cutoff.setHours(0, 0, 0, 0);
          if (sessionDate < cutoff) return false;
        } else if (periodFilter === 'mes') {
          if (
            sessionDate.getMonth() !== now.getMonth() ||
            sessionDate.getFullYear() !== now.getFullYear()
          ) {
            return false;
          }
        } else if (periodFilter === 'personalizado') {
          if (customStartDate && sessionYMD < customStartDate) return false;
          if (customEndDate && sessionYMD > customEndDate) return false;
        }

        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.completedAt || b.createdAt).getTime() -
          new Date(a.completedAt || a.createdAt).getTime()
      );
  }, [
    sessoes,
    validConcursoIds,
    relevantDiscIds,
    relevantAssuntoIds,
    filterConcursoScope,
    activeConcurso,
    searchQuery,
    filterDisciplinaId,
    filterCategory,
    filterOrigin,
    periodFilter,
    customStartDate,
    customEndDate,
    relevantDisciplinas,
    relevantAssuntos,
  ]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterConcursoScope !== 'ativo') count++;
    if (periodFilter !== 'todos') count++;
    if (filterDisciplinaId !== 'todas') count++;
    if (filterCategory !== 'todas') count++;
    if (filterOrigin !== 'todas') count++;
    return count;
  }, [filterConcursoScope, periodFilter, filterDisciplinaId, filterCategory, filterOrigin]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterConcursoScope('ativo');
    setPeriodFilter('todos');
    setCustomStartDate('');
    setCustomEndDate('');
    setFilterDisciplinaId('todas');
    setFilterCategory('todas');
    setFilterOrigin('todas');
  };

  // KPIs Consolidados (Visão 1)
  const kpiStats = useMemo(() => {
    let totalMinutes = 0;
    let totalQuestions = 0;
    let totalCorrect = 0;
    let totalPages = 0;

    for (const s of filteredSessions) {
      totalMinutes += s.durationMinutes || 0;
      totalQuestions += s.questionsAttempted || 0;
      totalCorrect += s.questionsCorrect || 0;
      const { totalPages: sessPages } = normalizeSessionPages(s);
      totalPages += sessPages;
    }

    const totalWrong = Math.max(0, totalQuestions - totalCorrect);
    const accuracyPercent =
      totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    const totalHoursDecimal = totalMinutes / 60;
    const pagesPerHour =
      totalHoursDecimal > 0 ? (totalPages / totalHoursDecimal).toFixed(1).replace('.', ',') : '0,0';

    const totalTopics = relevantAssuntos.length;
    const completedTopics = relevantAssuntos.filter(
      a => a.completed || a.status === 'dominado'
    ).length;
    const pendingTopics = Math.max(0, totalTopics - completedTopics);
    const editalPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    return {
      totalMinutes,
      sessionsCount: filteredSessions.length,
      totalQuestions,
      totalCorrect,
      totalWrong,
      accuracyPercent,
      totalPages,
      pagesPerHour,
      totalTopics,
      completedTopics,
      pendingTopics,
      editalPercent,
    };
  }, [filteredSessions, relevantAssuntos]);

  // Agrupamento Cronológico Diário (Cards Diários)
  const dailyGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        ymd: string;
        ddmm: string;
        weekdayShort: string;
        totalMinutes: number;
        items: SessaoEstudo[];
      }
    >();

    for (const s of filteredSessions) {
      const dateIso = s.completedAt || s.createdAt;
      const ymd = getLocalYMD(dateIso);
      if (!map.has(ymd)) {
        const [y, m, d] = ymd.split('-').map(Number);
        const dt = new Date(y, (m || 1) - 1, d || 1);
        const ddmm = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
        const weekdayRaw = dt
          .toLocaleDateString('pt-BR', { weekday: 'short' })
          .replace('.', '')
          .toLowerCase();
        map.set(ymd, {
          ymd,
          ddmm,
          weekdayShort: weekdayRaw,
          totalMinutes: 0,
          items: [],
        });
      }
      const group = map.get(ymd)!;
      group.totalMinutes += s.durationMinutes || 0;
      group.items.push(s);
    }

    return Array.from(map.values());
  }, [filteredSessions]);

  // =========================================================================
  // DADOS DA VISÃO 2: DETALHAMENTO POR DISCIPLINA (DRILL-DOWN)
  // =========================================================================
  const selectedSubject = useMemo(() => {
    if (!selectedSubjectId) return null;
    return relevantDisciplinas.find(d => d.id === selectedSubjectId) || null;
  }, [selectedSubjectId, relevantDisciplinas]);

  const subjectData = useMemo(() => {
    if (!selectedSubject) return null;
    const targetNameNorm = normalizeStr(selectedSubject.name);

    const matchingDiscIds = new Set(
      relevantDisciplinas
        .filter(
          d =>
            d.concursoId === selectedSubject.concursoId &&
            normalizeStr(d.name) === targetNameNorm
        )
        .map(d => d.id)
    );
    matchingDiscIds.add(selectedSubject.id);

    const subjectTopics = relevantAssuntos
      .filter(a => matchingDiscIds.has(a.disciplinaId))
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    const validTopicIds = new Set(subjectTopics.map(t => t.id));

    const subjectSessions = sessoes
      .filter(s => {
        if (!matchingDiscIds.has(s.disciplinaId)) return false;
        if (s.assuntoId && !validTopicIds.has(s.assuntoId)) return false;
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.completedAt || b.createdAt).getTime() -
          new Date(a.completedAt || a.createdAt).getTime()
      );

    const now = new Date();
    let totalMinutes = 0;
    let monthMinutes = 0;
    let totalQuestions = 0;
    let totalCorrect = 0;
    let totalPages = 0;
    let monthPages = 0;

    for (const s of subjectSessions) {
      const dt = new Date(s.completedAt || s.createdAt);
      const isThisMonth =
        dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();

      totalMinutes += s.durationMinutes || 0;
      if (isThisMonth) monthMinutes += s.durationMinutes || 0;

      totalQuestions += s.questionsAttempted || 0;
      totalCorrect += s.questionsCorrect || 0;

      const { totalPages: pCount } = normalizeSessionPages(s);
      totalPages += pCount;
      if (isThisMonth) monthPages += pCount;
    }

    const totalWrong = Math.max(0, totalQuestions - totalCorrect);
    const accuracyPercent =
      totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    const hoursDec = totalMinutes / 60;
    const pagesPerHour =
      hoursDec > 0 ? (totalPages / hoursDec).toFixed(1).replace('.', ',') : '0,0';

    const totalTopicsCount = subjectTopics.length;
    const completedTopicsCount = subjectTopics.filter(
      t => t.completed || t.status === 'dominado'
    ).length;
    const pendingTopicsCount = Math.max(0, totalTopicsCount - completedTopicsCount);
    const editalPercent =
      totalTopicsCount > 0 ? Math.round((completedTopicsCount / totalTopicsCount) * 100) : 0;

    return {
      subjectSessions,
      subjectTopics,
      totalMinutes,
      monthMinutes,
      totalQuestions,
      totalCorrect,
      totalWrong,
      accuracyPercent,
      totalPages,
      monthPages,
      pagesPerHour,
      totalTopicsCount,
      completedTopicsCount,
      pendingTopicsCount,
      editalPercent,
    };
  }, [selectedSubject, relevantDisciplinas, sessoes, relevantAssuntos]);

  const handleToggleTopicCompleted = async (topic: Assunto) => {
    const nextCompleted = !(topic.completed || topic.status === 'dominado');
    if (onUpdateAssuntoStatus) {
      await onUpdateAssuntoStatus(topic.id, nextCompleted ? 'dominado' : 'em_estudo');
    } else if (onUpdateAssunto) {
      await onUpdateAssunto(topic.id, {
        completed: nextCompleted,
        status: nextCompleted ? 'dominado' : 'em_estudo',
      });
    }
    setToastMessage(
      nextCompleted
        ? `Tópico "${topic.name}" marcado como concluído!`
        : `Tópico "${topic.name}" reaberto para estudo.`
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Flutuante */}
      {toastMessage && (
        <div
          className="fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl text-white shadow-xl border border-white/20 animate-in fade-in slide-in-from-top-3 duration-200"
          style={{ backgroundColor: palette.primary }}
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-bold">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-1 hover:opacity-80 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* =====================================================================
          VISÃO 1: LINHA DO TEMPO PRINCIPAL DO HISTÓRICO
         ===================================================================== */}
      {!selectedSubject && (
        <>
          {/* 1. Banner Principal Temático */}
          <MenuBannerFrame
            bannerThemes={HISTORICO_BANNER_THEMES}
            minHeight="min-h-[190px] md:min-h-[210px]"
            className="p-6 sm:p-8 text-white shadow-xl border border-slate-700/50 bg-slate-900 dark:bg-slate-950"
            contentClassName="flex flex-col md:flex-row md:items-center justify-between gap-6"
            alt="Banner Histórico de Estudos"
          >
            <div className="space-y-2.5 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider text-white shadow-xs"
                  style={{ backgroundColor: palette.primary }}
                >
                  <History className="w-3.5 h-3.5" />
                  Linha do Tempo Ativa
                </span>
                {activeConcurso && (
                  <span className="text-xs font-semibold text-slate-200 bg-black/45 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-white/15">
                    Plano: <strong className="text-white">{activeConcurso.title}</strong>
                  </span>
                )}
              </div>

              <h1
                ref={el => {
                  if (el) {
                    el.style.setProperty('color', '#FFFFFF', 'important');
                  }
                }}
                className="provas-banner-title text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white !text-white select-none"
                style={{
                  color: '#FFFFFF',
                  textShadow: themeGlowStyles.textShadow,
                }}
              >
                Histórico & Registros de Estudo
              </h1>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-xl">
                Acompanhe cada sessão realizada, edite lançamentos passados, filtre por disciplina ou
                categoria e audite sua evolução diária em tempo real.
              </p>

              <div className="pt-2 flex items-center gap-3">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handleOpenCreateModal()}
                  leftIcon={<Plus className="w-4 h-4 stroke-[2.5]" />}
                  className="shadow-lg font-bold"
                >
                  Adicionar Estudo
                </Button>
              </div>
            </div>
          </MenuBannerFrame>

          {/* 2. Quatro Cards Superiores de Resumo (KPIs Consolidados) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: TEMPO DE ESTUDO */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Tempo de Estudo
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {formatHoursMinutes(kpiStats.totalMinutes)}
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Em {kpiStats.sessionsCount}{' '}
                  {kpiStats.sessionsCount === 1 ? 'sessão registrada' : 'sessões registradas'}
                </p>
              </div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: `${palette.primary}18`,
                  color: palette.primary,
                }}
              >
                <Clock className="w-5 h-5" />
              </div>
            </div>

            {/* Card 2: DESEMPENHO */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Desempenho
                </span>
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {kpiStats.accuracyPercent}%
                  </span>
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                    ({kpiStats.totalQuestions} questões)
                  </span>
                </div>
                <p className="text-xs font-semibold flex items-center gap-1.5">
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {kpiStats.totalCorrect} certas
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span className="text-rose-500 dark:text-rose-400">
                    {kpiStats.totalWrong} erradas
                  </span>
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            {/* Card 3: PROGRESSO NO EDITAL */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Progresso no Edital
                </span>
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {kpiStats.editalPercent}%
                  </span>
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                    ({kpiStats.completedTopics} de {kpiStats.totalTopics})
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {kpiStats.pendingTopics} tópicos pendentes
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/12 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>

            {/* Card 4: PÁGINAS LIDAS */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Páginas Lidas
                </span>
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {kpiStats.totalPages}
                  </span>
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                    ({kpiStats.pagesPerHour} por hora)
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  no período filtrado
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/12 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* 3. Barra de Busca e Filtros Retráteis */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs p-3.5 sm:p-4 space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar por disciplina, tópico, material ou anotação..."
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all"
                  style={{ ['--tw-ring-color' as any]: palette.primary }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(prev => !prev)}
                  className={`px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isFilterOpen || activeFiltersCount > 0
                      ? 'border-transparent text-white shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                  style={
                    isFilterOpen || activeFiltersCount > 0
                      ? { backgroundColor: palette.primary }
                      : undefined
                  }
                >
                  <Filter className="w-4 h-4" />
                  <span>Filtros</span>
                  {activeFiltersCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/25 text-white font-extrabold">
                      {activeFiltersCount}
                    </span>
                  )}
                  {isFilterOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {(activeFiltersCount > 0 || searchQuery.trim() !== '') && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Limpar todos os filtros"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Limpar filtros</span>
                  </button>
                )}
              </div>
            </div>

            {/* Painel Retrátil de Filtros */}
            {isFilterOpen && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 animate-in fade-in duration-150">
                {/* Escopo do Concurso */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Concurso
                  </label>
                  <select
                    value={filterConcursoScope}
                    onChange={e => {
                      setFilterConcursoScope(e.target.value as 'ativo' | 'todos');
                      setFilterDisciplinaId('todas');
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="ativo">
                      Concurso Ativo ({activeConcurso?.organ || activeConcurso?.title || 'Atual'})
                    </option>
                    <option value="todos">Todos os Concursos</option>
                  </select>
                </div>

                {/* Período */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Período
                  </label>
                  <select
                    value={periodFilter}
                    onChange={e => setPeriodFilter(e.target.value as PeriodFilter)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="todos">Desde o início (Todos)</option>
                    <option value="hoje">Hoje</option>
                    <option value="7d">Últimos 7 dias</option>
                    <option value="30d">Últimos 30 dias</option>
                    <option value="mes">Este mês</option>
                    <option value="personalizado">Personalizado</option>
                  </select>
                </div>

                {/* Disciplina */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Disciplina
                  </label>
                  <select
                    value={filterDisciplinaId}
                    onChange={e => setFilterDisciplinaId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="todas">Todas as Disciplinas</option>
                    {uniqueDisciplinas.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Categoria
                  </label>
                  <select
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="todas">Todas as Categorias</option>
                    {allCategoryOptions.map(c => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Origem */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Origem do Registro
                  </label>
                  <select
                    value={filterOrigin}
                    onChange={e => setFilterOrigin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none"
                  >
                    {ORIGIN_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Datas personalizadas quando 'personalizado' estiver selecionado */}
                {periodFilter === 'personalizado' && (
                  <div className="sm:col-span-2 lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                        Data Inicial
                      </label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={e => setCustomStartDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                        Data Final
                      </label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={e => setCustomEndDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 4. Lista Cronológica Agrupada por Data (Cards Diários) */}
          {dailyGroups.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-12 text-center space-y-4 shadow-xs">
              <div
                className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
                style={{
                  backgroundColor: `${palette.primary}15`,
                  color: palette.primary,
                }}
              >
                <History className="w-7 h-7" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  Nenhum registro de estudo encontrado
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  {activeFiltersCount === 0 && searchQuery.trim() === ''
                    ? "Você ainda não registrou estudos para este concurso. Clique em '+ Adicionar Estudo' para começar seu histórico!"
                    : 'Nenhum registro corresponde aos filtros selecionados. Tente limpar os filtros ou ajustar sua busca.'}
                </p>
              </div>
              <div className="pt-1 flex items-center justify-center gap-3">
                {(activeFiltersCount > 0 || searchQuery.trim() !== '') && (
                  <Button variant="outline" size="sm" onClick={handleClearFilters}>
                    Limpar Filtros
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleOpenCreateModal()}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Adicionar Estudo
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {dailyGroups.map(group => (
                <div
                  key={group.ymd}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden"
                >
                  {/* Cabeçalho do Dia */}
                  <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                        {group.ddmm}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wider"
                        style={{
                          backgroundColor: `${palette.primary}18`,
                          color: palette.primary,
                        }}
                      >
                        {group.weekdayShort}
                      </span>
                    </div>

                    <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatHoursMinutes(group.totalMinutes)}</span>
                    </div>
                  </div>

                  {/* Linhas de Registros de Estudo do Dia */}
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
                    {group.items.map(item => {
                      const discObj =
                        disciplinas.find(d => d.id === item.disciplinaId) ||
                        disciplinas.find(
                          d => normalizeStr(d.name) === normalizeStr(item.disciplinaName)
                        );
                      const assObj = assuntos.find(a => a.id === item.assuntoId);
                      const discName = item.disciplinaName || discObj?.name || 'Disciplina Geral';
                      const rawTopicName =
                        item.assuntoName || assObj?.name || 'Estudo Geral da Disciplina';
                      const topicOrder = assObj?.order;
                      const hasNumberPrefix = /^\d+(\.\d+)*[\s.-]/.test(rawTopicName.trim());
                      const formattedTopic =
                        topicOrder && !hasNumberPrefix
                          ? `${topicOrder}. ${rawTopicName}`
                          : rawTopicName;

                      const { Icon: DiscIcon, color: discColor } = resolveSubjectIconAndColor(
                        discName,
                        discObj?.color || palette.primary
                      );
                      const catMeta = getCategoryMeta(item.type);
                      const { formattedLabel: pagesLabel } = normalizeSessionPages(item);
                      const cleanComment = extractCleanUserNotes(item.notes);

                      const qAttempted = item.questionsAttempted || 0;
                      const qCorrect = item.questionsCorrect || 0;
                      const qAcc =
                        qAttempted > 0
                          ? item.accuracyRate ?? Math.round((qCorrect / qAttempted) * 100)
                          : null;

                      return (
                        <div
                          key={item.id}
                          className="px-5 py-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 group"
                        >
                          {/* Esquerda: Ícone + Disciplina (clicável para Visão 2) + Tópico */}
                          <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (discObj) {
                                  setSelectedSubjectId(discObj.id);
                                  setShowAllSubjectRecords(false);
                                }
                              }}
                              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 cursor-pointer"
                              style={{
                                backgroundColor: `${discColor}18`,
                                color: discColor,
                              }}
                              title={`Ver histórico completo de ${discName}`}
                            >
                              <DiscIcon className="w-5 h-5" />
                            </button>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (discObj) {
                                      setSelectedSubjectId(discObj.id);
                                      setShowAllSubjectRecords(false);
                                    }
                                  }}
                                  className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 hover:underline text-left truncate cursor-pointer"
                                  title={`Abrir resumo de ${discName}`}
                                >
                                  {discName}
                                </button>

                                {item.teoriaFinalizada && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                                    ✓ Tópico concluído
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                                <span className="truncate max-w-md">{formattedTopic}</span>

                                {cleanComment && (
                                  <span
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px]"
                                    title={cleanComment}
                                  >
                                    <MessageSquare className="w-3 h-3 shrink-0" />
                                  </span>
                                )}

                                {item.material && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-medium">
                                    {item.material}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Direita: Colunas Alinhadas (Categoria | Tempo | Questões | Páginas | Ações) */}
                          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-3 sm:gap-5 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800/60">
                            {/* Coluna Categoria */}
                            <div className="w-28 sm:text-center shrink-0">
                              <span
                                className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold border ${catMeta.badgeClass}`}
                              >
                                {catMeta.label}
                              </span>
                            </div>

                            {/* Coluna Tempo */}
                            <div className="w-20 text-right font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-200 shrink-0">
                              {formatHoursMinutes(item.durationMinutes)}
                            </div>

                            {/* Coluna Questões */}
                            <div className="w-28 flex items-center justify-end gap-1.5 shrink-0">
                              {qAttempted > 0 && qAcc !== null ? (
                                <>
                                  <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
                                    {qCorrect}/{qAttempted}
                                  </span>
                                  <span
                                    className={`px-1.5 py-0.5 rounded-md text-[11px] font-extrabold border ${getAccuracyBadgeStyle(
                                      qAcc
                                    )}`}
                                  >
                                    {qAcc}%
                                  </span>
                                </>
                              ) : (
                                <span className="text-xs font-medium text-slate-300 dark:text-slate-600">
                                  —
                                </span>
                              )}
                            </div>

                            {/* Coluna Páginas */}
                            <div className="w-28 text-right shrink-0">
                              {pagesLabel ? (
                                <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
                                  {pagesLabel}
                                </span>
                              ) : (
                                <span className="text-xs font-medium text-slate-300 dark:text-slate-600">
                                  —
                                </span>
                              )}
                            </div>

                            {/* Coluna Ações Rápidas */}
                            <div className="flex items-center justify-end gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(item)}
                                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Editar registro de estudo"
                                aria-label="Editar registro de estudo"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>

                              {confirmDeleteId === item.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleConfirmDelete(item.id)}
                                    className="px-2 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold cursor-pointer"
                                  >
                                    Confirmar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(item.id)}
                                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                                  title="Excluir registro"
                                  aria-label="Excluir registro"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* =====================================================================
          VISÃO 2: DETALHAMENTO POR DISCIPLINA (DRILL-DOWN DA MATÉRIA)
         ===================================================================== */}
      {selectedSubject && subjectData && (() => {
        const { Icon: SubjIcon, color: subjColor } = resolveSubjectIconAndColor(
          selectedSubject.name,
          selectedSubject.color || palette.primary
        );
        const displayedRecords = showAllSubjectRecords
          ? subjectData.subjectSessions
          : subjectData.subjectSessions.slice(0, 5);

        return (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Cabeçalho da Disciplina */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <button
                  type="button"
                  onClick={() => setSelectedSubjectId(null)}
                  className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-colors shrink-0 cursor-pointer"
                  title="Voltar para a Linha do Tempo Geral"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `${subjColor}18`,
                    color: subjColor,
                  }}
                >
                  <SubjIcon className="w-6 h-6" />
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {selectedSubject.name}
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Seu resumo desta disciplina no plano{' '}
                    <strong className="text-slate-700 dark:text-slate-200">
                      {activeConcurso?.title || 'Concurso Ativo'}
                    </strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handleOpenCreateModal(selectedSubject.id)}
                  leftIcon={<Plus className="w-4 h-4 stroke-[2.5]" />}
                >
                  Adicionar Estudo
                </Button>
              </div>
            </div>

            {/* 4 Cards de KPIs Específicos da Disciplina */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: TEMPO DE ESTUDO */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Tempo de Estudo
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {formatHoursMinutes(subjectData.totalMinutes)}
                  </div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Neste mês: {formatHoursMinutes(subjectData.monthMinutes)}
                  </p>
                </div>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `${palette.primary}18`,
                    color: palette.primary,
                  }}
                >
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              {/* Card 2: DESEMPENHO */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Desempenho
                  </span>
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                      {subjectData.accuracyPercent}%
                    </span>
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                      ({subjectData.totalQuestions} questões)
                    </span>
                  </div>
                  <p className="text-xs font-semibold flex items-center gap-1.5">
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {subjectData.totalCorrect} certas
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span className="text-rose-500 dark:text-rose-400">
                      {subjectData.totalWrong} erradas
                    </span>
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>

              {/* Card 3: PROGRESSO NO EDITAL */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Progresso no Edital
                  </span>
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                      {subjectData.editalPercent}%
                    </span>
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                      ({subjectData.completedTopicsCount} de {subjectData.totalTopicsCount})
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {subjectData.pendingTopicsCount} tópicos pendentes
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/12 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>

              {/* Card 4: PÁGINAS LIDAS */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Páginas Lidas
                  </span>
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                      {subjectData.totalPages}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                      ({subjectData.pagesPerHour} por hora)
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Neste mês: {subjectData.monthPages} páginas
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-500/12 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Seção 1: Card "HISTÓRICO DE REGISTROS" da Disciplina */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <History className="w-4 h-4 text-slate-400" />
                  <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Histórico de Registros
                  </h3>
                </div>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                  {subjectData.subjectSessions.length}{' '}
                  {subjectData.subjectSessions.length === 1 ? 'registro' : 'registros'}
                </span>
              </div>

              {subjectData.subjectSessions.length === 0 ? (
                <div className="p-8 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Nenhum estudo registrado para esta disciplina ainda.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          <th className="py-3 px-5">Data</th>
                          <th className="py-3 px-4">Categoria</th>
                          <th className="py-3 px-4">Tópico</th>
                          <th className="py-3 px-4 text-right">Tempo</th>
                          <th className="py-3 px-4 text-right">Questões</th>
                          <th className="py-3 px-4 text-right">Páginas</th>
                          <th className="py-3 px-5 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs sm:text-sm">
                        {displayedRecords.map(rec => {
                          const dt = new Date(rec.completedAt || rec.createdAt);
                          const dateFormatted = dt.toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit',
                          });
                          const catMeta = getCategoryMeta(rec.type);
                          const assObj = assuntos.find(a => a.id === rec.assuntoId);
                          const topicTitle = rec.assuntoName || assObj?.name || 'Estudo Dirigido';
                          const secs =
                            rec.durationSeconds && rec.durationSeconds > 0
                              ? rec.durationSeconds
                              : Math.round((rec.durationMinutes || 0) * 60);
                          const { tableLabel: pagesTable } = normalizeSessionPages(rec);
                          const qAttempted = rec.questionsAttempted || 0;
                          const qCorrect = rec.questionsCorrect || 0;
                          const qAcc =
                            qAttempted > 0
                              ? rec.accuracyRate ?? Math.round((qCorrect / qAttempted) * 100)
                              : null;

                          return (
                            <tr
                              key={rec.id}
                              className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                            >
                              <td className="py-3.5 px-5 font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                {dateFormatted}
                              </td>
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${catMeta.badgeClass}`}
                                >
                                  {catMeta.label}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200 max-w-md truncate">
                                {topicTitle}
                              </td>
                              <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                {formatSecondsToHHMMSS(secs)}
                              </td>
                              <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                {qAttempted > 0 && qAcc !== null ? (
                                  <div className="inline-flex items-center justify-end gap-1.5">
                                    <span className="font-bold text-slate-700 dark:text-slate-200">
                                      {qCorrect}/{qAttempted}
                                    </span>
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[11px] font-extrabold border ${getAccuracyBadgeStyle(
                                        qAcc
                                      )}`}
                                    >
                                      {qAcc}%
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-slate-300 dark:text-slate-600">—</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-right font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                {pagesTable || (
                                  <span className="text-slate-300 dark:text-slate-600">—</span>
                                )}
                              </td>
                              <td className="py-3.5 px-5 text-right whitespace-nowrap">
                                <div className="inline-flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditModal(rec)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                    title="Editar registro"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleConfirmDelete(rec.id)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                                    title="Excluir registro"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {subjectData.subjectSessions.length > 5 && (
                    <div className="py-3 border-t border-slate-100 dark:border-slate-800 text-center">
                      <button
                        type="button"
                        onClick={() => setShowAllSubjectRecords(prev => !prev)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                      >
                        <span>
                          {showAllSubjectRecords
                            ? 'Ver menos'
                            : `Ver mais (${subjectData.subjectSessions.length - 5})`}
                        </span>
                        {showAllSubjectRecords ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Seção 2: Card "EDITAL VERTICALIZADO" da Disciplina */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Edital Verticalizado
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {subjectData.completedTopicsCount} de {subjectData.totalTopicsCount} concluídos
                  </span>
                  <div className="w-24 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${subjectData.editalPercent}%`,
                        backgroundColor: palette.primary,
                      }}
                    />
                  </div>
                  <span
                    className="text-xs font-extrabold"
                    style={{ color: palette.primary }}
                  >
                    {subjectData.editalPercent}%
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      <th className="py-3 px-5 w-10"></th>
                      <th className="py-3 px-3">Tópico</th>
                      <th className="py-3 px-4 text-right">Questões</th>
                      <th className="py-3 px-4 text-right">Último Estudo</th>
                      <th className="py-3 px-4 text-right">Estudo</th>
                      <th className="py-3 px-5 text-right">Material</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs sm:text-sm">
                    {subjectData.subjectTopics.map((topic, idx) => {
                      const isDone =
                        topic.completed ||
                        topic.status === 'dominado';
                      const topicSessions = subjectData.subjectSessions.filter(
                        s =>
                          s.assuntoId === topic.id ||
                          normalizeStr(s.assuntoName) === normalizeStr(topic.name)
                      );
                      const topicMins = topicSessions.reduce(
                        (sum, s) => sum + (s.durationMinutes || 0),
                        0
                      );
                      const sessQAttempted = topicSessions.reduce(
                        (sum, s) => sum + (s.questionsAttempted || 0),
                        0
                      );
                      const sessQCorrect = topicSessions.reduce(
                        (sum, s) => sum + (s.questionsCorrect || 0),
                        0
                      );
                      const totalQ = Math.max(topic.totalQuestionsSolved || 0, sessQAttempted);
                      const correctQ = Math.max(topic.correctQuestionsSolved || 0, sessQCorrect);
                      const acc = totalQ > 0 ? Math.round((correctQ / totalQ) * 100) : null;

                      const lastDateRaw =
                        topicSessions[0]?.completedAt || topic.lastStudiedAt || null;
                      const lastDateFormatted = lastDateRaw
                        ? new Date(lastDateRaw).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit',
                          })
                        : null;

                      const latestMaterial =
                        topicSessions.find(s => s.material && s.material.trim())?.material || null;

                      const hasNumberPrefix = /^\d+(\.\d+)*[\s.-]/.test(topic.name.trim());
                      const displayTopicName = hasNumberPrefix
                        ? topic.name
                        : `${topic.order || idx + 1}. ${topic.name}`;

                      return (
                        <tr
                          key={topic.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3.5 px-5">
                            <button
                              type="button"
                              onClick={() => handleToggleTopicCompleted(topic)}
                              className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all cursor-pointer ${
                                isDone
                                  ? 'border-transparent text-white'
                                  : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-slate-400'
                              }`}
                              style={isDone ? { backgroundColor: palette.primary } : undefined}
                              title={
                                isDone ? 'Marcar como pendente' : 'Marcar tópico como concluído'
                              }
                            >
                              {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </button>
                          </td>

                          <td className="py-3.5 px-3">
                            <span
                              className={`font-medium ${
                                isDone
                                  ? 'line-through text-slate-400 dark:text-slate-500'
                                  : 'text-slate-800 dark:text-slate-100'
                              }`}
                            >
                              {displayTopicName}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            {totalQ > 0 && acc !== null ? (
                              <div className="inline-flex items-center justify-end gap-1.5">
                                <span className="font-bold text-slate-700 dark:text-slate-200">
                                  {correctQ}/{totalQ}
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[11px] font-extrabold border ${getAccuracyBadgeStyle(
                                    acc
                                  )}`}
                                >
                                  {acc}%
                                </span>
                                {acc >= 90 && (
                                  <span title="Excelente desempenho (>= 90%)" className="inline-flex">
                                    <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 dark:text-slate-500">
                                Sem dados
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {lastDateFormatted || (
                              <span className="text-slate-300 dark:text-slate-600">—</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            {topicSessions.length > 0 ? (
                              <div className="inline-flex items-center justify-end gap-1.5">
                                <span className="font-semibold text-slate-700 dark:text-slate-200">
                                  {formatHoursMinutes(topicMins)}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                                  {topicSessions.length}x
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600">—</span>
                            )}
                          </td>

                          <td className="py-3.5 px-5 text-right text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {latestMaterial || (
                              <span className="text-slate-300 dark:text-slate-600">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* =====================================================================
          VISÃO 3: MODAL COMPLETO "REGISTRO DE ESTUDO" (CRIAR, EDITAR E EXCLUIR)
         ===================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-10 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Cabeçalho do Modal */}
            <div className="px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `${palette.primary}18`,
                    color: palette.primary,
                  }}
                >
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                    Registro de estudo
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Preencha os detalhes para registrar seu tempo e avanço
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corpo do Formulário */}
            <form onSubmit={handleSaveModal} className="p-6 overflow-y-auto space-y-5 flex-1">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Seletor de Data (Segmented Control: Hoje | Ontem | Outro) */}
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/70">
                  {(['hoje', 'ontem', 'outro'] as const).map(mode => {
                    const active = dateMode === mode;
                    const label =
                      mode === 'hoje' ? 'Hoje' : mode === 'ontem' ? 'Ontem' : 'Outro';
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setDateMode(mode)}
                        className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          active
                            ? 'bg-white dark:bg-slate-900 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                        style={active ? { color: palette.primary } : undefined}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>

                {dateMode === 'outro' && (
                  <div className="pt-1">
                    <input
                      type="date"
                      value={modalCustomDate}
                      onChange={e => setModalCustomDate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Linha 1: Categoria | Disciplina | Tempo de estudo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Categoria
                  </label>
                  <select
                    value={modalCategory}
                    onChange={e => setModalCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none"
                  >
                    {allCategoryOptions.map(c => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Disciplina
                  </label>
                  <select
                    value={modalDisciplinaId}
                    onChange={e => {
                      const newDiscId = e.target.value;
                      setModalDisciplinaId(newDiscId);
                      const firstTopic = assuntos.find(a => a.disciplinaId === newDiscId);
                      setModalAssuntoId(firstTopic?.id || '');
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none"
                  >
                    {uniqueDisciplinas.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tempo de estudo
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={8}
                      value={modalTimeStr}
                      onChange={e => setModalTimeStr(handleTimeMask(e.target.value))}
                      onBlur={e => setModalTimeStr(normalizeTimeOnBlur(e.target.value))}
                      placeholder="00:25:00"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Linha 2: Tópico (65%) | Material opcional (35%) */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                <div className="sm:col-span-8">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tópico
                  </label>
                  <select
                    value={modalAssuntoId}
                    onChange={e => setModalAssuntoId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="">Estudo Geral da Disciplina</option>
                    {modalAvailableTopics.map((t, idx) => {
                      const hasPrefix = /^\d+(\.\d+)*[\s.-]/.test(t.name.trim());
                      const label = hasPrefix ? t.name : `${t.order || idx + 1}. ${t.name}`;
                      return (
                        <option key={t.id} value={t.id}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Material (opcional)
                  </label>
                  <input
                    type="text"
                    value={modalMaterial}
                    onChange={e => setModalMaterial(e.target.value)}
                    placeholder="Ex: PDF Aula 02"
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Grid Lado a Lado: Cards de Automação (Teoria Finalizada | Programar Revisões) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                {/* Coluna Esquerda (Card 1): Teoria Finalizada */}
                <label
                  className={`p-4 rounded-2xl border flex flex-col justify-between gap-2.5 cursor-pointer select-none transition-all h-full ${
                    modalTopicFinished
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/25 border-emerald-500/50 shadow-xs'
                      : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={modalTopicFinished}
                        onChange={e => setModalTopicFinished(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 cursor-pointer shrink-0"
                        style={{ accentColor: palette.primary }}
                      />
                      <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 shrink-0" style={{ color: palette.primary }} />
                        <span>Teoria Finalizada</span>
                      </span>
                    </div>
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider shrink-0"
                      style={{
                        backgroundColor: `${palette.primary}15`,
                        color: palette.primary,
                      }}
                    >
                      Edital Verticalizado
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 pl-6">
                    Marca este tópico como concluído e superado no edital verticalizado ao salvar a sessão.
                  </p>
                </label>

                {/* Coluna Direita (Card 2): Programar Revisões */}
                <label
                  className={`p-4 rounded-2xl border flex flex-col justify-between gap-2.5 cursor-pointer select-none transition-all h-full ${
                    modalScheduleRevisions
                      ? 'bg-purple-50/70 dark:bg-purple-950/25 border-purple-500 dark:border-purple-500/70 shadow-xs'
                      : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={modalScheduleRevisions}
                        onChange={e => setModalScheduleRevisions(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 cursor-pointer shrink-0 accent-purple-600"
                      />
                      <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5">
                        <CalendarClock className="w-4 h-4 shrink-0 text-purple-600 dark:text-purple-400" />
                        <span>Programar Revisões</span>
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider shrink-0 bg-purple-500/15 text-purple-700 dark:text-purple-300">
                      SRS Ativo
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 pl-6">
                    Gera agendamentos espaçados automáticos para este conteúdo nos intervalos selecionados.
                  </p>
                </label>
              </div>

              {/* Expansão dinâmica das tags de revisões quando "Programar Revisões" estiver marcado */}
              {modalScheduleRevisions && (
                <div className="p-3.5 rounded-2xl border border-purple-500/30 bg-purple-50/40 dark:bg-purple-950/15 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300">
                      Prazos de retorno ({modalRevisaoDays.length} revisões programadas):
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Clique no 'x' para remover ou '+' para novo prazo
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {modalRevisaoDays.map(day => (
                      <span
                        key={day}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-purple-500/30 text-xs font-bold text-purple-700 dark:text-purple-300 shadow-2xs"
                      >
                        {day}d
                        <button
                          type="button"
                          onClick={() => handleRemoveModalRevisaoDay(day)}
                          className="text-purple-400 hover:text-rose-500 transition-colors cursor-pointer"
                          title={`Remover revisão de ${day} dias`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}

                    {!isAddingModalRevisaoDay ? (
                      <button
                        type="button"
                        onClick={() => setIsAddingModalRevisaoDay(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-dashed border-purple-400 dark:border-purple-600 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 text-xs font-bold transition-all cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Novo prazo
                      </button>
                    ) : (
                      <div className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 border border-purple-500 rounded-lg px-2 py-0.5">
                        <input
                          type="number"
                          min="1"
                          max="730"
                          value={newModalRevisaoDayInput}
                          onChange={e => setNewModalRevisaoDayInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleConfirmAddModalRevisaoDay();
                            }
                          }}
                          placeholder="Dias"
                          className="w-14 text-xs font-bold bg-transparent text-slate-900 dark:text-white focus:outline-none"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleConfirmAddModalRevisaoDay}
                          className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline px-1 cursor-pointer"
                        >
                          OK
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingModalRevisaoDay(false);
                            setNewModalRevisaoDayInput('');
                          }}
                          className="text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Grid de 3 Cards de Métricas Detalhadas (Questões | Páginas | Videoaulas) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* 1. Card Questões (Apenas Certas e Erradas + Cálculo Automático) */}
                {(() => {
                  const certasNum = Math.max(0, parseInt(modalCorrect, 10) || 0);
                  const erradasNum = Math.max(0, parseInt(modalWrong, 10) || 0);
                  const totalQuestoes = certasNum + erradasNum;
                  const taxaAcerto = totalQuestoes > 0 ? Math.round((certasNum / totalQuestoes) * 100) : 0;
                  const badgeColorClass =
                    totalQuestoes === 0
                      ? 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800'
                      : taxaAcerto >= 75
                      ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30'
                      : taxaAcerto >= 50
                      ? 'text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30'
                      : 'text-rose-700 dark:text-rose-300 bg-rose-500/15 border border-rose-500/30';

                  return (
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3 flex flex-col justify-between">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
                          Questões <span className="font-normal text-slate-400">(opcional)</span>
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${badgeColorClass}`}>
                          {taxaAcerto}%
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5 pt-0.5 items-end">
                        <div className="flex flex-col justify-end">
                          <label className="block text-[11px] font-bold text-emerald-600 dark:text-emerald-400 min-h-[32px] flex items-end pb-1 leading-tight">
                            Certas (Acertos)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={modalCorrect}
                            onChange={e => setModalCorrect(e.target.value)}
                            placeholder="Ex: 17"
                            className="w-full h-10 px-2.5 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-500/30 focus:border-emerald-500 text-center text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300 placeholder:text-emerald-600/40 dark:placeholder:text-emerald-400/40 focus:outline-none transition-all shadow-2xs"
                          />
                        </div>
                        <div className="flex flex-col justify-end">
                          <label className="block text-[11px] font-bold text-rose-600 dark:text-rose-400 min-h-[32px] flex items-end pb-1 leading-tight">
                            Erradas (Erros)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={modalWrong}
                            onChange={e => setModalWrong(e.target.value)}
                            placeholder="Ex: 3"
                            className="w-full h-10 px-2.5 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-500/30 focus:border-rose-500 text-center text-xs sm:text-sm font-bold text-rose-700 dark:text-rose-300 placeholder:text-rose-600/40 dark:placeholder:text-rose-400/40 focus:outline-none transition-all shadow-2xs"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 2. Card Páginas */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
                      Páginas <span className="font-normal text-slate-400">(opcional)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setModalPages(prev => [
                          ...prev,
                          { id: `p_${Date.now()}_${prev.length}`, inicio: '', fim: '' },
                        ])
                      }
                      className="w-6 h-6 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-bold cursor-pointer"
                      title="Adicionar intervalo de páginas"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2 max-h-28 overflow-y-auto pr-0.5">
                    {modalPages.map((pg, idx) => (
                      <div key={pg.id || idx} className="grid grid-cols-2 gap-2 items-center">
                        <div>
                          {idx === 0 && (
                            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                              Início
                            </label>
                          )}
                          <input
                            type="number"
                            min="1"
                            value={pg.inicio}
                            onChange={e => {
                              const val =
                                e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value, 10));
                              setModalPages(prev =>
                                prev.map(item =>
                                  item.id === pg.id ? { ...item, inicio: val } : item
                                )
                              );
                            }}
                            placeholder="1"
                            className="w-full px-2.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none"
                          />
                        </div>
                        <div>
                          {idx === 0 && (
                            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                              Fim
                            </label>
                          )}
                          <input
                            type="number"
                            min="1"
                            value={pg.fim}
                            onChange={e => {
                              const val =
                                e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value, 10));
                              setModalPages(prev =>
                                prev.map(item => (item.id === pg.id ? { ...item, fim: val } : item))
                              );
                            }}
                            placeholder="0"
                            className="w-full px-2.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Card Videoaulas */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
                      Videoaulas <span className="font-normal text-slate-400">(opcional)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setModalVideos(prev => [
                          ...prev,
                          {
                            id: `v_${Date.now()}_${prev.length}`,
                            titulo: '',
                            inicio: '00:00:00',
                            fim: '00:00:00',
                          },
                        ])
                      }
                      className="w-6 h-6 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-bold cursor-pointer"
                      title="Adicionar videoaula"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2 max-h-28 overflow-y-auto pr-0.5">
                    {modalVideos.map((vid, idx) => (
                      <div key={vid.id || idx} className="space-y-1.5">
                        <input
                          type="text"
                          value={vid.titulo}
                          onChange={e =>
                            setModalVideos(prev =>
                              prev.map(v =>
                                v.id === vid.id ? { ...v, titulo: e.target.value } : v
                              )
                            )
                          }
                          placeholder={`Aula ${String(idx + 1).padStart(2, '0')}`}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none"
                        />
                        <div className="grid grid-cols-2 gap-1.5">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={8}
                            value={vid.inicio}
                            onChange={e => {
                              const masked = handleTimeMask(e.target.value);
                              setModalVideos(prev =>
                                prev.map(v =>
                                  v.id === vid.id ? { ...v, inicio: masked } : v
                                )
                              );
                            }}
                            onBlur={e => {
                              const normalized = normalizeTimeOnBlur(e.target.value);
                              setModalVideos(prev =>
                                prev.map(v =>
                                  v.id === vid.id ? { ...v, inicio: normalized } : v
                                )
                              );
                            }}
                            placeholder="00:00:00"
                            className="w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center text-[11px] font-mono text-slate-600 dark:text-slate-300 focus:outline-none"
                          />
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={8}
                            value={vid.fim}
                            onChange={e => {
                              const masked = handleTimeMask(e.target.value);
                              setModalVideos(prev =>
                                prev.map(v =>
                                  v.id === vid.id ? { ...v, fim: masked } : v
                                )
                              );
                            }}
                            onBlur={e => {
                              const normalized = normalizeTimeOnBlur(e.target.value);
                              setModalVideos(prev =>
                                prev.map(v =>
                                  v.id === vid.id ? { ...v, fim: normalized } : v
                                )
                              );
                            }}
                            placeholder="00:00:00"
                            className="w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center text-[11px] font-mono text-slate-600 dark:text-slate-300 focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Comentários (opcional) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Comentários <span className="font-normal text-slate-400">(opcional)</span>
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {modalComments.length}/500
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={modalComments}
                  onChange={e => setModalComments(e.target.value)}
                  placeholder="Dúvidas, tópicos que merecem revisão posterior, palavras-chave, macetes..."
                  className="w-full p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none resize-none"
                />
              </div>

              {/* Rodapé do Modal */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  {editingSession && (
                    <button
                      type="button"
                      onClick={() => handleConfirmDelete(editingSession.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Excluir registro</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2.5 ml-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={isSavingModal}
                  >
                    {isSavingModal ? 'Salvando...' : 'Salvar estudo'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
