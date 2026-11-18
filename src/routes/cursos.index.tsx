import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/SiteShell";
import { courses } from "@/lib/data";
import { useProgress } from "@/lib/progress";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/cursos/")({
  head: () => ({ meta: [
    { title: "Cursos gratuitos — Aprender Juntos" },
    { name: "description", content: "Cursos por disciplina com aulas, materiais e certificado de conclusão." },
    { property: "og:title", content: "Cursos gratuitos" },
    { property: "og:description", content: "Cursos por disciplina com certificado de conclusão." },
  ] }),
  component: Cursos,
});

function Cursos() {
  const { p } = useProgress();
  const subjects = ["Todas", ...new Set(courses.map((c) => c.subject))];
  const [s, setS] = useState("Todas");
  const list = courses.filter((c) => s === "Todas" || c.subject === s);
  return (
    <>
      <PageHeader title="Cursos" subtitle="Escolha uma disciplina e aprenda no seu ritmo." />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por disciplina">
          {subjects.map((x) => <Button key={x} size="sm" variant={s === x ? "default" : "outline"} aria-pressed={s === x} onClick={() => setS(x)}>{x}</Button>)}
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => {
            const pct = Math.round(((p.lessonsDone[c.id]?.length ?? 0) / c.modules.length) * 100);
            return (
              <Link key={c.id} to="/cursos/$id" params={{ id: c.id }} className="rounded-xl border bg-card p-6 transition hover:shadow-soft">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">{c.subject} · {c.level}</p>
                <h2 className="mt-2 text-xl font-semibold">{c.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>
                <p className="mt-3 text-sm">{c.teacher} · {c.hours}h</p>
                <Progress value={pct} className="mt-4" aria-label={`${pct}% concluído`} />
                <p className="mt-1 text-xs text-muted-foreground">{pct}% concluído</p>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
