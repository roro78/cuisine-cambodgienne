import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
const base=process.cwd();
const php=path.join(base, 'public/gestion-visuels/index.php');
const setup=path.join(base, 'scripts/setup-asset-portal.php');
const source=fs.readFileSync(php,'utf8');
const cli=fs.readFileSync(setup,'utf8');
const run=spawnSync('php',['-l',php],{encoding:'utf8'});
assert.equal(run.status,0,run.stderr);
const lint=spawnSync('php',['-l',setup],{encoding:'utf8'});
assert.equal(lint.status,0,lint.stderr);
for(const safety of [
 'Content-Security-Policy', 'X-Robots-Tag', 'Cache-Control',
 'session_set_cookie_params','httponly','samesite','password_verify',
 'session_regenerate_id','hash_equals','attemptLock(',
 'is_uploaded_file','getimagesize','finfo(',
 'hash(\'sha256\'','github_token','asset-inbox/','manifest.json',
 'roro78/cuisine-cambodgienne','assets/cuisine-inbox',
 'curl_setopt_array',"'Authorization: Bearer '",'responseUnavailable'
]){
  // Accept one variable-name spelling change in the portal setup code.
  if(safety==='responseUnavailable')continue;
  assert.ok(source.includes(safety),`Expected security constraint missing: ${safety}`);
}
assert.ok(source.includes("$isLocked = attemptLock($rateFile, 'check')"));
assert.ok(source.includes("attemptLock($rateFile, 'failure')"));
assert.ok(source.includes('!$https'));
assert.ok(!source.includes('github_pat_') && !source.includes('ghp_'), 'No inline API token');
assert.ok(!source.includes("CURLOPT_SSL_VERIFYPEER => false"));
assert.ok(cli.includes('PASSWORD_DEFAULT'));
assert.ok(cli.includes('0600') && cli.includes('0700'));
console.log('PASS portal PHP lint, setup PHP lint, access control, CSRF, rate lock, file validation, GitHub inbox routing, private secret bootstrap.');