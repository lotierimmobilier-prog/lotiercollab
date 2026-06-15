import { useState, useRef, useEffect } from 'react';
import { Send, Link2, X, CornerUpLeft, Paperclip, FileText, Image, Film, Loader as Loader2, Bold, Italic, Smile, AlignLeft } from 'lucide-react';
import type { Message, Task } from '../../types';
import { CitationPicker } from './CitationPicker';

interface Props {
  onSend: (params: {
    body: string;
    replyToId?: string | null;
    citedTaskId?: string | null;
    citedTaskTitle?: string | null;
    files?: File[];
  }) => Promise<void>;
  replyTo: Message | null;
  onCancelReply: () => void;
  tasks: Task[];
}

function FileIcon({ type }: { type: string }) {
  if (type.startsWith('image/')) return <Image className="w-3.5 h-3.5" />;
  if (type.startsWith('video/')) return <Film className="w-3.5 h-3.5" />;
  return <FileText className="w-3.5 h-3.5" />;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function MessageComposer({ onSend, replyTo, onCancelReply, tasks }: Props) {
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [showCitePicker, setShowCitePicker] = useState(false);
  const [citedTask, setCitedTask] = useState<Task | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [showFormatBar, setShowFormatBar] = useState(false);
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [body]);

  const handleSend = async () => {
    const trimmed = body.trim();
    if ((!trimmed && files.length === 0) || sending) return;
    setSending(true);

    let finalBody = trimmed || (files.length > 0 ? `${files.length} fichier${files.length > 1 ? 's' : ''}` : '');
    if (bold && italic) finalBody = `***${finalBody}***`;
    else if (bold) finalBody = `**${finalBody}**`;
    else if (italic) finalBody = `*${finalBody}*`;

    await onSend({
      body: finalBody,
      replyToId: replyTo?.id ?? null,
      citedTaskId: citedTask?.id ?? null,
      citedTaskTitle: citedTask?.title ?? null,
      files,
    });
    setBody('');
    setCitedTask(null);
    setFiles([]);
    setBold(false);
    setItalic(false);
    onCancelReply();
    setSending(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    setFiles(prev => [...prev, ...selected]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const canSend = (body.trim().length > 0 || files.length > 0) && !sending;

  return (
    <div className={`border-t border-gray-100 bg-white transition-shadow ${focused ? 'shadow-[0_-4px_20px_rgba(0,0,0,0.06)]' : ''}`}>
      {replyTo && (
        <div className="flex items-start gap-2 mx-4 mt-3 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
          <CornerUpLeft className="w-3.5 h-3.5 text-[#1A3A5C] flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-semibold text-[#1A3A5C]">{replyTo.author?.full_name}</span>
            <p className="text-xs text-gray-500 truncate">{replyTo.body}</p>
          </div>
          <button onClick={onCancelReply} className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {citedTask && (
        <div className="flex items-center gap-2 mx-4 mt-3 bg-blue-50 rounded-xl px-3 py-2 border border-blue-100">
          <Link2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
          <span className="text-xs text-blue-700 flex-1 truncate font-medium">{citedTask.title}</span>
          <button onClick={() => setCitedTask(null)} className="text-blue-400 hover:text-blue-600 transition-colors flex-shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pt-3">
          {files.map((file, i) => (
            <div key={i} className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-2.5 py-1.5 max-w-48">
              <span className="text-gray-500 flex-shrink-0">
                <FileIcon type={file.type} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-700 truncate">{file.name}</p>
                <p className="text-[10px] text-gray-400">{formatBytes(file.size)}</p>
              </div>
              <button onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="px-4 pt-3 pb-0">
        <div className={`border rounded-2xl transition-all ${focused ? 'border-[#1A3A5C]/30 shadow-sm' : 'border-gray-200'}`}>
          <textarea
            ref={textareaRef}
            value={body}
            onChange={e => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => { setFocused(true); setShowFormatBar(true); }}
            onBlur={() => setFocused(false)}
            placeholder="Écrire un message... (Entrée pour envoyer, Shift+Entrée pour sauter une ligne)"
            rows={1}
            className={`w-full resize-none px-3.5 pt-3 pb-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none leading-relaxed rounded-t-2xl bg-transparent ${bold ? 'font-bold' : ''} ${italic ? 'italic' : ''}`}
            style={{ minHeight: '42px', maxHeight: '120px' }}
          />

          <div className="flex items-center justify-between px-2 pb-2 pt-1">
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-lg text-gray-400 hover:text-[#1A3A5C] hover:bg-gray-100 transition-colors"
                title="Joindre un fichier"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {showFormatBar && (
                <>
                  <button
                    onMouseDown={e => { e.preventDefault(); setBold(v => !v); textareaRef.current?.focus(); }}
                    className={`p-1.5 rounded-lg transition-colors ${bold ? 'bg-[#1A3A5C]/10 text-[#1A3A5C]' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
                    title="Gras (Ctrl+B)"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onMouseDown={e => { e.preventDefault(); setItalic(v => !v); textareaRef.current?.focus(); }}
                    className={`p-1.5 rounded-lg transition-colors ${italic ? 'bg-[#1A3A5C]/10 text-[#1A3A5C]' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
                    title="Italique (Ctrl+I)"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    title="Emoji"
                  >
                    <Smile className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-px h-4 bg-gray-200 mx-0.5" />
                </>
              )}

              <div className="relative">
                <button
                  onMouseDown={e => { e.preventDefault(); setShowCitePicker(v => !v); }}
                  className={`p-1.5 rounded-lg transition-colors ${showCitePicker ? 'bg-[#1A3A5C]/10 text-[#1A3A5C]' : 'text-gray-400 hover:text-[#1A3A5C] hover:bg-gray-100'}`}
                  title="Citer une tâche"
                >
                  <Link2 className="w-3.5 h-3.5" />
                </button>
                {showCitePicker && (
                  <CitationPicker
                    tasks={tasks}
                    onSelect={(task) => { setCitedTask(task); setShowCitePicker(false); textareaRef.current?.focus(); }}
                    onClose={() => setShowCitePicker(false)}
                  />
                )}
              </div>

              {!showFormatBar && (
                <button
                  onClick={() => setShowFormatBar(true)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  title="Options de formatage"
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={handleSend}
              disabled={!canSend}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                canSend
                  ? 'bg-[#1A3A5C] text-white hover:bg-[#1A3A5C]/90 shadow-sm'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {sending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Envoyer</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-2 flex items-center gap-3">
        <span className="text-[10px] text-gray-300">Entrée pour envoyer · Shift+Entrée pour nouvelle ligne</span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip"
        onChange={handleFileChange}
      />
    </div>
  );
}
