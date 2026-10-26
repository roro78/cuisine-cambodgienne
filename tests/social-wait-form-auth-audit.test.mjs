import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dryRunWaitFormAuth} from '../scripts/audit-cuisine-social-wait-form-auth.mjs';
const load=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const target=load('../automation/n8n/01-drafts-email-approval.json');
const ref={id:'credential_ref_123',name:'Cuisine du Cambodge - Validation formulaire (Basic Auth)'};
const workflow=()=>{
 const w=structuredClone(target);
 w.id='wf_123';w.activeVersion=null;w.versionId='v1';w.pinData={};
 const email=w.nodes.find(n=>n.name==='Envoyer la demande de validation Resend');
 email.parameters.body=email.parameters.body.replace('social@CONFIGURER_DOMAINE_VERIFIE','social@cuisine-du-cambodge.com')
  .replace("to:['CONFIGURER_EMAIL_VALIDATION']","to:['review@example.test']");
 return w;
};
test('GET-only audit checks workflows, running/waiting executions, then plans same Wait form',async()=>{
 let seen=[];
 const request=async path=>{
  seen.push(path);
  if(path.startsWith('/workflows?'))return {data:[{name:target.name,id:'wf_123'}],nextCursor:null};
  if(path.startsWith('/executions?'))return {data:[],nextCursor:null};
  if(path.startsWith('/credentials?'))return {data:[{id:ref.id,name:ref.name,type:'httpBasicAuth'}]};
  if(path==='/workflows/wf_123')return workflow();
  throw Error('unexpected path');
 };
 const x=await dryRunWaitFormAuth({request,credential:ref});
 assert.equal(x.changed,true);
 assert.equal(seen.length,5);
 assert.ok(seen.every(p=>p.startsWith('/workflows')||p.startsWith('/executions')||p.startsWith('/credentials')));
 assert.ok(seen.some(p=>p.includes('status=waiting')));
 assert.ok(seen.some(p=>p.includes('status=running')));
});
test('running, waiting and unknown n8n API state all fail closed',async()=>{
 for(const failure of ['waiting','running','invalid']){
  const request=async path=>{
   if(path.startsWith('/workflows?'))return {data:[{name:target.name,id:'wf_123'}]};
   if(path.startsWith('/executions?'))return failure==='invalid'?{success:true}:
    path.includes('status='+failure)?{data:[{id:'in-flight'}]}:{data:[]};
   if(path.startsWith('/credentials?'))return {data:[{id:ref.id,name:ref.name,type:'httpBasicAuth'}]};
   if(path==='/workflows/wf_123')return workflow();
   throw Error('unknown path');
  };
  await assert.rejects(dryRunWaitFormAuth({request,credential:ref}));
 }
});
test('CLI cannot apply any mutations, even with flags',()=>{
 const s=readFileSync(new URL('../scripts/audit-cuisine-social-wait-form-auth.mjs',import.meta.url),'utf8');
 assert.ok(s.includes('process.argv.length,2'));
 assert.doesNotMatch(s,/method:'(?:POST|PUT|PATCH|DELETE)'/);
 assert.ok(!s.includes('writeFileSync')&&!s.includes('UPDATE cuisine_social')&&!s.includes('api.resend.com'));
});

test('missing, unknown or wrong-type credential fails closed',async()=>{
 for(const bad of [
  [],
  [{id:ref.id,name:'Shared Basic',type:'httpBasicAuth'}],
  [{id:ref.id,name:ref.name,type:'httpHeaderAuth'}],
  [{id:ref.id,name:ref.name,type:'httpBasicAuth'},{id:ref.id,name:ref.name,type:'httpBasicAuth'}]
 ]){
  const request=async path=>{
   if(path.startsWith('/workflows?'))return {data:[{name:target.name,id:'wf_123'}]};
   if(path.startsWith('/executions?'))return {data:[]};
   if(path.startsWith('/credentials?'))return {data:bad};
   if(path==='/workflows/wf_123')return workflow();
   throw Error('unknown path');
  };
  await assert.rejects(dryRunWaitFormAuth({request,credential:ref}));
 }
});
