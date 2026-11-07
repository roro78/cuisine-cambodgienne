import test from 'node:test';import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';import {mkdtemp,readFile,readdir,rm,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {join} from 'node:path';
import {produceCompleteWorkshop,validateCompleteWorkshopRequest,validateWorkshopPhases,normalizeWorkshopPhaseProfile} from '../scripts/coral-workshop-contract.mjs';
import {createHash} from 'node:crypto';
import {createExternalCoralJobProvider} from '../scripts/coral-external-job-provider.mjs';
import {ollamaJobProvider,validateJobRequest,routeEditorialJobProviders} from '../scripts/editorial-ai-job-gateway.mjs';
import {backupCoralState,restoreCoralState} from '../scripts/coral-state-backup.mjs';
const f=JSON.parse(execFileSync(process.env.CDC_TEST_PHP||'php',['tests/php/fixtures/editorial-workshop-proposal.php','dist'],{encoding:'utf8',maxBuffer:300000}));
const clone=x=>structuredClone(x);
const hash=x=>createHash('sha256').update(x).digest('hex');
test('reported total is derived without changing phase estimates, and allergen spelling keeps its meaning',()=>{
 const phase=clone(f.phase);phase.profile.allergens=['Poisson','Œufs'];phase.profile.practicalMinutes=55;
 phase.phase_details.forEach((p,i)=>p.minutes=[5,10,7,8,25,3][i]);
 const before=JSON.stringify(phase),normalized=normalizeWorkshopPhaseProfile(f.request,phase);
 assert.equal(normalized.phase.profile.practicalMinutes,58);assert.equal(JSON.stringify(phase),before);
 assert.deepEqual(normalized.phase.phase_details,phase.phase_details);assert.deepEqual(normalized.phase.profile.allergens,['Poisson','Œufs']);
 assert.deepEqual(normalized.changes,[{field:'profile.practicalMinutes',reported:55,derived:58,reason:'sum_of_six_phase_estimates'}]);
 const missing=clone(phase);missing.profile.allergens=['Poisson'];
 assert.throws(()=>normalizeWorkshopPhaseProfile(f.request,missing),/JOB_WORKSHOP_PROFILE/);
});
test('one complete typed proposal uses the shared phase IDs and seven spoken chapters, without human approval',async()=>{
 assert.equal(validateJobRequest(f.request),f.request);let calls=0;
 const result=JSON.parse(await produceCompleteWorkshop(f.request,{
  phaseCall:async()=>{calls++;return JSON.stringify(f.phase);},
  chapterCall:async({index})=>{calls++;return JSON.stringify(f.chapters[index]);}}));
 assert.equal(calls,8);assert.equal(result.phase_details.length,6);assert.equal(result.chapters.length,7);
 assert.equal(result.reviewed,undefined);assert.equal(result.audio,undefined);
 const changed=clone(f.request);changed.referentials.structure.sha256='0'.repeat(64);
 assert.throws(()=>validateCompleteWorkshopRequest(changed),/JOB_WORKSHOP_REQUEST/);
 const bad=clone(f.phase);bad.phase_details[2].ingredientNames=['Invented ingredient'];
 assert.throws(()=>validateWorkshopPhases(f.request,bad),/JOB_WORKSHOP_INGREDIENTS/);
 const reordered=clone(f.phase);reordered.phase_details.reverse();
 assert.throws(()=>validateWorkshopPhases(f.request,reordered),/JOB_WORKSHOP_INGREDIENTS/);
 const duration=clone(f.phase);duration.profile.practicalMinutes++;
 assert.throws(()=>validateWorkshopPhases(f.request,duration),/JOB_WORKSHOP_PROFILE/);
 const allergens=clone(f.phase);allergens.profile.allergens=['poisson'];
 assert.throws(()=>validateWorkshopPhases(f.request,allergens),/JOB_WORKSHOP_PROFILE/);
});
test('the existing Ollama provider supports the same complete contract with synthetic responses only',async()=>{
 let calls=0;const provider=ollamaJobProvider({fetcher:async(_url,options)=>{
  calls++;const b=JSON.parse(options.body);assert.equal(JSON.stringify(b).includes('PRIVATE_DRAFT_NOTE_DO_NOT_TRANSMIT'),false);
  const answer=b.format.properties.phase_details?f.phase:f.chapters.find(c=>c.id===b.format.properties.id.enum[0]);
  return new Response(JSON.stringify({done:true,done_reason:'stop',message:{content:JSON.stringify(answer)}}));
 }});
 assert.equal(JSON.parse(await provider(f.request)).chapters.length,7);assert.equal(calls,8);
 await assert.rejects(()=>provider({...clone(f.request),continuation:{source_job_id:'a'.repeat(48),phase_output_sha256:'b'.repeat(64)}}),/CONTINUATION_PROVIDER/);
 assert.equal(calls,8);
 let routed=0;const route=routeEditorialJobProviders({editorialProvider:async()=>{throw Error('WRONG');},coralProvider:async()=>{routed++;return 'synthetic';}});
 assert.equal(await route(f.request,'a'.repeat(48)),'synthetic');assert.equal(routed,1);
});
test('paid transport preparation reserves all eight calls, saves counters/output receipts and never replays',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'cdc-complete-budget-'));let calls=0;
 try{
  const state=join(dir,'state'),budget=join(state,'budget');await mkdir(state,{mode:0o700});await mkdir(join(state,'jobs'),{mode:0o700});
  const provider=createExternalCoralJobProvider({apiKey:'sk-synthetic-key-never-real-123456789',model:'gpt-6-luna',budgetDir:budget,maxMonthlyUsd:.75,
   fetcher:async(_url,options)=>{
    const b=JSON.parse(options.body);calls++;
    assert.equal((await readdir(budget)).some(n=>/^budget-.*\.json$/.test(n)),true);
    assert.equal(JSON.stringify(b).includes('PRIVATE_DRAFT_NOTE_DO_NOT_TRANSMIT'),false);
    const answer=b.text.format.schema.properties.phase_details?f.phase:f.chapters.find(c=>c.id===b.text.format.schema.properties.id.enum[0]);
    return new Response(JSON.stringify({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(answer)}]}],usage:{input_tokens:1000,output_tokens:500}}));
   }});
  const id='a'.repeat(48),result=JSON.parse(await provider(f.request,id));assert.equal(result.chapters.length,7);assert.equal(calls,8);
  const files=await readdir(join(budget,'receipts',id));assert.equal(files.filter(n=>n.endsWith('.receipt.json')).length,8);
  const receipt=JSON.parse(await readFile(join(budget,'receipts',id,'intro.receipt.json'),'utf8'));assert.equal(receipt.input_tokens,1000);
  const content=(await Promise.all(files.map(n=>readFile(join(budget,'receipts',id,n),'utf8')))).join('');
  assert.equal(content.includes('sk-synthetic'),false);
  await assert.rejects(()=>provider(f.request,id),/ALREADY_RESERVED/);assert.equal(calls,8);
  const key=join(dir,'synthetic.key'),archive=join(dir,'synthetic.enc'),restored=join(dir,'restored');
  await writeFile(key,'1'.repeat(64),{mode:0o400});
  await backupCoralState({stateDir:state,archive,keyFile:key,offline:true});
  await restoreCoralState({stateDir:restored,archive,keyFile:key,offline:true});
  for(const name of files)assert.deepEqual(await readFile(join(restored,'budget','receipts',id,name)),await readFile(join(budget,'receipts',id,name)));
  assert.equal(JSON.parse(await readFile(join(restored,'jobs','.restore-review-required'),'utf8')).reviewRequired,true);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('an invalid first model output stops before the seven further calls and keeps its reservation',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'cdc-complete-failed-'));let calls=0;
 try{
  const provider=createExternalCoralJobProvider({apiKey:'sk-synthetic-key-never-real-123456789',model:'gpt-6-luna',budgetDir:dir,
   fetcher:async()=>{calls++;return new Response(JSON.stringify({status:'completed',output:[{type:'message',content:[{type:'output_text',text:'{}'}]}],usage:{input_tokens:1000,output_tokens:500}}));}});
  await assert.rejects(()=>provider(f.request,'b'.repeat(48)),/JOB_WORKSHOP_RESPONSE/);assert.equal(calls,1);
  await assert.rejects(()=>provider(f.request,'b'.repeat(48)),/ALREADY_RESERVED/);assert.equal(calls,1);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('authority revocation stops further calls and the monthly cap stops before any call',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'cdc-complete-authority-'));let calls=0,allowed=true;
 try{
  const options={apiKey:'sk-synthetic-key-never-real-123456789',model:'gpt-6-luna',budgetDir:dir,
   authorize:async()=>allowed,fetcher:async()=>{calls++;allowed=false;return new Response(JSON.stringify({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(f.phase)}]}],usage:{input_tokens:1000,output_tokens:500}}));}};
  await assert.rejects(()=>createExternalCoralJobProvider(options)(f.request,'c'.repeat(48)),/AUTHORITY/);assert.equal(calls,1);
  allowed=true;await assert.rejects(()=>createExternalCoralJobProvider({...options,maxMonthlyUsd:.001})(f.request,'d'.repeat(48)),/MONTHLY_LIMIT/);assert.equal(calls,1);
 }finally{await rm(dir,{recursive:true,force:true});}
});

