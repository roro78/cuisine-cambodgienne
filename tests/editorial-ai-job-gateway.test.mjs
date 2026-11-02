import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile,mkdir,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createJobGateway,ollamaJobProvider} from '../scripts/editorial-ai-job-gateway.mjs';
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
test('two workers on one queue claim a task once',async t=>{
  let calls=0;const {root,gateway}=await fixture(t,async()=>{calls++;await new Promise(r=>setTimeout(r,20));return '{}';});
  const second=await createJobGateway({root,token,provider:async()=>{calls++;return '{}';}});
  await gateway.submit(id,request);await Promise.all([gateway.workOnce(),second.workOnce()]);assert.equal(calls,1);
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
