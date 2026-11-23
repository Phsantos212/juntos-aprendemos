import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Loader2, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useStudentAuth } from '@/lib/auth-context';
import { authError, safeReturnPath, TERMS_VERSION } from '@/lib/student-rules';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
export function AuthForm({ mode, redirect = '/' }: { mode: 'login' | 'signup' | 'forgot'; redirect?: string }) {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [name, setName] = useState(''); const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [sent, setSent] = useState(false);
  const { user, loading, error: sessionError, retry } = useStudentAuth(); const navigate = useNavigate();
  useEffect(() => { if (user && mode !== 'forgot') void navigate({ to: safeReturnPath(redirect), replace: true }); }, [user, mode, redirect, navigate]);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError('');
    if (mode === 'signup' && (!accepted || !name.trim())) { setError('Informe seu nome e aceite os termos para criar sua conta.'); return; }
    setBusy(true);
    try {
      if (mode === 'forgot') {
        const result = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
        if (result.error) throw result.error;
        setSent(true);
      } else if (mode === 'signup') {
        const result = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: `${window.location.origin}/auth?redirect=${encodeURIComponent(safeReturnPath(redirect))}`, data: { full_name: name.trim(), terms_version: TERMS_VERSION } } });
        if (result.error) throw result.error;
        if (result.data.user?.identities?.length === 0) { setError('Este e-mail já está cadastrado. Entre ou recupere sua senha.'); return; }
        setSent(true);
      } else {
        const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (result.error) throw result.error;
      }
    } catch (e) { setError(authError(e instanceof Error ? e : { message: String(e) })); }
    finally { setBusy(false); }
  };
  const title = mode === 'signup' ? 'Crie sua conta de aluno' : mode === 'forgot' ? 'Recuperar senha' : 'Entre para continuar';
  return <div className="mx-auto max-w-md px-4 py-12">
    <p className="text-sm font-semibold text-primary">Aprender Juntos</p><h1 className="mt-2 text-3xl font-semibold">{title}</h1>
    {loading && <p role="status" className="mt-4 flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Verificando sua sessão…</p>}
    {sessionError && <div role="alert" className="mt-4"><p>{sessionError}</p><Button variant="outline" onClick={retry} className="mt-2">Tentar novamente</Button></div>}
    {sent ? <div role="status" className="mt-6 space-y-4"><Mail className="h-8 w-8 text-primary" /><h2 className="text-xl font-semibold">Confira seu e-mail</h2><p>{mode === 'forgot' ? 'Se esse e-mail tiver uma conta, você receberá um link para criar uma nova senha.' : 'Enviamos um link para confirmar sua conta. Você poderá entrar depois da confirmação.'} Confira também a pasta de spam.</p><Button asChild variant="outline"><Link to="/auth" search={{ redirect: safeReturnPath(redirect) }}>Voltar ao login</Link></Button></div> :
    <form onSubmit={submit} className="mt-6 space-y-5">
      {mode === 'signup' && <div className="space-y-2"><Label htmlFor="full-name">Nome do aluno</Label><Input id="full-name" autoComplete="name" required maxLength={120} value={name} onChange={e => setName(e.target.value)} /></div>}
      <div className="space-y-2"><Label htmlFor="email">E-mail</Label><Input id="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
      {mode !== 'forgot' && <div className="space-y-2"><Label htmlFor="password">Senha</Label><Input id="password" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={mode === 'signup' ? 8 : undefined} required value={password} onChange={e => setPassword(e.target.value)} />{mode === 'signup' && <p className="text-sm text-muted-foreground">Use pelo menos 8 caracteres.</p>}</div>}
      {mode === 'signup' && <div className="flex items-start gap-3"><Checkbox id="terms" checked={accepted} onCheckedChange={v => setAccepted(v === true)} aria-required="true" /><Label htmlFor="terms" className="block text-sm leading-relaxed">Li e aceito os <Link to="/termos" target="_blank" className="text-primary underline">Termos de uso</Link> e estou ciente da <Link to="/privacidade" target="_blank" className="text-primary underline">Política de privacidade</Link>.</Label></div>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={busy || loading}>{busy && <Loader2 className="animate-spin" />}{busy ? 'Aguarde…' : mode === 'signup' ? 'Criar conta' : mode === 'forgot' ? 'Enviar link de recuperação' : 'Entrar'}</Button>
      {mode === 'login' && <div className="flex flex-wrap justify-between gap-3 text-sm"><Link to="/esqueci-senha" className="text-primary underline">Esqueci minha senha</Link><Link to="/cadastro" search={{ redirect: safeReturnPath(redirect) }} className="text-primary underline">Criar conta de aluno</Link></div>}
      {mode !== 'login' && <p className="text-sm"><Link to="/auth" search={{ redirect: safeReturnPath(redirect) }} className="text-primary underline">Já tenho conta · Entrar</Link></p>}
    </form>}
  </div>;
}