async function continuationFixture(dir){
 const jobs=join(dir,'jobs'),budget=join(dir,'budget'),sourceId='e'.repeat(48),folder=join(jobs,sourceId),receipt=join(budget,'receipts',sourceId);
 await mkdir(folder,{recursive:true,mode:0o700});await mkdir(receipt,{recursive:true,mode:0o700});
 const phase=clone(f.phase);phase.profile.allergens=['Poisson','Œufs'];phase.profile.practicalMinutes=55;
 phase.phase_details.forEach((p,i)=>p.minutes=[5,10,7,8,25,3][i]);const raw=JSON.stringify(phase);
 const put=(path,value)=>writeFile(path,typeof value==='string'?value:JSON.stringify(value),{mode:0o600});
 await put(join(folder,'request.json'),{request:f.request});await put(join(folder,'terminal.json'),{status:'failed'});
 await put(join(receipt,'phases.output.json'),raw);
 await put(join(receipt,'phases.attempt.json'),{job_id:sourceId,model:'gpt-6-luna',segment:'phases',input_sha256:'a'.repeat(64)});
 await put(join(receipt,'phases.receipt.json'),{job_id:sourceId,model:'gpt-6-luna',segment:'phases',input_tokens:1000,output_tokens:500,cost_microusd:350,output_sha256:hash(raw)});
 const day=new Date().toISOString().slice(0,10),ledger=join(budget,'budget-'+day+'.json');
 await put(ledger,{contract:'cdc-coral-daily-reservations-v1',day,requests:[{jobId:sourceId,model:'gpt-6-luna',reservedUsd:.06530007,state:'unknown-after-reservation'}]});
 return {jobs,budget,sourceId,receipt,folder,ledger,raw,request:{...clone(f.request),continuation:{source_job_id:sourceId,phase_output_sha256:hash(raw)}},put};
}

