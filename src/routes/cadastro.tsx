import { createFileRoute } from '@tanstack/react-router';
import { AuthForm } from '@/components/AuthForm';
import { safeReturnPath } from '@/lib/student-rules';
import { pageHead } from '@/lib/page-head';
export const Route = createFileRoute('/cadastro')({ validateSearch: (s: Record<string, unknown>) => ({ redirect: safeReturnPath(s['redirect']) }), head: () => pageHead('Cadastro de alunos', 'Crie sua conta gratuita para estudar e salvar seu progresso.'), component: () => <AuthForm mode="signup" redirect={Route.useSearch().redirect} /> });
