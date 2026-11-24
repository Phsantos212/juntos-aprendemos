import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { BookOpen, Moon, Sun, Menu, X, Type, Glasses, Minimize2, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStudentAuth } from "@/lib/auth-context";
import { useProgress } from "@/lib/progress";

const nav = [
  { to: "/", label: "Início" },
  { to: "/ods4", label: "Conheça a ODS 4" },
  { to: "/cursos", label: "Cursos" },
  { to: "/biblioteca", label: "Biblioteca" },
  { to: "/atividades", label: "Atividades" },
  { to: "/painel", label: "Meu painel" },
] as const;

function usePref(key: string, init: string) {
  const [v, setV] = useState(init);
  useEffect(() => { const s = localStorage.getItem(key); if (s) setV(s); }, [key]);
  const set = (n: string) => { setV(n); localStorage.setItem(key, n); };
  return [v, set] as const;
}

function A11yBar() {
  const [dark, setDark] = usePref("aj-dark", "0");
  const [font, setFont] = usePref("aj-font", "100");
  const [simple, setSimple] = usePref("aj-simple", "0");
  const [reading, setReading] = usePref("aj-reading", "0");
  useEffect(() => {
    const h = document.documentElement;
    h.classList.toggle("dark", dark === "1");
    h.classList.toggle("simple-mode", simple === "1");
    h.classList.toggle("reading-aid", reading === "1");
    h.style.setProperty("--base-font", font + "%");
  }, [dark, font, simple, reading]);
  const f = Number(font);
  return (
    <div className="border-b bg-secondary text-secondary-foreground">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-end gap-1 px-4 py-1 text-sm" role="toolbar" aria-label="Acessibilidade">
        <span className="mr-auto hidden sm:inline text-muted-foreground">Acessibilidade</span>
        <Button size="sm" variant="ghost" onClick={() => setFont(String(Math.max(85, f - 10)))} aria-label="Diminuir fonte"><Type className="h-3 w-3" />A-</Button>
        <Button size="sm" variant="ghost" onClick={() => setFont(String(Math.min(150, f + 10)))} aria-label="Aumentar fonte"><Type className="h-4 w-4" />A+</Button>
        <Button size="sm" variant="ghost" aria-pressed={reading === "1"} onClick={() => setReading(reading === "1" ? "0" : "1")}><Glasses className="h-4 w-4" />Leitura</Button>
        <Button size="sm" variant="ghost" aria-pressed={simple === "1"} onClick={() => setSimple(simple === "1" ? "0" : "1")}><Minimize2 className="h-4 w-4" />Simplificar</Button>
        <Button size="sm" variant="ghost" aria-pressed={dark === "1"} onClick={() => setDark(dark === "1" ? "0" : "1")} aria-label="Alternar modo escuro">{dark === "1" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</Button>
      </div>
    </div>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { user, loading, signOut } = useStudentAuth();
  const { profile } = useProgress();
  const firstName = profile?.full_name.trim().split(/\s+/)[0] || "Meu perfil";
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-primary focus:p-2 focus:text-primary-foreground">Pular para o conteúdo</a>
      <A11yBar />
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-semibold">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground"><BookOpen className="h-5 w-5" aria-hidden /></span>
            Aprender Juntos
          </Link>
          <nav aria-label="Principal" className="ml-auto hidden gap-1 lg:flex">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} activeOptions={{ exact: n.to === "/" }} className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground" activeProps={{ className: "text-primary bg-accent" }}>{n.label}</Link>
            ))}
          </nav>
          <div className="hidden items-center gap-2 lg:flex">
            {user ? (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/perfil"><User className="h-4 w-4" aria-hidden />{firstName}</Link>
                </Button>
                <Button variant="outline" size="sm" onClick={() => void signOut()}>
                  <LogOut className="h-4 w-4" aria-hidden />Sair
                </Button>
              </>
            ) : !loading ? (
              <Button asChild size="sm">
                <Link to="/auth">Entrar</Link>
              </Button>
            ) : null}
          </div>
          <Button variant="ghost" size="icon" className="ml-auto lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>{open ? <X /> : <Menu />}</Button>
        </div>
        {open && (
          <nav aria-label="Menu móvel" className="flex flex-col border-t px-4 py-2 lg:hidden">
            {nav.map((n) => <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="py-2">{n.label}</Link>)}
            <div className="mt-2 flex flex-wrap gap-2 border-t pt-3 pb-2">
              {user ? (
                <>
                  <Button asChild variant="outline" size="sm" onClick={() => setOpen(false)}>
                    <Link to="/perfil"><User className="h-4 w-4" aria-hidden />{firstName}</Link>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setOpen(false); void signOut(); }}>
                    <LogOut className="h-4 w-4" aria-hidden />Sair
                  </Button>
                </>
              ) : !loading ? (
                <Button asChild size="sm" onClick={() => setOpen(false)}>
                  <Link to="/auth">Entrar</Link>
                </Button>
              ) : null}
            </div>
          </nav>
        )}
      </header>
      <main id="conteudo" className="flex-1">{children}</main>
      <footer className="border-t bg-secondary">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-8 text-sm text-muted-foreground sm:grid-cols-2">
          <p><strong className="text-foreground">Aprender Juntos</strong> — plataforma educacional alinhada à ODS 4 da Agenda 2030 da ONU.</p>
          <div className="flex flex-wrap gap-4 sm:justify-end">
            <Link to="/termos" className="underline-offset-4 hover:underline">Termos de uso</Link>
            <Link to="/privacidade" className="underline-offset-4 hover:underline">Política de privacidade</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <section className="bg-hero text-primary-foreground">
      <div className="mx-auto max-w-6xl px-4 py-12 animate-rise">
        <h1 className="text-4xl font-semibold sm:text-5xl">{title}</h1>
        <p className="mt-3 max-w-2xl opacity-90">{subtitle}</p>
      </div>
    </section>
  );
}
