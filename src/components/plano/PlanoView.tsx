import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Plus, 
  Edit2, 
  Trash2, 
  Sparkles, 
  CalendarClock, 
  Repeat, 
  BarChart3, 
  CalendarDays, 
  Sliders, 
  History, 
  X,
  RotateCw,
  ChevronRight
} from 'lucide-react';
import { 
  StudyPlan, 
  PlannedSession, 
  WeeklyAvailability, 
  Concurso, 
  Disciplina, 
  Assunto, 
  DayOfWeek, 
  PlanSessionType, 
  PlanSessionStatus, 
  StudyCycle, 
  CycleBlock,
  StudyMethod,
  SessaoEstudo
} from '../../types';
import { Card, CardHeader, CardBody } from '../../design-system/Card';
import { Button } from '../../design-system/Button';
import { Badge } from '../../design-system/Badge';
import { Modal } from '../../design-system/Modal';
import { PlannerService } from '../../services/plannerService';
import { DatabaseService } from '../../services/db';
import { CalendarView } from './CalendarView';
import { CicloView } from './CicloView';
import { CriarCicloModal } from './CriarCicloModal';
import { CriarCronogramaModal } from './CriarCronogramaModal';
import { MetodoEstudoModal } from './MetodoEstudoModal';
import { EmptyContestState } from '../common/EmptyContestState';
import { useTheme } from '../../contexts/ThemeContext';
import { MenuBannerFrame } from '../common/MenuBannerFrame';

// Banners do menu "Plano de Estudos" por tema (Supabase)
export const PLANO_ESTUDOS_BANNER_THEMES: Record<string, string> = {
  verde: 'https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Plano%20de%20Estudos/Banner-Plano-estudos-verde.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBQbGFubyBkZSBFc3R1ZG9zL0Jhbm5lci1QbGFuby1lc3R1ZG9zLXZlcmRlLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3OTI2MzE2OTcsImV4cCI6NDk0NjIzMTY5N30.fuUZHf_P8rQr-e4jWFuxzphsISVxqbCa1MLWgeAmhtvdn8Bma5ICgQC1s_lDLqaOVJ5-xmqRkS575WIq97cv4g',
  azul: 'https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Plano%20de%20Estudos/Banner-Plano-estudos-azul.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBQbGFubyBkZSBFc3R1ZG9zL0Jhbm5lci1QbGFuby1lc3R1ZG9zLWF6dWwucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc5MjYzMTcxMSwiZXhwIjo0OTQ2MjMxNzExfQ.A-vYNqIBTzJVmEXzaHMvPYmBUbOFT-1ZizuUApUiMNyeEWUkajUiERH2qU7SprCmsjT5bdpwYwB6b_1beqdAlg',
  rosa: 'https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Plano%20de%20Estudos/Banner-Plano-estudos-rosa.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBQbGFubyBkZSBFc3R1ZG9zL0Jhbm5lci1QbGFuby1lc3R1ZG9zLXJvc2EucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc5MjYzMTcyNiwiZXhwIjo0OTQ2MjMxNzI2fQ.ABVrQWqmVXLDtuqTRG30JXknSsTiCDrrF97i352vN94sx_4c1yLqtDVyh5RCTnUDB7rDnYCS28v7i1MVxePjJA',
  roxo: 'https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Plano%20de%20Estudos/Banner-Plano-estudos-roxo.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBQbGFubyBkZSBFc3R1ZG9zL0Jhbm5lci1QbGFuby1lc3R1ZG9zLXJveG8ucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc5MjYzMTczOSwiZXhwIjo0OTQ2MjMxNzM5fQ.ul5N3Es_Q0GvhtCDnP6Gr7rjkkI67YHzyQhmTe-ceph1YJzZVo6gYNe3kseP4sAclN-_FoQ_GI7dfoIpbxBK0A',
  laranja: 'https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Plano%20de%20Estudos/Banner-Plano-estudos-laranja.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBQbGFubyBkZSBFc3R1ZG9zL0Jhbm5lci1QbGFuby1lc3R1ZG9zLWxhcmFuamEucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc5MjYzMTc1MSwiZXhwIjo0OTQ2MjMxNzUxfQ.N1-1PYntQRZEOZQHwqhNPbttKJPtANgQwDn-ZMRALrJkVwDZHAsVL6Wh-Pg-id_GNlgUL9VrcE5cZ3dg0HoqZQ',
};
export const PLANO_BANNER_THEMES = PLANO_ESTUDOS_BANNER_THEMES;

interface PlanoViewProps {
  plan?: StudyPlan | null;
  cycle?: StudyCycle | null;
  concursos: Concurso[];
  disciplinas: Disciplina[];
  assuntos: Assunto[];
  sessoes?: SessaoEstudo[];
  activeConcursoId?: string;
  studyMethod?: StudyMethod;
  onNavigateTab?: (tab: any) => void;
  onSwitchMethod?: (method: StudyMethod) => Promise<void> | void;
  onRecalculatePlan: (customAvailability?: WeeklyAvailability, newExamDate?: string) => Promise<void>;
  onAddSession: (session: Omit<PlannedSession, 'id'>) => Promise<void>;
  onUpdateSession: (sessionId: string, partial: Partial<PlannedSession>) => Promise<void>;
  onDeleteSession: (sessionId: string) => Promise<void>;
  onRescheduleSession: (sessionId: string, newDate: string, reason?: string) => Promise<void>;
  onBatchRescheduleOverdue: (targetDate?: string, mode?: 'today' | 'spread') => Promise<void>;
  onToggleSessionStatus: (sessionId: string, status: PlanSessionStatus) => Promise<void>;
  onOpenStudyTimer: (disciplinaId?: string, assuntoId?: string, durationMinutes?: number | string) => void;
  onAdvanceCycle?: (minutesStudied?: number) => Promise<void>;
  onRewindCycle?: () => Promise<void>;
  onRecordCycleProgress?: (additionalMinutes: number) => Promise<void>;
  onResetCycleLap?: () => Promise<void>;
  onRecalculateCycle?: (baseSlotDuration?: number) => Promise<void>;
  onUpdateCycleBlock?: (blockId: string, partial: Partial<CycleBlock>) => Promise<void>;
  onRemoveCycle?: () => Promise<void>;
  onSaveCycle?: (cycle: StudyCycle) => void;
  onRemovePlan?: () => Promise<void>;
  onSavePlan?: (plan: StudyPlan) => void;
}

