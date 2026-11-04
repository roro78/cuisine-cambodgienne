import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {validateJobRequest,ollamaJobProvider,createJobGateway} from '../scripts/editorial-ai-job-gateway.mjs';

const request={
  contract:'cdc-coral-v2-script-request-v1',scope:'workshop-seven-spoken-scripts-v1',
  creation_id:'c-'+'a'.repeat(24),creation_version:2,
  binding_digest:'b'.repeat(64),canonical_fingerprint:'c'.repeat(64),
  atelier:{title:'Atelier privé',fields:{intro:'Bonjour'},recipeSlug:'amok-trey',
    phases:['installer','preparer','assembler','maitriser','rectifier','terminer'].map(id=>({id,actions:['Préparer']}))},
  reference:{id:'recette:amok-trey',recipe_fields:{ingredients:[{name:'poisson'}],steps:[{title:'Cuire'}]}},
  referentials:{structure:{text:'Contrat lexical bloquant : faire cuire sans inventer',sha256:createHash('sha256').update('Contrat lexical bloquant : faire cuire sans inventer').digest('hex')},
    narration:{text:'Contrat lexical bloquant : narration immersive',sha256:createHash('sha256').update('Contrat lexical bloquant : narration immersive').digest('hex')}},
  response_schema:{type:'object',additionalProperties:false,properties:{chapters:{type:'array',minItems:7,maxItems:7}}},
  timeout_seconds:20,response_max_bytes:60000,max_output_tokens:6000
};
test('exact Coral V2 request reuses existing job gateway but never general C2 schema',()=>{
  assert.equal(validateJobRequest(request),request);
  for(const wrong of [
    {...request,scope:'free-form-prompt'},
    {...request,atelier:{...request.atelier,phases:[]}},
    {...request,referentials:null},
    {...request,referentials:{...request.referentials,structure:{...request.referentials.structure,text:'Contrat lexical bloquant MODIFIÉ'}}},
    {...request,response_max_bytes:90000},
    {...request,canonical_fingerprint:'invalid'}
  ]) assert.throws(()=>validateJobRequest(wrong),/JOB_CORAL_V2_REQUEST/);
});
test('existing Ollama worker uses exact two referentials and separate spoken narration prompt',async()=>{
  let sent;
  const provider=ollamaJobProvider({fetcher:async(url,opt)=>{
    assert.equal(url,'http://ollama:11434/api/chat');
    sent=JSON.parse(opt.body);
    return new Response(JSON.stringify({done:true,message:{content:'{"chapters":[]}'}}));
  }});
  assert.equal(await provider(request),'{"chapters":[]}');
  assert.equal(sent.format.properties.chapters.minItems,7);
  assert.equal(sent.messages[1].content.includes('Contrat lexical bloquant'),true);
  assert.ok(sent.messages[0].content.includes('narrations orales'));
  assert.ok(!sent.messages[0].content.includes('six phases, aucun audio ni code'));
});
test('one visible user intent produces at most one async job, with durable failed state',async t=>{
  const root=await mkdtemp(join(tmpdir(),'cdc-coral-v2-'));
  t.after(()=>rm(root,{recursive:true,force:true}));
  let count=0;
  const gateway=await createJobGateway({root,token:'a'.repeat(48),
    provider:async()=>{count++;return '{"chapters":[]}';}});
  const id='d'.repeat(48);
  await gateway.submit(id,request);await gateway.submit(id,request);
  await gateway.state(id);assert.equal(count,0,'polling never calls provider');
  await gateway.workOnce();await gateway.workOnce();
  assert.equal(count,1);
  assert.equal((await gateway.state(id)).status,'succeeded');
  await assert.rejects(gateway.submit(id,{...request,creation_version:3}),/JOB_CONFLICT/);
});
