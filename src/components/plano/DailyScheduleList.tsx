import { useId, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { GripVertical } from 'lucide-react';
import type { PlannedSession } from '../../types';
import { PlannerService } from '../../services/plannerService';
import { getNoteColor } from './WeeklySchedule';

interface DailyScheduleListProps {
  sessions: PlannedSession[];
  onOpenSession: (session: PlannedSession) => void;
  onMoveSession: (sessionId: string, beforeSessionId?: string) => Promise<void>;
  renderSession: (session: PlannedSession, done: boolean) => ReactNode;
}

interface Row {
  top: number;
  height: number;
}

interface Gesture {
  pointerId: number;
  from: number;
  startY: number;
  listTop: number;
  rows: Row[];
  moved: boolean;
}

interface Preview {
  from: number;
  to: number;
  offset: number;
  gap: number;
  settling?: boolean;
}

export function DailyScheduleList({ sessions, onOpenSession, onMoveSession, renderSession }: DailyScheduleListProps) {
  const instructionsId = useId();
  const list = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const busy = useRef(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const waitForAnimation = () => new Promise<void>(resolve => {
    window.setTimeout(resolve, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 180);
  });

  async function move(from: number, to: number, placement?: Preview) {
    if (busy.current || from === to || !sessions[from] || !sessions[to]) return;
    busy.current = true;
    setIsSaving(true);
    setNotice('');
    const before = sessions[to + (from < to ? 1 : 0)]?.id;
    try {
      if (placement) {
        setPreview(placement);
        await waitForAnimation();
      }
      await onMoveSession(sessions[from].id, before);
      setNotice('Posição do bloco salva.');
    } catch {
      if (placement) {
        setPreview({ ...placement, to: from, offset: 0 });
        await waitForAnimation();
      }
      setNotice('Não foi possível salvar a posição do bloco. Tente novamente.');
    } finally {
      setPreview(null);
      busy.current = false;
      setIsSaving(false);
    }
  }

  function startDrag(event: PointerEvent<HTMLButtonElement>, from: number) {
    if (!list.current || !event.isPrimary || event.button !== 0 || busy.current || gesture.current) return;
    const { top: listTop } = list.current.getBoundingClientRect();
    const rows = Array.from(list.current.querySelectorAll<HTMLElement>('[data-daily-session]'), card => {
      const { top, height } = card.getBoundingClientRect();
      return { top: top - listTop, height };
    });
    gesture.current = { pointerId: event.pointerId, from, startY: event.clientY, listTop, rows, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function getPreview(active: Gesture, x: number, y: number) {
    if (!list.current) return;
    const { top, left, right, bottom } = list.current.getBoundingClientRect();
    const { rows, from } = active;
    const source = rows[from];
    const last = rows[rows.length - 1];
    if (!source || rows.length < 2) return;

    const delta = y - active.startY + active.listTop - top;
    const center = source.top + source.height / 2 + delta;
    const insertion = rows.filter((_, index) => index !== from).findIndex(row => center < row.top + row.height / 2);
    const inside = x >= left && x <= right && y >= top && y <= bottom;
    const to = inside ? (insertion < 0 ? rows.length - 1 : insertion) : from;
    const offset = Math.min(last.top + last.height - source.top - source.height, Math.max(-source.top, delta));
    const gap = source.height + rows[1].top - rows[0].top - rows[0].height;
    return { from, to, offset, gap };
  }

  function updateDrag(event: PointerEvent<HTMLButtonElement>) {
    const active = gesture.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const { clientX: x, clientY: y } = event;
    if (!active.moved && Math.abs(y - active.startY) < 5) return;
    active.moved = true;
    if (y < 52) window.scrollBy(0, -18);
    if (y > window.innerHeight - 52) window.scrollBy(0, 18);
    setPreview(getPreview(active, x, y) ?? null);
  }

  async function restorePreview() {
    setPreview(current => current && { ...current, to: current.from, offset: 0, settling: true });
    busy.current = true;
    await waitForAnimation();
    setPreview(null);
    busy.current = false;
  }

  function cancelDrag() {
    const active = gesture.current;
    gesture.current = null;
    if (active?.moved) void restorePreview();
  }

  function finishDrag(event: PointerEvent<HTMLButtonElement>) {
    const active = gesture.current;
    if (!active || active.pointerId !== event.pointerId) return;
    gesture.current = null;
    if (!active.moved) return;

    const position = getPreview(active, event.clientX, event.clientY);
    if (!position || position.from === position.to) {
      void restorePreview();
      return;
    }
    const { from, to } = position;
    const source = active.rows[from];
    const target = active.rows[to];
    const offset = target.top - source.top + (from < to ? target.height - source.height : 0);
    void move(from, to, { ...position, offset, settling: true });
  }

  return (
    <>
      <p id={instructionsId} className="sr-only">Arraste o bloco ou use as setas para cima e para baixo no teclado.</p>
      <div ref={list} className="space-y-3" aria-busy={isSaving}>
        {sessions.map((session, index) => {
          const done = PlannerService.isSessionStudied(session);
          const lifted = preview?.from === index;
          let offset = 0;
          if (preview) {
            const { from, to, gap } = preview;
            if (lifted) offset = preview.offset;
            else if (index > from && index <= to) offset = -gap;
            else if (index >= to && index < from) offset = gap;
          }
          return (
            <article
              key={session.id}
              data-daily-session={session.id}
              data-lifted={lifted}
              data-animating={!!preview && (!lifted || preview.settling)}
              onClick={done ? undefined : () => onOpenSession(session)}
              className={`weekly-schedule-note daily-calendar-note relative pl-12 pr-4 py-3 sm:pl-14 sm:pr-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${done ? '' : 'cursor-pointer'}`}
              style={{ ...getNoteColor(session), transform: preview ? `translateY(${offset}px)` : undefined }}
            >
              <button
                type="button"
                className="daily-calendar-grip"
                disabled={sessions.length < 2}
                aria-disabled={isSaving}
                aria-label={`Mover bloco ${index + 1}: ${session.disciplinaName}`}
                aria-describedby={instructionsId}
                title="Arrastar para reordenar"
                onClick={event => event.stopPropagation()}
                onPointerDown={event => startDrag(event, index)}
                onPointerMove={updateDrag}
                onPointerUp={finishDrag}
                onPointerCancel={cancelDrag}
                onLostPointerCapture={cancelDrag}
                onKeyDown={event => {
                  if (event.key === 'Escape') cancelDrag();
                  if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
                  event.preventDefault();
                  if (!gesture.current) void move(index, index + (event.key === 'ArrowUp' ? -1 : 1));
                }}
              >
                <GripVertical className="w-4 h-4" />
              </button>
              {renderSession(session, done)}
            </article>
          );
        })}
      </div>
      <p role="status" className={notice || isSaving
        ? 'fixed right-4 bottom-20 lg:bottom-6 z-40 rounded-xl border border-primary/25 bg-white dark:bg-slate-900 px-4 py-3 text-xs font-bold shadow-lg pointer-events-none'
        : 'sr-only'}
      >
        {isSaving ? 'Salvando posição do bloco…' : notice}
      </p>
    </>
  );
}
