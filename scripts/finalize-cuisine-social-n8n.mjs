#!/usr/bin/env node
/**
 * Final, conservative technical check for the Cuisine du Cambodge social n8n
 * workflows.  It only reads n8n, except when --apply-safe is explicitly given:
 * then it delegates the narrowly reviewed PUTs to sync-cuisine-n8n-runtime.mjs.
 * It never activates or executes a workflow, sends email, or calls Meta.
 */
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { planWorkflow } from './sync-cuisine-n8n-runtime.mjs';

export const workflowNames = [
  'Cuisine du Cambodge - 01 - Brouillon IA et validation email',
  'Cuisine du Cambodge - 02 - Publication approuvée Facebook et création Instagram',
  'Cuisine du Cambodge - 03 - Réconcilier et publier Instagram',
];
const filenames = ['01-drafts-email-approval.json', '02-publish-approved.json', '03-reconcile-instagram.json'];
const validStatuses = new Set(['PASS', 'PASS OFFLINE', 'BLOCKED', 'FAIL']);

const reviewed = index => JSON.parse(readFileSync(new URL(
  '../automation/n8n/' + filenames[index], import.meta.url), 'utf8'));
const node = (workflow, name) => workflow.nodes.find(item => item.name === name);
const credentialReferenceShape = item => {
  const references = Object.values(item?.credentials || {}).filter(value => value && typeof value === 'object');
  const hasId = references.some(value => typeof value.id === 'string' && value.id.length > 0);
  const hasName = references.some(value => typeof value.name === 'string' && value.name.length > 0);
  return hasId ? (hasName ? 'id-and-name' : 'id-only') : (hasName ? 'name-only' : 'missing');
};
const hasCredentialReference = item => credentialReferenceShape(item).startsWith('id-');
const graphNodes = workflow => workflow.nodes.filter(item =>
  typeof item.parameters?.url === 'string' && item.parameters.url.includes('graph.facebook.com'));
const hasPlaceholder = value => /CONFIGURER_[A-Z_]+/.test(value);
const statusFrom = checks => checks.some(check => check.status === 'FAIL') ? 'FAIL' :
  checks.some(check => check.status === 'BLOCKED') ? 'BLOCKED' :
  checks.some(check => check.status === 'PASS OFFLINE') ? 'PASS OFFLINE' : 'PASS';

function check(name, status, proof) {
  assert.ok(validStatuses.has(status), 'Unknown report status');
  return { name, status, proof };
}

