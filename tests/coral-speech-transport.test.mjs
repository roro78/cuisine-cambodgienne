import test from 'node:test';
import assert from 'node:assert/strict';
import {CORAL_SPEECH_PROFILE,coralSpeechSha256,planCoralSpeechFragments,createCoralSpeechTransport} from '../scripts/coral-speech-transport.mjs';
const text='Préparez le poisson. Ajoutez le lait de coco, puis mélangez doucement. ';
const request_id='a'.repeat(48);
const fragment={request_id,fragment_index:0,text,text_sha256:coralSpeechSha256(text)};
function wav(rate=24000,channels=1){
 const size=4800,b=Buffer.alloc(44+size);
 b.write('RIFF',0);b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);
 b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(channels,22);
 b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*channels*2,28);
 b.writeUInt16LE(channels*2,32);b.writeUInt16LE(16,34);
 b.write('data',36);b.writeUInt32LE(size,40);return b;
}
const reservation={request_id,fragment_index:0,text_sha256:coralSpeechSha256(text),
 model:CORAL_SPEECH_PROFILE.model,voice:'coral',reserved_microusd:10000,durable_attempt_written:true};
const fakeKey='sk-'+'x'.repeat(25);
function harness({authorize=async()=>true,reserve=async()=>reservation,readKey=()=>fakeKey,fetcher}={}){
 return createCoralSpeechTransport({enabled:true,authorize,reserve,readKey,
  fetcher:fetcher||async()=>new Response(wav(),{status:200,headers:{'content-type':'audio/wav'}})});
}
test('disabled by default, historical Coral settings pinned',()=>{
 assert.equal(CORAL_SPEECH_PROFILE.enabled,false);assert.equal(CORAL_SPEECH_PROFILE.qualified,false);
 assert.equal(CORAL_SPEECH_PROFILE.voice,'coral');assert.equal(CORAL_SPEECH_PROFILE.speed,0.93);
 assert.throws(()=>createCoralSpeechTransport(),/DISABLED/);
});
test('splitting preserves all bytes, punctuation, whitespace, unicode and SHA',()=>{
 const original=('À feu doux,\n'+text+' 🥥\n').repeat(80),parts=planCoralSpeechFragments(original);
 assert.ok(parts.length>7);assert.equal(parts.map(p=>p.text).join(''),original);
 for(const p of parts){assert.ok(Array.from(p.text).length<=320);assert.equal(p.sha256,coralSpeechSha256(p.text));}
 assert.throws(()=>planCoralSpeechFragments('\ud800'),/TEXT/);
});
test('authority, key, receipt and text checksum fail before network',async()=>{
 let calls=0;const fetcher=async()=>{calls++;return new Response(wav(),{headers:{'content-type':'audio/wav'}});};
 await assert.rejects(harness({authorize:async()=>false,fetcher}).synthesize(fragment),/AUTHORITY/);
 await assert.rejects(harness({readKey:()=>'',fetcher}).synthesize(fragment),/SECRET/);
 await assert.rejects(harness({reserve:async()=>({...reservation,durable_attempt_written:false}),fetcher}).synthesize(fragment),/RESERVATION/);
 await assert.rejects(harness({fetcher}).synthesize({...fragment,text_sha256:'0'.repeat(64)}),/FRAGMENT_INVALID/);
 assert.equal(calls,0);
});
test('one fake HTTP exchange uses correct model, voice, speed and returns private receipt',async()=>{
 const order=[];let calls=0;
 const p=harness({authorize:async()=>{order.push('authorize');return true;},
  readKey:()=>{order.push('key');return fakeKey;},
  reserve:async()=>{order.push('reserve');return reservation;},
  fetcher:async(url,opts)=>{
   order.push('fetch');calls++;assert.equal(url,'https://api.openai.com/v1/audio/speech');
   assert.equal(opts.method,'POST');assert.equal(opts.headers.Authorization,'Bearer '+fakeKey);
   const body=JSON.parse(opts.body);
   assert.equal(body.model,'gpt-4o-mini-tts');assert.equal(body.voice,'coral');
   assert.equal(body.speed,0.93);assert.equal(body.response_format,'wav');assert.equal(body.input,text);
   return new Response(wav(),{headers:{'content-type':'audio/wav'}});
  }});
 const result=await p.synthesize(fragment);
 assert.deepEqual(order,['authorize','key','reserve','fetch']);assert.equal(calls,1);
 assert.equal(result.receipt.provider_cost_microusd,null);assert.equal(result.receipt.audio_approved,false);
 assert.equal(result.receipt.wav_sha256,coralSpeechSha256(result.wav));
 assert.equal(result.receipt.duration_seconds,0.1);
 assert.equal(JSON.stringify(result.receipt).includes(text),false);
});
test('network errors, upstream refusal and invalid WAV never retry or leak secrets',async()=>{
 for(const fetcher of [
  async()=>{throw Error('secret '+fakeKey+' private '+text);},
  async()=>new Response('error '+text,{status:403,headers:{'content-type':'application/json'}}),
  async()=>new Response(wav(16000),{headers:{'content-type':'audio/wav'}}),
  async()=>new Response(wav(24000,2),{headers:{'content-type':'audio/wav'}})
 ]){
  let calls=0;const p=harness({fetcher:async(...args)=>{calls++;return fetcher(...args);}});
  await assert.rejects(p.synthesize(fragment),e=>e.message==='CORAL_SPEECH_UNCERTAIN_NO_RETRY'
   &&!e.message.includes(fakeKey)&&!e.message.includes(text));
  assert.equal(calls,1);
 }
});
test('invalid text and malformed fragments do not reach the provider',async()=>{
 let calls=0;const x=harness({fetcher:async()=>{calls++;throw Error('MUST_NOT_CALL');}});
 const long='X'.repeat(321);
 await assert.rejects(x.synthesize({...fragment,text:long,text_sha256:coralSpeechSha256(long)}),/FRAGMENT_INVALID/);
 assert.throws(()=>planCoralSpeechFragments('\u0000'+text),/TEXT/);
 assert.equal(calls,0);
});
