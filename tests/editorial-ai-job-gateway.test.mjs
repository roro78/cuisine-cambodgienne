import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile,mkdir,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createJobGateway,ollamaJobProvider,routeEditorialJobProviders} from '../scripts/editorial-ai-job-gateway.mjs';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {readFile} from 'node:fs/promises';
const token='synthetic-test-token-'.repeat(3),id='a'.repeat(48);
const request={contract:'cdc-editorial-ai-content-request-v1',scope:'creation-form-core-v1',brief:{kind:'culture',title:'Essai privé'},
  response_schema:{type:'object',additionalProperties:false,properties:{fields:{type:'object'}}},timeout_seconds:20,max_output_tokens:6000,response_max_bytes:30000};
async function fixture(t,provider){
  const root=await mkdtemp(join(tmpdir(),'cdc-job-test-'));t.after(()=>rm(root,{recursive:true,force:true}));
  const gateway=await createJobGateway({root,token,provider});return {root,gateway};
}
test('repeated submit, refresh and restart keep one durable generation',async t=>{
  let calls=0;const {root,gateway}=await fixture(t,async()=>{calls++;return '{"private":"candidate"}';});
  assert.equal((await gateway.submit(id,request)).status,'queued');
  await gateway.submit(id,request);await gateway.state(id);assert.equal(calls,0,'GET cannot generate');
  await Promise.all([gateway.workOnce(),gateway.workOnce()]);assert.equal(calls,1);
  assert.equal((await gateway.state(id)).status,'succeeded');
  const restarted=await createJobGateway({root,token,provider:async()=>{calls++;return 'unexpected';}});
  await restarted.submit(id,request);await restarted.workOnce();assert.equal(calls,1);
  await assert.rejects(gateway.submit(id,{...request,brief:{...request.brief,title:'Changed'}}),/JOB_CONFLICT/);
});
test('provider failure and interrupted jobs are consumed without retry',async t=>{
  let calls=0;const {root,gateway}=await fixture(t,async()=>{calls++;throw Error('PRIVATE_PROVIDER_ERROR');});
  await gateway.submit(id,request);await gateway.workOnce();await gateway.workOnce();
  assert.deepEqual(await gateway.state(id),{id,status:'failed'});assert.equal(calls,1);
  const abandoned='b'.repeat(48);await gateway.submit(abandoned,request);
  await writeFile(join(root,abandoned,'started.json'),'{}',{mode:0o600});
  assert.equal((await gateway.state(abandoned)).status,'failed');await gateway.workOnce();assert.equal(calls,1);
});
test('queued tasks survive restart and expired tasks never start',async t=>{
  let calls=0;const {root,gateway}=await fixture(t,async()=>{calls++;return '{}';});
  await gateway.submit(id,request);
  const restarted=await createJobGateway({root,token,provider:async()=>{calls++;return '{}';}});
  assert.equal((await restarted.state(id)).status,'queued');await restarted.workOnce();assert.equal(calls,1);
  const expired='d'.repeat(48);await restarted.submit(expired,request);
  const file=join(root,expired,'request.json');const saved=JSON.parse(await readFile(file,'utf8'));
  saved.created_at=Date.now()-1800001;await writeFile(file,JSON.stringify(saved),{mode:0o600});
  assert.equal((await restarted.state(expired)).status,'failed');await restarted.workOnce();assert.equal(calls,1);
});
test('two workers on one queue claim a task once',async t=>{
  let calls=0;const {root,gateway}=await fixture(t,async()=>{calls++;await new Promise(r=>setTimeout(r,20));return '{}';});
  const second=await createJobGateway({root,token,provider:async()=>{calls++;return '{}';}});
  await gateway.submit(id,request);await Promise.all([gateway.workOnce(),second.workOnce()]);assert.equal(calls,1);
});
test('killed provider process restarts as failed without another model call',{timeout:30000},async t=>{
  const root=await mkdtemp(join(tmpdir(),'cdc-job-restart-'));t.after(()=>rm(root,{recursive:true,force:true}));
  await writeFile(join(root,'request.json'),JSON.stringify(request),{mode:0o600});
  const script=fileURLToPath(new URL('./fixtures/editorial-ai-job-process.mjs',import.meta.url));
  const first=spawn(process.execPath,[script,'interrupt',root],{stdio:['ignore','pipe','pipe']});
  t.after(()=>first.kill());let output='';
  const exited=new Promise(r=>first.once('exit',r));
  await new Promise((resolve,reject)=>{
    first.once('error',reject);first.once('exit',()=>reject(Error('FIXTURE_EXITED_BEFORE_CALL')));
    first.stdout.on('data',b=>{output+=b;if(output.includes('MODEL_STARTED'))resolve();});
  });
  first.kill();await exited;
  const second=spawn(process.execPath,[script,'restart',root],{stdio:['ignore','pipe','pipe']});let result='';
  second.stdout.on('data',b=>{result+=b;});
  await new Promise((resolve,reject)=>{second.once('error',reject);second.once('exit',code=>code===0?resolve():reject(Error('RESTART_FAILED')));});
  assert.deepEqual(JSON.parse(result),{id:'c'.repeat(48),status:'failed'});
  assert.equal(await readFile(join(root,'calls.txt'),'utf8'),'x');
});
test('a substituted job directory is rejected before reading its files',{skip:process.platform==='win32'},async t=>{
  const {root,gateway}=await fixture(t,async()=>{throw Error('UNEXPECTED_PROVIDER');});
  await mkdir(join(root,'outside'),{mode:0o700});await symlink(join(root,'outside'),join(root,id));
  await assert.rejects(gateway.state(id),/JOB_STORE/);
});
test('HTTP requires bearer, fixed route and valid contract, and never starts generation',async t=>{
  let calls=0;const {gateway}=await fixture(t,async()=>{calls++;return '{}';});
  await new Promise(r=>gateway.server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>gateway.server.close(r)));
  const url='http://127.0.0.1:'+gateway.server.address().port+'/editorial-ai/v1/jobs/'+id;
  assert.equal((await fetch(url)).status,401);
  const headers={authorization:'Bearer '+token,'content-type':'application/json'};
  assert.equal((await fetch(url,{method:'PUT',headers,body:JSON.stringify(request)})).status,202);
  assert.equal((await fetch(url,{headers})).status,200);assert.equal(calls,0);
  assert.equal((await fetch(url+'?generate=1',{headers})).status,404);
  const invalid={...request,timeout_seconds:120};
  assert.equal((await fetch(url,{method:'PUT',headers,body:JSON.stringify(invalid)})).status,422);
});
test('Ollama stays internal, bounded, and rejects truncated or oversized output',async()=>{
  assert.throws(()=>ollamaJobProvider({url:'https://example.com'}),/CONFIG/);
  let options;
  const provider=ollamaJobProvider({fetcher:async(url,o)=>{assert.equal(url,'http://ollama:11434/api/chat');options=o;
    return new Response(JSON.stringify({done:true,message:{content:'{}'}}));}});
  assert.equal(await provider(request),'{}');assert.equal(JSON.parse(options.body).options.num_predict,6000);
  assert.equal(request.timeout_seconds,20,'synchronous contract is unchanged');
  const bad=ollamaJobProvider({fetcher:async()=>new Response(JSON.stringify({done:true,done_reason:'length',message:{content:'{}'}}))});
  await assert.rejects(bad(request),/JOB_RESPONSE/);
});

