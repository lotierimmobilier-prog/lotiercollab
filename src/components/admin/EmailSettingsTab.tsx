import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Mail, Server, Eye, EyeOff, Save, Send, ChevronDown, ChevronRight, ToggleLeft, ToggleRight, Check, CircleAlert as AlertCircle, LoaderCircle as Loader2 } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface EmailSettings {
  id: string | null;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_password: string;
  smtp_from_name: string;
  enabled: boolean;
}

interface EmailTemplate {
  id: string;
  event_type: string;
  enabled: boolean;
  subject: string;
  body_html: string;
}

// ── Template metadata ─────────────────────────────────────────────────────────

const TEMPLATE_META: Record<string, {
  label: string;
  description: string;
  color: string;
  vars: { key: string; description: string }[];
}> = {
  task_assigned: {
    label: 'Tâche assignée',
    description: 'Envoyé quand une tâche est assignée à un membre.',
    color: 'text-blue-600 bg-blue-50',
    vars: [
      { key: 'recipient_name', description: 'Nom du destinataire' },
      { key: 'actor_name', description: 'Nom de la personne qui a assigné' },
      { key: 'task_title', description: 'Titre de la tâche' },
      { key: 'project_name', description: 'Nom du projet' },
      { key: 'priority', description: 'Priorité (urgent, high, normal, low)' },
      { key: 'due_date', description: "Date d'échéance" },
      { key: 'description', description: 'Description de la tâche' },
      { key: 'app_url', description: "URL de l'application" },
    ],
  },
  task_updated: {
    label: 'Tâche mise à jour',
    description: "Envoyé quand le statut ou les infos d'une tâche changent.",
    color: 'text-amber-600 bg-amber-50',
    vars: [
      { key: 'recipient_name', description: 'Nom du destinataire' },
      { key: 'actor_name', description: 'Auteur de la modification' },
      { key: 'task_title', description: 'Titre de la tâche' },
      { key: 'project_name', description: 'Nom du projet' },
      { key: 'new_status', description: 'Nouveau statut' },
      { key: 'change_summary', description: 'Résumé des modifications' },
      { key: 'app_url', description: "URL de l'application" },
    ],
  },
  comment_added: {
    label: 'Commentaire ajouté',
    description: 'Envoyé quand un commentaire est posté sur une tâche assignée.',
    color: 'text-emerald-600 bg-emerald-50',
    vars: [
      { key: 'recipient_name', description: 'Nom du destinataire' },
      { key: 'actor_name', description: 'Auteur du commentaire' },
      { key: 'task_title', description: 'Titre de la tâche' },
      { key: 'project_name', description: 'Nom du projet' },
      { key: 'comment_body', description: 'Texte du commentaire' },
      { key: 'comment_date', description: 'Date du commentaire' },
      { key: 'app_url', description: "URL de l'application" },
    ],
  },
  new_message: {
    label: 'Nouveau message',
    description: 'Envoyé quand un message arrive dans une conversation.',
    color: 'text-orange-600 bg-orange-50',
    vars: [
      { key: 'recipient_name', description: 'Nom du destinataire' },
      { key: 'actor_name', description: 'Expéditeur' },
      { key: 'conversation_title', description: 'Titre de la conversation' },
      { key: 'message_preview', description: 'Aperçu du message (140 car.)' },
      { key: 'unread_count', description: 'Nombre de messages non lus' },
      { key: 'app_url', description: "URL de l'application" },
    ],
  },
  memo_due: {
    label: 'Mémo à échéance',
    description: 'Envoyé la veille et le jour J quand un mémo arrive à échéance.',
    color: 'text-red-600 bg-red-50',
    vars: [
      { key: 'recipient_name', description: 'Nom du destinataire' },
      { key: 'memo_title', description: 'Titre du mémo' },
      { key: 'memo_body', description: 'Contenu du mémo' },
      { key: 'due_date', description: "Date d'échéance formatée" },
      { key: 'due_label', description: "Label contextuel (aujourd'hui, demain…)" },
      { key: 'priority', description: 'Priorité du mémo' },
      { key: 'app_url', description: "URL de l'application" },
    ],
  },
};

// ── Template editor ───────────────────────────────────────────────────────────

