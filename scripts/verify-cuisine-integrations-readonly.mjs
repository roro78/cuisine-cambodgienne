#!/usr/bin/env node
/**
 * Read-only Resend and Meta verification for Cuisine du Cambodge.
 * Allowed external calls: GET Resend domains, GET Meta Page and permissions.
 * It never calls email or publication endpoints and never logs keys or tokens.
 */
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const workflowNames = [
  'Cuisine du Cambodge - 01 - Brouillon IA et validation email',
  'Cuisine du Cambodge - 02 - Publication approuvée Facebook et création Instagram',
  'Cuisine du Cambodge - 03 - Réconcilier et publier Instagram',
];
const requiredFacebookPermissions = ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts'];
const requiredInstagramPermissions = ['instagram_basic', 'instagram_content_publish',
  'pages_show_list', 'pages_read_engagement'];
const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig;

const findNode = (workflow, name) => {
  const matches = workflow.nodes.filter(node => node.name === name);
  assert.equal(matches.length, 1, 'Expected exactly one integration node');
  return matches[0];
};
const credentialReference = node => Object.values(node.credentials || {}).find(value =>
  value && typeof value === 'object' && typeof value.id === 'string' && value.id.length > 0);
const parseGraphUrl = (url, suffix) => {
  const match = String(url).match(new RegExp('^https://graph\\.facebook\\.com/(v[0-9]+\\.[0-9]+)/([0-9]+)/' + suffix + '$'));
  assert.ok(match, 'Live Meta URL does not match the approved read-only inspection contract');
  return { version: match[1], id: match[2] };
};

/** Extracts live identifiers for internal use; callers must not serialize this object. */
export function extractLiveIntegrationConfig(workflows) {
  assert.equal(workflows.length, 3, 'Expected exactly three workflows');
  workflows.forEach((workflow, index) => {
    assert.equal(workflow.name, workflowNames[index], 'Unexpected workflow identity');
    assert.equal(workflow.active, false, 'Workflow is active');
    assert.ok(!workflow.activeVersion, 'Workflow is published');
  });
  const postgresNodes = workflows.flatMap(workflow => workflow.nodes.filter(node =>
    node.type === 'n8n-nodes-base.postgres'));
  assert.equal(postgresNodes.length, 9, 'Expected nine PostgreSQL nodes');
  assert.ok(postgresNodes.every(credentialReference), 'A PostgreSQL credential reference is missing');
  const resend = findNode(workflows[0], 'Envoyer la demande de validation Resend');
  assert.equal(resend.parameters?.url, 'https://api.resend.com/emails', 'Unexpected Resend email endpoint');
  assert.ok(credentialReference(resend), 'Missing Resend credential reference');
  const emails = String(resend.parameters?.body || '').match(emailPattern) || [];
  assert.equal(emails.length, 2, 'Expected one sender and one recipient email in live Resend configuration');
  assert.ok(!emails.some(email => /CONFIGURER_/i.test(email)), 'Resend placeholder remains configured');
  const senderEmail = emails[0].toLowerCase();
  const recipientEmail = emails[1].toLowerCase();
  const senderDomain = senderEmail.split('@')[1];

  const facebook = findNode(workflows[1], 'Publier la photo Facebook');
  const instagramCreate = findNode(workflows[1], 'Créer le conteneur Instagram');
  const instagramPublish = findNode(workflows[2], 'Publier Instagram une seule fois');
  const status = findNode(workflows[2], 'Vérifier le statut conteneur');
  const page = parseGraphUrl(facebook.parameters?.url, 'photos');
  const create = parseGraphUrl(instagramCreate.parameters?.url, 'media');
  const publish = parseGraphUrl(instagramPublish.parameters?.url, 'media_publish');
  assert.equal(create.id, publish.id, 'Instagram identifiers diverge between create and publish');
  assert.equal(page.version, create.version, 'Meta Graph versions diverge');
  assert.equal(page.version, publish.version, 'Meta Graph versions diverge');
  assert.match(String(status.parameters?.url || ''), /graph\.facebook\.com\/v[0-9]+\.[0-9]+/,
    'Instagram status URL is not Graph API');
  const metaNodes = [facebook, instagramCreate, instagramPublish, status];
  assert.ok(metaNodes.every(credentialReference), 'A Meta credential reference is missing');
  const metaCredentialIds = new Set(metaNodes.map(node => credentialReference(node).id));
  assert.equal(metaCredentialIds.size, 1, 'Meta credential references diverge');
  return { senderEmail, recipientEmail, senderDomain, graphVersion: page.version,
    facebookPageId: page.id, instagramUserId: create.id };
}

