import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, TrendingUp, Chrome as Home, Building2, Wrench, FolderPlus, FileText, SquareCheck as CheckSquare, Archive } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Topbar } from '../../components/layout/Topbar';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface Stats {
  total: number;
  open: number;
  complete: number;
  archived: number;
  vente: number;
  location: number;
  gestion: number;
  divers: number;
  documents: number;
}

export function MyDocDashboard() {
  const navigate = useNavigate();
  const { isSuperAdmin, memberId } = useAuth();
  const [stats, setStats] = useState<Stats>({ total: 0, open: 0, complete: 0, archived: 0, vente: 0, location: 0, gestion: 0, divers: 0, documents: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    let q = supabase.from('property_files').select('*', { count: 'exact', head: false });
    if (!isSuperAdmin && memberId) q = q.eq('agent_id', memberId);
    const { data: files } = await q;
    const { count: documents } = await supabase.from('property_file_documents').select('*', { count: 'exact', head: true });

    const f = files ?? [];
    setStats({
      total: f.length,
      open: f.filter(x => x.status === 'OPEN').length,
      complete: f.filter(x => x.status === 'COMPLETE').length,
      archived: f.filter(x => x.status === 'ARCHIVED').length,
      vente: f.filter(x => x.type === 'VENTE').length,
      location: f.filter(x => x.type === 'LOCATION').length,
      gestion: f.filter(x => x.type === 'GESTION').length,
      divers: f.filter(x => x.type === 'DIVERS').length,
      documents: documents ?? 0,
    });
    setLoading(false);
  }, [isSuperAdmin, memberId]);

  useEffect(() => { load(); }, [load]);

  const cards = [
    { label: 'Dossiers actifs', value: stats.open, icon: FolderOpen, color: 'text-blue-600', bg: 'bg-blue-50', onClick: () => navigate('/mydoc/dossiers') },
    { label: 'Dossiers complets', value: stats.complete, icon: CheckSquare, color: 'text-emerald-600', bg: 'bg-emerald-50', onClick: () => navigate('/mydoc/dossiers') },
    { label: 'Archives', value: stats.archived, icon: Archive, color: 'text-gray-500', bg: 'bg-gray-100', onClick: () => navigate('/mydoc/archive') },
    { label: 'Documents déposés', value: stats.documents, icon: FileText, color: 'text-[#1A3A5C]', bg: 'bg-[#1A3A5C]/10', onClick: () => navigate('/mydoc/dossiers') },
  ];

  const typeCards = [
    { label: 'Vente', value: stats.vente, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Location', value: stats.location, icon: Home, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Gestion', value: stats.gestion, icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Divers', value: stats.divers, icon: Building2, color: 'text-gray-500', bg: 'bg-gray-100' },
  ];

  return (
    <AppLayout>
      <Topbar
        title="Mes Dossiers"
        actions={
          <button
            onClick={() => navigate('/mydoc/dossiers')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A3A5C] hover:bg-[#142d47] text-white text-sm font-medium rounded-lg transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
            Nouveau dossier
          </button>
        }
      />

      <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-1">
              <FolderOpen className="w-5 h-5 text-[#1A3A5C]" />
              Tableau de bord
            </h1>
            <p className="text-sm text-gray-500">Vue d'ensemble de vos dossiers immobiliers</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map(c => (
                  <button
                    key={c.label}
                    onClick={c.onClick}
                    className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all text-left group"
                  >
                    <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center mb-3`}>
                      <c.icon className={`w-4 h-4 ${c.color}`} />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{c.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
                  </button>
                ))}
              </div>

              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Par type de dossier</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {typeCards.map(c => (
                    <div key={c.label} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                      <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center mb-3`}>
                        <c.icon className={`w-4 h-4 ${c.color}`} />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{c.value}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#1A3A5C]/5 border border-[#1A3A5C]/10 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-[#1A3A5C] mb-3 flex items-center gap-2">
                  <FolderOpen className="w-4 h-4" />
                  Accès rapide
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Dossiers actifs', to: '/mydoc/dossiers', icon: FolderOpen },
                    { label: 'Archives', to: '/mydoc/archive', icon: Archive },
                    { label: 'Checklist documents', to: '/mydoc/checklist', icon: CheckSquare },
                  ].map(({ label, to, icon: Icon }) => (
                    <button
                      key={to}
                      onClick={() => navigate(to)}
                      className="flex items-center gap-2 px-3 py-2.5 bg-white hover:bg-[#1A3A5C] hover:text-white text-[#1A3A5C] rounded-lg text-sm font-medium transition-colors border border-[#1A3A5C]/10"
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </AppLayout>
  );
}
