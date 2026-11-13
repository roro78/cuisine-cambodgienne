import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {TTS_CHAPTER_IDS} from '../scripts/coral-tts-audio.mjs';
import {REAL_SPEECH_REQUEST_CONTRACT,REAL_SPEECH_PROVIDER,coralRealSpeechRequestId} from '../scripts/coral-real-speech-request.mjs';
import {createCoralSpeechPreviewJobs} from '../scripts/coral-speech-preview-jobs.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
function request(){
 const chapters=TTS_CHAPTER_IDS.map((id,i)=>{
  const text=('Texte sans donnée privée pour une synthèse vocale de test, étape '+i+'. ').repeat(14);
  return {id,text,sha256:sha(text)};
 });
 const r={contract:REAL_SPEECH_REQUEST_CONTRACT,creation_id:'c-'+'3'.repeat(24),creation_version:4,
  binding_sha256:'a'.repeat(64),recipe_sha256:'b'.repeat(64),chapters,voice:'coral',
  provider:REAL_SPEECH_PROVIDER,speed_milli:930,rights_sha256:'c'.repeat(64),
  reviews_sha256:'d'.repeat(64),max_spend_microusd:1000000};
 r.request_id=coralRealSpeechRequestId(r);return r;
}
function wav(){
 const b=Buffer.alloc(44+4800);b.write('RIFF');b.writeUInt32LE(b.length-8,4);
 b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);
 b.writeUInt16LE(1,22);b.writeUInt32LE(24000,24);b.writeUInt32LE(48000,28);
 b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);
 b.writeUInt32LE(4800,40);return b;
}
async function fixture(fn){
 const root=await mkdtemp(join(tmpdir(),'coral-preview-private-'));
 const budget=await mkdtemp(join(tmpdir(),'coral-preview-budget-'));
 try{return await fn(root,budget);}finally{
  await rm(root,{recursive:true,force:true});
  await rm(budget,{recursive:true,force:true});
 }
}
function provider({fail=false,onCall=()=>{}}={}){
 return {kind:'openai-speech-coral-candidate',paid:true,
  async synthesize({request_id,fragment_index,text,text_sha256}){
   onCall({text,request_id,fragment_index});
   if(fail)throw Error('private provider failure - must not leak');
   return {wav:wav(),receipt:{request_id,fragment_index,text_sha256,model:'gpt-4o-mini-tts',
    voice:'coral',provider_billing_verified:false}};
  }};
}
test('disabled unless separate human spending and live Studio authority callbacks exist',async()=>{
 assert.throws(()=>createCoralSpeechPreviewJobs(),/DISABLED/);
 await fixture(async(folder,budgetDir)=>{
  let count=0;
  const jobs=createCoralSpeechPreviewJobs({provider:provider({onCall:()=>count++}),
   authorize:async()=>true,spendingApproved:async()=>false,budgetDir});
  await assert.rejects(jobs.run(request(),request().request_id,folder),/SPENDING_NOT_APPROVED/);
  assert.equal(count,0);
 });
});
test('one durable private Coral preview, read-only playback, never redeliver text or re-bill',async()=>{
 await fixture(async(folder,budgetDir)=>{
  let count=0;const r=request();
  const jobs=createCoralSpeechPreviewJobs({provider:provider({onCall:()=>count++}),
   authorize:async()=>true,spendingApproved:async()=>true,budgetDir});
  assert.equal((await jobs.state(r,r.request_id,folder)).status,'queued');
  const preview=await jobs.run(r,r.request_id,folder);
  assert.equal(preview.status,'awaiting_preview_approval');assert.equal(count,1);
  assert.equal(preview.preview.reusable,true);assert.equal(preview.preview.duration,0.1);
  const opened=await jobs.previewStream(r,r.request_id,folder);
  try{assert.equal(opened.sha256,sha(wav()));assert.equal(opened.size,4844);}finally{await opened.handle.close();}
  assert.equal((await jobs.run(r,r.request_id,folder)).status,'awaiting_preview_approval');
  assert.equal(count,1);
  await assert.rejects(jobs.resume(),/AWAITING_APPROVAL/);
  await assert.rejects(jobs.audioStream(),/NOT_GENERATED/);
 });
});
test('uncertain provider response leaves durable attempt and never sends again',async()=>{
 await fixture(async(folder,budgetDir)=>{
  let count=0;const r=request();
  const jobs=createCoralSpeechPreviewJobs({provider:provider({fail:true,onCall:()=>count++}),
   authorize:async()=>true,spendingApproved:async()=>true,budgetDir});
  await assert.rejects(jobs.run(r,r.request_id,folder),/UNCERTAIN_NO_RETRY/);
  assert.equal((await jobs.state(r,r.request_id,folder)).status,'uncertain');
  await assert.rejects(jobs.run(r,r.request_id,folder),/UNCERTAIN_NO_RETRY/);
  assert.equal(count,1);
 });
});
