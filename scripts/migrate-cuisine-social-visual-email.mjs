#!/usr/bin/env node
/**
 * Cuisine du Cambodge — approval email only, fail-closed live n8n migration.
 *
 * Default: read-only. Optional write requires two explicit flags.
 * No run/activation/email/Meta call. No token or email address in logs.
 *
 * Local operator usage:
 * N8N_API_KEY=<PRIVATE_IN_TERMINAL> node scripts/migrate-cuisine-social-visual-email.mjs
 * N8N_API_KEY=<PRIVATE_IN_TERMINAL> node scripts/migrate-cuisine-social-visual-email.mjs --apply --approve-single-workflow-update
 */
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {planVisualApprovalEmail} from './cuisine-social-visual-email-migration.mjs';
import {asPayload} from './sync-cuisine-n8n-runtime.mjs';

const TARGET='Cuisine du Cambodge - 01 - Brouillon IA et validation email';
const load=(path)=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const assertSame=(before,after)=>{
  // PUT must touch nothing except the Resend email body and version metadata.
  for(const field of ['name','active','activeVersion','connections','settings','pinData','staticData',
    'description','tags','shared','parentFolderId','projectId','nodeGroups']){
    assert.deepEqual(after[field],before[field],'Post-write drift: '+field);
  }
  const otherNodes=nodes=>nodes.filter(n=>n.name!=='Envoyer la demande de validation Resend');
  assert.deepEqual(otherNodes(after.nodes),otherNodes(before.nodes),'Post-write non-Resend node drift');
  const a=after.nodes.find(n=>n.name==='Envoyer la demande de validation Resend');
  const b=before.nodes.find(n=>n.name==='Envoyer la demande de validation Resend');
  assert.ok(a&&b,'Missing Resend node');
  const strip=n=>{const x=structuredClone(n);delete x.parameters.body;return x;};
  assert.deepEqual(strip(a),strip(b),'Post-write Resend credential/parameter drift');
  assert.equal(after.active,false,'ALERT: workflow activated');
  assert.ok(!after.activeVersion,'ALERT: workflow published');
};
async function main(){
  const args=process.argv.slice(2);
  const apply=args.includes('--apply');
  const approved=args.includes('--approve-single-workflow-update');
  assert.ok(args.every(x=>['--apply','--approve-single-workflow-update'].includes(x)) &&
    new Set(args).size===args.length,'Unexpected CLI arguments');
  assert.equal(apply,approved,'To write, both --apply and --approve-single-workflow-update are required');
  const key=process.env.N8N_API_KEY;
  assert.ok(key,'Missing N8N_API_KEY in secure terminal');
  const url=new URL(process.env.N8N_BASE_URL||'https://n8n.orvekio.com');
  assert.equal(url.origin,'https://n8n.orvekio.com','Unexpected n8n host');
  assert.equal(url.pathname.replace(/\/$/,''),'','Unexpected n8n path');
  assert.ok(!url.username&&!url.password&&!url.search&&!url.hash,'Unexpected n8n URL');
  const origin=url.origin+'/api/v1';
  async function request(path,options={}){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),15000);
    try{
      const res=await fetch(origin+path,{
        ...options,redirect:'error',signal:controller.signal,
        headers:{Accept:'application/json','X-N8N-API-KEY':key,...options.headers}
      });
      if(!res.ok)throw Error('n8n HTTP '+res.status+' on '+path.split('?')[0]);
      return res.json();
    }finally{clearTimeout(timer)}
  }
  const prev=load('../tests/fixtures/social-resend-email-predecessor.json').body;
  const reviewed=load('../automation/n8n/01-drafts-email-approval.json');
  let ids=[],cursor;
  do{
    const query=new URLSearchParams({limit:'100'});
    if(cursor)query.set('cursor',cursor);
    const page=await request('/workflows?'+query.toString());
    assert.ok(Array.isArray(page.data),'Invalid n8n list response');
    ids.push(...page.data.filter(w=>w.name===TARGET).map(w=>String(w.id)));
    cursor=page.nextCursor||null;
  }while(cursor);
  assert.equal(ids.length,1,'Ambiguous/missing Cuisine workflow 01');
  const id=ids[0];
  assert.match(id,/^[a-zA-Z0-9_-]+$/,'Unexpected workflow id');
  const path='/workflows/'+encodeURIComponent(id);
  const live=await request(path);
  const plan=planVisualApprovalEmail(live,reviewed,prev);
  console.log('Visual social approval email: '+(plan.changed?'one email template change planned':'already current')+'.');
  console.log('Resend sender/recipient recognized: '+(plan.hasConfiguredSender&&plan.hasConfiguredRecipient?'configured':'placeholder present; write forbidden')+'.');
  if(!apply){
    console.log('GET-only dry-run complete. No n8n update, email, execution, Meta call or activation.');
    return;
  }
  assert.ok(plan.hasConfiguredSender&&plan.hasConfiguredRecipient,
    'Missing configured Resend sender/recipient; write blocked');
  if(!plan.changed){console.log('Nothing to apply; workflow remains inactive.');return;}
  const latest=await request(path);
  assert.equal(typeof live.versionId,'string','Missing n8n version identifier');
  assert.equal(latest.versionId,live.versionId,'Concurrent edit: version changed');
  for(const field of ['nodes','connections','settings','staticData','name','description','nodeGroups',
    'pinData','active','activeVersion','tags','shared','parentFolderId','projectId']){
    assert.deepEqual(latest[field],live[field],'Concurrent change to '+field);
  }
  const now=planVisualApprovalEmail(latest,reviewed,prev);
  assert.equal(now.changed,true,'Plan changed since dry-run');
  assertSame(latest,{...now.update,active:false,activeVersion:latest.activeVersion});
  const backupDir=join(homedir(),'.local','share','cuisine-n8n-backups');
  mkdirSync(backupDir,{recursive:true,mode:0o700});
  const backup=join(backupDir,'cuisine-email01-'+id+'-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json');
  writeFileSync(backup,JSON.stringify(latest,null,2)+'\n',{mode:0o600,flag:'wx'});
  console.log('Private backup created (0600); issuing one workflow update.');
  await request(path,{method:'PUT',headers:{'Content-Type':'application/json'},
    body:JSON.stringify(asPayload(now.update))});
  const after=await request(path);
  assertSame(latest,after);
  const checked=planVisualApprovalEmail(after,reviewed,prev);
  assert.equal(checked.changed,false,'Post-write template mismatch');
  console.log('n8n 01 email-only migration independently verified; workflow remains INACTIVE.');
  console.log('No email sent, no n8n run or activation, no Facebook/Instagram publication.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  main().catch(e=>{console.error('STOP: '+e.message);process.exitCode=1;});
}
