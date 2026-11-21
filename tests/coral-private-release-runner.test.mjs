import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readdir,mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {inspectCoralPrivateRelease,runPendingCoralPrivateReleases} from '../scripts/run-coral-private-release.mjs';
const sha=data=>createHash('sha256').update(data).digest('hex');
const privateWrite=(path,data)=>writeFile(path,data,{mode:0o600});
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
 await privateWrite(join(jobRoot,job,'request.json'),JSON.stringify({
  id:job,request:{request_id:job,contract:'cdc-coral-private-speech-request-v1'}}));
 await privateWrite(join(folder,'private-build-inputs.json'),JSON.stringify({
  contract:'cdc-coral-studio-private-build-inputs-v1',intent,source,profile:{}}));
 await privateWrite(join(folder,'release-intent.json'),JSON.stringify(intent));
 await privateWrite(join(folder,'manifest.json'),JSON.stringify(manifest));
 await privateWrite(join(folder,'state.json'),JSON.stringify({
  status:'succeeded',manifest_sha256:audioHash}));
 await privateWrite(join(folder,manifest.file),audio);
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
test('scheduled runner takes only jobs with approved build inputs and skips receipts',async()=>{
 const f=await fixture(),outputRoot=await mkdtemp(join(tmpdir(),'coral-private-pending-'));
 const attempted=[];
 const run=async({job})=>{await inspectCoralPrivateRelease({jobRoot:f.jobRoot,job});attempted.push(job);};
 const options={jobRoot:f.jobRoot,outputRoot};
 try{
  await mkdir(join(f.jobRoot,'2'.repeat(48),'real-tts'),{recursive:true,mode:0o700});
  assert.deepEqual(await runPendingCoralPrivateReleases(options,{run}),{staged:1,blocked:0});
  await mkdir(join(outputRoot,f.job),{mode:0o700});
  await privateWrite(join(outputRoot,f.job,'stage-receipt.json'),'{}');
  assert.deepEqual(await runPendingCoralPrivateReleases(options,{run}),{staged:0,blocked:0});
  assert.deepEqual(attempted,[f.job]);
 }finally{
  await rm(f.jobRoot,{recursive:true,force:true});
  await rm(outputRoot,{recursive:true,force:true});
 }
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

test('stale stage is rebuilt from the same private job while keeping the old bundle',async()=>{
 const f=await fixture(),outputRoot=await mkdtemp(join(tmpdir(),'coral-private-rebase-'));
 const job=f.job,dir=join(outputRoot,job),bundle=join(dir,'bundle');
 try{
  await mkdir(bundle,{recursive:true,mode:0o700});
  await privateWrite(join(bundle,'BUNDLE-MANIFEST-PRIVE.json'),'old manifest');
  await privateWrite(join(dir,'stage-receipt.json'),'old receipt');
  const attempted=[];
  const counts=await runPendingCoralPrivateReleases({jobRoot:f.jobRoot,outputRoot,tokenFile:'fixture-only'},{
   status:async request=>{assert.equal(request.job,job);return 'stale';},
   run:async request=>{assert.equal(request.job,job);attempted.push(request.job);}
  });
  assert.deepEqual(counts,{staged:1,blocked:0});
  assert.deepEqual(attempted,[job]);
  const [archive]=await readdir(dir);
  assert.match(archive,/^superseded-/);
  assert.equal(await readFile(join(dir,archive,'bundle','BUNDLE-MANIFEST-PRIVE.json'),'utf8'),'old manifest');
 }finally{
  await rm(f.jobRoot,{recursive:true,force:true});
  await rm(outputRoot,{recursive:true,force:true});
 }
});
