import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
export const Route = createFileRoute('/_authenticated')({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error && error.status !== 401 && error.status !== 403 && error.name !== 'AuthSessionMissingError') throw new Error('Não foi possível verificar sua conta. Confira a conexão e tente novamente.');
    if (!data.user) throw redirect({ to: '/auth', search: { redirect: location.href } });
  },
  pendingComponent: () => <p role="status" className="mx-auto max-w-4xl px-4 py-12">Verificando seu acesso…</p>,
  errorComponent: ({ reset }) => <div role="alert" className="mx-auto max-w-4xl space-y-4 px-4 py-12"><p>Não foi possível verificar seu acesso. Confira sua conexão.</p><Button onClick={reset}>Tentar novamente</Button></div>,
  component: Outlet,
});
