import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export type ModuleKey =
  | 'module_memos'
  | 'module_calendar'
  | 'module_messaging'
  | 'module_tracfin'
  | 'module_projects'
  | 'module_tasks'
  | 'module_mydoc';

export type ModuleAccess = Record<ModuleKey, boolean>;

const DEFAULT_ACCESS: ModuleAccess = {
  module_memos: true,
  module_calendar: true,
  module_messaging: true,
  module_tracfin: true,
  module_projects: true,
  module_tasks: true,
  module_mydoc: true,
};

interface ModuleAccessContextValue {
  access: ModuleAccess;
  loading: boolean;
  refetch: () => void;
}

const ModuleAccessContext = createContext<ModuleAccessContextValue>({
  access: DEFAULT_ACCESS,
  loading: false,
  refetch: () => {},
});

export function ModuleAccessProvider({ children }: { children: React.ReactNode }) {
  const { session, isSuperAdmin } = useAuth();
  const [access, setAccess] = useState<ModuleAccess>(DEFAULT_ACCESS);
  const [loading, setLoading] = useState(true);

  async function fetchAccess() {
    if (!session?.user.id) { setLoading(false); return; }
    // Super admins always have full access
    if (isSuperAdmin) { setAccess(DEFAULT_ACCESS); setLoading(false); return; }

    const { data } = await supabase
      .from('user_module_access')
      .select('*')
      .eq('auth_user_id', session.user.id)
      .maybeSingle();

    if (data) {
      setAccess({
        module_memos: data.module_memos,
        module_calendar: data.module_calendar,
        module_messaging: data.module_messaging,
        module_tracfin: data.module_tracfin,
        module_projects: data.module_projects,
        module_tasks: data.module_tasks,
        module_mydoc: data.module_mydoc ?? true,
      });
    } else {
      // No row = full access (default)
      setAccess(DEFAULT_ACCESS);
    }
    setLoading(false);
  }

  useEffect(() => { fetchAccess(); }, [session?.user.id, isSuperAdmin]);

  return (
    <ModuleAccessContext.Provider value={{ access, loading, refetch: fetchAccess }}>
      {children}
    </ModuleAccessContext.Provider>
  );
}

export function useModuleAccess() {
  return useContext(ModuleAccessContext);
}

// Utility to get/upsert access for a specific user (admin use)
export async function getModuleAccessForUser(authUserId: string): Promise<ModuleAccess> {
  const { data } = await supabase
    .from('user_module_access')
    .select('*')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (!data) return { ...DEFAULT_ACCESS };
  return {
    module_memos: data.module_memos,
    module_calendar: data.module_calendar,
    module_messaging: data.module_messaging,
    module_tracfin: data.module_tracfin,
    module_projects: data.module_projects,
    module_tasks: data.module_tasks,
    module_mydoc: data.module_mydoc ?? true,
  };
}

export async function setModuleAccessForUser(
  authUserId: string,
  access: ModuleAccess,
  updatedBy: string
): Promise<{ error: Error | null }> {
  const { error } = await supabase.from('user_module_access').upsert({
    auth_user_id: authUserId,
    ...access,
    updated_at: new Date().toISOString(),
    updated_by: updatedBy,
  }, { onConflict: 'auth_user_id' });
  return { error: error ? new Error(error.message) : null };
}
