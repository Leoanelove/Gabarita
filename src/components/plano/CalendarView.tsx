import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Check, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  Edit2, 
  Trash2, 
  CalendarDays, 
  Columns, 
  Sparkles, 
  CalendarRange, 
  MoveHorizontal,
  Sliders
} from 'lucide-react';
import { 
  StudyPlan, 
  PlannedSession, 
  PlanSessionStatus, 
  DayOfWeek, 
  Disciplina, 
  Assunto,
  Concurso,
  StudyMethod,
  SessaoEstudo
} from '../../types';
import { Badge } from '../../design-system/Badge';
import { Button } from '../../design-system/Button';
import { Modal } from '../../design-system/Modal';
import { PlannerService } from '../../services/plannerService';
import { DatabaseService } from '../../services/db';
import { WeeklySchedule, getNoteColor } from './WeeklySchedule';
import { SessionActionModal } from './SessionActionModal';
import { useTheme } from '../../contexts/ThemeContext';
import './calendarViews.css';

interface CalendarViewProps {
  plan: StudyPlan;
  disciplinas: Disciplina[];
  assuntos: Assunto[];
  sessoes?: SessaoEstudo[];
  concursos?: Concurso[];
  onRescheduleSession: (sessionId: string, newDate: string, reason?: string) => Promise<void>;
  onMoveSession: (concursoId: string, sessionId: string, date: string, beforeSessionId?: string) => Promise<void>;
  onBatchRescheduleOverdue: (targetDate?: string, mode?: 'today' | 'spread') => Promise<void>;
  onToggleSessionStatus: (sessionId: string, status: PlanSessionStatus) => Promise<void>;
  onOpenStudyTimer: (disciplinaId?: string, assuntoId?: string, durationMinutes?: number | string) => void;
  onOpenEditSession: (session: PlannedSession) => void;
  onOpenAddSession: (presetDate?: string) => void;
  onDeleteSession: (sessionId: string) => Promise<void>;
  onUpdateSession?: (sessionId: string, partial: Partial<PlannedSession>) => Promise<void>;
  onPlanCreated?: (newPlan: StudyPlan) => Promise<void>;
  onSwitchMethod?: (method: StudyMethod) => Promise<void> | void;
  onNavigateTab?: (tab: any) => void;
  onRemovePlan?: () => Promise<void>;
  onOpenCreateSchedule?: () => void;
}

export type CalendarViewMode = 'diario' | 'semanal' | 'mensal';

