import React, { useState, useMemo, useEffect } from 'react';
import { 
  CalendarDays, 
  Calendar,
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Sliders, 
  BookOpen, 
  Clock, 
  Plus, 
  Minus, 
  AlertCircle,
  AlertTriangle,
  BarChart2
} from 'lucide-react';
import { 
  Disciplina, 
  Assunto, 
  StudyPlan, 
  WeeklyAvailability, 
  DayOfWeek, 
  DisciplinaAllocation, 
  Concurso 
} from '../../types';
import { Modal } from '../../design-system/Modal';
import { Button } from '../../design-system/Button';
import { Badge } from '../../design-system/Badge';
import { PlannerService } from '../../services/plannerService';
import { DatabaseService } from '../../services/db';
import { useTheme } from '../../contexts/ThemeContext';

export interface CriarCronogramaModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: StudyPlan;
  disciplinas: Disciplina[];
  assuntos?: Assunto[];
  concursos?: Concurso[];
  activeConcursoId?: string;
  onPlanCreated: (newPlan: StudyPlan) => Promise<void>;
}

interface DayConfig {
  id: DayOfWeek;
  label: string;
  name: string;
  enabled: boolean;
  hours: number;
}

type StartDateOption = 'hoje' | 'amanha' | 'outro';
type EndDateOption = 'vespera' | 'custom' | 'sem_termino';

const SHORT_WEEKDAYS_PT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const FULL_WEEKDAYS_PT = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
];
const SHORT_MONTHS_PT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const FULL_MONTHS_PT = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

function addDaysToDateStr(dateStr: string, days: number): string {
  const dt = PlannerService.parseLocalDate(dateStr);
  dt.setDate(dt.getDate() + days);
  return PlannerService.formatLocalDate(dt);
}

function formatCardShortDate(dateStr: string): string {
  if (!dateStr) return '';
  const dt = PlannerService.parseLocalDate(dateStr);
  const wd = SHORT_WEEKDAYS_PT[dt.getDay()] || '';
  const day = dt.getDate();
  const month = SHORT_MONTHS_PT[dt.getMonth()] || '';
  return `${wd}, ${day} ${month}`;
}

function formatFullExamDateBanner(dateStr: string): string {
  if (!dateStr) return '';
  const dt = PlannerService.parseLocalDate(dateStr);
  const wd = FULL_WEEKDAYS_PT[dt.getDay()] || '';
  const day = dt.getDate();
  const month = FULL_MONTHS_PT[dt.getMonth()] || '';
  return `${wd}, ${day} de ${month}`;
}

function formatSummaryPillDate(dateStr: string): string {
  if (!dateStr) return '';
  const dt = PlannerService.parseLocalDate(dateStr);
  const day = String(dt.getDate()).padStart(2, '0');
  const month = SHORT_MONTHS_PT[dt.getMonth()] || '';
  const year = dt.getFullYear();
  const currentYear = new Date().getFullYear();
  return year !== currentYear ? `${day} de ${month}. de ${year}` : `${day} de ${month}.`;
}

