/**
 * Cuisine du Cambodge — fail-closed migration plan for one Resend email node.
 * The functions are side-effect free: they never contact n8n, Resend or Meta.
 * Import from the CLI for the guarded read-only check and optional migration.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {isDeepStrictEqual} from 'node:util';
import {asPayload,planWorkflow} from './sync-cuisine-n8n-runtime.mjs';

const NODE='Envoyer la demande de validation Resend';
const NAME='Cuisine du Cambodge - 01 - Brouillon IA et validation email';
const MARK_FROM='CONFIGURER_DOMAINE_VERIFIE';
const MARK_TO='CONFIGURER_EMAIL_VALIDATION';
const FROM_RX=/from:'Cuisine du Cambodge <social@([A-Za-z0-9_.-]+)>'/g;
const TO_RX=/to:\['([A-Za-z0-9._%+-]+(?:@[A-Za-z0-9.-]+)?)'\]/g;
const validFrom=x=>x===MARK_FROM||(/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(x)&&!x.includes('..'));
const validTo=x=>x===MARK_TO||(/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(x)&&!x.includes('..'));

const locate=workflow=>{
  assert.ok(Array.isArray(workflow?.nodes),'Missing workflow nodes');
  const matches=workflow.nodes.filter(n=>n.name===NODE&&n.type==='n8n-nodes-base.httpRequest');
  assert.equal(matches.length,1,'Missing/duplicate Resend node');
  return matches[0];
};
function extractIdentity(expression){
  assert.equal(typeof expression,'string','Missing Resend expression');
  const from=[...expression.matchAll(FROM_RX)];
  const to=[...expression.matchAll(TO_RX)];
  assert.equal(from.length,1,'Unexpected Resend sender expression');
  assert.equal(to.length,1,'Unexpected Resend recipient expression');
  assert.ok(validFrom(from[0][1]),'Unrecognized sender domain');
  assert.ok(validTo(to[0][1]),'Unrecognized recipient address');
  const sender=from[0][1];
  const recipient=to[0][1];
  const normalized=expression.replace(from[0][0],`from:'Cuisine du Cambodge <social@${MARK_FROM}>'`)
    .replace(to[0][0],`to:['${MARK_TO}']`);
  return {sender,recipient,normalized};
}
function fillIdentity(expression,{sender,recipient}){
  // Never interpolate arbitrary JavaScript into the n8n expression.
  assert.ok(validFrom(sender)&&validTo(recipient),'Unsafe address');
  assert.ok(expression.includes(`social@${MARK_FROM}`),'Missing target sender placeholder');
  assert.ok(expression.includes(`to:['${MARK_TO}']`),'Missing target recipient placeholder');
  return expression.replace(`social@${MARK_FROM}`,`social@${sender}`)
    .replace(`to:['${MARK_TO}']`,`to:['${recipient}']`);
}

export function planVisualApprovalEmail(live,reviewed,previousBody){
  assert.equal(live?.name,NAME,'Unexpected n8n workflow');
  assert.equal(reviewed?.name,NAME,'Unexpected reviewed workflow');
  assert.equal(live.active,false,'Cannot update active workflow');
  assert.ok(!live.activeVersion,'Workflow already published');
  assert.ok(!live.pinData||Object.keys(live.pinData).length===0,'Pinned live data');
  assert.equal(typeof previousBody,'string','Missing reviewed predecessor');
  const oldReviewed=structuredClone(reviewed);
  const current=locate(live);
  const target=locate(reviewed);
  locate(oldReviewed).parameters.body=previousBody;
  // E-mail-only migration: never silently install version-approval changes.
  // Both exact predecessor and reviewed version-locked states are accepted,
  // but partial updates, unknown code and SQL variants are refused.
  const previousApproval=JSON.parse(readFileSync(
    new URL('../tests/fixtures/social-version-approval-predecessor.json',import.meta.url),'utf8'));
  const byName=(workflow,name)=> {
    const nodes=workflow.nodes.filter(n=>n.name===name);
    assert.equal(nodes.length,1,'Missing/duplicate decision node '+name);
    return nodes[0];
  };
  const oldCode=byName(oldReviewed,'Interpréter la décision');
  const oldSql=byName(oldReviewed,'Persister la décision humaine');
  const currentCode=byName(live,'Interpréter la décision');
  const currentSql=byName(live,'Persister la décision humaine');
  const isPrevious=currentCode.parameters.jsCode===previousApproval.decisionCode &&
    currentSql.parameters.query===previousApproval.persistenceQuery &&
    isDeepStrictEqual(currentSql.parameters.options.queryReplacement,previousApproval.queryReplacement);
  const isReviewed=currentCode.parameters.jsCode===byName(reviewed,'Interpréter la décision').parameters.jsCode &&
    currentSql.parameters.query===byName(reviewed,'Persister la décision humaine').parameters.query &&
    isDeepStrictEqual(currentSql.parameters.options.queryReplacement,
      byName(reviewed,'Persister la décision humaine').parameters.options.queryReplacement);
  assert.ok(isPrevious||isReviewed,'Unsupported partial/versioned approval drift');
  if(isPrevious){
    oldCode.parameters.jsCode=previousApproval.decisionCode;
    oldSql.parameters.query=previousApproval.persistenceQuery;
    oldSql.parameters.options.queryReplacement=previousApproval.queryReplacement;
  }
  assert.equal(target.id,current.id,'Resend node ID drift');
  assert.equal(current.parameters.url,'https://api.resend.com/emails','Wrong Resend endpoint');
  assert.equal(current.parameters.method,'POST','Unexpected email method');
  assert.equal(target.parameters.url,current.parameters.url,'Endpoint changed');
  assert.equal(target.parameters.method,current.parameters.method,'HTTP method changed');
  assert.ok(target.parameters.body.includes('html'),'Target lacks visual HTML');
  // Existing synchronizer validates the reviewed approval gates and graph.
  // A pending unrelated n8n patch must be resolved separately first.
  const baseline=planWorkflow(live,oldReviewed,0);
  assert.deepEqual(baseline.changes,[],'Resolve other n8n changes before email migration');
  // All fields except the template body must already match the reviewed Resend node.
  const withoutBody=node=>{
    const out=structuredClone(node);
    delete out.parameters.body;
    delete out.credentials; // Runtime credential ID is private and must remain unchanged.
    return out;
  };
  assert.ok(isDeepStrictEqual(withoutBody(current),withoutBody(target)),
    'Resend node parameters changed outside email body');
  const original=extractIdentity(current.parameters.body);
  const old=extractIdentity(previousBody);
  const desired=extractIdentity(target.parameters.body);
  assert.equal(old.normalized,previousBody,'Review predecessor has address substitutions');
  assert.equal(desired.normalized,target.parameters.body,'Review target contains unconfigured addresses');
  const kind=original.normalized===previousBody?'previous'
    :original.normalized===target.parameters.body?'current'
    :'unsupported';
  assert.notEqual(kind,'unsupported','Unknown live Resend template; refusing migration');
  const expected=fillIdentity(target.parameters.body,original);
  if(kind==='current')assert.equal(current.parameters.body,expected,'Live target email template drift');
  const update=structuredClone(live);
  locate(update).parameters.body=expected;
  const previewPayload=asPayload(update); // n8n PUT safety gate.
  assert.ok(isDeepStrictEqual(previewPayload.nodes.find(n=>n.id===current.id).credentials,
    current.credentials),'Resend credential changed');
  assert.ok(isDeepStrictEqual(update.connections,live.connections),'Workflow routing changed');
  assert.equal(update.active,false,'Workflow unexpectedly active');
  return {
    update,
    changed:current.parameters.body!==expected,
    hasConfiguredSender:original.sender!==MARK_FROM,
    hasConfiguredRecipient:original.recipient!==MARK_TO
  };
}
