export type { Progress } from './student-rules';
export { useCloudProgress as useProgress } from './progress-context';
export function levelFor(points: number) { return { level: Math.floor(points / 100) + 1, into: points % 100 }; }
export function streak(days: string[]) {
  const set = new Set(days); let n = 0; const d = new Date();
  while (set.has(d.toISOString().slice(0,10))) { n++; d.setDate(d.getDate()-1); }
  return n;
}
