import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runWaitFormAuthMigration} from '../scripts/migrate-cuisine-social-wait-form-auth.mjs';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const template=read('../automation/n8n/01-drafts-email-approval.json');
const credential={id:'test_credential_123',name:'Cuisine du Cambodge - Validation formulaire (Basic Auth)'};
function preparedWorkflow(){
 const wf=structuredClone(template);
 wf.id='WF1';wf.versionId='version-1';wf.activeVersion=null;wf.pinData={};
 const email=wf.nodes.find(n=>n.name==='Envoyer la demande de validation Resend');
 email.parameters.body=email.parameters.body
  .replace('social@CONFIGURER_DOMAINE_VERIFIE','social@cuisine-du-cambodge.com')
  .replace("to:['CONFIGURER_EMAIL_VALIDATION']","to:['review@example.test']");
 email.credentials={httpHeaderAuth:{id:'resend-123',name:'Resend'}};
 return wf;
}
const wait=wf=>wf.nodes.find(n=>n.name==='Attendre une décision via formulaire');
function server({workflow=preparedWorkflow(),inflight=false,concurrent=false,afterDrift=false}={}){
 const calls=[];let current=structuredClone(workflow),reads=0;
 const request=async(path,options={})=>{
  calls.push({path,method:options.method||'GET'});
  if(path.startsWith('/workflows?'))return {data:[{id:'WF1',name:template.name}]};
  if(path.startsWith('/executions?')){
   if(inflight&&path.includes('status=waiting'))return {data:[{id:'live'}]};
   return {data:[]};
  }
  if(path.startsWith('/credentials?'))return {data:[{...credential,type:'httpBasicAuth'}]};
  if(path==='/workflows/WF1'&&options.method==='PUT'){
   const incoming=JSON.parse(options.body);
   current={...current,...incoming,versionId:'version-2'};
   if(afterDrift)current.connections={};
   return {};
  }
  if(path==='/workflows/WF1'){
   reads++;
   if(concurrent&&reads>2)return {...current,versionId:'foreign-version'};
   return structuredClone(current);
  }
  throw Error('Unexpected request: '+path);
 };
 return {request,calls,getCurrent:()=>current};
}
test('default mode never PUTs and does not save snapshots',async()=>{
 const s=server();
 let snapshots=0;
 const out=await runWaitFormAuthMigration({request:s.request,credential,backup:async()=>snapshots++});
 assert.equal(out.changed,true);assert.equal(out.applied,false);
 assert.equal(snapshots,0);
 assert.ok(s.calls.every(x=>x.method==='GET'));
 assert.equal(wait(s.getCurrent()).parameters.incomingAuthentication,undefined);
});
test('both maintenance approval and backup are mandatory',async()=>{
 const s=server();
 await assert.rejects(runWaitFormAuthMigration({request:s.request,credential,apply:true,confirmed:false}));
 await assert.rejects(runWaitFormAuthMigration({request:s.request,credential,apply:true,confirmed:true}));
 assert.ok(s.calls.every(x=>x.method==='GET'));
});
test('single allowed update preserves graph and requires post-write verification',async()=>{
 const s=server();let backupValue=null, backups=0;
 const result=await runWaitFormAuthMigration({request:s.request,credential,apply:true,confirmed:true,
  backup:async snapshot=>{backupValue=structuredClone(snapshot);backups++;}
 });
 assert.equal(result.applied,true);
 assert.equal(backups,1);
 assert.equal(wait(backupValue).parameters.incomingAuthentication,undefined);
 assert.equal(wait(s.getCurrent()).parameters.incomingAuthentication,'basicAuth');
 assert.deepEqual(wait(s.getCurrent()).credentials,{httpBasicAuth:credential});
 assert.equal(s.getCurrent().active,false);
 assert.equal(s.calls.filter(x=>x.method==='PUT').length,1);
 assert.equal(s.calls.at(-1).method,'GET');
});
test('pending execution, unexpected mutation and concurrent edit block update',async()=>{
 for(const opts of [{inflight:true},{concurrent:true}]){
  const s=server(opts);
  await assert.rejects(runWaitFormAuthMigration({request:s.request,credential,
    apply:true,confirmed:true,backup:async()=>{}}));
  assert.equal(s.calls.filter(x=>x.method==='PUT').length,0);
 }
 const drift=server({afterDrift:true});
 await assert.rejects(runWaitFormAuthMigration({request:drift.request,credential,
  apply:true,confirmed:true,backup:async()=>{}}));
 assert.equal(drift.calls.filter(x=>x.method==='PUT').length,1);
});
test('idempotence: protected form is not re-uploaded',async()=>{
 const secured=preparedWorkflow();
 wait(secured).parameters.incomingAuthentication='basicAuth';
 wait(secured).credentials={httpBasicAuth:credential};
 const s=server({workflow:secured});
 const result=await runWaitFormAuthMigration({request:s.request,credential,
  apply:true,confirmed:true,backup:async()=>{throw Error('Backup should not run');}});
 assert.equal(result.applied,false);
 assert.equal(s.calls.filter(x=>x.method==='PUT').length,0);
});
test('standalone runner has fail-closed CLI flags, HTTPS pin and 0600 snapshot',()=>{
 const source=readFileSync(new URL('../scripts/migrate-cuisine-social-wait-form-auth.mjs',import.meta.url),'utf8');
 for(const token of ['--apply','--approve-single-wait-auth-update',
  'N8N_FORM_AUTH_MAINTENANCE_CONFIRMED','YES_NO_RUNNING_WAITS',
  'n8n.orvekio.com', "mode:0o600", "flag:'wx'",'verifyUnchanged',
  'versionId','dryRunWaitFormAuth'])
  assert.ok(source.includes(token),token);
});
