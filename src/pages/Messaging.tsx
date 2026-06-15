import { useState, useEffect, useRef } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { useAuth } from '../hooks/useAuth';
import { setTaskAssignees } from '../hooks/useStore';
import { useAppData } from '../hooks/useAppData';
import { useConversations, useMessages, useMessagingContacts } from '../hooks/useMessaging';
import { ConversationList } from '../components/messaging/ConversationList';
import { MessageBubble } from '../components/messaging/MessageBubble';
import { MessageComposer } from '../components/messaging/MessageComposer';
import { NewConversationModal } from '../components/messaging/NewConversationModal';
import { TaskAssignModal } from '../components/messaging/TaskAssignModal';
import { MemberAvatar } from '../components/common/MemberAvatar';
import { Users, MessageSquare, Info, X } from 'lucide-react';
import type { Message, Member } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function Messaging() {
  const { memberId: authMemberId, isSuperAdmin } = useAuth();
  const { members, tasks } = useAppData();

  const effectiveMemberId = authMemberId;

  const { conversations, createConversation } = useConversations(effectiveMemberId, isSuperAdmin);
  const { allowedContacts } = useMessagingContacts(effectiveMemberId);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const { messages, sendMessage, editMessage, deleteMessage } = useMessages(selectedConvId);
  const [showNewModal, setShowNewModal] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [assignTarget, setAssignTarget] = useState<{ taskId: string; taskTitle: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevConvIdRef = useRef<string | null>(null);
  const prevMessageCountRef = useRef<number>(0);

  const selectedConv = conversations.find(c => c.id === selectedConvId) ?? null;
  const currentMember: Member | null = effectiveMemberId
    ? members.find(m => m.id === effectiveMemberId) ?? null
    : null;

  useEffect(() => {
    const isConvSwitch = prevConvIdRef.current !== selectedConvId;
    const hasNewMessage = !isConvSwitch && messages.length > prevMessageCountRef.current;

    if (hasNewMessage) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    prevConvIdRef.current = selectedConvId;
    prevMessageCountRef.current = messages.length;
  }, [messages, selectedConvId]);

  useEffect(() => {
    if (conversations.length > 0 && !selectedConvId) {
      setSelectedConvId(conversations[0].id);
    }
  }, [conversations, selectedConvId]);

  const handleSend = async (params: {
    body: string;
    replyToId?: string | null;
    citedTaskId?: string | null;
    citedTaskTitle?: string | null;
    files?: File[];
  }) => {
    if (!effectiveMemberId) return;
    await sendMessage({ ...params, authorId: effectiveMemberId });
    setReplyTo(null);
  };

  const handleCreate = async (title: string, memberIds: string[], firstMessage?: string, files?: File[]) => {
    if (!effectiveMemberId) return;
    const { data } = await createConversation(title, memberIds, effectiveMemberId);
    if (data) {
      setSelectedConvId(data.id);
      if (firstMessage || (files && files.length > 0)) {
        await sendMessage({
          body: firstMessage ?? (files && files.length > 0 ? `${files.length} fichier${files.length > 1 ? 's' : ''}` : ''),
          authorId: effectiveMemberId,
          files: files ?? [],
          overrideConversationId: data.id,
        });
      }
    }
  };

  const groupedMessages = messages.reduce<{ date: string; msgs: Message[] }[]>((groups, msg) => {
    const dateKey = format(new Date(msg.created_at), 'd MMMM yyyy', { locale: fr });
    const last = groups[groups.length - 1];
    if (last && last.date === dateKey) {
      last.msgs.push(msg);
    } else {
      groups.push({ date: dateKey, msgs: [msg] });
    }
    return groups;
  }, []);

  if (!effectiveMemberId && !isSuperAdmin) {
    return (
      <AppLayout>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 text-sm">Messagerie non disponible.</p>
        </div>
      </AppLayout>
    );
  }

  const convMembers = selectedConv?.members ?? [];
  const otherMembers = convMembers.filter(m => m.id !== effectiveMemberId);

  return (
    <AppLayout>
      <div className="flex h-full overflow-hidden bg-gray-50">
        <div className="w-72 flex-shrink-0 h-full overflow-hidden">
          <ConversationList
            conversations={conversations}
            selectedId={selectedConvId}
            currentMemberId={effectiveMemberId ?? ''}
            onSelect={id => { setSelectedConvId(id); setShowInfo(false); }}
            onNew={() => setShowNewModal(true)}
          />
        </div>

        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {selectedConv ? (
            <>
              <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex -space-x-1.5">
                    {otherMembers.slice(0, 3).map(m => (
                      <MemberAvatar key={m.id} member={m} size="sm" className="ring-2 ring-white" />
                    ))}
                    {otherMembers.length > 3 && (
                      <div className="w-7 h-7 rounded-full bg-gray-200 ring-2 ring-white flex items-center justify-center text-[10px] font-bold text-gray-500">
                        +{otherMembers.length - 3}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-gray-900 truncate">{selectedConv.title}</h2>
                    <p className="text-[10px] text-gray-400 truncate">
                      {convMembers.map(m => m.full_name).join(' · ')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInfo(v => !v)}
                  className={`p-2 rounded-xl transition-colors ${showInfo ? 'bg-[#1A3A5C]/10 text-[#1A3A5C]' : 'text-gray-400 hover:text-[#1A3A5C] hover:bg-gray-100'}`}
                  title="Informations"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                  {groupedMessages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                        <MessageSquare className="w-5 h-5 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">Aucun message pour l'instant</p>
                      <p className="text-xs text-gray-400 mt-1">Démarrez la conversation !</p>
                    </div>
                  )}
                  {groupedMessages.map(group => (
                    <div key={group.date}>
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-gray-100" />
                        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{group.date}</span>
                        <div className="flex-1 h-px bg-gray-100" />
                      </div>
                      <div className="space-y-3">
                        {group.msgs.map(msg => (
                          <MessageBubble
                            key={msg.id}
                            message={msg}
                            isOwn={msg.author_id === effectiveMemberId}
                            currentMember={currentMember}
                            onReply={setReplyTo}
                            onEdit={editMessage}
                            onDelete={deleteMessage}
                            onAssignTask={(taskId, taskTitle) => setAssignTarget({ taskId, taskTitle })}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {showInfo && (
                  <div className="w-64 flex-shrink-0 bg-white border-l border-gray-100 p-4 overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Participants</h3>
                      <button onClick={() => setShowInfo(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {convMembers.map(m => (
                        <div key={m.id} className="flex items-center gap-2.5">
                          <MemberAvatar member={m} size="sm" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-800 truncate">{m.full_name}</p>
                            <p className="text-[10px] text-gray-400 capitalize">{m.role}</p>
                          </div>
                          {m.id === effectiveMemberId && (
                            <span className="ml-auto text-[9px] font-semibold text-[#1A3A5C] bg-[#1A3A5C]/10 rounded px-1.5 py-0.5">Vous</span>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="mt-6">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Thème</h3>
                      <p className="text-sm text-gray-800 font-medium">{selectedConv.title}</p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        Créée le {format(new Date(selectedConv.created_at), "d MMM yyyy", { locale: fr })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <MessageComposer
                onSend={handleSend}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
                tasks={tasks}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-gray-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-1">Sélectionnez une conversation</h3>
              <p className="text-sm text-gray-400">Ou créez-en une nouvelle pour commencer à échanger</p>
              <button
                onClick={() => setShowNewModal(true)}
                className="mt-4 px-4 py-2 text-sm font-medium text-white bg-[#1A3A5C] hover:bg-[#1A3A5C]/90 rounded-xl transition-colors"
              >
                Nouvelle conversation
              </button>
            </div>
          )}
        </div>
      </div>

      {showNewModal && (
        <NewConversationModal
          members={members}
          currentMemberId={effectiveMemberId ?? ''}
          allowedContactIds={isSuperAdmin ? null : (allowedContacts.length > 0 ? allowedContacts : null)}
          onClose={() => setShowNewModal(false)}
          onCreate={handleCreate}
        />
      )}

      {assignTarget && (() => {
        const task = tasks.find(t => t.id === assignTarget.taskId);
        if (!task) return null;
        return (
          <TaskAssignModal
            task={task}
            members={members}
            onAssign={async (taskId, memberIds) => {
              await setTaskAssignees(taskId, memberIds, assignTarget.taskTitle);
            }}
            onClose={() => setAssignTarget(null)}
          />
        );
      })()}
    </AppLayout>
  );
}
