import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,writeFile} from 'node:fs/promises';import {join} from 'node:path';import {tmpdir} from 'node:os';
import {createCoralCheckpointHarness,coralFragmentPlan} from '../scripts/coral-tts-checkpoints.mjs';
import {audioSha,durableAudioWrite,TTS_CHAPTER_IDS} from '../scripts/coral-tts-audio.mjs';
import {createSimulatedTtsJobs,ttsRequestId} from '../scripts/coral-tts-jobs.mjs';import {createJobGateway} from '../scripts/editorial-ai-job-gateway.mjs';
import {execFile} from 'node:child_process';import {promisify} from 'node:util';
function fixtureText(){return 'Texte fictif de qualification, sans recommandation culinaire ni voix réelle. '.repeat(18);}
function fakeExchange({cut=false,onCall=()=>{}}={}){let calls=0;return {count:()=>calls,exchange:async({event})=>{
 calls++;onCall(calls);const id='resp_fake_'+calls,text=event.response.input[0].content[0].text;
 return {async *[Symbol.asyncIterator](){yield {type:'response.created',response:{id}};yield {type:'response.output_audio.delta',response_id:id,delta:Buffer.alloc(4800).toString('base64')};if(cut)return;
  yield {type:'response.output_audio.done',response_id:id};yield {type:'response.output_audio_transcript.done',response_id:id,transcript:text};
  yield {type:'response.done',response:{id,status:'completed',usage:{input_tokens:20,output_tokens:22,input_token_details:{text_tokens:20,audio_tokens:0},output_token_details:{text_tokens:2,audio_tokens:20}}}};
 }};
}};}
async function setup(t){const root=await mkdtemp(join(tmpdir(),'cdc-coral-checkpoints-'));t.after(()=>rm(root,{recursive:true,force:true}));const text=fixtureText();return {root,p:{requestId:'a'.repeat(48),index:0,chapter:{id:'intro',text,sha256:audioSha(text)},checkpointDir:join(root,'parts')}};}
test('bounded Unicode plan preserves exact text, identity and permanently unqualified adapter',async t=>{
 const {p}=await setup(t),text=fixtureText()+' 🇰🇭🌶️';const plan=coralFragmentPlan({text,sha256:audioSha(text)});assert.equal(plan.map(f=>f.text).join(''),text);assert.ok(plan.every(f=>Array.from(f.text).length<=600));
 const fake=fakeExchange(),adapter=createCoralCheckpointHarness({testOnly:true,exchange:fake.exchange,authorize:async()=>true});
 assert.throws(()=>createSimulatedTtsJobs({authorize:async()=>true,budgetDir:'unused',provider:adapter}),/CONFIG/);assert.throws(()=>createCoralCheckpointHarness({exchange:fake.exchange,authorize:async()=>true}),/DISABLED/);
 assert.equal(fake.count(),0);
});
test('durable receipts resume only missing sub-fragments and reject changed text or corrupted audio',async t=>{
 const {root,p}=await setup(t),fake=fakeExchange(),first=createCoralCheckpointHarness({testOnly:true,exchange:fake.exchange,authorize:async()=>true,pauseAfter:1});
 await assert.rejects(first.synthesize(p),/PAUSED/);assert.equal(fake.count(),1);assert.equal((await first.checkpointStatus(p)).safe_to_resume,true);
 const restarted=createCoralCheckpointHarness({testOnly:true,exchange:fake.exchange,authorize:async()=>true});
 await durableAudioWrite(join(root,'chapter.wav'),await restarted.synthesize(p));assert.equal(fake.count(),coralFragmentPlan(p.chapter).length);
 const count=fake.count();await durableAudioWrite(join(root,'chapter-copy.wav'),await restarted.synthesize(p));assert.equal(fake.count(),count);
 const changed={...p,chapter:{...p.chapter,text:p.chapter.text+' change'}};changed.chapter.sha256=audioSha(changed.chapter.text);await assert.rejects(restarted.synthesize(changed),/CHECKPOINT_ID/);assert.equal(fake.count(),count);
 const file=join(p.checkpointDir,'00.wav');await writeFile(file,'corrupt',{mode:0o600});await assert.rejects(restarted.synthesize(p),/CHECKPOINT_HASH/);assert.equal(fake.count(),count);
});
test('unknown response remains uncertain across a new adapter, with no replay or leaked error',async t=>{
 const {p}=await setup(t),fake=fakeExchange({cut:true});const make=()=>createCoralCheckpointHarness({testOnly:true,exchange:fake.exchange,authorize:async()=>true});
 await assert.rejects(make().synthesize(p),/UNCERTAIN_NO_RETRY/);await assert.rejects(make().synthesize(p),/UNCERTAIN_NO_RETRY/);assert.equal(fake.count(),1);assert.equal((await make().checkpointStatus(p)).safe_to_resume,false);
});
test('two actual Node processes retain confirmed receipts and synthesize only missing fragments',async t=>{
 const {root}=await setup(t),exec=promisify(execFile),run=async stage=>JSON.parse((await exec(process.execPath,['tests/fixtures/coral-tts-subfragment-process.mjs',root,stage],{windowsHide:true,timeout:120000})).stdout);
 const first=await run('first'),second=await run('resume');assert.notEqual(first.pid,second.pid);assert.equal(first.result,'paused');assert.equal(first.calls,1);assert.equal(second.result,'completed');assert.equal(second.calls,second.status.total_fragments);
});
test('fresh authority is required before every sub-fragment and again on resume',async t=>{
 const {p}=await setup(t);let valid=true;const fake=fakeExchange({onCall:()=>{valid=false;}}),a=createCoralCheckpointHarness({testOnly:true,exchange:fake.exchange,authorize:async()=>valid});
 await assert.rejects(a.synthesize(p),/AUTHORITY/);assert.equal(fake.count(),1);await assert.rejects(a.synthesize(p),/AUTHORITY/);assert.equal((await a.checkpointStatus(p)).safe_to_resume,false);
});
test('existing single gateway resumes a receipted partial chapter without a second engine or paid provider',async t=>{
 const {root}=await setup(t),fake=fakeExchange(),r={contract:'cdc-coral-private-tts-request-v1',creation_id:'c-'+'a'.repeat(24),creation_version:3,binding_sha256:'b'.repeat(64),recipe_sha256:'c'.repeat(64),chapters:TTS_CHAPTER_IDS.map(id=>{const text=fixtureText()+id;return {id,text,sha256:audioSha(text)};}),voice:'test-tone',provider:'simulated-tone-v1',rights_sha256:'d'.repeat(64),reviews_sha256:'e'.repeat(64),reserve_microusd:7000};r.request_id=ttsRequestId(r);
 const make=async pause=>{const inert=createCoralCheckpointHarness({testOnly:true,exchange:fake.exchange,authorize:async()=>true,pauseAfter:pause});
  // Explicit synthetic fixture wrapper; the actual paid/unqualified kind is rejected above.
  const jobs=createSimulatedTtsJobs({authorize:async()=>true,budgetDir:join(root,'budget'),provider:{kind:'simulated-tone-v1',paid:false,synthesize:inert.synthesize,checkpointStatus:inert.checkpointStatus}});
  return createJobGateway({root:join(root,'jobs'),token:'fake-checkpoint-token-'.repeat(3),provider:async()=>{throw Error('NO_PROVIDER')},ttsJobs:jobs});};
 const first=await make(1);await first.submit(r.request_id,r);await first.workOnce();assert.equal((await first.state(r.request_id)).status,'interrupted');assert.equal(fake.count(),1);
 const second=await make(null);await second.ttsOperation(r.request_id,'resume');await second.workOnce();const state=await second.state(r.request_id);assert.equal(state.status,'succeeded');
 assert.equal(fake.count(),r.chapters.reduce((n,c)=>n+coralFragmentPlan(c).length,0));assert.equal(JSON.parse(state.result).provider_charged_microusd,0);
 const receipt=JSON.parse(await readFile(join(root,'jobs',r.request_id,'tts','fragments','intro','00.receipt.json'),'utf8'));assert.ok(receipt.usage);assert.ok(receipt.response_id);assert.equal(receipt.cost_microusd,417);
});
