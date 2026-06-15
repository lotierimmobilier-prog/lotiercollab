import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Topbar } from '../../components/layout/Topbar';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import {
  ArrowLeftRight, Plus, Search, CreditCard as Edit2, Trash2,
  TriangleAlert as AlertTriangle, Euro, Users, X,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import type {
  TracfinTransaction, TracfinClient, TracfinTransactionParty,
  TransactionType, TransactionStatus, PartyRole,
} from '../../types/tracfin';
import {
  TRANSACTION_TYPE_LABELS, TRANSACTION_STATUS_LABELS, PARTY_ROLE_LABELS,
} from '../../types/tracfin';

const STATUS_COLORS: Record<TransactionStatus, string> = {
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

const PARTY_ROLE_COLORS: Record<PartyRole, string> = {
  vendeur: 'bg-orange-100 text-orange-700',
  acquereur: 'bg-sky-100 text-sky-700',
  bailleur: 'bg-violet-100 text-violet-700',
  locataire: 'bg-teal-100 text-teal-700',
  caution: 'bg-gray-100 text-gray-600',
};

interface PartyEntry {
  client_id: string;
  party_role: PartyRole;
}

const defaultForm = {
  transaction_type: 'sale' as TransactionType,
  status: 'in_progress' as TransactionStatus,
  agent_id: '',
  property_address: '',
  property_type: '',
  amount: '',
  payment_method: '',
  funds_origin: '',
  third_party_involved: false,
  third_party_details: '',
  unusual_urgency: false,
  notes: '',
};

export function TracfinTransactions() {
  const { session, isSuperAdmin, memberId } = useAuth();
  const [items, setItems] = useState<TracfinTransaction[]>([]);
  const [clients, setClients] = useState<TracfinClient[]>([]);
  const [agentMembers, setAgentMembers] = useState<{ id: string; full_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TracfinTransaction | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [parties, setParties] = useState<PartyEntry[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: txs }, { data: cls }, { data: mbs }] = await Promise.all([
      supabase
        .from('tracfin_transactions')
        .select(`
          *,
          agent:members!tracfin_transactions_agent_id_fkey(id, full_name),
          parties:tracfin_transaction_parties(
            id, transaction_id, client_id, party_role, created_at,
            client:tracfin_clients(id, client_type, first_name, last_name, company_name)
          )
        `)
        .order('created_at', { ascending: false }),
      supabase
        .from('tracfin_clients')
        .select('id,first_name,last_name,company_name,client_type')
        .eq('status', 'active'),
      supabase
        .from('members')
        .select('id, full_name')
        .order('full_name'),
    ]);
    setItems((txs ?? []) as unknown as TracfinTransaction[]);
    setClients((cls ?? []) as unknown as TracfinClient[]);
    setAgentMembers((mbs ?? []) as { id: string; full_name: string }[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterType !== 'all' && t.transaction_type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      const addressMatch = (t.property_address ?? '').toLowerCase().includes(q);
      const partyMatch = (t.parties ?? []).some(p => {
        const c = p.client;
        if (!c) return false;
        const name = c.client_type === 'individual'
          ? `${c.first_name ?? ''} ${c.last_name ?? ''}`.toLowerCase()
          : (c.company_name ?? '').toLowerCase();
        return name.includes(q);
      });
      const agentMatch = (t.agent?.full_name ?? '').toLowerCase().includes(q);
      if (!addressMatch && !partyMatch && !agentMatch) return false;
    }
    return true;
  });

  function getClientName(c?: Pick<TracfinClient, 'client_type' | 'first_name' | 'last_name' | 'company_name'> | null) {
    if (!c) return '—';
    return c.client_type === 'individual'
      ? `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || '—'
      : c.company_name ?? '—';
  }

  function getPartiesByRole(tx: TracfinTransaction, role: PartyRole): TracfinTransactionParty[] {
    return (tx.parties ?? []).filter(p => p.party_role === role);
  }

  function openCreate() {
    setEditing(null);
    setForm({ ...defaultForm, agent_id: isSuperAdmin ? '' : (memberId ?? '') });
    setParties([]);
    setModalOpen(true);
  }

  function openEdit(t: TracfinTransaction) {
    setEditing(t);
    setForm({
      transaction_type: t.transaction_type,
      status: t.status,
      agent_id: t.agent_id ?? '',
      property_address: t.property_address ?? '',
      property_type: t.property_type ?? '',
      amount: t.amount ? String(t.amount) : '',
      payment_method: t.payment_method ?? '',
      funds_origin: t.funds_origin ?? '',
      third_party_involved: t.third_party_involved,
      third_party_details: t.third_party_details ?? '',
      unusual_urgency: t.unusual_urgency,
      notes: t.notes ?? '',
    });
    setParties((t.parties ?? []).map(p => ({ client_id: p.client_id, party_role: p.party_role })));
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      ...form,
      amount: form.amount ? parseFloat(form.amount) : null,
      agent_id: form.agent_id || (isSuperAdmin ? null : memberId),
      client_id: parties[0]?.client_id ?? null,
      created_by: session?.user.id,
      updated_at: new Date().toISOString(),
    };

    let txId: string;
    if (editing) {
      await supabase.from('tracfin_transactions').update(payload).eq('id', editing.id);
      txId = editing.id;
      await supabase.from('tracfin_transaction_parties').delete().eq('transaction_id', txId);
    } else {
      const { data } = await supabase
        .from('tracfin_transactions')
        .insert({ ...payload, created_at: new Date().toISOString() })
        .select('id')
        .single();
      txId = data!.id;
    }

    if (parties.length > 0) {
      await supabase.from('tracfin_transaction_parties').insert(
        parties.map(p => ({ transaction_id: txId, client_id: p.client_id, party_role: p.party_role }))
      );
    }

    setModalOpen(false);
    setSaving(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette transaction ?')) return;
    await supabase.from('tracfin_transaction_parties').delete().eq('transaction_id', id);
    await supabase.from('tracfin_transactions').delete().eq('id', id);
    load();
  }

  function addParty() {
    setParties(p => [...p, { client_id: '', party_role: 'vendeur' }]);
  }

  function updateParty(idx: number, field: keyof PartyEntry, value: string) {
    setParties(p => p.map((e, i) => i === idx ? { ...e, [field]: value } : e));
  }

  function removeParty(idx: number) {
    setParties(p => p.filter((_, i) => i !== idx));
  }

  const f = (field: string, value: unknown) => setForm(p => ({ ...p, [field]: value }));

  return (
    <AppLayout>
      <Topbar title="Transactions" />
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-[#1A3A5C]" />
              Transactions immobilières
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Suivi des opérations soumises à vigilance LCB-FT</p>
          </div>
          <Button onClick={openCreate} className="bg-[#1A3A5C] hover:bg-[#15304d] h-9 text-sm">
            <Plus className="w-4 h-4 mr-1.5" />Nouvelle transaction
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher adresse, client, agent…" className="pl-8 h-9 text-sm" />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="h-9 text-sm border border-gray-200 rounded-lg px-3 bg-white outline-none">
            <option value="all">Tous types</option>
            {Object.entries(TRANSACTION_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-9 text-sm border border-gray-200 rounded-lg px-3 bg-white outline-none">
            <option value="all">Tous statuts</option>
            {Object.entries(TRANSACTION_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <ArrowLeftRight className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">Aucune transaction</p>
            <Button variant="ghost" onClick={openCreate} className="mt-3 text-[#1A3A5C]">Créer la première transaction</Button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Type</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden md:table-cell">Bien</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Parties</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden lg:table-cell">Agent</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Montant</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Statut</th>
                  <th className="w-20 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(t => {
                  const vendeurs = getPartiesByRole(t, 'vendeur');
                  const acquereurs = getPartiesByRole(t, 'acquereur');
                  const others = (t.parties ?? []).filter(p => p.party_role !== 'vendeur' && p.party_role !== 'acquereur');
                  return (
                    <tr key={t.id} className="hover:bg-gray-50/60">
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">
                          {TRANSACTION_TYPE_LABELS[t.transaction_type]}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-sm text-gray-700 truncate max-w-40">{t.property_address ?? '—'}</p>
                        <p className="text-xs text-gray-400">{t.property_type ?? ''}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          {vendeurs.map(p => (
                            <div key={p.id} className="flex items-center gap-1">
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${PARTY_ROLE_COLORS.vendeur}`}>V</span>
                              <span className="text-xs text-gray-700 truncate max-w-32">{getClientName(p.client)}</span>
                            </div>
                          ))}
                          {acquereurs.map(p => (
                            <div key={p.id} className="flex items-center gap-1">
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${PARTY_ROLE_COLORS.acquereur}`}>A</span>
                              <span className="text-xs text-gray-700 truncate max-w-32">{getClientName(p.client)}</span>
                            </div>
                          ))}
                          {others.map(p => (
                            <div key={p.id} className="flex items-center gap-1">
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${PARTY_ROLE_COLORS[p.party_role]}`}>
                                {PARTY_ROLE_LABELS[p.party_role][0]}
                              </span>
                              <span className="text-xs text-gray-700 truncate max-w-32">{getClientName(p.client)}</span>
                            </div>
                          ))}
                          {(t.parties ?? []).length === 0 && (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-600">
                        {t.agent?.full_name ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        {t.amount ? (
                          <span className="flex items-center gap-0.5 text-sm font-semibold text-gray-900">
                            <Euro className="w-3.5 h-3.5 text-gray-400" />
                            {t.amount.toLocaleString('fr-FR')}
                          </span>
                        ) : <span className="text-gray-400 text-sm">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[t.status]}`}>
                            {TRANSACTION_STATUS_LABELS[t.status]}
                          </span>
                          <div className="flex gap-1">
                            {t.unusual_urgency && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded flex items-center gap-0.5"><AlertTriangle className="w-2.5 h-2.5" /> Urgence</span>}
                            {t.third_party_involved && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Tiers</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => openEdit(t)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(t.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Dialog open={modalOpen} onOpenChange={v => { if (!v) setModalOpen(false); }}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <ArrowLeftRight className="w-4 h-4 text-[#1A3A5C]" />
                {editing ? 'Modifier la transaction' : 'Nouvelle transaction'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 pt-2">
              {isSuperAdmin && (
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">Agent en charge</label>
                  <select
                    value={form.agent_id}
                    onChange={e => f('agent_id', e.target.value)}
                    className="w-full h-9 text-sm border border-gray-200 rounded-lg px-3 outline-none"
                  >
                    <option value="">Non assigné</option>
                    {agentMembers.map(m => (
                      <option key={m.id} value={m.id}>{m.full_name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Type de transaction *</label>                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(TRANSACTION_TYPE_LABELS) as [TransactionType, string][]).map(([k, v]) => (
                    <button key={k} onClick={() => f('transaction_type', k)}
                      className={`py-2 rounded-lg text-xs font-medium border transition-colors ${form.transaction_type === k ? 'bg-[#1A3A5C] text-white border-[#1A3A5C]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Parties de la transaction
                  </label>
                  <button onClick={addParty} className="text-xs text-[#1A3A5C] hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Ajouter
                  </button>
                </div>
                <div className="space-y-2">
                  {parties.length === 0 && (
                    <p className="text-xs text-gray-400 py-2 text-center border border-dashed border-gray-200 rounded-lg">
                      Aucune partie — cliquer sur Ajouter
                    </p>
                  )}
                  {parties.map((p, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <select
                        value={p.party_role}
                        onChange={e => updateParty(idx, 'party_role', e.target.value)}
                        className="h-9 text-xs border border-gray-200 rounded-lg px-2 outline-none w-32 shrink-0"
                      >
                        {(Object.entries(PARTY_ROLE_LABELS) as [PartyRole, string][]).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                      <select
                        value={p.client_id}
                        onChange={e => updateParty(idx, 'client_id', e.target.value)}
                        className="flex-1 h-9 text-xs border border-gray-200 rounded-lg px-2 outline-none"
                      >
                        <option value="">Sélectionner un client</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.client_type === 'individual' ? `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() : c.company_name ?? ''}
                          </option>
                        ))}
                      </select>
                      <button onClick={() => removeParty(idx)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-300 hover:text-red-400 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Adresse du bien</label>
                <Input value={form.property_address} onChange={e => f('property_address', e.target.value)} className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Type de bien</label>
                <select value={form.property_type} onChange={e => f('property_type', e.target.value)}
                  className="w-full h-9 text-sm border border-gray-200 rounded-lg px-3 outline-none">
                  <option value="">Non précisé</option>
                  <option>Appartement</option><option>Maison</option><option>Local commercial</option>
                  <option>Terrain</option><option>Bureau</option><option>Entrepôt</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Montant (€)</label>
                <Input type="number" value={form.amount} onChange={e => f('amount', e.target.value)} placeholder="0" className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Mode de paiement</label>
                <select value={form.payment_method} onChange={e => f('payment_method', e.target.value)}
                  className="w-full h-9 text-sm border border-gray-200 rounded-lg px-3 outline-none">
                  <option value="">Non précisé</option>
                  <option>Virement bancaire</option><option>Chèque</option><option>Espèces</option>
                  <option>Prêt bancaire</option><option>Mixte</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Origine des fonds</label>
                <Input value={form.funds_origin} onChange={e => f('funds_origin', e.target.value)} placeholder="Vente immobilière, épargne…" className="h-9 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Statut</label>
                <div className="flex gap-2">
                  {(Object.entries(TRANSACTION_STATUS_LABELS) as [TransactionStatus, string][]).map(([k, v]) => (
                    <button key={k} onClick={() => f('status', k)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${form.status === k ? 'bg-[#1A3A5C] text-white border-[#1A3A5C]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div className="col-span-2 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.third_party_involved} onChange={e => f('third_party_involved', e.target.checked)} className="w-4 h-4 rounded accent-[#1A3A5C]" />
                  <span className="text-sm text-gray-700">Présence d'un tiers dans l'opération</span>
                </label>
                {form.third_party_involved && (
                  <Input value={form.third_party_details} onChange={e => f('third_party_details', e.target.value)} placeholder="Préciser le rôle du tiers…" className="h-9 text-sm" />
                )}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.unusual_urgency} onChange={e => f('unusual_urgency', e.target.checked)} className="w-4 h-4 rounded accent-amber-500" />
                  <span className="text-sm text-amber-700 font-medium">Urgence inhabituelle détectée</span>
                </label>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Notes</label>
                <textarea value={form.notes} onChange={e => f('notes', e.target.value)} rows={2}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none resize-none focus:ring-1 focus:ring-[#1A3A5C]" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1 h-9 text-sm">Annuler</Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1 h-9 text-sm bg-[#1A3A5C] hover:bg-[#15304d]">
                {saving ? 'Enregistrement…' : editing ? 'Mettre à jour' : 'Créer'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </AppLayout>
  );
}
