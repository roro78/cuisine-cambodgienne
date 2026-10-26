/**
 * Pure plan for securing the EXISTING n8n Wait FORM, not converting its mode.
 * n8n@2.32.7 Wait.node.ts: resume=form supports incomingAuthentication=basicAuth
 * and httpBasicAuth credentials; no credential secrets are ever embedded here.
 */
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {planVisualApprovalEmail} from './cuisine-social-visual-email-migration.mjs';
import {asPayload} from './sync-cuisine-n8n-runtime.mjs';

const WAIT = 'Attendre une décision via formulaire';
const find = (w,name) => {
  const xs=w.nodes.filter(n=>n.name===name);
  assert.equal(xs.length,1,'Missing/duplicate n8n node: '+name);
  return xs[0];
};
export function planWaitFormBasicAuth(live,reviewed,previousEmailBody,credential){
  assert.equal(live?.name,'Cuisine du Cambodge - 01 - Brouillon IA et validation email');
  assert.equal(reviewed?.name,live.name);
  assert.equal(live.active,false,'Workflow is active');
  assert.ok(!live.activeVersion,'Workflow has a published version');
  assert.ok(!live.pinData||Object.keys(live.pinData).length===0,'Pinned data');
  assert.deepEqual(live.connections,reviewed.connections,'Decision graph drift');
  const id=credential?.id, name=credential?.name;
  assert.ok(typeof id==='string' && /^[A-Za-z0-9_-]{6,128}$/.test(id),
    'Invalid private n8n Basic Auth credential ID');
  assert.equal(name,'Cuisine du Cambodge - Validation formulaire (Basic Auth)',
    'Credential name does not identify the dedicated approval identity');
  const current=find(live,WAIT), baseline=find(reviewed,WAIT);
  assert.equal(current.id,baseline.id,'Wait ID changed');
  assert.equal(current.type,'n8n-nodes-base.wait','Not a Wait node');
  assert.equal(current.parameters.resume,'form','Do not convert the Wait form to webhook');
  assert.equal(current.parameters.resumeAmount,72,'72h Wait deadline changed');
  assert.equal(current.parameters.resumeUnit,'hours','Wait unit changed');
  const preAuth=current.parameters.incomingAuthentication===undefined
    ||current.parameters.incomingAuthentication==='none';
  const already=current.parameters.incomingAuthentication==='basicAuth';
  assert.ok(preAuth||already,'Unknown Wait form authentication');
  const expectedRef={id,name};
  if(preAuth) assert.equal(current.credentials,undefined,
    'Unexpected pre-existing credentials on unprotected Wait');
  if(already) assert.deepEqual(current.credentials,{httpBasicAuth:expectedRef},
    'Unexpected Wait Basic Auth credential mapping');
  // The approval gate/email predecessor checker has the reviewed (unsecured)
  // Wait node. Normalize ONLY this auth-controlled node for a drift check.
  const unprotected=structuredClone(live);
  const mirror=find(unprotected,WAIT);
  delete mirror.parameters.incomingAuthentication;
  delete mirror.credentials;
  assert.ok(isDeepStrictEqual(mirror,baseline),
    'Wait form fields, code, expiry or metadata drifted');
  const checked=planVisualApprovalEmail(unprotected,reviewed,previousEmailBody);
  assert.equal(checked.changed,false,'Apply the visual email migration separately');
  assert.ok(checked.hasConfiguredSender&&checked.hasConfiguredRecipient,
    'Resend sender and recipient must already be configured privately');
  const next=structuredClone(live);
  const wait=find(next,WAIT);
  wait.parameters.incomingAuthentication='basicAuth';
  wait.credentials={httpBasicAuth:expectedRef};
  const beforeNonWait=live.nodes.filter(n=>n.id!==current.id);
  const afterNonWait=next.nodes.filter(n=>n.id!==current.id);
  assert.deepEqual(afterNonWait,beforeNonWait,'Unexpected workflow mutation');
  assert.deepEqual(next.connections,live.connections,'Routing altered');
  assert.equal(next.active,false);
  const payload=asPayload(next);
  const applied=find(payload,WAIT);
  assert.deepEqual(applied.credentials,{httpBasicAuth:expectedRef});
  // Runtime property value is a credential REFERENCE, not a username/password.
  assert.equal(Object.keys(applied.credentials).length,1);
  return {update:next,changed:preAuth,credentialReference:expectedRef};
}
