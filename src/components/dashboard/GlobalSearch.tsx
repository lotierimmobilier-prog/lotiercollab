import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, SquareCheck as CheckSquare, FolderOpen, StickyNote, MessageSquare, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAppData } from '../../hooks/useAppData';
import { useAuth } from '../../hooks/useAuth';

interface Result {
  id: string;
  type: 'task' | 'project' | 'memo' | 'message';
  title: string;
  subtitle?: string;
  href: string;
  taskId?: string;
}

const typeConfig = {
  task:    { icon: CheckSquare, label: 'Tâche',       color: 'text-[#1A3A5C]', bg: 'bg-[#1A3A5C]/8' },
  project: { icon: FolderOpen,  label: 'Projet',      color: 'text-[#B89968]', bg: 'bg-[#B89968]/10' },
  memo:    { icon: StickyNote,  label: 'Mémo',        color: 'text-amber-600', bg: 'bg-amber-50' },
  message: { icon: MessageSquare, label: 'Message',   color: 'text-emerald-600', bg: 'bg-emerald-50' },
};

function useDebounce<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { tasks, projects } = useAppData();
  const { memberId, user, isSuperAdmin } = useAuth();

  const debouncedQuery = useDebounce(query, 220);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    setLoading(true);

    const lower = q.toLowerCase();

    // Tasks (from context — already loaded)
    const taskResults: Result[] = tasks
      .filter(t =>
        t.title.toLowerCase().includes(lower) ||
        (t.description ?? '').toLowerCase().includes(lower) ||
        (t.project?.name ?? '').toLowerCase().includes(lower)
      )
      .slice(0, 5)
      .map(t => ({
        id: t.id,
        type: 'task' as const,
        title: t.title,
        subtitle: t.project?.name,
        href: `/tasks?task=${t.id}`,
        taskId: t.id,
      }));

    // Projects (from context)
    const projectResults: Result[] = projects
      .filter(p => p.name.toLowerCase().includes(lower))
      .slice(0, 3)
      .map(p => ({
        id: p.id,
        type: 'project' as const,
        title: p.name,
        href: `/projects/${p.id}`,
      }));

    // Memos (Supabase)
    const userId = user?.id;
    let memoResults: Result[] = [];
    if (userId) {
      const { data: memos } = await supabase
        .from('memos')
        .select('id, title, body')
        .eq('user_id', userId)
        .or(`title.ilike.%${q}%,body.ilike.%${q}%`)
        .limit(4);
      memoResults = (memos ?? []).map((m: { id: string; title: string; body: string }) => ({
        id: m.id,
        type: 'memo' as const,
        title: m.title,
        subtitle: m.body ? m.body.slice(0, 60) : undefined,
        href: '/memos',
      }));
    }

    // Messages (conversations by title)
    let messageResults: Result[] = [];
    if (memberId || isSuperAdmin) {
      let convQuery = supabase
        .from('message_conversations')
        .select('id, title')
        .ilike('title', `%${q}%`)
        .limit(3);

      if (!isSuperAdmin && memberId) {
        const { data: memberConvs } = await supabase
          .from('message_conversation_members')
          .select('conversation_id')
          .eq('member_id', memberId);
        const ids = (memberConvs ?? []).map((r: { conversation_id: string }) => r.conversation_id);
        if (ids.length > 0) convQuery = convQuery.in('id', ids);
        else convQuery = convQuery.in('id', ['__none__']);
      }

      const { data: convs } = await convQuery;
      messageResults = (convs ?? []).map((c: { id: string; title: string }) => ({
        id: c.id,
        type: 'message' as const,
        title: c.title,
        href: '/messages',
      }));
    }

    const all = [...taskResults, ...projectResults, ...memoResults, ...messageResults];
    setResults(all);
    setOpen(all.length > 0);
    setFocused(0);
    setLoading(false);
  }, [tasks, projects, user?.id, memberId, isSuperAdmin]);

  useEffect(() => {
    search(debouncedQuery);
  }, [debouncedQuery, search]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (r: Result) => {
    setQuery('');
    setOpen(false);
    navigate(r.href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocused(f => Math.min(f + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setFocused(f => Math.max(f - 1, 0)); }
    if (e.key === 'Enter' && results[focused]) { handleSelect(results[focused]); }
    if (e.key === 'Escape') { setOpen(false); setQuery(''); }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <div className={`flex items-center gap-3 h-11 bg-white border rounded-2xl px-4 transition-all duration-200 ${
        open ? 'border-[#1A3A5C]/30 shadow-md ring-2 ring-[#1A3A5C]/8' : 'border-gray-200 hover:border-gray-300 shadow-sm'
      }`}>
        {loading
          ? <Loader className="w-4 h-4 text-gray-400 animate-spin flex-shrink-0" />
          : <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
        }
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); if (!open && e.target.value) setOpen(true); }}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder="Rechercher tâches, projets, mémos, messages…"
          className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); setOpen(false); }} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-50">
          {/* Group by type */}
          {(['task', 'project', 'memo', 'message'] as const).map(type => {
            const group = results.filter(r => r.type === type);
            if (group.length === 0) return null;
            const cfg = typeConfig[type];
            const Icon = cfg.icon;
            const flatIndex = results.findIndex(r => r.id === group[0].id);
            return (
              <div key={type}>
                <div className="px-4 py-2 flex items-center gap-2 border-b border-gray-50">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center ${cfg.bg}`}>
                    <Icon className={`w-3 h-3 ${cfg.color}`} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{cfg.label}s</span>
                </div>
                {group.map((r, i) => {
                  const idx = flatIndex + i;
                  return (
                    <button
                      key={r.id}
                      onClick={() => handleSelect(r)}
                      className={`w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors ${
                        idx === focused ? 'bg-gray-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{r.title}</p>
                        {r.subtitle && (
                          <p className="text-xs text-gray-400 truncate mt-0.5">{r.subtitle}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {open && !loading && query && results.length === 0 && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-gray-200 rounded-2xl shadow-xl px-4 py-6 text-center z-50">
          <p className="text-sm text-gray-400">Aucun résultat pour <span className="font-semibold text-gray-600">"{query}"</span></p>
        </div>
      )}
    </div>
  );
}
