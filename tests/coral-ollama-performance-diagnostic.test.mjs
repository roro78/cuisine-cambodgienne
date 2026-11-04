import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {makePayload,diagnose,summarizeSamples} from '../scripts/diagnose-coral-ollama-performance.mjs';
test('diagnostics preserve full policy and recipe but never reuse approved voice',async()=>{
  const a=await makePayload('baseline'),b=await makePayload('chapter');
  assert.equal(a.payload.options.num_ctx,b.payload.options.num_ctx);
  assert.equal(a.payload.options.num_predict,64);assert.equal(b.payload.options.num_predict,128);
  assert.ok(b.payload.messages[1].content.includes('Contrat lexical bloquant'));
  const p=JSON.parse(b.payload.messages[1].content);
  assert.ok(p.referentials.structure.length>10000&&p.referentials.narration.length>10000);
  assert.ok(p.source.reference.recipe_fields.ingredients.some(i=>i.name.toLowerCase().includes('ail')));
  assert.match(p.source.workshopAdaptation,/marin/);
  assert.ok(!b.payload.messages[1].content.includes('audioScript'));
  assert.equal(p.requestedChapter,'assembler');
  await assert.rejects(makePayload('full'),/INVALID_DIAGNOSTIC_MODE/);
});
test('one streaming call measures metrics and never retries or calls audio',async t=>{
  const output=await mkdtemp(join(tmpdir(),'cdc-perf-test-'));t.after(()=>rm(output,{recursive:true,force:true}));
  let calls=0;
  const {report}=await diagnose({mode:'baseline',output,sample:async()=>({}),fetcher:async(url,opts)=>{
    calls++;assert.equal(url,'http://127.0.0.1:11434/api/chat');assert.equal(JSON.parse(opts.body).stream,true);
    assert.ok(opts.signal);
    return new Response(JSON.stringify({message:{content:'Bonjour. '},done:false})+'\n'+JSON.stringify({message:{content:'Lisez bien.'},done:true,done_reason:'stop',total_duration:3000000000,load_duration:1000000000,prompt_eval_duration:500000000,prompt_eval_count:20,eval_duration:1500000000,eval_count:15})+'\n');
  }});
  assert.equal(calls,1);assert.equal(report.tokensPerSecond,10);assert.equal(report.promptTokensPerSecond,40);
  assert.equal(report.loadSeconds,1);assert.equal(report.promptSeconds,0.5);assert.equal(report.generationSeconds,1.5);
  assert.equal(report.timeoutMs,45000);assert.equal(report.completed,true);assert.equal(report.audioCalls,0);assert.equal(report.qualifiedForProduction,false);
});
test('timeout stops after one request and never reports missing metrics as zero',async t=>{
  const output=await mkdtemp(join(tmpdir(),'cdc-perf-timeout-'));t.after(()=>rm(output,{recursive:true,force:true}));let calls=0;
  const {report}=await diagnose({mode:'chapter',output,sample:async()=>({}),fetcher:async()=>{calls++;throw new DOMException('bounded','TimeoutError');}});
  assert.equal(calls,1);assert.equal(report.timeoutMs,90000);assert.equal(report.completed,false);assert.equal(report.error,'TIMEOUT');
  assert.equal(report.tokensPerSecond,undefined);assert.equal(report.automaticRetryAllowed,false);
});
test('resource deltas distinguish swap and host CPU steal',()=>{
  const r=summarizeSamples([{stat:'cpu 10 0 0 90 0 0 0 0',vmstat:'pswpin 1\npswpout 2\npgmajfault 3',meminfo:'MemAvailable: 300 kB\nSwapTotal: 100 kB\nSwapFree: 90 kB',containers:[{Name:'ollama',CPUPerc:'1.0%'}]},
    {stat:'cpu 50 0 0 130 10 0 0 10',vmstat:'pswpin 1\npswpout 4\npgmajfault 5',meminfo:'MemAvailable: 200 kB\nSwapTotal: 100 kB\nSwapFree: 80 kB',containers:[{Name:'ollama',CPUPerc:'390.0%'}]}]);
  assert.deepEqual(r.vmDelta,{pswpin:0,pswpout:2,pgmajfault:2});assert.equal(r.minAvailableKiB,200);assert.equal(r.maxSwapUsedKiB,20);
  assert.equal(r.containerPeakCpuPct.ollama,390);assert.equal(r.cpuIntervals[0].stealPct,10);
});
