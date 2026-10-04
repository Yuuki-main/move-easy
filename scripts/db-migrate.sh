#!/usr/bin/env bash
# Apply the pending Supabase migrations, then save the full live schema into
# the repo so a fresh environment can be rebuilt.
#
# Usage:
#   SUPABASE_DB_URL='postgresql://postgres.<ref>:<password>@<host>:5432/postgres' ./scripts/db-migrate.sh
#
# Get the URL from Supabase → Project Settings → Database → Connection string
# (use the "Session pooler" or "Direct" URI). Keep it out of git.
set -euo pipefail

cd "$(dirname "$0")/.."

# Fall back to SUPABASE_DB_URL in .env.local (never committed)
if [[ -z "${SUPABASE_DB_URL:-}" && -f .env.local ]]; then
  SUPABASE_DB_URL="$(grep -E '^SUPABASE_DB_URL=' .env.local | head -1 | cut -d= -f2- | sed -e 's/^["'\'']//' -e 's/["'\'']$//')"
fi

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "Set SUPABASE_DB_URL (env var or in .env.local) — see the comment at the top of this script." >&2
  exit 1
fi
DIR=supabase/migrations

# 001–003 are already live. 004–009 are written to be safe to re-run.
PENDING=(
  004_chat_notifications.sql
  005_conversations_pre_booking.sql
  006_quote_amendments.sql
  007_atomic_money_flows.sql
  008_security_lockdown.sql
  009_booking_lifecycle.sql
)

for f in "${PENDING[@]}"; do
  echo "→ Applying $f"
  # -1 = one transaction per file: it either fully applies or not at all
  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -q -1 -f "$DIR/$f"
done

echo "→ Saving schema to supabase/schema.sql"
pg_dump "$SUPABASE_DB_URL" \
  --schema-only \
  --schema=public \
  --no-owner \
  --file=supabase/schema.sql

echo "✓ Done. Commit supabase/schema.sql so the database can be rebuilt from the repo."
