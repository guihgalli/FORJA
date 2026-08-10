-- Admin auth: helpers, RLS para gestão de papéis e signup seguro

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'ADMIN'
  );
$$;

-- Signup nunca promove papel via metadata (evita self-admin)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_id UUID;
  org_slug TEXT;
  display_name TEXT;
  avatar TEXT;
BEGIN
  display_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );

  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (NEW.id, NEW.email, display_name, avatar, 'STUDENT');

  org_slug := 'org-' || substr(replace(NEW.id::text, '-', ''), 1, 12);
  INSERT INTO public.organizations (name, slug, plan)
  VALUES (display_name, org_slug, 'FREE')
  RETURNING id INTO org_id;

  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (org_id, NEW.id, 'STUDENT');

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

DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_update ON public.profiles FOR UPDATE USING (
  id = auth.uid() OR public.is_admin()
);

DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles FOR SELECT USING (
  id = auth.uid() OR public.is_admin()
);

DROP POLICY IF EXISTS org_members_select ON public.organization_members;
CREATE POLICY org_members_select ON public.organization_members FOR SELECT USING (
  user_id = auth.uid() OR public.is_org_member(organization_id) OR public.is_admin()
);

CREATE POLICY org_members_admin_update ON public.organization_members FOR UPDATE USING (
  public.is_admin()
);

CREATE POLICY org_members_admin_insert ON public.organization_members FOR INSERT WITH CHECK (
  public.is_admin()
);

-- Bootstrap: promover emails listados em app_settings (opcional)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY app_settings_admin_all ON public.app_settings FOR ALL USING (public.is_admin());

COMMENT ON TABLE public.app_settings IS
  'Configurações internas. Para bootstrap de admin: INSERT INTO app_settings(key,value) VALUES (''admin_emails'',''voce@gmail.com'');';

CREATE OR REPLACE FUNCTION public.promote_bootstrap_admins()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  emails TEXT;
  email_item TEXT;
BEGIN
  SELECT value INTO emails FROM public.app_settings WHERE key = 'admin_emails';
  IF emails IS NULL OR btrim(emails) = '' THEN
    RETURN;
  END IF;

  FOREACH email_item IN ARRAY string_to_array(emails, ',')
  LOOP
    email_item := lower(btrim(email_item));
    IF email_item <> '' THEN
      UPDATE public.profiles
      SET role = 'ADMIN'
      WHERE lower(email) = email_item AND role <> 'ADMIN';
    END IF;
  END LOOP;
END;
$$;