function TemplateEditor({ tpl, onChange }: {
  tpl: EmailTemplate;
  onChange: (updated: EmailTemplate) => void;
}) {
  const [open, setOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const meta = TEMPLATE_META[tpl.event_type];
  if (!meta) return null;

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${tpl.enabled ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.color}`}>
          <Mail className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800">{meta.label}</p>
          <p className="text-xs text-gray-400 truncate">{meta.description}</p>
        </div>
        <button
          onClick={() => onChange({ ...tpl, enabled: !tpl.enabled })}
          className="flex-shrink-0 transition-colors"
          title={tpl.enabled ? 'Désactiver' : 'Activer'}
        >
          {tpl.enabled
            ? <ToggleRight className="w-6 h-6 text-emerald-500" />
            : <ToggleLeft className="w-6 h-6 text-gray-300" />
          }
        </button>
        <button
          onClick={() => setOpen(v => !v)}
          className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-400"
        >
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-gray-100 px-4 py-4 bg-gray-50 space-y-4">
          {/* Subject */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Objet du mail</Label>
            <Input
              value={tpl.subject}
              onChange={e => onChange({ ...tpl, subject: e.target.value })}
              placeholder="Objet..."
              className="bg-white text-sm"
            />
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Corps du mail (HTML)</Label>
              <button
                onClick={() => setShowPreview(v => !v)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showPreview ? 'Éditeur' : 'Aperçu'}
              </button>
            </div>
            {showPreview ? (
              <div
                className="border border-gray-200 rounded-lg bg-white p-4 min-h-[200px] text-sm overflow-auto"
                dangerouslySetInnerHTML={{ __html: tpl.body_html }}
              />
            ) : (
              <Textarea
                value={tpl.body_html}
                onChange={e => onChange({ ...tpl, body_html: e.target.value })}
                rows={12}
                className="bg-white font-mono text-xs"
                placeholder="HTML du mail..."
              />
            )}
          </div>

          {/* Variables */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Variables disponibles</p>
            <div className="flex flex-wrap gap-1.5">
              {meta.vars.map(v => (
                <span
                  key={v.key}
                  title={v.description}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-gray-200 rounded-md text-xs font-mono text-gray-600 cursor-help"
                >
                  {`{{${v.key}}}`}
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-400">Survolez une variable pour voir sa description.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main tab ──────────────────────────────────────────────────────────────────

export function EmailSettingsTab() {
  const [settings, setSettings] = useState<EmailSettings>({
    id: null,
    smtp_host: 'ssl0.ovh.net',
    smtp_port: 587,
    smtp_secure: false,
    smtp_user: '',
    smtp_password: '',
    smtp_from_name: 'Lotier Collab',
    enabled: false,
  });
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingTemplates, setSavingTemplates] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const [testError, setTestError] = useState('');
  const [savedSettings, setSavedSettings] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: s }, { data: t }] = await Promise.all([
        supabase.from('email_settings').select('*').maybeSingle(),
        supabase.from('email_templates').select('*').order('event_type'),
      ]);
      if (s) setSettings(s);
      if (t) setTemplates(t);
      setLoading(false);
    })();
  }, []);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    const { id, ...rest } = settings;
    if (id) {
      await supabase.from('email_settings').update({ ...rest, updated_at: new Date().toISOString() }).eq('id', id);
    } else {
      // Upsert — only one row allowed (unique index on true)
      const { data } = await supabase.from('email_settings').insert(rest).select().single();
      if (data) setSettings(s => ({ ...s, id: data.id }));
    }
    setSavingSettings(false);
    setSavedSettings(true);
    setTimeout(() => setSavedSettings(false), 2500);
  };

  const handleSaveTemplates = async () => {
    setSavingTemplates(true);
    await Promise.all(
      templates.map(t =>
        supabase.from('email_templates').update({
          enabled: t.enabled,
          subject: t.subject,
          body_html: t.body_html,
          updated_at: new Date().toISOString(),
        }).eq('id', t.id)
      )
    );
    setSavingTemplates(false);
    setSavedTemplates(true);
    setTimeout(() => setSavedTemplates(false), 2500);
  };

  const handleTest = async () => {
    if (!testEmail) return;
    setTestStatus('sending');
    setTestError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            to: testEmail,
            subject: 'Test — Lotier Collab notifications email',
            body_html: `<p style="font-family:sans-serif">Test de configuration SMTP réussi depuis <strong>Lotier Collab</strong>.<br>Serveur : ${settings.smtp_host}:${settings.smtp_port}</p>`,
            smtp: {
              host: settings.smtp_host,
              port: settings.smtp_port,
              secure: settings.smtp_secure,
              user: settings.smtp_user,
              password: settings.smtp_password,
              from_name: settings.smtp_from_name,
            },
          }),
        }
      );
      const json = await res.json();
      if (json.success) {
        setTestStatus('ok');
      } else {
        setTestStatus('error');
        setTestError(json.error ?? 'Erreur inconnue');
      }
    } catch (e) {
      setTestStatus('error');
      setTestError(e instanceof Error ? e.message : String(e));
    }
    setTimeout(() => setTestStatus('idle'), 15000);
  };

  const updateTemplate = (updated: EmailTemplate) => {
    setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ── SMTP Configuration ───────────────────────────────────── */}
      <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Server className="w-4 h-4 text-[#1A3A5C]" />
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Configuration SMTP</h3>
              <p className="text-xs text-gray-400">Serveur d'envoi des emails (ex. OVH)</p>
            </div>
          </div>
          {/* Master enable toggle */}
          <button
            onClick={() => setSettings(s => ({ ...s, enabled: !s.enabled }))}
            className="flex items-center gap-2 text-sm font-medium transition-colors"
          >
            {settings.enabled ? (
              <><ToggleRight className="w-7 h-7 text-emerald-500" /><span className="text-emerald-600">Activé</span></>
            ) : (
              <><ToggleLeft className="w-7 h-7 text-gray-300" /><span className="text-gray-400">Désactivé</span></>
            )}
          </button>
        </div>

        <div className="px-5 py-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Serveur SMTP</Label>
              <Input
                value={settings.smtp_host}
                onChange={e => setSettings(s => ({ ...s, smtp_host: e.target.value }))}
                placeholder="ssl0.ovh.net"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Port</Label>
              <Input
                type="number"
                value={settings.smtp_port}
                onChange={e => setSettings(s => ({ ...s, smtp_port: Number(e.target.value) }))}
                placeholder="993"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSettings(s => ({ ...s, smtp_secure: !s.smtp_secure }))}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                settings.smtp_secure
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'text-gray-500 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {settings.smtp_secure ? <Check className="w-3.5 h-3.5" /> : null}
              SSL/TLS
            </button>
            <span className="text-xs text-gray-400">Recommandé pour OVH port 993</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Email expéditeur</Label>
              <Input
                type="email"
                value={settings.smtp_user}
                onChange={e => setSettings(s => ({ ...s, smtp_user: e.target.value }))}
                placeholder="notifications@votredomaine.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Mot de passe SMTP</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={settings.smtp_password}
                  onChange={e => setSettings(s => ({ ...s, smtp_password: e.target.value }))}
                  placeholder="••••••••"
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Nom d'affichage expéditeur</Label>
            <Input
              value={settings.smtp_from_name}
              onChange={e => setSettings(s => ({ ...s, smtp_from_name: e.target.value }))}
              placeholder="Lotier Collab"
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="bg-[#1A3A5C] hover:bg-[#142d47] text-white"
            >
              {savingSettings
                ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                : savedSettings
                ? <Check className="w-4 h-4 mr-1.5 text-emerald-300" />
                : <Save className="w-4 h-4 mr-1.5" />
              }
              {savedSettings ? 'Enregistré !' : 'Enregistrer'}
            </Button>
          </div>
        </div>

        {/* Test email */}
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Tester la connexion</p>
          <div className="flex gap-2 items-start flex-wrap">
            <Input
              type="email"
              value={testEmail}
              onChange={e => setTestEmail(e.target.value)}
              placeholder="Adresse email de test..."
              className="flex-1 min-w-[200px] bg-white"
            />
            <Button
              onClick={handleTest}
              disabled={!testEmail || testStatus === 'sending'}
              variant="outline"
              className="flex-shrink-0"
            >
              {testStatus === 'sending'
                ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                : <Send className="w-4 h-4 mr-1.5" />
              }
              Envoyer un test
            </Button>
          </div>
          {testStatus === 'ok' && (
            <div className="flex items-center gap-2 mt-2 text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
              <Check className="w-4 h-4" />
              Email envoyé avec succès à {testEmail}
            </div>
          )}
          {testStatus === 'error' && (
            <div className="flex items-start gap-2 mt-2 text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{testError || 'Échec de l\'envoi — vérifiez la configuration SMTP.'}</span>
            </div>
          )}
        </div>
      </section>

      {/* ── Templates ────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#1A3A5C]" />
              Modèles d'emails
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Personnalisez le contenu de chaque type de notification.</p>
          </div>
          <Button
            onClick={handleSaveTemplates}
            disabled={savingTemplates}
            className="bg-[#1A3A5C] hover:bg-[#142d47] text-white"
          >
            {savingTemplates
              ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              : savedTemplates
              ? <Check className="w-4 h-4 mr-1.5 text-emerald-300" />
              : <Save className="w-4 h-4 mr-1.5" />
            }
            {savedTemplates ? 'Enregistré !' : 'Enregistrer les modèles'}
          </Button>
        </div>

        {templates.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">Aucun modèle trouvé.</div>
        ) : (
          <div className="space-y-3">
            {templates.map(tpl => (
              <TemplateEditor key={tpl.id} tpl={tpl} onChange={updateTemplate} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
