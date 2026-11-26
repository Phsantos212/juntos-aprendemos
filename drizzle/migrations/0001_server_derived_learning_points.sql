REVOKE INSERT, UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, avatar_path) ON public.profiles TO authenticated;
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;

REVOKE DELETE ON public.lesson_progress FROM authenticated;
DROP POLICY IF EXISTS lessons_delete_own ON public.lesson_progress;

CREATE OR REPLACE FUNCTION public.with_study_day(p_days jsonb, p_today text)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN jsonb_typeof(coalesce(p_days, '[]'::jsonb)) <> 'array' THEN jsonb_build_array(p_today)
    WHEN coalesce(p_days, '[]'::jsonb) @> jsonb_build_array(p_today) THEN p_days
    ELSE p_days || jsonb_build_array(p_today)
  END;
$$;

CREATE OR REPLACE FUNCTION public.preserve_lesson_completion()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.completed THEN
    NEW.completed := true;
    NEW.completed_at := coalesce(OLD.completed_at, NEW.completed_at, now());
  ELSIF NEW.completed AND NEW.completed_at IS NULL THEN
    NEW.completed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER lessons_preserve_completion
  BEFORE UPDATE ON public.lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.preserve_lesson_completion();

CREATE OR REPLACE FUNCTION public.award_lesson_completion_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today text := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD');
  v_data jsonb;
  v_points integer;
  v_days jsonb;
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.completed = true)
     OR (TG_OP = 'UPDATE' AND OLD.completed = false AND NEW.completed = true) THEN
    SELECT coalesce(learning_data, '{}'::jsonb)
      INTO v_data
      FROM public.profiles
      WHERE id = NEW.user_id
      FOR UPDATE;

    IF FOUND THEN
      v_points := CASE
        WHEN jsonb_typeof(v_data->'points') = 'number'
        THEN GREATEST(0, floor((v_data->>'points')::numeric)::integer)
        ELSE 0
      END + 20;
      v_days := public.with_study_day(v_data->'studyDays', v_today);

      UPDATE public.profiles
         SET learning_data = jsonb_set(
               jsonb_set(v_data, '{points}', to_jsonb(v_points), true),
               '{studyDays}', v_days, true
             )
       WHERE id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.award_lesson_completion_points() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER lessons_award_points
  AFTER INSERT OR UPDATE ON public.lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.award_lesson_completion_points();

