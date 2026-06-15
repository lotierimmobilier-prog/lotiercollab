import { useState, useEffect, useRef } from 'react';
import { addDays, format } from 'date-fns';
import { RefreshCw, Building2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import type { Project, Member, TaskStatus, TaskPriority, TaskRecurrence } from '../../types';
import { MultiMemberPicker } from '../common/MultiMemberPicker';
import { RECURRENCE_OPTIONS } from '../../lib/dateUtils';
import { useCoproprietes, setTaskAssignees } from '../../hooks/useStore';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    project_id: string | null;
    assigned_to: string | null;
    priority: TaskPriority;
    status: TaskStatus;
    due_date: string | null;
    recurrence: TaskRecurrence | null;
  }) => Promise<{ data?: { id: string; title: string } | null }>;
  projects: Project[];
  members: Member[];
  defaultProjectId?: string;
  defaultRecurrence?: TaskRecurrence | null;
}

const SYNDIC_PROJECT_ID = '11111111-1111-1111-1111-111111111111';
const SYNDIC_DEFAULT_ASSIGNEES = [
  'de3a70be-62c0-4adb-b981-ea805d01bc6a', // Tristan Terpereau
  'ece3e4fc-1260-4fe5-8638-f4a6ecd692e5', // Stéphanie LEGROS
];

