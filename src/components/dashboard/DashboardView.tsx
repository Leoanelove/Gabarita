import type { OpenStudyTimer, StudyRegisterOptions } from '../../contexts/StudyTimerContext';
import { CycleService } from '../../services/cycleService';
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Flame, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  BookOpen, 
  Play, 
  Check, 
  Award, 
  ChevronRight, 
  Target, 
  FileText, 
  AlertCircle, 
  Plus, 
  Pencil,
  Sparkles,
  MoreVertical,
  Search,
  X,
  Settings,
  ClipboardCheck,
  BarChart3,
  Zap,
  RotateCcw,
  Edit3,
  EyeOff,
  PlusCircle,
  History,
  HelpCircle,
  Eye,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { 
  Concurso, 
  Disciplina, 
  Assunto, 
  Revisao, 
  Meta, 
  UserProfile, 
  NavigationTab, 
  SessaoEstudo, 
  StudyPlan,
  StudyCycle,
  CycleStudyTarget,
  PlanStudyTarget,
  StudyMethod,
  Prova,
  RevisionRating 
} from '../../types';
import { Card, CardHeader, CardBody } from '../../design-system/Card';
import { Button } from '../../design-system/Button';
import { Badge } from '../../design-system/Badge';
import { Modal } from '../../design-system/Modal';
import { useTheme } from '../../contexts/ThemeContext';
import { PlannerService } from '../../services/plannerService';
import { StudyCharts } from './StudyCharts';
import { StreakCalendarModal } from './StreakCalendarModal';
import { EmptyContestState } from '../common/EmptyContestState';
import { resolveSubjectIcon } from '../common/SubjectIcon';
import { ConcursoBanner } from '../common/ConcursoBanner';
import { StudyTimerModal } from '../estudos/StudyTimerModal';
import { StudyRegisterModal } from '../estudos/StudyRegisterModal';

interface DashboardViewProps {
  user: UserProfile;
  concursos: Concurso[];
  disciplinas: Disciplina[];
  assuntos: Assunto[];
  sessoes: SessaoEstudo[];
  revisoes: Revisao[];
  metas: Meta[];
  plan?: StudyPlan | null;
  cycle?: StudyCycle | null;
  studyMethod: StudyMethod;
  provas?: Prova[];
  activeConcursoId?: string;
  isLoading?: boolean;
  errorMessage?: string | null;
  onNavigateTab: (tab: NavigationTab) => void;
  onNavigateToProvas?: () => void;
  onOpenStudyTimer: OpenStudyTimer;
  onOpenStudyRegister?: (options?: StudyRegisterOptions) => void;
  onCompleteRevisao: (
    id: string, 
    rating: RevisionRating,
    accuracyRate?: number, 
    questionsAttempted?: number, 
    questionsCorrect?: number, 
    notes?: string,
    sessionDetails?: any
  ) => void | Promise<void>;
  onUpdateRevisao?: (id: string, partial: Partial<Revisao>) => Promise<void>;
  onDeleteRevisao?: (id: string) => Promise<void>;
  onRetry?: () => void;
}

