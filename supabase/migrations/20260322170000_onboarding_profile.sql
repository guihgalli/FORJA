-- Onboarding: marca conclusão do perfil e campos para treino + dieta (IA)

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dietary_preference TEXT,
  ADD COLUMN IF NOT EXISTS food_allergies TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS food_restrictions TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS meals_per_day INT,
  ADD COLUMN IF NOT EXISTS activity_level TEXT,
  ADD COLUMN IF NOT EXISTS diet_notes TEXT;

COMMENT ON COLUMN public.students.profile_completed_at IS
  'Preenchido quando o aluno completa o onboarding obrigatório (treino + dieta).';
COMMENT ON COLUMN public.students.dietary_preference IS
  'omnivoro | vegetariano | vegano | pescetariano | flexitariano | outro';
COMMENT ON COLUMN public.students.activity_level IS
  'sedentario | leve | moderado | intenso | atleta';

-- Novos alunos começam sem defaults de goal/experience (forçam onboarding)
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

  INSERT INTO public.students (user_id, organization_id)
  VALUES (NEW.id, org_id);

  INSERT INTO public.subscriptions (organization_id, plan, status, current_period_start, current_period_end)
  VALUES (org_id, 'FREE', 'active', now(), now() + interval '30 days');

  INSERT INTO public.ai_usage (user_id, organization_id, period_ym, generations_used, generations_limit)
  VALUES (NEW.id, org_id, to_char(now(), 'YYYY-MM'), 0, 10);

  RETURN NEW;
END;
$$;
