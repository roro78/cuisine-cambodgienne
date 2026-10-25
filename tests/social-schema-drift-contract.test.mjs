import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const schema=read('../automation/n8n/schema.sql');
const provisioning=read('../automation/n8n/sql/social-viewer-role-provisioning-REVIEW.sql');
const php=read('../public/gestion-social/index.php');
const fixture=read('./sql/social-viewer-role-fixture.sql');
const smoke=read('../scripts/test-cuisine-social-immutability-ephemeral.sh');

test('versioned schema matches the inspected production dispatch reservation structure',()=>{
 assert.match(schema,/CREATE TABLE IF NOT EXISTS cuisine_social\.validation_dispatches/);
 for(const s of ['post_id BIGINT PRIMARY KEY REFERENCES cuisine_social.posts(id) ON DELETE RESTRICT',
  'idempotency_key TEXT NOT NULL UNIQUE','char_length(idempotency_key) BETWEEN 1 AND 256',
  "CHECK (state IN ('reserved','accepted','uncertain'))",'resend_message_id TEXT',
  'created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()',
  'updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()'])
  assert.ok(schema.includes(s),s);
 for(const name of ['posts','validation_dispatches'])
  assert.ok(schema.includes('ALTER TABLE cuisine_social.'+name+' ENABLE ROW LEVEL SECURITY'),name);
 assert.doesNotMatch(schema,/\b(?:GRANT\s+\w+\s+ON|CREATE POLICY)\b/i);
 assert.doesNotMatch(fixture,/\bCREATE TABLE\s+cuisine_social\.validation_dispatches\b/i);
 assert.match(fixture,/validation_dispatches/);
});
test('viewer exact grants/RLS match PHP runtime and provisioning; no dispatch access',()=>{
 assert.match(provisioning,/m\.member=r\.oid OR m\.roleid=r\.oid/);
 assert.match(php,/m\.member=r\.oid OR m\.roleid=r\.oid/);
 assert.match(php,/qual='true' AND with_check IS NULL/);
 assert.match(provisioning,/REVOKE ALL PRIVILEGES ON TABLE cuisine_social\.validation_dispatches/);
 assert.match(smoke,/social-viewer-role-fixture\.sql/);
 assert.ok((smoke.match(/automation\/n8n\/schema\.sql/g)||[]).length===2,
  'Schema must be tested twice for idempotence');
});
test('PostgreSQL DSN rejects duplicated TLS parameters, untrusted options and inline credentials',()=>{
 assert.match(php,/explode\(';', substr\(\$cfg\['social_readonly_dsn'\], 6\)\)/);
 assert.match(php,/array_key_exists\(\$key, \$dsnValues\)/);
 assert.match(php,/\(host\|port\|dbname\|sslmode\|sslrootcert\)/);
 assert.match(php,/\['require', 'verify-ca', 'verify-full'\]/);
 assert.doesNotMatch(php,/CURLOPT_SSL_VERIFYPEER\s*=>\s*false/);
});
