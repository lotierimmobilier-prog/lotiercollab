import { useState, useEffect, useCallback } from 'react';
import { Calendar, RefreshCw, Link2, Link2Off, CircleCheck as CheckCircle2, Clock, CircleAlert as AlertCircle, LoaderCircle as Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { supabase } from '../../lib/supabase';
import type { Member } from '../../types';

interface CalendarStatus {
  connected: boolean;
  sync_enabled?: boolean;
  last_synced_at?: string | null;
  calendar_id?: string;
}

interface Props {
  member: Member | null;
  open: boolean;
  onClose: () => void;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Authorization': `Bearer ${session?.access_token ?? SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };
}

export function GoogleCalendarModal({ member, open, onClose }: Props) {
  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!member) return;
    setLoading(true);
    try {
      const headers = await authHeaders();
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/google-calendar-sync/status?member_id=${member.id}`,
        { headers }
      );
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  }, [member]);

  useEffect(() => {
    if (open && member) {
      setMessage(null);
      fetchStatus();
    }
  }, [open, member, fetchStatus]);

  // Handle OAuth callback via postMessage from popup window
  useEffect(() => {
    if (!open) return;

    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'google-oauth-callback') {
        const { code, state } = event.data;
        if (!code || !state) return;

        setLoading(true);
        setMessage(null);
        try {
          const headers = await authHeaders();
          const res = await fetch(`${SUPABASE_URL}/functions/v1/google-oauth/callback`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ code, state }),
          });
          const data = await res.json();
          if (data.success) {
            setMessage({ type: 'success', text: 'Google Calendar connecté avec succès !' });
            await fetchStatus();
            // Trigger an immediate sync
            await handleSync();
          } else {
            setMessage({ type: 'error', text: data.error ?? 'Erreur de connexion' });
          }
        } catch (e) {
          setMessage({ type: 'error', text: String(e) });
        } finally {
          setLoading(false);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Handle fallback: params stored in sessionStorage after redirect
    const storedCode = sessionStorage.getItem('google_oauth_code');
    const storedState = sessionStorage.getItem('google_oauth_state');
    if (storedCode && storedState) {
      sessionStorage.removeItem('google_oauth_code');
      sessionStorage.removeItem('google_oauth_state');
      handleMessage({ data: { type: 'google-oauth-callback', code: storedCode, state: storedState } } as MessageEvent);
    }

    return () => window.removeEventListener('message', handleMessage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, member]);

  const handleConnect = async () => {
    if (!member) return;
    setMessage(null);
    try {
      const headers = await authHeaders();
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/google-oauth/auth-url?member_id=${member.id}`,
        { headers }
      );
      const data = await res.json();
      if (!data.url) {
        setMessage({ type: 'error', text: 'Impossible de générer le lien OAuth' });
        return;
      }
      // Open OAuth popup
      const popup = window.open(data.url, 'google-oauth', 'width=500,height=650,left=300,top=100');
      if (!popup) {
        // Fallback: redirect current tab
        window.location.href = data.url;
      }
    } catch (e) {
      setMessage({ type: 'error', text: String(e) });
    }
  };

  const handleSync = async () => {
    if (!member) return;
    setSyncing(true);
    setMessage(null);
    try {
      const headers = await authHeaders();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/google-calendar-sync/sync`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ member_id: member.id }),
      });
      const data = await res.json();
      const result = data.results?.[member.id];
      if (result) {
        const errCount = result.errors?.length ?? 0;
        if (errCount > 0) {
          setMessage({ type: 'error', text: `${result.synced} tâche(s) synchronisée(s), ${errCount} erreur(s)` });
        } else {
          setMessage({ type: 'success', text: `${result.synced} tâche(s) synchronisée(s) avec succès` });
        }
      } else {
        setMessage({ type: 'success', text: 'Synchronisation effectuée' });
      }
      await fetchStatus();
    } catch (e) {
      setMessage({ type: 'error', text: String(e) });
    } finally {
      setSyncing(false);
    }
  };

  const handleToggle = async () => {
    if (!member || !status?.connected) return;
    setToggling(true);
    setMessage(null);
    try {
      const headers = await authHeaders();
      await fetch(`${SUPABASE_URL}/functions/v1/google-calendar-sync/toggle`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ member_id: member.id, sync_enabled: !status.sync_enabled }),
      });
      await fetchStatus();
    } catch (e) {
      setMessage({ type: 'error', text: String(e) });
    } finally {
      setToggling(false);
    }
  };

  const handleDisconnect = async () => {
    if (!member) return;
    if (!window.confirm(`Déconnecter Google Calendar de ${member.full_name} ?`)) return;
    setLoading(true);
    setMessage(null);
    try {
      const headers = await authHeaders();
      await fetch(`${SUPABASE_URL}/functions/v1/google-oauth/revoke`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ member_id: member.id }),
      });
      setStatus({ connected: false });
      setMessage({ type: 'success', text: 'Google Calendar déconnecté' });
    } catch (e) {
      setMessage({ type: 'error', text: String(e) });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return 'Jamais';
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));
  };

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Calendar className="w-4 h-4 text-[#1A3A5C]" />
            Google Calendar — {member.full_name}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            {/* Status badge */}
            <div className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${
              status?.connected
                ? status.sync_enabled
                  ? 'bg-emerald-50 border-emerald-100'
                  : 'bg-amber-50 border-amber-100'
                : 'bg-gray-50 border-gray-100'
            }`}>
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                status?.connected
                  ? status.sync_enabled ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                  : 'bg-gray-300'
              }`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${
                  status?.connected
                    ? status.sync_enabled ? 'text-emerald-700' : 'text-amber-700'
                    : 'text-gray-600'
                }`}>
                  {status?.connected
                    ? status.sync_enabled ? 'Synchronisation active' : 'Synchronisation en pause'
                    : 'Non connecté'}
                </p>
                {status?.connected && (
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Dernière synchro : {formatDate(status.last_synced_at)}
                  </p>
                )}
              </div>
            </div>

            {/* Info block */}
            {!status?.connected && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700 space-y-1">
                <p className="font-medium">Comment ça fonctionne :</p>
                <ul className="space-y-0.5 list-disc list-inside text-blue-600">
                  <li>Les tâches assignées à ce collaborateur sont exportées vers son Google Calendar</li>
                  <li>Chaque tâche avec une date d'échéance apparaît comme un événement</li>
                  <li>Les tâches urgentes sont marquées en rouge</li>
                </ul>
              </div>
            )}

            {/* Message feedback */}
            {message && (
              <div className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs border ${
                message.type === 'success'
                  ? 'bg-green-50 border-green-100 text-green-700'
                  : 'bg-red-50 border-red-100 text-red-600'
              }`}>
                {message.type === 'success'
                  ? <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  : <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />}
                {message.text}
              </div>
            )}

            {/* Actions */}
            {status?.connected ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    onClick={handleSync}
                    disabled={syncing || !status.sync_enabled}
                    className="flex-1 h-9 text-sm bg-[#1A3A5C] hover:bg-[#15304d]"
                  >
                    {syncing
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <><RefreshCw className="w-3.5 h-3.5 mr-1.5" />Synchroniser</>
                    }
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleToggle}
                    disabled={toggling}
                    className="flex-1 h-9 text-sm"
                  >
                    {toggling
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : status.sync_enabled
                        ? 'Mettre en pause'
                        : 'Réactiver'
                    }
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  onClick={handleDisconnect}
                  className="w-full h-9 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Link2Off className="w-3.5 h-3.5 mr-1.5" />
                  Déconnecter Google Calendar
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleConnect}
                className="w-full h-10 text-sm bg-[#1A3A5C] hover:bg-[#15304d]"
              >
                <Link2 className="w-4 h-4 mr-2" />
                Connecter Google Calendar
              </Button>
            )}

            <Button variant="outline" onClick={onClose} className="w-full h-9 text-sm">
              Fermer
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