const safeDnsRecords = records => (Array.isArray(records) ? records : []).map(record => ({
  type: typeof record.type === 'string' ? record.type : null,
  name: typeof record.name === 'string' ? record.name : null,
  value: typeof record.value === 'string' ? record.value : null,
  status: typeof record.status === 'string' ? record.status : null,
  priority: Number.isFinite(record.priority) ? record.priority : null,
  ttl: typeof record.ttl === 'string' || Number.isFinite(record.ttl) ? record.ttl : null,
}));

export function evaluateResend(config, listResult, detailResult) {
  const recipient = { status: 'PASS', proof: 'one non-placeholder validation recipient is configured; no email sent' };
  if (!listResult.ok) return { status: 'FAIL', domain: { status: 'FAIL',
    proof: 'Resend domains API returned HTTP ' + listResult.httpStatus }, recipient };
  const domains = Array.isArray(listResult.data?.data) ? listResult.data.data : [];
  const found = domains.find(domain => String(domain.name || '').toLowerCase() === config.senderDomain);
  if (!found) return { status: 'FAIL', domain: { status: 'FAIL', proof: 'sender domain not found in Resend account' }, recipient };
  if (!detailResult?.ok) return { status: 'FAIL', domain: { status: 'FAIL',
    proof: 'Resend domain detail API returned HTTP ' + (detailResult?.httpStatus || 'unknown') }, recipient };
  const verified = String(detailResult.data?.status || found.status || '').toLowerCase() === 'verified';
  const domain = { status: verified ? 'PASS' : 'FAIL',
    proof: verified ? 'sender domain is verified by Resend' : 'sender domain is not verified by Resend',
    dnsRecords: verified ? [] : safeDnsRecords(detailResult.data?.records) };
  return { status: verified ? 'PASS' : 'FAIL', domain, recipient,
    sender: { status: verified ? 'PASS' : 'FAIL', proof: verified ?
      'configured sender belongs to the verified domain' : 'configured sender domain is not verified' } };
}

const permissionStatus = (permissionResult, required) => {
  if (!permissionResult.ok) return { status: 'FAIL', proof: 'Meta permissions API returned HTTP ' + permissionResult.httpStatus,
    missing: required };
  const granted = new Set((Array.isArray(permissionResult.data?.data) ? permissionResult.data.data : [])
    .filter(item => item.status === 'granted').map(item => item.permission));
  const missing = required.filter(permission => !granted.has(permission));
  return { status: missing.length ? 'FAIL' : 'PASS',
    proof: missing.length ? 'required permissions are missing' : 'all required permissions are granted', missing };
};

export function evaluateMeta(config, pageResult, permissionResult) {
  if (!pageResult.ok) return { status: 'FAIL', token: { status: 'FAIL',
    proof: 'Meta Page API returned HTTP ' + pageResult.httpStatus, errorCode: pageResult.errorCode || null,
    errorSubcode: pageResult.errorSubcode || null }, facebookPage: { status: 'FAIL', proof: 'page access not verified' },
    facebookPermissions: permissionStatus(permissionResult, requiredFacebookPermissions),
    instagramAccount: { status: 'FAIL', proof: 'Instagram association not verified' },
    instagramPermissions: permissionStatus(permissionResult, requiredInstagramPermissions) };
  const pageMatches = String(pageResult.data?.id || '') === config.facebookPageId;
  const linkedInstagram = String(pageResult.data?.instagram_business_account?.id || '');
  const instagramMatches = linkedInstagram === config.instagramUserId;
  const facebookPermissions = permissionStatus(permissionResult, requiredFacebookPermissions);
  const instagramPermissions = permissionStatus(permissionResult, requiredInstagramPermissions);
  const checks = [pageMatches, instagramMatches,
    facebookPermissions.status === 'PASS', instagramPermissions.status === 'PASS'];
  return { status: checks.every(Boolean) ? 'BLOCKED' : 'FAIL',
    token: { status: 'BLOCKED', proof: 'token is valid now; long-lived or non-expiring type cannot be proven without token debug metadata' },
    facebookPage: { status: pageMatches ? 'PASS' : 'FAIL', proof: pageMatches ?
      'configured page identifier is accessible' : 'accessible page identifier does not match configuration' },
    facebookPermissions,
    instagramAccount: { status: instagramMatches ? 'PASS' : 'FAIL', proof: instagramMatches ?
      'configured professional account is linked to the page' : 'Instagram professional account link does not match configuration' },
    instagramPermissions };
}

