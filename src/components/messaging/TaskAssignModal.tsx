import { useState } from 'react';
import { X, UserPlus, SquareCheck as CheckSquare, Search, Check } from 'lucide-react';
import type { Task, Member } from '../../types';
import { MemberAvatar } from '../common/MemberAvatar';

interface Props {
  task: Task;
  members: Member[];
  onAssign: (taskId: string, memberIds: string[]) => Promise<void>;
  onClose: () => void;
}

export function TaskAssignModal({ task, members, onAssign, onClose }: Props) {
  const currentAssigneeIds = task.assignees?.map(a => a.id) ?? (task.assigned_to ? [task.assigned_to] : []);
  const [selected, setSelected] = useState<string[]>(currentAssigneeIds);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = members.filter(m =>
    m.full_name.toLowerCase().includes(search.toLowerCase()) ||
    m.email?.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    await onAssign(task.id, selected);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1A3A5C]/10 flex items-center justify-center flex-shrink-0">
              <UserPlus className="w-4 h-4 text-[#1A3A5C]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-gray-900">Assigner la tâche</h2>
              <p className="text-[11px] text-gray-400 truncate max-w-[200px]">{task.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 pt-3 pb-2 border-b border-gray-50">
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
            <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un membre..."
              className="flex-1 text-xs bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
              autoFocus
            />
          </div>
        </div>

        <div className="py-1 max-h-64 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-6">Aucun membre trouvé</p>
          )}
          {filtered.map(member => {
            const isSelected = selected.includes(member.id);
            return (
              <button
                key={member.id}
                onClick={() => toggle(member.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${
                  isSelected ? 'bg-[#1A3A5C]/5' : 'hover:bg-gray-50'
                }`}
              >
                <MemberAvatar member={member} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{member.full_name}</p>
                  <p className="text-[10px] text-gray-400 capitalize truncate">{member.role}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  isSelected
                    ? 'bg-[#1A3A5C] border-[#1A3A5C]'
                    : 'border-gray-300'
                }`}>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
              </button>
            );
          })}
        </div>

        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <CheckSquare className="w-3.5 h-3.5 text-[#1A3A5C]" />
            <span>{selected.length} sélectionné{selected.length > 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-[#1A3A5C] hover:bg-[#142d47] rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {saving && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Assigner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