function formatStudyHoursCompact(hours: number): string {
  const totalMins = Math.round(hours * 60);
  if (totalMins <= 0) return '0h';
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${m}m`;
}

function formatStudyHoursLabel(hours: number): string {
  const totalMins = Math.round(hours * 60);
  if (totalMins <= 0) return '0h';
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h === 0) return `${m} minutos`;
  if (m === 0) return `${h} ${h === 1 ? 'hora' : 'horas'}`;
  return `${h}h e ${m}min`;
}

export const CriarCronogramaModal: React.FC<CriarCronogramaModalProps> = ({
  isOpen,
  onClose,
  plan,
  disciplinas,
  assuntos = [],
  concursos = [],
  activeConcursoId,
  onPlanCreated,
}) => {
  const { palette } = useTheme();
  const primaryColor = palette?.primary || '#10b981';

  const todayStr = useMemo(() => PlannerService.formatLocalDate(new Date()), []);
  const tomorrowStr = useMemo(() => addDaysToDateStr(todayStr, 1), [todayStr]);

  // Concurso ativo resolvido
  const resolvedActiveConcursoId = useMemo(() => {
    if (activeConcursoId) return activeConcursoId;
    if (concursos && concursos.length > 0) {
      const active = concursos.find(c => c.active);
      if (active) return active.id;
      return concursos[0].id;
    }
    if (plan?.concursoId) return plan.concursoId;
    return disciplinas[0]?.concursoId || '';
  }, [activeConcursoId, concursos, plan, disciplinas]);

  const activeConcurso = useMemo(() => {
    if (!concursos || concursos.length === 0) return undefined;
    return concursos.find(c => c.id === resolvedActiveConcursoId) || concursos.find(c => c.active) || concursos[0];
  }, [concursos, resolvedActiveConcursoId]);

  const examDateStr = useMemo(() => {
    const raw =
      activeConcurso?.examDate ||
      activeConcurso?.dataProva ||
      (activeConcurso as any)?.data_prova ||
      '';
    if (!raw) return '';
    const clean = String(raw).includes('T') ? String(raw).split('T')[0] : String(raw).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(clean) ? clean : '';
  }, [activeConcurso]);

  // Verifica se o concurso possui data de prova FUTURA (estritamente após hoje)
  const hasFutureExamDate = useMemo(() => {
    return Boolean(examDateStr && examDateStr > todayStr);
  }, [examDateStr, todayStr]);

  // Véspera da prova (1 dia antes da prova)
  const examEveDateStr = useMemo(() => {
    if (!hasFutureExamDate || !examDateStr) return '';
    const eve = addDaysToDateStr(examDateStr, -1);
    return eve >= todayStr ? eve : examDateStr;
  }, [hasFutureExamDate, examDateStr, todayStr]);

  // Filtro estrito de disciplinas pelo concurso ativo
  const materiasDoConcursoAtivo = useMemo(() => {
    if (!resolvedActiveConcursoId) {
      const firstConcursoId = disciplinas.find(d => d.concursoId)?.concursoId;
      if (firstConcursoId) {
        return disciplinas.filter(d => d.concursoId === firstConcursoId);
      }
      return disciplinas;
    }
    return disciplinas.filter(d => d.concursoId === resolvedActiveConcursoId);
  }, [disciplinas, resolvedActiveConcursoId]);

  // Stepper com 4 passos: 1. Disciplinas | 2. Relevância | 3. Horários | 4. Período
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Passo 1: Seleção de Disciplinas Reais
  const [selectedDisciplinaIds, setSelectedDisciplinaIds] = useState<string[]>(() => {
    if (plan?.disciplinasDistribution && plan.disciplinasDistribution.length > 0 && plan.concursoId === resolvedActiveConcursoId) {
      const existingIds = plan.disciplinasDistribution.map(d => d.disciplinaId);
      const valid = existingIds.filter(id => materiasDoConcursoAtivo.some(m => m.id === id));
      if (valid.length > 0) return valid;
    }
    return materiasDoConcursoAtivo.map(d => d.id);
  });

  // Passo 2: Relevância com Sliders Reais de Importância (1 a 5) e Conhecimento (1 a 5)
  const [relevancias, setRelevancias] = useState<Record<string, { importancia: number; conhecimento: number }>>(() => {
    const initial: Record<string, { importancia: number; conhecimento: number }> = {};
    materiasDoConcursoAtivo.forEach((d) => {
      initial[d.id] = {
        importancia: Math.min(5, Math.max(1, Math.round(d.weight || 3))),
        conhecimento: 3,
      };
    });
    return initial;
  });

  // Passo 3: Horários (Checkboxes de DOM a SÁB com seletor numérico de incremento/decremento + e - de 30 em 30 min)
  const [daysConfig, setDaysConfig] = useState<DayConfig[]>(() => {
    const currentAvail = plan?.weeklyAvailability || {
      dom: 180,
      seg: 240,
      ter: 240,
      qua: 240,
      qui: 240,
      sex: 240,
      sab: 240,
    };

    const daysOrder: { id: DayOfWeek; label: string; name: string }[] = [
      { id: 'dom', label: 'DOM', name: 'Domingo' },
      { id: 'seg', label: 'SEG', name: 'Segunda-feira' },
      { id: 'ter', label: 'TER', name: 'Terça-feira' },
      { id: 'qua', label: 'QUA', name: 'Quarta-feira' },
      { id: 'qui', label: 'QUI', name: 'Quinta-feira' },
      { id: 'sex', label: 'SEX', name: 'Sexta-feira' },
      { id: 'sab', label: 'SÁB', name: 'Sábado' },
    ];

    return daysOrder.map(d => {
      const mins = currentAvail[d.id] || 0;
      const hoursFromMins = Math.max(0.5, Math.round(mins / 30) * 0.5);
      return {
        ...d,
        enabled: mins > 0 || (d.id !== 'dom'),
        hours: mins > 0 ? hoursFromMins : 3,
      };
    });
  });

  // Configuração de Faixa de Tempo por Bloco de Estudo (Mínimo e Máximo)
  const [minBlockDuration, setMinBlockDuration] = useState<number>(30);
  const [maxBlockDuration, setMaxBlockDuration] = useState<number>(60);

  const DURATION_OPTIONS = [15, 20, 25, 30, 40, 45, 50, 60, 75, 90, 120];

  // Passo 4: Período ("Quando começa e até quando vai?")
  const [startDateOption, setStartDateOption] = useState<StartDateOption>('hoje');
  const [customStartDate, setCustomStartDate] = useState<string>(() => addDaysToDateStr(todayStr, 2));
  const [endDateOption, setEndDateOption] = useState<EndDateOption>(() =>
    hasFutureExamDate ? 'vespera' : 'custom'
  );
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    if (hasFutureExamDate && examEveDateStr) return examEveDateStr;
    return addDaysToDateStr(todayStr, 90);
  });

  const handleMinChange = (val: number) => {
    setMinBlockDuration(val);
    if (val > maxBlockDuration) {
      setMaxBlockDuration(val);
    }
  };

  const handleMaxChange = (val: number) => {
    if (val < minBlockDuration) {
      setMinBlockDuration(val);
    }
    setMaxBlockDuration(val);
  };

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setErrorMessage(null);
      setIsSaving(false);
      setStartDateOption('hoje');
      setCustomStartDate(addDaysToDateStr(todayStr, 2));
      setEndDateOption(hasFutureExamDate ? 'vespera' : 'custom');
      setCustomEndDate(
        hasFutureExamDate && examEveDateStr
          ? examEveDateStr
          : addDaysToDateStr(todayStr, 90)
      );

      if (plan?.disciplinasDistribution && plan.disciplinasDistribution.length > 0 && plan.concursoId === resolvedActiveConcursoId) {
        const existingIds = plan.disciplinasDistribution.map(d => d.disciplinaId);
        const valid = existingIds.filter(id => materiasDoConcursoAtivo.some(m => m.id === id));
        if (valid.length > 0) {
          setSelectedDisciplinaIds(valid);
        } else {
          setSelectedDisciplinaIds(materiasDoConcursoAtivo.map(d => d.id));
        }
      } else {
        setSelectedDisciplinaIds(materiasDoConcursoAtivo.map(d => d.id));
      }
    }
  }, [isOpen, plan, resolvedActiveConcursoId, materiasDoConcursoAtivo, hasFutureExamDate, examEveDateStr, todayStr]);

  // Data de início resolvida
  const resolvedStartDateStr = useMemo(() => {
    if (startDateOption === 'hoje') return todayStr;
    if (startDateOption === 'amanha') return tomorrowStr;
    const cleanCustom = customStartDate ? customStartDate.trim() : '';
    return /^\d{4}-\d{2}-\d{2}$/.test(cleanCustom) ? cleanCustom : todayStr;
  }, [startDateOption, todayStr, tomorrowStr, customStartDate]);

  // Limite máximo de 1 ano (365 dias) a partir da data de início
  const maxOneYearEndDateStr = useMemo(() => {
    return addDaysToDateStr(resolvedStartDateStr, 365);
  }, [resolvedStartDateStr]);

  // Garante que customEndDate nunca fique antes de resolvedStartDateStr nem acima de 1 ano
  useEffect(() => {
    if (customEndDate < resolvedStartDateStr) {
      setCustomEndDate(addDaysToDateStr(resolvedStartDateStr, 30));
    } else if (customEndDate > maxOneYearEndDateStr) {
      setCustomEndDate(maxOneYearEndDateStr);
    }
  }, [resolvedStartDateStr, maxOneYearEndDateStr, customEndDate]);

  // Data de término resolvida
  const resolvedEndDateStr = useMemo(() => {
    if (endDateOption === 'vespera' && hasFutureExamDate && examEveDateStr) {
      return examEveDateStr >= resolvedStartDateStr ? examEveDateStr : resolvedStartDateStr;
    }
    if (endDateOption === 'sem_termino') {
      return maxOneYearEndDateStr;
    }
    if (!customEndDate || customEndDate < resolvedStartDateStr) {
      return addDaysToDateStr(resolvedStartDateStr, 30);
    }
    return customEndDate > maxOneYearEndDateStr ? maxOneYearEndDateStr : customEndDate;
  }, [endDateOption, hasFutureExamDate, examEveDateStr, resolvedStartDateStr, maxOneYearEndDateStr, customEndDate]);

  // Cálculo de dias e semanas do período selecionado
  const periodMetrics = useMemo(() => {
    const startObj = PlannerService.parseLocalDate(resolvedStartDateStr);
    const endObj = PlannerService.parseLocalDate(resolvedEndDateStr);
    const totalDays = Math.max(1, Math.round((endObj.getTime() - startObj.getTime()) / 86400000) + 1);
    const totalWeeks = Math.max(1, Math.ceil(totalDays / 7));
    const exceedsExamDate = Boolean(
      hasFutureExamDate &&
      examDateStr &&
      endDateOption !== 'vespera' &&
      resolvedEndDateStr >= examDateStr
    );
    return {
      totalDays,
      totalWeeks,
      exceedsExamDate,
    };
  }, [resolvedStartDateStr, resolvedEndDateStr, hasFutureExamDate, examDateStr, endDateOption]);

  // Manipulação de Seleção de Disciplinas (Passo 1)
  const toggleDisciplina = (discId: string) => {
    setSelectedDisciplinaIds(prev => {
      if (prev.includes(discId)) {
        return prev.filter(id => id !== discId);
      }
      return [...prev, discId];
    });
  };

  const selectAllDisciplinas = () => {
    setSelectedDisciplinaIds(materiasDoConcursoAtivo.map(d => d.id));
  };

  const clearSelection = () => {
    setSelectedDisciplinaIds([]);
  };

  // Manipulação de Relevância (Passo 2)
  const handleUpdateRelevancia = (
    discId: string, 
    field: 'importancia' | 'conhecimento', 
    value: number
  ) => {
    setRelevancias(prev => ({
      ...prev,
      [discId]: {
        ...(prev[discId] || { importancia: 3, conhecimento: 3 }),
        [field]: value,
      },
    }));
  };

  // Lógica Matemática do Passo 2: Calcula o percentual fechando em exatos 100.0%
  const calculatedDistribution = useMemo(() => {
    const selected = materiasDoConcursoAtivo.filter(d => selectedDisciplinaIds.includes(d.id));
    if (selected.length === 0) return [];

    const items = selected.map(d => {
      const rel = relevancias[d.id] || { importancia: 3, conhecimento: 3 };
      const imp = rel.importancia;
      const con = rel.conhecimento;
      const necessidade = 6 - con;
      const rawScore = imp * necessidade;
      return {
        disciplina: d,
        importancia: imp,
        conhecimento: con,
        score: rawScore,
        percentage: 0,
      };
    });

    const totalScore = items.reduce((acc, curr) => acc + curr.score, 0) || 1;

    let accumulatedSum = 0;
    const withPercentages = items.map(item => {
      const rawPct = (item.score / totalScore) * 100;
      const pct = Math.round(rawPct * 10) / 10;
      accumulatedSum += pct;
      return {
        ...item,
        percentage: pct,
      };
    });

    const diff = Number((100.0 - accumulatedSum).toFixed(1));
    if (diff !== 0 && withPercentages.length > 0) {
      let maxIdx = 0;
      for (let i = 1; i < withPercentages.length; i++) {
        if (withPercentages[i].score > withPercentages[maxIdx].score) {
          maxIdx = i;
        }
      }
      withPercentages[maxIdx].percentage = Number(
        (withPercentages[maxIdx].percentage + diff).toFixed(1)
      );
    }

    return withPercentages;
  }, [materiasDoConcursoAtivo, selectedDisciplinaIds, relevancias]);

  // Manipulação de Horários (Passo 3): Checkboxes e Incremento/Decremento
  const handleToggleDay = (dayId: DayOfWeek) => {
    setDaysConfig(prev => prev.map(d => {
      if (d.id === dayId) {
        return { ...d, enabled: !d.enabled };
      }
      return d;
    }));
  };

  const handleIncrementHours = (dayId: DayOfWeek) => {
    setDaysConfig(prev => prev.map(d => {
      if (d.id === dayId) {
        return { ...d, hours: Math.min(14, Math.round((d.hours + 0.5) * 10) / 10) };
      }
      return d;
    }));
  };

  const handleDecrementHours = (dayId: DayOfWeek) => {
    setDaysConfig(prev => prev.map(d => {
      if (d.id === dayId) {
        return { ...d, hours: Math.max(0.5, Math.round((d.hours - 0.5) * 10) / 10) };
      }
      return d;
    }));
  };

  // Total de horas semanais calculadas em tempo real
  const totalWeeklyHours = useMemo(() => {
    return daysConfig
      .filter(d => d.enabled)
      .reduce((acc, d) => acc + d.hours, 0);
  }, [daysConfig]);

  const activeDaysCount = useMemo(() => {
    return daysConfig.filter(d => d.enabled).length;
  }, [daysConfig]);

  // Avançar nos passos
  const handleNext = () => {
    setErrorMessage(null);
    if (step === 1) {
      if (selectedDisciplinaIds.length === 0) {
        setErrorMessage('Selecione pelo menos uma disciplina para o cronograma.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      if (totalWeeklyHours === 0 || activeDaysCount === 0) {
        setErrorMessage('Marque pelo menos um dia da semana com horas de estudo.');
        return;
      }
      setStep(4);
    }
  };

  const handleBack = () => {
    setErrorMessage(null);
    if (step > 1) {
      setStep((step - 1) as 1 | 2 | 3 | 4);
    }
  };

  // Concluir e Gerar Cronograma Real
  const handleSaveAndGeneratePlan = async () => {
    setIsSaving(true);
    setErrorMessage(null);

    try {
      if (selectedDisciplinaIds.length === 0) {
        throw new Error('Selecione ao menos uma disciplina.');
      }
      if (totalWeeklyHours === 0 || activeDaysCount === 0) {
        throw new Error('Marque pelo menos um dia da semana com horas de estudo.');
      }
      if (resolvedEndDateStr < resolvedStartDateStr) {
        throw new Error('A data de término deve ser igual ou posterior à data de início.');
      }

      // 1. Constrói nova disponibilidade semanal em minutos
      const newAvailability: WeeklyAvailability = {
        dom: 0,
        seg: 0,
        ter: 0,
        qua: 0,
        qui: 0,
        sex: 0,
        sab: 0,
      };

      daysConfig.forEach(d => {
        newAvailability[d.id] = d.enabled ? Math.round(d.hours * 60) : 0;
      });

      const totalWeeklyMinutes = Math.round(totalWeeklyHours * 60);

      // 2. Constrói a distribuição proporcional baseada nos percentuais fechados em 100%
      const newDistribution: DisciplinaAllocation[] = calculatedDistribution.map(item => {
        const disc = item.disciplina;
        const allocatedMinutes = Math.round((item.percentage / 100) * totalWeeklyMinutes);
        return {
          disciplinaId: disc.id,
          disciplinaName: disc.name,
          color: disc.color || '#10b981',
          weight: item.importancia,
          difficulty: item.conhecimento <= 2 ? 'dificil' : item.conhecimento === 3 ? 'media' : 'facil',
          importance: item.importancia >= 4 ? 'alta' : 'media',
          progressPercent: 0,
          accuracyRate: 75,
          allocatedMinutesPerWeek: allocatedMinutes,
          allocatedPercentage: Math.round(item.percentage),
        };
      });

      // 3. Recupera dados complementares para gerar as sessões reais
      const [revisoes] = await Promise.all([
        DatabaseService.getRevisoes(),
      ]);

      const selectedDisciplinasList = materiasDoConcursoAtivo.filter(d => selectedDisciplinaIds.includes(d.id));

      // 4. Gera as novas sessões do calendário ao longo de todas as semanas de startDate até endDate
      const preservedCompleted = plan?.sessions
        ? plan.sessions.filter(s => s.status === 'concluida' && s.date >= resolvedStartDateStr)
        : [];
      const generated = PlannerService.generateSessions(
        plan?.id || `plan_${Date.now()}`,
        resolvedActiveConcursoId || plan?.concursoId || 'concurso_default',
        resolvedStartDateStr,
        resolvedEndDateStr,
        newAvailability,
        selectedDisciplinasList,
        assuntos,
        revisoes,
        newDistribution,
        preservedCompleted,
        { minMinutes: minBlockDuration, maxMinutes: maxBlockDuration }
      );

      const resolvedTitle = activeConcurso 
        ? `${activeConcurso.organ || activeConcurso.orgao || activeConcurso.title}${activeConcurso.role ? ` - ${activeConcurso.role}` : ''}`
        : plan?.concursoTitle || 'Plano Personalizado';

      const totalPlannedMinutes = generated.sessions.reduce((acc, s) => acc + s.durationMinutes, 0);

      // 5. Monta o objeto StudyPlan final completo
      const updatedPlan: StudyPlan = {
        ...plan,
        concursoId: resolvedActiveConcursoId || plan.concursoId,
        concursoTitle: resolvedTitle,
        startDate: resolvedStartDateStr,
        targetExamDate: resolvedEndDateStr,
        weeklyAvailability: newAvailability,
        dailyAverageMinutes: Math.round(totalWeeklyMinutes / 7),
        totalWeeks: periodMetrics.totalWeeks,
        totalPlannedHours: Math.round(totalPlannedMinutes / 60),
        disciplinasDistribution: newDistribution,
        sessions: generated.sessions,
        conflicts: generated.conflicts,
        historyLogs: [
          {
            id: `log_cronograma_${Date.now()}`,
            planId: plan.id,
            action: 'recalculo',
            timestamp: new Date().toISOString(),
            description: `Cronograma gerado (${formatSummaryPillDate(resolvedStartDateStr)} a ${formatSummaryPillDate(resolvedEndDateStr)}): ${periodMetrics.totalWeeks} semana(s), ${activeDaysCount} dias ativos, ${formatStudyHoursCompact(totalWeeklyHours)}/semana em ${selectedDisciplinasList.length} disciplinas.`,
            preservedCompletedCount: preservedCompleted.length,
            totalStudyMinutes: preservedCompleted.reduce((acc, s) => acc + s.durationMinutes, 0),
          },
          ...(plan?.historyLogs || []),
        ],
        updatedAt: new Date().toISOString(),
      };

      // 6. Salva no banco e notifica a aplicação para renderização imediata do calendário
      await DatabaseService.saveStudyPlan(updatedPlan);
      await onPlanCreated(updatedPlan);
      onClose();
    } catch (err: any) {
      console.error('Erro ao gerar cronograma:', err);
      setErrorMessage(err.message || 'Ocorreu um erro ao processar o cronograma.');
    } finally {
      setIsSaving(false);
    }
  };

  const contestDisplayName = useMemo(() => {
    if (!activeConcurso) return 'Seu Concurso';
    return activeConcurso.organ || activeConcurso.orgao || activeConcurso.title || 'Seu Concurso';
  }, [activeConcurso]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Criar Cronograma de Estudos"
      description="Configure suas disciplinas, relevância, rotina semanal e o período do seu planejamento."
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* Barra de Progresso / Stepper Visual (4 Passos) */}
        <div className="relative">
          <div className="flex items-center justify-between">
            {/* Etapa 1 */}
            <div className="flex flex-col items-center z-10">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all cursor-pointer ${
                  step === 1
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20 ring-4 ring-emerald-500/20'
                    : step > 1
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}
                style={step >= 1 ? { backgroundColor: primaryColor } : undefined}
              >
                {step > 1 ? <Check className="w-4 h-4 stroke-[3]" /> : '1'}
              </button>
              <span
                className={`text-[11px] font-bold mt-1.5 ${
                  step === 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'
                }`}
                style={step === 1 ? { color: primaryColor } : undefined}
              >
                Disciplinas
              </span>
            </div>

            {/* Etapa 2 */}
            <div className="flex flex-col items-center z-10">
              <button
                type="button"
                onClick={() => { if (selectedDisciplinaIds.length > 0) setStep(2); }}
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  step === 2
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20 ring-4 ring-emerald-500/20'
                    : step > 2
                    ? 'bg-emerald-500 text-white cursor-pointer'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}
                style={step >= 2 ? { backgroundColor: primaryColor } : undefined}
              >
                {step > 2 ? <Check className="w-4 h-4 stroke-[3]" /> : '2'}
              </button>
              <span
                className={`text-[11px] font-bold mt-1.5 ${
                  step === 2 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'
                }`}
                style={step === 2 ? { color: primaryColor } : undefined}
              >
                Relevância
              </span>
            </div>

            {/* Etapa 3 */}
            <div className="flex flex-col items-center z-10">
              <button
                type="button"
                onClick={() => { if (selectedDisciplinaIds.length > 0) setStep(3); }}
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  step === 3
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20 ring-4 ring-emerald-500/20'
                    : step > 3
                    ? 'bg-emerald-500 text-white cursor-pointer'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}
                style={step >= 3 ? { backgroundColor: primaryColor } : undefined}
              >
                {step > 3 ? <Check className="w-4 h-4 stroke-[3]" /> : '3'}
              </button>
              <span
                className={`text-[11px] font-bold mt-1.5 ${
                  step === 3 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'
                }`}
                style={step === 3 ? { color: primaryColor } : undefined}
              >
                Horários
              </span>
            </div>

            {/* Etapa 4 */}
            <div className="flex flex-col items-center z-10">
              <button
                type="button"
                onClick={() => {
                  if (selectedDisciplinaIds.length > 0 && activeDaysCount > 0 && totalWeeklyHours > 0) {
                    setStep(4);
                  }
                }}
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  step === 4
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20 ring-4 ring-emerald-500/20'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}
                style={step === 4 ? { backgroundColor: primaryColor } : undefined}
              >
                4
              </button>
              <span
                className={`text-[11px] font-bold mt-1.5 ${
                  step === 4 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'
                }`}
                style={step === 4 ? { color: primaryColor } : undefined}
              >
                Período
              </span>
            </div>
          </div>

          <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 dark:bg-slate-800 -z-0">
            <div 
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{
                width:
                  step === 1
                    ? '0%'
                    : step === 2
                    ? '33.33%'
                    : step === 3
                    ? '66.66%'
                    : '100%',
                backgroundColor: primaryColor,
              }}
            />
          </div>
        </div>

        {/* Alerta de Erro */}
        {errorMessage && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* PASSO 1: Seleção de Disciplinas */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-500" style={{ color: primaryColor }} />
                  Disciplinas no Cronograma
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Escolha as matérias que serão agendadas na grade semanal.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllDisciplinas}
                  className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                  style={{ color: primaryColor }}
                >
                  Selecionar Todas
                </button>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium cursor-pointer"
                >
                  Limpar
                </button>
              </div>
            </div>

            {materiasDoConcursoAtivo.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 bg-slate-50/50 dark:bg-slate-900/40">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="max-w-sm mx-auto space-y-1">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Nenhuma matéria encontrada para o concurso ativo.
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Cadastre ou ative um concurso primeiro no menu "Concursos & Provas" para gerar o seu cronograma.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto p-1 pr-2">
                {materiasDoConcursoAtivo.map((disc) => {
                  const isSelected = selectedDisciplinaIds.includes(disc.id);
                  const topicsCount = assuntos.filter(a => a.disciplinaId === disc.id).length;
                  return (
                    <button
                      key={disc.id}
                      type="button"
                      onClick={() => toggleDisciplina(disc.id)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-start justify-between cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0 pr-2">
                        <span 
                          className="w-3.5 h-3.5 rounded-full mt-0.5 shrink-0" 
                          style={{ backgroundColor: disc.color || '#10b981' }} 
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block truncate">
                            {disc.name}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {topicsCount} tópicos cadastrados
                          </span>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'bg-emerald-500 text-white' : 'border border-slate-300 dark:border-slate-700'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500">Disciplinas ativas:</span>
              <Badge variant="emerald" size="sm">
                {selectedDisciplinaIds.length} de {materiasDoConcursoAtivo.length} selecionada(s)
              </Badge>
            </div>
          </div>
        )}

        {/* PASSO 2: Relevância (Importância / Conhecimento com 100%) */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-500" style={{ color: primaryColor }} />
                  Balanceamento de Carga (100%)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Ajuste a prioridade no edital e seu domínio. O tempo semanal é balanceado matematicamente.
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-600 dark:text-emerald-400 text-xs font-mono font-black">
                <BarChart2 className="w-3.5 h-3.5" />
                <span>100.0% Fechado</span>
              </div>
            </div>

            {/* Barra Visual de Distribuição */}
            <div className="space-y-1.5">
              <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-800 flex overflow-hidden shadow-inner">
                {calculatedDistribution.map((item) => (
                  <div
                    key={item.disciplina.id}
                    title={`${item.disciplina.name}: ${item.percentage}%`}
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.disciplina.color || '#10b981',
                    }}
                    className="h-full transition-all duration-300 hover:brightness-110"
                  />
                ))}
              </div>
            </div>

            {/* Sliders das Disciplinas */}
            <div className="space-y-3 max-h-72 overflow-y-auto p-1 pr-2">
              {calculatedDistribution.map((item) => {
                const disc = item.disciplina;
                const rel = relevancias[disc.id] || { importancia: 3, conhecimento: 3 };

                return (
                  <div 
                    key={disc.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-3 h-3 rounded-full shrink-0" 
                          style={{ backgroundColor: disc.color || '#10b981' }} 
                        />
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {disc.name}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        {item.percentage}% da semana
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">Peso no Edital:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {rel.importancia === 1 ? '1 - Baixo' :
                             rel.importancia === 2 ? '2 - Moderado' :
                             rel.importancia === 3 ? '3 - Importante' :
                             rel.importancia === 4 ? '4 - Alto' : '5 - Crítico'}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          step="1"
                          value={rel.importancia}
                          onChange={(e) => handleUpdateRelevancia(disc.id, 'importancia', parseInt(e.target.value, 10))}
                          className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">Seu Conhecimento:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {rel.conhecimento === 1 ? '1 - Básico' :
                             rel.conhecimento === 2 ? '2 - Iniciante' :
                             rel.conhecimento === 3 ? '3 - Médio' :
                             rel.conhecimento === 4 ? '4 - Avançado' : '5 - Dominado'}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          step="1"
                          value={rel.conhecimento}
                          onChange={(e) => handleUpdateRelevancia(disc.id, 'conhecimento', parseInt(e.target.value, 10))}
                          className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PASSO 3: Horários (Checkboxes DOM a SÁB com seletor numérico + e -) */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-emerald-500" style={{ color: primaryColor }} />
                  Disponibilidade Diária (DOM a SÁB)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Marque os dias de estudo e use os botões (+) e (-) para ajustar o tempo de 30 em 30 minutos.
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-700 dark:text-emerald-300 text-xs font-bold font-mono">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatStudyHoursCompact(totalWeeklyHours)} / semana</span>
              </div>
            </div>

            {/* Lista dos Dias da Semana de DOM a SÁB com Checkboxes e Seletor Numérico + e - */}
            <div className="space-y-2 max-h-72 overflow-y-auto p-1 pr-2">
              {daysConfig.map((day) => (
                <div
                  key={day.id}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                    day.enabled
                      ? 'border-emerald-500/40 bg-white dark:bg-slate-900/80 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30 opacity-60'
                  }`}
                >
                  {/* Checkbox do Dia */}
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={day.enabled}
                      onChange={() => handleToggleDay(day.id)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 cursor-pointer accent-emerald-500"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                          {day.label}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          ({day.name})
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {day.enabled ? `${formatStudyHoursLabel(day.hours)} programadas` : 'Dia de descanso / livre'}
                      </span>
                    </div>
                  </label>

                  {/* Seletor Numérico com Botões + e - (de 30 em 30 min) */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!day.enabled || day.hours <= 0.5}
                      onClick={() => handleDecrementHours(day.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95"
                      title="Diminuir 30 minutos"
                      aria-label={`Diminuir 30 minutos de ${day.name}`}
                    >
                      <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>

                    <div className="min-w-[4.5rem] py-1 px-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-center font-mono font-black text-xs text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700">
                      {day.enabled ? formatStudyHoursCompact(day.hours) : '0h'}
                    </div>

                    <button
                      type="button"
                      disabled={!day.enabled || day.hours >= 14}
                      onClick={() => handleIncrementHours(day.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95"
                      title="Aumentar 30 minutos"
                      aria-label={`Aumentar 30 minutos de ${day.name}`}
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Seção Duração de Cada Sessão de Estudo (Mínimo e Máximo) */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-emerald-500" style={{ color: primaryColor }} />
                  De quanto tempo é cada sessão de estudo?
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Duração mínima e máxima de cada bloco de estudo.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Mínimo
                  </label>
                  <select
                    value={minBlockDuration}
                    onChange={(e) => handleMinChange(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg text-xs font-bold font-mono border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                  >
                    {DURATION_OPTIONS.map((opt) => (
                      <option key={`min-${opt}`} value={opt}>
                        {opt}min
                      </option>
                    ))}
                  </select>
                </div>

                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 pt-4">a</span>

                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Máximo
                  </label>
                  <select
                    value={maxBlockDuration}
                    onChange={(e) => handleMaxChange(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg text-xs font-bold font-mono border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                  >
                    {DURATION_OPTIONS.map((opt) => (
                      <option key={`max-${opt}`} value={opt}>
                        {opt}min
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Painel Informativo Resumo */}
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs space-y-1">
              <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  Meta Semanal Total:
                </span>
                <span className="font-mono text-sm">{formatStudyHoursLabel(totalWeeklyHours)} ({Math.round(totalWeeklyHours * 60)} min)</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Distribuídas em {activeDaysCount} dia(s) na semana. As matérias serão intercaladas automaticamente na grade.
              </p>
            </div>
          </div>
        )}

        {/* PASSO 4: Período ("Quando começa e até quando vai?") */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                Quando começa e até quando vai?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Defina o período para distribuirmos seus blocos de estudo ao longo das semanas.
              </p>
            </div>

            {/* A. TOPO: DATA DE INÍCIO DOS ESTUDOS ("Quando começa?") */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Quando começa?
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Card 1: Hoje */}
                <button
                  type="button"
                  onClick={() => setStartDateOption('hoje')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    startDateOption === 'hoje'
                      ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/25 shadow-xs ring-1 ring-emerald-500/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                  style={
                    startDateOption === 'hoje'
                      ? { borderColor: primaryColor, backgroundColor: `${primaryColor}12` }
                      : undefined
                  }
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100">
                      Hoje
                    </span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        startDateOption === 'hoje'
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                      style={
                        startDateOption === 'hoje'
                          ? { borderColor: primaryColor, backgroundColor: primaryColor }
                          : undefined
                      }
                    >
                      {startDateOption === 'hoje' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                    {formatCardShortDate(todayStr)}
                  </span>
                </button>

                {/* Card 2: Amanhã */}
                <button
                  type="button"
                  onClick={() => setStartDateOption('amanha')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    startDateOption === 'amanha'
                      ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/25 shadow-xs ring-1 ring-emerald-500/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                  style={
                    startDateOption === 'amanha'
                      ? { borderColor: primaryColor, backgroundColor: `${primaryColor}12` }
                      : undefined
                  }
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100">
                      Amanhã
                    </span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        startDateOption === 'amanha'
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                      style={
                        startDateOption === 'amanha'
                          ? { borderColor: primaryColor, backgroundColor: primaryColor }
                          : undefined
                      }
                    >
                      {startDateOption === 'amanha' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                    {formatCardShortDate(tomorrowStr)}
                  </span>
                </button>

                {/* Card 3: Outro dia */}
                <button
                  type="button"
                  onClick={() => setStartDateOption('outro')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    startDateOption === 'outro'
                      ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/25 shadow-xs ring-1 ring-emerald-500/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                  style={
                    startDateOption === 'outro'
                      ? { borderColor: primaryColor, backgroundColor: `${primaryColor}12` }
                      : undefined
                  }
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100">
                      Outro dia
                    </span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        startDateOption === 'outro'
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                      style={
                        startDateOption === 'outro'
                          ? { borderColor: primaryColor, backgroundColor: primaryColor }
                          : undefined
                      }
                    >
                      {startDateOption === 'outro' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                    {startDateOption === 'outro' && customStartDate
                      ? formatCardShortDate(customStartDate)
                      : 'Escolher data'}
                  </span>
                </button>
              </div>

              {startDateOption === 'outro' && (
                <div className="pt-1 animate-in fade-in duration-150">
                  <div className="relative max-w-xs">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="date"
                      min={todayStr}
                      max={addDaysToDateStr(todayStr, 365)}
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* B. CORPO: DATA DE TÉRMINO ("Até quando vai o planejamento?") */}
            <div className="space-y-3 pt-1">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Até quando vai o planejamento?
              </label>

              {/* Cenário 1: Banner informativo se o concurso possui data de prova FUTURA */}
              {hasFutureExamDate && examDateStr && (
                <div
                  className="p-3 rounded-2xl border flex items-center gap-2.5 text-xs"
                  style={{
                    borderColor: `${primaryColor}35`,
                    backgroundColor: `${primaryColor}10`,
                  }}
                >
                  <span className="text-base leading-none shrink-0">📅</span>
                  <span className="text-slate-700 dark:text-slate-200 font-medium">
                    Encontramos sua prova: <strong className="font-bold text-slate-900 dark:text-white">{contestDisplayName}</strong> em{' '}
                    <strong className="font-bold text-slate-900 dark:text-white">{formatFullExamDateBanner(examDateStr)}</strong>
                  </span>
                </div>
              )}

              <div className="space-y-2.5">
                {/* Opção 1 (Apenas Cenário 1): Até a véspera da prova [RECOMENDADO] */}
                {hasFutureExamDate && examEveDateStr && (
                  <div
                    onClick={() => setEndDateOption('vespera')}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      endDateOption === 'vespera'
                        ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/25 shadow-xs ring-1 ring-emerald-500/30'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                    style={
                      endDateOption === 'vespera'
                        ? { borderColor: primaryColor, backgroundColor: `${primaryColor}12` }
                        : undefined
                    }
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="endDateOption"
                        checked={endDateOption === 'vespera'}
                        onChange={() => setEndDateOption('vespera')}
                        className="mt-0.5 w-4 h-4 cursor-pointer accent-emerald-600"
                        style={{ accentColor: primaryColor }}
                      />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100">
                            Até a véspera da prova
                          </span>
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-white"
                            style={{ backgroundColor: primaryColor }}
                          >
                            RECOMENDADO
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Termina um dia antes ({formatCardShortDate(examEveDateStr)}), para você chegar descansado
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Opção Escolher outra data / Escolher uma data */}
                <div
                  onClick={() => setEndDateOption('custom')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                    endDateOption === 'custom'
                      ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/25 shadow-xs ring-1 ring-emerald-500/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                  style={
                    endDateOption === 'custom'
                      ? { borderColor: primaryColor, backgroundColor: `${primaryColor}12` }
                      : undefined
                  }
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="endDateOption"
                      checked={endDateOption === 'custom'}
                      onChange={() => setEndDateOption('custom')}
                      className="mt-0.5 w-4 h-4 cursor-pointer accent-emerald-600"
                      style={{ accentColor: primaryColor }}
                    />
                    <div className="space-y-0.5 flex-1">
                      <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 block">
                        {hasFutureExamDate ? 'Escolher outra data' : 'Escolher uma data'}
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Por exemplo, para deixar as últimas semanas só para revisão
                      </p>
                    </div>
                  </div>

                  {endDateOption === 'custom' && (
                    <div
                      className="pl-7 pt-0.5 animate-in fade-in duration-150"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="relative max-w-xs">
                        <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="date"
                          min={resolvedStartDateStr}
                          max={maxOneYearEndDateStr}
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Opção Sem data de término */}
                <div
                  onClick={() => setEndDateOption('sem_termino')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                    endDateOption === 'sem_termino'
                      ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/25 shadow-xs ring-1 ring-emerald-500/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                  style={
                    endDateOption === 'sem_termino'
                      ? { borderColor: primaryColor, backgroundColor: `${primaryColor}12` }
                      : undefined
                  }
                >
                  <input
                    type="radio"
                    name="endDateOption"
                    checked={endDateOption === 'sem_termino'}
                    onChange={() => setEndDateOption('sem_termino')}
                    className="mt-0.5 w-4 h-4 cursor-pointer accent-emerald-600"
                    style={{ accentColor: primaryColor }}
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 block">
                      Sem data de término
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      O planejamento segue até você encerrar
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* C. RESUMO DO PERÍODO & VALIDAÇÕES */}
            <div className="space-y-2.5 pt-1">
              {/* Pill de Resumo Dinâmico */}
              <div
                className="px-4 py-3 rounded-2xl border text-xs font-bold flex items-center justify-between flex-wrap gap-2"
                style={{
                  borderColor: `${primaryColor}35`,
                  backgroundColor: `${primaryColor}10`,
                  color: primaryColor,
                }}
              >
                <span>
                  → De {formatSummaryPillDate(resolvedStartDateStr)} a {formatSummaryPillDate(resolvedEndDateStr)} ·{' '}
                  {periodMetrics.totalWeeks} {periodMetrics.totalWeeks === 1 ? 'semana de estudo' : 'semanas de estudo'}
                </span>
                <span className="text-[11px] font-mono opacity-85">
                  ({periodMetrics.totalDays} {periodMetrics.totalDays === 1 ? 'dia' : 'dias'})
                </span>
              </div>

              {/* Alerta de Data Ultrapassada */}
              {periodMetrics.exceedsExamDate && (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/70 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>
                    ⚠️ Essa data passa do dia da prova. Recomendamos terminar até a véspera.
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* NAVEGAÇÃO DOS PASSOS */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <div>
            {step > 1 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                disabled={isSaving}
              >
                Voltar
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isSaving}
              >
                Cancelar
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step < 4 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={handleNext}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Próximo Passo
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveAndGeneratePlan}
                isLoading={isSaving}
                leftIcon={<Check className="w-4 h-4" />}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Criar planejamento
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
