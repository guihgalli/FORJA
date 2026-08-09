-- FORJA — Plataforma de Treinamento Esportivo
-- Schema completo + RLS + Storage + helpers

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE public.app_role AS ENUM ('ADMIN', 'TRAINER', 'STUDENT');
CREATE TYPE public.subscription_plan AS ENUM ('FREE', 'PRO', 'TRAINER', 'ENTERPRISE');
CREATE TYPE public.recovery_status AS ENUM ('good', 'moderate', 'low');
CREATE TYPE public.calendar_event_type AS ENUM (
  'musculacao', 'futebol', 'corrida', 'jogo', 'descanso', 'mobilidade', 'cardio', 'avaliacao'
);
CREATE TYPE public.ai_request_type AS ENUM (
  'generate_workout', 'generate_periodization', 'adapt_workout',
  'ask', 'report', 'calculate_progress'
);
CREATE TYPE public.progression_method AS ENUM (
  'double_progression', 'rir', 'rpe', 'percent_1rm', 'fixed_load', 'linear', 'undulating'
);

-- Organizations (multi-tenant)
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  plan public.subscription_plan NOT NULL DEFAULT 'FREE',
  feature_flags JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role public.app_role NOT NULL DEFAULT 'STUDENT',
  active_organization_id UUID REFERENCES public.organizations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'STUDENT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

CREATE TABLE public.trainers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  bio TEXT,
  specialties TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, organization_id)
);

CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  trainer_id UUID REFERENCES public.trainers(id),
  age INT,
  sex TEXT CHECK (sex IN ('masculino', 'feminino', 'outro', 'prefiro_nao_dizer')),
  height_cm NUMERIC(5,2),
  weight_kg NUMERIC(5,2),
  body_fat_pct NUMERIC(4,1),
  goal TEXT,
  level TEXT,
  experience TEXT,
  sport TEXT,
  position TEXT,
  weekly_frequency INT,
  available_days TEXT[] DEFAULT '{}',
  session_duration_min INT,
  equipment TEXT[] DEFAULT '{}',
  notes TEXT,
  progression_method public.progression_method DEFAULT 'double_progression',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, organization_id)
);

CREATE TABLE public.muscle_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE
);

CREATE TABLE public.exercise_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE
);

CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  instructions TEXT,
  primary_muscle TEXT NOT NULL,
  secondary_muscles TEXT[] DEFAULT '{}',
  equipment TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  movement_pattern TEXT,
  exercise_type TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  common_mistakes TEXT,
  tips TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  organization_id UUID REFERENCES public.organizations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.exercise_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  title TEXT,
  url TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'youtube',
  is_primary BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  goal TEXT,
  weeks INT NOT NULL DEFAULT 1,
  source TEXT NOT NULL DEFAULT 'manual', -- manual | ai
  ai_rationale TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.workout_weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,
  week_number INT NOT NULL,
  focus TEXT,
  volume_target TEXT,
  intensity_target TEXT,
  notes TEXT,
  UNIQUE (plan_id, week_number)
);

CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.workout_plans(id) ON DELETE SET NULL,
  week_id UUID REFERENCES public.workout_weeks(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  goal TEXT,
  duration_minutes INT,
  scheduled_date DATE,
  day_of_week TEXT,
  status TEXT NOT NULL DEFAULT 'planned', -- planned | completed | skipped
  ai_rationale TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id),
  sort_order INT NOT NULL DEFAULT 1,
  sets INT NOT NULL DEFAULT 3,
  rep_min INT NOT NULL DEFAULT 8,
  rep_max INT NOT NULL DEFAULT 12,
  rir NUMERIC(3,1),
  rpe NUMERIC(3,1),
  rest_seconds INT DEFAULT 90,
  tempo TEXT,
  target_load_kg NUMERIC(6,2),
  notes TEXT,
  UNIQUE (workout_id, sort_order)
);

CREATE TABLE public.workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_exercise_id UUID NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
  set_number INT NOT NULL,
  target_reps INT,
  target_load_kg NUMERIC(6,2),
  completed BOOLEAN NOT NULL DEFAULT false,
  actual_reps INT,
  actual_load_kg NUMERIC(6,2),
  rir NUMERIC(3,1),
  rpe NUMERIC(3,1),
  completed_at TIMESTAMPTZ
);

CREATE TABLE public.training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  workout_id UUID REFERENCES public.workouts(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_minutes INT,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  session_rpe NUMERIC(3,1),
  fatigue TEXT CHECK (fatigue IN ('baixa', 'media', 'alta')),
  pain TEXT CHECK (pain IN ('nenhuma', 'leve', 'moderada', 'alta')),
  comments TEXT,
  sleep_hours NUMERIC(3,1),
  recovery_status public.recovery_status,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.training_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.training_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id),
  set_number INT NOT NULL,
  load_kg NUMERIC(6,2),
  reps INT,
  rir NUMERIC(3,1),
  rpe NUMERIC(3,1),
  difficulty TEXT,
  pain_note TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.exercise_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id),
  session_id UUID REFERENCES public.training_sessions(id) ON DELETE SET NULL,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  best_load_kg NUMERIC(6,2),
  best_reps INT,
  total_volume_kg NUMERIC(10,2),
  avg_rir NUMERIC(3,1),
  avg_rpe NUMERIC(3,1),
  sets_completed INT
);

