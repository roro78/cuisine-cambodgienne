import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm,chmod,lstat} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {backupCoralMedia,restoreCoralMedia,coralAudioRetentionPlan} from '../scripts/coral-media-backup.mjs';
import {audioSha,TTS_CHAPTER_IDS,probeAudio,privateAudioDigest} from '../scripts/coral-tts-audio.mjs';
import {createSimulatedTtsJobs,ttsRequestId} from '../scripts/coral-tts-jobs.mjs';import {createJobGateway} from '../scripts/editorial-ai-job-gateway.mjs';
test('separate authenticated media backup, loss, closed restore, corruption and immutable history',async t=>{
 const root=await mkdtemp(join(tmpdir(),'cdc-coral-media-'));t.after(()=>rm(root,{recursive:true,force:true}));
 const r={contract:'cdc-coral-private-tts-request-v1',creation_id:'c-'+'a'.repeat(24),creation_version:3,binding_sha256:'b'.repeat(64),recipe_sha256:'c'.repeat(64),chapters:TTS_CHAPTER_IDS.map(id=>{const text='Texte fictif pour qualification sans voix ni fournisseur réel. '.repeat(4)+id;return {id,text,sha256:audioSha(text)};}),voice:'test-tone',provider:'simulated-tone-v1',rights_sha256:'d'.repeat(64),reviews_sha256:'e'.repeat(64),reserve_microusd:7000};r.request_id=ttsRequestId(r);
 const jobs=createSimulatedTtsJobs({authorize:async()=>true,budgetDir:join(root,'budget')}),gateway=await createJobGateway({root:join(root,'jobs'),token:'fake-media-token-'.repeat(4),provider:async()=>{},ttsJobs:jobs});
 await gateway.submit(r.request_id,r);await gateway.workOnce();assert.equal((await gateway.state(r.request_id)).status,'succeeded');
 const folder=join(root,'jobs',r.request_id,'tts'),manifest=JSON.parse(await readFile(join(folder,'manifest.json'),'utf8'));
 const key=Buffer.alloc(32,17),archive=join(root,'media-v1.enc'),validation={contract:'cdc-coral-audio-validation-v1',sha256:manifest.sha256,decode_passed:true,simulated:true};
 const historical=join(root,'historical.mp3');await writeFile(historical,'historical witness',{mode:0o600});
 const backup=await backupCoralMedia({folder,archive,key,validation});assert.equal(backup.contains_wav,false);
 const before=await privateAudioDigest(archive,64000000);await assert.rejects(backupCoralMedia({folder,archive,key,validation}),e=>e.code==='EEXIST');assert.deepEqual(await privateAudioDigest(archive,64000000),before);
 await assert.rejects(restoreCoralMedia({archive,target:join(root,'no-review'),key}),/REVIEW/);
 const encrypted=await readFile(archive);assert.ok(!encrypted.includes(Buffer.from(r.chapters[0].text)));
 await rm(join(root,'jobs'),{recursive:true}); // fixture loss ONLY, history witness is outside
 const target=join(root,'restored'),restored=await restoreCoralMedia({archive,target,key,reviewed:true});assert.equal(restored.authenticated,true);assert.equal(restored.audio_approved,false);
 assert.equal((await privateAudioDigest(join(target,manifest.file))).sha256,manifest.sha256);assert.equal((await probeAudio(join(target,manifest.file))).chapters.length,7);
 await assert.rejects(restoreCoralMedia({archive,target,key,reviewed:true}),e=>e.code==='EEXIST');
 for(const [name,bytes,wrongKey] of [['corrupt',Buffer.from(encrypted),key],['truncated',encrypted.subarray(0,-9),key],['wrong-key',encrypted,Buffer.alloc(32,19)]]){
  if(name==='corrupt')bytes[Math.floor(bytes.length/2)]^=1;const file=join(root,name+'.enc');await writeFile(file,bytes,{mode:0o600});const destination=join(root,name);
  await assert.rejects(restoreCoralMedia({archive:file,target:destination,key:wrongKey,reviewed:true}));await assert.rejects(lstat(join(destination,'restore-complete.json')),e=>e.code==='ENOENT');
 }
 assert.equal(await readFile(historical,'utf8'),'historical witness');
 for(const status of ['uncertain','interrupted','running'])assert.equal(coralAudioRetentionPlan({status,manifest,backup,restored,completedAt:0}).wav,'retain');
 assert.equal(coralAudioRetentionPlan({status:'succeeded',manifest,backup,restored,completedAt:Date.now()-31*86400000}).wav,'eligible-for-separate-reviewed-cleanup');
 assert.equal(coralAudioRetentionPlan({status:'succeeded',manifest,backup,restored,completedAt:Date.now()}).wav,'retain');
 if(process.platform!=='win32'){await chmod(archive,0o644);await assert.rejects(restoreCoralMedia({archive,target:join(root,'insecure'),key,reviewed:true}),/PRIVATE_FILE/);}
});
