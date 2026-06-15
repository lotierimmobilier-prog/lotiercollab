import { useRef } from 'react';
import { LogIn, LayoutDashboard, SquareCheck as CheckSquare, MessageSquare, Printer, ChevronRight, CircleAlert as AlertCircle, CircleCheck as CheckCircle2, User, Bell, Search, Filter, ArrowRight, Info, Kanban, List, Send, Paperclip, Star, Calendar, Flag, StickyNote, FolderOpen } from 'lucide-react';
import logoUrl from '../assets/Logo-der.png';

import screenshotLogin from '../assets/screenshot-login.png';
import screenshotLanding from '../assets/screenshot-landing.png';
import screenshotDashboard from '../assets/screenshot-dashboard.png';
import screenshotKanban from '../assets/screenshot-kanban.png';

// ── Screenshot wrapper ─────────────────────────────────────────
function ScreenshotFrame({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-lg bg-white">
      <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 border-b border-gray-200">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        <span className="ml-2 text-[10px] text-gray-400 font-mono">{alt}</span>
      </div>
      <img src={src} alt={alt} className="w-full object-cover object-top" style={{ maxHeight: 320 }} />
      {caption && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-500 italic">{caption}</p>
        </div>
      )}
    </div>
  );
}

// ── Step component ──────────────────────────────────────────────
function Step({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-[#1A3A5C] text-white text-sm font-bold flex items-center justify-center shadow">
          {num}
        </div>
        <div className="w-px flex-1 bg-gray-200 mt-2" />
      </div>
      <div className="pb-8 flex-1 min-w-0 pt-0.5">
        <h3 className="text-base font-bold text-gray-900 mb-3">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mt-4">
      <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-amber-800">{children}</p>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mt-4">
      <Star className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-blue-800">{children}</p>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, color, number }: { icon: React.ElementType; title: string; color: string; number: number }) {
  return (
    <div className="flex items-center gap-4 mb-8 pb-4 border-b-2" style={{ borderColor: color }}>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm" style={{ backgroundColor: color }}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color }}>Section {number}</p>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      </div>
    </div>
  );
}

// ── Cover mockup using real screenshot ─────────────────────────
function CoverMockup() {
  return (
    <div className="relative w-full">
      {/* Glow */}
      <div className="absolute inset-0 rounded-3xl blur-3xl scale-110" style={{ background: 'radial-gradient(ellipse, rgba(184,161,106,0.25), transparent 70%)' }} />

      {/* Browser shell with real screenshot */}
      <div className="relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl">
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/10" style={{ background: 'rgba(0,0,0,0.35)' }}>
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
          <div className="flex-1 mx-3 rounded-md px-2 py-0.5 text-[9px]" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }}>lotiercollab.com</div>
        </div>
        <img src={screenshotLanding} alt="Lotier Collab" className="w-full object-cover object-top" style={{ maxHeight: 260 }} />
      </div>

      {/* Floating badge */}
      <div className="absolute -right-3 top-10 bg-white rounded-xl shadow-2xl border border-gray-100 px-3 py-2 flex items-center gap-2"
        style={{ animation: 'coverFloat 3s ease-in-out infinite' }}>
        <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#dcfce7' }}>
          <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#16a34a' }} />
        </div>
        <div>
          <p className="text-[9px] font-bold text-gray-800">Tâche terminée</p>
          <p className="text-[8px] text-gray-400">État des lieux validé</p>
        </div>
      </div>
    </div>
  );
}

