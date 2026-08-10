-- Promove automaticamente emails de app_settings.admin_emails no signup
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

  PERFORM public.promote_bootstrap_admins();

  UPDATE public.organization_members m
  SET role = p.role
  FROM public.profiles p
  WHERE m.user_id = p.id AND p.id = NEW.id AND p.role = 'ADMIN';

  RETURN NEW;
END;
$$;
