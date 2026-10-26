import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {createServer} from 'node:net';
import {readFileSync,mkdirSync,mkdtempSync,copyFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const sourceFile=fileURLToPath(new URL('../public/gestion-social/index.php',import.meta.url));
const availablePort=()=>new Promise((resolve,reject)=>{
  const socket=createServer();
  socket.once('error',reject);
  socket.listen(0,'127.0.0.1',()=>{const {port}=socket.address();socket.close(()=>resolve(port));});
});
test('private portal native HTTP smoke: HTTPS, session, CSRF, login, logout and no DB leakage',{timeout:25000},async t=>{
  // LOCAL test PHP only. No external services or real passwords/tokens.
  const root=mkdtempSync(join(tmpdir(),'cdc-portal-test-'));
  const portal=join(root,'web','public','gestion-social');
  const secret=join(root,'.cuisine-asset-portal');
  mkdirSync(portal,{recursive:true});mkdirSync(secret,{recursive:true,mode:0o700});
  copyFileSync(sourceFile,join(portal,'index.php'));
  const hash=execFileSync('php',['-r','echo password_hash("fixture-password", PASSWORD_DEFAULT);'],
    {encoding:'utf8'}).trim();
  assert.match(hash,/^\$2/);
  writeFileSync(join(secret,'config.php'),
    "<?php return ['admin_user'=>'fixture-operator','password_hash'=>'"+hash+"'];\n",
    {mode:0o600});
  const router=join(root,'router.php');
  writeFileSync(router,[
    '<?php',
    "// TEST ROUTER ONLY, not shipped to OVH.",
    "if (($_SERVER['HTTP_X_TEST_TLS'] ?? '') === '1') $_SERVER['HTTPS']='on';",
    "if (parse_url($_SERVER['REQUEST_URI'],PHP_URL_PATH)!=='/gestion-social/') {http_response_code(404);return true;}",
    "require __DIR__.'/web/public/gestion-social/index.php';",
    ''
  ].join('\n'));
  const port=await availablePort();
  const server=spawn('php',['-S','127.0.0.1:'+port,router],{cwd:root,stdio:'ignore'});
  t.after(()=>{server.kill();rmSync(root,{recursive:true,force:true});});
  const url='http://127.0.0.1:'+port+'/gestion-social/';
  let response;
  for(let count=0;count<45;count++){
    try{response=await fetch(url);break;}catch{await new Promise(r=>setTimeout(r,100));}
  }
  assert.ok(response,'PHP server did not start');
  assert.equal(response.status,403,'Plain HTTP must always be rejected');
  assert.match(await response.text(),/HTTPS obligatoire/);
  const headers={'X-Test-TLS':'1'};
  const first=await fetch(url,{headers});
  assert.equal(first.status,200,'Private login must be accessible before authentication');
  const body=await first.text();
  assert.match(body,/Connexion privée/);
  assert.doesNotMatch(body,/facebook_caption|social_readonly_password|password_hash/);
  const cookie=first.headers.get('set-cookie')?.split(';')[0];
  assert.match(cookie,/^CDC_SOCIAL_REVIEW=/);
  const csrf=body.match(/name="csrf" value="([a-f0-9]{48})"/)?.[1];
  assert.ok(csrf,'Missing CSRF token');
  const send=async(params,cookieValue=cookie)=>{
    const res=await fetch(url,{method:'POST',headers:{...headers,'Cookie':cookieValue,
      'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(params),redirect:'manual'});
    return {res,html:await res.text()};
  };
  const invalid=await send({csrf:'tampered',login:'1',username:'fixture-operator',password:'fixture-password'});
  assert.equal(invalid.res.status,403);
  assert.match(invalid.html,/Session expirée/);
  const bad=await send({csrf,login:'1',username:'fixture-operator',password:'wrong'});
  assert.equal(bad.res.status,200);
  assert.match(bad.html,/Identifiants incorrects/);
  const good=await send({csrf,login:'1',username:'fixture-operator',password:'fixture-password'});
  assert.equal(good.res.status,503,'Correct login must fail closed if SELECT-only DB is not configured');
  assert.match(good.html,/non configuré ou indisponible/);
  assert.doesNotMatch(good.html,/PDO|password|postgres|DSN/i);
  const authenticatedCookie=good.res.headers.get('set-cookie')?.split(';')[0]||cookie;
  const again=await fetch(url,{headers:{...headers,'Cookie':authenticatedCookie}});
  assert.equal(again.status,503,'Authenticated session must remain protected by DB gate');
  const logout=await send({csrf,logout:'1'},authenticatedCookie);
  assert.equal(logout.res.status,200,'Logout must not require database connectivity');
  assert.match(logout.html,/Connexion privée/);
  assert.doesNotMatch(logout.html,/Référence Facebook|Brouillon n°/);
  const freshCsrf=logout.html.match(/name="csrf" value="([a-f0-9]{48})"/)?.[1];
  const freshCookie=logout.res.headers.get('set-cookie')?.split(';')[0]||authenticatedCookie;
  assert.ok(freshCsrf,'Missing new logout CSRF');
  // One failed login earlier in this test + four here = five within 15min.
  // The next (even correct) login must be blocked for this source IP.
  for(let n=0;n<4;n++){
    const wrong=await send({csrf:freshCsrf,login:'1',username:'fixture-operator',
      password:'incorrect-'+n},freshCookie);
    assert.equal(wrong.res.status,200);
  }
  const locked=await send({csrf:freshCsrf,login:'1',username:'fixture-operator',
    password:'fixture-password'},freshCookie);
  assert.equal(locked.res.status,429);
  assert.match(locked.html,/Trop de tentatives/);
  // Corrupted rate counters cannot be reinterpreted as zero failed attempts.
  const {createHash}=await import('node:crypto');
  const counter=join(secret,'social-login-'+createHash('sha256')
    .update('127.0.0.1').digest('hex')+'.json');
  writeFileSync(counter,'NOT JSON');
  const corrupt=await send({csrf:freshCsrf,login:'1',username:'fixture-operator',
    password:'fixture-password'},freshCookie);
  assert.equal(corrupt.res.status,503);
  assert.match(corrupt.html,/non configuré ou indisponible/);
  assert.doesNotMatch(corrupt.html,/PDO|password|postgres|DSN/i);
  // No test-only fake HTTPS header exists in the real production PHP.
  assert.doesNotMatch(readFileSync(sourceFile,'utf8'),/HTTP_X_TEST_TLS/);
});
