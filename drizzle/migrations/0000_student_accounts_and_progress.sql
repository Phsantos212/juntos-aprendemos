CREATE TABLE public.profiles (
 id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 full_name text NOT NULL DEFAULT '',
 avatar_path text,
 terms_accepted_at timestamptz,
 terms_version text,
 browser_migrated_at timestamptz,
 learning_data jsonb NOT NULL DEFAULT '{}'::jsonb,
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_select_own ON public.profiles FOR SELECT TO authenticated USING (id = (SELECT auth.uid()));
CREATE POLICY profiles_insert_own ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = (SELECT auth.uid()));
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE TO authenticated USING (id = (SELECT auth.uid())) WITH CHECK (id = (SELECT auth.uid()));
CREATE TABLE public.lesson_progress (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL,
 lesson_id text NOT NULL CHECK (lesson_id ~ '^(alfabetizacao-digital|matematica-basica|redacao|sustentabilidade|historia-brasil|ingles):[0-3]$'),
 completed boolean NOT NULL DEFAULT false,
 last_position integer NOT NULL DEFAULT 0 CHECK (last_position BETWEEN 0 AND 100),
 completed_at timestamptz,
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id, lesson_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_progress TO authenticated;
GRANT ALL ON public.lesson_progress TO service_role;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY lessons_select_own ON public.lesson_progress FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY lessons_insert_own ON public.lesson_progress FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY lessons_update_own ON public.lesson_progress FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY lessons_delete_own ON public.lesson_progress FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE FUNCTION public.touch_student_record() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_student_record();
CREATE TRIGGER lessons_updated BEFORE UPDATE ON public.lesson_progress FOR EACH ROW EXECUTE FUNCTION public.touch_student_record();
CREATE FUNCTION public.create_student_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN
 INSERT INTO public.profiles(id, full_name, terms_accepted_at, terms_version) VALUES (NEW.id, left(coalesce(NEW.raw_user_meta_data->>'full_name', ''), 120), CASE WHEN NEW.raw_user_meta_data->>'terms_version' = '2026-11-23' THEN now() ELSE NULL END, NEW.raw_user_meta_data->>'terms_version'); RETURN NEW;
END; $$;
CREATE TRIGGER student_profile_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_student_profile();
CREATE FUNCTION public.import_browser_progress(payload jsonb) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE cid text; idx jsonb; own_profile public.profiles;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
 SELECT * INTO own_profile FROM public.profiles WHERE id = auth.uid() FOR UPDATE;
 IF NOT FOUND THEN INSERT INTO public.profiles(id) VALUES(auth.uid()); END IF;
 IF own_profile.browser_migrated_at IS NOT NULL THEN RETURN; END IF;
 FOR cid, idx IN SELECT key, value FROM jsonb_each(coalesce(payload->'lessonsDone', '{}'::jsonb)) LOOP
 IF cid IN ('alfabetizacao-digital','matematica-basica','redacao','sustentabilidade','historia-brasil','ingles') AND jsonb_typeof(idx) = 'array' THEN
 INSERT INTO public.lesson_progress(user_id,lesson_id,completed,completed_at)
 SELECT auth.uid(),cid || ':' || value,true,now() FROM jsonb_array_elements_text(idx) WHERE value IN ('0','1','2','3')
 ON CONFLICT(user_id,lesson_id) DO UPDATE SET completed = true, completed_at = coalesce(lesson_progress.completed_at,now());
 END IF; END LOOP;
 UPDATE public.profiles SET learning_data = payload - 'lessonsDone', browser_migrated_at = now() WHERE id = auth.uid();
END; $$;
REVOKE ALL ON FUNCTION public.import_browser_progress(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.import_browser_progress(jsonb) TO authenticated;
REVOKE ALL ON FUNCTION public.create_student_profile() FROM PUBLIC, anon, authenticated;
CREATE POLICY student_avatar_select ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'student-avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
CREATE POLICY student_avatar_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'student-avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
CREATE POLICY student_avatar_update ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'student-avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text) WITH CHECK (bucket_id = 'student-avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
CREATE POLICY student_avatar_delete ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'student-avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);