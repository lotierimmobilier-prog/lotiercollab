import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderOpen, Users, SquareCheck as CheckSquare, StickyNote } from 'lucide-react';
import { useSidebarTheme } from '../../hooks/useSidebarTheme';

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Accueil' },
  { to: '/tasks', icon: CheckSquare, label: 'Tâches' },
  { to: '/projects', icon: FolderOpen, label: 'Projets' },
  { to: '/members', icon: Users, label: 'Membres' },
  { to: '/memos', icon: StickyNote, label: 'Mémos' },
];

export function MobileBottomNav() {
  const { theme } = useSidebarTheme();
  const isDark = theme === 'dark';

  return (
    <nav
      className={`
        fixed bottom-0 left-0 right-0 z-30 lg:hidden
        flex items-stretch
        border-t safe-area-inset-bottom
        ${isDark ? 'bg-[#1A3A5C] border-white/10' : 'bg-white border-gray-200'}
      `}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {links.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
              isActive
                ? isDark
                  ? 'text-white'
                  : 'text-[#1A3A5C]'
                : isDark
                ? 'text-white/40'
                : 'text-gray-400'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${
                  isActive
                    ? isDark
                      ? 'bg-white/15'
                      : 'bg-[#1A3A5C]/10'
                    : ''
                }`}
              >
                <Icon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
              </div>
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
