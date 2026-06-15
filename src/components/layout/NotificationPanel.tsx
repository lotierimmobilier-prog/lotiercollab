import { useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, X, ClipboardList, MessageSquare, RefreshCw } from 'lucide-react';
import type { Notification } from '../../types';
import { formatDateTime } from '../../lib/dateUtils';

interface Props {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onNavigateToTask?: (taskId: string) => void;
  onClose: () => void;
}

const typeIcon = {
  task_assigned: ClipboardList,
  comment_added: MessageSquare,
  task_updated: RefreshCw,
};

const typeColor = {
  task_assigned: 'text-blue-500 bg-blue-50',
  comment_added: 'text-emerald-500 bg-emerald-50',
  task_updated: 'text-orange-500 bg-orange-50',
};

export function NotificationPanel({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onNavigateToTask,
  onClose,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-150"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-[#1A3A5C] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#1A3A5C] px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
              title="Tout marquer comme lu"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Tout lire
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="max-h-[420px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Bell className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">Aucune notification</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map(notif => {
              const Icon = typeIcon[notif.type] ?? Bell;
              const colors = typeColor[notif.type] ?? 'text-gray-500 bg-gray-50';
              const timeLabel = notif.created_at ? formatDateTime(notif.created_at) : '';

              return (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 px-4 py-3 group transition-colors ${
                    notif.read ? 'bg-white hover:bg-gray-50' : 'bg-blue-50/40 hover:bg-blue-50/60'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${colors}`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => {
                      if (!notif.read) onMarkAsRead(notif.id);
                      if (notif.task_id && onNavigateToTask) onNavigateToTask(notif.task_id);
                    }}
                  >
                    <p className={`text-sm leading-snug ${notif.read ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>
                      {notif.title}
                    </p>
                    {notif.body && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.body}</p>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1">{timeLabel || 'maintenant'}</p>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    {!notif.read && (
                      <button
                        onClick={() => onMarkAsRead(notif.id)}
                        className="p-1 text-gray-400 hover:text-blue-500 rounded transition-colors"
                        title="Marquer comme lu"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(notif.id)}
                      className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {!notif.read && (
                    <div className="w-2 h-2 rounded-full bg-[#1A3A5C] flex-shrink-0 mt-2" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
