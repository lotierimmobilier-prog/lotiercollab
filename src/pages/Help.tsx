import { useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { useAuth } from '../hooks/useAuth';
import { LayoutDashboard, FolderOpen, SquareCheck as CheckSquare, Users, MessageSquare, Settings2, ChevronDown, ChevronRight, BookOpen, Kanban, Shield, Sun, ArrowRight, Info, Zap, RefreshCw } from 'lucide-react';

interface Section {
  id: string;
  icon: React.ElementType;
  title: string;
  color: string;
  steps: Step[];
}

interface Step {
  title: string;
  description: string;
  tips?: string[];
  adminOnly?: boolean;
}

const sections: Section[] = [
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    title: 'Tableau de bord',
    color: '#1A3A5C',
    steps: [
      {
        title: 'Vue d\'ensemble',
        description: 'Le tableau de bord affiche un résumé de votre activité : tâches en cours, projets actifs, tâches en retard et indicateurs clés. C\'est votre point de départ quotidien.',
      },
      {
        title: 'Tâches récentes',
        description: 'Les dernières tâches qui vous sont assignées apparaissent directement ici. Cliquez sur une tâche pour voir ses détails et y accéder rapidement.',
      },
      {
        title: 'Indicateurs de progression',
        description: 'Des compteurs affichent en temps réel le nombre de tâches par statut (à faire, en cours, terminées) et les tâches dont l\'échéance est dépassée.',
      },
    ],
  },
  {
    id: 'projects',
    icon: FolderOpen,
    title: 'Projets',
    color: '#0369a1',
    steps: [
      {
        title: 'Navigation dans les projets',
        description: 'La barre latérale gauche affiche l\'arborescence complète de vos projets. Les projets peuvent avoir des sous-projets imbriqués. Le chiffre à droite indique le nombre de tâches non terminées.',
      },
      {
        title: 'Sélectionner un projet',
        description: 'Cliquez sur un projet dans la sidebar pour voir toutes ses tâches. La vue se filtre automatiquement sur le projet sélectionné.',
      },
      {
        title: 'Créer un projet',
        description: 'Sur la page Projets, utilisez le bouton "+ Nouveau projet" pour créer un projet ou sous-projet. Choisissez un nom, une couleur, et éventuellement un projet parent.',
        adminOnly: true,
      },
      {
        title: 'Déplier / replier l\'arborescence',
        description: 'Les flèches à côté des projets permettent de déplier ou replier leurs sous-projets dans la sidebar pour faciliter la navigation.',
      },
    ],
  },
  {
    id: 'tasks',
    icon: CheckSquare,
    title: 'Tâches',
    color: '#047857',
    steps: [
      {
        title: 'Deux modes d\'affichage',
        description: 'La page Tâches propose deux vues : le mode Kanban (colonnes par statut) et le mode Liste (tableau). Basculez entre les deux avec les boutons en haut à droite.',
        tips: [
          'Kanban : idéal pour visualiser l\'avancement',
          'Liste : idéal pour trier, filtrer et traiter en masse',
        ],
      },
      {
        title: 'Créer une tâche',
        description: 'Cliquez sur "+ Nouvelle tâche" pour créer une tâche. Renseignez le titre, le projet, la priorité, la date d\'échéance et le(s) responsable(s).',
      },
      {
        title: 'Modifier une tâche',
        description: 'Cliquez sur n\'importe quelle tâche pour ouvrir le panneau de détail sur la droite. Vous pouvez y modifier tous les champs, ajouter des commentaires et changer le statut.',
      },
      {
        title: 'Changer le statut',
        description: 'Dans le mode Kanban, glissez-déposez une tâche d\'une colonne à l\'autre pour changer son statut. En mode Liste, utilisez le menu ou le panneau de détail.',
      },
      {
        title: 'Filtrer et rechercher',
        description: 'Utilisez la barre de filtres (icône filtre) pour affiner par projet, statut, priorité ou responsable. La barre de recherche filtre par mot-clé dans le titre.',
      },
      {
        title: 'Priorités',
        description: 'Chaque tâche a une priorité : Urgente (rouge), Haute (orange), Normale (bleue) ou Basse (grise). Elles s\'affichent comme des badges colorés sur chaque tâche.',
      },
      {
        title: 'Assignation multiple',
        description: 'Une tâche peut être assignée à plusieurs responsables. Tous les responsables voient la tâche dans leur vue personnelle.',
      },
      {
        title: 'Sélection en masse (mode Liste)',
        description: 'En mode Liste, maintenez le clic et faites glisser pour sélectionner plusieurs tâches à la fois (lasso). Une barre d\'actions apparaît en bas pour les modifier en lot.',
        tips: [
          'Assigner en masse : cliquez sur l\'icône utilisateur dans la barre',
          'Vous pouvez "Remplacer" ou "Ajouter" des responsables sur toute la sélection',
        ],
      },
      {
        title: 'Tâches récurrentes',
        description: 'Lors de la création, vous pouvez définir une récurrence (quotidienne, hebdomadaire, mensuelle). La tâche se recrée automatiquement après être marquée comme terminée.',
      },
    ],
  },
  {
    id: 'members',
    icon: Users,
    title: 'Membres',
    color: '#b45309',
    steps: [
      {
        title: 'Liste des membres',
        description: 'La page Membres affiche tous les collaborateurs et prestataires de l\'équipe avec leur rôle, leurs coordonnées et leurs tâches en cours.',
      },
      {
        title: 'Fiche membre',
        description: 'Cliquez sur un membre pour voir sa fiche détaillée : les projets auxquels il a accès et les tâches qui lui sont assignées.',
      },
      {
        title: 'Créer un membre / compte agent',
        description: 'Depuis la page Membres, le super admin peut créer un compte agent avec email et mot de passe. Le membre reçoit ainsi un accès à l\'application.',
        adminOnly: true,
      },
      {
        title: 'Accès aux projets',
        description: 'Chaque membre peut être assigné à des projets spécifiques pour contrôler ce qu\'il voit dans son tableau de bord.',
        adminOnly: true,
      },
    ],
  },
  {
    id: 'messaging',
    icon: MessageSquare,
    title: 'Messagerie',
    color: '#0891b2',
    steps: [
      {
        title: 'Conversations',
        description: 'La messagerie permet d\'échanger directement avec les membres de l\'équipe. Les conversations sont listées sur la gauche, organisées par contact.',
      },
      {
        title: 'Envoyer un message',
        description: 'Sélectionnez une conversation ou créez-en une nouvelle, puis rédigez votre message dans le champ en bas et validez avec Entrée ou le bouton d\'envoi.',
      },
      {
        title: 'Citer une tâche',
        description: 'Dans le compositeur de message, vous pouvez citer une tâche existante pour créer un lien direct entre la conversation et la tâche concernée.',
      },
      {
        title: 'Pièces jointes',
        description: 'Il est possible de joindre des fichiers à vos messages pour partager des documents avec vos interlocuteurs.',
      },
    ],
  },
  {
    id: 'admin',
    icon: Settings2,
    title: 'Administration',
    color: '#7c3aed',
    steps: [
      {
        title: 'Accès réservé',
        description: 'La page Administration est uniquement accessible aux comptes Super Admin. Elle centralise la gestion des membres, copropriétés et paramètres globaux.',
        adminOnly: true,
      },
      {
        title: 'Gestion des copropriétés',
        description: 'Créez et gérez les copropriétés (immeubles) pour organiser les projets par bâtiment. Chaque copropriété peut contenir plusieurs projets.',
        adminOnly: true,
      },
      {
        title: 'Vue agent (impersonation)',
        description: 'Le super admin peut "prendre la main" sur le compte d\'un agent pour voir exactement ce qu\'il voit. Utilisez le sélecteur en haut de la sidebar.',
        adminOnly: true,
      },
      {
        title: 'Configuration messagerie',
        description: 'L\'onglet Messagerie dans l\'administration permet de configurer les contacts disponibles dans la messagerie interne.',
        adminOnly: true,
      },
    ],
  },
  {
    id: 'interface',
    icon: Sun,
    title: 'Interface & personnalisation',
    color: '#475569',
    steps: [
      {
        title: 'Thème clair / sombre',
        description: 'En bas de la sidebar, utilisez les boutons Soleil et Lune pour basculer entre le thème clair et le thème sombre. Votre préférence est sauvegardée.',
      },
      {
        title: 'Navigation rapide',
        description: 'Utilisez la sidebar pour naviguer entre les sections. Les projets sont accessibles directement depuis l\'arborescence sans passer par la page Projets.',
      },
      {
        title: 'Panneau de détail',
        description: 'En cliquant sur une tâche, le panneau de détail s\'ouvre sur la droite sans quitter la page. Fermez-le avec la croix ou en cliquant ailleurs.',
      },
    ],
  },
];

