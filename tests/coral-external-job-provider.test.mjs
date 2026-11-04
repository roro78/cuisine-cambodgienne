import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readdir,readFile,rm,writeFile,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createExternalCoralJobProvider,reserveCoralBudget} from '../scripts/coral-external-job-provider.mjs';

const key='sk-'+'z'.repeat(36),ID='a'.repeat(48);
const ids=['intro','installer','preparer','assembler','maitriser','rectifier','terminer'];
const validText='Nous allons cuisiner ensemble en prenant le temps de bien observer les aliments. Vous pouvez sentir les parfums, surveiller la chaleur et ajuster progressivement chaque geste. Quand la texture change, ralentissez et vérifiez la cuisson avant de reprendre. '.repeat(3);
const request={contract:'cdc-coral-v2-script-request-v1',
  scope:'workshop-seven-spoken-scripts-v1',
  atelier:{title:'Atelier de cuisine Cambodge',fields:{intro:'Cuisine guidée'},
    phases:ids.slice(1).map(id=>({id,actions:['Préparer']}))},
  reference:{recipe_fields:{title:'Lok Lak',ingredients:[{name:'bœuf'}],steps:[{title:'Saisir'}]}},
  referentials:{structure:{text:'Contrat lexical bloquant'},
    narration:{text:'Contrat lexical bloquant'}},
};
async function temp(t){
  const d=await mkdtemp(join(tmpdir(),'cdc-coral-budget-'));
  t.after(()=>rm(d,{recursive:true,force:true}));
  return d;
}
test('the opt-in existing job API produces exactly seven validated chapters for one job',async t=>{
  const budgetDir=await temp(t);
  let calls=0;const seen=[];
  const worker=createExternalCoralJobProvider({apiKey:key,model:'gpt-6.1-terra',budgetDir,
    maxDailyUsd:0.75,fetcher:async(url,opt)=>{
      calls++;const body=JSON.parse(opt.body);seen.push(body);
      assert.equal(url,'https://api.openai.com/v1/responses');
      assert.equal(body.store,false);
      assert.equal(body.max_output_tokens,1800);
      assert.equal(opt.headers.Authorization,'Bearer '+key);
      const ctx=JSON.parse(body.input[1].content[0].text);
      assert.equal(ctx.canonicalRecipe.title,'Lok Lak');
      assert.equal(ctx.structure,'Contrat lexical bloquant');
      const id=ctx.chapterId;
      return new Response(JSON.stringify({status:'completed',
        usage:{input_tokens:10000,output_tokens:750},
        output:[{type:'message',content:[{type:'output_text',
          text:JSON.stringify({id,text:validText})}]}]}));
    }});
  const result=JSON.parse(await worker(request,ID));
  assert.equal(calls,7);
  assert.deepEqual(result.chapters.map(x=>x.id),ids);
  assert.equal(result.chapters.length,7);
  assert.ok(seen.every(s=>s.reasoning.effort==='none'));
  const files=await readdir(budgetDir);
  assert.equal(files.filter(x=>x.endsWith('.json')).length,1);
  const ledger=JSON.parse(await readFile(join(budgetDir,files.find(x=>x.endsWith('.json'))),'utf8'));
  assert.equal(ledger.requests.length,1);
  assert.equal(ledger.requests[0].jobId,ID);
  await assert.rejects(worker(request,ID),/CORAL_EXTERNAL_ALREADY_RESERVED/);
  assert.equal(calls,7,'no paid retry after a completed job');
});
test('HTTP timeout, invalid JSON, or wrong chapter stops further paid calls',async t=>{
  const budgetDir=await temp(t);let n=0;
  const worker=createExternalCoralJobProvider({apiKey:key,model:'gpt-6-luna',budgetDir,
    fetcher:async()=>{n++;return new Response(JSON.stringify({status:'incomplete',output:[]}));}});
  await assert.rejects(worker(request,ID),/QUAL_RESPONSE_NOT_COMPLETE/);
  assert.equal(n,1);
  await assert.rejects(worker(request,ID),/CORAL_EXTERNAL_ALREADY_RESERVED/);
  assert.equal(n,1);
});
test('token, model, private directory, and daily cap all fail closed',async t=>{
  const dir=await temp(t);
  assert.throws(()=>createExternalCoralJobProvider({apiKey:'bad',model:'gpt-6-luna',budgetDir:dir}),
    /CORAL_EXTERNAL_KEY_UNAVAILABLE/);
  assert.throws(()=>createExternalCoralJobProvider({apiKey:key,model:'other',budgetDir:dir}),
    /CORAL_EXTERNAL_MODEL_NOT_ALLOWED/);
  assert.throws(()=>createExternalCoralJobProvider({apiKey:key,model:'gpt-6-luna',budgetDir:dir,maxDailyUsd:5}),
    /CORAL_EXTERNAL_DAILY_LIMIT/);
  await assert.rejects(reserveCoralBudget({budgetDir:dir,jobId:ID,model:'gpt-6-luna',
    costUsd:0.20,maxDailyUsd:0.10}),/CORAL_EXTERNAL_BUDGET_LIMIT/);
  assert.equal((await readdir(dir)).some(x=>x.endsWith('.lock')),false);
});
