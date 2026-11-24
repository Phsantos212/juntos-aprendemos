import { createFileRoute } from '@tanstack/react-router';
import { AuthForm } from '@/components/AuthForm';
import { safeReturnPath } from '@/lib/student-rules';
import { pageHead } from '@/lib/page-head';
export const Route = createFileRoute('/auth')({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } =>
    typeof s['redirect'] === 'string' ? { redirect: safeReturnPath(s['redirect']) } : {},
  head: () => pageHead('Login de alunos', 'Entre com seu e-mail para continuar suas aulas e acessar seu progresso.'),
  component: () => <AuthForm mode="login" redirect={Route.useSearch().redirect ?? '/'} />,
});
