import test from 'node:test';import assert from 'node:assert/strict';import {coralFragmentCostPlan} from '../scripts/coral-tts-cost-plan.mjs';
test('fragment costs distinguish chapter, whole program, interrupted receipts, resume estimate and unknown maximum',()=>{
 const fragments=Array.from({length:14},(_,i)=>({chapter:Math.floor(i/2),seconds:45,text_tokens:100}));
 const usage={input_tokens:20,output_tokens:22,input_token_details:{text_tokens:20,audio_tokens:0},output_token_details:{text_tokens:2,audio_tokens:20}};
 const p=coralFragmentCostPlan({fragments,receipts:[{fragment_index:0,usage}]});
 assert.equal(p.total_estimate_microusd,257880);assert.equal(p.per_chapter[0].estimate_microusd,36840);assert.equal(p.confirmed_receipt_cost_microusd,417);
 assert.equal(p.remaining_estimate_microusd,239460);assert.equal(p.internal_reservation_microusd,null);assert.equal(p.demonstrated_external_maximum_microusd,null);assert.equal(p.real_provider_enabled,false);
 assert.equal(coralFragmentCostPlan({fragments,uncertainFragment:0}).resume_allowed,false);
 assert.throws(()=>coralFragmentCostPlan({fragments,receipts:[{fragment_index:1,usage}]}),/UNCONFIRMED/);
});