// ── Cover page ──────────────────────────────────────────────────
function CoverPage() {
  return (
    <div className="min-h-screen flex relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1A3A5C 0%, #0d2238 65%, #1a3a5c 100%)' }}>
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #B89968, transparent)', transform: 'translate(30%, -30%)' }} />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #B89968, transparent)', transform: 'translate(-30%, 30%)' }} />
      <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

      {/* Left column */}
      <div className="relative z-10 w-[48%] flex flex-col justify-between px-14 py-14">
        <div>
          <div className="inline-block bg-white rounded-xl px-5 py-3">
            <img src={logoUrl} alt="Lotier Immobilier" className="h-10 w-auto" />
          </div>
        </div>

        <div>
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold mb-6"
            style={{ background: 'rgba(184,161,106,0.2)', border: '1px solid rgba(184,161,106,0.4)', color: '#B89968' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#B89968' }} />
            Guide de première utilisation
          </div>

          <h1 className="text-5xl font-bold text-white leading-tight mb-5">
            Bienvenue sur<br />
            <span style={{ color: '#B89968' }}>Lotier</span><br />
            Collab
          </h1>

          <p className="text-base leading-relaxed max-w-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Ce guide vous accompagne dans vos premières connexions à la plateforme et explique comment gérer vos tâches, projets et messages au quotidien.
          </p>

          <div className="flex flex-wrap gap-2 mt-8">
            {[
              { icon: LogIn, label: 'Connexion' },
              { icon: CheckSquare, label: 'Tâches' },
              { icon: FolderOpen, label: 'Projets' },
              { icon: MessageSquare, label: 'Messagerie' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}>
                <Icon className="w-3 h-3" style={{ color: '#B89968' }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="w-10 h-px mb-5" style={{ background: 'rgba(184,161,106,0.5)' }} />
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Document confidentiel · Lotier Immobilier · {new Date().getFullYear()}
          </p>
          <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Guide collaborateurs — v2.0 — {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Right column — real screenshot */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-8 py-14">
        <CoverMockup />

        <div className="mt-6 rounded-2xl border border-white/10 overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="px-4 py-2.5 border-b border-white/10">
            <p className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>Au programme</p>
          </div>
          <div className="px-4 py-2 grid grid-cols-2 gap-x-4 gap-y-1">
            {[
              { n: '01', label: 'Connexion à la plateforme' },
              { n: '02', label: 'Tableau de bord' },
              { n: '03', label: 'Gestion des tâches & projets' },
              { n: '04', label: 'Messagerie interne' },
            ].map(item => (
              <div key={item.n} className="flex items-center gap-2 py-1">
                <span className="text-[9px] font-bold" style={{ color: '#B89968' }}>{item.n}</span>
                <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes coverFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}

// ── Table of contents ───────────────────────────────────────────
function TableOfContents() {
  const items = [
    { num: 1, title: 'Connexion à la plateforme', sub: 'Accès, identifiants, page d\'accueil, interface' },
    { num: 2, title: 'Tableau de bord', sub: 'Vue d\'ensemble, indicateurs, recherche globale, navigation' },
    { num: 3, title: 'Vos tâches & projets', sub: 'Kanban, liste, détail, statuts, priorités, commentaires' },
    { num: 4, title: 'Messagerie', sub: 'Conversations, messages, pièces jointes' },
  ];
  return (
    <div className="min-h-screen px-16 py-16 flex flex-col">
      <div className="mb-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#b8a16a] mb-2">Sommaire</p>
        <h2 className="text-4xl font-bold text-gray-900">Table des matières</h2>
      </div>
      <div className="space-y-4 flex-1">
        {items.map(item => (
          <div key={item.num} className="flex items-start gap-6 py-5 border-b border-gray-100">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg font-bold text-white shadow-sm" style={{ background: '#1A3A5C' }}>
              {item.num}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
              <p className="text-sm text-gray-400 mt-0.5">{item.sub}</p>
            </div>
            <div className="flex items-center gap-1 text-gray-300">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-auto pt-8 border-t border-gray-100 flex items-center justify-between">
        <img src={logoUrl} alt="Lotier" className="h-7 opacity-40" />
        <p className="text-xs text-gray-400">Guide collaborateurs — v2.0 — {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
      </div>
    </div>
  );
}

// ── Main export ─────────────────────────────────────────────────
export function Tutorial() {
  const ref = useRef<HTMLDivElement>(null);
  const handlePrint = () => window.print();

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="no-print fixed top-4 right-4 z-50 flex items-center gap-2">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1A3A5C] text-white text-sm font-semibold rounded-xl shadow-lg hover:bg-[#142d47] transition-colors"
        >
          <Printer className="w-4 h-4" />
          Imprimer / Exporter PDF
        </button>
      </div>

      <div ref={ref} className="tutorial-document">

        {/* ── Page 1 : Cover ── */}
        <div className="page">
          <CoverPage />
        </div>

        {/* ── Page 2 : ToC ── */}
        <div className="page">
          <TableOfContents />
        </div>

        {/* ── Page 3 : Connexion ── */}
        <div className="page">
          <div className="px-16 py-14">
            <SectionTitle icon={LogIn} title="Connexion à la plateforme" color="#1A3A5C" number={1} />

            <Step num={1} title="Accéder à la plateforme">
              <p className="text-gray-600 leading-relaxed mb-4">
                Ouvrez votre navigateur web (Chrome, Firefox, Safari ou Edge) et rendez-vous sur l'adresse fournie par votre gestionnaire Lotier.
                Vous arrivez sur la page d'accueil publique de Lotier Collab.
              </p>
              <ScreenshotFrame
                src={screenshotLanding}
                alt="lotiercollab.com"
                caption="Page d'accueil — cliquez sur « Accéder à la plateforme » ou « Connexion » pour vous identifier."
              />
              <Note>
                Gardez précieusement vos identifiants (email + mot de passe). En cas d'oubli, contactez votre gestionnaire Lotier pour une réinitialisation.
              </Note>
            </Step>

            <Step num={2} title="Saisir vos identifiants">
              <p className="text-gray-600 leading-relaxed mb-4">
                Entrez votre <strong>adresse email</strong> et votre <strong>mot de passe</strong> transmis par votre gestionnaire.
                Cliquez sur <strong>"Se connecter"</strong> pour accéder à votre espace.
              </p>
              <ScreenshotFrame
                src={screenshotLogin}
                alt="lotiercollab.com/login"
                caption="Formulaire de connexion — saisissez votre email et votre mot de passe, puis cliquez sur « Se connecter »."
              />
              <div className="grid grid-cols-2 gap-4 mt-4">
                {[
                  { label: 'Email', value: 'Votre email professionnel (ex: prenom.nom@lotier.com)', icon: User },
                  { label: 'Mot de passe', value: 'Fourni par votre gestionnaire Lotier Immobilier', icon: Flag },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-start gap-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="w-8 h-8 rounded-lg bg-[#1A3A5C]/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-[#1A3A5C]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">{label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Step>

            <Step num={3} title="Découvrir l'interface principale">
              <p className="text-gray-600 leading-relaxed mb-4">
                Une fois connecté, vous arrivez sur votre tableau de bord. L'interface est composée de deux zones principales :
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1A3A5C]/5 border border-[#1A3A5C]/15 rounded-xl p-4">
                  <p className="text-sm font-bold text-[#1A3A5C] mb-2">Barre latérale gauche</p>
                  <ul className="space-y-1.5">
                    {['Tableau de bord', 'Projets', 'Membres', 'Messages', 'Mémos', 'Guide d\'utilisation'].map(item => (
                      <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                        <ChevronRight className="w-3 h-3 text-[#1A3A5C]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-sm font-bold text-gray-700 mb-2">Zone principale</p>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Le contenu de la section sélectionnée s'affiche ici. La navigation est instantanée et ne recharge pas la page entière.
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                    <Bell className="w-3.5 h-3.5 text-[#1A3A5C]" />
                    <span>L'icône cloche en haut à droite affiche vos notifications.</span>
                  </div>
                </div>
              </div>
            </Step>
          </div>
        </div>

        {/* ── Page 4 : Dashboard ── */}
        <div className="page">
          <div className="px-16 py-14">
            <SectionTitle icon={LayoutDashboard} title="Tableau de bord" color="#0369a1" number={2} />

            <Step num={1} title="Lire votre tableau de bord">
              <p className="text-gray-600 leading-relaxed mb-4">
                Dès la connexion, le tableau de bord affiche un résumé complet de votre activité : tâches actives, échéances, retards et projets en cours.
              </p>
              <ScreenshotFrame
                src={screenshotDashboard}
                alt="lotiercollab.com/dashboard"
                caption="Tableau de bord — vue d'ensemble de vos tâches, projets et activité récente."
              />
            </Step>

            <Step num={2} title="Comprendre les indicateurs">
              <div className="grid grid-cols-4 gap-3 mt-2">
                {[
                  { label: 'Tâches actives', desc: 'Total des tâches non terminées qui vous sont assignées', color: 'bg-[#1A3A5C]/5 border-[#1A3A5C]/15', dot: 'bg-[#1A3A5C]', icon: CheckSquare },
                  { label: 'Échéances aujourd\'hui', desc: 'Tâches dont la date d\'échéance est fixée à aujourd\'hui', color: 'bg-amber-50 border-amber-200', dot: 'bg-amber-400', icon: Calendar },
                  { label: 'En retard', desc: 'Tâches dont la date d\'échéance est dépassée', color: 'bg-red-50 border-red-200', dot: 'bg-red-500', icon: AlertCircle },
                  { label: 'Terminées (semaine)', desc: 'Tâches complétées avec succès cette semaine', color: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle2 },
                ].map(({ label, desc, color, dot }) => (
                  <div key={label} className={`rounded-xl border p-3 ${color}`}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className={`w-2 h-2 rounded-full ${dot}`} />
                      <span className="text-xs font-bold text-gray-800">{label}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
              <Tip>
                Les tâches "En retard" sont signalées en rouge. Traitez-les en priorité pour respecter votre planning.
              </Tip>
            </Step>

            <Step num={3} title="Utiliser la barre de recherche globale">
              <p className="text-gray-600 leading-relaxed mb-3">
                Le tableau de bord intègre une barre de recherche qui couvre toute la plateforme : tâches, projets, mémos et conversations.
              </p>
              <div className="flex items-center gap-3 h-11 bg-white border border-gray-200 rounded-2xl px-4 shadow-sm mb-3">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-400">Rechercher tâches, projets, mémos, messages…</span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { icon: CheckSquare, label: 'Tâches', color: 'text-[#1A3A5C]', bg: 'bg-[#1A3A5C]/8' },
                  { icon: FolderOpen, label: 'Projets', color: 'text-[#B89968]', bg: 'bg-[#B89968]/10' },
                  { icon: StickyNote, label: 'Mémos', color: 'text-amber-600', bg: 'bg-amber-50' },
                  { icon: MessageSquare, label: 'Messages', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                ].map(({ icon: Icon, label, color, bg }) => (
                  <div key={label} className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${bg}`}>
                      <Icon className={`w-3.5 h-3.5 ${color}`} />
                    </div>
                    <span className="text-xs font-semibold text-gray-600">{label}</span>
                  </div>
                ))}
              </div>
            </Step>

            <Step num={4} title="Accéder rapidement à une tâche">
              <p className="text-gray-600 leading-relaxed">
                Dans la liste "Activité récente", cliquez directement sur une tâche pour ouvrir son panneau de détail.
                Les avatars des membres assignés sont affichés pour chaque tâche.
              </p>
            </Step>
          </div>
        </div>

        {/* ── Page 5 : Tasks & Projects ── */}
        <div className="page">
          <div className="px-16 py-14">
            <SectionTitle icon={CheckSquare} title="Vos tâches & projets" color="#047857" number={3} />

            <Step num={1} title="Vue Kanban par projet">
              <p className="text-gray-600 leading-relaxed mb-4">
                Chaque projet s'affiche en vue Kanban : les tâches sont organisées par colonnes de statut (À faire, En cours, Terminé, etc.).
                Les membres assignés apparaissent en bas de chaque carte.
              </p>
              <ScreenshotFrame
                src={screenshotKanban}
                alt="lotiercollab.com/projects/…"
                caption="Vue Kanban d'un projet — chaque colonne représente un statut. Les avatars en bas des cartes indiquent les collaborateurs assignés."
              />
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Kanban className="w-4 h-4 text-[#1A3A5C]" />
                    <span className="text-sm font-bold text-gray-800">Vue Kanban</span>
                  </div>
                  <p className="text-sm text-gray-500">Cartes organisées par colonnes. Visualisez l'avancement global du projet en un coup d'œil.</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <List className="w-4 h-4 text-[#1A3A5C]" />
                    <span className="text-sm font-bold text-gray-800">Vue Liste</span>
                  </div>
                  <p className="text-sm text-gray-500">Tableau compact avec toutes les tâches, triable par priorité, statut ou échéance.</p>
                </div>
              </div>
            </Step>

            <Step num={2} title="Comprendre les priorités">
              <p className="text-gray-600 leading-relaxed mb-4">
                Chaque tâche possède un niveau de priorité visible sur les cartes et dans la liste.
              </p>
              <div className="flex flex-wrap gap-3">
                {[
                  { label: 'Urgente', color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500', desc: 'À traiter immédiatement' },
                  { label: 'Haute', color: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-400', desc: 'Dès que possible' },
                  { label: 'Normale', color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-400', desc: 'Dans les délais prévus' },
                  { label: 'Faible', color: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400', desc: 'Quand le temps le permet' },
                ].map(p => (
                  <div key={p.label} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-2.5">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${p.color}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                      {p.label}
                    </div>
                    <span className="text-sm text-gray-500">{p.desc}</span>
                  </div>
                ))}
              </div>
            </Step>

            <Step num={3} title="Collaborateurs par projet">
              <p className="text-gray-600 leading-relaxed mb-3">
                Sur chaque carte de tâche, les avatars empilés en bas à droite indiquent tous les membres assignés.
                Jusqu'à 3 avatars sont visibles, le reste est résumé par un badge <strong>+N</strong>.
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-4">
                  {/* Exemple carte */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 w-52">
                    <p className="text-sm font-medium text-gray-800 mb-1">Résidence Le Belvédère</p>
                    <div className="flex items-center gap-1.5 mb-3">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-xs text-gray-400">Facturation des honoraires</span>
                    </div>
                    <div className="flex justify-end">
                      <div className="flex items-center -space-x-1.5">
                        {[{ initials: 'SL', color: '#7C3AED' }, { initials: 'TT', color: '#059669' }].map((m, i) => (
                          <div key={m.initials} className="w-6 h-6 rounded-full ring-2 ring-white flex items-center justify-center text-[9px] font-bold text-white" style={{ background: m.color, zIndex: i }}>
                            {m.initials}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 leading-relaxed">Les initiales en couleur représentent les membres de l'équipe assignés à cette tâche. Vous voyez immédiatement qui travaille sur quoi.</p>
                  </div>
                </div>
              </div>
            </Step>
          </div>
        </div>

        {/* ── Page 6 : Tasks detail ── */}
        <div className="page">
          <div className="px-16 py-14">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#047857] mb-1">Section 3 (suite)</p>
              <h2 className="text-2xl font-bold text-gray-900">Tâches — Détail et statuts</h2>
            </div>

            <Step num={4} title="Ouvrir le détail d'une tâche">
              <p className="text-gray-600 leading-relaxed mb-4">
                Cliquez sur n'importe quelle carte pour ouvrir son panneau de détail à droite de l'écran.
                Ce panneau affiche toutes les informations et reste visible pendant la navigation.
              </p>
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <span className="text-sm font-bold text-gray-800">Détail de la tâche</span>
                  <span className="text-xs text-gray-400">Panneau latéral droit</span>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3">
                  {[
                    { label: 'Titre', value: 'Facturation des honoraires' },
                    { label: 'Projet', value: 'Résidence Le Belvédère' },
                    { label: 'Statut', value: 'À faire', badge: 'bg-gray-100 text-gray-600' },
                    { label: 'Priorité', value: 'Urgente', badge: 'bg-red-100 text-red-700' },
                    { label: 'Échéance', value: '30 avr. 2026', badge: 'bg-amber-50 text-amber-700' },
                    { label: 'Assignés', value: 'SL, TT', badge: 'bg-[#1A3A5C]/8 text-[#1A3A5C]' },
                  ].map(({ label, value, badge }) => (
                    <div key={label} className="flex flex-col gap-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</span>
                      {badge
                        ? <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg w-fit ${badge}`}>{value}</span>
                        : <span className="text-sm font-medium text-gray-700">{value}</span>
                      }
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-100 p-4">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 block mb-2">Commentaire</span>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-400">
                    Ajoutez un commentaire sur cette tâche…
                  </div>
                  <div className="flex justify-end mt-2">
                    <div className="bg-[#1A3A5C] text-white text-xs font-semibold px-3 py-1.5 rounded-lg">Envoyer</div>
                  </div>
                </div>
              </div>
              <Tip>
                Les commentaires sont visibles par votre gestionnaire et tous les membres assignés. C'est le bon endroit pour signaler un problème ou partager une mise à jour.
              </Tip>
            </Step>

            <Step num={5} title="Les statuts des tâches">
              <p className="text-gray-600 leading-relaxed mb-4">
                Chaque tâche évolue à travers des statuts personnalisables définis par votre gestionnaire (ex. À faire, En cours, Terminé, Problème).
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { label: 'À faire', color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
                  { label: 'En cours', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
                  { label: 'Terminé', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
                  { label: 'Problème', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
                ].map((s, i, arr) => (
                  <div key={s.label} className="flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold ${s.color}`}>
                      <div className={`w-2 h-2 rounded-full ${s.dot}`} />
                      {s.label}
                    </div>
                    {i < arr.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />}
                  </div>
                ))}
              </div>
            </Step>

            <Step num={6} title="Filtrer et rechercher vos tâches">
              <p className="text-gray-600 leading-relaxed mb-3">
                Depuis la page Projets, utilisez les filtres de colonnes pour naviguer par statut.
                Depuis le tableau de bord, la barre de recherche globale couvre tâches, projets, mémos et messages.
              </p>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-3">
                <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                  <Search className="w-4 h-4 text-gray-300" />
                  <span className="text-sm text-gray-400">Rechercher tâches, projets, mémos, messages…</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">Filtres</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">Échéance</span>
                </div>
              </div>
            </Step>
          </div>
        </div>

        {/* ── Page 7 : Messaging ── */}
        <div className="page">
          <div className="px-16 py-14">
            <SectionTitle icon={MessageSquare} title="Messagerie" color="#0891b2" number={4} />

            <Step num={1} title="Accéder à la messagerie">
              <p className="text-gray-600 leading-relaxed mb-4">
                Cliquez sur <strong>Messages</strong> dans la barre latérale gauche. L'interface affiche la liste de vos
                conversations à gauche et les messages de la conversation sélectionnée à droite.
              </p>
              {/* Mockup messagerie textuel */}
              <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-md bg-white">
                <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 border-b border-gray-200">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  <span className="ml-2 text-[10px] text-gray-400 font-mono">lotiercollab.com/messages</span>
                </div>
                <div className="flex h-52">
                  {/* sidebar */}
                  <div className="w-36 bg-[#1A3A5C] flex-shrink-0 flex flex-col py-3 gap-1 px-2">
                    {['Tableau de bord','Projets','Membres','Messages','Mémos'].map((item, i) => (
                      <div key={item} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[9px] font-medium ${i === 3 ? 'bg-white/20 text-white' : 'text-white/50'}`}>
                        <div className="w-2.5 h-2.5 bg-current rounded-sm opacity-60" />
                        {item}
                      </div>
                    ))}
                  </div>
                  {/* conversations */}
                  <div className="w-32 border-r border-gray-100 flex-shrink-0">
                    <div className="px-2 py-2 border-b border-gray-100">
                      <div className="bg-[#1A3A5C] text-white text-[9px] font-semibold text-center py-1 rounded-lg">+ Nouvelle conv.</div>
                    </div>
                    {[
                      { name: 'Stéphanie L.', msg: 'Bonjour, merci pour...', time: '09:12', unread: true },
                      { name: 'Tristan M.', msg: 'La tâche est bien...', time: 'hier', unread: false },
                    ].map(c => (
                      <div key={c.name} className={`px-2 py-2 border-b border-gray-50 ${c.unread ? 'bg-blue-50/50' : ''}`}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[9px] font-semibold text-gray-700">{c.name}</span>
                          <span className="text-[7px] text-gray-400">{c.time}</span>
                        </div>
                        <p className="text-[8px] text-gray-400 truncate">{c.msg}</p>
                      </div>
                    ))}
                  </div>
                  {/* chat */}
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#7C3AED] flex items-center justify-center text-white text-[8px] font-bold">SL</div>
                      <span className="text-[9px] font-semibold text-gray-700">Stéphanie L.</span>
                    </div>
                    <div className="flex-1 p-2 space-y-2 overflow-hidden">
                      <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-xl rounded-tl-sm px-2 py-1.5 max-w-[70%]">
                          <p className="text-[8px] text-gray-700">Bonjour, pouvez-vous traiter la facturation en priorité ?</p>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <div className="bg-[#1A3A5C] rounded-xl rounded-tr-sm px-2 py-1.5 max-w-[70%]">
                          <p className="text-[8px] text-white">Oui, je m'en occupe aujourd'hui.</p>
                        </div>
                      </div>
                    </div>
                    <div className="px-2 py-1.5 border-t border-gray-100 flex items-center gap-1.5">
                      <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-[8px] text-gray-400">Écrire un message...</div>
                      <div className="w-5 h-5 rounded-lg bg-[#1A3A5C] flex items-center justify-center">
                        <Send className="w-2.5 h-2.5 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Step>

            <Step num={2} title="Lire et envoyer un message">
              <p className="text-gray-600 leading-relaxed mb-4">
                Sélectionnez une conversation dans la liste de gauche pour afficher les messages.
                Rédigez votre réponse dans le champ en bas et appuyez sur <strong>Entrée</strong> ou cliquez sur l'icône d'envoi.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Mes messages', desc: 'Vos messages apparaissent alignés à droite en bleu marine', align: 'right', color: 'bg-[#1A3A5C] text-white' },
                  { label: 'Messages reçus', desc: 'Les messages de votre interlocuteur apparaissent à gauche en gris', align: 'left', color: 'bg-gray-100 text-gray-700' },
                ].map(m => (
                  <div key={m.label} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <p className="text-sm font-bold text-gray-700 mb-2">{m.label}</p>
                    <div className={`flex ${m.align === 'right' ? 'justify-end' : 'justify-start'} mb-2`}>
                      <div className={`text-xs px-3 py-2 rounded-xl max-w-[80%] ${m.color}`}>Exemple de message</div>
                    </div>
                    <p className="text-xs text-gray-400">{m.desc}</p>
                  </div>
                ))}
              </div>
            </Step>

            <Step num={3} title="Créer une nouvelle conversation">
              <p className="text-gray-600 leading-relaxed mb-3">
                Cliquez sur <strong>"+ Nouvelle conversation"</strong> en haut de la liste.
                Sélectionnez le membre avec qui vous souhaitez échanger et commencez à écrire.
              </p>
              <Note>
                Vous ne pouvez échanger qu'avec les membres de votre équipe Lotier Immobilier. Les conversations sont privées et sécurisées.
              </Note>
            </Step>

            <Step num={4} title="Joindre un fichier">
              <p className="text-gray-600 leading-relaxed mb-3">
                Dans le compositeur de message, cliquez sur l'icône trombone pour joindre un document (PDF, image, etc.).
              </p>
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-3">
                <Paperclip className="w-4 h-4 text-[#0891b2]" />
                <span className="text-sm text-gray-600">Cliquez sur l'icône trombone dans la barre de composition</span>
              </div>
              <Tip>
                Formats acceptés : PDF, JPG, PNG, DOCX. Taille maximale : 10 Mo par fichier.
              </Tip>
            </Step>
          </div>
        </div>

        {/* ── Page 8 : Recap ── */}
        <div className="page">
          <div className="px-16 py-14 flex flex-col min-h-screen">
            <div className="mb-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#b8a16a] mb-2">Récapitulatif</p>
              <h2 className="text-4xl font-bold text-gray-900">Prêt à commencer !</h2>
              <p className="text-gray-500 mt-3 text-lg">Voici les 4 étapes clés de votre première connexion.</p>
            </div>

            <div className="space-y-4">
              {[
                { num: 1, icon: LogIn, title: 'Se connecter', desc: 'Rendez-vous sur la plateforme avec votre email et mot de passe fournis par Lotier Immobilier.', color: '#1A3A5C' },
                { num: 2, icon: LayoutDashboard, title: 'Consulter le tableau de bord', desc: 'Dès la connexion, vérifiez vos indicateurs : tâches actives, retards et échéances du jour. Utilisez la recherche globale pour trouver n\'importe quoi instantanément.', color: '#0369a1' },
                { num: 3, icon: CheckSquare, title: 'Traiter vos tâches par projet', desc: 'Accédez aux projets pour voir et gérer l\'ensemble de vos missions. Tous vos collaborateurs sont visibles sur chaque carte.', color: '#047857' },
                { num: 4, icon: MessageSquare, title: 'Communiquer avec l\'équipe', desc: 'Utilisez la messagerie pour poser des questions et partager des informations avec votre gestionnaire ou vos collègues.', color: '#0891b2' },
              ].map(item => (
                <div key={item.num} className="flex items-start gap-5 bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm" style={{ background: item.color }}>
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-12">
              <div className="bg-[#1A3A5C] rounded-2xl px-8 py-6 flex items-center gap-6">
                <div className="flex-1">
                  <p className="text-white font-bold text-lg mb-1">Une question ?</p>
                  <p className="text-white/70 text-sm">Contactez votre gestionnaire Lotier Immobilier par email ou via la messagerie de la plateforme.</p>
                </div>
                <img src={logoUrl} alt="Lotier" className="h-10 brightness-0 invert opacity-80 flex-shrink-0" />
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between text-xs text-gray-300">
              <span>Lotier Immobilier — Plateforme Lotier Collab</span>
              <span>Document confidentiel — v2.0 — {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        @media screen {
          .tutorial-document {
            display: flex;
            flex-direction: column;
            gap: 2rem;
            padding: 2rem;
            max-width: 900px;
            margin: 0 auto;
          }
          .page {
            background: white;
            box-shadow: 0 4px 24px rgba(0,0,0,0.10);
            border-radius: 12px;
            overflow: hidden;
            min-height: 1050px;
          }
        }
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          html, body {
            margin: 0;
            padding: 0;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          .tutorial-document {
            display: block;
            padding: 0;
            margin: 0;
          }
          .page {
            width: 210mm;
            min-height: 297mm;
            page-break-after: always;
            break-after: page;
            overflow: hidden;
            background: white;
          }
          .page:last-child {
            page-break-after: auto;
          }
        }
      `}</style>
    </div>
  );
}
