import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database, Json } from '@/integrations/supabase/types';
import { useStudentAuth } from './auth-context';
import { emptyProgress, normalizeProgress, PROGRESS_KEY, type Progress, type LessonRecord } from './student-rules';
import { toast } from 'sonner';
type Profile = Database['public']['Tables']['profiles']['Row'];
type State = { p: Progress; rows: LessonRecord[]; profile: Profile | null; loading: boolean; error: string; saving: boolean; retry: () => void; update: (fn: (p: Progress) => Progress) => void; saveLesson: (id: string, position: number, completed?: boolean, exiting?: boolean) => Promise<boolean>; refresh: () => Promise<void> };
const Context = createContext<State>({ p: emptyProgress, rows: [], profile: null, loading: true, error: '', saving: false, retry: () => {}, update: () => {}, saveLesson: async () => false, refresh: async () => {} });
function readBrowser() { try { return normalizeProgress(JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '{}')); } catch { return normalizeProgress(null); } }
export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user, session, loading: authLoading } = useStudentAuth();
  const [p, setP] = useState<Progress>(emptyProgress); const [rows, setRows] = useState<LessonRecord[]>([]); const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [saving, setSaving] = useState(false); const [attempt, setAttempt] = useState(0);
  const owner = useRef<string | null>(null); const pRef = useRef(p); const rowsRef = useRef(rows); const ready = useRef(false);
  const publish = (base: Progress, records: LessonRecord[]) => {
    const done: Record<string, number[]> = {};
    for (const row of records) if (row.completed) { const [cid, idx] = row.lesson_id.split(':'); if (cid) done[cid] = [...(done[cid] ?? []), Number(idx)]; }
    const next = { ...base, lessonsDone: done }; pRef.current = next; rowsRef.current = records; setP(next); setRows(records);
  };
  const refresh = async () => {
    if (!user) return;
    const uid = user.id;
    const [pr, lessons] = await Promise.all([supabase.from('profiles').select('*').eq('id',uid).single(), supabase.from('lesson_progress').select('*').eq('user_id',uid)]);
    if (owner.current !== uid) return;
    if (pr.error || lessons.error) throw new Error('connection');
    setProfile(pr.data); publish(normalizeProgress(pr.data.learning_data), lessons.data); setError(''); ready.current = true;
  };
  useEffect(() => {
    if (authLoading) return;
    let active = true; owner.current = user?.id ?? null; ready.current = false;
    setP(emptyProgress); pRef.current = emptyProgress; setRows([]); rowsRef.current = []; setProfile(null); setError(''); setLoading(true);
    if (!user) { const guest = readBrowser(); setP(guest); pRef.current = guest; setLoading(false); return; }
    const uid = user.id;
    void (async () => {
      try {
        const pr = await supabase.from('profiles').select('*').eq('id',uid).maybeSingle();
        if (pr.error) throw pr.error;
        if (!active) return;
        if (!pr.data?.browser_migrated_at) {
          const { error: migrationError } = await supabase.rpc('import_browser_progress', { payload: readBrowser() as unknown as Json });
          if (migrationError) throw migrationError;
        }
        if (!active) return;
        await refresh();
        if (active) localStorage.removeItem(PROGRESS_KEY);
      } catch { if (active) setError('Não foi possível carregar ou sincronizar seu progresso. Seus dados anteriores não foram apagados. Tente novamente.'); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; ready.current = false; };
  }, [user?.id, authLoading, attempt]);
  const update = (fn: (p: Progress) => Progress) => {
    if (user && !ready.current) { toast.error('Aguarde o carregamento do progresso ou tente novamente.'); return; }
    const next = normalizeProgress(fn(pRef.current)); const today = new Date().toISOString().slice(0,10);
    if (!next.studyDays.includes(today)) next.studyDays.push(today);
    if (!user) { localStorage.setItem(PROGRESS_KEY, JSON.stringify(next)); pRef.current = next; setP(next); return; }
    setSaving(true); const uid = user.id;
    void supabase.from('profiles').update({ learning_data: next as unknown as Json }).eq('id',uid).then(({ error: e }) => {
      if (owner.current !== uid) return;
      setSaving(false);
      if (e) { setError('Não foi possível salvar. Verifique sua conexão e tente novamente.'); toast.error('Seu resultado não foi salvo. Tente novamente.'); return; }
      pRef.current = next; setP(next);
    });
  };
  const saveLesson = async (id: string, position: number, completed = false, exiting = false) => {
    if (!user || !ready.current) return false;
    const uid = user.id; const old = rowsRef.current.find(r => r.lesson_id === id);
    const isDone = completed || old?.completed === true;
    const record = { user_id: uid, lesson_id: id, last_position: Math.max(0, Math.min(100, Math.floor(position))), completed: isDone, completed_at: isDone ? new Date().toISOString() : null };
    if (exiting && session) {
      const url = import.meta.env['VITE_SUPABASE_URL'];
      const key = import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'];
      if (!url || !key) return false;
      void fetch(`${url}/rest/v1/lesson_progress?on_conflict=user_id,lesson_id`, { method: 'POST', keepalive: true, headers: { apikey: key, Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify(record) }).catch(() => {});
      return true;
    }
    setSaving(true);
    try {
      const result = await supabase.from('lesson_progress').upsert(record, { onConflict: 'user_id,lesson_id' }).select().single();
      if (owner.current !== uid) return false;
      if (result.error) throw result.error;
      publish(pRef.current, [...rowsRef.current.filter(r => r.lesson_id !== id), result.data]); setError('');
      if (completed && !old?.completed) update(s => ({ ...s, points: s.points + 20 }));
      return true;
    } catch { if (owner.current === uid) setError('Seu progresso ainda não foi salvo. Verifique a conexão; tentaremos novamente automaticamente.'); return false; }
    finally { if (owner.current === uid) setSaving(false); }
  };
  return <Context.Provider value={{ p, rows, profile, loading, error, saving, update, saveLesson, refresh, retry: () => setAttempt(n => n+1) }}>{children}</Context.Provider>;
}
export const useCloudProgress = () => useContext(Context);
