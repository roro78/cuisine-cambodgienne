import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {
  BENCH_MODELS,BENCH_KINDS,BENCH_CONTRACT,
  OUTPUT_LIMITS,loadBenchFixtures,validateBenchFixtures,
  ollamaBenchRequest,assessBenchResponse,assertBenchUrl,runBench
} from '../scripts/benchmark-ollama-editorial.mjs';

test('five category fixtures are synthetic, complete and never inserted in CMS',()=>{
  const fixtures=loadBenchFixtures();
  assert.equal(fixtures.length,5);
  assert.deepEqual(fixtures.map(f=>f.kind),BENCH_KINDS);
  assert.equal(new Set(fixtures.map(f=>f.id)).size,5);
  assert.throws(()=>validateBenchFixtures([...fixtures,fixtures[0]]),/BENCH_FIXTURE_COUNT/);
  for(const f of fixtures){
    assert.ok(f.verified_facts.length && f.checks.length);
    assert.ok(!JSON.stringify(f).includes('Authorization: Bearer'));
  }
});
test('Ollama adapter request uses native schema, fixed four fields and no tool or publication',()=>{
  for(const f of loadBenchFixtures()){
    const req=ollamaBenchRequest('llama3.2:latest',f);
    assert.equal(req.model,'llama3.2:latest');
    assert.equal(req.stream,false);
    assert.equal(req.think,false);
    assert.equal(req.options.temperature,0);
    assert.equal(req.options.num_predict,1200);
    assert.equal(req.format.additionalProperties,false);
    assert.deepEqual(req.format.required,Object.keys(OUTPUT_LIMITS));
    assert.equal(req.messages.length,2);
    assert.ok(req.messages[0].content.includes('BRIEF'));
    assert.ok(req.messages[0].content.includes('research_note'));
    assert.ok(!('tools' in req));
  }
});
test('schema gate fails closed; it does not claim historical or culinary accuracy',()=>{
  const valid={title:'Titre',angle:'Angle',summary:'Résumé',research_note:'À vérifier'};
  assert.equal(assessBenchResponse(JSON.stringify(valid)).schema_ok,true);
  assert.equal(assessBenchResponse('not json').issues[0],'INVALID_JSON');
  assert.equal(assessBenchResponse(JSON.stringify({...valid,published:true})).schema_ok,false);
  assert.equal(assessBenchResponse(JSON.stringify({...valid,title:''})).schema_ok,false);
  assert.equal(assessBenchResponse(JSON.stringify({...valid,summary:'x'.repeat(2001)})).schema_ok,false);
});
test('benchmark cannot connect to public or arbitrary endpoints',()=>{
  assert.equal(assertBenchUrl('http://ollama:11434'),'http://ollama:11434');
  assert.equal(assertBenchUrl('http://127.0.0.1:11434'),'http://127.0.0.1:11434');
  for(const value of [
    'https://ollama:11434','http://example.com:11434',
    'http://ollama:11434/other','http://ollama:11434/?secret=x',
    'http://admin@ollama:11434','http://127.0.0.1:7000',
    'http://169.254.169.254:11434'
  ])assert.throws(()=>assertBenchUrl(value),/BENCH_URL_NOT_INTERNAL/);
});
test('fully simulated run covers all 3 models x 5 families without accessing network',async()=>{
  const seen=[],full={title:'Sujet',angle:'Différence',summary:'À relire',
    research_note:'Vérifier avant toute publication'};
  const mock=async(url,options)=>{
    seen.push({url,options});
    const response=url.endsWith('/api/tags')
      ?{models:BENCH_MODELS.map(name=>({name}))}
      :{done:true,message:{content:JSON.stringify(full)},
        total_duration:200_000_000,eval_count:30,prompt_eval_count:80};
    return {ok:true,text:async()=>JSON.stringify(response)};
  };
  const outcome=await runBench({models:BENCH_MODELS,fetcher:mock});
  assert.equal(outcome.contract,BENCH_CONTRACT);
  assert.equal(outcome.cases.length,15);
  assert.ok(outcome.cases.every(x=>x.status==='SCHEMA_VALID'));
  assert.equal(seen.length,16);
  assert.equal(seen[0].url,'http://127.0.0.1:11434/api/tags');
  assert.equal(seen.slice(1).every(x=>x.url.endsWith('/api/chat')),true);
  for(const entry of seen.slice(1)){
    const b=JSON.parse(entry.options.body);
    assert.deepEqual(Object.keys(b.format.properties),Object.keys(OUTPUT_LIMITS));
    assert.ok(!entry.options.body.includes('private_secret'));
  }
  assert.equal(new Set(outcome.cases.map(c=>c.kind)).size,5);
});
test('missing models or malformed output get explicit statuses, never fake scores',async()=>{
  let requests=0;
  const stub=async(url)=>{
    ++requests;
    return {ok:true,text:async()=>JSON.stringify(
      url.endsWith('/tags')?{models:[{name:'llama3.2:latest'}]}
        :{done:true,message:{content:'{bad json}'}})};
  };
  const outcome=await runBench({models:['llama3.2:latest','qwen3:8b'],fetcher:stub});
  assert.equal(outcome.cases.length,10);
  assert.equal(outcome.cases.filter(x=>x.status==='SCHEMA_REJECTED').length,5);
  assert.equal(outcome.cases.filter(x=>x.status==='NOT_INSTALLED').length,5);
  assert.equal(requests,6);
  assert.ok(outcome.cases.every(x=>!('quality_score' in x)));
  assert.throws(()=>runBench({models:['junk model']}),/BENCH_CONFIG_INVALID/);
});
