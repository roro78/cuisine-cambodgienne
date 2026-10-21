import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { planPostgresCredentialRepairs, repairTargets } from '../scripts/repair-cuisine-n8n-postgres-credentials.mjs';

const files = ['01-drafts-email-approval.json', '02-publish-approved.json', '03-reconcile-instagram.json'];
const load = filename => JSON.parse(readFileSync(new URL('../automation/n8n/' + filename, import.meta.url), 'utf8'));
const credential = { id: 'dedicated-cuisine-postgres', name: 'Cuisine du Cambodge - PostgreSQL' };

function fixtures() {
  return files.map((file, index) => {
    const workflow = load(file);
    workflow.id = 'live-' + index;
    workflow.versionId = 'version-' + index;
    for (const node of workflow.nodes.filter(item => item.type === 'n8n-nodes-base.postgres')) {
      node.credentials = { postgres: structuredClone(credential) };
    }
    return workflow;
  });
}

function removeTargets(workflows) {
  for (const target of repairTargets) {
    const node = workflows[target.workflowIndex].nodes.find(item => item.name === target.nodeName);
    delete node.credentials;
  }
  return workflows;
}

test('planner attaches the one dedicated credential to exactly the two missing targets', () => {
  const workflows = removeTargets(fixtures());
  const before = structuredClone(workflows);
  const plan = planPostgresCredentialRepairs(workflows);
  assert.deepEqual(plan.corrections.map(item => item.action), ['attach-existing', 'attach-existing']);
  assert.equal(plan.postgresReferenceCount, 9);
  assert.deepEqual(workflows, before, 'planner must not mutate live input');
  for (const target of repairTargets) {
    const oldNode = before[target.workflowIndex].nodes.find(item => item.name === target.nodeName);
    const newNode = plan.updates[target.workflowIndex].nodes.find(item => item.name === target.nodeName);
    assert.deepEqual(newNode.credentials.postgres, credential);
    assert.deepEqual(newNode.parameters, oldNode.parameters, 'SQL and all target parameters must remain unchanged');
  }
});

test('planner is idempotent after both references are attached', () => {
  const first = planPostgresCredentialRepairs(removeTargets(fixtures()));
  const second = planPostgresCredentialRepairs(first.updates);
  assert.deepEqual(second.corrections.map(item => item.action), ['already-correct', 'already-correct']);
  assert.deepEqual(second.updates, first.updates);
});

test('planner refuses divergent existing credentials before changing either workflow', () => {
  const workflows = removeTargets(fixtures());
  const node = workflows[1].nodes.find(item => item.type === 'n8n-nodes-base.postgres');
  node.credentials.postgres.id = 'different-credential';
  assert.throws(() => planPostgresCredentialRepairs(workflows), /identifiers diverge/);
});

test('planner refuses an active workflow or a different target credential', () => {
  const active = removeTargets(fixtures());
  active[0].active = true;
  assert.throws(() => planPostgresCredentialRepairs(active), /active/);
  const different = fixtures();
  const target = different[0].nodes.find(item => item.name === repairTargets[0].nodeName);
  target.credentials.postgres.id = 'different-credential';
  assert.throws(() => planPostgresCredentialRepairs(different), /identifier diverges/);
});
