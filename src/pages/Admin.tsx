import { useState, useEffect } from 'react';
import { Building2, Users, Upload, Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronUp, CircleCheck as CheckCircle2, Eye, EyeOff, KeyRound, Save, UserPlus, LoaderCircle as Loader2, FolderLock, Search, FolderOpen, MessageSquare, BookOpen, ExternalLink, ScrollText, Mail, LayoutGrid } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { Topbar } from '../components/layout/Topbar';
import { useCoproprietes } from '../hooks/useStore';
import { useAppData } from '../hooks/useAppData';
import { AgentAccountModal } from '../components/members/AgentAccountModal';
import { MessagingAdminTab } from '../components/messaging/MessagingAdminTab';
import { ActivityLogsTab } from '../components/admin/ActivityLogsTab';
import { EmailSettingsTab } from '../components/admin/EmailSettingsTab';
import { MemberAvatar } from '../components/common/MemberAvatar';
import { useAuth } from '../hooks/useAuth';
import { getModuleAccessForUser, setModuleAccessForUser, type ModuleAccess, type ModuleKey } from '../hooks/useModuleAccess';
import { Navigate } from 'react-router-dom';
import type { Member, MemberRole, Project } from '../types';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { supabase } from '../lib/supabase';

type Tab = 'coproprietes' | 'users' | 'messaging' | 'logs' | 'email';

const AVATAR_COLORS = [
  '#1A3A5C', '#2563EB', '#0891B2', '#059669', '#D97706',
  '#DC2626', '#7C3AED', '#DB2777', '#64748B', '#B89968',
];

function randomColor() {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

function initials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]?.toUpperCase()).slice(0, 2).join('');
}

async function callManageAgent(action: string, payload: Record<string, string>) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-agent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
  });
  return res.json();
}

interface MemberFormData {
  full_name: string;
  email: string;
  role: MemberRole;
  avatar_color: string;
  avatar_url: string;
  password: string;
  appRole: 'super_admin' | 'agent';
}

