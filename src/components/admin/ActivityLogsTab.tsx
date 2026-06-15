import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { MemberAvatar } from '../common/MemberAvatar';
import { useAppData } from '../../hooks/useAppData';
import { LogIn, LogOut, FolderPlus, FolderPen, Trash2, MoveRight, SquareCheck as CheckSquare, SquarePen, UserRoundPlus, UserRoundPen, UserRoundX, RefreshCw, StickyNote, Filter, ChevronDown, X } from 'lucide-react';
import type { Member } from '../../types';

interface ActivityLog {
  id: string;
  actor_member_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  entity_label: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  actor?: Member;
}

const ACTION_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  'auth.login':         { label: 'Connexion',           icon: LogIn,          color: 'text-emerald-600 bg-emerald-50' },
  'auth.logout':        { label: 'Déconnexion',          icon: LogOut,         color: 'text-gray-500 bg-gray-100' },
  'project.created':    { label: 'Projet créé',          icon: FolderPlus,     color: 'text-blue-600 bg-blue-50' },
  'project.updated':    { label: 'Projet modifié',       icon: FolderPen,      color: 'text-amber-600 bg-amber-50' },
  'project.deleted':    { label: 'Projet supprimé',      icon: Trash2,         color: 'text-red-600 bg-red-50' },
  'project.moved':      { label: 'Projet déplacé',       icon: MoveRight,      color: 'text-sky-600 bg-sky-50' },
  'task.created':       { label: 'Tâche créée',          icon: CheckSquare,    color: 'text-blue-600 bg-blue-50' },
  'task.updated':       { label: 'Tâche modifiée',       icon: SquarePen,      color: 'text-amber-600 bg-amber-50' },
  'task.status_changed':{ label: 'Statut changé',        icon: SquarePen,      color: 'text-sky-600 bg-sky-50' },
  'task.assigned':      { label: 'Tâche assignée',       icon: UserRoundPen,   color: 'text-violet-600 bg-violet-50' },
  'task.deleted':       { label: 'Tâche supprimée',      icon: Trash2,         color: 'text-red-600 bg-red-50' },
  'task.moved':         { label: 'Tâche déplacée',       icon: MoveRight,      color: 'text-sky-600 bg-sky-50' },
  'member.created':     { label: 'Membre créé',          icon: UserRoundPlus,  color: 'text-emerald-600 bg-emerald-50' },
  'member.updated':     { label: 'Membre modifié',       icon: UserRoundPen,   color: 'text-amber-600 bg-amber-50' },
  'member.deleted':     { label: 'Membre supprimé',      icon: UserRoundX,     color: 'text-red-600 bg-red-50' },
  'memo.created':       { label: 'Mémo créé',            icon: StickyNote,     color: 'text-emerald-600 bg-emerald-50' },
  'memo.updated':       { label: 'Mémo modifié',         icon: StickyNote,     color: 'text-amber-600 bg-amber-50' },
  'memo.deleted':       { label: 'Mémo supprimé',        icon: StickyNote,     color: 'text-red-600 bg-red-50' },
};

const ENTITY_GROUPS = [
  { label: 'Toutes les actions', value: '' },
  { label: 'Connexions', value: 'auth' },
  { label: 'Projets', value: 'project' },
  { label: 'Tâches', value: 'task' },
  { label: 'Membres', value: 'member' },
  { label: 'Mémos', value: 'memo' },
];

function buildDetails(log: ActivityLog): string | null {
  const d = log.details;
  if (!d) return null;
  switch (log.action) {
    case 'project.created':
      return d.parent ? `Sous-projet de "${d.parent}"` : 'Projet racine';
    case 'project.moved':
      return `"${d.from_parent ?? 'racine'}" → "${d.to_parent ?? 'racine'}"`;
    case 'project.updated':
      if (d.changes && typeof d.changes === 'object') {
        const ch = d.changes as Record<string, unknown>;
        const parts: string[] = [];
        if (ch.name) parts.push(`Renommé "${ch.name}"`);
        if (ch.color) parts.push('Couleur modifiée');
        if (ch.default_recurrence) parts.push(`Récurrence → ${ch.default_recurrence}`);
        return parts.join(' · ') || null;
      }
      return null;
    case 'task.status_changed':
      return `${d.from} → ${d.to}${d.project ? ` · ${d.project}` : ''}`;
    case 'task.created':
      return [d.project, d.priority !== 'normal' ? `Priorité ${d.priority}` : null].filter(Boolean).join(' · ') || null;
    case 'task.deleted':
    case 'task.updated':
      return d.project ? String(d.project) : null;
    case 'member.created':
    case 'member.updated':
    case 'member.deleted':
      return null;
    case 'auth.login':
      return d.role ? `Rôle : ${d.role}` : null;
    default:
      return null;
  }
}

