import { useState, useEffect, useCallback, useRef } from 'react';
import { FolderPlus, Search, X, FileText, Upload, Trash2, Download, FolderOpen, CircleCheck as CheckCircle2, Circle, Building2 } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Topbar } from '../../components/layout/Topbar';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useAppData } from '../../hooks/useAppData';
import type { PropertyFile, PropertyFileDocument, ChecklistItem, PropertyType, PropertyStatus } from '../../types/mydoc';
import {
  PROPERTY_TYPE_LABELS, PROPERTY_STATUS_LABELS,
  PROPERTY_TYPE_COLORS, PROPERTY_STATUS_COLORS,
} from '../../types/mydoc';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';

const TYPES: PropertyType[] = ['VENTE', 'LOCATION', 'GESTION', 'DIVERS'];
const STATUSES: PropertyStatus[] = ['OPEN', 'COMPLETE', 'ARCHIVED'];

const defaultForm = {
  reference: '', type: 'VENTE' as PropertyType, address: '', city: '',
  postal_code: '', owner_name: '', agent_id: '', status: 'OPEN' as PropertyStatus,
  mandate_number: '', mandate_status: '' as '' | 'SIGNED' | 'PENDING',
  is_copro: false, notes: '',
};

function formatSize(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

export function MyDocDossiers() {
  const { session, isSuperAdmin, memberId } = useAuth();
  const { members } = useAppData();
  const [files, setFiles] = useState<PropertyFile[]>([]);
  const [selected, setSelected] = useState<PropertyFile | null>(null);
  const [docs, setDocs] = useState<PropertyFileDocument[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PropertyFile | null>(null);
  const [form, setForm] = useState({ ...defaultForm });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = useCallback(async () => {
    let q = supabase.from('property_files').select('*').not('status', 'eq', 'ARCHIVED').order('created_at', { ascending: false });
    if (!isSuperAdmin && memberId) q = q.eq('agent_id', memberId);
    const { data } = await q;
    setFiles(data ?? []);
    setLoading(false);
  }, [isSuperAdmin, memberId]);

  const loadDetail = useCallback(async (fileId: string, type: PropertyType) => {
    const [{ data: d }, { data: c }] = await Promise.all([
      supabase.from('property_file_documents').select('*').eq('property_file_id', fileId).order('uploaded_at', { ascending: false }),
      supabase.from('property_checklist_items').select('*').eq('property_type', type).eq('active', true).order('order_index'),
    ]);
    setDocs(d ?? []);
    setChecklist(c ?? []);
  }, []);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  useEffect(() => {
    if (selected) loadDetail(selected.id, selected.type);
  }, [selected, loadDetail]);

  const f = (field: string, val: unknown) => setForm(p => ({ ...p, [field]: val }));

  const openCreate = () => {
    setEditing(null);
    const agentDefault = !isSuperAdmin && memberId ? memberId : '';
    setForm({ ...defaultForm, agent_id: agentDefault });
    setModalOpen(true);
  };

  const openEdit = (file: PropertyFile) => {
    setEditing(file);
    setForm({
      reference: file.reference, type: file.type, address: file.address,
      city: file.city, postal_code: file.postal_code ?? '', owner_name: file.owner_name,
      agent_id: file.agent_id ?? '', status: file.status,
      mandate_number: file.mandate_number ?? '',
      mandate_status: file.mandate_status ?? '',
      is_copro: file.is_copro, notes: file.notes ?? '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.reference || !form.address || !form.city || !form.owner_name) return;
    setSaving(true);
    const payload = {
      reference: form.reference, type: form.type, address: form.address,
      city: form.city, postal_code: form.postal_code || null,
      owner_name: form.owner_name, agent_id: form.agent_id || null,
      status: form.status, mandate_number: form.mandate_number || null,
      mandate_status: (form.mandate_status as 'SIGNED' | 'PENDING') || null,
      is_copro: form.is_copro, notes: form.notes || null,
      updated_at: new Date().toISOString(),
    };
    if (editing) {
      const { data } = await supabase.from('property_files').update(payload).eq('id', editing.id).select().single();
      if (data) {
        setFiles(prev => prev.map(x => x.id === editing.id ? data : x));
        setSelected(data);
      }
    } else {
      const { data } = await supabase.from('property_files').insert({ ...payload, created_at: new Date().toISOString() }).select().single();
      if (data) {
        setFiles(prev => [data, ...prev]);
        setSelected(data);
      }
    }
    setSaving(false);
    setModalOpen(false);
  };

  const handleArchive = async (id: string) => {
    await supabase.from('property_files').update({ status: 'ARCHIVED', updated_at: new Date().toISOString() }).eq('id', id);
    setFiles(prev => prev.filter(x => x.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selected || !session?.user.id) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `${session.user.id}/${selected.id}/${Date.now()}_${file.name}`;
    const { error: upErr } = await supabase.storage.from('property-documents').upload(path, file);
    if (!upErr) {
      const { data } = await supabase.from('property_file_documents').insert({
        property_file_id: selected.id, category: 'Document', filename: file.name,
        file_size: file.size, mime_type: file.type, storage_path: path,
        uploader_id: session.user.id,
      }).select().single();
      if (data) setDocs(prev => [data, ...prev]);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteDoc = async (doc: PropertyFileDocument) => {
    if (doc.storage_path) await supabase.storage.from('property-documents').remove([doc.storage_path]);
    await supabase.from('property_file_documents').delete().eq('id', doc.id);
    setDocs(prev => prev.filter(d => d.id !== doc.id));
  };

  const handleDownload = async (doc: PropertyFileDocument) => {
    if (!doc.storage_path) return;
    const { data } = await supabase.storage.from('property-documents').createSignedUrl(doc.storage_path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  const agentName = (id: string | null) => {
    if (!id) return '—';
    const m = members.find(m => m.id === id);
    return m ? m.full_name : '—';
  };

  const filtered = files.filter(f => {
    const q = search.toLowerCase();
    const match = !q || f.reference.toLowerCase().includes(q) || f.owner_name.toLowerCase().includes(q) || f.city.toLowerCase().includes(q) || f.address.toLowerCase().includes(q);
    return match && (filterType === 'all' || f.type === filterType);
  });

  // Group checklist by category
  const checklistByCategory = checklist.reduce<Record<string, ChecklistItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const docCategories = docs.map(d => d.category);
  const requiredItems = checklist.filter(c => c.required);
  const coveredRequired = requiredItems.filter(c => docCategories.includes(c.label) || docs.some(d => d.filename.toLowerCase().includes(c.label.toLowerCase().split(' ')[0]))).length;

  return (
    <AppLayout>
      <Topbar
        title="Dossiers immobiliers"
        actions={
          <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A3A5C] hover:bg-[#142d47] text-white text-sm font-medium rounded-lg transition-colors">
            <FolderPlus className="w-4 h-4" />
            Nouveau dossier
          </button>
        }
      />

      <main className="flex-1 overflow-hidden flex">
        {/* LEFT — list */}
        <div className={`flex flex-col ${selected ? 'hidden lg:flex lg:w-2/5' : 'w-full'} border-r border-gray-100`}>
          <div className="p-4 border-b border-gray-100 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input className="pl-9 h-9 text-sm" placeholder="Référence, propriétaire, ville..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <select value={filterType} onChange={e => setFilterType(e.target.value)} className="flex-1 h-8 px-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#1A3A5C]">
                <option value="all">Tous les types</option>
                {TYPES.map(t => <option key={t} value={t}>{PROPERTY_TYPE_LABELS[t]}</option>)}
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loading ? (
              [...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <FolderOpen className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">Aucun dossier</p>
                <button onClick={openCreate} className="mt-2 text-xs text-[#1A3A5C] hover:underline font-medium">Créer un dossier</button>
              </div>
            ) : filtered.map(file => (
              <div
                key={file.id}
                onClick={() => setSelected(file)}
                className={`bg-white border rounded-xl p-3.5 cursor-pointer transition-all hover:shadow-sm ${selected?.id === file.id ? 'border-[#1A3A5C] shadow-sm' : 'border-gray-100'}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#1A3A5C]/10 flex items-center justify-center flex-shrink-0">
                    <FolderOpen className="w-4 h-4 text-[#1A3A5C]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-sm text-gray-900 truncate">{file.reference}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${PROPERTY_TYPE_COLORS[file.type]}`}>{PROPERTY_TYPE_LABELS[file.type]}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${PROPERTY_STATUS_COLORS[file.status]}`}>{PROPERTY_STATUS_LABELS[file.status]}</span>
                    </div>
                    <p className="text-xs text-gray-600 truncate mt-0.5">{file.owner_name}</p>
                    <p className="text-xs text-gray-400 truncate">{file.address}, {file.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — detail panel */}
        {selected && (
          <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/50">
            <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100">
              <div className="flex items-center gap-2">
                <button onClick={() => setSelected(null)} className="lg:hidden p-1 rounded hover:bg-gray-100 text-gray-400">
                  <X className="w-4 h-4" />
                </button>
                <span className="font-bold text-gray-900 text-sm">{selected.reference}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${PROPERTY_TYPE_COLORS[selected.type]}`}>{PROPERTY_TYPE_LABELS[selected.type]}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${PROPERTY_STATUS_COLORS[selected.status]}`}>{PROPERTY_STATUS_LABELS[selected.status]}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(selected)} className="text-xs px-2.5 py-1.5 border border-gray-200 hover:border-gray-300 rounded-lg text-gray-600 transition-colors">Modifier</button>
                <button onClick={() => handleArchive(selected.id)} className="text-xs px-2.5 py-1.5 border border-gray-200 hover:border-red-200 hover:text-red-500 rounded-lg text-gray-500 transition-colors">Archiver</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* File info */}
              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Informations</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-xs text-gray-400">Propriétaire</p><p className="font-medium text-gray-800">{selected.owner_name}</p></div>
                  <div><p className="text-xs text-gray-400">Adresse</p><p className="font-medium text-gray-800 truncate">{selected.address}</p></div>
                  <div><p className="text-xs text-gray-400">Ville</p><p className="font-medium text-gray-800">{selected.city}{selected.postal_code ? ` (${selected.postal_code})` : ''}</p></div>
                  <div><p className="text-xs text-gray-400">Agent</p><p className="font-medium text-gray-800">{agentName(selected.agent_id)}</p></div>
                  {selected.mandate_number && <div><p className="text-xs text-gray-400">N° mandat</p><p className="font-medium text-gray-800">{selected.mandate_number}</p></div>}
                  {selected.mandate_status && <div><p className="text-xs text-gray-400">Statut mandat</p><p className="font-medium text-gray-800">{selected.mandate_status === 'SIGNED' ? 'Signé' : 'En attente'}</p></div>}
                  {selected.is_copro && <div className="col-span-2"><span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full font-medium">Copropriété</span></div>}
                  {selected.notes && <div className="col-span-2"><p className="text-xs text-gray-400">Notes</p><p className="text-sm text-gray-700">{selected.notes}</p></div>}
                </div>
              </div>

              {/* Checklist */}
              {checklist.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Checklist documents</h3>
                    <span className="text-xs text-gray-400">{coveredRequired}/{requiredItems.length} obligatoires</span>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(checklistByCategory).map(([cat, items]) => (
                      <div key={cat}>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{cat}</p>
                        <div className="space-y-1">
                          {items.map(item => {
                            const uploaded = docs.some(d => d.filename.toLowerCase().includes(item.label.toLowerCase().split(' ')[0]) || d.category === item.label);
                            return (
                              <div key={item.id} className="flex items-center gap-2 text-xs">
                                {uploaded
                                  ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                  : <Circle className={`w-3.5 h-3.5 flex-shrink-0 ${item.required ? 'text-amber-400' : 'text-gray-300'}`} />
                                }
                                <span className={uploaded ? 'text-gray-600 line-through opacity-60' : item.required ? 'text-gray-700 font-medium' : 'text-gray-500'}>{item.label}</span>
                                {item.required && !uploaded && <span className="text-[9px] text-amber-500 font-semibold">Requis</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Documents ({docs.length})</h3>
                  <div>
                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 bg-[#1A3A5C] hover:bg-[#142d47] text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {uploading ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> : <Upload className="w-3 h-3" />}
                      Déposer
                    </button>
                  </div>
                </div>

                {docs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-300">
                    <FileText className="w-8 h-8 mb-2" />
                    <p className="text-xs">Aucun document déposé</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {docs.map(doc => (
                      <div key={doc.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 group">
                        <FileText className="w-4 h-4 text-[#1A3A5C] flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">{doc.filename}</p>
                          <p className="text-[10px] text-gray-400">{formatSize(doc.file_size)} · {new Date(doc.uploaded_at).toLocaleDateString('fr-FR')}</p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {doc.storage_path && (
                            <button onClick={() => handleDownload(doc)} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-[#1A3A5C]">
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button onClick={() => handleDeleteDoc(doc)} className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Create / Edit modal */}
      <Dialog open={modalOpen} onOpenChange={v => { if (!v) setModalOpen(false); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#1A3A5C]" />
              {editing ? 'Modifier le dossier' : 'Nouveau dossier'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Référence *</Label>
                <Input className="h-9 text-sm mt-1" placeholder="REF-2026-001" value={form.reference} onChange={e => f('reference', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Type *</Label>
                <select value={form.type} onChange={e => f('type', e.target.value)} className="w-full h-9 mt-1 px-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#1A3A5C]">
                  {TYPES.map(t => <option key={t} value={t}>{PROPERTY_TYPE_LABELS[t]}</option>)}
                </select>
              </div>
            </div>

            <div>
              <Label className="text-xs">Propriétaire *</Label>
              <Input className="h-9 text-sm mt-1" placeholder="Nom du propriétaire" value={form.owner_name} onChange={e => f('owner_name', e.target.value)} />
            </div>

            <div>
              <Label className="text-xs">Adresse *</Label>
              <Input className="h-9 text-sm mt-1" placeholder="12 rue de la Paix" value={form.address} onChange={e => f('address', e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Ville *</Label>
                <Input className="h-9 text-sm mt-1" placeholder="Paris" value={form.city} onChange={e => f('city', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Code postal</Label>
                <Input className="h-9 text-sm mt-1" placeholder="75001" value={form.postal_code} onChange={e => f('postal_code', e.target.value)} />
              </div>
            </div>

            {isSuperAdmin && (
              <div>
                <Label className="text-xs">Agent assigné</Label>
                <select value={form.agent_id} onChange={e => f('agent_id', e.target.value)} className="w-full h-9 mt-1 px-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#1A3A5C]">
                  <option value="">Non assigné</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">N° mandat</Label>
                <Input className="h-9 text-sm mt-1" placeholder="M-2026-001" value={form.mandate_number} onChange={e => f('mandate_number', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Statut mandat</Label>
                <select value={form.mandate_status} onChange={e => f('mandate_status', e.target.value)} className="w-full h-9 mt-1 px-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#1A3A5C]">
                  <option value="">—</option>
                  <option value="PENDING">En attente</option>
                  <option value="SIGNED">Signé</option>
                </select>
              </div>
            </div>

            <div>
              <Label className="text-xs">Statut dossier</Label>
              <select value={form.status} onChange={e => f('status', e.target.value as PropertyStatus)} className="w-full h-9 mt-1 px-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#1A3A5C]">
                {STATUSES.map(s => <option key={s} value={s}>{PROPERTY_STATUS_LABELS[s]}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="copro" checked={form.is_copro} onChange={e => f('is_copro', e.target.checked)} className="rounded" />
              <Label htmlFor="copro" className="text-xs cursor-pointer">Copropriété</Label>
            </div>

            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea className="text-sm mt-1 resize-none" rows={3} placeholder="Observations, informations complémentaires..." value={form.notes} onChange={e => f('notes', e.target.value)} />
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Annuler</Button>
              <Button className="flex-1 bg-[#1A3A5C] hover:bg-[#142d47]" onClick={handleSave} disabled={saving || !form.reference || !form.address || !form.city || !form.owner_name}>
                {saving ? 'Enregistrement...' : editing ? 'Mettre à jour' : 'Créer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
