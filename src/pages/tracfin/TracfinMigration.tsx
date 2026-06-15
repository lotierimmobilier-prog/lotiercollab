import { useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Topbar } from '../../components/layout/Topbar';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Database, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle2, ChevronRight, Loader as Loader2, RefreshCw, Users, ArrowLeftRight, BellRing, Signature as FileSignature, ChartBar as BarChart3, FolderCheck, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

interface MigrationStat {
  table: string;
  label: string;
  count: number | null;
  migrated: number;
  errors: number;
  status: 'idle' | 'loading' | 'running' | 'done' | 'error';
}

const TABLES: { key: string; label: string; icon: React.ElementType }[] = [
  { key: 'clients', label: 'Clients KYC', icon: Users },
  { key: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { key: 'alerts', label: 'Alertes', icon: BellRing },
  { key: 'risk_assessments', label: 'Évaluations risque', icon: BarChart3 },
  { key: 'declarations', label: 'Déclarations de soupçon', icon: FileSignature },
  { key: 'dossiers', label: 'Dossiers', icon: FolderCheck },
];

function mapClient(r: Record<string, unknown>, userId: string) {
  return {
    created_by: userId,
    client_type: r.client_type ?? 'individual',
    civility: r.civility ?? null,
    first_name: r.first_name ?? null,
    last_name: r.last_name ?? null,
    birth_date: r.birth_date ?? null,
    birth_place: r.birth_place ?? null,
    nationality: r.nationality ?? null,
    company_name: r.company_name ?? null,
    siret: r.siret ?? null,
    legal_form: r.legal_form ?? null,
    email: r.email ?? null,
    phone: r.phone ?? null,
    address: r.address ?? null,
    city: r.city ?? null,
    postal_code: r.postal_code ?? null,
    country: r.country ?? 'France',
    profession: r.profession ?? null,
    income_source: r.income_source ?? null,
    is_ppe: r.is_pep ?? r.is_ppe ?? false,
    ppe_details: r.pep_details ?? r.ppe_details ?? null,
    risk_level: r.risk_level ?? 'low',
    doubt_level: r.doubt_level ?? 'none',
    role: r.role ?? 'acquereur',
    status: r.status === 'archived' ? 'archived' : 'active',
    is_draft: false,
    kyc_completed: r.kyc_completed ?? false,
    notes: r.notes ?? null,
    created_at: r.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function mapTransaction(r: Record<string, unknown>, userId: string) {
  return {
    created_by: userId,
    transaction_type: r.transaction_type ?? 'sale',
    status: r.status ?? 'in_progress',
    property_address: r.property_address
      ? `${r.property_address}${r.property_city ? ', ' + r.property_city : ''}${r.property_postal_code ? ' ' + r.property_postal_code : ''}`
      : null,
    property_type: r.property_type ?? null,
    amount: r.transaction_amount ?? r.amount ?? null,
    currency: 'EUR',
    payment_method: r.payment_method ?? null,
    funds_origin: r.payment_origin ?? r.funds_origin ?? null,
    third_party_involved: r.has_third_party ?? r.third_party_involved ?? false,
    third_party_details: r.third_party_details ?? null,
    unusual_urgency: r.unusual_urgency ?? false,
    notes: r.notes ?? null,
    created_at: r.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function mapAlert(r: Record<string, unknown>, userId: string) {
  return {
    created_by: userId,
    title: r.title ?? r.description ?? 'Alerte importée',
    alert_type: r.alert_type ?? 'Activité suspecte',
    severity: r.severity ?? 'medium',
    status: r.status ?? 'open',
    description: r.description ?? null,
    notes: r.internal_decision ?? r.notes ?? null,
    created_at: r.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function mapRiskAssessment(r: Record<string, unknown>, userId: string) {
  return {
    created_by: userId,
    entity_type: r.assessment_type ?? r.entity_type ?? 'client',
    entity_id: r.client_id ?? r.entity_id ?? '00000000-0000-0000-0000-000000000000',
    score_income_coherence: r.income_coherence_score ?? r.score_income_coherence ?? 0,
    score_funds_origin: r.funds_origin_score ?? r.score_funds_origin ?? 0,
    score_third_parties: r.third_party_score ?? r.score_third_parties ?? 0,
    score_legal_structure: r.legal_structure_score ?? r.score_legal_structure ?? 0,
    score_geographic_risk: r.geographic_risk_score ?? r.score_geographic_risk ?? 0,
    score_payment_method: r.payment_method_score ?? r.score_payment_method ?? 0,
    risk_level: r.risk_level ?? 'low',
    notes: r.notes ?? null,
    created_at: r.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function mapDeclaration(r: Record<string, unknown>, userId: string) {
  return {
    created_by: userId,
    suspicion_reason: r.suspicion_reason ?? '',
    operation_nature: r.operation_nature ?? null,
    operation_amount: r.operation_amount ?? r.property_price ?? null,
    operation_date: r.operation_date ?? null,
    operation_currency: 'EUR',
    payment_method: r.payment_method ?? null,
    funds_origin: r.funds_origin ?? r.payment_origin ?? null,
    property_address: r.property_address ?? null,
    property_type: r.property_type ?? null,
    agency_name: r.agency_name ?? null,
    agency_address: r.agency_address ?? null,
    declarant_name: r.declarant_name ?? null,
    declarant_role: r.declarant_function ?? r.declarant_role ?? null,
    declarant_email: r.declarant_email ?? null,
    observed_facts: r.facts_observed ?? r.observed_facts ?? null,
    inconsistencies: r.inconsistencies ?? null,
    indicator_refused_documents: r.refused_documents ?? r.indicator_refused_documents ?? false,
    indicator_large_cash: r.large_cash_payment ?? r.indicator_large_cash ?? false,
    indicator_income_inconsistency: r.income_inconsistency ?? r.indicator_income_inconsistency ?? false,
    indicator_complex_structure: r.complex_legal_structure ?? r.indicator_complex_structure ?? false,
    indicator_unusual_urgency: r.unusual_urgency ?? r.indicator_unusual_urgency ?? false,
    indicator_unknown_third_party: r.unknown_third_party ?? r.indicator_unknown_third_party ?? false,
    indicator_foreign_account: r.foreign_account_used ?? r.indicator_foreign_account ?? false,
    status: r.status === 'transmitted' ? 'submitted' : (r.status ?? 'draft'),
    notes: r.notes ?? null,
    created_at: r.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function mapDossier(r: Record<string, unknown>, userId: string) {
  return {
    created_by: userId,
    dossier_type: r.dossier_type ?? 'other',
    status: r.status ?? 'open',
    reference: r.reference ?? `DOS-${Date.now()}`,
    property_address: r.property_address ?? null,
    property_type: r.property_type ?? null,
    transaction_amount: r.transaction_amount ?? null,
    deadline: r.deadline ?? null,
    kyc_verified: r.kyc_verified ?? false,
    risk_assessed: r.risk_assessed ?? false,
    documents_complete: r.documents_complete ?? false,
    beneficial_owners_verified: r.beneficial_owners_verified ?? false,
    notes: r.notes ?? null,
    created_at: r.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

const MAPPERS: Record<string, (r: Record<string, unknown>, uid: string) => Record<string, unknown>> = {
  clients: mapClient,
  transactions: mapTransaction,
  alerts: mapAlert,
  risk_assessments: mapRiskAssessment,
  declarations: mapDeclaration,
  dossiers: mapDossier,
};

const TARGET_TABLES: Record<string, string> = {
  clients: 'tracfin_clients',
  transactions: 'tracfin_transactions',
  alerts: 'tracfin_alerts',
  risk_assessments: 'tracfin_risk_assessments',
  declarations: 'tracfin_declarations',
  dossiers: 'tracfin_dossiers',
};

const SOURCE_TABLES: Record<string, string[]> = {
  clients: ['clients', 'tracfin_clients'],
  transactions: ['transactions', 'tracfin_transactions'],
  alerts: ['alerts', 'tracfin_alerts'],
  risk_assessments: ['risk_assessments', 'tracfin_risk_assessments'],
  declarations: ['tracfin_declarations', 'declarations'],
  dossiers: ['dossiers', 'compliance_dossiers', 'tracfin_dossiers'],
};

async function findSourceTable(src: SupabaseClient, keys: string[]): Promise<string | null> {
  for (const t of keys) {
    const { error } = await src.from(t).select('id').limit(1);
    if (!error) return t;
  }
  return null;
}

export function TracfinMigration() {
  const { session } = useAuth();
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [stats, setStats] = useState<MigrationStat[]>(
    TABLES.map(t => ({ table: t.key, label: t.label, count: null, migrated: 0, errors: 0, status: 'idle' }))
  );
  const [migrating, setMigrating] = useState(false);
  const [done, setDone] = useState(false);

  async function testConnection() {
    if (!url || !key) return;
    setTesting(true);
    setConnectionError('');
    setConnected(false);
    try {
      const src = createClient(url.trim(), key.trim());
      const newStats: MigrationStat[] = [];
      for (const t of TABLES) {
        const sourceTable = await findSourceTable(src, SOURCE_TABLES[t.key]);
        let count = 0;
        if (sourceTable) {
          const { count: c } = await src.from(sourceTable).select('*', { count: 'exact', head: true });
          count = c ?? 0;
        }
        newStats.push({ table: t.key, label: t.label, count, migrated: 0, errors: 0, status: 'idle' });
      }
      setStats(newStats);
      setConnected(true);
    } catch (e) {
      setConnectionError(`Connexion impossible : ${e instanceof Error ? e.message : 'Vérifiez l\'URL et la clé API'}`);
    }
    setTesting(false);
  }

  async function runMigration() {
    if (!connected || !session?.user.id) return;
    setMigrating(true);
    setDone(false);
    const src = createClient(url.trim(), key.trim());
    const userId = session.user.id;

    for (const t of TABLES) {
      setStats(prev => prev.map(s => s.table === t.key ? { ...s, status: 'running', migrated: 0, errors: 0 } : s));

      const sourceTable = await findSourceTable(src, SOURCE_TABLES[t.key]);
      if (!sourceTable) {
        setStats(prev => prev.map(s => s.table === t.key ? { ...s, status: 'done' } : s));
        continue;
      }

      const { data, error } = await src.from(sourceTable).select('*');
      if (error || !data) {
        setStats(prev => prev.map(s => s.table === t.key ? { ...s, status: 'error' } : s));
        continue;
      }

      const mapper = MAPPERS[t.key];
      const targetTable = TARGET_TABLES[t.key];
      let migrated = 0;
      let errors = 0;

      const BATCH = 50;
      for (let i = 0; i < data.length; i += BATCH) {
        const batch = data.slice(i, i + BATCH).map(r => mapper(r as Record<string, unknown>, userId));
        const { error: insertErr } = await supabase.from(targetTable).insert(batch);
        if (insertErr) {
          for (const row of batch) {
            const { error: singleErr } = await supabase.from(targetTable).insert(row);
            if (singleErr) errors++;
            else migrated++;
          }
        } else {
          migrated += batch.length;
        }
        setStats(prev => prev.map(s => s.table === t.key ? { ...s, migrated, errors } : s));
      }

      setStats(prev => prev.map(s => s.table === t.key ? { ...s, status: 'done', migrated, errors } : s));
    }

    setMigrating(false);
    setDone(true);
  }

  const totalMigrated = stats.reduce((acc, s) => acc + s.migrated, 0);
  const totalErrors = stats.reduce((acc, s) => acc + s.errors, 0);
  const totalAvailable = stats.reduce((acc, s) => acc + (s.count ?? 0), 0);

  return (
    <AppLayout>
      <Topbar title="Migration de base de données" />
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-[#1A3A5C]" />
              Migration depuis l'ancien projet TracFin
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Connectez-vous à votre ancien projet Bolt TracFin et transférez toutes vos données en un clic.
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-[#1A3A5C]/5 border border-[#1A3A5C]/20 rounded-xl p-4 space-y-2">
            <p className="text-xs font-bold text-[#1A3A5C]">Comment trouver les identifiants ?</p>
            <ol className="space-y-1">
              {[
                'Ouvrez votre ancien projet TracFin sur Bolt',
                'Cliquez sur l\'icône de base de données (en haut à droite)',
                'Allez dans Settings > API',
                'Copiez "Project URL" et "anon public" key',
              ].map((step, i) => (
                <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#1A3A5C] text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Connection form */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
            <p className="text-sm font-semibold text-gray-900">Connexion au projet source</p>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Project URL *</label>
              <Input
                value={url}
                onChange={e => { setUrl(e.target.value); setConnected(false); }}
                placeholder="https://xxxxxxxxxxxx.supabase.co"
                className="h-9 text-sm font-mono"
                disabled={migrating}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Anon Key *</label>
              <div className="relative">
                <Input
                  value={key}
                  onChange={e => { setKey(e.target.value); setConnected(false); }}
                  type={showKey ? 'text' : 'password'}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="h-9 text-sm font-mono pr-10"
                  disabled={migrating}
                />
                <button onClick={() => setShowKey(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {connectionError && (
              <p className="text-xs text-red-600 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />{connectionError}
              </p>
            )}
            <Button
              onClick={testConnection}
              disabled={!url || !key || testing || migrating}
              variant={connected ? 'outline' : 'default'}
              className={`w-full h-9 text-sm ${!connected ? 'bg-[#1A3A5C] hover:bg-[#15304d]' : ''}`}>
              {testing ? (
                <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Connexion en cours…</span>
              ) : connected ? (
                <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4" />Reconnecté — Rafraîchir</span>
              ) : (
                <span className="flex items-center gap-2"><Database className="w-4 h-4" />Tester la connexion</span>
              )}
            </Button>
          </div>

          {/* Data preview */}
          {connected && (
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">Données disponibles</p>
                <span className="text-xs text-gray-500">{totalAvailable} enregistrement{totalAvailable > 1 ? 's' : ''} total</span>
              </div>
              <div className="divide-y divide-gray-50">
                {TABLES.map(t => {
                  const stat = stats.find(s => s.table === t.key)!;
                  const Icon = t.icon;
                  return (
                    <div key={t.key} className="px-4 py-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{stat.label}</p>
                        {stat.status === 'running' && (
                          <p className="text-xs text-blue-600">{stat.migrated} / {stat.count ?? '?'} migrés…</p>
                        )}
                        {stat.status === 'done' && stat.migrated > 0 && (
                          <p className="text-xs text-emerald-600">{stat.migrated} migré{stat.migrated > 1 ? 's' : ''}{stat.errors > 0 ? ` • ${stat.errors} erreur${stat.errors > 1 ? 's' : ''}` : ''}</p>
                        )}
                        {stat.status === 'done' && stat.migrated === 0 && (
                          <p className="text-xs text-gray-400">Aucune donnée</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm font-semibold text-gray-700">{stat.count ?? 0}</span>
                        {stat.status === 'idle' && <span className="w-2 h-2 rounded-full bg-gray-200" />}
                        {stat.status === 'running' && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                        {stat.status === 'done' && stat.errors === 0 && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        {stat.status === 'done' && stat.errors > 0 && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                        {stat.status === 'error' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Migration button */}
          {connected && !done && (
            <Button
              onClick={runMigration}
              disabled={migrating || totalAvailable === 0}
              className="w-full h-11 bg-[#1A3A5C] hover:bg-[#15304d] text-sm">
              {migrating ? (
                <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Migration en cours…</span>
              ) : (
                <span className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Migrer {totalAvailable} enregistrement{totalAvailable > 1 ? 's' : ''} vers LotierCollab
                </span>
              )}
            </Button>
          )}

          {/* Result */}
          {done && (
            <div className={`rounded-xl border p-5 ${totalErrors === 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle2 className={`w-6 h-6 ${totalErrors === 0 ? 'text-emerald-600' : 'text-amber-600'}`} />
                <div>
                  <p className="font-bold text-gray-900">Migration terminée</p>
                  <p className="text-xs text-gray-600">
                    {totalMigrated} enregistrement{totalMigrated > 1 ? 's' : ''} migré{totalMigrated > 1 ? 's' : ''}
                    {totalErrors > 0 && ` • ${totalErrors} erreur${totalErrors > 1 ? 's' : ''} (doublons ignorés)`}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setDone(false); setConnected(false); setUrl(''); setKey(''); setStats(TABLES.map(t => ({ table: t.key, label: t.label, count: null, migrated: 0, errors: 0, status: 'idle' }))); }}
                  className="flex-1 h-9 text-xs">
                  Nouvelle migration
                </Button>
                <Button className="flex-1 h-9 text-xs bg-[#1A3A5C] hover:bg-[#15304d]"
                  onClick={() => window.location.href = '/tracfin'}>
                  Voir les données <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </AppLayout>
  );
}
