import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X, Users } from 'lucide-react';
import type { Member } from '../../types';
import { MemberAvatar } from './MemberAvatar';

interface Props {
  members: Member[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export function MultiMemberPicker({
  members,
  selectedIds,
  onChange,
  placeholder = 'Assigner...',
  disabled = false,
  size = 'md',
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter(s => s !== id)
        : [...selectedIds, id]
    );
  };

  const remove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedIds.filter(s => s !== id));
  };

  const selectedMembers = selectedIds
    .map(id => members.find(m => m.id === id))
    .filter(Boolean) as Member[];

  const filtered = members.filter(m =>
    m.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const triggerHeight = size === 'sm' ? 'h-8' : 'h-9';
  const MAX_VISIBLE = 3;
  const visibleMembers = selectedMembers.slice(0, MAX_VISIBLE);
  const overflow = selectedMembers.length - MAX_VISIBLE;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(v => !v)}
        className={`w-full ${triggerHeight} px-2.5 flex items-center gap-2 border border-input rounded-md bg-background hover:bg-accent/40 transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${open ? 'ring-1 ring-[#1A3A5C]/40 border-[#1A3A5C]/40' : ''}`}
      >
        <div className="flex-1 flex items-center gap-2 min-w-0">
          {selectedMembers.length === 0 ? (
            <span className="text-xs text-muted-foreground">{placeholder}</span>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex items-center flex-shrink-0" style={{ gap: 0 }}>
                {visibleMembers.map((m, i) => (
                  <div
                    key={m.id}
                    className="ring-2 ring-white rounded-full flex-shrink-0"
                    style={{ marginLeft: i > 0 ? '-7px' : 0, zIndex: visibleMembers.length - i }}
                    title={m.full_name}
                  >
                    <MemberAvatar member={m} size="sm" />
                  </div>
                ))}
                {overflow > 0 && (
                  <div
                    className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[9px] font-semibold text-gray-500 flex-shrink-0"
                    style={{ marginLeft: '-7px', zIndex: 0 }}
                  >
                    +{overflow}
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-600 font-medium truncate min-w-0">
                {selectedMembers.length === 1
                  ? selectedMembers[0].full_name
                  : `${selectedMembers.length} responsables`}
              </span>
            </div>
          )}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {selectedMembers.length > 1 && !open && !disabled && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {selectedMembers.map(m => (
            <span
              key={m.id}
              className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-full pl-0.5 pr-1.5 py-0.5 text-[11px] text-gray-700"
            >
              <MemberAvatar member={m} size="sm" />
              <span className="font-medium truncate max-w-[72px]">{m.full_name.split(' ')[0]}</span>
              <button
                type="button"
                onClick={(e) => remove(m.id, e)}
                className="ml-0.5 text-gray-300 hover:text-gray-500 transition-colors"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100">
          <div className="p-2 border-b border-gray-100">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#1A3A5C]/30 focus:border-[#1A3A5C]/40 bg-gray-50"
            />
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-3">Aucun membre trouvé</p>
            ) : (
              filtered.map(m => {
                const selected = selectedIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggle(m.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 transition-colors ${
                      selected ? 'bg-[#1A3A5C]/5' : 'hover:bg-gray-50'
                    }`}
                  >
                    <MemberAvatar member={m} size="sm" />
                    <span className="flex-1 text-left text-xs font-medium text-gray-800">{m.full_name}</span>
                    <span className="text-[10px] text-gray-400 capitalize">{m.role}</span>
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                      selected ? 'bg-[#1A3A5C] border-[#1A3A5C]' : 'border-gray-300'
                    }`}>
                      {selected && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
          {selectedIds.length > 0 && (
            <div className="border-t border-gray-100 px-3 py-2 flex items-center justify-between">
              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                <Users className="w-3 h-3" />
                {selectedIds.length} sélectionné{selectedIds.length > 1 ? 's' : ''}
              </span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-[10px] text-red-400 hover:text-red-600 transition-colors"
              >
                Tout retirer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
