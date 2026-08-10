-- Limpeza de usuários demo/teste para ambiente de produção.
-- Idempotente: seguro reexecutar. Cascateia profiles via ON DELETE CASCADE.

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
    SELECT id
    FROM auth.users
    WHERE lower(email) = ANY (test_emails)
       OR lower(email) LIKE '%@forja.app'
       OR lower(email) LIKE 'test@%'
       OR lower(email) LIKE 'teste@%'
       OR lower(email) LIKE 'demo@%'
  LOOP
    DELETE FROM auth.users WHERE id = uid;
  END LOOP;
END $$;

-- Garante allowlist de admin de produção
INSERT INTO public.app_settings (key, value)
VALUES ('admin_emails', 'guilhermegalli7@gmail.com')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

SELECT public.promote_bootstrap_admins();
