import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, GraduationCap, Library, ListChecks, Trophy, Users, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import hero from "@/assets/hero-educacao.jpg";
import { courses, materials } from "@/lib/data";
import { useStudentAuth } from "@/lib/auth-context";
import { useProgress } from "@/lib/progress";
import { nextLesson } from "@/lib/student-rules";
import { StudentStatus } from "@/components/StudentStatus";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Aprender Juntos — Educação de qualidade para todos" },
    { name: "description", content: "Cursos, biblioteca digital e atividades gratuitas alinhadas à ODS 4 da ONU." },
    { property: "og:title", content: "Aprender Juntos — Educação de qualidade" },
    { property: "og:description", content: "Cursos, biblioteca digital e atividades alinhadas à ODS 4." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Index,
});

const stats = [
  ["244 mi", "crianças e jovens fora da escola no mundo (UNESCO)"],
  ["763 mi", "adultos sem habilidades básicas de leitura"],
  ["44 mi", "professores a mais necessários até 2030"],
  ["100%", "dos conteúdos aqui são gratuitos"],
];
const quick = [
  { to: "/cursos", icon: GraduationCap, label: "Cursos" },
  { to: "/biblioteca", icon: Library, label: "Biblioteca" },
  { to: "/atividades", icon: ListChecks, label: "Atividades" },
  { to: "/painel", icon: Trophy, label: "Meu progresso" },
] as const;

function Index() {
  const { user } = useStudentAuth();
  const { rows } = useProgress();
  const next = user ? nextLesson(rows) : null;
  return (
    <>
      {user && <div className="mx-auto max-w-6xl px-4 pt-4"><StudentStatus /></div>}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 lg:grid-cols-2">
        <div className="animate-rise">
          <span className="inline-flex rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">ODS 4 · Educação de Qualidade</span>
          <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-6xl">Educação de qualidade transforma vidas e constrói futuros.</h1>
          <p className="mt-5 text-lg text-muted-foreground">A ODS 4 da ONU busca garantir educação inclusiva, equitativa e de qualidade, com oportunidades de aprendizagem ao longo da vida para todas as pessoas. Aqui, você aprende no seu ritmo — de graça.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {next ? (
              <Button asChild size="lg">
                <Link to="/cursos/$id" params={{ id: next.id }} search={{ lesson: next.lesson }}>Continuar de onde parei</Link>
              </Button>
            ) : (
              <Button asChild size="lg"><Link to="/cursos">Comece a aprender</Link></Button>
            )}
            <Button asChild size="lg" variant="outline"><Link to="/ods4">Conheça a ODS 4</Link></Button>
          </div>
          {next && <p className="mt-3 text-sm text-muted-foreground">Próxima aula: {next.title} · Aula {next.lesson + 1}</p>}
        </div>
        <img src={hero} alt="Estudantes e professora estudando juntos com livros e notebook" width={1280} height={960} className="rounded-2xl shadow-soft" />
      </section>

      <section className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 sm:grid-cols-4">
        {quick.map((q) => (
          <Link key={q.to} to={q.to} className="flex flex-col items-center gap-2 rounded-xl border bg-card p-5 text-center font-medium transition hover:-translate-y-1 hover:shadow-soft">
            <q.icon className="h-7 w-7 text-primary" aria-hidden />{q.label}
          </Link>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-3xl font-semibold">Por que a educação importa</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(([n, t]) => (
            <div key={n} className="rounded-xl bg-secondary p-6"><p className="font-display text-4xl text-primary">{n}</p><p className="mt-2 text-sm text-muted-foreground">{t}</p></div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4">
        <div className="flex items-end justify-between"><h2 className="text-3xl font-semibold">Cursos em destaque</h2><Link to="/cursos" className="text-primary underline-offset-4 hover:underline">Ver todos</Link></div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {courses.slice(0, 3).map((c) => (
            <Link key={c.id} to="/cursos/$id" params={{ id: c.id }}>
              <Card className="h-full transition hover:shadow-soft"><CardContent className="p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">{c.subject}</p>
                <h3 className="mt-2 text-xl font-semibold">{c.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>
                <p className="mt-4 text-sm">{c.teacher} · {c.hours}h</p>
              </CardContent></Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-16 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-semibold">Materiais recomendados</h2>
          <ul className="mt-4 divide-y rounded-xl border bg-card">
            {materials.slice(0, 4).map((m) => (
              <li key={m.id} className="flex items-center gap-3 p-4"><BookOpen className="h-5 w-5 text-primary" aria-hidden /><div><p className="font-medium">{m.title}</p><p className="text-sm text-muted-foreground">{m.type} · {m.subject}</p></div></li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-3xl font-semibold">Novidades</h2>
          <ul className="mt-4 space-y-3">
            {["Novo curso de Educação para a Sustentabilidade", "Biblioteca ganha 30 obras em domínio público", "Desafio semanal: 5 dias seguidos de estudo"].map((n) => (
              <li key={n} className="rounded-xl border-l-4 border-primary bg-card p-4">{n}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-secondary">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="flex items-center gap-2 text-3xl font-semibold"><Users className="text-primary" aria-hidden />Quem aprende e ensina aqui</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[["Consegui revisar matemática no celular, no ônibus, antes do trabalho.", "Joana, 34 anos, estudante EJA"], ["A biblioteca me poupa horas preparando aulas.", "Prof. Marcos, rede pública"], ["Os modos de leitura me ajudam muito com a dislexia.", "Lucas, 16 anos"]].map(([t, a]) => (
              <figure key={a} className="rounded-xl bg-card p-6"><Quote className="h-6 w-6 text-primary" aria-hidden /><blockquote className="mt-2">{t}</blockquote><figcaption className="mt-3 text-sm text-muted-foreground">— {a}</figcaption></figure>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
