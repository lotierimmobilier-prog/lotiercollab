import type { TaskStatus } from '../../types';

interface Props {
  status: TaskStatus;
  className?: string;
}

const statusConfig: Record<TaskStatus, { label: string; dot: string; bg: string; text: string }> = {
  todo: { label: 'À faire', dot: 'bg-gray-400', bg: 'bg-gray-100', text: 'text-gray-600' },
  doing: { label: 'En cours', dot: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
  done: { label: 'Terminé', dot: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700' },
  blocked: { label: 'Bloqué', dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700' },
};

export function StatusBadge({ status, className = '' }: Props) {
  const cfg = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export { statusConfig };
