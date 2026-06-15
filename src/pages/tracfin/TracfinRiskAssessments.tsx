import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Topbar } from '../../components/layout/Topbar';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { ChartBar as BarChart3, Plus, Search, CreditCard as Edit2, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import type { TracfinRiskAssessment, TracfinClient, RiskLevel } from '../../types/tracfin';
import { RISK_LABELS } from '../../types/tracfin';

const RISK_COLORS: Record<RiskLevel, string> = {
  low: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
  very_high: 'bg-red-900 text-white',
};

const FACTORS = [
  { key: 'score_income_coherence', label: 'Cohérence des revenus' },
  { key: 'score_funds_origin', label: 'Origine des fonds' },
  { key: 'score_third_parties', label: 'Présence de tiers' },
  { key: 'score_legal_structure', label: 'Structure juridique' },
  { key: 'score_geographic_risk', label: 'Risque géographique' },
  { key: 'score_payment_method', label: 'Mode de paiement' },
] as const;

type FactorKey = typeof FACTORS[number]['key'];

function computeRisk(scores: Record<FactorKey, number>): { total: number; level: RiskLevel } {
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const level: RiskLevel = total < 20 ? 'low' : total < 40 ? 'medium' : 'high';
  return { total, level };
}

const defaultScores: Record<FactorKey, number> = {
  score_income_coherence: 0,
  score_funds_origin: 0,
  score_third_parties: 0,
  score_legal_structure: 0,
  score_geographic_risk: 0,
  score_payment_method: 0,
};

export function TracfinRiskAssessments() {
  const { session } = useAuth();
  const [items, setItems] = useState<TracfinRiskAssessment[]>([]);
  const [clients, setClients] = useState<TracfinClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TracfinRiskAssessment | null>(null);
  const [entityType, setEntityType] = useState<'client' | 'transaction'>('client');
  const [entityId, setEntityId] = useState('');
  const [scores, setScores] = useState<Record<FactorKey, number>>(defaultScores);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: ras }, { data: cls }] = await Promise.all([
      supabase.from('tracfin_risk_assessments').select('*, client:tracfin_clients(*)').order('created_at', { ascending: false }),
      supabase.from('tracfin_clients').select('id,first_name,last_name,company_name,client_type').eq('status', 'active'),
    ]);
    setItems((ras ?? []) as unknown as TracfinRiskAssessment[]);
    setClients((cls ?? []) as unknown as TracfinClient[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(r => {
    if (filterLevel !== 'all' && r.risk_level !== filterLevel) return false;
    if (search) {
      const q = search.toLowerCase();
      const clientName = (r.client?.first_name ?? '') + ' ' + (r.client?.last_name ?? '') + (r.client?.company_name ?? '');
      if (!clientName.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  function openCreate() {
    setEditing(null);
    setEntityType('client');
    setEntityId('');
    setScores(defaultScores);
    setNotes('');
    setModalOpen(true);
  }

  function openEdit(r: TracfinRiskAssessment) {
    setEditing(r);
    setEntityType(r.entity_type);
    setEntityId(r.entity_id);
    setScores({
      score_income_coherence: r.score_income_coherence,
      score_funds_origin: r.score_funds_origin,
      score_third_parties: r.score_third_parties,
      score_legal_structure: r.score_legal_structure,
      score_geographic_risk: r.score_geographic_risk,
      score_payment_method: r.score_payment_method,
    });
    setNotes(r.notes ?? '');
    setModalOpen(true);
  }

  async function handleSave() {
    if (!entityId) return;
    setSaving(true);
    const { total, level } = computeRisk(scores);
    const payload = {
      entity_type: entityType,
      entity_id: entityId,
      ...scores,
      risk_level: level,
      notes,
      created_by: session?.user.id,
      updated_at: new Date().toISOString(),
    };
    if (editing) {
      await supabase.from('tracfin_risk_assessments').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('tracfin_risk_assessments').insert({ ...payload, created_at: new Date().toISOString() });
    }
    // Update client risk_level if entity is a client
    if (entityType === 'client') {
      await supabase.from('tracfin_clients').update({ risk_level: level, updated_at: new Date().toISOString() }).eq('id', entityId);
    }
    void total;
    setModalOpen(false);
    setSaving(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette évaluation ?')) return;
    await supabase.from('tracfin_risk_assessments').delete().eq('id', id);
    load();
  }

  const { total: previewTotal, level: previewLevel } = computeRisk(scores);

  function getClientName(c?: TracfinClient) {
    if (!c) return '—';
    return c.client_type === 'individual' ? `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() : c.company_name ?? '—';
  }

  return (
    <AppLayout>
      <Topbar title="Évaluations de risque" />
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#1A3A5C]" />
              Évaluations de risque
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Score sur 60 points — 6 facteurs de risque LCB-FT</p>
          </div>
          <Button onClick={openCreate} className="bg-[#1A3A5C] hover:bg-[#15304d] h-9 text-sm">
            <Plus className="w-4 h-4 mr-1.5" />Nouvelle évaluation
          </Button>
        </div>

        <div className="flex gap-2 mb-5">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…" className="pl-8 h-9 text-sm" />
          </div>
          <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} className="h-9 text-sm border border-gray-200 rounded-lg px-3 bg-white outline-none">
            <option value="all">Tous niveaux</option>
            {Object.entries(RISK_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <BarChart3 className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">Aucune évaluation</p>
            <Button variant="ghost" onClick={openCreate} className="mt-3 text-[#1A3A5C]">Créer la première évaluation</Button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Entité</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden sm:table-cell">Score</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Niveau</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden md:table-cell">Détail</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden lg:table-cell">Date</th>
                  <th className="w-20 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(r => {
                  const total = r.score_income_coherence + r.score_funds_origin + r.score_third_parties + r.score_legal_structure + r.score_geographic_risk + r.score_payment_method;
                  return (
                    <tr key={r.id} className="hover:bg-gray-50/60">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 text-sm">{getClientName(r.client)}</p>
                        <p className="text-xs text-gray-400 capitalize">{r.entity_type === 'client' ? 'Client' : 'Transaction'}</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-24">
                            <div className={`h-full rounded-full ${r.risk_level === 'low' ? 'bg-emerald-500' : r.risk_level === 'medium' ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${(total / 60) * 100}%` }} />
                          </div>
                          <span className="text-sm font-bold text-gray-900">{total}<span className="text-xs font-normal text-gray-400">/60</span></span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${RISK_COLORS[r.risk_level]}`}>{RISK_LABELS[r.risk_level]}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex gap-1 flex-wrap">
                          {FACTORS.map(f => r[f.key] > 5 && (
                            <span key={f.key} className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded">{f.key.replace('score_', '').replace(/_/g, ' ')}: {r[f.key]}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => openEdit(r)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(r.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
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
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="w-4 h-4 text-[#1A3A5C]" />
                {editing ? 'Modifier l\'évaluation' : 'Nouvelle évaluation de risque'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-5 pt-2">
              {/* Entity selector */}
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Client évalué *</label>
                <select value={entityId} onChange={e => setEntityId(e.target.value)} className="w-full h-9 text-sm border border-gray-200 rounded-lg px-3 outline-none">
                  <option value="">Sélectionner un client…</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.client_type === 'individual' ? `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() : c.company_name ?? ''}</option>)}
                </select>
              </div>

              {/* Score preview */}
              <div className={`flex items-center gap-3 p-3 rounded-xl border ${RISK_COLORS[previewLevel]} border-current`}>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Score total : {previewTotal}/60</p>
                  <p className="text-xs opacity-70">Niveau de risque : {RISK_LABELS[previewLevel]}</p>
                </div>
                <div className="w-12 h-12 rounded-full border-4 border-current flex items-center justify-center">
                  <span className="text-sm font-bold">{previewTotal}</span>
                </div>
              </div>

              {/* Factor sliders */}
              <div className="space-y-4">
                {FACTORS.map(factor => (
                  <div key={factor.key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-gray-700">{factor.label}</label>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${scores[factor.key] >= 7 ? 'bg-red-100 text-red-700' : scores[factor.key] >= 4 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {scores[factor.key]}/10
                      </span>
                    </div>
                    <input
                      type="range" min="0" max="10" step="1"
                      value={scores[factor.key]}
                      onChange={e => setScores(p => ({ ...p, [factor.key]: Number(e.target.value) }))}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: scores[factor.key] >= 7 ? '#ef4444' : scores[factor.key] >= 4 ? '#f59e0b' : '#10b981' }}
                    />
                    <div className="flex justify-between text-[10px] text-gray-300 mt-0.5">
                      <span>Faible</span><span>Élevé</span>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Notes d'analyse</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none resize-none focus:ring-1 focus:ring-[#1A3A5C]" />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1 h-9 text-sm">Annuler</Button>
                <Button onClick={handleSave} disabled={saving || !entityId} className="flex-1 h-9 text-sm bg-[#1A3A5C] hover:bg-[#15304d]">
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
