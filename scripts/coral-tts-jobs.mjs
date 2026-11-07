/** Resumable TTS operation inside the EXISTING job gateway/store. Offline only. */
import {mkdir,lstat,readdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {reserveCoralBudget} from './coral-external-job-provider.mjs';
import {TTS_CHAPTER_IDS as IDS,audioSha,privateAudioRead,privateAudioDigest,privateAudioVerifiedOpen,durableAudioCommit,durableWrite,atomicJson,
 simulatedTtsProvider,probeAudio,assemblePrivateMp3} from './coral-tts-audio.mjs';
export const TTS_CONTRACT='cdc-coral-private-tts-request-v1';
const hex=/^[a-f0-9]{64}$/,idPattern=/^[a-f0-9]{48}$/;
export function ttsRequestId(r){
 return audioSha([r.creation_id,r.creation_version,r.binding_sha256,r.recipe_sha256,
  ...(r.chapters||[]).map(c=>c.sha256),r.voice,r.rights_sha256,r.reviews_sha256,r.provider].join('\n')).slice(0,48);
}
export function ttsSourceKey(r){
 return audioSha([r.creation_id,r.creation_version,r.binding_sha256,r.recipe_sha256,
  ...(r.chapters||[]).map(c=>c.sha256),r.voice,r.provider].join('\n'));
}
export function validateTtsRequest(r){
 const keys=['contract','creation_id','creation_version','binding_sha256','recipe_sha256','chapters',
  'voice','provider','rights_sha256','reviews_sha256','request_id','reserve_microusd'];
 if(!r||Object.keys(r).length!==keys.length||keys.some(k=>!Object.hasOwn(r,k))
  ||r.contract!==TTS_CONTRACT||!/^c-[a-f0-9]{24}$/.test(r.creation_id||'')
  ||!Number.isSafeInteger(r.creation_version)||r.creation_version<1||r.creation_version>9999
  ||!['binding_sha256','recipe_sha256','rights_sha256','reviews_sha256'].every(k=>hex.test(r[k]||''))
  ||r.provider!=='simulated-tone-v1'||r.voice!=='test-tone'
  ||!Array.isArray(r.chapters)||r.chapters.length!==7
  ||r.chapters.some((c,i)=>!c||Object.keys(c).length!==3||c.id!==IDS[i]||typeof c.text!=='string'
   ||c.text.length<120||c.text.length>7000||audioSha(c.text)!==c.sha256)
  ||r.reserve_microusd!==7000||r.request_id!==ttsRequestId(r)||!idPattern.test(r.request_id)
  ||Buffer.byteLength(JSON.stringify(r))>90000)throw Error('TTS_REQUEST');
 return r;
}
async function readJson(file){return JSON.parse((await privateAudioRead(file,150000)).toString('utf8'));}
async function optional(file){try{return await readJson(file);}catch(e){if(e.code==='ENOENT')return null;throw e;}}
async function privateDir(dir){
 await mkdir(dir,{recursive:true,mode:0o700});const s=await lstat(dir);
 if(!s.isDirectory()||s.isSymbolicLink()||(process.platform!=='win32'&&((s.mode&0o077)||s.uid!==process.geteuid())))throw Error('TTS_PRIVATE_DIR');
}
export function createSimulatedTtsJobs({authorize,budgetDir,maxDailyUsd=0.1,maxMonthlyUsd=1,
 provider=simulatedTtsProvider(),audioTools={},pauseAfter=null}={}){
 if(typeof authorize!=='function'||!budgetDir||provider?.kind!=='simulated-tone-v1'||provider.paid!==false
  ||!Number.isFinite(maxDailyUsd)||maxDailyUsd<=0||maxDailyUsd>0.75
  ||!Number.isFinite(maxMonthlyUsd)||maxMonthlyUsd<=0||maxMonthlyUsd>1)throw Error('TTS_TEST_CONFIG');
 const authority=async r=>{let ok=false;try{ok=await authorize(r);}catch{}if(ok!==true)throw Error('TTS_AUTHORIZATION_REVOKED_OR_STALE');};
 const folderFor=folder=>join(resolve(folder),'tts');
 async function load(folder){return optional(join(folderFor(folder),'state.json'));}
 async function verifyReservation(dir,r){
  const receipt=await readJson(join(dir,'reservation.json')),today=new Date().toISOString().slice(0,10);
  if(receipt.job_id!==r.request_id||receipt.reserve_microusd!==r.reserve_microusd||receipt.day!==today)throw Error('TTS_BUDGET_REVIEW_REQUIRED');
  let month=0,todayTotal=0,found=false;
  for(const name of await readdir(budgetDir)){
   if(!new RegExp('^budget-'+today.slice(0,7)+'-\\d{2}\\.json$').test(name))continue;
   const ledger=await readJson(join(budgetDir,name));
   if(ledger.contract!=='cdc-coral-daily-reservations-v1'||'budget-'+ledger.day+'.json'!==name||!Array.isArray(ledger.requests))throw Error('TTS_BUDGET_REVIEW_REQUIRED');
   for(const row of ledger.requests){
    if(typeof row.reservedUsd!=='number'||!Number.isFinite(row.reservedUsd)||row.reservedUsd<=0)throw Error('TTS_BUDGET_REVIEW_REQUIRED');
    month+=row.reservedUsd;if(ledger.day===today)todayTotal+=row.reservedUsd;
    if(ledger.day===today&&row.jobId===r.request_id&&row.model===r.provider&&Math.round(row.reservedUsd*1e6)===r.reserve_microusd)found=true;
   }
  }
  if(!found||Math.round(month*1e8)>Math.round(maxMonthlyUsd*1e8)||Math.round(todayTotal*1e8)>Math.round(maxDailyUsd*1e8))throw Error('TTS_BUDGET_REVIEW_REQUIRED');
 }
 async function verifiedParts(folder,r){
  const parts=[];
  for(let i=0;i<7;i++){
   const id=IDS[i],receipt=await optional(join(folder,id+'.receipt.json'));
   const attempted=await optional(join(folder,id+'.attempt.json'));
   if(!receipt){if(attempted&&!(await provider.checkpointStatus?.(checkpointArgs(folder,r,i)))?.safe_to_resume)throw Error('TTS_UNCERTAIN');break;}
   const digest=await privateAudioDigest(join(folder,id+'.wav'));
   if(receipt.id!==id||receipt.text_sha256!==r.chapters[i].sha256||receipt.sha256!==digest.sha256
     ||receipt.cost_microusd!==1000)throw Error('TTS_FRAGMENT_HASH');
   const actual=await probeAudio(join(folder,id+'.wav'),audioTools);
   if(actual.codec!=='pcm_s16le'||actual.sampleRate!==24000||actual.channels!==1
     ||actual.duration!==receipt.duration)throw Error('TTS_FRAGMENT_FORMAT');
   parts.push(receipt);
  }
  return parts;
 }
 function checkpointArgs(dir,r,index){return {index,chapter:r.chapters[index],requestId:r.request_id,checkpointDir:join(dir,'fragments',IDS[index])};}
 async function state(r,id,folder,active=false){
  validateTtsRequest(r);if(id!==r.request_id)throw Error('TTS_ID');
  const s=await load(folder);if(!s)return {id,status:'queued',completed_chapters:0};
  if(!['queued','running','interrupted','uncertain','succeeded'].includes(s.status)
    ||!Number.isInteger(s.completed_chapters)||s.completed_chapters<0||s.completed_chapters>7)throw Error('TTS_STATE_INVALID');
  if(s.status==='succeeded'){
   if(s.manifest?.request_id!==id||s.manifest.binding_sha256!==r.binding_sha256
    ||!/^final-[a-f0-9]{64}\.mp3$/.test(s.manifest.file||'')
    ||(await privateAudioDigest(join(folderFor(folder),s.manifest.file))).sha256!==s.manifest.sha256)throw Error('TTS_FINAL_HASH');
  }
  const status=s.status==='running'&&!active?'interrupted':s.status;
  return {id,status,completed_chapters:s.completed_chapters||0,...(s.error?{error:s.error}:{}),
   ...(s.manifest?{result:JSON.stringify({...s.manifest,file:undefined})}:{})};
 }
 async function run(r,id,folder){
  validateTtsRequest(r);if(id!==r.request_id)throw Error('TTS_ID');
  const dir=folderFor(folder);await privateDir(dir);
  let current={status:'running',completed_chapters:0},inFlight=false;
  await atomicJson(join(dir,'state.json'),current);
  try{
   await authority(r);let parts=await verifiedParts(dir,r);current.completed_chapters=parts.length;
   const reserve=await optional(join(dir,'reservation.json'));
   if(!reserve){
    const receipt=await reserveCoralBudget({budgetDir,jobId:id,model:r.provider,costUsd:r.reserve_microusd/1e6,maxDailyUsd,maxMonthlyUsd});
    await durableWrite(join(dir,'reservation.json'),JSON.stringify({...receipt,job_id:id,reserve_microusd:r.reserve_microusd}));
   }
   await verifyReservation(dir,r);
   for(let i=parts.length;i<7;i++){
    await authority(r);await verifyReservation(dir,r);const chapter=r.chapters[i];
    // Durable intent BEFORE provider invocation. A crash or uncertain reply blocks replay.
    inFlight=true;
    if(!await optional(join(dir,chapter.id+'.attempt.json')))await durableWrite(join(dir,chapter.id+'.attempt.json'),JSON.stringify({text_sha256:chapter.sha256,reserved_microusd:1000}));
    let bytes;try{bytes=await provider.synthesize(checkpointArgs(dir,r,i));}catch{
     if((await provider.checkpointStatus?.(checkpointArgs(dir,r,i)))?.safe_to_resume){inFlight=false;throw Error('TTS_INTERRUPTED');}throw Error('TTS_UNCERTAIN');}
    if(!Buffer.isBuffer(bytes)&&typeof bytes?.[Symbol.asyncIterator]!=='function')throw Error('TTS_UNCERTAIN');
    let digest;try{digest=await durableAudioCommit(join(dir,chapter.id+'.wav'),bytes);}catch{
     if((await provider.checkpointStatus?.(checkpointArgs(dir,r,i)))?.safe_to_resume){inFlight=false;throw Error('TTS_INTERRUPTED');}throw Error('TTS_UNCERTAIN');}
    const m=await probeAudio(join(dir,chapter.id+'.wav'),audioTools);
    const part={id:chapter.id,text_sha256:chapter.sha256,sha256:digest.sha256,duration:m.duration,cost_microusd:1000};
    await durableWrite(join(dir,chapter.id+'.receipt.json'),JSON.stringify(part));parts.push(part);inFlight=false;
    current.completed_chapters=parts.length;await atomicJson(join(dir,'state.json'),current);
    if(pauseAfter===parts.length&&parts.length<7)throw Error('TTS_INTERRUPTED');
   }
   await authority(r);
   // Verify again before assembly, including fragments restored across a restart.
   parts=await verifiedParts(dir,r);
   let manifest=await optional(join(dir,'manifest.json'));
   if(manifest){if(manifest.sha256!==(await privateAudioDigest(join(dir,manifest.file))).sha256)throw Error('TTS_FINAL_HASH');}
   else{
    manifest={contract:'cdc-coral-private-tts-result-v1',...await assemblePrivateMp3(dir,parts,audioTools),request_id:id,creation_id:r.creation_id,
     creation_version:r.creation_version,binding_sha256:r.binding_sha256,provider:r.provider,voice:r.voice,
     reserved_microusd:r.reserve_microusd,simulated_cost_microusd:7000,provider_charged_microusd:0,
     audio_approved:false,publication_ready:false};
    await authority(r);await durableWrite(join(dir,'manifest.json'),JSON.stringify(manifest));
   }
   current={status:'succeeded',completed_chapters:7,manifest};
  }catch(e){
   const allowed=['TTS_UNCERTAIN','TTS_INTERRUPTED','TTS_AUTHORIZATION_REVOKED_OR_STALE','TTS_FRAGMENT_HASH','TTS_FRAGMENT_FORMAT','TTS_BUDGET_REVIEW_REQUIRED',
    'CORAL_EXTERNAL_BUDGET_LIMIT','CORAL_EXTERNAL_MONTHLY_LIMIT'];
   const error=inFlight?'TTS_UNCERTAIN':allowed.includes(e.message)?e.message:'TTS_OPERATION_STOPPED';
   current={status:error==='TTS_UNCERTAIN'?'uncertain':'interrupted',completed_chapters:current.completed_chapters,error};
  }
  await atomicJson(join(dir,'state.json'),current);
  return state(r,id,folder,true);
 }
 async function resume(r,id,folder,{ownerAlive=false}={}){
  await authority(validateTtsRequest(r));const dir=folderFor(folder);await privateDir(dir);const s=await load(folder);
  if(s?.status==='succeeded'||s?.status==='queued')throw Error('TTS_RESUME_STATE');
  if(s?.status==='running'&&ownerAlive)throw Error('TTS_BUSY');
  await verifiedParts(dir,r); // An uncertain attempt has NO receipt: never retry it.
  if(await optional(join(dir,'reservation.json')))await verifyReservation(dir,r);
  await atomicJson(join(dir,'state.json'),{status:'queued',completed_chapters:s?.completed_chapters||0});
  return state(r,id,folder);
 }
 async function audio(r,id,folder){
  const opened=await audioStream(r,id,folder);try{return await opened.handle.readFile();}finally{await opened.handle.close();}
 }
 async function audioStream(r,id,folder){
  await authority(validateTtsRequest(r));const s=await load(folder);
  if(s?.status!=='succeeded'||!/^final-[a-f0-9]{64}\.mp3$/.test(s.manifest?.file||''))throw Error('TTS_AUDIO_UNAVAILABLE');
  return privateAudioVerifiedOpen(join(folderFor(folder),s.manifest.file),s.manifest.sha256);
 }
 return {state,run,resume,audio,audioStream};
}
