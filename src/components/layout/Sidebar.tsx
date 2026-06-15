import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import logoSrc from '../../assets/Logo-der.png';
import { LayoutDashboard, FolderOpen, Users, LogOut, Shield, UserCheck, X, ChevronDown, ChevronRight, Settings2, MessageSquare, Sun, Moon, CircleHelp as HelpCircle, StickyNote, CalendarDays, Scale, Users as Users2, ArrowLeftRight, ChartBar as BarChart3, BellRing, Signature as FileSignature, FolderCheck, Archive, BookOpen, Upload, Database, SquareCheck as CheckSquare } from 'lucide-react';
import { useAppData } from '../../hooks/useAppData';
import { useAuth } from '../../hooks/useAuth';
import { useSidebarTheme } from '../../hooks/useSidebarTheme';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import type { Project } from '../../types';

const navLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord', module: null },
  { to: '/calendar', icon: CalendarDays, label: 'Agenda', module: 'module_calendar' },
  { to: '/members', icon: Users, label: 'Membres', module: null },
  { to: '/messages', icon: MessageSquare, label: 'Messages', module: 'module_messaging' },
  { to: '/memos', icon: StickyNote, label: 'Mémos', module: 'module_memos' },
  { to: '/help', icon: HelpCircle, label: 'Guide d\'utilisation', module: null },
];

