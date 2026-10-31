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
  CalendarClock,
  Pencil,
  Sparkles,
  MoreVertical,
  Search,
  X,
  Settings,
  ClipboardCheck,
  BarChart3
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
  Prova 
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
import { MenuBannerFrame } from '../common/MenuBannerFrame';

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
  provas?: Prova[];
  isLoading?: boolean;
  errorMessage?: string | null;
  onNavigateTab: (tab: NavigationTab) => void;
  onOpenStudyTimer: (preSelectedDisciplinaId?: string, preSelectedAssuntoId?: string, durationMinutes?: number | string, mode?: 'cronometro' | 'manual') => void;
  onOpenStudyRegister?: (options?: { modo?: 'cronometro' | 'manual'; disciplinaId?: string; assuntoId?: string; durationMinutes?: number | string }) => void;
  onCompleteRevisao: (id: string, rating: 'facil' | 'medio' | 'dificil') => void;
  onRetry?: () => void;
}

const BANNER_THEMES: Record<string, string> = {
  verde: "https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Painel%20Geral/Banner-painel-geral-verde.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBQYWluZWwgR2VyYWwvQmFubmVyLXBhaW5lbC1nZXJhbC12ZXJkZS5wbmciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzkyOTQ5NzAwLCJleHAiOjQ5NDY1NDk3MDB9.i7OM-fgyxszWN1uInDFexStQCElbxJT09kM-4kz-mI0xbnR8j_f9w_v5oE2UA1okrvVNr8ECFXccAT_V_AK03Q",
  azul: "https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Painel%20Geral/Banner-painel-geral-azul.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBQYWluZWwgR2VyYWwvQmFubmVyLXBhaW5lbC1nZXJhbC1henVsLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3OTI5NDk3MjUsImV4cCI6NDk0NjU0OTcyNX0.wGZYLBnjGgYxW0JzmmwPRiBqwkl91QwR4zpCfat6sO0kRlO71-n_RA65sD5HV2DW2-lW867PLUZQaUeT8zijqQ",
  rosa: "https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Painel%20Geral/Banner-painel-geral-rosa.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBQYWluZWwgR2VyYWwvQmFubmVyLXBhaW5lbC1nZXJhbC1yb3NhLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3OTI5NDk3MzYsImV4cCI6NDk0NjU0OTczNn0._YrS5RXScu3j5NrAxENk9gEJLyAkuPsKEAb3FhiDyt-uZIVfd8P2VrXKD8JY-xrd9N05H6XmmDz-P7ESnZgDgQ",
  roxo: "https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Painel%20Geral/Banner-painel-geral-roxo.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBQYWluZWwgR2VyYWwvQmFubmVyLXBhaW5lbC1nZXJhbC1yb3hvLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3OTI5NDk3NTcsImV4cCI6NDk0NjU0OTc1N30.6bexjnIm7u6FdTp0T3M881N5bJdTXSxDiNkhZF7zBJp50-ixHRSQ5yl1WNsjwllzUjs9_CrdBzbBH6gZKmD04w",
  laranja: "https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Painel%20Geral/Banner-painel-geral-laranja.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBQYWluZWwgR2VyYWwvQmFubmVyLXBhaW5lbC1nZXJhbC1sYXJhbmphLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3OTI5NDk3NjksImV4cCI6NDk0NjU0OTc2OX0.rDHY-aqNny3su6V_W1oAVxBOHk0Gk5SmnaecKhXXsuTliJtlO5Hm3dK1Rl1oCTWofg40TavqwQG3ns2p_ET2tg",
};

