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
export async function dryRunWaitFormAuth({request,credential}){
  let cursor, found=[];
  do {
    const query=new URLSearchParams({limit:'100'});
    if(cursor) query.set('cursor',cursor);
    const page=await request('/workflows?'+query);
    assert.ok(Array.isArray(page.data),'Invalid n8n workflow list');
    found.push(...page.data.filter(w=>w.name===NAME).map(w=>String(w.id)));
    cursor=page.nextCursor||null;
  } while(cursor);
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
  const live=await request('/workflows/'+encodeURIComponent(id));
  assert.equal(live.id,id,'Workflow identity mismatch');
  const outcome=planWaitFormBasicAuth(live,
    load('../automation/n8n/01-drafts-email-approval.json'),
    load('../tests/fixtures/social-resend-email-predecessor.json').body,
    credential);
  return {changed:outcome.changed,workflowId:id,versionId:live.versionId,
    credentialName:outcome.credentialReference.name};
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
