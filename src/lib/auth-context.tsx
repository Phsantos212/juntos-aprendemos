import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
const AuthContext = createContext<{ user: User | null; session: Session | null; loading: boolean; error: string; retry: () => void; signOut: () => Promise<void> }>({ user: null, session: null, loading: true, error: '', retry: () => {}, signOut: async () => {} });
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, retry] = useState(0);
  const queryClient = useQueryClient(); const router = useRouter(); const navigate = useNavigate();
  useEffect(() => {
    let active = true;
    const verify = async (nextSession: Session | null) => {
      if (!nextSession) { if (active) { setUser(null); setSession(null); setLoading(false); setError(''); } return; }
      try {
        const result = await supabase.auth.getUser();
        if (!active) return;
        if (result.error) { setError('Não foi possível verificar sua conta. Tente novamente.'); setUser(null); }
        else { setUser(result.data.user); setSession(nextSession); setError(''); }
      } catch { if (active) setError('Falha de conexão ao verificar sua conta.'); }
      finally { if (active) setLoading(false); }
    };
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'TOKEN_REFRESHED') { setSession(nextSession); return; }
      if (event !== 'SIGNED_IN' && event !== 'SIGNED_OUT' && event !== 'USER_UPDATED' && event !== 'INITIAL_SESSION' && event !== 'PASSWORD_RECOVERY') return;
      if (event === 'SIGNED_OUT') { setUser(null); setSession(null); }
      setTimeout(() => { if (active) void verify(nextSession); }, 0);
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        void router.invalidate();
        if (event !== 'SIGNED_OUT') void queryClient.invalidateQueries();
      }
    });
    void supabase.auth.getSession().then(({ data, error: e }) => { if (e) { if (active) { setError('Não foi possível recuperar sua sessão.'); setLoading(false); } } else void verify(data.session); }).catch(() => { if (active) { setError('Falha de conexão. Tente novamente.'); setLoading(false); } });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, [queryClient, router, attempt]);
  const signOut = async () => {
    await queryClient.cancelQueries(); queryClient.clear();
    const { error: e } = await supabase.auth.signOut();
    if (e) { toast.error('Não foi possível sair. Tente novamente.'); return; }
    setUser(null); setSession(null);
    await navigate({ to: '/auth', replace: true });
  };
  return <AuthContext.Provider value={{ user, session, loading, error, retry: () => { setLoading(true); retry(n => n+1); }, signOut }}>{children}</AuthContext.Provider>;
}
export const useStudentAuth = () => useContext(AuthContext);
