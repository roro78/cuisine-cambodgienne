/**
 * Candidate private OpenAI Speech transport for a Coral preview.
 * Not wired to the Studio, production worker or automated jobs.
 * Caller MUST verify live Studio authority, cumulative durable budget reserve
 * and a unique irrevocable attempt checkpoint BEFORE invoking.
 * No retry, logging, public URLs, key in PHP, or Squaia dependency.
 */
import {createHash} from 'node:crypto';
import {readCoralOpenAISecret} from './coral-openai-secret.mjs';
const ENDPOINT='https://api.openai.com/v1/audio/speech';
const MAX_FRAGMENT_CODEPOINTS=320,MAX_FRAGMENT_BYTES=1280,MAX_WAV_BYTES=32000000;
const HEX64=/^[a-f0-9]{64}$/,ID48=/^[a-f0-9]{48}$/;
const INSTRUCTIONS='Narration culinaire naturelle en français de France. Voix féminine Coral chaleureuse et spontanée. Expliquer le geste comme une vraie cuisinière encourageante, avec un rythme convivial. Ne pas inventer de quantités ni prétendre interagir en direct.';
export const CORAL_SPEECH_PROFILE=Object.freeze({
 provider:'openai-speech-private-candidate',model:'gpt-4o-mini-tts',
 voice:'coral',speed:0.93,response_format:'wav',
 endpoint:ENDPOINT,enabled:false,qualified:false,
 max_fragment_codepoints:MAX_FRAGMENT_CODEPOINTS
});
export const coralSpeechSha256=value=>createHash('sha256').update(value).digest('hex');

/** Preserve all source characters and whitespace exactly. */
export function planCoralSpeechFragments(text){
 if(typeof text!=='string'||!text.isWellFormed()||!text.length||text.length>7000
  ||/[\u0000-\u0008\u000e-\u001f]/u.test(text))throw Error('CORAL_SPEECH_TEXT');
 const chars=Array.from(text),parts=[];
 for(let start=0;start<chars.length;){
  let end=Math.min(start+MAX_FRAGMENT_CODEPOINTS,chars.length);
  if(end<chars.length)for(let n=end;n>start+MAX_FRAGMENT_CODEPOINTS/2;n--)
   if(/[\s.!?…;]/u.test(chars[n-1])){end=n;break;}
  const part=chars.slice(start,end).join('');
  if(Buffer.byteLength(part,'utf8')>MAX_FRAGMENT_BYTES)throw Error('CORAL_SPEECH_FRAGMENT_BYTES');
  parts.push({index:parts.length,text:part,sha256:coralSpeechSha256(part)});start=end;
 }
 if(parts.map(x=>x.text).join('')!==text)throw Error('CORAL_SPEECH_TEXT_LOSS');
 return parts;
}
function validateFragment(p){
 if(!p||!ID48.test(p.request_id||'')||!Number.isSafeInteger(p.fragment_index)||p.fragment_index<0
  ||p.fragment_index>255||typeof p.text!=='string'||!p.text.isWellFormed()
  ||Array.from(p.text).length<1||Array.from(p.text).length>MAX_FRAGMENT_CODEPOINTS
  ||Buffer.byteLength(p.text,'utf8')>MAX_FRAGMENT_BYTES
  ||/[\u0000-\u0008\u000e-\u001f]/u.test(p.text)
  ||!HEX64.test(p.text_sha256||'')||coralSpeechSha256(p.text)!==p.text_sha256)
  throw Error('CORAL_SPEECH_FRAGMENT_INVALID');
 return {request_id:p.request_id,fragment_index:p.fragment_index,text_sha256:p.text_sha256,
  model:CORAL_SPEECH_PROFILE.model,voice:CORAL_SPEECH_PROFILE.voice};
}
function verifyWave(b){
 if(!Buffer.isBuffer(b)||b.length<46||b.length>MAX_WAV_BYTES
  ||b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WAVE'
  ||b.readUInt32LE(4)!==b.length-8)throw Error('CORAL_SPEECH_WAV_INVALID');
 let fmt=false,hasData=false,off=12,frames=0;
 while(off+8<=b.length){
  const chunk=b.toString('ascii',off,off+4),size=b.readUInt32LE(off+4),start=off+8,end=start+size;
  if(end>b.length)throw Error('CORAL_SPEECH_WAV_INVALID');
  if(chunk==='fmt '){
   if(fmt||size<16||b.readUInt16LE(start)!==1||b.readUInt16LE(start+2)!==1
    ||b.readUInt32LE(start+4)!==24000||b.readUInt32LE(start+8)!==48000
    ||b.readUInt16LE(start+12)!==2||b.readUInt16LE(start+14)!==16)
    throw Error('CORAL_SPEECH_WAV_INVALID');
   fmt=true;
  }else if(chunk==='data'){
   if(hasData||size<2||size%2)throw Error('CORAL_SPEECH_WAV_INVALID');
   hasData=true;frames=size/2;
  }
  off=end+(size%2);
 }
 if(!fmt||!hasData||off!==b.length||frames/24000>600)throw Error('CORAL_SPEECH_WAV_INVALID');
 return frames/24000;
}

