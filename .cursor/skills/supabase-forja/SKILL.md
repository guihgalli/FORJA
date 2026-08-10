---
name: supabase-forja
description: Opera o Supabase do FORJA (auth Google/email, profiles, admin, migrations). Use ao aplicar SQL, bootstrap de admin, Auth Admin ou deploy Cloudflare.
---

# Supabase — FORJA

## Projeto

| Campo | Valor |
| --- | --- |
| Project ref | `oegpgcgkdrpwnilhveik` |
| API URL | `https://oegpgcgkdrpwnilhveik.supabase.co` |
| Dashboard | https://supabase.com/dashboard/project/oegpgcgkdrpwnilhveik |
| SQL Editor | https://supabase.com/dashboard/project/oegpgcgkdrpwnilhveik/sql/new |
| Pooler (IPv4) | `aws-1-us-west-2.pooler.supabase.com:6543` |
| DB user (pooler) | `postgres.oegpgcgkdrpwnilhveik` |
| Admin email | `guilhermegalli7@gmail.com` |

## Credenciais (nunca commitar)

| Variável | Uso |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | App / Workers |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon JWT ou publishable |
| `SUPABASE_SECRET_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | `sb_secret_...` (Auth Admin, bypass RLS) |
| `SUPABASE_DB_PASSWORD` | Senha Postgres (migrations via psql) |
| `SUPABASE_DB_URL` | URI completa (alternativa) |
| `ADMIN_EMAILS` | `guilhermegalli7@gmail.com` |
| `CLOUDFLARE_API_TOKEN` | Deploy Workers |
| `CLOUDFLARE_ACCOUNT_ID` | Deploy Workers |

**Nota:** o projeto CCTVC (`tkqydblejqzwihdjuztb`) é **outro** Supabase (Netlify). Não reutilizar a anon/secret do CCTVC no FORJA.

## psql (pooler IPv4)

```bash
psql "host=aws-1-us-west-2.pooler.supabase.com port=6543 dbname=postgres user=postgres.oegpgcgkdrpwnilhveik sslmode=require" \
  -v ON_ERROR_STOP=1 -f supabase/migrations/NOME.sql
```

Com `PGPASSWORD` / `SUPABASE_DB_PASSWORD`.

## Migrations (ordem)

1. `20260322000001_init.sql`
2. `20260322000002_seed_exercises.sql`
3. `20260322120000_admin_auth.sql`
4. `20260322130000_bootstrap_admin_galli.sql`
5. `20260322140000_promote_admin_on_signup.sql`
6. `20260322150000_exercise_video_urls.sql`
7. `20260322160000_cleanup_demo_users.sql` — remove Auth users demo/teste
8. `20260322170000_onboarding_profile.sql` — onboarding treino/dieta + `profile_completed_at`

Ou: `npm run db:apply-migrations` / `npm run db:bootstrap-admin`

## Limpeza de usuários demo (produção)

```bash
# Requer NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
npm run db:bootstrap-admin
```

Emails removidos: `admin@forja.app`, `personal@forja.app`, `aluno@forja.app`, `demo@forja.app`, `test@*`, `teste@*`, `*@forja.app` (exceto o admin real).

## Deploy Cloudflare

- Worker: `forja` → `https://forja.guilherme-galli.workers.dev`
- Workflow: `.github/workflows/deploy-cloudflare.yml` (push em `main`)


## Status do schema

Aplicado em 2026-08-10 via pooler session (`aws-1-us-west-2:5432`):

- `init` + seed 119 exercícios + `admin_auth` + bootstrap admin emails
- `app_settings.admin_emails` = `guilhermegalli7@gmail.com`
- Auth users começam vazios — no primeiro login desse email, promover com `ADMIN_EMAILS` + `SUPABASE_SECRET_KEY` no Worker, ou SQL `UPDATE profiles SET role = 'ADMIN' WHERE email = ...`

Pooler preferido para DDL: **porta 5432 (session mode)**.