test('explicit continuation reuses one paid phase, reserves seven calls and exclusively claims its source',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'cdc-complete-continue-'));let calls=0;
 try{
  const c=await continuationFixture(dir),original=await readFile(join(c.receipt,'phases.output.json'));
  const provider=createExternalCoralJobProvider({apiKey:'sk-synthetic-key-never-real-123456789',model:'gpt-6-luna',budgetDir:c.budget,jobDir:c.jobs,maxMonthlyUsd:.75,
   fetcher:async(_url,options)=>{
    calls++;const b=JSON.parse(options.body);assert.equal(b.text.format.schema.properties.phase_details,undefined);
    const answer=f.chapters.find(x=>x.id===b.text.format.schema.properties.id.enum[0]);
    return new Response(JSON.stringify({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(answer)}]}],usage:{input_tokens:1000,output_tokens:500}}));
   }});
  const result=JSON.parse(await provider(c.request,'f'.repeat(48)));
  assert.equal(calls,7);assert.equal(result.profile.practicalMinutes,58);assert.equal(result.chapters.length,7);
  assert.deepEqual(await readFile(join(c.receipt,'phases.output.json')),original);
  const ledger=JSON.parse(await readFile(c.ledger,'utf8'));assert.equal(ledger.requests.length,2);
  assert.equal(ledger.requests[0].reservedUsd,.06530007);assert.ok(ledger.requests[1].reservedUsd<.056);
  const projection=JSON.parse(await readFile(join(c.budget,'receipts','f'.repeat(48),'phase-projection.json'),'utf8'));
  assert.equal(projection.phase_provider_called,false);assert.equal(projection.source_output_sha256,hash(c.raw));
  await assert.rejects(()=>provider(c.request,'f'.repeat(48)),/ALREADY_RESERVED|CONTINUATION_ALREADY_CLAIMED/);assert.equal(calls,7);
  await assert.rejects(()=>provider(c.request,'a'.repeat(48)),/CONTINUATION_ALREADY_CLAIMED/);assert.equal(calls,7);
  assert.equal(JSON.parse(await readFile(c.ledger,'utf8')).requests.length,2);
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('uncertain later calls, stale source, hash mismatch or missing reservation forbid checkpoint reuse',async()=>{
 for(const change of ['later','source','hash','budget','projection']){
  const dir=await mkdtemp(join(tmpdir(),'cdc-complete-uncertain-'));let calls=0;
  try{
   const c=await continuationFixture(dir);
   if(change==='later')await c.put(join(c.receipt,'intro.attempt.json'),{});
   if(change==='source'){const changed=clone(f.request);changed.brief.title+=' modified';await c.put(join(c.folder,'request.json'),{request:changed});}
   if(change==='hash')c.request.continuation.phase_output_sha256='0'.repeat(64);
   if(change==='budget')await c.put(c.ledger,{contract:'cdc-coral-daily-reservations-v1',day:new Date().toISOString().slice(0,10),requests:[]});
   if(change==='projection')await c.put(join(c.receipt,'phase-projection.json'),{contract:'cdc-workshop-phase-projection-v1',source_job_id:c.sourceId,source_output_sha256:hash(c.raw),phase_provider_called:true,normalized_phase_sha256:'0'.repeat(64),changes:[]});
   const provider=createExternalCoralJobProvider({apiKey:'sk-synthetic-key-never-real-123456789',model:'gpt-6-luna',budgetDir:c.budget,jobDir:c.jobs,
    fetcher:async()=>{calls++;throw Error('NO_NETWORK_EXPECTED');}});
   await assert.rejects(()=>provider(c.request,'f'.repeat(48)),/CHECKPOINT/);assert.equal(calls,0);
  }finally{await rm(dir,{recursive:true,force:true});}
 }
});

