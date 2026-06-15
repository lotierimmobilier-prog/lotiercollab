import { useState, useMemo } from 'react';
import { Building2, Check, ChevronDown, ChevronUp, RefreshCw, Search, SquareCheck as CheckSquare, Square } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { Project, Member, TaskPriority, TaskRecurrence } from '../../types';
import { RECURRENCE_OPTIONS } from '../../lib/dateUtils';
import { useCoproprietes } from '../../hooks/useStore';

interface TaskTemplate {
  titlePattern: string;
  description: string;
  priority: TaskPriority;
  status: string;
  due_date: string;
  assigned_to: string;
  recurrence: TaskRecurrence | '';
  project_id: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onImport: (tasks: Array<{
    title: string;
    description: string;
    priority: TaskPriority;
    status: string;
    due_date: string | null;
    assigned_to: string | null;
    recurrence: TaskRecurrence | null;
    project_id: string | null;
  }>) => Promise<void>;
  projects: Project[];
  members: Member[];
  defaultProjectId?: string | null;
}

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Faible',
  normal: 'Normal',
  high: 'Élevée',
  urgent: 'Urgent',
};

export function BulkCoproTaskModal({ open, onClose, onImport, projects, members, defaultProjectId }: Props) {
  const { coproprietes } = useCoproprietes();
  const [template, setTemplate] = useState<TaskTemplate>({
    titlePattern: '{copropriété}',
    description: '',
    priority: 'normal',
    status: 'todo',
    due_date: '',
    assigned_to: '',
    recurrence: '',
    project_id: defaultProjectId ?? '',
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeCopros = useMemo(() =>
    coproprietes.filter(c => c.active),
    [coproprietes]
  );

  const filtered = useMemo(() =>
    activeCopros.filter(c =>
      !search || c.name.toLowerCase().includes(search.toLowerCase())
    ),
    [activeCopros, search]
  );

  const setField = <K extends keyof TaskTemplate>(k: K, v: TaskTemplate[K]) =>
    setTemplate(t => ({ ...t, [k]: v }));

  const toggleCopro = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(c => c.id)));
    }
  };

  const resolveTitle = (pattern: string, name: string) =>
    pattern.replace(/\{copropriété\}|\{copropriete\}|\{nom\}/gi, name);

  const preview = useMemo(() => {
    const first = activeCopros.find(c => selectedIds.has(c.id));
    if (!first) return null;
    return resolveTitle(template.titlePattern, first.name);
  }, [template.titlePattern, selectedIds, activeCopros]);

  const handleImport = async () => {
    if (selectedIds.size === 0) return;
    setLoading(true);

    const tasks = activeCopros
      .filter(c => selectedIds.has(c.id))
      .map(c => ({
        title: resolveTitle(template.titlePattern, c.name),
        description: template.description,
        priority: template.priority,
        status: template.status,
        due_date: template.due_date || null,
        assigned_to: template.assigned_to || null,
        recurrence: (template.recurrence || null) as TaskRecurrence | null,
        project_id: template.project_id || null,
      }));

    await onImport(tasks);
    setLoading(false);
    setSelectedIds(new Set());
    setSearch('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 py-5 border-b border-gray-100">
          <DialogTitle className="text-[#1A3A5C] flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Créer des tâches par copropriété
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>
                  Titre de la tâche
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    utilisez <code className="bg-gray-100 px-1 rounded">{'{copropriété}'}</code> pour insérer le nom
                  </span>
                </Label>
                <Input
                  value={template.titlePattern}
                  onChange={e => setField('titlePattern', e.target.value)}
                  placeholder="{copropriété} — Assemblée générale"
                />
                {preview && (
                  <p className="text-xs text-gray-400">
                    Aperçu : <span className="text-gray-600 font-medium">{preview}</span>
                    {selectedIds.size > 1 && <span className="text-gray-400"> (+{selectedIds.size - 1} autres)</span>}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Projet</Label>
                <Select value={template.project_id || '__none__'} onValueChange={v => setField('project_id', v === '__none__' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Aucun projet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Aucun projet</SelectItem>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                          {p.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Priorité</Label>
                <Select value={template.priority} onValueChange={v => setField('priority', v as TaskPriority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(PRIORITY_LABELS) as [TaskPriority, string][]).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAdvanced(v => !v)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              Options avancées (responsable, échéance, récurrence)
            </button>

            {showAdvanced && (
              <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="space-y-1.5">
                  <Label>Responsable</Label>
                  <Select value={template.assigned_to || '__none__'} onValueChange={v => setField('assigned_to', v === '__none__' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Non assigné" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Non assigné</SelectItem>
                      {members.map(m => (
                        <SelectItem key={m.id} value={m.id}>
                          <span className="flex items-center gap-2">
                            <span
                              className="w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: m.avatar_color }}
                            >
                              {m.initials}
                            </span>
                            {m.full_name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Échéance</Label>
                  <Input type="date" value={template.due_date} onChange={e => setField('due_date', e.target.value)} />
                </div>

                <div className="col-span-2 space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Récurrence
                  </Label>
                  <Select value={template.recurrence || '__none__'} onValueChange={v => setField('recurrence', v === '__none__' ? '' : v as TaskRecurrence)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pas de récurrence" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Pas de récurrence</SelectItem>
                      {RECURRENCE_OPTIONS.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>
                  Copropriétés
                  {selectedIds.size > 0 && (
                    <span className="ml-2 bg-[#1A3A5C] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {selectedIds.size}
                    </span>
                  )}
                </Label>
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-xs font-medium text-[#1A3A5C] hover:underline flex items-center gap-1"
                >
                  {selectedIds.size === filtered.length && filtered.length > 0
                    ? <><Square className="w-3 h-3" /> Tout désélectionner</>
                    : <><CheckSquare className="w-3 h-3" /> Tout sélectionner</>
                  }
                </button>
              </div>

              {activeCopros.length === 0 ? (
                <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-gray-100">
                  <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Aucune copropriété active</p>
                  <p className="text-xs mt-1">Ajoutez des copropriétés dans la page Administration</p>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <Input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Rechercher une copropriété..."
                      className="pl-9 h-8 text-sm"
                    />
                  </div>

                  <div className="border border-gray-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                    {filtered.length === 0 ? (
                      <p className="text-center text-sm text-gray-400 py-6">Aucun résultat</p>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {filtered.map(c => {
                          const isSelected = selectedIds.has(c.id);
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => toggleCopro(c.id)}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                                isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                                isSelected ? 'bg-[#1A3A5C] border-[#1A3A5C]' : 'border-gray-300'
                              }`}>
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <div className="w-6 h-6 rounded-lg bg-[#1A3A5C]/8 flex items-center justify-center flex-shrink-0">
                                <Building2 className="w-3 h-3 text-[#1A3A5C]/60" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{c.name}</p>
                                {c.address && <p className="text-xs text-gray-400 truncate">{c.address}</p>}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3 bg-gray-50/50">
          <p className="text-xs text-gray-500">
            {selectedIds.size === 0
              ? 'Sélectionnez des copropriétés'
              : `${selectedIds.size} tâche${selectedIds.size > 1 ? 's' : ''} seront créées`}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button
              type="button"
              disabled={selectedIds.size === 0 || !template.titlePattern.trim() || loading}
              onClick={handleImport}
              className="bg-[#1A3A5C] hover:bg-[#142d47] text-white"
            >
              {loading
                ? 'Création...'
                : `Créer ${selectedIds.size > 0 ? selectedIds.size + ' tâche' + (selectedIds.size > 1 ? 's' : '') : ''}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
