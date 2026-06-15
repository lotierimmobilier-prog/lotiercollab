import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export function GoogleOAuthCallback() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');
      const error = params.get('error');

      if (error) {
        setStatus('error');
        setErrorMsg(error === 'access_denied' ? 'Accès refusé' : error);
        if (window.opener) {
          window.opener.postMessage({ type: 'google-oauth-callback', error }, '*');
          setTimeout(() => window.close(), 1500);
        }
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setErrorMsg('Paramètres manquants');
        return;
      }

      // Exchange code for tokens directly from the popup
      try {
        // Get session from opener's supabase (shared localStorage)
        const { data: { session } } = await supabase.auth.getSession();
        const authHeader = session?.access_token
          ? `Bearer ${session.access_token}`
          : `Bearer ${SUPABASE_ANON_KEY}`;

        const res = await fetch(`${SUPABASE_URL}/functions/v1/google-oauth/callback`, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
            'Apikey': SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ code, state }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error ?? `HTTP ${res.status}`);
        }

        setStatus('success');

        if (window.opener) {
          window.opener.postMessage(
            { type: 'google-oauth-callback', success: true, member_id: data.member_id },
            '*'
          );
          setTimeout(() => window.close(), 800);
        } else {
          // Full-page redirect fallback
          sessionStorage.setItem('google_oauth_success', data.member_id ?? 'ok');
          window.location.replace('/calendar');
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setStatus('error');
        setErrorMsg(msg);
        if (window.opener) {
          window.opener.postMessage({ type: 'google-oauth-callback', error: msg }, '*');
          setTimeout(() => window.close(), 2500);
        }
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-sm w-full mx-4 text-center">
        {status === 'processing' && (
          <>
            <div className="w-10 h-10 border-2 border-[#1A3A5C] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-medium text-gray-700">Connexion en cours...</p>
            <p className="text-xs text-gray-400 mt-1">Échange des autorisations Google</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-800">Google Calendar connecté !</p>
            <p className="text-xs text-gray-400 mt-1">Cette fenêtre va se fermer...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-800">Erreur de connexion</p>
            <p className="text-xs text-red-500 mt-1 break-words">{errorMsg}</p>
            <button onClick={() => window.close()} className="mt-4 text-xs text-gray-400 underline hover:text-gray-600">
              Fermer
            </button>
          </>
        )}
      </div>
    </div>
  );
}
