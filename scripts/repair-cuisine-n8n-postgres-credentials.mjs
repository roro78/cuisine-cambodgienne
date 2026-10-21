#!/usr/bin/env node
/**
 * Attach the existing Cuisine du Cambodge PostgreSQL credential to exactly two
 * known nodes. Fail closed unless the other seven PostgreSQL nodes all point to
 * one identically named, dedicated credential. No workflow is executed or activated.
 */
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { asPayload } from './sync-cuisine-n8n-runtime.mjs';

export const workflowNames = [
  'Cuisine du Cambodge - 01 - Brouillon IA et validation email',
  'Cuisine du Cambodge - 02 - Publication approuvée Facebook et création Instagram',
  'Cuisine du Cambodge - 03 - Réconcilier et publier Instagram',
];
export const repairTargets = [
  { workflowIndex: 0, nodeName: 'Persister la décision humaine' },
  { workflowIndex: 2, nodeName: 'Persister publication Instagram' },
];

const clone = value => structuredClone(value);
const postgresNodes = workflow => workflow.nodes.filter(node => node.type === 'n8n-nodes-base.postgres');
const credential = node => node.credentials?.postgres;
const validReference = reference => reference && typeof reference === 'object' &&
  typeof reference.id === 'string' && reference.id.length > 0 &&
  typeof reference.name === 'string' && reference.name.length > 0;
const targetKey = target => target.workflowIndex + ':' + target.nodeName;

function assertSafeWorkflow(workflow, index) {
  assert.equal(workflow.name, workflowNames[index], 'Unexpected workflow identity');
  assert.equal(workflow.active, false, 'Workflow is active; refusing credential repair');
  assert.ok(!workflow.activeVersion, 'Workflow is published; refusing credential repair');
  assert.notEqual(workflow.isArchived, true, 'Workflow is archived');
  assert.ok(!workflow.pinData || Object.keys(workflow.pinData).length === 0,
    'Pinned data present; refusing credential repair');
  assert.ok(Array.isArray(workflow.nodes) && workflow.connections && workflow.settings,
    'Invalid live workflow structure');
  assert.equal(postgresNodes(workflow).length, 3, 'Expected exactly three PostgreSQL nodes');
}

/** Pure planner used by offline tests and the authenticated runner. */
export function planPostgresCredentialRepairs(workflows) {
  assert.equal(workflows.length, 3, 'Expected exactly three live workflows');
  workflows.forEach(assertSafeWorkflow);
  const targets = new Map(repairTargets.map(target => [targetKey(target), target]));
  const existing = [];
  for (let workflowIndex = 0; workflowIndex < workflows.length; workflowIndex++) {
    for (const item of postgresNodes(workflows[workflowIndex])) {
      const key = workflowIndex + ':' + item.name;
      if (!targets.has(key)) existing.push(credential(item));
    }
  }
  assert.equal(existing.length, 7, 'Expected exactly seven existing PostgreSQL references');
  assert.ok(existing.every(validReference), 'An existing PostgreSQL reference is missing or incomplete');
  const ids = new Set(existing.map(reference => reference.id));
  const names = new Set(existing.map(reference => reference.name));
  assert.equal(ids.size, 1, 'Existing PostgreSQL credential identifiers diverge');
  assert.equal(names.size, 1, 'Existing PostgreSQL credential names diverge');
  const canonical = existing[0];
  assert.match(canonical.name, /cuisine/i, 'Credential is not identified as Cuisine du Cambodge');
  assert.match(canonical.name, /cambodge/i, 'Credential is not identified as Cuisine du Cambodge');

  const updates = workflows.map(clone);
  const corrections = [];
  for (const target of repairTargets) {
    const beforeWorkflow = workflows[target.workflowIndex];
    const afterWorkflow = updates[target.workflowIndex];
    const beforeMatches = postgresNodes(beforeWorkflow).filter(item => item.name === target.nodeName);
    const afterMatches = postgresNodes(afterWorkflow).filter(item => item.name === target.nodeName);
    assert.equal(beforeMatches.length, 1, 'Repair target missing or duplicated');
    assert.equal(afterMatches.length, 1, 'Cloned repair target missing or duplicated');
    const beforeNode = beforeMatches[0];
    const afterNode = afterMatches[0];
    const current = credential(beforeNode);
    if (current !== undefined) {
      assert.ok(validReference(current), 'Target has a malformed PostgreSQL credential reference');
      assert.equal(current.id, canonical.id, 'Target PostgreSQL credential identifier diverges');
      assert.equal(current.name, canonical.name, 'Target PostgreSQL credential name diverges');
      corrections.push({ workflow: 'Workflow 0' + (target.workflowIndex + 1), node: target.nodeName,
        action: 'already-correct' });
      continue;
    }
    afterNode.credentials = { ...(afterNode.credentials || {}), postgres: clone(canonical) };
    assert.deepEqual(afterNode.parameters, beforeNode.parameters, 'Target parameters changed while planning');
    corrections.push({ workflow: 'Workflow 0' + (target.workflowIndex + 1), node: target.nodeName,
      action: 'attach-existing' });
  }
  return { updates, corrections, postgresReferenceCount: 9 };
}

