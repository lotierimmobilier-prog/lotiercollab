import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Topbar } from '../../components/layout/Topbar';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { BellRing, Plus, Search, CircleCheck as CheckCircle2, TriangleAlert as AlertTriangle, Flame } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import type { TracfinAlert, TracfinClient, AlertSeverity, AlertStatus } from '../../types/tracfin';
import { ALERT_SEVERITY_LABELS, ALERT_STATUS_LABELS } from '../../types/tracfin';

const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
  critical: 'bg-red-900 text-white',
};

const STATUS_COLORS: Record<AlertStatus, string> = {
  open: 'bg-amber-100 text-amber-700',
  under_review: 'bg-blue-100 text-blue-700',
  closed: 'bg-emerald-100 text-emerald-700',
  reported: 'bg-[#1A3A5C] text-white',
};

const ALERT_TYPES = [
  'Activité suspecte',
  'Vigilance renforcée',
  'PPE détecté',
  'Incohérence de revenus',
  'Paiement inhabituel',
  'Structure complexe',
  'Urgence inhabituelle',
];

const defaultForm = {
  title: '',
  alert_type: 'Activité suspecte',
  severity: 'medium' as AlertSeverity,
  status: 'open' as AlertStatus,
  client_id: '',
  description: '',
  notes: '',
};

