import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,mkdir,readdir,rename,rm,lstat} from 'node:fs/promises';import {join} from 'node:path';import {tmpdir} from 'node:os';
import {createCoralCheckpointHarness,coralFragmentPlan} from '../scripts/coral-tts-checkpoints.mjs';
import {audioSha,TTS_CHAPTER_IDS,privateAudioDigest,probeAudio} from '../scripts/coral-tts-audio.mjs';
import {createCoralRealtimeContractHarness,CORAL_TRANSCRIPT_NORMALIZATION,normalizeCoralTranscript} from '../scripts/coral-tts-realtime-contract.mjs';
import {createSimulatedTtsJobs,ttsRequestId} from '../scripts/coral-tts-jobs.mjs';import {createJobGateway} from '../scripts/editorial-ai-job-gateway.mjs';
import {backupCoralMedia,restoreCoralMedia} from '../scripts/coral-media-backup.mjs';
import {createCipheriv,createDecipheriv,randomBytes} from 'node:crypto';
function fakeExchange(transform=text=>text.trim()){let calls=0;return {calls:()=>calls,exchange:async({event})=>{
 calls++;const id='resp_transcript_'+calls,text=event.response.input[0].content[0].text;
 return {async *[Symbol.asyncIterator](){yield {type:'response.created',response:{id}};yield {type:'response.output_audio.delta',response_id:id,delta:Buffer.alloc(4800).toString('base64')};
  yield {type:'response.output_audio.done',response_id:id};yield {type:'response.output_audio_transcript.done',response_id:id,transcript:transform(text)};
  yield {type:'response.done',response:{id,status:'completed',usage:{input_tokens:20,output_tokens:22,input_token_details:{text_tokens:20,audio_tokens:0},output_token_details:{text_tokens:2,audio_tokens:20}}}};}};
}};}
const sourceText=()=>('Texte   fictif de qualification.\nAucune voix réelle ni publication. ').repeat(20);
async function setup(t){const root=await mkdtemp(join(tmpdir(),'cdc-coral-transcript-'));t.after(()=>rm(root,{recursive:true,force:true}));const text=sourceText();return {root,p:{requestId:'a'.repeat(48),index:0,chapter:{id:'intro',text,sha256:audioSha(text)},checkpointDir:join(root,'parts')}};}
test('trimmed transcript records a durable checkpoint instead of an uncertain attempt',async t=>{
 const {p}=await setup(t),fake=fakeExchange(),a=createCoralCheckpointHarness({testOnly:true,exchange:fake.exchange,authorize:async()=>true,pauseAfter:1});
 assert.match(coralFragmentPlan(p.chapter)[0].text,/\s$/u);
 await assert.rejects(a.synthesize(p),/CORAL_CHECKPOINT_PAUSED/);
 assert.equal(fake.calls(),1);assert.equal((await a.checkpointStatus(p)).safe_to_resume,true);
 const receipt=JSON.parse(await readFile(join(p.checkpointDir,'00.receipt.json'),'utf8'));assert.equal(receipt.text_sha256,coralFragmentPlan(p.chapter)[0].sha256);
 assert.equal(receipt.transcript_normalization,CORAL_TRANSCRIPT_NORMALIZATION);assert.notEqual(receipt.transcript_sha256,receipt.text_sha256);
});
for(const [name,source,transcript,canonical] of [
 ['trailing space','Texte fictif validé. ','Texte fictif validé.','Texte fictif validé.'],
 ['repeated spaces','Texte   fictif validé.','Texte fictif validé.','Texte fictif validé.'],
 ['line breaks','Texte\nfictif\r\nvalidé.','Texte fictif validé.','Texte fictif validé.'],
 ['ASCII tabs','\tTexte\tfictif validé.\r\n','Texte fictif validé.','Texte fictif validé.'],
 ['defined nonbreaking spaces','Texte\u00a0fictif\u202fvalidé.','Texte fictif validé.','Texte fictif validé.'],
 ['Unicode line separators','Texte\u2028fictif\u2029validé.','Texte fictif validé.','Texte fictif validé.'],
 ['Unicode letters unchanged','École 🇰🇭','École 🇰🇭','École 🇰🇭'],
 ['unchanged decomposed accent','Le cafe\u0301 fictif.','Le cafe\u0301 fictif.','Le cafe\u0301 fictif.']
])test('equivalent transcript accepts '+name+' while retaining exact source SHA',async()=>{
 const fake=fakeExchange(()=>transcript),a=createCoralRealtimeContractHarness({testOnly:true,exchange:fake.exchange});
 const wav=await a.synthesize({chapter:{text:source}}),receipt=a.lastReceipt();assert.equal(wav.toString('ascii',0,4),'RIFF');
 assert.equal(fake.calls(),1);assert.equal(receipt.text_sha256,audioSha(source));assert.equal(receipt.transcript_sha256,audioSha(canonical));assert.equal(receipt.transcript_normalization,CORAL_TRANSCRIPT_NORMALIZATION);
 assert.equal(normalizeCoralTranscript(source),canonical);if(source!==canonical)assert.notEqual(receipt.text_sha256,receipt.transcript_sha256);
});
for(const [name,source,transcript] of [
 ['changed word','Texte fictif validé.','Texte réel validé.'],
 ['omitted sentence','Première phrase. Deuxième phrase.','Première phrase.'],
 ['lost accent','Le café est prêt.','Le cafe est prêt.'],
 ['NFC to NFD folding','Le café est prêt.','Le cafe\u0301 est pre\u0302t.'],
 ['compatibility character','A B','Ａ B'],
 ['zero width deletion','Mot\u200bcontinu.','Motcontinu.'],
 ['case folding','bonjour.','Bonjour.'],
 ['punctuation substitution','L’atelier fictif.','L\'atelier fictif.'],
 ['undefined whitespace substitution','Avant\u0085après.','Avant après.'],
 ['ill formed transcript','Texte fictif.','\ud800']
])test('different transcript refuses '+name+' without retry',async()=>{
 const fake=fakeExchange(()=>transcript),a=createCoralRealtimeContractHarness({testOnly:true,exchange:fake.exchange});
 await assert.rejects(a.synthesize({chapter:{text:source}}),/UNCERTAIN_NO_RETRY/);assert.equal(fake.calls(),1);assert.equal(a.lastReceipt(),null);
});
test('invalid source hash or malformed UTF16 refuses before any exchange',async t=>{
 const {root,p}=await setup(t),fake=fakeExchange(),a=createCoralCheckpointHarness({testOnly:true,exchange:fake.exchange,authorize:async()=>true});
 for(const chapter of [{...p.chapter,sha256:'0'.repeat(64)},{id:'intro',text:'\ud800',sha256:audioSha('\ud800')}]){
  await assert.rejects(a.synthesize({...p,chapter}),/CORAL_FRAGMENT_TEXT/);assert.equal(fake.calls(),0);assert.deepEqual(await readdir(p.checkpointDir),[]);
 }
 const contract=createCoralRealtimeContractHarness({testOnly:true,exchange:fake.exchange});await contract.synthesize({chapter:{text:'Texte valide.'}});
 await assert.rejects(contract.synthesize({chapter:{text:'\ud800'}}),/UNICODE/);assert.equal(contract.lastReceipt(),null);
});
test('checkpoint tampering refuses source, transcript policy/hash and audio without another exchange',async t=>{
 const {p}=await setup(t),fake=fakeExchange(),first=createCoralCheckpointHarness({testOnly:true,exchange:fake.exchange,authorize:async()=>true,pauseAfter:1});
 await assert.rejects(first.synthesize(p),/PAUSED/);const file=join(p.checkpointDir,'00.receipt.json'),saved=await readFile(file,'utf8'),receipt=JSON.parse(saved);
 const resumed=createCoralCheckpointHarness({testOnly:true,exchange:fake.exchange,authorize:async()=>true});
 for(const mutate of [r=>r.text_sha256='0'.repeat(64),r=>r.transcript_sha256=r.text_sha256,r=>delete r.transcript_normalization,r=>r.transcript_normalization='unknown']){
  const changed=structuredClone(receipt);mutate(changed);await writeFile(file,JSON.stringify(changed),{mode:0o600});
  assert.equal((await resumed.checkpointStatus(p)).safe_to_resume,false);await assert.rejects(resumed.synthesize(p),/CHECKPOINT_RECEIPT/);assert.equal(fake.calls(),1);
 }
 await writeFile(file,saved,{mode:0o600});const wav=join(p.checkpointDir,'00.wav'),bytes=await readFile(wav),broken=Buffer.from(bytes);broken[44]^=1;await writeFile(wav,broken,{mode:0o600});
 await assert.rejects(resumed.synthesize(p),/CHECKPOINT_HASH/);assert.equal(fake.calls(),1);await writeFile(wav,bytes,{mode:0o600});
});
/** Rewrites ONLY a small synthetic archive with a known fixture key, to exercise semantic restore guards after valid GCM authentication. */
async function rewriteSyntheticArchive(source,destination,key,mutate){
 const encrypted=await readFile(source);assert.ok(encrypted.length<1048576);const head=encrypted.subarray(0,20),decipher=createDecipheriv('aes-256-gcm',key,head.subarray(8));decipher.setAAD(head);decipher.setAuthTag(encrypted.subarray(-16));
 const plain=Buffer.concat([decipher.update(encrypted.subarray(20,-16)),decipher.final()]),rows=[];let position=0;
 for(;;){const length=plain.readUInt32BE(position);position+=4;if(!length)break;const meta=JSON.parse(plain.subarray(position,position+length));position+=length;let bytes=plain.subarray(position,position+meta.bytes);position+=meta.bytes;
  if(meta.path==='subfragments.json'){const value=JSON.parse(bytes);mutate(value);bytes=Buffer.from(JSON.stringify(value));meta.bytes=bytes.length;meta.sha256=audioSha(bytes);}
  const m=Buffer.from(JSON.stringify(meta)),l=Buffer.alloc(4);l.writeUInt32BE(m.length);rows.push(l,m,bytes);
 }
 const header=Buffer.concat([Buffer.from('CDCAUD1\n'),randomBytes(12)]),cipher=createCipheriv('aes-256-gcm',key,header.subarray(8));cipher.setAAD(header);
 await writeFile(destination,Buffer.concat([header,cipher.update(Buffer.concat([...rows,Buffer.alloc(4)])),cipher.final(),cipher.getAuthTag()]),{mode:0o600,flag:'wx'});
}
test('validated text to normalized receipt to explicit restart to MP3 to encrypted independent restore',{timeout:180000},async t=>{
 const {root}=await setup(t),fake=fakeExchange(text=>text.replace(/\s+/gu,' ').trim()),r={contract:'cdc-coral-private-tts-request-v1',creation_id:'c-'+'a'.repeat(24),creation_version:3,binding_sha256:'b'.repeat(64),recipe_sha256:'c'.repeat(64),chapters:TTS_CHAPTER_IDS.map(id=>{const text=sourceText()+id+' ';return {id,text,sha256:audioSha(text)};}),voice:'test-tone',provider:'simulated-tone-v1',rights_sha256:'d'.repeat(64),reviews_sha256:'e'.repeat(64),reserve_microusd:7000};r.request_id=ttsRequestId(r);const original=JSON.stringify(r);
 const make=async pause=>{const inert=createCoralCheckpointHarness({testOnly:true,exchange:fake.exchange,authorize:async()=>true,pauseAfter:pause}),jobs=createSimulatedTtsJobs({authorize:async()=>true,budgetDir:join(root,'budget'),provider:{kind:'simulated-tone-v1',paid:false,synthesize:inert.synthesize,checkpointStatus:inert.checkpointStatus}});
  return createJobGateway({root:join(root,'jobs'),token:'synthetic-transcript-token-'.repeat(3),provider:async()=>{throw Error('NO_PROVIDER')},ttsJobs:jobs});};
 const first=await make(1);await first.submit(r.request_id,r);await first.workOnce();assert.equal((await first.state(r.request_id)).status,'interrupted');assert.equal(fake.calls(),1);
 const second=await make(null);await second.ttsOperation(r.request_id,'resume');await second.workOnce();assert.equal((await second.state(r.request_id)).status,'succeeded');
 const expected=r.chapters.reduce((n,c)=>n+coralFragmentPlan(c).length,0);assert.equal(fake.calls(),expected);await second.submit(r.request_id,r);await second.workOnce();assert.equal(fake.calls(),expected);assert.equal(JSON.stringify(r),original);
 const folder=join(root,'jobs',r.request_id,'tts'),manifest=JSON.parse(await readFile(join(folder,'manifest.json'),'utf8')),key=Buffer.alloc(32,31),archive=join(root,'transcript-media.enc');
 const validation={contract:'cdc-coral-audio-validation-v1',sha256:manifest.sha256,decode_passed:true,simulated:true};
 const receiptFile=join(folder,'fragments','intro','00.receipt.json'),saved=await readFile(receiptFile,'utf8'),receipt=JSON.parse(saved);
 assert.notEqual(receipt.text_sha256,receipt.transcript_sha256);assert.equal(receipt.transcript_normalization,CORAL_TRANSCRIPT_NORMALIZATION);
 const wrong={...receipt,transcript_sha256:receipt.text_sha256};await writeFile(receiptFile,JSON.stringify(wrong),{mode:0o600});await assert.rejects(backupCoralMedia({folder,archive,key,validation}),/MEDIA_SUBFRAGMENTS/);await writeFile(receiptFile,saved,{mode:0o600});
 const backup=await backupCoralMedia({folder,archive,key,validation});await rename(join(root,'jobs'),join(root,'simulated-loss-jobs'));
 const target=join(root,'restored'),restored=await restoreCoralMedia({archive,target,key,reviewed:true});assert.equal(restored.mp3_sha256,manifest.sha256);assert.equal(restored.audio_approved,false);assert.equal((await privateAudioDigest(join(target,manifest.file))).sha256,manifest.sha256);assert.equal((await probeAudio(join(target,manifest.file))).chapters.length,7);
 const evidence=JSON.parse(await readFile(join(target,'subfragments.json'),'utf8'));assert.equal(evidence.chapters.length,7);
 for(let i=0;i<7;i++){const parts=coralFragmentPlan(r.chapters[i]);for(let j=0;j<parts.length;j++){const item=evidence.chapters[i].receipts[j];assert.equal(item.text_sha256,audioSha(parts[j].text));assert.equal(item.transcript_sha256,audioSha(parts[j].text.replace(/\s+/gu,' ').trim()));assert.equal(item.transcript_normalization,CORAL_TRANSCRIPT_NORMALIZATION);}}
 let count=0;for(const mutate of [v=>v.chapters[0].receipts[0].text_sha256='0'.repeat(64),v=>v.chapters[0].receipts[0].transcript_sha256=v.chapters[0].receipts[0].text_sha256,v=>delete v.chapters[0].receipts[0].transcript_normalization]){
  const corrupt=join(root,'semantic-'+count+'.enc'),destination=join(root,'rejected-'+count++);await rewriteSyntheticArchive(archive,corrupt,key,mutate);await assert.rejects(restoreCoralMedia({archive:corrupt,target:destination,key,reviewed:true}),/MEDIA_RESTORE_REJECTED/);await assert.rejects(lstat(join(destination,'restore-complete.json')),e=>e.code==='ENOENT');
 }assert.equal(fake.calls(),expected);
 if(process.env.TTS_EVIDENCE_DIR){await mkdir(process.env.TTS_EVIDENCE_DIR,{recursive:true,mode:0o700});await writeFile(join(process.env.TTS_EVIDENCE_DIR,'transcript-regression.json'),JSON.stringify({normalization:CORAL_TRANSCRIPT_NORMALIZATION,source_unchanged:JSON.stringify(r)===original,fragment_calls:fake.calls(),expected_fragments:expected,duplicate_calls:0,chapters:7,backup,restored,authenticated_semantic_tampering_rejected:count,provider_calls_paid:0},null,2),{mode:0o600});}
});
