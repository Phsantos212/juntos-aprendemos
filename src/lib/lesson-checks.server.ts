const lessonCheckAnswers: Record<string, number> = {
  "alfabetizacao-digital:0": 0,
  "alfabetizacao-digital:1": 1,
  "alfabetizacao-digital:2": 0,
  "alfabetizacao-digital:3": 1,
  "matematica-basica:0": 0,
  "matematica-basica:1": 1,
  "matematica-basica:2": 0,
  "matematica-basica:3": 0,
  "redacao:0": 1,
  "redacao:1": 0,
  "redacao:2": 1,
  "redacao:3": 0,
  "sustentabilidade:0": 1,
  "sustentabilidade:1": 0,
  "sustentabilidade:2": 0,
  "sustentabilidade:3": 0,
  "historia-brasil:0": 0,
  "historia-brasil:1": 1,
  "historia-brasil:2": 0,
  "historia-brasil:3": 1,
  "ingles:0": 0,
  "ingles:1": 0,
  "ingles:2": 0,
  "ingles:3": 0,
};

export function verifyLessonCheckAnswer(lessonId: string, selectedOption: number): boolean {
  const expected = lessonCheckAnswers[lessonId];
  return typeof expected === "number" && Number.isInteger(selectedOption) && selectedOption === expected;
}