import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { planWorkflow } from '../scripts/sync-cuisine-n8n-runtime.mjs';

const load = filename => JSON.parse(readFileSync(new URL(
  '../automation/n8n/' + filename, import.meta.url), 'utf8'));
const files = ['01-drafts-email-approval.json', '02-publish-approved.json',
  '03-reconcile-instagram.json'];
const reviewed = files.map(load);
const clone = data => structuredClone(data);
const locate = (workflow, name) => {
  const nodes = workflow.nodes.filter(node => node.name === name);
  assert.equal(nodes.length, 1, 'Missing node: ' + name);
  return nodes[0];
};
const fromCandidate = (candidate, index) => {
  const live = clone(candidate);
  live.id = 'existing-workflow-' + index;
  live.versionId = 'existing-version-' + index;
  const changes = {
    0: [
      ['Choisir un contenu original', [
        ["const history=$input.all().map(i=>i.json).filter(i=>i.source_id);",
         "const history=items.map(i=>i.json).filter(i=>i.source_id);"]]],
      ['Vérifier et cadrer les textes', [
        ["const raw=String($input.first().json.choices?.[0]?.message?.content||'')",
         "const raw=String($json.choices?.[0]?.message?.content||'')"]]],
      ['Interpréter la décision', [
        ["const incoming=$input.first().json;\nconst d=String(incoming?.data?.Decision??incoming?.Decision??incoming?.body?.Decision??'')",
         "const d=String($json?.data?.Decision??$json?.Decision??$json?.body?.Decision??'')"],
        ["const note=String(incoming?.data?.Commentaire??incoming?.Commentaire??incoming?.body?.Commentaire??'')",
         "const note=String($json?.data?.Commentaire??$json?.Commentaire??$json?.body?.Commentaire??'')"]]],
    ],
    2: [
      ['Lire le statut Meta', [
        ["const state=String($input.first().json.status_code||'').toUpperCase();",
         "const state=String($json.status_code||'').toUpperCase();"]]],
      ['Ne garder que les conteneurs prêts', [
        ["return $input.all().filter(i=>i.json.ig_state==='submitting');",
         "return items.filter(i=>i.json.ig_state==='submitting');"]]],
    ],
  };
  for (const [name, replacements] of changes[index] || []) {
    const node = locate(live, name);
    for (const [newCode, oldCode] of replacements) {
      assert.ok(node.parameters.jsCode.includes(newCode));
      node.parameters.jsCode = node.parameters.jsCode.replace(newCode, oldCode);
    }
  }
  const sqlGuards = {
    1: ['Claim atomique uniquement si validé',
      " AND human_decision='approved' AND approved_at IS NOT NULL AND decided_at IS NOT NULL"],
    2: ['Réserver un conteneur à examiner',
      " AND human_decision='approved' AND approved_at IS NOT NULL AND decided_at IS NOT NULL AND fb_state='published'"],
  };
  if (sqlGuards[index]) {
    const [name, guard] = sqlGuards[index];
    const node = locate(live, name);
    assert.ok(node.parameters.query.includes(guard));
    node.parameters.query = node.parameters.query.replace(guard, '');
  }
  if (index === 0) {
    delete locate(live, 'Enregistrer le brouillon').alwaysOutputData;
    live.nodes = live.nodes.filter(node => node.name !== 'Brouillon inséré ?');
    live.connections['Enregistrer le brouillon'] = {main: [[{
      node: 'Envoyer la demande de validation Resend',type:'main',index:0,
    }]]};
    delete live.connections['Brouillon inséré ?'];
  }
  // Mimic authenticated live credentials that must never be lost by syncing exports.
  const credentialNode = live.nodes.find(n => n.type === 'n8n-nodes-base.postgres');
  credentialNode.credentials = {
    postgres: { id: 'preserve-real-credential-id', name: 'Cuisine du Cambodge - PostgreSQL' },
  };
  if (index === 1) {
    locate(live, 'Publier la photo Facebook').parameters.url =
      'https://graph.facebook.com/v26.0/123456789/photos';
    locate(live, 'Publier la photo Facebook').credentials =
      {httpHeaderAuth:{id:'private-meta-credential',name:'Cuisine - Meta'}};
  }
  return live;
};

