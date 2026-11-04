/**
 * Optional external TEXT provider for the EXISTING /editorial-ai/v1/jobs worker.
 * Safe defaults: never selected until the owner has qualified a model and
 * explicitly sets the production gate. No TTS, new service, or n8n workflow.
 *
 * A durable budget reserve is written BEFORE any model call. No request
 * retries; never refund uncertain/partial calls. A failed process holds its
 * reservation. Any stale lock blocks future jobs until manually audited.
 */
import {mkdir,lstat,readFile,writeFile,rename,rmdir} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {resolve,join} from 'node:path';
import {coralExternalRequestBody,coralExternalResult,coralExternalEstimatedUsd,
  CORAL_EXTERNAL_MODELS} from './coral-text-api-contract.mjs';

const ids=['intro','installer','preparer','assembler','maitriser','rectifier','terminer'];
const MAX_OUTPUT_TOKENS=1800;
const BASE='https://api.openai.com/v1/responses';
function positiveUsd(value,name,upper){
  if(typeof value!=='number'||!Number.isFinite(value)||value<=0||value>upper)
    throw Error('CORAL_EXTERNAL_'+name);
  return value;
}
async function enforcePrivate(dir){
  await mkdir(dir,{recursive:true,mode:0o700});
  const info=await lstat(dir);
  if(!info.isDirectory()||info.isSymbolicLink()||
      (process.platform!=='win32'&&(info.mode&0o077)!==0))
    throw Error('CORAL_EXTERNAL_PRIVATE_DIR');
  return dir;
}
export async function reserveCoralBudget({budgetDir,jobId,model,costUsd,
  maxDailyUsd=0.75}){
  if(typeof jobId!=='string'||!/^[a-f0-9]{48}$/.test(jobId))throw Error('CORAL_EXTERNAL_JOB_ID');
  positiveUsd(costUsd,'RESERVATION',0.75);
  positiveUsd(maxDailyUsd,'DAILY_LIMIT',0.75);
  const dir=await enforcePrivate(resolve(budgetDir));
  const day=new Date().toISOString().slice(0,10);
  const dayPath=join(dir,'budget-'+day+'.json'),lock=join(dir,'budget-'+day+'.lock');
  // mkdir is atomic across Node workers/processes; stale lock fails closed.
  await mkdir(lock,{mode:0o700});
  try{
    let old={contract:'cdc-coral-daily-reservations-v1',day,requests:[]};
    try{old=JSON.parse(await readFile(dayPath,'utf8'))}
    catch(e){if(e.code!=='ENOENT')throw e;}
    if(old.contract!=='cdc-coral-daily-reservations-v1'||old.day!==day
      ||!Array.isArray(old.requests)||old.requests.length>500)
      throw Error('CORAL_EXTERNAL_BUDGET_CORRUPT');
    if(old.requests.some(x=>x.jobId===jobId))throw Error('CORAL_EXTERNAL_ALREADY_RESERVED');
    const before=old.requests.reduce((sum,x)=>sum+x.reservedUsd,0);
    if(!Number.isFinite(before)||before<0||before+costUsd>maxDailyUsd)
      throw Error('CORAL_EXTERNAL_BUDGET_LIMIT');
    old.requests.push({jobId,model,reservedUsd:costUsd,at:new Date().toISOString(),
      state:'unknown-after-reservation'});
    const tmp=join(dir,'.reserve-'+randomBytes(12).toString('hex'));
    await writeFile(tmp,JSON.stringify(old),{flag:'wx',mode:0o600});
    await rename(tmp,dayPath);
    return {day,reservedUsd:costUsd,totalReservedUsd:before+costUsd};
  }finally{await rmdir(lock);}
}
export function createExternalCoralJobProvider({
  apiKey,model,budgetDir,maxDailyUsd=0.75,fetcher=fetch
}={}){
  if(typeof apiKey!=='string'||!/^sk-[\w-]{18,}$/.test(apiKey))
    throw Error('CORAL_EXTERNAL_KEY_UNAVAILABLE');
  if(!Object.hasOwn(CORAL_EXTERNAL_MODELS,model))
    throw Error('CORAL_EXTERNAL_MODEL_NOT_ALLOWED');
  if(!budgetDir)throw Error('CORAL_EXTERNAL_BUDGET_DIR');
  positiveUsd(maxDailyUsd,'DAILY_LIMIT',0.75);
  return async (request,jobId)=>{
    if(request?.contract!=='cdc-coral-v2-script-request-v1'
      ||request?.scope!=='workshop-seven-spoken-scripts-v1'
      ||!Array.isArray(request.atelier?.phases)||request.atelier.phases.length!==6
      ||!request.reference?.recipe_fields?.ingredients?.length
      ||!request.reference?.recipe_fields?.steps?.length)
      throw Error('CORAL_EXTERNAL_REQUEST_INVALID');
    const calls=ids.map((id,index)=>{
      const source={chapterId:id,content:{
        structure:request.referentials.structure.text,
        narration:request.referentials.narration.text,
        canonicalRecipe:request.reference.recipe_fields,
        workshop:{title:request.atelier.title,
          fields:request.atelier.fields,
          phase:index===0?null:request.atelier.phases[index-1]},
        chapterId:id
      }};
      const body=coralExternalRequestBody(model,source);
      const reservation=coralExternalEstimatedUsd(
        Buffer.byteLength(JSON.stringify(body)),MAX_OUTPUT_TOKENS,model);
      return {id,body,reservation};
    });
    const total=Number(calls.reduce((sum,c)=>sum+c.reservation,0).toFixed(8));
    if(total>0.75)throw Error('CORAL_EXTERNAL_JOB_BUDGET');
    await reserveCoralBudget({budgetDir,jobId,model,costUsd:total,maxDailyUsd});
    const chapters=[];
    for(const {id,body} of calls){
      const response=await fetcher(BASE,{method:'POST',
        headers:{'Content-Type':'application/json',Authorization:'Bearer '+apiKey},
        body:JSON.stringify(body),signal:AbortSignal.timeout(90000)});
      if(!response.ok)throw Error('CORAL_EXTERNAL_HTTP_'+response.status);
      const raw=await response.text();
      if(Buffer.byteLength(raw)>80000)throw Error('CORAL_EXTERNAL_OVERSIZE');
      const parsed=coralExternalResult(JSON.parse(raw),id);
      // Per-chapter budget was reserved by its maximal possible token usage.
      const spent=coralExternalEstimatedUsd(parsed.inputTokens,parsed.outputTokens,model);
      const allocated=calls.find(x=>x.id===id).reservation;
      if(spent>allocated)throw Error('CORAL_EXTERNAL_BUDGET_OVERRUN');
      chapters.push({id,text:parsed.text});
      if(Buffer.byteLength(JSON.stringify({chapters}))>30000)
        throw Error('CORAL_EXTERNAL_OUTPUT_TOO_LONG');
    }
    return JSON.stringify({chapters});
  };
}
