import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,mkdir,writeFile,rm,readdir,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createJobGateway,validateJobRequest,currentStudioSpeechApproval,startEditorialJobRuntime} from '../scripts/editorial-ai-job-gateway.mjs';
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

test('persistent Coral feature grants each job only while current Studio says yes',async()=>{
 const allowed=new Set();
 const authority=async r=>{
  if(r.request_id==='timeout')throw Error('STUDIO_UNAVAILABLE');
  return allowed.has(r.request_id);
 };
 const permitted=currentStudioSpeechApproval(authority);
 assert.equal(await permitted({request_id:'job-one'}),false);
 allowed.add('job-one');
 assert.equal(await permitted({request_id:'job-one'}),true);
 assert.equal(await permitted({request_id:'job-two'}),false);
 allowed.add('job-two');
 assert.equal(await permitted({request_id:'job-two'}),true);
 allowed.delete('job-one'); // Human rights revoked at Studio.
 assert.equal(await permitted({request_id:'job-one'}),false);
 assert.equal(await permitted({request_id:'job-two'}),true);
 assert.equal(await permitted({request_id:'timeout'}),false);
 assert.equal(await currentStudioSpeechApproval(async()=>undefined)({request_id:'job-three'}),false);
 assert.throws(()=>currentStudioSpeechApproval(null),/AUTHORITY_CONFIG/);
});

function releaseCandidate(r,m){
 const v=m.sha256;
 return {contract:'cdc-coral-studio-release-intent-v1',
  creation_id:r.creation_id,creation_version:r.creation_version,
  request_id:r.request_id,binding_sha256:r.binding_sha256,
  recipe_sha256:r.recipe_sha256,recipe_slug:'amok-trey',
  candidate_public_slug:'amok-trey',candidate_workshop_slug:'atelier-pratique-amok-trey',
  candidate_audio_path:'audio/workshops/atelier-pratique-amok-trey/atelier-coral-'+v.slice(0,12)+'.mp3',
  voice:'coral',model:'gpt-4o-mini-tts',speed_milli:930,
  mp3_sha256:v,mp3_bytes:m.bytes,mp3_duration_seconds:m.duration,
  chapters:r.chapters.map((x,i)=>({id:x.id,text_sha256:x.sha256,
    startSec:i*10,endSec:(i+1)*10})),
  human_publication_consent:true,publication_ready:false,deployment_triggered:false};
}

