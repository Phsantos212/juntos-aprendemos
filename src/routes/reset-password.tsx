import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { authError } from '@/lib/student-rules';
import { pageHead } from '@/lib/page-head';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
export const Route = createFileRoute('/reset-password')({ head: () => pageHead('Nova senha', 'Defina uma nova senha usando seu link de recuperação.'), component: Reset });
function Reset() {
  const [valid, setValid] = useState(false); const [checking, setChecking] = useState(true); const [error, setError] = useState(''); const [password, setPassword] = useState(''); const [confirmation, setConfirmation] = useState(''); const [busy, setBusy] = useState(false); const [done, setDone] = useState(false);
  useEffect(() => {
    const recovery = new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery';
    if (!recovery) { setChecking(false); return; }
    void supabase.auth.getUser().then(({ data, error: e }) => { setValid(!e && Boolean(data.user)); setChecking(false); }).catch(() => { setError('Não foi possível verificar o link. Confira sua conexão e abra o link novamente.'); setChecking(false); });
  }, []);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError(''); if (password !== confirmation) { setError('As senhas não coincidem.'); return; }
    setBusy(true);
    try { const result = await supabase.auth.updateUser({ password }); if (result.error) throw result.error; setDone(true); }
    catch (e) { setError(authError(e instanceof Error ? e : {})); } finally { setBusy(false); }
  };
  return <div className="mx-auto max-w-md px-4 py-12"><h1 className="text-3xl font-semibold">Nova senha</h1>{checking ? <p role="status" className="mt-4">Verificando seu link…</p> : done ? <div className="mt-6 space-y-4" role="status"><p>Senha atualizada com sucesso.</p><Button asChild><Link to="/">Continuar meus estudos</Link></Button></div> : !valid ? <div className="mt-6 space-y-4"><p role="alert">{error || 'Abra o link enviado por e-mail. Ele pode ter expirado ou já ter sido utilizado.'}</p><Button asChild><Link to="/esqueci-senha">Solicitar novo link</Link></Button></div> : <form onSubmit={submit} className="mt-6 space-y-4"><Label htmlFor="new-password">Nova senha</Label><Input id="new-password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} /><Label htmlFor="confirm-password">Confirmar nova senha</Label><Input id="confirm-password" type="password" required minLength={8} autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} />{error && <p role="alert" className="text-destructive">{error}</p>}<Button disabled={busy} type="submit">{busy ? 'Atualizando…' : 'Atualizar senha'}</Button></form>}</div>;
}
