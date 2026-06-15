import { useState, useEffect, useCallback } from 'react';
import { Archive, Search, RotateCcw, FolderOpen } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Topbar } from '../../components/layout/Topbar';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useAppData } from '../../hooks/useAppData';
import type { PropertyFile, PropertyType } from '../../types/mydoc';
import { PROPERTY_TYPE_LABELS, PROPERTY_TYPE_COLORS } from '../../types/mydoc';
import { Input } from '../../components/ui/input';

export function MyDocArchive() {
  const { isSuperAdmin, memberId } = useAuth();
  const { members } = useAppData();
  const [files, setFiles] = useState<PropertyFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  const load = useCallback(async () => {
    let q = supabase.from('property_files').select('*').eq('status', 'ARCHIVED').order('updated_at', { ascending: false });
    if (!isSuperAdmin && memberId) q = q.eq('agent_id', memberId);
    const { data } = await q;
    setFiles(data ?? []);
    setLoading(false);
  }, [isSuperAdmin, memberId]);

  useEffect(() => { load(); }, [load]);

  const handleRestore = async (id: string) => {
    await supabase.from('property_files').update({ status: 'OPEN', updated_at: new Date().toISOString() }).eq('id', id);
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const filtered = files.filter(f => {
    const q = search.toLowerCase();
    const match = !q || f.reference.toLowerCase().includes(q) || f.owner_name.toLowerCase().includes(q) || f.city.toLowerCase().includes(q) || f.address.toLowerCase().includes(q);
    return match && (filterType === 'all' || f.type === filterType);
  });

  const agentName = (id: string | null) => {
    if (!id) return '—';
    const m = members.find(m => m.id === id);
    return m ? m.full_name : '—';
  };

  return (
    <AppLayout>
      <Topbar title="Archives — Mes Dossiers" />

      <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Archive className="w-5 h-5 text-[#1A3A5C]" />
              Dossiers archivés
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Dossiers clôturés ou archivés</p>
          </div>

          <div className="flex flex-wrap gap-2 mb-5">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input className="pl-9 h-9 text-sm" placeholder="Référence, propriétaire, ville..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="h-9 px-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#1A3A5C]"
            >
              <option value="all">Tous les types</option>
              {(['VENTE', 'LOCATION', 'GESTION', 'DIVERS'] as PropertyType[]).map(t => (
                <option key={t} value={t}>{PROPERTY_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Archive className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">Aucun dossier archivé</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(f => (
                <div key={f.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <FolderOpen className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-900 truncate">{f.reference}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PROPERTY_TYPE_COLORS[f.type]}`}>{PROPERTY_TYPE_LABELS[f.type]}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{f.address}, {f.city} — {f.owner_name}</p>
                    {isSuperAdmin && <p className="text-xs text-gray-400 mt-0.5">Agent : {agentName(f.agent_id)}</p>}
                  </div>
                  <button
                    onClick={() => handleRestore(f.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1A3A5C] border border-[#1A3A5C]/20 hover:bg-[#1A3A5C]/5 rounded-lg transition-colors flex-shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Restaurer
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </AppLayout>
  );
}
