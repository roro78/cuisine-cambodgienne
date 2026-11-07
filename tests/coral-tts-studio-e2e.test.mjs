import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm,mkdir,copyFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {chromium} from 'playwright-core';
import {createJobGateway} from '../scripts/editorial-ai-job-gateway.mjs';
import {createSimulatedTtsJobs} from '../scripts/coral-tts-jobs.mjs';
import {audioSha,simulatedTtsProvider} from '../scripts/coral-tts-audio.mjs';
const php=process.env.PHP_BIN||'php';
const dist=resolve(process.env.TTS_TEST_DIST||'dist');
async function freePort(){const s=createServer();await new Promise(r=>s.listen(0,'127.0.0.1',r));const p=s.address().port;await new Promise(r=>s.close(r));return p;}
async function fixture(t){
 const root=await mkdtemp(join(tmpdir(),'cdc-studio-browser-tts-'));
 t.after(()=>rm(root,{recursive:true,force:true}));
 const bridge=async(mode,request=null)=>{
  const child=spawn(php,['-d','display_errors=stderr','tests/php/fixtures/editorial-tts-bridge.php',mode,root,dist],{stdio:['pipe','pipe','pipe'],windowsHide:true});
  let stdout='',stderr='';child.stdout.on('data',b=>stdout+=b);child.stderr.on('data',b=>stderr+=b);
  child.stdin.end(request===null?'':JSON.stringify(request));
  const status=await new Promise((r,j)=>{child.on('error',j);child.on('exit',r)});
  if(status!==0)throw Error('TTS_FIXTURE_PHP '+stderr.slice(0,700));return JSON.parse(stdout);
 };
 const initial=await bridge('init');return {root,bridge,...initial};
}
test('real PHP journals invalidate source/rights/visas and refuse fabricated or incomplete rights',async t=>{
 const f=await fixture(t);await assert.rejects(f.bridge('request'),/TTS_RIGHTS_REQUIRED/);
 await f.bridge('rights');const r=await f.bridge('request');assert.equal(await f.bridge('authorize',r),true);
 await f.bridge('revoke-rights');assert.equal(await f.bridge('authorize',r),false);
 await f.bridge('rights');const r2=await f.bridge('request');assert.notEqual(r.request_id,r2.request_id);
 await f.bridge('revoke-visa');assert.equal(await f.bridge('authorize',r2),false);
});
test('revoking final cross-review vetoes even a previously authorized simulated TTS request',async t=>{
 const f=await fixture(t);await f.bridge('rights');
 const request=await f.bridge('request');assert.equal(await f.bridge('authorize',request),true);
 await f.bridge('revoke-final');
 assert.equal(await f.bridge('authorize',request),false);
 await assert.rejects(f.bridge('request'),/TTS_FINAL_REVIEW_REQUIRED/);
});
test('PHP rights require authenticated explicit decisions and reject stale, forged or corrupt journals',async t=>{
 const f=await fixture(t);const result=await f.bridge('safety');assert.ok(result.passed.length>=8);
});
test('changing a saved narration during a real PHP-authorized job stops before chapter four',async t=>{
 const f=await fixture(t);await f.bridge('rights');const request=await f.bridge('request');let calls=0;
 const p=simulatedTtsProvider();
 const jobs=createSimulatedTtsJobs({budgetDir:join(f.root,'budget'),authorize:r=>f.bridge('authorize',r),
  provider:{...p,async synthesize(part){calls++;const b=await p.synthesize(part);if(part.index===2)await f.bridge('change-text');return b;}}});
 const gateway=await createJobGateway({root:join(f.root,'jobs'),token:'synthetic-token-'.repeat(4),provider:async()=>{},ttsJobs:jobs});
 await gateway.submit(request.request_id,request);await gateway.workOnce();
 assert.equal(calls,3);assert.equal((await gateway.state(request.request_id)).error,'TTS_AUTHORIZATION_REVOKED_OR_STALE');
 await assert.rejects(gateway.ttsOperation(request.request_id,'resume'),/AUTHORIZATION/);
});
test('shared Studio through authenticated HTTP: rights, double submit, seven actual audio segments, playback and private approval',async t=>{
 const f=await fixture(t);let calls=0;const p=simulatedTtsProvider();
 const jobs=createSimulatedTtsJobs({budgetDir:join(f.root,'budget'),authorize:r=>f.bridge('authorize',r),
  provider:{...p,async synthesize(part){calls++;return p.synthesize(part);}}});
 const token='synthetic-local-tts-'.repeat(3);
 const gateway=await createJobGateway({root:join(f.root,'jobs'),token,provider:async()=>{throw Error('NO_TEXT_PROVIDER')},ttsJobs:jobs});
 await new Promise(r=>gateway.server.listen(0,'127.0.0.1',r));gateway.startWorker();
 t.after(async()=>{gateway.stopWorker();await new Promise(r=>gateway.server.close(r));});
 await writeFile(join(f.root,'tts-port.txt'),String(gateway.server.address().port));
 const config=join(f.root,'.cuisine-asset-portal','config.php');
 const original=await readFile(config,'utf8');
 const additional=await readFile('tests/fixtures/editorial-tts-config.php','utf8');
 await writeFile(config,original.replace('return $cfg;',additional.replace(/^<\?php\s*/, '')+'\nreturn $cfg;'),{mode:0o600});
 const port=await freePort(),origin='http://127.0.0.1:'+port,base=origin+'/gestion-contenus/';
 const server=spawn(php,['-S','127.0.0.1:'+port,join(f.root,'router.php')],{stdio:['ignore','ignore','pipe'],windowsHide:true});
 let errors='';server.stderr.on('data',b=>errors+=b);t.after(()=>server.kill());
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--autoplay-policy=no-user-gesture-required']});
 t.after(()=>browser.close());const ctx=await browser.newContext({viewport:{width:390,height:844}});
 await ctx.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
 const page=await ctx.newPage();page.setDefaultTimeout(45000);page.setDefaultNavigationTimeout(45000);
 for(let i=0;i<30;i++){try{await page.goto(base);break;}catch(e){if(i===29)throw e;await new Promise(r=>setTimeout(r,100));}}
 const unauth=await ctx.request.get(base+'?new=1&cid='+f.id+'&tts_file='+'a'.repeat(48));assert.equal(unauth.status(),403);
 await page.locator('[name=username]').fill('fixture-admin');await page.locator('[name=password]').fill('synthetic-login-only');await page.locator('button[name=login]').click();
 const url=base+'?new=1&cid='+f.id;await page.goto(url);
 const panel=page.locator('#cms-tts');assert.equal(await panel.count(),1,errors.slice(-1000));
 await page.goto(url+'&final_audit=1#final-review');
 const finalPanel=page.locator('[data-coral-final-audit]');assert.equal(await finalPanel.count(),1);
 assert.match(await finalPanel.innerText(),/Visa final actif/);
 assert.equal(await finalPanel.locator('button[value=revoke]').count(),1);
 await page.goto(url);
 assert.equal(await panel.locator('button[value=generate]').isDisabled(),true);
 for(const name of ['voice','content','private_audio'])await panel.locator('[name="tts_checks['+name+']"]').check();
 await panel.locator('[name=tts_note]').fill('Autorisation fictive du test isolé, sans droits de production.');
 await panel.locator('[name=tts_confirm]').first().check();await panel.locator('button[value=approve_rights]').click();
 assert.equal(await panel.locator('button[value=generate]').isDisabled(),false);
 const form=panel.locator('form:has(button[value=generate])');await form.locator('[name=tts_confirm]').check();
 const fields=await form.evaluate(e=>Object.fromEntries(new FormData(e)));fields.tts_action='generate';
 const forbidden=await ctx.request.post(url,{form:{...fields,csrf:'invalid'},maxRedirects:0});assert.equal(forbidden.status(),403);
 const replies=await Promise.all([ctx.request.post(url,{form:fields,maxRedirects:0}),ctx.request.post(url,{form:fields,maxRedirects:0})]);
 assert.deepEqual(replies.map(r=>r.status()),[303,303]);
 let manifest=null;
 for(let i=0;i<120;i++){
  await page.goto(url);if(await panel.locator('audio').count())break;await new Promise(r=>setTimeout(r,500));
 }
 assert.equal(await panel.locator('audio').count(),1,errors.slice(-1000));assert.equal(calls,7);
 const request=await f.bridge('request');const state=await gateway.state(request.request_id);assert.equal(state.status,'succeeded');manifest=JSON.parse(state.result);
 const binary=await ctx.request.get(base+'?new=1&cid='+f.id+'&tts_file='+request.request_id);assert.equal(binary.status(),200);
 assert.equal(audioSha(await binary.body()),manifest.sha256);
 const partial=await ctx.request.get(base+'?new=1&cid='+f.id+'&tts_file='+request.request_id,{headers:{Range:'bytes=0-127'}});
 assert.equal(partial.status(),206);assert.deepEqual(await partial.body(),(await binary.body()).subarray(0,128));
 assert.equal(partial.headers()['content-range'],'bytes 0-127/'+manifest.bytes);
 const invalidRange=await ctx.request.get(base+'?new=1&cid='+f.id+'&tts_file='+request.request_id,{headers:{Range:'bytes=0-1,3-4'}});
 assert.equal(invalidRange.status(),416);
 const audio=panel.locator('audio');await audio.evaluate(e=>e.load());
 await page.waitForFunction(()=>{const a=document.querySelector('#cms-tts audio');return a&&a.readyState>=2&&a.duration>0;});
 assert.ok(await audio.evaluate(e=>e.duration)>1);
 await audio.evaluate(async e=>{await e.play();});await page.waitForFunction(()=>document.querySelector('#cms-tts audio').currentTime>0);
 await audio.evaluate(e=>e.pause());
 for(const width of [360,390,1440]){await page.setViewportSize({width,height:950});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'audio responsive '+width);}
 for(const k of ['full_listening','chapter_order'])await panel.locator('[name="tts_checks['+k+']"]').check();
 const approval=panel.locator('form:has(button[value=approve_audio])');
 await approval.locator('[name=tts_note]').fill('Approbation technique fictive de signaux simulés, pas de qualité vocale réelle.');await approval.locator('[name=tts_confirm]').check();
 const approvalResponse=page.waitForResponse(r=>r.request().method()==='POST'&&r.url().startsWith(base));
 await approval.locator('button[value=approve_audio]').click();
 assert.equal((await approvalResponse).status(),303,(await page.locator('body').innerText()).slice(0,1500)+errors.slice(-1500));
 await page.waitForSelector('[data-tts-approved]',{timeout:15000});
 assert.equal(await panel.locator('[data-tts-approved]').count(),1);
 assert.match(await panel.innerText(),/publication.*distincte/i);assert.equal(calls,7);
 if(process.env.TTS_EVIDENCE_DIR){
  await mkdir(process.env.TTS_EVIDENCE_DIR,{recursive:true});
  for(const width of [390,1440]){await page.setViewportSize({width,height:950});await page.screenshot({path:join(process.env.TTS_EVIDENCE_DIR,'tts-'+width+'.png'),fullPage:true});}
  await writeFile(join(process.env.TTS_EVIDENCE_DIR,'proof.json'),JSON.stringify({segments:7,calls,manifest,privateApproval:true,publication:false},null,2));
  const output=join(process.env.TTS_EVIDENCE_DIR,'audio');await mkdir(output,{recursive:true});
  const folder=join(f.root,'jobs',request.request_id,'tts');const saved=JSON.parse(await readFile(join(folder,'manifest.json'),'utf8'));
  await copyFile(join(folder,saved.file),join(output,'simulated-workshop.mp3'));
  for(const id of ['intro','installer','preparer','assembler','maitriser','rectifier','terminer'])await copyFile(join(folder,id+'.wav'),join(output,id+'.wav'));
  await writeFile(join(output,'manifest.json'),JSON.stringify(manifest,null,2));
 }
 await f.bridge('revoke-rights');const denied=await ctx.request.get(base+'?new=1&cid='+f.id+'&tts_file='+request.request_id,{headers:{Range:'bytes=0-127'}});assert.equal(denied.status(),404);
 assert.equal(calls,7);
});