function StepCard({ step, index }: { step: Step; index: number }) {
  return (
    <div className="flex gap-4 group">
      <div className="flex-shrink-0 flex flex-col items-center">
        <div className="w-7 h-7 rounded-full bg-[#1A3A5C] text-white text-xs font-bold flex items-center justify-center shadow-sm">
          {index + 1}
        </div>
        <div className="w-px flex-1 bg-gray-100 mt-2" />
      </div>
      <div className="pb-6 flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-sm font-semibold text-gray-800">{step.title}</h4>
          {step.adminOnly && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full">
              <Shield className="w-2.5 h-2.5" />
              Admin
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
        {step.tips && step.tips.length > 0 && (
          <ul className="mt-2 space-y-1">
            {step.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-[#1A3A5C]">
                <ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SectionCard({ section, defaultOpen }: { section: Section; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const Icon = section.icon;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${section.color}15` }}
        >
          <Icon className="w-5 h-5" style={{ color: section.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-800">{section.title}</h3>
          <p className="text-xs text-gray-400">{section.steps.length} étape{section.steps.length > 1 ? 's' : ''}</p>
        </div>
        <div className="flex-shrink-0 text-gray-300">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>
      </button>

      {open && (
        <div className="px-6 pt-2 pb-2 border-t border-gray-50">
          <div className="pt-4">
            {section.steps.map((step, i) => (
              <StepCard key={i} step={step} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function Help() {
  const { isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'admin'>('all');

  const visibleSections = sections.filter(s => {
    if (activeTab === 'admin') return s.steps.some(st => st.adminOnly);
    return true;
  });

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-2xl bg-[#1A3A5C]/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-[#1A3A5C]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Guide d'utilisation</h1>
              <p className="text-sm text-gray-400">Tout ce qu'il faut savoir pour utiliser la plateforme</p>
            </div>
          </div>
        </div>

        {/* Quick tips */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          {[
            { icon: Kanban, title: 'Kanban & Liste', desc: 'Deux vues pour gérer vos tâches', color: '#047857' },
            { icon: Zap, title: 'Actions en masse', desc: 'Sélectionnez par lasso en liste', color: '#0369a1' },
            { icon: RefreshCw, title: 'Tâches récurrentes', desc: 'Automatisez les tâches répétitives', color: '#b45309' },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-700 leading-tight">{title}</p>
                <p className="text-[11px] text-gray-400 leading-tight mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        {isSuperAdmin && (
          <div className="flex gap-2 mb-5">
            {[
              { id: 'all', label: 'Toutes les sections' },
              { id: 'admin', label: 'Fonctions Admin' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'all' | 'admin')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#1A3A5C] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Admin note */}
        {isSuperAdmin && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-6">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Les étapes marquées <span className="font-semibold">Admin</span> sont uniquement disponibles pour les comptes Super Admin.
            </p>
          </div>
        )}

        {/* Sections */}
        <div className="space-y-3">
          {visibleSections.map((section, i) => (
            <SectionCard key={section.id} section={section} defaultOpen={i === 0} />
          ))}
        </div>

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-xs text-gray-400">Lotier Immobilier — Plateforme de gestion interne</p>
        </div>
      </div>
    </AppLayout>
  );
}
