#!/usr/bin/env node
/**
 * Surgical n8n approval-guard updater for Cuisine du Cambodge.
 *
 * Default = read-only inspection. Pass --apply explicitly to write.
 * Requires N8N_API_KEY supplied through the runner's secure environment.
 * Never reimports exports, touches credentials/URLs, publishes, or runs workflows.
 */
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const base = process.env.N8N_BASE_URL || 'https://n8n.orvekio.com';
const key = process.env.N8N_API_KEY;
const apply = process.argv.includes('--apply');
if (process.argv.some((a) => a.startsWith('--') && !['--apply'].includes(a))) {
  throw new Error('Unknown option: only --apply is accepted');
}
if (!key) throw new Error('N8N_API_KEY must be supplied by a secure runner secret (never paste it into code or logs)');
const origin = new URL(base);
assert.equal(origin.protocol, 'https:', 'n8n must use HTTPS');
assert.equal(origin.hostname, 'n8n.orvekio.com', 'Refusing to modify any other n8n instance');
assert.equal(origin.pathname.replace(/\/$/, ''), '', 'N8N_BASE_URL must be the instance root');
assert.ok(!origin.username && !origin.password && !origin.search && !origin.hash, 'N8N_BASE_URL must contain no credentials or suffix');
const api = origin.origin + '/api/v1';
const headers = { 'X-N8N-API-KEY': key, Accept: 'application/json' };

