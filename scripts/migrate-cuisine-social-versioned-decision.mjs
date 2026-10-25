#!/usr/bin/env node
/**
 * Change only version-bound decision persistence on Cuisine n8n workflow 01.
 * Safe GET-only dry-run by default. NEVER activate, execute or publish.
 */
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {planVisualApprovalEmail} from './cuisine-social-visual-email-migration.mjs';
import {asPayload} from './sync-cuisine-n8n-runtime.mjs';

const NAME='Cuisine du Cambodge - 01 - Brouillon IA et validation email';
const DECISION='Interpréter la décision',PERSIST='Persister la décision humaine';
const load=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const pick=(wf,name)=>{
  const matches=wf.nodes.filter(n=>n.name===name);
  assert.equal(matches.length,1,'Missing/duplicate workflow node: '+name);
  return matches[0];
};
const oldMatches=(live,previous)=>{
  const d=pick(live,DECISION).parameters;
  const p=pick(live,PERSIST).parameters;
  return d.jsCode===previous.decisionCode && p.query===previous.persistenceQuery &&
    isDeepStrictEqual(p.options.queryReplacement,previous.queryReplacement);
};
const newMatches=(live,reviewed)=>{
  const d=pick(live,DECISION).parameters,rd=pick(reviewed,DECISION).parameters;
  const p=pick(live,PERSIST).parameters,rp=pick(reviewed,PERSIST).parameters;
  return d.jsCode===rd.jsCode && p.query===rp.query &&
    isDeepStrictEqual(p.options.queryReplacement,rp.options.queryReplacement);
};
const compareWithout=(a,b,names)=>{
  const copy=x=>x.nodes.filter(n=>!names.includes(n.name));
  assert.deepEqual(copy(a),copy(b),'Unexpected change outside review decision');
  for(const field of ['name','active','activeVersion','connections','settings','pinData',
    'staticData','description','tags','shared','parentFolderId','projectId','nodeGroups'])
    assert.deepEqual(a[field],b[field],'Unexpected change in workflow field: '+field);
};
export function planVersionedSocialDecision(live,reviewed,previous,previousEmailBody){
  assert.equal(live.name,NAME);
  // Reject any rewritten routing, including a Wait bypass unrelated to the email node.
  assert.deepEqual(live.connections,reviewed.connections,'Unexpected live n8n routing drift');
  planVisualApprovalEmail(live,reviewed,previousEmailBody); // recognized Resend template + full n8n gate
  const prelock=oldMatches(live,previous);
  const postlock=newMatches(live,reviewed);
  assert.ok(prelock||postlock,'Unknown or partially migrated approval code/SQL');
  const update=structuredClone(live);
  if(prelock){
    pick(update,DECISION).parameters.jsCode=pick(reviewed,DECISION).parameters.jsCode;
    const p=pick(update,PERSIST).parameters,rp=pick(reviewed,PERSIST).parameters;
    p.query=rp.query;
    p.options.queryReplacement=rp.options.queryReplacement;
  }
  compareWithout(update,live,[DECISION,PERSIST]);
  for(const name of [DECISION,PERSIST]){
    const oldNode=structuredClone(pick(live,name));
    const newNode=structuredClone(pick(update,name));
    if(name===DECISION){delete oldNode.parameters.jsCode;delete newNode.parameters.jsCode;}
    else {
      delete oldNode.parameters.query;delete newNode.parameters.query;
      delete oldNode.parameters.options.queryReplacement;
      delete newNode.parameters.options.queryReplacement;
    }
    assert.deepEqual(newNode,oldNode,'Unexpected mutation of node metadata: '+name);
  }
  const payload=asPayload(update);
  assert.equal(payload.name,live.name);
  assert.equal(update.active,false);
  assert.ok(!update.activeVersion);
  return {update,changed:prelock};
}
function verifyAfter(before,after){
  compareWithout(after,before,[DECISION,PERSIST]);
  assert.equal(after.active,false,'Workflow activated');
  assert.ok(!after.activeVersion,'Workflow published');
}
async function main(){
  const args=process.argv.slice(2);
  const apply=args.includes('--apply'),approved=args.includes('--approve-single-workflow-update');
  assert.ok(args.every(x=>['--apply','--approve-single-workflow-update'].includes(x)) &&
    new Set(args).size===args.length,'Unexpected CLI flags');
  assert.equal(apply,approved,'Write requires both flags');
  const key=process.env.N8N_API_KEY;
  assert.ok(key,'Missing private N8N_API_KEY');
  const url=new URL(process.env.N8N_BASE_URL||'https://n8n.orvekio.com');
  assert.equal(url.origin,'https://n8n.orvekio.com','Unexpected n8n host');
  assert.equal(url.pathname.replace(/\/$/,''),'','Unexpected n8n path');
  assert.ok(!url.search&&!url.hash&&!url.username&&!url.password,'Unexpected URL components');
  async function request(path,options={}){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
    try{
      const response=await fetch(url.origin+'/api/v1'+path,{
        ...options,redirect:'error',signal:controller.signal,
        headers:{Accept:'application/json','X-N8N-API-KEY':key,...options.headers}});
      if(!response.ok)throw Error('n8n HTTP '+response.status+' on '+path.split('?')[0]);
      return response.json();
    }finally{clearTimeout(timer)}
  }
  const reviewed=load('../automation/n8n/01-drafts-email-approval.json');
  const previous=load('../tests/fixtures/social-version-approval-predecessor.json');
  const oldEmail=load('../tests/fixtures/social-resend-email-predecessor.json').body;
  let ids=[],cursor;
  do{
    const params=new URLSearchParams({limit:'100'});
    if(cursor)params.set('cursor',cursor);
    const page=await request('/workflows?'+params);
    assert.ok(Array.isArray(page.data),'Invalid n8n list');
    ids.push(...page.data.filter(w=>w.name===NAME).map(w=>String(w.id)));
    cursor=page.nextCursor||null;
  }while(cursor);
  assert.equal(ids.length,1,'Missing or ambiguous Cuisine workflow 01');
  const id=ids[0];
  assert.match(id,/^[A-Za-z0-9_-]+$/,'Invalid workflow ID');
  const path='/workflows/'+encodeURIComponent(id);
  const live=await request(path);
  const planned=planVersionedSocialDecision(live,reviewed,previous,oldEmail);
  console.log('Versioned approval guard: '+(planned.changed?'one guarded update pending':'already installed'));
  if(!apply){
    console.log('GET-only complete. No workflow edit, email, Meta call, database write or activation.');
    return;
  }
  if(!planned.changed){console.log('Already installed. No write.');return;}
  assert.equal(typeof live.versionId,'string','Missing workflow versionId');
  const latest=await request(path);
  assert.equal(latest.versionId,live.versionId,'Concurrent n8n edit');
  assert.deepEqual(latest.nodes,live.nodes,'Concurrent n8n node change');
  for(const field of ['connections','settings','pinData','staticData','name','description',
     'active','activeVersion','tags','shared','parentFolderId','projectId','nodeGroups'])
    assert.deepEqual(latest[field],live[field],'Concurrent edit: '+field);
  const plan=planVersionedSocialDecision(latest,reviewed,previous,oldEmail);
  assert.equal(plan.changed,true);
  verifyAfter(latest,plan.update);
  const dir=join(homedir(),'.local','share','cuisine-n8n-backups');
  mkdirSync(dir,{recursive:true,mode:0o700});
  const backup=join(dir,'cuisine-decision01-'+id+'-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json');
  writeFileSync(backup,JSON.stringify(latest,null,2)+'\n',{mode:0o600,flag:'wx'});
  console.log('Private backup 0600 saved; applying one workflow 01 guarded update.');
  await request(path,{method:'PUT',headers:{'Content-Type':'application/json'},
    body:JSON.stringify(asPayload(plan.update))});
  const after=await request(path);
  verifyAfter(latest,after);
  const checked=planVersionedSocialDecision(after,reviewed,previous,oldEmail);
  assert.equal(checked.changed,false,'Post-write version guard mismatch');
  console.log('Verified inactive n8n workflow 01; no execution or publication triggered.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
  main().catch(error=>{console.error('STOP: '+error.message);process.exitCode=1;});
