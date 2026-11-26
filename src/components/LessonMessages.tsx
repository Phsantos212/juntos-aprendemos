import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Send, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useStudentAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const MAX_LEN = 1000;

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function LessonMessages({
  channelId,
  title = "Dúvidas e mensagens",
  placeholder = "Escreva sua dúvida ou comentário para a turma…",
  compact = false,
}: {
  channelId: string;
  title?: string;
  placeholder?: string;
  compact?: boolean;
}) {
  const { user } = useStudentAuth();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const queryKey = ["lesson-messages", channelId] as const;

  const { data: messages = [], isLoading, isError, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lesson_messages")
        .select("id, channel_id, user_id, author_name, content, created_at")
        .eq("channel_id", channelId)
        .order("created_at", { ascending: true })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`lesson-messages-${channelId}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "lesson_messages",
          filter: `channel_id=eq.${channelId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [channelId, queryClient, user]);

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error("Faça login para enviar mensagens.");
      const { error } = await supabase.from("lesson_messages").insert({
        channel_id: channelId,
        user_id: user.id,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setText("");
      void queryClient.invalidateQueries({ queryKey });
    },
    onError: () => {
      toast.error("Não foi possível enviar sua mensagem. Tente novamente.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lesson_messages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
      toast.success("Mensagem removida.");
    },
    onError: () => {
      toast.error("Não foi possível remover a mensagem.");
    },
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_LEN) {
      toast.error(`A mensagem pode ter no máximo ${MAX_LEN} caracteres.`);
      return;
    }
    sendMutation.mutate(trimmed);
  };

  return (
    <section className={compact ? "mt-6 border-t pt-5" : "space-y-4"} aria-label={title}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <MessageSquare className="h-5 w-5 text-primary" aria-hidden />
          {title}
        </h3>
        <span className="text-xs text-muted-foreground">
          {messages.length} {messages.length === 1 ? "mensagem" : "mensagens"}
        </span>
      </div>

      {isLoading ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Carregando mensagens…
        </p>
      ) : isError ? (
        <div className="mt-3 flex items-center gap-3 text-sm text-destructive" role="alert">
          <span>Não foi possível carregar as mensagens.</span>
          <Button size="sm" variant="outline" onClick={() => void refetch()}>Tentar novamente</Button>
        </div>
      ) : messages.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Nenhuma mensagem ainda. Seja a primeira pessoa a compartilhar uma dúvida ou dica.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {messages.map((m) => {
            const isMine = user?.id === m.user_id;
            return (
              <li
                key={m.id}
                className={
                  isMine
                    ? "rounded-xl border border-primary/25 bg-accent/60 p-3.5"
                    : "rounded-xl border bg-card p-3.5"
                }
              >
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {m.author_name}{isMine ? " (você)" : ""}
                  </span>
                  <div className="flex items-center gap-2">
                    <time dateTime={m.created_at}>{formatDate(m.created_at)}</time>
                    {isMine && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        aria-label="Excluir mensagem"
                        disabled={deleteMutation.isPending}
                        onClick={() => deleteMutation.mutate(m.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
                <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
                  {m.content}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={onSubmit} className="mt-4 space-y-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          rows={compact ? 2 : 3}
          maxLength={MAX_LEN}
          aria-label={title}
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {text.length}/{MAX_LEN} · Atualização em tempo real
          </span>
          <Button type="submit" size="sm" disabled={!text.trim() || sendMutation.isPending}>
            {sendMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Send className="h-4 w-4" aria-hidden />
            )}
            Enviar mensagem
          </Button>
        </div>
      </form>
    </section>
  );
}