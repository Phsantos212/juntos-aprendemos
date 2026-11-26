CREATE TABLE public.lesson_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_name text NOT NULL DEFAULT 'Estudante',
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lesson_messages_content_len CHECK (char_length(trim(content)) BETWEEN 1 AND 1000),
  CONSTRAINT lesson_messages_channel_len CHECK (char_length(trim(channel_id)) BETWEEN 1 AND 120)
);

CREATE INDEX lesson_messages_channel_created_idx
  ON public.lesson_messages (channel_id, created_at ASC);

GRANT SELECT, INSERT, DELETE ON public.lesson_messages TO authenticated;
GRANT ALL ON public.lesson_messages TO service_role;

ALTER TABLE public.lesson_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY lesson_messages_select_authenticated
  ON public.lesson_messages
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY lesson_messages_insert_own
  ON public.lesson_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY lesson_messages_delete_own
  ON public.lesson_messages
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.populate_lesson_message_author()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_name text;
BEGIN
  SELECT full_name INTO v_name
  FROM public.profiles
  WHERE id = NEW.user_id;

  NEW.author_name := COALESCE(NULLIF(trim(v_name), ''), 'Estudante');
  NEW.content := trim(NEW.content);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_populate_lesson_message_author
  BEFORE INSERT ON public.lesson_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_lesson_message_author();

ALTER PUBLICATION supabase_realtime ADD TABLE public.lesson_messages;