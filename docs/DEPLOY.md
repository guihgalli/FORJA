# Deploy FORJA — Cloudflare + Supabase

## 1. Supabase

1. Crie o projeto em https://supabase.com/dashboard
2. SQL Editor → execute na ordem:
   - `supabase/migrations/20260322000001_init.sql`
   - `supabase/migrations/20260322000002_seed_exercises.sql`
3. Authentication → Providers: Email (+ Google opcional)
4. Settings → API: copie
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Em Authentication → URL Configuration:
   - Site URL: `https://forja.<seu-subdominio>.workers.dev` (ou domínio custom)
   - Redirect URLs: mesma URL + `/dashboard` e `/login`

## 2. Cloudflare Workers (OpenNext)

Pré-requisitos locais:

```bash
cp .env.example .env.local
# preencha Supabase (+ LLM opcional)
npm install
npm run deploy
```

Variáveis de ambiente no Worker (Dashboard → Workers → forja → Settings → Variables):

| Nome | Tipo |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | plaintext |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | secret |
| `AI_PROVIDER` | plaintext (`mock` / `openai` / ...) |
| `OPENAI_API_KEY` | secret (opcional) |

CLI:

```bash
export CLOUDFLARE_API_TOKEN=...
export CLOUDFLARE_ACCOUNT_ID=...
npm run deploy
```

URL padrão após o primeiro deploy: `https://forja.<account>.workers.dev`

## 3. Domínio custom (opcional)

Cloudflare → Workers → forja → Settings → Domains & Routes  
Ex.: `app.seudominio.com` com SSL Full/Strict.

## 4. GitHub Actions (produção = `main`)

Workflow: `.github/workflows/deploy-cloudflare.yml`

- Dispara automaticamente em **push na branch `main`** (e via `workflow_dispatch`).
- Regra do agente Cursor: `.cursor/rules/publish-github-main.mdc` — ao concluir mudanças, publicar em `main`.

Secrets do repositório:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `AI_PROVIDER` (opcional)
- `OPENAI_API_KEY` (opcional)
