import type { TaskPriority } from '../types';

export const priorityConfig: Record<TaskPriority, { label: string; border: string; dot: string; text: string }> = {
  low: { label: 'Faible', border: 'border-l-gray-300', dot: 'bg-gray-300', text: 'text-gray-500' },
  normal: { label: 'Normal', border: 'border-l-transparent', dot: 'bg-gray-400', text: 'text-gray-600' },
  high: { label: 'Élevée', border: 'border-l-orange-400', dot: 'bg-orange-400', text: 'text-orange-600' },
  urgent: { label: 'Urgent', border: 'border-l-red-500', dot: 'bg-red-500', text: 'text-red-600' },
};