export function TracfinAlerts() {
  const { session } = useAuth();
  const [alerts, setAlerts] = useState<TracfinAlert[]>([]);
  const [clients, setClients] = useState<TracfinClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('open');
  const [filterSeverity] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TracfinAlert | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: als }, { data: cls }] = await Promise.all([
      supabase.from('tracfin_alerts').select('*, client:tracfin_clients(*)').order('created_at', { ascending: false }),
      supabase.from('tracfin_clients').select('id,first_name,last_name,company_name,client_type').eq('status', 'active'),
    ]);
    setAlerts((als ?? []) as unknown as TracfinAlert[]);
    setClients((cls ?? []) as unknown as TracfinClient[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = alerts.filter(a => {
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    if (filterSeverity !== 'all' && a.severity !== filterSeverity) return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function getClientName(c?: TracfinClient) {
    if (!c) return null;
    return c.client_type === 'individual' ? `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() : c.company_name ?? '';
  }

  function openCreate() {
    setEditing(null);
    setForm(defaultForm);
    setModalOpen(true);
  }

  function openEdit(a: TracfinAlert) {
    setEditing(a);
    setForm({
      title: a.title,
      alert_type: a.alert_type,
      severity: a.severity,
      status: a.status,
      client_id: a.client_id ?? '',
      description: a.description ?? '',
      notes: a.notes ?? '',
    });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    const payload = { ...form, client_id: form.client_id || null, created_by: session?.user.id, updated_at: new Date().toISOString() };
    if (editing) {
      await supabase.from('tracfin_alerts').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('tracfin_alerts').insert({ ...payload, created_at: new Date().toISOString() });
    }
    setModalOpen(false);
    setSaving(false);
    load();
  }

  async function changeStatus(id: string, status: AlertStatus) {
    await supabase.from('tracfin_alerts').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    load();
  }

  const f = (field: string, value: unknown) => setForm(p => ({ ...p, [field]: value }));

  const openCount = alerts.filter(a => ['open', 'under_review'].includes(a.status)).length;
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;

  return (
    <AppLayout>
      <Topbar title="Alertes TRACFIN" />
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <BellRing className="w-5 h-5 text-[#1A3A5C]" />
              Alertes de conformité
            </h1>
            <div className="flex items-center gap-3 mt-1">
              {openCount > 0 && <span className="text-xs text-amber-600 font-medium">{openCount} alerte{openCount > 1 ? 's' : ''} en attente</span>}
              {criticalCount > 0 && <span className="text-xs text-red-600 font-bold flex items-center gap-1"><Flame className="w-3 h-3" />{criticalCount} critique{criticalCount > 1 ? 's' : ''}</span>}
            </div>
          </div>
          <Button onClick={openCreate} className="bg-[#1A3A5C] hover:bg-[#15304d] h-9 text-sm">
            <Plus className="w-4 h-4 mr-1.5" />Nouvelle alerte
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une alerte…" className="pl-8 h-9 text-sm" />
          </div>
          <div className="flex gap-1">
            {['all', 'open', 'under_review', 'closed', 'reported'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`h-9 px-3 text-xs font-medium rounded-lg border transition-colors ${filterStatus === s ? 'bg-[#1A3A5C] text-white border-[#1A3A5C]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                {s === 'all' ? 'Toutes' : ALERT_STATUS_LABELS[s as AlertStatus]}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <BellRing className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">Aucune alerte</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(a => (
              <div key={a.id} className={`bg-white rounded-xl border p-4 flex items-start gap-4 ${a.severity === 'critical' ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${SEVERITY_COLORS[a.severity]}`}>
                  {a.severity === 'critical' ? <Flame className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 text-sm">{a.title}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${SEVERITY_COLORS[a.severity]}`}>{ALERT_SEVERITY_LABELS[a.severity]}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[a.status]}`}>{ALERT_STATUS_LABELS[a.status]}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{a.alert_type}</p>
                  {getClientName(a.client) && <p className="text-xs text-[#1A3A5C] mt-0.5">Client : {getClientName(a.client)}</p>}
                  {a.description && <p className="text-xs text-gray-600 mt-1">{a.description}</p>}
                  <p className="text-[11px] text-gray-400 mt-1">{new Date(a.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  {a.status === 'open' && (
                    <button onClick={() => changeStatus(a.id, 'under_review')}
                      className="text-[11px] px-2 py-1 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap">
                      En analyse
                    </button>
                  )}
                  {a.status === 'under_review' && (
                    <button onClick={() => changeStatus(a.id, 'closed')}
                      className="text-[11px] px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors whitespace-nowrap flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />Clôturer
                    </button>
                  )}
                  {['open', 'under_review'].includes(a.status) && (
                    <button onClick={() => changeStatus(a.id, 'reported')}
                      className="text-[11px] px-2 py-1 bg-[#1A3A5C] text-white rounded-lg hover:bg-[#15304d] transition-colors whitespace-nowrap">
                      Déclarée
                    </button>
                  )}
                  <button onClick={() => openEdit(a)}
                    className="text-[11px] px-2 py-1 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors">
                    Modifier
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={modalOpen} onOpenChange={v => { if (!v) setModalOpen(false); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <BellRing className="w-4 h-4 text-[#1A3A5C]" />
                {editing ? 'Modifier l\'alerte' : 'Nouvelle alerte'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Titre *</label>
                <Input value={form.title} onChange={e => f('title', e.target.value)} placeholder="Décrire l'alerte…" className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Type d'alerte</label>
                <select value={form.alert_type} onChange={e => f('alert_type', e.target.value)} className="w-full h-9 text-sm border border-gray-200 rounded-lg px-3 outline-none">
                  {ALERT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Sévérité</label>
                <div className="grid grid-cols-4 gap-1">
                  {(['low', 'medium', 'high', 'critical'] as AlertSeverity[]).map(s => (
                    <button key={s} onClick={() => f('severity', s)}
                      className={`py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${form.severity === s ? SEVERITY_COLORS[s] + ' border-current' : 'border-gray-200 text-gray-400 hover:bg-gray-50'}`}>
                      {ALERT_SEVERITY_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Client concerné</label>
                <select value={form.client_id} onChange={e => f('client_id', e.target.value)} className="w-full h-9 text-sm border border-gray-200 rounded-lg px-3 outline-none">
                  <option value="">Aucun</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.client_type === 'individual' ? `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() : c.company_name ?? ''}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => f('description', e.target.value)} rows={3}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none resize-none focus:ring-1 focus:ring-[#1A3A5C]" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1 h-9 text-sm">Annuler</Button>
                <Button onClick={handleSave} disabled={saving || !form.title} className="flex-1 h-9 text-sm bg-[#1A3A5C] hover:bg-[#15304d]">
                  {saving ? 'Enregistrement…' : editing ? 'Mettre à jour' : 'Créer'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </AppLayout>
  );
}
