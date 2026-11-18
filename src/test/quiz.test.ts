import { describe, expect, it } from "vitest";
import { gradeQuestion, quiz } from "@/lib/quiz";
describe("correção automática", () => {
  it("múltipla escolha", () => { expect(gradeQuestion(quiz[0]!, 1)).toBe(true); expect(gradeQuestion(quiz[0]!, 0)).toBe(false); });
  it("lacuna ignora maiúsculas e espaços", () => expect(gradeQuestion(quiz[2]!, " Qualidade ")).toBe(true));
  it("associação exige todos os pares", () => { expect(gradeQuestion(quiz[3]!, [1, 0, 2])).toBe(true); expect(gradeQuestion(quiz[3]!, [1, 2, 0])).toBe(false); });
  it("discursiva vai para o professor", () => expect(gradeQuestion(quiz[4]!, "texto")).toBeNull());
});
