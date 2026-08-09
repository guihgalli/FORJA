# Cloudflare

## DNS / SSL

- Domínio: `app.seudominio.com`
- SSL: Full (Strict)
- Proxy laranja ativo (CDN + WAF)

## WAF / Rate limiting

Priorizar:

- `/api/ai/*`
- `/api/auth/*`

Worker de referência: `cloudflare/workers/api-proxy`.

## Cache

Cachear:

- thumbnails / assets públicos
- exercícios públicos
- `/_next/static/*`

Não cachear:

- treinos, perfil, fotos, histórico, respostas de IA

## R2

Buckets sugeridos:

- `forja-exercise-videos`
- `forja-exercise-images`

URLs assinadas via Worker para mídia privada.
