import type { Project } from '../../types';

interface Props {
  project: Project | null | undefined;
  size?: 'sm' | 'md';
}

export function ProjectBadge({ project, size = 'sm' }: Props) {
  if (!project) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 ${size === 'sm' ? 'text-xs' : 'text-sm'} text-gray-600`}>
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: project.color }}
      />
      {project.name}
    </span>
  );
}
