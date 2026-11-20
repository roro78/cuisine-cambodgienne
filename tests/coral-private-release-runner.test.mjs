import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {inspectCoralPrivateRelease} from '../scripts/run-coral-private-release.mjs';
const sha=data=>createHash('sha256').update(data).digest('hex');
async function fixture(){
 const jobRoot=await mkdtemp(join(tmpdir(),'coral-private-runner-'));
 const job='1'.repeat(48),folder=join(jobRoot,job,'real-tts');
 await mkdir(folder,{recursive:true,mode:0o700});
 const audio=Buffer.concat([Buffer.from('ID3'),Buffer.alloc(4096,9)]),
   audioHash=sha(audio);
 const manifest={request_id:job,sha256:audioHash,bytes:audio.length,
  file:'final-'+audioHash+'.mp3'};
 const intent={request_id:job,creation_id:'c-'+'2'.repeat(24),
  creation_version:3,mp3_sha256:audioHash,mp3_bytes:audio.length};
 const source={id:intent.creation_id,version:intent.creation_version,kind:'atelier'};
 await writeFile(join(jobRoot,job,'request.json'),JSON.stringify({
  id:job,request:{request_id:job,contract:'cdc-coral-private-speech-request-v1'}}));
 await writeFile(join(folder,'private-build-inputs.json'),JSON.stringify({
  contract:'cdc-coral-studio-private-build-inputs-v1',intent,source,profile:{}}));
 await writeFile(join(folder,'release-intent.json'),JSON.stringify(intent));
 await writeFile(join(folder,'manifest.json'),JSON.stringify(manifest));
 await writeFile(join(folder,'state.json'),JSON.stringify({
  status:'succeeded',manifest_sha256:audioHash}));
 await writeFile(join(folder,manifest.file),audio);
 return {jobRoot,job,folder,manifest,audio};
}
test('runner takes exact immutable Coral job/audio without any TTS or public write',async()=>{
 const f=await fixture();
 try{
  const r=await inspectCoralPrivateRelease({jobRoot:f.jobRoot,job:f.job});
  assert.equal(r.job,f.job);
  assert.deepEqual(await readFile(r.audio),f.audio);
  assert.match(r.packet,/private-build-inputs\.json$/);
  assert.equal((await readFile(join(f.folder,'state.json'),'utf8')).includes('succeeded'),true);
 }finally{await rm(f.jobRoot,{recursive:true,force:true});}
});
test('runner refuses corrupt audio, source identity or stage contract',async()=>{
 const f=await fixture();
 try{
  await writeFile(join(f.folder,f.manifest.file),Buffer.from('modified'));
  await assert.rejects(inspectCoralPrivateRelease({jobRoot:f.jobRoot,job:f.job}),/CORAL_PRIVATE_RELEASE_AUDIO_SHA/);
  await writeFile(join(f.folder,f.manifest.file),f.audio);
  const packetPath=join(f.folder,'private-build-inputs.json');
  const packet=JSON.parse(await readFile(packetPath,'utf8'));
  packet.source.version+=1;
  await writeFile(packetPath,JSON.stringify(packet));
  await assert.rejects(inspectCoralPrivateRelease({jobRoot:f.jobRoot,job:f.job}),/CORAL_PRIVATE_RELEASE_INCONSISTENT_JOB/);
 }finally{await rm(f.jobRoot,{recursive:true,force:true});}
});
