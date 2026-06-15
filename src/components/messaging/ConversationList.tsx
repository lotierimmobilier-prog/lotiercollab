import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MessageSquare, Plus, Users } from 'lucide-react';
import type { MessageConversation } from '../../types';
import { MemberAvatar } from '../common/MemberAvatar';

interface Props {
  conversations: MessageConversation[];
  selectedId: string | null;
  currentMemberId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export function ConversationList({ conversations, selectedId, currentMemberId, onSelect, onNew }: Props) {
  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-100">
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#1A3A5C]" />
          <h2 className="text-sm font-semibold text-gray-900">Messages</h2>
        </div>
        <button
          onClick={onNew}
          className="flex items-center gap-1.5 text-xs font-medium text-white bg-[#1A3A5C] hover:bg-[#1A3A5C]/90 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Nouveau
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <MessageSquare className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 font-medium">Aucune conversation</p>
            <p className="text-xs text-gray-400 mt-1">Démarrez une nouvelle discussion</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {conversations.map(conv => {
              const others = (conv.members ?? []).filter(m => m.id !== currentMemberId);
              const isSelected = conv.id === selectedId;
              const lastMsg = conv.last_message;

              return (
                <button
                  key={conv.id}
                  onClick={() => onSelect(conv.id)}
                  className={`w-full text-left px-4 py-3.5 transition-colors ${
                    isSelected ? 'bg-[#1A3A5C]/6 border-l-2 border-[#1A3A5C]' : 'hover:bg-gray-50 border-l-2 border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 relative">
                      {others.length === 1 ? (
                        <MemberAvatar member={others[0]} size="md" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
                          <Users className="w-4 h-4 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-gray-900 truncate">{conv.title}</p>
                        {lastMsg && (
                          <span className="text-[10px] text-gray-400 flex-shrink-0">
                            {formatDistanceToNow(new Date(lastMsg.created_at), { addSuffix: false, locale: fr })}
                          </span>
                        )}
                      </div>
                      {others.length > 0 && (
                        <p className="text-[10px] text-gray-400 truncate mb-0.5">
                          {others.map(m => m.full_name).join(', ')}
                        </p>
                      )}
                      {lastMsg && (
                        <p className="text-xs text-gray-500 truncate">
                          <span className="font-medium">{lastMsg.author?.full_name?.split(' ')[0]} :</span>{' '}
                          {lastMsg.body}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