test('continuation keeps the original reserve and refuses a monthly ceiling before any new call',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'cdc-complete-continue-cap-'));let calls=0;
 try{
  const c=await continuationFixture(dir),before=await readFile(c.ledger);
  const provider=createExternalCoralJobProvider({apiKey:'sk-synthetic-key-never-real-123456789',model:'gpt-6-luna',budgetDir:c.budget,jobDir:c.jobs,maxMonthlyUsd:.1,
   fetcher:async()=>{calls++;throw Error('NO_NETWORK_EXPECTED');}});
  await assert.rejects(()=>provider(c.request,'f'.repeat(48)),/MONTHLY_LIMIT/);assert.equal(calls,0);
  assert.deepEqual(await readFile(c.ledger),before);
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('two simultaneous continuations can consume only one set of seven calls',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'cdc-complete-continue-race-'));let calls=0;
 try{
  const c=await continuationFixture(dir);
  const projected=normalizeWorkshopPhaseProfile(c.request,JSON.parse(c.raw));
  await c.put(join(c.receipt,'phase-projection.json'),{contract:'cdc-workshop-phase-projection-v1',source_job_id:c.sourceId,
   source_output_sha256:hash(c.raw),normalized_phase_sha256:hash(JSON.stringify(projected.phase)),changes:projected.changes,phase_provider_called:true});
  const provider=createExternalCoralJobProvider({apiKey:'sk-synthetic-key-never-real-123456789',model:'gpt-6-luna',budgetDir:c.budget,jobDir:c.jobs,maxMonthlyUsd:.75,
   fetcher:async(_url,options)=>{
    calls++;const b=JSON.parse(options.body),answer=f.chapters.find(x=>x.id===b.text.format.schema.properties.id.enum[0]);
    return new Response(JSON.stringify({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(answer)}]}],usage:{input_tokens:1000,output_tokens:500}}));
   }});
  const outcomes=await Promise.allSettled([provider(c.request,'f'.repeat(48)),provider(c.request,'a'.repeat(48))]);
  assert.equal(outcomes.filter(x=>x.status==='fulfilled').length,1);assert.equal(calls,7);
  assert.equal((await readdir(join(c.budget,'continuations'))).length,1);
 }finally{await rm(dir,{recursive:true,force:true});}
});
