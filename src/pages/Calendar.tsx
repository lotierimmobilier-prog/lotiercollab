import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, RefreshCw, Calendar as CalendarIcon, Clock, Flag, StickyNote, X, Check, Pencil, Trash2, LoaderCircle as Loader2, LayoutGrid, List, CalendarDays, Link2, ChevronDown, CircleAlert as AlertCircle, Users } from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays,
  addMonths, subMonths, addWeeks, subWeeks, isSameMonth,
  isToday, parseISO, isAfter,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { AppLayout } from '../components/layout/AppLayout';
import { Topbar } from '../components/layout/Topbar';
import { MemberAvatar } from '../components/common/MemberAvatar';
import { MultiMemberPicker } from '../components/common/MultiMemberPicker';
import { supabase } from '../lib/supabase';
import { useAppData } from '../hooks/useAppData';
import { useAuth } from '../hooks/useAuth';
import type { Task, Member } from '../types';

// ── Types ────────────────────────────────────────────────────────────

interface Memo {
  id: string;
  user_id: string;
  title: string;
  body: string;
  due_date: string | null;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  done: boolean;
}

interface CalEvent {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  all_day: boolean;
  color: string;
  member_id: string | null;
  created_by: string | null;
  google_event_id: string | null;
  attendee_ids?: string[];
}

interface CalendarStatus {
  connected: boolean;
  sync_enabled?: boolean;
  last_synced_at?: string | null;
}

type ViewMode = 'month' | 'week' | 'agenda';

interface DayItem {
  type: 'task' | 'memo' | 'event';
  id: string;
  title: string;
  color: string;
  time?: string;
  priority?: string;
  done?: boolean;
  member?: Member;
  attendees?: Member[];
  raw: Task | Memo | CalEvent;
}

// ── Constants ────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#EF4444',
  high: '#F97316',
  normal: '#3B82F6',
  low: '#9CA3AF',
};

const EVENT_COLORS = [
  '#1A3A5C', '#0EA5E9', '#10B981', '#F59E0B',
  '#EF4444', '#EC4899', '#6366F1', '#6B7280',
];

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

