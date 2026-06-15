import { useState, useEffect, useRef } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { useAuth } from '../hooks/useAuth';
import { useAppData } from '../hooks/useAppData';
import { supabase } from '../lib/supabase';
import { MultiMemberPicker } from '../components/common/MultiMemberPicker';
import { Plus, Check, Trash2, Calendar, Flag, Circle, CircleCheck as CheckCircle2, StickyNote, ChevronDown, Download, X, Pencil, CircleAlert as AlertCircle, Clock, ArrowUpDown, Filter, Users } from 'lucide-react';
import { format, isPast, isToday, isTomorrow, parseISO, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Member } from '../types';

// ── Types ────────────────────────────────────────────────────────

interface Memo {
  id: string;
  user_id: string;
  title: string;
  body: string;
  due_date: string | null;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  done: boolean;
  created_at: string;
  updated_at: string;
}

type Priority = Memo['priority'];
type FilterStatus = 'all' | 'pending' | 'done';
type SortMode = 'due_date' | 'priority' | 'created_at';

// ── Constants ────────────────────────────────────────────────────

const priorityConfig: Record<Priority, { label: string; color: string; dot: string; border: string }> = {
  urgent: { label: 'Urgente', color: 'text-red-600', dot: 'bg-red-500', border: 'border-red-200 bg-red-50' },
  high:   { label: 'Haute',   color: 'text-orange-600', dot: 'bg-orange-400', border: 'border-orange-200 bg-orange-50' },
  normal: { label: 'Normale', color: 'text-blue-600',   dot: 'bg-blue-400',   border: 'border-blue-200 bg-blue-50' },
  low:    { label: 'Faible',  color: 'text-gray-400',   dot: 'bg-gray-300',   border: 'border-gray-200 bg-gray-50' },
};

const priorityOrder: Record<Priority, number> = { urgent: 0, high: 1, normal: 2, low: 3 };

// ── Date helpers ─────────────────────────────────────────────────

function dueDateLabel(dateStr: string | null): { label: string; color: string } {
  if (!dateStr) return { label: '', color: '' };
  const d = parseISO(dateStr);
  if (isPast(d) && !isToday(d)) return { label: 'En retard', color: 'text-red-600' };
  if (isToday(d)) return { label: "Aujourd'hui", color: 'text-orange-500' };
  if (isTomorrow(d)) return { label: 'Demain', color: 'text-amber-500' };
  return { label: format(d, 'd MMM yyyy', { locale: fr }), color: 'text-gray-500' };
}

// ── ICS export ───────────────────────────────────────────────────

function exportToIcs(memos: Memo[]) {
  const pending = memos.filter(m => !m.done && m.due_date);
  if (pending.length === 0) return;

  const now = format(new Date(), "yyyyMMdd'T'HHmmss'Z'");
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Lotier Immobilier//Memos//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const memo of pending) {
    const due = memo.due_date!.replace(/-/g, '');
    const uid = `memo-${memo.id}@lotier`;
    const desc = (memo.body || '').replace(/\n/g, '\\n');
    lines.push(
      'BEGIN:VTODO',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `CREATED:${now}`,
      `SUMMARY:${memo.title}`,
      `DESCRIPTION:${desc}`,
      `DUE;VALUE=DATE:${due}`,
      `PRIORITY:${priorityOrder[memo.priority] + 1}`,
      'STATUS:NEEDS-ACTION',
      'END:VTODO',
    );
  }
  lines.push('END:VCALENDAR');

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'memos-lotier.ics';
  a.click();
  URL.revokeObjectURL(url);
}

// ── New/Edit Memo Modal ──────────────────────────────────────────

interface MemoModalProps {
  memo?: Memo;
  onSave: (data: Partial<Memo>, assigneeMemberIds: string[]) => void;
  onClose: () => void;
  members: Member[];
  isSuperAdmin: boolean;
  currentMemberId: string | null;
}

