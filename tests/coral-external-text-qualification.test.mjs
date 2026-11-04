import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readdir,readFile,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {compareCoralTextModels} from '../scripts/qualify-coral-external-text.mjs';

const key='sk-'+'x'.repeat(38);
const french='Nous préparons le plat avec attention, et vous gardez les ingrédients à portée de main. Observez la texture, sentez les parfums et adaptez doucement la chaleur. Si la sauce devient trop épaisse, prenez le temps de corriger la cuisson avant de poursuivre. '.repeat(3);
const fixture=async t=>{
  const dir=await mkdtemp(join(tmpdir(),'cdc-coral-ext-'));
  t.after(()=>rm(dir,{recursive:true,force:true}));
  return dir;
};
test('dry run never calls a model, requires no API key and keeps ceiling far below one euro',async t=>{
  const dir=await fixture(t);
  const info=await compareCoralTextModels({run:false,stateDir:dir,apiKey:undefined,
    fetcher:async()=>{throw Error('dry run network');}});
  assert.equal(info.status,'DRY_RUN');
  assert.equal(info.planned.length,2);
  assert.equal(info.paidCalls,0);
  assert.ok(info.maxUsd>0&&info.maxUsd<0.25);
  assert.deepEqual(await readdir(dir),[]);
});
test('two real-shaped responses consume at most one call per model and save private review-only drafts',async t=>{
  const dir=await fixture(t);
  const seen=[];
  const fetcher=async(url,options)=>{
    seen.push([url,JSON.parse(options.body)]);
    assert.equal(url,'https://api.openai.com/v1/responses');
    assert.equal(options.headers.Authorization,'Bearer '+key);
    assert.equal(options.signal.aborted,false);
    const body=JSON.parse(options.body);
    assert.equal(body.store,false);
    assert.equal(body.max_output_tokens,1800);
    assert.equal(body.text.format.strict,true);
    assert.ok(body.input[1].content[0].text.includes('Contrat lexical bloquant'));
    assert.ok(body.input[1].content[0].text.includes('lok-lak')||body.input[1].content[0].text.includes('Lok Lak'));
    assert.ok(!body.input[1].content[0].text.includes('"audioScript"'));
    return new Response(JSON.stringify({status:'completed',usage:{input_tokens:9500,output_tokens:800},
      output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({id:'assembler',text:french})}]}]}),{status:200});
  };
  const result=await compareCoralTextModels({run:true,stateDir:dir,apiKey:key,fetcher});
  assert.equal(result.status,'REVIEW_REQUIRED');
  assert.equal(result.attempted,2);
  assert.equal(seen.length,2);
  assert.deepEqual(seen.map(x=>x[1].model),['gpt-6-luna','gpt-6.1-terra']);
  assert.ok(result.report.modelResults.every(x=>x.mechanicalPass));
  const items=await readdir(dir);
  assert.ok(items.includes('gpt-6-luna.attempt.json'));
  assert.ok(items.includes('gpt-6.1-terra.candidate.json'));
  const p=JSON.parse(await readFile(join(dir,'gpt-6-luna.candidate.json'),'utf8'));
  assert.equal(p.ttsAuthorized,false);
  assert.equal(p.humanApproved,false);
  if(process.platform!=='win32')
    assert.equal((await stat(join(dir,'gpt-6-luna.candidate.json'))).mode&0o077,0);
  await assert.rejects(compareCoralTextModels({run:true,stateDir:dir,apiKey:key,fetcher}),
    /EEXIST/,'rerun must not spend again');
  assert.equal(seen.length,2);
});
test('uncertain or invalid first model response fails closed without second paid call',async t=>{
  const dir=await fixture(t);let calls=0;
  const result=await compareCoralTextModels({run:true,stateDir:dir,apiKey:key,fetcher:async()=>{
    calls++;
    return new Response(JSON.stringify({status:'incomplete',usage:{input_tokens:11000,output_tokens:400},output:[]}),{status:200});
  }});
  assert.equal(result.status,'NO_GO');
  assert.equal(calls,1);
  assert.equal(result.report.modelResults[0].uncertainSpend,true);
  assert.equal((await readdir(dir)).some(n=>n.includes('terra')),false);
});
test('never calls API without a private token or with a malformed token',async t=>{
  const dir=await fixture(t);
  await assert.rejects(compareCoralTextModels({run:true,stateDir:dir,apiKey:'broken',
    fetcher:async()=>{throw Error('network should never happen');}}),
  /API_KEY_NOT_CONFIGURED/);
  assert.deepEqual(await readdir(dir),[]);
});