// Aliases tolerantes a variações em inglês/português e IDs compostos
BANNER_THEMES.green = BANNER_THEMES.verde;
BANNER_THEMES.emerald = BANNER_THEMES.verde;
BANNER_THEMES.blue = BANNER_THEMES.azul;
BANNER_THEMES.sky = BANNER_THEMES.azul;
BANNER_THEMES.cyan = BANNER_THEMES.azul;
BANNER_THEMES.purple = BANNER_THEMES.roxo;
BANNER_THEMES.violet = BANNER_THEMES.roxo;
BANNER_THEMES.pink = BANNER_THEMES.rosa;
BANNER_THEMES.rose = BANNER_THEMES.rosa;
BANNER_THEMES.orange = BANNER_THEMES.laranja;
BANNER_THEMES.amber = BANNER_THEMES.laranja;
BANNER_THEMES.dbz = BANNER_THEMES.laranja;

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
  provas = [],
  isLoading = false,
  errorMessage = null,
  onNavigateTab,
  onOpenStudyTimer,
  onOpenStudyRegister,
  onCompleteRevisao,
  onRetry,
}) => {
  const themeContext = useTheme();
  const { palette } = themeContext;

  // Normalização robusta tolerante a variações para identificação inequívoca do tema ativo
  const normalizedSkin = normalizeThemeSkin(themeContext);
  const bannerUrl = BANNER_THEMES[normalizedSkin] || BANNER_THEMES.verde;

  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Identificação do concurso ativo para persistência de metas
  const activeConcursoId = useMemo(() => {
    return concursos.find(c => c.active || c.isAtivo)?.id || 
      concursos.find(c => c.id === user.targetConcursoId)?.id || 
      concursos[0]?.id || 'default';
  }, [concursos, user.targetConcursoId]);

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
    return concursos.find(c => c.active || c.isAtivo) || 
      concursos.find(c => c.id === user.targetConcursoId) || 
      concursos[0] || null;
  }, [concursos, user.targetConcursoId]);

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

  // Filtragem estrita: apenas revisões de HOJE (ou atrasadas de dias anteriores) pertencentes ao concurso ativo
  const todayStr = useMemo(() => {
    const d = new Date();
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
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

  const diasRestantes = useMemo(() => {
    const rawDate = activeConcurso?.examDate || 
      (activeConcurso as any)?.dataProva || 
      (activeConcurso as any)?.data_prova || 
      (activeConcurso as any)?.exam_date;
    if (!rawDate) return null;
    try {
      const dateStr = String(rawDate).trim();
      const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
      const parts = cleanDate.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const examDateObj = new Date(year, month, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffMs = examDateObj.getTime() - today.getTime();
        return Math.round(diffMs / (1000 * 60 * 60 * 24));
      }
      const examTime = new Date(rawDate).getTime();
      if (isNaN(examTime)) return null;
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      return Math.round((examTime - now.getTime()) / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  }, [activeConcurso]);

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

  const nextAssuntoToStudy = relevantAssuntos.find(a => !a.completed) || relevantAssuntos[0];
  const nextDisciplina = nextAssuntoToStudy 
    ? activeDisciplinasList.find(d => d.id === nextAssuntoToStudy.disciplinaId) 
    : activeDisciplinasList[0];

  const hasActiveCycle = Boolean(
    cycle &&
    cycle.blocks &&
    cycle.blocks.length > 0 &&
    (!activeConcurso || !cycle.concursoId || cycle.concursoId === activeConcurso.id)
  );

  const studyQueue = (() => {
    if (hasActiveCycle && cycle) {
      const blocks = cycle.blocks;
      const startIndex = blocks.findIndex(b => b.status !== 'concluido');
      const effectiveStart = startIndex >= 0 ? startIndex : (cycle.currentBlockIndex || 0);
      const orderedBlocks = [
        ...blocks.slice(effectiveStart),
        ...blocks.slice(0, effectiveStart),
      ];
      return orderedBlocks.slice(0, 4).map(b => {
        const customAssuntoId = customSelectedTopics[b.disciplinaId];
        const customAssunto = customAssuntoId
          ? relevantAssuntos.find(a => a.id === customAssuntoId && a.disciplinaId === b.disciplinaId)
          : undefined;
        const defaultAssunto = relevantAssuntos.find(a => a.disciplinaId === b.disciplinaId && !a.completed) ||
          relevantAssuntos.find(a => a.disciplinaId === b.disciplinaId);
        const resolvedAssuntoId = customAssunto?.id || b.assuntoSugeridoId || defaultAssunto?.id;
        const resolvedAssuntoName = customAssunto?.name || b.assuntoSugeridoName || defaultAssunto?.name || 'Estudo dirigido do edital';
        return {
          id: b.id,
          disciplinaId: b.disciplinaId,
          disciplinaName: b.disciplinaName,
          assuntoId: resolvedAssuntoId,
          assuntoName: resolvedAssuntoName,
          durationMinutes: b.durationMinutes || 45,
        };
      });
    }

    // Fallback inteligente pelas disciplinas cadastradas no concurso ativo
    const seenNames = new Set<string>();
    const uniqueDiscs = activeDisciplinasList.filter(d => {
      const key = d.name.trim().toUpperCase();
      if (seenNames.has(key)) return false;
      seenNames.add(key);
      return true;
    });

    return uniqueDiscs.slice(0, 4).map(d => {
      const customAssuntoId = customSelectedTopics[d.id];
      const customAssunto = customAssuntoId
        ? relevantAssuntos.find(a => a.id === customAssuntoId && a.disciplinaId === d.id)
        : undefined;
      const topic = customAssunto ||
        relevantAssuntos.find(a => a.disciplinaId === d.id && !a.completed) ||
        relevantAssuntos.find(a => a.disciplinaId === d.id);
      return {
        id: d.id,
        disciplinaId: d.id,
        disciplinaName: d.name,
        assuntoId: topic?.id,
        assuntoName: topic?.name || 'Conteúdo programático do edital',
        durationMinutes: 45,
      };
    });
  })();

  const primaryStudyItem = studyQueue[0] || (nextDisciplina && nextAssuntoToStudy ? (() => {
    const customId = customSelectedTopics[nextDisciplina.id];
    const customTopic = customId
      ? relevantAssuntos.find(a => a.id === customId && a.disciplinaId === nextDisciplina.id)
      : undefined;
    const chosenTopic = customTopic || nextAssuntoToStudy;
    return {
      id: nextDisciplina.id,
      disciplinaId: nextDisciplina.id,
      disciplinaName: nextDisciplina.name,
      assuntoId: chosenTopic.id,
      assuntoName: chosenTopic.name,
      durationMinutes: 45,
    };
  })() : null);

  const upcomingStudyItems = studyQueue.slice(1, 4);

  const cycleProgressPercent = (() => {
    if (hasActiveCycle && cycle && cycle.blocks.length > 0) {
      const totalMins = cycle.blocks.reduce((acc, b) => acc + (b.durationMinutes || 0), 0);
      const doneMins = cycle.blocks.reduce((acc, b) => {
        if (b.status === 'concluido') return acc + (b.durationMinutes || 0);
        return acc + Math.min(b.durationMinutes || 0, b.elapsedMinutes || 0);
      }, 0);
      return totalMins > 0 ? Math.min(100, Math.round((doneMins / totalMins) * 100)) : 0;
    }
    return editalProgressPercent;
  })();

  const formattedTodayLabel = (() => {
    try {
      const now = new Date();
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
        <MenuBannerFrame
          bannerThemes={BANNER_THEMES}
          minHeight="min-h-[220px] md:min-h-[240px]"
          className="card-banner banner-principal p-6 sm:p-8 text-white shadow-xl border border-slate-700/50 bg-slate-900 dark:bg-slate-950"
          contentClassName="flex flex-col md:flex-row md:items-center justify-between gap-6"
          alt="Banner Painel Geral"
        >
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge-ativo px-2.5 py-0.5 rounded-full text-xs font-bold">
                  Concurso Ativo
                </span>
                <span className="text-xs font-semibold text-slate-200 bg-black/40 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-white/15">
                  Órgão: <strong className="text-white">{activeConcurso.organ}</strong>
                </span>
                <span className="text-xs font-semibold text-slate-200 bg-black/40 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-white/15">
                  Banca: <strong className="text-white">{activeConcurso.banca}</strong>
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
                {activeConcurso.title}
              </h2>
              <p className="text-sm text-slate-200 leading-snug">
                <span>Cargo: <span className="cargo-destaque font-bold">{activeConcurso.role}</span></span>
                <span className="block mt-0.5">
                  Remuneração: {
                    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(activeConcurso.remuneration || 0)
                  }
                </span>
              </p>
              <div className="pt-2 max-w-lg space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-200 flex items-center gap-1">
                    <Target className="progresso-icone w-3.5 h-3.5" />
                    Cobertura do Edital Verticalizado
                  </span>
                  <span className="progresso-texto font-bold">{editalProgressPercent}% ({completedTopicsCount}/{totalTopicsCount})</span>
                </div>
                <div className="progresso-trilho w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/20">
                  <div 
                    className="progresso-barra barra-progresso h-full rounded-full transition-all duration-700"
                    style={{ width: `${editalProgressPercent}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end justify-between gap-4 self-stretch shrink-0">
              <div 
                ref={(el) => {
                  if (el) {
                    el.style.setProperty('background-color', '#000000', 'important');
                  }
                }}
                className="dias-restantes-card flex items-center gap-4 px-5 py-3 rounded-2xl bg-black backdrop-blur-md border shadow-md transition-all"
                style={{
                  backgroundColor: '#000000',
                  borderColor: `${palette.primary}66`,
                  boxShadow: `0 0 14px ${palette.glowColor || 'rgba(255,255,255,0.1)'}`,
                }}
              >
                <Calendar 
                  className="w-10 h-10 shrink-0 text-primary text-destaque-tema" 
                  style={{ color: palette.primary }} 
                />
                <div className="flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] font-bold tracking-wider text-slate-300 dark:text-slate-300 uppercase">
                    FALTAM
                  </span>
                  {diasRestantes !== null && diasRestantes >= 0 ? (
                    <div className="flex items-baseline gap-1.5 leading-none my-0.5">
                      <span className="text-3xl font-extrabold text-white">{diasRestantes}</span>
                      <span 
                        className="text-base font-bold text-primary text-destaque-tema"
                        style={{ color: palette.primary }}
                      >
                        {diasRestantes === 1 ? 'DIA' : 'DIAS'}
                      </span>
                    </div>
                  ) : diasRestantes !== null && diasRestantes < 0 ? (
                    <div className="flex items-baseline gap-1.5 leading-none my-0.5">
                      <span className="text-xl font-extrabold text-white">CONCLUÍDO</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1.5 leading-none my-0.5">
                      <span className="text-3xl font-extrabold text-white">--</span>
                      <span 
                        className="text-base font-bold text-primary text-destaque-tema"
                        style={{ color: palette.primary }}
                      >
                        DIAS
                      </span>
                    </div>
                  )}
                  <span 
                    className="text-[9px] font-bold tracking-widest text-primary/90 text-destaque-tema mt-1 uppercase"
                    style={{ color: palette.primary }}
                  >
                    {diasRestantes !== null && diasRestantes < 0 ? 'CONCURSO ENCERRADO' : 'PARA A PROVA'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    if (onOpenStudyRegister) {
                      onOpenStudyRegister({ modo: 'manual' });
                    } else {
                      onOpenStudyTimer(undefined, undefined, undefined, 'manual');
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
              </div>
            </div>
        </MenuBannerFrame>
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

      {plan && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
              <CalendarClock className="w-5 h-5" />
            </span>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Cronograma Inteligente ({plan.concursoTitle})
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {plan.sessions.filter(s => s.status === 'concluida').length} de {plan.sessions.length} sessões concluídas
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateTab('plano')}
            rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
          >
            Acessar Plano
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Quadro 1 (Superior Esquerdo): Tópico Atual & Próximos Estudos */}
        {primaryStudyItem && (() => {
          const { icon: PrimaryIcon, color: primaryIconColor } = resolveSubjectIcon(primaryStudyItem.disciplinaName);
          const ringRadius = 15;
          const ringCircumference = 2 * Math.PI * ringRadius;
          const ringStrokeDashoffset = ringCircumference - (cycleProgressPercent / 100) * ringCircumference;

          return (
            <Card className="h-full min-h-[440px] sm:min-h-[480px] rounded-2xl flex flex-col overflow-hidden border border-slate-200/90 dark:border-slate-800 shadow-sm">
              <CardBody className="p-6 sm:p-7 space-y-6 flex-1 flex flex-col justify-between">
                {/* Cabeçalho: PLANEJAMENTO DO DIA | Data | Progresso do Ciclo */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" style={{ color: palette.primary }} />
                      <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Tópico Atual
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
                        {cycleProgressPercent}%
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        do ciclo concluído
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Principal Destacado: PRÓXIMO ESTUDO */}
                <div
                  className="relative rounded-2xl p-6 sm:p-7 text-white shadow-md overflow-hidden transition-all"
                  style={{
                    background: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.secondary || palette.primary} 100%)`,
                  }}
                >
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                      {/* Ícone da Disciplina em Box Arredondado */}
                      <div
                        className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-white/30"
                        style={{
                          backgroundColor: '#ffffff',
                          color: primaryIconColor,
                        }}
                      >
                        <PrimaryIcon className="w-7 h-7 stroke-[2]" />
                      </div>

                      <div className="min-w-0 flex-1 space-y-2">
                        <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-slate-900/75 text-white shadow-2xs">
                          Próximo
                        </span>

                        <h4
                          className="proximo-estudo-title text-lg sm:text-xl md:text-2xl font-extrabold text-white !text-white tracking-tight truncate"
                          style={{ color: '#ffffff' }}
                        >
                          {primaryStudyItem.disciplinaName}
                        </h4>

                        <div
                          onClick={() =>
                            handleOpenTopicSelector(
                              primaryStudyItem.disciplinaId,
                              primaryStudyItem.disciplinaName
                            )
                          }
                          className="group inline-flex items-center gap-1.5 max-w-full cursor-pointer text-white/95 hover:text-white"
                          title="Alterar tópico da matéria a ser estudada"
                        >
                          <span className="text-sm sm:text-base font-medium truncate border-b border-dashed border-white/60 pb-0.5">
                            {primaryStudyItem.assuntoName}
                          </span>
                          <Pencil className="w-3.5 h-3.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity" />
                        </div>

                        <div className="pt-1">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-bold bg-black/20 text-white backdrop-blur-xs border border-white/15">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{primaryStudyItem.durationMinutes}min</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Ações do Card Principal */}
                    <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() =>
                          onOpenStudyTimer(
                            primaryStudyItem.disciplinaId,
                            primaryStudyItem.assuntoId,
                            primaryStudyItem.durationMinutes
                          )
                        }
                        className="px-5 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>Iniciar Estudo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onOpenStudyRegister
                            ? onOpenStudyRegister({
                                modo: 'manual',
                                disciplinaId: primaryStudyItem.disciplinaId,
                                assuntoId: primaryStudyItem.assuntoId,
                                durationMinutes: primaryStudyItem.durationMinutes,
                              })
                            : onOpenStudyTimer(
                                primaryStudyItem.disciplinaId,
                                primaryStudyItem.assuntoId,
                                primaryStudyItem.durationMinutes,
                                'manual'
                              )
                        }
                        className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 border border-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
                        title="Registrar estudo manualmente para esta disciplina"
                        aria-label="Opções do estudo"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Seção: PRÓXIMOS ESTUDOS */}
                {upcomingStudyItems.length > 0 && (
                  <div className="space-y-3.5 pt-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Próximos Estudos
                      </span>

                      <button
                        type="button"
                        onClick={() => onNavigateTab('plano')}
                        className="px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                      >
                        <span>Ver planejamento completo</span>
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
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                              <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>{item.durationMinutes}min</span>
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  onOpenStudyTimer(
                                    item.disciplinaId,
                                    item.assuntoId,
                                    item.durationMinutes
                                  )
                                }
                                className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
                                title={`Estudar ${item.disciplinaName}`}
                                aria-label={`Opções para ${item.disciplinaName}`}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          );
        })()}

        {/* Quadro 2 (Superior Direito): Metas de Estudo Semanal */}
        <div className="h-full min-h-[440px] sm:min-h-[480px] flex flex-col bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden">
          {/* Cabeçalho: Metas de Estudo Semanal */}
          <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
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
              className="w-9 h-9 rounded-xl bg-slate-100/80 hover:bg-slate-200/70 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
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
                {hasActiveCycle || (plan && plan.sessions && plan.sessions.length > 0) ? (
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

        {/* Quadro 3 (Inferior Esquerdo): Rendimento & Histórico de Estudos */}
        <Card className="h-full flex flex-col">
          <CardHeader
            title="Rendimento & Histórico de Estudos"
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
        <Card className="h-full flex flex-col">
          <CardHeader
            title="Fila de Revisões Espaçadas de Hoje"
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
              pendingRevisoes.slice(0, 4).map((rev) => (
                <div key={rev.id} className="p-4 sm:p-5 flex items-center justify-between gap-3">
                  <div>
                    <Badge variant="purple" size="sm">Ciclo {rev.method}</Badge>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">{rev.assuntoName}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="primary" onClick={() => onCompleteRevisao(rev.id, 'facil')}>
                      Concluir
                    </Button>
                  </div>
                </div>
              ))
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

        // Próximos tópicos dentro do ciclo de estudos (não concluídos primeiro, até 3 sugestões)
        const pendingTopics = filteredTopics.filter(t => !t.completed);
        const suggestedCycleTopics = (pendingTopics.length > 0 ? pendingTopics : filteredTopics).slice(0, 3);

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
                  <>
                    {/* Seção 1: SUGESTÕES DO CICLO */}
                    {suggestedCycleTopics.length > 0 && (
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-1.5">
                          <Sparkles
                            className="w-3.5 h-3.5 shrink-0"
                            style={{ color: palette.primary }}
                          />
                          <span
                            className="text-[11px] font-extrabold uppercase tracking-wider"
                            style={{ color: palette.primary }}
                          >
                            Sugestões do Ciclo
                          </span>
                        </div>

                        <div className="space-y-2">
                          {suggestedCycleTopics.map((topic) => {
                            const originalIdx = disciplineTopics.findIndex(t => t.id === topic.id);
                            const displayIndex = String(originalIdx >= 0 ? originalIdx + 1 : (topic.order || 1)).padStart(2, '0');
                            const isSelected = topic.id === currentSelectedAssuntoId;
                            const hasLeadingNumber = /^\d+(\.\d+)*\s/.test(topic.name.trim());
                            const formattedTitle = hasLeadingNumber
                              ? topic.name
                              : `${displayIndex} ${topic.name}`;

                            return (
                              <button
                                key={`sug-${topic.id}`}
                                type="button"
                                onClick={() =>
                                  handleSelectCustomTopic(
                                    topicSelectionModal.disciplinaId,
                                    topic.id
                                  )
                                }
                                className="w-full text-left p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer"
                                style={{
                                  borderColor: isSelected ? palette.primary : undefined,
                                  backgroundColor: isSelected ? `${palette.primary}12` : undefined,
                                }}
                              >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <div
                                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                      isSelected
                                        ? 'text-white'
                                        : 'border-2 border-slate-300 dark:border-slate-600 bg-transparent'
                                    }`}
                                    style={
                                      isSelected
                                        ? { backgroundColor: palette.primary }
                                        : undefined
                                    }
                                  >
                                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                  </div>
                                  <span
                                    className={`text-xs sm:text-sm truncate ${
                                      isSelected
                                        ? 'font-bold text-slate-900 dark:text-white'
                                        : 'font-semibold text-slate-700 dark:text-slate-200'
                                    }`}
                                  >
                                    {formattedTitle}
                                  </span>
                                </div>

                                <span
                                  className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider shrink-0"
                                  style={{
                                    backgroundColor: `${palette.primary}20`,
                                    color: palette.primary,
                                  }}
                                >
                                  Sugerido
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Seção 2: TODOS OS TÓPICOS */}
                    <div className="space-y-2.5 pb-2">
                      <span className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Todos os Tópicos
                      </span>

                      <div className="space-y-2">
                        {filteredTopics.map((topic, idx) => {
                          const originalIdx = disciplineTopics.findIndex(t => t.id === topic.id);
                          const displayIndex = String(originalIdx >= 0 ? originalIdx + 1 : idx + 1).padStart(2, '0');
                          const isSelected = topic.id === currentSelectedAssuntoId;
                          const isDefaultSuggested = topic.id === defaultSuggestedTopic?.id;
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

                              <div className="flex items-center gap-2 shrink-0">
                                {topic.completed && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    Concluído
                                  </span>
                                )}
                                {isDefaultSuggested && (
                                  <span
                                    className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider"
                                    style={{
                                      backgroundColor: `${palette.primary}20`,
                                      color: palette.primary,
                                    }}
                                  >
                                    Sugerido
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
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
    </div>
  );
};
