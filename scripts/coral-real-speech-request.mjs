/**
 * Approved private Studio -> worker payload for REAL Coral Speech.
 * Offline canonicalization only: never sends audio requests or publishes text.
 * The existing simulated-tone contract remains separate.
 */
import {createHash} from 'node:crypto';
import {TTS_CHAPTER_IDS as IDS} from './coral-tts-audio.mjs';
import {planCoralSpeechFragments} from './coral-speech-transport.mjs';

export const REAL_SPEECH_REQUEST_CONTRACT='cdc-coral-private-speech-request-v1';
export const REAL_SPEECH_PROVIDER='openai-speech-coral-093-v1';
const sha=data=>createHash('sha256').update(data).digest('hex');
const hex=/^[0-9a-f]{64}$/;
const identity=/^[0-9a-f]{48}$/;
const expected=['contract','creation_id','creation_version','binding_sha256','recipe_sha256','chapters',
  'voice','provider','speed_milli','rights_sha256','reviews_sha256','max_spend_microusd','request_id'];
export function coralRealSpeechSourceKey(r){
 return sha([r.creation_id,r.creation_version,r.binding_sha256,r.recipe_sha256,
  ...(r.chapters||[]).map(c=>c.sha256),r.voice,r.provider,r.speed_milli].join('\n'));
}
export function coralRealSpeechRequestId(r){
 return sha([coralRealSpeechSourceKey(r),r.rights_sha256,r.reviews_sha256,r.max_spend_microusd].join('\n')).slice(0,48);
}
export function validateCoralRealSpeechRequest(r){
 if(!r||typeof r!=='object'||Array.isArray(r)||Object.keys(r).length!==expected.length
  ||expected.some(k=>!Object.hasOwn(r,k))
  ||r.contract!==REAL_SPEECH_REQUEST_CONTRACT
  ||!/^c-[a-f0-9]{24}$/.test(r.creation_id||'')
  ||!Number.isSafeInteger(r.creation_version)||r.creation_version<1||r.creation_version>9999
  ||!['binding_sha256','recipe_sha256','rights_sha256','reviews_sha256'].every(k=>hex.test(r[k]||''))
  ||r.voice!=='coral'||r.provider!==REAL_SPEECH_PROVIDER||r.speed_milli!==930
  ||r.max_spend_microusd!==1000000||!identity.test(r.request_id||'')
  ||!Array.isArray(r.chapters)||r.chapters.length!==7
  ||r.chapters.some((c,i)=>!c||Object.keys(c).length!==3||c.id!==IDS[i]
   ||typeof c.text!=='string'||!c.text.isWellFormed()
   ||c.text.length<120||c.text.length>7000
   ||!hex.test(c.sha256||'')||sha(c.text)!==c.sha256)
  ||Buffer.byteLength(JSON.stringify(r),'utf8')>90000
  ||r.request_id!==coralRealSpeechRequestId(r))
  throw Error('CORAL_REAL_SPEECH_REQUEST');
 return r;
}
/** Only this projection may be used in a no-text Studio authority challenge. */
export function coralRealSpeechAuthorityProjection(request){
 const r=validateCoralRealSpeechRequest(request);
 return {...r,chapters:r.chapters.map(({id,sha256})=>({id,sha256}))};
}
/**
 * First fragment of intro is reusable as the pre-listening sample.
 * NO synthesis of the rest is allowed before separate human audio approval.
 */
export function coralRealSpeechPlan(request){
 const r=validateCoralRealSpeechRequest(request);
 const fragments=r.chapters.map((chapter,i)=>({
  id:chapter.id,index:i,
  parts:planCoralSpeechFragments(chapter.text).map(p=>({index:p.index,sha256:p.sha256,
   bytes:Buffer.byteLength(p.text,'utf8')}))
 }));
 const first=fragments[0].parts[0];
 return {request_id:r.request_id,source_key:coralRealSpeechSourceKey(r),
  chapters:fragments,fragment_count:fragments.reduce((n,c)=>n+c.parts.length,0),
  preview:{chapter:'intro',fragment_index:0,text_sha256:first.sha256,
   reusable_for_final:true},authorized_spend_microusd:r.max_spend_microusd,
  generation_enabled:false,audio_approved:false};
}
function wavSamples(buffer){
 if(!Buffer.isBuffer(buffer)||buffer.length<46||buffer.length>32000000||
  buffer.toString('ascii',0,4)!=='RIFF'||buffer.toString('ascii',8,12)!=='WAVE'||
  buffer.readUInt32LE(4)!==buffer.length-8)throw Error('CORAL_REAL_WAV');
 let off=12,fmt=false,data=null;
 while(off+8<=buffer.length){
  const name=buffer.toString('ascii',off,off+4),n=buffer.readUInt32LE(off+4),start=off+8,end=start+n;
  if(end>buffer.length)throw Error('CORAL_REAL_WAV');
  if(name==='fmt '){
   if(fmt||n<16||buffer.readUInt16LE(start)!==1||buffer.readUInt16LE(start+2)!==1
    ||buffer.readUInt32LE(start+4)!==24000||buffer.readUInt16LE(start+12)!==2
    ||buffer.readUInt16LE(start+14)!==16||buffer.readUInt32LE(start+8)!==48000)
    throw Error('CORAL_REAL_WAV');
   fmt=true;
  }else if(name==='data'){
   if(data||n<2||n%2)throw Error('CORAL_REAL_WAV');
   data=buffer.subarray(start,end);
  }
  off=end+(n%2);
 }
 if(!fmt||!data||off!==buffer.length)throw Error('CORAL_REAL_WAV');
 return data;
}
/** An in-memory, checked WAV chapter; no extra voice calls, no re-encoding. */
export function coralRealSpeechAssembleChapterWav(fragmentWavs){
 if(!Array.isArray(fragmentWavs)||fragmentWavs.length<1||fragmentWavs.length>24)
  throw Error('CORAL_REAL_WAV_FRAGMENTS');
 const audio=fragmentWavs.map(wavSamples),bytes=audio.reduce((n,b)=>n+b.length,0);
 if(bytes>31999956)throw Error('CORAL_REAL_WAV_LENGTH');
 const wav=Buffer.alloc(44+bytes);
 wav.write('RIFF',0);wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);
 wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);
 wav.writeUInt32LE(24000,24);wav.writeUInt32LE(48000,28);
 wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);
 wav.write('data',36);wav.writeUInt32LE(bytes,40);
 let off=44;for(const b of audio){b.copy(wav,off);off+=b.length;}
 return {wav,sha256:sha(wav),duration_seconds:bytes/48000,fragments:audio.length};
}
