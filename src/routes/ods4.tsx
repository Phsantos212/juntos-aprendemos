import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/SiteShell";
import { odsTargets } from "@/lib/data";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/ods4")({
  head: () => ({ meta: [
    { title: "Conheça a ODS 4 — Aprender Juntos" },
    { name: "description", content: "Agenda 2030, as dez metas da ODS 4 e como a educação reduz desigualdades." },
    { property: "og:title", content: "Conheça a ODS 4" },
    { property: "og:description", content: "As dez metas oficiais da ODS 4 e a importância da educação inclusiva." },
  ] }),
  component: Ods4,
});

const topics = [
  ["O que é a Agenda 2030", "Plano global adotado em 2015 por 193 países da ONU, com 17 Objetivos de Desenvolvimento Sustentável e 169 metas para erradicar a pobreza, proteger o planeta e garantir paz e prosperidade."],
  ["O significado da ODS 4", "Assegurar a educação inclusiva, equitativa e de qualidade e promover oportunidades de aprendizagem ao longo da vida para todas e todos."],
  ["Educação inclusiva", "Toda pessoa tem direito de aprender, independentemente de deficiência, origem, gênero ou condição social. A escola se adapta ao estudante, e não o contrário."],
  ["Igualdade de oportunidades", "Acesso gratuito a conteúdos de qualidade reduz a distância entre quem tem e quem não tem recursos."],
  ["Alfabetização e competências", "Ler, escrever, calcular e usar tecnologia com autonomia são a base para trabalho e cidadania."],
  ["Formação de professores", "Professores bem formados e valorizados são o principal fator de qualidade na educação."],
  ["Desenvolvimento sustentável", "A educação forma cidadãos capazes de cuidar do planeta, respeitar a diversidade e promover a paz."],
  ["Redução das desigualdades", "Cada ano a mais de estudo aumenta a renda e a saúde, quebrando ciclos de pobreza entre gerações."],
];
const contrib = [
  ["Cursos gratuitos", "Democratizam o acesso ao conhecimento (metas 4.1, 4.3, 4.4)."],
  ["Biblioteca digital", "Obras e materiais abertos para quem não tem acesso a livros (4.6)."],
  ["Acessibilidade", "Fonte ajustável, modo de leitura e navegação por teclado (4.5)."],
  ["Atividades com feedback", "Aprendizagem ativa com correção imediata (4.1)."],
  ["Gamificação colaborativa", "Motivação sem constrangimento, focada na evolução pessoal."],
  ["Recursos para docentes", "Guias pedagógicos que apoiam a formação contínua (4.c)."],
];

function Ods4() {
  return (
    <>
      <PageHeader title="Conheça a ODS 4" subtitle="Educação de qualidade: o objetivo que sustenta todos os outros." />
      <div className="mx-auto max-w-6xl space-y-16 px-4 py-12">
        <section>
          <h2 className="text-3xl font-semibold">Entenda o tema</h2>
          <Accordion type="single" collapsible className="mt-4">
            {topics.map(([t, d]) => (
              <AccordionItem key={t} value={t}><AccordionTrigger className="text-lg">{t}</AccordionTrigger><AccordionContent className="text-base text-muted-foreground">{d}</AccordionContent></AccordionItem>
            ))}
          </Accordion>
        </section>
        <section>
          <h2 className="text-3xl font-semibold">As dez metas oficiais</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-2">
            {odsTargets.map(([n, t]) => (
              <li key={n} className="flex gap-4 rounded-xl border bg-card p-5"><span className="font-display text-2xl text-primary">{n}</span><p>{t}</p></li>
            ))}
          </ol>
        </section>
        <section>
          <h2 className="text-3xl font-semibold">Como nossa plataforma contribui para a ODS 4</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {contrib.map(([t, d]) => (
              <div key={t} className="rounded-xl bg-secondary p-6"><h3 className="text-xl font-semibold">{t}</h3><p className="mt-2 text-muted-foreground">{d}</p></div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
