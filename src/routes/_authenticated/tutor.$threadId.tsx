import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UIMessage } from "ai";
import { Loader2, MessageSquarePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useStudentAuth } from "@/lib/auth-context";
import { pageHead } from "@/lib/page-head";
import { Button } from "@/components/ui/button";
import { TutorChat } from "@/components/TutorChat";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/tutor/$threadId")({
  head: () =>
    pageHead(
      "Tutor de IA",
      "Conversa com o tutor pedagógico de IA salva na sua conta do Aprender Juntos.",
    ),
  component: TutorThreadPage,
});

function TutorThreadPage() {
  const { threadId } = Route.useParams();
  const { user } = useStudentAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const threadsQuery = useQuery({
    queryKey: ["tutor-threads", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tutor_threads")
        .select("id, title, course_id, updated_at")
        .order("updated_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: Boolean(user),
  });

  const messagesQuery = useQuery({
    queryKey: ["tutor-messages", threadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tutor_messages")
        .select("id, sdk_message_id, role, parts, created_at")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data.map(
        (row): UIMessage => ({
          id: row.sdk_message_id ?? row.id,
          role: row.role === "user" ? "user" : "assistant",
          parts: Array.isArray(row.parts) ? (row.parts as unknown as UIMessage["parts"]) : [],
        }),
      );
    },
    enabled: Boolean(user && threadId),
  });

  const createThread = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Usuário não autenticado.");
      const { data, error } = await supabase
        .from("tutor_threads")
        .insert({ user_id: user.id, title: "Nova conversa" })
        .select("id")
        .single();
      if (error || !data) throw error ?? new Error("Falha ao criar conversa.");
      return data.id;
    },
    onSuccess: async (newId) => {
      await queryClient.invalidateQueries({ queryKey: ["tutor-threads", user?.id] });
      await navigate({ to: "/tutor/$threadId", params: { threadId: newId } });
    },
    onError: () => {
      toast.error("Não foi possível criar uma nova conversa.");
    },
  });

  const deleteThread = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tutor_threads").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: async (deletedId) => {
      await queryClient.invalidateQueries({ queryKey: ["tutor-threads", user?.id] });
      toast.success("Conversa excluída.");
      if (deletedId === threadId) {
        const remaining = (threadsQuery.data ?? []).filter((t) => t.id !== deletedId);
        if (remaining[0]) {
          await navigate({ to: "/tutor/$threadId", params: { threadId: remaining[0].id }, replace: true });
        } else {
          await navigate({ to: "/tutor", replace: true });
        }
      }
    },
    onError: () => {
      toast.error("Não foi possível excluir a conversa.");
    },
  });

  const threads = threadsQuery.data ?? [];
  const activeThread = threads.find((t) => t.id === threadId);

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[270px_1fr]">
      <aside aria-label="Conversas com o tutor" className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-semibold">Tutor IA</h1>
          <Button
            size="sm"
            onClick={() => createThread.mutate()}
            disabled={createThread.isPending}
          >
            {createThread.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <MessageSquarePlus className="h-4 w-4" aria-hidden />
            )}
            Nova
          </Button>
        </div>

        {threadsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando conversas…</p>
        ) : threads.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma conversa salva ainda.</p>
        ) : (
          <ul className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {threads.map((t) => {
              const active = t.id === threadId;
              return (
                <li key={t.id} className="shrink-0 lg:w-full">
                  <div
                    className={cn(
                      "flex items-center gap-1 rounded-lg border px-2 py-1.5 text-sm transition-colors",
                      active
                        ? "border-primary bg-accent font-semibold text-foreground"
                        : "border-transparent bg-secondary/50 text-foreground hover:bg-accent/60",
                    )}
                  >
                    <Link
                      to="/tutor/$threadId"
                      params={{ threadId: t.id }}
                      className="min-w-0 flex-1 truncate px-1 py-0.5"
                    >
                      {t.title}
                    </Link>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label={`Excluir conversa ${t.title}`}
                      disabled={deleteThread.isPending}
                      onClick={() => deleteThread.mutate(t.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      <section className="min-w-0">
        {messagesQuery.isLoading ? (
          <div className="flex h-[460px] items-center justify-center rounded-2xl border bg-card">
            <p role="status" className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              Carregando histórico da conversa…
            </p>
          </div>
        ) : messagesQuery.isError ? (
          <div className="flex h-[460px] flex-col items-center justify-center gap-3 rounded-2xl border bg-card p-6 text-center">
            <p role="alert" className="text-destructive">Não foi possível carregar esta conversa.</p>
            <Button variant="outline" onClick={() => void messagesQuery.refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : (
          <TutorChat
            key={threadId}
            threadId={threadId}
            courseId={activeThread?.course_id ?? null}
            initialMessages={messagesQuery.data ?? []}
          />
        )}
      </section>
    </div>
  );
}