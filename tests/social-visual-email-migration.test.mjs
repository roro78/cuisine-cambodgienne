import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planVisualApprovalEmail} from '../scripts/cuisine-social-visual-email-migration.mjs';
import {asPayload} from '../scripts/sync-cuisine-n8n-runtime.mjs';

const target=JSON.parse(readFileSync(new URL('../automation/n8n/01-drafts-email-approval.json',import.meta.url),'utf8'));
const old=JSON.parse(readFileSync(new URL('./fixtures/social-resend-email-predecessor.json',import.meta.url),'utf8')).body;
const clone=v=>structuredClone(v);
const name='Envoyer la demande de validation Resend';
const email=w=>{
  const nodes=w.nodes.filter(n=>n.name===name);
  assert.equal(nodes.length,1);
  return nodes[0];
};
const configured=expr=>expr
  .replace('social@CONFIGURER_DOMAINE_VERIFIE','social@cuisine-du-cambodge.com')
  .replace("to:['CONFIGURER_EMAIL_VALIDATION']","to:['validateur@example.fr']");
const live=body=>{
  const workflow=clone(target);
  workflow.id='G7jJCMw6bLQE7dD4';
  workflow.versionId='version-abc';
  workflow.active=false;
  workflow.activeVersion=null;
  workflow.pinData={};
  email(workflow).parameters.body=body;
  email(workflow).credentials={httpHeaderAuth:{id:'secret-credential-id',name:'Resend configured credential'}};
  return workflow;
};

test('recognizes only exact predecessor, preserves Resend addresses and credentials',()=>{
  const oldLive=live(configured(old));
  const before=clone(oldLive);
  const plan=planVisualApprovalEmail(oldLive,target,old);
  assert.equal(plan.changed,true);
  assert.equal(plan.hasConfiguredSender,true);
  assert.equal(plan.hasConfiguredRecipient,true);
  assert.equal(plan.update.active,false);
  assert.equal(plan.update.versionId,before.versionId);
  assert.deepEqual(plan.update.connections,before.connections);
  assert.deepEqual(email(plan.update).credentials,email(before).credentials);
  assert.deepEqual(email(plan.update).parameters.authentication,email(before).parameters.authentication);
  assert.ok(email(plan.update).parameters.body.includes('social@cuisine-du-cambodge.com'));
  assert.ok(email(plan.update).parameters.body.includes("to:['validateur@example.fr']"));
  assert.ok(email(plan.update).parameters.body.includes('html'));
  assert.deepEqual(oldLive,before,'Planner must never modify the live object');
  assert.deepEqual(asPayload(plan.update).nodes.find(n=>n.name===name).credentials,
    email(before).credentials,'n8n public API payload must retain the credential');
});

test('idempotent when already upgraded with configured addresses',()=>{
  const current=live(configured(email(target).parameters.body));
  const plan=planVisualApprovalEmail(current,target,old);
  assert.equal(plan.changed,false);
  assert.deepEqual(plan.update,current);
});

test('manual edits to the old template are not silently discarded',()=>{
  const edits=[
    configured(old)+' ',
    configured(old).replace('Pour approuver ou refuser','Cliquez tout de suite pour publier'),
    configured(old).replace('Le lien expire','Ce lien expire'),
    configured(old).replace('CONFIGURER_DOMAINE_VERIFIE','hacked.example'),
  ];
  for(const expr of edits)
    assert.throws(()=>planVisualApprovalEmail(live(expr),target,old),
      /Unknown live Resend template|Unexpected Resend sender expression/);
});

test('rejects dangerous or malformed Resend sender and recipient',()=>{
  const malicious=[
    configured(old).replace('social@cuisine-du-cambodge.com',"social@bad.example';throw Error('attack')"),
    configured(old).replace('validateur@example.fr',"bad@example.fr';throw Error('attack')"),
    configured(old).replace('cuisine-du-cambodge.com','unverified-domain'),
    configured(old).replace('validateur@example.fr','not-an-email'),
  ];
  for(const body of malicious)
    assert.throws(()=>planVisualApprovalEmail(live(body),target,old),
      /Unexpected Resend|Unrecognized|Unknown live/);
});

test('rejects active workflow, pinned data and routing drift',()=>{
  const active=live(configured(old));active.active=true;
  assert.throws(()=>planVisualApprovalEmail(active,target,old),/active workflow/);
  const pinned=live(configured(old));pinned.pinData={a:[{json:{id:1}}]};
  assert.throws(()=>planVisualApprovalEmail(pinned,target,old),/Pinned live data/);
  const other=live(configured(old));
  other.connections['Brouillon inséré ?'].main[0][0].node='Publier la photo Facebook';
  assert.throws(()=>planVisualApprovalEmail(other,target,old),/Draft guard outgoing edge|TRUE/);
});

test('refuses unrelated pending changes and unexpected Resend parameters',()=>{
  const changed=live(configured(old));
  changed.nodes.find(n=>n.name==='Vérifier et cadrer les textes').parameters.jsCode+='\n// changed';
  assert.throws(()=>planVisualApprovalEmail(changed,target,old),
    /Unexpected live customizations/);
  const other=live(configured(old));
  email(other).parameters.url='https://api.resend.com/other';
  assert.throws(()=>planVisualApprovalEmail(other,target,old),/Wrong Resend endpoint/);
  const edited=live(configured(old));
  email(edited).parameters.sendBody=false;
  assert.throws(()=>planVisualApprovalEmail(edited,target,old),
    /Resend node parameters changed outside email body/);
});

test('placeholder-only exported identity is visible but cannot be mistaken for configured',()=>{
  const preview=planVisualApprovalEmail(live(old),target,old);
  assert.equal(preview.changed,true);
  assert.equal(preview.hasConfiguredSender,false);
  assert.equal(preview.hasConfiguredRecipient,false);
  assert.equal(email(preview.update).parameters.body,email(target).parameters.body);
});

test('retains the human decision form, expiry and approval state machine',()=>{
  const plan=planVisualApprovalEmail(live(configured(old)),target,old);
  const wait=plan.update.nodes.find(n=>n.name==='Attendre une décision via formulaire');
  assert.equal(wait.parameters.resume,'form');
  assert.equal(wait.parameters.resumeAmount,72);
  const persist=plan.update.nodes.find(n=>n.name==='Persister la décision humaine');
  assert.match(persist.parameters.query,/WHERE id=\$3 AND status='draft'/);
  assert.equal(plan.update.active,false);
});
