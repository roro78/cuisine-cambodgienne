#!/usr/bin/env node
/**
 * Optional single-node n8n Wait FORM Basic Auth migration.
 * No write unless TWO explicit CLI approvals + a private maintenance flag.
 * Reads metadata only; never reads credential usernames/passwords.
 * DO NOT use while a Wait execution exists or editorial workflow can start.
 */
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {dryRunWaitFormAuth} from './audit-cuisine-social-wait-form-auth.mjs';
import {planWaitFormBasicAuth} from './cuisine-social-wait-form-auth-plan.mjs';
import {asPayload} from './sync-cuisine-n8n-runtime.mjs';

const reviewed=JSON.parse(readFileSync(
  new URL('../automation/n8n/01-drafts-email-approval.json',import.meta.url),'utf8'));
const oldEmail=JSON.parse(readFileSync(
  new URL('../tests/fixtures/social-resend-email-predecessor.json',import.meta.url),'utf8')).body;
const NODE='Attendre une décision via formulaire';
const remainingNames=x=>x.nodes.filter(n=>n.name!==NODE);
function verifyUnchanged(before,after){
  assert.deepEqual(remainingNames(after),remainingNames(before),
    'Unrelated n8n nodes changed');
  for(const key of ['id','name','active','activeVersion','connections','settings',
    'pinData','staticData','description','tags','shared','parentFolderId','projectId','nodeGroups'])
    assert.deepEqual(after[key],before[key],'Unexpected n8n change: '+key);
}
function checkedPlan(live,credential){
  const plan=planWaitFormBasicAuth(live,reviewed,oldEmail,credential);
  verifyUnchanged(live,plan.update);
  return plan;
}
export async function runWaitFormAuthMigration({request,credential,apply=false,confirmed=false,backup}){
  assert.equal(apply,confirmed,'Write requires explicit maintenance confirmation');
  const check=await dryRunWaitFormAuth({request,credential});
  assert.ok(check.versionId&&typeof check.versionId==='string',
    'n8n workflow versionId absent');
  if(!apply)return {changed:check.changed,applied:false};
  if(!check.changed)return {changed:false,applied:false};
  assert.equal(typeof backup,'function','Private backup handler required');
  // Re-inspect executions and credentials from the server immediately before PUT.
  const justBefore=await dryRunWaitFormAuth({request,credential});
  assert.equal(justBefore.workflowId,check.workflowId,'Workflow changed during review');
  assert.equal(justBefore.versionId,check.versionId,'Concurrent workflow version change');
  assert.equal(justBefore.changed,true,'Wait auth unexpectedly installed by another operator');
  const path='/workflows/'+encodeURIComponent(check.workflowId);
  const live=await request(path);
  assert.equal(live.versionId,check.versionId,'Concurrent n8n change before PUT');
  const plan=checkedPlan(live,credential);
  assert.equal(plan.changed,true,'No expected single Wait change');
  await backup(live);
  await request(path,{method:'PUT',headers:{'Content-Type':'application/json'},
    body:JSON.stringify(asPayload(plan.update))});
  // A successful PUT is not proof of correctness: verify the exact server state.
  const after=await request(path);
  verifyUnchanged(live,after);
  assert.equal(after.active,false,'Workflow must remain inactive');
  assert.ok(!after.activeVersion,'Wait auth update inadvertently published');
  const result=checkedPlan(after,credential);
  assert.equal(result.changed,false,'Wait Basic Auth not verified after PUT');
  assert.deepEqual(after.nodes,plan.update.nodes,'Unexpected change to workflow node graph');
  return {changed:true,applied:true};
}
async function main(){
  const args=process.argv.slice(2);
  assert.ok(args.every(a=>['--apply','--approve-single-wait-auth-update'].includes(a)),
    'Unexpected CLI option');
  assert.equal(new Set(args).size,args.length,'Duplicated CLI option');
  const apply=args.includes('--apply');
  const agreed=args.includes('--approve-single-wait-auth-update');
  assert.equal(apply,agreed,'Write requires both explicit CLI flags');
  const confirmed=apply&&process.env.N8N_FORM_AUTH_MAINTENANCE_CONFIRMED==='YES_NO_RUNNING_WAITS';
  if(apply)assert.ok(confirmed,'Maintenance window confirmation missing');
  const key=process.env.N8N_API_KEY;
  assert.ok(typeof key==='string'&&key,'Private N8N_API_KEY missing');
  const credential={
    id:process.env.N8N_WAIT_BASIC_CREDENTIAL_ID,
    name:'Cuisine du Cambodge - Validation formulaire (Basic Auth)'
  };
  const origin=new URL(process.env.N8N_BASE_URL||'https://n8n.orvekio.com');
  assert.equal(origin.origin,'https://n8n.orvekio.com');
  assert.equal(origin.pathname.replace(/\/$/,''),'');
  assert.ok(!origin.search&&!origin.hash&&!origin.username&&!origin.password);
  const request=async (path,options={})=>{
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
    try{
      const response=await fetch(origin.origin+'/api/v1'+path,{
        ...options,redirect:'error',signal:controller.signal,
        headers:{Accept:'application/json','X-N8N-API-KEY':key,...options.headers}
      });
      if(!response.ok)throw Error('n8n HTTP '+response.status+' on '+path.split('?')[0]);
      return response.json();
    }finally{clearTimeout(timer)}
  };
  const backup=async snapshot=>{
    const dir=join(homedir(),'.local','share','cuisine-n8n-backups');
    mkdirSync(dir,{recursive:true,mode:0o700});
    assert.match(snapshot.id,/^[A-Za-z0-9_-]+$/,'Invalid backup workflow id');
    const timestamp=new Date().toISOString().replace(/[:.]/g,'-');
    const file=join(dir,'cuisine-wait-auth01-'+snapshot.id+'-'+timestamp+'.json');
    writeFileSync(file,JSON.stringify(snapshot,null,2)+'\n',{flag:'wx',mode:0o600});
    console.log('Private n8n workflow backup saved with restrictive permissions.');
  };
  const result=await runWaitFormAuthMigration({request,credential,apply,confirmed,backup});
  console.log(result.applied?'One Wait FORM credential reference installed and verified.':
    result.changed?'GET-only completed: guarded Wait update prepared.':
    'GET-only completed: Wait FORM already protected, no write.');
  console.log('No workflow activation, Wait execution, Resend or Meta call.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
  main().catch(e=>{console.error('STOP: '+e.message);process.exitCode=1;});
