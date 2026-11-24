import { describe, expect, it } from "vitest";
import { authError, nextLesson, normalizeProgress, safeReturnPath } from "@/lib/student-rules";

describe("student-rules", () => {
  it("sanitizes return paths and blocks external or auth loops", () => {
    expect(safeReturnPath("/cursos/redacao")).toBe("/cursos/redacao");
    expect(safeReturnPath("/cursos/redacao?lesson=2")).toBe("/cursos/redacao?lesson=2");
    expect(safeReturnPath("//evil.com")).toBe("/");
    expect(safeReturnPath("https://evil.com")).toBe("/");
    expect(safeReturnPath("/auth")).toBe("/");
    expect(safeReturnPath("/reset-password")).toBe("/");
  });

  it("picks the most recently updated in-progress lesson first", () => {
    const next = nextLesson([
      { lesson_id: "alfabetizacao-digital:0", completed: true, last_position: 100, updated_at: "2026-11-23T10:00:00Z" },
      { lesson_id: "matematica-basica:1", completed: false, last_position: 45, updated_at: "2026-11-23T12:00:00Z" },
      { lesson_id: "redacao:0", completed: false, last_position: 20, updated_at: "2026-11-23T11:00:00Z" },
    ]);
    expect(next).toEqual({ id: "matematica-basica", lesson: 1, title: "Matemática para a Vida" });
  });

  it("picks the next uncompleted lesson in the last studied course when none is in progress", () => {
    const next = nextLesson([
      { lesson_id: "redacao:0", completed: true, last_position: 100, updated_at: "2026-11-23T12:00:00Z" },
    ]);
    expect(next).toEqual({ id: "redacao", lesson: 1, title: "Leitura e Redação" });
  });

  it("normalizes browser progress and discards invalid course IDs or negative points", () => {
    const norm = normalizeProgress({
      points: -50,
      lessonsDone: { redacao: [0, 0, 99, -1], unknown: [0] },
      favorites: ["m1", 42],
    });
    expect(norm.points).toBe(0);
    expect(norm.lessonsDone["redacao"]).toEqual([0]);
    expect(norm.lessonsDone["unknown"]).toBeUndefined();
    expect(norm.favorites).toEqual(["m1"]);
  });

  it("maps auth errors to Portuguese messages", () => {
    expect(authError({ message: "Invalid login credentials" })).toContain("E-mail ou senha incorretos");
    expect(authError({ message: "User already registered" })).toContain("já está cadastrado");
  });
});