function makeClient() {
  const key = process.env.N8N_API_KEY;
  assert.ok(key, 'N8N_API_KEY must come from the secure PowerShell runner');
  const origin = new URL(process.env.N8N_BASE_URL || 'https://n8n.orvekio.com');
  assert.equal(origin.protocol, 'https:', 'HTTPS required');
  assert.equal(origin.hostname, 'n8n.orvekio.com', 'Wrong n8n host');
  assert.equal(origin.pathname.replace(/\/$/, ''), '', 'Wrong n8n root path');
  assert.ok(!origin.username && !origin.password && !origin.search && !origin.hash, 'Unsafe n8n URL');
  const api = origin.origin + '/api/v1';
  return async (path, options = {}) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(api + path, { ...options, redirect: 'error', signal: controller.signal,
        headers: { 'X-N8N-API-KEY': key, Accept: 'application/json', ...(options.headers || {}) } });
      if (!response.ok) throw new Error('n8n API HTTP ' + response.status);
      return response.json();
    } finally { clearTimeout(timeout); }
  };
}

async function loadLiveWorkflows(request) {
  const found = new Map();
  let cursor;
  do {
    const query = new URLSearchParams({ limit: '100' });
    if (cursor) query.set('cursor', cursor);
    const page = await request('/workflows?' + query);
    assert.ok(Array.isArray(page.data), 'n8n workflow list missing data');
    for (const item of page.data) if (workflowNames.includes(item.name)) {
      assert.ok(!found.has(item.name), 'Duplicate expected workflow');
      found.set(item.name, String(item.id));
    }
    cursor = page.nextCursor || null;
  } while (cursor);
  assert.equal(found.size, workflowNames.length, 'One or more expected workflows are missing');
  const workflows = await Promise.all(workflowNames.map(name =>
    request('/workflows/' + encodeURIComponent(found.get(name)))));
  return { workflows, ids: workflowNames.map(name => found.get(name)) };
}

function assertNoConcurrentChange(before, latest) {
  assert.equal(latest.versionId, before.versionId, 'Workflow version changed before credential repair');
  for (const field of ['name', 'nodes', 'connections', 'settings', 'staticData', 'description', 'nodeGroups',
    'pinData', 'active', 'activeVersion', 'tags', 'shared', 'parentFolderId', 'projectId']) {
    assert.deepEqual(latest[field], before[field], 'Concurrent workflow change detected');
  }
}

function backup(workflow, id) {
  assert.match(id, /^[A-Za-z0-9_-]+$/, 'Unexpected workflow ID');
  const dir = join(homedir(), '.local', 'share', 'cuisine-n8n-backups');
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const path = join(dir, 'cuisine-' + id + '-credential-repair-' +
    new Date().toISOString().replace(/[:.]/g, '-') + '.json');
  writeFileSync(path, JSON.stringify(workflow, null, 2) + '\n',
    { encoding: 'utf8', mode: 0o600, flag: 'wx' });
}

