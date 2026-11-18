import { ExternalLink, BookOpen } from "lucide-react";
import { lessonSources, sourceIdsForLesson, type Lesson } from "@/lib/lessons";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

export function LessonContent({ lesson, referencePrefix }: { lesson: Lesson; referencePrefix: string }) {
  const ids = sourceIdsForLesson(lesson);
  return (
    <div className="space-y-6 text-base leading-relaxed">
      <p className="border-l-2 border-primary pl-4"><span className="font-semibold">Objetivo da aula: </span>{lesson.objective}</p>
      {lesson.sections.map((section) => (
        <section key={section.title}>
          <h3 className="text-xl font-semibold">{section.title}</h3>
          <p className="mt-2">{section.text}</p>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            Fontes: {section.sources.map((id) => {
              const source = lessonSources[id];
              if (!source) return null;
              return <a key={id} href={`#${referencePrefix}-${id}`} className="text-primary underline underline-offset-4">[{ids.indexOf(id) + 1}] {source.publisher}</a>;
            })}
          </p>
        </section>
      ))}
      <section className="border-l-2 border-border pl-4"><h3 className="text-lg font-semibold">Exemplo</h3><p className="mt-2">{lesson.example}</p></section>
      <section>
        <h3 className="text-lg font-semibold">Pratique</h3><p className="mt-2">{lesson.practice}</p>
        <Accordion type="single" collapsible className="mt-2"><AccordionItem value="answer"><AccordionTrigger>Conferir resposta sugerida</AccordionTrigger><AccordionContent className="text-base leading-relaxed">{lesson.answer}</AccordionContent></AccordionItem></Accordion>
      </section>
      <section aria-label="Referências da aula" className="border-t pt-5">
        <h3 className="flex items-center gap-2 text-xl font-semibold"><BookOpen className="h-5 w-5 text-primary" aria-hidden />Referências e materiais complementares</h3>
        <p className="mt-2 text-sm text-muted-foreground">Síntese didática elaborada para o Aprender Juntos com base nas fontes indicadas. Exemplos e atividades são autorais. Os materiais originais permanecem nos sites de seus autores, sujeitos às respectivas condições de uso.</p>
        <ol className="mt-4 space-y-5">
          {ids.map((id, index) => {
            const source = lessonSources[id];
            if (!source) return null;
            return (
              <li key={id} id={`${referencePrefix}-${id}`} className="scroll-mt-24 break-words">
                <p className="font-semibold">[{index + 1}] {source.title}</p>
                <p className="text-sm text-muted-foreground">{source.publisher} · {source.format} · Consultado em {source.accessed}</p>
                <Button asChild variant="link" className="mt-1 h-auto max-w-full justify-start whitespace-normal px-0 text-left"><a href={source.url} target="_blank" rel="noopener noreferrer">Acessar fonte original <ExternalLink aria-hidden /><span className="sr-only"> — {source.title} (abre em nova aba)</span></a></Button>
                <p className="break-all text-xs text-muted-foreground">{source.url}</p>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}