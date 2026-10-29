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
import { Card, CardHeader, CardBody } from '../../design-system/Card';
import { Button } from '../../design-system/Button';
import { Badge } from '../../design-system/Badge';
import { Modal } from '../../design-system/Modal';
import { PlannerService } from '../../services/plannerService';
import { EmptyContestState } from '../common/EmptyContestState';
import { useTheme } from '../../contexts/ThemeContext';
import { MenuBannerFrame } from '../common/MenuBannerFrame';
import { StudyTimerModal } from '../estudos/StudyTimerModal';
import { handleTimeMask, normalizeTimeOnBlur } from '../estudos/StudyRegisterModal';

// Banners do menu "Revisões Espaçadas" por tema (Supabase)
export const REVISOES_ESPACADAS_BANNER_THEMES: Record<string, string> = {
  verde: 'https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20revisoes/Banner-Revisoes-verde.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSByZXZpc29lcy9CYW5uZXItUmV2aXNvZXMtdmVyZGUucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc5MjYzMzQ5NCwiZXhwIjo0OTQ2MjMzNDk0fQ.JSS_JWrtc3WP0dTm2J5aBw1tFDKBkLkq6EVPT7o__uCLsFov9FtGfoJJise_gh2Wkw-UJvSsPAqUAWh7cwkGQA',
  azul: 'https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20revisoes/Banner-Revisoes-azul.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSByZXZpc29lcy9CYW5uZXItUmV2aXNvZXMtYXp1bC5wbmciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzkyNjMzNTE0LCJleHAiOjQ5NDYyMzM1MTR9.6B4KhoSlSlBNHrM8dY7G6YElFKkn31xDhLkOSsL0-FkIwFb3XEjmQP5pkv5uK1EONxOP4PLVBtlgakVYdqaXig',
  rosa: 'https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20revisoes/Banner-Revisoes-rosa.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSByZXZpc29lcy9CYW5uZXItUmV2aXNvZXMtcm9zYS5wbmciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzkyNjMzNTI3LCJleHAiOjQ5NDYyMzM1Mjd9.wV1e6s_ThXDscunUqIlAmE6TRLnMJ1slnyukWLeWeSJ-IK_eVs__4dFCpVEvS8ZdswK2TT9ZhnM0oLn4bQKWfA',
  roxo: 'https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20revisoes/Banner-Revisoes-roxo.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSByZXZpc29lcy9CYW5uZXItUmV2aXNvZXMtcm94by5wbmciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzkyNjMzNTQ2LCJleHAiOjQ5NDYyMzM1NDZ9.LJSZkR0YJFN0zh8c4l7Kznd8fTO4rvCz0yLz48eSbEKFROx7wabznwfJdidXj7TWBNIG0FQJS8H58HmAhVVXWQ',
  laranja: 'https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20revisoes/Banner-Revisoes-laranja.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSByZXZpc29lcy9CYW5uZXItUmV2aXNvZXMtbGFyYW5qYS5wbmciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzkyNjMzNTYwLCJleHAiOjQ5NDYyMzM1NjB9.WfmhXZXh4OCIWBuNh3-rRIofzSGgjjrIDeXuJG23PkDe5CFhxTvBMKj4MU-YGisZUdmIbnPYvpJ996gRpayupw',
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
  onDeleteRevisao?: (id: string) => Promise<void>;
  onBatchRescheduleOverdue?: (targetDateStr?: string) => Promise<void>;
  onUpdateSettings?: (settings: Partial<RevisionSettings>) => Promise<void>;
  onOpenStudyTimer?: (disciplinaId?: string, assuntoId?: string) => void;
}

type TimelineTab = 'hoje' | 'atrasadas' | 'proximas' | 'ignoradas' | 'concluidas' | 'config';

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

