#!/usr/bin/env node
/**
 * READ-ONLY runtime preflight for optional n8n Wait FORM Basic Auth migration.
 * Intentionally has NO PUT, PATCH, POST or credential creation action.
 * Approval authority remains the existing n8n Wait + atomic SQL.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {planWaitFormBasicAuth} from './cuisine-social-wait-form-auth-plan.mjs';
const NAME='Cuisine du Cambodge - 01 - Brouillon IA et validation email';
const load=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
// Refuse pagination loops, excessive/ambiguous listing, and hidden concurrent edits.
async function readPaged(request,endpoint,collect,{maxPages=20}={}){
  const cursors=new Set();
  let cursor=null;
  for(let pageNo=0;pageNo<maxPages;pageNo++){
    const query=new URLSearchParams({limit:'100'});
    if(cursor)query.set('cursor',cursor);
    const page=await request(endpoint+(endpoint.includes('?')?'&':'?')+query.toString());
    assert.ok(Array.isArray(page?.data),'Malformed n8n list: '+endpoint.split('?')[0]);
    for(const item of page.data)collect(item);
    if(!page.nextCursor)return;
    assert.ok(typeof page.nextCursor==='string'&&page.nextCursor.length<=1024,
      'Invalid n8n cursor');
    assert.ok(!cursors.has(page.nextCursor),'Repeated n8n cursor');
    cursors.add(page.nextCursor);
    cursor=page.nextCursor;
  }
  throw Error('n8n list too large for a complete GET-only safety audit');
}
export async function dryRunWaitFormAuth({request,credential}){
  let found=[];
  await readPaged(request,'/workflows',w=>{
    if(w?.name===NAME)found.push(String(w.id));
  });
  assert.equal(found.length,1,'Missing or ambiguous Cuisine 01 workflow');
  const id=found[0];
  assert.match(id,/^[A-Za-z0-9_-]+$/,'Unsafe workflow id');
  for(const status of ['waiting','running']){
    const q=new URLSearchParams({workflowId:id,status,limit:'100'});
    const page=await request('/executions?'+q);
    assert.ok(Array.isArray(page.data),'Cannot verify n8n '+status+' executions');
    assert.equal(page.data.length,0,'Live '+status+' execution: do not change Wait authentication');
    assert.ok(!page.nextCursor,'Ambiguous n8n '+status+' pagination');
  }
  // An independent, UNFILTERED inspection defeats false confidence from
  // API implementations ignoring the waiting/running query parameter.
  // Any incomplete history, missing identity, or unfamiliar state fails closed.
  const completedStates=new Set(['success','error','canceled','crashed']);
  let inspected=0;
  await readPaged(request,'/executions?workflowId='+encodeURIComponent(id),execution=>{
    inspected++;
    assert.ok(execution&&String(execution.workflowId)===id,
      'n8n execution missing/mismatched workflow ID');
    assert.ok(completedStates.has(execution.status),
      'Unfinished or unfamiliar execution state: migration blocked');
  });
  // Credential metadata only: private API never exposes Basic Auth secrets.
  // An API key without credential:list permission fails closed.
  let credentials=[];
  await readPaged(request,'/credentials',c=>{
    if(c&&String(c.id)===credential?.id)credentials.push(c);
  });
  assert.equal(credentials.length,1,'Wait credential missing, ambiguous or not visible');
  assert.equal(credentials[0].name,credential.name,'Wrong Wait credential name');
  assert.equal(credentials[0].type,'httpBasicAuth','Credential is not HTTP Basic Auth');
  const live=await request('/workflows/'+encodeURIComponent(id));
  assert.equal(live.id,id,'Workflow identity mismatch');
  const outcome=planWaitFormBasicAuth(live,
    load('../automation/n8n/01-drafts-email-approval.json'),
    load('../tests/fixtures/social-resend-email-predecessor.json').body,
    credential);
  return {changed:outcome.changed,workflowId:id,versionId:live.versionId,
    inspectedExecutions:inspected,credentialName:outcome.credentialReference.name};
}
async function main(){
  assert.equal(process.argv.length,2,'Read-only preflight accepts no write arguments');
  const key=process.env.N8N_API_KEY;
  assert.ok(typeof key==='string'&&key,'Private N8N_API_KEY required');
  const id=process.env.N8N_WAIT_BASIC_CREDENTIAL_ID;
  const name='Cuisine du Cambodge - Validation formulaire (Basic Auth)';
  const url=new URL(process.env.N8N_BASE_URL||'https://n8n.orvekio.com');
  assert.equal(url.origin,'https://n8n.orvekio.com');
  assert.equal(url.pathname.replace(/\/$/,''),'');
  assert.ok(!url.username&&!url.password&&!url.search&&!url.hash);
  const request=async(path)=>{
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
    try {
      const response=await fetch(url.origin+'/api/v1'+path,{
        method:'GET',headers:{Accept:'application/json','X-N8N-API-KEY':key},
        redirect:'error',signal:controller.signal
      });
      if(!response.ok) throw Error('n8n read failed HTTP '+response.status);
      return await response.json();
    }finally{clearTimeout(timer)}
  };
  const plan=await dryRunWaitFormAuth({request,credential:{id,name}});
  // Never print credential IDs, n8n resume URLs, passwords or private endpoints.
  console.log('Wait FORM security review: '+(plan.changed?'eligible for guarded Basic Auth migration':'already protected'));
  console.log('GET-only — no n8n, Resend, Meta or database writes.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
 main().catch(e=>{console.error('STOP: '+e.message);process.exitCode=1});
