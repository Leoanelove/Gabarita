import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Calendar, 
  Check, 
  Clock, 
  Plus, 
  BookOpen, 
  Filter, 
  RotateCcw, 
  Zap, 
  Target, 
  ChevronDown,
  MoreVertical,
  Edit3,
  EyeOff,
  Trash2,
  X,
  FileText,
  HelpCircle,
  AlertCircle,
  Lock,
  GraduationCap,
  CalendarClock
} from 'lucide-react';
import { 
  Revisao, 
  Disciplina, 
  Assunto, 
  RevisionSettings, 
  RevisionRating, 
  RevisionMethod,
  PageInterval,
  VideoaulaRecord
} from '../../types';
import { Card, CardBody } from '../../design-system/Card';
import { Button } from '../../design-system/Button';
import { Badge } from '../../design-system/Badge';
import { Modal } from '../../design-system/Modal';
import { PlannerService } from '../../services/plannerService';
import { EmptyContestState } from '../common/EmptyContestState';
import { useTheme } from '../../contexts/ThemeContext';
import { MenuBannerFrame } from '../common/MenuBannerFrame';
import { StudyTimerModal } from '../estudos/StudyTimerModal';
import { handleTimeMask, normalizeTimeOnBlur } from '../estudos/StudyRegisterModal';

// Banners do menu "Revisões Espaçadas" por tema
export const REVISOES_ESPACADAS_BANNER_THEMES: Record<string, string> = {
  verde: '/assets/bannersrevisoes/Banner-Revisoes-verde.webp',
  azul: '/assets/bannersrevisoes/Banner-Revisoes-azul.webp',
  rosa: '/assets/bannersrevisoes/Banner-Revisoes-rosa.webp',
  roxo: '/assets/bannersrevisoes/Banner-Revisoes-roxo.webp',
  laranja: '/assets/bannersrevisoes/Banner-Revisoes-laranja.webp',
};

interface RevisoesViewProps {
  revisoes: Revisao[];
  disciplinas: Disciplina[];
  assuntos?: Assunto[];
  settings?: RevisionSettings;
  onNavigateTab?: (tab: any) => void;
  onCompleteRevisao: (
    id: string, 
    rating: RevisionRating, 
    accuracyRate?: number, 
    questionsAttempted?: number, 
    questionsCorrect?: number, 
    notes?: string,
    sessionDetails?: {
      durationMinutes?: number;
      durationSeconds?: number;
      material?: string;
      teoriaFinalizada?: boolean;
      programarRevisoes?: boolean;
      contabilizarPlanejamento?: boolean;
      pageIntervals?: PageInterval[];
      videoaulas?: VideoaulaRecord[];
      completedAt?: string;
    }
  ) => Promise<void>;
  onAddRevisao: (rev: {
    disciplinaId: string;
    assuntoId?: string;
    assuntoName: string;
    method: RevisionMethod | string;
    scheduledFor: string;
    notes?: string;
    isAutomatic?: boolean;
    stage?: number;
    intervalDays?: number;
  }) => Promise<void>;
  onUpdateRevisao?: (id: string, partial: Partial<Revisao>) => Promise<void>;
  onDeleteRevisao?: (idOrIds: string | string[]) => Promise<void>;
  onBatchRescheduleOverdue?: (targetDateStr?: string) => Promise<void>;
  onUpdateSettings?: (settings: Partial<RevisionSettings>) => Promise<void>;
  onOpenStudyTimer?: (disciplinaId?: string, assuntoId?: string) => void;
}

type TimelineTab = 'hoje' | 'atrasadas' | 'proximas' | 'ignoradas' | 'concluidas';

const WEEKDAY_SHORT_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const parts = clean.split('-');
  if (parts.length < 3) return clean;
  const [, m, d] = parts;
  return `${d}/${m}`;
}

export function formatDateGroupHeader(dateStr: string): string {
  if (!dateStr) return '';
  const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const parts = clean.split('-');
  if (parts.length < 3) return clean;
  const [y, m, d] = parts.map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1, 12, 0, 0);
  const weekday = WEEKDAY_SHORT_PT[dt.getDay()] || '';
  const dayPadded = String(d).padStart(2, '0');
  const monthPadded = String(m).padStart(2, '0');
  return `${dayPadded}/${monthPadded} ${weekday}`;
}

export function formatMinutesToHours(min: number): string {
  if (!min || min <= 0) return '0min';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h > 0 && m > 0) return `${h}h${m < 10 ? '0' : ''}${m}min`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
}

export function formatPages(pages: string): string {
  if (!pages) return '';
  const sanitized = pages.replace(/null\s*~\s*/gi, '1 ~ ').replace(/\s*~\s*null/gi, '');
  return sanitized.startsWith('p.') ? sanitized : `p. ${sanitized}`;
}

export function formatSecondsToHHMMSS(totalSeconds: number): string {
  const safeSecs = Math.max(0, Math.round(totalSeconds || 0));
  const hrs = Math.floor(safeSecs / 3600);
  const mins = Math.floor((safeSecs % 3600) / 60);
  const secs = safeSecs % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function parseHHMMSSToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':').map(n => parseInt(n, 10) || 0);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return (parts[0] || 0) * 60;
}

const FILTER_PERIOD_PILLS: { id: string; label: string; days?: number }[] = [
  { id: '1d', label: '1d', days: 1 },
  { id: '7d', label: '7d', days: 7 },
  { id: '15d', label: '15d', days: 15 },
  { id: '21d', label: '21d', days: 21 },
  { id: '30d', label: '30d', days: 30 },
  { id: '60d', label: '60d', days: 60 },
  { id: '90d', label: '90d', days: 90 },
  { id: '120d', label: '120d', days: 120 },
];

const DEFAULT_REVISION_TYPE_INTERVALS = [
  1, 7, 15, 21, 30, 45, 60, 90, 120, 180, 215, 265, 315, 365
];

const DEFAULT_PRESET_INTERVALS = [
  1, 7, 15, 21, 30, 45, 60, 90, 120, 180, 215, 265, 315, 365
];

