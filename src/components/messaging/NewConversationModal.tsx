import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, Minus, Search, Paperclip, FileText, Image, Film, Bold, Italic, Smile } from 'lucide-react';
import type { Member } from '../../types';
import { MemberAvatar } from '../common/MemberAvatar';

interface Props {
  members: Member[];
  currentMemberId: string;
  allowedContactIds: string[] | null;
  onClose: () => void;
  onCreate: (title: string, memberIds: string[], firstMessage?: string, files?: File[]) => Promise<void>;
}

function FileIcon({ type }: { type: string }) {
  if (type.startsWith('image/')) return <Image className="w-3 h-3" />;
  if (type.startsWith('video/')) return <Film className="w-3 h-3" />;
  return <FileText className="w-3 h-3" />;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function NewConversationModal({ members, currentMemberId, allowedContactIds, onClose, onCreate }: Props) {
  const [minimized, setMinimized] = useState(false);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [title, setTitle] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const others = members.filter(m =>
    m.id !== currentMemberId &&
    (allowedContactIds === null || allowedContactIds.includes(m.id))
  );
  const filtered = search.length > 0
    ? others.filter(m => m.full_name.toLowerCase().includes(search.toLowerCase()))
    : [];

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    setSearch('');
    setShowSearch(false);
  };

  const removeSelected = (id: string) => setSelected(prev => prev.filter(x => x !== id));

  useEffect(() => {
    if (showSearch) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [showSearch]);

  const handleCreate = async () => {
    const trimmedMsg = message.trim();
    if (!title.trim() || selected.length === 0 || (!trimmedMsg && files.length === 0)) return;
    setLoading(true);

    let body = trimmedMsg;
    if (bold && italic) body = `***${body}***`;
    else if (bold) body = `**${body}**`;
    else if (italic) body = `*${body}*`;

    await onCreate(title.trim(), selected, body || undefined, files.length > 0 ? files : undefined);
    setLoading(false);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && canSend) {
      e.preventDefault();
      handleCreate();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    setFiles(prev => [...prev, ...picked]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (i: number) => setFiles(prev => prev.filter((_, idx) => idx !== i));

  const canSend = title.trim().length > 0 && selected.length > 0 && (message.trim().length > 0 || files.length > 0);

  const selectedMembers = selected.map(id => members.find(m => m.id === id)).filter(Boolean) as Member[];

  return (
    <div
      className="fixed bottom-0 right-6 z-50 flex flex-col shadow-2xl rounded-t-2xl overflow-hidden"
      style={{ width: 500, maxHeight: minimized ? 48 : 560 }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 bg-[#1A3A5C] cursor-pointer select-none flex-shrink-0"
        onClick={() => setMinimized(v => !v)}
      >
        <span className="text-sm font-semibold text-white">Nouvelle conversation</span>
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setMinimized(v => !v)}
            className="text-white/70 hover:text-white transition-colors p-0.5"
            title={minimized ? 'Agrandir' : 'Réduire'}
          >
            {minimized ? <ChevronUp className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors p-0.5"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!minimized && (
        <div className="flex flex-col flex-1 bg-white overflow-hidden">
          <div className="flex items-center gap-0 border-b border-gray-100 px-3 py-2 min-h-[42px]">
            <span className="text-xs text-gray-400 flex-shrink-0 w-6">À</span>
            <div className="flex flex-wrap items-center gap-1 flex-1 min-w-0">
              {selectedMembers.map(m => (
                <span
                  key={m.id}
                  className="inline-flex items-center gap-1 bg-[#1A3A5C]/10 text-[#1A3A5C] text-xs rounded-full px-2 py-0.5"
                >
                  <MemberAvatar member={m} size="sm" className="w-4 h-4 text-[8px]" />
                  {m.full_name.split(' ')[0]}
                  <button
                    onClick={() => removeSelected(m.id)}
                    className="hover:text-red-500 transition-colors ml-0.5"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
              <div className="relative flex-1 min-w-[80px]">
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setShowSearch(true); }}
                  onFocus={() => setShowSearch(true)}
                  onBlur={() => setTimeout(() => setShowSearch(false), 150)}
                  placeholder={selected.length === 0 ? 'Rechercher un membre...' : ''}
                  className="w-full text-sm outline-none text-gray-800 placeholder-gray-300 py-0.5 bg-transparent"
                />
                {showSearch && filtered.length > 0 && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-10 w-64 max-h-48 overflow-y-auto">
                    {filtered.map(m => (
                      <button
                        key={m.id}
                        onMouseDown={() => toggle(m.id)}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left"
                      >
                        <MemberAvatar member={m} size="sm" />
                        <div>
                          <p className="text-xs font-medium text-gray-800">{m.full_name}</p>
                          <p className="text-[10px] text-gray-400 capitalize">{m.role}</p>
                        </div>
                        {selected.includes(m.id) && (
                          <span className="ml-auto text-[#1A3A5C] text-xs">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => { setShowSearch(true); searchRef.current?.focus(); }}
              className="flex-shrink-0 text-gray-400 hover:text-[#1A3A5C] transition-colors p-1"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center border-b border-gray-100 px-3 py-2">
            <span className="text-xs text-gray-400 w-6 flex-shrink-0">Objet</span>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Thème / Titre de la conversation..."
              className="flex-1 text-sm text-gray-900 outline-none placeholder-gray-300 py-0.5"
            />
          </div>

          <div className="flex-1 overflow-y-auto relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Rédigez votre message..."
              className={`w-full h-full resize-none outline-none px-4 py-3 text-sm text-gray-800 placeholder-gray-300 leading-relaxed ${bold ? 'font-bold' : ''} ${italic ? 'italic' : ''}`}
              style={{ minHeight: 200 }}
            />
          </div>

          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 px-4 py-2 border-t border-gray-100">
              {files.map((file, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-2.5 py-1.5">
                  <span className="text-gray-500 flex-shrink-0"><FileIcon type={file.type} /></span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate max-w-36">{file.name}</p>
                    <p className="text-[10px] text-gray-400">{formatBytes(file.size)}</p>
                  </div>
                  <button onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between px-3 py-2.5 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
            <div className="flex items-center gap-1">
              <button
                onClick={handleCreate}
                disabled={!canSend || loading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#1A3A5C] hover:bg-[#1A3A5C]/90 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Envoi...' : 'Envoyer'}
                <div className="flex items-center gap-0.5 text-white/70 border-l border-white/20 pl-2 -mr-1">
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </button>
            </div>

            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setBold(v => !v)}
                className={`p-1.5 rounded-lg transition-colors ${bold ? 'bg-gray-200 text-gray-900' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
                title="Gras"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setItalic(v => !v)}
                className={`p-1.5 rounded-lg transition-colors ${italic ? 'bg-gray-200 text-gray-900' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
                title="Italique"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-4 bg-gray-200 mx-1" />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                title="Joindre un fichier"
              >
                <Paperclip className="w-3.5 h-3.5" />
              </button>
              <button
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                title="Emoji"
              >
                <Smile className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-4 bg-gray-200 mx-1" />
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Supprimer le brouillon"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

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
