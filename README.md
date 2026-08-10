# FORJA — Personal Trainer Digital

Plataforma SaaS de criação, execução e evolução de treinos com IA, Supabase e Cloudflare.

## Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind, shadcn-style UI, Recharts
- **Backend:** Supabase (Postgres, Auth, Storage, Realtime, RLS, Edge Functions)
- **Edge:** Cloudflare (DNS/CDN/SSL/WAF/Workers/R2)
- **IA:** camada `AI Provider` (OpenAI / Anthropic / Gemini / Mock) — chaves só no backend

## Início rápido

```bash
npm install
cp .env.example .env.local
npm run dev
```

Sem Supabase configurado, login/cadastro e rotas protegidas ficam bloqueados (sem usuários demo).
Com LLM ausente, as rotas de IA usam provider `mock` sobre a biblioteca de exercícios.

## Supabase

```bash
# CLI
supabase db reset
# aplica migrations + seed de exercícios
```

Migrations:

- `supabase/migrations/20260322000001_init.sql` — schema, RLS, storage, trigger de signup
- `supabase/migrations/20260322000002_seed_exercises.sql` — 119 exercícios
- `supabase/migrations/20260322120000_admin_auth.sql` — papéis admin + RLS de gestão
- `supabase/migrations/20260322130000_bootstrap_admin_galli.sql` — admin + limpeza emails teste
- `supabase/migrations/20260322160000_cleanup_demo_users.sql` — remove usuários demo do Auth

Produção (excluir demos + promover admin):

```bash
npm run db:bootstrap-admin
# ou aplique a migration cleanup via npm run db:apply-migrations
```

Auth: `/login` (email/senha + Google OAuth) · callback `/auth/callback` · admin `/admin`

Edge Functions: `generate-workout`, `generate-periodization`, `adapt-workout`, `calculate-progress`, `generate-report`, `process-video`, `send-notification`.

## IA

Princípio: o LLM **não inventa exercícios**. Seleciona IDs da biblioteca, retorna JSON, passa por schema + regras.

Rotas:

- `POST /api/ai/generate-workout`
- `POST /api/ai/generate-periodization`
- `POST /api/ai/adapt-workout`
- `POST /api/ai/ask`
- `POST /api/ai/report`
- `POST /api/ai/calculate-progress`

Configure `AI_PROVIDER` e a chave correspondente. Default: `mock`.

## App (mobile-first)

Bottom nav: Início · Treino · Evolução · Calendário · Perfil

Fluxos principais:

- Treino de hoje (séries, timer, vídeo, feedback, perguntar à IA)
- Gerar treino / plano 4 semanas
- Biblioteca + player YouTube
- Dashboards aluno e personal
- Metas, medidas, relatório mensal

## Fases

1. Auth, perfil, exercícios, treinos, execução ✅
2. Histórico, evolução, PRs, calendário ✅
3. LLM, geração, adaptação, periodização ✅
4. Multi-tenant, trainer, assinaturas, Cloudflare (base ✅)
5. PWA/manifest, R2, notificações (base ✅)

## Deploy (Cloudflare + Supabase)

```bash
# 1) Configure .env.local com Supabase
# 2) Aplique migrations no projeto Supabase
# 3) Publique no Cloudflare Workers:
export CLOUDFLARE_API_TOKEN=...
export CLOUDFLARE_ACCOUNT_ID=...
npm run deploy
```

Guia passo a passo: [`docs/DEPLOY.md`](docs/DEPLOY.md)  
Arquitetura: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · Cloudflare: [`docs/CLOUDFLARE.md`](docs/CLOUDFLARE.md)