test('all 3 real offline workflow mocks are synchronizable without losing local credentials', () => {
  for (let index = 0; index < 3; index++) {
    const live = fromCandidate(reviewed[index], index);
    const before = clone(live);
    const plan = planWorkflow(live, reviewed[index], index);
    assert.ok(plan.changes.length > 0, 'should find reviewed updates');
    assert.deepEqual(live, before, 'planner must not mutate live object');
    assert.equal(plan.update.active, false);
    const oldCredential = live.nodes.find(n => n.type === 'n8n-nodes-base.postgres').credentials;
    const newCredential = plan.update.nodes.find(n => n.type === 'n8n-nodes-base.postgres').credentials;
    assert.deepEqual(newCredential, oldCredential, 'credential unchanged');
    if (index === 1) {
      assert.equal(locate(plan.update, 'Publier la photo Facebook').parameters.url,
        locate(live, 'Publier la photo Facebook').parameters.url);
      assert.deepEqual(locate(plan.update, 'Publier la photo Facebook').credentials,
        locate(live, 'Publier la photo Facebook').credentials);
    }
    assert.equal(planWorkflow(plan.update, reviewed[index], index).changes.length, 0,
      'second sync must be idempotent');
  }
});

test('Workflow 01 restores all 3 reviewed Code nodes and gates email after DB insertion', () => {
  const plan = planWorkflow(fromCandidate(reviewed[0], 0), reviewed[0], 0);
  const out = plan.update;
  for (const name of ['Choisir un contenu original','Vérifier et cadrer les textes',
    'Interpréter la décision']) {
    assert.equal(locate(out, name).parameters.jsCode,
      locate(reviewed[0], name).parameters.jsCode);
  }
  assert.equal(locate(out, 'Enregistrer le brouillon').alwaysOutputData, true);
  assert.equal(out.connections['Enregistrer le brouillon'].main[0][0].node, 'Brouillon inséré ?');
  assert.equal(out.connections['Brouillon inséré ?'].main[0][0].node,
    'Envoyer la demande de validation Resend');
  assert.equal(out.connections['Brouillon inséré ?'].main[1].length, 0);
});

test('Workflow 02 and 03 keep SQL human-approval safeguards and Instagram status routing', () => {
  const second = planWorkflow(fromCandidate(reviewed[1], 1), reviewed[1], 1).update;
  const third = planWorkflow(fromCandidate(reviewed[2], 2), reviewed[2], 2).update;
  for (const [workflow, name] of [[second, 'Claim atomique uniquement si validé'],
    [third, 'Réserver un conteneur à examiner']]) {
    assert.match(locate(workflow,name).parameters.query, /human_decision='approved'/);
    assert.match(locate(workflow,name).parameters.query, /approved_at IS NOT NULL/);
    assert.match(locate(workflow,name).parameters.query, /decided_at IS NOT NULL/);
  }
  assert.match(locate(third,'Réserver un conteneur à examiner').parameters.query,
    /fb_state='published'/);
  assert.equal(locate(third,'Ne garder que les conteneurs prêts').parameters.jsCode,
    'return $input.all().filter(i=>i.json.ig_state===\'submitting\');');
});

test('sync rejects active and archived workflows, hidden pins and code changes', () => {
  const initial = fromCandidate(reviewed[0], 0);
  const active = clone(initial);
  active.active = true;
  assert.throws(() => planWorkflow(active,reviewed[0],0), /active/);
  const pins = clone(initial);
  pins.pinData = {something:[{json:{id:99}}]};
  assert.throws(() => planWorkflow(pins,reviewed[0],0), /Pinned data/);
  const drift = clone(initial);
  locate(drift,'Choisir un contenu original').parameters.jsCode += '\n// Unexpected';
  assert.throws(() => planWorkflow(drift,reviewed[0],0), /Unexpected live customizations/);
});

test('sync refuses changed SQL conditions, unexpected connections and modified guards', () => {
  const sql = fromCandidate(reviewed[1], 1);
  locate(sql,'Claim atomique uniquement si validé').parameters.query += ' -- altered';
  assert.throws(() => planWorkflow(sql,reviewed[1],1), /Unexpected live SQL customizations/);
  const edges = fromCandidate(reviewed[0], 0);
  edges.connections['Enregistrer le brouillon'].main[0][0].node = 'Unexpected';
  assert.throws(() => planWorkflow(edges,reviewed[0],0), /unexpected live outgoing edges/);
  const guard = clone(reviewed[0]);
  guard.nodes.find(n=>n.name==='Brouillon inséré ?').parameters.conditions.conditions[0].operator.operation =
    'isEmpty';
  assert.throws(() => planWorkflow(guard,reviewed[0],0), /Draft guard customized/);
});
