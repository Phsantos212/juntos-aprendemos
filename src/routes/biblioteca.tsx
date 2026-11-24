import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Heart, Download, Eye, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/SiteShell";
import { courses, materials } from "@/lib/data";
import { useProgress } from "@/lib/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/biblioteca")({
  head: () => ({ meta: [
    { title: "Biblioteca digital — Aprender Juntos" },
    { name: "description", content: "Livros, apostilas, artigos e videoaulas gratuitos com busca e filtros." },
    { property: "og:title", content: "Biblioteca digital gratuita" },
    { property: "og:description", content: "Livros, apostilas, artigos e videoaulas gratuitos." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Biblioteca,
});

function Biblioteca() {
  const { p, update } = useProgress();
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState("");
  const [onlyFav, setOnlyFav] = useState(false);
  const subjects = [...new Set(materials.map((m) => m.subject))];
  const levels = [...new Set(materials.map((m) => m.level))];
  const list = useMemo(() => materials.filter((m) =>
    (!q || (m.title + m.author + m.type).toLowerCase().includes(q.toLowerCase())) &&
    (!subject || m.subject === subject) && (!level || m.level === level) && (!onlyFav || p.favorites.includes(m.id))), [q, subject, level, onlyFav, p.favorites]);
  const fav = (id: string) => update((s) => ({ ...s, favorites: s.favorites.includes(id) ? s.favorites.filter((x) => x !== id) : [...s.favorites, id] }));
  const recordAccess = (id: string) => {
    update((s) => ({ ...s, points: s.points + 5, history: [id, ...s.history.filter((x) => x !== id)].slice(0, 10) }));
  };
  const handleDownload = (id: string, title: string) => {
    recordAccess(id);
    toast(`Baixando apostila: ${title}`, { description: "Material em PDF para uso educacional, respeitando os direitos autorais." });
  };
  const sel = "h-10 rounded-md border bg-background px-3";
  return (
    <>
      <PageHeader title="Biblioteca digital" subtitle="Conteúdos gratuitos e abertos para estudar e ensinar." />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap gap-3">
          <label className="relative flex-1 min-w-60"><span className="sr-only">Pesquisar</span><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden /><Input className="pl-9" placeholder="Pesquisar título, autor ou tipo" value={q} onChange={(e) => setQ(e.target.value)} /></label>
          <select aria-label="Disciplina" className={sel} value={subject} onChange={(e) => setSubject(e.target.value)}><option value="">Todas as disciplinas</option>{subjects.map((s) => <option key={s}>{s}</option>)}</select>
          <select aria-label="Nível de ensino" className={sel} value={level} onChange={(e) => setLevel(e.target.value)}><option value="">Todos os níveis</option>{levels.map((s) => <option key={s}>{s}</option>)}</select>
          <Button variant={onlyFav ? "default" : "outline"} aria-pressed={onlyFav} onClick={() => setOnlyFav(!onlyFav)}><Heart />Favoritos</Button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {list.map((m) => {
            const isFav = p.favorites.includes(m.id);
            const course = courses.find((c) => c.id === m.courseId);
            const lessonTitle = course?.modules[m.lessonIndex];
            return (
              <article key={m.id} className="rounded-xl border bg-card p-5">
                <div className="flex justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase text-primary">{m.type}</p>
                    <h2 className="mt-1 text-lg font-semibold">{m.title}</h2>
                    <p className="text-sm text-muted-foreground">{m.author} · {m.subject} · {m.level}</p>
                    {course && lessonTitle && (
                      <p className="mt-1 text-xs text-muted-foreground">Aula: {course.title} — {lessonTitle}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => fav(m.id)} aria-pressed={isFav} aria-label={isFav ? "Remover dos favoritos" : "Favoritar"}><Heart className={isFav ? "fill-primary text-primary" : ""} /></Button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/cursos/$id" params={{ id: m.courseId }} search={{ lesson: m.lessonIndex }} onClick={() => recordAccess(m.id)}>
                      <Eye />Visualizar aula
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={m.downloadPath} download={m.fileName} onClick={() => handleDownload(m.id, m.title)}>
                      <Download />Baixar apostila
                    </a>
                  </Button>
                </div>
              </article>
            );
          })}
          {list.length === 0 && <p className="text-muted-foreground">Nenhum material encontrado.</p>}
        </div>
        {p.history.length > 0 && (
          <section className="mt-10"><h2 className="text-2xl font-semibold">Acessados recentemente</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {p.history.map((id) => {
                const item = materials.find((m) => m.id === id);
                if (!item) return null;
                return (
                  <li key={id}>
                    <Link to="/cursos/$id" params={{ id: item.courseId }} search={{ lesson: item.lessonIndex }} className="inline-block rounded-full bg-secondary px-3 py-1 text-sm hover:underline">
                      {item.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