function getDateKey(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

// ── Google Connect Banner ─────────────────────────────────────────────

interface GoogleConnectBannerProps {
  targetMemberId: string;
  targetMemberName: string;
  onConnected: () => void;
}

function GoogleConnectBanner({ targetMemberId, targetMemberName, onConnected }: GoogleConnectBannerProps) {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Listen for the success message posted by the popup after it has already
    // exchanged the code and stored the tokens.
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'google-oauth-callback') return;
      if (event.data.error) {
        setError(event.data.error);
        setConnecting(false);
        return;
      }
      if (event.data.success) {
        setConnecting(false);
        onConnected();
      }
    };

    window.addEventListener('message', handleMessage);

    // Handle full-page redirect fallback (no popup)
    const stored = sessionStorage.getItem('google_oauth_success');
    if (stored) {
      sessionStorage.removeItem('google_oauth_success');
      onConnected();
    }

    return () => window.removeEventListener('message', handleMessage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetMemberId]);

  const handleConnect = async () => {
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/google-oauth/auth-url?member_id=${targetMemberId}`,
        { headers: { 'Authorization': `Bearer ${session?.access_token}` } }
      );
      const data = await res.json();
      if (!data.url) { setError('Impossible de générer le lien'); return; }
      const popup = window.open(data.url, 'google-oauth', 'width=500,height=650,left=300,top=100');
      if (!popup) window.location.href = data.url;
    } catch (e) {
      setError(String(e));
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50/60">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-sm w-full mx-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#1A3A5C]/8 flex items-center justify-center mx-auto mb-4">
          <CalendarDays className="w-7 h-7 text-[#1A3A5C]" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">
          Connecter Google Calendar
        </h3>
        <p className="text-sm text-gray-500 mb-1">
          Pour synchroniser l'agenda de <span className="font-medium text-gray-700">{targetMemberName}</span>, un compte Google Calendar doit être connecté.
        </p>
        <p className="text-xs text-gray-400 mb-6">
          Les tâches et rendez-vous seront exportés automatiquement.
        </p>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-xs text-red-600 mb-4 text-left">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {error}
          </div>
        )}

        <button
          onClick={handleConnect}
          disabled={connecting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1A3A5C] hover:bg-[#15304d] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
        >
          {connecting
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Link2 className="w-4 h-4" />
          }
          Connecter Google Calendar
        </button>

        <p className="text-[11px] text-gray-300 mt-3">
          Vous pouvez également consulter l'agenda sans synchronisation
        </p>
        <button
          onClick={onConnected}
          className="text-[11px] text-gray-400 hover:text-gray-600 underline mt-1 transition-colors"
        >
          Continuer sans synchronisation
        </button>
      </div>
    </div>
  );
}

// ── New/Edit Event Modal ─────────────────────────────────────────────

interface EventModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<CalEvent>, attendeeIds: string[]) => Promise<void>;
  onDelete?: () => Promise<void>;
  initial?: CalEvent | null;
  defaultDate?: Date;
  members: Member[];
  isSuperAdmin: boolean;
  defaultMemberId: string | null;
}

function EventModal({ open, onClose, onSave, onDelete, initial, defaultDate, members, isSuperAdmin, defaultMemberId }: EventModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [allDay, setAllDay] = useState(true);
  const [color, setColor] = useState(EVENT_COLORS[0]);
  const [assignedMemberId, setAssignedMemberId] = useState<string>('');
  const [attendeeIds, setAttendeeIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setTitle(initial.title);
      setDescription(initial.description ?? '');
      setStartDate(initial.start_date);
      setEndDate(initial.end_date ?? initial.start_date);
      setStartTime(initial.start_time ?? '');
      setEndTime(initial.end_time ?? '');
      setAllDay(initial.all_day);
      setColor(initial.color ?? EVENT_COLORS[0]);
      setAssignedMemberId(initial.member_id ?? '');
      setAttendeeIds(initial.attendee_ids ?? []);
    } else {
      const d = defaultDate ? format(defaultDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
      setTitle(''); setDescription('');
      setStartDate(d); setEndDate(d);
      setStartTime(''); setEndTime('');
      setAllDay(true);
      setColor(EVENT_COLORS[0]);
      setAssignedMemberId(defaultMemberId ?? '');
      setAttendeeIds([]);
    }
  }, [open, initial, defaultDate, defaultMemberId]);

  if (!open) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      title, description,
      start_date: startDate,
      end_date: endDate || startDate,
      start_time: allDay ? null : startTime || null,
      end_time: allDay ? null : endTime || null,
      all_day: allDay, color,
      member_id: assignedMemberId || null,
    }, attendeeIds);
    setSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    await onDelete();
    setDeleting(false);
    onClose();
  };

  // Members available as attendees (exclude the assigned member to avoid confusion)
  const attendeeOptions = members.filter(m => m.id !== assignedMemberId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="h-1.5" style={{ backgroundColor: color }} />
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">
              {initial ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
            </h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-3">
            <input
              type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Titre du rendez-vous" required
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3A5C]/20 focus:border-[#1A3A5C]"
            />
            <textarea
              value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Description (optionnel)" rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3A5C]/20 focus:border-[#1A3A5C] resize-none"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Début</label>
                <input
                  type="date" value={startDate} required
                  onChange={e => { setStartDate(e.target.value); if (!endDate || endDate < e.target.value) setEndDate(e.target.value); }}
                  className="w-full mt-0.5 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3A5C]/20"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Fin</label>
                <input
                  type="date" value={endDate} min={startDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full mt-0.5 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3A5C]/20"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button" onClick={() => setAllDay(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${allDay ? 'bg-[#1A3A5C] text-white border-[#1A3A5C]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                Toute la journée
              </button>
              {!allDay && (
                <div className="flex items-center gap-1 flex-1">
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                    className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3A5C]/20" />
                  <span className="text-gray-400 text-xs">→</span>
                  <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                    className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3A5C]/20" />
                </div>
              )}
            </div>

            {/* Admin can assign to any member; agents see only their own name */}
            {isSuperAdmin && (
              <select
                value={assignedMemberId} onChange={e => setAssignedMemberId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3A5C]/20 text-gray-700"
              >
                <option value="">Aucun collaborateur</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.full_name}</option>
                ))}
              </select>
            )}

            {/* Attendees */}
            {attendeeOptions.length > 0 && (
              <div>
                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1 mb-1.5">
                  <Users className="w-3 h-3" />
                  Participants
                </label>
                <MultiMemberPicker
                  members={attendeeOptions}
                  selectedIds={attendeeIds}
                  onChange={setAttendeeIds}
                  placeholder="Inviter des participants..."
                  size="sm"
                />
              </div>
            )}

            <div>
              <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Couleur</label>
              <div className="flex items-center gap-2">
                {EVENT_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              {initial && onDelete && (
                <button type="button" onClick={handleDelete} disabled={deleting}
                  className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors border border-gray-200">
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              )}
              <button type="button" onClick={onClose} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600">
                Annuler
              </button>
              <button type="submit" disabled={saving || !title}
                className="flex-1 py-2 text-sm bg-[#1A3A5C] hover:bg-[#15304d] text-white rounded-lg transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-1.5">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {initial ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Day Item Chip ─────────────────────────────────────────────────────

function DayItemChip({ item, onClick }: { item: DayItem; onClick: () => void }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(); }}
      className="w-full text-left px-1.5 py-0.5 rounded text-[11px] font-medium truncate flex items-center gap-1 hover:opacity-80 transition-opacity"
      style={{ backgroundColor: item.color + '22', color: item.color }}
    >
      {item.type === 'task' && <Flag className="w-2.5 h-2.5 flex-shrink-0" />}
      {item.type === 'memo' && <StickyNote className="w-2.5 h-2.5 flex-shrink-0" />}
      {item.type === 'event' && <CalendarIcon className="w-2.5 h-2.5 flex-shrink-0" />}
      <span className={`truncate ${item.done ? 'line-through opacity-60' : ''}`}>{item.title}</span>
    </button>
  );
}

// ── Detail Popover ────────────────────────────────────────────────────

function ItemDetailPopover({ item, onClose, onEdit }: { item: DayItem; onClose: () => void; onEdit?: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl border border-gray-100 w-72 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="h-1" style={{ backgroundColor: item.color }} />
        <div className="p-4">
          <div className="flex items-start gap-2 mb-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: item.color + '22' }}>
              {item.type === 'task' && <Flag className="w-3.5 h-3.5" style={{ color: item.color }} />}
              {item.type === 'memo' && <StickyNote className="w-3.5 h-3.5" style={{ color: item.color }} />}
              {item.type === 'event' && <CalendarIcon className="w-3.5 h-3.5" style={{ color: item.color }} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold text-gray-900 ${item.done ? 'line-through text-gray-400' : ''}`}>{item.title}</p>
              <p className="text-[11px] text-gray-400 capitalize">
                {item.type === 'task' ? 'Tâche' : item.type === 'memo' ? 'Mémo' : 'Rendez-vous'}
                {item.priority && ` · priorité ${item.priority}`}
              </p>
            </div>
            <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {item.time && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
              <Clock className="w-3.5 h-3.5" />
              {item.time}
            </div>
          )}

          {item.member && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
              <MemberAvatar member={item.member} size="sm" />
              <span>{item.member.full_name}</span>
            </div>
          )}

          {item.attendees && item.attendees.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
              <Users className="w-3.5 h-3.5 flex-shrink-0" />
              <div className="flex items-center gap-1 flex-wrap">
                {item.attendees.map(a => (
                  <div key={a.id} className="flex items-center gap-1 bg-gray-50 rounded-full px-2 py-0.5">
                    <div className="w-3.5 h-3.5 rounded-full flex-shrink-0 flex items-center justify-center text-[8px] font-bold text-white" style={{ backgroundColor: a.avatar_color }}>
                      {a.initials}
                    </div>
                    <span className="text-[11px] text-gray-600">{a.full_name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-3">
            {onEdit && (
              <button onClick={onEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors">
                <Pencil className="w-3 h-3" />
                Modifier
              </button>
            )}
            <button onClick={onClose} className="flex-1 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors">
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Calendar Page ────────────────────────────────────────────────

export function Calendar() {
  const { tasks, members } = useAppData();
  const { memberId, isSuperAdmin } = useAuth();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  // Which member's calendar are we viewing?
  // Admin: can switch between all members. Agent: always their own.
  const [viewingMemberId, setViewingMemberId] = useState<string | null>(memberId);

  const [memos, setMemos] = useState<Memo[]>([]);
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [calStatus, setCalStatus] = useState<CalendarStatus | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [skipGoogleConnect, setSkipGoogleConnect] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [eventModal, setEventModal] = useState<{ open: boolean; event?: CalEvent | null; defaultDate?: Date }>({ open: false });
  const [detailItem, setDetailItem] = useState<DayItem | null>(null);
  const [memberDropdownOpen, setMemberDropdownOpen] = useState(false);

  // The member object currently being viewed
  const viewingMember = viewingMemberId ? members.find(m => m.id === viewingMemberId) : null;
  const myMember = memberId ? members.find(m => m.id === memberId) : null;

  // ── Check Google Calendar status for current viewed member ────────

  const checkCalStatus = useCallback(async (mid: string | null) => {
    if (!mid) { setCalStatus(null); setCheckingStatus(false); return; }
    setCheckingStatus(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/google-calendar-sync/status?member_id=${mid}`,
        { headers: { 'Authorization': `Bearer ${session?.access_token}` } }
      );
      const data = await res.json();
      setCalStatus(data);
    } catch {
      setCalStatus({ connected: false });
    } finally {
      setCheckingStatus(false);
    }
  }, []);

  // When the viewed member changes, re-check Google status
  useEffect(() => {
    setSkipGoogleConnect(false);
    checkCalStatus(viewingMemberId);
  }, [viewingMemberId, checkCalStatus]);

  // On mount, default admin views their own calendar
  useEffect(() => {
    if (memberId) setViewingMemberId(memberId);
  }, [memberId]);

  // ── Fetch memos and events scoped to the viewed member ────────────

  const fetchMemos = useCallback(async () => {
    if (!viewingMemberId) return;
    // Memos are per-auth-user — we look them up by the auth user linked to this member
    const { data: urData } = await supabase
      .from('user_roles')
      .select('auth_user_id')
      .eq('member_id', viewingMemberId)
      .maybeSingle();

    if (!urData?.auth_user_id) { setMemos([]); return; }

    const { data } = await supabase
      .from('memos')
      .select('id,user_id,title,body,due_date,priority,done')
      .eq('user_id', urData.auth_user_id)
      .eq('done', false)
      .not('due_date', 'is', null);
    setMemos(data ?? []);
  }, [viewingMemberId]);

  const fetchEvents = useCallback(async () => {
    if (!viewingMemberId) return;
    const { data } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('member_id', viewingMemberId)
      .order('start_date');

    if (!data) { setEvents([]); return; }

    // Fetch all attendees for these events in one query
    const eventIds = data.map(e => e.id);
    const { data: attendeeRows } = eventIds.length > 0
      ? await supabase.from('event_attendees').select('event_id, member_id').in('event_id', eventIds)
      : { data: [] };

    const attendeeMap = new Map<string, string[]>();
    for (const row of (attendeeRows ?? [])) {
      if (!attendeeMap.has(row.event_id)) attendeeMap.set(row.event_id, []);
      attendeeMap.get(row.event_id)!.push(row.member_id);
    }

    setEvents(data.map(e => ({ ...e, attendee_ids: attendeeMap.get(e.id) ?? [] })));
  }, [viewingMemberId]);

  // Auto-import Google → LOTIER silently when the calendar loads for a connected member
  const importFromGoogle = useCallback(async (mid: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/google-calendar-sync/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ member_id: mid }),
      });
      if (res.ok) await fetchEvents();
    } catch { /* silent */ }
  }, [fetchEvents]);

  useEffect(() => {
    setLoadingData(true);
    Promise.all([fetchMemos(), fetchEvents()]).finally(() => setLoadingData(false));
  }, [fetchMemos, fetchEvents]);

  // Trigger auto-import after status is confirmed connected
  useEffect(() => {
    if (calStatus?.connected && viewingMemberId) {
      importFromGoogle(viewingMemberId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calStatus?.connected, viewingMemberId]);

  // ── Build day items (scoped to viewed member) ─────────────────────

  const dayItems = useCallback((): Map<string, DayItem[]> => {
    const map = new Map<string, DayItem[]>();
    const add = (key: string, item: DayItem) => {
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    };

    // Tasks assigned to the viewed member
    for (const task of tasks) {
      if (!task.due_date) continue;
      if (task.status === 'done') continue;
      // Show tasks assigned to or created by the viewed member
      const isAssigned = task.assigned_to === viewingMemberId
        || (task.assignees ?? []).some(a => a.id === viewingMemberId);
      if (!isAssigned) continue;
      add(task.due_date, {
        type: 'task',
        id: task.id,
        title: task.title,
        color: PRIORITY_COLORS[task.priority] ?? '#3B82F6',
        priority: task.priority,
        member: viewingMember ?? undefined,
        raw: task,
      });
    }

    // Memos of the viewed member
    for (const memo of memos) {
      if (!memo.due_date || memo.done) continue;
      add(memo.due_date, {
        type: 'memo',
        id: memo.id,
        title: memo.title,
        color: PRIORITY_COLORS[memo.priority] ?? '#3B82F6',
        priority: memo.priority,
        done: memo.done,
        raw: memo,
      });
    }

    // Calendar events of the viewed member (multi-day span)
    for (const ev of events) {
      const start = parseISO(ev.start_date);
      const end = ev.end_date ? parseISO(ev.end_date) : start;
      const attendees = (ev.attendee_ids ?? []).map(id => members.find(m => m.id === id)).filter(Boolean) as Member[];
      let cur = start;
      while (!isAfter(cur, end)) {
        add(getDateKey(cur), {
          type: 'event',
          id: ev.id,
          title: ev.title,
          color: ev.color,
          time: !ev.all_day && ev.start_time ? ev.start_time.slice(0, 5) : undefined,
          member: viewingMember ?? undefined,
          attendees,
          raw: ev,
        });
        cur = addDays(cur, 1);
      }
    }

    return map;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, memos, events, viewingMemberId, viewingMember, members]);

  const itemsMap = dayItems();

  // ── Google Calendar sync ──────────────────────────────────────────

  const handleSync = async () => {
    if (!viewingMemberId) return;
    setSyncing(true);
    setSyncMsg(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/google-calendar-sync/sync`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: viewingMemberId }),
      });
      const data = await res.json();
      const result = data.results?.[viewingMemberId];
      if (result) {
        const errCount = result.errors?.length ?? 0;
        const parts = [];
        if (result.imported > 0) parts.push(`${result.imported} importé(s)`);
        if (result.synced > 0) parts.push(`${result.synced} exporté(s)`);
        setSyncMsg(errCount > 0
          ? { ok: false, text: `${parts.join(', ') || 'Sync OK'} · ${errCount} erreur(s)` }
          : { ok: true, text: parts.length ? parts.join(' · ') : 'À jour' }
        );
      } else {
        setSyncMsg({ ok: true, text: 'À jour' });
      }
      await fetchEvents();
      await checkCalStatus(viewingMemberId);
    } finally {
      setSyncing(false);
    }
  };

  // ── CRUD calendar events ──────────────────────────────────────────

  const handleSaveEvent = async (data: Partial<CalEvent>, attendeeIds: string[]) => {
    const { data: { session } } = await supabase.auth.getSession();
    const { data: ur } = await supabase.from('user_roles').select('member_id').eq('auth_user_id', session!.user.id).maybeSingle();

    if (eventModal.event) {
      const { error } = await supabase.from('calendar_events')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', eventModal.event.id);
      if (!error) {
        // Replace attendees: delete then re-insert
        await supabase.from('event_attendees').delete().eq('event_id', eventModal.event.id);
        if (attendeeIds.length > 0) {
          await supabase.from('event_attendees').insert(
            attendeeIds.map(mid => ({ event_id: eventModal.event!.id, member_id: mid }))
          );
        }
        setEvents(prev => prev.map(e => e.id === eventModal.event!.id
          ? { ...e, ...data, attendee_ids: attendeeIds } as CalEvent
          : e
        ));
      }
    } else {
      const finalMemberId = isSuperAdmin ? (data.member_id ?? viewingMemberId) : viewingMemberId;
      const { data: newEv } = await supabase.from('calendar_events')
        .insert({ ...data, member_id: finalMemberId, created_by: ur?.member_id ?? null })
        .select().single();
      if (newEv) {
        if (attendeeIds.length > 0) {
          await supabase.from('event_attendees').insert(
            attendeeIds.map(mid => ({ event_id: newEv.id, member_id: mid }))
          );
        }
        setEvents(prev => [...prev, { ...newEv, attendee_ids: attendeeIds }]);
      }
    }
  };

  const handleDeleteEvent = async () => {
    if (!eventModal.event) return;
    await supabase.from('calendar_events').delete().eq('id', eventModal.event.id);
    setEvents(prev => prev.filter(e => e.id !== eventModal.event!.id));
  };

  // ── Navigation ────────────────────────────────────────────────────

  const goPrev = () => {
    if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
    else setCurrentDate(subWeeks(currentDate, 1));
  };
  const goNext = () => {
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    else setCurrentDate(addWeeks(currentDate, 1));
  };

  const getTitle = () => {
    if (viewMode === 'month') return format(currentDate, 'MMMM yyyy', { locale: fr });
    const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
    const we = endOfWeek(currentDate, { weekStartsOn: 1 });
    if (isSameMonth(ws, we)) return `${format(ws, 'd')} – ${format(we, 'd MMMM yyyy', { locale: fr })}`;
    return `${format(ws, 'd MMM', { locale: fr })} – ${format(we, 'd MMM yyyy', { locale: fr })}`;
  };

  // ── Month view ────────────────────────────────────────────────────

  function renderMonthView() {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days: Date[] = [];
    let cur = calStart;
    while (!isAfter(cur, calEnd)) { days.push(cur); cur = addDays(cur, 1); }

    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-100">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
            <div key={d} className="py-2 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{d}</div>
          ))}
        </div>
        <div className="flex-1 grid grid-cols-7 overflow-y-auto">
          {days.map((day, i) => {
            const key = getDateKey(day);
            const items = itemsMap.get(key) ?? [];
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isDayToday = isToday(day);
            return (
              <div
                key={i}
                onClick={() => setEventModal({ open: true, defaultDate: day })}
                className={`min-h-[100px] border-r border-b border-gray-100 p-1.5 cursor-pointer hover:bg-blue-50/30 transition-colors group ${!isCurrentMonth ? 'bg-gray-50/50' : 'bg-white'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${isDayToday ? 'bg-[#1A3A5C] text-white' : isCurrentMonth ? 'text-gray-700' : 'text-gray-300'}`}>
                    {format(day, 'd')}
                  </span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus className="w-3 h-3 text-gray-300" />
                  </span>
                </div>
                <div className="space-y-0.5">
                  {items.slice(0, 3).map(item => (
                    <DayItemChip key={`${item.type}-${item.id}`} item={item} onClick={() => setDetailItem(item)} />
                  ))}
                  {items.length > 3 && (
                    <button onClick={e => e.stopPropagation()} className="text-[10px] text-gray-400 hover:text-gray-600 px-1.5 font-medium">
                      +{items.length - 3} autres
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Week view ─────────────────────────────────────────────────────

  function renderWeekView() {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-7 border-b border-gray-100 sticky top-0 bg-white z-10 shadow-sm">
          {weekDays.map((day, i) => (
            <div key={i} className={`py-3 text-center border-r border-gray-100 last:border-r-0 ${isToday(day) ? 'bg-[#1A3A5C]/5' : ''}`}>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">{format(day, 'EEE', { locale: fr })}</p>
              <div className={`mt-0.5 w-8 h-8 mx-auto flex items-center justify-center rounded-full text-sm font-semibold ${isToday(day) ? 'bg-[#1A3A5C] text-white' : 'text-gray-700'}`}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {weekDays.map((day, i) => {
            const items = itemsMap.get(getDateKey(day)) ?? [];
            return (
              <div
                key={i}
                onClick={() => setEventModal({ open: true, defaultDate: day })}
                className={`min-h-[200px] border-r border-gray-100 last:border-r-0 p-2 cursor-pointer hover:bg-blue-50/20 transition-colors group ${isToday(day) ? 'bg-[#1A3A5C]/3' : ''}`}
              >
                <div className="space-y-1">
                  {items.map(item => (
                    <button key={`${item.type}-${item.id}`}
                      onClick={e => { e.stopPropagation(); setDetailItem(item); }}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: item.color + '22', color: item.color, borderLeft: `3px solid ${item.color}` }}>
                      <div className="flex items-center gap-1 truncate">
                        {item.time && <><Clock className="w-2.5 h-2.5 flex-shrink-0" /><span className="flex-shrink-0">{item.time}</span></>}
                        <span className={`truncate ${item.done ? 'line-through opacity-60' : ''}`}>{item.title}</span>
                      </div>
                    </button>
                  ))}
                  {items.length === 0 && (
                    <div className="pt-2 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="w-4 h-4 text-gray-300" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Agenda view ───────────────────────────────────────────────────

  function renderAgendaView() {
    const start = startOfMonth(currentDate);
    const end = addDays(start, 90);
    const upcoming: { date: Date; items: DayItem[] }[] = [];
    let cur = start;
    while (!isAfter(cur, end)) {
      const items = itemsMap.get(getDateKey(cur));
      if (items?.length) upcoming.push({ date: new Date(cur), items });
      cur = addDays(cur, 1);
    }

    if (!upcoming.length) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-20">
            <CalendarIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Aucun événement à venir</p>
            <p className="text-xs text-gray-400 mt-1">Les 90 prochains jours sont libres</p>
          </div>
        </div>
      );
    }

    let lastMonth = '';
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto py-4 px-4 space-y-1">
          {upcoming.map(({ date, items }) => {
            const monthKey = format(date, 'MMMM yyyy', { locale: fr });
            const showHeader = monthKey !== lastMonth;
            lastMonth = monthKey;
            return (
              <div key={getDateKey(date)}>
                {showHeader && (
                  <div className="sticky top-0 z-10 pt-4 pb-2 bg-white/95 backdrop-blur-sm">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest capitalize">{monthKey}</h3>
                  </div>
                )}
                <div className="flex gap-4 py-2 border-b border-gray-50 hover:bg-gray-50/60 rounded-lg px-2 -mx-2 transition-colors">
                  <div className="flex-shrink-0 w-14 text-center pt-0.5">
                    <div className={`text-2xl font-bold leading-none ${isToday(date) ? 'text-[#1A3A5C]' : 'text-gray-800'}`}>
                      {format(date, 'd')}
                    </div>
                    <div className="text-[11px] text-gray-400 capitalize mt-0.5">{format(date, 'EEE', { locale: fr })}</div>
                    {isToday(date) && <div className="w-1.5 h-1.5 rounded-full bg-[#1A3A5C] mx-auto mt-1" />}
                  </div>
                  <div className="flex-1 space-y-1.5 min-w-0">
                    {items.map(item => (
                      <button key={`${item.type}-${item.id}`}
                        onClick={() => item.type === 'event'
                          ? setEventModal({ open: true, event: item.raw as CalEvent })
                          : setDetailItem(item)
                        }
                        className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl border hover:shadow-sm transition-all"
                        style={{ borderColor: item.color + '44', backgroundColor: item.color + '08' }}>
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium text-gray-800 truncate ${item.done ? 'line-through text-gray-400' : ''}`}>{item.title}</span>
                            {item.time && <span className="text-xs text-gray-400 flex-shrink-0 flex items-center gap-0.5"><Clock className="w-3 h-3" />{item.time}</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[11px] text-gray-400 capitalize">
                              {item.type === 'task' ? 'Tâche' : item.type === 'memo' ? 'Mémo' : 'Rendez-vous'}
                            </p>
                            {item.attendees && item.attendees.length > 0 && (
                              <div className="flex items-center gap-1">
                                <div className="flex -space-x-1">
                                  {item.attendees.slice(0, 3).map(a => (
                                    <div key={a.id} title={a.full_name} className="w-4 h-4 rounded-full border border-white flex items-center justify-center text-[8px] font-bold text-white" style={{ backgroundColor: a.avatar_color }}>
                                      {a.initials?.[0]}
                                    </div>
                                  ))}
                                </div>
                                {item.attendees.length > 3 && <span className="text-[10px] text-gray-400">+{item.attendees.length - 3}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                        {item.type === 'event' && <Pencil className="w-3 h-3 text-gray-300 flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────

  // Determine if we should show the Google connect gate
  const showGoogleGate = !checkingStatus && calStatus && !calStatus.connected && !skipGoogleConnect;

  return (
    <AppLayout>
      <Topbar title="Agenda" />

      <main className="flex-1 flex flex-col overflow-hidden bg-white">

        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 flex-wrap gap-y-2">

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors">
              Aujourd'hui
            </button>
            <button onClick={goPrev} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={goNext} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-base font-semibold text-gray-800 capitalize flex-1 min-w-0 truncate">{getTitle()}</h2>

          {/* Member selector — admin only */}
          {isSuperAdmin && (
            <div className="relative">
              <button
                onClick={() => setMemberDropdownOpen(v => !v)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
              >
                {viewingMember ? (
                  <>
                    <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: viewingMember.avatar_color }} />
                    {viewingMember.full_name}
                  </>
                ) : (
                  <span className="text-gray-400">Sélectionner un membre</span>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {memberDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 z-30 bg-white border border-gray-100 rounded-xl shadow-lg py-1 w-52 overflow-hidden">
                  {/* Admin's own view */}
                  {myMember && (
                    <button
                      onClick={() => { setViewingMemberId(myMember.id); setMemberDropdownOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${viewingMemberId === myMember.id ? 'text-[#1A3A5C] font-semibold' : 'text-gray-700'}`}
                    >
                      <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: myMember.avatar_color }}>
                        {myMember.initials}
                      </div>
                      {myMember.full_name}
                      <span className="ml-auto text-[10px] text-gray-400">Moi</span>
                    </button>
                  )}
                  {members.length > 1 && <div className="h-px bg-gray-100 my-1" />}
                  {/* Other members */}
                  {members.filter(m => m.id !== memberId).map(m => (
                    <button
                      key={m.id}
                      onClick={() => { setViewingMemberId(m.id); setMemberDropdownOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${viewingMemberId === m.id ? 'text-[#1A3A5C] font-semibold' : 'text-gray-700'}`}
                    >
                      <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: m.avatar_color }}>
                        {m.initials}
                      </div>
                      {m.full_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* View toggle */}
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            {([
              { mode: 'month' as ViewMode, icon: LayoutGrid, label: 'Mois' },
              { mode: 'week' as ViewMode, icon: CalendarDays, label: 'Semaine' },
              { mode: 'agenda' as ViewMode, icon: List, label: 'Agenda' },
            ]).map(({ mode, icon: Icon, label }) => (
              <button key={mode} onClick={() => setViewMode(mode)} title={label}
                className={`px-2.5 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors border-r border-gray-200 last:border-r-0 ${viewMode === mode ? 'bg-[#1A3A5C] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Sync button — only when Google is connected */}
          {calStatus?.connected && (
            <button onClick={handleSync} disabled={syncing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-emerald-200 text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50">
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Synchroniser</span>
            </button>
          )}

          {/* New event button */}
          <button onClick={() => setEventModal({ open: true })}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#1A3A5C] hover:bg-[#15304d] text-white rounded-lg transition-colors">
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Rendez-vous</span>
          </button>
        </div>

        {/* Sub-header: who we're viewing + Google status */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-50 bg-gray-50/60 flex-wrap gap-y-1">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {viewingMember ? (
              <>
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ backgroundColor: viewingMember.avatar_color }}>
                  {viewingMember.initials}
                </div>
                <span className="text-xs font-medium text-gray-700 truncate">
                  {viewingMemberId === memberId ? 'Mon agenda' : `Agenda de ${viewingMember.full_name}`}
                </span>
              </>
            ) : (
              <span className="text-xs text-gray-400">Aucun membre sélectionné</span>
            )}
          </div>

          {/* Google status indicator */}
          {!checkingStatus && viewingMemberId && (
            calStatus?.connected ? (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Google Calendar synchronisé
                {calStatus.last_synced_at && (
                  <span className="text-gray-400 font-normal">
                    · {format(parseISO(calStatus.last_synced_at), 'HH:mm')}
                  </span>
                )}
              </div>
            ) : (
              <button
                onClick={() => setSkipGoogleConnect(false)}
                className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-[#1A3A5C] transition-colors"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                Connecter Google Calendar
              </button>
            )
          )}

          {/* Sync message */}
          {syncMsg && (
            <span className={`text-[11px] font-medium ${syncMsg.ok ? 'text-emerald-600' : 'text-red-500'}`}>
              {syncMsg.text}
            </span>
          )}

          {/* Legend */}
          <div className="flex items-center gap-3 ml-auto">
            {[
              { color: '#EF4444', icon: Flag, label: 'Urgent' },
              { color: '#3B82F6', icon: Flag, label: 'Tâche' },
              { color: '#9CA3AF', icon: StickyNote, label: 'Mémo' },
              { color: '#1A3A5C', icon: CalendarIcon, label: 'RDV' },
            ].map(l => (
              <div key={l.label} className="hidden md:flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: l.color }} />
                <span className="text-[10px] text-gray-400">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main content */}
        {loadingData || checkingStatus ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
          </div>
        ) : showGoogleGate ? (
          <GoogleConnectBanner
            targetMemberId={viewingMemberId!}
            targetMemberName={viewingMember?.full_name ?? 'ce membre'}
            onConnected={() => { setSkipGoogleConnect(true); checkCalStatus(viewingMemberId); }}
          />
        ) : (
          <>
            {viewMode === 'month' && renderMonthView()}
            {viewMode === 'week' && renderWeekView()}
            {viewMode === 'agenda' && renderAgendaView()}
          </>
        )}
      </main>

      {/* Dropdown backdrop */}
      {memberDropdownOpen && (
        <div className="fixed inset-0 z-20" onClick={() => setMemberDropdownOpen(false)} />
      )}

      {/* Event modal */}
      <EventModal
        open={eventModal.open}
        onClose={() => setEventModal({ open: false })}
        onSave={handleSaveEvent}
        onDelete={eventModal.event ? handleDeleteEvent : undefined}
        initial={eventModal.event}
        defaultDate={eventModal.defaultDate}
        members={members}
        isSuperAdmin={isSuperAdmin}
        defaultMemberId={viewingMemberId}
      />

      {/* Detail popover */}
      {detailItem && (
        <ItemDetailPopover
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onEdit={detailItem.type === 'event' ? () => {
            setDetailItem(null);
            setEventModal({ open: true, event: detailItem.raw as CalEvent });
          } : undefined}
        />
      )}
    </AppLayout>
  );
}
