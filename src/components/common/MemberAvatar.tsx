import type { Member } from '../../types';

interface Props {
  member: Member | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
};

export function MemberAvatar({ member, size = 'md', className = '' }: Props) {
  if (!member) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gray-200 flex items-center justify-center text-gray-400 font-medium flex-shrink-0 ${className}`}>
        ?
      </div>
    );
  }

  if (member.avatar_url) {
    return (
      <img
        src={member.avatar_url}
        alt={member.full_name}
        title={member.full_name}
        className={`${sizeClasses[size]} rounded-full object-cover flex-shrink-0 ring-1 ring-white/20 ${className}`}
        onError={(e) => {
          const target = e.currentTarget as HTMLImageElement;
          target.style.display = 'none';
          const fallback = target.nextElementSibling as HTMLElement | null;
          if (fallback) fallback.style.display = 'flex';
        }}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0 ${className}`}
      style={{ backgroundColor: member.avatar_color }}
      title={member.full_name}
    >
      {member.initials}
    </div>
  );
}