const tracfinLinks = [
  { to: '/tracfin', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/tracfin/clients', icon: Users2, label: 'Clients KYC' },
  { to: '/tracfin/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/tracfin/risques', icon: BarChart3, label: 'Évaluations risque' },
  { to: '/tracfin/alertes', icon: BellRing, label: 'Alertes' },
  { to: '/tracfin/declarations', icon: FileSignature, label: 'Déclarations' },
  { to: '/tracfin/dossiers', icon: FolderCheck, label: 'Dossiers' },
  { to: '/tracfin/archive', icon: Archive, label: 'Archives' },
  { to: '/tracfin/import', icon: Upload, label: 'Import de données' },
  { to: '/tracfin/migration', icon: Database, label: 'Migration Bolt' },
  { to: '/tracfin/guide', icon: BookOpen, label: 'Guide LCB-FT' },
];

const mydocLinks = [
  { to: '/mydoc', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/mydoc/dossiers', icon: FolderOpen, label: 'Dossiers actifs' },
  { to: '/mydoc/archive', icon: Archive, label: 'Archives' },
  { to: '/mydoc/checklist', icon: CheckSquare, label: 'Checklist documents' },
];

// Theme token maps
const t = {
  dark: {
    aside: 'bg-[#1A3A5C]',
    logoBg: 'bg-white',
    adminBadgeBg: 'bg-[#B89968]/20',
    adminBadgeText: 'text-[#B89968]',
    sectionLabel: 'text-white/30 hover:text-white/50',
    impersonateBox: 'bg-white/10',
    impersonateText: 'text-white',
    impersonateSubtext: 'text-white/70',
    select: 'bg-white/10 text-white',
    selectOption: 'bg-[#1A3A5C]',
    navActive: 'bg-white/15 text-white',
    navInactive: 'text-white/60 hover:text-white hover:bg-white/10',
    navDisabled: 'text-white/25',
    navDisabledBadge: 'bg-white/10 text-white/40',
    projectActive: 'bg-white/15 text-white',
    projectInactive: 'text-white/50 hover:text-white hover:bg-white/10',
    projectCount: 'text-white/30',
    projectChevron: 'text-white/25 hover:text-white/60',
    projectLine: 'bg-white/10',
    projectsLabel: 'text-white/30 hover:text-white/50',
    signout: 'text-white/50 hover:text-white hover:bg-white/10',
    divider: 'border-white/10',
    toggleBg: 'bg-white/10 hover:bg-white/20',
    toggleIcon: 'text-white/60 hover:text-white',
    toggleActive: 'bg-white/20 text-white',
    toggleInactive: 'text-white/40 hover:text-white/70',
  },
  light: {
    aside: 'bg-white border-r border-gray-200',
    logoBg: 'bg-gray-50',
    adminBadgeBg: 'bg-amber-50',
    adminBadgeText: 'text-amber-700',
    sectionLabel: 'text-gray-400 hover:text-gray-600',
    impersonateBox: 'bg-gray-100',
    impersonateText: 'text-gray-800',
    impersonateSubtext: 'text-gray-500',
    select: 'bg-gray-100 text-gray-700',
    selectOption: 'bg-white',
    navActive: 'bg-[#1A3A5C]/10 text-[#1A3A5C] font-semibold',
    navInactive: 'text-gray-500 hover:text-[#1A3A5C] hover:bg-gray-100',
    navDisabled: 'text-gray-300',
    navDisabledBadge: 'bg-gray-100 text-gray-400',
    projectActive: 'bg-[#1A3A5C]/10 text-[#1A3A5C]',
    projectInactive: 'text-gray-400 hover:text-[#1A3A5C] hover:bg-gray-100',
    projectCount: 'text-gray-400',
    projectChevron: 'text-gray-300 hover:text-gray-500',
    projectLine: 'bg-gray-200',
    projectsLabel: 'text-gray-400 hover:text-gray-600',
    signout: 'text-gray-400 hover:text-gray-700 hover:bg-gray-100',
    divider: 'border-gray-200',
    toggleBg: 'bg-gray-100 hover:bg-gray-200',
    toggleIcon: 'text-gray-500 hover:text-gray-700',
    toggleActive: 'bg-[#1A3A5C] text-white',
    toggleInactive: 'text-gray-400 hover:text-gray-600',
  },
};

interface SidebarProps {
  onClose?: () => void;
}

interface ProjectNodeProps {
  project: Project;
  allProjects: Project[];
  getCount: (id: string) => number;
  depth: number;
  isLast: boolean;
  tk: typeof t.dark;
}

function ProjectNode({ project, allProjects, getCount, depth, isLast, tk }: ProjectNodeProps) {
  const children = allProjects
    .filter(p => p.parent_id === project.id)
    .sort((a, b) => a.sort_order - b.sort_order);
  const hasChildren = children.length > 0;
  const [open, setOpen] = useState(true);

  return (
    <div>
      <div className="flex items-stretch">
        {depth > 0 && (
          <div className="flex-shrink-0" style={{ width: `${depth * 16}px` }}>
            <div className="flex h-full">
              {Array.from({ length: depth - 1 }).map((_, i) => (
                <div key={i} className="w-4 flex justify-center">
                  <div className={`w-px ${tk.projectLine} h-full`} />
                </div>
              ))}
              <div className="w-4 flex flex-col items-center">
                <div className={`w-px ${tk.projectLine} flex-1`} style={{ minHeight: '12px' }} />
                <div className={`w-2 h-px ${tk.projectLine}`} style={{ marginTop: '-1px' }} />
                {!isLast && <div className={`w-px ${tk.projectLine} flex-1`} />}
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0 flex items-center">
          <NavLink
            to={`/projects/${project.id}`}
            className={({ isActive }) =>
              `flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all duration-150 min-w-0 ${
                isActive ? tk.projectActive : tk.projectInactive
              }`
            }
          >
            {project.is_private
              ? <span className="flex-shrink-0 text-[11px]">🔒</span>
              : <span className="flex-shrink-0 text-[11px]">📁</span>
            }
            <span className="flex-1 truncate">{project.name}</span>
            {project.is_private && (
              <span className="text-[9px] font-semibold opacity-50 flex-shrink-0">Privé</span>
            )}
            {getCount(project.id) > 0 && (
              <span className={`${tk.projectCount} text-[10px] tabular-nums flex-shrink-0`}>
                {getCount(project.id)}
              </span>
            )}
          </NavLink>

          {hasChildren && (
            <button
              onClick={() => setOpen(v => !v)}
              className={`flex-shrink-0 w-5 h-5 flex items-center justify-center transition-colors rounded ml-0.5 ${tk.projectChevron}`}
            >
              {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      {hasChildren && open && (
        <div>
          {children.map((child, i) => (
            <ProjectNode
              key={child.id}
              project={child}
              allProjects={allProjects}
              getCount={getCount}
              depth={depth + 1}
              isLast={i === children.length - 1}
              tk={tk}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ onClose }: SidebarProps = {}) {
  const { projects, tasks, members } = useAppData();
  const { signOut, isSuperAdmin, impersonatedMemberId, setImpersonatedMemberId } = useAuth();
  const { access } = useModuleAccess();
  const navigate = useNavigate();
  const location = useLocation();
  const [projectsOpen, setProjectsOpen] = useState(
    location.pathname.startsWith('/projects')
  );
  const [tracfinOpen, setTracfinOpen] = useState(location.pathname.startsWith('/tracfin'));
  const [mydocOpen, setMydocOpen] = useState(location.pathname.startsWith('/mydoc'));
  const { theme, setTheme } = useSidebarTheme();

  const tk = t[theme];

  const getProjectTaskCount = (projectId: string) =>
    tasks.filter(t => t.project_id === projectId && t.status !== 'done').length;

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const impersonatedMember = impersonatedMemberId
    ? members.find(m => m.id === impersonatedMemberId)
    : null;

  const rootProjects = projects
    .filter(p => !p.parent_id)
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <aside className={`w-[220px] h-screen flex flex-col flex-shrink-0 transition-colors duration-300 ${tk.aside}`}>
      <div className={`px-5 py-5 border-b ${tk.divider} flex items-start gap-2`}>
        <div className="flex-1 min-w-0">
          <div className={`${tk.logoBg} rounded-xl px-3 py-2.5 flex items-center justify-center`}>
            <img src={logoSrc} alt="Lotier Collab" className="h-8 w-auto object-contain" />
          </div>

          {isSuperAdmin && (
            <div className={`mt-3 flex items-center gap-1.5 ${tk.adminBadgeBg} rounded-md px-2 py-1`}>
              <Shield className={`w-3 h-3 ${tk.adminBadgeText} flex-shrink-0`} />
              <span className={`${tk.adminBadgeText} text-[10px] font-semibold uppercase tracking-wider`}>Super Admin</span>
            </div>
          )}
        </div>

        {/* Close button — only on mobile */}
        {onClose && (
          <button
            onClick={onClose}
            className={`lg:hidden mt-1 w-7 h-7 flex items-center justify-center rounded-lg transition-colors flex-shrink-0 ${tk.signout}`}
            aria-label="Fermer le menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isSuperAdmin && (
        <div className={`px-3 pt-3 pb-2 border-b ${tk.divider}`}>
          <p className={`text-[10px] font-semibold uppercase tracking-widest ${tk.sectionLabel} mb-2`}>Vue agent</p>
          {impersonatedMember ? (
            <div className={`flex items-center gap-2 ${tk.impersonateBox} rounded-lg px-2.5 py-2`}>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                style={{ backgroundColor: impersonatedMember.avatar_color }}
              >
                {impersonatedMember.initials}
              </div>
              <span className={`${tk.impersonateText} text-xs flex-1 truncate`}>{impersonatedMember.full_name}</span>
              <button
                onClick={() => setImpersonatedMemberId(null)}
                className={`${tk.impersonateSubtext} hover:opacity-100 transition-opacity`}
                title="Quitter la vue agent"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <select
              className={`w-full ${tk.select} text-xs rounded-lg px-2.5 py-2 border-0 outline-none cursor-pointer`}
              value=""
              onChange={e => e.target.value && setImpersonatedMemberId(e.target.value)}
            >
              <option value="" className={tk.selectOption}>Prendre la main sur...</option>
              {members.map(m => (
                <option key={m.id} value={m.id} className={tk.selectOption}>
                  {m.full_name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navLinks.map(({ to, icon: Icon, label, module: mod }) => {
          // Hide if module is disabled
          if (mod && !access[mod as keyof typeof access]) return null;

          if (to === '/messages') {
            return (
              <div
                key={to}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${tk.navDisabled} cursor-not-allowed relative group`}
                title="En cours de développement"
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{label}</span>
                <span className={`ml-auto text-[9px] font-semibold ${tk.navDisabledBadge} rounded px-1.5 py-0.5 leading-tight`}>Bientôt</span>
              </div>
            );
          }
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive ? tk.navActive : tk.navInactive
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          );
        })}
        {isSuperAdmin && (
          <NavLink
            to="/admin"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive ? tk.navActive : tk.navInactive
              }`
            }
          >
            <Settings2 className="w-4 h-4 flex-shrink-0" />
            Administration
          </NavLink>
        )}

        {/* MES DOSSIERS sub-menu */}
        {access.module_mydoc && (
        <div>
          <button
            onClick={() => setMydocOpen(o => !o)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              location.pathname.startsWith('/mydoc') ? tk.navActive : tk.navInactive
            }`}
          >
            <FolderCheck className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left">Mes Dossiers</span>
            {mydocOpen
              ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
              : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
            }
          </button>

          {mydocOpen && (
            <div className="mt-0.5 ml-3 pl-3 border-l border-white/10 space-y-0.5">
              {mydocLinks.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/mydoc'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                      isActive ? tk.navActive : tk.navInactive
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  {label}
                </NavLink>
              ))}
            </div>
          )}
        </div>
        )}

        {/* PROJETS sub-menu */}
        {access.module_projects && (
        <div>
          <button
            onClick={() => setProjectsOpen(o => !o)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              location.pathname.startsWith('/projects') ? tk.navActive : tk.navInactive
            }`}
          >
            <FolderOpen className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left">Projets</span>
            {projectsOpen
              ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
              : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
            }
          </button>

          {projectsOpen && (
            <div className="mt-0.5 ml-3 pl-3 border-l border-white/10 space-y-0.5">
              <NavLink
                to="/projects"
                end
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive ? tk.navActive : tk.navInactive
                  }`
                }
              >
                <LayoutDashboard className="w-3.5 h-3.5 flex-shrink-0" />
                Vue d'ensemble
              </NavLink>

              {rootProjects.length > 0 && (
                <div className="pt-1 space-y-0.5 px-1">
                  {rootProjects.map((project, i) => (
                    <ProjectNode
                      key={project.id}
                      project={project}
                      allProjects={projects}
                      getCount={getProjectTaskCount}
                      depth={0}
                      isLast={i === rootProjects.length - 1}
                      tk={tk}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {/* LOTIER TracFin sub-menu */}
        {access.module_tracfin && (
        <div className="pt-3">
          <button
            onClick={() => setTracfinOpen(o => !o)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              location.pathname.startsWith('/tracfin') ? tk.navActive : tk.navInactive
            }`}
          >
            <Scale className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left">LOTIER TracFin</span>
            {tracfinOpen
              ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
              : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
            }
          </button>

          {tracfinOpen && (
            <div className="mt-0.5 ml-3 pl-3 border-l border-white/10 space-y-0.5">
              {tracfinLinks.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/tracfin'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                      isActive ? tk.navActive : tk.navInactive
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  {label}
                </NavLink>
              ))}
            </div>
          )}
        </div>
        )}
      </nav>

      <div className={`px-3 pb-4 space-y-1 border-t ${tk.divider} pt-3`}>
        {/* Theme toggle */}
        <div className="flex items-center justify-between px-1 mb-2">
          <span className={`text-[10px] font-semibold uppercase tracking-widest ${tk.sectionLabel}`}>Thème</span>
          <div className={`flex items-center rounded-lg p-0.5 ${tk.toggleBg}`}>
            <button
              onClick={() => setTheme('light')}
              title="Thème clair"
              className={`w-7 h-7 flex items-center justify-center rounded-md transition-all duration-150 ${
                theme === 'light' ? tk.toggleActive : tk.toggleInactive
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme('dark')}
              title="Thème foncé"
              className={`w-7 h-7 flex items-center justify-center rounded-md transition-all duration-150 ${
                theme === 'dark' ? tk.toggleActive : tk.toggleInactive
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {isSuperAdmin && impersonatedMember && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/20 mb-1">
            <UserCheck className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="text-amber-300 text-xs truncate">Vue : {impersonatedMember.full_name}</span>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${tk.signout}`}
        >
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
