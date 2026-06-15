import { useState, useEffect } from 'react';
import { X, Check, Users, UserPlus, Search } from 'lucide-react';
import type { Member } from '../../types';
import { MemberAvatar } from '../common/MemberAvatar';
import { supabase } from '../../lib/supabase';

interface Props {
  selectedCount: number;
  members?: Member[];
  onApply: (ids: string[], mode: 'replace' | 'add') => Promise<void>;
  onClose: () => void;
}

export function BulkAssignModal({ selectedCount, onApply, onClose }: Props) {
  const [pickedIds, setPickedIds] = useState<string[]>([]);
  const [mode, setMode] = useState<'replace' | 'add'>('replace');
  const [search, setSearch] = useState('');
  const [applying, setApplying] = useState(false);
  const [allMembers, setAllMembers] = useState<Member[]>([]);

  useEffect(() => {
    supabase.from('members').select('*').order('full_name').then(({ data }) => {
      if (data) setAllMembers(data);
    });
  }, []);

  const filtered = allMembers.filter(m =>
    m.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: string) =>
    setPickedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleApply = async () => {
    if (pickedIds.length === 0) return;
    setApplying(true);
    await onApply(pickedIds, mode);
    setApplying(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="w-8 h-8 rounded-xl bg-[#1A3A5C] flex items-center justify-center flex-shrink-0">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-gray-900">Assigner des responsables</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {selectedCount} tâche{selectedCount > 1 ? 's' : ''} sélectionnée{selectedCount > 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode toggle */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center gap-1.5 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setMode('replace')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                mode === 'replace'
                  ? 'bg-white text-[#1A3A5C] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Remplacer
            </button>
            <button
              onClick={() => setMode('add')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                mode === 'add'
                  ? 'bg-white text-[#1A3A5C] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Ajouter
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-1.5">
            {mode === 'replace'
              ? 'Remplace les responsables existants sur chaque tâche'
              : 'Ajoute aux responsables existants sur chaque tâche'}
          </p>
        </div>

        {/* Search */}
        {allMembers.length > 5 && (
          <div className="px-5 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#1A3A5C]/50 focus:ring-2 focus:ring-[#1A3A5C]/10"
              />
            </div>
          </div>
        )}

        {/* Member list */}
        <div className="px-3 pb-2 max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">Aucun membre trouvé</p>
          ) : (
            filtered.map(m => {
              const checked = pickedIds.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggle(m.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left mb-0.5 ${
                    checked ? 'bg-[#1A3A5C]/5' : 'hover:bg-gray-50'
                  }`}
                >
                  <MemberAvatar member={m} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{m.full_name}</p>
                    <p className="text-[10px] text-gray-400 capitalize">{m.role}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    checked ? 'bg-[#1A3A5C] border-[#1A3A5C]' : 'border-gray-300'
                  }`}>
                    {checked && <Check className="w-3 h-3 text-white" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleApply}
            disabled={pickedIds.length === 0 || applying}
            className="flex-2 flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1A3A5C] text-white text-sm font-semibold rounded-xl hover:bg-[#142d47] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <Check className="w-4 h-4" />
            {applying ? 'Application...' : `Valider${pickedIds.length > 0 ? ` (${pickedIds.length})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