export const normalizeThemeSkin = (themeContext: any): 'verde' | 'azul' | 'roxo' | 'rosa' | 'laranja' => {
  // Cascata prioritária conforme especificação
  const activeKey =
    (typeof themeContext?.colorSkin === 'string' ? themeContext.colorSkin : '') ||
    (typeof themeContext?.palette?.id === 'string' ? themeContext.palette.id : '') ||
    (typeof themeContext?.palette?.name === 'string' ? themeContext.palette.name : '') ||
    (typeof themeContext?.activeTheme === 'string' ? themeContext.activeTheme : '') ||
    (typeof themeContext?.theme === 'string' ? themeContext.theme : '') ||
    (typeof themeContext?.colorSkin === 'object' && themeContext?.colorSkin?.id ? String(themeContext.colorSkin.id) : '') ||
    (typeof themeContext?.colorSkin === 'object' && themeContext?.colorSkin?.name ? String(themeContext.colorSkin.name) : '') ||
    'verde';

  const candidates: any[] = [
    activeKey,
    themeContext?.colorSkin,
    themeContext?.palette?.id,
    themeContext?.palette?.name,
    themeContext?.activeTheme,
  ];

  if (typeof document !== 'undefined') {
    try {
      const dataSkin = document.documentElement.getAttribute('data-skin') || document.body.getAttribute('data-skin');
      if (dataSkin) candidates.push(dataSkin);
      const classList = `${document.documentElement.className} ${document.body.className}`;
      candidates.push(classList);
    } catch {}
    try {
      const savedSkin = localStorage.getItem('gabarita_color_skin');
      if (savedSkin) candidates.push(savedSkin);
    } catch {}
  }

  for (const item of candidates) {
    if (!item) continue;
    const str = (typeof item === 'string' ? item : String(item?.id || item?.name || '')).trim().toLowerCase();
    if (!str) continue;

    // Roxo: 'roxo', 'purple', 'violet'
    if (str.includes('roxo') || str.includes('purple') || str.includes('violet')) {
      return 'roxo';
    }
    // Laranja: 'laranja', 'orange', 'amber', 'dbz'
    if (str.includes('laranja') || str.includes('orange') || str.includes('amber') || str.includes('dbz')) {
      return 'laranja';
    }
    // Rosa: 'rosa', 'pink', 'rose'
    if (str.includes('rosa') || str.includes('pink') || str.includes('rose')) {
      return 'rosa';
    }
    // Azul: 'azul', 'blue', 'sky', 'cyan'
    if (str.includes('azul') || str.includes('blue') || str.includes('sky') || str.includes('cyan')) {
      return 'azul';
    }
    // Verde: 'verde', 'green', 'emerald'
    if (str.includes('verde') || str.includes('green') || str.includes('emerald')) {
      return 'verde';
    }
  }

  return 'verde';
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  concursos,
  disciplinas,
  assuntos,
  sessoes,
  revisoes,
  metas,
  plan,
  cycle,
  studyMethod,
  provas = [],
  activeConcursoId: propActiveConcursoId,
  isLoading = false,
  errorMessage = null,
  onNavigateTab,
  onNavigateToProvas,
  onOpenStudyTimer,
  onOpenStudyRegister,
  onCompleteRevisao,
  onUpdateRevisao,
  onDeleteRevisao,
  onRetry,
}) => {
  const themeContext = useTheme();
  const { palette } = themeContext;

  // Normalização robusta tolerante a variações para identificação inequívoca do tema ativo
  const normalizedSkin = normalizeThemeSkin(themeContext);

  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Estados e controle do fluxo "Revisar Agora" (Cronômetro de Foco + Registro de Estudo contextualizado)
  const [activeTimerReview, setActiveTimerReview] = useState<Revisao | null>(null);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [isStudyRegisterModalOpen, setIsStudyRegisterModalOpen] = useState(false);
  const [registerElapsedSeconds, setRegisterElapsedSeconds] = useState(0);
  const [registerModo, setRegisterModo] = useState<'cronometro' | 'manual'>('cronometro');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [studyOptionsMenuId, setStudyOptionsMenuId] = useState<string | null>(null);
  const [historyModalDisciplina, setHistoryModalDisciplina] = useState<{
    id: string;
    name: string;
    assuntoId?: string;
    durationMinutes?: number;
  } | null>(null);

  // Fechar menus de 3 pontinhos (revisões e fila de estudos) ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (openMenuId && !target.closest('.menu-options-container')) {
        setOpenMenuId(null);
      }
      if (studyOptionsMenuId && !target.closest('.study-options-menu-container')) {
        setStudyOptionsMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId, studyOptionsMenuId]);

  const triggerManualStudyRegister = (item: {
    disciplinaId: string;
    assuntoId?: string;
    durationMinutes?: number;
    cycleStudyTarget?: CycleStudyTarget;
    planStudyTarget?: PlanStudyTarget;
  }) => {
    setStudyOptionsMenuId(null);
    if (onOpenStudyRegister) {
      onOpenStudyRegister({
        modo: 'manual',
        disciplinaId: item.disciplinaId,
        assuntoId: item.assuntoId,
        durationMinutes: item.durationMinutes,
        cycleStudyTarget: item.cycleStudyTarget,
        planStudyTarget: item.planStudyTarget,
      });
    } else {
      onOpenStudyTimer(
        item.disciplinaId,
        item.assuntoId,
        item.durationMinutes,
        'manual',
        true,
        item.cycleStudyTarget,
        item.planStudyTarget,
      );
    }
  };

  // PASSO 1: Iniciar revisão -> abre o Cronômetro de Foco contextualizado
  const handleStartRevision = (rev: Revisao) => {
    setOpenMenuId(null);
    setActiveTimerReview(rev);
    setIsTimerModalOpen(true);
  };

  // PASSO 2: Ao parar e salvar no Cronômetro -> abre o modal de Registro de Estudo
  const handleStopTimerAndOpenRegister = (elapsedSeconds: number, rev: Revisao) => {
    setIsTimerModalOpen(false);
    setRegisterElapsedSeconds(elapsedSeconds);
    setRegisterModo('cronometro');
    setIsStudyRegisterModalOpen(true);
  };

  // Ação de Registrar Manualmente (via menu 3 pontinhos)
  const handleManualRegister = (rev: Revisao) => {
    setOpenMenuId(null);
    setActiveTimerReview(rev);
    setRegisterElapsedSeconds(25 * 60);
    setRegisterModo('manual');
    setIsStudyRegisterModalOpen(true);
  };

  // Concluir rapidamente sem cronometrar
  const handleQuickComplete = (rev: Revisao) => {
    setOpenMenuId(null);
    onCompleteRevisao(rev.id, 'facil');
  };

  // Ignorar revisão
  const handleIgnoreReview = async (rev: Revisao) => {
    setOpenMenuId(null);
    if (onUpdateRevisao) {
      await onUpdateRevisao(rev.id, { status: 'ignorada' });
    }
  };

  // Voltar do modal de registro para o cronômetro
  const handleBackToTimer = () => {
    setIsStudyRegisterModalOpen(false);
    setIsTimerModalOpen(true);
  };

  // Salvar registro de estudo e concluir a revisão
  const handleSaveRevisionSession = async (savedSession: any) => {
    if (!activeTimerReview) return;

    const correctCount = savedSession.questionsCorrect || 0;
    const attemptedCount = savedSession.questionsAttempted || 0;
    const accRate = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : undefined;

    const derivedRating: RevisionRating =
      accRate === undefined
        ? 'facil'
        : accRate >= 75
        ? 'facil'
        : accRate >= 50
        ? 'medio'
        : 'dificil';

    await onCompleteRevisao(
      activeTimerReview.id,
      derivedRating,
      accRate,
      attemptedCount > 0 ? attemptedCount : undefined,
      attemptedCount > 0 ? correctCount : undefined,
      savedSession.notes || '',
      {
        durationMinutes: savedSession.durationMinutes,
        durationSeconds: savedSession.durationSeconds,
        material: savedSession.material,
        teoriaFinalizada: savedSession.teoriaFinalizada,
        programarRevisoes: false,
        contabilizarPlanejamento: true,
        pageIntervals: savedSession.pageIntervals,
        videoaulas: savedSession.videoaulas,
        completedAt: savedSession.completedAt || new Date().toISOString(),
      }
    );

    setIsStudyRegisterModalOpen(false);
    setActiveTimerReview(null);
  };

  // Identificação do concurso ativo para persistência de metas
  const activeConcursoId = useMemo(() => {
    if (propActiveConcursoId && concursos.some(c => c.id === propActiveConcursoId)) {
      return propActiveConcursoId;
    }
    return concursos.find(c => c.active || c.isAtivo)?.id || 
      concursos.find(c => c.id === user.targetConcursoId)?.id || 
      concursos[0]?.id || 'default';
  }, [propActiveConcursoId, concursos, user.targetConcursoId]);

  // Metas semanais persistidas no localStorage por concurso (padrão: 12h e 500 questões)
  const [weeklyGoals, setWeeklyGoals] = useState<{ hours: number; questions: number }>(() => {
    try {
      const activeId = concursos.find(c => c.active || c.isAtivo)?.id || 
        concursos.find(c => c.id === user.targetConcursoId)?.id || 
        concursos[0]?.id || 'default';
      const saved = localStorage.getItem(`gabarita_metas_semanais_${activeId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          hours: Number(parsed.hours) || 12,
          questions: Number(parsed.questions) || 500,
        };
      }
    } catch {
      // fallback padrão
    }
    return { hours: 12, questions: 500 };
  });

  const [modalHours, setModalHours] = useState<string>(() => String(weeklyGoals.hours));
  const [modalQuestions, setModalQuestions] = useState<string>(() => String(weeklyGoals.questions));

  // Sincroniza metas quando o concurso ativo mudar
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`gabarita_metas_semanais_${activeConcursoId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        const next = {
          hours: Number(parsed.hours) || 12,
          questions: Number(parsed.questions) || 500,
        };
        setWeeklyGoals(next);
        setModalHours(String(next.hours));
        setModalQuestions(String(next.questions));
        return;
      }
    } catch {
      // ignore
    }
    setWeeklyGoals({ hours: 12, questions: 500 });
    setModalHours('12');
    setModalQuestions('500');
  }, [activeConcursoId]);

  // Tópicos selecionados manualmente pelo usuário por disciplina (persistidos por concurso)
  const [customSelectedTopics, setCustomSelectedTopics] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(`gabarita_topico_selecionado_${activeConcursoId}`);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {};
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`gabarita_topico_selecionado_${activeConcursoId}`);
      if (saved) {
        setCustomSelectedTopics(JSON.parse(saved));
        return;
      }
    } catch {
      // ignore
    }
    setCustomSelectedTopics({});
  }, [activeConcursoId]);

  const [topicSelectionModal, setTopicSelectionModal] = useState<{
    isOpen: boolean;
    disciplinaId: string;
    disciplinaName: string;
  }>({
    isOpen: false,
    disciplinaId: '',
    disciplinaName: '',
  });
  const [topicSearchTerm, setTopicSearchTerm] = useState('');

  const handleOpenTopicSelector = (disciplinaId: string, disciplinaName: string) => {
    setTopicSearchTerm('');
    setTopicSelectionModal({
      isOpen: true,
      disciplinaId,
      disciplinaName,
    });
  };

  const handleCloseTopicSelector = () => {
    setTopicSelectionModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleSelectCustomTopic = (disciplinaId: string, assuntoId: string) => {
    setCustomSelectedTopics(prev => {
      const next = { ...prev, [disciplinaId]: assuntoId };
      try {
        localStorage.setItem(`gabarita_topico_selecionado_${activeConcursoId}`, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const activeConcurso = useMemo(() => {
    if (propActiveConcursoId) {
      const matched = concursos.find(c => c.id === propActiveConcursoId);
      if (matched) return matched;
    }
    return concursos.find(c => c.active || c.isAtivo) || 
      concursos.find(c => c.id === user.targetConcursoId) || 
      concursos[0] || null;
  }, [propActiveConcursoId, concursos, user.targetConcursoId]);

  const activeDisciplinasList = useMemo(() => {
    if (!activeConcurso) return [];
    return disciplinas.filter(d => d.concursoId === activeConcurso.id);
  }, [disciplinas, activeConcurso]);

  const activeDiscIds = useMemo(() => {
    return new Set(activeDisciplinasList.map(d => d.id));
  }, [activeDisciplinasList]);

  const relevantAssuntos = useMemo(() => {
    if (activeDiscIds.size === 0) return [];
    return assuntos.filter(a => activeDiscIds.has(a.disciplinaId));
  }, [assuntos, activeDiscIds]);

  const activeAssuntoIds = useMemo(() => {
    return new Set(relevantAssuntos.map(a => a.id));
  }, [relevantAssuntos]);

  const activeSessoes = useMemo(() => {
    if (!activeConcurso || activeDiscIds.size === 0) return [];
    return sessoes.filter(s => {
      if (!s || !s.disciplinaId || !activeDiscIds.has(s.disciplinaId)) return false;
      if (s.concursoId && s.concursoId !== activeConcurso.id) return false;
      if (s.assuntoId && !activeAssuntoIds.has(s.assuntoId)) return false;
      return true;
    });
  }, [sessoes, activeConcurso, activeDiscIds, activeAssuntoIds]);

  // Cálculo dinâmico das horas e questões realizadas na semana atual (iniciando na segunda-feira)
  const { minutosSemana, questoesSemana } = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    const mondayStr = PlannerService.formatLocalDate(monday);

    let mins = 0;
    let questions = 0;

    activeSessoes.forEach((s) => {
      const sDate = s.completedAt ? s.completedAt.split('T')[0] : (s.createdAt ? s.createdAt.split('T')[0] : '');
      if (sDate >= mondayStr) {
        mins += s.durationMinutes || 0;
        questions += s.questionsAttempted || 0;
      }
    });

    return { minutosSemana: mins, questoesSemana: questions };
  }, [activeSessoes]);

  // Histórico das últimas 5 semanas (incluindo a semana atual) para o gráfico "Suas Últimas Semanas"
  const lastFiveWeeksHistory = useMemo(() => {
    const monthsPt = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const currentMonday = new Date(now);
    currentMonday.setHours(0, 0, 0, 0);
    currentMonday.setDate(now.getDate() + diffToMonday);

    const weeks: {
      key: string;
      label: string;
      percent: number;
      isMet: boolean;
      isCurrent: boolean;
    }[] = [];

    const targetHoursMins = Math.max(1, weeklyGoals.hours * 60);
    const targetQuestions = Math.max(1, weeklyGoals.questions);

    for (let i = 4; i >= 0; i--) {
      const start = new Date(currentMonday);
      start.setDate(currentMonday.getDate() - i * 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);

      const startStr = PlannerService.formatLocalDate(start);
      const endStr = PlannerService.formatLocalDate(end);

      let wMins = 0;
      let wQuestions = 0;

      activeSessoes.forEach((s) => {
        const sDate = s.completedAt
          ? s.completedAt.split('T')[0]
          : s.createdAt
          ? s.createdAt.split('T')[0]
          : '';
        if (sDate >= startStr && sDate <= endStr) {
          wMins += s.durationMinutes || 0;
          wQuestions += s.questionsAttempted || 0;
        }
      });

      const pctH = Math.min(100, (wMins / targetHoursMins) * 100);
      const pctQ = Math.min(100, (wQuestions / targetQuestions) * 100);
      const combinedPct = Math.min(100, Math.round((pctH + pctQ) / 2));

      const startDay = start.getDate();
      const endDay = end.getDate();
      const startMonth = monthsPt[start.getMonth()];
      const endMonth = monthsPt[end.getMonth()];

      const label =
        start.getMonth() === end.getMonth()
          ? `${startDay}-${endDay} ${endMonth}`
          : `${startDay} ${startMonth}-${endDay} ${endMonth}`;

      weeks.push({
        key: startStr,
        label,
        percent: combinedPct,
        isMet: combinedPct >= 100,
        isCurrent: i === 0,
      });
    }

    return weeks;
  }, [activeSessoes, weeklyGoals.hours, weeklyGoals.questions]);

  const [todayStr, setTodayStr] = useState(() => PlannerService.formatLocalDate(new Date()));
  useEffect(() => {
    const updateToday = () => setTodayStr(PlannerService.formatLocalDate(new Date()));
    const timer = window.setInterval(updateToday, 30_000);
    window.addEventListener('focus', updateToday);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', updateToday);
    };
  }, []);

  const pendingRevisoes = useMemo(() => {
    if (activeDiscIds.size === 0) return [];
    return revisoes.filter(r => {
      if (r.status === "concluida") return false;
      if (!r.disciplinaId || !activeDiscIds.has(r.disciplinaId)) return false;
      if (r.assuntoId && !activeAssuntoIds.has(r.assuntoId)) return false;
      const scheduledDate = r.scheduledFor.includes("T") ? r.scheduledFor.split("T")[0] : r.scheduledFor;
      return scheduledDate <= todayStr;
    });
  }, [revisoes, todayStr, activeDiscIds, activeAssuntoIds]);

  const todaysExams = useMemo(() => {
    const list: Array<{ id: string; organ: string; role: string; banca?: string; notes?: string }> = [];
    const seen = new Set<string>();

    const checkIsToday = (dateStr?: string) => {
      if (!dateStr) return false;
      const cleanDate = String(dateStr).trim().split('T')[0];
      return cleanDate === todayStr;
    };

    if (provas && Array.isArray(provas)) {
      provas.forEach(p => {
        if (p.examDate && checkIsToday(p.examDate)) {
          const key = `${p.organ}_${p.role}`.toLowerCase().trim();
          if (!seen.has(key)) {
            seen.add(key);
            list.push({
              id: p.id,
              organ: p.organ,
              role: p.role,
              banca: p.banca,
              notes: p.notes,
            });
          }
        }
      });
    }

    if (activeConcurso) {
      const cDate = activeConcurso.examDate || (activeConcurso as any).dataProva || (activeConcurso as any).data_prova;
      if (cDate && checkIsToday(cDate)) {
        const key = `${activeConcurso.organ}_${activeConcurso.role}`.toLowerCase().trim();
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            id: activeConcurso.id,
            organ: activeConcurso.organ,
            role: activeConcurso.role,
            banca: activeConcurso.banca,
            notes: activeConcurso.notes,
          });
        }
      }
    }

    return list;
  }, [provas, activeConcurso, todayStr]);

  // Lista unificada e ordenada de provas agendadas (Concursos com data + Provas cadastradas)
  const scheduledExams = useMemo(() => {
    const parseExamDateLocal = (raw?: string): Date | null => {
      if (!raw) return null;
      const str = String(raw).trim();
      if (!str) return null;
      const datePart = str.includes('T') ? str.split('T')[0] : str;
      const parts = datePart.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          const d = new Date(year, month, day);
          if (!isNaN(d.getTime())) return d;
        }
      }
      const fallback = new Date(str);
      if (isNaN(fallback.getTime())) return null;
      fallback.setHours(0, 0, 0, 0);
      return fallback;
    };

    const toDateKey = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    type ScheduledExamItem = {
      id: string;
      name: string;
      formattedDate: string;
      diffDays: number;
      isActiveConcurso: boolean;
      dateKey: string;
      concursoId?: string;
    };

    const items: ScheduledExamItem[] = [];
    const seenKeys = new Set<string>();
    const seenConcursoDateKeys = new Set<string>();

    const activeCId = activeConcurso?.id ? String(activeConcurso.id) : '';

    // 1. Concursos não arquivados que possuem data de prova
    concursos.forEach((c) => {
      if (c.status === 'arquivado' || c.isArquivado) return;
      const rawDate = c.examDate || (c as any).dataProva || (c as any).data_prova || (c as any).exam_date;
      const dateObj = parseExamDateLocal(rawDate);
      if (!dateObj) return;

      const dateKey = toDateKey(dateObj);
      const diffDays = Math.round((dateObj.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));
      const formattedDate = dateObj.toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const displayName = (c.title || c.titulo || c.organ || c.orgao || c.nome || c.role || 'Concurso Agendado').trim();
      const normalizedKey = `${(c.organ || displayName).toLowerCase().trim()}_${(c.role || '').toLowerCase().trim()}_${dateKey}`;

      seenKeys.add(normalizedKey);
      seenConcursoDateKeys.add(`${String(c.id)}_${dateKey}`);

      items.push({
        id: `concurso_${c.id}`,
        name: displayName,
        formattedDate,
        diffDays,
        isActiveConcurso: Boolean(activeCId && String(c.id) === activeCId),
        dateKey,
        concursoId: c.id,
      });
    });

    // 2. Provas registradas em ProvasTab com data válida (sem duplicar com o concurso pai)
    (provas || []).forEach((p) => {
      const dateObj = parseExamDateLocal(p.examDate);
      if (!dateObj) return;

      const dateKey = toDateKey(dateObj);
      if (p.concursoId && seenConcursoDateKeys.has(`${String(p.concursoId)}_${dateKey}`)) {
        return;
      }

      const normalizedKey = `${(p.organ || '').toLowerCase().trim()}_${(p.role || '').toLowerCase().trim()}_${dateKey}`;
      if (seenKeys.has(normalizedKey)) return;
      seenKeys.add(normalizedKey);

      const linkedConcurso = p.concursoId
        ? concursos.find((c) => String(c.id) === String(p.concursoId))
        : undefined;
      if (linkedConcurso && (linkedConcurso.status === 'arquivado' || linkedConcurso.isArquivado)) {
        return;
      }

      const diffDays = Math.round((dateObj.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));
      const formattedDate = dateObj.toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const displayName = (linkedConcurso?.title || p.organ || p.role || 'Prova Agendada').trim();

      items.push({
        id: `prova_${p.id}`,
        name: displayName,
        formattedDate,
        diffDays,
        isActiveConcurso: Boolean(activeCId && p.concursoId && String(p.concursoId) === activeCId),
        dateKey,
        concursoId: p.concursoId,
      });
    });

    items.sort((a, b) => {
      if (a.isActiveConcurso !== b.isActiveConcurso) {
        return a.isActiveConcurso ? -1 : 1;
      }
      const aFuture = a.diffDays >= 0;
      const bFuture = b.diffDays >= 0;
      if (aFuture !== bFuture) {
        return aFuture ? -1 : 1;
      }
      if (aFuture && bFuture) {
        return a.diffDays - b.diffDays;
      }
      return b.diffDays - a.diffDays;
    });

    return items;
  }, [concursos, provas, activeConcurso]);

  const [selectedExamIdx, setSelectedExamIdx] = useState(0);

  useEffect(() => {
    setSelectedExamIdx(0);
  }, [activeConcurso?.id]);

  const handleNavigateToProvas = () => {
    if (onNavigateToProvas) {
      onNavigateToProvas();
    } else {
      onNavigateTab('concursos');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-rose-900 dark:text-rose-100">
          Não foi possível carregar os dados do painel
        </h3>
        <p className="text-sm text-rose-700 dark:text-rose-300">{errorMessage}</p>
        {onRetry && (
          <Button variant="primary" onClick={onRetry} size="md">
            Tentar Novamente
          </Button>
        )}
      </div>
    );
  }

  if (!activeConcurso) {
    return (
      <EmptyContestState
        title="Você ainda não possui um concurso ativo"
        description="Cadastre seu concurso foco e importe o conteúdo programático do edital (com auxílio da Inteligência Artificial ou manualmente) para desbloquear seu Painel Geral de Estudos, métricas em tempo real, Ciclo Inteligente e Revisões Espaçadas."
        actionText="Cadastrar Concurso Foco"
        onAction={() => onNavigateTab('concursos')}
      />
    );
  }

  const totalStudyMinutes = activeSessoes.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const totalStudyHours = (totalStudyMinutes / 60).toFixed(1);

  const totalQuestionsAttempted = activeSessoes.reduce((acc, s) => acc + (s.questionsAttempted || 0), 0);
  const totalQuestionsCorrect = activeSessoes.reduce((acc, s) => acc + (s.questionsCorrect || 0), 0);
  const globalAccuracyRate = totalQuestionsAttempted > 0 
    ? Math.round((totalQuestionsCorrect / totalQuestionsAttempted) * 100) 
    : 0;

  const completedTopicsCount = relevantAssuntos.filter(a => a.completed || a.status === 'dominado').length;
  const totalTopicsCount = relevantAssuntos.length;
  const editalProgressPercent = totalTopicsCount > 0 
    ? Math.round((completedTopicsCount / totalTopicsCount) * 100) 
    : 0;

  const isCycleMethod = studyMethod === 'ciclo';
  const effectiveCycle: StudyCycle | null = (() => {
    if (!isCycleMethod || !activeConcurso) return null;
    if (cycle && cycle.concursoId === activeConcurso.id) {
      return cycle;
    }
    try {
      const saved = localStorage.getItem(`gabarita_study_cycle_${activeConcurso.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.concursoId === activeConcurso.id) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return null;
  })();

  const effectivePlan: StudyPlan | null = (() => {
    if (isCycleMethod || !activeConcurso) return null;
    if (plan && plan.concursoId === activeConcurso.id) {
      return plan;
    }
    try {
      const saved = localStorage.getItem(`gabarita_study_plan_${activeConcurso.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.concursoId === activeConcurso.id) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return null;
  })();

  const cycleBlocks = Array.isArray(effectiveCycle?.blocks) ? effectiveCycle.blocks : [];
  const plannedSessions = Array.isArray(effectivePlan?.sessions) ? effectivePlan.sessions : [];
  const hasActivePlanning = cycleBlocks.length > 0 || plannedSessions.length > 0;
  const todaysSessions = plannedSessions.filter(session =>
    session.date === todayStr && (!effectivePlan?.startDate || session.date >= effectivePlan.startDate)
  );
  const pendingToday = todaysSessions
    .filter(session => !PlannerService.isSessionStudied(session))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const pendingCycleBlocks = cycleBlocks
    .slice(Math.max(0, effectiveCycle?.currentBlockIndex ?? 0))
    .filter(block => !CycleService.isBlockComplete(block));

  const getCycleStudyTarget = (blockId: string) => isCycleMethod && effectiveCycle ? {
    concursoId: effectiveCycle.concursoId,
    cycleId: effectiveCycle.id,
    blockId,
  } : undefined;

  const getPlanStudyTarget = (sessionId: string) => !isCycleMethod && effectivePlan ? {
    concursoId: effectivePlan.concursoId,
    planId: effectivePlan.id,
    sessionId,
  } : undefined;

  const studyQueue = isCycleMethod
    ? pendingCycleBlocks.slice(0, 4).map(block => {
        const customAssunto = relevantAssuntos.find(assunto =>
          assunto.id === customSelectedTopics[block.disciplinaId] && assunto.disciplinaId === block.disciplinaId
        );
        const defaultAssunto = relevantAssuntos.find(a => a.disciplinaId === block.disciplinaId && !a.completed) ||
          relevantAssuntos.find(a => a.disciplinaId === block.disciplinaId);
        return {
          id: block.id,
          disciplinaId: block.disciplinaId,
          disciplinaName: block.disciplinaName,
          assuntoId: customAssunto?.id || block.assuntoSugeridoId || defaultAssunto?.id,
          assuntoName: customAssunto?.name || block.assuntoSugeridoName || defaultAssunto?.name || 'Estudo dirigido do edital',
          durationMinutes: block.durationMinutes > 0 ? Math.max(1, Math.ceil(block.durationMinutes - (block.elapsedMinutes || 0))) : 45,
        };
      })
    : pendingToday.slice(0, 4).map(session => ({
        id: session.id,
        disciplinaId: session.disciplinaId,
        disciplinaName: session.disciplinaName,
        assuntoId: PlannerService.resolveSessionTopicId(session, relevantAssuntos, disciplinas),
        assuntoName: session.assuntoName || relevantAssuntos.find(a => a.id === session.assuntoId)?.name || 'Estudo dirigido do edital',
        durationMinutes: PlannerService.remainingMinutes(session),
      }));

  const [primaryStudyItem, ...upcomingStudyItems] = studyQueue;

  const planningProgressPercent = (() => {
    if (!isCycleMethod) {
      return todaysSessions.length > 0
        ? Math.round(100 * (todaysSessions.length - pendingToday.length) / todaysSessions.length)
        : 0;
    }

    const totalMinutes = cycleBlocks.reduce((sum, block) => sum + (block.durationMinutes || 0), 0);
    const pendingIds = new Set(pendingCycleBlocks.map(block => block.id));
    const studiedMinutes = cycleBlocks.reduce((sum, block) => {
      const duration = block.durationMinutes || 0;
      return sum + (pendingIds.has(block.id) ? Math.min(duration, block.elapsedMinutes || 0) : duration);
    }, 0);
    return totalMinutes > 0 ? Math.min(100, Math.round((studiedMinutes / totalMinutes) * 100)) : 0;
  })();

  const formattedTodayLabel = (() => {
    try {
      const now = PlannerService.parseLocalDate(todayStr);
      const weekday = now.toLocaleDateString('pt-BR', { weekday: 'long' });
      const day = now.getDate();
      const month = now.toLocaleDateString('pt-BR', { month: 'long' });
      const capWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
      return `${capWeekday}, ${day} de ${month}`;
    } catch {
      return 'Hoje';
    }
  })();

  const formatHorasMinutos = (totalMinutes: number): string => {
    const h = Math.floor(totalMinutes / 60);
    const m = Math.floor(totalMinutes % 60);
    return `${h}h${m.toString().padStart(2, '0')}min`;
  };

  const percentHoras = weeklyGoals.hours > 0 
    ? Math.min(100, Math.round((minutosSemana / (weeklyGoals.hours * 60)) * 100)) 
    : 0;
  const percentQuestoes = weeklyGoals.questions > 0 
    ? Math.min(100, Math.round((questoesSemana / weeklyGoals.questions) * 100)) 
    : 0;

  const handleOpenEditModal = () => {
    setModalHours(String(weeklyGoals.hours));
    setModalQuestions(String(weeklyGoals.questions));
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setModalHours(String(weeklyGoals.hours));
    setModalQuestions(String(weeklyGoals.questions));
    setIsEditModalOpen(false);
  };

  const handleSaveMetas = (e: React.FormEvent) => {
    e.preventDefault();
    const numHours = Math.max(1, Number(modalHours) || 12);
    const numQuestions = Math.max(1, Number(modalQuestions) || 500);
    const newGoals = { hours: numHours, questions: numQuestions };
    setWeeklyGoals(newGoals);
    try {
      localStorage.setItem(`gabarita_metas_semanais_${activeConcursoId}`, JSON.stringify(newGoals));
    } catch (err) {
      console.warn('Erro ao salvar metas semanais no localStorage:', err);
    }
    setIsEditModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {activeConcurso ? (
        <ConcursoBanner
          concurso={activeConcurso}
          progressPercent={editalProgressPercent}
          completedTopics={completedTopicsCount}
          totalTopics={totalTopicsCount}
          actions={
            <>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  if (onOpenStudyRegister) {
                    onOpenStudyRegister({ modo: 'manual', contabilizarPlanejamento: false });
                  } else {
                    onOpenStudyTimer(undefined, undefined, undefined, 'manual', false);
                  }
                }}
                leftIcon={<Play className="w-4 h-4 fill-current" />}
                className="shadow-md"
              >
                Adicionar Estudo
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => onNavigateTab('concursos')}
                className="btn-banner-secundario bg-black !bg-black text-white !text-white border border-white/30 !border-white/30 hover:bg-neutral-900 hover:!bg-neutral-900"
              >
                Mudar Concurso
              </Button>
            </>
          }
        />
      ) : (
        <div className="p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3 bg-white/50 dark:bg-slate-900/40">
          <Target className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Nenhum Concurso Definido como Alvo
          </h3>
          <Button
            variant="primary"
            size="md"
            onClick={() => onNavigateTab('concursos')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Cadastrar Concurso Foco
          </Button>
        </div>
      )}

      {/* =========================================================================
          AVISO ESPECIAL: "BOA PROVA" NO PAINEL GERAL NA DATA DA PROVA
          ========================================================================= */}
      {todaysExams.length > 0 && (
        <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-500 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-6 sm:p-7 shadow-2xl shadow-emerald-500/20 animate-fade-in">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-lg border border-white/30 text-amber-300">
                <Award className="w-8 h-8 sm:w-9 sm:h-9 animate-bounce" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400/30 border border-amber-300/40 text-amber-200 text-xs font-black tracking-wider uppercase">
                  <Sparkles className="w-3.5 h-3.5" /> Hoje é o Grande Dia!
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-md">
                  Boa Prova! Gabarite com Confiança! 🎯
                </h2>
                <p className="text-white/95 text-xs sm:text-sm max-w-2xl leading-relaxed">
                  {todaysExams.map(ex => `${ex.organ} (${ex.role})`).join(' • ')} — Chegou o momento de mostrar todo o seu empenho e preparação. Mantenha o foco, respire fundo e confie em você. Excelente prova!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Button
                variant="secondary"
                size="md"
                onClick={() => onNavigateTab('concursos')}
                className="font-bold text-xs sm:text-sm bg-white text-emerald-900 hover:bg-emerald-50 border-white shadow-xl cursor-pointer"
              >
                Ver Detalhes da Prova
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Resolução segura da cor do tema para as bordas */}
      {(() => {
        // Mapeia a cor hex da borda conforme o tema ativo normalizado
        const themeBorderColor = (() => {
          switch (normalizedSkin) {
            case 'roxo':
              return '#8B5CF6'; // Roxo vibrante
            case 'laranja':
              return '#FF6B00'; // Laranja / Amber vibrante
            case 'rosa':
              return '#EC4899'; // Rosa Gabarita
            case 'azul':
              return '#3B82F6'; // Azul vibrante
            case 'verde':
            default:
              return '#10B981'; // Verde Esmeralda
          }
        })();

        const themeIconBg = `${themeBorderColor}1A`; // ~10% de opacidade

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* CARD 1: HORAS ESTUDADAS */}
            <Card 
              hoverEffect 
              className="card-metric-hours card-metric-theme border-l-4 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs"
              style={{ borderLeftColor: themeBorderColor, borderLeftWidth: '4px' }}
            >
              <CardBody className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Horas Estudadas</p>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 font-mono">{totalStudyHours}h</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{sessoes.length} sessões</p>
                </div>
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors"
                  style={{
                    backgroundColor: themeIconBg,
                    color: themeBorderColor,
                  }}
                >
                  <Clock className="w-6 h-6 stroke-[2]" />
                </div>
              </CardBody>
            </Card>

            {/* CARD 2: QUESTÕES & ACERTOS */}
            <Card 
              hoverEffect 
              className="card-metric-theme border-l-4 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs" 
              style={{ borderLeftColor: themeBorderColor, borderLeftWidth: '4px' }}
            >
              <CardBody className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Questões & Acertos</p>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 font-mono">{globalAccuracyRate}%</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{totalQuestionsCorrect}/{totalQuestionsAttempted} acertos</p>
                </div>
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors"
                  style={{
                    backgroundColor: themeIconBg,
                    color: themeBorderColor,
                  }}
                >
                  <CheckCircle2 className="w-6 h-6 stroke-[2]" />
                </div>
              </CardBody>
            </Card>

            {/* CARD 3: CONSTÂNCIA */}
            <Card 
              hoverEffect 
              role="button"
              tabIndex={0}
              onClick={() => setIsStreakModalOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsStreakModalOpen(true);
                }
              }}
              className="card-metric-theme border-l-4 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs"
              style={{ borderLeftColor: themeBorderColor, borderLeftWidth: '4px' }}
            >
              <CardBody className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Constância</p>
                    <span 
                      className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                      style={{
                        backgroundColor: themeIconBg,
                        color: themeBorderColor,
                      }}
                    >
                      Ver histórico
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 font-mono">{user.streakDays} Dias Seguidos</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Clique Para Abrir</p>
                </div>
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors"
                  style={{
                    backgroundColor: themeIconBg,
                    color: themeBorderColor,
                  }}
                >
                  <Flame className="w-6 h-6 stroke-[2]" />
                </div>
              </CardBody>
            </Card>

            {/* CARD 4: REVISÕES PENDENTES (Mantém fixo o acento violeta característico de revisões) */}
            <Card
              hoverEffect
              role="button"
              tabIndex={0}
              onClick={() => onNavigateTab('revisoes')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onNavigateTab('revisoes');
                }
              }}
              className="card-metric-revisoes border-l-4 border-l-purple-500 dark:border-l-purple-400 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs"
              style={{ borderLeftColor: '#A855F7', borderLeftWidth: '4px' }}
            >
              <CardBody className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Revisões Pendentes</p>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 font-mono">{pendingRevisoes.length}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Para hoje</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                  <Award className="w-6 h-6 stroke-[2]" />
                </div>
              </CardBody>
            </Card>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Quadro 1 (Superior Esquerdo): Tópico Atual & Próximos Estudos (ou Empty State quando não houver plano) */}
        {primaryStudyItem ? (() => {
          const { icon: PrimaryIcon, color: primaryIconColor } = resolveSubjectIcon(primaryStudyItem.disciplinaName);
          const ringRadius = 15;
          const ringCircumference = 2 * Math.PI * ringRadius;
          const ringStrokeDashoffset = ringCircumference - (planningProgressPercent / 100) * ringCircumference;

          return (
            <Card className="h-full min-h-[440px] sm:min-h-[480px] rounded-2xl flex flex-col overflow-visible border border-slate-200/90 dark:border-slate-800 shadow-sm">
              <CardBody className="p-6 sm:p-7 space-y-6 flex-1 flex flex-col justify-between">
                {/* Cabeçalho: PLANEJAMENTO DO DIA | Data | Progresso do Ciclo */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" style={{ color: palette.primary }} />
                      <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {isCycleMethod ? 'Tópico Atual' : 'Cronograma de hoje'}
                      </span>
                    </div>
                    <span className="text-slate-300 dark:text-slate-700 hidden xs:inline">|</span>
                    <span
                      className="text-xs sm:text-sm font-bold"
                      style={{ color: palette.primary }}
                    >
                      {formattedTodayLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                      <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                        <circle
                          cx="18"
                          cy="18"
                          r={ringRadius}
                          fill="none"
                          className="stroke-slate-200 dark:stroke-slate-800"
                          strokeWidth="3.2"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r={ringRadius}
                          fill="none"
                          stroke={palette.primary}
                          strokeWidth="3.2"
                          strokeDasharray={ringCircumference}
                          strokeDashoffset={ringStrokeDashoffset}
                          strokeLinecap="round"
                          className="transition-all duration-500"
                        />
                      </svg>
                    </div>
                    <div className="leading-tight">
                      <div className="text-sm sm:text-base font-black font-mono text-slate-900 dark:text-white">
                        {planningProgressPercent}%
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {isCycleMethod ? 'do ciclo concluído' : 'do dia concluído'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Principal Destacado: PRÓXIMO ESTUDO */}
                <div
                  className="relative rounded-2xl p-5 sm:p-6 text-white shadow-md overflow-visible transition-all"
                  style={{
                    background: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.secondary || palette.primary} 100%)`,
                  }}
                >
                  <div className="relative z-10 flex flex-col gap-4">
                    {/* Parte Superior: Ícone + Matéria e Tópico ocupando toda a largura disponível */}
                    <div className="flex items-start gap-3.5 min-w-0 w-full">
                      {/* Ícone da Disciplina em Box Arredondado */}
                      <div
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-white/30"
                        style={{
                          backgroundColor: '#ffffff',
                          color: primaryIconColor,
                        }}
                      >
                        <PrimaryIcon className="w-6 h-6 stroke-[2]" />
                      </div>

                      <div className="min-w-0 flex-1 space-y-1.5">
                        <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-slate-900/75 text-white shadow-2xs">
                          Próximo
                        </span>

                        <h4
                          className="proximo-estudo-title text-base sm:text-lg font-extrabold leading-snug text-white !text-white tracking-tight whitespace-normal break-words"
                          style={{ color: '#ffffff' }}
                          title={primaryStudyItem.disciplinaName}
                        >
                          {primaryStudyItem.disciplinaName}
                        </h4>

                        {isCycleMethod ? (
                          <div
                            onClick={() =>
                              handleOpenTopicSelector(
                                primaryStudyItem.disciplinaId,
                                primaryStudyItem.disciplinaName
                              )
                            }
                            className="group inline-flex items-start gap-1.5 max-w-full cursor-pointer text-white/95 hover:text-white"
                            title="Alterar tópico da matéria a ser estudada"
                          >
                            <span className="text-xs sm:text-sm font-medium leading-snug whitespace-normal break-words underline decoration-dashed decoration-white/60 underline-offset-4">
                              {primaryStudyItem.assuntoName}
                            </span>
                            <Pencil className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-80 group-hover:opacity-100 transition-opacity" />
                          </div>
                        ) : (
                          <span className="text-xs sm:text-sm font-medium leading-snug break-words text-white/95">
                            {primaryStudyItem.assuntoName}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Linha Inferior: Duração à esquerda e Ações (Iniciar Estudo + Menu) na mesma linha à direita */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-black/20 text-white backdrop-blur-xs border border-white/15 shrink-0">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{primaryStudyItem.durationMinutes}min</span>
                      </span>

                      <div className="flex items-center gap-2.5 shrink-0 ml-auto">
                        <button
                          type="button"
                          onClick={() =>
                            onOpenStudyTimer(
                              primaryStudyItem.disciplinaId,
                              primaryStudyItem.assuntoId,
                              primaryStudyItem.durationMinutes,
                              'cronometro',
                              true,
                              getCycleStudyTarget(primaryStudyItem.id),
                              getPlanStudyTarget(primaryStudyItem.id),
                            )
                          }
                          className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          <span>Iniciar Estudo</span>
                        </button>

                        <div className="relative study-options-menu-container">
                          <button
                            type="button"
                            onClick={() => {
                              const menuKey = `primary_${primaryStudyItem.id}`;
                              setStudyOptionsMenuId(prev => (prev === menuKey ? null : menuKey));
                            }}
                            className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 border border-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
                            title="Opções para esta disciplina"
                            aria-label="Opções do estudo"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {studyOptionsMenuId === `primary_${primaryStudyItem.id}` && (
                            <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-40 py-1.5 text-xs animate-in fade-in zoom-in-95 duration-150">
                              <button
                                type="button"
                                onClick={() =>
                                  triggerManualStudyRegister({
                                    disciplinaId: primaryStudyItem.disciplinaId,
                                    assuntoId: primaryStudyItem.assuntoId,
                                    durationMinutes: primaryStudyItem.durationMinutes,
                                    cycleStudyTarget: getCycleStudyTarget(primaryStudyItem.id),
                                    planStudyTarget: getPlanStudyTarget(primaryStudyItem.id),
                                  })
                                }
                                className="w-full px-3.5 py-2.5 text-left flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold transition-colors cursor-pointer"
                              >
                                <PlusCircle className="w-4 h-4 text-slate-400 shrink-0" />
                                <span>Registrar manualmente</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setStudyOptionsMenuId(null);
                                  setHistoryModalDisciplina({
                                    id: primaryStudyItem.disciplinaId,
                                    name: primaryStudyItem.disciplinaName,
                                    assuntoId: primaryStudyItem.assuntoId,
                                    durationMinutes: primaryStudyItem.durationMinutes,
                                  });
                                }}
                                className="w-full px-3.5 py-2.5 text-left flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold transition-colors cursor-pointer"
                              >
                                <History className="w-4 h-4 text-slate-400 shrink-0" />
                                <span>Ver últimos estudos</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seção: PRÓXIMOS ESTUDOS */}
                <div className="space-y-3.5 pt-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {upcomingStudyItems.length > 0 && (isCycleMethod ? 'Próximos Tópicos' : 'Próximos blocos de hoje')}
                    </span>

                    <button
                      type="button"
                      onClick={() => onNavigateTab('plano')}
                      className="px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                    >
                      <span>Ir para planejamento completo</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {upcomingStudyItems.map((item) => {
                      const { icon: ItemIcon, color: itemColor } = resolveSubjectIcon(item.disciplinaName);
                      return (
                        <div
                          key={item.id}
                          className="py-4 first:pt-2.5 last:pb-1 flex items-center justify-between gap-3 sm:gap-4 group"
                        >
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <div
                              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor: `${itemColor}18`,
                                color: itemColor,
                              }}
                            >
                              <ItemIcon className="w-5 h-5 stroke-[2]" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <h5 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                                {item.disciplinaName}
                              </h5>
                              {isCycleMethod ? (
                                <div
                                  onClick={() =>
                                    handleOpenTopicSelector(
                                      item.disciplinaId,
                                      item.disciplinaName
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 max-w-full cursor-pointer text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 mt-0.5"
                                  title="Alterar tópico da matéria"
                                >
                                  <span className="text-xs sm:text-sm truncate border-b border-dashed border-slate-300 dark:border-slate-700 pb-0.5">
                                    {item.assuntoName}
                                  </span>
                                  <Pencil
                                    className="w-3.5 h-3.5 shrink-0"
                                    style={{ color: palette.primary }}
                                  />
                                </div>
                              ) : (
                                <p className="mt-0.5 truncate text-xs sm:text-sm text-slate-500 dark:text-slate-400" title={item.assuntoName}>
                                  {item.assuntoName}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                            <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{item.durationMinutes}min</span>
                            </span>

                            <div className="relative study-options-menu-container">
                              <button
                                type="button"
                                onClick={() => {
                                  const menuKey = `upcoming_${item.id}`;
                                  setStudyOptionsMenuId(prev => (prev === menuKey ? null : menuKey));
                                }}
                                className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
                                title={`Opções para ${item.disciplinaName}`}
                                aria-label={`Opções para ${item.disciplinaName}`}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {studyOptionsMenuId === `upcoming_${item.id}` && (
                                <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-40 py-1.5 text-xs animate-in fade-in zoom-in-95 duration-150">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      triggerManualStudyRegister({
                                        disciplinaId: item.disciplinaId,
                                        assuntoId: item.assuntoId,
                                        durationMinutes: item.durationMinutes,
                                        cycleStudyTarget: getCycleStudyTarget(item.id),
                                        planStudyTarget: getPlanStudyTarget(item.id),
                                      })
                                    }
                                    className="w-full px-3.5 py-2.5 text-left flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold transition-colors cursor-pointer"
                                  >
                                    <PlusCircle className="w-4 h-4 text-slate-400 shrink-0" />
                                    <span>Registrar manualmente</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setStudyOptionsMenuId(null);
                                      setHistoryModalDisciplina({
                                        id: item.disciplinaId,
                                        name: item.disciplinaName,
                                        assuntoId: item.assuntoId,
                                        durationMinutes: item.durationMinutes,
                                      });
                                    }}
                                    className="w-full px-3.5 py-2.5 text-left flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold transition-colors cursor-pointer"
                                  >
                                    <History className="w-4 h-4 text-slate-400 shrink-0" />
                                    <span>Ver últimos estudos</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })() : (
          <Card className="h-full min-h-[440px] sm:min-h-[480px] rounded-2xl flex flex-col overflow-hidden border border-slate-200/90 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
            <CardBody className="p-6 sm:p-7 flex-1 flex flex-col">
              {/* 1. Título do Card (Topo Esquerdo) */}
              <div className="mb-5">
                <span className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 select-none">
                  PLANEJAMENTO
                </span>
              </div>

              {/* Container relativo com Skeleton Decorativo de fundo + Conteúdo Centralizado */}
              <div className="relative flex-1 flex flex-col justify-between">
                {/* 2. Elementos Visuais de Fundo (Skeleton Decorativo) */}
                <div className="space-y-6 pointer-events-none select-none" aria-hidden="true">
                  {/* Bloco retangular cinza-claro suave simulando banner em branco */}
                  <div className="rounded-2xl bg-slate-100/90 dark:bg-slate-800/60 p-5 sm:p-6 space-y-5">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white dark:bg-slate-700/65 shrink-0" />
                      <div className="space-y-2.5 flex-1 min-w-0">
                        <div className="w-20 h-4 rounded-md bg-white dark:bg-slate-700/65" />
                        <div className="w-full max-w-[340px] h-6 rounded-lg bg-white dark:bg-slate-700/65" />
                        <div className="w-28 h-5 rounded-full bg-white dark:bg-slate-700/65" />
                      </div>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-white dark:bg-slate-700/65" />
                  </div>

                  {/* Duas linhas de placeholder sutis abaixo */}
                  <div className="space-y-4 pt-1">
                    <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100 dark:border-slate-800/60">
                      <div className="w-10 h-10 rounded-xl bg-slate-100/80 dark:bg-slate-800/50 shrink-0" />
                      <div className="w-56 sm:w-72 h-4 rounded-md bg-slate-100/80 dark:bg-slate-800/50" />
                    </div>
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-100/50 dark:bg-slate-800/35 shrink-0" />
                      <div className="w-48 sm:w-64 h-4 rounded-md bg-slate-100/50 dark:bg-slate-800/35" />
                    </div>
                  </div>
                </div>

                {/* Conteúdo Centralizado em Overlay */}
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4">
                  {/* 3. Ícone Central */}
                  <div
                    className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center mb-3.5 shadow-2xs transition-colors"
                    style={{
                      backgroundColor: `${palette.primary}20`,
                      color: palette.primary,
                    }}
                  >
                    <Calendar className="w-6 h-6 stroke-[2.2]" />
                  </div>

                  {/* 4. Título Principal Centralizado */}
                  <h4 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {hasActivePlanning
                      ? isCycleMethod ? 'Volta do ciclo concluída' : 'Nenhum bloco pendente hoje'
                      : isCycleMethod ? 'Nenhum ciclo de estudos criado' : 'Nenhum cronograma criado'}
                  </h4>

                  {/* 5. Subtítulo Centralizado */}
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mt-1.5 leading-relaxed">
                    {hasActivePlanning
                      ? isCycleMethod ? 'Abra o planejamento para acompanhar o ciclo.' : 'Confira os outros dias no cronograma completo.'
                      : 'Configure seu plano para ver os próximos estudos aqui.'}
                  </p>

                  {/* 6. Botão de Ação (CTA) Centralizado Abaixo */}
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        if (!hasActivePlanning) sessionStorage.setItem('gabarita_open_method_modal', 'true');
                      } catch {}
                      onNavigateTab('plano');
                    }}
                    className="mt-6 px-6 py-2.5 rounded-full text-white font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 shadow-md hover:opacity-95 active:scale-95 transition-all cursor-pointer"
                    style={{
                      backgroundColor: palette.primary,
                      boxShadow: `0 6px 18px -4px ${palette.glowColor || `${palette.primary}55`}`,
                    }}
                  >
                    <span>{hasActivePlanning ? 'Ver planejamento completo' : '+ Criar Plano de Estudos'}</span>
                  </button>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Quadro 2 (Superior Direito): Metas de Estudo Semanal */}
        <div className="h-full min-h-[440px] sm:min-h-[480px] flex flex-col bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden">
          {/* Cabeçalho: Metas de Estudo Semanal */}
          <div className="dashboard-themed-header relative overflow-hidden px-6 py-5 flex items-center justify-between bg-gradient-to-r from-primary/15 via-primary/5 to-transparent border-b border-primary/25 dark:border-primary/20">
            <div className="flex items-center gap-3 relative z-10">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: `${palette.primary}15`,
                  color: palette.primary,
                }}
              >
                <Target className="w-5 h-5 stroke-[2.25]" />
              </div>
              <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                Metas de Estudo Semanal
              </h3>
            </div>

            <button
              type="button"
              onClick={handleOpenEditModal}
              className="relative z-10 w-9 h-9 rounded-xl bg-white/80 hover:bg-white dark:bg-slate-800/90 dark:hover:bg-slate-700 border border-primary/20 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
              title="Configurar Metas de Estudo Semanal"
              aria-label="Configurar Metas de Estudo Semanal"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* Corpo do Painel */}
          <div className="p-6 sm:p-7 space-y-7 flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Item 1: HORAS DE ESTUDO */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${palette.primary}14`,
                        color: palette.primary,
                      }}
                    >
                      <BookOpen className="w-5 h-5 stroke-[2]" />
                    </div>

                    <div className="min-w-0">
                      <span className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Horas de Estudo
                      </span>
                      <div className="mt-0.5 text-sm sm:text-base text-slate-500 dark:text-slate-400 truncate">
                        <span
                          className="text-lg sm:text-xl font-extrabold"
                          style={{ color: palette.primary }}
                        >
                          {formatHorasMinutos(minutosSemana)}
                        </span>{' '}
                        <span className="font-medium">
                          / {formatHorasMinutos(weeklyGoals.hours * 60)} planejadas
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className="block text-lg sm:text-xl font-extrabold leading-none"
                      style={{ color: palette.primary }}
                    >
                      {percentHoras}%
                    </span>
                    <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                      da meta
                    </span>
                  </div>
                </div>

                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percentHoras}%`,
                      backgroundColor: palette.primary,
                    }}
                  />
                </div>
              </div>

              {/* Item 2: QUESTÕES RESOLVIDAS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${palette.primary}14`,
                        color: palette.primary,
                      }}
                    >
                      <ClipboardCheck className="w-5 h-5 stroke-[2]" />
                    </div>

                    <div className="min-w-0">
                      <span className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Questões Resolvidas
                      </span>
                      <div className="mt-0.5 text-sm sm:text-base text-slate-500 dark:text-slate-400 truncate">
                        <span 
                          className="text-lg sm:text-xl font-extrabold"
                          style={{ color: palette.primary }}
                        >
                          {questoesSemana}
                        </span>{' '}
                        <span className="font-medium">
                          / {weeklyGoals.questions} esperadas
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span 
                      className="block text-lg sm:text-xl font-extrabold leading-none"
                      style={{ color: palette.primary }}
                    >
                      {percentQuestoes}%
                    </span>
                    <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                      da meta
                    </span>
                  </div>
                </div>

                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percentQuestoes}%`,
                      backgroundColor: palette.primary,
                    }}
                  />
                </div>
              </div>

              {/* Nota Informativa da Meta */}
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Meta definida por você{' '}
                {hasActivePlanning ? (
                  <span 
                    className="font-semibold"
                    style={{ color: palette.primary }}
                  >
                    (sincronizada com seu planejamento semanal)
                  </span>
                ) : (
                  <span 
                    className="font-semibold"
                    style={{ color: palette.primary }}
                  >
                    (sem planejamento para o cálculo automático)
                  </span>
                )}
              </p>
            </div>

            {/* Seção: SUAS ÚLTIMAS SEMANAS */}
            <div className="pt-2 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <BarChart3
                    className="w-4 h-4 shrink-0"
                    style={{ color: palette.primary }}
                  />
                  <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Histórico Semanal
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs font-medium text-slate-600 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
                    <span>Batida</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-slate-300 dark:bg-slate-600 inline-block" />
                    <span>Não batida</span>
                  </span>
                </div>
              </div>

              {/* Gráfico das 5 Semanas */}
              <div className="relative pt-2">
                <div className="border-t border-slate-100 dark:border-slate-800/80 mb-3" />
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5 items-stretch">
                  {lastFiveWeeksHistory.map((week) => {
                    const barHeightPx = Math.max(8, Math.round((week.percent / 100) * 48));
                    const barColor = week.isMet
                      ? '#10b981'
                      : week.isCurrent
                      ? palette.primary
                      : undefined;

                    return (
                      <div
                        key={week.key}
                        className={`flex flex-col items-center justify-end rounded-xl py-3 px-1 transition-all min-w-0 ${
                          week.isCurrent
                            ? 'bg-slate-50/90 dark:bg-slate-800/50 shadow-2xs'
                            : ''
                        }`}
                      >
                        <div className="h-20 flex flex-col items-center justify-end w-full mb-2">
                          <span
                            className="text-xs font-bold mb-1.5 leading-none"
                            style={
                              week.isCurrent
                                ? { color: palette.primary }
                                : undefined
                            }
                          >
                            <span
                              className={
                                week.isCurrent
                                  ? ''
                                  : 'text-slate-500 dark:text-slate-400'
                              }
                            >
                              {week.percent}%
                            </span>
                          </span>

                          <div
                            className={`w-8 sm:w-9 rounded-t-md rounded-b-xs transition-all duration-500 shrink-0 ${
                              !barColor
                                ? 'bg-slate-200 dark:bg-slate-700'
                                : ''
                            }`}
                            style={{
                              height: `${barHeightPx}px`,
                              backgroundColor: barColor,
                            }}
                          />
                        </div>

                        <span className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 text-center leading-tight whitespace-nowrap tracking-tight">
                          {week.label}
                        </span>

                        {week.isCurrent ? (
                          <span
                            className="text-[11px] sm:text-xs font-extrabold mt-0.5 leading-tight whitespace-nowrap"
                            style={{ color: palette.primary }}
                          >
                            Atual
                          </span>
                        ) : (
                          <span className="text-[11px] sm:text-xs font-medium text-transparent select-none mt-0.5 leading-tight whitespace-nowrap">
                            Atual
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Faixa Horizontal: Provas Agendadas */}
      {(() => {
        const totalExams = scheduledExams.length;
        const safeExamIdx = totalExams > 0 ? Math.min(selectedExamIdx, totalExams - 1) : 0;
        const currentExam = totalExams > 0 ? scheduledExams[safeExamIdx] : null;

        return (
          <Card className="rounded-2xl overflow-hidden">
            <CardHeader
              title="Provas Agendadas"
              className="dashboard-themed-header relative overflow-hidden px-6 py-5 items-center bg-gradient-to-r from-primary/15 via-primary/5 to-transparent !border-b !border-primary/25 dark:!border-primary/20"
            />
            <CardBody className="p-5 sm:p-6">
              {currentExam ? (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
                  {/* Esquerda: Informações da Prova + Seletor Vertical */}
                  <div className="flex items-center justify-between md:justify-start gap-4 flex-1 min-w-0">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 leading-snug break-words">
                        {currentExam.name}
                      </h3>
                      <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                        <span>{currentExam.formattedDate}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tabular-nums px-2.5 py-1 rounded-lg bg-slate-100/90 dark:bg-slate-800/80">
                        {safeExamIdx + 1} / {totalExams}
                      </span>
                      <div className="flex flex-col rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/60">
                        <button
                          type="button"
                          onClick={() => setSelectedExamIdx((prev) => (prev - 1 + totalExams) % totalExams)}
                          disabled={totalExams <= 1}
                          aria-label="Prova anterior"
                          title="Prova anterior"
                          className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <div className="h-px bg-slate-200 dark:bg-slate-700/80" />
                        <button
                          type="button"
                          onClick={() => setSelectedExamIdx((prev) => (prev + 1) % totalExams)}
                          disabled={totalExams <= 1}
                          aria-label="Próxima prova"
                          title="Próxima prova"
                          className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Centro: Bloco de Contagem Regressiva */}
                  <div
                    className="relative rounded-2xl px-8 py-4 min-w-[200px] sm:min-w-[230px] text-center flex flex-col items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${palette.primary}14`,
                      boxShadow: `inset 0 0 0 1px ${palette.primary}30`,
                    }}
                  >
                    <button
                      type="button"
                      onClick={handleNavigateToProvas}
                      aria-label="Ajustar datas de provas"
                      title="Ajustar datas de provas"
                      className="absolute top-2.5 right-2.5 p-1.5 rounded-lg text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>

                    {currentExam.diffDays > 0 ? (
                      <>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Faltam
                        </span>
                        <span
                          className="text-3xl sm:text-4xl font-black leading-none my-1 font-mono"
                          style={{ color: palette.primary }}
                        >
                          {currentExam.diffDays}
                        </span>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {currentExam.diffDays === 1 ? 'dia para a prova' : 'dias para a prova'}
                        </span>
                      </>
                    ) : currentExam.diffDays === 0 ? (
                      <>
                        <span
                          className="text-[11px] font-bold uppercase tracking-wider"
                          style={{ color: palette.primary }}
                        >
                          É hoje!
                        </span>
                        <span
                          className="text-2xl sm:text-3xl font-black leading-none my-1"
                          style={{ color: palette.primary }}
                        >
                          HOJE
                        </span>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          Dia da prova
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Status
                        </span>
                        <span className="text-xl sm:text-2xl font-black leading-none my-1.5 text-slate-700 dark:text-slate-200">
                          Realizada
                        </span>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          Prova encerrada
                        </span>
                      </>
                    )}
                  </div>

                  {/* Direita: Botão de Ação Principal */}
                  <div className="flex items-center justify-end shrink-0">
                    <button
                      type="button"
                      onClick={handleNavigateToProvas}
                      className="w-full md:w-auto rounded-full px-6 py-3 text-sm font-bold text-white inline-flex items-center justify-center gap-2 shadow-sm hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer shrink-0"
                      style={{
                        backgroundColor: palette.primary,
                        boxShadow: `0 4px 14px ${palette.primary}38`,
                      }}
                    >
                      <Eye className="w-4 h-4 shrink-0" />
                      <span>Visualizar Provas</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Nenhuma prova com data cadastrada no momento.
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Cadastre a data da sua prova em Concursos &amp; Provas para acompanhar a contagem regressiva por aqui.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleNavigateToProvas}
                    className="w-full sm:w-auto rounded-full px-6 py-3 text-sm font-bold text-white inline-flex items-center justify-center gap-2 shadow-sm hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer shrink-0"
                    style={{
                      backgroundColor: palette.primary,
                      boxShadow: `0 4px 14px ${palette.primary}38`,
                    }}
                  >
                    <Eye className="w-4 h-4 shrink-0" />
                    <span>Visualizar Provas</span>
                  </button>
                </div>
              )}
            </CardBody>
          </Card>
        );
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Quadro 3 (Inferior Esquerdo): Rendimento & Histórico de Estudos */}
        <Card className="h-full flex flex-col rounded-2xl overflow-hidden">
          <CardHeader
            title="Rendimento & Histórico de Estudos"
            className="dashboard-themed-header relative overflow-hidden px-6 py-5 items-center bg-gradient-to-r from-primary/15 via-primary/5 to-transparent !border-b !border-primary/25 dark:!border-primary/20"
            action={
              <Button size="sm" variant="ghost" onClick={() => onNavigateTab('historico')} rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
                Ver Histórico
              </Button>
            }
          />
          <CardBody className="p-5 flex-1">
            <StudyCharts sessoes={sessoes} disciplinas={disciplinas} />
          </CardBody>
        </Card>

        {/* Quadro 4 (Inferior Direito): Fila de Revisões Espaçadas de Hoje */}
        <Card className="h-full flex flex-col rounded-2xl overflow-hidden">
          <CardHeader
            title="Fila de Revisões Espaçadas de Hoje"
            className="dashboard-themed-header relative overflow-hidden px-6 py-5 items-center bg-gradient-to-r from-primary/15 via-primary/5 to-transparent !border-b !border-primary/25 dark:!border-primary/20"
            action={
              <Button size="sm" variant="ghost" onClick={() => onNavigateTab('revisoes')} rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
                Ver Todas
              </Button>
            }
          />
          <CardBody className="p-0 divide-y divide-slate-100 dark:divide-slate-800 flex-1 flex flex-col justify-center">
            {pendingRevisoes.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-xl shadow-xs">
                  🎉
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  🎉 Parabéns! Nenhuma revisão pendente para hoje.
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Todas as suas revisões programadas estão em dia. Suas revisões futuras aparecerão aqui apenas nas datas agendadas.
                </p>
              </div>
            ) : (
              pendingRevisoes.slice(0, 4).map((rev) => {
                const intervalLabel = rev.intervalDays
                  ? `Ciclo ${rev.intervalDays === 1 ? '24h' : `${rev.intervalDays}d`}`
                  : rev.method
                  ? `Ciclo ${rev.method}`
                  : 'Ciclo 24h';

                return (
                  <div key={rev.id} className="p-4 sm:p-5 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="purple" size="sm">{intervalLabel}</Badge>
                        {rev.disciplinaName && (
                          <span className="text-xs font-semibold theme-primary-text truncate max-w-xs">
                            {rev.disciplinaName}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 line-clamp-2">
                        {rev.assuntoName}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleStartRevision(rev)}
                        leftIcon={<Zap className="w-3.5 h-3.5" />}
                        className="font-bold text-xs shadow-xs"
                      >
                        Revisar agora
                      </Button>

                      {/* Menu Dropdown de 3 Pontinhos */}
                      <div className="relative menu-options-container">
                        <button
                          type="button"
                          onClick={() => setOpenMenuId(openMenuId === rev.id ? null : rev.id)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          aria-label="Mais opções"
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
                            <button
                              type="button"
                              onClick={() => handleQuickComplete(rev)}
                              className="w-full px-3.5 py-2 text-left flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-emerald-600 dark:text-emerald-400 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Concluir rapidamente
                            </button>
                            {onUpdateRevisao && (
                              <button
                                type="button"
                                onClick={() => handleIgnoreReview(rev)}
                                className="w-full px-3.5 py-2 text-left flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-amber-600 dark:text-amber-400 cursor-pointer"
                              >
                                <EyeOff className="w-3.5 h-3.5" />
                                Ignorar revisão
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardBody>
        </Card>
      </div>

      {/* Modal de Calendário de Constância (Streak) */}
      <StreakCalendarModal
        isOpen={isStreakModalOpen}
        onClose={() => setIsStreakModalOpen(false)}
        streakDays={user.streakDays}
        sessoes={sessoes}
        activeConcurso={activeConcurso}
        disciplinas={activeDisciplinasList}
      />

      {/* Modal de Configuração de Metas Semanais (Sem sair da página) */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        title="Configurar Metas de Estudo Semanal"
        description="Defina suas metas de horas líquidas e questões para a semana atual."
        maxWidth="md"
      >
        <form onSubmit={handleSaveMetas} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Meta Semanal de Horas
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min="1"
                max="168"
                step="1"
                value={modalHours}
                onChange={(e) => setModalHours(e.target.value)}
                placeholder="12"
                required
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Meta de Horas Líquidas para a Semana
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Meta Semanal de Questões
            </label>
            <div className="relative">
              <Target className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min="1"
                max="5000"
                step="1"
                value={modalQuestions}
                onChange={(e) => setModalQuestions(e.target.value)}
                placeholder="500"
                required
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Total de questões para resolver na semana
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleCloseEditModal}
            >
              Cancelar
            </Button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all shadow-md hover:brightness-110 active:scale-95 cursor-pointer"
              style={{
                backgroundColor: palette.primary,
                boxShadow: `0 0 12px ${palette.glowColor || 'rgba(16, 185, 129, 0.4)'}`
              }}
            >
              Salvar Metas
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal para Selecionar Tópico da Matéria */}
      {topicSelectionModal.isOpen && (() => {
        const targetDiscNameNorm = topicSelectionModal.disciplinaName.trim().toUpperCase();
        const disciplineTopics = relevantAssuntos
          .filter(a => {
            if (a.disciplinaId === topicSelectionModal.disciplinaId) return true;
            const d = disciplinas.find(disc => disc.id === a.disciplinaId);
            return d ? d.name.trim().toUpperCase() === targetDiscNameNorm : false;
          })
          .sort((a, b) => (a.order || 0) - (b.order || 0));

        const defaultSuggestedTopic =
          disciplineTopics.find(a => !a.completed) || disciplineTopics[0];

        const currentSelectedAssuntoId =
          customSelectedTopics[topicSelectionModal.disciplinaId] ||
          defaultSuggestedTopic?.id ||
          '';

        const searchNorm = topicSearchTerm.trim().toLowerCase();
        const filteredTopics = searchNorm
          ? disciplineTopics.filter((t, idx) => {
              const numLabel = String(t.order || idx + 1).padStart(2, '0');
              return (
                t.name.toLowerCase().includes(searchNorm) ||
                numLabel.includes(searchNorm)
              );
            })
          : disciplineTopics;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <div
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
              onClick={handleCloseTopicSelector}
            />
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-10 flex flex-col max-h-[88vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Cabeçalho */}
              <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
                    Selecionar Tópico
                  </h3>
                  <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    {topicSelectionModal.disciplinaName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseTopicSelector}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Barra de Busca */}
              <div className="px-6 pb-4">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={topicSearchTerm}
                    onChange={(e) => setTopicSearchTerm(e.target.value)}
                    placeholder="Buscar tópico..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                    style={{
                      ['--tw-ring-color' as any]: palette.primary,
                    }}
                  />
                </div>
              </div>

              {/* Lista Rolável de Tópicos */}
              <div className="px-6 py-2 overflow-y-auto flex-1 space-y-5">
                {disciplineTopics.length === 0 ? (
                  <div className="py-10 text-center space-y-2">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      Nenhum tópico cadastrado para esta matéria.
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Adicione tópicos no Edital Verticalizado para selecioná-los aqui.
                    </p>
                  </div>
                ) : filteredTopics.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Nenhum tópico encontrado para "{topicSearchTerm}".
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 pb-2">
                    <span className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Todos os Tópicos
                    </span>

                    <div className="space-y-2">
                      {filteredTopics.map((topic, idx) => {
                        const originalIdx = disciplineTopics.findIndex(t => t.id === topic.id);
                        const displayIndex = String(originalIdx >= 0 ? originalIdx + 1 : idx + 1).padStart(2, '0');
                        const isSelected = topic.id === currentSelectedAssuntoId;
                        const hasLeadingNumber = /^\d+(\.\d+)*\s/.test(topic.name.trim());
                        const formattedTitle = hasLeadingNumber
                          ? topic.name
                          : `${displayIndex} ${topic.name}`;

                        return (
                          <button
                            key={`all-${topic.id}`}
                            type="button"
                            onClick={() =>
                              handleSelectCustomTopic(
                                topicSelectionModal.disciplinaId,
                                topic.id
                              )
                            }
                            className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer ${
                              isSelected
                                ? ''
                                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60'
                            }`}
                            style={
                              isSelected
                                ? {
                                    borderColor: palette.primary,
                                    backgroundColor: `${palette.primary}12`,
                                  }
                                : undefined
                            }
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                  isSelected
                                    ? 'text-white'
                                    : topic.completed
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40'
                                    : 'border-2 border-slate-300 dark:border-slate-600 bg-transparent'
                                }`}
                                style={
                                  isSelected
                                    ? { backgroundColor: palette.primary }
                                    : undefined
                                }
                              >
                                {isSelected ? (
                                  <Check className="w-3 h-3 stroke-[3]" />
                                ) : topic.completed ? (
                                  <Check className="w-3 h-3 stroke-[2.5]" />
                                ) : null}
                              </div>
                              <span
                                className={`text-xs sm:text-sm truncate ${
                                  isSelected
                                    ? 'font-bold text-slate-900 dark:text-white'
                                    : 'font-medium text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {formattedTitle}
                              </span>
                            </div>

                            {topic.completed && (
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                  Concluído
                                </span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Rodapé com botão Concluir */}
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end bg-white dark:bg-slate-900">
                <button
                  type="button"
                  onClick={handleCloseTopicSelector}
                  className="px-6 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer active:scale-95"
                >
                  Concluir
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* =========================================================================
          MODAL: "ÚLTIMOS ESTUDOS" DA DISCIPLINA SELECIONADA
          ========================================================================= */}
      {historyModalDisciplina && (() => {
        const recentSessions = sessoes
          .filter(s => s && s.disciplinaId === historyModalDisciplina.id)
          .sort((a, b) => {
            const tA = new Date(a.completedAt || a.createdAt).getTime();
            const tB = new Date(b.completedAt || b.createdAt).getTime();
            return tB - tA;
          })
          .slice(0, 5);

        const formatShortDate = (isoStr?: string) => {
          if (!isoStr) return '--/--/--';
          try {
            const d = new Date(isoStr);
            if (isNaN(d.getTime())) return '--/--/--';
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = String(d.getFullYear()).slice(-2);
            return `${day}/${month}/${year}`;
          } catch {
            return '--/--/--';
          }
        };

        const formatDurationLabel = (mins?: number) => {
          const safeMins = Math.max(0, Math.round(mins || 0));
          if (safeMins < 60) return `${safeMins}min`;
          const h = Math.floor(safeMins / 60);
          const m = safeMins % 60;
          return m > 0 ? `${h}h ${String(m).padStart(2, '0')}min` : `${h}h`;
        };

        const getCategoryBadgeInfo = (type?: string) => {
          const norm = (type || 'teoria').trim().toLowerCase();
          if (norm === 'questoes' || norm === 'questões') {
            return {
              label: 'Questões',
              className:
                'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25',
            };
          }
          if (norm === 'lei_seca' || norm === 'lei seca') {
            return {
              label: 'Lei Seca',
              className:
                'bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/25',
            };
          }
          if (norm === 'revisao' || norm === 'revisão') {
            return {
              label: 'Revisão',
              className:
                'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25',
            };
          }
          if (norm === 'resumo') {
            return {
              label: 'Resumo',
              className:
                'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25',
            };
          }
          return {
            label: norm === 'teoria' ? 'Teoria' : (type || 'Teoria'),
            className:
              'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/25',
          };
        };

        const extractPagesLabel = (session: SessaoEstudo): string | null => {
          if (Array.isArray(session.pageIntervals) && session.pageIntervals.length > 0) {
            const valid = session.pageIntervals
              .filter(p => (p.inicio !== '' && p.inicio !== null && p.inicio !== undefined) || (p.fim !== '' && p.fim !== null && p.fim !== undefined))
              .map(p => {
                const ini = p.inicio !== '' && p.inicio !== null && p.inicio !== undefined ? p.inicio : 1;
                const fim = p.fim !== '' && p.fim !== null && p.fim !== undefined ? p.fim : ini;
                return `${ini} ~ ${fim}`;
              });
            if (valid.length > 0) return `p. ${valid.join(', ')}`;
          }
          if (session.notes) {
            const match = session.notes.match(/pág\.\s*(\d+)\s*[-~]\s*(\d+)/i);
            if (match) return `p. ${match[1]} ~ ${match[2]}`;
          }
          return null;
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <div
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
              onClick={() => setHistoryModalDisciplina(null)}
            />
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-10 flex flex-col max-h-[88vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Cabeçalho */}
              <div className="px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    Últimos estudos
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {historyModalDisciplina.name} · os 5 mais recentes
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setHistoryModalDisciplina(null)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Corpo do Modal */}
              <div className="p-6 overflow-y-auto flex-1">
                {recentSessions.length === 0 ? (
                  <div className="py-10 px-4 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto">
                      <History className="w-6 h-6 opacity-75" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">
                        Nenhum estudo registrado ainda
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                        Você ainda não realizou sessões de estudo para esta matéria.
                      </p>
                    </div>
                    <div className="pt-2">
                      <Button
                        variant="primary"
                        size="md"
                        leftIcon={<PlusCircle className="w-4 h-4" />}
                        onClick={() => {
                          const target = historyModalDisciplina;
                          setHistoryModalDisciplina(null);
                          triggerManualStudyRegister({
                            disciplinaId: target.id,
                            assuntoId: target.assuntoId,
                            durationMinutes: target.durationMinutes,
                          });
                        }}
                      >
                        Registrar primeiro estudo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {recentSessions.map((session) => {
                      const catBadge = getCategoryBadgeInfo(session.type);
                      const topicObj = session.assuntoId
                        ? assuntos.find(a => a.id === session.assuntoId)
                        : undefined;
                      const topicTitle =
                        topicObj?.name || session.assuntoName || 'Estudo Geral da Disciplina';
                      const attempted = session.questionsAttempted || 0;
                      const correct = session.questionsCorrect || 0;
                      const accuracy =
                        attempted > 0
                          ? session.accuracyRate ?? Math.round((correct / attempted) * 100)
                          : null;
                      const pagesStr = extractPagesLabel(session);

                      return (
                        <div
                          key={session.id}
                          className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4"
                        >
                          {/* Esquerda: Data + Categoria + Tópico */}
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium shrink-0 font-mono">
                              {formatShortDate(session.completedAt || session.createdAt)}
                            </span>

                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${catBadge.className}`}
                            >
                              {catBadge.label}
                            </span>

                            <span
                              className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate"
                              title={topicTitle}
                            >
                              {topicTitle}
                            </span>
                          </div>

                          {/* Direita: Métricas (Duração, Questões, Páginas) */}
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400 shrink-0">
                            <span className="inline-flex items-center gap-1 font-semibold">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{formatDurationLabel(session.durationMinutes)}</span>
                            </span>

                            {attempted > 0 && (
                              <span className="inline-flex items-center gap-1.5 font-semibold">
                                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                                <span>
                                  {correct}/{attempted}
                                </span>
                                {accuracy !== null && (
                                  <span
                                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                                      accuracy >= 75
                                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                        : accuracy >= 50
                                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                        : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                                    }`}
                                  >
                                    {accuracy}%
                                  </span>
                                )}
                              </span>
                            )}

                            {pagesStr && (
                              <span className="inline-flex items-center gap-1 font-semibold">
                                <FileText className="w-3.5 h-3.5 text-slate-400" />
                                <span>{pagesStr}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* =========================================================================
          CRONÔMETRO DE FOCO CONTEXTUALIZADO PARA REVISÃO (FLUXO REVISAR AGORA)
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
          MODAL DE REGISTRO DE ESTUDO CONTEXTUALIZADO PARA REVISÃO
          ========================================================================= */}
      {isStudyRegisterModalOpen && activeTimerReview && (
        <StudyRegisterModal
          isOpen={isStudyRegisterModalOpen && !!activeTimerReview}
          onClose={() => {
            setIsStudyRegisterModalOpen(false);
            setActiveTimerReview(null);
          }}
          modo={registerModo}
          isRevisionContext={true}
          disciplinas={disciplinas}
          assuntos={assuntos}
          initialDisciplinaId={activeTimerReview.disciplinaId}
          initialDisciplinaName={activeTimerReview.disciplinaName}
          initialAssuntoId={activeTimerReview.assuntoId}
          initialAssuntoName={activeTimerReview.assuntoName}
          elapsedSeconds={registerElapsedSeconds}
          plannedMinutes={25}
          onSaveSuccess={handleSaveRevisionSession}
          onBackToTimer={registerModo === 'manual' ? undefined : handleBackToTimer}
        />
      )}
    </div>
  );
};
