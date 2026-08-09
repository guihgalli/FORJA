# Arquitetura FORJA

```
USUÁRIO → CLOUDFLARE (DNS/CDN/WAF/Workers) → NEXT.JS
        → SUPABASE AUTH → POSTGRES + RLS
        → EDGE FUNCTIONS / API ROUTES → AI PROVIDER → LLM
```

Arquivos grandes: Cloudflare R2 ou Supabase Storage.

## Camadas de IA

1. **Regras** (`src/lib/ai/rules`) — volume, equipamentos, calendário, allowlist
2. **LLM** (`src/lib/ai/providers`) — OpenAI / Anthropic / Gemini / Mock
3. **Validação** (`src/lib/ai/schemas`) — Zod; inválido = não salva + retry

## Multi-tenant

`organizations` + `organization_members` + RLS (`owns_student`, `is_org_trainer`).

## Planos

FREE 10 · PRO 100 · TRAINER 500 · ENTERPRISE custom (`ai_usage`, feature flags).
