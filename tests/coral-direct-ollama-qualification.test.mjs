import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {qualify} from '../scripts/qualify-coral-ollama-direct.mjs';
const ids=['intro','installer','preparer','assembler','maitriser','rectifier','terminer'];
const text='Bonjour, nous allons préparer tranquillement le plat. Observez les ingrédients, puis prenez votre temps pour reconnaître la texture et ajuster votre geste. Vous devez garder une cuisson régulière et prendre les précautions nécessaires à chaque étape. Cuisinez avec méthode, observez le résultat et corrigez une erreur avant de poursuivre. '.repeat(2);
async function fixture(t,{wrong=false,failAt=null,suffix=''}={}){
  const output=await mkdtemp(join(tmpdir(),'cdc-qualify-synthetic-'));
  t.after(()=>rm(output,{recursive:true,force:true}));
  const seen=[];
  let posts=0;
  const fetcher=async(url,options={})=>{
    seen.push({url,method:options.method||'GET'});
    assert.ok(url==='http://127.0.0.1:11434/api/tags'||url==='http://127.0.0.1:11434/api/chat');
    if(url.endsWith('/api/tags'))return new Response(JSON.stringify({models:[{name:'llama3.2:latest'}]}));
    posts++;
    const p=JSON.parse(options.body);
    assert.equal(p.options.num_ctx,16384);
    assert.equal(p.messages[1].content.includes('Contrat lexical bloquant'),true);
    assert.ok(p.messages[1].content.includes('lok-lak'));
    assert.ok(!p.messages[1].content.includes('"audioScript"'));
    const source=JSON.parse(p.messages[1].content).source;
    assert.equal(source.reference.id,'recette:lok-lak');
    for(const name of ['sucre','ail','tomate','concombre','salade'])
      assert.ok(source.reference.recipe_fields.ingredients.some(x=>x.name.toLowerCase().includes(name)),name);
    assert.ok(source.reference.recipe_fields.steps.length>0);
    assert.match(source.workshopAdaptation,/marin[ée]/u);
    assert.ok(!p.messages[1].content.includes('Commençons par installer votre petit coin'));
    if(failAt===posts)throw Error('synthetic interrupted provider');
    const chapter=JSON.parse(p.messages[1].content).requestedChapter;
    return new Response(JSON.stringify({done:true,done_reason:'stop',eval_count:455,eval_duration:65000000000,
      message:{content:JSON.stringify({chapter:{id:wrong?'not-a-chapter':chapter,text:text+suffix}})}}));
  };
  return {output,seen,fetcher,get calls(){return posts}};
}
test('default probe makes exactly one real shaped Ollama call, never n8n or TTS',async t=>{
  const f=await fixture(t);
  const {report,path}=await qualify({fetcher:f.fetcher,output:f.output});
  assert.equal(f.calls,1);
  assert.equal(report.mode,'probe');
  assert.equal(report.realProviderCalls,1);
  assert.equal(report.mechanicalPass,true);
  assert.equal(report.chapters[0].chapterId,'assembler');
  assert.equal(report.audioCalls,0);
  assert.equal(report.qualifiedForProduction,false);
  assert.ok(report.chapters[0].tokensPerSecond>=6&&report.chapters[0].tokensPerSecond<=8);
  assert.equal((await readFile(path,'utf8')).includes('"qualifiedForProduction": false'),true);
  assert.equal(f.seen.some(s=>s.url.includes('n8n')||s.url.includes('onrender')),false);
});
test('full qualification needs explicit approval and seven sequential no-retry calls',async t=>{
  const f=await fixture(t);
  await assert.rejects(qualify({fetcher:f.fetcher,full:true,output:f.output}),/APPROVAL_REQUIRED/);
  assert.equal(f.calls,0);
  const {report}=await qualify({fetcher:f.fetcher,full:true,approval:true,output:f.output});
  assert.equal(f.calls,7);
  assert.deepEqual(report.chapters.map(x=>x.chapterId),ids);
  assert.equal(report.mechanicalPass,true);
  assert.equal(report.qualifiedForProduction,false);
});
test('wrong chapter or timeout fails closed after first call',async t=>{
  const f=await fixture(t,{wrong:true});
  const {report}=await qualify({fetcher:f.fetcher,full:true,approval:true,output:f.output});
  assert.equal(f.calls,1);
  assert.equal(report.mechanicalPass,false);
  assert.equal(report.chapters[0].automaticRetryAllowed,false);
});
test('private Ollama only and no TTS even on interrupted request',async t=>{
  const f=await fixture(t,{failAt:1});
  await assert.rejects(qualify({url:'https://n8n.orvekio.com',fetcher:f.fetcher,output:f.output}),
    /QUALIFICATION_ONLY_ON_PRIVATE_OLLAMA/);
  const {report}=await qualify({fetcher:f.fetcher,output:f.output});
  assert.equal(report.mechanicalPass,false);
  assert.equal(f.calls,1);
  assert.equal(report.audioCalls,0);
});

test('probe and full qualification stop at the first server-blocking voice defect',async t=>{
  for(const suffix of [' Ajoutez 200 g de sucre.',' Prenez 2 oeufs.','\n- Mélangez doucement.',' Je vous vois cuisiner.',' Montez les bols.']) {
    const f=await fixture(t,{suffix});
    const {report}=await qualify({fetcher:f.fetcher,full:true,approval:true,output:f.output});
    assert.equal(f.calls,1,suffix);
    assert.equal(report.mechanicalPass,false,suffix);
    assert.equal(report.audioCalls,0);
  }
});
