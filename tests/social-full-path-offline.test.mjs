import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const load = filename => JSON.parse(readFileSync(new URL('../automation/n8n/' + filename, import.meta.url), 'utf8'));
const schema = readFileSync(new URL('../automation/n8n/schema.sql', import.meta.url), 'utf8');
const workflows = [load('01-drafts-email-approval.json'), load('02-publish-approved.json'),
  load('03-reconcile-instagram.json')];
const node = (workflow, name) => {
  const matches = workflow.nodes.filter(item => item.name === name);
  assert.equal(matches.length, 1, 'Expected exactly one node: ' + name);
  return matches[0];
};
const sql = (workflow, name) => node(workflow, name).parameters.query;

test('draft, email and human form remain ordered and bounded to 72 hours', () => {
  const [drafts] = workflows;
  const insert = node(drafts, 'Enregistrer le brouillon');
  assert.match(insert.parameters.query, /INSERT INTO cuisine_social\.posts/);
  assert.match(insert.parameters.query, /ON CONFLICT \(scheduled_date\) DO NOTHING/);
  assert.equal(drafts.connections[insert.name].main[0][0].node, 'Brouillon inséré ?');
  assert.equal(drafts.connections['Brouillon inséré ?'].main[0][0].node,
    'Envoyer la demande de validation Resend');
  const email = node(drafts, 'Envoyer la demande de validation Resend');
  for (const required of ['source.url', 'imageUrl', 'facebookCaption', 'instagramCaption',
    '$execution.resumeFormUrl', 'AUCUNE PUBLICATION']) assert.match(email.parameters.body, new RegExp(required.replace('$', '\\$')));
  const wait = node(drafts, 'Attendre une décision via formulaire');
  assert.equal(wait.parameters.limitWaitTime, true);
  assert.equal(wait.parameters.resumeAmount, 72);
  assert.equal(wait.parameters.resumeUnit, 'hours');
});

test('approval, rejection, revision and expiry all fail closed without implicit approval', () => {
  const code = node(workflows[0], 'Interpréter la décision').parameters.jsCode;
  assert.match(code, /d==='Approuver'\?'approved'/);
  assert.match(code, /d==='Demander une modification'\?'revision_requested':'rejected'/);
  assert.match(code, /commentaire_requis_pour_modification/);
  assert.doesNotMatch(code, /Number\(saved\.id\)/);
  assert.match(code, /9223372036854775807/);
  assert.match(sql(workflows[0], 'Persister la décision humaine'), /WHERE id=\$3 AND status='draft'/);
  assert.doesNotMatch(code, /\?\?'approved'/);
});

test('scheduled Facebook claim requires explicit approval and a due date', () => {
  const claim = sql(workflows[1], 'Claim atomique uniquement si validé');
  for (const guard of ["status='approved'", "human_decision='approved'", 'approved_at IS NOT NULL',
    'decided_at IS NOT NULL', "scheduled_date <= (NOW() AT TIME ZONE 'Europe/Paris')::date",
    "fb_state='pending'", "ig_state='pending'", 'FOR UPDATE SKIP LOCKED']) assert.ok(claim.includes(guard), guard);
});

test('Facebook and Instagram success responses are historized with state guards', () => {
  const facebook = sql(workflows[1], 'Mémoriser le résultat Facebook');
  assert.match(facebook, /fb_state='published'/);
  assert.match(facebook, /facebook_post_id=\$1/);
  assert.match(facebook, /WHERE id=\$2 AND fb_state='submitting'/);
  const container = sql(workflows[1], 'Sauver le conteneur Instagram');
  assert.match(container, /instagram_container_id=\$1/);
  assert.match(container, /WHERE id=\$2 AND ig_state='creating'/);
  const published = sql(workflows[2], 'Persister publication Instagram');
  assert.match(published, /instagram_post_id=\$1/);
  assert.match(published, /published_at=NOW\(\)/);
  assert.match(published, /WHERE id=\$2 AND ig_state='submitting'/);
});

test('Instagram reconciliation retries only read-only status checks and isolates terminal errors', () => {
  const reserve = sql(workflows[2], 'Réserver un conteneur à examiner');
  assert.match(reserve, /fb_state='published'/);
  assert.match(reserve, /ig_state='container_created'/);
  assert.match(reserve, /FOR UPDATE SKIP LOCKED/);
  const transition = sql(workflows[2], 'Enregistrer READY ou reporter');
  assert.match(transition, /WHEN \$1='FINISHED' THEN 'submitting'/);
  assert.match(transition, /WHEN \$1='IN_PROGRESS' THEN 'container_created'/);
  assert.match(transition, /ELSE 'manual_review'/);
});

test('ambiguous external interruptions remain fail-closed to prevent duplicate publication', () => {
  const facebookClaim = sql(workflows[1], 'Claim atomique uniquement si validé');
  assert.match(facebookClaim, /fb_state='pending'/);
  assert.doesNotMatch(facebookClaim, /fb_state IN \('pending','submitting'\)/);
  const instagramReserve = sql(workflows[2], 'Réserver un conteneur à examiner');
  assert.match(instagramReserve, /ig_state='container_created'/);
  assert.doesNotMatch(instagramReserve, /ig_state IN \('container_created','submitting'\)/);
  assert.match(schema, /dead workflow leaves 'submitting' \/ 'creating' untouched by cron/i);
  assert.match(schema, /Reconcile platform state manually before changing them/i);
});

test('database uniqueness and atomic claims prevent concurrent duplicate work', () => {
  assert.match(schema, /UNIQUE \(scheduled_date\)/);
  assert.match(schema, /UNIQUE \(source_id,source_fingerprint,scheduled_date\)/);
  assert.match(sql(workflows[1], 'Claim atomique uniquement si validé'), /FOR UPDATE SKIP LOCKED LIMIT 1/);
  assert.match(sql(workflows[2], 'Réserver un conteneur à examiner'), /FOR UPDATE SKIP LOCKED LIMIT 1/);
});

test('no offline workflow fixture is active and only reviewed Meta nodes can publish', () => {
  for (const workflow of workflows) assert.equal(workflow.active, false);
  const urls = workflows.flatMap(workflow => workflow.nodes.map(item => item.parameters?.url).filter(Boolean));
  const publishing = urls.filter(url => /graph\.facebook\.com.*\/(photos|media|media_publish)$/.test(url));
  assert.equal(publishing.length, 3);
  assert.ok(!workflows[0].nodes.some(item => String(item.parameters?.url || '').includes('graph.facebook.com')));
});