export function resolveRevisionIntervalDays(rev: Revisao): number | undefined {
  if (typeof rev.intervalDays === 'number' && !isNaN(rev.intervalDays) && rev.intervalDays > 0) {
    return rev.intervalDays;
  }
  if (rev.method) {
    const methodStr = String(rev.method).trim().toLowerCase();
    if (methodStr === '24h') return 1;
    const match = methodStr.match(/(\d+)/);
    if (match) {
      const parsed = parseInt(match[1], 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  }
  return undefined;
}

interface StudyRegisterModalData {
  revisaoId: string;
  categoria: string;
  disciplinaId: string;
  disciplinaNome: string;
  topicoId?: string;
  topicoNome: string;
  tempoEstudo: string;
  tempoSegundos: number;
  material: string;
  comentarios: string;
  questoesCertas: number;
  questoesErradas: number;
  isDisciplinaLocked: boolean;
  isTopicoLocked: boolean;
}

export const RevisoesView: React.FC<RevisoesViewProps> = ({
  revisoes,
  disciplinas,
  assuntos = [],
  settings = {
    autoScheduleOnStudy: true,
    autoScheduleOnQuestions: true,
    intervalDays: [1, 7, 15, 30, 60],
    performanceAdaptive: true,
    easeMultiplier: 1.8,
    hardPenaltyDays: 1,
  },
  onCompleteRevisao,
  onAddRevisao,
  onUpdateRevisao,
  onDeleteRevisao,
  onBatchRescheduleOverdue,
  onUpdateSettings,
  onNavigateTab,
}) => {
  const { colorSkin, palette } = useTheme();
  const currentTheme = (
    colorSkin === 'purple' ? 'roxo' :
    colorSkin === 'orange' || colorSkin === 'dbz' ? 'laranja' :
    colorSkin || palette?.id || 'verde'
  ).toLowerCase();

  const themeKey = (currentTheme || 'verde').toLowerCase();

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

  const [activeTab, setActiveTab] = useState<TimelineTab>('hoje');

  // Estados de Filtro (Popover)
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterPeriodPreset, setFilterPeriodPreset] = useState<string>('todos');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [selectedDiscFilter, setSelectedDiscFilter] = useState<string>('todas');
  const [selectedIntervalTypes, setSelectedIntervalTypes] = useState<number[]>([]);

  // Menu de 3 pontinhos ativo
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteTargetReview, setDeleteTargetReview] = useState<Revisao | null>(null);
  const [isDeletingReview, setIsDeletingReview] = useState<boolean>(false);

  const [feedback, setFeedback] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // =========================================================================
  // FLUXO CONECTADO: "Revisar Agora" -> "Cronômetro de Foco" -> "Registro de Estudo"
  // =========================================================================
  const [activeTimerReview, setActiveTimerReview] = useState<Revisao | null>(null);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [isStudyRegisterModalOpen, setIsStudyRegisterModalOpen] = useState(false);
  const [studyRegisterModalData, setStudyRegisterModalData] = useState<StudyRegisterModalData | null>(null);

  // Estados do formulário "Registro de estudo" da Revisão
  const [regDateMode, setRegDateMode] = useState<'hoje' | 'ontem' | 'outro'>('hoje');
  const [regCustomDate, setRegCustomDate] = useState<string>(() => PlannerService.formatLocalDate(new Date()));
  const [regTimeStr, setRegTimeStr] = useState<string>('00:25:00');
  const [regMaterial, setRegMaterial] = useState<string>('');
  const [regTopicFinished, setRegTopicFinished] = useState<boolean>(false);
  const [regScheduleRevisions, setRegScheduleRevisions] = useState<boolean>(false);
  const [regCountInPlan, setRegCountInPlan] = useState<boolean>(true);
  const [regCorrect, setRegCorrect] = useState<string>('0');
  const [regWrong, setRegWrong] = useState<string>('0');
  const [regPages, setRegPages] = useState<PageInterval[]>([
    { id: 'p_1', inicio: 0, fim: 0 }
  ]);
  const [regVideos, setRegVideos] = useState<VideoaulaRecord[]>([
    { id: 'v_1', titulo: '', inicio: '00:00:00', fim: '00:00:00' }
  ]);
  const [regComments, setRegComments] = useState<string>('');
  const [regError, setRegError] = useState<string | null>(null);
  const [isSavingReg, setIsSavingReg] = useState<boolean>(false);

  // Formulário de Agendar Nova Revisão + Prazos Customizados
  const [formDisciplinaId, setFormDisciplinaId] = useState(disciplinas[0]?.id || '');
  const [formAssuntoId, setFormAssuntoId] = useState('');
  const [formAssuntoName, setFormAssuntoName] = useState('');
  const [formMethod, setFormMethod] = useState<RevisionMethod | string>('24h');
  const [formIntervalDays, setFormIntervalDays] = useState<number>(1);
  const [formSelectedIntervals, setFormSelectedIntervals] = useState<number[]>([1]);
  const [customIntervals, setCustomIntervals] = useState<number[]>(() => {
    const merged = Array.from(new Set([...DEFAULT_PRESET_INTERVALS, ...(settings.intervalDays || [])])).sort((a, b) => a - b);
    return merged;
  });
  const [isAddingCustomInterval, setIsAddingCustomInterval] = useState(false);
  const [newCustomDaysInput, setNewCustomDaysInput] = useState('');
  const [formScheduledFor, setFormScheduledFor] = useState(() =>
    PlannerService.formatLocalDate(new Date(Date.now() + 86400000))
  );
  const [formNotes, setFormNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filterPopoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (disciplinas.length > 0 && !disciplinas.some(d => d.id === formDisciplinaId)) {
      setFormDisciplinaId(disciplinas[0].id);
    }
  }, [disciplinas, formDisciplinaId]);

  // Fechar menu de 3 pontinhos ou popover ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (openMenuId && !target.closest('.menu-options-container')) {
        setOpenMenuId(null);
      }
      if (isFilterOpen && filterPopoverRef.current && !filterPopoverRef.current.contains(target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId, isFilterOpen]);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4500);
  };

  const todayStr = PlannerService.formatLocalDate(new Date());

  const availableAssuntos = useMemo(() => {
    return assuntos.filter(a => a.disciplinaId === formDisciplinaId);
  }, [assuntos, formDisciplinaId]);

  const availableRevisionTypeDays = useMemo(() => {
    const set = new Set<number>(DEFAULT_REVISION_TYPE_INTERVALS);
    if (Array.isArray(settings?.intervalDays)) {
      settings.intervalDays.forEach(d => {
        const num = Number(d);
        if (!isNaN(num) && num > 0) set.add(num);
      });
    }
    revisoes.forEach(r => {
      const d = resolveRevisionIntervalDays(r);
      if (d && d > 0) set.add(d);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [revisoes, settings?.intervalDays]);

  const handleToggleIntervalType = (days: number) => {
    setSelectedIntervalTypes(prev =>
      prev.includes(days)
        ? prev.filter(d => d !== days)
        : [...prev, days].sort((a, b) => a - b)
    );
  };

  const handleSelectPeriodPill = (pillId: string, days?: number) => {
    if (filterPeriodPreset === pillId) {
      setFilterPeriodPreset('todos');
      setFilterStartDate('');
      setFilterEndDate('');
      return;
    }
    setFilterPeriodPreset(pillId);
    if (days) {
      const start = new Date();
      const end = new Date(Date.now() + days * 86400000);
      setFilterStartDate(PlannerService.formatLocalDate(start));
      setFilterEndDate(PlannerService.formatLocalDate(end));
    }
  };

  const handleClearFilters = () => {
    setFilterPeriodPreset('todos');
    setFilterStartDate('');
    setFilterEndDate('');
    setSelectedDiscFilter('todas');
    setSelectedIntervalTypes([]);
  };

  const hasActiveFilters =
    selectedDiscFilter !== 'todas' ||
    filterStartDate !== '' ||
    filterEndDate !== '' ||
    filterPeriodPreset !== 'todos' ||
    selectedIntervalTypes.length > 0;

  const categorized = useMemo(() => {
    const list = revisoes.filter(r => {
      if (selectedDiscFilter !== 'todas' && r.disciplinaId !== selectedDiscFilter) {
        return false;
      }
      if (selectedIntervalTypes.length > 0) {
        const revDays = resolveRevisionIntervalDays(r);
        if (!revDays || !selectedIntervalTypes.includes(revDays)) {
          return false;
        }
      }
      const sDate = r.scheduledFor.includes('T') ? r.scheduledFor.split('T')[0] : r.scheduledFor;
      if (filterStartDate && sDate < filterStartDate) {
        return false;
      }
      if (filterEndDate && sDate > filterEndDate) {
        return false;
      }
      return true;
    });

    const hoje: Revisao[] = [];
    const atrasadas: Revisao[] = [];
    const proximas: Revisao[] = [];
    const ignoradas: Revisao[] = [];
    const concluidas: Revisao[] = [];

    list.forEach(r => {
      const sDate = r.scheduledFor.includes('T') ? r.scheduledFor.split('T')[0] : r.scheduledFor;
      if (r.status === 'concluida') {
        concluidas.push(r);
      } else if (r.status === 'ignorada') {
        ignoradas.push(r);
      } else if (r.status === 'atrasada' || sDate < todayStr) {
        atrasadas.push(r);
      } else if (sDate === todayStr) {
        hoje.push(r);
      } else {
        proximas.push(r);
      }
    });

    const sortByScheduledAsc = (a: Revisao, b: Revisao) => {
      const da = a.scheduledFor.includes('T') ? a.scheduledFor.split('T')[0] : a.scheduledFor;
      const db = b.scheduledFor.includes('T') ? b.scheduledFor.split('T')[0] : b.scheduledFor;
      return da.localeCompare(db);
    };

    const sortByScheduledDesc = (a: Revisao, b: Revisao) => {
      const da = a.scheduledFor.includes('T') ? a.scheduledFor.split('T')[0] : a.scheduledFor;
      const db = b.scheduledFor.includes('T') ? b.scheduledFor.split('T')[0] : b.scheduledFor;
      return db.localeCompare(da);
    };

    hoje.sort(sortByScheduledAsc);
    atrasadas.sort(sortByScheduledAsc);
    proximas.sort(sortByScheduledAsc);
    ignoradas.sort(sortByScheduledDesc);
    concluidas.sort(sortByScheduledDesc);

    return { hoje, atrasadas, proximas, ignoradas, concluidas };
  }, [revisoes, selectedDiscFilter, selectedIntervalTypes, filterStartDate, filterEndDate, todayStr]);

  const srsStats = useMemo(() => {
    const total = revisoes.length;
    const totalConcluidas = categorized.concluidas.length;
    const totalHoje = categorized.hoje.length;
    const totalAtrasadas = categorized.atrasadas.length;
    const totalProximas = categorized.proximas.length;
    const rated = revisoes.filter(r => r.status === 'concluida' && r.rating);
    const easyOrMed = rated.filter(r => r.rating === 'facil' || r.rating === 'medio').length;
    const retentionRate = rated.length > 0 ? Math.round((easyOrMed / rated.length) * 100) : 100;
    return { total, totalConcluidas, totalHoje, totalAtrasadas, totalProximas, retentionRate };
  }, [revisoes, categorized]);

  // Agrupamento cronológico por data para a aba ativa
  const activeTabGroupedByDate = useMemo(() => {
    let sourceList: Revisao[] = [];
    if (activeTab === 'hoje') sourceList = categorized.hoje;
    else if (activeTab === 'atrasadas') sourceList = categorized.atrasadas;
    else if (activeTab === 'proximas') sourceList = categorized.proximas;
    else if (activeTab === 'ignoradas') sourceList = categorized.ignoradas;
    else if (activeTab === 'concluidas') sourceList = categorized.concluidas;

    const groupsMap = new Map<string, Revisao[]>();
    sourceList.forEach(rev => {
      const dateKey = rev.scheduledFor.includes('T') ? rev.scheduledFor.split('T')[0] : rev.scheduledFor;
      const existing = groupsMap.get(dateKey) || [];
      existing.push(rev);
      groupsMap.set(dateKey, existing);
    });

    const entries = Array.from(groupsMap.entries());
    if (activeTab === 'concluidas' || activeTab === 'ignoradas') {
      entries.sort((a, b) => b[0].localeCompare(a[0]));
    } else {
      entries.sort((a, b) => a[0].localeCompare(b[0]));
    }

    return entries.map(([dateStr, items]) => ({
      dateStr,
      headerLabel: formatDateGroupHeader(dateStr),
      items,
    }));
  }, [activeTab, categorized]);

  if (disciplinas.length === 0) {
    return (
      <EmptyContestState
        title="Você ainda não possui disciplinas para revisão"
        description="Cadastre seu concurso foco e importe as matérias para ativar o motor inteligente de Repetição Espaçada (SRS 24h, 7d, 15d, 30d)."
        actionText="Cadastrar Concurso e Matérias"
        onAction={() => onNavigateTab ? onNavigateTab('concursos') : null}
      />
    );
  }

  // Inicializa o estado limpo da modal "Registro de estudo" para uma revisão
  const initializeStudyRegisterModal = (elapsedSeconds: number, rev: Revisao) => {
    const formattedTime = formatSecondsToHHMMSS(elapsedSeconds);
    const data: StudyRegisterModalData = {
      revisaoId: rev.id,
      categoria: 'Revisão',
      disciplinaId: rev.disciplinaId,
      disciplinaNome: rev.disciplinaName,
      topicoId: rev.assuntoId,
      topicoNome: rev.assuntoName,
      tempoEstudo: formattedTime,
      tempoSegundos: elapsedSeconds,
      material: '',
      comentarios: '', // OBRIGATÓRIO: iniciar completamente limpo!
      questoesCertas: 0,
      questoesErradas: 0,
      isDisciplinaLocked: true,
      isTopicoLocked: true,
    };

    setStudyRegisterModalData(data);
    setRegDateMode('hoje');
    setRegCustomDate(todayStr);
    setRegTimeStr(formattedTime);
    setRegMaterial('');
    setRegTopicFinished(false);
    setRegScheduleRevisions(false);
    setRegCountInPlan(true);
    setRegCorrect('');
    setRegWrong('');
    setRegPages([{ id: `p_${Date.now()}`, inicio: 0, fim: 0 }]);
    setRegVideos([{ id: `v_${Date.now()}`, titulo: '', inicio: '00:00:00', fim: '00:00:00' }]);
    setRegComments(''); // OBRIGATÓRIO: zero dados residuais!
    setRegError(null);
    setIsStudyRegisterModalOpen(true);
  };

  // PASSO 1: Clique em "Revisar agora" -> Abre o Cronômetro de Foco contextualizado
  const handleStartRevision = (rev: Revisao) => {
    setOpenMenuId(null);
    setActiveTimerReview(rev);
    setIsTimerModalOpen(true);
  };

  // PASSO 2: Ação "Parar e salvar" no Cronômetro -> Pausa, fecha timer e abre modal "Registro de estudo"
  const handleStopTimerAndOpenRegister = (elapsedSeconds: number, rev: Revisao) => {
    setIsTimerModalOpen(false);
    initializeStudyRegisterModal(elapsedSeconds, rev);
  };

  // Menu de 3 Pontinhos: "Registrar manualmente" -> Abre modal "Registro de estudo" direto com campos travados e notas limpas
  const handleManualRegister = (rev: Revisao) => {
    setOpenMenuId(null);
    setActiveTimerReview(rev);
    initializeStudyRegisterModal(25 * 60, rev);
  };

  const handleIgnoreReview = async (rev: Revisao) => {
    setOpenMenuId(null);
    if (onUpdateRevisao) {
      await onUpdateRevisao(rev.id, { status: 'ignorada' });
    }
    showFeedback('Revisão movida para Ignoradas!');
  };

  const handleRestoreIgnoredReview = async (rev: Revisao) => {
    setOpenMenuId(null);
    if (onUpdateRevisao) {
      const sDate = rev.scheduledFor.includes('T') ? rev.scheduledFor.split('T')[0] : rev.scheduledFor;
      const restoredStatus = sDate < todayStr ? 'atrasada' : 'pendente';
      await onUpdateRevisao(rev.id, { status: restoredStatus });
    }
    showFeedback('Revisão restaurada para a fila ativa!');
  };

  const getRelatedFutureRevisions = (target: Revisao): Revisao[] => {
    const targetDate = target.scheduledFor.includes('T')
      ? target.scheduledFor.split('T')[0]
      : target.scheduledFor;
    const targetTopicNorm = (target.assuntoName || '').trim().toLowerCase();

    // Se pertencer a um lote gerado junto (ex: rev_srs_1730000000000_0)
    const batchPrefixMatch = target.id.match(/^(rev_srs_\d+_)/);
    const batchPrefix = batchPrefixMatch ? batchPrefixMatch[1] : null;

    return revisoes.filter(r => {
      if (r.id === target.id) return true;
      if (r.status === 'concluida') return false;

      const rDate = r.scheduledFor.includes('T')
        ? r.scheduledFor.split('T')[0]
        : r.scheduledFor;

      const isFutureOrSameDate =
        rDate > targetDate ||
        (rDate === targetDate && (r.intervalDays || 0) >= (target.intervalDays || 0));
      if (!isFutureOrSameDate) return false;

      if (batchPrefix && r.id.startsWith(batchPrefix)) {
        return true;
      }

      if (r.disciplinaId !== target.disciplinaId) return false;
      const sameAssunto =
        (target.assuntoId && r.assuntoId && r.assuntoId === target.assuntoId) ||
        ((r.assuntoName || '').trim().toLowerCase() === targetTopicNorm && targetTopicNorm !== '');
      if (!sameAssunto) return false;

      if (target.originalStudyDate && r.originalStudyDate && r.originalStudyDate !== target.originalStudyDate) {
        return false;
      }
      if (target.originalCategory && r.originalCategory && r.originalCategory !== target.originalCategory) {
        return false;
      }
      if (
        target.originalDurationMinutes !== undefined &&
        r.originalDurationMinutes !== undefined &&
        r.originalDurationMinutes !== target.originalDurationMinutes
      ) {
        return false;
      }

      return true;
    });
  };

  const handleDeleteReview = (rev: Revisao) => {
    setOpenMenuId(null);
    setDeleteTargetReview(rev);
  };

  const handleConfirmDeleteSingleReview = async () => {
    if (!deleteTargetReview) return;
    setIsDeletingReview(true);
    try {
      if (onDeleteRevisao) {
        await onDeleteRevisao(deleteTargetReview.id);
      }
      setDeleteTargetReview(null);
      showFeedback('Revisão excluída com sucesso!');
    } finally {
      setIsDeletingReview(false);
    }
  };

  const handleConfirmDeleteFutureRelatedReviews = async () => {
    if (!deleteTargetReview) return;
    setIsDeletingReview(true);
    try {
      const related = getRelatedFutureRevisions(deleteTargetReview);
      const idsToDelete = Array.from(new Set([deleteTargetReview.id, ...related.map(r => r.id)]));
      if (onDeleteRevisao) {
        await onDeleteRevisao(idsToDelete);
      }
      setDeleteTargetReview(null);
      showFeedback(
        idsToDelete.length > 1
          ? `${idsToDelete.length} revisões relacionadas foram excluídas com sucesso!`
          : 'Revisão excluída com sucesso!'
      );
    } finally {
      setIsDeletingReview(false);
    }
  };

  // PASSO 4: Salvar estudo na modal "Registro de estudo" e sincronizar Revisões, Histórico, Edital e Estatísticas
  const handleSaveStudyRegisterModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studyRegisterModalData) return;

    const totalSeconds = parseHHMMSSToSeconds(regTimeStr);
    if (totalSeconds <= 0) {
      setRegError('Informe um tempo de estudo válido (ex: 00:25:00).');
      return;
    }

    setRegError(null);
    setIsSavingReg(true);

    try {
      const durationMinutes = Math.max(1, Math.round(totalSeconds / 60));
      const correctCount = Math.max(0, parseInt(regCorrect, 10) || 0);
      const wrongCount = Math.max(0, parseInt(regWrong, 10) || 0);
      const attemptedCount = correctCount + wrongCount;
      const accRate = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : undefined;

      // Rating inteligente derivado da taxa de acerto (ou 'facil' quando não houver bateria de questões)
      const derivedRating: RevisionRating =
        accRate === undefined
          ? 'facil'
          : accRate >= 75
          ? 'facil'
          : accRate >= 50
          ? 'medio'
          : 'dificil';

      const validPageIntervals: PageInterval[] = regPages
        .filter(p => Number(p.fim) > 0 || Number(p.inicio) > 0)
        .map(p => {
          const ini = Number(p.inicio) > 0 ? Number(p.inicio) : 1;
          const fim = Number(p.fim) >= ini ? Number(p.fim) : ini;
          return { id: p.id, inicio: ini, fim };
        });

      const validVideoaulas: VideoaulaRecord[] = regVideos.filter(v => v.titulo.trim().length > 0);

      const now = new Date();
      let selectedDate = new Date();
      if (regDateMode === 'ontem') {
        selectedDate.setDate(now.getDate() - 1);
      } else if (regDateMode === 'outro' && regCustomDate) {
        const [y, m, d] = regCustomDate.split('-').map(Number);
        if (y && m && d) {
          selectedDate = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds());
        }
      }

      const cleanComments = regComments.trim();

      await onCompleteRevisao(
        studyRegisterModalData.revisaoId,
        derivedRating,
        accRate,
        attemptedCount > 0 ? attemptedCount : undefined,
        attemptedCount > 0 ? correctCount : undefined,
        cleanComments,
        {
          durationMinutes,
          durationSeconds: totalSeconds,
          material: regMaterial.trim() || undefined,
          teoriaFinalizada: regTopicFinished,
          programarRevisoes: regScheduleRevisions,
          contabilizarPlanejamento: regCountInPlan,
          pageIntervals: validPageIntervals,
          videoaulas: validVideoaulas,
          completedAt: selectedDate.toISOString(),
        }
      );

      setIsStudyRegisterModalOpen(false);
      setStudyRegisterModalData(null);
      setActiveTimerReview(null);
      showFeedback('Revisão concluída e registrada no seu Histórico com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar revisão no histórico:', err);
      setRegError('Não foi possível salvar o registro da revisão. Tente novamente.');
    } finally {
      setIsSavingReg(false);
    }
  };

  const handleAddCustomIntervalPill = () => {
    const parsed = parseInt(newCustomDaysInput.trim(), 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 1000) {
      const next = Array.from(new Set([...customIntervals, parsed])).sort((a, b) => a - b);
      setCustomIntervals(next);
      const nextSelected = Array.from(new Set([...formSelectedIntervals, parsed])).sort((a, b) => a - b);
      setFormSelectedIntervals(nextSelected);
      const primaryDays = nextSelected[0] || parsed;
      setFormIntervalDays(primaryDays);
      setFormMethod(primaryDays === 1 ? '24h' : `${primaryDays}d`);
      const targetDate = new Date(Date.now() + primaryDays * 86400000);
      setFormScheduledFor(PlannerService.formatLocalDate(targetDate));
      setNewCustomDaysInput('');
      setIsAddingCustomInterval(false);
    }
  };

  const handleSelectIntervalOption = (days: number) => {
    const isAlreadySelected = formSelectedIntervals.includes(days);
    let nextSelected: number[];
    if (isAlreadySelected) {
      nextSelected = formSelectedIntervals.length > 1
        ? formSelectedIntervals.filter(d => d !== days)
        : [days];
    } else {
      nextSelected = [...formSelectedIntervals, days].sort((a, b) => a - b);
    }
    setFormSelectedIntervals(nextSelected);
    const primaryDays = nextSelected[0] || days;
    setFormIntervalDays(primaryDays);
    setFormMethod(primaryDays === 1 ? '24h' : `${primaryDays}d`);
    const targetDate = new Date(Date.now() + primaryDays * 86400000);
    setFormScheduledFor(PlannerService.formatLocalDate(targetDate));
  };

  const handleToggleSelectAllIntervals = () => {
    const allSelected = customIntervals.length > 0 && customIntervals.every(d => formSelectedIntervals.includes(d));
    const nextSelected = allSelected
      ? [customIntervals[0] || 1]
      : [...customIntervals].sort((a, b) => a - b);
    setFormSelectedIntervals(nextSelected);
    const primaryDays = nextSelected[0] || 1;
    setFormIntervalDays(primaryDays);
    setFormMethod(primaryDays === 1 ? '24h' : `${primaryDays}d`);
    const targetDate = new Date(Date.now() + primaryDays * 86400000);
    setFormScheduledFor(PlannerService.formatLocalDate(targetDate));
  };

  const handleSaveAddModal = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalAssunto = formAssuntoName.trim() || (assuntos.find(a => a.id === formAssuntoId)?.name) || 'Revisão Geral';
    setIsSubmitting(true);
    try {
      const intervalsToSchedule = (
        formSelectedIntervals.length > 0
          ? [...formSelectedIntervals]
          : [formIntervalDays > 0 ? formIntervalDays : 1]
      ).sort((a, b) => a - b);

      const firstInterval = intervalsToSchedule[0] || 1;
      const baseFirstDate = formScheduledFor
        ? new Date(`${formScheduledFor}T12:00:00`)
        : new Date(Date.now() + firstInterval * 86400000);

      for (let idx = 0; idx < intervalsToSchedule.length; idx++) {
        const intervalDays = intervalsToSchedule[idx];
        const methodLabel = intervalDays === 1 ? '24h' : `${intervalDays}d`;
        const deltaDays = intervalDays - firstInterval;
        const scheduledDateStr = idx === 0 && formScheduledFor
          ? formScheduledFor
          : PlannerService.formatLocalDate(new Date(baseFirstDate.getTime() + deltaDays * 86400000));

        await onAddRevisao({
          disciplinaId: formDisciplinaId,
          assuntoId: formAssuntoId || undefined,
          assuntoName: finalAssunto,
          method: methodLabel,
          scheduledFor: scheduledDateStr,
          notes: formNotes.trim() || undefined,
          isAutomatic: false,
          stage: idx + 1,
          intervalDays,
        });
      }

      showFeedback(
        intervalsToSchedule.length > 1
          ? `${intervalsToSchedule.length} revisões agendadas com sucesso!`
          : 'Revisão agendada com sucesso!'
      );
      setIsAddModalOpen(false);
      setFormAssuntoName('');
      setFormNotes('');
      setFormSelectedIntervals([1]);
      setFormIntervalDays(1);
      setFormMethod('24h');
      setFormScheduledFor(PlannerService.formatLocalDate(new Date(Date.now() + 86400000)));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRevisionCard = (rev: Revisao) => (
    <div
      key={rev.id}
      className="flashcards-daily-review-card p-4 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/25 dark:border-primary/20 rounded-2xl shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      {/* Lado Esquerdo: Ícone + Textos + Metadados */}
      <div className="flex items-start gap-3.5 flex-1 min-w-0">
        {/* Ícone da Matéria / Tipo */}
        <div className="w-10 h-10 rounded-xl bg-[var(--primary-light)] border border-[var(--primary-light-border)] flex items-center justify-center shrink-0 text-[var(--primary-color)] dark:text-[var(--primary-text-dark)]">
          <BookOpen className="w-5 h-5" />
        </div>

        <div className="space-y-1 min-w-0 flex-1">
          {/* Linha 1: Tópico em negrito + Badge do Ciclo */}
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
              {rev.assuntoName}
            </h4>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-white/80 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
              {rev.intervalDays
                ? `REVISÃO DE ${rev.intervalDays} ${rev.intervalDays === 1 ? 'DIA' : 'DIAS'}`
                : rev.method
                ? `REVISÃO ${String(rev.method).toUpperCase()}`
                : 'REVISÃO PROGRAMADA'}
            </span>
            {rev.status === 'concluida' && (
              <Badge variant="emerald" size="sm">Concluída</Badge>
            )}
            {rev.status === 'ignorada' && (
              <Badge variant="amber" size="sm">Ignorada</Badge>
            )}
          </div>

          {/* Linha 2: Nome da Disciplina com cor temática */}
          <div className="text-xs font-semibold text-[var(--primary-color)] dark:text-[var(--primary-text-dark)]">
            {rev.disciplinaName}
          </div>

          {/* Linha 3: Bloco de Metadados da Sessão Original */}
          <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {rev.originalStudyDate && (
              <span className="flex items-center gap-1 font-medium">
                <Calendar className="w-3.5 h-3.5" />
                Estudado em {formatDateBR(rev.originalStudyDate)}
              </span>
            )}

            {rev.originalCategory && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                {rev.originalCategory}
              </span>
            )}

            {rev.originalDurationMinutes ? (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatMinutesToHours(rev.originalDurationMinutes)}
              </span>
            ) : null}

            {rev.originalQuestionsAttempted ? (
              <span className="flex items-center gap-1">
                <Target className="w-3.5 h-3.5" />
                {rev.originalQuestionsCorrect ?? 0} / {rev.originalQuestionsAttempted}
                {rev.originalAccuracyRate !== undefined && (
                  <span
                    className={`ml-1 font-bold ${
                      rev.originalAccuracyRate >= 75
                        ? 'text-emerald-500'
                        : rev.originalAccuracyRate >= 50
                        ? 'text-amber-500'
                        : 'text-rose-500'
                    }`}
                  >
                    {rev.originalAccuracyRate}%
                  </span>
                )}
              </span>
            ) : null}

            {rev.originalPages && rev.originalPages !== 'null' && (
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                {formatPages(rev.originalPages)}
              </span>
            )}

            {rev.originalMaterial && (
              <span className="flex items-center gap-1">
                📚 {rev.originalMaterial}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Lado Direito: Botão "Revisar agora" + Menu 3 Pontinhos */}
      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
        <Button
          size="sm"
          variant="primary"
          onClick={() => handleStartRevision(rev)}
          leftIcon={<Zap className="w-3.5 h-3.5" />}
          className="theme-btn-primary text-white font-bold text-xs shadow-xs cursor-pointer"
        >
          Revisar agora
        </Button>

        {/* Menu Dropdown de 3 Pontinhos */}
        <div className="relative menu-options-container">
          <button
            type="button"
            onClick={() => setOpenMenuId(openMenuId === rev.id ? null : rev.id)}
            className="p-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {openMenuId === rev.id && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-30 py-1 text-xs">
              <button
                type="button"
                onClick={() => handleManualRegister(rev)}
                className="w-full px-3.5 py-2 text-left flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                Registrar manualmente
              </button>

              {rev.status === 'ignorada' ? (
                <button
                  type="button"
                  onClick={() => handleRestoreIgnoredReview(rev)}
                  className="w-full px-3.5 py-2 text-left flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-emerald-600 dark:text-emerald-400 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restaurar revisão
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleIgnoreReview(rev)}
                  className="w-full px-3.5 py-2 text-left flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-amber-600 dark:text-amber-400 cursor-pointer"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  Ignorar revisão
                </button>
              )}

              <button
                type="button"
                onClick={() => handleDeleteReview(rev)}
                className="w-full px-3.5 py-2 text-left flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-rose-600 dark:text-rose-400 border-t border-slate-100 dark:border-slate-800 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir revisão
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {feedback && (
        <div className="p-3.5 rounded-xl text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
          {feedback}
        </div>
      )}

      <MenuBannerFrame
        bannerThemes={REVISOES_ESPACADAS_BANNER_THEMES}
        alt="Banner Revisões Espaçadas"
        minHeight="min-h-[190px] md:min-h-[220px]"
        className="revisoes-banner w-full border border-slate-200/20 dark:border-slate-800 rounded-2xl md:rounded-3xl shadow-xl flex items-center bg-slate-950"
        overlayClassName="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/45 to-transparent pointer-events-none z-[1]"
        contentClassName="p-6 md:p-8 flex flex-col justify-between items-start max-w-2xl h-full gap-4"
      >
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-3 flex-wrap">
            <div
              className="w-11 h-11 rounded-xl bg-black/50 border border-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-md"
              style={{ color: themeGlowStyles.color }}
            >
              <CalendarClock className="w-6 h-6" />
            </div>
            <h2
              ref={(el) => {
                if (el) {
                  el.style.setProperty('color', '#FFFFFF', 'important');
                  el.style.setProperty('text-shadow', themeGlowStyles.textShadow, 'important');
                }
              }}
              className="provas-banner-title text-xl sm:text-2xl md:text-3xl font-extrabold !text-white tracking-tight leading-tight select-none drop-shadow-md"
              style={{
                color: '#FFFFFF',
                textShadow: themeGlowStyles.textShadow,
              }}
            >
              Retenção Ativa & Curva de Esquecimento
            </h2>
          </div>
          <p className="text-xs sm:text-sm !text-white/90 leading-relaxed max-w-xl drop-shadow-xs">
            Gerencie seus ciclos de repetição espaçada, acompanhe revisões pendentes e fortaleça a memória de longo prazo até a data da prova.
          </p>
        </div>

        <div className="shrink-0 self-start pt-1">
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4 stroke-[2.5]" />}
            className="font-bold shadow-lg shadow-black/25 cursor-pointer text-xs sm:text-sm px-5 py-2.5"
          >
            Agendar Revisão
          </Button>
        </div>
      </MenuBannerFrame>

      {/* Cards de Resumo (KPIs) posicionados logo abaixo do Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div
          onClick={() => setActiveTab('hoje')}
          className="flashcards-daily-review-card gabarita-card-hover-theme relative overflow-hidden p-4 sm:p-5 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-l-4 border-primary/25 dark:border-primary/20 rounded-2xl shadow-xs flex flex-col justify-between cursor-pointer hover:brightness-105 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-sky-600 dark:text-sky-400 text-[11px] uppercase font-extrabold tracking-wider">
              Hoje
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-sky-600 dark:text-sky-400 tracking-tight">
            {srsStats.totalHoje}
          </div>
        </div>

        <div
          onClick={() => setActiveTab('atrasadas')}
          className="flashcards-daily-review-card gabarita-card-hover-theme relative overflow-hidden p-4 sm:p-5 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-l-4 border-primary/25 dark:border-primary/20 rounded-2xl shadow-xs flex flex-col justify-between cursor-pointer hover:brightness-105 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-rose-600 dark:text-rose-400 text-[11px] uppercase font-extrabold tracking-wider">
              Atrasadas
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-rose-600 dark:text-rose-400 tracking-tight">
            {srsStats.totalAtrasadas}
          </div>
        </div>

        <div
          onClick={() => setActiveTab('proximas')}
          className="flashcards-daily-review-card gabarita-card-hover-theme relative overflow-hidden p-4 sm:p-5 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-l-4 border-primary/25 dark:border-primary/20 rounded-2xl shadow-xs flex flex-col justify-between cursor-pointer hover:brightness-105 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-purple-600 dark:text-purple-300 text-[11px] uppercase font-extrabold tracking-wider">
              Próximas
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-purple-600 dark:text-purple-300 tracking-tight">
            {srsStats.totalProximas}
          </div>
        </div>

        <div
          onClick={() => setActiveTab('concluidas')}
          className="flashcards-daily-review-card gabarita-card-hover-theme relative overflow-hidden p-4 sm:p-5 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-l-4 border-primary/25 dark:border-primary/20 rounded-2xl shadow-xs flex flex-col justify-between cursor-pointer hover:brightness-105 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-emerald-600 dark:text-emerald-400 text-[11px] uppercase font-extrabold tracking-wider">
              Concluídas
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
            {srsStats.totalConcluidas}
          </div>
        </div>

        <div className="flashcards-daily-review-card gabarita-card-hover-theme relative overflow-hidden p-4 sm:p-5 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-l-4 border-primary/25 dark:border-primary/20 rounded-2xl shadow-xs flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-lg col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-amber-600 dark:text-amber-300 text-[11px] uppercase font-extrabold tracking-wider">
              Retenção
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-600 dark:text-amber-400 tracking-tight">
            {srsStats.retentionRate}%
          </div>
        </div>
      </div>

      {/* Abas de Navegação + Botão Filtros Popover + Agendar Revisão */}
      <div className="revisoes-nav-tabs flashcards-daily-review-card relative flex flex-wrap items-center justify-between gap-2 p-2 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent rounded-2xl border border-primary/25 dark:border-primary/20 text-xs shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('hoje')}
            className={`px-4 py-2 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'hoje'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Hoje ({categorized.hoje.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('atrasadas')}
            className={`px-4 py-2 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'atrasadas'
                ? 'bg-rose-600 text-white shadow-xs'
                : categorized.atrasadas.length > 0
                ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Atrasadas ({categorized.atrasadas.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('proximas')}
            className={`px-4 py-2 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'proximas'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Próximas ({categorized.proximas.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ignoradas')}
            className={`px-4 py-2 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ignoradas'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Ignoradas ({categorized.ignoradas.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('concluidas')}
            className={`px-4 py-2 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'concluidas'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Concluídas ({categorized.concluidas.length})
          </button>
        </div>

        <div className="flex items-center gap-2 ml-auto shrink-0">
          {/* Popover de Filtros */}
          <div className="relative" ref={filterPopoverRef}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              leftIcon={<Filter className="w-3.5 h-3.5" />}
              rightIcon={<ChevronDown className="w-3 h-3" />}
              className={`bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 text-xs ${
                hasActiveFilters ? 'ring-2 ring-purple-500/40 border-purple-500' : ''
              }`}
            >
              Filtros
            </Button>

            {isFilterOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-40 p-4 space-y-4 text-xs">
                <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Filtros</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Refine o que esta tela mostra</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFilterOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Seção PERÍODO */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    PERÍODO
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="block text-[10px] text-slate-400 mb-1">De</span>
                      <input
                        type="date"
                        value={filterStartDate}
                        onChange={(e) => {
                          setFilterStartDate(e.target.value);
                          setFilterPeriodPreset('custom');
                        }}
                        className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 font-mono text-[11px]"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 mb-1">Até</span>
                      <input
                        type="date"
                        value={filterEndDate}
                        onChange={(e) => {
                          setFilterEndDate(e.target.value);
                          setFilterPeriodPreset('custom');
                        }}
                        className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 font-mono text-[11px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Seção TIPO DE REVISÃO */}
                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      TIPO DE REVISÃO
                    </label>
                    {selectedIntervalTypes.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedIntervalTypes([])}
                        className="text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                      >
                        Limpar ({selectedIntervalTypes.length})
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {availableRevisionTypeDays.map(days => {
                      const isSelected = selectedIntervalTypes.includes(days);
                      return (
                        <button
                          key={days}
                          type="button"
                          onClick={() => handleToggleIntervalType(days)}
                          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] tabular-nums whitespace-nowrap shrink-0 transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-400'
                          }`}
                        >
                          {days}d
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Seção DISCIPLINA */}
                <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    DISCIPLINA
                  </label>
                  <select
                    value={selectedDiscFilter}
                    onChange={(e) => setSelectedDiscFilter(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 font-medium text-xs"
                  >
                    <option value="todas">Todas</option>
                    {disciplinas.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                {/* Rodapé do Popover */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClearFilters}
                    className="w-full"
                  >
                    Limpar
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setIsFilterOpen(false)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Aplicar
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Agendar Revisão
          </Button>
        </div>
      </div>

      {/* Listagem Agrupada por Data para Hoje, Atrasadas, Próximas, Ignoradas e Concluídas */}
      <div className="space-y-6">
        {activeTab === 'atrasadas' && categorized.atrasadas.length > 0 && onBatchRescheduleOverdue && (
          <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-xs">
            <div className="text-rose-800 dark:text-rose-200 font-medium">
              Você possui <strong>{categorized.atrasadas.length}</strong>{' '}
              {categorized.atrasadas.length === 1 ? 'revisão atrasada' : 'revisões atrasadas'}. Deseja reagendar todas para hoje?
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={() => onBatchRescheduleOverdue(todayStr)}
              className="bg-rose-600 hover:bg-rose-700 text-white shrink-0"
            >
              Reagendar para Hoje
            </Button>
          </div>
        )}

        {activeTabGroupedByDate.length === 0 ? (
          <Card className="flashcards-daily-review-card bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/25 dark:border-primary/20">
            <CardBody className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs">
              {activeTab === 'hoje' && 'Tudo em dia para hoje! Nenhuma revisão pendente para esta data.'}
              {activeTab === 'atrasadas' && 'Nenhuma revisão atrasada! Seu ciclo está em dia.'}
              {activeTab === 'proximas' && 'Nenhuma revisão futura agendada para os filtros selecionados.'}
              {activeTab === 'ignoradas' && 'Nenhuma revisão ignorada.'}
              {activeTab === 'concluidas' && 'Nenhuma revisão concluída registrada até o momento.'}
            </CardBody>
          </Card>
        ) : (
          activeTabGroupedByDate.map(group => (
            <div key={group.dateStr} className="space-y-3">
              {/* Cabeçalho do Grupo de Data */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                    {group.headerLabel}
                  </span>
                </div>
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                  {group.items.length} {group.items.length === 1 ? 'revisão' : 'revisões'}
                </span>
              </div>

              {/* Lista de Cards Ricos dentro da Data */}
              <div className="space-y-3">
                {group.items.map(rev => renderRevisionCard(rev))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* =========================================================================
          PASSO 1 & 2: CRONÔMETRO DE FOCO CONECTADO À REVISÃO SELECIONADA
          ========================================================================= */}
      <StudyTimerModal
        isOpen={isTimerModalOpen && !!activeTimerReview}
        onClose={() => {
          setIsTimerModalOpen(false);
          setActiveTimerReview(null);
        }}
        initialDurationMinutes={25}
        onStopAndSave={(elapsedSeconds) => {
          if (activeTimerReview) {
            handleStopTimerAndOpenRegister(elapsedSeconds, activeTimerReview);
          }
        }}
      />

      {/* =========================================================================
          PASSO 3 & 4: MODAL "REGISTRO DE ESTUDO" COM DISCIPLINA E TÓPICO TRAVADOS E ANOTAÇÕES LIMPAS
          ========================================================================= */}
      {isStudyRegisterModalOpen && studyRegisterModalData && (
        <div className="fixed inset-0 !mt-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsStudyRegisterModalOpen(false)}
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

              <div className="flex items-center gap-2 shrink-0">
                {activeTimerReview && (
                  <>
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-extrabold border"
                      style={{
                        backgroundColor: `${palette.primary}12`,
                        borderColor: `${palette.primary}35`,
                        color: palette.primary,
                      }}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Tempo Líquido: {regTimeStr || studyRegisterModalData.tempoEstudo}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsStudyRegisterModalOpen(false);
                        setIsTimerModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Voltar ao Timer</span>
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setIsStudyRegisterModalOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Corpo do Formulário */}
            <form onSubmit={handleSaveStudyRegisterModal} className="px-6 py-5 overflow-y-auto space-y-4 flex-1">
              {regError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              {/* Linha 1: Categoria (Travada em Revisão) | Disciplina (Travada) | Tempo de estudo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Categoria</span>
                    <Lock className="w-3 h-3 text-slate-400" />
                  </label>
                  <select
                    value="revisao"
                    disabled
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 cursor-not-allowed opacity-90"
                  >
                    <option value="revisao">Revisão</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Disciplina</span>
                    <Lock className="w-3 h-3 text-slate-400" />
                  </label>
                  <select
                    value={studyRegisterModalData.disciplinaId}
                    disabled={studyRegisterModalData.isDisciplinaLocked}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 cursor-not-allowed opacity-90 truncate"
                  >
                    <option value={studyRegisterModalData.disciplinaId}>
                      {studyRegisterModalData.disciplinaNome}
                    </option>
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
                      value={regTimeStr}
                      onChange={e => setRegTimeStr(handleTimeMask(e.target.value))}
                      onBlur={e => setRegTimeStr(normalizeTimeOnBlur(e.target.value))}
                      placeholder="00:25:00"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Linha 2: Tópico Travado (65%) | Material opcional (35%) */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                <div className="sm:col-span-8">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Tópico</span>
                    <Lock className="w-3 h-3 text-slate-400" />
                  </label>
                  <select
                    value={studyRegisterModalData.topicoId || studyRegisterModalData.topicoNome}
                    disabled={studyRegisterModalData.isTopicoLocked}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 cursor-not-allowed opacity-90 truncate"
                  >
                    <option value={studyRegisterModalData.topicoId || studyRegisterModalData.topicoNome}>
                      {studyRegisterModalData.topicoNome}
                    </option>
                  </select>
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Material (opcional)
                  </label>
                  <input
                    type="text"
                    value={regMaterial}
                    onChange={e => setRegMaterial(e.target.value)}
                    placeholder="Ex: Aula 21, PDF Resumo"
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Card de Automação: Teoria Finalizada (Preenche toda a linha) */}
              <div>
                <label
                  className={`w-full p-4 rounded-2xl border flex flex-col justify-between gap-2.5 cursor-pointer select-none transition-all ${
                    regTopicFinished
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/25 border-emerald-500/50 shadow-xs'
                      : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={regTopicFinished}
                        onChange={e => setRegTopicFinished(e.target.checked)}
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
              </div>

              {/* Grid de 3 Cards de Métricas Detalhadas (Questões | Páginas | Videoaulas) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* 1. Card Questões (Apenas Certas e Erradas + Cálculo Automático) */}
                {(() => {
                  const certasNum = Math.max(0, parseInt(regCorrect, 10) || 0);
                  const erradasNum = Math.max(0, parseInt(regWrong, 10) || 0);
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
                            value={regCorrect}
                            onChange={e => setRegCorrect(e.target.value)}
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
                            value={regWrong}
                            onChange={e => setRegWrong(e.target.value)}
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
                        setRegPages(prev => [
                          ...prev,
                          { id: `p_${Date.now()}_${prev.length}`, inicio: 0, fim: 0 },
                        ])
                      }
                      className="w-6 h-6 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-bold cursor-pointer"
                      title="Adicionar intervalo de páginas"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2 max-h-28 overflow-y-auto pr-0.5">
                    {regPages.map((pg, idx) => (
                      <div key={pg.id || idx} className="grid grid-cols-2 gap-2 items-center">
                        <div>
                          {idx === 0 && (
                            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                              Início
                            </label>
                          )}
                          <input
                            type="number"
                            min="0"
                            value={pg.inicio}
                            onChange={e => {
                              const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10));
                              setRegPages(prev =>
                                prev.map(item => (item.id === pg.id ? { ...item, inicio: val } : item))
                              );
                            }}
                            placeholder="0"
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
                            min="0"
                            value={pg.fim}
                            onChange={e => {
                              const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10));
                              setRegPages(prev =>
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
                        setRegVideos(prev => [
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
                    {regVideos.map((vid, idx) => (
                      <div key={vid.id || idx} className="space-y-1.5">
                        <input
                          type="text"
                          value={vid.titulo}
                          onChange={e =>
                            setRegVideos(prev =>
                              prev.map(v => (v.id === vid.id ? { ...v, titulo: e.target.value } : v))
                            )
                          }
                          placeholder="Nome da videoaula"
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
                              setRegVideos(prev =>
                                prev.map(v => (v.id === vid.id ? { ...v, inicio: masked } : v))
                              );
                            }}
                            onBlur={e => {
                              const normalized = normalizeTimeOnBlur(e.target.value);
                              setRegVideos(prev =>
                                prev.map(v => (v.id === vid.id ? { ...v, inicio: normalized } : v))
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
                              setRegVideos(prev =>
                                prev.map(v => (v.id === vid.id ? { ...v, fim: masked } : v))
                              );
                            }}
                            onBlur={e => {
                              const normalized = normalizeTimeOnBlur(e.target.value);
                              setRegVideos(prev =>
                                prev.map(v => (v.id === vid.id ? { ...v, fim: normalized } : v))
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

              {/* Comentários (opcional) — SEMPRE INICIA LIMPO ("") E COM CONTADOR 0/500 */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Comentários <span className="font-normal text-slate-400">(opcional)</span>
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {regComments.length}/500
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={regComments}
                  onChange={e => setRegComments(e.target.value)}
                  placeholder="Dúvidas, tópicos que merecem revisão posterior, palavras-chave, macetes..."
                  className="w-full p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none resize-none"
                />
              </div>

              {/* Rodapé do Modal */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  {activeTimerReview && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsStudyRegisterModalOpen(false);
                        setIsTimerModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Voltar ao Cronômetro</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2.5 ml-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={() => setIsStudyRegisterModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={isSavingReg}
                  >
                    {isSavingReg ? 'Salvando...' : 'Salvar estudo'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Agendar Nova Revisão com suporte a Prazos Customizados (1d a 415d e + Novo prazo) */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Agendar Nova Revisão"
        maxWidth="md"
        panelClassName="agendar-revisao-themed-modal"
      >
        <form onSubmit={handleSaveAddModal} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Disciplina *</label>
            <select
              value={formDisciplinaId}
              onChange={(e) => {
                setFormDisciplinaId(e.target.value);
                setFormAssuntoId('');
              }}
              className="agendar-revisao-field w-full p-2.5 rounded-xl border border-[var(--primary-color)] bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all focus:outline-none"
            >
              {disciplinas.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {availableAssuntos.length > 0 && (
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tópico do Edital (opcional)</label>
              <select
                value={formAssuntoId}
                onChange={(e) => {
                  const id = e.target.value;
                  setFormAssuntoId(id);
                  const found = availableAssuntos.find(a => a.id === id);
                  if (found) setFormAssuntoName(found.name);
                }}
                className="agendar-revisao-field w-full p-2.5 rounded-xl border border-[var(--primary-color)] bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all focus:outline-none"
              >
                <option value="">Selecionar tópico cadastrado ou digitar abaixo...</option>
                {availableAssuntos.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Assunto / Tópico *</label>
            <input
              type="text"
              value={formAssuntoName}
              onChange={(e) => setFormAssuntoName(e.target.value)}
              placeholder="Ex: Controle de Constitucionalidade"
              className="agendar-revisao-field w-full p-2.5 rounded-xl border border-[var(--primary-color)] bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-all focus:outline-none"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300">Prazo do Ciclo (Intervalo)</label>
                {formSelectedIntervals.length > 1 && (
                  <span className="agendar-revisao-themed-surface px-2.5 py-0.5 rounded-full text-[10px] font-extrabold text-[var(--primary-color)] dark:text-[var(--primary-text-dark)] border border-[var(--primary-color)]">
                    {formSelectedIntervals.length} prazos selecionados
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleSelectAllIntervals}
                  className="agendar-revisao-btn-outline inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-white dark:bg-slate-900 border border-[var(--primary-color)] text-[var(--primary-color)] dark:text-[var(--primary-text-dark)] transition-all cursor-pointer"
                >
                  <Check className="w-3 h-3" />
                  {customIntervals.length > 0 && customIntervals.every(d => formSelectedIntervals.includes(d))
                    ? 'Desmarcar todos'
                    : 'Selecionar todos'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingCustomInterval(!isAddingCustomInterval)}
                  className="agendar-revisao-btn-outline px-2.5 py-1 rounded-xl text-[11px] font-bold bg-white dark:bg-slate-900 border border-[var(--primary-color)] text-[var(--primary-color)] dark:text-[var(--primary-text-dark)] transition-all cursor-pointer"
                >
                  + Novo prazo
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {customIntervals.map(days => {
                const isSelected = formSelectedIntervals.includes(days);
                return (
                  <button
                    key={days}
                    type="button"
                    onClick={() => handleSelectIntervalOption(days)}
                    className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] border transition-all cursor-pointer inline-flex items-center gap-1 ${
                      isSelected
                        ? 'agendar-revisao-btn-selected bg-[var(--primary-color)] text-white border-[var(--primary-color)] shadow-xs'
                        : 'agendar-revisao-btn-outline bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-[var(--primary-color)]'
                    }`}
                  >
                    {isSelected && formSelectedIntervals.length > 1 && (
                      <Check className="w-3 h-3 shrink-0" />
                    )}
                    <span>{days === 1 ? '1d (24h)' : `${days}d`}</span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={handleToggleSelectAllIntervals}
                className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] border transition-all cursor-pointer inline-flex items-center gap-1 ${
                  customIntervals.length > 0 && customIntervals.every(d => formSelectedIntervals.includes(d))
                    ? 'agendar-revisao-btn-selected bg-[var(--primary-color)] text-white border-[var(--primary-color)] shadow-xs'
                    : 'agendar-revisao-btn-outline bg-white dark:bg-slate-900 text-[var(--primary-color)] dark:text-[var(--primary-text-dark)] border-[var(--primary-color)]'
                }`}
              >
                <Check className="w-3 h-3 shrink-0" />
                <span>Todos</span>
              </button>
            </div>

            {formSelectedIntervals.length > 1 && (
              <div className="agendar-revisao-themed-surface p-2.5 rounded-xl border border-[var(--primary-color)] text-[11px] text-slate-700 dark:text-slate-200 flex items-start gap-2">
                <CalendarClock className="w-3.5 h-3.5 text-[var(--primary-color)] dark:text-[var(--primary-text-dark)] shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold text-[var(--primary-color)] dark:text-[var(--primary-text-dark)]">Ciclo múltiplo ativo:</span> serão agendadas{' '}
                  <strong>{formSelectedIntervals.length} revisões</strong> para os prazos{' '}
                  <span className="font-mono font-bold">
                    {formSelectedIntervals.map(d => (d === 1 ? '1d' : `${d}d`)).join(', ')}
                  </span>.
                </div>
              </div>
            )}

            {isAddingCustomInterval && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={newCustomDaysInput}
                  onChange={(e) => setNewCustomDaysInput(e.target.value)}
                  placeholder="Digite o prazo em dias (ex: 45, 415)"
                  className="agendar-revisao-field flex-1 p-2 rounded-xl border border-[var(--primary-color)] bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all focus:outline-none"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  onClick={handleAddCustomIntervalPill}
                  className="agendar-revisao-btn-selected !rounded-xl"
                >
                  Adicionar
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {formSelectedIntervals.length > 1 ? 'Data da 1ª Revisão *' : 'Data Programada *'}
              </label>
              <input
                type="date"
                value={formScheduledFor}
                onChange={(e) => setFormScheduledFor(e.target.value)}
                className="agendar-revisao-field w-full p-2.5 rounded-xl border border-[var(--primary-color)] bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono transition-all focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Observações (opcional)</label>
              <input
                type="text"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Ex: Revisar grifos e súmulas"
                className="agendar-revisao-field w-full p-2.5 rounded-xl border border-[var(--primary-color)] bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-all focus:outline-none"
              />
            </div>
          </div>

          <div className="agendar-revisao-footer flex justify-end gap-2 pt-3 border-t border-slate-200/70 dark:border-slate-700/70">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              className="agendar-revisao-btn-outline !rounded-xl bg-white dark:bg-slate-900"
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmitting}
              className="agendar-revisao-btn-selected !rounded-xl"
            >
              {formSelectedIntervals.length > 1
                ? `Agendar (${formSelectedIntervals.length} Revisões)`
                : 'Agendar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Confirmação de Exclusão de Revisão (Única vs. Futuras Relacionadas) */}
      <Modal
        isOpen={Boolean(deleteTargetReview)}
        onClose={() => {
          if (!isDeletingReview) setDeleteTargetReview(null);
        }}
        title="Excluir Revisão"
        maxWidth="md"
      >
        {deleteTargetReview && (() => {
          const relatedList = getRelatedFutureRevisions(deleteTargetReview);
          const extraFutureCount = Math.max(0, relatedList.length - 1);
          const intervalLabel = deleteTargetReview.intervalDays
            ? `Revisão de ${deleteTargetReview.intervalDays} ${deleteTargetReview.intervalDays === 1 ? 'dia' : 'dias'}`
            : deleteTargetReview.method
            ? `Revisão ${String(deleteTargetReview.method).toUpperCase()}`
            : 'Revisão programada';

          return (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {deleteTargetReview.assuntoName}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                    {intervalLabel}
                  </span>
                </div>
                <div className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {deleteTargetReview.disciplinaName}
                </div>
              </div>

              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Deseja excluir <strong>somente esta revisão</strong> ou também <strong>todas as revisões no futuro</strong> relacionadas a este estudo?
              </p>

              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  disabled={isDeletingReview}
                  onClick={handleConfirmDeleteSingleReview}
                  className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-rose-400 dark:hover:border-rose-500 bg-white dark:bg-slate-900 hover:bg-rose-50/40 dark:hover:bg-rose-950/20 text-left transition-all flex items-start gap-3 cursor-pointer disabled:opacity-60"
                >
                  <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                      Excluir somente esta revisão
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Remove apenas este agendamento ({intervalLabel}), mantendo as demais revisões futuras na fila.
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  disabled={isDeletingReview}
                  onClick={handleConfirmDeleteFutureRelatedReviews}
                  className="w-full p-3.5 rounded-xl border border-rose-200 dark:border-rose-800/80 hover:border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 hover:bg-rose-100/60 dark:hover:bg-rose-950/50 text-left transition-all flex items-start gap-3 cursor-pointer disabled:opacity-60"
                >
                  <div className="p-2 rounded-lg bg-rose-600 text-white shrink-0 mt-0.5">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="font-bold text-rose-700 dark:text-rose-300 text-xs sm:text-sm">
                      Excluir esta e todas as revisões futuras relacionadas
                    </div>
                    <div className="text-[11px] text-rose-600/80 dark:text-rose-300/80 leading-relaxed">
                      {extraFutureCount > 0
                        ? `Remove esta revisão e mais ${extraFutureCount} ${extraFutureCount === 1 ? 'revisão futura relacionada' : 'revisões futuras relacionadas'} deste ciclo.`
                        : 'Remove esta revisão e quaisquer agendamentos futuros vinculados a ela.'}
                    </div>
                  </div>
                </button>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isDeletingReview}
                  onClick={() => setDeleteTargetReview(null)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};