function MemoModal({ memo, onSave, onClose, members, isSuperAdmin, currentMemberId }: MemoModalProps) {
  const [title, setTitle] = useState(memo?.title ?? '');
  const [body, setBody] = useState(memo?.body ?? '');
  const [dueDate, setDueDate] = useState(memo?.due_date ?? '');
  const [priority, setPriority] = useState<Priority>(memo?.priority ?? 'normal');
  const [assigneeMemberIds, setAssigneeMemberIds] = useState<string[]>(
    currentMemberId && !memo ? [currentMemberId] : []
  );
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => { titleRef.current?.focus(); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), body, due_date: dueDate || null, priority }, assigneeMemberIds);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">{memo ? 'Modifier le mémo' : 'Nouveau mémo'}</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Titre *</label>
            <input
              ref={titleRef}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="De quoi s'agit-il ?"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A5C]/20 focus:border-[#1A3A5C]/50"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Note</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Détails, contexte..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1A3A5C]/20 focus:border-[#1A3A5C]/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                <Calendar className="w-3 h-3 inline mr-1" />
                Échéance
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A5C]/20 focus:border-[#1A3A5C]/50"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                <Flag className="w-3 h-3 inline mr-1" />
                Priorité
              </label>
              <div className="relative">
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as Priority)}
                  className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A5C]/20 focus:border-[#1A3A5C]/50 bg-white"
                >
                  {(Object.entries(priorityConfig) as [Priority, typeof priorityConfig.normal][]).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Assignés — visible uniquement en création pour les super admins */}
          {isSuperAdmin && !memo && members.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                <Users className="w-3 h-3 inline mr-1" />
                Assigné(s)
              </label>
              <MultiMemberPicker
                members={members}
                selectedIds={assigneeMemberIds}
                onChange={setAssigneeMemberIds}
                placeholder="Sélectionner des membres..."
              />
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Annuler
            </button>
            <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-[#1A3A5C] text-white text-sm font-semibold hover:bg-[#142d47] transition-colors">
              {memo ? 'Enregistrer' : assigneeMemberIds.length > 1 ? `Créer pour ${assigneeMemberIds.length} membres` : 'Créer le mémo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Memo Card ────────────────────────────────────────────────────

interface MemoCardProps {
  memo: Memo;
  onToggle: (id: string) => void;
  onEdit: (memo: Memo) => void;
  onDelete: (id: string) => void;
}

function MemoCard({ memo, onToggle, onEdit, onDelete }: MemoCardProps) {
  const prio = priorityConfig[memo.priority];
  const { label: dateLabel, color: dateColor } = dueDateLabel(memo.due_date);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className={`group bg-white rounded-2xl border transition-all duration-200 hover:shadow-md ${
      memo.done ? 'border-gray-100 opacity-60' : `border-gray-200`
    }`}>
      <div className="flex items-start gap-3 px-4 py-3.5">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(memo.id)}
          className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110"
          style={{ borderColor: memo.done ? '#22c55e' : '#d1d5db' }}
        >
          {memo.done && <Check className="w-3 h-3 text-green-500" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold leading-snug ${memo.done ? 'line-through text-gray-400' : 'text-gray-900'}`}>
            {memo.title}
          </p>
          {memo.body && (
            <p className="text-xs text-gray-400 mt-1 leading-relaxed line-clamp-2">{memo.body}</p>
          )}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {memo.due_date && (
              <span className={`flex items-center gap-1 text-xs font-medium ${dateColor}`}>
                <Calendar className="w-3 h-3" />
                {dateLabel}
              </span>
            )}
            <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${prio.border} ${prio.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${prio.dot}`} />
              {prio.label}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {!memo.done && (
            <button
              onClick={() => onEdit(memo)}
              className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <Pencil className="w-3.5 h-3.5 text-gray-400" />
            </button>
          )}
          {confirmDelete ? (
            <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-lg px-2 py-1">
              <span className="text-[10px] text-red-600 font-medium">Supprimer ?</span>
              <button onClick={() => onDelete(memo.id)} className="text-[10px] font-bold text-white bg-red-500 hover:bg-red-600 px-1.5 py-0.5 rounded">Oui</button>
              <button onClick={() => setConfirmDelete(false)} className="text-[10px] text-red-400 hover:text-red-600 px-1 py-0.5 rounded">Non</button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-gray-300 hover:text-red-500 transition-colors" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Quick dates ──────────────────────────────────────────────────

const quickDates = [
  { label: "Aujourd'hui", value: () => format(new Date(), 'yyyy-MM-dd') },
  { label: 'Demain', value: () => format(addDays(new Date(), 1), 'yyyy-MM-dd') },
  { label: 'Dans 7 jours', value: () => format(addDays(new Date(), 7), 'yyyy-MM-dd') },
];

// ── Main page ────────────────────────────────────────────────────

export function Memos() {
  const { session, isSuperAdmin, memberId } = useAuth();
  const { members } = useAppData();
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMemo, setEditMemo] = useState<Memo | undefined>();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('pending');
  const [sortMode, setSortMode] = useState<SortMode>('due_date');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickDate, setQuickDate] = useState('');

  const userId = session?.user.id;

  // ── Load ──

  const load = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('memos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setMemos((data as Memo[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [userId]);

  // ── CRUD ──

  const createMemo = async (data: Partial<Memo>) => {
    if (!userId) return;
    const { data: row } = await supabase
      .from('memos')
      .insert({ ...data, user_id: userId })
      .select()
      .single();
    if (row) setMemos(prev => [row as Memo, ...prev]);
  };

  const updateMemo = async (id: string, data: Partial<Memo>) => {
    const { data: row } = await supabase
      .from('memos')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (row) setMemos(prev => prev.map(m => m.id === id ? row as Memo : m));
  };

  const deleteMemo = async (id: string) => {
    await supabase.from('memos').delete().eq('id', id);
    setMemos(prev => prev.filter(m => m.id !== id));
  };

  const toggleDone = (id: string) => {
    const memo = memos.find(m => m.id === id);
    if (memo) updateMemo(id, { done: !memo.done });
  };

  // ── Quick add ──

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    await createMemo({ title: quickTitle.trim(), body: '', due_date: quickDate || null, priority: 'normal' });
    setQuickTitle('');
    setQuickDate('');
  };

  // ── Modal handlers ──

  const handleSave = async (data: Partial<Memo>, assigneeMemberIds: string[]) => {
    if (editMemo) {
      await updateMemo(editMemo.id, data);
    } else if (assigneeMemberIds.length > 0) {
      // Fetch auth_user_id for each selected member
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('auth_user_id, member_id')
        .in('member_id', assigneeMemberIds);

      const insertRows = (userRoles ?? [])
        .filter(ur => ur.auth_user_id)
        .map(ur => ({ ...data, user_id: ur.auth_user_id }));

      if (insertRows.length > 0) {
        const { data: rows } = await supabase
          .from('memos')
          .insert(insertRows)
          .select();
        // Only show own memos in list (created for current user)
        const ownRows = (rows ?? []).filter((r: Memo) => r.user_id === userId);
        if (ownRows.length > 0) setMemos(prev => [...ownRows as Memo[], ...prev]);
      }
    } else {
      await createMemo(data);
    }
    setModalOpen(false);
    setEditMemo(undefined);
  };

  const openEdit = (memo: Memo) => {
    setEditMemo(memo);
    setModalOpen(true);
  };

  // ── Filter + sort ──

  const filtered = memos
    .filter(m => {
      if (filterStatus === 'pending') return !m.done;
      if (filterStatus === 'done') return m.done;
      return true;
    })
    .sort((a, b) => {
      if (sortMode === 'priority') return priorityOrder[a.priority] - priorityOrder[b.priority];
      if (sortMode === 'due_date') {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return a.due_date.localeCompare(b.due_date);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const pendingCount = memos.filter(m => !m.done).length;
  const overdueCount = memos.filter(m => !m.done && m.due_date && isPast(parseISO(m.due_date)) && !isToday(parseISO(m.due_date))).length;
  const todayCount = memos.filter(m => !m.done && m.due_date && isToday(parseISO(m.due_date))).length;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-5 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1A3A5C]/10 flex items-center justify-center">
              <StickyNote className="w-5 h-5 text-[#1A3A5C]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mémos</h1>
              <p className="text-sm text-gray-400">
                {pendingCount} à faire
                {overdueCount > 0 && <span className="text-red-500 font-medium"> · {overdueCount} en retard</span>}
                {todayCount > 0 && <span className="text-orange-500 font-medium"> · {todayCount} aujourd'hui</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportToIcs(memos)}
              title="Exporter vers Google Calendar / iCal"
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export .ics</span>
            </button>
            <button
              onClick={() => { setEditMemo(undefined); setModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A3A5C] text-white text-sm font-semibold hover:bg-[#142d47] transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Nouveau
            </button>
          </div>
        </div>

        {/* Stats row */}
        {memos.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'À faire', value: pendingCount, icon: Circle, color: 'text-[#1A3A5C]', bg: 'bg-[#1A3A5C]/5 border-[#1A3A5C]/10' },
              { label: 'En retard', value: overdueCount, icon: AlertCircle, color: 'text-red-600', bg: overdueCount > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100' },
              { label: 'Terminés', value: memos.filter(m => m.done).length, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${bg}`}>
                <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
                <div>
                  <p className={`text-lg font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-gray-400">{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick add */}
        <form onSubmit={handleQuickAdd} className="mb-6 bg-white rounded-2xl border border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
          <Plus className="w-4 h-4 text-gray-300 flex-shrink-0" />
          <input
            value={quickTitle}
            onChange={e => setQuickTitle(e.target.value)}
            placeholder="Ajouter un mémo rapide..."
            className="flex-1 text-sm outline-none placeholder-gray-400 bg-transparent"
          />
          <div className="flex items-center gap-2 flex-shrink-0">
            {quickDates.map(qd => (
              <button
                key={qd.label}
                type="button"
                onClick={() => setQuickDate(prev => prev === qd.value() ? '' : qd.value())}
                className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                  quickDate === qd.value()
                    ? 'bg-[#1A3A5C] text-white border-[#1A3A5C]'
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {qd.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => { setEditMemo(undefined); setModalOpen(true); }}
              className="text-xs text-gray-400 hover:text-[#1A3A5C] transition-colors px-1"
              title="Plus d'options"
            >
              <Clock className="w-4 h-4" />
            </button>
          </div>
          {quickTitle && (
            <button type="submit" className="flex-shrink-0 w-7 h-7 rounded-lg bg-[#1A3A5C] flex items-center justify-center hover:bg-[#142d47] transition-colors">
              <Check className="w-3.5 h-3.5 text-white" />
            </button>
          )}
        </form>

        {/* Filters + sort */}
        <div className="flex items-center justify-between mb-4 gap-2">
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            {([
              { id: 'pending', label: 'À faire' },
              { id: 'done', label: 'Terminés' },
              { id: 'all', label: 'Tous' },
            ] as { id: FilterStatus; label: string }[]).map(f => (
              <button
                key={f.id}
                onClick={() => setFilterStatus(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterStatus === f.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={sortMode}
              onChange={e => setSortMode(e.target.value as SortMode)}
              className="text-xs text-gray-500 bg-transparent outline-none cursor-pointer"
            >
              <option value="due_date">Par échéance</option>
              <option value="priority">Par priorité</option>
              <option value="created_at">Par date de création</option>
            </select>
            <ArrowUpDown className="w-3 h-3 text-gray-300" />
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-[#1A3A5C] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <StickyNote className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-400">
              {filterStatus === 'done' ? 'Aucun mémo terminé' : 'Aucun mémo à faire'}
            </p>
            <p className="text-xs text-gray-300 mt-1">
              {filterStatus === 'pending' ? 'Créez votre premier mémo ci-dessus' : ''}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(memo => (
              <MemoCard
                key={memo.id}
                memo={memo}
                onToggle={toggleDone}
                onEdit={openEdit}
                onDelete={deleteMemo}
              />
            ))}
          </div>
        )}

        {/* ICS export info */}
        {memos.filter(m => !m.done && m.due_date).length > 0 && (
          <div className="mt-8 flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-800">Synchroniser avec votre agenda</p>
              <p className="text-xs text-blue-600 mt-0.5">
                Cliquez sur <strong>"Export .ics"</strong> pour télécharger vos mémos avec échéance.
                Importez le fichier dans Google Calendar, Apple Calendar ou Outlook : Calendrier &rarr; + Autres calendriers &rarr; Importer.
              </p>
            </div>
          </div>
        )}

      </div>

      {modalOpen && (
        <MemoModal
          memo={editMemo}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditMemo(undefined); }}
          members={members}
          isSuperAdmin={isSuperAdmin}
          currentMemberId={memberId}
        />
      )}
    </AppLayout>
  );
}
