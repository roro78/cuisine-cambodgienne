/**
 * Real seven-chapter Coral Speech jobs for the EXISTING private job gateway.
 * The Studio is the sole source of approved private narrations. No public text,
 * no retry after an uncertain paid call, no automatic publish.
 */
import {join} from 'node:path';
import {mkdir,lstat} from 'node:fs/promises';
import {reserveCoralBudget} from './coral-external-job-provider.mjs';
import {createCoralSpeechTransport,planCoralSpeechFragments} from './coral-speech-transport.mjs';
import {validateCoralRealSpeechRequest,coralRealSpeechAssembleChapterWav} from './coral-real-speech-request.mjs';
import {audioSha,durableWrite,durableAudioCommit,atomicJson,privateAudioRead,privateAudioDigest,
  privateAudioVerifiedOpen,probeAudio,assemblePrivateMp3} from './coral-tts-audio.mjs';

const BUDGET_USD=0.75,MAX_PARTS=50;
async function optional(file,max=120000){
 try{return JSON.parse((await privateAudioRead(file,max)).toString('utf8'));}
 catch(e){if(e.code==='ENOENT')return null;throw e;}
}
async function secureDir(path){
 await mkdir(path,{recursive:true,mode:0o700});const s=await lstat(path);
 if(!s.isDirectory()||s.isSymbolicLink()||
  (process.platform!=='win32'&&((s.mode&0o077)!==0||s.uid!==process.geteuid())))
  throw Error('CORAL_REAL_STORAGE');
}
const filename=(chapter,part)=>String(chapter).padStart(2,'0')+'-'+String(part).padStart(2,'0');
export function createCoralRealSpeechJobs({
 authorize,budgetDir,spendingApproved,externalProjectBudgetVerified,
 maxDailyUsd=0.75,maxMonthlyUsd=1,makeTransport=createCoralSpeechTransport,audioTools={}
}={}){
 if(typeof authorize!=='function'||typeof spendingApproved!=='function'||
  typeof externalProjectBudgetVerified!=='function'||!budgetDir||
  typeof makeTransport!=='function'||maxDailyUsd!==0.75||maxMonthlyUsd!==1)
  throw Error('CORAL_REAL_DISABLED');
 const directory=folder=>join(folder,'real-tts');
 const authority=async r=>{let ok=false;try{ok=await authorize(r);}catch{}
  if(ok!==true)throw Error('CORAL_REAL_STUDIO_AUTHORITY');};
 function parts(r){
  const chapters=r.chapters.map(c=>planCoralSpeechFragments(c.text));
  const count=chapters.reduce((n,p)=>n+p.length,0);
  if(count<7||count>MAX_PARTS)throw Error('CORAL_REAL_FRAGMENT_LIMIT');
  return {chapters,count};
 }
 async function inspect(r,dir,plan){
  const complete=[];let uncertain=false,global=0;
  for(let ci=0;ci<7;ci++){
   const completed=[];
   for(let pi=0;pi<plan.chapters[ci].length;pi++,global++){
    const stem=filename(ci,pi),p=plan.chapters[ci][pi];
    const attempted=await optional(join(dir,stem+'.attempt.json'));
    const receipt=await optional(join(dir,stem+'.receipt.json'));
    if(receipt){
     if(!attempted||attempted.global_index!==global||attempted.text_sha256!==p.sha256
      ||receipt.text_sha256!==p.sha256||receipt.request_id!==r.request_id
      ||receipt.fragment_index!==global||receipt.model!=='gpt-4o-mini-tts'
      ||receipt.voice!=='coral'||!Number.isFinite(receipt.duration_seconds)
      ||receipt.duration_seconds<=0||!/^[a-f0-9]{64}$/.test(receipt.wav_sha256||''))
      throw Error('CORAL_REAL_RECEIPT_INVALID');
     const digest=await privateAudioDigest(join(dir,stem+'.wav'));
     if(digest.sha256!==receipt.wav_sha256)throw Error('CORAL_REAL_AUDIO_HASH');
     completed.push({stem,...receipt});
    }else if(attempted)uncertain=true;
    else if(uncertain||complete.some(c=>!c.done))throw Error('CORAL_REAL_STATE_GAP');
   }
   complete.push({id:r.chapters[ci].id,fragments:completed,done:completed.length===plan.chapters[ci].length});
  }
  return {complete,uncertain};
 }
 async function state(r,id,folder,active=false){
  validateCoralRealSpeechRequest(r);if(id!==r.request_id)throw Error('CORAL_REAL_ID');
  const dir=directory(folder),s=await optional(join(dir,'state.json'));
  if(!s)return {id,status:'queued',completed_chapters:0};
  if(!['queued','running','awaiting_preview_approval','interrupted','uncertain','succeeded'].includes(s.status))throw Error('CORAL_REAL_STATE');
  if(s.status==='succeeded'){
   const m=await optional(join(dir,'manifest.json'));
   if(!m||m.request_id!==id||m.sha256!==s.manifest_sha256
    ||!/^final-[a-f0-9]{64}\.mp3$/.test(m.file||''))throw Error('CORAL_REAL_MANIFEST');
   const digest=await privateAudioDigest(join(dir,m.file));
   if(digest.sha256!==m.sha256)throw Error('CORAL_REAL_FINAL_SHA');
  }
  return {id,status:s.status==='running'&&!active?'interrupted':s.status,
   completed_chapters:s.completed_chapters||0,
   ...(s.error?{error:s.error}:{}),
   ...(s.status==='succeeded'?{result:JSON.stringify(await optional(join(dir,'manifest.json')))}:{})};
 }
 async function run(r,id,folder){
  validateCoralRealSpeechRequest(r);if(id!==r.request_id)throw Error('CORAL_REAL_ID');
  const dir=directory(folder);await secureDir(dir);
  const existing=await optional(join(dir,'state.json'));
  if(existing?.status==='succeeded'||existing?.status==='awaiting_preview_approval')return state(r,id,folder,true);
  const plan=parts(r);
  let inFlight=false,completed=0;
  try{
   await authority(r);
   if(await spendingApproved(r)!==true||await externalProjectBudgetVerified(r)!==true)
    throw Error('CORAL_REAL_SPENDING_NOT_APPROVED');
   const saved=await inspect(r,dir,plan);
   if(saved.uncertain)throw Error('CORAL_REAL_UNCERTAIN_NO_RETRY');
   const previewReceipt=await optional(join(dir,'00-00.receipt.json'));
   const previewApproval=await optional(join(dir,'preview-approved.json'));
   if(previewApproval&&(previewApproval.request_id!==id
     ||!previewReceipt||previewApproval.preview_sha256!==previewReceipt.wav_sha256))
    throw Error('CORAL_REAL_PREVIEW_APPROVAL_INVALID');
   // A durable preview is NOT consent for the rest of the seven chapters.
   // On crash/restart with a received preview, always stop here until Studio
   // submits its separate, authenticated human approval.
   if(previewReceipt&&!previewApproval){
    await atomicJson(join(dir,'state.json'),{status:'awaiting_preview_approval',completed_chapters:0});
    return state(r,id,folder,true);
   }
   await atomicJson(join(dir,'state.json'),{status:'running',completed_chapters:0});
   // Reserve the entire job BEFORE the first potentially billed API request.
   let budget=await optional(join(dir,'reservation.json'));
   if(!budget){
    const receipt=await reserveCoralBudget({budgetDir,jobId:id,model:r.provider,
     costUsd:BUDGET_USD,maxDailyUsd,maxMonthlyUsd});
    budget={request_id:id,model:r.provider,reserved_usd:receipt.reservedUsd,day:receipt.day};
    await durableWrite(join(dir,'reservation.json'),JSON.stringify(budget));
   }
   if(budget.request_id!==id||budget.model!==r.provider||budget.reserved_usd!==BUDGET_USD)
    throw Error('CORAL_REAL_BUDGET_STATE');
   let global=0;
   for(let ci=0;ci<7;ci++){
    await authority(r);
    const chapter=r.chapters[ci],fragments=plan.chapters[ci];
    for(let pi=0;pi<fragments.length;pi++,global++){
     await authority(r);
     const part=fragments[pi],stem=filename(ci,pi);
     const receipt=await optional(join(dir,stem+'.receipt.json'));
     if(receipt)continue;
     if(await optional(join(dir,stem+'.attempt.json')))throw Error('CORAL_REAL_UNCERTAIN_NO_RETRY');
     // No extra reservation is made by the transport; the existing durable
     // monthly ledger covers ALL fragments. This callback must verify the
     // attempt file before the network request.
     const reserved_microusd=Math.floor(750000/plan.count);
     await durableWrite(join(dir,stem+'.attempt.json'),JSON.stringify({
      global_index:global,text_sha256:part.sha256,request_id:id,
      reserved_microusd,model:'gpt-4o-mini-tts',voice:'coral'
     }));
     const transport=makeTransport({enabled:true,
      authorize:async identity=>{
       if(identity.request_id!==id||identity.fragment_index!==global
        ||identity.text_sha256!==part.sha256)return false;
       try{await authority(r);return true;}catch{return false;}
      },
      reserve:async identity=>{
       const attempt=await optional(join(dir,stem+'.attempt.json'));
       const b=await optional(join(dir,'reservation.json'));
       if(attempt?.global_index!==global||attempt?.text_sha256!==identity.text_sha256
        ||b?.request_id!==id||b.reserved_usd!==BUDGET_USD)throw Error('CORAL_REAL_RESERVE');
       return {...identity,reserved_microusd,durable_attempt_written:true};
      }
     });
     let result;inFlight=true;
     try{result=await transport.synthesize({
      request_id:id,fragment_index:global,text:part.text,text_sha256:part.sha256
     });}
     catch{throw Error('CORAL_REAL_UNCERTAIN_NO_RETRY');}
     if(result?.receipt?.text_sha256!==part.sha256||result.receipt.request_id!==id)
      throw Error('CORAL_REAL_UNCERTAIN_NO_RETRY');
     const verified=coralRealSpeechAssembleChapterWav([result.wav]);
     const digest=await durableAudioCommit(join(dir,stem+'.wav'),result.wav);
     if(digest.sha256!==verified.sha256)throw Error('CORAL_REAL_UNCERTAIN_NO_RETRY');
     await durableWrite(join(dir,stem+'.receipt.json'),JSON.stringify({
      request_id:id,fragment_index:global,text_sha256:part.sha256,
      voice:'coral',model:'gpt-4o-mini-tts',wav_sha256:digest.sha256,
      duration_seconds:verified.duration_seconds,provider_cost_microusd:null
     }));
     inFlight=false;
     if(global===0&&!previewApproval){
      await atomicJson(join(dir,'state.json'),{status:'awaiting_preview_approval',completed_chapters:0});
      return state(r,id,folder,true);
     }
    }
    const found=await inspect(r,dir,plan);
    if(!found.complete[ci].done||found.uncertain)throw Error('CORAL_REAL_INCOMPLETE');
    const chapterFile=join(dir,chapter.id+'.wav');
    const prior=await optional(join(dir,chapter.id+'.receipt.json'));
    if(!prior){
     const merged=coralRealSpeechAssembleChapterWav(await Promise.all(
      found.complete[ci].fragments.map(async f=>{
       const {handle}=await privateAudioVerifiedOpen(join(dir,f.stem+'.wav'),f.wav_sha256);
       try{return await handle.readFile();}finally{await handle.close();}
      })
     ));
     await durableAudioCommit(chapterFile,merged.wav);
     await durableWrite(join(dir,chapter.id+'.receipt.json'),JSON.stringify({
      id:chapter.id,text_sha256:chapter.sha256,sha256:merged.sha256,
      duration:merged.duration_seconds
     }));
    }
    completed++;
    await atomicJson(join(dir,'state.json'),{status:'running',completed_chapters:completed});
   }
   const summary=await inspect(r,dir,plan);
   if(summary.uncertain||summary.complete.some(c=>!c.done))throw Error('CORAL_REAL_INCOMPLETE');
   const sections=[];
   for(const c of r.chapters){
    const info=await optional(join(dir,c.id+'.receipt.json'));
    if(!info||info.text_sha256!==c.sha256)throw Error('CORAL_REAL_CHAPTER_SHA');
    const digest=await privateAudioDigest(join(dir,c.id+'.wav'));
    if(digest.sha256!==info.sha256)throw Error('CORAL_REAL_CHAPTER_SHA');
    sections.push(info);
   }
   await authority(r);
   const assembled=await assemblePrivateMp3(dir,sections,audioTools);
   const manifest={contract:'cdc-coral-real-speech-result-v1',
    request_id:id,creation_id:r.creation_id,creation_version:r.creation_version,
    binding_sha256:r.binding_sha256,model:'gpt-4o-mini-tts',voice:'coral',speed:0.93,
    ...assembled,simulated:false,provider_cost_microusd:null,
    provider_billing_verified:false,audio_approved:false,publication_ready:false,
    budget_reserved_usd:BUDGET_USD};
   await durableWrite(join(dir,'manifest.json'),JSON.stringify(manifest));
   await atomicJson(join(dir,'state.json'),{status:'succeeded',
    completed_chapters:7,manifest_sha256:manifest.sha256});
   return state(r,id,folder,true);
  }catch(e){
   const status=inFlight||String(e.message).includes('UNCERTAIN')?'uncertain':'interrupted';
   await atomicJson(join(dir,'state.json'),{status,completed_chapters:completed,
    error:status==='uncertain'?'CORAL_REAL_UNCERTAIN_NO_RETRY':'CORAL_REAL_BLOCKED'});
   return state(r,id,folder,true);
  }
 }
 async function audioStream(r,id,folder){
  await authority(validateCoralRealSpeechRequest(r));
  if((await state(r,id,folder)).status!=='succeeded')throw Error('CORAL_REAL_NO_AUDIO');
  const dir=directory(folder),manifest=await optional(join(dir,'manifest.json'));
  return privateAudioVerifiedOpen(join(dir,manifest.file),manifest.sha256);
 }
 async function previewStream(r,id,folder){
  await authority(validateCoralRealSpeechRequest(r));
  const dir=directory(folder),receipt=await optional(join(dir,'00-00.receipt.json'));
  if(!receipt)throw Error('CORAL_REAL_NO_PREVIEW');
  return privateAudioVerifiedOpen(join(dir,'00-00.wav'),receipt.wav_sha256);
 }
 async function resume(r,id,folder,{ownerAlive=false}={}){
  await authority(validateCoralRealSpeechRequest(r));if(ownerAlive)throw Error('CORAL_REAL_RUNNING');
  const dir=directory(folder),saved=await optional(join(dir,'state.json'));
  if(!['awaiting_preview_approval','interrupted'].includes(saved?.status))
   throw Error('CORAL_REAL_RESUME_REFUSED');
  const plan=parts(r),existing=await inspect(r,dir,plan);
  if(existing.uncertain)throw Error('CORAL_REAL_UNCERTAIN_NO_RETRY');
  const preview=existing.complete[0].fragments[0];
  if(!preview||preview.fragment_index!==0)throw Error('CORAL_REAL_NO_PREVIEW');
  const previous=await optional(join(dir,'preview-approved.json'));
  if(saved.status==='awaiting_preview_approval'){
   if(previous)throw Error('CORAL_REAL_RESUME_REFUSED');
   // Called ONLY by the authenticated Studio form after explicit audio approval.
   await durableWrite(join(dir,'preview-approved.json'),JSON.stringify({
    request_id:id,preview_sha256:preview.wav_sha256,approved_at:new Date().toISOString()
   }));
  }else if(!previous||previous.request_id!==id
    ||previous.preview_sha256!==preview.wav_sha256){
   throw Error('CORAL_REAL_RESUME_REFUSED');
  }
  await atomicJson(join(dir,'state.json'),{status:'queued',completed_chapters:saved.completed_chapters});
  return state(r,id,folder);
 }
 return {state,run,resume,audioStream,previewStream,
  audio:async(r,id,folder)=>{
   const f=await audioStream(r,id,folder);
   try{return await f.handle.readFile();}finally{await f.handle.close();}
  }};
}
