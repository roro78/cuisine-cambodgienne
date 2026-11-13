/**
 * Preview-only candidate for the existing PRIVATE Coral job gateway.
 * Not wired into the runtime. No production enable flag, no full generation.
 * A verified preview is reused in future generation; never automatically retried.
 */
import {mkdir,lstat} from 'node:fs/promises';
import {join} from 'node:path';
import {reserveCoralBudget} from './coral-external-job-provider.mjs';
import {validateCoralRealSpeechRequest,coralRealSpeechPlan,coralRealSpeechAssembleChapterWav} from './coral-real-speech-request.mjs';
import {privateAudioRead,privateAudioVerifiedOpen,durableAudioCommit,durableWrite,atomicJson,audioSha} from './coral-tts-audio.mjs';
const MAX_ATTEMPTS=1;
async function privateDirectory(dir){
 await mkdir(dir,{recursive:true,mode:0o700});
 const s=await lstat(dir);
 if(!s.isDirectory()||s.isSymbolicLink()||(process.platform!=='win32'&&((s.mode&0o077)||s.uid!==process.geteuid())))
  throw Error('CORAL_PREVIEW_STORE');
}
async function optional(file){
 try{return JSON.parse((await privateAudioRead(file,12000)).toString('utf8'));}
 catch(e){if(e.code==='ENOENT')return null;throw e;}
}
export function createCoralSpeechPreviewJobs({
 provider,authorize,spendingApproved,budgetDir,maxDailyUsd=0.75,maxMonthlyUsd=1
}={}){
 if(provider?.kind!=='openai-speech-coral-candidate'||provider.paid!==true
  ||typeof provider.synthesize!=='function'||typeof authorize!=='function'
  ||typeof spendingApproved!=='function'||typeof budgetDir!=='string'||!budgetDir
  ||maxDailyUsd!==0.75||maxMonthlyUsd!==1)
  throw Error('CORAL_PREVIEW_DISABLED');
 const dirFor=folder=>join(folder,'real-tts');
 const authority=async r=>{
  if(await authorize(r)!==true)throw Error('CORAL_PREVIEW_AUTHORITY');
 };
 async function inspect(r,folder){
  validateCoralRealSpeechRequest(r);const dir=dirFor(folder);
  const receipt=await optional(join(dir,'preview.receipt.json'));
  const attempt=await optional(join(dir,'preview.attempt.json'));
  if(receipt){
   const expected=coralRealSpeechPlan(r).preview;
   if(!attempt||receipt.request_id!==r.request_id||receipt.text_sha256!==expected.text_sha256
    ||attempt.text_sha256!==expected.text_sha256||receipt.sha256!==receipt.wav_sha256)
    throw Error('CORAL_PREVIEW_RECEIPT');
   const f=await privateAudioVerifiedOpen(join(dir,'preview.wav'),receipt.sha256);
   await f.handle.close();
  }
  return {dir,attempt,receipt};
 }
 async function state(r,id,folder){
  if(validateCoralRealSpeechRequest(r).request_id!==id)throw Error('CORAL_PREVIEW_ID');
  const {attempt,receipt}=await inspect(r,folder);
  return {id,status:receipt?'awaiting_preview_approval':attempt?'uncertain':'queued',completed_chapters:0,
   ...(receipt?{preview:{sha256:receipt.sha256,duration:receipt.duration,reusable:true}}:{})};
 }
 async function run(r,id,folder){
  if(validateCoralRealSpeechRequest(r).request_id!==id)throw Error('CORAL_PREVIEW_ID');
  const dir=dirFor(folder);await privateDirectory(dir);await authority(r);
  const before=await inspect(r,folder);
  if(before.receipt)return state(r,id,folder);
  if(before.attempt)throw Error('CORAL_PREVIEW_UNCERTAIN_NO_RETRY');
  // A previous reservation can never be refunded automatically, even if unused.
  // This is an internal reservation, NOT independently verified provider billing.
  if(await spendingApproved(r)!==true)throw Error('CORAL_PREVIEW_SPENDING_NOT_APPROVED');
  const plan=coralRealSpeechPlan(r);
  if(plan.fragment_count>50)throw Error('CORAL_PREVIEW_BUDGET_NOT_DEMONSTRATED');
  const reserve=await reserveCoralBudget({budgetDir,jobId:id,model:r.provider,
   costUsd:0.75,maxDailyUsd,maxMonthlyUsd});
  await durableWrite(join(dir,'reservation.json'),JSON.stringify({request_id:id,
   reserved_usd:reserve.reservedUsd,day:reserve.day,model:r.provider}));
  const first=r.chapters[0],intro=Array.from(first.text);
  const fragment=planCoralIntroFirst(first.text,plan.preview.text_sha256);
  await authority(r);
  // The durable attempt is written BEFORE any potentially billable dispatch.
  await durableWrite(join(dir,'preview.attempt.json'),JSON.stringify({request_id:id,
   text_sha256:fragment.text_sha256,fragment_index:0,model:'gpt-4o-mini-tts',
   voice:'coral',reserved_microusd:15000,max_attempts:MAX_ATTEMPTS}));
  let response;
  try{response=await provider.synthesize({...fragment,request_id:id,fragment_index:0});}
  catch{throw Error('CORAL_PREVIEW_UNCERTAIN_NO_RETRY');}
  if(!Buffer.isBuffer(response?.wav)||response.receipt?.text_sha256!==fragment.text_sha256
   ||response.receipt?.request_id!==id||response.receipt?.fragment_index!==0
   ||response.receipt?.voice!=='coral'||response.receipt?.model!=='gpt-4o-mini-tts'
   ||response.receipt?.provider_billing_verified!==false)
   throw Error('CORAL_PREVIEW_UNCERTAIN_NO_RETRY');
  let checked;
  try{checked=coralRealSpeechAssembleChapterWav([response.wav]);}
  catch{throw Error('CORAL_PREVIEW_UNCERTAIN_NO_RETRY');}
  if(checked.sha256!==audioSha(response.wav))throw Error('CORAL_PREVIEW_UNCERTAIN_NO_RETRY');
  const saved=await durableAudioCommit(join(dir,'preview.wav'),response.wav);
  await durableWrite(join(dir,'preview.receipt.json'),JSON.stringify({request_id:id,
   text_sha256:fragment.text_sha256,sha256:saved.sha256,wav_sha256:saved.sha256,
   duration:checked.duration_seconds,provider_cost_microusd:null,
   approval:false,voice:'coral',model:'gpt-4o-mini-tts'}));
  return state(r,id,folder);
 }
 async function previewStream(r,id,folder){
  if(validateCoralRealSpeechRequest(r).request_id!==id)throw Error('CORAL_PREVIEW_ID');
  await authority(r);const {receipt,dir}=await inspect(r,folder);
  if(!receipt)throw Error('CORAL_PREVIEW_NOT_AVAILABLE');
  return privateAudioVerifiedOpen(join(dir,'preview.wav'),receipt.sha256);
 }
 return {kind:'coral-preview-only-not-production',state,run,previewStream,
  resume:async()=>{throw Error('CORAL_PREVIEW_AWAITING_APPROVAL');},
  audio:async()=>{throw Error('CORAL_REAL_MP3_NOT_GENERATED');},
  audioStream:async()=>{throw Error('CORAL_REAL_MP3_NOT_GENERATED');}
 };
}
function planCoralIntroFirst(text,hash){
 // Plan is deterministic and already checked against all seven approved hashes.
 const codepoints=Array.from(text);let end=Math.min(codepoints.length,320);
 if(end<codepoints.length)for(let n=end;n>160;n--)if(/[\s.!?…;]/u.test(codepoints[n-1])){end=n;break;}
 const fragment=codepoints.slice(0,end).join('');
 if(audioSha(fragment)!==hash)throw Error('CORAL_PREVIEW_SOURCE_CHANGED');
 return {text:fragment,text_sha256:hash};
}
