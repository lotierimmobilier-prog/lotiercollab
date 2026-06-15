import { useState } from 'react';
import { Search, Link2, X, SquareCheck as CheckSquare } from 'lucide-react';
import type { Task } from '../../types';

interface Props {
  tasks: Task[];
  onSelect: (task: Task) => void;
  onClose: () => void;
}

export function CitationPicker({ tasks, onSelect, onClose }: Props) {
  const [search, setSearch] = useState('');

  const filtered = tasks.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.project?.name.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 20);

  return (
    <div className="absolute bottom-full left-0 mb-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Link2 className="w-4 h-4 text-[#1A3A5C]" />
          Citer une tâche
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="px-3 py-2 border-b border-gray-50">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une tâche..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1A3A5C]/30"
            autoFocus
          />
        </div>
      </div>
      <div className="max-h-52 overflow-y-auto py-1">
        {filtered.map(task => (
          <button
            key={task.id}
            onClick={() => onSelect(task)}
            className="w-full flex items-start gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
          >
            <CheckSquare className="w-3.5 h-3.5 text-[#1A3A5C] mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">{task.title}</p>
              {task.project && (
                <p className="text-[10px] text-gray-400 truncate">{task.project.name}</p>
              )}
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">Aucune tâche trouvée</p>
        )}
      </div>
    </div>
  );
}