test('private worker stages exact no-text publication consent only after completed audio',async()=>{
 const root=await mkdtemp(join(tmpdir(),'coral-stage-real-'));
 const budgetDir=await mkdtemp(join(tmpdir(),'coral-stage-budget-'));
 const r=request(),bytes=Buffer.alloc(2048,47),digest=sha(bytes);
 const m={contract:'cdc-coral-real-speech-result-v1',
  request_id:r.request_id,creation_id:r.creation_id,creation_version:r.creation_version,
  binding_sha256:r.binding_sha256,sha256:digest,bytes:bytes.length,
  file:'final-'+digest+'.mp3',duration:70,
  chapters:r.chapters.map((x,i)=>({id:x.id,start:i*10,end:(i+1)*10}))};
 let authority=true;
 const jobs=createCoralRealSpeechJobs({budgetDir,authorize:async()=>authority,
  spendingApproved:async()=>true,externalProjectBudgetVerified:async()=>true});
 try{
  const dir=join(root,'real-tts');await mkdir(dir,{mode:0o700});
  const proposal=releaseCandidate(r,m);
  await assert.rejects(jobs.stageRelease(r,r.request_id,root,proposal),/NOT_GENERATED/);
  await writeFile(join(dir,m.file),bytes,{mode:0o600});
  await writeFile(join(dir,'manifest.json'),JSON.stringify(m),{mode:0o600});
  await writeFile(join(dir,'state.json'),JSON.stringify({
   status:'succeeded',completed_chapters:7,manifest_sha256:digest}),{mode:0o600});
  const first=await jobs.stageRelease(r,r.request_id,root,proposal);
  assert.equal(first.release_staged,true);
  const second=await jobs.stageRelease(r,r.request_id,root,proposal);
  assert.equal(second.release_staged,true,'idempotent same intent');
  const saved=JSON.parse(await readFile(join(dir,'release-intent.json'),'utf8'));
  assert.equal(saved.mp3_sha256,digest);
  assert.ok(!JSON.stringify(saved).includes(r.chapters[0].text),'no private narrations in release');

  const privateSource={id:r.creation_id,version:r.creation_version,
   kind:'atelier',slug:'amok-trey',title:'Atelier cuisine khmère de démonstration',
   atelier_reference:{recipeSlug:'amok-trey'},
   atelier_scripts:{chapters:r.chapters.map((ch,index)=>({id:ch.id,index,text:ch.text}))}};
  const review={contract:'cdc-coral-studio-reviewed-blueprint-v1',
   creationId:r.creation_id,creationVersion:r.creation_version,
   requestId:r.request_id,bindingSha256:r.binding_sha256,
   visualSha256:'e'.repeat(64),media:{imageValidated:true,rightsValidated:true},
   review:{recipeValidated:true,editorialValidated:true,audioListeningValidated:true,
    mobileValidated:true,desktopValidated:true,productionApproved:true}};
  const webp=Buffer.from('524946461000000057454250565038580000000000000000','hex');
  const assetHash=createHash('sha256').update(webp).digest('hex');
  review.privateVisualVersion=3;
  review.visualSha256=assetHash;
  review.media.finishedPreparationImage='/images/cuisine/coral-'+r.creation_id+'-'+assetHash+'.webp';
  const packet={contract:'cdc-coral-studio-private-build-inputs-v1',
   intent:proposal,source:privateSource,profile:review,visual:webp.toString('base64')};
  await assert.rejects(jobs.stageBuildInputs(r,r.request_id,root,{
   ...packet,visual:'c2NyYW1ibGVk'}),/PRIVATE_VISUAL_SHA/);
  const staged=await jobs.stageBuildInputs(r,r.request_id,root,packet);
  assert.equal(staged.build_inputs_staged,true);
  assert.equal((await jobs.stageBuildInputs(r,r.request_id,root,packet)).build_inputs_staged,true,
   'identical approved private inputs replay safely');
  const held=JSON.parse(await readFile(join(dir,'private-build-inputs.json'),'utf8'));
  assert.equal(held.source.atelier_scripts.chapters[0].text,r.chapters[0].text);
  await assert.rejects(jobs.stageBuildInputs(r,r.request_id,root,{
   ...packet,source:{...privateSource,atelier_scripts:{chapters:privateSource.atelier_scripts.chapters.map(
    (ch,i)=>i===0?{...ch,text:'modified narration'}:ch)}}}),/BUILD_INPUTS_NARRATION/);
  await assert.rejects(jobs.stageBuildInputs(r,r.request_id,root,{
   ...packet,profile:{...review,privateVisualVersion:4}}),/BUILD_INPUTS_CONFLICT/);

  await assert.rejects(jobs.stageRelease(r,r.request_id,root,{
   ...proposal,candidate_public_slug:'other',candidate_workshop_slug:'atelier-pratique-other',
   candidate_audio_path:'audio/workshops/atelier-pratique-other/atelier-coral-'+digest.slice(0,12)+'.mp3'
  }),/RELEASE_CONFLICT/);
  authority=false;
  await assert.rejects(jobs.stageRelease(r,r.request_id,root,proposal),/STUDIO_AUTHORITY/);
 }finally{await rm(root,{recursive:true,force:true});await rm(budgetDir,{recursive:true,force:true});}
});

test('existing job HTTPS gateway accepts only authenticated POST release staging',async()=>{
 const root=await mkdtemp(join(tmpdir(),'coral-stage-gateway-'));
 const r=request();let calls=0;
 const runner={
  state:async(q,id)=>({id,status:'succeeded',completed_chapters:7}),
  run:async(q,id)=>({id,status:'succeeded'}),
  stageBuildInputs:async(q,id,folder,payload)=>{
    assert.equal(id,r.request_id);
    assert.equal(payload.contract,'cdc-coral-studio-private-build-inputs-v1');
    calls++;return {id,status:'succeeded',build_inputs_staged:true};
  },
  stageRelease:async(q,id,folder,payload)=>{
    assert.equal(id,r.request_id);assert.equal(payload.contract,'cdc-coral-studio-release-intent-v1');
    calls++;return {id,status:'succeeded',release_staged:true};
  }
 };
 const g=await createJobGateway({root,token,provider:async()=>'',realTtsJobs:runner});
 await new Promise(resolve=>g.server.listen(0,'127.0.0.1',resolve));
 try{
  await g.submit(r.request_id,r);
  const endpoint='http://127.0.0.1:'+g.server.address().port+
    '/editorial-ai/v1/jobs/'+r.request_id+'/release';
  const payload={contract:'cdc-coral-studio-release-intent-v1'};
  const denied=await fetch(endpoint,{method:'POST',body:JSON.stringify(payload)});
  assert.equal(denied.status,401);
  const wrong=await fetch(endpoint,{method:'GET',headers:{Authorization:'Bearer '+token}});
  assert.equal(wrong.status,404);
  const accepted=await fetch(endpoint,{method:'POST',headers:{
   Authorization:'Bearer '+token,'Content-Type':'application/json'
  },body:JSON.stringify(payload)});
  assert.equal(accepted.status,202);
  assert.equal((await accepted.json()).release_staged,true);
  assert.equal(calls,1);
  const secretPacket={contract:'cdc-coral-studio-private-build-inputs-v1',
   source:{kind:'atelier'},profile:{review:true},intent:{request_id:r.request_id}};
  const privateEndpoint=endpoint.slice(0,-'/release'.length)+'/build-inputs';
  assert.equal((await fetch(privateEndpoint,{method:'POST',
   body:JSON.stringify(secretPacket)})).status,401);
  assert.equal((await fetch(privateEndpoint,{method:'GET',headers:{
   Authorization:'Bearer '+token}})).status,404);
  const stage=await fetch(privateEndpoint,{method:'POST',headers:{
   Authorization:'Bearer '+token,'Content-Type':'application/json'
  },body:JSON.stringify(secretPacket)});
  assert.equal(stage.status,202);
  assert.equal((await stage.json()).build_inputs_staged,true);
  assert.equal(calls,2);
 }finally{
  g.stopWorker();await new Promise(resolve=>g.server.close(resolve));
  await rm(root,{recursive:true,force:true});
 }
});


