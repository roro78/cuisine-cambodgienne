/** Rates verified against official OpenAI pricing, 2026-11-06. No API/network/key. */
export const CORAL_REALTIME_RATES={input_text:0.60,output_text:2.40,output_audio:20,input_audio:10};
export function coralUsageCostMicrousd(usage){
 const integer=n=>Number.isSafeInteger(n)&&n>=0;
 if(!usage||!integer(usage.input_tokens)||!integer(usage.output_tokens))throw Error('CORAL_USAGE_UNCONFIRMED');
 const i=usage.input_token_details,o=usage.output_token_details;
 if(!i||!o||!integer(i.text_tokens)||i.audio_tokens!==0||!integer(o.text_tokens)||!integer(o.audio_tokens)
  ||i.text_tokens!==usage.input_tokens||o.text_tokens+o.audio_tokens!==usage.output_tokens)
  throw Error('CORAL_USAGE_UNCONFIRMED');
 // No caching discount assumed. Reject unknown billed modalities rather than price them at zero.
 for(const k of Object.keys(i))if(!['text_tokens','audio_tokens','cached_tokens','cached_tokens_details'].includes(k))throw Error('CORAL_USAGE_UNCONFIRMED');
 for(const k of Object.keys(o))if(!['text_tokens','audio_tokens'].includes(k))throw Error('CORAL_USAGE_UNCONFIRMED');
 return Math.ceil(i.text_tokens*0.6+o.text_tokens*2.4+o.audio_tokens*20);
}
export function coralCostPlan({seconds,textTokensEstimate,instructionTokensPerChapter=200,chapters=7,maxOutputTokens=4096}){
 if(!Number.isFinite(seconds)||seconds<=0||!Number.isSafeInteger(textTokensEstimate)||textTokensEstimate<=0
  ||!Number.isSafeInteger(instructionTokensPerChapter)||instructionTokensPerChapter<1||chapters!==7
  ||!Number.isSafeInteger(maxOutputTokens)||maxOutputTokens<1||maxOutputTokens>4096)throw Error('CORAL_COST_INPUT');
 // Official Realtime guide: assistant audio token ≈ 50 ms, with special-token overhead.
 const input=textTokensEstimate+chapters*instructionTokensPerChapter;
 const estimated=Math.ceil(input*0.6+textTokensEstimate*2.4+seconds*20*20);
 return {model:'gpt-realtime-2.1-mini',estimate_microusd:estimated,
  assumptions:{audio_tokens_per_second:20,text_tokens_estimate:textTokensEstimate,instruction_tokens_per_chapter:instructionTokensPerChapter,
   fresh_context_per_chapter:true,no_audio_input:true,no_tools:true,no_cache_discount:true},
  output_token_ceiling:chapters*maxOutputTokens,
  conditional_output_cost_ceiling_microusd:chapters*maxOutputTokens*20,
  estimated_exceeds_output_capacity:seconds*20+textTokensEstimate>chapters*maxOutputTokens,
  demonstrated_external_maximum_microusd:null,internal_reservation_microusd:null,real_provider_enabled:false};
}
