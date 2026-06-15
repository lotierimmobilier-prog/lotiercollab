import { useState, useRef, useCallback } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Topbar } from '../../components/layout/Topbar';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Upload, Download, FileText, CircleCheck as CheckCircle2, TriangleAlert as AlertTriangle, X, Users, ArrowLeftRight, BellRing, Signature as FileSignature, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

type ImportType = 'clients' | 'transactions' | 'alerts' | 'declarations';

interface ImportResult {
  success: number;
  errors: string[];
  total: number;
}

interface RawRow {
  [key: string]: string;
}

const IMPORT_TYPES = [
  {
    id: 'clients' as ImportType,
    label: 'Clients KYC',
    icon: Users,
    desc: 'Importer des clients depuis l\'ancien registre TracFin',
    color: 'text-[#1A3A5C]',
    bg: 'bg-[#1A3A5C]/10',
    columns: [
      { key: 'type_client', label: 'type_client', required: true, desc: 'individual ou legal_entity' },
      { key: 'prenom', label: 'prenom', required: false, desc: 'Prénom (particuliers)' },
      { key: 'nom', label: 'nom', required: false, desc: 'Nom (particuliers)' },
      { key: 'raison_sociale', label: 'raison_sociale', required: false, desc: 'Raison sociale (personnes morales)' },
      { key: 'email', label: 'email', required: false, desc: 'Adresse email' },
      { key: 'telephone', label: 'telephone', required: false, desc: 'Numéro de téléphone' },
      { key: 'date_naissance', label: 'date_naissance', required: false, desc: 'JJ/MM/AAAA' },
      { key: 'adresse', label: 'adresse', required: false, desc: 'Adresse complète' },
      { key: 'code_postal', label: 'code_postal', required: false, desc: 'Code postal' },
      { key: 'ville', label: 'ville', required: false, desc: 'Ville' },
      { key: 'pays', label: 'pays', required: false, desc: 'Pays (défaut: France)' },
      { key: 'profession', label: 'profession', required: false, desc: 'Profession' },
      { key: 'ppe', label: 'ppe', required: false, desc: 'oui / non' },
      { key: 'niveau_risque', label: 'niveau_risque', required: false, desc: 'low / medium / high' },
      { key: 'role', label: 'role', required: false, desc: 'vendeur / acquereur / bailleur / locataire' },
    ],
  },
  {
    id: 'transactions' as ImportType,
    label: 'Transactions',
    icon: ArrowLeftRight,
    desc: 'Importer des transactions immobilières',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    columns: [
      { key: 'type_transaction', label: 'type_transaction', required: true, desc: 'sale / purchase / rental' },
      { key: 'adresse_bien', label: 'adresse_bien', required: false, desc: 'Adresse du bien' },
      { key: 'type_bien', label: 'type_bien', required: false, desc: 'Type de bien' },
      { key: 'montant', label: 'montant', required: false, desc: 'Montant en euros (chiffres uniquement)' },
      { key: 'mode_paiement', label: 'mode_paiement', required: false, desc: 'Mode de paiement' },
      { key: 'origine_fonds', label: 'origine_fonds', required: false, desc: 'Origine des fonds' },
      { key: 'tiers_implique', label: 'tiers_implique', required: false, desc: 'oui / non' },
      { key: 'urgence_inhabituelle', label: 'urgence_inhabituelle', required: false, desc: 'oui / non' },
      { key: 'statut', label: 'statut', required: false, desc: 'in_progress / completed / cancelled' },
      { key: 'notes', label: 'notes', required: false, desc: 'Notes libres' },
    ],
  },
  {
    id: 'alerts' as ImportType,
    label: 'Alertes',
    icon: BellRing,
    desc: 'Importer des alertes de conformité',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    columns: [
      { key: 'titre', label: 'titre', required: true, desc: 'Titre de l\'alerte' },
      { key: 'type_alerte', label: 'type_alerte', required: false, desc: 'Type d\'alerte' },
      { key: 'severite', label: 'severite', required: false, desc: 'low / medium / high / critical' },
      { key: 'statut', label: 'statut', required: false, desc: 'open / under_review / closed / reported' },
      { key: 'description', label: 'description', required: false, desc: 'Description détaillée' },
      { key: 'notes', label: 'notes', required: false, desc: 'Notes internes' },
    ],
  },
  {
    id: 'declarations' as ImportType,
    label: 'Déclarations de soupçon',
    icon: FileSignature,
    desc: 'Importer des déclarations de soupçon existantes',
    color: 'text-red-600',
    bg: 'bg-red-50',
    columns: [
      { key: 'motif_soupcon', label: 'motif_soupcon', required: true, desc: 'Motif du soupçon (texte)' },
      { key: 'nature_operation', label: 'nature_operation', required: false, desc: 'Nature de l\'opération' },
      { key: 'montant_operation', label: 'montant_operation', required: false, desc: 'Montant en euros' },
      { key: 'date_operation', label: 'date_operation', required: false, desc: 'JJ/MM/AAAA' },
      { key: 'mode_paiement', label: 'mode_paiement', required: false, desc: 'Mode de paiement' },
      { key: 'adresse_bien', label: 'adresse_bien', required: false, desc: 'Adresse du bien concerné' },
      { key: 'declarant_nom', label: 'declarant_nom', required: false, desc: 'Nom du déclarant' },
      { key: 'statut', label: 'statut', required: false, desc: 'draft / submitted / acknowledged' },
      { key: 'notes', label: 'notes', required: false, desc: 'Notes' },
    ],
  },
];

