import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planWaitFormBasicAuth} from '../scripts/cuisine-social-wait-form-auth-plan.mjs';

const load=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const reviewed=load('../automation/n8n/01-drafts-email-approval.json');
const previous=load('./fixtures/social-resend-email-predecessor.json').body;
const reference={id:'configured_credential_123',name:'Cuisine du Cambodge - Validation formulaire (Basic Auth)'};
const wait=x=>x.nodes.find(n=>n.name==='Attendre une décision via formulaire');
const resent=x=>x.nodes.find(n=>n.name==='Envoyer la demande de validation Resend');
function makeLive(){
 const w=structuredClone(reviewed);
 w.id='workflow-01';w.versionId='a-known-version';w.activeVersion=null;w.pinData={};
 resent(w).parameters.body=resent(w).parameters.body
  .replace('social@CONFIGURER_DOMAINE_VERIFIE','social@cuisine-du-cambodge.com')
  .replace("to:['CONFIGURER_EMAIL_VALIDATION']","to:['approbation@example.test']");
 resent(w).credentials={httpHeaderAuth:{id:'resend-secret-ref',name:'Resend'}};
 return w;
}
test('secure the SAME Wait form with Basic Auth without second decision path',()=>{
 const live=makeLive(),baseline=structuredClone(live);
 const result=planWaitFormBasicAuth(live,reviewed,previous,reference);
 assert.equal(result.changed,true);
 assert.deepEqual(live,baseline,'Planner must never mutate input');
 assert.equal(wait(result.update).parameters.resume,'form');
 assert.equal(wait(result.update).parameters.incomingAuthentication,'basicAuth');
 assert.deepEqual(wait(result.update).credentials,{httpBasicAuth:reference});
 assert.equal(result.update.connections['Attendre une décision via formulaire'].main[0][0].node,
  'Interpréter la décision');
 assert.deepEqual(resent(result.update),resent(baseline),'Resend identity/credentials preserved');
 assert.equal(result.update.active,false);
 assert.equal(result.update.nodes.length,12);
 const again=planWaitFormBasicAuth(result.update,reviewed,previous,reference);
 assert.equal(again.changed,false,'Already protected should be idempotent');
 assert.deepEqual(again.update,result.update);
});
test('unknown credentials and workflow drift fail closed before a single mutation',()=>{
 const changes=[
  [x=>x.active=true,reference],
  [x=>x.activeVersion='pub',reference],
  [x=>wait(x).parameters.resume='webhook',reference],
  [x=>wait(x).parameters.resumeAmount=24,reference],
  [x=>wait(x).parameters.formTitle='Edited form',reference],
  [x=>wait(x).parameters.incomingAuthentication='headerAuth',reference],
  [x=>wait(x).credentials={httpHeaderAuth:reference},reference],
  [x=>x.connections['Attendre une décision via formulaire'].main[0][0].node='Envoyer la demande de validation Resend',reference],
  [x=>resent(x).parameters.body+=' // tampered',reference],
  [x=>x.pinData={unexpected:true},reference],
  [x=>{}, {...reference,id:'bad/credential'}],
  [x=>{}, {...reference,name:'Generic shared Basic Auth'}]
 ];
 for(const [change,ref] of changes){
  const live=makeLive();change(live);
  assert.throws(()=>planWaitFormBasicAuth(live,reviewed,previous,ref));
 }
});
test('pre-existing or mismatched credentials are never silently replaced',()=>{
 const live=makeLive();wait(live).parameters.incomingAuthentication='basicAuth';
 wait(live).credentials={httpBasicAuth:{id:'other_credential',name:'Other'}};
 assert.throws(()=>planWaitFormBasicAuth(live,reviewed,previous,reference),
  /Unexpected Wait Basic Auth credential mapping/);
});
test('no passwords, header tokens, Meta calls, n8n executions or SQL in the planner',()=>{
 const script=readFileSync(new URL('../scripts/cuisine-social-wait-form-auth-plan.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(script,/\b(?:fetch|axios|PUT|DELETE FROM|UPDATE cuisine_social|Authorization: Bearer)\b/);
 assert.ok(script.includes('httpBasicAuth'));
 assert.ok(script.includes("assert.equal(next.active,false)"));
});