CREATE OR REPLACE FUNCTION public.toggle_library_favorite(p_material_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_today text := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD');
  v_data jsonb;
  v_favs jsonb;
  v_next_favs jsonb;
  v_next jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF p_material_id NOT IN ('m1','m2','m3','m4','m5','m6','m7','m8') THEN
    RAISE EXCEPTION 'Invalid material_id';
  END IF;

  SELECT coalesce(learning_data, '{}'::jsonb)
    INTO v_data
    FROM public.profiles
    WHERE id = v_uid
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  v_favs := CASE
    WHEN jsonb_typeof(v_data->'favorites') = 'array' THEN v_data->'favorites'
    ELSE '[]'::jsonb
  END;

  IF v_favs @> jsonb_build_array(p_material_id) THEN
    SELECT coalesce(jsonb_agg(elem), '[]'::jsonb)
      INTO v_next_favs
      FROM jsonb_array_elements_text(v_favs) AS elem
      WHERE elem <> p_material_id;
  ELSE
    v_next_favs := v_favs || jsonb_build_array(p_material_id);
  END IF;

  v_next := jsonb_set(
    jsonb_set(v_data, '{favorites}', v_next_favs, true),
    '{studyDays}', public.with_study_day(v_data->'studyDays', v_today), true
  );

  UPDATE public.profiles SET learning_data = v_next WHERE id = v_uid;
  RETURN v_next;
END;
$$;

REVOKE ALL ON FUNCTION public.toggle_library_favorite(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.toggle_library_favorite(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.record_library_access(p_material_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_today text := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD');
  v_data jsonb;
  v_history jsonb;
  v_already_seen boolean;
  v_next_history jsonb;
  v_points integer;
  v_next jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF p_material_id NOT IN ('m1','m2','m3','m4','m5','m6','m7','m8') THEN
    RAISE EXCEPTION 'Invalid material_id';
  END IF;

  SELECT coalesce(learning_data, '{}'::jsonb)
    INTO v_data
    FROM public.profiles
    WHERE id = v_uid
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  v_history := CASE
    WHEN jsonb_typeof(v_data->'history') = 'array' THEN v_data->'history'
    ELSE '[]'::jsonb
  END;

  v_already_seen := v_history @> jsonb_build_array(p_material_id);

  SELECT jsonb_build_array(p_material_id) || coalesce(jsonb_agg(elem), '[]'::jsonb)
    INTO v_next_history
    FROM (
      SELECT elem
      FROM jsonb_array_elements_text(v_history) WITH ORDINALITY AS t(elem, ord)
      WHERE elem <> p_material_id
      ORDER BY ord
      LIMIT 9
    ) sub;

  v_points := CASE
    WHEN jsonb_typeof(v_data->'points') = 'number'
    THEN GREATEST(0, floor((v_data->>'points')::numeric)::integer)
    ELSE 0
  END + CASE WHEN v_already_seen THEN 0 ELSE 5 END;

  v_next := jsonb_set(
    jsonb_set(
      jsonb_set(v_data, '{history}', v_next_history, true),
      '{points}', to_jsonb(v_points), true
    ),
    '{studyDays}', public.with_study_day(v_data->'studyDays', v_today), true
  );

  UPDATE public.profiles SET learning_data = v_next WHERE id = v_uid;
  RETURN v_next;
END;
$$;

REVOKE ALL ON FUNCTION public.record_library_access(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_library_access(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.record_graded_quiz(
  p_user_id uuid,
  p_score integer,
  p_total integer,
  p_date text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today text := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD');
  v_data jsonb;
  v_quizzes jsonb;
  v_next_quizzes jsonb;
  v_points integer;
  v_entry jsonb;
  v_next jsonb;
BEGIN
  IF p_user_id IS NULL OR p_total <= 0 OR p_total > 20 OR p_score < 0 OR p_score > p_total THEN
    RAISE EXCEPTION 'Invalid quiz result';
  END IF;

  SELECT coalesce(learning_data, '{}'::jsonb)
    INTO v_data
    FROM public.profiles
    WHERE id = p_user_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  v_quizzes := CASE
    WHEN jsonb_typeof(v_data->'quizzes') = 'array' THEN v_data->'quizzes'
    ELSE '[]'::jsonb
  END;

  v_entry := jsonb_build_object('date', left(coalesce(p_date, ''), 32), 'score', p_score, 'total', p_total);

  SELECT jsonb_build_array(v_entry) || coalesce(jsonb_agg(elem), '[]'::jsonb)
    INTO v_next_quizzes
    FROM (
      SELECT elem
      FROM jsonb_array_elements(v_quizzes) WITH ORDINALITY AS t(elem, ord)
      ORDER BY ord
      LIMIT 49
    ) sub;

  v_points := CASE
    WHEN jsonb_typeof(v_data->'points') = 'number'
    THEN GREATEST(0, floor((v_data->>'points')::numeric)::integer)
    ELSE 0
  END + (p_score * 10);

  v_next := jsonb_set(
    jsonb_set(
      jsonb_set(v_data, '{quizzes}', v_next_quizzes, true),
      '{points}', to_jsonb(v_points), true
    ),
    '{studyDays}', public.with_study_day(v_data->'studyDays', v_today), true
  );

  UPDATE public.profiles SET learning_data = v_next WHERE id = p_user_id;
  RETURN v_next;
END;
$$;

REVOKE ALL ON FUNCTION public.record_graded_quiz(uuid, integer, integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_graded_quiz(uuid, integer, integer, text) TO service_role;

CREATE OR REPLACE FUNCTION public.import_browser_progress(payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  cid text;
  idx jsonb;
  own_profile public.profiles;
  v_favorites jsonb := '[]'::jsonb;
  v_history jsonb := '[]'::jsonb;
  v_days jsonb := '[]'::jsonb;
  v_initial_points integer := 0;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO own_profile FROM public.profiles WHERE id = v_uid FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.profiles(id) VALUES (v_uid);
  ELSIF own_profile.browser_migrated_at IS NOT NULL THEN
    RETURN;
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

  IF jsonb_typeof(payload->'studyDays') = 'array' THEN
    SELECT coalesce(jsonb_agg(elem), '[]'::jsonb)
      INTO v_days
      FROM (
        SELECT DISTINCT elem
        FROM jsonb_array_elements_text(payload->'studyDays') AS elem
        WHERE elem ~ '^\d{4}-\d{2}-\d{2}$'
        LIMIT 365
      ) sub;
  END IF;

  v_initial_points := jsonb_array_length(v_history) * 5;

  UPDATE public.profiles
     SET learning_data = jsonb_build_object(
           'points', v_initial_points,
           'favorites', v_favorites,
           'history', v_history,
           'studyDays', v_days,
           'quizzes', '[]'::jsonb
         ),
         browser_migrated_at = now()
   WHERE id = v_uid;

  FOR cid, idx IN SELECT key, value FROM jsonb_each(coalesce(payload->'lessonsDone', '{}'::jsonb)) LOOP
    IF cid IN ('alfabetizacao-digital','matematica-basica','redacao','sustentabilidade','historia-brasil','ingles')
       AND jsonb_typeof(idx) = 'array' THEN
      INSERT INTO public.lesson_progress(user_id, lesson_id, completed, completed_at)
      SELECT v_uid, cid || ':' || value, true, now()
        FROM jsonb_array_elements_text(idx)
        WHERE value IN ('0','1','2','3')
      ON CONFLICT (user_id, lesson_id)
      DO UPDATE SET completed = true, completed_at = coalesce(lesson_progress.completed_at, now());
    END IF;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.import_browser_progress(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.import_browser_progress(jsonb) TO authenticated;