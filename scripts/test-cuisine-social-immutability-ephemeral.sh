#!/usr/bin/env bash
# Docker-only, isolated ephemeral PostgreSQL, with no network port and no external DB.
set -euo pipefail
id="cuisine-social-smoke-$$"
docker run -d --rm --name "$id" -e POSTGRES_HOST_AUTH_METHOD=trust postgres:17-alpine >/dev/null
cleanup(){ docker rm -f "$id" >/dev/null 2>&1 || true; }
trap cleanup EXIT
for try in $(seq 1 30); do
  # The official image starts a temporary init server, then restarts it.
  # pg_isready may succeed during that short-lived initialization window.
  if docker logs "$id" 2>&1 | grep -q 'PostgreSQL init process complete' &&
     docker exec "$id" psql -X -A -t -v ON_ERROR_STOP=1 -U postgres -d postgres -c 'SELECT 1' >/dev/null 2>&1; then
    break
  fi
  if [ "$try" -eq 30 ]; then echo "Postgres was not ready"; exit 1; fi
  sleep 1
done
docker exec -i "$id" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres < automation/n8n/schema.sql >/dev/null
# Repeat schema to verify idempotence of its table definitions (not a migration).
docker exec -i "$id" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres < automation/n8n/schema.sql >/dev/null
docker exec -i "$id" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres < automation/n8n/sql/social-approved-content-immutability-REVIEW.sql >/dev/null
docker exec -i "$id" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres < tests/sql/social-approved-content-immutability-smoke.sql
# Ensure the real provisioning SQL parses and protects actual rows and RLS.
# This disposable fixture mirrors production's validation_dispatches table shape.
docker exec -i "$id" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres < tests/sql/social-viewer-role-fixture.sql >/dev/null
docker exec -i "$id" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres < automation/n8n/sql/social-viewer-role-provisioning-REVIEW.sql >/dev/null
# The reader provisioning must also be idempotent for controlled retries.
docker exec -i "$id" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres < automation/n8n/sql/social-viewer-role-provisioning-REVIEW.sql >/dev/null
docker exec -i "$id" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres < tests/sql/social-viewer-role-smoke.sql
# Test draft>1 reservation permissions on disposable data only. The SQL is
# review-only in GitHub; it is NEVER sent to Supabase by CI.
docker exec -i "$id" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres < tests/sql/social-validation-dispatch-policy-fixture.sql >/dev/null
docker exec -i "$id" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres < automation/n8n/sql/social-validation-dispatch-policy-REVIEW.sql >/dev/null
docker exec -i "$id" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres < tests/sql/social-validation-dispatch-policy-smoke.sql


