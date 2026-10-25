import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Static security contracts for the standalone OVH PHP reader.
// This is not a runtime PHP/DB test and must not be mistaken for one.
const src=readFileSync(new URL('../public/gestion-social/index.php',import.meta.url),'utf8');

test('read-only social view is a PHP backend that fails closed',()=>{
 assert.match(src,/^<\?php\s/);
 assert.match(src,/function failClosed\(\): never/);
 assert.match(src,/http_response_code\(503\)/);
 assert.match(src,/dirname\(__DIR__, 3\).*\.cuisine-asset-portal/);
 assert.match(src,/social_readonly_dsn/);
 assert.match(src,/social_readonly_user/);
 assert.match(src,/social_readonly_password/);
 assert.doesNotMatch(src,/supabase_service_role|service_role_key|N8N_API_KEY|github_token.*\]/i);
});
test('login enforces HTTPS, strict session, CSRF, expiry and rate limits',()=>{
 for(const key of [
  'HTTPS obligatoire','session.use_strict_mode','session.use_only_cookies',
  "'secure' => true","'httponly' => true","'samesite' => 'Strict'",
  "hash_equals((string)$_SESSION['csrf']", 'password_verify(', 'session_regenerate_id(true)',
  'rateLimit(', "count($times) >= 5", '1800'
 ])assert.ok(src.includes(key),key);
});
test('client does not receive database credentials or broad script execution',()=>{
 assert.match(src,/Content-Security-Policy: default-src 'none'/);
 assert.match(src,/frame-ancestors 'none'/);
 assert.match(src,/style-src 'nonce-/);
 assert.match(src,/Referrer-Policy: no-referrer/);
 assert.match(src,/Cache-Control: no-store/);
 assert.doesNotMatch(src,/<script\b|XMLHttpRequest|<iframe\b/i);
});
test('database role must be SELECT-only and session becomes read-only',()=>{
 assert.match(src,/has_table_privilege\(current_user,'cuisine_social.posts','SELECT'\)/);
 for(const priv of ['INSERT','UPDATE','DELETE'])
   assert.ok(src.includes("has_table_privilege(current_user,'cuisine_social.posts','"+priv+"')"),priv);
 assert.match(src,/SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY/);
 assert.match(src,/PDO::ATTR_EMULATE_PREPARES => false/);
 assert.match(src,/PDO::PARAM_STR/);
 assert.match(src,/LIMIT 50/);
 assert.doesNotMatch(src,/\b(?:INSERT INTO|UPDATE cuisine_social|DELETE FROM|DROP TABLE|TRUNCATE\s+(?:TABLE\s+)?cuisine_social)\b/i);
});
test('safe image and canonical destination URLs, escaping and compact mobile photographs',()=>{
 assert.match(src,/function pageUrl\(/);
 assert.match(src,/function photoUrl\(/);
 assert.match(src,/preg_match\('~\^https:\/\/www\[\.\]cuisine-du-cambodge/);
 assert.match(src,/htmlspecialchars\(/);
 assert.match(src,/white-space:pre-wrap/);
 assert.match(src,/grid-template-columns:1fr/);
 assert.match(src,/width:min\(100%,190px\)/);
});
test('no approval bypass: this view is informative only',()=>{
 assert.match(src,/Consultation uniquement/);
 assert.match(src,/le formulaire de validation reçu par e-mail/);
 assert.doesNotMatch(src,/\bapprovePost\(|POST \/approve|\bstatus\s*=\s*['"]approved['"]/);
 assert.match(src,/À valider/);
 assert.match(src,/Instagram/);
 assert.match(src,/Facebook/);
});

test('viewer role is fixed, cannot inherit privileges or bypass PostgreSQL RLS',()=>{
 assert.match(src,/social_readonly_user'\] !== 'cuisine_social_viewer'/);
 for(const part of ['rolinherit','rolsuper','rolbypassrls','rolcreaterole','rolcreatedb',
   'rolreplication','has_memberships','rls_enabled','viewer_policy'])
   assert.ok(src.includes(part),part);
 assert.match(src,/pg_auth_members/);
 assert.match(src,/pg_policies/);
 assert.match(src,/m\.member=r\.oid OR m\.roleid=r\.oid/);
 assert.match(src,/qual='true' AND with_check IS NULL/);
 assert.match(src,/roles=ARRAY\['cuisine_social_viewer'\]::name\[\]/);
});
test('viewer cannot inspect dispatch reservations and paginates future posts safely',()=>{
 for(const priv of ['SELECT','INSERT','UPDATE','DELETE'])
   assert.ok(src.includes("has_table_privilege(current_user,'cuisine_social.validation_dispatches','"+priv+"')"),priv);
 assert.match(src,/OFFSET :offset/);
 assert.match(src,/PDO::PARAM_INT/);
 assert.match(src,/max_range' => 100000/);
 assert.match(src,/Page suivante/);
});
test('provisioning refuses elevated viewer roles and checks policy drift',()=>{
 const sql=readFileSync(new URL('../automation/n8n/sql/social-viewer-role-provisioning-REVIEW.sql',import.meta.url),'utf8');
 for(const part of ['rolbypassrls','pg_auth_members','relrowsecurity',
   'REVOKE ALL PRIVILEGES','validation_dispatches','roles=ARRAY','manual review required'])
   assert.ok(sql.includes(part),part);
 assert.match(sql,/BEGIN;[\s\S]*COMMIT;/);
 assert.doesNotMatch(sql,/PASSWORD\s+'[^']+'/i);
});
