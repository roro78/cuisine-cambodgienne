#!/usr/bin/env bash
# Docker-only, isolated ephemeral PostgreSQL, with no network port and no external DB.
set -euo pipefail
id="cuisine-social-smoke-$$"
docker run -d --rm --name "$id" -e POSTGRES_HOST_AUTH_METHOD=trust postgres:17-alpine >/dev/null
cleanup(){ docker rm -f "$id" >/dev/null 2>&1 || true; }
trap cleanup EXIT
for try in $(seq 1 30); do
  if docker exec "$id" pg_isready -U postgres -d postgres >/dev/null 2>&1; then break; fi
  if [ "$try" -eq 30 ]; then echo "Postgres was not ready"; exit 1; fi
  sleep 1
done
docker exec -i "$id" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres < automation/n8n/schema.sql >/dev/null
docker exec -i "$id" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres < automation/n8n/sql/social-approved-content-immutability-REVIEW.sql >/dev/null
docker exec -i "$id" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres < tests/sql/social-approved-content-immutability-smoke.sql