function MemberFormModal({ member, open, onClose, onSaved }: {
  member: Member | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { createMember, updateMember } = useAppData();
  const [form, setForm] = useState<MemberFormData>({
    full_name: '',
    email: '',
    role: 'collaborateur',
    avatar_color: randomColor(),
    avatar_url: '',
    password: '',
    appRole: 'agent',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm({
        full_name: member?.full_name ?? '',
        email: member?.email ?? '',
        role: member?.role ?? 'collaborateur',
        avatar_color: member?.avatar_color ?? randomColor(),
        avatar_url: member?.avatar_url ?? '',
        password: '',
        appRole: 'agent',
      });
      setError('');
      setShowPassword(false);
    }
  }, [open, member]);

  const isEdit = !!member;

  const set = (k: keyof MemberFormData, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const memberPayload = {
      full_name: form.full_name.trim(),
      email: form.email.trim() || null,
      role: form.role,
      avatar_color: form.avatar_color,
      avatar_url: form.avatar_url.trim() || null,
      initials: initials(form.full_name),
    };

    if (isEdit && member) {
      const { error: err } = await updateMember(member.id, memberPayload);
      if (err) { setError(err.message); setSaving(false); return; }

      if (form.email && form.password) {
        await callManageAgent('update', { member_id: member.id, email: form.email, password: form.password });
      }
    } else {
      const { data: newMember, error: err } = await createMember(memberPayload);
      if (err || !newMember) { setError(err?.message ?? 'Erreur création'); setSaving(false); return; }

      if (form.email && form.password) {
        const result = await callManageAgent('create', {
          member_id: newMember.id,
          email: form.email,
          password: form.password,
          role: form.appRole,
        });
        if (result.error) { setError(result.error); setSaving(false); return; }
      }
    }

    setSaving(false);
    onSaved();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#1A3A5C] flex items-center gap-2">
            {isEdit ? <Pencil className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {isEdit ? `Modifier ${member?.full_name}` : 'Nouvel utilisateur'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <Label>Nom complet *</Label>
            <Input value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Jean Martin" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Rôle dans l'équipe</Label>
              <Select value={form.role} onValueChange={v => set('role', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="collaborateur">Collaborateur</SelectItem>
                  <SelectItem value="prestataire">Prestataire</SelectItem>
                  <SelectItem value="syndic">Syndic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!isEdit && (
              <div className="space-y-1.5">
                <Label>Droits d'accès</Label>
                <Select value={form.appRole} onValueChange={v => set('appRole', v as 'super_admin' | 'agent')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Photo de profil (URL)</Label>
            <div className="flex gap-3 items-center">
              {form.avatar_url ? (
                <img
                  src={form.avatar_url}
                  alt="Aperçu"
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-gray-200"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: form.avatar_color }}
                >
                  {initials(form.full_name) || '?'}
                </div>
              )}
              <Input
                type="url"
                value={form.avatar_url}
                onChange={e => set('avatar_url', e.target.value)}
                placeholder="https://exemple.com/photo.jpg"
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Couleur avatar (si pas de photo)</Label>
            <div className="flex gap-2 flex-wrap">
              {AVATAR_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set('avatar_color', c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${form.avatar_color === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Compte de connexion</p>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="agent@exemple.com" />
            </div>
            <div className="space-y-1.5">
              <Label>{isEdit ? 'Nouveau mot de passe' : 'Mot de passe'}</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  placeholder={isEdit ? 'Laisser vide pour ne pas changer' : 'Min. 6 caractères'}
                  className="pr-9"
                  required={!isEdit}
                  minLength={form.password ? 6 : undefined}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Annuler</Button>
            <Button type="submit" disabled={saving || !form.full_name.trim()} className="flex-1 bg-[#1A3A5C] hover:bg-[#142d47] text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? <><Save className="w-3.5 h-3.5 mr-1.5" />Enregistrer</> : <><UserPlus className="w-3.5 h-3.5 mr-1.5" />Créer</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProjectAccessModal({ member, open, onClose, projects }: {
  member: Member | null;
  open: boolean;
  onClose: () => void;
  projects: Project[];
}) {
  const [allowedIds, setAllowedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [isRestricted, setIsRestricted] = useState(false);

  useEffect(() => {
    if (!open || !member) return;
    setLoading(true);
    setSearch('');
    supabase
      .from('member_project_access')
      .select('project_id')
      .eq('member_id', member.id)
      .then(({ data }) => {
        const ids = new Set((data ?? []).map((r: { project_id: string }) => r.project_id));
        setAllowedIds(ids);
        setIsRestricted(ids.size > 0);
        setLoading(false);
      });
  }, [open, member]);

  const toggleProject = (id: string) => {
    setAllowedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!member) return;
    setSaving(true);
    await supabase.from('member_project_access').delete().eq('member_id', member.id);
    if (isRestricted && allowedIds.size > 0) {
      await supabase.from('member_project_access').insert(
        [...allowedIds].map(project_id => ({ member_id: member.id, project_id }))
      );
    }
    setSaving(false);
    onClose();
  };

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const topLevel = filtered.filter(p => !p.parent_id);
  const childrenOf = (id: string) => filtered.filter(p => p.parent_id === id);

  if (!open || !member) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[85vh]">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-[#1A3A5C] flex items-center gap-2">
              <FolderLock className="w-4 h-4" />
              Accès aux projets
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{member.full_name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-gray-100 flex-shrink-0 space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => setIsRestricted(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium border transition-all ${
                !isRestricted ? 'bg-[#1A3A5C] text-white border-[#1A3A5C]' : 'text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Tous les projets
            </button>
            <button
              onClick={() => setIsRestricted(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium border transition-all ${
                isRestricted ? 'bg-[#1A3A5C] text-white border-[#1A3A5C]' : 'text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
            >
              <FolderLock className="w-3.5 h-3.5" />
              Accès restreint
            </button>
          </div>
          {isRestricted && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un projet..."
                className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1A3A5C]/30 focus:border-[#1A3A5C]/40"
              />
            </div>
          )}
        </div>

        {isRestricted && (
          <div className="flex-1 overflow-y-auto px-4 py-2">
            {loading ? (
              <div className="text-center py-8 text-gray-400 text-sm">Chargement...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">Aucun projet trouvé</div>
            ) : (
              <div className="space-y-1 py-1">
                {topLevel.map(project => (
                  <div key={project.id}>
                    <button
                      onClick={() => toggleProject(project.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                        allowedIds.has(project.id) ? 'bg-[#1A3A5C]/5' : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
                      <span className="flex-1 text-sm font-medium text-gray-800 truncate">{project.name}</span>
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        allowedIds.has(project.id) ? 'bg-[#1A3A5C] border-[#1A3A5C]' : 'border-gray-300'
                      }`}>
                        {allowedIds.has(project.id) && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                    </button>
                    {childrenOf(project.id).map(child => (
                      <button
                        key={child.id}
                        onClick={() => toggleProject(child.id)}
                        className={`w-full flex items-center gap-3 pl-8 pr-3 py-1.5 rounded-lg transition-colors text-left ${
                          allowedIds.has(child.id) ? 'bg-[#1A3A5C]/5' : 'hover:bg-gray-50'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: child.color }} />
                        <span className="flex-1 text-xs text-gray-600 truncate">{child.name}</span>
                        <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          allowedIds.has(child.id) ? 'bg-[#1A3A5C] border-[#1A3A5C]' : 'border-gray-300'
                        }`}>
                          {allowedIds.has(child.id) && <Check className="w-2 h-2 text-white" />}
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!isRestricted && (
          <div className="flex-1 flex items-center justify-center px-6 py-8 text-center">
            <div>
              <FolderOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-600">{member.full_name} verra tous les projets</p>
              <p className="text-xs text-gray-400 mt-1">Aucune restriction d'accès</p>
            </div>
          </div>
        )}

        <div className="border-t border-gray-100 px-6 py-4 flex-shrink-0 flex gap-2">
          {isRestricted && (
            <p className="flex-1 text-xs text-gray-400 self-center">
              {allowedIds.size} projet{allowedIds.size !== 1 ? 's' : ''} sélectionné{allowedIds.size !== 1 ? 's' : ''}
            </p>
          )}
          <Button variant="outline" onClick={onClose} className="shrink-0">Annuler</Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#1A3A5C] hover:bg-[#142d47] text-white shrink-0"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
            Enregistrer
          </Button>
        </div>
      </div>
    </div>
  );
}

const MODULE_LABELS: { key: ModuleKey; label: string; desc: string }[] = [
  { key: 'module_projects', label: 'Projets', desc: 'Accès à la gestion des projets et tâches Kanban' },
  { key: 'module_tasks', label: 'Tâches', desc: 'Accès à la liste des tâches (vue liste & Kanban)' },
  { key: 'module_messaging', label: 'Messagerie', desc: 'Accès à la messagerie interne' },
  { key: 'module_memos', label: 'Mémos', desc: 'Accès aux mémos et notes' },
  { key: 'module_calendar', label: 'Agenda', desc: 'Accès au calendrier et synchronisation Google' },
  { key: 'module_tracfin', label: 'TRACFIN / LCB-FT', desc: 'Accès complet au module TRACFIN (clients, transactions, déclarations…)' },
  { key: 'module_mydoc', label: 'Mes Dossiers', desc: 'Accès à la gestion documentaire des dossiers immobiliers' },
];

function ModuleAccessModal({ member, open, onClose }: {
  member: Member | null;
  open: boolean;
  onClose: () => void;
}) {
  const { session } = useAuth();
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [access, setAccess] = useState<ModuleAccess>({
    module_memos: true, module_calendar: true, module_messaging: true,
    module_tracfin: true, module_projects: true, module_tasks: true, module_mydoc: true,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!open || !member) return;
    setLoading(true);
    setSaved(false);
    // Resolve auth_user_id from user_roles table
    supabase
      .from('user_roles')
      .select('auth_user_id')
      .eq('member_id', member.id)
      .maybeSingle()
      .then(async ({ data }) => {
        const uid = data?.auth_user_id ?? null;
        setAuthUserId(uid);
        if (uid) {
          const a = await getModuleAccessForUser(uid);
          setAccess(a);
        }
        setLoading(false);
      });
  }, [open, member?.id]);

  const toggle = (key: ModuleKey) => setAccess(a => ({ ...a, [key]: !a[key] }));

  const handleSave = async () => {
    if (!authUserId || !session?.user.id) return;
    setSaving(true);
    const { error } = await setModuleAccessForUser(authUserId, access, session.user.id);
    setSaving(false);
    if (error) {
      alert(`Erreur lors de la sauvegarde : ${error.message}`);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!open || !member) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <MemberAvatar member={member} size="sm" />
            <div>
              <p className="text-sm font-bold text-gray-900">{member.full_name}</p>
              <p className="text-xs text-gray-400">Accès aux modules</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          {loading ? (
            <div className="py-8 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : (
            MODULE_LABELS.map(m => (
              <div key={m.key} className="flex items-center gap-3">
                <button
                  onClick={() => toggle(m.key)}
                  className={`relative w-10 h-6 rounded-full flex-shrink-0 transition-colors ${access[m.key] ? 'bg-[#1A3A5C]' : 'bg-gray-200'}`}>
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${access[m.key] ? 'left-5' : 'left-1'}`} />
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${access[m.key] ? 'text-gray-900' : 'text-gray-400'}`}>{m.label}</p>
                  <p className="text-xs text-gray-400 leading-tight">{m.desc}</p>
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${access[m.key] ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                  {access[m.key] ? 'Activé' : 'Désactivé'}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="h-9 text-xs">Fermer</Button>
          <Button
            onClick={handleSave}
            disabled={saving || loading}
            className={`h-9 text-xs ${saved ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#1A3A5C] hover:bg-[#142d47]'} text-white`}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : saved ? <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
            {saved ? 'Enregistré' : 'Enregistrer'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function CoproprietesTab() {
  const { coproprietes, loading, createCopropriete, bulkCreateCoproprietes, updateCopropriete, deleteCopropriete } = useCoproprietes();
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [showBulk, setShowBulk] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await createCopropriete(newName.trim());
    setNewName('');
  };

  const handleBulkImport = async () => {
    const names = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
    if (names.length === 0) return;
    setImporting(true);
    const { inserted } = await bulkCreateCoproprietes(names);
    setImportResult(`${inserted} copropriété${inserted > 1 ? 's' : ''} importée${inserted > 1 ? 's' : ''} sur ${names.length} lignes.`);
    setBulkText('');
    setShowBulk(false);
    setImporting(false);
  };

  const handleSaveEdit = async () => {
    if (!editId || !editName.trim()) return;
    await updateCopropriete(editId, { name: editName.trim(), address: editAddress });
    setEditId(null);
  };

  const active = coproprietes.filter(c => c.active);
  const inactive = coproprietes.filter(c => !c.active);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <form onSubmit={handleAdd} className="flex gap-2 flex-1 max-w-md">
          <Input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Nom de la copropriété..."
            className="flex-1"
          />
          <Button type="submit" disabled={!newName.trim()} className="bg-[#1A3A5C] hover:bg-[#142d47] text-white px-3">
            <Plus className="w-4 h-4" />
          </Button>
        </form>
        <button
          onClick={() => { setShowBulk(v => !v); setImportResult(null); }}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          Import en masse
          {showBulk ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {showBulk && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <p className="text-xs text-gray-500">Collez une liste de noms, un par ligne :</p>
          <Textarea
            value={bulkText}
            onChange={e => setBulkText(e.target.value)}
            placeholder={"Résidence Les Pins\nLe Belvédère\nCopropriété du Lac"}
            rows={6}
            className="font-mono text-xs"
          />
          <div className="flex items-center gap-2">
            <Button
              onClick={handleBulkImport}
              disabled={!bulkText.trim() || importing}
              className="bg-[#1A3A5C] hover:bg-[#142d47] text-white"
            >
              {importing ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
              Importer
            </Button>
            <button onClick={() => setShowBulk(false)} className="text-sm text-gray-500 hover:text-gray-700">Annuler</button>
          </div>
        </div>
      )}

      {importResult && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {importResult}
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-gray-400 text-sm">Chargement...</div>
      ) : coproprietes.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Aucune copropriété</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {coproprietes.length} copropriété{coproprietes.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {[...active, ...inactive].map(c => (
              <div key={c.id} className={`px-4 py-3 flex items-center gap-3 group ${!c.active ? 'opacity-50' : ''}`}>
                {editId === c.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <Input value={editName} onChange={e => setEditName(e.target.value)} className="flex-1 h-8 text-sm" autoFocus />
                    <Input value={editAddress} onChange={e => setEditAddress(e.target.value)} placeholder="Adresse (optionnel)" className="flex-1 h-8 text-sm" />
                    <button onClick={handleSaveEdit} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-7 h-7 rounded-lg bg-[#1A3A5C]/8 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-3.5 h-3.5 text-[#1A3A5C]/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{c.name}</p>
                      {c.address && <p className="text-xs text-gray-400 truncate">{c.address}</p>}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => updateCopropriete(c.id, { active: !c.active })}
                        className={`p-1.5 rounded-lg transition-colors text-xs font-medium ${c.active ? 'text-gray-400 hover:bg-gray-100' : 'text-green-600 hover:bg-green-50'}`}
                        title={c.active ? 'Désactiver' : 'Activer'}
                      >
                        {c.active ? <X className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => { setEditId(c.id); setEditName(c.name); setEditAddress(c.address); }}
                        className="p-1.5 text-gray-400 hover:text-[#1A3A5C] hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {confirmDeleteId === c.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => { deleteCopropriete(c.id); setConfirmDeleteId(null); }} className="text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors">Oui</button>
                          <button onClick={() => setConfirmDeleteId(null)} className="text-xs font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 px-2 py-1 rounded transition-colors">Non</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(c.id)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function UsersTab() {
  const { members, membersLoading: loading, refetchMembers: refetch, deleteMember, projects } = useAppData();
  const [showForm, setShowForm] = useState(false);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [accountModalMember, setAccountModalMember] = useState<Member | null>(null);
  const [projectAccessMember, setProjectAccessMember] = useState<Member | null>(null);
  const [moduleAccessMember, setModuleAccessMember] = useState<Member | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => { setEditMember(null); setShowForm(true); }}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#1A3A5C] hover:bg-[#142d47] text-white text-sm font-medium rounded-lg transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Nouvel utilisateur
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400 text-sm">Chargement...</div>
      ) : members.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Aucun utilisateur</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="divide-y divide-gray-100">
            {members.map(member => (
              <div key={member.id} className="px-4 py-3.5 flex items-center gap-3 group hover:bg-gray-50 transition-colors">
                <MemberAvatar member={member} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{member.full_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400 capitalize">{member.role}</span>
                    {member.email && <span className="text-xs text-gray-400">{member.email}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setAccountModalMember(member)}
                    className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-500 hover:text-[#1A3A5C] hover:bg-blue-50 border border-gray-200 rounded-lg transition-colors"
                    title="Gérer le compte"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    Compte
                  </button>
                  <button
                    onClick={() => setModuleAccessMember(member)}
                    className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-500 hover:text-[#1A3A5C] hover:bg-blue-50 border border-gray-200 rounded-lg transition-colors"
                    title="Accès aux modules"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    Modules
                  </button>
                  <button
                    onClick={() => setProjectAccessMember(member)}
                    className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-500 hover:text-[#1A3A5C] hover:bg-blue-50 border border-gray-200 rounded-lg transition-colors"
                    title="Accès aux projets"
                  >
                    <FolderLock className="w-3.5 h-3.5" />
                    Projets
                  </button>
                  <button
                    onClick={() => { setEditMember(member); setShowForm(true); }}
                    className="p-1.5 text-gray-400 hover:text-[#1A3A5C] hover:bg-blue-50 rounded-lg transition-colors"
                    title="Modifier"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  {confirmDeleteId === member.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => { deleteMember(member.id); setConfirmDeleteId(null); }} className="text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors">Oui</button>
                      <button onClick={() => setConfirmDeleteId(null)} className="text-xs font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 px-2 py-1 rounded transition-colors">Non</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(member.id)}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <MemberFormModal
        member={editMember}
        open={showForm}
        onClose={() => setShowForm(false)}
        onSaved={refetch}
      />

      <AgentAccountModal
        member={accountModalMember}
        open={!!accountModalMember}
        onClose={() => setAccountModalMember(null)}
      />

      <ProjectAccessModal
        member={projectAccessMember}
        open={!!projectAccessMember}
        onClose={() => setProjectAccessMember(null)}
        projects={projects}
      />

      <ModuleAccessModal
        member={moduleAccessMember}
        open={!!moduleAccessMember}
        onClose={() => setModuleAccessMember(null)}
      />
    </div>
  );
}

export function Admin() {
  const { isSuperAdmin } = useAuth();
  const { members } = useAppData();
  const [tab, setTab] = useState<Tab>('coproprietes');

  if (!isSuperAdmin) return <Navigate to="/" replace />;

  return (
    <AppLayout>
      <Topbar title="Administration" />
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setTab('coproprietes')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'coproprietes' ? 'bg-white text-[#1A3A5C] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Building2 className="w-4 h-4" />
              Copropriétés
            </button>
            <button
              onClick={() => setTab('users')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'users' ? 'bg-white text-[#1A3A5C] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Users className="w-4 h-4" />
              Utilisateurs
            </button>
            <button
              onClick={() => setTab('messaging')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'messaging' ? 'bg-white text-[#1A3A5C] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <MessageSquare className="w-4 h-4" />
              Messagerie
            </button>
            <button
              onClick={() => setTab('logs')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'logs' ? 'bg-white text-[#1A3A5C] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <ScrollText className="w-4 h-4" />
              Journaux
            </button>
            <button
              onClick={() => setTab('email')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'email' ? 'bg-white text-[#1A3A5C] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Mail className="w-4 h-4" />
              Emails
            </button>
          </div>

          {tab === 'coproprietes' && <CoproprietesTab />}
          {tab === 'users' && <UsersTab />}
          {tab === 'messaging' && <MessagingAdminTab members={members} />}
          {tab === 'logs' && <ActivityLogsTab />}
          {tab === 'email' && <EmailSettingsTab />}

          {/* Tutoriel prestataires */}
          <div className="mt-8 flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#1A3A5C]/10 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-4 h-4 text-[#1A3A5C]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Tutoriel prestataires</p>
                <p className="text-xs text-gray-400">Guide PDF de première connexion à transmettre aux prestataires</p>
              </div>
            </div>
            <a
              href="/tutorial"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A3A5C] text-white text-sm font-semibold hover:bg-[#142d47] transition-colors shadow-sm flex-shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Ouvrir
            </a>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
