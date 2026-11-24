import { courses } from './data';
export type LessonRecord = { lesson_id: string; completed: boolean; last_position: number; updated_at: string };
export const TERMS_VERSION = '2026-11-23';
export const PROGRESS_KEY = 'aj-progress';
export const emptyProgress = { points: 0, lessonsDone: {} as Record<string, number[]>, favorites: [] as string[], history: [] as string[], quizzes: [] as { date: string; score: number; total: number }[], studyDays: [] as string[] };
export type Progress = typeof emptyProgress;
export function normalizeProgress(value: unknown): Progress {
  if (!value || typeof value !== 'object') return { ...emptyProgress };
  const v = value as Partial<Progress>;
  const lessonsDone: Record<string, number[]> = {};
  for (const course of courses) {
    const indexes = v.lessonsDone?.[course.id];
    if (Array.isArray(indexes)) lessonsDone[course.id] = [...new Set(indexes.filter(i => Number.isInteger(i) && i >= 0 && i < course.modules.length))];
  }
  const strings = (a: unknown) => Array.isArray(a) ? a.filter((s): s is string => typeof s === 'string') : [];
  return { points: typeof v.points === 'number' && Number.isFinite(v.points) ? Math.max(0, v.points) : 0, lessonsDone, favorites: strings(v.favorites), history: strings(v.history), studyDays: strings(v.studyDays), quizzes: Array.isArray(v.quizzes) ? v.quizzes.filter(q => q && typeof q.date === 'string' && Number.isFinite(q.score) && Number.isFinite(q.total) && q.total > 0) : [] };
}
export function safeReturnPath(value: unknown) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !value.includes('\\') && !/^\/(auth|reset-password)([/?#]|$)/.test(value) ? value : '/';
}
export function nextLesson(rows: LessonRecord[]) {
  const inProgress = rows.filter(r => !r.completed).sort((a,b) => b.updated_at.localeCompare(a.updated_at))[0];
  if (inProgress) {
    const [id, index] = inProgress.lesson_id.split(':');
    const course = courses.find(c => c.id === id);
    if (course && course.modules[Number(index)]) return { id: course.id, lesson: Number(index), title: course.title };
  }
  const latest = [...rows].sort((a,b) => b.updated_at.localeCompare(a.updated_at))[0];
  const preferred = courses.find(c => c.id === latest?.lesson_id.split(':')[0]);
  const ordered = preferred ? [preferred, ...courses.filter(c => c !== preferred)] : courses;
  for (const c of ordered) for (let i = 0; i < c.modules.length; i++) {
    if (!rows.some(r => r.lesson_id === `${c.id}:${i}` && r.completed)) return { id: c.id, lesson: i, title: c.title };
  }
  return null;
}
export function authError(error: { message?: string | undefined; code?: string | undefined }) {
  const message = error.message?.toLowerCase() ?? '';
  if (message.includes('invalid login')) return 'E-mail ou senha incorretos. Confira os dados e tente novamente.';
  if (message.includes('already registered') || error.code === 'user_already_exists') return 'Este e-mail já está cadastrado. Entre ou recupere sua senha.';
  if (message.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar. Confira sua caixa de entrada e o spam.';
  if (message.includes('rate limit')) return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
  if (message.includes('password')) return 'Não foi possível atualizar a senha. Confira a senha atual e use uma nova senha com pelo menos 8 caracteres.';
  if (message.includes('expired') || message.includes('token')) return 'Este link expirou ou já foi utilizado. Solicite um novo e-mail de recuperação.';
  return 'Não foi possível conectar. Verifique sua conexão e tente novamente.';
}
