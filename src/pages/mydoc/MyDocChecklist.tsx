import { useState, useEffect, useCallback } from 'react';
import { SquareCheck as CheckSquare, Plus, Trash2, Search } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Topbar } from '../../components/layout/Topbar';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import type { ChecklistItem, PropertyType } from '../../types/mydoc';
import { PROPERTY_TYPE_LABELS } from '../../types/mydoc';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';

const TYPES: PropertyType[] = ['VENTE', 'LOCATION', 'GESTION', 'DIVERS'];

const defaultForm = {
  property_type: 'VENTE' as PropertyType,
  label: '',
  category: '',
  required: false,
  order_index: 0,
};

export function MyDocChecklist() {
  const { isSuperAdmin } = useAuth();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<PropertyType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ ...defaultForm });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('property_checklist_items').select('*').order('property_type').order('order_index');
    setItems(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!isSuperAdmin) return <Navigate to="/mydoc" replace />;

  const f = (field: string, val: unknown) => setForm(p => ({ ...p, [field]: val }));

  const handleSave = async () => {
    if (!form.label || !form.category) return;
    setSaving(true);
    const { data } = await supabase.from('property_checklist_items').insert({
      ...form, active: true, created_at: new Date().toISOString(),
    }).select().single();
    if (data) setItems(prev => [...prev, data]);
    setSaving(false);
    setModalOpen(false);
    setForm({ ...defaultForm });
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from('property_checklist_items').update({ active: !active }).eq('id', id);
    setItems(prev => prev.map(x => x.id === id ? { ...x, active: !x.active } : x));
  };

  const handleDelete = async (id: string) => {
    await supabase.from('property_checklist_items').delete().eq('id', id);
    setItems(prev => prev.filter(x => x.id !== id));
  };

  const filtered = items.filter(i => {
    const q = search.toLowerCase();
    const matchSearch = !q || i.label.toLowerCase().includes(q) || i.category.toLowerCase().includes(q);
    const matchType = filterType === 'all' || i.property_type === filterType;
    return matchSearch && matchType;
  });

  const grouped = TYPES.reduce<Record<PropertyType, ChecklistItem[]>>((acc, t) => {
    acc[t] = filtered.filter(i => i.property_type === t);
    return acc;
  }, {} as Record<PropertyType, ChecklistItem[]>);

  return (
    <AppLayout>
      <Topbar
        title="Checklist documents"
        actions={
          <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A3A5C] hover:bg-[#142d47] text-white text-sm font-medium rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
            Ajouter un élément
          </button>
        }
      />

      <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="mb-5">
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-[#1A3A5C]" />
              Gestion de la checklist
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Documents requis par type de dossier</p>
          </div>

          <div className="flex flex-wrap gap-2 mb-5">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input className="pl-9 h-9 text-sm" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select value={filterType} onChange={e => setFilterType(e.target.value as PropertyType | 'all')} className="h-9 px-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#1A3A5C]">
              <option value="all">Tous les types</option>
              {TYPES.map(t => <option key={t} value={t}>{PROPERTY_TYPE_LABELS[t]}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />)}</div>
          ) : (
            <div className="space-y-5">
              {TYPES.filter(t => filterType === 'all' || filterType === t).map(type => (
                grouped[type].length > 0 && (
                  <div key={type} className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-gray-800">{PROPERTY_TYPE_LABELS[type]}</h2>
                      <span className="text-xs text-gray-400">{grouped[type].length} élément(s)</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {grouped[type].map(item => (
                        <div key={item.id} className={`flex items-center gap-3 px-4 py-3 group ${!item.active ? 'opacity-50' : ''}`}>
                          <span className="text-xs text-gray-400 w-5 tabular-nums">{item.order_index}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800">{item.label}</p>
                            <p className="text-xs text-gray-400">{item.category}{item.required && <span className="ml-2 text-amber-500 font-semibold">Requis</span>}</p>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => toggleActive(item.id, item.active)} className="text-xs px-2 py-1 border border-gray-200 rounded text-gray-500 hover:border-gray-300 transition-colors">
                              {item.active ? 'Désactiver' : 'Activer'}
                            </button>
                            <button onClick={() => handleDelete(item.id)} className="p-1 hover:bg-red-50 rounded text-gray-300 hover:text-red-500 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      </main>

      <Dialog open={modalOpen} onOpenChange={v => { if (!v) setModalOpen(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un élément de checklist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs">Type de dossier</Label>
              <select value={form.property_type} onChange={e => f('property_type', e.target.value)} className="w-full h-9 mt-1 px-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#1A3A5C]">
                {TYPES.map(t => <option key={t} value={t}>{PROPERTY_TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Libellé du document *</Label>
              <Input className="h-9 text-sm mt-1" placeholder="Ex: Pièce d'identité" value={form.label} onChange={e => f('label', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Catégorie *</Label>
              <Input className="h-9 text-sm mt-1" placeholder="Ex: Identité, Diagnostics, Mandat..." value={form.category} onChange={e => f('category', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Ordre d'affichage</Label>
                <Input type="number" className="h-9 text-sm mt-1" value={form.order_index} onChange={e => f('order_index', parseInt(e.target.value) || 0)} />
              </div>
              <div className="flex items-end pb-0.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.required} onChange={e => f('required', e.target.checked)} className="rounded" />
                  <span className="text-xs text-gray-700">Document requis</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Annuler</Button>
              <Button className="flex-1 bg-[#1A3A5C] hover:bg-[#142d47]" onClick={handleSave} disabled={saving || !form.label || !form.category}>
                {saving ? 'Enregistrement...' : 'Ajouter'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
