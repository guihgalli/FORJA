#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [[ -f "$ROOT/.env.local" ]]; then set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env.local"
  set +a
fi

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  if [[ -z "${SUPABASE_DB_PASSWORD:-}" ]]; then
    echo "Defina SUPABASE_DB_URL ou SUPABASE_DB_PASSWORD" >&2
    exit 1
  fi
  REF="${SUPABASE_PROJECT_REF:-oegpgcgkdrpwnilhveik}"
  export SUPABASE_DB_URL="postgresql://postgres.${REF}:${SUPABASE_DB_PASSWORD}@aws-1-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require"
fi

for f in $(ls "$ROOT/supabase/migrations"/*.sql | sort); do
  echo "==> $(basename "$f")"
  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f "$f"
done
echo "Migrations OK"
