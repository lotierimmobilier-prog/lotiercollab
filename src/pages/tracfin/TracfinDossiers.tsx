import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Topbar } from '../../components/layout/Topbar';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { FolderCheck, Plus, Search, ChevronRight, X, Calendar, User, Tag } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import type { TracfinDossier, TracfinClient, DossierType, DossierStatus } from '../../types/tracfin';
import { DOSSIER_TYPE_LABELS, DOSSIER_STATUS_LABELS } from '../../types/tracfin';

const STATUS_COLORS: Record<DossierStatus, string> = {
  open: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  pending_review: 'bg-purple-100 text-purple-700',
  complete: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-gray-100 text-gray-500',
};

const defaultForm = {
  reference: '',
  dossier_type: 'sale' as DossierType,
  status: 'open' as DossierStatus,
  client_id: '',
  property_address: '',
  property_type: '',
  transaction_amount: '',
  notes: '',
  deadline: '',
};

export function TracfinDossiers() {
  const { session } = useAuth();
  const [dossiers, setDossiers] = useState<TracfinDossier[]>([]);
  const [clients, setClients] = useState<TracfinClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<TracfinDossier | null>(null);
  const [editing, setEditing] = useState<TracfinDossier | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: dos }, { data: cls }] = await Promise.all([
      supabase.from('tracfin_dossiers').select('*, client:tracfin_clients(*)').order('created_at', { ascending: false }),
      supabase.from('tracfin_clients').select('id,first_name,last_name,company_name,client_type').eq('status', 'active'),
    ]);
    setDossiers((dos ?? []) as unknown as TracfinDossier[]);
    setClients((cls ?? []) as unknown as TracfinClient[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = dossiers.filter(d => {
    if (filterStatus !== 'all' && d.status !== filterStatus) return false;
    if (search && !d.reference.toLowerCase().includes(search.toLowerCase()) &&
      !(d.property_address ?? '').toLowerCase().includes(search.toLowerCase())) return false;
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

  function openEdit(d: TracfinDossier) {
    setEditing(d);
    setForm({
      reference: d.reference,
      dossier_type: d.dossier_type,
      status: d.status,
      client_id: d.client_id ?? '',
      property_address: d.property_address ?? '',
      property_type: d.property_type ?? '',
      transaction_amount: d.transaction_amount != null ? String(d.transaction_amount) : '',
      notes: d.notes ?? '',
      deadline: d.deadline ?? '',
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.reference) return;
    setSaving(true);
    const payload = {
      ...form,
      client_id: form.client_id || null,
      transaction_amount: form.transaction_amount ? parseFloat(form.transaction_amount) : null,
      deadline: form.deadline || null,
      created_by: session?.user.id,
      updated_at: new Date().toISOString(),
    };
    if (editing) {
      await supabase.from('tracfin_dossiers').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('tracfin_dossiers').insert({ ...payload, created_at: new Date().toISOString() });
    }
    setModalOpen(false);
    setSaving(false);
    load();
  }

  async function changeStatus(id: string, status: DossierStatus) {
    await supabase.from('tracfin_dossiers').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
    load();
  }

  const f = (field: string, value: unknown) => setForm(p => ({ ...p, [field]: value }));

  const openCount = dossiers.filter(d => ['open', 'in_progress', 'pending_review'].includes(d.status)).length;

  return (
    <AppLayout>
      <Topbar title="Dossiers de conformité" />
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FolderCheck className="w-5 h-5 text-[#1A3A5C]" />
              Dossiers de conformité
            </h1>
            {openCount > 0 && (
              <p className="text-xs text-amber-600 font-medium mt-0.5">{openCount} dossier{openCount > 1 ? 's' : ''} en cours</p>
            )}
          </div>
          <Button onClick={openCreate} className="bg-[#1A3A5C] hover:bg-[#15304d] h-9 text-sm">
            <Plus className="w-4 h-4 mr-1.5" />Nouveau dossier
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un dossier…" className="pl-8 h-9 text-sm" />
          </div>
          <div className="flex gap-1 flex-wrap">
            {(['all', 'open', 'in_progress', 'pending_review', 'complete'] as const).map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`h-9 px-3 text-xs font-medium rounded-lg border transition-colors ${filterStatus === s ? 'bg-[#1A3A5C] text-white border-[#1A3A5C]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                {s === 'all' ? 'Tous' : DOSSIER_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className={`${selected ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-2`}>
            {loading ? (
              [...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <FolderCheck className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">Aucun dossier</p>
              </div>
            ) : filtered.map(d => (
              <div key={d.id}
                onClick={() => setSelected(s => s?.id === d.id ? null : d)}
                className={`bg-white rounded-xl border p-4 cursor-pointer flex items-start gap-3 transition-colors ${selected?.id === d.id ? 'border-[#1A3A5C]' : 'border-gray-100 hover:border-gray-200'}`}>
                <div className="w-9 h-9 rounded-xl bg-[#1A3A5C]/10 flex items-center justify-center flex-shrink-0">
                  <FolderCheck className="w-4 h-4 text-[#1A3A5C]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 text-sm">{d.reference}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[d.status]}`}>{DOSSIER_STATUS_LABELS[d.status]}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{DOSSIER_TYPE_LABELS[d.dossier_type]}</span>
                  </div>
                  {d.property_address && <p className="text-xs text-gray-500 mt-0.5 truncate">{d.property_address}</p>}
                  {getClientName(d.client) && <p className="text-xs text-[#1A3A5C] mt-0.5">Client : {getClientName(d.client)}</p>}
                  {d.transaction_amount && (
                    <p className="text-xs text-gray-600 font-medium mt-0.5">{d.transaction_amount.toLocaleString('fr-FR')} €</p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" />
              </div>
            ))}
          </div>

          {selected && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-sm">{selected.reference}</h3>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-gray-400" />
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[selected.status]}`}>{DOSSIER_STATUS_LABELS[selected.status]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FolderCheck className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-600">{DOSSIER_TYPE_LABELS[selected.dossier_type]}</span>
                </div>
                {getClientName(selected.client) && (
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-[#1A3A5C]">{getClientName(selected.client)}</span>
                  </div>
                )}
                {selected.deadline && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-600">Échéance : {new Date(selected.deadline).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
                {selected.property_address && (
                  <div className="pt-1">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Bien</p>
                    <p className="text-xs text-gray-700">{selected.property_address}</p>
                    {selected.property_type && <p className="text-xs text-gray-500">{selected.property_type}</p>}
                    {selected.transaction_amount && <p className="text-sm font-bold text-gray-900 mt-1">{selected.transaction_amount.toLocaleString('fr-FR')} €</p>}
                  </div>
                )}
                {selected.notes && (
                  <div className="pt-1">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Notes</p>
                    <p className="text-xs text-gray-600">{selected.notes}</p>
                  </div>
                )}
              </div>
              <div className="space-y-1 pt-1">
                {selected.status === 'open' && (
                  <button onClick={() => changeStatus(selected.id, 'in_progress')}
                    className="w-full text-xs py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium">
                    Passer en cours
                  </button>
                )}
                {selected.status === 'in_progress' && (
                  <button onClick={() => changeStatus(selected.id, 'pending_review')}
                    className="w-full text-xs py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors font-medium">
                    Soumettre à révision
                  </button>
                )}
                {selected.status === 'pending_review' && (
                  <button onClick={() => changeStatus(selected.id, 'complete')}
                    className="w-full text-xs py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors font-medium">
                    Marquer complet
                  </button>
                )}
                {selected.status === 'complete' && (
                  <button onClick={() => changeStatus(selected.id, 'archived')}
                    className="w-full text-xs py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                    Archiver
                  </button>
                )}
                <button onClick={() => { openEdit(selected); }}
                  className="w-full text-xs py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                  Modifier
                </button>
              </div>
            </div>
          )}
        </div>

        <Dialog open={modalOpen} onOpenChange={v => { if (!v) setModalOpen(false); }}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <FolderCheck className="w-4 h-4 text-[#1A3A5C]" />
                {editing ? 'Modifier le dossier' : 'Nouveau dossier'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Référence *</label>
                <Input value={form.reference} onChange={e => f('reference', e.target.value)} placeholder="EX-2025-001" className="h-9 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">Type</label>
                  <select value={form.dossier_type} onChange={e => f('dossier_type', e.target.value)} className="w-full h-9 text-sm border border-gray-200 rounded-lg px-3 outline-none">
                    {(Object.entries(DOSSIER_TYPE_LABELS) as [DossierType, string][]).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">Statut</label>
                  <select value={form.status} onChange={e => f('status', e.target.value)} className="w-full h-9 text-sm border border-gray-200 rounded-lg px-3 outline-none">
                    {(Object.entries(DOSSIER_STATUS_LABELS) as [DossierStatus, string][]).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
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
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Adresse du bien</label>
                <Input value={form.property_address} onChange={e => f('property_address', e.target.value)} placeholder="12 rue de la Paix, 75001 Paris" className="h-9 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">Type de bien</label>
                  <Input value={form.property_type} onChange={e => f('property_type', e.target.value)} placeholder="Appartement, villa…" className="h-9 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">Montant (€)</label>
                  <Input type="number" value={form.transaction_amount} onChange={e => f('transaction_amount', e.target.value)} placeholder="0" className="h-9 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Échéance</label>
                <Input type="date" value={form.deadline} onChange={e => f('deadline', e.target.value)} className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Notes</label>
                <textarea value={form.notes} onChange={e => f('notes', e.target.value)} rows={3}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none resize-none focus:ring-1 focus:ring-[#1A3A5C]" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1 h-9 text-sm">Annuler</Button>
                <Button onClick={handleSave} disabled={saving || !form.reference} className="flex-1 h-9 text-sm bg-[#1A3A5C] hover:bg-[#15304d]">
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
