import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { logActivity } from '../lib/activityLogger';

export type UserRole = 'super_admin' | 'agent';

interface UserRoleData {
  role: UserRole;
  member_id: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  role: UserRole | null;
  memberId: string | null;
  isSuperAdmin: boolean;
  impersonatedMemberId: string | null;
  setImpersonatedMemberId: (id: string | null) => void;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleData, setRoleData] = useState<UserRoleData | null>(null);
  const [impersonatedMemberId, setImpersonatedMemberId] = useState<string | null>(null);
  // Track previous session to detect login vs page reload
  const prevSessionRef = useRef<Session | null>(null);

  const fetchRole = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role, member_id')
      .eq('auth_user_id', userId)
      .maybeSingle();
    setRoleData(data ?? null);
    return data;
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      prevSessionRef.current = session;
      setSession(session);
      if (session?.user) {
        fetchRole(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session?.user) {
        (async () => {
          const roleInfo = await fetchRole(session.user.id);
          // Only log on actual SIGNED_IN events (not on page reload / token refresh)
          if (event === 'SIGNED_IN' && !prevSessionRef.current) {
            logActivity({
              action: 'auth.login',
              entity_type: 'auth',
              entity_label: session.user.email ?? undefined,
              actor_member_id: roleInfo?.member_id ?? null,
              details: { email: session.user.email, role: roleInfo?.role },
            });
          }
          prevSessionRef.current = session;
        })();
      } else {
        if (event === 'SIGNED_OUT' && prevSessionRef.current) {
          logActivity({
            action: 'auth.logout',
            entity_type: 'auth',
            entity_label: prevSessionRef.current.user.email ?? undefined,
            actor_member_id: roleData?.member_id ?? null,
          });
        }
        prevSessionRef.current = null;
        setRoleData(null);
        setImpersonatedMemberId(null);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const isSuperAdmin = roleData?.role === 'super_admin';

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      loading,
      role: roleData?.role ?? null,
      memberId: roleData?.member_id ?? null,
      isSuperAdmin,
      impersonatedMemberId,
      setImpersonatedMemberId,
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
