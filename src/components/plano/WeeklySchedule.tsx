import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { CalendarDays, Check, Clock, GripVertical, Plus } from 'lucide-react';
import type { PlannedSession, SessaoEstudo } from '../../types';
import { PlannerService } from '../../services/plannerService';
import './weeklySchedule.css';

interface WeekDay {
  dateStr: string;
  dateObj: Date;
  isToday: boolean;
}

interface DropPosition {
  date: string;
  before?: string;
}

interface DragPosition {
  session: PlannedSession;
  pointerId: number;
  startX: number;
  startY: number;
  moved: boolean;
}

interface WeeklyScheduleProps {
  days: WeekDay[];
  sessionsByDate: Record<string, PlannedSession[]>;
  studySessions: SessaoEstudo[];
  onClickSession: (session: PlannedSession) => void;
  onAddSession: (date: string) => void;
  onMoveSession: (sessionId: string, date: string, beforeSessionId?: string) => Promise<void>;
}

export const getNoteColor = (session: Pick<PlannedSession, 'disciplinaColor'>) => ({
  '--note-color': /^#[0-9a-f]{6}$/i.test(session.disciplinaColor) ? session.disciplinaColor : 'var(--primary-color)',
} as CSSProperties);

function plannedDuration(sessions: PlannedSession[]) {
  const minutes = sessions.reduce((sum, session) => sum + session.durationMinutes, 0);
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours}h ${String(minutes % 60).padStart(2, '0')}min` : `${minutes} min`;
}

export function WeeklySchedule({
  days, sessionsByDate, studySessions, onClickSession, onAddSession, onMoveSession,
}: WeeklyScheduleProps) {
  const board = useRef<HTMLDivElement>(null);
  const gesture = useRef<DragPosition | null>(null);
  const saving = useRef(false);
  const [drag, setDrag] = useState<{ session: PlannedSession; x: number; y: number; target?: DropPosition }>();
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState('');

  function getTarget(x: number, y: number): DropPosition | undefined {
    const lane = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-week-day]');
    if (!lane || !board.current?.contains(lane)) return;
    const date = lane.dataset.weekDay!;
    const before = Array.from(lane.querySelectorAll<HTMLElement>('[data-week-session]'))
      .find(card => {
        if (card.dataset.weekSession === gesture.current?.session.id) return false;
        const { top, height } = card.getBoundingClientRect();
        return y < top + height / 2;
      })?.dataset.weekSession;
    return { date, before };
  }

  async function moveSession(session: PlannedSession, target: DropPosition) {
    if (saving.current) return;
    const sameDay = session.date === target.date;
    if (!sameDay && PlannerService.isSessionStudied(session, studySessions)) {
      setNotice('Um bloco concluído só pode ser reordenado no próprio dia.');
      return;
    }

    const currentDay = sessionsByDate[session.date] ?? [];
    const index = currentDay.findIndex(block => block.id === session.id);
    if (sameDay && currentDay[index + 1]?.id === target.before) return;

    saving.current = true;
    setIsSaving(true);
    setNotice('');
    try {
      await onMoveSession(session.id, target.date, target.before);
      setNotice('Posição do bloco salva.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Não foi possível salvar a posição do bloco. Tente novamente.');
    } finally {
      saving.current = false;
      setIsSaving(false);
    }
  }

  function startDrag(event: PointerEvent<HTMLButtonElement>, session: PlannedSession) {
    if (!event.isPrimary || event.button !== 0 || saving.current) return;
    gesture.current = { session, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function updateDrag(event: PointerEvent<HTMLButtonElement>) {
    const active = gesture.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const { clientX: x, clientY: y } = event;
    if (!active.moved && Math.hypot(x - active.startX, y - active.startY) < 5) return;
    active.moved = true;

    const scroller = board.current;
    if (scroller && scroller.scrollWidth > scroller.clientWidth) {
      const { left, right } = scroller.getBoundingClientRect();
      if (x < left + 36) scroller.scrollLeft -= 18;
      if (x > right - 36) scroller.scrollLeft += 18;
    }
    if (y < 52) window.scrollBy(0, -18);
    if (y > window.innerHeight - 52) window.scrollBy(0, 18);
    setDrag({ session: active.session, x, y, target: getTarget(x, y) });
  }

  function cancelDrag() {
    gesture.current = null;
    setDrag(undefined);
  }

  function endDrag(event: PointerEvent<HTMLButtonElement>) {
    const active = gesture.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const target = active.moved && getTarget(event.clientX, event.clientY);
    cancelDrag();
    if (target) void moveSession(active.session, target);
  }

  function moveWithKeyboard(event: KeyboardEvent<HTMLButtonElement>, session: PlannedSession) {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const day = sessionsByDate[session.date] ?? [];
    const index = day.findIndex(block => block.id === session.id);
    if (event.key === 'ArrowUp' && index > 0) {
      void moveSession(session, { date: session.date, before: day[index - 1].id });
    } else if (event.key === 'ArrowDown' && index < day.length - 1) {
      void moveSession(session, { date: session.date, before: day[index + 2]?.id });
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      const dayIndex = days.findIndex(item => item.dateStr === session.date);
      const date = days[dayIndex + (event.key === 'ArrowLeft' ? -1 : 1)]?.dateStr;
      if (date) void moveSession(session, { date, before: sessionsByDate[date]?.[index]?.id });
    }
  }

  return (
    <div className="weekly-schedule">
      <p id="weekly-schedule-instructions" className="sr-only">
        Use a alça para arrastar. Com o teclado, use as setas para mover o bloco.
      </p>
      <div ref={board} className="weekly-schedule-scroll" aria-busy={isSaving}>
        <div className="weekly-schedule-grid">
          {days.map(day => {
            const sessions = sessionsByDate[day.dateStr] ?? [];
            const target = drag?.target?.date === day.dateStr ? drag.target : undefined;
            const weekday = day.dateObj.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
            return (
              <section
                key={day.dateStr}
                data-week-day={day.dateStr}
                aria-label={day.dateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                className="weekly-schedule-day"
                data-today={day.isToday}
                data-drop-target={!!target}
              >
                <header className="weekly-schedule-day-header">
                  <div className="weekly-schedule-day-title">
                    <span>{weekday}</span>
                    {day.isToday && <span className="weekly-schedule-today">Hoje</span>}
                    <time dateTime={day.dateStr}>{day.dateObj.getDate()}</time>
                  </div>
                  {sessions.length > 0 && (
                    <div className="weekly-schedule-time"><Clock size={13} /> {plannedDuration(sessions)} planejados</div>
                  )}
                </header>
                <div className="weekly-schedule-notes">
                  {sessions.map(session => {
                    const done = PlannerService.isSessionStudied(session, studySessions);
                    return (
                      <div
                        key={session.id}
                        className="weekly-schedule-note"
                        data-week-session={session.id}
                        data-done={done}
                        data-dragging={drag?.session.id === session.id}
                        data-insert={target?.before === session.id}
                        style={done ? undefined : getNoteColor(session)}
                      >
                        <button type="button" className="weekly-schedule-open" onClick={() => onClickSession(session)}>
                          <span className="weekly-schedule-subject" title={session.disciplinaName}>{session.disciplinaName}</span>
                          <span className="weekly-schedule-topic" title={session.assuntoName}>{session.assuntoName || 'Tópico geral'}</span>
                          <span className="weekly-schedule-time"><Clock size={13} /> {session.durationMinutes} min</span>
                        </button>
                        {done && <span className="weekly-schedule-done" title="Concluído"><Check size={16} /><span className="sr-only">Concluído</span></span>}
                        <button
                          type="button"
                          className="weekly-schedule-grip"
                          aria-label={`Mover bloco de ${session.disciplinaName}: ${session.assuntoName || 'Tópico geral'}`}
                          aria-describedby="weekly-schedule-instructions"
                          title="Arrastar bloco"
                          disabled={isSaving}
                          onPointerDown={event => startDrag(event, session)}
                          onPointerMove={updateDrag}
                          onPointerUp={endDrag}
                          onPointerCancel={cancelDrag}
                          onLostPointerCapture={cancelDrag}
                          onKeyDown={event => moveWithKeyboard(event, session)}
                        >
                          <GripVertical size={15} />
                        </button>
                      </div>
                    );
                  })}
                  {target && !target.before && <div className="weekly-schedule-insertion" />}
                  {sessions.length === 0 && (
                    <div className="weekly-schedule-empty">
                      <CalendarDays size={24} />
                      <span>Sem blocos</span>
                    </div>
                  )}
                </div>
                {sessions.length === 0 && (
                  <button type="button" className="weekly-schedule-add" onClick={() => onAddSession(day.dateStr)}>
                    <Plus size={15} /> Adicionar bloco
                  </button>
                )}
              </section>
            );
          })}
        </div>
      </div>
      <p role="status" className={notice || isSaving ? 'weekly-schedule-status' : 'sr-only'}>
        {isSaving ? 'Salvando posição do bloco…' : notice}
      </p>
      {drag && (
        <div
          aria-hidden="true"
          className="weekly-schedule-note weekly-schedule-preview"
          style={{ ...getNoteColor(drag.session), left: drag.x, top: drag.y }}
        >
          <span className="weekly-schedule-subject">{drag.session.disciplinaName}</span>
          <span className="weekly-schedule-topic">{drag.session.assuntoName || 'Tópico geral'}</span>
        </div>
      )}
    </div>
  );
}
