import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planVersionedSocialDecision} from '../scripts/migrate-cuisine-social-versioned-decision.mjs';
const load=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const target=load('../automation/n8n/01-drafts-email-approval.json');
const prev=load('./fixtures/social-version-approval-predecessor.json');
const oldEmail=load('./fixtures/social-resend-email-predecessor.json').body;
const find=(wf,name)=>wf.nodes.find(n=>n.name===name);
const oldWorkflow=()=>{
 const x=structuredClone(target);x.id='G7jJCMw6bLQE7dD4';x.versionId='version';x.activeVersion=null;x.pinData={};
 find(x,'Interpréter la décision').parameters.jsCode=prev.decisionCode;
 const sql=find(x,'Persister la décision humaine').parameters;
 sql.query=prev.persistenceQuery;sql.options.queryReplacement=prev.queryReplacement;
 const email=find(x,'Envoyer la demande de validation Resend');
 email.parameters.body=oldEmail.replace('social@CONFIGURER_DOMAINE_VERIFIE','social@cuisine-du-cambodge.com')
 .replace("to:['CONFIGURER_EMAIL_VALIDATION']","to:['validateur@example.fr']");
 email.credentials={httpHeaderAuth:{id:'credential-private',name:'Resend'}};
 return x;
};
test('version migration only changes the exact n8n Wait interpreter and SQL guard',()=>{
 const live=oldWorkflow(),before=structuredClone(live);
 const plan=planVersionedSocialDecision(live,target,prev,oldEmail);
 assert.equal(plan.changed,true);
 assert.deepEqual(live,before);
 for(const name of ['Interpréter la décision','Persister la décision humaine'])
  assert.deepEqual(find(plan.update,name).parameters,find(target,name).parameters);
 assert.deepEqual(find(plan.update,'Envoyer la demande de validation Resend'),
   find(before,'Envoyer la demande de validation Resend'));
 assert.deepEqual(plan.update.connections,before.connections);
 assert.equal(planVersionedSocialDecision(plan.update,target,prev,oldEmail).changed,false);
});
test('migration refuses active workflow, partial changes, unknown templates and routing drift',()=>{
 for(const change of [
   x=>{x.active=true;},
   x=>{x.activeVersion='v2';},
   x=>{find(x,'Interpréter la décision').parameters.jsCode+=' // custom';},
   x=>{find(x,'Persister la décision humaine').parameters.query+=' ';},
   x=>{find(x,'Persister la décision humaine').parameters.query=find(target,'Persister la décision humaine').parameters.query;},
   x=>{find(x,'Envoyer la demande de validation Resend').parameters.body+=' ';},
   x=>{x.connections['Attendre une décision via formulaire'].main[0][0].node='Envoyer la demande de validation Resend';},
 ]){
  const copy=oldWorkflow();change(copy);
  assert.throws(()=>planVersionedSocialDecision(copy,target,prev,oldEmail));
 }
});
test('runtime CLI preserves read-only default and guarded approval requirements',()=>{
 const src=readFileSync(new URL('../scripts/migrate-cuisine-social-versioned-decision.mjs',import.meta.url),'utf8');
 for(const s of ['--apply','--approve-single-workflow-update','GET-only',
   'versionId','0o600','X-N8N-API-KEY','activeVersion','verifyAfter'])
  assert.ok(src.includes(s),s);
});