export const CalendarView: React.FC<CalendarViewProps> = ({
  plan,
  disciplinas,
  assuntos,
  sessoes = [],
  concursos = [],
  onRescheduleSession,
  onMoveSession,
  onBatchRescheduleOverdue,
  onToggleSessionStatus,
  onOpenStudyTimer,
  onOpenEditSession,
  onOpenAddSession,
  onDeleteSession,
  onUpdateSession,
  onPlanCreated,
  onSwitchMethod,
  onNavigateTab,
  onRemovePlan,
  onOpenCreateSchedule,
}) => {
  const { palette } = useTheme();
  const [viewMode, setViewMode] = useState<CalendarViewMode>('semanal');
  const [currentClockDate, setCurrentClockDate] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentClockDate(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  const todayStr = useMemo(() => PlannerService.formatLocalDate(currentClockDate), [currentClockDate]);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  // Estado da sessão selecionada para abrir o Modal Intermediário (SessionActionModal)
  const [selectedSessionForAction, setSelectedSessionForAction] = useState<PlannedSession | null>(null);

  const [reschedulingSession, setReschedulingSession] = useState<PlannedSession | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>(todayStr);
  const [rescheduleReason, setRescheduleReason] = useState<string>('Reagendamento');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isRemoveScheduleModalOpen, setIsRemoveScheduleModalOpen] = useState(false);
  const [batchTargetDate, setBatchTargetDate] = useState<string>(todayStr);
  const [batchMode, setBatchMode] = useState<'today' | 'spread'>('spread');
  const [feedback, setFeedback] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleConfirmRemoveSchedule = async () => {
    setIsSubmitting(true);
    try {
      if (onRemovePlan) {
        await onRemovePlan();
      } else {
        await DatabaseService.removeStudyPlan(plan.concursoId);
      }
      setIsRemoveScheduleModalOpen(false);
      showFeedback('Cronograma de estudos excluído com sucesso.');
    } catch (err) {
      console.error('Erro ao excluir cronograma:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSessionClick = (session: PlannedSession) => {
    setSelectedSessionForAction(session);
  };

  const overdueSessions = useMemo(() => {
    return PlannerService.getOverdueSessions(plan.sessions, todayStr, sessoes);
  }, [plan.sessions, todayStr, sessoes]);

  const selectedDateObj = useMemo(() => {
    return PlannerService.parseLocalDate(selectedDateStr);
  }, [selectedDateStr]);

  const handlePrev = () => {
    const d = new Date(selectedDateObj);
    if (viewMode === 'diario') d.setDate(d.getDate() - 1);
    else if (viewMode === 'semanal') d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setSelectedDateStr(PlannerService.formatLocalDate(d));
  };

  const handleNext = () => {
    const d = new Date(selectedDateObj);
    if (viewMode === 'diario') d.setDate(d.getDate() + 1);
    else if (viewMode === 'semanal') d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setSelectedDateStr(PlannerService.formatLocalDate(d));
  };

  const weekDays = useMemo(() => {
    const d = new Date(selectedDateObj);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    const days: { dateStr: string; dateObj: Date; dayOfWeek: DayOfWeek; isToday: boolean }[] = [];
    for (let i = 0; i < 7; i++) {
      const cur = new Date(monday);
      cur.setDate(monday.getDate() + i);
      const str = PlannerService.formatLocalDate(cur);
      days.push({
        dateStr: str,
        dateObj: cur,
        dayOfWeek: PlannerService.getDayOfWeekFromDate(cur),
        isToday: str === todayStr,
      });
    }
    return days;
  }, [selectedDateObj, todayStr]);

  const weekStart = weekDays[0].dateObj;
  const weekEnd = weekDays[6].dateObj;
  const weekLabel = weekStart.getMonth() === weekEnd.getMonth()
    ? `${weekStart.getDate()} a ${weekEnd.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}`
    : `${weekStart.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} a ${weekEnd.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}`;

  const monthData = useMemo(() => {
    const year = selectedDateObj.getFullYear();
    const month = selectedDateObj.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    const offset = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
    const daysInMonth = lastDayOfMonth.getDate();
    const days: { dateStr: string; dayNumber: number; isCurrentMonth: boolean; isToday: boolean }[] = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = offset - 1; i >= 0; i--) {
      const pDay = prevMonthLastDay - i;
      const d = new Date(year, month - 1, pDay);
      days.push({
        dateStr: PlannerService.formatLocalDate(d),
        dayNumber: pDay,
        isCurrentMonth: false,
        isToday: PlannerService.formatLocalDate(d) === todayStr,
      });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const str = PlannerService.formatLocalDate(d);
      days.push({
        dateStr: str,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: str === todayStr,
      });
    }
    return { monthLabel: selectedDateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }), days };
  }, [selectedDateObj, todayStr]);

  const sessionsByDate = useMemo(() => {
    const map: Record<string, PlannedSession[]> = {};
    plan.sessions.forEach(s => {
      if (plan.startDate && s.date < plan.startDate) return;
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    });
    Object.keys(map).forEach(k => {
      map[k].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    });
    return map;
  }, [plan.sessions, plan.startDate]);

  // Sessões focadas no dia atual (aba Diário)
  const dailySessions = useMemo(() => {
    return sessionsByDate[selectedDateStr] || [];
  }, [sessionsByDate, selectedDateStr]);

  return (
    <div className="space-y-4">
      {feedback && (
        <div className="p-3 bg-[var(--primary-light)] border border-[var(--primary-light-border)] text-[var(--primary-text-dark)] text-xs font-semibold rounded-xl">
          {feedback}
        </div>
      )}

      {overdueSessions.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs">
          <span>{overdueSessions.length} sessão(ões) atrasada(s).</span>
          <Button size="sm" variant="primary" onClick={() => onBatchRescheduleOverdue(todayStr, 'spread')} className="bg-rose-600 cursor-pointer font-bold">
            Redistribuir Atrasadas
          </Button>
        </div>
      )}

      <div className="flashcards-daily-review-card relative overflow-hidden p-3 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/25 dark:border-primary/20 rounded-2xl flex items-center justify-between gap-2 flex-wrap shadow-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white/80 dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/70 rounded-xl p-0.5">
            <button onClick={handlePrev} className="p-1.5 cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setSelectedDateStr(todayStr)} className="px-2.5 py-1 text-xs font-bold cursor-pointer">Hoje</button>
            <button onClick={handleNext} className="p-1.5 cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <span className="font-extrabold text-sm capitalize">
            {viewMode === 'diario' && selectedDateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
            {viewMode === 'semanal' && weekLabel}
            {viewMode === 'mensal' && monthData.monthLabel}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-white/80 dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/70 p-1 rounded-xl text-xs">
            <button onClick={() => setViewMode('diario')} className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all ${viewMode === 'diario' ? 'bg-primary text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>Diário</button>
            <button onClick={() => setViewMode('semanal')} className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all ${viewMode === 'semanal' ? 'bg-primary text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>Semanal</button>
            <button onClick={() => setViewMode('mensal')} className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all ${viewMode === 'mensal' ? 'bg-primary text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>Mensal</button>
          </div>
          <button
            type="button"
            onClick={() => setIsRemoveScheduleModalOpen(true)}
            className="text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-xs hover:border-slate-400 dark:hover:border-slate-600 group"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors" />
            <span>Excluir Cronograma</span>
          </button>
        </div>
      </div>

      {(!plan.sessions || plan.sessions.length === 0) && (
        <div className="p-8 sm:p-10 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm text-center max-w-xl mx-auto my-2 space-y-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto border"
            style={{
              backgroundColor: `${palette.primary}18`,
              borderColor: `${palette.primary}40`,
              color: palette.primary,
            }}
          >
            <CalendarIcon className="w-7 h-7 opacity-80" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Nenhum cronograma criado
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Crie seu cronograma semanal e organize seus horários de estudo no calendário.
            </p>
          </div>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => onOpenCreateSchedule && onOpenCreateSchedule()}
              style={{ backgroundColor: palette.primary }}
              className="text-white rounded-lg px-6 py-2.5 font-semibold inline-flex items-center gap-2 cursor-pointer shadow-md hover:brightness-110 active:scale-95 transition-all text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Incluir novo cronograma</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          1. VISÃO DIÁRIA: Lista de sessões ou blocos de horários focados no dia atual
          ========================================================================= */}
      {viewMode === 'diario' && (
        <div className="weekly-schedule space-y-4">
          <div className="flashcards-daily-review-card relative p-4 rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/25 dark:border-primary/20 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[var(--primary-light)] text-[var(--primary-color)] dark:text-[var(--primary-text-dark)] border border-[var(--primary-light-border)]">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base first-letter:uppercase">
                  {selectedDateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                </h3>
                <p className="text-xs text-(--week-muted)">
                  {dailySessions.length === 1 ? '1 bloco planejado' : `${dailySessions.length} blocos planejados`}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenAddSession(selectedDateStr)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="cursor-pointer font-bold"
            >
              Adicionar sessão
            </Button>
          </div>

          <div className="space-y-3">
            {dailySessions.map((session) => {
              const isDone = session.status === 'concluida' || PlannerService.isSessionStudied(session, sessoes);
              const isOverdue = PlannerService.isSessionOverdue(session, todayStr, sessoes);

              return (
                <article
                  key={session.id}
                  onClick={() => handleSessionClick(session)}
                  className="weekly-schedule-note daily-calendar-note px-4 py-3 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                  style={getNoteColor(session)}
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="font-black text-base leading-tight">{session.disciplinaName}</h4>
                    <p className="mt-0.5 text-sm font-semibold line-clamp-2" title={session.assuntoName}>
                      {session.assuntoName}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="weekly-schedule-time">
                        <Clock className="w-3.5 h-3.5" />
                        {session.durationMinutes} min
                      </span>
                      {isDone && <Badge variant="primary" size="sm">Concluída</Badge>}
                      {isOverdue && <Badge variant="rose" size="sm">Atrasada</Badge>}
                      {!isDone && !isOverdue && <Badge variant="sky" size="sm">Pendente</Badge>}
                    </div>
                    {session.notes && (
                      <p className="mt-1 text-xs text-(--week-muted) line-clamp-1" title={session.notes}>{session.notes}</p>
                    )}
                  </div>

                  <div
                    className="flex items-center justify-end gap-2 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      size="sm"
                      variant={isDone ? 'outline' : 'primary'}
                      onClick={() => handleSessionClick(session)}
                      leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
                      className="cursor-pointer font-bold"
                    >
                      Estudar
                    </Button>
                    <button
                      type="button"
                      onClick={() => onOpenEditSession(session)}
                      className="daily-calendar-action"
                      aria-label="Editar sessão"
                      title="Editar sessão"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteSession(session.id)}
                      className="daily-calendar-action daily-calendar-action-delete"
                      aria-label="Excluir sessão"
                      title="Excluir sessão"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          2. VISÃO SEMANAL: Grade completa da semana
          ========================================================================= */}
      {viewMode === 'semanal' && (
        <WeeklySchedule
          key={plan.id}
          days={weekDays}
          sessionsByDate={sessionsByDate}
          studySessions={sessoes}
          onClickSession={handleSessionClick}
          onAddSession={onOpenAddSession}
          onMoveSession={(sessionId, date, before) => onMoveSession(plan.concursoId, sessionId, date, before)}
        />
      )}

      {/* =========================================================================
          3. VISÃO MENSAL: Calendário completo do mês
          ========================================================================= */}
      {viewMode === 'mensal' && (
        <div className="weekly-schedule">
          <div className="weekly-schedule-scroll">
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'].map(label => (
                <span key={label} className="py-1.5 sm:py-2 text-center font-black text-[10px] sm:text-xs">{label}</span>
              ))}
              {monthData.days.map((day) => {
                const daySessions = sessionsByDate[day.dateStr] || [];
                const isSelected = day.dateStr === selectedDateStr;
                const openDay = () => {
                  setSelectedDateStr(day.dateStr);
                  setViewMode('diario');
                };

                return (
                  <div
                    key={day.dateStr}
                    className="monthly-calendar-day"
                    data-highlighted={day.isToday || isSelected}
                    data-outside-month={!day.isCurrentMonth}
                  >
                    <button type="button" className="monthly-calendar-date" onClick={openDay} aria-label={`Abrir ${PlannerService.parseLocalDate(day.dateStr).toLocaleDateString('pt-BR', { dateStyle: 'long' })}`}>
                      <time dateTime={day.dateStr} aria-current={day.isToday ? 'date' : undefined}>{day.dayNumber}</time>
                      {daySessions.length > 0 && (
                        <span className="monthly-calendar-count">
                          {daySessions.length} <span className="hidden sm:inline">{daySessions.length === 1 ? 'bloco' : 'blocos'}</span>
                        </span>
                      )}
                    </button>
                    {daySessions.slice(0, 2).map(session => (
                      <button
                        key={session.id}
                        type="button"
                        onClick={() => handleSessionClick(session)}
                        className="weekly-schedule-note monthly-calendar-note"
                        style={getNoteColor(session)}
                        title={`${session.disciplinaName}: ${session.assuntoName} (${session.durationMinutes} min)`}
                      >
                        {session.disciplinaName}
                      </button>
                    ))}
                    {daySessions.length > 2 && (
                      <button type="button" onClick={openDay} className="monthly-calendar-more">
                        +{daySessions.length - 2}<span className="hidden sm:inline"> blocos</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Excluir Cronograma de Estudos */}
      <Modal
        isOpen={isRemoveScheduleModalOpen}
        onClose={() => setIsRemoveScheduleModalOpen(false)}
        title="Excluir Cronograma de Estudos?"
        description="Esta ação removerá todas as sessões agendadas no calendário deste concurso. O edital e as matérias cadastradas serão preservados."
        maxWidth="md"
      >
        <div className="space-y-4 pt-2 text-xs sm:text-sm">
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-red-800 dark:text-red-200">
                Tem certeza que deseja apagar este cronograma?
              </p>
              <p className="text-xs text-red-700 dark:text-red-400">
                Esta ação removerá todo o planejamento do calendário atual e reiniciará as métricas do cronograma deste concurso. O edital e as matérias cadastradas serão preservados.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRemoveScheduleModalOpen(false)}
              className="cursor-pointer border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmRemoveSchedule}
              isLoading={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer shadow-sm border border-red-700"
            >
              Sim, Excluir Cronograma
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Intermediário: Detalhes da Sessão Planejada */}
      <SessionActionModal
        session={selectedSessionForAction}
        isOpen={!!selectedSessionForAction}
        onClose={() => setSelectedSessionForAction(null)}
        disciplinas={disciplinas}
        assuntos={assuntos}
        sessoes={sessoes}
        onRescheduleSession={onRescheduleSession}
        onOpenEditSession={onOpenEditSession}
        onDeleteSession={onDeleteSession}
        onUpdateSession={onUpdateSession}
        onNavigateTab={onNavigateTab}
        showFeedback={showFeedback}
      />
    </div>
  );
};

