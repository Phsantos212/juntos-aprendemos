import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { gradeQuizSubmission, type Answer } from "@/lib/quiz";

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