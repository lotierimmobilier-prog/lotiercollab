import { useState, useEffect } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Topbar } from '../../components/layout/Topbar';
import { supabase } from '../../lib/supabase';
import { Scale, Users as Users2, ArrowLeftRight, ChartBar as BarChart3, BellRing, Signature as FileSignature, FolderCheck, TrendingUp, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle2, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Stats {
  clients: number;
  transactions: number;
  openAlerts: number;
  criticalAlerts: number;
  declarations: number;
  pendingDeclarations: number;
  dossiers: number;
  completeDossiers: number;
  highRisk: number;
  ppeClients: number;
}

export function TracfinDashboard() {
  const [stats, setStats] = useState<Stats>({
    clients: 0, transactions: 0, openAlerts: 0, criticalAlerts: 0,
    declarations: 0, pendingDeclarations: 0, dossiers: 0,
    completeDossiers: 0, highRisk: 0, ppeClients: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [
        { count: clients },
        { count: transactions },
        { count: openAlerts },
        { count: criticalAlerts },
        { count: declarations },
        { count: pendingDeclarations },
        { count: dossiers },
        { count: completeDossiers },
        { count: highRisk },
        { count: ppeClients },
      ] = await Promise.all([
        supabase.from('tracfin_clients').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('tracfin_transactions').select('*', { count: 'exact', head: true }),
        supabase.from('tracfin_alerts').select('*', { count: 'exact', head: true }).in('status', ['open', 'under_review']),
        supabase.from('tracfin_alerts').select('*', { count: 'exact', head: true }).eq('severity', 'critical'),
        supabase.from('tracfin_declarations').select('*', { count: 'exact', head: true }),
        supabase.from('tracfin_declarations').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
        supabase.from('tracfin_dossiers').select('*', { count: 'exact', head: true }),
        supabase.from('tracfin_dossiers').select('*', { count: 'exact', head: true }).eq('status', 'complete'),
        supabase.from('tracfin_clients').select('*', { count: 'exact', head: true }).eq('risk_level', 'high').eq('status', 'active'),
        supabase.from('tracfin_clients').select('*', { count: 'exact', head: true }).eq('is_ppe', true).eq('status', 'active'),
      ]);
      setStats({
        clients: clients ?? 0,
        transactions: transactions ?? 0,
        openAlerts: openAlerts ?? 0,
        criticalAlerts: criticalAlerts ?? 0,
        declarations: declarations ?? 0,
        pendingDeclarations: pendingDeclarations ?? 0,
        dossiers: dossiers ?? 0,
        completeDossiers: completeDossiers ?? 0,
        highRisk: highRisk ?? 0,
        ppeClients: ppeClients ?? 0,
      });
      setLoading(false);
    }
    load();
  }, []);

  const cards = [
    {
      label: 'Clients KYC actifs',
      value: stats.clients,
      sub: `${stats.highRisk} risque élevé · ${stats.ppeClients} PPE`,
      icon: Users2,
      href: '/tracfin/clients',
      color: 'bg-blue-50 border-blue-100',
      iconColor: 'text-blue-600',
      alert: stats.highRisk > 0,
    },
    {
      label: 'Transactions',
      value: stats.transactions,
      sub: 'Toutes typologies',
      icon: ArrowLeftRight,
      href: '/tracfin/transactions',
      color: 'bg-gray-50 border-gray-100',
      iconColor: 'text-gray-600',
      alert: false,
    },
    {
      label: 'Alertes ouvertes',
      value: stats.openAlerts,
      sub: `${stats.criticalAlerts} critique${stats.criticalAlerts > 1 ? 's' : ''}`,
      icon: BellRing,
      href: '/tracfin/alertes',
      color: stats.openAlerts > 0 ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100',
      iconColor: stats.openAlerts > 0 ? 'text-amber-600' : 'text-gray-600',
      alert: stats.criticalAlerts > 0,
    },
    {
      label: 'Déclarations TRACFIN',
      value: stats.declarations,
      sub: `${stats.pendingDeclarations} brouillon${stats.pendingDeclarations > 1 ? 's' : ''}`,
      icon: FileSignature,
      href: '/tracfin/declarations',
      color: stats.pendingDeclarations > 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100',
      iconColor: stats.pendingDeclarations > 0 ? 'text-red-600' : 'text-gray-600',
      alert: stats.pendingDeclarations > 0,
    },
    {
      label: 'Dossiers conformité',
      value: stats.dossiers,
      sub: `${stats.completeDossiers} complet${stats.completeDossiers > 1 ? 's' : ''}`,
      icon: FolderCheck,
      href: '/tracfin/dossiers',
      color: 'bg-emerald-50 border-emerald-100',
      iconColor: 'text-emerald-600',
      alert: false,
    },
  ];

  const quickActions = [
    { label: 'Nouveau client KYC', href: '/tracfin/clients', icon: Users2, color: 'bg-[#1A3A5C] text-white hover:bg-[#15304d]' },
    { label: 'Nouvelle déclaration', href: '/tracfin/declarations', icon: FileSignature, color: 'bg-red-600 text-white hover:bg-red-700' },
    { label: 'Nouvelle transaction', href: '/tracfin/transactions', icon: ArrowLeftRight, color: 'border border-gray-200 text-gray-700 hover:bg-gray-50' },
    { label: 'Évaluation de risque', href: '/tracfin/risques', icon: BarChart3, color: 'border border-gray-200 text-gray-700 hover:bg-gray-50' },
  ];

  return (
    <AppLayout>
      <Topbar title="LOTIER TracFin" />
      <main className="flex-1 p-4 sm:p-6 space-y-6 overflow-y-auto">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Scale className="w-5 h-5 text-[#1A3A5C]" />
              <h1 className="text-lg font-bold text-gray-900">Tableau de bord LCB-FT</h1>
            </div>
            <p className="text-sm text-gray-500">Gestion de la conformité anti-blanchiment et financement du terrorisme</p>
          </div>
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-xs font-medium text-amber-700">Obligations LCB-FT actives</span>
          </div>
        </div>

        {/* Stats cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {cards.map(card => (
              <Link
                key={card.href}
                to={card.href}
                className={`relative border rounded-xl p-4 hover:shadow-md transition-shadow ${card.color}`}
              >
                {card.alert && (
                  <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${card.color} border`}>
                  <card.icon className={`w-4 h-4 ${card.iconColor}`} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs font-medium text-gray-700 mt-0.5">{card.label}</p>
                <p className="text-[11px] text-gray-400 mt-1">{card.sub}</p>
              </Link>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick actions */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#1A3A5C]" />
              Actions rapides
            </h2>
            <div className="space-y-2">
              {quickActions.map(action => (
                <Link
                  key={action.href}
                  to={action.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${action.color}`}
                >
                  <action.icon className="w-4 h-4 flex-shrink-0" />
                  {action.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Compliance status */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              État de conformité
            </h2>
            <div className="space-y-3">
              {[
                { label: 'Clients avec KYC complet', done: stats.clients > 0, value: `${stats.clients} client${stats.clients > 1 ? 's' : ''}` },
                { label: 'Dossiers complets', done: stats.completeDossiers === stats.dossiers && stats.dossiers > 0, value: `${stats.completeDossiers}/${stats.dossiers}` },
                { label: 'Alertes traitées', done: stats.openAlerts === 0, value: stats.openAlerts === 0 ? 'Aucune en attente' : `${stats.openAlerts} en attente` },
                { label: 'Déclarations à finaliser', done: stats.pendingDeclarations === 0, value: stats.pendingDeclarations === 0 ? 'À jour' : `${stats.pendingDeclarations} brouillon${stats.pendingDeclarations > 1 ? 's' : ''}` },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                    {item.done
                      ? <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                      : <Clock className="w-2.5 h-2.5 text-amber-600" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700">{item.label}</p>
                  </div>
                  <span className={`text-[11px] font-medium ${item.done ? 'text-emerald-600' : 'text-amber-600'}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Regulatory info */}
          <div className="bg-[#1A3A5C] rounded-xl p-5 text-white">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Scale className="w-4 h-4" />
              Obligations réglementaires
            </h2>
            <div className="space-y-3 text-xs">
              {[
                { title: 'Identification client', desc: 'Vérifier l\'identité avant toute transaction' },
                { title: 'Vigilance renforcée', desc: 'PPE, pays à risque, opérations complexes' },
                { title: 'Conservation 5 ans', desc: 'Pièces d\'identité et documents de diligence' },
                { title: 'Déclaration de soupçon', desc: 'Transmission à TRACFIN sans délai' },
              ].map(item => (
                <div key={item.title} className="flex gap-2">
                  <div className="w-1 rounded-full bg-white/30 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-white">{item.title}</p>
                    <p className="text-white/60">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              to="/tracfin/guide"
              className="mt-4 flex items-center gap-2 text-xs text-white/80 hover:text-white transition-colors"
            >
              Guide complet LCB-FT →
            </Link>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
