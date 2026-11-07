import test from 'node:test';
import assert from 'node:assert/strict';
import {createCoralRealtimeProvider,createCoralRealtimeContractHarness,coralRealtimeResponseEvent} from '../scripts/coral-tts-realtime-contract.mjs';
import {coralCostPlan,coralUsageCostMicrousd} from '../scripts/coral-tts-cost-plan.mjs';
import {createSimulatedTtsJobs} from '../scripts/coral-tts-jobs.mjs';
const chapter={id:'intro',text:'Texte strictement fictif pour tester le contrat vocal sans fournisseur réel ni contenu destiné au public. '.repeat(2)};
const usage={input_tokens:200,output_tokens:30,input_token_details:{text_tokens:200,audio_tokens:0},output_token_details:{text_tokens:10,audio_tokens:20}};
function events(){return [{type:'response.created',response:{id:'resp_fixture'}},
 {type:'response.output_audio.delta',response_id:'resp_fixture',delta:Buffer.alloc(4800).toString('base64')},
 {type:'response.output_audio.done',response_id:'resp_fixture'},
 {type:'response.output_audio_transcript.done',response_id:'resp_fixture',transcript:chapter.text},
 {type:'response.done',response:{id:'resp_fixture',status:'completed',usage:structuredClone(usage)}}];}
function provider(rows=events()){
 let calls=0;return {p:createCoralRealtimeContractHarness({testOnly:true,exchange:async()=>{calls++;return {async *[Symbol.asyncIterator](){yield*rows;}};}}),calls:()=>calls};
}
test('real factory is permanently disabled and existing worker refuses unqualified/paid adapter',()=>{
 assert.throws(()=>createCoralRealtimeProvider({enabled:true}),/DISABLED/);
 assert.throws(()=>createCoralRealtimeContractHarness({exchange:()=>{}}),/DISABLED/);
 const {p}=provider();assert.throws(()=>createSimulatedTtsJobs({authorize:async()=>true,budgetDir:'unused',provider:p}),/CONFIG/);
});
test('inert adapter builds bounded out-of-band Coral PCM event and decodes actual fake audio plus usage',async()=>{
 const e=coralRealtimeResponseEvent(chapter.text);assert.equal(e.response.max_output_tokens,4096);assert.equal(e.response.conversation,'none');
 assert.equal(e.response.audio.output.voice,'coral');assert.deepEqual(e.response.tools,[]);
 const {p,calls}=provider();const b=await p.synthesize({chapter});assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.length,4844);
 assert.equal(calls(),1);assert.equal(p.lastReceipt().cost_microusd,544);assert.equal(p.lastReceipt().usage.output_tokens,30);
});
test('stream errors, interruption, truncation, mismatched identity/transcript and unknown usage are uncertain without retry',async()=>{
 for(const mutate of [r=>r.pop(),r=>r.splice(1,0,{type:'error',error:{message:'fake-private-key-must-not-leak'}}),
  r=>r[1].delta='invalid base64!',r=>r[1].response_id='resp_other',r=>r[3].transcript+=' ajout',
  r=>r[4].response.status='incomplete',r=>r[4].response.usage.output_tokens=5000,
  r=>r[4].response.usage.input_token_details.audio_tokens=1,r=>r[4].response.usage.output_token_details.reasoning_tokens=1]){
  const rows=events();mutate(rows);const {p,calls}=provider(rows);
  await assert.rejects(p.synthesize({chapter}),e=>e.message==='CORAL_REALTIME_UNCERTAIN_NO_RETRY');assert.equal(calls(),1);assert.equal(p.lastReceipt(),null);
 }
});
test('incomplete transport is bounded in time and never repeats exchange',async()=>{
 let calls=0;const p=createCoralRealtimeContractHarness({testOnly:true,timeoutMs:30,exchange:async()=>{calls++;return {async *[Symbol.asyncIterator](){await new Promise(()=>{});}};}});
 await assert.rejects(p.synthesize({chapter}),/UNCERTAIN_NO_RETRY/);assert.equal(calls,1);
});
test('pricing separates estimates, conditional output ceiling, unknown external maximum and reservation',()=>{
 const p=coralCostPlan({seconds:664.728,textTokensEstimate:3000});assert.equal(p.demonstrated_external_maximum_microusd,null);
 assert.equal(p.internal_reservation_microusd,null);assert.equal(p.real_provider_enabled,false);
 assert.equal(p.conditional_output_cost_ceiling_microusd,573440);assert.equal(p.estimated_exceeds_output_capacity,false);
 assert.equal(coralCostPlan({seconds:1579.872,textTokensEstimate:6000}).estimated_exceeds_output_capacity,true);
 assert.equal(coralUsageCostMicrousd(usage),544);assert.throws(()=>coralUsageCostMicrousd({...usage,input_tokens:201}),/UNCONFIRMED/);
 assert.throws(()=>coralCostPlan({seconds:600,textTokensEstimate:3000,maxOutputTokens:5000}),/INPUT/);
});
