import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,chmod} from 'node:fs/promises';
import {join} from 'node:path';
import {createServer as httpServer,request as httpRequest} from 'node:http';
import {createServer as httpsServer,request as httpsRequest} from 'node:https';
import {spawn,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {ttsStudioFixture} from './fixtures/coral-tts-studio-harness.mjs';
import {createStudioTtsAuthority,ttsAuthorityProjection} from '../scripts/coral-tts-authority.mjs';
import {createSimulatedTtsJobs,ttsRequestId} from '../scripts/coral-tts-jobs.mjs';
import {audioSha} from '../scripts/coral-tts-audio.mjs';
import {simulatedTtsProvider} from '../scripts/coral-tts-audio.mjs';
import {createJobGateway} from '../scripts/editorial-ai-job-gateway.mjs';
const exec=promisify(execFile);
async function freePort(){const s=httpServer();await new Promise(r=>s.listen(0,'127.0.0.1',r));const p=s.address().port;await new Promise(r=>s.close(r));return p;}
async function fixture(t,{enabled=true}={}){
 const f=await ttsStudioFixture(t);await f.bridge('rights');
 const tokenFile=join(f.root,'.cuisine-asset-portal','authority-token');
 await writeFile(tokenFile,'6'.repeat(64),{mode:0o600});
 const config=join(f.root,'.cuisine-asset-portal','config.php');
 const original=await readFile(config,'utf8');
 await writeFile(config,original.replace('return $cfg;',`$cfg['editorial_tts_authority']=['enabled'=>${enabled?'true':'false'},'qualified'=>true,'token_file'=>__DIR__.'/authority-token'];return $cfg;`),{mode:0o600});
 const phpPort=await freePort();let errors='';
 const php=spawn(process.env.PHP_BIN||'php',['-S','127.0.0.1:'+phpPort,join(f.root,'router.php')],{stdio:['ignore','ignore','pipe'],windowsHide:true});
 php.stderr.on('data',b=>errors+=b);t.after(()=>php.kill());
 for(let i=0;i<40;i++){try{await fetch('http://127.0.0.1:'+phpPort+'/gestion-contenus/');break;}catch(e){if(i===39)throw Error(errors);await new Promise(r=>setTimeout(r,100));}}
 const key=join(f.root,'tls.key'),cert=join(f.root,'tls.pem');
 await exec(process.env.OPENSSL_BIN||'openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',key,'-out',cert,'-days','1',
  '-subj','/CN=127.0.0.1','-addext','subjectAltName=IP:127.0.0.1'],{windowsHide:true});
 const ca=await readFile(cert);let checks=0,override=null;
 const tls=httpsServer({key:await readFile(key),cert:ca},(req,res)=>{
  checks++;if(override){override(req,res);return;}
  // Test-only TLS front of the actual shared PHP entry point; never production proxy settings.
  const forward=httpRequest({host:'127.0.0.1',port:phpPort,path:req.url,method:req.method,headers:req.headers},up=>{
   res.writeHead(up.statusCode,up.headers);up.pipe(res);
  });forward.on('error',()=>{res.writeHead(503);res.end();});req.pipe(forward);
 });
 await new Promise(r=>tls.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>{tls.closeAllConnections();tls.close(r);}));
 const endpoint='https://127.0.0.1:'+tls.address().port+'/gestion-contenus/?tts_authority=1';
 const authorize=createStudioTtsAuthority({endpoint,tokenFile,testOnly:true,testCa:ca,timeoutMs:1500});
 const raw=async({method='POST',headers={},body='{}'}={})=>new Promise((resolve,reject)=>{
  const req=httpsRequest(endpoint,{method,ca,headers:{Authorization:'Bearer '+'6'.repeat(64),'Content-Type':'application/json',...headers},signal:AbortSignal.timeout(3000)},res=>{
   const chunks=[];res.on('data',b=>chunks.push(b));res.on('end',()=>resolve({status:res.statusCode,body:Buffer.concat(chunks).toString('utf8'),headers:res.headers}));
  });req.on('error',reject);req.end(method==='GET'?undefined:body);
 });
 return {...f,tokenFile,authorize,raw,checks:()=>checks,override:x=>override=x,endpoint,ca};
}
test('HTTPS authority requires current PHP journals AND explicit server generation confirmation',async t=>{
 const f=await fixture(t),r=await f.bridge('request');
 assert.equal(await f.authorize(r),false);await f.bridge('confirm');assert.equal(await f.authorize(r),true);
 assert.equal(await f.authorize(r),true);assert.equal(f.checks(),3,'no cached allow');
 await f.bridge('revoke-rights');assert.equal(await f.authorize(r),false);
});
test('HTTPS authority refuses missing, stale or forged selectors and closed default configuration',async t=>{
 const f=await fixture(t);await f.bridge('confirm');const r=await f.bridge('request');
 for(const mutation of [x=>x.creation_version++,x=>x.recipe_sha256='a'.repeat(64),x=>x.chapters[0].text+=' forged',x=>x.rights_sha256='a'.repeat(64)]){
  const bad=structuredClone(r);mutation(bad);bad.chapters[0].sha256=audioSha(bad.chapters[0].text);
  bad.request_id=ttsRequestId(bad);assert.equal(await f.authorize(bad),false);
 }
 await f.bridge('change-text');assert.equal(await f.authorize(r),false);
 const closed=await fixture(t,{enabled:false});await closed.bridge('confirm');assert.equal(await closed.authorize(await closed.bridge('request')),false);
});
test('recipe/source changes and revoked visas are re-read from the PHP server',async t=>{
 for(const mode of ['change-recipe','revoke-visa']){
  const f=await fixture(t);await f.bridge('confirm');const r=await f.bridge('request');assert.equal(await f.authorize(r),true);
  await f.bridge(mode);assert.equal(await f.authorize(r),false);
 }
});
test('HTTPS bearer rotation/removal, TLS trust, redirects, fresh challenges and bounded responses fail closed',async t=>{
 const f=await fixture(t);await f.bridge('confirm');const r=await f.bridge('request');
 await writeFile(f.tokenFile,'7'.repeat(64)); // Same test file is read by both peers on each check.
 assert.equal(await f.authorize(r),true);
 const wrong=join(f.root,'wrong-token');await writeFile(wrong,'8'.repeat(64),{mode:0o600});
 const bad=createStudioTtsAuthority({endpoint:f.endpoint,tokenFile:wrong,testOnly:true,testCa:f.ca});assert.equal(await bad(r),false);
 const untrusted=createStudioTtsAuthority({endpoint:f.endpoint,tokenFile:f.tokenFile,testOnly:true,testCa:Buffer.from('invalid CA')});assert.equal(await untrusted(r),false);
 await writeFile(f.tokenFile,'invalid');assert.equal(await f.authorize(r),false);await writeFile(f.tokenFile,'7'.repeat(64));
 for(const reply of [
  (req,res)=>{res.writeHead(302,{Location:'https://example.invalid/'});res.end();},
  (req,res)=>{res.writeHead(503);res.flushHeaders();res.socket.destroy();},
  (req,res)=>{res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({contract:'cdc-coral-tts-authority-check-v1',request_id:r.request_id,challenge:'0'.repeat(64),authorized:true}));},
  (req,res)=>{res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(' '.repeat(3000));},
  ()=>{}
 ]){f.override(reply);assert.equal(await f.authorize(r),false);}
 f.override(null);
 if(process.platform!=='win32'){await chmod(f.tokenFile,0o644);assert.equal(await f.authorize(r),false);await chmod(f.tokenFile,0o600);}
 assert.throws(()=>createStudioTtsAuthority({endpoint:f.endpoint.replace('https:','http:'),tokenFile:wrong,testOnly:true,testCa:f.ca}),/CONFIG/);
 assert.throws(()=>createStudioTtsAuthority({endpoint:'https://evil.invalid/gestion-contenus/?tts_authority=1',tokenFile:wrong}),/CONFIG/);
});
test('shared PHP machine route rejects wrong method, browser origin, token, content type, oversized or forged JSON without a session',async t=>{
 const f=await fixture(t);await f.bridge('confirm');const r=await f.bridge('request');
 const body=JSON.stringify({contract:'cdc-coral-tts-authority-check-v1',challenge:'a'.repeat(64),request:ttsAuthorityProjection(r)});
 const ok=await f.raw({body});assert.equal(ok.status,200);assert.equal(JSON.parse(ok.body).authorized,true);
 assert.equal(ok.headers['set-cookie'],undefined,'machine read never opens an admin session');assert.match(ok.headers['cache-control'],/no-store/);
 for(const [options,code] of [[{method:'GET'},405],[{headers:{Authorization:'Bearer wrong'}},401],
  [{headers:{Origin:'https://example.invalid'}},404],[{headers:{'Content-Type':'text/plain'}},422],
  [{body:' '.repeat(6001)},422],[{body:'{}'},422],[{body:body.replace('"challenge":"a','"challenge":"z')},422]]){
  const reply=await f.raw({body,...options});assert.equal(reply.status,code);assert.ok(reply.body.length<100);
 }
});
test('remote revocation or connection loss after chapter three stops the existing worker before chapter four',async t=>{
 for(const mode of ['revoke-rights','disconnect']){
  const f=await fixture(t);await f.bridge('confirm');const r=await f.bridge('request');let calls=0;const tone=simulatedTtsProvider();
  const jobs=createSimulatedTtsJobs({authorize:f.authorize,budgetDir:join(f.root,'budget'),provider:{...tone,async synthesize(part){
   calls++;const bytes=await tone.synthesize(part);
   if(calls===3){if(mode==='disconnect')f.override((req,res)=>{res.writeHead(503);res.end();});else await f.bridge(mode);}return bytes;
  }}});
  const gateway=await createJobGateway({root:join(f.root,'jobs'),token:'synthetic-queue-token-'.repeat(3),provider:async()=>{},ttsJobs:jobs});
  await gateway.submit(r.request_id,r);await gateway.workOnce();assert.equal(calls,3);
  assert.equal((await gateway.state(r.request_id)).error,'TTS_AUTHORIZATION_REVOKED_OR_STALE');
  await assert.rejects(gateway.ttsOperation(r.request_id,'resume'),/AUTHORIZATION/);assert.equal(calls,3);
 }
});
test('a completed MP3 cannot be downloaded from the worker after remote revocation',async t=>{
 const f=await fixture(t);await f.bridge('confirm');const r=await f.bridge('request');
 const jobs=createSimulatedTtsJobs({authorize:f.authorize,budgetDir:join(f.root,'budget')});
 const gateway=await createJobGateway({root:join(f.root,'jobs'),token:'synthetic-queue-token-'.repeat(3),provider:async()=>{},ttsJobs:jobs});
 await gateway.submit(r.request_id,r);await gateway.workOnce();assert.equal((await gateway.state(r.request_id)).status,'succeeded');
 assert.ok((await gateway.ttsOperation(r.request_id,'audio')).length>1000);
 await f.bridge('revoke-rights');await assert.rejects(gateway.ttsOperation(r.request_id,'audio'),/AUTHORIZATION/);
});