const DEFAULT_PRESET_INTERVALS = [1, 7, 15, 21, 30, 60, 90, 120, 180, 365, 415];

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

  // Menu de 3 pontinhos ativo
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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
  const [customIntervals, setCustomIntervals] = useState<number[]>(() => {
    const merged = Array.from(new Set([...DEFAULT_PRESET_INTERVALS, ...(settings.intervalDays || [])])).sort((a, b) => a - b);
    return merged;
  });
  const [isAddingCustomInterval, setIsAddingCustomInterval] = useState(false);
  const [newCustomDaysInput, setNewCustomDaysInput] = useState('');
  const [formScheduledFor, setFormScheduledFor] = useState(PlannerService.formatLocalDate(new Date()));
  const [formNotes, setFormNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Aba de Configurações SRS
  const [configAutoStudy, setConfigAutoStudy] = useState(settings.autoScheduleOnStudy);
  const [configAutoQuestions, setConfigAutoQuestions] = useState(settings.autoScheduleOnQuestions);
  const [configAdaptive, setConfigAdaptive] = useState(settings.performanceAdaptive);
  const [configIntervalsList, setConfigIntervalsList] = useState<number[]>(
    settings.intervalDays && settings.intervalDays.length > 0 ? settings.intervalDays : [1, 7, 15, 30, 60]
  );
  const [configIntervalsStr, setConfigIntervalsStr] = useState(settings.intervalDays.join(', '));
  const [newConfigIntervalInput, setNewConfigIntervalInput] = useState('');
  const [isSavingConfig, setIsSavingConfig] = useState(false);

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
  };

  const hasActiveFilters = selectedDiscFilter !== 'todas' || filterStartDate !== '' || filterEndDate !== '' || filterPeriodPreset !== 'todos';

  const categorized = useMemo(() => {
    const list = revisoes.filter(r => {
      if (selectedDiscFilter !== 'todas' && r.disciplinaId !== selectedDiscFilter) {
        return false;
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
  }, [revisoes, selectedDiscFilter, filterStartDate, filterEndDate, todayStr]);

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

  const handleDeleteReview = async (rev: Revisao) => {
    setOpenMenuId(null);
    const confirmed = typeof window !== 'undefined' && typeof window.confirm === 'function'
      ? window.confirm('Deseja excluir esta revisão agendada?')
      : true;
    if (!confirmed) return;
    if (onDeleteRevisao) {
      await onDeleteRevisao(rev.id);
    }
    showFeedback('Revisão excluída com sucesso!');
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
      setFormIntervalDays(parsed);
      setFormMethod(parsed === 1 ? '24h' : `${parsed}d`);
      const targetDate = new Date(Date.now() + parsed * 86400000);
      setFormScheduledFor(PlannerService.formatLocalDate(targetDate));
      setNewCustomDaysInput('');
      setIsAddingCustomInterval(false);
    }
  };

  const handleSelectIntervalOption = (days: number) => {
    setFormIntervalDays(days);
    setFormMethod(days === 1 ? '24h' : `${days}d`);
    const targetDate = new Date(Date.now() + days * 86400000);
    setFormScheduledFor(PlannerService.formatLocalDate(targetDate));
  };

  const handleSaveAddModal = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalAssunto = formAssuntoName.trim() || (assuntos.find(a => a.id === formAssuntoId)?.name) || 'Revisão Geral';
    setIsSubmitting(true);
    try {
      const intervalDays = formIntervalDays > 0 ? formIntervalDays : 1;
      const methodLabel = intervalDays === 1 ? '24h' : `${intervalDays}d`;

      await onAddRevisao({
        disciplinaId: formDisciplinaId,
        assuntoId: formAssuntoId || undefined,
        assuntoName: finalAssunto,
        method: methodLabel,
        scheduledFor: formScheduledFor,
        notes: formNotes.trim() || undefined,
        isAutomatic: false,
        stage: 1,
        intervalDays,
      });
      showFeedback('Revisão agendada com sucesso!');
      setIsAddModalOpen(false);
      setFormAssuntoName('');
      setFormNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddConfigInterval = () => {
    const parsed = parseInt(newConfigIntervalInput.trim(), 10);
    if (!isNaN(parsed) && parsed > 0) {
      const next = Array.from(new Set([...configIntervalsList, parsed])).sort((a, b) => a - b);
      setConfigIntervalsList(next);
      setConfigIntervalsStr(next.join(', '));
      setNewConfigIntervalInput('');
    }
  };

  const handleRemoveConfigInterval = (dayToRemove: number) => {
    const next = configIntervalsList.filter(d => d !== dayToRemove);
    setConfigIntervalsList(next);
    setConfigIntervalsStr(next.join(', '));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateSettings) return;
    setIsSavingConfig(true);
    try {
      const parsedFromStr = configIntervalsStr
        .split(',')
        .map(s => parseInt(s.trim(), 10))
        .filter(n => !isNaN(n) && n > 0);
      const finalIntervals = parsedFromStr.length > 0 ? parsedFromStr : (configIntervalsList.length > 0 ? configIntervalsList : [1, 7, 15, 30, 60]);
      setConfigIntervalsList(finalIntervals);
      setConfigIntervalsStr(finalIntervals.join(', '));
      await onUpdateSettings({
        autoScheduleOnStudy: configAutoStudy,
        autoScheduleOnQuestions: configAutoQuestions,
        performanceAdaptive: configAdaptive,
        intervalDays: finalIntervals,
      });
      showFeedback('Configurações atualizadas!');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const renderRevisionCard = (rev: Revisao) => (
    <div
      key={rev.id}
      className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      {/* Lado Esquerdo: Ícone + Textos + Metadados */}
      <div className="flex items-start gap-3.5 flex-1 min-w-0">
        {/* Ícone da Matéria / Tipo */}
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center shrink-0 text-slate-600 dark:text-slate-300">
          <BookOpen className="w-5 h-5" />
        </div>

        <div className="space-y-1 min-w-0 flex-1">
          {/* Linha 1: Tópico em negrito + Badge do Ciclo */}
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
              {rev.assuntoName}
            </h4>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
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
          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
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
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs"
        >
          Revisar agora
        </Button>

        {/* Menu Dropdown de 3 Pontinhos */}
        <div className="relative menu-options-container">
          <button
            type="button"
            onClick={() => setOpenMenuId(openMenuId === rev.id ? null : rev.id)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
        minHeight=""
        className="revisoes-banner border border-purple-800/40 rounded-3xl p-6 text-white shadow-md bg-slate-950"
        overlayClassName="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-950/40 to-slate-950/20 pointer-events-none z-[1]"
        contentClassName="space-y-5"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
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
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          <div className="p-3.5 bg-slate-900/80 border border-slate-700/60 rounded-2xl">
            <span className="text-sky-400 text-[11px] font-medium">Hoje</span>
            <div className="text-2xl font-black font-mono text-sky-400">{srsStats.totalHoje}</div>
          </div>
          <div className="p-3.5 bg-slate-900/80 border border-rose-900/50 rounded-2xl">
            <span className="text-rose-400 text-[11px] font-medium">Atrasadas</span>
            <div className="text-2xl font-black font-mono text-rose-400">{srsStats.totalAtrasadas}</div>
          </div>
          <div className="p-3.5 bg-slate-900/80 border border-slate-700/60 rounded-2xl">
            <span className="text-purple-300 text-[11px] font-medium">Próximas</span>
            <div className="text-2xl font-black font-mono text-purple-300">{srsStats.totalProximas}</div>
          </div>
          <div className="p-3.5 bg-slate-900/80 border border-emerald-900/50 rounded-2xl">
            <span className="text-emerald-400 text-[11px] font-medium">Concluídas</span>
            <div className="text-2xl font-black font-mono text-emerald-400">{srsStats.totalConcluidas}</div>
          </div>
          <div className="p-3.5 bg-slate-900/80 border border-slate-700/60 rounded-2xl col-span-2 sm:col-span-1">
            <span className="text-amber-300 text-[11px] font-medium">Retenção</span>
            <div className="text-2xl font-black font-mono text-amber-400">{srsStats.retentionRate}%</div>
          </div>
        </div>
      </MenuBannerFrame>

      {/* Abas de Navegação + Botão Filtros Popover + Agendar Revisão */}
      <div className="revisoes-nav-tabs relative flex flex-wrap items-center justify-between gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
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
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'config'
                ? 'bg-slate-900 text-white shadow-xs revisao-tab-active-dark'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Configurações
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
                <div className="space-y-2.5">
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

                  {/* Pílulas rápidas */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {FILTER_PERIOD_PILLS.map(pill => {
                      const active = filterPeriodPreset === pill.id;
                      return (
                        <button
                          key={pill.id}
                          type="button"
                          onClick={() => handleSelectPeriodPill(pill.id, pill.days)}
                          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer border ${
                            active
                              ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-400'
                          }`}
                        >
                          {pill.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Seção DISCIPLINA */}
                <div className="space-y-1.5">
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
            variant="outline"
            size="sm"
            onClick={() => setActiveTab('config')}
            className="bg-white dark:bg-white/10 text-slate-700 dark:text-white border-slate-200 dark:border-white/20 text-xs"
          >
            Configurar
          </Button>
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

      {/* Aba de Configurações SRS */}
      {activeTab === 'config' && (
        <Card>
          <CardHeader
            title="Configuração de Intervalos SRS"
            subtitle="Personalize os prazos de repetição espaçada (de 1d a 415d ou adicione novos prazos)"
          />
          <CardBody className="p-6">
            <form onSubmit={handleSaveSettings} className="space-y-5 max-w-xl text-xs">
              <div className="space-y-2.5">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={configAutoStudy}
                    onChange={(e) => setConfigAutoStudy(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    Gerar ciclo de revisões automaticamente ao concluir sessão de estudo
                  </span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={configAutoQuestions}
                    onChange={(e) => setConfigAutoQuestions(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    Ajustar intervalos automaticamente com base na bateria de questões
                  </span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={configAdaptive}
                    onChange={(e) => setConfigAdaptive(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    Modo adaptativo por retenção (Fácil amplia prazo, Difícil antecipa)
                  </span>
                </label>
              </div>

              <div className="space-y-2">
                <label className="block font-bold text-slate-800 dark:text-slate-200">
                  Prazos Ativos do Ciclo (em dias)
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {configIntervalsList.map(days => (
                    <span
                      key={days}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold"
                    >
                      {days}d
                      <button
                        type="button"
                        onClick={() => handleRemoveConfigInterval(days)}
                        className="text-purple-400 hover:text-rose-500 cursor-pointer"
                        title="Remover prazo"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <div className="inline-flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={newConfigIntervalInput}
                      onChange={(e) => setNewConfigIntervalInput(e.target.value)}
                      placeholder="+ Novo prazo (dias)"
                      className="w-36 px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddConfigInterval}
                    >
                      + Novo prazo
                    </Button>
                  </div>
                </div>
                <div className="pt-2">
                  <label className="block text-[11px] text-slate-500 mb-1">
                    Ou edite os dias separados por vírgula (ex: 1, 7, 15, 30, 60, 120, 415):
                  </label>
                  <input
                    type="text"
                    value={configIntervalsStr}
                    onChange={(e) => setConfigIntervalsStr(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
              </div>

              <Button type="submit" variant="primary" isLoading={isSavingConfig}>
                Salvar Configurações
              </Button>
            </form>
          </CardBody>
        </Card>
      )}

      {/* Listagem Agrupada por Data para Hoje, Atrasadas, Próximas, Ignoradas e Concluídas */}
      {activeTab !== 'config' && (
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
            <Card>
              <CardBody className="p-12 text-center text-slate-400 text-xs">
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
      )}

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
      >
        <form onSubmit={handleSaveAddModal} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold mb-1">Disciplina *</label>
            <select
              value={formDisciplinaId}
              onChange={(e) => {
                setFormDisciplinaId(e.target.value);
                setFormAssuntoId('');
              }}
              className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            >
              {disciplinas.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {availableAssuntos.length > 0 && (
            <div>
              <label className="block font-bold mb-1">Tópico do Edital (opcional)</label>
              <select
                value={formAssuntoId}
                onChange={(e) => {
                  const id = e.target.value;
                  setFormAssuntoId(id);
                  const found = availableAssuntos.find(a => a.id === id);
                  if (found) setFormAssuntoName(found.name);
                }}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <option value="">Selecionar tópico cadastrado ou digitar abaixo...</option>
                {availableAssuntos.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block font-bold mb-1">Assunto / Tópico *</label>
            <input
              type="text"
              value={formAssuntoName}
              onChange={(e) => setFormAssuntoName(e.target.value)}
              placeholder="Ex: Controle de Constitucionalidade"
              className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block font-bold">Prazo do Ciclo (Intervalo)</label>
              <button
                type="button"
                onClick={() => setIsAddingCustomInterval(!isAddingCustomInterval)}
                className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
              >
                + Novo prazo
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {customIntervals.map(days => {
                const isSelected = formIntervalDays === days;
                return (
                  <button
                    key={days}
                    type="button"
                    onClick={() => handleSelectIntervalOption(days)}
                    className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-400'
                    }`}
                  >
                    {days === 1 ? '1d (24h)' : `${days}d`}
                  </button>
                );
              })}
            </div>

            {isAddingCustomInterval && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={newCustomDaysInput}
                  onChange={(e) => setNewCustomDaysInput(e.target.value)}
                  placeholder="Digite o prazo em dias (ex: 45, 415)"
                  className="flex-1 p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
                <Button type="button" size="sm" variant="primary" onClick={handleAddCustomIntervalPill}>
                  Adicionar
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1">Data Programada *</label>
              <input
                type="date"
                value={formScheduledFor}
                onChange={(e) => setFormScheduledFor(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                required
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Observações (opcional)</label>
              <input
                type="text"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Ex: Revisar grifos e súmulas"
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Agendar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
