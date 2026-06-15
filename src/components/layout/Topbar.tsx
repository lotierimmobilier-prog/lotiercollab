import { ReactNode, useState } from 'react';
import { Bell, RefreshCw, Menu } from 'lucide-react';
import { NotificationPanel } from './NotificationPanel';
import { TaskDetailPanel } from '../tasks/TaskDetailPanel';
import { useNotifications } from '../../hooks/useStore';
import { useAppData } from '../../hooks/useAppData';
import { useAuth } from '../../hooks/useAuth';

interface Props {
  title: string;
  actions?: ReactNode;
  onNewTask?: () => void;
  onClearCache?: () => void;
}

export function Topbar({ title, actions, onClearCache }: Props) {
  const [showNotifs, setShowNotifs] = useState(false);
  const [quickTaskId, setQuickTaskId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { memberId } = useAuth();

  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications(memberId);
  const { projects, members } = useAppData();

  const handleOpenTask = (taskId: string) => {
    setShowNotifs(false);
    setQuickTaskId(taskId);
  };

  const handleClearCache = async () => {
    if (!onClearCache) return;
    setRefreshing(true);
    await onClearCache();
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <>
      <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Hamburger — mobile only */}
          <button
            data-hamburger
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Menu"
          >
            <Menu className="w-5 h-5 pointer-events-none" />
          </button>
          <h1 className="text-base font-semibold text-gray-800 truncate max-w-[180px] sm:max-w-none">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          {actions}

          {onClearCache && (
            <button
              onClick={handleClearCache}
              disabled={refreshing}
              title="Vider le cache et recharger les données"
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-200 text-gray-500 hover:text-[#1A3A5C] hover:border-[#1A3A5C]/30 hover:bg-[#1A3A5C]/5 transition-all text-xs font-medium disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden md:block">Actualiser</span>
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setShowNotifs(v => !v)}
              className={`relative w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
                showNotifs
                  ? 'bg-gray-100 text-gray-700'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
              )}
            </button>

            {showNotifs && (
              <NotificationPanel
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                onDelete={deleteNotification}
                onNavigateToTask={handleOpenTask}
                onClose={() => setShowNotifs(false)}
              />
            )}
          </div>
        </div>
      </header>

      {quickTaskId && (
        <TaskDetailPanel
          taskId={quickTaskId}
          onClose={() => setQuickTaskId(null)}
          projects={projects}
          members={members}
          currentMemberId={memberId ?? undefined}
          readOnly={false}
        />
      )}
    </>
  );
}