export function safeFailureReason(error) {
  const message = String(error?.message || '');
  const status = message.match(/HTTP (\d{3})/)?.[1];
  if (status) return 'N8N_API_HTTP_' + status;
  if (/identifiers diverge/.test(message)) return 'EXISTING_CREDENTIAL_IDS_DIVERGE';
  if (/names diverge/.test(message)) return 'EXISTING_CREDENTIAL_NAMES_DIVERGE';
  if (/existing PostgreSQL reference is missing or incomplete/i.test(message)) return 'EXISTING_CREDENTIAL_REFERENCE_INCOMPLETE';
  if (/not identified as Cuisine du Cambodge/.test(message)) return 'EXISTING_CREDENTIAL_NOT_DEDICATED_CUISINE';
  if (/Target PostgreSQL credential identifier diverges/.test(message)) return 'TARGET_CREDENTIAL_ID_DIVERGES';
  if (/Target PostgreSQL credential name diverges/.test(message)) return 'TARGET_CREDENTIAL_NAME_DIVERGES';
  if (/malformed PostgreSQL credential/.test(message)) return 'TARGET_CREDENTIAL_REFERENCE_MALFORMED';
  if (/active|published|archived|Pinned data/.test(message)) return 'WORKFLOW_NOT_SAFE_FOR_REPAIR';
  if (/Concurrent|version changed|plan changed/.test(message)) return 'CONCURRENT_WORKFLOW_CHANGE';
  if (/timeout|abort/i.test(message)) return 'N8N_API_TIMEOUT';
  return 'CREDENTIAL_REPAIR_VALIDATION_STOPPED';
}

export async function main(args = process.argv.slice(2)) {
  assert.deepEqual(args, ['--apply'], 'Only explicit --apply is allowed');
  const request = makeClient();
  const initial = await loadLiveWorkflows(request);
  const firstPlan = planPostgresCredentialRepairs(initial.workflows);
  const changedIndexes = [...new Set(firstPlan.corrections.filter(item => item.action === 'attach-existing')
    .map(item => Number(item.workflow.slice(-2)) - 1))];
  if (changedIndexes.length) {
    const latest = await loadLiveWorkflows(request);
    initial.workflows.forEach((workflow, index) => assertNoConcurrentChange(workflow, latest.workflows[index]));
    const finalPlan = planPostgresCredentialRepairs(latest.workflows);
    assert.deepEqual(finalPlan.corrections, firstPlan.corrections, 'Credential repair plan changed before PUT');
    for (const index of changedIndexes) backup(latest.workflows[index], latest.ids[index]);
    for (const index of changedIndexes) {
      await request('/workflows/' + encodeURIComponent(latest.ids[index]), {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(asPayload(finalPlan.updates[index])),
      });
      const after = await request('/workflows/' + encodeURIComponent(latest.ids[index]));
      assert.equal(after.active, false, 'Workflow became active after credential repair');
      assert.ok(!after.activeVersion, 'Workflow became published after credential repair');
      assert.deepEqual(after.nodes, finalPlan.updates[index].nodes, 'Unexpected node change after credential repair');
      for (const field of ['name', 'connections', 'settings', 'staticData', 'description', 'nodeGroups',
        'pinData', 'tags', 'shared', 'parentFolderId', 'projectId']) {
        assert.deepEqual(after[field], latest.workflows[index][field], 'Unexpected workflow change after credential repair');
      }
    }
  }
  const final = await loadLiveWorkflows(request);
  const verified = planPostgresCredentialRepairs(final.workflows);
  assert.ok(verified.corrections.every(item => item.action === 'already-correct'),
    'One or more target references were not persisted');
  const result = { status: 'PASS', corrections: firstPlan.corrections,
    postgresReferenceCount: verified.postgresReferenceCount, workflowsInactive: true,
    backupsCreated: changedIndexes.length, synchronizationRepeated: false };
  console.log('CREDENTIAL_REPAIR_RESULT ' + JSON.stringify(result));
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.log('CREDENTIAL_REPAIR_RESULT ' + JSON.stringify({ status: 'FAIL',
      reason: safeFailureReason(error), synchronizationRepeated: false }));
    process.exitCode = 1;
  });
}