/** Pure and offline-testable: it deliberately returns only booleans and safe labels. */
export function inspectLiveWorkflow(workflow, index) {
  assert.ok(Number.isInteger(index) && index >= 0 && index < workflowNames.length, 'Invalid workflow index');
  const checks = [];
  checks.push(check('workflow identity', workflow?.name === workflowNames[index] ? 'PASS' : 'FAIL',
    'exact expected workflow name'));
  checks.push(check('inactive state', workflow?.active === false && !workflow?.activeVersion &&
    workflow?.isArchived !== true ? 'PASS' : 'FAIL', 'workflow is inactive, unpublished and not archived'));
  checks.push(check('no pinned execution data', !workflow?.pinData || Object.keys(workflow.pinData).length === 0 ?
    'PASS' : 'FAIL', 'no pinned data'));

  let plan;
  try {
    plan = planWorkflow(workflow, reviewed(index), index);
    checks.push(check('reviewed synchronization', plan.changes.length === 0 ? 'PASS' : 'FAIL',
      plan.changes.length === 0 ? 'final dry-run is already up to date' : 'reviewed changes remain pending'));
  } catch {
    checks.push(check('reviewed synchronization', 'FAIL', 'live workflow does not meet the reviewed safe contract'));
  }

  const postgresNodes = workflow?.nodes?.filter(item => item.type === 'n8n-nodes-base.postgres') || [];
  const postgresProof = postgresNodes.map((item, position) =>
    'PostgreSQL node ' + (position + 1) + ': ' + credentialReferenceShape(item)).join('; ');
  checks.push(check('PostgreSQL credential references', postgresNodes.length > 0 &&
    postgresNodes.every(hasCredentialReference) ? 'PASS' : 'FAIL',
  postgresProof || 'no live PostgreSQL node found'));

  if (index === 0) {
    const resend = node(workflow, 'Envoyer la demande de validation Resend');
    const wait = node(workflow, 'Attendre une décision via formulaire');
    const decision = node(workflow, 'Interpréter la décision');
    const insert = node(workflow, 'Enregistrer le brouillon');
    const insertGuard = node(workflow, 'Brouillon inséré ?');
    checks.push(check('Resend credential reference', resend?.parameters?.url === 'https://api.resend.com/emails' &&
      hasCredentialReference(resend) ? 'PASS' : 'FAIL', 'dedicated live Resend node has an endpoint and credential reference'));
    const approvalSafe = wait?.parameters?.resume === 'form' && wait?.parameters?.limitWaitTime === true &&
      typeof decision?.parameters?.jsCode === 'string' && decision.parameters.jsCode.includes("d==='Approuver'?'approved'") &&
      insert?.alwaysOutputData === true && insertGuard?.type === 'n8n-nodes-base.if';
    checks.push(check('human approval guard', approvalSafe ? 'PASS OFFLINE' : 'FAIL',
      'approval form, expiry and explicit approval logic verified structurally; no real email sent'));
  } else {
    const meta = graphNodes(workflow);
    const required = index === 1 ? ['/photos', '/media'] : ['fields=status_code', '/media_publish'];
    const metaSafe = meta.length === 2 && meta.every(item => hasCredentialReference(item) &&
      !hasPlaceholder(item.parameters.url)) && required.every(fragment =>
      meta.some(item => item.parameters.url.includes(fragment)));
    checks.push(check('Meta credential references and configured endpoints', metaSafe ? 'PASS' : 'FAIL',
      'two live Graph API nodes have credential references and no export placeholder'));
    checks.push(check('Meta identity and token validity', 'BLOCKED',
      'not readable through the n8n workflow API; no Meta endpoint was called'));
  }
  return { workflow: workflowNames[index], status: statusFrom(checks), checks };
}

export function summarizeChildResult(result) {
  if (result.error?.code === 'ETIMEDOUT') return { status: 'FAIL', proof: 'safe synchronizer timed out; no retry was attempted' };
  if (result.status === 0) return { status: 'PASS', proof: 'safe synchronizer completed' };
  return { status: 'FAIL', proof: 'safe synchronizer stopped; consult its terminal output (no automatic retry)' };
}

function safeFailure(error) {
  const message = String(error?.message || '');
  const status = message.match(/HTTP (\d{3})/)?.[1];
  if (status) return 'n8n API HTTP ' + status;
  if (/abort|timeout/i.test(message)) return 'n8n API timeout';
  return 'safe validation stopped';
}

function runSynchronizer(apply) {
  const result = spawnSync(process.execPath, ['scripts/sync-cuisine-n8n-runtime.mjs', ...(apply ? ['--apply'] : [])], {
    cwd: process.cwd(), env: process.env, encoding: 'utf8', timeout: 180000, maxBuffer: 1024 * 1024,
  });
  return summarizeChildResult(result);
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
  return async path => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(api + path, { redirect: 'error', signal: controller.signal,
        headers: { 'X-N8N-API-KEY': key, Accept: 'application/json' } });
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
  return Promise.all(workflowNames.map(name => request('/workflows/' + encodeURIComponent(found.get(name)))));
}

