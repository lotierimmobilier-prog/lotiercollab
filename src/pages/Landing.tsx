import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import logoUrl from '../assets/Logo-der.png';
import { SquareCheck as CheckSquare, FolderOpen, MessageSquare, LayoutDashboard, StickyNote, Shield, Users, ArrowRight, Check, ChevronDown, Menu, X, Zap, Bell, TrendingUp, Clock, Building2, Award, ChartBar as BarChart3, Lock, Smartphone, RefreshCw } from 'lucide-react';

// ── Nav ──────────────────────────────────────────────────────────

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { href: '#fonctionnalites', label: 'Fonctionnalités' },
    { href: '#apercu', label: 'Aperçu' },
    { href: '#avantages', label: 'Avantages' },
    { href: '#faq', label: 'FAQ' },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white border-b ${scrolled ? 'shadow-sm border-gray-200' : 'border-transparent'}`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <img src={logoUrl} alt="Lotier Immobilier" className="h-9 object-contain" />

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {links.map(l => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-gray-600 hover:text-[#1A3A5C] transition-colors">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm font-semibold px-4 py-2 rounded-xl text-[#1A3A5C] hover:bg-[#1A3A5C]/5 transition-all"
          >
            Connexion
          </Link>
          <Link
            to="/login"
            className="text-sm font-semibold px-4 py-2 rounded-xl bg-[#B89968] text-white hover:bg-[#a8895a] transition-colors shadow-sm"
          >
            Accéder à la plateforme
          </Link>
        </div>

        {/* Mobile */}
        <button onClick={() => setMobileOpen(v => !v)} className="md:hidden text-gray-700">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-3">
          {links.map(l => (
            <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-gray-700 py-1">{l.label}</a>
          ))}
          <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
            <Link to="/login" className="text-center text-sm font-semibold text-[#1A3A5C] py-2.5 rounded-xl border border-[#1A3A5C]/20">Connexion</Link>
            <Link to="/login" className="text-center text-sm font-semibold bg-[#1A3A5C] text-white py-2.5 rounded-xl">Accéder à la plateforme</Link>
          </div>
        </div>
      )}
    </header>
  );
}

// ── Hero mockup ──────────────────────────────────────────────────

function HeroMockup() {
  return (
    <div className="relative">
      {/* Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1A3A5C]/20 to-[#B89968]/20 rounded-3xl blur-3xl scale-110" />

      {/* Browser shell */}
      <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-white">
        {/* Browser chrome */}
        <div className="flex items-center gap-1.5 px-4 py-3 bg-gray-100/80 border-b border-gray-200">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <div className="flex-1 mx-4 bg-white rounded-md px-3 py-1 text-xs text-gray-400 border border-gray-200">app.lotier.fr</div>
        </div>

        {/* App UI */}
        <div className="flex h-80">
          {/* Sidebar */}
          <div className="w-40 bg-[#1A3A5C] flex flex-col py-4 px-3 gap-1 flex-shrink-0">
            <div className="px-2 mb-3">
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Lotier</div>
            </div>
            {[
              { icon: LayoutDashboard, label: 'Tableau de bord', active: true },
              { icon: CheckSquare, label: 'Tâches', active: false },
              { icon: FolderOpen, label: 'Projets', active: false },
              { icon: MessageSquare, label: 'Messagerie', active: false },
              { icon: StickyNote, label: 'Mémos', active: false },
            ].map(({ icon: Icon, label, active }) => (
              <div key={label} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all ${active ? 'bg-white/15 text-white' : 'text-white/50'}`}>
                <Icon className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{label}</span>
              </div>
            ))}

            <div className="mt-auto px-2">
              <div className="text-[9px] text-white/30 uppercase tracking-widest mb-2">Projets</div>
              {['BC Amarine 1', 'Le Petit Prince', 'Résidence Azur'].map((p, i) => (
                <div key={p} className="flex items-center gap-1.5 py-1 text-[9px] text-white/40">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: ['#B89968','#0891b2','#059669'][i] }} />
                  <span className="truncate">{p}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Main */}
          <div className="flex-1 bg-gray-50 p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-gray-800">Bonjour, Stéphanie</h2>
                <p className="text-[10px] text-gray-400">Lundi 27 Avril 2026</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                    <Bell className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-gray-50" />
                </div>
                <div className="w-7 h-7 rounded-full bg-[#1A3A5C] flex items-center justify-center text-[10px] font-bold text-white">SL</div>
              </div>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { label: 'Actives', value: 12, color: 'text-[#1A3A5C]', bg: 'bg-[#1A3A5C]/5' },
                { label: 'En retard', value: 3, color: 'text-red-600', bg: 'bg-red-50' },
                { label: 'Aujourd\'hui', value: 5, color: 'text-orange-600', bg: 'bg-orange-50' },
                { label: 'Terminées', value: 27, color: 'text-green-600', bg: 'bg-green-50' },
              ].map(k => (
                <div key={k.label} className={`${k.bg} rounded-xl p-2 text-center`}>
                  <p className={`text-base font-bold ${k.color}`}>{k.value}</p>
                  <p className="text-[8px] text-gray-400 mt-0.5">{k.label}</p>
                </div>
              ))}
            </div>

            {/* Task list preview */}
            <div className="space-y-1.5">
              {[
                { title: 'Saisie factures BC Amarine 1', priority: 'Urgente', pcolor: 'bg-red-100 text-red-700', due: 'Aujourd\'hui', dot: 'bg-red-500' },
                { title: 'Contrôle accès — Le Petit Prince', priority: 'Haute', pcolor: 'bg-orange-100 text-orange-700', due: 'Demain', dot: 'bg-orange-400' },
                { title: 'Vérification compteurs eau', priority: 'Normale', pcolor: 'bg-blue-100 text-blue-700', due: '2 mai', dot: 'bg-blue-400' },
              ].map(t => (
                <div key={t.title} className="bg-white rounded-xl border border-gray-100 px-3 py-2 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${t.dot}`} />
                  <span className="flex-1 text-[10px] font-medium text-gray-700 truncate">{t.title}</span>
                  <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-md ${t.pcolor}`}>{t.priority}</span>
                  <span className="text-[8px] text-gray-400">{t.due}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating cards */}
      <div className="absolute -right-6 top-10 bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3 flex items-center gap-3 animate-float">
        <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center">
          <Check className="w-4 h-4 text-green-600" />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-800">Tâche terminée</p>
          <p className="text-[10px] text-gray-400">État des lieux validé</p>
        </div>
      </div>

      <div className="absolute -left-6 bottom-16 bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3 flex items-center gap-3 animate-float-delayed">
        <div className="w-8 h-8 rounded-xl bg-[#B89968]/15 flex items-center justify-center">
          <MessageSquare className="w-4 h-4 text-[#B89968]" />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-800">Nouveau message</p>
          <p className="text-[10px] text-gray-400">Tristan M. — il y a 2 min</p>
        </div>
      </div>
    </div>
  );
}

// ── Features mockups ─────────────────────────────────────────────

function KanbanMockup() {
  const cols = [
    { label: 'À faire', count: 4, color: 'bg-gray-100', items: ['Saisie factures', 'Nettoyage hall'] },
    { label: 'En cours', count: 3, color: 'bg-blue-50', items: ['Remplacement serrure', 'État des lieux'] },
    { label: 'Terminé', count: 8, color: 'bg-green-50', items: ['Réparation fuite'] },
  ];
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <span className="text-xs font-bold text-gray-700">Tâches — Vue Kanban</span>
        <div className="flex gap-1">
          <div className="bg-[#1A3A5C] text-white text-[9px] font-semibold px-2 py-0.5 rounded-md">Kanban</div>
          <div className="bg-gray-100 text-gray-500 text-[9px] px-2 py-0.5 rounded-md">Liste</div>
        </div>
      </div>
      <div className="flex gap-2 p-3">
        {cols.map(col => (
          <div key={col.label} className="flex-1">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <span className="text-[9px] font-semibold text-gray-500 uppercase">{col.label}</span>
              <span className="text-[9px] text-gray-400">{col.count}</span>
            </div>
            <div className={`${col.color} rounded-xl p-1.5 space-y-1 min-h-[80px]`}>
              {col.items.map(t => (
                <div key={t} className="bg-white rounded-lg p-2 shadow-sm border border-gray-100">
                  <p className="text-[9px] font-medium text-gray-700">{t}</p>
                  <div className="flex items-center justify-between mt-1">
                    <div className="w-4 h-4 rounded-full bg-[#1A3A5C] flex items-center justify-center text-[6px] text-white font-bold">SL</div>
                    <div className="w-2 h-2 rounded-full bg-orange-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MessagingMockup() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <span className="text-xs font-bold text-gray-700">Messagerie interne</span>
      </div>
      <div className="flex h-44">
        <div className="w-28 border-r border-gray-100">
          {[
            { name: 'Tristan M.', msg: 'Merci pour le suivi', unread: true, color: '#1A3A5C' },
            { name: 'Stéphanie L.', msg: 'Facture bien reçue', unread: false, color: '#B89968' },
            { name: 'Jean-Pierre V.', msg: 'Rdv confirmé', unread: false, color: '#059669' },
          ].map(c => (
            <div key={c.name} className={`px-3 py-2.5 border-b border-gray-50 flex items-center gap-2 ${c.unread ? 'bg-blue-50/40' : ''}`}>
              <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[8px] font-bold text-white" style={{ backgroundColor: c.color }}>
                {c.name[0]}
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-semibold text-gray-700 truncate">{c.name}</p>
                <p className="text-[8px] text-gray-400 truncate">{c.msg}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex-1 flex flex-col">
          <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#1A3A5C] flex items-center justify-center text-[8px] font-bold text-white">T</div>
            <span className="text-[10px] font-semibold text-gray-700">Tristan M.</span>
          </div>
          <div className="flex-1 p-2 space-y-2">
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-xl rounded-tl-sm px-2 py-1.5 max-w-[75%]">
                <p className="text-[8px] text-gray-700">Bonjour, la tâche est bien terminée.</p>
              </div>
            </div>
            <div className="flex justify-end">
              <div className="bg-[#1A3A5C] rounded-xl rounded-tr-sm px-2 py-1.5 max-w-[75%]">
                <p className="text-[8px] text-white">Parfait, merci pour le suivi !</p>
              </div>
            </div>
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-xl rounded-tl-sm px-2 py-1.5 max-w-[75%]">
                <p className="text-[8px] text-gray-700">Je commence l'état des lieux demain.</p>
              </div>
            </div>
          </div>
          <div className="px-2 py-2 border-t border-gray-100 flex gap-1">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-[8px] text-gray-400">Écrire...</div>
            <div className="w-6 h-6 rounded-lg bg-[#1A3A5C] flex items-center justify-center">
              <ArrowRight className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MemosMockup() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <span className="text-xs font-bold text-gray-700">Mémos personnels</span>
        <div className="bg-[#1A3A5C] text-white text-[9px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
          <StickyNote className="w-2.5 h-2.5" /> 3 à faire
        </div>
      </div>
      <div className="p-3 space-y-2">
        {[
          { title: 'Préparer rapport mensuel copropriétés', due: "Aujourd'hui", priority: 'Urgente', pcolor: 'text-red-600 bg-red-50 border-red-200', done: false },
          { title: 'Appeler assurance Résidence Azur', due: 'Demain', priority: 'Haute', pcolor: 'text-orange-600 bg-orange-50 border-orange-200', done: false },
          { title: 'Archiver dossiers 2025', due: '5 mai', priority: 'Normale', pcolor: 'text-blue-600 bg-blue-50 border-blue-200', done: true },
        ].map(m => (
          <div key={m.title} className={`flex items-start gap-2.5 bg-white rounded-xl border px-3 py-2 ${m.done ? 'opacity-50 border-gray-100' : 'border-gray-200'}`}>
            <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${m.done ? 'border-green-400 bg-green-50' : 'border-gray-300'}`}>
              {m.done && <Check className="w-2 h-2 text-green-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-[9px] font-medium leading-snug ${m.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>{m.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[8px] text-gray-400">{m.due}</span>
                <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-md border ${m.pcolor}`}>{m.priority}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Counter animation ────────────────────────────────────────────

function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      let start = 0;
      const step = to / 60;
      const timer = setInterval(() => {
        start = Math.min(start + step, to);
        setVal(Math.floor(start));
        if (start >= to) clearInterval(timer);
      }, 16);
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);

  return <span ref={ref}>{val}{suffix}</span>;
}

// ── FAQ ──────────────────────────────────────────────────────────

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors">
        <span className="text-sm font-semibold text-gray-900 pr-4">{q}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-6 pb-4 border-t border-gray-100">
          <p className="text-sm text-gray-500 leading-relaxed pt-3">{a}</p>
        </div>
      )}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────

export function Landing() {
  return (
    <div className="bg-white overflow-x-hidden">
      <Nav />

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden" style={{ background: 'linear-gradient(135deg, #1A3A5C 0%, #0d2238 65%, #1a3a5c 100%)' }}>
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #B89968, transparent)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #B89968, transparent)', transform: 'translate(-30%, 30%)' }} />

        <div className="max-w-6xl mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs text-white/80 font-medium mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B89968]" />
              Plateforme de gestion d'entreprise
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Gérez votre<br />
              <span style={{ color: '#B89968' }}>entreprise</span><br />
              avec clarté
            </h1>

            <p className="text-lg text-white/60 leading-relaxed mb-10 max-w-lg">
              Lotier Immobilier centralise la gestion des tâches, des projets et des communications entre les équipes. Une plateforme simple, rapide et sécurisée.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-semibold text-white transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: '#B89968' }}
              >
                Accéder à la plateforme
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#apercu" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-semibold text-white border border-white/20 hover:bg-white/10 transition-all">
                Voir l'aperçu
              </a>
            </div>

            <div className="flex items-center gap-6 mt-10">
              {[
                { value: '+200', label: 'Tâches gérées' },
                { value: '3', label: 'Copropriétés' },
                { value: '100%', label: 'Sécurisé' },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-white/40 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:block">
            <HeroMockup />
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30">
          <span className="text-xs">Découvrir</span>
          <div className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 bg-white/30 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* ── Social proof strip ── */}
      <section className="bg-gray-50 border-y border-gray-100 py-8">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { icon: Building2, label: 'Copropriétés gérées', value: 3 },
              { icon: Users, label: 'Prestataires actifs', value: 12 },
              { icon: CheckSquare, label: 'Tâches complétées', value: 240 },
              { icon: MessageSquare, label: 'Messages échangés', value: 1800 },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-[#1A3A5C]/8 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#1A3A5C]" />
                </div>
                <p className="text-2xl font-bold text-gray-900"><Counter to={value} suffix="+" /></p>
                <p className="text-xs text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="fonctionnalites" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#B89968]">Fonctionnalités</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2 mb-4">Tout ce qu'il vous faut</h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">Une suite complète pour piloter votre entreprise, vos prestataires et vos projets au quotidien.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: CheckSquare, color: '#047857', bg: 'bg-emerald-50',
                title: 'Gestion des tâches',
                desc: 'Vue Kanban ou liste, priorités, assignation multiple, tâches récurrentes. Chaque prestataire voit uniquement ses missions.',
                features: ['Vue Kanban & Liste', 'Priorités visuelles', 'Tâches récurrentes'],
              },
              {
                icon: FolderOpen, color: '#0369a1', bg: 'bg-sky-50',
                title: 'Projets & sous-projets',
                desc: 'Organisez vos chantiers en projets hiérarchiques. Navigation intuitive dans l\'arborescence.',
                features: ['Hiérarchie illimitée', 'Couleurs personnalisées', 'Filtrage par projet'],
              },
              {
                icon: MessageSquare, color: '#0891b2', bg: 'bg-cyan-50',
                title: 'Messagerie interne',
                desc: 'Communication directe entre votre entreprise et prestataires. Citez des tâches dans vos messages, partagez des fichiers.',
                features: ['Conversations privées', 'Pièces jointes', 'Liaison tâche ↔ message'],
              },
              {
                icon: StickyNote, color: '#b45309', bg: 'bg-amber-50',
                title: 'Mémos personnels',
                desc: 'Carnets de notes avec échéances et priorités. Exportez vers Google Calendar ou Apple Calendar en un clic.',
                features: ['Dates d\'échéance', 'Export .ics / Google Cal', 'Rappels visuels'],
              },
              {
                icon: Shield, color: '#7c2d12', bg: 'bg-orange-50',
                title: 'Rôles & permissions',
                desc: 'Super admin, agents, prestataires. Chaque rôle accède uniquement à ce qui le concerne. RLS côté base de données.',
                features: ['3 niveaux d\'accès', 'RLS Supabase', 'Vue par prestataire'],
              },
              {
                icon: BarChart3, color: '#1A3A5C', bg: 'bg-slate-50',
                title: 'Tableau de bord',
                desc: 'Vue d\'ensemble personnalisée : tâches en retard, échéances du jour, progression des projets actifs.',
                features: ['Indicateurs en temps réel', 'Tâches prioritaires', 'Accès rapide'],
              },
            ].map(f => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow group">
                  <div className={`w-11 h-11 ${f.bg} rounded-2xl flex items-center justify-center mb-4`}>
                    <Icon className="w-5 h-5" style={{ color: f.color }} />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4">{f.desc}</p>
                  <ul className="space-y-1.5">
                    {f.features.map(feat => (
                      <li key={feat} className="flex items-center gap-2 text-xs text-gray-600">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${f.color}18` }}>
                          <Check className="w-2.5 h-2.5" style={{ color: f.color }} />
                        </div>
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Apercu / Screenshots ── */}
      <section id="apercu" className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#B89968]">Aperçu</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2 mb-4">Conçu pour la clarté</h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">Une interface épurée, conçue pour que chaque utilisateur trouve ce dont il a besoin en moins de 3 clics.</p>
          </div>

          <div className="space-y-20">
            {/* Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#047857] bg-emerald-50 px-3 py-1 rounded-full mb-4">
                  <CheckSquare className="w-3 h-3" /> Gestion des tâches
                </span>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">Visualisez l'avancement en temps réel</h3>
                <p className="text-gray-500 leading-relaxed mb-6">Le tableau Kanban donne une vision instantanée de l'état de tous vos chantiers. Glissez-déposez les tâches d'une colonne à l'autre pour mettre à jour leur statut.</p>
                <ul className="space-y-3">
                  {['4 colonnes de statut : À faire, En cours, Terminé, Bloqué', 'Filtrage par projet, prestataire ou priorité', 'Panneau de détail sans quitter la vue'].map(t => (
                    <li key={t} className="flex items-start gap-3 text-sm text-gray-600">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-emerald-600" />
                      </div>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <KanbanMockup />
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="order-last lg:order-first">
                <MessagingMockup />
              </div>
              <div>
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#0891b2] bg-cyan-50 px-3 py-1 rounded-full mb-4">
                  <MessageSquare className="w-3 h-3" /> Messagerie
                </span>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">Communiquez sans quitter la plateforme</h3>
                <p className="text-gray-500 leading-relaxed mb-6">La messagerie intégrée remplace les échanges email épars. Chaque conversation est contextualisée avec les tâches et projets associés.</p>
                <ul className="space-y-3">
                  {['Conversations privées et sécurisées', 'Citez directement une tâche dans un message', 'Pièces jointes : PDF, images, documents'].map(t => (
                    <li key={t} className="flex items-start gap-3 text-sm text-gray-600">
                      <div className="w-5 h-5 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-[#0891b2]" />
                      </div>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#b45309] bg-amber-50 px-3 py-1 rounded-full mb-4">
                  <StickyNote className="w-3 h-3" /> Mémos
                </span>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">Vos notes, vos rappels, votre agenda</h3>
                <p className="text-gray-500 leading-relaxed mb-6">Chaque collaborateur dispose d'un espace de mémos personnel. Ajoutez des échéances, définissez des priorités et synchronisez avec votre agenda Google ou Apple.</p>
                <ul className="space-y-3">
                  {['Ajout rapide en une ligne', 'Export .ics pour Google Calendar et Outlook', 'Données privées, visibles uniquement par vous'].map(t => (
                    <li key={t} className="flex items-start gap-3 text-sm text-gray-600">
                      <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-[#b45309]" />
                      </div>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <MemosMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── Avantages ── */}
      <section id="avantages" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#B89968]">Pourquoi Lotier</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2 mb-4">Une plateforme pensée pour votre réussite</h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">Contrairement aux outils génériques, Lotier est conçu spécifiquement pour la gestion de votre entreprise et de prestataires.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {[
              {
                icon: Lock, title: 'Sécurité de niveau entreprise',
                desc: 'Authentification sécurisée, chiffrement des données, politiques d\'accès granulaires. Chaque utilisateur voit uniquement ce qui le concerne.',
                color: '#1A3A5C',
              },
              {
                icon: Smartphone, title: 'Accessible partout',
                desc: 'Interface responsive optimisée pour desktop, tablette et mobile. Accédez à vos données depuis n\'importe quel appareil avec une connexion internet.',
                color: '#0891b2',
              },
              {
                icon: Zap, title: 'Rapide à prendre en main',
                desc: 'Interface intuitive avec guide d\'utilisation intégré. Les prestataires sont opérationnels en moins de 10 minutes. Un tutoriel PDF est fourni.',
                color: '#b45309',
              },
              {
                icon: RefreshCw, title: 'Tâches récurrentes automatiques',
                desc: 'Configurez une fréquence (quotidienne, hebdomadaire, mensuelle) et la tâche se recrée automatiquement. Fini les oublis sur les vérifications périodiques.',
                color: '#047857',
              },
              {
                icon: Users, title: 'Multi-utilisateurs & multi-rôles',
                desc: 'Super admin, agents de syndic, prestataires extérieurs. Chaque rôle dispose d\'une vue adaptée à ses responsabilités.',
                color: '#B89968',
              },
              {
                icon: Award, title: 'Suivi complet des prestataires',
                desc: 'Visualisez la charge de travail de chaque prestataire, ses tâches en retard et ses projets actifs. Gérez les accès par copropriété.',
                color: '#7c2d12',
              },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="flex items-start gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}12` }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1.5">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Comparison */}
          <div className="bg-gray-50 rounded-3xl border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-3 divide-x divide-gray-200">
              <div className="p-6">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Sans Lotier</p>
                <ul className="space-y-3">
                  {['Emails éparpillés', 'Excel pour les tâches', 'Pertes d\'information', 'Suivi manuel fastidieux', 'Aucune visibilité globale'].map(i => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-500">
                      <X className="w-4 h-4 text-red-400 flex-shrink-0" />
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-6 bg-white">
                <p className="text-xs font-semibold text-[#B89968] uppercase tracking-wide mb-4">Avec Lotier</p>
                <ul className="space-y-3">
                  {['Messagerie centralisée', 'Gestion de tâches intuitive', 'Traçabilité complète', 'Automatisation des récurrences', 'Tableau de bord en temps réel'].map(i => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-6">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Résultat</p>
                <div className="space-y-4">
                  {[
                    { label: 'Temps gagné', value: '-40%', color: 'text-green-600' },
                    { label: 'Erreurs évitées', value: '-80%', color: 'text-green-600' },
                    { label: 'Réactivité', value: '+3x', color: 'text-[#1A3A5C]' },
                  ].map(r => (
                    <div key={r.label} className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{r.label}</span>
                      <span className={`text-lg font-bold ${r.color}`}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-20 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1A3A5C 0%, #0d2238 100%)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #B89968, transparent 60%)' }} />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-6">
            <TrendingUp className="w-7 h-7 text-[#B89968]" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">Prêt à simplifier votre gestion ?</h2>
          <p className="text-lg text-white/60 mb-8">Connectez-vous dès maintenant et découvrez comment Lotier transforme votre quotidien.</p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all text-base"
            style={{ background: '#B89968' }}
          >
            Accéder à la plateforme
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#B89968]">FAQ</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2 mb-4">Questions fréquentes</h2>
          </div>
          <div className="space-y-3">
            <FAQ
              q="Comment se connecter pour la première fois ?"
              a="Vos identifiants (email + mot de passe) vous sont communiqués directement par votre gestionnaire Lotier Immobilier. Il vous suffit de vous rendre sur cette page et de cliquer sur 'Connexion'. Un tutoriel PDF complet vous est également fourni."
            />
            <FAQ
              q="Puis-je utiliser Lotier sur mon téléphone ?"
              a="Oui, la plateforme est entièrement responsive et fonctionne sur tous les appareils : ordinateur, tablette et smartphone. Ouvrez simplement l'adresse dans votre navigateur mobile."
            />
            <FAQ
              q="Mes données sont-elles sécurisées ?"
              a="Absolument. La plateforme utilise Supabase avec Row Level Security (RLS) : chaque utilisateur ne peut accéder qu'aux données qui lui sont autorisées. Les communications sont chiffrées en transit (HTTPS)."
            />
            <FAQ
              q="Comment exporter mes mémos vers Google Calendar ?"
              a="Depuis la page Mémos, cliquez sur 'Export .ics'. Ouvrez ensuite Google Calendar, cliquez sur le + à côté de 'Autres agendas' puis 'Importer'. Sélectionnez le fichier téléchargé. Vos mémos apparaîtront instantanément dans votre agenda."
            />
            <FAQ
              q="Les prestataires peuvent-ils créer leurs propres projets ?"
              a="Oui, depuis la mise à jour récente, chaque agent connecté peut créer ses propres projets directement depuis la page Projets, en plus de gérer ses tâches assignées."
            />
            <FAQ
              q="Comment contacter le support ?"
              a="Utilisez la messagerie interne de la plateforme pour contacter votre gestionnaire Lotier Immobilier. Vous pouvez également les joindre par email ou téléphone via les coordonnées habituelles."
            />
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <img src={logoUrl} alt="Lotier Immobilier" className="h-10 object-contain" />
              <div className="w-px h-8 bg-gray-200" />
              <span className="text-sm text-gray-400">Plateforme de gestion immobilière</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#fonctionnalites" className="text-sm text-gray-500 hover:text-[#1A3A5C] transition-colors">Fonctionnalités</a>
              <a href="#faq" className="text-sm text-gray-500 hover:text-[#1A3A5C] transition-colors">FAQ</a>
              <Link to="/login" className="text-sm font-semibold text-[#B89968] hover:text-[#a8895a] transition-colors">Connexion</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-2">
            <p className="text-xs text-gray-400">© {new Date().getFullYear()} Lotier Immobilier. Tous droits réservés.</p>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-gray-300" />
              <span className="text-xs text-gray-400">Disponible 24h/24 · 7j/7</span>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 3.5s ease-in-out infinite 0.5s; }
      `}</style>
    </div>
  );
}
