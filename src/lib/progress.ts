import { useEffect, useState } from "react";

export type Progress = {
  points: number;
  lessonsDone: Record<string, number[]>; // courseId -> module indexes
  favorites: string[];
  history: string[];
  quizzes: { date: string; score: number; total: number }[];
  studyDays: string[];
};
const KEY = "aj-progress";
const empty: Progress = { points: 0, lessonsDone: {}, favorites: [], history: [], quizzes: [], studyDays: [] };

function read(): Progress {
  try { return { ...empty, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { return empty; }
}

export function levelFor(points: number) {
  const level = Math.floor(points / 100) + 1;
  return { level, into: points % 100 };
}

export function streak(days: string[]) {
  const set = new Set(days); let n = 0; const d = new Date();
  while (set.has(d.toISOString().slice(0, 10))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

export function useProgress() {
  const [p, setP] = useState<Progress>(empty);
  useEffect(() => setP(read()), []);
  const update = (fn: (p: Progress) => Progress) => {
    const today = new Date().toISOString().slice(0, 10);
    const next = fn(read());
    if (!next.studyDays.includes(today)) next.studyDays = [...next.studyDays, today];
    localStorage.setItem(KEY, JSON.stringify(next));
    setP(next);
  };
  return { p, update };
}