export function NewTaskModal({ open, onClose, onSubmit, projects, members, defaultProjectId, defaultRecurrence }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState<string>(defaultProjectId ?? '');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [priority, setPriority] = useState<TaskPriority>('normal');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [dueDate, setDueDate] = useState('');
  const [dueDateMode, setDueDateMode] = useState<'date' | 'days'>('date');
  const [dueDays, setDueDays] = useState('');
  const [recurrence, setRecurrence] = useState<TaskRecurrence | ''>('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const { coproprietes } = useCoproprietes();

  const syndicDefaultIds = SYNDIC_DEFAULT_ASSIGNEES.filter(id =>
    members.some(m => m.id === id)
  );

  useEffect(() => {
    if (open) {
      setTitle('');
      setDescription('');
      const pid = defaultProjectId ?? '';
      setProjectId(pid);
      setAssigneeIds(pid === SYNDIC_PROJECT_ID ? syndicDefaultIds : []);
      setPriority('normal');
      setStatus('todo');
      setDueDate('');
      setDueDays('');
      setDueDateMode('date');
      setRecurrence(defaultRecurrence ?? '');
    }
  }, [open, defaultProjectId, defaultRecurrence]);

  const handleProjectChange = (pid: string) => {
    setProjectId(pid);
    if (pid === SYNDIC_PROJECT_ID && assigneeIds.length === 0) {
      setAssigneeIds(syndicDefaultIds);
    }
  };

  const computedDueDate = (): string | null => {
    if (dueDateMode === 'date') return dueDate || null;
    const days = parseInt(dueDays, 10);
    if (!dueDays || isNaN(days) || days < 0) return null;
    return format(addDays(new Date(), days), 'yyyy-MM-dd');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    const result = await onSubmit({
      title: title.trim(),
      description,
      project_id: projectId || null,
      assigned_to: assigneeIds[0] ?? null,
      priority,
      status,
      due_date: computedDueDate(),
      recurrence: recurrence || null,
    });
    if (result?.data && assigneeIds.length > 1) {
      await setTaskAssignees(result.data.id, assigneeIds, result.data.title);
    } else if (result?.data && assigneeIds.length === 1) {
      await setTaskAssignees(result.data.id, assigneeIds, result.data.title);
    }
    setTitle('');
    setDescription('');
    setProjectId(defaultProjectId ?? '');
    setAssigneeIds([]);
    setPriority('normal');
    setStatus('todo');
    setDueDate('');
    setDueDays('');
    setDueDateMode('date');
    setRecurrence(defaultRecurrence ?? '');
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[#1A3A5C]">Nouvelle tâche</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="title">Titre *</Label>
              {coproprietes.filter(c => c.active).length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowSuggestions(v => !v)}
                  className="flex items-center gap-1 text-xs text-[#1A3A5C] hover:underline font-medium"
                >
                  <Building2 className="w-3 h-3" />
                  Copropriétés
                </button>
              )}
            </div>
            <div className="relative">
              <Input
                ref={titleRef}
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Titre de la tâche..."
                required
                autoFocus
              />
            </div>
            {showSuggestions && (
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-md max-h-48 overflow-y-auto">
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Copropriétés</span>
                  <button type="button" onClick={() => setShowSuggestions(false)} className="text-gray-400 hover:text-gray-600 text-xs">Fermer</button>
                </div>
                {coproprietes
                  .filter(c => c.active && (!title || c.name.toLowerCase().includes(title.toLowerCase())))
                  .map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { setTitle(c.name); setShowSuggestions(false); titleRef.current?.focus(); }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#1A3A5C] flex items-center gap-2 transition-colors border-b border-gray-50 last:border-0"
                    >
                      <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      {c.name}
                      {c.address && <span className="text-xs text-gray-400 truncate">{c.address}</span>}
                    </button>
                  ))
                }
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Décrivez la tâche..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Projet</Label>
              <Select value={projectId} onValueChange={handleProjectChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: p.color }} />
                        {p.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Responsables</Label>
              <MultiMemberPicker
                members={members}
                selectedIds={assigneeIds}
                onChange={setAssigneeIds}
                placeholder="Assigner à..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Priorité</Label>
              <Select value={priority} onValueChange={v => setPriority(v as TaskPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Faible</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">Élevée</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Statut</Label>
              <Select value={status} onValueChange={v => setStatus(v as TaskStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">À faire</SelectItem>
                  <SelectItem value="doing">En cours</SelectItem>
                  <SelectItem value="done">Terminé</SelectItem>
                  <SelectItem value="blocked">Bloqué</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Date d'échéance</Label>
              <div className="flex items-center rounded-md border border-gray-200 overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() => setDueDateMode('date')}
                  className={`px-2.5 py-1 transition-colors ${dueDateMode === 'date' ? 'bg-[#1A3A5C] text-white' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Date
                </button>
                <button
                  type="button"
                  onClick={() => setDueDateMode('days')}
                  className={`px-2.5 py-1 transition-colors ${dueDateMode === 'days' ? 'bg-[#1A3A5C] text-white' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Jours
                </button>
              </div>
            </div>
            {dueDateMode === 'date' ? (
              <Input
                id="due_date"
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="365"
                  value={dueDays}
                  onChange={e => setDueDays(e.target.value)}
                  placeholder="ex: 7"
                  className="flex-1"
                />
                <span className="text-sm text-gray-500 whitespace-nowrap">jours à partir d'aujourd'hui</span>
              </div>
            )}
            {dueDateMode === 'days' && dueDays && !isNaN(parseInt(dueDays, 10)) && parseInt(dueDays, 10) >= 0 && (
              <p className="text-xs text-gray-400">
                Échéance : {format(addDays(new Date(), parseInt(dueDays, 10)), 'dd/MM/yyyy')}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
              Récurrence
            </Label>
            <Select value={recurrence || '__none__'} onValueChange={v => setRecurrence(v === '__none__' ? '' : v as TaskRecurrence)}>
              <SelectTrigger>
                <SelectValue placeholder="Aucune récurrence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Aucune récurrence</SelectItem>
                {RECURRENCE_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {recurrence && (
              <p className="text-xs text-gray-400">
                Quand la tâche sera terminée, elle sera automatiquement remise à "À traiter".
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button
              type="submit"
              disabled={loading || !title.trim()}
              className="bg-[#1A3A5C] hover:bg-[#142d47] text-white"
            >
              {loading ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
