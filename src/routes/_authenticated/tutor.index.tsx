import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStudentAuth } from "@/lib/auth-context";
import { pageHead } from "@/lib/page-head";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/tutor/")({
  validateSearch: (s: Record<string, unknown>): { course?: string } =>
    typeof s["course"] === "string" && s["course"].length > 0 ? { course: s["course"] } : {},
  head: () =>
    pageHead(
      "Tutor de IA",
      "Converse com o tutor pedagógico de IA do Aprender Juntos para tirar dúvidas sobre os cursos.",
    ),
  component: TutorIndex,
});

function TutorIndex() {
  const { course } = Route.useSearch();
  const { user } = useStudentAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!user || startedRef.current) return;
    startedRef.current = true;

    const init = async () => {
      if (!course) {
        const { data: latest, error: listErr } = await supabase
          .from("tutor_threads")
          .select("id")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (listErr) {
          setError("Não foi possível carregar suas conversas.");
          return;
        }
        if (latest) {
          await navigate({ to: "/tutor/$threadId", params: { threadId: latest.id }, replace: true });
          return;
        }
      }

      const { data: created, error: createErr } = await supabase
        .from("tutor_threads")
        .insert({
          user_id: user.id,
          title: "Nova conversa",
          ...(course ? { course_id: course } : {}),
        })
        .select("id")
        .single();

      if (createErr || !created) {
        setError("Não foi possível iniciar uma nova conversa com o tutor.");
        return;
      }
      await navigate({ to: "/tutor/$threadId", params: { threadId: created.id }, replace: true });
    };

    void init();
  }, [user, course, navigate]);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      {error ? (
        <>
          <p role="alert" className="text-destructive">{error}</p>
          <Button onClick={() => { startedRef.current = false; setError(null); }}>
            Tentar novamente
          </Button>
        </>
      ) : (
        <p role="status" className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          Preparando sua conversa com o Tutor de IA…
        </p>
      )}
    </div>
  );
}