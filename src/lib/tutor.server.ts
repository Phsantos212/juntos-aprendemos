import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, type UIMessage } from "ai";
import { z } from "zod";
import type { Database, Json } from "@/integrations/supabase/types";
import { courses } from "@/lib/data";
import { createResponsesCall } from "@/lib/ai-gateway/responses.ts";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";
const TUTOR_MODEL = "openai/gpt-6-astra";

const bodySchema = z.object({
  threadId: z.string().uuid(),
  courseId: z.string().max(80).optional(),
  messages: z.array(z.custom<UIMessage>()).min(1).max(80),
});

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    if (
      (supabaseKey.startsWith("sb_publishable_") || supabaseKey.startsWith("sb_secret_")) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }
    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

function jsonError(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function extractText(msg: UIMessage): string {
  return (msg.parts ?? [])
    .filter((p): p is { type: "text"; text: string } => p.type === "text" && typeof p.text === "string")
    .map((p) => p.text)
    .join(" ")
    .trim();
}

function buildInstructions(courseId?: string): string {
  const course = courseId ? courses.find((c) => c.id === courseId) : undefined;
  const context = course
    ? `O aluno está estudando o curso "${course.title}" (${course.subject}, nível ${course.level}), com os módulos: ${course.modules.join(", ")}.`
    : "O aluno usa a plataforma educacional gratuita Aprender Juntos (ODS 4), com cursos de Alfabetização Digital, Matemática Básica, Leitura e Redação, Sustentabilidade, História do Brasil e Inglês Básico.";
  return [
    "Você é o Tutor Pedagógico da plataforma Aprender Juntos, alinhada à ODS 4 (Educação de Qualidade).",
    context,
    "Responda sempre em português claro, acolhedor e acessível.",
    "Explique passo a passo, dê exemplos do cotidiano e incentive o raciocínio do aluno antes de entregar respostas prontas de exercícios.",
    "Mantenha as respostas objetivas e bem estruturadas com listas curtas quando ajudar na leitura.",
  ].join(" ");
}

export async function handleTutorChat(request: Request): Promise<Response> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return jsonError(401, "Serviço de IA não configurado no servidor.");

  const supabaseUrl = process.env["SUPABASE_URL"];
  const supabaseKey = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!supabaseUrl || !supabaseKey) return jsonError(500, "Configuração do servidor incompleta.");

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return jsonError(401, "Faça login para conversar com o tutor.");
  const token = authHeader.slice(7).trim();
  if (!token || token.split(".").length !== 3) return jsonError(401, "Sessão inválida. Entre novamente.");

  const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
    global: { fetch: createSupabaseFetch(supabaseKey), headers: { Authorization: `Bearer ${token}` } },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });

  const { data: claimsData, error: authErr } = await supabase.auth.getClaims(token);
  const userId = claimsData?.claims?.sub;
  if (authErr || !userId) return jsonError(401, "Sessão expirada. Faça login novamente.");

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch {
    return jsonError(400, "Dados da conversa inválidos.");
  }

  const { threadId, messages, courseId } = parsed;
  const { data: thread, error: threadErr } = await supabase
    .from("tutor_threads")
    .select("id, title, course_id")
    .eq("id", threadId)
    .eq("user_id", userId)
    .maybeSingle();

  if (threadErr || !thread) return jsonError(404, "Conversa não encontrada.");

  const lastMsg = messages[messages.length - 1];
  if (lastMsg?.role === "user") {
    const userText = extractText(lastMsg);
    const { data: existing } = lastMsg.id
      ? await supabase
          .from("tutor_messages")
          .select("id")
          .eq("thread_id", threadId)
          .eq("sdk_message_id", lastMsg.id)
          .maybeSingle()
      : { data: null };

    if (!existing) {
      const { error: insErr } = await supabase.from("tutor_messages").insert({
        thread_id: threadId,
        user_id: userId,
        sdk_message_id: lastMsg.id || null,
        role: "user",
        parts: (lastMsg.parts ?? []) as unknown as Json,
      });
      if (insErr) {
        console.error("[tutor-chat] Failed to save user message:", insErr.message);
        return jsonError(500, "Não foi possível salvar sua mensagem. Tente novamente.");
      }
    }

    if (thread.title === "Nova conversa" && userText) {
      const nextTitle = userText.length > 60 ? `${userText.slice(0, 57)}…` : userText;
      const { error: titleErr } = await supabase
        .from("tutor_threads")
        .update({ title: nextTitle })
        .eq("id", threadId)
        .eq("user_id", userId);
      if (titleErr) console.error("[tutor-chat] Failed to update thread title:", titleErr.message);
    }
  }

  try {
    const modelMessages = await convertToModelMessages(messages);
    const activeCourseId = courseId ?? thread.course_id ?? undefined;
    const call = createResponsesCall(
      request,
      { baseURL: GATEWAY_URL, apiKey, model: TUTOR_MODEL },
      modelMessages,
      buildInstructions(activeCourseId),
      {
        originalMessages: messages,
        onFinish: async ({ responseMessage }) => {
          const { error: saveErr } = await supabase.from("tutor_messages").insert({
            thread_id: threadId,
            user_id: userId,
            sdk_message_id: responseMessage.id || null,
            role: "assistant",
            parts: (responseMessage.parts ?? []) as unknown as Json,
          });
          if (saveErr) {
            console.error("[tutor-chat] Failed to save assistant message:", saveErr.message);
            return;
          }
          await supabase
            .from("tutor_threads")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", threadId)
            .eq("user_id", userId);
        },
      },
    );
    return await call.response();
  } catch (err) {
    if (request.signal.aborted || (err instanceof Error && err.name === "AbortError")) {
      return new Response(null, { status: 499 });
    }
    const status = typeof (err as { statusCode?: number })?.statusCode === "number"
      ? (err as { statusCode: number }).statusCode
      : 500;
    if (status === 402) return jsonError(402, "Créditos de IA esgotados. Atualize seu plano para continuar.");
    if (status === 403) return jsonError(403, "Acesso ao modelo de IA indisponível no momento.");
    if (status === 429) return jsonError(429, "Muitas perguntas em seguida. Aguarde alguns segundos e tente novamente.");
    console.error("[tutor-chat] Gateway error:", err);
    return jsonError(status >= 400 && status < 600 ? status : 500, "Não foi possível obter resposta do tutor agora.");
  }
}