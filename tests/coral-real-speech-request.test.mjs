import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {TTS_CHAPTER_IDS} from '../scripts/coral-tts-audio.mjs';
import {REAL_SPEECH_REQUEST_CONTRACT,REAL_SPEECH_PROVIDER,coralRealSpeechRequestId,
 validateCoralRealSpeechRequest,coralRealSpeechAuthorityProjection,coralRealSpeechPlan,
 coralRealSpeechAssembleChapterWav} from '../scripts/coral-real-speech-request.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
function request(){
 const chapters=TTS_CHAPTER_IDS.map((id,i)=>{
  const text=('Phrase fictive pour la recette, sans aucune donnée privée. Étape '+i+'.\n').repeat(14);
  return {id,text,sha256:sha(text)};
 });
 const r={contract:REAL_SPEECH_REQUEST_CONTRACT,creation_id:'c-'+'1'.repeat(24),creation_version:4,
  binding_sha256:'a'.repeat(64),recipe_sha256:'b'.repeat(64),chapters,
  voice:'coral',provider:REAL_SPEECH_PROVIDER,speed_milli:930,
  rights_sha256:'c'.repeat(64),reviews_sha256:'d'.repeat(64),max_spend_microusd:1000000};
 r.request_id=coralRealSpeechRequestId(r);return r;
}
function wav(samples){
 const b=Buffer.alloc(44+samples.length*2);
 b.write('RIFF',0);b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);
 b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);
 b.writeUInt32LE(24000,24);b.writeUInt32LE(48000,28);
 b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);
 b.write('data',36);b.writeUInt32LE(samples.length*2,40);
 samples.forEach((n,i)=>b.writeInt16LE(n,44+i*2));return b;
}
test('real Coral payload is exact, separate from simulation, seven approved phases',()=>{
 const r=request();assert.equal(validateCoralRealSpeechRequest(r),r);
 assert.equal(r.provider,'openai-speech-coral-093-v1');assert.equal(r.voice,'coral');
 assert.equal(r.speed_milli,930);assert.equal(r.max_spend_microusd,1000000);
 const bad=structuredClone(r);bad.chapters[0].text+='1';
 assert.throws(()=>validateCoralRealSpeechRequest(bad),/REQUEST/);
 const simulated=structuredClone(r);simulated.voice='test-tone';
 assert.throws(()=>validateCoralRealSpeechRequest(simulated),/REQUEST/);
});
test('authority projection contains SHA only, never private narration',()=>{
 const r=request(),p=coralRealSpeechAuthorityProjection(r);
 assert.equal(p.request_id,r.request_id);assert.equal(p.chapters.length,7);
 assert.equal(Object.hasOwn(p.chapters[0],'text'),false);
 assert.equal(JSON.stringify(p).includes(r.chapters[0].text),false);
});
test('plan preserves source and marks first fragment for reusable human preview',()=>{
 const r=request(),plan=coralRealSpeechPlan(r);
 assert.equal(plan.chapters.length,7);
 assert.ok(plan.fragment_count>=14);
 assert.equal(plan.preview.chapter,'intro');assert.equal(plan.preview.fragment_index,0);
 assert.equal(plan.preview.reusable_for_final,true);assert.equal(plan.generation_enabled,false);
 assert.equal(plan.audio_approved,false);assert.equal(plan.authorized_spend_microusd,1000000);
 assert.equal(JSON.stringify(plan).includes(r.chapters[0].text),false);
});
test('assembly joins PCM exactly without extra TTS or duplicating preview',()=>{
 const a=wav([1,2,3]),b=wav([-4,5]);
 const x=coralRealSpeechAssembleChapterWav([a,b]);
 assert.equal(x.wav.toString('ascii',0,4),'RIFF');
 assert.equal(x.duration_seconds,5/24000);
 assert.deepEqual([...Array(5)].map((_,i)=>x.wav.readInt16LE(44+2*i)),[1,2,3,-4,5]);
 assert.equal(x.sha256,sha(x.wav));assert.equal(x.fragments,2);
 const bad=Buffer.from(b);bad.writeUInt32LE(16000,24);
 assert.throws(()=>coralRealSpeechAssembleChapterWav([a,bad]),/WAV/);
});
test('altered rights, text, order and budget produce rejection or fresh identity',()=>{
 const r=request();
 for(const k of ['rights_sha256','reviews_sha256']){const copy=structuredClone(r);copy[k]='f'.repeat(64);
  assert.throws(()=>validateCoralRealSpeechRequest(copy),/REQUEST/);
  assert.notEqual(coralRealSpeechRequestId(copy),r.request_id);
 }
 const re=structuredClone(r);[re.chapters[0],re.chapters[1]]=[re.chapters[1],re.chapters[0]];
 assert.throws(()=>validateCoralRealSpeechRequest(re),/REQUEST/);
 const overspend=structuredClone(r);overspend.max_spend_microusd=2000000;
 assert.throws(()=>validateCoralRealSpeechRequest(overspend),/REQUEST/);
});
