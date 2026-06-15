import { useState, useEffect } from 'react';
import { KeyRound, Mail, Eye, EyeOff, LoaderCircle as Loader2, UserPlus, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import type { Member } from '../../types';
import { supabase } from '../../lib/supabase';

interface AgentAccountInfo {
  hasAccount: boolean;
  email: string | null;
  auth_user_id: string | null;
}

interface Props {
  member: Member | null;
  open: boolean;
  onClose: () => void;
}

async function callManageAgent(action: string, payload: Record<string, string>) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-agent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, ...payload }),
  });
  return res.json();
}

export function AgentAccountModal({ member, open, onClose }: Props) {
  const [accountInfo, setAccountInfo] = useState<AgentAccountInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!open || !member) return;
    setError('');
    setSuccess('');
    setPassword('');
    setLoadingInfo(true);
    callManageAgent('get', { member_id: member.id }).then(data => {
      setAccountInfo(data);
      setEmail(data.email ?? member.email ?? '');
      setLoadingInfo(false);
    });
  }, [open, member]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;
    setError('');
    setSuccess('');
    setSaving(true);

    const action = accountInfo?.hasAccount ? 'update' : 'create';
    const payload: Record<string, string> = { member_id: member.id };
    if (email) payload.email = email;
    if (password) payload.password = password;

    const result = await callManageAgent(action, payload);
    setSaving(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(accountInfo?.hasAccount ? 'Compte mis à jour avec succès.' : 'Compte créé avec succès.');
      setAccountInfo(prev => ({ hasAccount: true, email, auth_user_id: prev?.auth_user_id ?? result.user_id ?? null }));
      setPassword('');
    }
  };

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <KeyRound className="w-4 h-4 text-[#1A3A5C]" />
            Compte de {member.full_name}
          </DialogTitle>
        </DialogHeader>

        {loadingInfo ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {!accountInfo?.hasAccount && (
              <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
                <UserPlus className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Cet agent n'a pas encore de compte. Renseignez un email et un mot de passe pour lui créer un accès.</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Adresse email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="agent@exemple.com"
                  className="pl-9 h-9 text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">
                {accountInfo?.hasAccount ? 'Nouveau mot de passe' : 'Mot de passe'}
                {accountInfo?.hasAccount && <span className="text-gray-400 font-normal ml-1">(laisser vide pour ne pas changer)</span>}
              </Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={accountInfo?.hasAccount ? '••••••••' : 'Minimum 6 caractères'}
                  className="pl-9 pr-9 h-9 text-sm"
                  required={!accountInfo?.hasAccount}
                  minLength={password ? 6 : undefined}
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

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
            )}
            {success && (
              <p className="text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">{success}</p>
            )}

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-9 text-sm">
                Fermer
              </Button>
              <Button type="submit" disabled={saving} className="flex-1 h-9 text-sm bg-[#1A3A5C] hover:bg-[#15304d]">
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : accountInfo?.hasAccount ? (
                  <><Save className="w-3.5 h-3.5 mr-1.5" />Enregistrer</>
                ) : (
                  <><UserPlus className="w-3.5 h-3.5 mr-1.5" />Créer le compte</>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
