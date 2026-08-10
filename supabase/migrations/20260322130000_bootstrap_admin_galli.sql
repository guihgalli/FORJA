-- Bootstrap admin FORJA + limpeza de perfis de teste conhecidos

INSERT INTO public.app_settings (key, value)
VALUES ('admin_emails', 'guilhermegalli7@gmail.com')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

UPDATE public.profiles
SET role = 'ADMIN'
WHERE lower(email) = 'guilhermegalli7@gmail.com';

UPDATE public.organization_members m
SET role = 'ADMIN'
FROM public.profiles p
WHERE m.user_id = p.id
  AND lower(p.email) = 'guilhermegalli7@gmail.com';

-- Remove dados de emails de teste conhecidos do seed/demo
-- (auth.users cascateia para profiles via ON DELETE CASCADE)
DO $$
DECLARE
  test_emails TEXT[] := ARRAY[
    'admin@forja.app',
    'personal@forja.app',
    'aluno@forja.app',
    'test@forja.app',
    'teste@forja.app',
    'demo@forja.app'
  ];
  uid UUID;
BEGIN
  FOR uid IN
    SELECT id FROM auth.users WHERE lower(email) = ANY (test_emails)
  LOOP
    DELETE FROM auth.users WHERE id = uid;
  END LOOP;
END $$;

SELECT public.promote_bootstrap_admins();
