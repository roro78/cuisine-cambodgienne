import test from 'node:test';
import assert from 'node:assert/strict';
import {S1_TRIAL,s1Request,s1Trial,s1PrivateFile} from '../scripts/benchmark-ollama-structured.mjs';
const request={
  contract:'cdc-editorial-ai-content-request-v1',scope:'creation-form-core-v1',
  brief:{kind:'culture',title:'Test synthétique',context:'TEST SYNTHÉTIQUE UNIQUEMENT. Corpus public.'},
  reference:null,rules:['Pas de publication'],
  response_schema:{type:'object',additionalProperties:false,
    properties:{fields:{type:'object',properties:{intro:{type:'string'}}}}},
  max_output_tokens:6000,response_max_bytes:30000,timeout_seconds:20
};
const fake=x=>({ok:true,text:async()=>JSON.stringify(x)});
test('manual-only S1 input requires synthetic exact C2 contract and private files',()=>{
  assert.equal(s1Request(request),request);
  assert.throws(()=>s1Request({...request,scope:'astro-full'}),/S1_SYNTHETIC/);
  assert.throws(()=>s1Request({...request,brief:{kind:'culture',context:'Private data'}}),/S1_SYNTHETIC/);
  assert.throws(()=>s1Request({...request,brief:{kind:'atelier',context:request.brief.context}}),/S1_CANONICAL/);
  assert.throws(()=>s1PrivateFile('public/secret.json'),/S1_PRIVATE_DIR/);
  assert.throws(()=>s1PrivateFile('artifacts/benchmark/../bad.json'),/S1_PRIVATE_DIR/);
  assert.ok(s1PrivateFile('artifacts/benchmark/test.json').endsWith('/artifacts/benchmark/test.json'));
});
test('fake Ollama sends the structured CMS schema and no publication calls',async()=>{
  const calls=[],raw='{"title":"Résumé","fields":{"intro":"Texte"}}';
  const fetcher=async(url,opts)=>{
    calls.push({url,opts});
    return fake(url.endsWith('/api/tags')
      ?{models:[{name:'llama3.2:latest'}]}
      :{done:true,message:{content:raw},eval_count:12});
  };
  const result=await s1Trial({request,model:'llama3.2:latest',fetcher});
  assert.equal(result.contract,S1_TRIAL);
  assert.equal(result.raw,raw);
  assert.equal(result.publication_ready,false);
  assert.equal(result.requires_human_review,true);
  assert.equal(calls.length,2);
  const post=JSON.parse(calls[1].opts.body);
  assert.deepEqual(post.format,request.response_schema);
  assert.equal(post.options.temperature,0);
  assert.ok(!('tools' in post));
});
test('missing model refuses all generation, oversized output fails closed',async()=>{
  let calls=0;
  await assert.rejects(s1Trial({request,model:'qwen3:8b',
    fetcher:async()=>{calls++;return fake({models:[]});}}),/S1_MODEL_NOT_INSTALLED/);
  assert.equal(calls,1);
  const fetcher=async url=>fake(url.endsWith('/api/tags')
    ?{models:[{name:'llama3.2:latest'}]}
    :{done:true,message:{content:'X'.repeat(30001)}});
  await assert.rejects(s1Trial({request,model:'llama3.2:latest',fetcher}),
    /S1_RAW_OUTPUT_TOO_LARGE/);
});
