CREATE OR REPLACE FUNCTION public.is_valid_message_channel(p_channel_id text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT p_channel_id = 'geral'
    OR p_channel_id ~ '^(alfabetizacao-digital|matematica-basica|redacao|sustentabilidade|historia-brasil|ingles)(:[0-3])?$';
$$;

DROP POLICY IF EXISTS lesson_messages_select_authenticated ON public.lesson_messages;

CREATE POLICY lesson_messages_select_authenticated
  ON public.lesson_messages
  FOR SELECT
  TO authenticated
  USING (
    public.is_valid_message_channel(channel_id)
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS lesson_messages_insert_own ON public.lesson_messages;

CREATE POLICY lesson_messages_insert_own
  ON public.lesson_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND public.is_valid_message_channel(channel_id)
  );

DROP POLICY IF EXISTS lesson_messages_delete_own ON public.lesson_messages;

CREATE POLICY lesson_messages_delete_own
  ON public.lesson_messages
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);