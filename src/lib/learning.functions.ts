import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";
import { gradeQuizSubmission, type Answer } from "@/lib/quiz";
import type { LessonRecord } from "@/lib/student-rules";

const answerValueSchema = z.union([
  z.number().int().min(0).max(20),
  z.string().max(2000),
  z.array(z.number().int().min(0).max(20)).max(10),
]);

const submitQuizSchema = z.object({
  answers: z.record(z.string().regex(/^\d+$/), answerValueSchema),
});

export const submitQuizAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => submitQuizSchema.parse(input))
  .handler(async ({ data, context }) => {
    const answers: Record<number, Answer> = {};
    for (const [key, value] of Object.entries(data.answers)) {
      answers[Number(key)] = value;
    }
    const { score, total, pointsEarned } = gradeQuizSubmission(answers);
    const date = new Date().toLocaleDateString("pt-BR");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: learningData, error } = await supabaseAdmin.rpc("record_graded_quiz", {
      p_user_id: context.userId,
      p_score: score,
      p_total: total,
      p_date: date,
    });
    if (error) {
      throw new Error("Não foi possível salvar o resultado do simulado.");
    }
    return { score, total, pointsEarned, learningData };
  });

const completeLessonSchema = z.object({
  lessonId: z.string().regex(/^(alfabetizacao-digital|matematica-basica|redacao|sustentabilidade|historia-brasil|ingles):[0-3]$/),
  selectedOption: z.number().int().min(0).max(2),
});

type CompleteLessonResult =
  | { passed: false; message: string }
  | { passed: true; lesson: LessonRecord; learningData: Json; newlyCompleted: boolean; pointsEarned: number };

export const completeLessonCheck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => completeLessonSchema.parse(input))
  .handler(async ({ data, context }): Promise<CompleteLessonResult> => {
    const { verifyLessonCheckAnswer } = await import("@/lib/lesson-checks.server");
    if (!verifyLessonCheckAnswer(data.lessonId, data.selectedOption)) {
      return {
        passed: false,
        message: "Resposta incorreta. Revise o conteúdo da aula e tente novamente.",
      };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: result, error } = await supabaseAdmin.rpc("complete_verified_lesson", {
      p_user_id: context.userId,
      p_lesson_id: data.lessonId,
    });
    if (error || !result || typeof result !== "object" || Array.isArray(result)) {
      throw new Error("Não foi possível registrar a conclusão da aula.");
    }

    const payload = result as {
      lesson: LessonRecord;
      learningData: Json;
      newlyCompleted: boolean;
      pointsEarned: number;
    };
    return {
      passed: true,
      lesson: payload.lesson,
      learningData: payload.learningData,
      newlyCompleted: Boolean(payload.newlyCompleted),
      pointsEarned: typeof payload.pointsEarned === "number" ? payload.pointsEarned : 0,
    };
  });