CREATE TABLE public.personal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id),
  record_type TEXT NOT NULL, -- estimated_1rm | max_load | max_reps | max_volume
  value NUMERIC(10,2) NOT NULL,
  formula TEXT DEFAULT 'epley',
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  meta JSONB DEFAULT '{}'::jsonb,
  UNIQUE (student_id, exercise_id, record_type)
);

CREATE TABLE public.body_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  measured_at DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg NUMERIC(5,2),
  body_fat_pct NUMERIC(4,1),
  chest_cm NUMERIC(5,1),
  waist_cm NUMERIC(5,1),
  hips_cm NUMERIC(5,1),
  arm_cm NUMERIC(5,1),
  thigh_cm NUMERIC(5,1),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.body_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  taken_at DATE NOT NULL DEFAULT CURRENT_DATE,
  pose TEXT,
  is_private BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_value NUMERIC(10,2),
  current_value NUMERIC(10,2),
  unit TEXT,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  event_type public.calendar_event_type NOT NULL,
  title TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  intensity TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  read_at TIMESTAMPTZ,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  organization_id UUID REFERENCES public.organizations(id),
  request_type public.ai_request_type NOT NULL,
  model TEXT,
  prompt_version TEXT,
  input_tokens INT,
  output_tokens INT,
  latency_ms INT,
  estimated_cost_usd NUMERIC(10,6),
  status TEXT NOT NULL,
  error TEXT,
  request_payload JSONB,
  response_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id),
  period_ym TEXT NOT NULL, -- YYYY-MM
  generations_used INT NOT NULL DEFAULT 0,
  generations_limit INT NOT NULL DEFAULT 10,
  UNIQUE (user_id, period_ym)
);

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan public.subscription_plan NOT NULL DEFAULT 'FREE',
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  feature_flags JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id),
  actor_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX idx_students_user ON public.students(user_id);
CREATE INDEX idx_students_trainer ON public.students(trainer_id);
CREATE INDEX idx_workouts_student_date ON public.workouts(student_id, scheduled_date);
CREATE INDEX idx_sessions_student ON public.training_sessions(student_id, started_at DESC);
CREATE INDEX idx_exercise_history_student ON public.exercise_history(student_id, exercise_id, performed_at DESC);
CREATE INDEX idx_calendar_student ON public.calendar_events(student_id, starts_at);
CREATE INDEX idx_ai_generations_user ON public.ai_generations(user_id, created_at DESC);
CREATE INDEX idx_exercises_muscle ON public.exercises(primary_muscle) WHERE is_active;

-- Helpers
CREATE OR REPLACE FUNCTION public.is_org_member(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members m
    WHERE m.organization_id = org_id AND m.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'ADMIN'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_trainer(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members m
    WHERE m.organization_id = org_id
      AND m.user_id = auth.uid()
      AND m.role IN ('TRAINER', 'ADMIN')
  ) OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'ADMIN'
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_student(sid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = sid AND s.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.trainers t ON t.id = s.trainer_id
    WHERE s.id = sid AND t.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'ADMIN'
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_id UUID;
  org_slug TEXT;
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'STUDENT')
  );

  org_slug := 'org-' || substr(replace(NEW.id::text, '-', ''), 1, 12);
  INSERT INTO public.organizations (name, slug, plan)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'full_name', 'Minha Organização'), org_slug, 'FREE')
  RETURNING id INTO org_id;

  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (org_id, NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'STUDENT'));

  UPDATE public.profiles SET active_organization_id = org_id WHERE id = NEW.id;

  INSERT INTO public.students (user_id, organization_id, goal, experience)
  VALUES (NEW.id, org_id, 'Hipertrofia', 'iniciante');

  INSERT INTO public.subscriptions (organization_id, plan, status, current_period_start, current_period_end)
  VALUES (org_id, 'FREE', 'active', now(), now() + interval '30 days');

  INSERT INTO public.ai_usage (user_id, organization_id, period_ym, generations_used, generations_limit)
  VALUES (NEW.id, org_id, to_char(now(), 'YYYY-MM'), 0, 10);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_students_updated BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_workouts_updated BEFORE UPDATE ON public.workouts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.muscle_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_categories ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY profiles_select ON public.profiles FOR SELECT USING (
  id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN')
);
CREATE POLICY profiles_update ON public.profiles FOR UPDATE USING (id = auth.uid());

-- Organizations
CREATE POLICY org_select ON public.organizations FOR SELECT USING (public.is_org_member(id));
CREATE POLICY org_members_select ON public.organization_members FOR SELECT USING (
  user_id = auth.uid() OR public.is_org_member(organization_id)
);

