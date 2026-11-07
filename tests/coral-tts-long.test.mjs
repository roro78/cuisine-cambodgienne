import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,rm,readdir,writeFile,rename} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createReadStream} from 'node:fs';
import {createHash} from 'node:crypto';
import {coralTtsLoadScenarios} from '../scripts/coral-tts-load-scenarios.mjs';
import {audioSha,probeAudio} from '../scripts/coral-tts-audio.mjs';
const exec=promisify(execFile);
async function digestFile(file){const h=createHash('sha256');let bytes=0;for await(const c of createReadStream(file,{highWaterMark:65536})){h.update(c);bytes+=c.length;}return {sha256:h.digest('hex'),bytes};}
for(const scenario of (await coralTtsLoadScenarios()).filter(s=>!process.env.TTS_SCENARIO||s.name===process.env.TTS_SCENARIO))test('realistic offline audio '+scenario.name+' with restart, resources and seven chapters',{timeout:240000},async t=>{
 const evidence=process.env.TTS_EVIDENCE_DIR?resolve(process.env.TTS_EVIDENCE_DIR,'coral-tts-load'):null;
 if(evidence)await mkdir(evidence,{recursive:true,mode:0o700});
 const root=await mkdtemp(join(evidence||tmpdir(),'cdc-coral-load-'+scenario.name+'-'));
 if(!evidence)t.after(()=>rm(root,{recursive:true,force:true}));
 const historical=Buffer.from('PRIVATE SYNTHETIC HISTORICAL AUDIO WITNESS - NEVER OVERWRITE');
 await writeFile(join(root,'historical-fixture.mp3'),historical,{mode:0o600,flag:'wx'});
 for(const stage of ['begin','resume'])await exec(process.execPath,['tests/fixtures/coral-tts-long-process.mjs',stage,root,scenario.name],{windowsHide:true,timeout:220000,maxBuffer:10000});
 const before=JSON.parse(await readFile(join(root,'report-begin.json'),'utf8')),after=JSON.parse(await readFile(join(root,'report-resume.json'),'utf8'));
 assert.notEqual(before.pid,after.pid);assert.equal(before.calls,3);assert.equal(after.calls,4);assert.equal(after.completed_chapters,7);
 const m=after.manifest;assert.ok(Math.abs(m.duration-scenario.durations.reduce((a,b)=>a+b,0))<0.15);
 assert.equal(m.chapters.length,7);assert.equal(m.provider_charged_microusd,0);assert.equal(m.audio_approved,false);assert.equal(m.publication_ready,false);
 const job=(await readdir(join(root,'jobs'))).find(x=>/^[a-f0-9]{48}$/.test(x)),folder=join(root,'jobs',job,'tts');
 let expected=0,totalWav=0;const fragments=[];
 for(let i=0;i<7;i++){
  const c=m.chapters[i],digest=await digestFile(join(folder,c.id+'.wav')),receipt=JSON.parse(await readFile(join(folder,c.id+'.receipt.json'),'utf8'));
  assert.equal(digest.sha256,receipt.sha256);assert.ok(Math.abs(c.start-expected)<0.002);expected+=scenario.durations[i];assert.ok(Math.abs(c.end-expected)<0.002);
  fragments.push({id:c.id,bytes:digest.bytes,duration:receipt.duration,sha256:receipt.sha256});totalWav+=digest.bytes;
 }
 const files=await readdir(folder),mp3=files.find(x=>/^final-[a-f0-9]{64}\.mp3$/.test(x));
 const digest=await digestFile(join(folder,mp3));assert.equal(digest.sha256,m.sha256);assert.equal(digest.bytes,m.bytes);assert.ok(digest.bytes<32000000);
 const actual=await probeAudio(join(folder,mp3));assert.equal(actual.chapters.length,7);
 assert.equal(audioSha(await readFile(join(root,'historical-fixture.mp3'))),audioSha(historical));
 let validationPeak=null;try{validationPeak=Number(await readFile('/sys/fs/cgroup/memory.peak','utf8'));}catch{}
 if(process.env.TTS_REQUIRE_RESOURCE_LIMITS==='true'){
  assert.equal(after.cgroup?.memory_max,'268435456');assert.match(after.cgroup.cpu_max,/^50000 100000$/);
  assert.ok(after.cgroup.memory_peak_bytes<=268435456);assert.ok(after.audio_commands.length>0);
  if(process.env.TTS_REQUIRE_MARGIN==='true'){
   assert.ok(validationPeak<=201326592,'worker needs at least 25% reproducible memory headroom');
   for(const r of [before,after])assert.equal(r.memory.event_delta.oom_kill,0);
  }
 }
 let mediaRestore=null;
 if(process.env.TTS_MEDIA_BACKUP==='true'){
  const {backupCoralMedia,restoreCoralMedia}=await import('../scripts/coral-media-backup.mjs');
  const archive=join(root,'synthetic-media-v1.enc'),key=Buffer.alloc(32,17),target=join(root,'restored-audio');
  const backup=await backupCoralMedia({folder,archive,key,validation:{contract:'cdc-coral-audio-validation-v1',sha256:m.sha256,decode_passed:true,simulated:true}});
  await rename(join(root,'jobs'),join(root,'simulated-loss-jobs')); // ONLY this generated fixture; historical witness stays unchanged
  const restored=await restoreCoralMedia({archive,target,key,reviewed:true});assert.equal(restored.mp3_sha256,m.sha256);
  const measured=await probeAudio(join(target,mp3));assert.equal(measured.chapters.length,7);assert.equal((await digestFile(join(target,mp3))).sha256,m.sha256);
  let restorePeak=null;try{restorePeak=Number(await readFile('/sys/fs/cgroup/memory.peak','utf8'));}catch{}
  if(process.env.TTS_REQUIRE_RESOURCE_LIMITS==='true')assert.ok(restorePeak<=268435456);
  mediaRestore={backup,restored,target:'restored-audio',measured_chapters:measured.chapters.length,memory_peak_bytes:restorePeak,loss_simulated:true,original_fixture_retained:true};
 }
 const summary={...after,media_restore:mediaRestore,begin_measurements:before,fragments,total_wav_bytes:totalWav,
  backup_1mib_file_compatible:fragments.every(f=>f.bytes<=1048576)&&m.bytes<=1048576,
  backup_32mib_total_compatible:after.tts_directory_bytes<=33554432,
  validation_cgroup_memory_peak_bytes:validationPeak,historical_fixture_sha256:audioSha(historical),historical_files_modified:false,provider_calls_paid:0};
 await writeFile(join(root,'summary.json'),JSON.stringify(summary,null,2),{mode:0o600});
 console.log(JSON.stringify({scenario:scenario.name,seconds:m.duration,mp3_bytes:m.bytes,wav_bytes:totalWav,
  disk_bytes:after.tts_directory_bytes,node_peak_kib:Math.max(before.node_max_rss_kib,after.node_max_rss_kib),
  wall_ms:before.wall_ms+after.wall_ms,cgroup_peak_bytes:after.cgroup?.memory_peak_bytes,validation_peak_bytes:validationPeak,
  cgroup_cpu_ms:after.cgroup&&before.cgroup?(after.cgroup.cpu_usage_usec_delta+before.cgroup.cpu_usage_usec_delta)/1000:null,
  audio_operations:[...before.audio_commands,...after.audio_commands].filter(c=>c.operation==='assemble'||c.operation==='decode')}));
 console.log(JSON.stringify({scenario:scenario.name,memory_breakdown:{begin:before.memory,resume:after.memory},media_restore:mediaRestore}));
});
