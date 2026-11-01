import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {loadBenchFixtures,validateBenchFixtures} from '../scripts/benchmark-ollama-editorial.mjs';
import {S1_TRIAL,S1_EVIDENCE,s1Request,s1Trial,s1PrivateFile,s1Evidence,s1ProviderTimeoutMs,s1CultureEditorialTriage} from '../scripts/benchmark-ollama-structured.mjs';
const request={
  contract:'cdc-editorial-ai-content-request-v1',scope:'creation-form-core-v1',
  brief:{kind:'culture',title:'Test synthétique',context:'TEST SYNTHÉTIQUE UNIQUEMENT. Corpus public.'},
  reference:null,rules:['Pas de publication'],
  response_schema:{type:'object',additionalProperties:false,
    properties:{fields:{type:'object',properties:{intro:{type:'string'}}}}},
  max_output_tokens:6000,response_max_bytes:30000,timeout_seconds:20
};
const fake=x=>({ok:true,text:async()=>JSON.stringify(x)});
test('private files, collisions and evidence are enforced before any provider call',async()=>{
  const cwd=await mkdtemp(join(tmpdir(),'cdc-s1-files-'));
  try{
    // A fresh process makes privateDir resolve inside this disposable test root.
    await promisify(execFile)(process.execPath,['--input-type=module','-e',`
      import assert from 'node:assert/strict';
      import {mkdir,writeFile,readFile,chmod,lstat,unlink,symlink,rename} from 'node:fs/promises';
      import {createHash} from 'node:crypto';
      const {s1Run}=await import(process.argv[1]);
      const request=JSON.parse(process.argv[2]);
      const dir='artifacts/benchmark',input=dir+'/request.json',out=dir+'/result.json';
      const evidence=dir+'/result.evidence.json';
      await mkdir(dir,{recursive:true,mode:0o700});
      await writeFile(input,JSON.stringify(request),{mode:0o600});
      let calls=0;
      const raw='{"title":"Test","fields":{"intro":"Texte"}}';
      const fetcher=async url=>{
        calls++;
        return {ok:true,text:async()=>JSON.stringify(url.endsWith('/api/tags')
          ?{models:[{name:'llama3.2:latest'}]}
          :{done:true,message:{content:raw},eval_count:12})};
      };
      const run=()=>s1Run({request:input,out,model:'llama3.2:latest',fetcher});
      await chmod(dir,0o755);
      await assert.rejects(run(),/S1_DIR_NOT_PRIVATE/);
      await chmod(dir,0o700);
      await chmod(input,0o644);
      await assert.rejects(run(),/S1_INPUT_NOT_PRIVATE/);
      await chmod(input,0o600);
      await rename(input,dir+'/original.json');
      await symlink('original.json',input);
      await assert.rejects(run(),/S1_INPUT_NOT_PRIVATE/);
      await unlink(input);
      await rename(dir+'/original.json',input);
      await rename(dir,'artifacts/actual');
      await symlink('actual',dir);
      await assert.rejects(run(),/S1_DIR_NOT_PRIVATE/);
      await unlink(dir);
      await rename('artifacts/actual',dir);
      await assert.rejects(s1Run({request:input,out:input,model:'llama3.2:latest',fetcher}),/S1_PATH_COLLISION/);
      for(const path of [out,evidence]){
        await writeFile(path,'existing',{mode:0o600});
        await assert.rejects(run(),/S1_OUTPUT_ALREADY_EXISTS/);
        assert.equal(await readFile(path,'utf8'),'existing');
        await unlink(path);
      }
      assert.equal(calls,0);
      await run();
      assert.equal(calls,2);
      assert.equal(await readFile(out,'utf8'),raw);
      const proof=JSON.parse(await readFile(evidence,'utf8'));
      assert.equal(proof.response_sha256,createHash('sha256').update(raw).digest('hex'));
      assert.equal(proof.request_sha256,createHash('sha256').update(JSON.stringify(request)).digest('hex'));
      assert.equal(proof.schema_validation,'NOT_RUN');
      assert.equal(proof.editorial_review,'NOT_RUN');
      for(const path of [out,evidence])assert.equal((await lstat(path)).mode&0o777,0o600);
      await assert.rejects(run(),/S1_OUTPUT_ALREADY_EXISTS/);
      assert.equal(calls,2);
      await unlink(out);await unlink(evidence);
      // Competing writer after preflight: preserve its evidence, remove only our response.
      const racingFetcher=async(url,options)=>{
        if(url.endsWith('/api/chat'))await writeFile(evidence,'competing proof',{mode:0o600});
        return fetcher(url,options);
      };
      await assert.rejects(s1Run({request:input,out,model:'llama3.2:latest',fetcher:racingFetcher}),{code:'EEXIST'});
      assert.equal(await readFile(evidence,'utf8'),'competing proof');
      await assert.rejects(lstat(out),{code:'ENOENT'});
    `,new URL('../scripts/benchmark-ollama-structured.mjs',import.meta.url).href,JSON.stringify(request)],{cwd});
  }finally{await rm(cwd,{recursive:true,force:true});}
});
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
  const evidence=s1Evidence(result,request);
  assert.equal(evidence.contract,S1_EVIDENCE);
  assert.equal(evidence.scope,'S1');
  assert.equal(evidence.model,'llama3.2:latest');
  assert.equal(evidence.kind,'culture');
  assert.match(evidence.request_sha256,/^[0-9a-f]{64}$/);
  assert.match(evidence.response_sha256,/^[0-9a-f]{64}$/);
  assert.equal(evidence.response_bytes,Buffer.byteLength(raw,'utf8'));
  assert.equal(evidence.metrics.eval_count,12);
  assert.equal(evidence.schema_validation,'NOT_RUN');
  assert.equal(evidence.editorial_review,'NOT_RUN');
  assert.equal(evidence.publication_ready,false);
  assert.equal(evidence.requires_human_review,true);
  assert.throws(()=>s1Evidence({...result,publication_ready:true},request),/S1_EVIDENCE_INVALID/);
  assert.equal(result.publication_ready,false);
  assert.equal(result.requires_human_review,true);
  assert.equal(calls.length,2);
  const post=JSON.parse(calls[1].opts.body);
  assert.deepEqual(post.format,request.response_schema);
  assert.match(post.messages[0].content,/research_note/);
  assert.match(post.messages[0].content,/contenu final destiné au lecteur/);
  assert.match(post.messages[0].content,/Ne pas transformer les points à vérifier/);
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

