import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,writeFile,rm,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createJobGateway,validateJobRequest} from '../scripts/editorial-ai-job-gateway.mjs';
import {createCoralRealSpeechJobs} from '../scripts/coral-speech-real-jobs.mjs';
import {TTS_CHAPTER_IDS,privateAudioVerifiedOpen} from '../scripts/coral-tts-audio.mjs';
import {REAL_SPEECH_REQUEST_CONTRACT,REAL_SPEECH_PROVIDER,coralRealSpeechRequestId} from '../scripts/coral-real-speech-request.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
const token='test-only-authenticated-job-token-'.repeat(3);
function request(){
 const chapters=TTS_CHAPTER_IDS.map((id,i)=>{
  const text=('Fiction pour tester le circuit privé en toute sécurité, chapitre '+i+'. ').repeat(8);
  return {id,text,sha256:sha(text)};
 });
 const r={contract:REAL_SPEECH_REQUEST_CONTRACT,creation_id:'c-'+'2'.repeat(24),creation_version:4,
  binding_sha256:'a'.repeat(64),recipe_sha256:'b'.repeat(64),
  chapters,voice:'coral',provider:REAL_SPEECH_PROVIDER,speed_milli:930,
  rights_sha256:'c'.repeat(64),reviews_sha256:'d'.repeat(64),max_spend_microusd:1000000};
 r.request_id=coralRealSpeechRequestId(r);return r;
}
function wav(){
 const b=Buffer.alloc(48);b.write('RIFF');b.writeUInt32LE(40,4);b.write('WAVEfmt ',8);
 b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);
 b.writeUInt32LE(24000,24);b.writeUInt32LE(48000,28);
 b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);
 b.write('data',36);b.writeUInt32LE(4,40);return b;
}
test('default worker rejects real TTS request: no implicit paid generation',async()=>{
 const root=await mkdtemp(join(tmpdir(),'coral-real-gate-off-'));
 try{
  const g=await createJobGateway({root,token,provider:async()=>''});
  const r=request();assert.equal(validateJobRequest(r),r);
  await assert.rejects(g.submit(r.request_id,r),/JOB_TTS_DISABLED_OR_ID/);
 }finally{await rm(root,{force:true,recursive:true});}
});
test('existing authenticated HTTPS-compatible contract accepts real request only with runner injected',async()=>{
 const root=await mkdtemp(join(tmpdir(),'coral-real-gateway-')),runs=[];
 const r=request();
 const runner={
  async state(q,id){return {id,status:'queued',completed_chapters:0};},
  async run(q,id){runs.push(id);return {id,status:'awaiting_preview_approval',completed_chapters:0};},
  async resume(){throw Error('DO_NOT_RESUME');},
  async previewStream(q,id,folder){
   const p=join(folder,'preview.wav');const bytes=wav();
   try{await writeFile(p,bytes,{flag:'wx',mode:0o600});}catch(e){if(e.code!=='EEXIST')throw e;}
   return privateAudioVerifiedOpen(p,sha(bytes));
  },
  async audioStream(){throw Error('AUDIO_NOT_APPROVED');}
 };
 const g=await createJobGateway({root,token,provider:async()=>'',realTtsJobs:runner});
 await new Promise(resolve=>g.server.listen(0,'127.0.0.1',resolve));
 try{
  const base='http://127.0.0.1:'+g.server.address().port+'/editorial-ai/v1/jobs/'+r.request_id;
  const unauth=await fetch(base,{method:'PUT',body:JSON.stringify(r)});
  assert.equal(unauth.status,401);
  const ok=await fetch(base,{method:'PUT',
   headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
   body:JSON.stringify(r)});
  assert.equal(ok.status,202);assert.equal((await ok.json()).id,r.request_id);
  const duplicate=await fetch(base,{method:'PUT',
   headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
   body:JSON.stringify(r)});
  assert.equal(duplicate.status,202);assert.equal(runs.length,0);
  const publicPreview=await fetch(base+'/preview');
  assert.equal(publicPreview.status,401);
  const preview=await fetch(base+'/preview',{headers:{Authorization:'Bearer '+token,Range:'bytes=0-3'}});
  assert.equal(preview.status,206);assert.equal(preview.headers.get('content-type'),'audio/wav');
  assert.equal((await preview.arrayBuffer()).byteLength,4);
  assert.equal(runs.length,0);
  await g.workOnce();assert.deepEqual(runs,[r.request_id]);
 }finally{g.stopWorker();await new Promise(resolve=>g.server.close(resolve));await rm(root,{force:true,recursive:true});}
});

test('real Coral worker stops after one intro preview and cannot continue without separate approval',async()=>{
 const root=await mkdtemp(join(tmpdir(),'coral-real-preview-gate-'));
 const budgetDir=await mkdtemp(join(tmpdir(),'coral-real-preview-ledger-'));
 try{
  const r=request();let calls=0;
  const jobs=createCoralRealSpeechJobs({
   budgetDir,authorize:async()=>true,spendingApproved:async()=>true,
   externalProjectBudgetVerified:async()=>true,
   makeTransport:({authorize,reserve})=>({
    async synthesize(identity){
     assert.equal(await authorize(identity),true);
     await reserve({...identity,model:'gpt-4o-mini-tts',voice:'coral'});
     calls++;
     return {wav:wav(),receipt:{...identity,model:'gpt-4o-mini-tts',voice:'coral'}};
    }
   })
  });
  const first=await jobs.run(r,r.request_id,root);
  assert.equal(first.status,'awaiting_preview_approval', 'mock calls='+calls+'; files='+(await readdir(join(root,'real-tts'))).join(',')+'; ledger='+(await readdir(budgetDir)).join(','));
  assert.equal(calls,1);
  const replay=await jobs.run(r,r.request_id,root);
  assert.equal(replay.status,'awaiting_preview_approval');
  assert.equal(calls,1);
  const stream=await jobs.previewStream(r,r.request_id,root);
  try{assert.equal(stream.sha256,sha(wav()));}finally{await stream.handle.close();}
  await assert.rejects(jobs.resume(r,r.request_id,root,{ownerAlive:true}),/RUNNING/);
  assert.equal(calls,1);
  const approval=await jobs.resume(r,r.request_id,root,{ownerAlive:false});
  assert.equal(approval.status,'queued');
  await assert.rejects(jobs.resume(r,r.request_id,root),/RESUME_REFUSED/);
  const second=await jobs.run(r,r.request_id,root);
  assert.ok(calls>1,'explicit human approval allows further chapters');
  assert.notEqual(second.status,'awaiting_preview_approval');
 }finally{
  await rm(root,{recursive:true,force:true});
  await rm(budgetDir,{recursive:true,force:true});
 }
});
