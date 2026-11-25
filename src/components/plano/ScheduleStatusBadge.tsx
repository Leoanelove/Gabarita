export function ScheduleStatusBadge({ done, inProgress, overdue }: { done: boolean; inProgress: boolean; overdue: boolean }) {
  const status = done ? 'done' : inProgress ? 'in-progress' : 'pending';

  return (
    <span className="schedule-status-badge" data-status={status}>
      {done ? 'Concluída' : inProgress ? 'Em andamento' : overdue ? 'Atrasada' : 'Pendente'}
    </span>
  );
}