export const PlanoView: React.FC<PlanoViewProps> = ({
  plan,
  cycle,
  concursos,
  disciplinas,
  assuntos,
  sessoes = [],
  activeConcursoId,
  studyMethod = 'ciclo',
  onSwitchMethod,
  onRecalculatePlan,
  onAddSession,
  onUpdateSession,
  onDeleteSession,
  onRescheduleSession,
  onBatchRescheduleOverdue,
  onToggleSessionStatus,
  onOpenStudyTimer,
  onAdvanceCycle = async () => {},
  onRewindCycle = async () => {},
  onRecordCycleProgress = async () => {},
  onResetCycleLap = async () => {},
  onRecalculateCycle = async () => {},
  onUpdateCycleBlock = async () => {},
  onRemoveCycle,
  onNavigateTab,
  onSaveCycle,
  onRemovePlan,
  onSavePlan,
}) => {
  const { colorSkin, palette } = useTheme();
  const currentTheme = (
    colorSkin === 'purple' ? 'roxo' :
    colorSkin === 'orange' || colorSkin === 'dbz' ? 'laranja' :
    colorSkin || palette?.id || 'verde'
  ).toLowerCase();

  // Normaliza para minúsculo caso o estado retorne 'Verde', 'AZUL', etc.
  const themeKey = (currentTheme || 'verde').toLowerCase();

  // Seleciona a imagem correspondente ou usa 'verde' como fallback de segurança
  const bannerPlanoUrl = PLANO_ESTUDOS_BANNER_THEMES[themeKey] || PLANO_ESTUDOS_BANNER_THEMES.verde;

  // Cores e Glow dinâmicos do tema ativo para o título, botões e fallback visual do banner
  const themeGlowStyles = useMemo(() => {
    switch (currentTheme) {
      case 'roxo':
        return {
          color: '#8B5CF6',
          glow: 'rgba(139, 92, 246, 0.7)',
          glowSoft: 'rgba(139, 92, 246, 0.32)',
          fallbackGradient: 'radial-gradient(ellipse at 82% 40%, rgba(139, 92, 246, 0.38) 0%, rgba(76, 29, 149, 0.25) 45%, transparent 75%), linear-gradient(135deg, #090d16 0%, #1e103c 55%, #2e1065 100%)',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(167, 139, 250, 0.95), 0 0 18px rgba(139, 92, 246, 0.85), 0 0 32px rgba(124, 58, 237, 0.65)',
        };
      case 'laranja':
        return {
          color: '#FF6B00',
          glow: 'rgba(255, 107, 0, 0.7)',
          glowSoft: 'rgba(255, 107, 0, 0.32)',
          fallbackGradient: 'radial-gradient(ellipse at 82% 40%, rgba(255, 107, 0, 0.38) 0%, rgba(154, 52, 18, 0.25) 45%, transparent 75%), linear-gradient(135deg, #090d16 0%, #2a1205 55%, #431407 100%)',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(251, 146, 60, 0.95), 0 0 18px rgba(249, 115, 22, 0.85), 0 0 32px rgba(234, 88, 12, 0.65)',
        };
      case 'azul':
        return {
          color: '#3b82f6',
          glow: 'rgba(59, 130, 246, 0.65)',
          glowSoft: 'rgba(59, 130, 246, 0.28)',
          fallbackGradient: 'radial-gradient(ellipse at 82% 40%, rgba(59, 130, 246, 0.38) 0%, rgba(30, 58, 138, 0.25) 45%, transparent 75%), linear-gradient(135deg, #090d16 0%, #0f1f44 55%, #172554 100%)',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(96, 165, 250, 0.95), 0 0 18px rgba(37, 99, 235, 0.8), 0 0 32px rgba(29, 78, 216, 0.6)',
        };
      case 'rosa':
        return {
          color: '#ec4899',
          glow: 'rgba(236, 72, 153, 0.65)',
          glowSoft: 'rgba(236, 72, 153, 0.28)',
          fallbackGradient: 'radial-gradient(ellipse at 82% 40%, rgba(236, 72, 153, 0.38) 0%, rgba(131, 24, 67, 0.25) 45%, transparent 75%), linear-gradient(135deg, #090d16 0%, #2d0c20 55%, #500724 100%)',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(244, 114, 182, 0.95), 0 0 18px rgba(219, 39, 119, 0.8), 0 0 32px rgba(190, 24, 93, 0.6)',
        };
      case 'verde':
      default:
        return {
          color: '#10b981',
          glow: 'rgba(16, 185, 129, 0.65)',
          glowSoft: 'rgba(16, 185, 129, 0.28)',
          fallbackGradient: 'radial-gradient(ellipse at 82% 40%, rgba(16, 185, 129, 0.35) 0%, rgba(6, 78, 59, 0.25) 45%, transparent 75%), linear-gradient(135deg, #090d16 0%, #052e24 55%, #064e3b 100%)',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(52, 211, 153, 0.95), 0 0 18px rgba(16, 185, 129, 0.8), 0 0 32px rgba(5, 150, 105, 0.6)',
        };
    }
  }, [currentTheme]);

  const statusEmDiaThemeStyles = useMemo(() => {
    switch (currentTheme) {
      case 'azul':
        return 'bg-blue-100 dark:bg-blue-950/70 border-blue-300 dark:border-blue-700 !text-blue-950 dark:!text-blue-200';
      case 'rosa':
        return 'bg-pink-100 dark:bg-pink-950/70 border-pink-300 dark:border-pink-700 !text-pink-950 dark:!text-pink-200';
      case 'roxo':
        return 'bg-purple-100 dark:bg-purple-950/70 border-purple-300 dark:border-purple-700 !text-purple-950 dark:!text-purple-200';
      case 'laranja':
        return 'bg-amber-100 dark:bg-orange-950/70 border-amber-300 dark:border-orange-700 !text-amber-950 dark:!text-orange-200';
      case 'verde':
      default:
        return 'bg-emerald-100 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-700 !text-emerald-950 dark:!text-emerald-200';
    }
  }, [currentTheme]);

  const effectiveActiveConcursoId = useMemo(() => {
    return activeConcursoId || concursos.find(c => c.active)?.id || concursos[0]?.id || '';
  }, [activeConcursoId, concursos]);

  const activeConcurso = useMemo(() => {
    return concursos.find(c => c.id === effectiveActiveConcursoId) || concursos[0] || null;
  }, [concursos, effectiveActiveConcursoId]);

  const activeConcursoName = useMemo(() => {
    if (!activeConcurso) return 'o concurso ativo';
    const organ = (activeConcurso.organ || activeConcurso.orgao || activeConcurso.nome || '').trim();
    const role = (activeConcurso.role || activeConcurso.cargo || '').trim();
    if (activeConcurso.title) return activeConcurso.title;
    if (organ && role) return `${organ} - ${role}`;
    return organ || role || 'o concurso ativo';
  }, [activeConcurso]);

  const activeDisciplinas = useMemo(() => {
    if (!effectiveActiveConcursoId) return disciplinas;
    return disciplinas.filter(d => d.concursoId === effectiveActiveConcursoId);
  }, [disciplinas, effectiveActiveConcursoId]);

  const activeAssuntos = useMemo(() => {
    const discIds = new Set(activeDisciplinas.map(d => d.id));
    return assuntos.filter(a => discIds.has(a.disciplinaId));
  }, [assuntos, activeDisciplinas]);

  // Leitura síncrona imediata do localStorage para o concurso ativo
  const readStoredCycle = (targetConcursoId: string): StudyCycle | null => {
    if (!targetConcursoId) return null;
    try {
      const raw = localStorage.getItem(`gabarita_ciclo_estudos_${targetConcursoId}`) ||
                  localStorage.getItem(`gabarita_ciclo_${targetConcursoId}`) ||
                  localStorage.getItem(`gabarita_study_cycle_${targetConcursoId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.blocks) && parsed.blocks.length > 0 && (!parsed.concursoId || parsed.concursoId === targetConcursoId)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Erro ao ler ciclo do concurso ativo no localStorage:', e);
    }
    return null;
  };

  const [currentCycle, setCurrentCycle] = useState<StudyCycle | null>(() => {
    if (cycle && cycle.concursoId === effectiveActiveConcursoId && cycle.blocks && cycle.blocks.length > 0) {
      return cycle;
    }
    return readStoredCycle(effectiveActiveConcursoId);
  });

  // Carrega o ciclo estritamente quando o concurso ativo muda
  useEffect(() => {
    if (!effectiveActiveConcursoId) {
      setCurrentCycle(null);
      return;
    }

    try {
      const stored = readStoredCycle(effectiveActiveConcursoId);
      if (stored) {
        setCurrentCycle(stored);
        return;
      }

      DatabaseService.getStudyCycle(effectiveActiveConcursoId).then((c) => {
        if (c && c.concursoId === effectiveActiveConcursoId && c.blocks && c.blocks.length > 0) {
          setCurrentCycle(c);
        } else {
          setCurrentCycle(null);
        }
      }).catch((err) => {
        console.error("Erro ao buscar ciclo no DatabaseService:", err);
        setCurrentCycle(null);
      });
    } catch (err) {
      console.error("Erro ao carregar ciclo:", err);
      setCurrentCycle(null);
    }
  }, [effectiveActiveConcursoId]);

  // Sincroniza sempre que a prop cycle recebida for atualizada (apenas se for do concurso ativo)
  useEffect(() => {
    if (cycle) {
      if (cycle.concursoId === effectiveActiveConcursoId) {
        setCurrentCycle(cycle);
      } else if (!effectiveActiveConcursoId) {
        setCurrentCycle(cycle);
      } else {
        setCurrentCycle(null);
      }
    }
  }, [cycle, effectiveActiveConcursoId]);

  // Listener global para sincronização reativa imediata de novos ciclos
  useEffect(() => {
    const handleGlobalCycleUpdated = (e: Event) => {
      const customEvt = e as CustomEvent<StudyCycle>;
      if (customEvt.detail && (!effectiveActiveConcursoId || customEvt.detail.concursoId === effectiveActiveConcursoId)) {
        setCurrentCycle(customEvt.detail);
      }
    };
    window.addEventListener('gabarita_cycle_updated', handleGlobalCycleUpdated);
    return () => {
      window.removeEventListener('gabarita_cycle_updated', handleGlobalCycleUpdated);
    };
  }, [effectiveActiveConcursoId]);

  const [currentPlan, setCurrentPlan] = useState<StudyPlan | undefined>(() => {
    if (plan && (!effectiveActiveConcursoId || plan.concursoId === effectiveActiveConcursoId)) {
      return plan;
    }
    if (effectiveActiveConcursoId) {
      const saved = localStorage.getItem(`gabarita_study_plan_${effectiveActiveConcursoId}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return undefined;
        }
      }
    }
    return undefined;
  });

  useEffect(() => {
    if (plan && (!effectiveActiveConcursoId || plan.concursoId === effectiveActiveConcursoId)) {
      setCurrentPlan(plan);
      return;
    }
    if (effectiveActiveConcursoId) {
      const saved = localStorage.getItem(`gabarita_study_plan_${effectiveActiveConcursoId}`);
      if (saved) {
        try {
          setCurrentPlan(JSON.parse(saved));
          return;
        } catch {
          // ignore
        }
      }
    }
    setCurrentPlan(undefined);
  }, [plan, effectiveActiveConcursoId]);

  const effectivePlan: StudyPlan = useMemo(() => {
    const candidate = currentPlan || plan;
    if (candidate && (!effectiveActiveConcursoId || candidate.concursoId === effectiveActiveConcursoId)) {
      return candidate;
    }
    const resolvedTitle = activeConcurso
      ? `${activeConcurso.organ || activeConcurso.orgao || activeConcurso.title} - ${activeConcurso.role}`
      : concursos[0]?.title || '';
    return {
      id: `plan_${effectiveActiveConcursoId || 'fallback'}`,
      concursoId: effectiveActiveConcursoId || concursos[0]?.id || '',
      concursoTitle: resolvedTitle,
      userId: 'user_demo_01',
      startDate: new Date().toISOString().split('T')[0],
      targetExamDate: activeConcurso?.examDate ? activeConcurso.examDate.split('T')[0] : new Date(Date.now() + 86400000 * 90).toISOString().split('T')[0],
      dailyAverageMinutes: 0,
      totalWeeks: 12,
      totalPlannedHours: 0,
      weeklyAvailability: { seg: 0, ter: 0, qua: 0, qui: 0, sex: 0, sab: 0, dom: 0 },
      disciplinasDistribution: [],
      sessions: [],
      conflicts: [],
      historyLogs: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }, [currentPlan, plan, effectiveActiveConcursoId, activeConcurso, concursos]);

  const hasActiveCycleBlocks = Boolean(
    currentCycle &&
    (!effectiveActiveConcursoId || currentCycle.concursoId === effectiveActiveConcursoId) &&
    currentCycle.blocks &&
    currentCycle.blocks.length > 0
  );

  const hasActivePlanSessions = Boolean(
    effectivePlan &&
    (!effectiveActiveConcursoId || effectivePlan.concursoId === effectiveActiveConcursoId) &&
    effectivePlan.sessions &&
    effectivePlan.sessions.length > 0
  );

  const hasConfiguredStudyMethod = hasActiveCycleBlocks || hasActivePlanSessions;

  const [activeTab, setActiveTab] = useState<'ciclo' | 'cronograma'>(studyMethod === 'cronograma' ? 'cronograma' : 'ciclo');
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  const [isCreateCycleModalOpen, setIsCreateCycleModalOpen] = useState(false);
  const [isCreateScheduleModalOpen, setIsCreateScheduleModalOpen] = useState(false);
  const [isAddSessionModalOpen, setIsAddSessionModalOpen] = useState(false);
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<PlannedSession | null>(null);

  useEffect(() => {
    if (studyMethod) {
      setActiveTab(studyMethod === 'cronograma' ? 'cronograma' : 'ciclo');
    }
  }, [studyMethod]);

  const lastPromptedConcursoRef = useRef<string | null>(null);
  useEffect(() => {
    if (concursos.length === 0 || activeDisciplinas.length === 0) return;
    const cid = effectiveActiveConcursoId || 'default';
    try {
      if (sessionStorage.getItem('gabarita_open_method_modal') === 'true') {
        sessionStorage.removeItem('gabarita_open_method_modal');
        lastPromptedConcursoRef.current = cid;
        setIsMethodModalOpen(true);
        return;
      }
    } catch {}
    if (!hasConfiguredStudyMethod && lastPromptedConcursoRef.current !== cid) {
      lastPromptedConcursoRef.current = cid;
      setIsMethodModalOpen(true);
    } else if (hasConfiguredStudyMethod) {
      lastPromptedConcursoRef.current = cid;
    }
  }, [hasConfiguredStudyMethod, effectiveActiveConcursoId, concursos.length, activeDisciplinas.length]);

  const [formDisciplinaId, setFormDisciplinaId] = useState(disciplinas[0]?.id || '');
  const [formAssuntoId, setFormAssuntoId] = useState('');
  const [formAssuntoName, setFormAssuntoName] = useState('');
  const [formDate, setFormDate] = useState(PlannerService.formatLocalDate(new Date()));
  const [formStartTime, setFormStartTime] = useState('08:00');
  const [formDurationMinutes, setFormDurationMinutes] = useState(60);
  const [formType, setFormType] = useState<PlanSessionType>('teoria');
  const [formNotes, setFormNotes] = useState('');

  const [tempAvailability, setTempAvailability] = useState<WeeklyAvailability>({ ...effectivePlan.weeklyAvailability });
  const [tempExamDate, setTempExamDate] = useState(effectivePlan.targetExamDate);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const [currentClockDate, setCurrentClockDate] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentClockDate(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = useMemo(() => PlannerService.formatLocalDate(currentClockDate), [currentClockDate]);

  const metrics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const examDate = PlannerService.parseLocalDate(effectivePlan.targetExamDate);
    const daysUntilExam = Math.max(0, Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    const totalSessions = effectivePlan.sessions.length;
    const completedSessions = effectivePlan.sessions.filter(s => s.status === 'concluida' || PlannerService.isSessionStudied(s, sessoes)).length;
    const overdueSessionsList = PlannerService.getOverdueSessions(effectivePlan.sessions, todayStr, sessoes);
    const overdueSessions = overdueSessionsList.length;
    const todaySessions = effectivePlan.sessions.filter(s => s.date === todayStr);
    const weeklyMinutes = totalSessions > 0 ? Object.values(effectivePlan.weeklyAvailability).reduce((a, b) => a + b, 0) : 0;
    const weeklyHours = (weeklyMinutes / 60).toFixed(1);
    const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
    return {
      daysUntilExam,
      totalSessions,
      completedSessions,
      overdueSessions,
      todaySessionsCount: todaySessions.length,
      weeklyHours,
      weeklyMinutes,
      completionRate,
      conflictsCount: effectivePlan.conflicts.length,
    };
  }, [effectivePlan, todayStr, sessoes]);

  const handleOpenAddSession = (presetDate?: string) => {
    setFormDisciplinaId(disciplinas[0]?.id || '');
    setFormAssuntoId('');
    setFormAssuntoName('');
    setFormDate(presetDate || todayStr);
    setFormStartTime('08:00');
    setFormDurationMinutes(60);
    setFormType('teoria');
    setFormNotes('');
    setEditingSession(null);
    setIsAddSessionModalOpen(true);
  };

  const handleOpenEditSession = (session: PlannedSession) => {
    setEditingSession(session);
    setFormDisciplinaId(session.disciplinaId);
    setFormAssuntoId(session.assuntoId || '');
    setFormAssuntoName(session.assuntoName || '');
    setFormDate(session.date);
    setFormStartTime(session.startTime || '08:00');
    setFormDurationMinutes(session.durationMinutes);
    setFormType(session.type);
    setFormNotes(session.notes || '');
    setIsAddSessionModalOpen(true);
  };

  const handleSaveSessionForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const disc = disciplinas.find(d => d.id === formDisciplinaId);
    if (!disc) return;
    setIsSubmitting(true);
    try {
      const parsedDate = PlannerService.parseLocalDate(formDate);
      const dayOfWeek = PlannerService.getDayOfWeekFromDate(parsedDate);
      const topicMatch = assuntos.find(a => a.id === formAssuntoId);
      const assuntoLabel = formAssuntoName.trim() || topicMatch?.name || 'Tópico Geral';

      if (editingSession) {
        await onUpdateSession(editingSession.id, {
          disciplinaId: disc.id,
          disciplinaName: disc.name,
          disciplinaColor: disc.color,
          assuntoId: formAssuntoId || undefined,
          assuntoName: assuntoLabel,
          date: formDate,
          dayOfWeek,
          startTime: formStartTime,
          durationMinutes: Number(formDurationMinutes),
          type: formType,
          notes: formNotes,
        });
        showFeedback('success', 'Sessão atualizada com sucesso!');
      } else {
        await onAddSession({
          planId: effectivePlan.id,
          concursoId: effectivePlan.concursoId,
          disciplinaId: disc.id,
          disciplinaName: disc.name,
          disciplinaColor: disc.color,
          assuntoId: formAssuntoId || undefined,
          assuntoName: assuntoLabel,
          date: formDate,
          dayOfWeek,
          startTime: formStartTime,
          durationMinutes: Number(formDurationMinutes),
          type: formType,
          status: formDate < todayStr ? 'atrasada' : 'pendente',
          notes: formNotes,
          order: 99,
        });
        showFeedback('success', 'Nova sessão agendada!');
      }
      setIsAddSessionModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler para escolha de método no Modal de Setup
  const handleSelectMethod = async (newMethod: StudyMethod) => {
    setIsMethodModalOpen(false);
    await DatabaseService.setStudyMethod(newMethod);
    if (onSwitchMethod) {
      await onSwitchMethod(newMethod);
    }
    if (newMethod === 'ciclo') {
      setIsCreateCycleModalOpen(true);
    } else {
      setIsCreateScheduleModalOpen(true);
    }
  };

  const handleCycleCreated = async (newCycle: StudyCycle) => {
    setCurrentCycle(newCycle);
    if (onSaveCycle) {
      onSaveCycle(newCycle);
    }
    if (onRecalculateCycle) {
      await onRecalculateCycle();
    }
    setActiveTab('ciclo');
    if (onSwitchMethod) {
      await onSwitchMethod('ciclo');
    }
    showFeedback('success', 'Novo Ciclo de Estudos gerado e ativo com sucesso!');
  };

  const handleScheduleCreated = async (newPlan: StudyPlan) => {
    setCurrentPlan(newPlan);
    if (onSavePlan) {
      onSavePlan(newPlan);
    }
    setActiveTab('cronograma');
    if (onSwitchMethod) {
      await onSwitchMethod('cronograma');
    }
    showFeedback('success', 'Novo Cronograma gerado e integrado com sucesso!');
  };

  if (concursos.length === 0) {
    return (
      <EmptyContestState
        title="Você ainda não possui um concurso ativo"
        description="Cadastre seu concurso foco e importe o conteúdo programático do edital com auxílio da IA para liberar a montagem do seu Ciclo de Estudos e Cronograma Semanal."
        actionText="Cadastrar Concurso Foco"
        onAction={() => onNavigateTab ? onNavigateTab('concursos') : null}
      />
    );
  }

  if (activeDisciplinas.length === 0) {
    return (
      <EmptyContestState
        title="Nenhuma disciplina cadastrada no concurso ativo"
        description="Extraia as disciplinas do edital com IA ou adicione manualmente no menu 'Concursos & Provas' para iniciar o Ciclo de Estudos."
        actionText="Importar Matérias do Concurso"
        onAction={() => onNavigateTab ? onNavigateTab('concursos') : null}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {feedback && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-xl">
          {feedback.message}
        </div>
      )}

      {/* =========================================================================
          1. BANNER PRINCIPAL DE DESTAQUE (TOPO DO PLANO DE ESTUDOS)
          ========================================================================= */}
      <MenuBannerFrame
        bannerThemes={PLANO_ESTUDOS_BANNER_THEMES}
        alt="Banner Plano de Estudos"
        minHeight="min-h-[190px] md:min-h-[220px]"
        className="w-full border border-slate-200/20 dark:border-slate-800 shadow-xl flex items-center bg-slate-950"
        bgWrapperClassName="absolute -inset-4 overflow-hidden pointer-events-none select-none z-0"
        imgClassName="w-full h-full object-cover object-[78%_center] scale-[1.36] md:scale-[1.40] origin-[78%_center] transition-transform duration-300"
        overlayClassName="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/45 to-transparent pointer-events-none"
        contentClassName="p-6 md:p-8 flex flex-col justify-center max-w-2xl h-full gap-4"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1
              className="provas-banner-title text-2xl md:text-3xl font-extrabold !text-white tracking-tight leading-tight select-none drop-shadow-md"
              style={{
                color: '#FFFFFF',
                textShadow: themeGlowStyles.textShadow,
              }}
            >
              Plano de Estudos
            </h1>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-black/50 text-white/95 border border-white/20 backdrop-blur-md shadow-xs shrink-0">
              {activeTab === 'ciclo' ? 'Ciclo de Estudos' : 'Cronograma Semanal'}
            </span>
          </div>

          <p className="text-white/90 text-xs md:text-sm leading-relaxed max-w-lg">
            Selecione entre rotação contínua proporcional por pesos ou grade semanal fixa para manter seu ritmo de aprovação.
          </p>
        </div>

        <div className="pt-1 flex items-center gap-3 flex-wrap">
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              if (activeTab === 'ciclo') {
                setIsCreateCycleModalOpen(true);
              } else {
                handleOpenAddSession();
              }
            }}
            leftIcon={<Plus className="w-4 h-4" />}
            className="font-bold shadow-lg shadow-black/25 cursor-pointer text-xs md:text-sm px-5 py-2.5"
          >
            {activeTab === 'ciclo' ? 'Novo Ciclo' : 'Nova Sessão'}
          </Button>

          <button
            type="button"
            ref={(el) => {
              if (el) {
                el.style.setProperty('background-color', '#000000', 'important');
                el.style.setProperty('color', '#ffffff', 'important');
                el.style.setProperty('border-color', 'rgba(255, 255, 255, 0.3)', 'important');
              }
            }}
            onClick={() => setIsMethodModalOpen(true)}
            className="btn-banner-secundario inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold bg-black hover:bg-neutral-900 text-white border border-white/25 transition-all cursor-pointer shadow-lg shadow-black/25"
            style={{ backgroundColor: '#000000', color: '#ffffff' }}
          >
            <Sliders className="w-4 h-4" style={{ color: themeGlowStyles.color }} />
            <span>Replanejar Método</span>
          </button>
        </div>
      </MenuBannerFrame>

      {/* Dois Grandes Cards Seletores (Banners de Modo) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card 1: CICLO DE ESTUDOS */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('ciclo');
            if (onSwitchMethod) onSwitchMethod('ciclo');
          }}
          className={`card-seletor-modo relative overflow-hidden rounded-2xl p-4 sm:p-5 text-left transition-all duration-300 cursor-pointer flex items-center justify-between gap-4 group ${
            activeTab === 'ciclo'
              ? 'bg-gradient-to-r from-primary via-primary-600 to-primary-700 text-white shadow-lg shadow-primary/20 border border-transparent'
              : 'bg-white hover:bg-slate-50 dark:bg-slate-900/60 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 shadow-xs text-slate-800 dark:text-slate-200'
          }`}
          style={activeTab === 'ciclo' ? {
            background: `linear-gradient(135deg, ${palette.primaryHover || palette.primary} 0%, ${palette.primary} 50%, ${palette.secondary || palette.primary} 100%)`,
            boxShadow: `0 10px 25px -5px ${palette.glowColor || `${palette.primary}40`}`
          } : undefined}
        >
          {/* Efeito decorativo de fundo translúcido para o card ativo */}
          {activeTab === 'ciclo' && (
            <div className="absolute -right-4 -bottom-4 w-28 h-28 rounded-full bg-white/10 pointer-events-none blur-[1px]" />
          )}

          <div className="relative z-10 flex items-center gap-4 min-w-0">
            {/* Container do Ícone à esquerda */}
            <div 
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 card-seletor-icon ${
                activeTab === 'ciclo'
                  ? 'bg-white/20 backdrop-blur-sm border border-white/30 card-seletor-icon-active'
                  : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {activeTab === 'ciclo' ? (
                <RotateCw className="w-6 h-6 text-white stroke-[2.2]" />
              ) : (
                <RotateCw className="text-slate-500 dark:text-slate-400 w-6 h-6 stroke-[2]" />
              )}
            </div>

            <div className="min-w-0">
              <h3 className={`text-sm sm:text-base font-bold tracking-wide ${
                activeTab === 'ciclo' ? 'text-white' : 'text-slate-800 dark:text-slate-200'
              }`}>
                CICLO DE ESTUDOS
              </h3>
              <p className={`text-xs font-medium leading-relaxed mt-0.5 ${
                activeTab === 'ciclo' ? 'text-white/90' : 'text-slate-500 dark:text-slate-400'
              }`}>
                Estude de forma inteligente, com base no seu desempenho e nas prioridades.
              </p>
            </div>
          </div>

          <div className="relative z-10 shrink-0 pl-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all group-hover:translate-x-0.5 ${
              activeTab === 'ciclo' 
                ? 'bg-white/20 border border-white/30 text-white' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
            }`}>
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        </button>

        {/* Card 2: CRONOGRAMA */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('cronograma');
            if (onSwitchMethod) onSwitchMethod('cronograma');
          }}
          className={`card-seletor-modo relative overflow-hidden rounded-2xl p-4 sm:p-5 text-left transition-all duration-300 cursor-pointer flex items-center justify-between gap-4 group ${
            activeTab === 'cronograma'
              ? 'bg-gradient-to-r from-primary via-primary-600 to-primary-700 text-white shadow-lg shadow-primary/20 border border-transparent'
              : 'bg-white hover:bg-slate-50 dark:bg-slate-900/60 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 shadow-xs text-slate-800 dark:text-slate-200'
          }`}
          style={activeTab === 'cronograma' ? {
            background: `linear-gradient(135deg, ${palette.primaryHover || palette.primary} 0%, ${palette.primary} 50%, ${palette.secondary || palette.primary} 100%)`,
            boxShadow: `0 10px 25px -5px ${palette.glowColor || `${palette.primary}40`}`
          } : undefined}
        >
          {/* Efeito decorativo de fundo translúcido para o card ativo */}
          {activeTab === 'cronograma' && (
            <div className="absolute -right-4 -bottom-4 w-28 h-28 rounded-full bg-white/10 pointer-events-none blur-[1px]" />
          )}

          <div className="relative z-10 flex items-center gap-4 min-w-0">
            {/* Container do Ícone à esquerda */}
            <div 
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 card-seletor-icon ${
                activeTab === 'cronograma'
                  ? 'bg-white/20 backdrop-blur-sm border border-white/30 card-seletor-icon-active'
                  : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {activeTab === 'cronograma' ? (
                <Calendar className="w-6 h-6 text-white stroke-[2.2]" />
              ) : (
                <Calendar className="text-slate-500 dark:text-slate-400 w-6 h-6 stroke-[2]" />
              )}
            </div>

            <div className="min-w-0">
              <h3 className={`text-sm sm:text-base font-bold tracking-wide ${
                activeTab === 'cronograma' ? 'text-white' : 'text-slate-800 dark:text-slate-200'
              }`}>
                CRONOGRAMA
              </h3>
              <p className={`text-xs font-medium leading-relaxed mt-0.5 ${
                activeTab === 'cronograma' ? 'text-white/90' : 'text-slate-500 dark:text-slate-400'
              }`}>
                Veja seu plano de estudos, organize seu tempo e mantenha o foco.
              </p>
            </div>
          </div>

          <div className="relative z-10 shrink-0 pl-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all group-hover:translate-x-0.5 ${
              activeTab === 'cronograma' 
                ? 'bg-white/20 border border-white/30 text-white' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
            }`}>
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        </button>
      </div>

      {/* Conteúdo da Aba Ativa */}
      {activeTab === 'ciclo' ? (
        <CicloView
          cycle={currentCycle || cycle || {
            id: `cycle_${effectiveActiveConcursoId}`,
            userId: 'user',
            concursoId: effectiveActiveConcursoId || '',
            concursoTitle: activeConcurso ? `${activeConcurso.organ || activeConcurso.orgao || activeConcurso.title} - ${activeConcurso.role}` : 'Plano Personalizado',
            currentBlockIndex: 0,
            completedCyclesCount: 0,
            totalCycleMinutes: 0,
            blocks: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }}
          disciplinas={activeDisciplinas}
          assuntos={activeAssuntos}
          activeConcursoId={effectiveActiveConcursoId}
          concursos={concursos}
          onAdvanceCycle={onAdvanceCycle}
          onRewindCycle={onRewindCycle}
          onRecordCycleProgress={onRecordCycleProgress}
          onResetCycleLap={onResetCycleLap}
          onRecalculateCycle={onRecalculateCycle}
          onUpdateCycleBlock={onUpdateCycleBlock}
          onOpenStudyTimer={onOpenStudyTimer}
          onSaveNewCycle={async (newC) => {
            setCurrentCycle(newC);
            if (onSaveCycle) onSaveCycle(newC);
          }}
          onSwitchMethod={onSwitchMethod}
          onRemoveCycle={async () => {
            if (onRemoveCycle) await onRemoveCycle();
            const cleared = await DatabaseService.removeStudyCycle();
            setCurrentCycle(cleared);
            if (onSaveCycle) onSaveCycle(cleared);
          }}
          onReplan={() => setIsMethodModalOpen(true)}
        />
      ) : (
        <div className="space-y-6">
          {/* Header do Cronograma Fixo */}
          <div className="flashcards-daily-review-card relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/25 dark:border-primary/20 shadow-xs space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-[var(--primary-light)] text-[var(--primary-color)] dark:text-[var(--primary-text-dark)] border border-[var(--primary-light-border)]">
                    <CalendarClock className="w-6 h-6" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">
                        Cronograma Fixo de Estudos
                      </h1>
                      <Badge variant="sky" size="sm">{effectivePlan.concursoTitle || 'Concurso Foco'}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Grade semanal e distribuição em calendário com horários e dias fixos.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateScheduleModalOpen(true)}
                  leftIcon={<RefreshCw className="w-4 h-4 text-[var(--primary-color)] dark:text-[var(--primary-text-dark)]" />}
                  className="cursor-pointer bg-white/80 dark:bg-slate-900/80"
                >
                  Recalcular
                </Button>
              </div>
            </div>

            {/* Métricas do Cronograma */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-primary/15 dark:border-primary/20 text-xs">
              <div className="p-3 bg-white/80 dark:bg-slate-900/70 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <span className="text-slate-400 font-medium block text-[11px]">Contagem Regressiva</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono">{metrics.daysUntilExam}</span>
                  <span className="text-slate-500 text-xs font-semibold">dias para a prova</span>
                </div>
              </div>
              <div className="p-3 bg-white/80 dark:bg-slate-900/70 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <span className="text-slate-400 font-medium block text-[11px]">Carga Semanal</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{metrics.weeklyHours}h</span>
                  <span className="text-slate-500 text-xs font-semibold">/ semana</span>
                </div>
              </div>
              <div className="p-3 bg-white/80 dark:bg-slate-900/70 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <span className="text-slate-400 font-medium block text-[11px]">Progresso do Plano</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-black text-[var(--primary-color)] dark:text-[var(--primary-text-dark)] font-mono">{metrics.completionRate}%</span>
                  <span className="text-slate-500 text-xs font-semibold">({metrics.completedSessions}/{metrics.totalSessions})</span>
                </div>
              </div>
              <div className="p-3 bg-white/80 dark:bg-slate-900/70 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <span className="text-slate-400 font-medium block text-[11px]">Status</span>
                <div className="flex items-center gap-1.5 mt-1">
                  {metrics.overdueSessions > 0 ? (
                    <Badge variant="rose" size="sm">{metrics.overdueSessions} atrasada(s)</Badge>
                  ) : (
                    <Badge
                      variant="primary"
                      size="sm"
                      className={`font-bold theme-primary-badge-darker ${statusEmDiaThemeStyles}`}
                    >
                      Em dia
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Visualização de Calendário Executível */}
          <CalendarView
            plan={effectivePlan}
            disciplinas={activeDisciplinas}
            assuntos={activeAssuntos}
            sessoes={sessoes}
            concursos={concursos}
            onRescheduleSession={onRescheduleSession}
            onBatchRescheduleOverdue={onBatchRescheduleOverdue}
            onToggleSessionStatus={onToggleSessionStatus}
            onOpenStudyTimer={onOpenStudyTimer}
            onOpenEditSession={handleOpenEditSession}
            onOpenAddSession={handleOpenAddSession}
            onDeleteSession={onDeleteSession}
            onUpdateSession={onUpdateSession}
            onSwitchMethod={handleSelectMethod}
            onPlanCreated={handleScheduleCreated}
            onNavigateTab={onNavigateTab}
            onOpenCreateSchedule={() => setIsCreateScheduleModalOpen(true)}
            onRemovePlan={async () => {
              if (onRemovePlan) await onRemovePlan();
              const cleared = await DatabaseService.removeStudyPlan(effectiveActiveConcursoId);
              setCurrentPlan(cleared);
              if (onSavePlan) onSavePlan(cleared);
              showFeedback('success', 'Cronograma excluído com sucesso!');
            }}
          />
        </div>
      )}

      {/* Modal: Adicionar/Editar Sessão */}
      <Modal
        isOpen={isAddSessionModalOpen}
        onClose={() => setIsAddSessionModalOpen(false)}
        title={editingSession ? "Editar Sessão" : "Nova Sessão de Estudos"}
        maxWidth="md"
      >
        <form onSubmit={handleSaveSessionForm} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold mb-1">Disciplina *</label>
            <select
              value={formDisciplinaId}
              onChange={(e) => setFormDisciplinaId(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              required
            >
              {disciplinas.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-bold mb-1">Tópico</label>
            <input
              type="text"
              value={formAssuntoName}
              onChange={(e) => setFormAssuntoName(e.target.value)}
              placeholder="Ex: Licitações"
              className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1">Data *</label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                required
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Duração (min)</label>
              <select
                value={formDurationMinutes}
                onChange={(e) => setFormDurationMinutes(parseInt(e.target.value, 10))}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <option value={30}>30 min</option>
                <option value={60}>60 min</option>
                <option value={90}>90 min</option>
                <option value={120}>120 min</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setIsAddSessionModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>Salvar</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Setup do Plano (Escolha Obrigatória de Método com os dois cards grandes) */}
      <MetodoEstudoModal
        isOpen={isMethodModalOpen}
        onClose={() => setIsMethodModalOpen(false)}
        currentMethod={activeTab}
        onSelectMethod={handleSelectMethod}
        title="Escolha Seu Metodo de Estudo"
        description="Selecione o método de estudo ideal para sua rotina antes de prosseguir com o planejamento."
      />

      {/* Modal: Criar / Replanejar Ciclo (Passos 1, 2 e 3) */}
      <CriarCicloModal
        isOpen={isCreateCycleModalOpen}
        onClose={() => setIsCreateCycleModalOpen(false)}
        disciplinas={disciplinas}
        currentCycle={currentCycle || cycle}
        assuntos={assuntos}
        activeConcursoId={effectiveActiveConcursoId}
        concursos={concursos}
        onCycleCreated={handleCycleCreated}
      />

      {/* Modal: Criar / Replanejar Cronograma (Passos 1, 2 e 3) */}
      <CriarCronogramaModal
        isOpen={isCreateScheduleModalOpen}
        onClose={() => setIsCreateScheduleModalOpen(false)}
        plan={effectivePlan}
        disciplinas={disciplinas}
        assuntos={assuntos}
        concursos={concursos}
        activeConcursoId={effectiveActiveConcursoId}
        onPlanCreated={handleScheduleCreated}
      />
    </div>
  );
};
