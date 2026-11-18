import { describe, expect, it } from "vitest";
import { courses } from "@/lib/data";
import { courseLessons, lessonSources, sourceIdsForLesson } from "@/lib/lessons";

describe("conteúdo integrado dos cursos", () => {
  it.each(courses)("oferece conteúdo em cada módulo de $title", (course) => {
    const lessons = courseLessons[course.id];
    expect(lessons).toHaveLength(course.modules.length);
    for (const lesson of lessons ?? []) {
      expect(lesson.sections.length).toBeGreaterThan(0);
      expect(lesson.objective.length).toBeGreaterThan(0);
      expect(lesson.practice.length).toBeGreaterThan(0);
      expect(lesson.answer.length).toBeGreaterThan(0);
    }
  });
  it("liga todas as explicações a referências externas identificadas", () => {
    for (const lesson of Object.values(courseLessons).flat()) {
      expect(sourceIdsForLesson(lesson).length).toBeGreaterThan(0);
      for (const section of lesson.sections) {
        expect(section.sources.length).toBeGreaterThan(0);
        for (const id of section.sources) {
          const source = lessonSources[id];
          expect(source).toBeDefined();
          if (!source) throw new Error(`Referência ausente: ${id}`);
          expect(new URL(source.url).protocol).toBe("https:");
          expect(source.publisher.length).toBeGreaterThan(0);
        }
      }
    }
  });
});