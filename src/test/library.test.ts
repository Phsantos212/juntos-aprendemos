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

  it("não oferece download de apostila", () => {
    expect(materials.some((m) => "downloadPath" in m || "fileName" in m)).toBe(false);
  });
});
