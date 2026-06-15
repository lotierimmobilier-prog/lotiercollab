import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Topbar } from '../../components/layout/Topbar';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useAppData } from '../../hooks/useAppData';
import { Users as Users2, Plus, Search, X, Shield, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle2, Clock, User, Building2, CreditCard as Edit2, Archive, RotateCcw, UserCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import type { TracfinClient, RiskLevel, ClientRole } from '../../types/tracfin';
import { ROLE_LABELS, RISK_LABELS } from '../../types/tracfin';
import type { Member } from '../../types';

const RISK_COLORS: Record<RiskLevel, string> = {
  low: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
  very_high: 'bg-red-900 text-white',
};

function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${RISK_COLORS[level]}`}>
      {(level === 'high' || level === 'very_high') && <AlertTriangle className="w-2.5 h-2.5" />}
      {RISK_LABELS[level]}
    </span>
  );
}

const defaultForm = {
  client_type: 'individual' as import('../../types/tracfin').ClientType,
  role: 'acquereur' as ClientRole,
  civility: 'M.',
  first_name: '',
  last_name: '',
  company_name: '',
  siret: '',
  legal_form: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  postal_code: '',
  nationality: 'Française',
  profession: '',
  income_range: '',
  is_ppe: false,
  ppe_details: '',
  risk_level: 'low' as RiskLevel,
  notes: '',
  agent_id: '' as string,
};

type FormState = typeof defaultForm;

export function TracfinClients() {
  const { session, isSuperAdmin, memberId } = useAuth();
  const { members } = useAppData();
  const [clients, setClients] = useState<TracfinClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterAgent, setFilterAgent] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TracfinClient | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [detailClient, setDetailClient] = useState<TracfinClient | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('tracfin_clients')
      .select('*')
      .order('created_at', { ascending: false });
    setClients(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = clients.filter(c => {
    if (showArchived ? c.status !== 'archived' : c.status !== 'active') return false;
    if (filterRisk !== 'all' && c.risk_level !== filterRisk) return false;
    if (filterRole !== 'all' && c.role !== filterRole) return false;
    if (filterAgent !== 'all' && c.agent_id !== filterAgent) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = c.client_type === 'individual'
        ? `${c.first_name ?? ''} ${c.last_name ?? ''}`.toLowerCase()
        : (c.company_name ?? '').toLowerCase();
      if (!name.includes(q) && !(c.email ?? '').toLowerCase().includes(q) && !(c.city ?? '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  function openCreate() {
    setEditing(null);
    setForm({ ...defaultForm, agent_id: !isSuperAdmin && memberId ? memberId : '' });
    setModalOpen(true);
  }

  function openEdit(c: TracfinClient) {
    setEditing(c);
    setForm({
      client_type: c.client_type,
      role: c.role,
      civility: c.civility ?? 'M.',
      first_name: c.first_name ?? '',
      last_name: c.last_name ?? '',
      company_name: c.company_name ?? '',
      siret: c.siret ?? '',
      legal_form: c.legal_form ?? '',
      email: c.email ?? '',
      phone: c.phone ?? '',
      address: c.address ?? '',
      city: c.city ?? '',
      postal_code: c.postal_code ?? '',
      nationality: c.nationality ?? 'Française',
      profession: c.profession ?? '',
      income_range: c.income_range ?? '',
      is_ppe: c.is_ppe,
      ppe_details: c.ppe_details ?? '',
      risk_level: c.risk_level,
      notes: (c.notes ?? '').startsWith('_export_ref:') ? '' : (c.notes ?? ''),
      agent_id: c.agent_id ?? '',
    });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      ...form,
      agent_id: form.agent_id || null,
      created_by: session?.user.id,
      updated_at: new Date().toISOString(),
    };
    if (editing) {
      await supabase.from('tracfin_clients').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('tracfin_clients').insert({ ...payload, created_at: new Date().toISOString() });
    }
    setModalOpen(false);
    setSaving(false);
    load();
  }

  async function handleArchive(c: TracfinClient) {
    if (!confirm(`Archiver "${getDisplayName(c)}" ?`)) return;
    await supabase.from('tracfin_clients').update({ status: 'archived', updated_at: new Date().toISOString() }).eq('id', c.id);
    load();
  }

  async function handleRestore(c: TracfinClient) {
    await supabase.from('tracfin_clients').update({ status: 'active', updated_at: new Date().toISOString() }).eq('id', c.id);
    load();
  }

  function getDisplayName(c: TracfinClient) {
    return c.client_type === 'individual'
      ? `${c.civility ?? ''} ${c.first_name ?? ''} ${c.last_name ?? ''}`.trim()
      : c.company_name ?? 'Société sans nom';
  }

  const f = (field: keyof FormState, value: unknown) => setForm(p => ({ ...p, [field]: value }));

  function getAgent(c: TracfinClient): Member | undefined {
    return c.agent_id ? members.find(m => m.id === c.agent_id) : undefined;
  }

  return (
    <AppLayout>
      <Topbar title="Clients KYC" />
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Users2 className="w-5 h-5 text-[#1A3A5C]" />
              Clients KYC
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Gestion des dossiers de connaissance client</p>
          </div>
          <Button onClick={openCreate} className="bg-[#1A3A5C] hover:bg-[#15304d] h-9 text-sm">
            <Plus className="w-4 h-4 mr-1.5" />
            Nouveau client
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-5">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un client…"
              className="pl-8 h-9 text-sm"
            />
          </div>
          <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)}
            className="h-9 text-sm border border-gray-200 rounded-lg px-3 bg-white outline-none">
            <option value="all">Tous les risques</option>
            <option value="low">Faible</option>
            <option value="medium">Moyen</option>
            <option value="high">Élevé</option>
          </select>
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
            className="h-9 text-sm border border-gray-200 rounded-lg px-3 bg-white outline-none">
            <option value="all">Tous les rôles</option>
            {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          {isSuperAdmin && (
          <select value={filterAgent} onChange={e => setFilterAgent(e.target.value)}
            className="h-9 text-sm border border-gray-200 rounded-lg px-3 bg-white outline-none">
            <option value="all">Tous les agents</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
          </select>
          )}
          <button
            onClick={() => setShowArchived(v => !v)}
            className={`h-9 px-3 text-sm rounded-lg border transition-colors ${showArchived ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
          >
            <Archive className="w-3.5 h-3.5 inline mr-1.5" />
            Archivés
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Users2 className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">{showArchived ? 'Aucun client archivé' : 'Aucun client trouvé'}</p>
            {!showArchived && <Button variant="ghost" onClick={openCreate} className="mt-3 text-[#1A3A5C]">Créer le premier client</Button>}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Client</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden sm:table-cell">Rôle</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden md:table-cell">Contact</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden md:table-cell">Agent</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Risque</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden lg:table-cell">KYC</th>
                  <th className="w-24 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50/60 transition-colors cursor-pointer" onClick={() => setDetailClient(c)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${c.risk_level === 'high' ? 'bg-red-50' : 'bg-[#1A3A5C]/10'}`}>
                          {c.client_type === 'individual'
                            ? <User className={`w-4 h-4 ${c.risk_level === 'high' ? 'text-red-500' : 'text-[#1A3A5C]'}`} />
                            : <Building2 className={`w-4 h-4 ${c.risk_level === 'high' ? 'text-red-500' : 'text-[#1A3A5C]'}`} />
                          }
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{getDisplayName(c)}</p>
                          <p className="text-xs text-gray-400">{c.client_type === 'individual' ? 'Personne physique' : 'Personne morale'}</p>
                        </div>
                        {c.is_ppe && (
                          <span className="ml-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700">
                            <Shield className="w-2.5 h-2.5" />PPE
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">{ROLE_LABELS[c.role]}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-xs text-gray-600">{c.email ?? '—'}</p>
                      <p className="text-xs text-gray-400">{c.city ?? ''}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell" onClick={e => e.stopPropagation()}>
                      {(() => {
                        const agent = getAgent(c);
                        return (
                          <div className="relative group/agent">
                            {agent ? (
                              <div className="flex items-center gap-1.5">
                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0" style={{ backgroundColor: agent.avatar_color }}>
                                  {agent.initials}
                                </div>
                                <span className="text-xs text-gray-700 truncate max-w-[90px] font-medium">{agent.full_name}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-300 italic">Non assigné</span>
                            )}
                            <select
                              value={c.agent_id ?? ''}
                              onChange={async e => {
                                const val = e.target.value || null;
                                await supabase.from('tracfin_clients').update({ agent_id: val, updated_at: new Date().toISOString() }).eq('id', c.id);
                                load();
                              }}
                              className="absolute inset-0 w-full opacity-0 cursor-pointer"
                              title="Assigner un agent"
                            >
                              <option value="">Non assigné</option>
                              {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                            </select>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3"><RiskBadge level={c.risk_level} /></td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {c.kyc_completed
                        ? <span className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" />Complet</span>
                        : <span className="flex items-center gap-1 text-xs text-amber-600"><Clock className="w-3.5 h-3.5" />En cours</span>
                      }
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {showArchived
                          ? <button onClick={() => handleRestore(c)} className="p-1.5 hover:bg-emerald-50 rounded-lg text-gray-400 hover:text-emerald-600 transition-colors"><RotateCcw className="w-3.5 h-3.5" /></button>
                          : <button onClick={() => handleArchive(c)} className="p-1.5 hover:bg-amber-50 rounded-lg text-gray-400 hover:text-amber-600 transition-colors"><Archive className="w-3.5 h-3.5" /></button>
                        }
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Client detail panel */}
        {detailClient && (
          <div className="fixed inset-0 z-40 flex">
            <div className="flex-1" onClick={() => setDetailClient(null)} />
            <div className="w-full max-w-md bg-white h-full shadow-xl border-l border-gray-100 overflow-y-auto flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900 text-sm">{getDisplayName(detailClient)}</h2>
                <button onClick={() => setDetailClient(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-400" /></button>
              </div>
              <div className="p-5 space-y-4 text-sm">
                <div className="flex gap-2 flex-wrap">
                  <RiskBadge level={detailClient.risk_level} />
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{ROLE_LABELS[detailClient.role]}</span>
                  {detailClient.is_ppe && <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1"><Shield className="w-3 h-3" />PPE</span>}
                  {detailClient.kyc_completed && <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />KYC complet</span>}
                </div>
                {(() => {
                  const agent = getAgent(detailClient);
                  return agent ? (
                    <div className="flex items-center gap-2 p-3 bg-[#1A3A5C]/5 rounded-lg">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ backgroundColor: agent.avatar_color }}>
                        {agent.initials}
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Agent responsable</p>
                        <p className="text-sm font-medium text-gray-800">{agent.full_name}</p>
                      </div>
                    </div>
                  ) : null;
                })()}
                {[
                  { label: 'Email', value: detailClient.email },
                  { label: 'Téléphone', value: detailClient.phone },
                  { label: 'Adresse', value: [detailClient.address, detailClient.postal_code, detailClient.city].filter(Boolean).join(', ') },
                  { label: 'Nationalité', value: detailClient.nationality },
                  { label: 'Profession', value: detailClient.profession },
                  { label: 'Revenus', value: detailClient.income_range },
                  { label: 'Notes', value: (detailClient.notes ?? '').startsWith('_export_ref:') ? null : detailClient.notes },
                ].filter(i => i.value).map(item => (
                  <div key={item.label}>
                    <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">{item.label}</p>
                    <p className="text-sm text-gray-700">{item.value}</p>
                  </div>
                ))}
                {detailClient.is_ppe && detailClient.ppe_details && (
                  <div className="bg-orange-50 border border-orange-100 rounded-lg p-3">
                    <p className="text-xs font-semibold text-orange-700 mb-1">Détails PPE</p>
                    <p className="text-xs text-orange-600">{detailClient.ppe_details}</p>
                  </div>
                )}
              </div>
              <div className="mt-auto px-5 pb-5 flex gap-2">
                <Button onClick={() => { setDetailClient(null); openEdit(detailClient); }} variant="outline" className="flex-1 h-9 text-sm">
                  <Edit2 className="w-3.5 h-3.5 mr-1.5" />Modifier
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Create/Edit Modal */}
        <Dialog open={modalOpen} onOpenChange={v => { if (!v) setModalOpen(false); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Users2 className="w-4 h-4 text-[#1A3A5C]" />
                {editing ? 'Modifier le client' : 'Nouveau client KYC'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 pt-2">
              {/* Type */}
              <div className="col-span-2 grid grid-cols-2 gap-2">
                {(['individual', 'legal_entity'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => f('client_type', t)}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-colors ${form.client_type === t ? 'bg-[#1A3A5C] text-white border-[#1A3A5C]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    {t === 'individual' ? <User className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                    {t === 'individual' ? 'Personne physique' : 'Personne morale'}
                  </button>
                ))}
              </div>

              {/* Role */}
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Rôle dans la transaction *</label>
                <div className="flex gap-2 flex-wrap">
                  {(Object.entries(ROLE_LABELS) as [ClientRole, string][]).map(([k, v]) => (
                    <button key={k} onClick={() => f('role', k)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${form.role === k ? 'bg-[#1A3A5C] text-white border-[#1A3A5C]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {form.client_type === 'individual' ? (
                <>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1.5">Civilité</label>
                    <select value={form.civility} onChange={e => f('civility', e.target.value)}
                      className="w-full h-9 text-sm border border-gray-200 rounded-lg px-3 outline-none">
                      <option>M.</option><option>Mme</option><option>Autre</option>
                    </select>
                  </div>
                  <div />
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1.5">Prénom *</label>
                    <Input value={form.first_name} onChange={e => f('first_name', e.target.value)} className="h-9 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1.5">Nom *</label>
                    <Input value={form.last_name} onChange={e => f('last_name', e.target.value)} className="h-9 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1.5">Nationalité</label>
                    <Input value={form.nationality} onChange={e => f('nationality', e.target.value)} className="h-9 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1.5">Profession</label>
                    <Input value={form.profession} onChange={e => f('profession', e.target.value)} className="h-9 text-sm" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-gray-600 block mb-1.5">Tranche de revenus</label>
                    <select value={form.income_range} onChange={e => f('income_range', e.target.value)}
                      className="w-full h-9 text-sm border border-gray-200 rounded-lg px-3 outline-none">
                      <option value="">Non renseigné</option>
                      <option>Moins de 20 000 €/an</option>
                      <option>20 000 – 50 000 €/an</option>
                      <option>50 000 – 100 000 €/an</option>
                      <option>Plus de 100 000 €/an</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-gray-600 block mb-1.5">Raison sociale *</label>
                    <Input value={form.company_name} onChange={e => f('company_name', e.target.value)} className="h-9 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1.5">SIRET</label>
                    <Input value={form.siret} onChange={e => f('siret', e.target.value)} className="h-9 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1.5">Forme juridique</label>
                    <Input value={form.legal_form} onChange={e => f('legal_form', e.target.value)} placeholder="SCI, SAS, SARL…" className="h-9 text-sm" />
                  </div>
                </>
              )}

              {/* Contact */}
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Email</label>
                <Input type="email" value={form.email} onChange={e => f('email', e.target.value)} className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Téléphone</label>
                <Input type="tel" value={form.phone} onChange={e => f('phone', e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Adresse</label>
                <Input value={form.address} onChange={e => f('address', e.target.value)} className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Ville</label>
                <Input value={form.city} onChange={e => f('city', e.target.value)} className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Code postal</label>
                <Input value={form.postal_code} onChange={e => f('postal_code', e.target.value)} className="h-9 text-sm" />
              </div>

              {/* Risk */}
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Niveau de risque</label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as RiskLevel[]).map(r => (
                    <button key={r} onClick={() => f('risk_level', r)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors ${form.risk_level === r ? RISK_COLORS[r] + ' border-current' : 'border-gray-200 text-gray-400 hover:bg-gray-50'}`}>
                      {RISK_LABELS[r]}
                    </button>
                  ))}
                </div>
              </div>

              {/* PPE */}
              <div className="col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_ppe} onChange={e => f('is_ppe', e.target.checked)} className="w-4 h-4 rounded accent-[#1A3A5C]" />
                  <span className="text-sm font-medium text-gray-700">Personne Politiquement Exposée (PPE)</span>
                </label>
                {form.is_ppe && (
                  <Input
                    value={form.ppe_details}
                    onChange={e => f('ppe_details', e.target.value)}
                    placeholder="Préciser la fonction ou le lien PPE…"
                    className="mt-2 h-9 text-sm"
                  />
                )}
              </div>

              {/* Agent — only visible to super admins */}
              {isSuperAdmin && (
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 block mb-1.5 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[#1A3A5C]" />
                  Agent responsable du dossier
                </label>
                <select value={form.agent_id} onChange={e => f('agent_id', e.target.value)}
                  className="w-full h-9 text-sm border border-gray-200 rounded-lg px-3 outline-none focus:ring-1 focus:ring-[#1A3A5C] bg-white">
                  <option value="">Non assigné</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.full_name}</option>
                  ))}
                </select>
              </div>
              )}

              {/* Notes */}
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Notes internes</label>
                <textarea
                  value={form.notes}
                  onChange={e => f('notes', e.target.value)}
                  rows={2}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none resize-none focus:ring-1 focus:ring-[#1A3A5C]"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1 h-9 text-sm">Annuler</Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1 h-9 text-sm bg-[#1A3A5C] hover:bg-[#15304d]">
                {saving ? 'Enregistrement…' : editing ? 'Mettre à jour' : 'Créer le client'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </AppLayout>
  );
}