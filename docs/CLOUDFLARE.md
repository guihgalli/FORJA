# Cloudflare

## Deploy da app (Workers + OpenNext)

A FORJA publica via `@opennextjs/cloudflare`:

```bash
npm run deploy
```

Config: `wrangler.jsonc` (worker name: `forja`)  
Guia completo: `docs/DEPLOY.md`

URL típica: `https://forja.<account-subdomain>.workers.dev`

## DNS / SSL (domínio custom)

- Domínio: `app.seudominio.com`
- SSL: Full (Strict)
- Proxy laranja ativo (CDN + WAF)

## WAF / Rate limiting

Priorizar:

- `/api/ai/*`
- `/api/auth/*`

Worker auxiliar: `cloudflare/workers/api-proxy`.

## Cache

Cachear:

- thumbnails / assets públicos
- exercícios públicos
- `/_next/static/*` (`public/_headers`)

Não cachear:

- treinos, perfil, fotos, histórico, respostas de IA

## R2

Buckets sugeridos:

- `forja-exercise-videos`
- `forja-exercise-images`
- cache incremental Next (`NEXT_INC_CACHE_R2_BUCKET`)

URLs assinadas via Worker para mídia privada.
