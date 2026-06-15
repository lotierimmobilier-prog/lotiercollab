import { ReactNode, useState } from 'react';
import { UserCheck, X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { useAuth } from '../../hooks/useAuth';
import { useAppData } from '../../hooks/useAppData';

interface Props {
  children: ReactNode;
}

export function AppLayout({ children }: Props) {
  const { impersonatedMemberId, setImpersonatedMemberId, isSuperAdmin } = useAuth();
  const { members } = useAppData();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const impersonatedMember = impersonatedMemberId
    ? members.find(m => m.id === impersonatedMemberId)
    : null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — always visible on lg+, slide-in on mobile */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {isSuperAdmin && impersonatedMember && (
          <div className="flex items-center justify-between bg-amber-50 border-b border-amber-200 px-4 py-2">
            <div className="flex items-center gap-2 text-sm text-amber-800">
              <UserCheck className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs">Vue : <strong>{impersonatedMember.full_name}</strong></span>
            </div>
            <button
              onClick={() => setImpersonatedMemberId(null)}
              className="flex items-center gap-1.5 text-xs text-amber-700 hover:text-amber-900 font-medium transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Quitter cette vue</span>
            </button>
          </div>
        )}

        {/* Pass hamburger toggle to children via context won't work cleanly,
            so we expose it via a data attribute on the layout root instead.
            The Topbar reads it from the DOM event. */}
        <div
          id="app-layout-root"
          className="flex-1 flex flex-col min-w-0 pb-[60px] lg:pb-0"
          data-sidebar-toggle="true"
          onClickCapture={(e) => {
            const target = e.target as HTMLElement;
            if (target.closest('[data-hamburger]')) {
              setSidebarOpen(v => !v);
            }
          }}
        >
          {children}
        </div>

        <MobileBottomNav />
      </div>
    </div>
  );
}
