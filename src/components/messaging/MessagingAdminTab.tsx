import { useState } from 'react';
import { Plus, Trash2, Users, X, Pencil, MessageSquare, ChevronDown, ChevronRight, Search, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useMessagingTeams } from '../../hooks/useMessaging';
import type { Member, MessagingTeam } from '../../types';
import { MemberAvatar } from '../common/MemberAvatar';

interface TeamModalProps {
  team: MessagingTeam | null;
  members: Member[];
  onClose: () => void;
  onSave: (name: string, memberIds: string[]) => Promise<void>;
}

function TeamModal({ team, members, onClose, onSave }: TeamModalProps) {
  const [name, setName] = useState(team?.name ?? '');
  const [selected, setSelected] = useState<string[]>(team?.members?.map(m => m.id) ?? []);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = members.filter(m =>
    m.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave(name.trim(), selected);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-[#1A3A5C]">
            {team ? 'Modifier l\'équipe' : 'Nouvelle équipe'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Nom de l'équipe</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex : Équipe Syndic, Support..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A5C]/20 focus:border-[#1A3A5C]"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Membres ({selected.length})</label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A3A5C]/20"
              />
            </div>
            <div className="space-y-1 max-h-52 overflow-y-auto">
              {filtered.map(m => (
                <label key={m.id} className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors ${selected.includes(m.id) ? 'bg-[#1A3A5C]/6' : 'hover:bg-gray-50'}`}>
                  <input
                    type="checkbox"
                    checked={selected.includes(m.id)}
                    onChange={() => toggle(m.id)}
                    className="rounded accent-[#1A3A5C]"
                  />
                  <MemberAvatar member={m} size="sm" />
                  <span className="text-sm text-gray-800">{m.full_name}</span>
                  <span className="ml-auto text-[10px] text-gray-400 capitalize">{m.role}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-medium">
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="flex-1 px-4 py-2.5 text-sm text-white bg-[#1A3A5C] hover:bg-[#1A3A5C]/90 rounded-xl transition-colors font-medium disabled:opacity-40"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ContactsModalProps {
  member: Member;
  allMembers: Member[];
  onClose: () => void;
  onSave: (memberIds: string[]) => Promise<void>;
  initialContacts: string[];
}

function ContactsModal({ member, allMembers, onClose, onSave, initialContacts }: ContactsModalProps) {
  const [selected, setSelected] = useState<string[]>(initialContacts);
  const [isRestricted, setIsRestricted] = useState(initialContacts.length > 0);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const others = allMembers.filter(m => m.id !== member.id);
  const filtered = others.filter(m =>
    m.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSave = async () => {
    setSaving(true);
    await onSave(isRestricted ? selected : []);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-[#1A3A5C]">Contacts autorisés</h2>
            <p className="text-xs text-gray-400">{member.full_name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-gray-100 space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => { setIsRestricted(false); setSelected([]); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium border transition-all ${!isRestricted ? 'bg-[#1A3A5C] text-white border-[#1A3A5C]' : 'text-gray-500 border-gray-200 hover:border-gray-300'}`}
            >
              <Users className="w-3.5 h-3.5" />
              Tout le monde
            </button>
            <button
              onClick={() => setIsRestricted(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium border transition-all ${isRestricted ? 'bg-[#1A3A5C] text-white border-[#1A3A5C]' : 'text-gray-500 border-gray-200 hover:border-gray-300'}`}
            >
              <Shield className="w-3.5 h-3.5" />
              Contacts restreints
            </button>
          </div>
          {isRestricted && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A3A5C]/20"
              />
            </div>
          )}
        </div>

        {isRestricted ? (
          <div className="flex-1 overflow-y-auto px-4 py-2">
            <div className="space-y-1">
              {filtered.map(m => (
                <label key={m.id} className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors ${selected.includes(m.id) ? 'bg-[#1A3A5C]/6' : 'hover:bg-gray-50'}`}>
                  <input
                    type="checkbox"
                    checked={selected.includes(m.id)}
                    onChange={() => toggle(m.id)}
                    className="rounded accent-[#1A3A5C]"
                  />
                  <MemberAvatar member={m} size="sm" />
                  <span className="text-sm text-gray-800">{m.full_name}</span>
                </label>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center px-6 py-8 text-center">
            <div>
              <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-600">{member.full_name} peut contacter tout le monde</p>
              <p className="text-xs text-gray-400 mt-1">Aucune restriction</p>
            </div>
          </div>
        )}

        <div className="border-t border-gray-100 px-6 py-4 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-medium">
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2.5 text-sm text-white bg-[#1A3A5C] hover:bg-[#1A3A5C]/90 rounded-xl transition-colors font-medium disabled:opacity-40"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface Props {
  members: Member[];
}

export function MessagingAdminTab({ members }: Props) {
  const { teams, loading, createTeam, updateTeamMembers, deleteTeam, updateMemberContacts, getMemberContacts } = useMessagingTeams();
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editTeam, setEditTeam] = useState<MessagingTeam | null>(null);
  const [contactsForMember, setContactsForMember] = useState<Member | null>(null);
  const [memberContacts, setMemberContacts] = useState<string[]>([]);
  const [teamsOpen, setTeamsOpen] = useState(true);
  const [contactsOpen, setContactsOpen] = useState(true);
  const [confirmDeleteTeamId, setConfirmDeleteTeamId] = useState<string | null>(null);

  const openContactsModal = async (member: Member) => {
    const contacts = await getMemberContacts(member.id);
    setMemberContacts(contacts);
    setContactsForMember(member);
  };

  const handleSaveContacts = async (contactIds: string[]) => {
    if (!contactsForMember) return;
    await updateMemberContacts(contactsForMember.id, contactIds);
  };

  const handleSaveTeam = async (name: string, memberIds: string[]) => {
    if (editTeam) {
      await supabasePatch(editTeam.id, name, memberIds);
    } else {
      await createTeam(name, memberIds);
    }
  };

  async function supabasePatch(teamId: string, name: string, memberIds: string[]) {
    await supabase.from('messaging_teams').update({ name }).eq('id', teamId);
    await updateTeamMembers(teamId, memberIds);
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <button
          onClick={() => setTeamsOpen(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1A3A5C]/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-[#1A3A5C]" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-800">Équipes de messagerie</p>
              <p className="text-xs text-gray-400">Groupes prédéfinis pour les conversations</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={e => { e.stopPropagation(); setEditTeam(null); setShowTeamModal(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#1A3A5C] hover:bg-[#1A3A5C]/90 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Nouvelle équipe
            </button>
            {teamsOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
          </div>
        </button>

        {teamsOpen && (
          <div className="border-t border-gray-100">
            {loading ? (
              <div className="py-8 text-center text-sm text-gray-400">Chargement...</div>
            ) : teams.length === 0 ? (
              <div className="py-8 text-center">
                <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Aucune équipe créée</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {teams.map(team => (
                  <div key={team.id} className="px-5 py-3.5 flex items-center gap-3 group hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{team.name}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {(team.members ?? []).slice(0, 5).map(m => (
                          <MemberAvatar key={m.id} member={m} size="sm" />
                        ))}
                        {(team.members ?? []).length > 5 && (
                          <span className="text-[10px] text-gray-400">+{(team.members ?? []).length - 5}</span>
                        )}
                        <span className="text-xs text-gray-400 ml-1">{(team.members ?? []).length} membre{(team.members ?? []).length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditTeam(team); setShowTeamModal(true); }}
                        className="p-1.5 text-gray-400 hover:text-[#1A3A5C] hover:bg-blue-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {confirmDeleteTeamId === team.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => { deleteTeam(team.id); setConfirmDeleteTeamId(null); }} className="text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors">Oui</button>
                          <button onClick={() => setConfirmDeleteTeamId(null)} className="text-xs font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 px-2 py-1 rounded transition-colors">Non</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteTeamId(team.id)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <button
          onClick={() => setContactsOpen(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1A3A5C]/10 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-[#1A3A5C]" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-800">Contacts autorisés par membre</p>
              <p className="text-xs text-gray-400">Définissez avec qui chaque membre peut communiquer</p>
            </div>
          </div>
          {contactsOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
        </button>

        {contactsOpen && (
          <div className="border-t border-gray-100 divide-y divide-gray-50">
            {members.map(m => (
              <div key={m.id} className="px-5 py-3 flex items-center gap-3 group hover:bg-gray-50 transition-colors">
                <MemberAvatar member={m} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{m.full_name}</p>
                  <p className="text-xs text-gray-400 capitalize">{m.role}</p>
                </div>
                <button
                  onClick={() => openContactsModal(m)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-[#1A3A5C] hover:bg-blue-50 border border-gray-200 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Contacts
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showTeamModal && (
        <TeamModal
          team={editTeam}
          members={members}
          onClose={() => { setShowTeamModal(false); setEditTeam(null); }}
          onSave={handleSaveTeam}
        />
      )}

      {contactsForMember && (
        <ContactsModal
          member={contactsForMember}
          allMembers={members}
          initialContacts={memberContacts}
          onClose={() => setContactsForMember(null)}
          onSave={handleSaveContacts}
        />
      )}
    </div>
  );
}
