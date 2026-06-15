import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Topbar } from '../../components/layout/Topbar';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Signature as FileSignature, Plus, Search, Eye, Send, TriangleAlert as AlertTriangle, Lock, CircleCheck as CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import type { TracfinDeclaration, TracfinClient, DeclarationStatus } from '../../types/tracfin';
import { DECLARATION_STATUS_LABELS } from '../../types/tracfin';

const STATUS_COLORS: Record<DeclarationStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  submitted: 'bg-blue-100 text-blue-700',
  acknowledged: 'bg-emerald-100 text-emerald-700',
};

const INDICATORS = [
  { key: 'indicator_refused_documents', label: 'Refus de présenter les documents' },
  { key: 'indicator_large_cash', label: 'Règlement important en espèces' },
  { key: 'indicator_income_inconsistency', label: 'Incohérence avec les revenus déclarés' },
  { key: 'indicator_complex_structure', label: 'Structure juridique complexe injustifiée' },
  { key: 'indicator_unusual_urgency', label: 'Urgence inhabituelle' },
  { key: 'indicator_unknown_third_party', label: 'Tiers inconnu impliqué' },
  { key: 'indicator_foreign_account', label: 'Compte bancaire étranger utilisé' },
] as const;

const defaultForm = {
  client_id: '',
  operation_nature: '',
  operation_amount: '',
  operation_date: '',
  payment_method: '',
  funds_origin: '',
  suspicion_reason: '',
  suspicion_detected_at: '',
  observed_facts: '',
  inconsistencies: '',
  property_address: '',
  property_type: '',
  agency_name: '',
  agency_address: '',
  declarant_name: '',
  declarant_role: '',
  declarant_phone: '',
  declarant_email: '',
  indicator_refused_documents: false,
  indicator_large_cash: false,
  indicator_income_inconsistency: false,
  indicator_complex_structure: false,
  indicator_unusual_urgency: false,
  indicator_unknown_third_party: false,
  indicator_foreign_account: false,
  notes: '',
};

type FormState = typeof defaultForm;

