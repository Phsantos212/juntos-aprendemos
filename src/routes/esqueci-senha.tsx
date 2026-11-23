import { createFileRoute } from '@tanstack/react-router';
import { AuthForm } from '@/components/AuthForm';
import { pageHead } from '@/lib/page-head';
export const Route = createFileRoute('/esqueci-senha')({ head: () => pageHead('Recuperar senha', 'Receba por e-mail um link seguro para recuperar o acesso à sua conta.'), component: () => <AuthForm mode="forgot" /> });