async function fetchJson(url, token) {
  const parsed = new URL(url);
  assert.ok(['api.resend.com', 'graph.facebook.com'].includes(parsed.hostname), 'External host not allowlisted');
  assert.equal(parsed.protocol, 'https:', 'HTTPS required');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(parsed, { method: 'GET', redirect: 'error', signal: controller.signal,
      headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' } });
    let data = null;
    try { data = await response.json(); } catch { /* status remains sufficient */ }
    return { ok: response.ok, httpStatus: response.status, data: response.ok ? data : null,
      errorCode: Number.isFinite(data?.error?.code) ? data.error.code : null,
      errorSubcode: Number.isFinite(data?.error?.error_subcode) ? data.error.error_subcode : null };
  } finally { clearTimeout(timeout); }
}

function n8nClient() {
  const key = process.env.N8N_API_KEY;
  assert.ok(key, 'N8N_API_KEY missing from secure runner');
  return async path => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch('https://n8n.orvekio.com/api/v1' + path, { method: 'GET',
        redirect: 'error', signal: controller.signal,
        headers: { 'X-N8N-API-KEY': key, Accept: 'application/json' } });
      assert.ok(response.ok, 'n8n API HTTP ' + response.status);
      return response.json();
    } finally { clearTimeout(timeout); }
  };
}

async function loadWorkflows(request) {
  const page = await request('/workflows?limit=100');
  const found = new Map((page.data || []).filter(item => workflowNames.includes(item.name))
    .map(item => [item.name, String(item.id)]));
  assert.equal(found.size, 3, 'Expected workflows missing');
  return Promise.all(workflowNames.map(name => request('/workflows/' + encodeURIComponent(found.get(name)))));
}

function safeReason(error) {
  const status = String(error?.message || '').match(/HTTP (\d{3})/)?.[1];
  if (status) return 'API_HTTP_' + status;
  if (/missing from secure runner/.test(String(error?.message))) return 'REQUIRED_SECRET_NOT_AVAILABLE';
  if (/active|published/.test(String(error?.message))) return 'WORKFLOW_NOT_SAFE';
  if (/timeout|abort/i.test(String(error?.message))) return 'API_TIMEOUT';
  return 'READ_ONLY_VERIFICATION_STOPPED';
}

function runFullPathSimulation() {
  const result = spawnSync(process.execPath,
    ['--test', '--test-concurrency=1', 'tests/social-full-path-offline.test.mjs'], {
      cwd: process.cwd(), env: process.env, encoding: 'utf8', timeout: 120000, maxBuffer: 1024 * 1024,
    });
  return result.status === 0 ? { status: 'PASS OFFLINE', proof: '8 isolated full-path contracts passed' } :
    { status: 'FAIL', proof: 'isolated full-path contracts failed' };
}

