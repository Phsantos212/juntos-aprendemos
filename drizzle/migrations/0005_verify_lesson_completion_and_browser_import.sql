DROP TRIGGER IF EXISTS lessons_award_points ON public.lesson_progress;
DROP FUNCTION IF EXISTS public.award_lesson_completion_points();

REVOKE INSERT, UPDATE ON public.lesson_progress FROM authenticated;
GRANT INSERT (user_id, lesson_id, last_position) ON public.lesson_progress TO authenticated;
GRANT UPDATE (last_position) ON public.lesson_progress TO authenticated;

DROP POLICY IF EXISTS lessons_insert_own ON public.lesson_progress;
CREATE POLICY lessons_insert_own
  ON public.lesson_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND completed = false
    AND completed_at IS NULL
  );

DROP POLICY IF EXISTS lessons_update_own ON public.lesson_progress;
CREATE POLICY lessons_update_own
  ON public.lesson_progress
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE OR REPLACE FUNCTION public.save_lesson_position(
  p_lesson_id text,
  p_position integer
)
RETURNS public.lesson_progress
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_pos integer := GREATEST(0, LEAST(100, coalesce(p_position, 0)));
  v_row public.lesson_progress;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF p_lesson_id IS NULL OR p_lesson_id !~ '^(alfabetizacao-digital|matematica-basica|redacao|sustentabilidade|historia-brasil|ingles):[0-3]$' THEN
    RAISE EXCEPTION 'Invalid lesson_id';
  END IF;

  INSERT INTO public.lesson_progress (user_id, lesson_id, last_position)
  VALUES (v_uid, p_lesson_id, v_pos)
  ON CONFLICT (user_id, lesson_id)
  DO UPDATE SET last_position = GREATEST(public.lesson_progress.last_position, EXCLUDED.last_position)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.save_lesson_position(text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_lesson_position(text, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.complete_verified_lesson(
  p_user_id uuid,
  p_lesson_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today text := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD');
  v_data jsonb;
  v_was_completed boolean := false;
  v_points integer;
  v_next jsonb;
  v_lesson public.lesson_progress;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid user_id';
  END IF;
  IF p_lesson_id IS NULL OR p_lesson_id !~ '^(alfabetizacao-digital|matematica-basica|redacao|sustentabilidade|historia-brasil|ingles):[0-3]$' THEN
    RAISE EXCEPTION 'Invalid lesson_id';
  END IF;

  SELECT coalesce(learning_data, '{}'::jsonb)
    INTO v_data
    FROM public.profiles
    WHERE id = p_user_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  SELECT completed
    INTO v_was_completed
    FROM public.lesson_progress
    WHERE user_id = p_user_id
      AND lesson_id = p_lesson_id
    FOR UPDATE;

  v_was_completed := coalesce(v_was_completed, false);

  INSERT INTO public.lesson_progress (user_id, lesson_id, last_position, completed, completed_at)
  VALUES (p_user_id, p_lesson_id, 100, true, now())
  ON CONFLICT (user_id, lesson_id)
  DO UPDATE SET
    last_position = 100,
    completed = true,
    completed_at = coalesce(public.lesson_progress.completed_at, now())
  RETURNING * INTO v_lesson;

  IF NOT v_was_completed THEN
    v_points := CASE
      WHEN jsonb_typeof(v_data->'points') = 'number'
      THEN GREATEST(0, floor((v_data->>'points')::numeric)::integer)
      ELSE 0
    END + 20;

    v_next := jsonb_set(
      jsonb_set(v_data, '{points}', to_jsonb(v_points), true),
      '{studyDays}', public.with_study_day(v_data->'studyDays', v_today), true
    );

    UPDATE public.profiles
       SET learning_data = v_next
     WHERE id = p_user_id;
  ELSE
    v_next := v_data;
  END IF;

  RETURN jsonb_build_object(
    'lesson', to_jsonb(v_lesson),
    'learningData', v_next,
    'newlyCompleted', NOT v_was_completed,
    'pointsEarned', CASE WHEN NOT v_was_completed THEN 20 ELSE 0 END
  );
END;
$$;

REVOKE ALL ON FUNCTION public.complete_verified_lesson(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_verified_lesson(uuid, text) TO service_role;

CREATE OR REPLACE FUNCTION public.import_browser_progress(payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  own_profile public.profiles;
  v_existing jsonb;
  v_favorites jsonb := '[]'::jsonb;
  v_history jsonb := '[]'::jsonb;
  v_existing_points integer := 0;
  v_existing_days jsonb := '[]'::jsonb;
  v_existing_quizzes jsonb := '[]'::jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO own_profile FROM public.profiles WHERE id = v_uid FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.profiles(id) VALUES (v_uid) RETURNING * INTO own_profile;
  ELSIF own_profile.browser_migrated_at IS NOT NULL THEN
    RETURN;
  END IF;

  v_existing := coalesce(own_profile.learning_data, '{}'::jsonb);

  IF jsonb_typeof(v_existing->'points') = 'number' THEN
    v_existing_points := GREATEST(0, floor((v_existing->>'points')::numeric)::integer);
  END IF;

  IF jsonb_typeof(v_existing->'studyDays') = 'array' THEN
    v_existing_days := v_existing->'studyDays';
  END IF;

  IF jsonb_typeof(v_existing->'quizzes') = 'array' THEN
    v_existing_quizzes := v_existing->'quizzes';
  END IF;

  IF jsonb_typeof(payload->'favorites') = 'array' THEN
    SELECT coalesce(jsonb_agg(DISTINCT elem), '[]'::jsonb)
      INTO v_favorites
      FROM jsonb_array_elements_text(payload->'favorites') AS elem
      WHERE elem IN ('m1','m2','m3','m4','m5','m6','m7','m8');
  END IF;

  IF jsonb_typeof(payload->'history') = 'array' THEN
    SELECT coalesce(jsonb_agg(elem), '[]'::jsonb)
      INTO v_history
      FROM (
        SELECT DISTINCT elem
        FROM jsonb_array_elements_text(payload->'history') AS elem
        WHERE elem IN ('m1','m2','m3','m4','m5','m6','m7','m8')
        LIMIT 10
      ) sub;
  END IF;

  UPDATE public.profiles
     SET learning_data = jsonb_build_object(
           'points', v_existing_points,
           'favorites', v_favorites,
           'history', v_history,
           'studyDays', v_existing_days,
           'quizzes', v_existing_quizzes
         ),
         browser_migrated_at = now()
   WHERE id = v_uid;
END;
$$;

REVOKE ALL ON FUNCTION public.import_browser_progress(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.import_browser_progress(jsonb) TO authenticated;