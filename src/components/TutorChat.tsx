import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { courses } from "@/lib/data";
import tutorEmblem from "@/assets/tutor-emblem.jpg";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ai-elements/reasoning";
import { Shimmer } from "@/components/ai-elements/shimmer";

const SUGGESTIONS = [
  "Explique como calcular porcentagem com um exemplo do dia a dia",
  "Como montar uma boa tese para uma redação dissertativa?",
  "Quais são os principais cuidados contra golpes de phishing?",
];

export function TutorChat({
  threadId,
  courseId,
  initialMessages,
}: {
  threadId: string;
  courseId: string | null;
  initialMessages: UIMessage[];
}) {
  const queryClient = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const course = courseId ? courses.find((c) => c.id === courseId) : undefined;

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/tutor-chat",
        body: { threadId, ...(courseId ? { courseId } : {}) },
        headers: async (): Promise<Record<string, string>> => {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    [threadId, courseId],
  );

  const { messages, sendMessage, status, stop } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onFinish: () => {
      void queryClient.invalidateQueries({ queryKey: ["tutor-threads"] });
      requestAnimationFrame(() => textareaRef.current?.focus());
    },
    onError: (err) => {
      let msg = "Não foi possível obter resposta do tutor agora. Tente novamente.";
      try {
        const parsed = JSON.parse(err.message) as { error?: string };
        if (parsed.error) msg = parsed.error;
      } catch {
        if (err.message && !err.message.startsWith("HTTP")) msg = err.message;
      }
      setErrorBanner(msg);
      toast.error(msg);
    },
  });

  useEffect(() => {
    textareaRef.current?.focus();
  }, [threadId]);

  const isBusy = status === "submitted" || status === "streaming";

  const handleSubmit = async (message: PromptInputMessage) => {
    const text = message.text.trim();
    if (!text || isBusy) return;
    setErrorBanner(null);
    await sendMessage({ text });
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const handleSuggestion = (prompt: string) => {
    if (isBusy) return;
    setErrorBanner(null);
    void sendMessage({ text: prompt });
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  return (
    <div className="flex h-[calc(100dvh-13rem)] min-h-[460px] flex-col rounded-2xl border bg-card">
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <img
          src={tutorEmblem}
          alt="Emblema do Tutor Aprender Juntos"
          width={816}
          height={816}
          loading="lazy"
          className="h-9 w-9 shrink-0 rounded-full object-cover"
        />
        <div className="min-w-0">
          <p className="truncate font-semibold leading-tight">Tutor Pedagógico IA</p>
          <p className="truncate text-xs text-muted-foreground">
            {course ? `Contexto: ${course.title}` : "Apoio nos estudos · Aprender Juntos (ODS 4)"}
          </p>
        </div>
      </div>

      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="gap-6 px-4 py-6">
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={
                <img
                  src={tutorEmblem}
                  alt="Tutor Pedagógico IA"
                  width={816}
                  height={816}
                  loading="lazy"
                  className="h-14 w-14 rounded-full object-cover shadow-sm"
                />
              }
              title="Como posso ajudar nos seus estudos hoje?"
              description={
                course
                  ? `Tire dúvidas sobre ${course.title}, peça exemplos práticos ou revise um conceito passo a passo.`
                  : "Pergunte sobre qualquer curso, peça explicações passo a passo ou pratique com exemplos."
              }
            >
              <div className="mt-4 flex max-w-lg flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSuggestion(s)}
                    className="rounded-full border bg-background px-3.5 py-1.5 text-left text-xs text-foreground transition-colors hover:bg-accent"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </ConversationEmptyState>
          ) : (
            messages.map((m, idx) => {
              const isLast = idx === messages.length - 1;
              const isUser = m.role === "user";
              return (
                <Message key={m.id} from={m.role}>
                  <MessageContent
                    className={
                      isUser
                        ? "group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground"
                        : "bg-transparent p-0 text-foreground"
                    }
                  >
                    {m.parts.map((part, pIdx) => {
                      if (part.type === "reasoning") {
                        const streamingReasoning =
                          isLast && status === "streaming" && pIdx === m.parts.length - 1;
                        return (
                          <Reasoning key={`${m.id}-r-${pIdx}`} isStreaming={streamingReasoning}>
                            <ReasoningTrigger />
                            <ReasoningContent>{part.text}</ReasoningContent>
                          </Reasoning>
                        );
                      }
                      if (part.type === "text") {
                        return isUser ? (
                          <p key={`${m.id}-t-${pIdx}`} className="whitespace-pre-wrap break-words">
                            {part.text}
                          </p>
                        ) : (
                          <MessageResponse key={`${m.id}-t-${pIdx}`}>{part.text}</MessageResponse>
                        );
                      }
                      return null;
                    })}
                  </MessageContent>
                </Message>
              );
            })
          )}

          {status === "submitted" && (
            <Message from="assistant">
              <MessageContent className="bg-transparent p-0">
                <Shimmer duration={1.5}>Preparando a explicação…</Shimmer>
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {errorBanner && (
        <p role="alert" className="border-t bg-destructive/10 px-4 py-2 text-xs text-destructive">
          {errorBanner}
        </p>
      )}

      <div className="border-t p-3">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea
            ref={textareaRef}
            placeholder="Digite sua dúvida sobre a aula ou exercício…"
            aria-label="Mensagem para o Tutor de IA"
          />
          <PromptInputFooter className="justify-between">
            <span className="text-xs text-muted-foreground">
              Enter envia · Shift+Enter quebra linha
            </span>
            <PromptInputSubmit
              status={status}
              onStop={stop}
              size="icon-sm"
              aria-label={isBusy ? "Parar resposta" : "Enviar pergunta"}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}