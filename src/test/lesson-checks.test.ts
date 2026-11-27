import { describe, expect, it } from "vitest";
import { courses } from "@/lib/data";
import { lessonChecks } from "@/lib/lesson-checks";
import { verifyLessonCheckAnswer } from "@/lib/lesson-checks.server";

describe("lesson completion verification", () => {
  it("provides a 3-option check and a unique valid server answer for every course lesson", () => {
    for (const course of courses) {
      course.modules.forEach((_, index) => {
        const lessonId = `${course.id}:${index}`;
        const check = lessonChecks[lessonId];
        expect(check).toBeDefined();
        expect(check?.options).toHaveLength(3);
        const validCount = [0, 1, 2].filter((opt) => verifyLessonCheckAnswer(lessonId, opt)).length;
        expect(validCount).toBe(1);
      });
    }
  });

  it("rejects unknown lesson IDs and out-of-range options", () => {
    expect(verifyLessonCheckAnswer("curso-invalido:0", 0)).toBe(false);
    expect(verifyLessonCheckAnswer("redacao:9", 0)).toBe(false);
    expect(verifyLessonCheckAnswer("redacao:0", -1)).toBe(false);
    expect(verifyLessonCheckAnswer("redacao:0", 3)).toBe(false);
  });
});