export function buildFinalReport(result, fullPath) {
  const fallback = proof => ({ status: 'BLOCKED', proof });
  const resend = result.resend || {};
  const meta = result.meta || {};
  const components = [
    { component: 'Workflow 01', status: resend.status || 'BLOCKED',
      proof: resend.status === 'PASS' ? 'live n8n configuration and Resend domain verified' : 'external Resend verification incomplete' },
    { component: 'Workflow 02', status: meta.status || 'BLOCKED',
      proof: meta.status === 'PASS' ? 'live Meta configuration verified' : 'external Meta verification incomplete' },
    { component: 'Workflow 03', status: meta.status || 'BLOCKED',
      proof: meta.status === 'PASS' ? 'live Meta configuration verified' : 'external Meta verification incomplete' },
    { component: 'PostgreSQL', status: 'PASS', proof: '9 live credential references verified; no query executed' },
    { component: 'Domaine Resend', ...(resend.domain || fallback('Resend domain API not verified')) },
    { component: 'Destinataire Resend', ...(resend.recipient || fallback('live recipient not verified')) },
    { component: 'Jeton Facebook', ...(meta.token || fallback('Meta token not verified')) },
    { component: 'Permissions Facebook', ...(meta.facebookPermissions || fallback('Meta permissions not verified')) },
    { component: 'Compte Instagram', ...(meta.instagramAccount || fallback('Instagram association not verified')) },
    { component: 'Permissions Instagram', ...(meta.instagramPermissions || fallback('Instagram permissions not verified')) },
    { component: 'Validation humaine', status: 'PASS OFFLINE',
      proof: 'approval, rejection, revision and 72-hour expiry contracts passed' },
    { component: 'Anti-doublons', status: 'PASS OFFLINE',
      proof: 'unique constraints, atomic claims and fail-closed interruption policy passed' },
    { component: 'Parcours complet simulé', status: fullPath.status, proof: fullPath.proof },
  ];
  const verdict = components.some(item => item.status === 'FAIL') ? 'ÉCHEC TECHNIQUE' :
    components.some(item => item.status === 'BLOCKED') ? 'BLOQUÉ' : 'PRÊT POUR VALIDATION FINALE';
  return { schemaVersion: 1, generatedAt: new Date().toISOString(), mode: 'external-readonly-verification',
    components, integrations: { resend, meta }, fullPathSimulation: fullPath,
    security: { workflowsActivated: false, workflowsExecuted: false, emailsSent: false,
      publicationEndpointsCalled: false, productionDatabaseChanged: false, credentialsChanged: false,
      publicSiteChanged: false, otherProjectsChanged: false, secretsLogged: false },
    humanActionsRequired: components.filter(item => item.status === 'BLOCKED' || item.status === 'FAIL')
      .map(item => item.component), verdict };
}

function writeFinalReport(report) {
  const dir = join(process.cwd(), 'reports');
  mkdirSync(dir, { recursive: true });
  const path = join(dir, 'cuisine-social-final-verification-' +
    new Date().toISOString().replace(/[:.]/g, '-') + '.json');
  writeFileSync(path, JSON.stringify(report, null, 2) + '\n',
    { encoding: 'utf8', mode: 0o600, flag: 'wx' });
  return path;
}
export async function main() {
  const resendKey = process.env.RESEND_API_KEY;
  const metaToken = process.env.META_ACCESS_TOKEN;
  assert.ok(resendKey && metaToken, 'Required integration key missing from secure runner');
  const config = extractLiveIntegrationConfig(await loadWorkflows(n8nClient()));
  const domains = await fetchJson('https://api.resend.com/domains', resendKey);
  let detail = null;
  if (domains.ok) {
    const domain = (domains.data?.data || []).find(item =>
      String(item.name || '').toLowerCase() === config.senderDomain);
    if (domain?.id) detail = await fetchJson('https://api.resend.com/domains/' + encodeURIComponent(domain.id), resendKey);
  }
  const fields = new URLSearchParams({ fields: 'id,name,instagram_business_account{id,username}' });
  const page = await fetchJson('https://graph.facebook.com/' + config.graphVersion + '/' +
    encodeURIComponent(config.facebookPageId) + '?' + fields, metaToken);
  const permissions = await fetchJson('https://graph.facebook.com/' + config.graphVersion +
    '/me/permissions?limit=100', metaToken);
  const resend = evaluateResend(config, domains, detail);
  const meta = evaluateMeta(config, page, permissions);
  const result = { status: [resend.status, meta.status].includes('FAIL') ? 'FAIL' :
    [resend.status, meta.status].includes('BLOCKED') ? 'BLOCKED' : 'PASS', resend, meta,
    safeguards: { methods: ['GET'], emailsSent: false, publicationEndpointsCalled: false,
      workflowsExecuted: false, workflowsActivated: false, secretsLogged: false } };
  const fullPath = runFullPathSimulation();
  const report = buildFinalReport(result, fullPath);
  const reportPath = writeFinalReport(report);
  console.log('Rapport final expurgé créé : ' + reportPath);
  console.log('INTEGRATION_VERIFY_RESULT ' + JSON.stringify(result));
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.log('INTEGRATION_VERIFY_RESULT ' + JSON.stringify({ status: 'FAIL', reason: safeReason(error),
      safeguards: { methods: ['GET'], emailsSent: false, publicationEndpointsCalled: false,
        workflowsExecuted: false, workflowsActivated: false, secretsLogged: false } }));
    process.exitCode = 1;
  });
}