function formatRelative(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `il y a ${diffD}j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: diffD > 365 ? 'numeric' : undefined });
}

function formatFull(dateStr: string): string {
  return new Date(dateStr).toLocaleString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const PAGE_SIZE = 50;

export function ActivityLogsTab() {
  const { members } = useAppData();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterGroup, setFilterGroup] = useState('');
  const [filterMemberId, setFilterMemberId] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const membersMap = Object.fromEntries(members.map(m => [m.id, m]));

  const fetchLogs = useCallback(async (reset = false) => {
    const currentOffset = reset ? 0 : offset;
    if (reset) { setLoading(true); setOffset(0); }

    let query = supabase
      .from('activity_logs')
      .select('id,actor_member_id,action,entity_type,entity_id,entity_label,details,created_at')
      .order('created_at', { ascending: false })
      .range(currentOffset, currentOffset + PAGE_SIZE - 1);

    if (filterGroup) {
      query = query.like('action', `${filterGroup}.%`);
    }
    if (filterMemberId) {
      query = query.eq('actor_member_id', filterMemberId);
    }

    const { data } = await query;
    const enriched = (data ?? []).map(log => ({
      ...log,
      actor: log.actor_member_id ? membersMap[log.actor_member_id] : undefined,
    }));

    if (reset) {
      setLogs(enriched);
    } else {
      setLogs(prev => [...prev, ...enriched]);
    }
    setHasMore((data ?? []).length === PAGE_SIZE);
    setLoading(false);
    setRefreshing(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterGroup, filterMemberId, offset]);

  useEffect(() => {
    fetchLogs(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterGroup, filterMemberId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLogs(true);
  };

  const loadMore = () => {
    const newOffset = offset + PAGE_SIZE;
    setOffset(newOffset);
  };

  useEffect(() => {
    if (offset > 0) fetchLogs(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset]);

  const hasFilters = filterGroup || filterMemberId;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setShowFilters(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border rounded-lg transition-all ${
            hasFilters ? 'bg-[#1A3A5C] text-white border-[#1A3A5C]' : 'text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          Filtrer
          {hasFilters && (
            <span className="ml-0.5 text-xs bg-white/20 rounded-full px-1.5">
              {[filterGroup, filterMemberId].filter(Boolean).length}
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>

        {hasFilters && (
          <button
            onClick={() => { setFilterGroup(''); setFilterMemberId(''); }}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-3 h-3" />
            Effacer les filtres
          </button>
        )}

        <div className="flex-1" />

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-wrap gap-4">
          <div className="space-y-1.5 flex-1 min-w-[180px]">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Type d'action</label>
            <div className="flex flex-wrap gap-1.5">
              {ENTITY_GROUPS.map(g => (
                <button
                  key={g.value}
                  onClick={() => setFilterGroup(g.value)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                    filterGroup === g.value
                      ? 'bg-[#1A3A5C] text-white border-[#1A3A5C]'
                      : 'text-gray-600 border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 flex-1 min-w-[180px]">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Utilisateur</label>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setFilterMemberId('')}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                  !filterMemberId ? 'bg-[#1A3A5C] text-white border-[#1A3A5C]' : 'text-gray-600 border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                Tous
              </button>
              {members.map(m => (
                <button
                  key={m.id}
                  onClick={() => setFilterMemberId(m.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                    filterMemberId === m.id
                      ? 'bg-[#1A3A5C] text-white border-[#1A3A5C]'
                      : 'text-gray-600 border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: m.avatar_color }}
                  />
                  {m.full_name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Log list */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm">Chargement des journaux...</span>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Filter className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Aucune activité trouvée</p>
          {hasFilters && <p className="text-xs mt-1">Essayez de modifier les filtres</p>}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Journal d'activité
            </span>
            <span className="text-xs text-gray-400">{logs.length} entrée{logs.length > 1 ? 's' : ''}</span>
          </div>

          <div className="divide-y divide-gray-50">
            {logs.map(log => {
              const meta = ACTION_META[log.action] ?? { label: log.action, icon: SquarePen, color: 'text-gray-500 bg-gray-100' };
              const Icon = meta.icon;
              const detail = buildDetails(log);
              const actor = log.actor_member_id ? membersMap[log.actor_member_id] : null;

              return (
                <div key={log.id} className="px-4 py-3 flex items-start gap-3 hover:bg-gray-50/60 transition-colors">
                  {/* Action icon */}
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${meta.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-800">{meta.label}</span>
                      {log.entity_label && (
                        <span className="text-sm text-gray-600 truncate max-w-[200px]">
                          — <span className="font-medium text-gray-700">{log.entity_label}</span>
                        </span>
                      )}
                    </div>
                    {detail && (
                      <p className="text-xs text-gray-400 mt-0.5">{detail}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {actor ? (
                        <div className="flex items-center gap-1.5">
                          <MemberAvatar member={actor} size="sm" />
                          <span className="text-xs text-gray-400">{actor.full_name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300 italic">Système</span>
                      )}
                      <span className="text-gray-200">·</span>
                      <span className="text-xs text-gray-400" title={formatFull(log.created_at)}>
                        {formatRelative(log.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {hasMore && (
            <div className="px-4 py-3 border-t border-gray-100">
              <button
                onClick={loadMore}
                className="w-full text-sm text-[#1A3A5C] font-medium hover:bg-[#1A3A5C]/5 rounded-lg py-2 transition-colors"
              >
                Charger plus
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
