import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock, Award, BookOpen, Bot } from "lucide-react";
import { courses } from "@/lib/data";
import { useProgress } from "@/lib/progress";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LessonContent } from "@/components/LessonContent";
import { LessonMessages } from "@/components/LessonMessages";
import { StudentStatus } from "@/components/StudentStatus";
import { courseLessons } from "@/lib/lessons";
import { lessonChecks } from "@/lib/lesson-checks";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/cursos/$id")({
  validateSearch: (s: Record<string, unknown>): { lesson?: number } => {
    const n = Number(s["lesson"]);
    return Number.isInteger(n) && n >= 0 ? { lesson: n } : {};
  },
  loader: ({ params }) => {
    const c = courses.find((x) => x.id === params.id);
    if (!c) throw notFound();
    return c;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} — Aprender Juntos` },
          { name: "description", content: loaderData.description },
          { property: "og:title", content: loaderData.title },
          { property: "og:description", content: loaderData.description },
          { property: "og:type", content: "website" },
          { name: "twitter:card", content: "summary_large_image" },
        ]
      : [{ title: "Curso indisponível" }, { name: "robots", content: "noindex" }],
  }),
  component: Curso,
});

function Curso() {
  const c = Route.useLoaderData();
  const search = Route.useSearch();
  const { p, rows, loading, saveLesson, completeLesson } = useProgress();
  const done = p.lessonsDone[c.id] ?? [];
  const lessons = courseLessons[c.id] ?? [];
  const pct = Math.round((done.length / c.modules.length) * 100);

  const recordFor = useCallback((i: number) => rows.find((r) => r.lesson_id === `${c.id}:${i}`), [rows, c.id]);
  const nextIndex = (() => {
    const inProg = c.modules.findIndex((_, i) => {
      const r = recordFor(i);
      return r && !r.completed;
    });
    if (inProg >= 0) return inProg;
    const firstPending = c.modules.findIndex((_, i) => !done.includes(i));
    return firstPending >= 0 ? firstPending : null;
  })();

  const initialIndex = search.lesson !== undefined && search.lesson < c.modules.length ? search.lesson : (nextIndex ?? 0);
  const [openValue, setOpenValue] = useState<string>(`lesson-${initialIndex}`);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [checkErrors, setCheckErrors] = useState<Record<string, string>>({});
  const [checkingLesson, setCheckingLesson] = useState<string | null>(null);
  const activeIdx = openValue.startsWith("lesson-") ? Number(openValue.slice(7)) : null;
  const contentRef = useRef<HTMLDivElement | null>(null);
  const positionRef = useRef(0);
  const lastSavedRef = useRef(-1);
  const resumedRef = useRef<string>("");

  useEffect(() => {
    if (search.lesson !== undefined && search.lesson < c.modules.length) setOpenValue(`lesson-${search.lesson}`);
  }, [c.id, search.lesson, c.modules.length]);

  const calcScrollPct = useCallback(() => {
    const el = contentRef.current;
    if (!el) return positionRef.current;
    const rect = el.getBoundingClientRect();
    const total = Math.max(1, el.offsetHeight - window.innerHeight * 0.5);
    const scrolled = Math.max(0, window.innerHeight * 0.35 - rect.top);
    return Math.max(positionRef.current, Math.min(100, Math.round((scrolled / total) * 100)));
  }, []);

  // Register lesson start, resume scroll position, periodic save, and save on exit
  useEffect(() => {
    if (loading || activeIdx === null) return;
    const lessonId = `${c.id}:${activeIdx}`;
    const existing = recordFor(activeIdx);
    const initialPos = existing?.last_position ?? 0;
    positionRef.current = initialPos;
    lastSavedRef.current = existing ? initialPos : -1;

    if (!existing) {
      lastSavedRef.current = 0;
      void saveLesson(lessonId, 0);
    } else if (initialPos > 5 && initialPos < 95 && resumedRef.current !== lessonId) {
      resumedRef.current = lessonId;
      requestAnimationFrame(() => {
        const el = contentRef.current;
        if (!el) return;
        const top = el.getBoundingClientRect().top + window.scrollY + (el.offsetHeight * initialPos) / 100 - 120;
        window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      });
    }

    const onScroll = () => {
      const nextPos = calcScrollPct();
      positionRef.current = nextPos;
      if (nextPos >= 95 && lastSavedRef.current < 100) {
        lastSavedRef.current = 100;
        void saveLesson(lessonId, 100);
      }
    };

    const timer = window.setInterval(() => {
      const pos = calcScrollPct();
      positionRef.current = pos;
      if (pos > lastSavedRef.current) {
        lastSavedRef.current = pos;
        void saveLesson(lessonId, pos);
      }
    }, 5000);

    const flushExit = () => {
      const pos = calcScrollPct();
      if (pos > lastSavedRef.current) {
        lastSavedRef.current = pos;
        void saveLesson(lessonId, pos, true);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", flushExit);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", flushExit);
      window.clearInterval(timer);
      flushExit();
    };
  }, [loading, activeIdx, c.id, recordFor, saveLesson, calcScrollPct]);

  const finishLesson = async (i: number) => {
    const lessonId = `${c.id}:${i}`;
    const chosen = selectedAnswers[lessonId];
    if (chosen === undefined) {
      setCheckErrors((prev) => ({ ...prev, [lessonId]: "Escolha uma alternativa antes de concluir a aula." }));
      return;
    }
    setCheckingLesson(lessonId);
    setCheckErrors((prev) => {
      const next = { ...prev };
      delete next[lessonId];
      return next;
    });
    const res = await completeLesson(lessonId, chosen);
    setCheckingLesson(null);
    if (!res.passed) {
      setCheckErrors((prev) => ({
        ...prev,
        [lessonId]: res.message ?? "Resposta incorreta. Revise o conteúdo da aula e tente novamente.",
      }));
      return;
    }
    lastSavedRef.current = 100;
    positionRef.current = 100;
    toast.success(res.pointsEarned > 0 ? `Aula concluída! +${res.pointsEarned} pontos.` : "Aula concluída e salva na sua conta.");
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <StudentStatus />
      <p className="text-sm font-semibold uppercase tracking-wide text-primary">{c.subject} · {c.level}</p>
      <h1 className="mt-2 text-4xl font-semibold">{c.title}</h1>
      <p className="mt-3 text-lg text-muted-foreground">{c.description}</p>
      <dl className="mt-4 flex flex-wrap gap-6 text-sm">
        <div><dt className="text-muted-foreground">Professor(a)</dt><dd>{c.teacher}</dd></div>
        <div><dt className="text-muted-foreground">Carga horária</dt><dd>{c.hours} horas</dd></div>
        <div><dt className="text-muted-foreground">Conclusão</dt><dd>{pct}%</dd></div>
      </dl>
      <Progress value={pct} className="mt-4" aria-label={`${pct}% concluído`} />
      <h2 className="mt-10 text-2xl font-semibold">Conteúdo programático</h2>
      <Accordion key={c.id} type="single" collapsible value={openValue} onValueChange={setOpenValue} className="mt-4 border-t">
        {c.modules.map((m, i) => {
          const record = recordFor(i);
          const isDone = done.includes(i) || record?.completed === true;
          const inProgress = !isDone && Boolean(record);
          const isNext = nextIndex === i;
          const lesson = lessons[i];
          if (!lesson) return null;
          const statusText = isDone ? "Concluída" : inProgress ? `Em andamento${record && record.last_position > 0 ? ` · ${record.last_position}%` : ""}` : "Não iniciada";
          return (
            <AccordionItem key={m} value={`lesson-${i}`}>
              <AccordionTrigger className="gap-3 py-5 text-base">
                {isDone ? <CheckCircle2 className="h-6 w-6 shrink-0 text-success" aria-hidden /> : inProgress ? <Clock className="h-6 w-6 shrink-0 text-primary" aria-hidden /> : <BookOpen className="h-6 w-6 shrink-0 text-muted-foreground" aria-hidden />}
                <span className="min-w-0 flex-1 text-left">
                  <span className="flex flex-wrap items-center gap-2 font-semibold">
                    <span>Aula {i + 1}: {m}</span>
                    {isNext && <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">Continuar de onde parei</span>}
                  </span>
                  <span className="mt-1 block text-sm font-normal text-muted-foreground">{statusText}</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <div ref={activeIdx === i ? contentRef : null}>
                  {inProgress && record && record.last_position > 5 && (
                    <p className="mb-4 text-sm text-muted-foreground">Retomando de onde você parou ({record.last_position}%).</p>
                  )}
                  <LessonContent lesson={lesson} referencePrefix={`${c.id}-${i}`} />
                  {!isDone && lessonChecks[`${c.id}:${i}`] && (
                    <fieldset className="mt-6 rounded-xl border bg-muted/30 p-4">
                      <legend className="px-1 text-sm font-semibold">Verificação para concluir a aula</legend>
                      <p className="mt-1 text-sm">{lessonChecks[`${c.id}:${i}`]?.prompt}</p>
                      <div className="mt-3 space-y-2">
                        {lessonChecks[`${c.id}:${i}`]?.options.map((opt, optIdx) => {
                          const lessonId = `${c.id}:${i}`;
                          const checked = selectedAnswers[lessonId] === optIdx;
                          return (
                            <label
                              key={opt}
                              className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 text-sm transition-colors ${checked ? "border-primary bg-background" : "border-border bg-background/60 hover:bg-background"}`}
                            >
                              <input
                                type="radio"
                                name={`check-${lessonId}`}
                                value={optIdx}
                                checked={checked}
                                onChange={() => {
                                  setSelectedAnswers((prev) => ({ ...prev, [lessonId]: optIdx }));
                                  setCheckErrors((prev) => {
                                    if (!prev[lessonId]) return prev;
                                    const next = { ...prev };
                                    delete next[lessonId];
                                    return next;
                                  });
                                }}
                                className="mt-0.5 accent-primary"
                              />
                              <span>{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                      {checkErrors[`${c.id}:${i}`] && (
                        <p role="alert" className="mt-3 text-sm font-medium text-destructive">{checkErrors[`${c.id}:${i}`]}</p>
                      )}
                    </fieldset>
                  )}
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                    <p className="text-sm text-muted-foreground">{isDone ? "Aula concluída e salva na sua conta." : "Seu progresso é salvo automaticamente durante a leitura."}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link to="/tutor" search={{ course: c.id }}>
                          <Bot className="h-4 w-4" aria-hidden />
                          Perguntar ao Tutor de IA
                        </Link>
                      </Button>
                      {!isDone && (
                        <Button
                          size="sm"
                          disabled={checkingLesson === `${c.id}:${i}`}
                          onClick={() => void finishLesson(i)}
                        >
                          {checkingLesson === `${c.id}:${i}` ? "Verificando..." : "Concluir aula"}
                        </Button>
                      )}
                    </div>
                  </div>
                  <LessonMessages
                    channelId={`${c.id}:${i}`}
                    title="Dúvidas e mensagens desta aula"
                    compact
                  />
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