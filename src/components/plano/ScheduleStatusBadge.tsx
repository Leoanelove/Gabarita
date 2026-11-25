export function ScheduleStatusBadge({ done, overdue }: { done: boolean; overdue: boolean }) {
  return (
    <span className="schedule-status-badge" data-complete={done}>
      {done ? 'Concluída' : overdue ? 'Atrasada' : 'Pendente'}
    </span>
  );
}
