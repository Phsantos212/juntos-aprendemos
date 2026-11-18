import { createFileRoute, notFound } from "@tanstack/react-router";
import { CheckCircle2, Circle, Award, PlayCircle, FileText, Headphones } from "lucide-react";
import { courses } from "@/lib/data";
import { useProgress } from "@/lib/progress";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/cursos/$id")({
  loader: ({ params }) => {
    const c = courses.find((x) => x.id === params.id);
    if (!c) throw notFound();
    return c;
  },
  head: ({ loaderData }) => ({ meta: loaderData ? [
    { title: `${loaderData.title} — Aprender Juntos` },
    { name: "description", content: loaderData.description },
    { property: "og:title", content: loaderData.title },
    { property: "og:description", content: loaderData.description },
  ] : [{ title: "Curso indisponível" }, { name: "robots", content: "noindex" }] }),
  component: Curso,
});

const formats = [PlayCircle, FileText, Headphones, FileText];
const formatNames = ["Videoaula (com legendas)", "Texto educativo + PDF", "Podcast + transcrição", "Atividade prática"];

function Curso() {
  const c = Route.useLoaderData();
  const { p, update } = useProgress();
  const done = p.lessonsDone[c.id] ?? [];
  const pct = Math.round((done.length / c.modules.length) * 100);
  const toggle = (i: number) => update((s) => {
    const cur = s.lessonsDone[c.id] ?? [];
    const has = cur.includes(i);
    return { ...s, points: s.points + (has ? -20 : 20), lessonsDone: { ...s.lessonsDone, [c.id]: has ? cur.filter((x) => x !== i) : [...cur, i] } };
  });
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <p className="text-sm font-semibold uppercase tracking-wide text-primary">{c.subject} · {c.level}</p>
      <h1 className="mt-2 text-4xl font-semibold">{c.title}</h1>
      <p className="mt-3 text-lg text-muted-foreground">{c.description}</p>
      <dl className="mt-4 flex flex-wrap gap-6 text-sm"><div><dt className="text-muted-foreground">Professor(a)</dt><dd>{c.teacher}</dd></div><div><dt className="text-muted-foreground">Carga horária</dt><dd>{c.hours} horas</dd></div><div><dt className="text-muted-foreground">Conclusão</dt><dd>{pct}%</dd></div></dl>
      <Progress value={pct} className="mt-4" aria-label={`${pct}% concluído`} />
      <h2 className="mt-10 text-2xl font-semibold">Conteúdo programático</h2>
      <ol className="mt-4 space-y-3">
        {c.modules.map((m, i) => {
          const isDone = done.includes(i); const Icon = formats[i % 4];
          return (
            <li key={m} className="flex items-center gap-4 rounded-xl border bg-card p-4">
              <Icon className="h-6 w-6 shrink-0 text-primary" aria-hidden />
              <div className="flex-1"><p className="font-medium">Aula {i + 1}: {m}</p><p className="text-sm text-muted-foreground">{formatNames[i % 4]}</p></div>
              <Button variant={isDone ? "secondary" : "outline"} size="sm" onClick={() => toggle(i)} aria-pressed={isDone}>
                {isDone ? <CheckCircle2 className="text-success" /> : <Circle />}{isDone ? "Concluída" : "Marcar concluída"}
              </Button>
            </li>
          );
        })}
      </ol>
      {pct === 100 && (
        <div className="mt-10 rounded-2xl border-2 border-primary bg-card p-8 text-center">
          <Award className="mx-auto h-12 w-12 text-primary" aria-hidden />
          <p className="mt-2 text-sm uppercase tracking-widest text-muted-foreground">Certificado de conclusão</p>
          <p className="mt-2 font-display text-2xl">{c.title}</p>
          <p className="mt-1 text-muted-foreground">Carga horária: {c.hours}h · {c.teacher}</p>
          <Button className="mt-4" onClick={() => window.print()}>Imprimir certificado</Button>
        </div>
      )}
    </div>
  );
}
