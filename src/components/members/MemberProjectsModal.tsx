import { useEffect, useState } from 'react';
import { X, FolderKanban, Check, Loader as Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { MemberAvatar } from '../common/MemberAvatar';
import type { Member, Project } from '../../types';

interface Props {
  member: Member | null;
  open: boolean;
  onClose: () => void;
  projects: Project[];
}

function flattenProjects(projects: Project[]): Project[] {
  const result: Project[] = [];
  for (const p of projects) {
    result.push(p);
    if (p.children) result.push(...flattenProjects(p.children));
  }
  return result;
}

export function MemberProjectsModal({ member, open, onClose, projects }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const rootProjects = projects.filter(p => !p.parent_id);
  const allFlat = flattenProjects(projects);

  useEffect(() => {
    if (!open || !member) return;
    setLoading(true);
    supabase
      .from('member_project_access')
      .select('project_id')
      .eq('member_id', member.id)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setSelectedIds(new Set(data.map((r: { project_id: string }) => r.project_id)));
        } else {
          setSelectedIds(new Set());
        }
        setLoading(false);
      });
  }, [open, member]);

  if (!open || !member) return null;

  const toggleProject = (id: string) => {
    const project = allFlat.find(p => p.id === id);
    const childIds = allFlat.filter(p => p.parent_id === id).map(p => p.id);

    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        childIds.forEach(cid => next.delete(cid));
      } else {
        next.add(id);
        childIds.forEach(cid => next.add(cid));
        if (project?.parent_id) {
          next.add(project.parent_id);
        }
      }
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    await supabase.from('member_project_access').delete().eq('member_id', member.id);
    if (selectedIds.size > 0) {
      const rows = [...selectedIds].map(project_id => ({ member_id: member.id, project_id }));
      await supabase.from('member_project_access').insert(rows);
    }
    setSaving(false);
    onClose();
  };

  const isAllSelected = selectedIds.size === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <div className="p-2 bg-emerald-50 rounded-xl">
            <FolderKanban className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-gray-900">Projets visibles</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <MemberAvatar member={member} size="sm" />
              <p className="text-xs text-gray-500">{member.full_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-3 bg-amber-50 border-b border-amber-100">
          <p className="text-xs text-amber-700">
            {isAllSelected
              ? 'Tous les projets sont visibles (aucune restriction).'
              : `${selectedIds.size} projet(s) sélectionné(s). Seuls ces projets seront visibles.`}
          </p>
        </div>

        <div className="px-6 py-4 space-y-1 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            </div>
          ) : (
            <>
              <button
                onClick={() => setSelectedIds(new Set())}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${isAllSelected ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${isAllSelected ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
                  {isAllSelected && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <span>Tous les projets (aucune restriction)</span>
              </button>

              <div className="h-px bg-gray-100 my-2" />

              {rootProjects.map(project => {
                const children = allFlat.filter(p => p.parent_id === project.id);
                const isSelected = selectedIds.has(project.id);
                return (
                  <div key={project.id}>
                    <button
                      onClick={() => toggleProject(project.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${isSelected ? 'bg-blue-50 text-[#1A3A5C] font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-[#1A3A5C] border-[#1A3A5C]' : 'border-gray-300'}`}>
                        {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="truncate">{project.name}</span>
                    </button>
                    {children.map(child => {
                      const isChildSelected = selectedIds.has(child.id);
                      return (
                        <button
                          key={child.id}
                          onClick={() => toggleProject(child.id)}
                          className={`w-full flex items-center gap-3 pl-10 pr-3 py-2 rounded-xl text-xs transition-colors ${isChildSelected ? 'bg-blue-50 text-[#1A3A5C] font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${isChildSelected ? 'bg-[#1A3A5C] border-[#1A3A5C]' : 'border-gray-300'}`}>
                            {isChildSelected && <Check className="w-2 h-2 text-white" />}
                          </div>
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: child.color }}
                          />
                          <span className="truncate">{child.name}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-10 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 h-10 flex items-center justify-center gap-2 text-sm font-semibold text-white bg-[#1A3A5C] rounded-xl hover:bg-[#142d47] disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
