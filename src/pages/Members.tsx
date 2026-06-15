import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mail, ChevronRight, KeyRound, Eye, Trash2, FolderKanban, Calendar } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { Topbar } from '../components/layout/Topbar';
import { TaskListView } from '../components/tasks/TaskListView';
import { TaskDetailPanel } from '../components/tasks/TaskDetailPanel';
import { MemberAvatar } from '../components/common/MemberAvatar';
import { StatusBadge } from '../components/common/StatusBadge';
import { AgentAccountModal } from '../components/members/AgentAccountModal';
import { MemberProjectsModal } from '../components/members/MemberProjectsModal';
import { GoogleCalendarModal } from '../components/members/GoogleCalendarModal';
import { useMembers } from '../hooks/useStore';
import { useAppData } from '../hooks/useAppData';
import { useAuth } from '../hooks/useAuth';
import type { Member } from '../types';

export function Members() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const { deleteMember } = useMembers();
  const { members, projects, tasks: allTasksRaw } = useAppData();
  const tasks = memberId ? allTasksRaw.filter(t => t.assigned_to === memberId) : allTasksRaw;
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [accountModalMember, setAccountModalMember] = useState<Member | null>(null);
  const [projectsModalMember, setProjectsModalMember] = useState<Member | null>(null);
  const [calendarModalMember, setCalendarModalMember] = useState<Member | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const { memberId: authMemberId, isSuperAdmin, setImpersonatedMemberId } = useAuth();

  const currentMember = authMemberId ? members.find(m => m.id === authMemberId) : members[0];

  const handleViewAs = (member: Member, e: React.MouseEvent) => {
    e.stopPropagation();
    setImpersonatedMemberId(member.id);
    navigate('/tasks');
  };

  const handleOpenAccountModal = (member: Member, e: React.MouseEvent) => {
    e.stopPropagation();
    setAccountModalMember(member);
  };

  const handleOpenProjectsModal = (member: Member, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectsModalMember(member);
  };

  const handleOpenCalendarModal = (member: Member, e: React.MouseEvent) => {
    e.stopPropagation();
    setCalendarModalMember(member);
  };

  const handleDeleteMember = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleteConfirmId === id) {
      await deleteMember(id);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(id);
    }
  };

  if (memberId) {
    const member = members.find(m => m.id === memberId);
    return (
      <AppLayout>
        <Topbar title={member?.full_name ?? 'Membre'} />
        <main className="flex-1 p-6 overflow-auto">
          {member && (
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-4 mb-6 p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
                <MemberAvatar member={member} size="lg" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{member.full_name}</h2>
                  <p className="text-sm text-gray-500 capitalize">{member.role}</p>
                  {member.email && (
                    <p className="text-sm text-gray-400 flex items-center gap-1 mt-0.5">
                      <Mail className="w-3.5 h-3.5" />
                      {member.email}
                    </p>
                  )}
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {isSuperAdmin && (
                    <>
                      <button
                        onClick={e => handleViewAs(member, e)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1A3A5C] bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Voir sa vue
                      </button>
                      <button
                        onClick={e => handleOpenCalendarModal(member, e)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        Agenda
                      </button>
                      <button
                        onClick={e => handleOpenAccountModal(member, e)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        Compte
                      </button>
                    </>
                  )}
                  <div className="grid grid-cols-2 gap-4 text-center ml-2">
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{tasks.filter(t => t.status !== 'done').length}</p>
                      <p className="text-xs text-gray-400">En cours</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{tasks.filter(t => t.status === 'done').length}</p>
                      <p className="text-xs text-gray-400">Terminées</p>
                    </div>
                  </div>
                </div>
              </div>
              <TaskListView tasks={tasks} onTaskClick={setSelectedTaskId} />
            </div>
          )}
        </main>

        {selectedTaskId && (
          <TaskDetailPanel
            taskId={selectedTaskId}
            onClose={() => setSelectedTaskId(null)}
            projects={projects}
            members={members}
            currentMemberId={currentMember?.id}
          />
        )}

        <AgentAccountModal
          member={accountModalMember}
          open={!!accountModalMember}
          onClose={() => setAccountModalMember(null)}
        />
        <GoogleCalendarModal
          member={calendarModalMember}
          open={!!calendarModalMember}
          onClose={() => setCalendarModalMember(null)}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Topbar title="Membres" />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="grid gap-4 md:grid-cols-2">
            {members.map(member => {
              const memberTasks = allTasksRaw.filter(t => t.assigned_to === member.id);
              const activeTasks = memberTasks.filter(t => t.status !== 'done');
              const doneTasks = memberTasks.filter(t => t.status === 'done');

              return (
                <div
                  key={member.id}
                  onClick={() => navigate(`/members/${member.id}`)}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all cursor-pointer p-5"
                >
                  <div className="flex items-center gap-3">
                    <MemberAvatar member={member} size="lg" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900">{member.full_name}</h3>
                      <p className="text-xs text-gray-400 capitalize mt-0.5">{member.role}</p>
                      {member.email && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{member.email}</span>
                        </p>
                      )}
                    </div>
                    {isSuperAdmin ? (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={e => handleViewAs(member, e)}
                          title="Voir sa vue"
                          className="p-1.5 rounded-lg text-[#1A3A5C] bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={e => handleOpenProjectsModal(member, e)}
                          title="Projets visibles"
                          className="p-1.5 rounded-lg text-emerald-600 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition-colors"
                        >
                          <FolderKanban className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={e => handleOpenCalendarModal(member, e)}
                          title="Google Calendar"
                          className="p-1.5 rounded-lg text-teal-600 bg-teal-50 border border-teal-100 hover:bg-teal-100 transition-colors"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={e => handleOpenAccountModal(member, e)}
                          title="Gérer le compte"
                          className="p-1.5 rounded-lg text-gray-500 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={e => handleDeleteMember(member.id, e)}
                          title={deleteConfirmId === member.id ? 'Confirmer la suppression' : 'Supprimer le membre'}
                          className={`p-1.5 rounded-lg border transition-colors ${deleteConfirmId === member.id ? 'text-white bg-red-500 border-red-500 hover:bg-red-600' : 'text-red-400 bg-red-50 border-red-100 hover:bg-red-100'}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-gray-300 ml-1" />
                      </div>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-4">
                    <div className="text-center flex-1">
                      <p className="text-lg font-bold text-gray-800">{activeTasks.length}</p>
                      <p className="text-xs text-gray-400">Actives</p>
                    </div>
                    <div className="text-center flex-1">
                      <p className="text-lg font-bold text-green-600">{doneTasks.length}</p>
                      <p className="text-xs text-gray-400">Terminées</p>
                    </div>
                    <div className="text-center flex-1">
                      <p className="text-lg font-bold text-red-500">
                        {memberTasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length}
                      </p>
                      <p className="text-xs text-gray-400">Urgentes</p>
                    </div>
                  </div>

                  {activeTasks.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {activeTasks.slice(0, 2).map(t => (
                        <div key={t.id} className="flex items-center gap-2">
                          <StatusBadge status={t.status} />
                          <span className="text-xs text-gray-600 truncate">{t.title}</span>
                        </div>
                      ))}
                      {activeTasks.length > 2 && (
                        <p className="text-xs text-gray-400">+{activeTasks.length - 2} autres...</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <AgentAccountModal
        member={accountModalMember}
        open={!!accountModalMember}
        onClose={() => setAccountModalMember(null)}
      />

      <MemberProjectsModal
        member={projectsModalMember}
        open={!!projectsModalMember}
        onClose={() => setProjectsModalMember(null)}
        projects={projects}
      />
      <GoogleCalendarModal
        member={calendarModalMember}
        open={!!calendarModalMember}
        onClose={() => setCalendarModalMember(null)}
      />
    </AppLayout>
  );
}
