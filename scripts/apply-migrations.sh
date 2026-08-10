#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [[ -f "$ROOT/.env.local" ]]; then set -a; # shellcheck disable=SC1091
  source "$ROOT/.env.local"; set +a; fi
: "${SUPABASE_DB_URL:?Defina SUPABASE_DB_URL (Settings → Database → Connection string URI)}"
for f in $(ls "$ROOT/supabase/migrations"/*.sql | sort); do
  echo "==> $(basename "$f")"
  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f "$f"
done
echo "Migrations OK"
