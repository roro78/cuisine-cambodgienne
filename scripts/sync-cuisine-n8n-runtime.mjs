#!/usr/bin/env node
/**
 * Cuisine du Cambodge — conservative live n8n synchronization.
 * Dry-run by default. No n8n activation or execution. Never reimport exported workflows.
 *
 * Usage: N8N_API_KEY=<runner secret> node scripts/sync-cuisine-n8n-runtime.mjs [--apply]
 *
 * All plans are computed/validated before the first PUT. The only authorized mutations
 * are reviewed SQL guards, Code-node input access and the draft-insert email gate.
 * If any live node differs from its known reviewed predecessor, fail closed.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const names = [
  'Cuisine du Cambodge - 01 - Brouillon IA et validation email',
  'Cuisine du Cambodge - 02 - Publication approuvée Facebook et création Instagram',
  'Cuisine du Cambodge - 03 - Réconcilier et publier Instagram',
];
const filenames = ['01-drafts-email-approval.json','02-publish-approved.json','03-reconcile-instagram.json'];
export const approvedPredecessorHashes = Object.freeze({
  promptBody: 'ae16f3ddd6cf71f19f63f71c1e55c33f0a6c2a6d5f1aca6d2e9b4f73b12681a0',
  validatorCode: '41bacec56ac8987a4afb65305bd9adc30ed7c766007ea10ce254f997d276ca6f',
  validatorCodeIntermediate: 'f60c925bc7752bb3e4f842ed5eed439eef94bdd7c9fdbc6bcd9cb18547967f9c',
  insertGuardExpression: '3ba19c03fc1213967bb285126dc60d7fbd4b5af4280afa663daee862e301007a',
  decisionIntermediate: '0b8a0a7fb3141e0fe6cee4a23a18423ae2c530e747532efa5eb2d08894f2e4a5',
});
const sha256 = value => createHash('sha256').update(String(value)).digest('hex');

const codePatches = {
  0: [
    ['Choisir un contenu original', [
      ["const history=items.map(i=>i.json).filter(i=>i.source_id);",
       "const history=$input.all().map(i=>i.json).filter(i=>i.source_id);"],
    ]],
    ['Interpréter la décision', [
      ["const d=String($json?.data?.Decision??$json?.Decision??$json?.body?.Decision??'')",
       "const incoming=$input.first().json;\nconst d=String(incoming?.data?.Decision??incoming?.Decision??incoming?.body?.Decision??'')"],
      ["const note=String($json?.data?.Commentaire??$json?.Commentaire??$json?.body?.Commentaire??'')",
       "const note=String(incoming?.data?.Commentaire??incoming?.Commentaire??incoming?.body?.Commentaire??'')"],
    ]],
  ],
  2: [
    ['Lire le statut Meta', [
      ["const state=String($json.status_code||'').toUpperCase();",
       "const state=String($input.first().json.status_code||'').toUpperCase();"],
    ]],
    ['Ne garder que les conteneurs prêts', [
      ["return items.filter(i=>i.json.ig_state==='submitting');",
       "return $input.all().filter(i=>i.json.ig_state==='submitting');"],
    ]],
  ],
};
const sqlPatches = {
  1: ['Claim atomique uniquement si validé',
      " AND human_decision='approved' AND approved_at IS NOT NULL AND decided_at IS NOT NULL"],
  2: ['Réserver un conteneur à examiner',
      " AND human_decision='approved' AND approved_at IS NOT NULL AND decided_at IS NOT NULL AND fb_state='published'"],
};
const clone = x => structuredClone(x);
const find = (workflow, name, type) => {
  const matches = workflow.nodes.filter(node => node.name === name && node.type === type);
  assert.equal(matches.length, 1, 'Expected exactly one approved node: ' + name);
  return matches[0];
};
const guarded = (actual, reviewed, patches, label) => {
  let predecessor = reviewed;
  for (const [previous, next] of patches) {
    assert.ok(predecessor.includes(next), 'Reviewed patch absent: ' + label);
    assert.equal(predecessor.split(next).length, 2, 'Reviewed patch ambiguous: ' + label);
    predecessor = predecessor.replace(next, previous);
  }
  if (actual === reviewed) return { changed: false, value: reviewed };
  assert.equal(actual, predecessor, 'Unexpected live customizations: ' + label);
  return { changed: true, value: reviewed };
};
const hashGuarded = (actual, reviewed, predecessorHash, label) => {
  if (actual === reviewed) return { changed: false, value: reviewed };
  assert.equal(sha256(actual), predecessorHash, 'Unexpected live customizations: ' + label);
  return { changed: true, value: reviewed };
};
const sqlGuarded = (actual, reviewed, condition, label) => {
  assert.ok(reviewed.includes(condition), 'Reviewed SQL lacks guard: ' + label);
  assert.equal(reviewed.split(condition).length, 2, 'Guard ambiguous: ' + label);
  const previous = reviewed.replace(condition, '');
  if (actual === reviewed) return { changed: false, value: reviewed };
  assert.equal(actual, previous, 'Unexpected live SQL customizations: ' + label);
  return { changed: true, value: reviewed };
};

export function planWorkflow(live, reviewed, index) {
  assert.ok([0,1,2].includes(index), 'Invalid workflow index');
  assert.equal(live.name, names[index], 'Wrong live workflow');
  assert.equal(reviewed.name, names[index], 'Wrong reviewed workflow');
  assert.equal(live.active, false, 'Workflow is active; refusing any write');
  assert.ok(!live.activeVersion, 'Workflow has published version; refusing write');
  assert.notEqual(live.isArchived, true, 'Archived workflow');
  assert.ok(!live.pinData || Object.keys(live.pinData).length === 0, 'Pinned data: stop');
  assert.ok(Array.isArray(live.nodes) && live.connections && live.settings, 'Invalid live structure');
  assert.equal(reviewed.active, false, 'Reviewed export is unexpectedly active');
  const update = clone(live);
  const changes = [];

  for (const [name, patches] of codePatches[index] || []) {
    const existing = find(update, name, 'n8n-nodes-base.code');
    const target = find(reviewed, name, 'n8n-nodes-base.code');
    // Exact SHA-256 of 2026-10-23 intermediate Code: $input.first(), unsafe Number(saved.id).
    const allowIntermediate = index === 0 && name === 'Interpréter la décision' &&
      sha256(existing.parameters.jsCode) === approvedPredecessorHashes.decisionIntermediate;
    const result = allowIntermediate
      ? { changed: true, value: target.parameters.jsCode }
      : guarded(existing.parameters.jsCode, target.parameters.jsCode, patches, name);
    if (result.changed) {
      existing.parameters.jsCode = result.value;
      changes.push(name + ': code');
    }
  }
  if (sqlPatches[index]) {
    const [name, condition] = sqlPatches[index];
    const existing = find(update, name, 'n8n-nodes-base.postgres');
    const target = find(reviewed, name, 'n8n-nodes-base.postgres');
    const result = sqlGuarded(existing.parameters.query, target.parameters.query, condition, name);
    if (result.changed) {
      existing.parameters.query = result.value;
      changes.push(name + ': SQL');
    }
  }
  if (index === 1) {
    const claimName = 'Claim atomique uniquement si validé';
    const guardName = 'Vérifier la réservation avant Meta';
    const facebookName = 'Publier la photo Facebook';
    const desiredGuard = find(reviewed, guardName, 'n8n-nodes-base.code');
    const desiredClaimEdges = reviewed.connections[claimName];
    const desiredGuardEdges = reviewed.connections[guardName];
    assert.deepEqual(desiredClaimEdges?.main, [[{node:guardName,type:'main',index:0}]],
      'Reviewed claim does not pass through preflight');
    assert.deepEqual(desiredGuardEdges?.main, [[{node:facebookName,type:'main',index:0}]],
      'Reviewed preflight does not lead to Facebook');
    const existing = update.nodes.find(n => n.name === guardName || n.id === desiredGuard.id);
    if (!existing) {
      assert.deepEqual(update.connections[claimName]?.main,
        [[{node:facebookName,type:'main',index:0}]],
        'Unexpected live claim routing; refusing automatic rewiring');
      assert.equal(update.connections[guardName], undefined, 'Preflight edge collision');
      update.nodes.push(clone(desiredGuard));
      update.connections[claimName] = clone(desiredClaimEdges);
      update.connections[guardName] = clone(desiredGuardEdges);
      changes.push(guardName + ': reject missing/invalid PostgreSQL claim before Meta');
    } else {
      assert.equal(existing.id, desiredGuard.id, 'Preflight ID mismatch');
      assert.deepEqual(existing, desiredGuard, 'Unexpected live preflight customization');
      assert.deepEqual(update.connections[claimName], desiredClaimEdges,
        'Live claim bypasses preflight');
      assert.deepEqual(update.connections[guardName], desiredGuardEdges,
        'Live preflight routing changed');
    }
    const facebook = find(update, facebookName, 'n8n-nodes-base.httpRequest');
    const reviewedFacebook = find(reviewed, facebookName, 'n8n-nodes-base.httpRequest');
    const keys = ['contentType','rawContentType','body','sendHeaders',
      'headerParameters','specifyBody','bodyParameters'];
    const current = facebook.parameters;
    const target = reviewedFacebook.parameters;
    if (keys.some(key => !isDeepStrictEqual(current[key],target[key]))) {
      assert.equal(current.contentType, 'raw', 'Unexpected live Facebook body type');
      assert.equal(current.rawContentType, 'application/json', 'Unexpected MIME type');
      assert.equal(current.body,
        '={{JSON.stringify({url:$json.image_url,caption:$json.facebook_caption})}}',
        'Unexpected existing Facebook payload');
      assert.equal(current.sendHeaders, true, 'Unexpected live Facebook headers');
      assert.deepEqual(current.headerParameters,
        {parameters:[{name:'Content-Type',value:'application/json'}]},
        'Unexpected Facebook content-type header');
      assert.equal(current.specifyBody, undefined, 'Unexpected Facebook body mode');
      assert.equal(current.bodyParameters, undefined, 'Unexpected Facebook body fields');
      for (const key of keys) {
        if (Object.hasOwn(target,key)) current[key]=clone(target[key]);
        else delete current[key];
      }
      changes.push(facebookName + ': send URL and caption as URL-encoded form fields');
    }
    assert.deepEqual(keys.map(key=>current[key]),keys.map(key=>target[key]),
      'Facebook body mode drift after patch');
  }
  if (index === 0) {
    const promptName = 'Rédiger via Llama sur Ollama';
    const prompt = find(update, promptName, 'n8n-nodes-base.httpRequest');
    const reviewedPrompt = find(reviewed, promptName, 'n8n-nodes-base.httpRequest');
    const promptResult = hashGuarded(prompt.parameters.body, reviewedPrompt.parameters.body,
      approvedPredecessorHashes.promptBody, promptName);
    if (promptResult.changed) {
      prompt.parameters.body = promptResult.value;
      changes.push(promptName + ': deterministic-generation prompt');
    }

    const validatorName = 'Vérifier et cadrer les textes';
    const validator = find(update, validatorName, 'n8n-nodes-base.code');
    const reviewedValidator = find(reviewed, validatorName, 'n8n-nodes-base.code');
    // Allow the exact historical validator from GitHub ce6ace6, never arbitrary drift.
    // The original predecessor hash remains authorized and all other hashes fail closed.
    const validatorHash = sha256(validator.parameters.jsCode);
    const validatorPredecessor = validatorHash === approvedPredecessorHashes.validatorCodeIntermediate
      ? approvedPredecessorHashes.validatorCodeIntermediate
      : approvedPredecessorHashes.validatorCode;
    const validatorResult = hashGuarded(validator.parameters.jsCode,
      reviewedValidator.parameters.jsCode, validatorPredecessor, validatorName);
    if (validatorResult.changed) {
      validator.parameters.jsCode = validatorResult.value;
      changes.push(validatorName + ': deterministic verified-facts formatter');
    }

    const insertName = 'Enregistrer le brouillon';
    const insert = find(update, insertName, 'n8n-nodes-base.postgres');
    const reviewedInsert = find(reviewed, insertName, 'n8n-nodes-base.postgres');
    assert.equal(insert.parameters.query, reviewedInsert.parameters.query, 'Draft INSERT SQL drift');
    assert.equal(reviewedInsert.alwaysOutputData, true, 'Reviewed draft output gate missing');
    if (insert.alwaysOutputData !== true) {
      assert.ok(insert.alwaysOutputData === undefined || insert.alwaysOutputData === false,
        'Unexpected draft output setting');
      insert.alwaysOutputData = true;
      changes.push(insertName + ': alwaysOutputData');
    }

    const guardName = 'Brouillon inséré ?';
    const desiredGuard = find(reviewed, guardName, 'n8n-nodes-base.if');
    const desiredInsertEdges = reviewed.connections[insertName];
    const desiredGuardEdges = reviewed.connections[guardName];
    assert.equal(desiredInsertEdges?.main?.[0]?.[0]?.node, guardName, 'Reviewed draft gate disconnected');
    assert.equal(desiredGuardEdges?.main?.[0]?.[0]?.node, 'Envoyer la demande de validation Resend',
      'Reviewed gate does not lead to email on TRUE');
    assert.equal(desiredGuardEdges?.main?.[1]?.length, 0, 'Reviewed FALSE branch must stop');
    const anyGuard = update.nodes.find(n => n.name === guardName || n.id === desiredGuard.id);
    if (!anyGuard) {
      const initial = update.connections[insertName];
      assert.deepEqual(initial?.main, [[{
        node: 'Envoyer la demande de validation Resend', type: 'main', index: 0,
      }]], 'Draft insert has unexpected live outgoing edges; stop');
      assert.equal(update.connections[guardName], undefined, 'Guard connection collision');
      update.nodes.push(clone(desiredGuard));
      update.connections[insertName] = clone(desiredInsertEdges);
      update.connections[guardName] = clone(desiredGuardEdges);
      changes.push(guardName + ': insert gate');
    } else {
      assert.equal(anyGuard.name, desiredGuard.name, 'Draft guard ID collision');
      assert.equal(anyGuard.id, desiredGuard.id, 'Draft guard has unexpected ID');
      assert.equal(anyGuard.type, desiredGuard.type, 'Draft guard has unexpected type');
      if (!isDeepStrictEqual(anyGuard.parameters, desiredGuard.parameters)) {
        const candidateParameters = clone(anyGuard.parameters);
        const candidateCondition = candidateParameters.conditions?.conditions?.[0];
        const desiredExpression = desiredGuard.parameters.conditions.conditions[0].leftValue;
        if (candidateCondition?.leftValue !== desiredExpression) {
          assert.equal(sha256(candidateCondition?.leftValue),
            approvedPredecessorHashes.insertGuardExpression, 'Unexpected draft guard condition');
          candidateCondition.leftValue = desiredExpression;
        }
        assert.deepEqual(candidateParameters, desiredGuard.parameters, 'Draft guard customized');
        anyGuard.parameters = clone(desiredGuard.parameters);
        changes.push(guardName + ': PostgreSQL BIGINT validation');
      }
      assert.deepEqual(update.connections[insertName], desiredInsertEdges, 'Draft guard incoming edge changed');
      assert.deepEqual(update.connections[guardName], desiredGuardEdges, 'Draft guard outgoing edge changed');
    }
  }
  return { update, changes };
}

// The public API PUT schema is stricter than GET: nullable response fields and
// internal settings may produce HTTP 400 if copied verbatim. Use a positive
// allowlist, keeping only writable content and verifying all live metadata
// again after the write. Never serialize empty/null pinData or a null description.
export function asPayload(workflow) {
  assert.ok(workflow.settings && typeof workflow.settings === 'object',
    'Missing live workflow settings');
  const settings = structuredClone(workflow.settings);
  // binaryMode and credentialResolverId are internal/derived response values.
  delete settings.binaryMode;
  delete settings.credentialResolverId;
  // n8n public API cannot preserve MCP exposure through PUT. Fail closed.
  if (settings.availableInMCP === true) {
    throw new Error('Workflow has MCP access enabled; public API update could clear it');
  }
  delete settings.availableInMCP;
  const allowedSettings = new Set([
    'executionOrder', 'timezone', 'saveExecutionProgress',
    'saveManualExecutions', 'saveDataErrorExecution',
    'saveDataSuccessExecution', 'executionTimeout',
    'errorWorkflow', 'callerPolicy', 'callerIds', 'timeSavedPerExecution',
    'redactionPolicy', 'customTelemetryTags',
  ]);
  for (const key of Object.keys(settings)) {
    assert.ok(allowedSettings.has(key), 'Unsupported live setting: ' + key);
    if (settings[key] === null) delete settings[key];
  }
  const body = {
    name: workflow.name,
    nodes: workflow.nodes,
    connections: workflow.connections,
    settings,
  };
  if (workflow.staticData != null) body.staticData = workflow.staticData;
  if (workflow.description != null) {
    assert.equal(typeof workflow.description, 'string', 'Unexpected description type');
    body.description = workflow.description;
  }
  if (workflow.nodeGroups != null) {
    assert.ok(Array.isArray(workflow.nodeGroups), 'Unexpected nodeGroups type');
    for (const group of workflow.nodeGroups) {
      assert.ok(group && typeof group === 'object' && !Array.isArray(group),
        'Unexpected node group');
      for (const property of Object.keys(group)) {
        assert.ok(['id', 'name', 'description', 'nodeIds'].includes(property),
          'Unsupported node group field: ' + property);
      }
      assert.equal(typeof group.id, 'string', 'Invalid node group ID');
      assert.equal(typeof group.name, 'string', 'Invalid node group name');
      assert.ok(Array.isArray(group.nodeIds) && group.nodeIds.every(id => typeof id === 'string'),
        'Invalid node group nodeIds');
    }
    if (workflow.nodeGroups.length) body.nodeGroups = workflow.nodeGroups;
  }
  assert.ok(!workflow.pinData || Object.keys(workflow.pinData).length === 0,
    'Pinned live data detected; refusing public API PUT');
  return body;
}

async function sync() {
  const args = process.argv.slice(2);
  assert.ok(args.every(x => x === '--apply') && args.length <= 1,
    'Only optional --apply is allowed');
  const apply = args.includes('--apply');
  const key = process.env.N8N_API_KEY;
  assert.ok(key, 'N8N_API_KEY must come from an authorized secure runner environment');
  const origin = new URL(process.env.N8N_BASE_URL || 'https://n8n.orvekio.com');
  assert.equal(origin.protocol, 'https:', 'HTTPS required');
  assert.equal(origin.hostname, 'n8n.orvekio.com', 'Wrong n8n host');
  assert.equal(origin.pathname.replace(/\/$/, ''), '', 'Wrong n8n root path');
  assert.ok(!origin.username && !origin.password && !origin.search && !origin.hash,
    'n8n URL must not contain secrets or extra components');
  const api = origin.origin + '/api/v1';
  async function request(path, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(api + path, {
        ...options, redirect: 'error', signal: controller.signal,
        headers: { 'X-N8N-API-KEY': key, Accept: 'application/json', ...(options.headers || {}) },
      });
      if (!res.ok) {
        // Never print response bodies: API errors can echo configuration values.
        // Extract only a strictly validated schema-error classification.
        let safeDiagnostic = '';
        if (res.status === 400) {
          try {
            const data = await res.json();
            const msg = String(data?.message || '');
            const allowed = /^request[/]body(?:[/][A-Za-z][A-Za-z0-9_-]*){0,4} (?:must NOT have additional properties|must be (?:string|object|array|boolean|number)|is read-only)$/.test(msg);
            if (allowed) safeDiagnostic = ' (' + msg + ')';
          } catch { /* Omit malformed or unsafe error details. */ }
        }
        throw new Error('n8n API HTTP ' + res.status + safeDiagnostic + ' on ' +
          path.split('?')[0] + '; no further PUT attempted');
      }
      return res.json();
    } finally { clearTimeout(timeout); }
  }
  const ids = new Map();
  let cursor;
  do {
    const q = new URLSearchParams({limit:'100'});
    if (cursor) q.set('cursor', cursor);
    const page = await request('/workflows?' + q);
    assert.ok(Array.isArray(page.data), 'n8n list unavailable');
    for (const workflow of page.data) if (names.includes(workflow.name)) {
      const found = ids.get(workflow.name) || [];
      found.push(String(workflow.id));
      ids.set(workflow.name, found);
    }
    cursor = page.nextCursor || null;
  } while (cursor);
  for (const name of names) assert.equal(ids.get(name)?.length, 1, 'Missing/duplicate workflow: ' + name);

  const tasks = [];
  for (let index = 0; index < names.length; index++) {
    const name = names[index];
    const id = ids.get(name)[0];
    assert.match(id, /^[A-Za-z0-9_-]+$/, 'Unexpected workflow ID');
    const live = await request('/workflows/' + encodeURIComponent(id));
    const reviewed = JSON.parse(readFileSync(new URL('../automation/n8n/' + filenames[index], import.meta.url)));
    const plan = planWorkflow(live, reviewed, index);
    // Validate every update body before any backup or PUT, not halfway through the batch.
    if (plan.changes.length) asPayload(plan.update);
    console.log(name + ': ' + (plan.changes.length ? plan.changes.join(', ') : 'already up to date'));
    tasks.push({ name, id, index, live, reviewed, plan });
  }
  if (!apply) {
    console.log('READ-ONLY dry-run complete: no workflow altered, activated, or executed.');
    return;
  }
  for (const task of tasks) {
    if (task.plan.changes.length === 0) continue;
    const latest = await request('/workflows/' + encodeURIComponent(task.id));
    assert.equal(latest.versionId, task.live.versionId, 'Version changed before PUT: ' + task.name);
    assert.equal(typeof latest.versionId, 'string', 'Workflow version missing: ' + task.name);
    for (const field of ['nodes','connections','settings','staticData','name','description','nodeGroups',
      'pinData','active','activeVersion','tags','shared','parentFolderId','projectId']) {
      assert.deepEqual(latest[field], task.live[field],
        'Concurrent n8n change to ' + field + ': ' + task.name);
    }
    const expected = planWorkflow(latest, task.reviewed, task.index);
    assert.deepEqual(expected.changes, task.plan.changes, 'Plan changed before PUT');
    const dir = join(homedir(), '.local', 'share', 'cuisine-n8n-backups');
    mkdirSync(dir, {recursive:true, mode:0o700});
    const path = join(dir, 'cuisine-' + task.id + '-' +
      new Date().toISOString().replace(/[:.]/g, '-') + '.json');
    writeFileSync(path, JSON.stringify(latest, null, 2) + '\n',
      {encoding:'utf8',mode:0o600,flag:'wx'});
    const payload = asPayload(expected.update);
    console.log(task.name + ': private 0600 backup completed');
    await request('/workflows/' + encodeURIComponent(task.id), {
      method:'PUT', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload),
    });
    const after = await request('/workflows/' + encodeURIComponent(task.id));
    assert.equal(after.active, false, 'ALERT: workflow unexpectedly active');
    assert.ok(!after.activeVersion, 'ALERT: workflow unexpectedly published');
    assert.deepEqual(after.nodes, expected.update.nodes, 'Post-write node drift');
    assert.deepEqual(after.connections, expected.update.connections, 'Post-write edge drift');
    for (const field of ['name','settings','staticData','description','nodeGroups','pinData',
      'tags','shared','parentFolderId','projectId']) {
      assert.deepEqual(after[field], latest[field], 'Unexpected post-write change to ' + field);
    }
    console.log(task.name + ': SAVED and independently verified; inactive');
  }
  for (const task of tasks) {
    const after = await request('/workflows/' + encodeURIComponent(task.id));
    assert.equal(after.active, false, 'Workflow became active: ' + task.name);
    assert.ok(!after.activeVersion, 'Workflow became published: ' + task.name);
  }
  console.log('Done. No Meta API calls, workflow execution, email, activation or publication.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  sync().catch(error => {
    console.error('STOP: ' + error.message);
    process.exitCode = 1;
  });
}
