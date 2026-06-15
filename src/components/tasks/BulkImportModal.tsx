import { useState, useRef } from 'react';
import { Upload, FileText, CircleAlert as AlertCircle, CircleCheck as CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { MultiMemberPicker } from '../common/MultiMemberPicker';
import type { Project, Member, TaskPriority, TaskRecurrence } from '../../types';
import { RECURRENCE_OPTIONS } from '../../lib/dateUtils';

interface ParsedRow {
  title: string;
  description: string;
  priority: TaskPriority;
  status: string;
  due_date: string | null;
  assigned_to: string | null;
  recurrence: TaskRecurrence | null;
  _error?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onImport: (tasks: Omit<ParsedRow, '_error'>[]) => Promise<void>;
  projects: Project[];
  members: Member[];
  defaultProjectId?: string | null;
}

const PRIORITY_MAP: Record<string, TaskPriority> = {
  faible: 'low', low: 'low',
  normal: 'normal', normale: 'normal', medium: 'normal', moyen: 'normal',
  élevée: 'high', elevee: 'high', high: 'high', haute: 'high',
  urgent: 'urgent', urgente: 'urgent',
};

const RECURRENCE_MAP: Record<string, TaskRecurrence> = {
  '15d': '15d', '15 jours': '15d', '15j': '15d',
  '30d': '30d', '30 jours': '30d', '30j': '30d', mensuel: '30d', mensuelle: '30d',
  '3m': '3m', trimestriel: '3m', trimestrielle: '3m',
  '6m': '6m', semestriel: '6m', semestrielle: '6m',
  '1y': '1y', annuel: '1y', annuelle: '1y',
};

function parseDate(s: string): string | null {
  if (!s) return null;
  const parts = s.split(/[\/\-\.]/);
  if (parts.length === 3) {
    const [a, b, c] = parts;
    if (a.length === 4) return `${a}-${b.padStart(2, '0')}-${c.padStart(2, '0')}`;
    return `${c}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`;
  }
  return null;
}

function parseCsv(raw: string): string[][] {
  const rows: string[][] = [];
  let current = '';
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === '"') {
      if (inQuotes && raw[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if ((ch === ',' || ch === ';' || ch === '\t') && !inQuotes) {
      row.push(current.trim());
      current = '';
    } else if (ch === '\n' && !inQuotes) {
      row.push(current.trim());
      if (row.some(c => c)) rows.push(row);
      row = [];
      current = '';
    } else {
      current += ch;
    }
  }
  row.push(current.trim());
  if (row.some(c => c)) rows.push(row);
  return rows;
}

function parseRows(raw: string, members: Member[]): ParsedRow[] {
  const lines = parseCsv(raw.trim());
  if (lines.length === 0) return [];

  const header = lines[0].map(h => h.toLowerCase().trim());
  const colTitle = header.findIndex(h => ['titre', 'title', 'nom', 'name', 'tâche', 'tache'].includes(h));
  const colDesc = header.findIndex(h => ['description', 'desc', 'détail', 'detail'].includes(h));
  const colPriority = header.findIndex(h => ['priorité', 'priorite', 'priority'].includes(h));
  const colStatus = header.findIndex(h => ['statut', 'status', 'état', 'etat'].includes(h));
  const colDue = header.findIndex(h => ['échéance', 'echeance', 'due', 'date', 'due_date'].includes(h));
  const colAssignee = header.findIndex(h => ['responsable', 'assigné', 'assigne', 'assigned_to', 'assignee'].includes(h));
  const colRecurrence = header.findIndex(h => ['récurrence', 'recurrence', 'recurrent'].includes(h));

  const dataLines = colTitle >= 0 ? lines.slice(1) : lines;

  return dataLines.map(cells => {
    const get = (idx: number) => (idx >= 0 ? (cells[idx] ?? '').trim() : '');
    const rawTitle = colTitle >= 0 ? get(colTitle) : cells[0]?.trim() ?? '';

    if (!rawTitle) return { title: '', description: '', priority: 'normal' as TaskPriority, status: 'todo', due_date: null, assigned_to: null, recurrence: null, _error: 'Titre manquant' };

    const rawPriority = get(colPriority).toLowerCase();
    const priority: TaskPriority = PRIORITY_MAP[rawPriority] ?? 'normal';

    const rawStatus = get(colStatus).toLowerCase();
    const status = rawStatus || 'todo';

    const rawDue = get(colDue);
    const due_date = parseDate(rawDue);

    const rawAssignee = get(colAssignee);
    let assigned_to: string | null = null;
    if (rawAssignee) {
      const match = members.find(m =>
        m.full_name.toLowerCase().includes(rawAssignee.toLowerCase()) ||
        m.initials.toLowerCase() === rawAssignee.toLowerCase()
      );
      assigned_to = match?.id ?? null;
    }

    const rawRecurrence = get(colRecurrence).toLowerCase();
    const recurrence: TaskRecurrence | null = RECURRENCE_MAP[rawRecurrence] ?? null;

    return {
      title: rawTitle,
      description: get(colDesc),
      priority,
      status,
      due_date,
      assigned_to,
      recurrence,
    };
  }).filter(r => r.title);
}

export function BulkImportModal({ open, onClose, onImport, projects, members, defaultProjectId }: Props) {
  const [text, setText] = useState('');
  const [projectId, setProjectId] = useState<string>(defaultProjectId ?? '');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [parsed, setParsed] = useState<ParsedRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFormat, setShowFormat] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleParse = () => {
    const rows = parseRows(text, members);
    setParsed(rows);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const content = ev.target?.result as string;
      setText(content);
      setParsed(parseRows(content, members));
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImport = async () => {
    if (!parsed) return;
    setLoading(true);
    const resolvedProjectId = projectId && projectId !== '__none__' ? projectId : null;
    const valid = parsed.filter(r => !r._error).map(r => ({
      title: r.title,
      description: r.description,
      priority: r.priority,
      status: r.status,
      due_date: r.due_date,
      assigned_to: assigneeIds.length > 0 ? assigneeIds[0] : r.assigned_to,
      assignee_ids: assigneeIds.length > 0 ? assigneeIds : (r.assigned_to ? [r.assigned_to] : []),
      recurrence: r.recurrence,
      project_id: resolvedProjectId,
    }));
    await onImport(valid as Omit<ParsedRow, '_error'>[]);
    setLoading(false);
    setText('');
    setParsed(null);
    setAssigneeIds([]);
    onClose();
  };

  const validCount = parsed?.filter(r => !r._error).length ?? 0;
  const errorCount = parsed?.filter(r => r._error).length ?? 0;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-[#1A3A5C]">Import de tâches en masse</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 mt-2 pr-1">
          <div>
            <button
              type="button"
              onClick={() => setShowFormat(v => !v)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              {showFormat ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              Format accepté
            </button>
            {showFormat && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-600 space-y-1">
                <p className="font-medium text-gray-700">CSV ou texte tabulé avec entête (optionnelle) :</p>
                <p>Colonnes reconnues : <span className="font-mono bg-white px-1 rounded">titre</span>, <span className="font-mono bg-white px-1 rounded">description</span>, <span className="font-mono bg-white px-1 rounded">priorité</span>, <span className="font-mono bg-white px-1 rounded">statut</span>, <span className="font-mono bg-white px-1 rounded">échéance</span>, <span className="font-mono bg-white px-1 rounded">responsable</span>, <span className="font-mono bg-white px-1 rounded">récurrence</span></p>
                <p>Sans entête : une tâche par ligne (titre uniquement)</p>
                <p>Priorités : faible, normal, élevée, urgent</p>
                <p>Récurrences : 15d, 30d, 3m, 6m, 1y (ou libellés français)</p>
                <div className="mt-2 font-mono bg-white p-2 rounded border border-gray-100 whitespace-pre">
{`titre,priorité,échéance,responsable
Audit sécurité,urgent,30/06/2025,Martin
Rapport mensuel,normal,15/07/2025,
Mise à jour serveur,élevée,,`}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Projet cible</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un projet..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Aucun projet</SelectItem>
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
              placeholder="Assigner à des membres... (optionnel)"
            />
            {assigneeIds.length > 0 && (
              <p className="text-[11px] text-gray-400">
                Ces responsables seront appliqués à toutes les tâches importées.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Données</Label>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 text-xs text-[#1A3A5C] hover:underline font-medium"
              >
                <Upload className="w-3.5 h-3.5" />
                Importer un fichier CSV
              </button>
            </div>
            <input ref={fileRef} type="file" accept=".csv,.txt,.tsv" className="hidden" onChange={handleFile} />
            <Textarea
              value={text}
              onChange={e => { setText(e.target.value); setParsed(null); }}
              placeholder={`Collez vos données ici...\nEx:\nAudit sécurité\nRapport mensuel\nMise à jour serveur`}
              rows={8}
              className="font-mono text-xs"
            />
          </div>

          {!parsed && text.trim() && (
            <button
              type="button"
              onClick={handleParse}
              className="flex items-center gap-2 text-sm font-medium text-[#1A3A5C] border border-[#1A3A5C]/30 hover:bg-[#1A3A5C]/5 px-3 py-1.5 rounded-lg transition-colors w-full justify-center"
            >
              <FileText className="w-4 h-4" />
              Analyser les données
            </button>
          )}

          {parsed && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {validCount > 0 && (
                  <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    {validCount} tâche{validCount > 1 ? 's' : ''} valide{validCount > 1 ? 's' : ''}
                  </span>
                )}
                {errorCount > 0 && (
                  <span className="flex items-center gap-1.5 text-sm text-red-500 font-medium">
                    <AlertCircle className="w-4 h-4" />
                    {errorCount} erreur{errorCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Titre</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Priorité</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Statut</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Échéance</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Récurrence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parsed.map((row, i) => (
                      <tr key={i} className={row._error ? 'bg-red-50' : 'bg-white hover:bg-gray-50'}>
                        <td className="px-3 py-2 font-medium text-gray-800">
                          {row._error ? (
                            <span className="text-red-500 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 flex-shrink-0" />
                              {row._error}
                            </span>
                          ) : row.title}
                        </td>
                        <td className="px-3 py-2 text-gray-600">{row.priority}</td>
                        <td className="px-3 py-2 text-gray-600">{row.status}</td>
                        <td className="px-3 py-2 text-gray-500">{row.due_date ?? '—'}</td>
                        <td className="px-3 py-2 text-gray-500">
                          {row.recurrence
                            ? RECURRENCE_OPTIONS.find(o => o.value === row.recurrence)?.label ?? row.recurrence
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-2">
          <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
          <Button
            type="button"
            disabled={!parsed || validCount === 0 || loading}
            onClick={handleImport}
            className="bg-[#1A3A5C] hover:bg-[#142d47] text-white"
          >
            {loading ? 'Import en cours...' : `Importer ${validCount > 0 ? validCount + ' tâche' + (validCount > 1 ? 's' : '') : ''}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
