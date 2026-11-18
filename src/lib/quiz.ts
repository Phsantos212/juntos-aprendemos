export type Answer = number | string | number[];
type Base = { prompt: string; feedback: string };
export type Question =
  | (Base & { type: "multipla" | "vf"; options: string[]; correct: number })
  | (Base & { type: "lacuna"; correct: string })
  | (Base & { type: "associacao"; left: string[]; right: string[]; correct: number[] })
  | (Base & { type: "discursiva" });

export const quiz: Question[] = [
  { type: "multipla", prompt: "Quantos Objetivos de Desenvolvimento Sustentável compõem a Agenda 2030?", options: ["10", "17", "20", "8"], correct: 1, feedback: "São 17 ODS, com 169 metas." },
  { type: "vf", prompt: "A ODS 4 trata apenas da educação de crianças.", options: ["Verdadeiro", "Falso"], correct: 1, feedback: "Falso: ela inclui a aprendizagem ao longo de toda a vida." },
  { type: "lacuna", prompt: "Complete: a ODS 4 busca uma educação inclusiva, equitativa e de ______.", correct: "qualidade", feedback: "A palavra é “qualidade”." },
  { type: "associacao", prompt: "Associe cada meta ao seu tema.", left: ["Meta 4.2", "Meta 4.6", "Meta 4.c"], right: ["Alfabetização", "Primeira infância", "Professores qualificados"], correct: [1, 0, 2], feedback: "4.2 → primeira infância; 4.6 → alfabetização; 4.c → professores." },
  { type: "discursiva", prompt: "Em poucas linhas, explique como a educação reduz desigualdades.", feedback: "Seu professor dará um retorno em breve." },
];

/** true/false for auto-graded questions, null when it needs a teacher. */
export function gradeQuestion(q: Question, a: Answer | undefined): boolean | null {
  if (q.type === "discursiva") return null;
  if (a === undefined) return false;
  if (q.type === "lacuna") return String(a).trim().toLowerCase() === q.correct;
  if (q.type === "associacao") return Array.isArray(a) && q.correct.every((v, k) => a[k] === v);
  return a === q.correct;
}