export function TracfinDeclarations() {
  const { session } = useAuth();
  const [items, setItems] = useState<TracfinDeclaration[]>([]);
  const [clients, setClients] = useState<TracfinClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewing, setViewing] = useState<TracfinDeclaration | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: decls }, { data: cls }] = await Promise.all([
      supabase.from('tracfin_declarations').select('*, client:tracfin_clients(*)').order('created_at', { ascending: false }),
      supabase.from('tracfin_clients').select('id,first_name,last_name,company_name,client_type').eq('status', 'active'),
    ]);
    setItems((decls ?? []) as unknown as TracfinDeclaration[]);
    setClients((cls ?? []) as unknown as TracfinClient[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(d => {
    if (filterStatus !== 'all' && d.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!(d.suspicion_reason ?? '').toLowerCase().includes(q) &&
          !(d.client?.first_name ?? '').toLowerCase().includes(q) &&
          !(d.client?.last_name ?? '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  function openCreate() {
    setForm(defaultForm);
    setModalOpen(true);
  }

  async function handleSave(asDraft = true) {
    setSaving(true);
    const payload = {
      ...form,
      operation_amount: form.operation_amount ? parseFloat(form.operation_amount) : null,
      client_id: form.client_id || null,
      status: asDraft ? 'draft' : 'submitted',
      submitted_at: asDraft ? null : new Date().toISOString(),
      created_by: session?.user.id,
      updated_at: new Date().toISOString(),
    };
    await supabase.from('tracfin_declarations').insert({ ...payload, created_at: new Date().toISOString() });
    setModalOpen(false);
    setSaving(false);
    load();
  }

  async function changeStatus(id: string, status: DeclarationStatus) {
    await supabase.from('tracfin_declarations').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    load();
  }

  function getClientName(c?: TracfinClient) {
    if (!c) return '—';
    return c.client_type === 'individual' ? `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() : c.company_name ?? '—';
  }

  const f = (field: keyof FormState, value: unknown) => setForm(p => ({ ...p, [field]: value }));

  const indicatorCount = (d: TracfinDeclaration) => INDICATORS.filter(i => d[i.key]).length;

  return (
    <AppLayout>
      <Topbar title="Déclarations TRACFIN" />
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
        {/* Confidentiality banner */}
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
          <Lock className="w-4 h-4 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">STRICTEMENT CONFIDENTIEL</p>
            <p className="text-xs text-red-600">Ne jamais informer le client d'une déclaration de soupçon — obligation légale LCB-FT</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FileSignature className="w-5 h-5 text-[#1A3A5C]" />
              Déclarations de soupçon
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Déclarations transmises ou à transmettre à TRACFIN</p>
          </div>
          <Button onClick={openCreate} className="bg-red-600 hover:bg-red-700 h-9 text-sm">
            <Plus className="w-4 h-4 mr-1.5" />Nouvelle déclaration
          </Button>
        </div>

        <div className="flex gap-2 mb-5">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…" className="pl-8 h-9 text-sm" />
          </div>
          <div className="flex gap-1">
            {['all', 'draft', 'submitted', 'acknowledged'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`h-9 px-3 text-xs font-medium rounded-lg border transition-colors ${filterStatus === s ? 'bg-[#1A3A5C] text-white border-[#1A3A5C]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                {s === 'all' ? 'Toutes' : DECLARATION_STATUS_LABELS[s as DeclarationStatus]}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FileSignature className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">Aucune déclaration</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(d => (
              <div key={d.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                    <FileSignature className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[d.status]}`}>
                        {DECLARATION_STATUS_LABELS[d.status]}
                      </span>
                      {indicatorCount(d) > 0 && (
                        <span className="text-[11px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" />{indicatorCount(d)} indicateur{indicatorCount(d) > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-gray-900 text-sm">Client : {getClientName(d.client)}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{d.suspicion_reason}</p>
                    {d.operation_amount && (
                      <p className="text-xs text-gray-400 mt-0.5">Montant : {d.operation_amount.toLocaleString('fr-FR')} €</p>
                    )}
                    <p className="text-[11px] text-gray-400 mt-1">{new Date(d.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button onClick={() => setViewing(d)} className="text-[11px] px-2 py-1 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1">
                      <Eye className="w-3 h-3" />Voir
                    </button>
                    {d.status === 'draft' && (
                      <button onClick={() => changeStatus(d.id, 'submitted')}
                        className="text-[11px] px-2 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1">
                        <Send className="w-3 h-3" />Soumettre
                      </button>
                    )}
                    {d.status === 'submitted' && (
                      <button onClick={() => changeStatus(d.id, 'acknowledged')}
                        className="text-[11px] px-2 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />Accusé
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View Detail */}
        {viewing && (
          <div className="fixed inset-0 z-40 flex">
            <div className="flex-1 bg-black/40" onClick={() => setViewing(null)} />
            <div className="w-full max-w-lg bg-white h-full shadow-xl border-l border-gray-100 overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-red-500" />
                    Déclaration — CONFIDENTIEL
                  </h2>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[viewing.status]}`}>{DECLARATION_STATUS_LABELS[viewing.status]}</span>
                </div>
                <button onClick={() => setViewing(null)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400">✕</button>
              </div>
              <div className="p-5 space-y-5 text-sm">
                {[
                  { title: 'Client concerné', value: getClientName(viewing.client) },
                  { title: 'Nature de l\'opération', value: viewing.operation_nature },
                  { title: 'Montant', value: viewing.operation_amount ? `${viewing.operation_amount.toLocaleString('fr-FR')} €` : null },
                  { title: 'Motif du soupçon', value: viewing.suspicion_reason },
                  { title: 'Faits observés', value: viewing.observed_facts },
                  { title: 'Incohérences relevées', value: viewing.inconsistencies },
                  { title: 'Bien immobilier', value: viewing.property_address },
                  { title: 'Déclarant', value: viewing.declarant_name ? `${viewing.declarant_name} — ${viewing.declarant_role ?? ''}` : null },
                ].filter(i => i.value).map(item => (
                  <div key={item.title}>
                    <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-1">{item.title}</p>
                    <p className="text-sm text-gray-800">{item.value}</p>
                  </div>
                ))}
                {INDICATORS.some(i => viewing[i.key]) && (
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-2">Indicateurs de risque cochés</p>
                    <div className="space-y-1">
                      {INDICATORS.filter(i => viewing[i.key]).map(i => (
                        <div key={i.key} className="flex items-center gap-2 text-xs text-amber-700">
                          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                          {i.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Create Modal */}
        <Dialog open={modalOpen} onOpenChange={v => { if (!v) setModalOpen(false); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <FileSignature className="w-4 h-4 text-red-600" />
                Nouvelle déclaration de soupçon
              </DialogTitle>
            </DialogHeader>
            <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-xs text-red-700 flex items-start gap-2">
              <Lock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">CONFIDENTIEL — Ne jamais informer le client</p>
                <p className="text-red-600">La divulgation d'une déclaration de soupçon est punie par la loi.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Client concerné *</label>
                <select value={form.client_id} onChange={e => f('client_id', e.target.value)} className="w-full h-9 text-sm border border-gray-200 rounded-lg px-3 outline-none">
                  <option value="">Sélectionner un client…</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.client_type === 'individual' ? `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() : c.company_name ?? ''}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Nature de l'opération</label>
                <Input value={form.operation_nature} onChange={e => f('operation_nature', e.target.value)} placeholder="Vente, acquisition…" className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Montant (€)</label>
                <Input type="number" value={form.operation_amount} onChange={e => f('operation_amount', e.target.value)} className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Date de l'opération</label>
                <Input type="date" value={form.operation_date} onChange={e => f('operation_date', e.target.value)} className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Date de détection du soupçon</label>
                <Input type="date" value={form.suspicion_detected_at} onChange={e => f('suspicion_detected_at', e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Motif du soupçon * <span className="text-red-500">(obligatoire — détaillé)</span></label>
                <textarea value={form.suspicion_reason} onChange={e => f('suspicion_reason', e.target.value)} rows={3} placeholder="Décrire précisément les éléments qui fondent le soupçon…"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none resize-none focus:ring-1 focus:ring-red-400" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Faits observés</label>
                <textarea value={form.observed_facts} onChange={e => f('observed_facts', e.target.value)} rows={2}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none resize-none focus:ring-1 focus:ring-[#1A3A5C]" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 block mb-3">Indicateurs de risque</label>
                <div className="space-y-2">
                  {INDICATORS.map(ind => (
                    <label key={ind.key} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form[ind.key] as boolean} onChange={e => f(ind.key, e.target.checked)} className="w-4 h-4 rounded accent-amber-500" />
                      <span className="text-xs text-gray-700">{ind.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Adresse du bien</label>
                <Input value={form.property_address} onChange={e => f('property_address', e.target.value)} className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Déclarant — Nom</label>
                <Input value={form.declarant_name} onChange={e => f('declarant_name', e.target.value)} className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Déclarant — Fonction</label>
                <Input value={form.declarant_role} onChange={e => f('declarant_role', e.target.value)} className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Téléphone</label>
                <Input type="tel" value={form.declarant_phone} onChange={e => f('declarant_phone', e.target.value)} className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Email</label>
                <Input type="email" value={form.declarant_email} onChange={e => f('declarant_email', e.target.value)} className="h-9 text-sm" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1 h-9 text-sm">Annuler</Button>
              <Button onClick={() => handleSave(true)} disabled={saving || !form.suspicion_reason} variant="outline" className="flex-1 h-9 text-sm border-gray-300">
                {saving ? '…' : 'Sauvegarder brouillon'}
              </Button>
              <Button onClick={() => handleSave(false)} disabled={saving || !form.suspicion_reason || !form.client_id}
                className="flex-1 h-9 text-sm bg-red-600 hover:bg-red-700 text-white">
                {saving ? '…' : <><Send className="w-3.5 h-3.5 mr-1" />Soumettre</>}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </AppLayout>
  );
}