test('external Coral and all five C2 families succeed in the same durable queue',async t=>{
  const calls=[];
  const provider=routeEditorialJobProviders({
    editorialProvider:async(r,id)=>{calls.push(['ollama',r.brief.kind,id]);return '{}';},
    coralProvider:async(r,id)=>{calls.push(['external',r.contract,id]);return '{"chapters":[]}';}
  });
  const {gateway}=await fixture(t,provider);
  const kinds=['recette','atelier','culture','ingredient','technique'];
  for(const [i,kind] of kinds.entries()){
    const key=String(i+1).repeat(48);
    const r={...request,brief:{...request.brief,kind},
      reference:{fingerprint:'f'.repeat(64),recipe_fields:{ingredients:[{name:'riz'}]}}};
    await gateway.submit(key,r);await gateway.workOnce();
    assert.equal((await gateway.state(key)).status,'succeeded');
  }
  const text='Contrat lexical bloquant';
  const doc={text,sha256:createHash('sha256').update(text).digest('hex')};
  const coral={contract:'cdc-coral-v2-script-request-v1',scope:'workshop-seven-spoken-scripts-v1',
    creation_id:'c-'+'a'.repeat(24),creation_version:1,
    binding_digest:'b'.repeat(64),canonical_fingerprint:'c'.repeat(64),
    atelier:{phases:Array.from({length:6},()=>({}))},
    reference:{recipe_fields:{ingredients:[{name:'riz'}],steps:['Cuire']}},
    referentials:{structure:doc,narration:doc},
    response_schema:{type:'object',additionalProperties:false,
      properties:{chapters:{minItems:7,maxItems:7}}},
    timeout_seconds:20,max_output_tokens:6000,response_max_bytes:30000};
  const coralId='6'.repeat(48);
  await gateway.submit(coralId,coral);await gateway.workOnce();
  assert.equal((await gateway.state(coralId)).status,'succeeded');
  assert.deepEqual(calls.slice(0,5).map(c=>c.slice(0,2)),kinds.map(k=>['ollama',k]));
  assert.deepEqual(calls[5],['external',coral.contract,coralId]);
  await gateway.workOnce();assert.equal(calls.length,6,'no duplicate dispatch');
  await assert.rejects(provider({...coral,scope:'invalid'},coralId),/JOB_CORAL_V2_REQUEST/);
  assert.equal(calls.length,6,'invalid requests never reach a provider');
  let fallbacks=0;
  const failing=routeEditorialJobProviders({
    editorialProvider:async()=>{fallbacks++;return '{}';},
    coralProvider:async()=>{throw Error('EXTERNAL_FAILURE');}
  });
  await assert.rejects(failing(coral,coralId),/EXTERNAL_FAILURE/);
  assert.equal(fallbacks,0,'external errors must not silently trigger another model');
});