test('actual Coral runtime stages already-finished private audio with paid TTS OFF',async()=>{
 const root=await mkdtemp(join(tmpdir(),'coral-runtime-stage-no-pay-'));
 const r=request(),bytes=Buffer.alloc(2048,47),digest=sha(bytes);
 const folder=join(root,r.request_id),privateDir=join(folder,'real-tts');
 const m={contract:'cdc-coral-real-speech-result-v1',
  request_id:r.request_id,creation_id:r.creation_id,creation_version:r.creation_version,
  binding_sha256:r.binding_sha256,sha256:digest,bytes:bytes.length,
  file:'final-'+digest+'.mp3',duration:70,
  chapters:r.chapters.map((x,i)=>({id:x.id,start:i*10,end:(i+1)*10}))};
 let allowed=true,authorityCalls=0;
 const env={
  CDC_EDITORIAL_JOB_SERVICE_ENABLED:'true',CDC_EDITORIAL_JOB_DIR:root,
  CDC_EDITORIAL_JOB_BIND_HOST:'127.0.0.1',CDC_EDITORIAL_JOB_TOKEN:token,
  CDC_EDITORIAL_JOB_PROVIDER:'ollama',
  CDC_CORAL_REAL_TTS_ENABLED:'false',CDC_CORAL_RELEASE_STAGING_ENABLED:'true',
  CDC_CORAL_REAL_TTS_AUTHORITY_ENDPOINT:'https://www.cuisine-du-cambodge.com/gestion-contenus/?tts_authority=1',
  CDC_CORAL_REAL_TTS_AUTHORITY_TOKEN_FILE:'/private/never-read-in-isolated-test'
 };
 await mkdir(privateDir,{recursive:true,mode:0o700});
 await writeFile(join(folder,'request.json'),JSON.stringify({
  id:r.request_id,fingerprint:sha(JSON.stringify(r)),created_at:Date.now(),request:r
 }),{mode:0o600});
 await writeFile(join(privateDir,m.file),bytes,{mode:0o600});
 await writeFile(join(privateDir,'manifest.json'),JSON.stringify(m),{mode:0o600});
 await writeFile(join(privateDir,'state.json'),JSON.stringify({
  status:'succeeded',completed_chapters:7,manifest_sha256:digest
 }),{mode:0o600});
 const gateway=await startEditorialJobRuntime(env,{
  listenPort:0,authorityFactory:()=>async()=>{authorityCalls++;return allowed;}
 });
 try{
  const base='http://127.0.0.1:'+gateway.server.address().port+
   '/editorial-ai/v1/jobs/'+r.request_id;
  const headers={Authorization:'Bearer '+token,'Content-Type':'application/json'};
  const candidate=releaseCandidate(r,m);
  const denied=await fetch(base+'/release',{method:'POST',body:JSON.stringify(candidate)});
  assert.equal(denied.status,401,'staging is never public');
  const get=await fetch(base,{headers});assert.equal(get.status,200);
  assert.equal((await get.json()).status,'succeeded','existing completed result remains visible');
  const newPaid=await fetch(base,{method:'PUT',headers,body:JSON.stringify(r)});
  assert.equal(newPaid.status,422,'disabled paid engine rejects even duplicate submissions');
  assert.equal((await fetch(base+'/resume',{method:'POST',headers,body:'{}'})).status,422,
   'disabled paid engine cannot resume synthesis');
  const first=await fetch(base+'/release',{method:'POST',headers,body:JSON.stringify(candidate)});
  assert.equal(first.status,202);
  assert.equal((await first.json()).release_staged,true);
  assert.equal((await fetch(base+'/release',{method:'POST',headers,body:JSON.stringify(candidate)})).status,202,
   'idempotent approved release intent');
  const review={contract:'cdc-coral-studio-reviewed-blueprint-v1',
   creationId:r.creation_id,creationVersion:r.creation_version,requestId:r.request_id,
   bindingSha256:r.binding_sha256,media:{imageValidated:true,rightsValidated:true},
   review:{recipeValidated:true,editorialValidated:true,audioListeningValidated:true,
    mobileValidated:true,desktopValidated:true,productionApproved:true}};
  const webp=Buffer.from('524946461000000057454250565038580000000000000000','hex');
  const assetHash=sha(webp);
  review.visualSha256=assetHash;review.privateVisualVersion=3;
  review.media.finishedPreparationImage='/images/cuisine/coral-'+r.creation_id+'-'+assetHash+'.webp';
  const packet={contract:'cdc-coral-studio-private-build-inputs-v1',intent:candidate,
   source:{id:r.creation_id,version:r.creation_version,kind:'atelier',
    slug:'amok-trey',title:'Atelier cuisine khmère de démonstration',
    atelier_reference:{recipeSlug:'amok-trey'},
    atelier_scripts:{chapters:r.chapters.map((ch,index)=>({id:ch.id,index,text:ch.text}))}},
   profile:review,visual:webp.toString('base64')};
  assert.equal((await fetch(base+'/build-inputs',{
   method:'POST',body:JSON.stringify(packet)})).status,401);
  const accepted=await fetch(base+'/build-inputs',{method:'POST',headers,body:JSON.stringify(packet)});
  assert.equal(accepted.status,202);
  assert.equal((await accepted.json()).build_inputs_staged,true);
  assert.ok(authorityCalls>=4,'live, revocable authority checked for every staging operation');
  assert.equal((await readFile(join(privateDir,'release-intent.json'),'utf8')).includes(r.chapters[0].text),
   false,'no private narration is leaked to the release intent');
  allowed=false;
  assert.equal((await fetch(base+'/release',{method:'POST',headers,
   body:JSON.stringify(candidate)})).status,422,'revoked authority blocks even an idempotent replay');
  assert.equal((await fetch(base+'/build-inputs',{method:'POST',headers,
   body:JSON.stringify(packet)})).status,422,'revoked authority blocks private build input replay');
  assert.equal((await readdir(privateDir)).filter(x=>x.endsWith('.attempt.json')).length,0,
   'no paid synthesis attempt created');
 }finally{
  gateway.stopWorker();
  await new Promise(resolve=>gateway.server.close(resolve));
  await rm(root,{recursive:true,force:true});
 }
});

