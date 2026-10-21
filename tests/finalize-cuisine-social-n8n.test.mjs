import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { inspectLiveWorkflow, summarizeChildResult, workflowNames } from '../scripts/finalize-cuisine-social-n8n.mjs';

const load = filename => JSON.parse(readFileSync(new URL('../automation/n8n/' + filename, import.meta.url), 'utf8'));
const names = ['01-drafts-email-approval.json', '02-publish-approved.json', '03-reconcile-instagram.json'];

const live = (index) => {
  const workflow = structuredClone(load(names[index]));
  workflow.id = 'live-' + index;
  workflow.versionId = 'version-' + index;
  for (const item of workflow.nodes.filter(node => node.type === 'n8n-nodes-base.postgres')) {
    item.credentials = { postgres: { id: 'postgres-' + index, name: 'Cuisine PostgreSQL' } };
  }
  for (const item of workflow.nodes.filter(node => typeof node.parameters?.url === 'string' &&
    (node.parameters.url.includes('api.resend.com') || node.parameters.url.includes('graph.facebook.com')))) {
    item.credentials = { httpHeaderAuth: { id: 'private-' + index, name: 'Dedicated API credential' } };
    item.parameters.url = item.parameters.url.replace(/CONFIGURER_FACEBOOK_PAGE_ID/g, '123456789').replace(/CONFIGURER_INSTAGRAM_USER_ID/g, '987654321');
  }
  return workflow;
};

test('live inspection accepts reviewed inactive workflows with credential references', () => {
  for (let index = 0; index < 3; index++) {
    const audit = inspectLiveWorkflow(live(index), index);
    assert.equal(audit.workflow, workflowNames[index]);
    assert.ok(!audit.checks.some(item => item.status === 'FAIL'));
  }
});

test('live inspection rejects placeholders, activation and missing credentials without exposing values', () => {
  const active = live(1);
  active.active = true;
  assert.ok(inspectLiveWorkflow(active, 1).checks.some(item => item.name === 'inactive state' && item.status === 'FAIL'));
  const placeholder = live(2);
  placeholder.nodes.find(item => item.parameters?.url?.includes('media_publish')).parameters.url =
    'https://graph.facebook.com/v26.0/CONFIGURER_INSTAGRAM_USER_ID/media_publish';
  assert.ok(inspectLiveWorkflow(placeholder, 2).checks.some(item =>
    item.name === 'Meta credential references and configured endpoints' && item.status === 'FAIL'));
  const noCredential = live(0);
  delete noCredential.nodes.find(item => item.name === 'Envoyer la demande de validation Resend').credentials;
  assert.ok(inspectLiveWorkflow(noCredential, 0).checks.some(item =>
    item.name === 'Resend credential reference' && item.status === 'FAIL'));
});

test('child-process results stay coarse and do not retain child output', () => {
  assert.deepEqual(summarizeChildResult({ status: 0, stdout: 'secret', stderr: '' }),
    { status: 'PASS', proof: 'safe synchronizer completed' });
  assert.deepEqual(summarizeChildResult({ status: 1, stdout: 'secret', stderr: 'secret' }),
    { status: 'FAIL', proof: 'safe synchronizer stopped; consult its terminal output (no automatic retry)' });
});