-- Students
CREATE POLICY students_select ON public.students FOR SELECT USING (public.owns_student(id) OR public.is_org_trainer(organization_id));
CREATE POLICY students_update ON public.students FOR UPDATE USING (public.owns_student(id) OR public.is_org_trainer(organization_id));
CREATE POLICY students_insert ON public.students FOR INSERT WITH CHECK (public.is_org_member(organization_id));

-- Trainers
CREATE POLICY trainers_select ON public.trainers FOR SELECT USING (public.is_org_member(organization_id));

-- Exercises (public library + org private)
CREATE POLICY exercises_select ON public.exercises FOR SELECT USING (
  is_active = true AND (organization_id IS NULL OR public.is_org_member(organization_id))
);
CREATE POLICY exercises_write ON public.exercises FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN', 'TRAINER'))
);

CREATE POLICY exercise_videos_select ON public.exercise_videos FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.exercises e WHERE e.id = exercise_id AND e.is_active)
);

CREATE POLICY muscle_groups_select ON public.muscle_groups FOR SELECT USING (true);
CREATE POLICY exercise_categories_select ON public.exercise_categories FOR SELECT USING (true);

-- Workouts
CREATE POLICY workouts_select ON public.workouts FOR SELECT USING (public.owns_student(student_id));
CREATE POLICY workouts_write ON public.workouts FOR ALL USING (public.owns_student(student_id));

CREATE POLICY workout_plans_all ON public.workout_plans FOR ALL USING (public.owns_student(student_id));
CREATE POLICY workout_weeks_all ON public.workout_weeks FOR ALL USING (
  EXISTS (SELECT 1 FROM public.workout_plans p WHERE p.id = plan_id AND public.owns_student(p.student_id))
);
CREATE POLICY workout_exercises_all ON public.workout_exercises FOR ALL USING (
  EXISTS (SELECT 1 FROM public.workouts w WHERE w.id = workout_id AND public.owns_student(w.student_id))
);
CREATE POLICY workout_sets_all ON public.workout_sets FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.workout_exercises we
    JOIN public.workouts w ON w.id = we.workout_id
    WHERE we.id = workout_exercise_id AND public.owns_student(w.student_id)
  )
);

CREATE POLICY sessions_all ON public.training_sessions FOR ALL USING (public.owns_student(student_id));
CREATE POLICY logs_all ON public.training_logs FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.training_sessions s
    WHERE s.id = session_id AND public.owns_student(s.student_id)
  )
);
CREATE POLICY history_all ON public.exercise_history FOR ALL USING (public.owns_student(student_id));
CREATE POLICY prs_all ON public.personal_records FOR ALL USING (public.owns_student(student_id));
CREATE POLICY measurements_all ON public.body_measurements FOR ALL USING (public.owns_student(student_id));
CREATE POLICY photos_all ON public.body_photos FOR ALL USING (public.owns_student(student_id));
CREATE POLICY goals_all ON public.goals FOR ALL USING (public.owns_student(student_id));
CREATE POLICY calendar_all ON public.calendar_events FOR ALL USING (public.owns_student(student_id));

CREATE POLICY notifications_own ON public.notifications FOR ALL USING (user_id = auth.uid());
CREATE POLICY ai_gen_own ON public.ai_generations FOR SELECT USING (user_id = auth.uid());
CREATE POLICY ai_usage_own ON public.ai_usage FOR SELECT USING (user_id = auth.uid());
CREATE POLICY subscriptions_org ON public.subscriptions FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY audit_org ON public.audit_logs FOR SELECT USING (
  public.is_org_trainer(organization_id) OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN')
);

-- Categories seed
INSERT INTO public.muscle_groups (name, slug) VALUES
  ('Peito','peito'),('Costas','costas'),('Ombros','ombros'),('Bíceps','biceps'),
  ('Tríceps','triceps'),('Quadríceps','quadriceps'),('Posteriores','posteriores'),
  ('Glúteos','gluteos'),('Panturrilhas','panturrilhas'),('Core','core'),
  ('Mobilidade','mobilidade'),('Explosão','explosao'),('Sprint','sprint'),
  ('Agilidade','agilidade'),('Condicionamento','condicionamento')
ON CONFLICT DO NOTHING;

INSERT INTO public.exercise_categories (name, slug)
SELECT name, slug FROM public.muscle_groups
ON CONFLICT DO NOTHING;

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('exercise-videos', 'exercise-videos', true),
  ('exercise-images', 'exercise-images', true),
  ('user-photos', 'user-photos', false),
  ('avatars', 'avatars', true),
  ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY storage_exercise_images_read ON storage.objects FOR SELECT
  USING (bucket_id IN ('exercise-images', 'exercise-videos', 'avatars'));

CREATE POLICY storage_avatars_write ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY storage_user_photos_own ON storage.objects FOR ALL
  USING (bucket_id = 'user-photos' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'user-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY storage_documents_own ON storage.objects FOR ALL
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
