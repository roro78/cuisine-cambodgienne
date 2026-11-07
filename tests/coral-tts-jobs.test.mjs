import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm,readdir,chmod} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createSimulatedTtsJobs,ttsRequestId,validateTtsRequest} from '../scripts/coral-tts-jobs.mjs';
import {audioSha,simulatedTtsProvider,TTS_CHAPTER_IDS,probeAudio} from '../scripts/coral-tts-audio.mjs';
import {createJobGateway} from '../scripts/editorial-ai-job-gateway.mjs';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
export function ttsFixture(){
 const r={contract:'cdc-coral-private-tts-request-v1',creation_id:'c-'+'a'.repeat(24),creation_version:3,
  binding_sha256:'b'.repeat(64),recipe_sha256:'c'.repeat(64),chapters:TTS_CHAPTER_IDS.map(id=>{
   const text=('Donnée fictive de test non publiable, aucune recommandation culinaire. ').repeat(3)+id;
   return {id,text,sha256:audioSha(text)};
  }),voice:'test-tone',provider:'simulated-tone-v1',rights_sha256:'d'.repeat(64),reviews_sha256:'e'.repeat(64),reserve_microusd:7000};
 r.request_id=ttsRequestId(r);return r;
}
async function setup(t,options={}){
 const root=await mkdtemp(join(tmpdir(),'cdc-tts-test-'));t.after(()=>rm(root,{recursive:true,force:true}));
 const authority={valid:true};let calls=0;const tone=simulatedTtsProvider({failAt:options.failAt});
 const provider={...tone,async synthesize(c){calls++;const value=await tone.synthesize(c);if(options.revokeAt===c.index)authority.valid=false;return value;}};
 const jobs=createSimulatedTtsJobs({authorize:async()=>authority.valid,budgetDir:join(root,'budget'),provider,...options});
 const gateway=await createJobGateway({root:join(root,'jobs'),token:'synthetic-token-'.repeat(4),provider:async()=>{throw Error('WRONG_PROVIDER')},ttsJobs:jobs});
 return {root,jobs,gateway,authority,calls:()=>calls};
}
test('seven actual WAV segments, measured MP3, embedded chapters, private no-overwrite output',async t=>{
 const s=await setup(t),r=ttsFixture();validateTtsRequest(r);
 await s.gateway.submit(r.request_id,r);await s.gateway.workOnce();
 const state=await s.gateway.state(r.request_id);assert.equal(state.status,'succeeded');assert.equal(s.calls(),7);
 const m=JSON.parse(state.result);assert.equal(m.chapters.length,7);assert.equal(m.audio_approved,false);assert.equal(m.publication_ready,false);
 const folder=join(s.root,'jobs',r.request_id,'tts');
 assert.equal((await readdir(folder)).filter(x=>x.endsWith('.wav')).length,7);
 const disk=JSON.parse(await readFile(join(folder,'manifest.json'),'utf8'));
 const probe=await probeAudio(join(folder,disk.file));assert.equal(probe.codec,'mp3');assert.equal(probe.chapters.length,7);
 assert.deepEqual(probe.chapters.map(c=>c.tags.title),TTS_CHAPTER_IDS);assert.equal(m.sha256,audioSha(await s.gateway.ttsOperation(r.request_id,'audio')));
 await s.gateway.submit(r.request_id,r);await s.gateway.workOnce();assert.equal(s.calls(),7);
});
test('explicit restart after third chapter only synthesizes four missing fragments',async t=>{
 const s=await setup(t,{pauseAfter:3}),r=ttsFixture();await s.gateway.submit(r.request_id,r);await s.gateway.workOnce();
 assert.equal((await s.gateway.state(r.request_id)).status,'interrupted');assert.equal(s.calls(),3);
 const restarted=await createJobGateway({root:join(s.root,'jobs'),token:'synthetic-token-'.repeat(4),provider:async()=>{},ttsJobs:s.jobs});
 await restarted.workOnce();assert.equal(s.calls(),3);await restarted.ttsOperation(r.request_id,'resume');await restarted.workOnce();
 assert.equal((await restarted.state(r.request_id)).status,'succeeded');assert.equal(s.calls(),7);
});
test('uncertain provider response never retries, even after explicit resume',async t=>{
 const s=await setup(t,{failAt:3}),r=ttsFixture();await s.gateway.submit(r.request_id,r);await s.gateway.workOnce();
 assert.equal((await s.gateway.state(r.request_id)).status,'uncertain');assert.equal(s.calls(),4);
 await assert.rejects(s.gateway.ttsOperation(r.request_id,'resume'),/TTS_UNCERTAIN/);await s.gateway.workOnce();assert.equal(s.calls(),4);
});
test('revocation/source-change authority stops before the next chapter and prevents audio access',async t=>{
 const s=await setup(t,{revokeAt:2}),r=ttsFixture();await s.gateway.submit(r.request_id,r);await s.gateway.workOnce();
 const state=await s.gateway.state(r.request_id);assert.equal(state.status,'interrupted');assert.match(state.error,/AUTHORIZATION/);assert.equal(s.calls(),3);
 await assert.rejects(s.gateway.ttsOperation(r.request_id,'resume'),/AUTHORIZATION/);
 await assert.rejects(s.gateway.ttsOperation(r.request_id,'audio'),/AUTHORIZATION/);
});
test('budget fails before provider invocation and ledger reservations survive failures',async t=>{
 const s=await setup(t,{maxDailyUsd:0.006}),r=ttsFixture();await s.gateway.submit(r.request_id,r);await s.gateway.workOnce();
 assert.equal(s.calls(),0);assert.equal((await s.gateway.state(r.request_id)).error,'CORAL_EXTERNAL_BUDGET_LIMIT');
});
test('tampered fragment refuses resume without replacing old bytes',async t=>{
 const s=await setup(t,{pauseAfter:3}),r=ttsFixture();await s.gateway.submit(r.request_id,r);await s.gateway.workOnce();
 const file=join(s.root,'jobs',r.request_id,'tts','intro.wav');await writeFile(file,'historical bytes',{mode:0o600});
 await assert.rejects(s.gateway.ttsOperation(r.request_id,'resume'),/TTS_FRAGMENT_HASH/);assert.equal(await readFile(file,'utf8'),'historical bytes');assert.equal(s.calls(),3);
});
test('default gateway rejects TTS and strict identity rejects text or parameter tampering',async t=>{
 const s=await setup(t),r=ttsFixture(),bad=structuredClone(r);bad.chapters[0].text+=' changed';
 assert.throws(()=>validateTtsRequest(bad),/TTS_REQUEST/);
 const closed=await createJobGateway({root:join(s.root,'closed'),token:'synthetic-token-'.repeat(4),provider:async()=>{throw Error('PAID_CALL')}});
 await assert.rejects(closed.submit(r.request_id,r),/DISABLED/);
});
test('monthly cap includes previous days before any simulated call',async t=>{
 const s=await setup(t,{maxMonthlyUsd:0.01}),r=ttsFixture(),day=new Date().toISOString().slice(0,10);
 await mkdir(join(s.root,'budget'),{mode:0o700});
 const other=day.slice(0,8)+(day.endsWith('01')?'02':'01');
 await writeFile(join(s.root,'budget','budget-'+other+'.json'),JSON.stringify({contract:'cdc-coral-daily-reservations-v1',day:other,requests:[{reservedUsd:0.009}]}),{mode:0o600});
 await s.gateway.submit(r.request_id,r);await s.gateway.workOnce();assert.equal(s.calls(),0);
 assert.equal((await s.gateway.state(r.request_id)).error,'CORAL_EXTERNAL_MONTHLY_LIMIT');
});
test('concurrent double click and two workers share the one exclusive gateway claim',async t=>{
 const s=await setup(t),r=ttsFixture();await Promise.all([s.gateway.submit(r.request_id,r),s.gateway.submit(r.request_id,r)]);
 const second=await createJobGateway({root:join(s.root,'jobs'),token:'synthetic-token-'.repeat(4),provider:async()=>{},ttsJobs:s.jobs});
 await Promise.all([s.gateway.workOnce(),second.workOnce()]);assert.equal(s.calls(),7);
 assert.equal((await s.gateway.state(r.request_id)).status,'succeeded');
 assert.equal((await readdir(join(s.root,'jobs'))).filter(x=>x.startsWith('.incoming')).length,0);
});
test('raw provider secrets never reach state and existing published audio is untouched',async t=>{
 const s=await setup(t),r=ttsFixture(),file=join(s.root,'atelier-coral-v2.mp3');await writeFile(file,'old published audio',{mode:0o600});
 const jobs=createSimulatedTtsJobs({authorize:async()=>true,budgetDir:join(s.root,'budget2'),provider:{kind:'simulated-tone-v1',paid:false,async synthesize(){throw Error('sk-PRIVATE_SHOULD_NEVER_APPEAR')}}});
 const g=await createJobGateway({root:join(s.root,'other-jobs'),token:'synthetic-token-'.repeat(4),provider:async()=>{},ttsJobs:jobs});
 await g.submit(r.request_id,r);await g.workOnce();assert.ok(!JSON.stringify(await g.state(r.request_id)).includes('PRIVATE_SHOULD'));
 assert.equal(await readFile(file,'utf8'),'old published audio');
});
test('Linux rejects permissive audio stores', {skip:process.platform==='win32'},async t=>{
 const s=await setup(t,{pauseAfter:3}),r=ttsFixture();await s.gateway.submit(r.request_id,r);await s.gateway.workOnce();
 const file=join(s.root,'jobs',r.request_id,'tts','intro.wav');await chmod(file,0o644);
 await assert.rejects(s.gateway.ttsOperation(r.request_id,'resume'),/TTS_PRIVATE_FILE/);
});
test('separate Node processes retain three receipts and resume exactly four fragments',async t=>{
 const s=await setup(t),r=ttsFixture();await writeFile(join(s.root,'fixture-request.json'),JSON.stringify(r),{mode:0o600});
 const run=async mode=>JSON.parse((await promisify(execFile)(process.execPath,['tests/fixtures/coral-tts-process.mjs',s.root,mode],{timeout:60000,windowsHide:true})).stdout);
 assert.equal((await run('first')).status,'interrupted');
 assert.equal((await run('observe')).status,'interrupted');
 assert.equal((await readFile(join(s.root,'fixture-calls.txt'),'utf8')).trim().split('\n').length,3);
 assert.equal((await run('resume')).status,'succeeded');
 const calls=(await readFile(join(s.root,'fixture-calls.txt'),'utf8')).trim().split('\n');assert.deepEqual(calls,TTS_CHAPTER_IDS);
});
test('another gateway cannot resume a live worker or bypass bearer on audio/resume',async t=>{
 const s=await setup(t),r=ttsFixture();let release,entered;
 const seen=new Promise(resolve=>entered=resolve),waiting=new Promise(resolve=>release=resolve),p=simulatedTtsProvider();
 const jobs=createSimulatedTtsJobs({authorize:async()=>true,budgetDir:join(s.root,'budget3'),
  provider:{...p,async synthesize(part){if(part.index===0){entered();await waiting;}return p.synthesize(part)}}});
 const root=join(s.root,'live'),token='synthetic-token-'.repeat(4);
 const one=await createJobGateway({root,token,provider:async()=>{},ttsJobs:jobs});
 const two=await createJobGateway({root,token,provider:async()=>{},ttsJobs:jobs});
 await one.submit(r.request_id,r);const running=one.workOnce();await seen;
 try{
  assert.equal((await two.state(r.request_id)).status,'running');
  await assert.rejects(two.ttsOperation(r.request_id,'resume'),/TTS_BUSY/);
 }finally{release();await running;}
 await new Promise(resolve=>one.server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>one.server.close(resolve)));
 const base='http://127.0.0.1:'+one.server.address().port+'/editorial-ai/v1/jobs/'+r.request_id;
 assert.equal((await fetch(base+'/audio')).status,401);
 assert.equal((await fetch(base+'/resume',{method:'POST'})).status,401);
 assert.equal((await fetch(base+'/audio',{headers:{Authorization:'Bearer '+token}})).status,200);
});
test('renewed rights cannot register a second synthesis of the same version and voice',async t=>{
 const s=await setup(t),r=ttsFixture();await s.gateway.submit(r.request_id,r);
 const renewed=structuredClone(r);renewed.rights_sha256='f'.repeat(64);renewed.request_id=ttsRequestId(renewed);
 await assert.rejects(s.gateway.submit(renewed.request_id,renewed),/JOB_CONFLICT/);
 assert.equal(s.calls(),0);
});
test('a foreign or rolled-over budget receipt cannot finance resumed calls',async t=>{
 const s=await setup(t,{pauseAfter:3}),r=ttsFixture();await s.gateway.submit(r.request_id,r);await s.gateway.workOnce();
 const file=join(s.root,'jobs',r.request_id,'tts','reservation.json'),saved=JSON.parse(await readFile(file,'utf8'));
 saved.job_id='f'.repeat(48);await writeFile(file,JSON.stringify(saved),{mode:0o600});
 await assert.rejects(s.gateway.ttsOperation(r.request_id,'resume'),/TTS_BUDGET_REVIEW_REQUIRED/);assert.equal(s.calls(),3);
});
