import { createFileRoute } from "@tanstack/react-router";
import { Flame, Star, Award, Target, BookCheck, Medal } from "lucide-react";
import { PageHeader } from "@/components/SiteShell";
import { courses } from "@/lib/data";
import { levelFor, streak, useProgress } from "@/lib/progress";
import { Progress } from "@/components/ui/progress";
import { StudentStatus } from "@/components/StudentStatus";

export const Route = createFileRoute("/painel")({
  head: () => ({ meta: [
    { title: "Meu painel — Aprender Juntos" },
    { name: "description", content: "Acompanhe seu progresso, pontos, conquistas e metas de aprendizagem." },
    { property: "og:title", content: "Meu painel de aprendizagem" },
    { property: "og:description", content: "Progresso, conquistas e metas de aprendizagem." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Painel,
});

function Painel() {
  const { p } = useProgress();
  const { level, into } = levelFor(p.points);
  const days = streak(p.studyDays);
  const lessons = Object.values(p.lessonsDone).reduce((n, a) => n + a.length, 0);
  const completed = courses.filter((c) => (p.lessonsDone[c.id]?.length ?? 0) === c.modules.length).length;
  const badges = [
    { name: "Primeiro passo", ok: lessons >= 1, icon: Star },
    { name: "Leitor(a) curioso(a)", ok: p.history.length >= 3, icon: BookCheck },
    { name: "Curso concluído", ok: completed >= 1, icon: Award },
    { name: "3 dias seguidos", ok: days >= 3, icon: Flame },
    { name: "Simulado feito", ok: p.quizzes.length >= 1, icon: Medal },
  ];
  const weekly = Math.min(100, (lessons / 5) * 100);
  return (
    <>
      <PageHeader title="Meu painel" subtitle="Sua evolução é o que importa — cada passo conta." />
      <div className="mx-auto max-w-6xl space-y-10 px-4 py-10">
        <StudentStatus />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[["Pontos", p.points], ["Nível", level], ["Dias seguidos", days], ["Aulas concluídas", lessons]].map(([l, v]) => (
            <div key={l} className="rounded-xl border bg-card p-5"><p className="text-sm text-muted-foreground">{l}</p><p className="font-display text-4xl text-primary">{v}</p></div>
          ))}
        </div>
        <section className="rounded-xl border bg-card p-6"><h2 className="text-xl font-semibold">Evolução para o nível {level + 1}</h2><Progress value={into} className="mt-3" aria-label={`${into} de 100 pontos`} /><p className="mt-1 text-sm text-muted-foreground">{into}/100 pontos</p></section>
        <section className="rounded-xl border bg-card p-6"><h2 className="flex items-center gap-2 text-xl font-semibold"><Target className="text-primary" aria-hidden />Desafio semanal: concluir 5 aulas</h2><Progress value={weekly} className="mt-3" /><p className="mt-1 text-sm text-muted-foreground">{Math.min(lessons, 5)}/5 aulas</p></section>
        <section><h2 className="text-2xl font-semibold">Cursos</h2>
          <div className="mt-4 space-y-3">{courses.map((c) => { const pct = Math.round(((p.lessonsDone[c.id]?.length ?? 0) / c.modules.length) * 100); return (
            <div key={c.id} className="flex items-center gap-4"><span className="w-56 truncate">{c.title}</span><Progress value={pct} className="flex-1" aria-label={`${c.title}: ${pct}%`} /><span className="w-12 text-right text-sm">{pct}%</span></div>); })}</div>
        </section>
        <section><h2 className="text-2xl font-semibold">Conquistas</h2>
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">{badges.map((b) => (
            <li key={b.name} className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center text-sm ${b.ok ? "bg-accent text-accent-foreground" : "opacity-50"}`}><b.icon className="h-8 w-8" aria-hidden />{b.name}<span className="sr-only">{b.ok ? "conquistada" : "bloqueada"}</span></li>))}</ul>
        </section>
        <section><h2 className="text-2xl font-semibold">Notas</h2>
          {p.quizzes.length === 0 ? <p className="mt-2 text-muted-foreground">Faça um simulado em Atividades para ver suas notas.</p> :
            <ul className="mt-3 divide-y rounded-xl border bg-card">{p.quizzes.map((r, k) => <li key={k} className="flex justify-between p-3"><span>Simulado ODS 4 · {r.date}</span><span>{((r.score / r.total) * 10).toFixed(1)}</span></li>)}</ul>}
        </section>
      </div>
    </>
  );
}