test('S1 provider timeout is bounded and independent of the CMS request contract',async()=>{
  assert.equal(s1ProviderTimeoutMs(),20000);
  assert.equal(s1ProviderTimeoutMs(120000),120000);
  assert.equal(s1ProviderTimeoutMs(180000),180000);
  for(const value of [0,19999,180001,20000.5,NaN,Infinity,'180000',null])
    assert.throws(()=>s1ProviderTimeoutMs(value),/S1_PROVIDER_TIMEOUT_INVALID/);
  const signals=[];
  const fetcher=async(url,opts)=>{
    signals.push({url,signal:opts.signal});
    return fake(url.endsWith('/api/tags')
      ?{models:[{name:'llama3.2:latest'}]}
      :{done:true,message:{content:'{"fields":{"intro":"OK"}}'}});
  };
  await s1Trial({request,model:'llama3.2:latest',fetcher,providerTimeoutMs:180000});
  assert.equal(signals.length,2);
  assert.equal(signals[0].signal.aborted,false);
  assert.equal(signals[1].signal.aborted,false);
  assert.equal(request.timeout_seconds,20);
  await assert.rejects(s1Trial({request,model:'llama3.2:latest',fetcher,providerTimeoutMs:180001}),/S1_PROVIDER_TIMEOUT_INVALID/);
  assert.equal(signals.length,2);
});

test('culture S1 fixture is sourced, limited and does not modify other families',async()=>{
  const fixtures=JSON.parse(await readFile(new URL('./fixtures/editorial-ollama-benchmark.json',import.meta.url),'utf8'));
  assert.equal(fixtures.length,5);
  assert.deepEqual(fixtures.map(x=>x.kind),['recette','atelier','culture','ingredient','technique']);
  const culture=fixtures.find(x=>x.kind==='culture');
  assert.equal(culture.verified_facts.length,6);
  for(let i=0;i<culture.verified_facts.length;i++){
    assert.ok(culture.verified_facts[i].startsWith('[F'+(i+1)+' | Tourism Cambodia | https://www.tourismcambodia.com/'));
  }
  assert.ok(culture.checks.some(x=>x.includes('research_note')));
  assert.ok(culture.checks.some(x=>x.includes('aucun autre')));
});

test('legacy benchmark loader accepts six culture facts but rejects excess and other-family expansion',()=>{
  const items=loadBenchFixtures();
  assert.equal(items.find(x=>x.kind==='culture').verified_facts.length,6);
  assert.equal(validateBenchFixtures(items),items);
  const altered=structuredClone(items);
  altered.find(x=>x.kind==='culture').verified_facts.push('F7 unsupported');
  assert.throws(()=>validateBenchFixtures(altered),/BENCH_FIXTURE_INVALID/);
  const other=structuredClone(items);
  other.find(x=>x.kind==='recette').verified_facts=Array(6).fill('test fact');
  assert.throws(()=>validateBenchFixtures(other),/BENCH_FIXTURE_INVALID/);
});

test('culture S1 context stays within the existing PHP brief limit',()=>{
  const culture=loadBenchFixtures().find(x=>x.kind==='culture');
  const context='TEST SYNTHÉTIQUE UNIQUEMENT. Aucun fait supplémentaire établi.\n'
    +'Faits autorisés : '+culture.verified_facts.join(' ; ')+'\n'
    +'Points à vérifier : '+culture.checks.join(' ; ');
  assert.ok([...context].length<=2000,'CMS context max 2000 characters');
});

test('S1 culture offline triage never approves facts or publication',()=>{
  const candidate={title:'Deux marchés',angle:'Comparaison',
    summary:'Phsar Thmei et Phsar Chas',research_note:'Consignes sans sources',
    fields:{intro:'Phsar Thmei et Phsar Chas',sections:[{title:'Phsar Thmei',paragraphs:['Présentation']}]}
  };
  const result=s1CultureEditorialTriage(JSON.stringify(candidate));
  assert.equal(result.publication_ready,false);
  assert.equal(result.fact_review,'REVIEW_REQUIRED');
  assert.equal(result.unsupported_claim_review,'REVIEW_REQUIRED');
  assert.equal(result.comparison_review,'REVIEW_REQUIRED');
  assert.ok(result.flags.includes('PRIVATE_NOTE_SOURCE_MISSING'));
  const sourced=s1CultureEditorialTriage(JSON.stringify({...candidate,
    research_note:'https://www.tourismcambodia.com/'}));
  assert.ok(!sourced.flags.includes('PRIVATE_NOTE_SOURCE_MISSING'));
  assert.equal(sourced.fact_review,'REVIEW_REQUIRED');
  const leaked=s1CultureEditorialTriage(JSON.stringify({...candidate,
    summary:'https://example.org source interne'}));
  assert.ok(leaked.flags.includes('POSSIBLE_RESEARCH_LEAK'));
  assert.throws(()=>s1CultureEditorialTriage('invalid'),/S1_EDITORIAL_INPUT_INVALID/);
});