/**
 * This is transport, not a production budget ledger or Studio integration.
 * enabled=true is NOT proof of qualification. The injected reserve must
 * durably reserve cumulative budget and write the attempt marker exactly once.
 * Speech does not expose an independently verified per-call cost receipt.
 */
export function createCoralSpeechTransport({enabled=false,authorize,reserve,
 readKey=readCoralOpenAISecret,fetcher=fetch,timeoutMs=90000}={}){
 if(enabled!==true||typeof authorize!=='function'||typeof reserve!=='function'
  ||typeof readKey!=='function'||typeof fetcher!=='function'
  ||!Number.isInteger(timeoutMs)||timeoutMs<1000||timeoutMs>180000)
  throw Error('CORAL_SPEECH_PROVIDER_DISABLED');
 return {kind:'openai-speech-coral-candidate',paid:true,qualified:false,
  async synthesize(fragment){
   const identity=validateFragment(fragment);
   let allowed=false;try{allowed=await authorize(identity);}catch{}
   if(allowed!==true)throw Error('CORAL_SPEECH_AUTHORITY');
   let key;try{key=await readKey();}catch{throw Error('CORAL_SPEECH_SECRET_UNAVAILABLE');}
   if(typeof key!=='string'||!/^sk-[A-Za-z0-9_-]{18,}$/.test(key))
    throw Error('CORAL_SPEECH_SECRET_UNAVAILABLE');
   let reservation;
   try{reservation=await reserve(identity);}catch{throw Error('CORAL_SPEECH_RESERVATION_REQUIRED');}
   if(!reservation||reservation.request_id!==identity.request_id
    ||reservation.fragment_index!==identity.fragment_index
    ||reservation.text_sha256!==identity.text_sha256
    ||reservation.model!==identity.model||reservation.voice!==identity.voice
    ||reservation.durable_attempt_written!==true
    ||!Number.isSafeInteger(reservation.reserved_microusd)
    ||reservation.reserved_microusd<1||reservation.reserved_microusd>1000000)
    throw Error('CORAL_SPEECH_RESERVATION_REQUIRED');
   const body={model:identity.model,voice:identity.voice,speed:0.93,response_format:'wav',
    instructions:INSTRUCTIONS,input:fragment.text};
   // Exactly ONE billable dispatch; every subsequent failure is uncertain.
   try{
    const response=await fetcher(ENDPOINT,{method:'POST',headers:{
     Authorization:'Bearer '+key,'Content-Type':'application/json',
     Accept:'audio/wav','Cache-Control':'no-store'
    },body:JSON.stringify(body),signal:AbortSignal.timeout(timeoutMs)});
    if(response?.status!==200||!/^audio\/(?:wav|x-wav)(?:;|$)/i.test(response.headers?.get?.('content-type')||''))
     throw Error('UPSTREAM');
    const contentLength=Number(response.headers.get('content-length')||'0');
    if(!Number.isSafeInteger(contentLength)||contentLength>MAX_WAV_BYTES)throw Error('UPSTREAM_SIZE');
    if(!response.body||typeof response.body.getReader!=='function')throw Error('UPSTREAM_STREAM');
    const reader=response.body.getReader(),buffers=[];let total=0;
    try{for(;;){
     const chunk=await reader.read();if(chunk.done)break;
     if(!(chunk.value instanceof Uint8Array)||(total+=chunk.value.length)>MAX_WAV_BYTES)
      throw Error('UPSTREAM_SIZE');
     buffers.push(Buffer.from(chunk.value));
    }}finally{reader.releaseLock();}
    const wav=Buffer.concat(buffers,total),duration=verifyWave(wav);
    return {wav,receipt:{...identity,format:'wav',sample_rate:24000,channels:1,
     duration_seconds:duration,wav_sha256:coralSpeechSha256(wav),
     reserved_microusd:reservation.reserved_microusd,provider_cost_microusd:null,
     provider_billing_verified:false,audio_approved:false}};
   }catch{
    // Never reveal provider response, source text or secrets; never retry.
    throw Error('CORAL_SPEECH_UNCERTAIN_NO_RETRY');
   }
  }
 };
}
