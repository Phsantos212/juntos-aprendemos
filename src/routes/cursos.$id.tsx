import { createFileRoute, notFound } from "@tanstack/react-router";
import { CheckCircle2, Circle, Award, BookOpen } from "lucide-react";
import { courses } from "@/lib/data";
import { useProgress } from "@/lib/progress";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LessonContent } from "@/components/LessonContent";
import { courseLessons } from "@/lib/lessons";

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
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] : [{ title: "Curso indisponível" }, { name: "robots", content: "noindex" }] }),
  component: Curso,
});

function Curso() {
  const c = Route.useLoaderData();
  const { p, update } = useProgress();
  const done = p.lessonsDone[c.id] ?? [];
  const lessons = courseLessons[c.id] ?? [];
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
      <Accordion key={c.id} type="single" collapsible defaultValue="lesson-0" className="mt-4 border-t">
        {c.modules.map((m, i) => {
          const isDone = done.includes(i);
          const lesson = lessons[i];
          if (!lesson) return null;
          return (
            <AccordionItem key={m} value={`lesson-${i}`}>
              <AccordionTrigger className="gap-3 py-5 text-base">
                {isDone ? <CheckCircle2 className="h-6 w-6 shrink-0 text-success" aria-hidden /> : <BookOpen className="h-6 w-6 shrink-0 text-primary" aria-hidden />}
                <span className="min-w-0 flex-1"><span className="block font-semibold">Aula {i + 1}: {m}</span><span className="mt-1 block text-sm font-normal text-muted-foreground">{isDone ? "Concluída" : "Leitura, prática e referências"}</span></span>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <LessonContent lesson={lesson} referencePrefix={`${c.id}-${i}`} />
                <div className="mt-6 flex justify-end">
                  <Button variant={isDone ? "secondary" : "outline"} size="sm" onClick={() => toggle(i)} aria-pressed={isDone}>
                    {isDone ? <CheckCircle2 className="text-success" /> : <Circle />}{isDone ? "Concluída" : "Marcar concluída"}
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
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
