import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export type SidebarTheme = 'dark' | 'light';

const LS_KEY = 'sidebar_theme';

export function useSidebarTheme() {
  const { user } = useAuth();
  // Read from localStorage immediately — no flash on navigation
  const [theme, setThemeState] = useState<SidebarTheme>(() => {
    const stored = localStorage.getItem(LS_KEY);
    return (stored === 'light' || stored === 'dark') ? stored : 'dark';
  });
  const [loading, setLoading] = useState(true);

  // Sync from DB once on mount (in case another device changed it)
  useEffect(() => {
    if (!user) return;
    supabase
      .from('user_preferences')
      .select('sidebar_theme')
      .eq('auth_user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.sidebar_theme) {
          const t = data.sidebar_theme as SidebarTheme;
          setThemeState(t);
          localStorage.setItem(LS_KEY, t);
        }
        setLoading(false);
      });
  }, [user?.id]);

  const setTheme = async (t: SidebarTheme) => {
    if (!user) return;
    // Apply instantly, persist both locally and remotely
    setThemeState(t);
    localStorage.setItem(LS_KEY, t);
    await supabase
      .from('user_preferences')
      .upsert({ auth_user_id: user.id, sidebar_theme: t, updated_at: new Date().toISOString() });
  };

  return { theme, setTheme, loading };
}
