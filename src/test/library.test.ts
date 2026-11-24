import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { courses, materials } from "@/lib/data";
import { courseLessons } from "@/lib/lessons";

describe("biblioteca digital funcional", () => {
  it("vincula cada material a uma aula existente", () => {
    for (const m of materials) {
      const course = courses.find((c) => c.id === m.courseId);
      expect(course).toBeDefined();
      expect(m.lessonIndex).toBeGreaterThanOrEqual(0);
      expect(m.lessonIndex).toBeLessThan(course?.modules.length ?? 0);
      expect(courseLessons[m.courseId]?.[m.lessonIndex]).toBeDefined();
    }
  });

  it("disponibiliza o PDF de apostila para cada material", () => {
    for (const m of materials) {
      expect(m.downloadPath).toBe(`/downloads/${m.fileName}`);
      expect(m.fileName.endsWith(".pdf")).toBe(true);
      const filePath = resolve(process.cwd(), "public", "downloads", m.fileName);
      expect(existsSync(filePath)).toBe(true);
      expect(statSync(filePath).size).toBeGreaterThan(1024);
    }
  });
});