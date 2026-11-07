/** Durable sub-fragments for the INERT contract harness. No production transport or key. */
import {mkdir,lstat,rmdir} from 'node:fs/promises';import {join} from 'node:path';
import {createCoralRealtimeContractHarness,CORAL_REALTIME_CANDIDATE,CORAL_TRANSCRIPT_NORMALIZATION,coralTranscriptSha} from './coral-tts-realtime-contract.mjs';
import {audioSha,privateAudioRead,privateAudioDigest,privateAudioVerifiedOpen,durableWrite} from './coral-tts-audio.mjs';
import {coralUsageCostMicrousd} from './coral-tts-cost-plan.mjs';
export function coralFragmentPlan(chapter){
 if(typeof chapter?.text!=='string'||!chapter.text.isWellFormed()||chapter.text.length<1||chapter.text.length>7000||audioSha(chapter.text)!==chapter.sha256)throw Error('CORAL_FRAGMENT_TEXT');
 const chars=Array.from(chapter.text),fragments=[];let start=0;
 while(start<chars.length){let end=Math.min(start+600,chars.length);if(end<chars.length){for(let n=end;n>start+300;n--)if(/[\s.!?;]/u.test(chars[n-1])){end=n;break;}}
  const text=chars.slice(start,end).join('');fragments.push({index:fragments.length,text,sha256:audioSha(text)});start=end;
 }
 return fragments;
}
async function dir(p){await mkdir(p,{recursive:true,mode:0o700});const s=await lstat(p);if(!s.isDirectory()||s.isSymbolicLink()||(process.platform!=='win32'&&((s.mode&0o077)||s.uid!==process.geteuid())))throw Error('CORAL_CHECKPOINT_DIR');}
async function optional(p){try{return JSON.parse(await privateAudioRead(p,150000));}catch(e){if(e.code==='ENOENT')return null;throw e;}}
export function createCoralCheckpointHarness({testOnly=false,exchange,authorize,timeoutMs=1000,pauseAfter=null}={}){
 if(testOnly!==true||typeof exchange!=='function'||typeof authorize!=='function')throw Error('CORAL_REAL_PROVIDER_DISABLED');
 const inert=createCoralRealtimeContractHarness({testOnly:true,exchange,timeoutMs,maxOutputTokens:2048});
 const authority=async p=>{if(await authorize(p)!==true)throw Error('CORAL_CHECKPOINT_AUTHORITY');};
 function identity(p){if(!/^[a-f0-9]{48}$/.test(p.requestId||'')||!p.checkpointDir||!Number.isInteger(p.index)||p.index<0||p.index>6)throw Error('CORAL_CHECKPOINT_ID');
  const fragments=coralFragmentPlan(p.chapter);return {contract:'cdc-coral-subfragments-v1',request_id:p.requestId,chapter:p.chapter.id,index:p.index,text_sha256:p.chapter.sha256,
   model:CORAL_REALTIME_CANDIDATE.model,voice:'coral',max_output_tokens:2048,fragments:fragments.map(({index,sha256})=>({index,sha256})),texts:fragments};}
 async function inspect(p){
  const expected=identity(p),{texts,...plan}=expected,saved=await optional(join(p.checkpointDir,'plan.json'));
  if(!saved||JSON.stringify(saved)!==JSON.stringify(plan))throw Error('CORAL_CHECKPOINT_ID');
  const receipts=[];let missing=false;
  for(const fragment of texts){
   const stem=String(fragment.index).padStart(2,'0'),receipt=await optional(join(p.checkpointDir,stem+'.receipt.json')),attempt=await optional(join(p.checkpointDir,stem+'.attempt.json'));
   if(!receipt){if(attempt)throw Error('CORAL_REALTIME_UNCERTAIN_NO_RETRY');missing=true;continue;}
   if(missing||!attempt||attempt.text_sha256!==fragment.sha256||receipt.text_sha256!==fragment.sha256
    ||receipt.transcript_normalization!==CORAL_TRANSCRIPT_NORMALIZATION||receipt.transcript_sha256!==coralTranscriptSha(fragment.text)
    ||receipt.model!==plan.model||receipt.voice!==plan.voice||receipt.cost_microusd!==coralUsageCostMicrousd(receipt.usage)
    ||receipt.usage.output_tokens>2048||!/^resp_[a-zA-Z0-9_]{1,100}$/.test(receipt.response_id||'')||receipts.some(r=>r.response_id===receipt.response_id))throw Error('CORAL_CHECKPOINT_RECEIPT');
   const file=join(p.checkpointDir,stem+'.wav'),digest=await privateAudioDigest(file,10000000);
   if(digest.sha256!==receipt.sha256||digest.bytes!==receipt.bytes||receipt.bytes<46||(receipt.bytes-44)%2)throw Error('CORAL_CHECKPOINT_HASH');
   receipts.push(receipt);
  }
  return {texts,plan,receipts};
 }
 async function checkpointStatus(p){try{await authority(p);const s=await inspect(p);return {safe_to_resume:true,completed_fragments:s.receipts.length,total_fragments:s.texts.length,observed_microusd:s.receipts.reduce((n,r)=>n+r.cost_microusd,0),external_maximum_microusd:null};}catch{return {safe_to_resume:false};}}
 async function synthesize(p){
  await authority(p);await dir(p.checkpointDir);const lock=join(p.checkpointDir,'.lock');await mkdir(lock,{mode:0o700});
  try{
   const {texts,...plan}=identity(p),saved=await optional(join(p.checkpointDir,'plan.json'));
   if(!saved)await durableWrite(join(p.checkpointDir,'plan.json'),JSON.stringify(plan));
   let current=await inspect(p);
   for(let n=current.receipts.length;n<texts.length;n++){
    await authority(p);const fragment=texts[n],stem=String(n).padStart(2,'0');
    await durableWrite(join(p.checkpointDir,stem+'.attempt.json'),JSON.stringify({text_sha256:fragment.sha256,max_output_tokens:2048}));
    const wav=await inert.synthesize({chapter:{text:fragment.text}}),receipt=inert.lastReceipt();
    if(wav.length>10000000||receipt.text_sha256!==fragment.sha256||receipt.transcript_normalization!==CORAL_TRANSCRIPT_NORMALIZATION
     ||receipt.transcript_sha256!==coralTranscriptSha(fragment.text))throw Error('CORAL_REALTIME_UNCERTAIN_NO_RETRY');
    await durableWrite(join(p.checkpointDir,stem+'.wav'),wav);
    await durableWrite(join(p.checkpointDir,stem+'.receipt.json'),JSON.stringify({...receipt,text_sha256:fragment.sha256,sha256:audioSha(wav),bytes:wav.length}));
    if(pauseAfter===n+1&&n+1<texts.length)throw Error('CORAL_CHECKPOINT_PAUSED');
   }
   await authority(p);current=await inspect(p);const frames=current.receipts.reduce((n,r)=>n+(r.bytes-44)/2,0);
   if(frames*2+44>32000000)throw Error('CORAL_CHECKPOINT_SIZE');
   const header=Buffer.alloc(44);header.write('RIFF');header.writeUInt32LE(frames*2+36,4);header.write('WAVEfmt ',8);header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);header.writeUInt16LE(1,22);header.writeUInt32LE(24000,24);header.writeUInt32LE(48000,28);header.writeUInt16LE(2,32);header.writeUInt16LE(16,34);header.write('data',36);header.writeUInt32LE(frames*2,40);
   return (async function*(){yield header;for(let n=0;n<current.receipts.length;n++){await authority(p);const opened=await privateAudioVerifiedOpen(join(p.checkpointDir,String(n).padStart(2,'0')+'.wav'),current.receipts[n].sha256,10000000);try{for await(const chunk of opened.handle.createReadStream({start:44,autoClose:false,highWaterMark:65536}))yield chunk;}finally{await opened.handle.close();}}})();
  }finally{await rmdir(lock);}
 }
 return {kind:'openai-realtime-unqualified',paid:true,qualified:false,synthesize,checkpointStatus};
}