const specs = [
  {
    name: 'Cuisine du Cambodge - 02 - Publication approuvée Facebook et création Instagram',
    node: 'Claim atomique uniquement si validé',
    file: '../automation/n8n/02-publish-approved.json',
    guard: " AND human_decision='approved' AND approved_at IS NOT NULL AND decided_at IS NOT NULL",
  },
  {
    name: 'Cuisine du Cambodge - 03 - Réconcilier et publier Instagram',
    node: 'Réserver un conteneur à examiner',
    file: '../automation/n8n/03-reconcile-instagram.json',
    guard: " AND human_decision='approved' AND approved_at IS NOT NULL AND decided_at IS NOT NULL AND fb_state='published'",
  },
];

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const resp = await fetch(api + path, { ...options, headers: { ...headers, ...(options.headers || {}) }, signal: controller.signal, redirect: 'error' });
    if (!resp.ok) throw new Error('n8n API ' + options.method?.toUpperCase() + ' ' + path.split('?')[0] + ' returned HTTP ' + resp.status);
    return await resp.json();
  } finally {
    clearTimeout(timeout);
  }
}
async function listByName(name) {
  const matches = [];
  let cursor;
  do {
    const qs = new URLSearchParams({ limit: '100' });
    if (cursor) qs.set('cursor', cursor);
    const page = await request('/workflows?' + qs.toString());
    assert.ok(Array.isArray(page.data), 'n8n workflow list missing data');
    for (const workflow of page.data) if (workflow.name === name) matches.push(workflow);
    cursor = page.nextCursor || null;
  } while (cursor);
  assert.equal(matches.length, 1, 'Expected exactly one existing Cuisine workflow: ' + name);
  return matches[0].id;
}
function inspect(workflow, spec) {
  assert.equal(workflow.name, spec.name, 'Unexpected workflow name');
  assert.equal(workflow.active, false, 'Workflow is active; refusing modification');
  assert.ok(!workflow.activeVersion, 'Workflow has a published version; refusing modification');
  assert.notEqual(workflow.isArchived, true, 'Workflow is archived');
  assert.ok(!workflow.pinData || Object.keys(workflow.pinData).length === 0, 'Pinned execution data present; refusing full workflow update');
  assert.ok(Array.isArray(workflow.nodes), 'Missing workflow nodes');
  const matches = workflow.nodes.filter((n) => n.name === spec.node && n.type === 'n8n-nodes-base.postgres');
  assert.equal(matches.length, 1, 'Target SQL node missing or duplicated: ' + spec.node);
  const actual = matches[0].parameters?.query;
  assert.equal(typeof actual, 'string', 'Missing target SQL query');

  // Load only the guard SQL from the reviewed PR branch.
  // Every other live node parameter, credential, URL, and connection stays untouched.
  const reviewed = JSON.parse(readFileSync(new URL(spec.file, import.meta.url), 'utf8'));
  const candidate = reviewed.nodes.find((n) => n.name === spec.node)?.parameters?.query;
  assert.equal(typeof candidate, 'string', 'Reviewed guard SQL missing');
  assert.ok(candidate.includes(spec.guard), 'Reviewed SQL lacks expected safety guard');
  const previous = candidate.replace(spec.guard, '');
  if (actual === candidate) return { status: 'already-safe', query: candidate };
  assert.equal(actual, previous, 'Live SQL differs from both known original and reviewed version. Aborting to preserve customizations.');
  return { status: 'needs-guard', query: candidate };
}
async function main() {
  const tasks = [];
  const firstWorkflowName = 'Cuisine du Cambodge - 01 - Brouillon IA et validation email';
  const firstWorkflowId = await listByName(firstWorkflowName);
  async function checkFirstWorkflowInactive() {
    const first = await request('/workflows/' + encodeURIComponent(firstWorkflowId));
    assert.equal(first.name, firstWorkflowName, 'Unexpected first Cuisine workflow');
    assert.equal(first.active, false, 'First Cuisine workflow is active; aborting');
    assert.ok(!first.activeVersion, 'First Cuisine workflow has a published version; aborting');
  }
  await checkFirstWorkflowInactive();
  // Validate BOTH workflows and expected SQL before making ANY changes.
  for (const spec of specs) {
    const id = await listByName(spec.name);
    const current = await request('/workflows/' + encodeURIComponent(id));
    const plan = inspect(current, spec);
    console.log(spec.name + ': ' + plan.status);
    tasks.push({ spec, id, current, plan });
  }
  if (!apply) {
    console.log('READ-ONLY: no changes made; pass --apply only after reviewing output and safe access.');
    return;
  }

  for (const task of tasks) {
    if (task.plan.status === 'already-safe') continue;
    await checkFirstWorkflowInactive();
    const latest = await request('/workflows/' + encodeURIComponent(task.id));
    // Stop on concurrent edits. This preserves the user's Meta IDs and credential associations.
    assert.equal(JSON.stringify(latest.nodes), JSON.stringify(task.current.nodes), 'Concurrent node edits detected; aborting');
    assert.equal(JSON.stringify(latest.connections), JSON.stringify(task.current.connections), 'Connections changed; aborting');
    for (const field of ['name', 'description', 'nodeGroups', 'settings', 'staticData', 'pinData', 'tags', 'shared', 'parentFolderId', 'projectId']) {
      assert.deepEqual(latest[field], task.current[field], 'Workflow configuration changed: ' + field);
    }
    assert.equal(latest.active, false, 'Workflow became active; aborting');
    assert.ok(!latest.activeVersion, 'Workflow acquired a published version; aborting');
    assert.ok(!latest.pinData || Object.keys(latest.pinData).length === 0, 'Pinned execution data present; refusing full workflow update');
    assert.equal(typeof latest.versionId, 'string', 'Workflow version unavailable; aborting');
    assert.equal(latest.versionId, task.current.versionId, 'Workflow version changed; aborting');
    const modifiedNodes = structuredClone(latest.nodes);
    const sqlNode = modifiedNodes.find((n) => n.name === task.spec.node);
    sqlNode.parameters.query = task.plan.query;
    const body = {
      name: latest.name,
      nodes: modifiedNodes,
      connections: latest.connections,
      settings: latest.settings,
    };
    assert.ok(latest.settings && typeof latest.settings === 'object', 'Workflow settings unavailable; aborting');
    if (Object.hasOwn(latest, 'staticData')) body.staticData = latest.staticData;
    // These are writable in the instance's /api/v1/docs workflow schema.
    // Omitting them from a full PUT could discard existing canvas/configuration data.
    for (const field of ['description', 'nodeGroups', 'pinData']) {
      if (Object.hasOwn(latest, field)) body[field] = latest[field];
    }
    // MiHecho precedent: preserve the complete LIVE workflow before any PUT.
    // Includes local credential references and user-configured Meta IDs; never log its contents.
    const backupDirectory = join(homedir(), '.local', 'share', 'cuisine-n8n-backups');
    mkdirSync(backupDirectory, { recursive: true, mode: 0o700 });
    const safeId = String(task.id);
    assert.match(safeId, /^[A-Za-z0-9_-]+$/, 'Unexpected workflow ID for backup path');
    const backupPath = join(backupDirectory, 'cuisine-' + safeId + '-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json');
    writeFileSync(backupPath, JSON.stringify(latest, null, 2) + '\\n', { encoding: 'utf8', mode: 0o600, flag: 'wx' });
    console.log(task.spec.name + ': private local backup saved (0600) before update.');
    await request('/workflows/' + encodeURIComponent(task.id), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const after = await request('/workflows/' + encodeURIComponent(task.id));
    assert.equal(after.active, false, 'ALERT: Workflow unexpectedly active after update');
    assert.ok(!after.activeVersion, 'ALERT: Workflow unexpectedly published after update');
    const node = after.nodes.find((n) => n.name === task.spec.node);
    assert.equal(node?.parameters?.query, task.plan.query, 'SQL guard not confirmed after write');
    assert.deepEqual(after.nodes, modifiedNodes, 'A node setting, URL, credential, or node order changed');
    for (const field of ['name', 'description', 'nodeGroups', 'connections', 'settings', 'staticData', 'pinData', 'tags', 'shared', 'parentFolderId', 'projectId']) {
      assert.deepEqual(after[field], latest[field], 'Workflow configuration changed after update: ' + field);
    }
    console.log(task.spec.name + ': SQL guard SAVED and verified; inactive; credentials unchanged.');
  }
  await checkFirstWorkflowInactive();
  console.log('No workflow was executed, published, imported, or activated.');
}
main().catch((err) => { console.error('STOP (no further writes): ' + err.message); process.exitCode = 1; });
