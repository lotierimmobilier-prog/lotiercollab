import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Eye, EyeOff, ArrowRight, Check, SquareCheck as CheckSquare, FolderOpen, MessageSquare, StickyNote, Bell } from 'lucide-react';
import logoSrc from '../assets/Logo-der.png';

// ── Mini app mockup (same style as landing hero) ─────────────────

function LoginMockup() {
  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-[#B89968]/10 rounded-3xl blur-3xl scale-110" />

      {/* Browser shell */}
      <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-1.5 px-4 py-2.5 bg-black/20 border-b border-white/10">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
          <div className="flex-1 mx-3 bg-white/10 rounded-md px-2 py-0.5 text-[9px] text-white/30">app.lotier.fr</div>
        </div>

        <div className="flex h-64">
          {/* Sidebar */}
          <div className="w-32 bg-black/20 flex flex-col py-3 px-2.5 gap-1 flex-shrink-0">
            <div className="px-1.5 mb-2">
              <div className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Lotier</div>
            </div>
            {[
              { icon: CheckSquare, label: 'Tâches', active: true },
              { icon: FolderOpen, label: 'Projets', active: false },
              { icon: MessageSquare, label: 'Messages', active: false },
              { icon: StickyNote, label: 'Mémos', active: false },
            ].map(({ icon: Icon, label, active }) => (
              <div key={label} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[9px] font-medium ${active ? 'bg-white/15 text-white' : 'text-white/40'}`}>
                <Icon className="w-2.5 h-2.5 flex-shrink-0" />
                {label}
              </div>
            ))}
          </div>

          {/* Main */}
          <div className="flex-1 p-3 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[10px] font-bold text-white">Tableau de bord</p>
                <p className="text-[8px] text-white/40">27 Avril 2026</p>
              </div>
              <div className="relative">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                  <Bell className="w-3 h-3 text-white/50" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-400 rounded-full border border-[#1A3A5C]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {[
                { label: 'En cours', value: 12, color: 'text-white' },
                { label: 'En retard', value: 3, color: 'text-red-400' },
              ].map(k => (
                <div key={k.label} className="bg-white/10 rounded-xl p-2 text-center">
                  <p className={`text-sm font-bold ${k.color}`}>{k.value}</p>
                  <p className="text-[7px] text-white/40">{k.label}</p>
                </div>
              ))}
            </div>

            <div className="space-y-1">
              {[
                { title: 'Saisie factures', tag: 'Urgente', dot: 'bg-red-400' },
                { title: 'Contrôle accès', tag: 'Haute', dot: 'bg-orange-400' },
                { title: 'Compteurs eau', tag: 'Normale', dot: 'bg-blue-400' },
              ].map(t => (
                <div key={t.title} className="bg-white/10 rounded-lg px-2 py-1.5 flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${t.dot}`} />
                  <span className="flex-1 text-[8px] text-white/70 truncate">{t.title}</span>
                  <span className="text-[7px] text-white/40">{t.tag}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating notification */}
      <div className="absolute -right-4 top-8 bg-white rounded-xl shadow-xl border border-gray-100 px-3 py-2 flex items-center gap-2.5"
        style={{ animation: 'float 3s ease-in-out infinite' }}>
        <div className="w-7 h-7 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
          <Check className="w-3.5 h-3.5 text-green-600" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-800">Tâche terminée</p>
          <p className="text-[9px] text-gray-400">BC Amarine 1</p>
        </div>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message || 'Identifiants incorrects. Vérifiez votre adresse e-mail et mot de passe.');
    } else {
      navigate('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex overflow-hidden">

      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex lg:w-[58%] flex-col justify-between p-14 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1A3A5C 0%, #0d2238 70%, #1a3a5c 100%)' }}
      >
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #B89968, transparent)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-[350px] h-[350px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #B89968, transparent)', transform: 'translate(-30%, 30%)' }} />

        {/* Top: logo + back link */}
        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="inline-block bg-white rounded-xl px-4 py-2.5 hover:opacity-90 transition-opacity">
            <img src={logoSrc} alt="Lotier Immobilier" className="h-9 w-auto" />
          </Link>
          <Link to="/" className="text-white/50 hover:text-white text-xs transition-colors flex items-center gap-1.5">
            <span>← Retour à l'accueil</span>
          </Link>
        </div>

        {/* Middle: headline + mockup */}
        <div className="relative z-10 flex-1 flex flex-col justify-center py-12 gap-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-3 py-1 text-[11px] text-white/70 font-medium mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B89968]" />
              Plateforme de gestion d'entreprise
            </div>
            <h2 className="text-4xl font-bold text-white leading-tight mb-3">
              Bienvenue sur<br />
              <span style={{ color: '#B89968' }}>Lotier Collab</span>
            </h2>
            <p className="text-white/55 text-base leading-relaxed max-w-md">
              Coordonnez vos prestataires, suivez vos projets et gérez vos copropriétés depuis une seule plateforme sécurisée.
            </p>
          </div>

          <LoginMockup />

          {/* Feature bullets */}
          <ul className="space-y-3">
            {[
              'Gestion des tâches, projets et mémos',
              'Messagerie interne sécurisée',
              'Accès restreint par rôle et copropriété',
            ].map(f => (
              <li key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#B89968]/20 border border-[#B89968]/30 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-[#B89968]" />
                </div>
                <span className="text-white/70 text-sm">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom: copyright */}
        <div className="relative z-10">
          <p className="text-white/25 text-xs">© {new Date().getFullYear()} LOTIER Immobilier · Tous droits réservés</p>
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:px-14 bg-white">
        <div className="w-full max-w-sm">

          {/* Mobile logo + back */}
          <div className="lg:hidden mb-8">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <img src={logoSrc} alt="Lotier Immobilier" className="h-9 w-auto" />
            </Link>
          </div>

          {/* Form header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Connexion</h1>
            <p className="text-gray-400 text-sm mt-1.5">Accédez à votre espace de travail</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Adresse e-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="prenom@lotier-immobilier.com"
                required
                autoComplete="email"
                className="w-full h-11 px-4 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 outline-none focus:border-[#1A3A5C] focus:ring-2 focus:ring-[#1A3A5C]/10 focus:bg-white transition-all"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full h-11 px-4 pr-11 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 outline-none focus:border-[#1A3A5C] focus:ring-2 focus:ring-[#1A3A5C]/10 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <span className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">!</span>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full h-11 flex items-center justify-center gap-2 bg-[#1A3A5C] hover:bg-[#142d47] text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md mt-1"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  Se connecter
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-8 pt-8 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center leading-relaxed">
              Vos identifiants vous ont été communiqués par votre gestionnaire Lotier.
              <br />
              Besoin d'aide ? Consultez le{' '}
              <Link to="/tutorial" target="_blank" className="font-semibold text-[#1A3A5C] hover:underline">
                guide de connexion
              </Link>.
            </p>
          </div>

          {/* Mobile copyright */}
          <div className="lg:hidden mt-8 text-center">
            <p className="text-gray-300 text-xs">© {new Date().getFullYear()} LOTIER Immobilier</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