function reportComponents(audits) {
  const component = (name, status, proof) => ({ component: name, status, proof });
  const first = audits[0]?.checks || [];
  const other = audits.slice(1).flatMap(audit => audit.checks);
  const has = (checks, name, expected) => checks.some(item => item.name === name && item.status === expected);
  return [
    ...audits.map((audit, index) => component('Workflow 0' + (index + 1), audit.status,
      'live workflow API inspection')),
    component('PostgreSQL', other.concat(first).every(item => item.name !== 'PostgreSQL credential references' || item.status === 'PASS') ? 'BLOCKED' : 'FAIL',
      'credential references verified; connection was not executed'),
    component('Resend', has(first, 'Resend credential reference', 'PASS') ? 'BLOCKED' : 'FAIL',
      'live node association verified; sender domain and inbox were not queried'),
    component('Meta Facebook', has(other, 'Meta credential references and configured endpoints', 'PASS') ? 'BLOCKED' : 'FAIL',
      'live endpoint references verified; no Graph API call was made'),
    component('Meta Instagram', has(other, 'Meta credential references and configured endpoints', 'PASS') ? 'BLOCKED' : 'FAIL',
      'live endpoint references verified; no Graph API call was made'),
    component('Validation humaine', has(first, 'human approval guard', 'PASS OFFLINE') ? 'PASS OFFLINE' : 'FAIL',
      'structural and offline execution contracts only'),
    component('Anti-doublons', audits.every(audit => has(audit.checks, 'reviewed synchronization', 'PASS')) ? 'PASS OFFLINE' : 'FAIL',
      'reviewed SQL and workflow contracts; no production row was created'),
  ];
}

function writeReport(report) {
  const dir = join(process.cwd(), 'reports');
  mkdirSync(dir, { recursive: true });
  const filename = 'cuisine-n8n-finalization-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json';
  const target = join(dir, filename);
  writeFileSync(target, JSON.stringify(report, null, 2) + '\n', { encoding: 'utf8', flag: 'wx', mode: 0o600 });
  return target;
}

export async function main(args = process.argv.slice(2)) {
  assert.ok(args.every(arg => arg === '--apply-safe') && args.length <= 1,
    'Only optional --apply-safe is allowed');
  const applySafe = args.includes('--apply-safe');
  const report = { schemaVersion: 1, generatedAt: new Date().toISOString(), mode: applySafe ? 'apply-safe' : 'read-only',
    safeguards: { workflowsActivated: false, workflowsExecuted: false, emailsSent: false, metaCallsMade: false, credentialsLogged: false },
    synchronization: [], workflows: [], components: [], verdict: 'BLOQUÉ' };
  try {
    const dryRun = runSynchronizer(false);
    report.synchronization.push({ phase: 'preflight dry-run', ...dryRun });
    if (dryRun.status !== 'PASS') throw new Error('preflight failed');
    if (applySafe) {
      const apply = runSynchronizer(true);
      report.synchronization.push({ phase: 'reviewed technical changes only', ...apply });
      if (apply.status !== 'PASS') throw new Error('safe apply failed');
    }
    const finalDryRun = runSynchronizer(false);
    report.synchronization.push({ phase: 'final idempotence dry-run', ...finalDryRun });
    if (finalDryRun.status !== 'PASS') throw new Error('final dry-run failed');
    const live = await loadLiveWorkflows(makeClient());
    report.workflows = live.map(inspectLiveWorkflow);
    report.components = reportComponents(report.workflows);
    report.verdict = report.components.some(item => item.status === 'FAIL') ? 'BLOQUÉ' :
      report.components.some(item => item.status === 'BLOCKED') ? 'TECHNIQUEMENT FINALISÉ' :
      'PRÊT POUR VALIDATION FINALE';
  } catch (error) {
    report.synchronization.push({ phase: 'stop', status: 'FAIL', proof: safeFailure(error) });
    report.verdict = 'BLOQUÉ';
  }
  const path = writeReport(report);
  console.log('Rapport expurgé créé : ' + path);
  console.log('Verdict : ' + report.verdict);
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then(report => { if (report.verdict === 'BLOQUÉ') process.exitCode = 1; }).catch(error => {
    console.error('STOP: ' + safeFailure(error));
    process.exitCode = 1;
  });
}
