import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Topbar } from '../../components/layout/Topbar';
import { supabase } from '../../lib/supabase';
import { Archive, Search, RotateCcw, User, Building2 } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import type { TracfinClient } from '../../types/tracfin';
import { RISK_LABELS } from '../../types/tracfin';

const RISK_COLORS = {
  low: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
  very_high: 'bg-red-900 text-white',
};

export function TracfinArchive() {
  const [clients, setClients] = useState<TracfinClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [restoring, setRestoring] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('tracfin_clients')
      .select('*')
      .eq('status', 'archived')
      .order('updated_at', { ascending: false });
    setClients(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = clients.filter(c => {
    if (!search) return true;
    const name = c.client_type === 'individual'
      ? `${c.first_name ?? ''} ${c.last_name ?? ''}`.toLowerCase()
      : (c.company_name ?? '').toLowerCase();
    return name.includes(search.toLowerCase()) || (c.email ?? '').toLowerCase().includes(search.toLowerCase());
  });

  async function restore(id: string) {
    setRestoring(id);
    await supabase.from('tracfin_clients').update({ status: 'active', updated_at: new Date().toISOString() }).eq('id', id);
    setRestoring(null);
    load();
  }

  return (
    <AppLayout>
      <Topbar title="Archives TRACFIN" />
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Archive className="w-5 h-5 text-[#1A3A5C]" />
              Archives clients
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">{clients.length} client{clients.length > 1 ? 's' : ''} archivé{clients.length > 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="relative mb-5 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher dans les archives…" className="pl-8 h-9 text-sm" />
        </div>

        {loading ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Archive className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">{search ? 'Aucun résultat' : 'Aucun client archivé'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(c => {
              const name = c.client_type === 'individual'
                ? `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim()
                : c.company_name ?? '';
              return (
                <div key={c.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 opacity-75 hover:opacity-100 transition-opacity">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    {c.client_type === 'individual'
                      ? <User className="w-4 h-4 text-gray-400" />
                      : <Building2 className="w-4 h-4 text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-700 text-sm">{name}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${RISK_COLORS[c.risk_level]}`}>
                        {RISK_LABELS[c.risk_level]}
                      </span>
                      {c.is_ppe && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">PPE</span>
                      )}
                    </div>
                    {c.email && <p className="text-xs text-gray-400 mt-0.5">{c.email}</p>}
                    {c.updated_at && (
                      <p className="text-[11px] text-gray-400 mt-0.5">Archivé le {new Date(c.updated_at).toLocaleDateString('fr-FR')}</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => restore(c.id)}
                    disabled={restoring === c.id}
                    className="h-8 text-xs flex-shrink-0 gap-1.5">
                    <RotateCcw className="w-3 h-3" />
                    {restoring === c.id ? 'Restauration…' : 'Restaurer'}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </AppLayout>
  );
}