test('actual Coral runtime keeps private staging OFF by default',async()=>{
 const root=await mkdtemp(join(tmpdir(),'coral-runtime-stage-default-off-'));
 const r=request(),folder=join(root,r.request_id);
 await mkdir(folder,{mode:0o700});
 await writeFile(join(folder,'request.json'),JSON.stringify({
  id:r.request_id,fingerprint:sha(JSON.stringify(r)),created_at:Date.now(),request:r
 }),{mode:0o600});
 const env={CDC_EDITORIAL_JOB_SERVICE_ENABLED:'true',CDC_EDITORIAL_JOB_DIR:root,
  CDC_EDITORIAL_JOB_TOKEN:token,CDC_EDITORIAL_JOB_BIND_HOST:'127.0.0.1',
  CDC_CORAL_REAL_TTS_ENABLED:'false'};
 const gateway=await startEditorialJobRuntime(env,{listenPort:0});
 try{
  const base='http://127.0.0.1:'+gateway.server.address().port+
   '/editorial-ai/v1/jobs/'+r.request_id;
  const denied=await fetch(base+'/release',{method:'POST',headers:{
   Authorization:'Bearer '+token,'Content-Type':'application/json'
  },body:'{}'});
  assert.equal(denied.status,422,'no staging without explicit operator opt-in');
 }finally{
  gateway.stopWorker();
  await new Promise(resolve=>gateway.server.close(resolve));
  await rm(root,{recursive:true,force:true});
 }
});
