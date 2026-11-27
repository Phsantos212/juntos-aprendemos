import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { courses } from "@/lib/data";
import { pageHead } from "@/lib/page-head";
import { PageHeader } from "@/components/SiteShell";
import { LessonMessages } from "@/components/LessonMessages";
import { cn } from "@/lib/utils";

const CHANNELS = [
  { id: "geral", label: "Comunidade geral", subtitle: "Troque ideias, metas de estudo e avisos com outros alunos." },
  ...courses.map((c) => ({
    id: c.id,
    label: c.title,
    subtitle: `${c.subject} · ${c.teacher}`,
  })),
];

export const Route = createFileRoute("/_authenticated/mensagens")({
  head: () =>
    pageHead(
      "Mensagens e fórum",
      "Converse em tempo real com outros estudantes, tire dúvidas dos cursos e compartilhe dicas de estudo.",
    ),
  component: MensagensPage,
});

function MensagensPage() {
  const [activeId, setActiveId] = useState("geral");
  const current = CHANNELS.find((ch) => ch.id === activeId) ?? CHANNELS[0]!;

  return (
    <>
      <PageHeader
        title="Mensagens e fórum"
        subtitle="Tire dúvidas sobre os cursos e converse em tempo real com a comunidade."
      />
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[260px_1fr]">
        <aside aria-label="Canais de conversa" className="min-w-0 space-y-1">
          <h2 className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Canais disponíveis
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {CHANNELS.map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => setActiveId(ch.id)}
                aria-current={activeId === ch.id ? "true" : undefined}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-2 text-left text-sm transition-colors lg:w-full",
                  activeId === ch.id
                    ? "bg-primary font-semibold text-primary-foreground"
                    : "bg-secondary/60 text-foreground hover:bg-accent",
                )}
              >
                {ch.label}
              </button>
            ))}
          </div>
        </aside>
        <div className="min-w-0 rounded-2xl border bg-card p-6">
          <p className="mb-4 text-sm text-muted-foreground">{current.subtitle}</p>
          <LessonMessages
            channelId={current.id}
            title={current.label}
            placeholder={`Escreva uma mensagem em ${current.label}…`}
          />
        </div>
      </div>
    </>
  );
}