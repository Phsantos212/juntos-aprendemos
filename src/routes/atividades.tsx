import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { PageHeader } from "@/components/SiteShell";
import { useProgress } from "@/lib/progress";
import { gradeQuestion, quiz, type Answer } from "@/lib/quiz";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/atividades")({
  head: () => ({ meta: [
    { title: "Atividades e simulados — Aprender Juntos" },
    { name: "description", content: "Questionário sobre a ODS 4 com correção automática e feedback imediato." },
    { property: "og:title", content: "Atividades e simulados" },
    { property: "og:description", content: "Questionário com correção automática e feedback." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Atividades,
});

function Atividades() {
  const { p, submitQuiz } = useProgress();
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [checked, setChecked] = useState<Record<number, boolean | null>>({});
  const [timer, setTimer] = useState(false);
  const [secs, setSecs] = useState(0);
  const [finished, setFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number; pointsEarned: number } | null>(null);
  useEffect(() => { if (!timer || finished) return; const t = setInterval(() => setSecs((s) => s + 1), 1000); return () => clearInterval(t); }, [timer, finished]);
  const q = quiz[i]!;
  const a = answers[i];
  const set = (v: Answer) => setAnswers({ ...answers, [i]: v });
  const check = () => setChecked({ ...checked, [i]: gradeQuestion(q, a) });
  const auto = quiz.filter((x) => x.type !== "discursiva").length;
  const score = Object.values(checked).filter((v) => v === true).length;
  const finish = async () => {
    if (submitting) return;
    setSubmitting(true);
    const graded = await submitQuiz(answers);
    setSubmitting(false);
    if (!graded) return;
    setResult(graded);
    setFinished(true);
  };
  const restart = () => { setI(0); setAnswers({}); setChecked({}); setSecs(0); setFinished(false); setResult(null); };
  const finalScore = result?.score ?? score;
  const finalTotal = result?.total ?? auto;
  const finalPoints = result?.pointsEarned ?? score * 10;

  return (
    <>
      <PageHeader title="Atividades" subtitle="Simulado: o que você sabe sobre a ODS 4?" />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="flex items-center justify-between text-sm">
          <span>Questão {i + 1} de {quiz.length}</span>
          <label className="flex items-center gap-2">{timer && <span className="flex items-center gap-1 font-mono"><Timer className="h-4 w-4" aria-hidden />{Math.floor(secs / 60)}:{String(secs % 60).padStart(2, "0")}</span>}Cronômetro <Switch checked={timer} onCheckedChange={setTimer} /></label>
        </div>
        {finished ? (
          <div className="mt-6 rounded-2xl border bg-card p-8 text-center">
            <p className="text-sm uppercase tracking-widest text-muted-foreground">Nota final</p>
            <p className="mt-2 font-display text-6xl text-primary">{((finalScore / finalTotal) * 10).toFixed(1)}</p>
            <p className="mt-2">{finalScore} de {finalTotal} questões objetivas corretas · +{finalPoints} pontos</p>
            <p className="mt-1 text-sm text-muted-foreground">A questão discursiva será avaliada pelo professor.</p>
            <Button className="mt-6" onClick={restart}>Refazer</Button>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border bg-card p-6" aria-live="polite">
            <p className="text-xs font-semibold uppercase text-primary">{q.type}</p>
            <h2 className="mt-2 text-xl font-semibold">{q.prompt}</h2>
            <div className="mt-4 space-y-2">
              {(q.type === "multipla" || q.type === "vf") && q.options.map((o, k) => (
                <label key={o} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${a === k ? "border-primary bg-accent" : ""}`}>
                  <input type="radio" name={`q${i}`} checked={a === k} onChange={() => set(k)} className="accent-primary" />{o}
                </label>
              ))}
              {q.type === "lacuna" && <Input aria-label="Resposta" value={(a as string) ?? ""} onChange={(e) => set(e.target.value)} placeholder="Digite a palavra" />}
              {q.type === "associacao" && q.left.map((l, k) => (
                <div key={l} className="flex flex-wrap items-center gap-3"><span className="min-w-40 font-medium">{l}</span>
                  <select aria-label={`Associar ${l}`} className="h-10 rounded-md border bg-background px-3" value={((a as number[]) ?? [])[k] ?? ""} onChange={(e) => { const arr = [...((a as number[]) ?? [])]; arr[k] = Number(e.target.value); set(arr); }}>
                    <option value="">Escolha…</option>{q.right.map((r, j) => <option key={r} value={j}>{r}</option>)}
                  </select></div>
              ))}
              {q.type === "discursiva" && <Textarea aria-label="Resposta discursiva" rows={5} value={(a as string) ?? ""} onChange={(e) => set(e.target.value)} />}
            </div>
            {i in checked && (
              <p className={`mt-4 rounded-lg p-3 ${checked[i] === true ? "bg-secondary text-success" : checked[i] === false ? "bg-accent text-accent-foreground" : "bg-muted"}`}>
                {checked[i] === true ? "Correto! " : checked[i] === false ? "Ainda não. " : "Resposta enviada para correção do professor. "}{q.feedback}
              </p>
            )}
            <div className="mt-6 flex flex-wrap gap-2">
              <Button variant="outline" disabled={i === 0} onClick={() => setI(i - 1)}>Anterior</Button>
              <Button variant="secondary" disabled={a === undefined || i in checked} onClick={check}>Verificar</Button>
              {i < quiz.length - 1 ? <Button onClick={() => setI(i + 1)}>Próxima</Button> : <Button disabled={submitting} onClick={() => void finish()}>{submitting ? "Salvando…" : "Finalizar"}</Button>}
            </div>
          </div>
        )}
        {p.quizzes.length > 0 && (
          <section className="mt-10"><h2 className="text-2xl font-semibold">Histórico de avaliações</h2>
            <ul className="mt-3 divide-y rounded-xl border bg-card">{p.quizzes.slice(0, 5).map((r, k) => <li key={k} className="flex justify-between p-3"><span>{r.date}</span><span>{r.score}/{r.total}</span></li>)}</ul>
          </section>
        )}
      </div>
    </>
  );
}