function generateTemplate(type: ImportType): void {
  const config = IMPORT_TYPES.find(t => t.id === type)!;
  const headers = config.columns.map(c => c.key);

  const exampleRows: Record<ImportType, string[][]> = {
    clients: [
      ['individual', 'Jean', 'Dupont', '', 'jean.dupont@email.com', '0612345678', '15/03/1975', '12 rue de la Paix', '75001', 'Paris', 'France', 'Médecin', 'non', 'low', 'acquereur'],
      ['legal_entity', '', '', 'Immobilier SAS', 'contact@immo.fr', '0123456789', '', '45 avenue Victor Hugo', '69002', 'Lyon', 'France', '', 'non', 'medium', 'vendeur'],
    ],
    transactions: [
      ['sale', '12 rue du Commerce, 75015 Paris', 'Appartement', '350000', 'Virement bancaire', 'Épargne personnelle', 'non', 'non', 'in_progress', ''],
    ],
    alerts: [
      ['Incohérence de revenus', 'Activité suspecte', 'medium', 'open', 'Client avec revenus déclarés insuffisants pour l\'opération', ''],
    ],
    declarations: [
      ['Incohérence entre profil client et montant de l\'opération', 'Vente immobilière', '450000', '01/06/2026', 'Virement', '8 rue de la République, 13001 Marseille', 'Nicolas Popovitch', 'draft', ''],
    ],
  };

  const ws = XLSX.utils.aoa_to_sheet([headers, ...exampleRows[type]]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Import');
  XLSX.writeFile(wb, `template_import_${type}.xlsx`);
}

async function importClients(rows: RawRow[], userId: string): Promise<ImportResult> {
  const result: ImportResult = { success: 0, errors: [], total: rows.length };
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNum = i + 2;
    const clientType = (r.type_client || '').trim().toLowerCase();
    if (!['individual', 'legal_entity'].includes(clientType)) {
      result.errors.push(`Ligne ${rowNum} : type_client invalide (attendu: individual ou legal_entity)`);
      continue;
    }
    if (clientType === 'individual' && !r.nom && !r.prenom) {
      result.errors.push(`Ligne ${rowNum} : nom ou prenom requis pour un particulier`);
      continue;
    }
    if (clientType === 'legal_entity' && !r.raison_sociale) {
      result.errors.push(`Ligne ${rowNum} : raison_sociale requis pour une personne morale`);
      continue;
    }
    const ppe = (r.ppe || '').toLowerCase() === 'oui';
    const riskLevel = ['low', 'medium', 'high'].includes((r.niveau_risque || '').toLowerCase())
      ? r.niveau_risque.toLowerCase()
      : 'low';
    const role = ['vendeur', 'acquereur', 'bailleur', 'locataire', 'caution'].includes((r.role || '').toLowerCase())
      ? r.role.toLowerCase()
      : 'acquereur';
    const { error } = await supabase.from('tracfin_clients').insert({
      created_by: userId,
      client_type: clientType,
      first_name: r.prenom || null,
      last_name: r.nom || null,
      company_name: r.raison_sociale || null,
      email: r.email || null,
      phone: r.telephone || null,
      birth_date: r.date_naissance || null,
      address: r.adresse || null,
      postal_code: r.code_postal || null,
      city: r.ville || null,
      country: r.pays || 'France',
      profession: r.profession || null,
      is_ppe: ppe,
      risk_level: riskLevel,
      role,
      doubt_level: 'none',
      status: 'active',
      is_draft: false,
      kyc_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (error) { result.errors.push(`Ligne ${rowNum} : ${error.message}`); }
    else { result.success++; }
  }
  return result;
}

async function importTransactions(rows: RawRow[], userId: string): Promise<ImportResult> {
  const result: ImportResult = { success: 0, errors: [], total: rows.length };
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNum = i + 2;
    const txType = (r.type_transaction || '').toLowerCase();
    if (!['sale', 'purchase', 'rental'].includes(txType)) {
      result.errors.push(`Ligne ${rowNum} : type_transaction invalide (sale / purchase / rental)`);
      continue;
    }
    const status = ['in_progress', 'completed', 'cancelled'].includes((r.statut || '').toLowerCase())
      ? r.statut.toLowerCase() : 'in_progress';
    const { error } = await supabase.from('tracfin_transactions').insert({
      created_by: userId,
      transaction_type: txType,
      property_address: r.adresse_bien || null,
      property_type: r.type_bien || null,
      amount: r.montant ? parseFloat(r.montant.replace(/[^0-9.]/g, '')) : null,
      currency: 'EUR',
      payment_method: r.mode_paiement || null,
      funds_origin: r.origine_fonds || null,
      third_party_involved: (r.tiers_implique || '').toLowerCase() === 'oui',
      unusual_urgency: (r.urgence_inhabituelle || '').toLowerCase() === 'oui',
      status,
      notes: r.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (error) { result.errors.push(`Ligne ${rowNum} : ${error.message}`); }
    else { result.success++; }
  }
  return result;
}

async function importAlerts(rows: RawRow[], userId: string): Promise<ImportResult> {
  const result: ImportResult = { success: 0, errors: [], total: rows.length };
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNum = i + 2;
    if (!r.titre) {
      result.errors.push(`Ligne ${rowNum} : titre requis`);
      continue;
    }
    const severity = ['low', 'medium', 'high', 'critical'].includes((r.severite || '').toLowerCase())
      ? r.severite.toLowerCase() : 'medium';
    const status = ['open', 'under_review', 'closed', 'reported'].includes((r.statut || '').toLowerCase())
      ? r.statut.toLowerCase() : 'open';
    const { error } = await supabase.from('tracfin_alerts').insert({
      created_by: userId,
      title: r.titre,
      alert_type: r.type_alerte || 'Activité suspecte',
      severity,
      status,
      description: r.description || null,
      notes: r.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (error) { result.errors.push(`Ligne ${rowNum} : ${error.message}`); }
    else { result.success++; }
  }
  return result;
}

async function importDeclarations(rows: RawRow[], userId: string): Promise<ImportResult> {
  const result: ImportResult = { success: 0, errors: [], total: rows.length };
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNum = i + 2;
    if (!r.motif_soupcon) {
      result.errors.push(`Ligne ${rowNum} : motif_soupcon requis`);
      continue;
    }
    const status = ['draft', 'submitted', 'acknowledged'].includes((r.statut || '').toLowerCase())
      ? r.statut.toLowerCase() : 'draft';
    const { error } = await supabase.from('tracfin_declarations').insert({
      created_by: userId,
      suspicion_reason: r.motif_soupcon,
      operation_nature: r.nature_operation || null,
      operation_amount: r.montant_operation ? parseFloat(r.montant_operation.replace(/[^0-9.]/g, '')) : null,
      operation_date: r.date_operation || null,
      operation_currency: 'EUR',
      payment_method: r.mode_paiement || null,
      property_address: r.adresse_bien || null,
      declarant_name: r.declarant_nom || null,
      indicator_refused_documents: false,
      indicator_large_cash: false,
      indicator_income_inconsistency: false,
      indicator_complex_structure: false,
      indicator_unusual_urgency: false,
      indicator_unknown_third_party: false,
      indicator_foreign_account: false,
      status,
      notes: r.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (error) { result.errors.push(`Ligne ${rowNum} : ${error.message}`); }
    else { result.success++; }
  }
  return result;
}

function parseFile(file: File): Promise<RawRow[]> {
  return new Promise((resolve, reject) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'csv') {
      Papa.parse<RawRow>(file, {
        header: true,
        skipEmptyLines: true,
        complete: r => resolve(r.data),
        error: reject,
      });
    } else {
      const reader = new FileReader();
      reader.onload = e => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<RawRow>(ws, { defval: '' });
        resolve(rows);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    }
  });
}

export function TracfinImport() {
  const { session } = useAuth();
  const [selectedType, setSelectedType] = useState<ImportType | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<RawRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    setResult(null);
    try {
      const rows = await parseFile(f);
      setPreview(rows.slice(0, 5));
    } catch {
      setPreview([]);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  async function runImport() {
    if (!file || !selectedType || !session?.user.id) return;
    setImporting(true);
    setResult(null);
    try {
      const rows = await parseFile(file);
      const userId = session.user.id;
      let res: ImportResult;
      if (selectedType === 'clients') res = await importClients(rows, userId);
      else if (selectedType === 'transactions') res = await importTransactions(rows, userId);
      else if (selectedType === 'alerts') res = await importAlerts(rows, userId);
      else res = await importDeclarations(rows, userId);
      setResult(res);
    } finally {
      setImporting(false);
    }
  }

  function reset() {
    setFile(null);
    setPreview([]);
    setResult(null);
    setSelectedType(null);
  }

  const config = selectedType ? IMPORT_TYPES.find(t => t.id === selectedType) : null;

  return (
    <AppLayout>
      <Topbar title="Import de données" />
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-[#1A3A5C]" />
              Import des données TRACFIN
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Importez vos données existantes depuis l'ancien registre TracFin ou depuis un fichier CSV / Excel.
            </p>
          </div>

          {/* Step 1 — Type selection */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">1. Choisir le type de données</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {IMPORT_TYPES.map(t => {
                const Icon = t.icon;
                return (
                  <button key={t.id} onClick={() => { setSelectedType(t.id); setFile(null); setPreview([]); setResult(null); }}
                    className={`p-4 rounded-xl border text-left transition-all ${selectedType === t.id ? 'border-[#1A3A5C] bg-[#1A3A5C]/5' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${t.bg}`}>
                      <Icon className={`w-4 h-4 ${t.color}`} />
                    </div>
                    <p className="text-xs font-semibold text-gray-900">{t.label}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{t.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedType && config && (
            <>
              {/* Template download */}
              <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Télécharger le modèle Excel</p>
                  <p className="text-xs text-gray-500 mt-0.5">Remplissez ce modèle avec vos données puis importez-le.</p>
                </div>
                <Button variant="outline" onClick={() => generateTemplate(selectedType)} className="flex-shrink-0 h-9 text-xs gap-1.5">
                  <Download className="w-3.5 h-3.5" />Modèle .xlsx
                </Button>
              </div>

              {/* Columns reference */}
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Colonnes attendues</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {config.columns.map(col => (
                    <div key={col.key} className="flex items-center gap-2">
                      <code className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${col.required ? 'bg-[#1A3A5C] text-white' : 'bg-gray-200 text-gray-600'}`}>{col.key}</code>
                      <span className="text-[11px] text-gray-500">{col.desc}</span>
                      {col.required && <span className="text-[9px] font-bold text-red-500 uppercase">requis</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 2 — File drop */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">2. Déposer le fichier</p>
                {!file ? (
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors ${dragOver ? 'border-[#1A3A5C] bg-[#1A3A5C]/5' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                    <Upload className="w-8 h-8 text-gray-300" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-600">Glisser-déposer un fichier ici</p>
                      <p className="text-xs text-gray-400 mt-0.5">ou cliquer pour sélectionner • CSV, Excel (.xlsx, .xls)</p>
                    </div>
                    <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                  </div>
                ) : (
                  <div className="bg-white border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-[#1A3A5C] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{file.name}</p>
                        <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} Ko • {preview.length} ligne(s) prévisualisée(s)</p>
                      </div>
                      <button onClick={() => { setFile(null); setPreview([]); setResult(null); }}
                        className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Preview table */}
                    {preview.length > 0 && (
                      <div className="mt-3 overflow-x-auto rounded-lg border border-gray-100">
                        <table className="text-xs w-full">
                          <thead>
                            <tr className="bg-gray-50">
                              {Object.keys(preview[0]).map(k => (
                                <th key={k} className="px-3 py-2 text-left font-semibold text-gray-500 whitespace-nowrap">{k}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {preview.map((row, i) => (
                              <tr key={i} className="border-t border-gray-50">
                                {Object.values(row).map((v, j) => (
                                  <td key={j} className="px-3 py-1.5 text-gray-600 whitespace-nowrap max-w-32 truncate">{String(v)}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 3 — Import */}
              {file && !result && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">3. Lancer l'import</p>
                  <Button onClick={runImport} disabled={importing} className="w-full bg-[#1A3A5C] hover:bg-[#15304d] h-11">
                    {importing ? (
                      <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Import en cours…</span>
                    ) : (
                      <span className="flex items-center gap-2"><Upload className="w-4 h-4" />Importer les données</span>
                    )}
                  </Button>
                </div>
              )}

              {/* Result */}
              {result && (
                <div className={`rounded-xl border p-5 ${result.errors.length === 0 ? 'bg-emerald-50 border-emerald-200' : result.success > 0 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    {result.success === result.total ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-amber-600" />
                    )}
                    <div>
                      <p className="font-bold text-gray-900 text-sm">Import terminé</p>
                      <p className="text-xs text-gray-600">
                        {result.success} enregistrement{result.success > 1 ? 's' : ''} importé{result.success > 1 ? 's' : ''} sur {result.total}
                        {result.errors.length > 0 && ` • ${result.errors.length} erreur${result.errors.length > 1 ? 's' : ''}`}
                      </p>
                    </div>
                  </div>
                  {result.errors.length > 0 && (
                    <div className="mt-3 space-y-1 max-h-40 overflow-y-auto">
                      {result.errors.map((err, i) => (
                        <p key={i} className="text-[11px] text-red-700 flex items-start gap-1.5">
                          <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />{err}
                        </p>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" onClick={reset} className="flex-1 h-9 text-xs">Nouvel import</Button>
                    {result.success > 0 && (
                      <Button className="flex-1 h-9 text-xs bg-[#1A3A5C] hover:bg-[#15304d]"
                        onClick={() => window.location.href = `/tracfin/${selectedType === 'clients' ? 'clients' : selectedType === 'transactions' ? 'transactions' : selectedType === 'alerts' ? 'alertes' : 'declarations'}`}>
                        Voir les données <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </AppLayout>
  );
}
