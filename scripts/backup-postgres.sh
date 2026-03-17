#!/usr/bin/env bash
# PostgreSQL backup via pg_dump (OPTION A - recommended for full schema + data + no custom bugs).
# Requires: DATABASE_URL or DIRECT_URL in .env (e.g. Supabase connection string).
# Usage: ./scripts/backup-postgres.sh [output.sql]

set -e
cd "$(dirname "$0")/.."

if [ -z "$DATABASE_URL" ]; then
  if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
  fi
fi

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL not set. Set it in .env or environment."
  exit 1
fi

# Parse postgres:// or postgresql:// URL (simple extraction)
OUTPUT="${1:-backup-$(date +%Y%m%d-%H%M%S).sql}"
# pg_dump expects PGHOST, PGUSER, PGPASSWORD, PGDATABASE, PGPORT
# Node-style URL: postgresql://user:pass@host:port/dbname?sslmode=require
if [[ "$DATABASE_URL" =~ postgres(ql)?://([^:]+):([^@]+)@([^:/]+):?([0-9]*)/([^?]+) ]]; then
  export PGUSER="${BASH_REMATCH[2]}"
  export PGPASSWORD="${BASH_REMATCH[3]}"
  export PGHOST="${BASH_REMATCH[4]}"
  export PGPORT="${BASH_REMATCH[5]:-5432}"
  export PGDATABASE="${BASH_REMATCH[6]}"
  if [[ "$DATABASE_URL" == *"sslmode=require"* ]] || [[ "$DATABASE_URL" == *"ssl=require"* ]]; then
    export PGSSLMODE=require
  fi
else
  echo "Error: Could not parse DATABASE_URL (expected postgresql://user:pass@host:port/dbname)"
  exit 1
fi

echo "Backing up $PGDATABASE to $OUTPUT ..."
pg_dump --no-owner --no-privileges --clean --if-exists -f "$OUTPUT"
echo "Done: $OUTPUT"
