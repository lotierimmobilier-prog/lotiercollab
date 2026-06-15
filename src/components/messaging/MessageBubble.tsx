import { useState } from 'react';
import { Reply, Pencil, Trash2, Check, X, SquareCheck as CheckSquare, CornerUpLeft, FileText, ExternalLink, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Message, Member, MessageAttachment } from '../../types';
import { MemberAvatar } from '../common/MemberAvatar';

interface Props {
  message: Message;
  isOwn: boolean;
  currentMember: Member | null;
  onReply: (message: Message) => void;
  onEdit: (messageId: string, body: string) => Promise<void>;
  onDelete: (messageId: string) => Promise<void>;
  onAssignTask?: (taskId: string, taskTitle: string) => void;
}

const OWN_BG = '#DCF8C6';
const OWN_TEXT = '#1a1a1a';
const OTHER_BG = '#F0F2F5';
const OTHER_TEXT = '#1a1a1a';

function AttachmentPreview({ attachment, isOwn, authorColor }: { attachment: MessageAttachment; isOwn: boolean; authorColor: string }) {
  const isImage = attachment.file_type.startsWith('image/');

  if (isImage) {
    return (
      <a
        href={attachment.file_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-xl overflow-hidden hover:opacity-90 transition-opacity"
      >
        <img
          src={attachment.file_url}
          alt={attachment.file_name}
          className="max-w-48 max-h-48 object-cover"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      </a>
    );
  }

  return (
    <a
      href={attachment.file_url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-opacity hover:opacity-80"
      style={isOwn
        ? { backgroundColor: 'rgba(0,0,0,0.06)', borderColor: 'rgba(0,0,0,0.10)', color: OWN_TEXT }
        : { backgroundColor: `${authorColor}10`, borderColor: `${authorColor}25`, color: OTHER_TEXT }
      }
    >
      <div
        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: isOwn ? 'rgba(0,0,0,0.08)' : `${authorColor}20` }}
      >
        <FileText className="w-4 h-4" style={{ color: isOwn ? '#555' : authorColor }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium truncate">{attachment.file_name}</p>
        {attachment.file_size > 0 && (
          <p className="text-[10px] opacity-60">
            {attachment.file_size < 1024 * 1024
              ? `${(attachment.file_size / 1024).toFixed(0)} Ko`
              : `${(attachment.file_size / (1024 * 1024)).toFixed(1)} Mo`}
          </p>
        )}
      </div>
      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 opacity-40" />
    </a>
  );
}

export function MessageBubble({ message, isOwn, onReply, onEdit, onDelete, onAssignTask }: Props) {
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(message.body);
  const [hovered, setHovered] = useState(false);

  const isDeleted = !!message.deleted_at;
  const isEdited = !!message.edited_at && !isDeleted;

  const handleSaveEdit = async () => {
    if (!editBody.trim()) return;
    await onEdit(message.id, editBody.trim());
    setEditing(false);
  };

  const handleCancelEdit = () => {
    setEditBody(message.body);
    setEditing(false);
  };

  const timeStr = format(new Date(message.created_at), "HH:mm", { locale: fr });
  const attachments = isDeleted ? [] : (message.attachments ?? []);
  const authorColor = message.author?.avatar_color ?? '#1A3A5C';

  const bubbleBg = isDeleted
    ? (isOwn ? '#e8e8e8' : '#e8e8e8')
    : (isOwn ? OWN_BG : OTHER_BG);
  const bubbleText = isOwn ? OWN_TEXT : OTHER_TEXT;

  return (
    <div
      className={`flex gap-2 group ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {!isOwn && (
        <div className="flex-shrink-0 self-end mb-1">
          {message.author ? (
            <MemberAvatar member={message.author} size="sm" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gray-300" />
          )}
        </div>
      )}

      <div className={`flex flex-col gap-0.5 max-w-[68%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {editing ? (
          <div className="w-full min-w-[240px]">
            <textarea
              value={editBody}
              onChange={e => setEditBody(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400"
              rows={3}
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveEdit(); }
                if (e.key === 'Escape') handleCancelEdit();
              }}
            />
            <div className={`flex gap-1.5 mt-1.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <button
                onClick={handleCancelEdit}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-3 h-3" /> Annuler
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex items-center gap-1 text-xs text-white bg-emerald-600 hover:bg-emerald-700 px-2 py-1 rounded-lg transition-colors"
              >
                <Check className="w-3 h-3" /> Enregistrer
              </button>
            </div>
          </div>
        ) : (
          <>
            {!isDeleted && message.reply_to && (
              <div
                className={`flex items-start gap-1.5 text-xs rounded-xl px-2.5 py-1.5 max-w-full mb-0.5 ${
                  isOwn
                    ? 'bg-black/5 border-r-[3px] border-emerald-500 self-end'
                    : 'bg-black/5 border-l-[3px] border-gray-400 self-start'
                }`}
              >
                <CornerUpLeft className="w-3 h-3 flex-shrink-0 mt-0.5 text-gray-400" />
                <div className="min-w-0">
                  <span
                    className="font-semibold text-[10px]"
                    style={{ color: message.reply_to.author?.avatar_color ?? '#1A3A5C' }}
                  >
                    {message.reply_to.author?.full_name ?? 'Inconnu'}
                  </span>
                  <p className="truncate text-[11px] text-gray-500 mt-0.5">{message.reply_to.body}</p>
                </div>
              </div>
            )}

            {!isDeleted && message.cited_task_title && (
              <div className="flex items-center gap-1.5 bg-sky-50 border border-sky-100 rounded-xl px-2.5 py-1.5 text-xs text-sky-700 mb-0.5 group/task">
                <CheckSquare className="w-3.5 h-3.5 flex-shrink-0 text-sky-400" />
                <span className="font-medium truncate flex-1">{message.cited_task_title}</span>
                {onAssignTask && message.cited_task_id && (
                  <button
                    onClick={() => onAssignTask(message.cited_task_id!, message.cited_task_title!)}
                    className="flex items-center gap-1 ml-1 px-2 py-0.5 rounded-lg bg-[#1A3A5C] text-white text-[10px] font-semibold hover:bg-[#142d47] transition-colors flex-shrink-0 opacity-0 group-hover/task:opacity-100"
                    title="Assigner cette tâche"
                  >
                    <UserPlus className="w-3 h-3" />
                    Assigner
                  </button>
                )}
              </div>
            )}

            {isEdited && (
              <span className={`text-[10px] italic text-gray-400 mb-0.5 ${isOwn ? 'self-end' : 'self-start'}`}>
                Message modifie
              </span>
            )}

            <div
              className={`relative rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.12)] overflow-hidden ${
                isOwn ? 'rounded-br-sm' : 'rounded-bl-sm'
              } ${isDeleted ? 'opacity-70' : ''}`}
              style={{ backgroundColor: bubbleBg, color: bubbleText }}
            >
              {!isOwn && !isDeleted && (
                <div
                  className="px-3.5 pt-2.5 pb-0.5 text-[11px] font-bold leading-tight tracking-wide"
                  style={{ color: authorColor }}
                >
                  {message.author?.full_name ?? 'Inconnu'}
                </div>
              )}

              {isDeleted ? (
                <div className="px-3.5 py-2.5 flex items-center gap-2">
                  <Trash2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="text-[13px] italic text-gray-400">Message supprime</span>
                </div>
              ) : (
                <>
                  {message.body && (
                    <div className="px-3.5 pt-1.5 pb-1 text-[13.5px] leading-relaxed whitespace-pre-wrap break-words">
                      {message.body}
                    </div>
                  )}

                  {attachments.length > 0 && (
                    <div className="px-3 pb-2 flex flex-col gap-1.5">
                      {attachments.map(att => (
                        <AttachmentPreview
                          key={att.id}
                          attachment={att}
                          isOwn={isOwn}
                          authorColor={authorColor}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              <div className="flex items-center gap-1 px-3.5 pb-2 justify-end">
                <span className="text-[10px] text-gray-400 tabular-nums">{timeStr}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {!isDeleted && (
        <div
          className={`flex items-center gap-0.5 self-end mb-1 transition-opacity ${
            hovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          } ${isOwn ? 'flex-row-reverse' : ''}`}
        >
          <button
            onClick={() => onReply(message)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-gray-100 transition-colors"
            title="Repondre"
          >
            <Reply className="w-3.5 h-3.5" />
          </button>
          {isOwn && !editing && (
            <>
              <button
                onClick={() => { setEditBody(message.body); setEditing(true); }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-gray-100 transition-colors"
                title="Modifier"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete(message.id)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-gray-100 transition-colors"
                title="Supprimer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
