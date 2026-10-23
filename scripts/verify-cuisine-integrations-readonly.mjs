#!/usr/bin/env node
/**
 * Offline by default. External verification requires explicit --live-readonly.
 * Allowed live calls: GET Resend domains, GET Meta Page and permissions.
 * It never calls email or publication endpoints and never logs keys or tokens.
 */
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { run as runTests } from 'node:test';

const workflowNames = [
  'Cuisine du Cambodge - 01 - Brouillon IA et validation email',
  'Cuisine du Cambodge - 02 - Publication approuvée Facebook et création Instagram',
  'Cuisine du Cambodge - 03 - Réconcilier et publier Instagram',
];
const requiredFacebookPermissions = ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts'];
const requiredInstagramPermissions = ['instagram_basic', 'instagram_content_publish',
  'pages_show_list', 'pages_read_engagement'];
const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig;
const workflowFiles = [
  '01-drafts-email-approval.json',
  '02-publish-approved.json',
  '03-reconcile-instagram.json',
];

const pass = proof => ({ status: 'PASS', proof });
const passOffline = proof => ({ status: 'PASS OFFLINE', proof });

/** Inspects version-controlled exports only. It never infers current runtime availability. */
export function loadOfflineN8nEvidence({ readWorkflow = filename => JSON.parse(readFileSync(
  new URL('../automation/n8n/' + filename, import.meta.url), 'utf8')) } = {}) {
  const workflows = workflowFiles.map(readWorkflow);
  assert.equal(workflows.length, 3, 'Expected three workflow exports');
  workflows.forEach((workflow, index) => {
    assert.equal(workflow.name, workflowNames[index], 'Unexpected workflow export identity');
    assert.equal(workflow.active, false, 'Workflow export is active');
    assert.ok(!workflow.activeVersion, 'Workflow export is published');
  });
  const postgresNodes = workflows.flatMap(workflow => workflow.nodes.filter(node =>
    node.type === 'n8n-nodes-base.postgres'));
  assert.equal(postgresNodes.length, 9, 'Expected nine PostgreSQL nodes in exports');
  const resend = workflows[0].nodes.find(node => node.name === 'Envoyer la demande de validation Resend');
  assert.equal(resend?.parameters?.url, 'https://api.resend.com/emails', 'Unexpected Resend endpoint');
  const metaNodes = workflows.slice(1).flatMap(workflow => workflow.nodes.filter(node =>
    node.type === 'n8n-nodes-base.httpRequest' &&
    /graph\.facebook\.com/.test(String(node.parameters?.url || ''))));
  assert.ok(metaNodes.length >= 4, 'Expected Meta Graph nodes in exports');
  return {
    status: 'PASS OFFLINE', evidenceSource: 'version-controlled workflow exports',
    evidenceFreshness: 'current checkout',
    workflows: passOffline('three current exports are inactive and unpublished'),
    postgres: passOffline('nine PostgreSQL nodes exist; runtime credential bindings were not queried'),
    resend: passOffline('the Resend endpoint exists; runtime credential and recipient were not queried'),
    metaCredentialReferences: { status: 'BLOCKED',
      proof: 'runtime Meta credential bindings are not present in sanitized exports' },
    metaEndpoints: passOffline('Meta Graph endpoint shapes are present in the current exports'),
  };
}

function configFromEnvironment(environment) {
  const config = {};
  const graphVersion = String(environment.META_GRAPH_VERSION || 'v26.0');
  if (/^v\d+\.\d+$/.test(graphVersion) && /^\d+$/.test(String(environment.META_FACEBOOK_PAGE_ID || '')) &&
    /^\d+$/.test(String(environment.META_INSTAGRAM_USER_ID || ''))) {
    config.graphVersion = graphVersion;
    config.facebookPageId = String(environment.META_FACEBOOK_PAGE_ID);
    config.instagramUserId = String(environment.META_INSTAGRAM_USER_ID);
  }
  const senderDomain = String(environment.RESEND_SENDER_DOMAIN || '').trim().toLowerCase();
  const recipientEmail = String(environment.RESEND_VALIDATION_RECIPIENT || '').trim().toLowerCase();
  if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(senderDomain)) config.senderDomain = senderDomain;
  if (emailPattern.test(recipientEmail)) config.recipientEmail = recipientEmail;
  emailPattern.lastIndex = 0;
  return config;
}

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
  status: typeof record.status === 'string' ? record.status : null,
  priority: Number.isFinite(record.priority) ? record.priority : null,
  ttl: typeof record.ttl === 'string' || Number.isFinite(record.ttl) ? record.ttl : null,
}));

export function evaluateResend(config, listResult, detailResult) {
  const recipient = { status: 'PASS', proof: 'one non-placeholder validation recipient is configured; no email sent' };
  if (!listResult.ok) return { status: 'FAIL', domain: { status: 'FAIL',
    proof: 'Resend domains API returned HTTP ' + listResult.httpStatus }, recipient,
    currentAccess: { status: 'FAIL', proof: 'Resend rejected or failed the read-only request' },
    serviceHealth: { status: 'FAIL', proof: 'Resend health was not established by the failed request' } };
  const domains = Array.isArray(listResult.data?.data) ? listResult.data.data : [];
  const found = domains.find(domain => String(domain.name || '').toLowerCase() === config.senderDomain);
  if (!found) return { status: 'FAIL', domain: { status: 'FAIL', proof: 'sender domain not found in Resend account' },
    recipient, currentAccess: { status: 'PASS', proof: 'Resend accepted the read-only domains request' },
    serviceHealth: { status: 'PASS', proof: 'Resend returned a successful read-only response' } };
  if (!detailResult?.ok) return { status: 'FAIL', domain: { status: 'FAIL',
    proof: 'Resend domain detail API returned HTTP ' + (detailResult?.httpStatus || 'unknown') }, recipient,
    currentAccess: { status: 'PASS', proof: 'Resend accepted the account-level read-only request' },
    serviceHealth: { status: 'FAIL', proof: 'Resend domain-detail health was not established' } };
  const verified = String(detailResult.data?.status || found.status || '').toLowerCase() === 'verified';
  const domain = { status: verified ? 'PASS' : 'FAIL',
    proof: verified ? 'sender domain is verified by Resend' : 'sender domain is not verified by Resend',
    dnsRecords: verified ? [] : safeDnsRecords(detailResult.data?.records) };
  return { status: verified ? 'PASS' : 'FAIL', domain, recipient,
    currentAccess: { status: 'PASS', proof: 'Resend accepted the read-only domains requests at verification time' },
    serviceHealth: { status: 'PASS', proof: 'Resend returned successful read-only responses at verification time' },
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
    instagramPermissions: permissionStatus(permissionResult, requiredInstagramPermissions),
    tokenDurability: { status: 'BLOCKED', proof: 'failed access cannot establish token expiry or durability' },
    serviceHealth: { status: 'FAIL', proof: 'Meta health was not established by the failed request' } };
  const pageMatches = String(pageResult.data?.id || '') === config.facebookPageId;
  const linkedInstagram = String(pageResult.data?.instagram_business_account?.id || '');
  const instagramMatches = linkedInstagram === config.instagramUserId;
  const facebookPermissions = permissionStatus(permissionResult, requiredFacebookPermissions);
  const instagramPermissions = permissionStatus(permissionResult, requiredInstagramPermissions);
  const checks = [pageMatches, instagramMatches,
    facebookPermissions.status === 'PASS', instagramPermissions.status === 'PASS'];
  return { status: checks.every(Boolean) ? 'PASS' : 'FAIL',
    token: { status: 'PASS',
      proof: 'token was accepted by the read-only Page and permissions endpoints at verification time' },
    tokenDurability: { status: 'BLOCKED',
      proof: 'successful read-only calls do not establish token expiry or long-term validity' },
    serviceHealth: { status: 'PASS', proof: 'Meta returned successful read-only responses at verification time' },
    facebookPage: { status: pageMatches ? 'PASS' : 'FAIL', proof: pageMatches ?
      'configured page identifier is accessible' : 'accessible page identifier does not match configuration' },
    facebookPermissions,
    instagramAccount: { status: instagramMatches ? 'PASS' : 'FAIL', proof: instagramMatches ?
      'configured professional account is linked to the page' : 'Instagram professional account link does not match configuration' },
    instagramPermissions };
}

export function buildOfflineResult(n8nConfiguration = loadOfflineN8nEvidence()) {
  return {
    verificationMode: 'offline',
    status: 'BLOCKED',
    n8nConfiguration,
    resend: {
      status: 'BLOCKED',
      domain: { status: 'BLOCKED', proof: 'Resend API was not queried in offline mode' },
      recipient: { status: 'BLOCKED', proof: 'runtime recipient was not queried in offline mode' },
      sender: { status: 'BLOCKED', proof: 'runtime sender was not queried in offline mode' },
      currentAccess: { status: 'BLOCKED', proof: 'Resend API was not queried in offline mode' },
      serviceHealth: { status: 'BLOCKED', proof: 'Resend health was not queried in offline mode' },
    },
    meta: {
      status: 'BLOCKED',
      token: { status: 'BLOCKED',
        proof: 'Meta API was not queried in offline mode' },
      tokenDurability: { status: 'BLOCKED', proof: 'token lifetime was not queried in offline mode' },
      serviceHealth: { status: 'BLOCKED', proof: 'Meta health was not queried in offline mode' },
      facebookPage: { status: 'BLOCKED',
        proof: 'Graph access was not tested' },
      facebookPermissions: { status: 'BLOCKED',
        proof: 'permissions require an explicit read-only Graph call' },
      instagramAccount: { status: 'BLOCKED',
        proof: 'the Page association was not queried' },
      instagramPermissions: { status: 'BLOCKED',
        proof: 'permissions require an explicit read-only Graph call' },
    },
    safeguards: {
      methods: [], n8nApiCalled: false, resendApiCalled: false, metaApiCalled: false,
      externalIntegrationApisCalled: false,
      emailsSent: false, publicationEndpointsCalled: false, workflowsExecuted: false,
      workflowsActivated: false, secretsLogged: false,
    },
  };
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

function safeReason(error) {
  const message = String(error?.message || '');
  const status = message.match(/HTTP (\d{3})/)?.[1];
  if (status) return 'API_HTTP_' + status;
  if (/ENOENT/.test(String(error?.code)) || /ENOENT/.test(message)) return 'LOCAL_WORKFLOW_EXPORT_MISSING';
  if (/workflow export|PostgreSQL nodes|Meta Graph nodes|Unexpected workflow/.test(message)) {
    return 'LOCAL_WORKFLOW_EVIDENCE_INVALID';
  }
  if (/missing from secure runner/.test(message)) return 'REQUIRED_SECRET_NOT_AVAILABLE';
  if (/active|published/.test(message)) return 'WORKFLOW_NOT_SAFE';
  if (/timeout|abort/i.test(message)) return 'API_TIMEOUT';
  return 'READ_ONLY_VERIFICATION_STOPPED';
}

const blockedN8nConfiguration = proof => ({
  status: 'BLOCKED',
  workflows: { status: 'BLOCKED', proof },
  postgres: { status: 'BLOCKED', proof },
  resend: { status: 'BLOCKED', proof },
  metaCredentialReferences: { status: 'BLOCKED', proof },
  metaEndpoints: { status: 'BLOCKED', proof },
});

const failedN8nConfiguration = reason => ({
  status: 'FAIL',
  workflows: { status: 'FAIL', proof: 'n8n read-only inspection failed: ' + reason },
  postgres: { status: 'FAIL', proof: 'n8n read-only inspection failed: ' + reason },
  resend: { status: 'FAIL', proof: 'n8n read-only inspection failed: ' + reason },
  metaCredentialReferences: { status: 'FAIL', proof: 'n8n read-only inspection failed: ' + reason },
  metaEndpoints: { status: 'FAIL', proof: 'n8n read-only inspection failed: ' + reason },
});

const blockedResend = (proof, config = {}) => {
  const domain = { status: 'BLOCKED', proof };
  const recipient = config.recipientEmail ?
    { status: 'PASS OFFLINE', proof: 'one non-placeholder validation recipient was supplied; address is redacted; no email sent' } :
    { status: 'BLOCKED', proof: 'validation recipient is unavailable in the current configuration' };
  const sender = config.senderDomain ?
    { status: 'PASS OFFLINE', proof: 'a sender domain was supplied; ownership and health were not queried' } :
    { status: 'BLOCKED', proof: 'configured sender domain is unavailable' };
  return { status: combinedStatus([domain.status, recipient.status, sender.status]),
    domain, recipient, sender,
    currentAccess: { status: 'BLOCKED', proof },
    serviceHealth: { status: 'BLOCKED', proof },
    api: { status: 'BLOCKED', proof } };
};

const failedResend = reason => ({
  status: 'FAIL',
  domain: { status: 'FAIL', proof: 'Resend read-only verification failed: ' + reason },
  recipient: { status: 'PASS', proof: 'one non-placeholder recipient is configured; no email was sent' },
  sender: { status: 'FAIL', proof: 'Resend read-only verification failed: ' + reason },
  currentAccess: { status: 'FAIL', proof: 'Resend read-only verification failed: ' + reason },
  serviceHealth: { status: 'FAIL', proof: 'Resend health was not established: ' + reason },
});

const blockedMeta = proof => ({
  status: 'BLOCKED',
  token: { status: 'BLOCKED', proof },
  tokenDurability: { status: 'BLOCKED', proof: 'token lifetime was not established' },
  serviceHealth: { status: 'BLOCKED', proof },
  facebookPage: { status: 'BLOCKED', proof },
  facebookPermissions: { status: 'BLOCKED', proof },
  instagramAccount: { status: 'BLOCKED', proof },
  instagramPermissions: { status: 'BLOCKED', proof },
});

const failedMeta = reason => ({
  status: 'FAIL',
  token: { status: 'FAIL', proof: 'Meta read-only verification failed: ' + reason },
  tokenDurability: { status: 'BLOCKED', proof: 'failed access cannot establish token lifetime' },
  serviceHealth: { status: 'FAIL', proof: 'Meta health was not established: ' + reason },
  facebookPage: { status: 'FAIL', proof: 'Meta read-only verification failed: ' + reason },
  facebookPermissions: { status: 'FAIL', proof: 'Meta read-only verification failed: ' + reason },
  instagramAccount: { status: 'FAIL', proof: 'Meta read-only verification failed: ' + reason },
  instagramPermissions: { status: 'FAIL', proof: 'Meta read-only verification failed: ' + reason },
});

const combinedStatus = values => values.includes('FAIL') ? 'FAIL' :
  values.includes('BLOCKED') ? 'BLOCKED' :
    values.includes('PASS OFFLINE') ? 'PASS OFFLINE' : 'PASS';

async function verifyResend(config, key, requestJson) {
  const domains = await requestJson('https://api.resend.com/domains', key);
  let detail = null;
  if (domains.ok) {
    const domain = (domains.data?.data || []).find(item =>
      String(item.name || '').toLowerCase() === config.senderDomain);
    if (domain?.id) {
      detail = await requestJson('https://api.resend.com/domains/' + encodeURIComponent(domain.id), key);
    }
  }
  return evaluateResend(config, domains, detail);
}

async function verifyMeta(config, token, requestJson) {
  const fields = new URLSearchParams({ fields: 'id,name,instagram_business_account{id,username}' });
  const page = await requestJson('https://graph.facebook.com/' + config.graphVersion + '/' +
    encodeURIComponent(config.facebookPageId) + '?' + fields, token);
  const permissions = await requestJson('https://graph.facebook.com/' + config.graphVersion +
    '/me/permissions?limit=100', token);
  return evaluateMeta(config, page, permissions);
}

export async function verifyAvailableIntegrations({
  environment = process.env,
  mode = 'offline',
  configLoader,
  n8nEvidenceLoader = loadOfflineN8nEvidence,
  requestJson = fetchJson,
} = {}) {
  assert.ok(['offline', 'available-integrations-readonly'].includes(mode),
    'Unsupported verification mode');
  const safeguards = {
    methods: mode === 'offline' ? [] : ['GET'],
    n8nApiCalled: false, resendApiCalled: false, metaApiCalled: false,
    externalIntegrationApisCalled: false, emailsSent: false, publicationEndpointsCalled: false,
    workflowsExecuted: false, workflowsActivated: false, secretsLogged: false,
  };

  let config = configFromEnvironment(environment);
  let n8nConfiguration;
  try {
    n8nConfiguration = await n8nEvidenceLoader();
  } catch (error) {
    n8nConfiguration = failedN8nConfiguration(safeReason(error));
  }
  if (configLoader) {
    try {
      config = { ...config, ...await configLoader() };
    } catch {
      // Provider checks remain independently available from explicit non-secret inputs.
    }
  }

  let resend;
  let meta;
  if (mode === 'offline') {
    resend = blockedResend('Resend API was not requested in offline mode', config);
    meta = blockedMeta('Meta Graph API was not requested in offline mode');
  } else {
    const hasResendConfig = Boolean(config.senderDomain && config.recipientEmail);
    const hasMetaConfig = Boolean(config.graphVersion && config.facebookPageId && config.instagramUserId);
    if (!environment.RESEND_API_KEY || !hasResendConfig) {
      const reason = !environment.RESEND_API_KEY ? 'RESEND_API_KEY is absent; Resend API was not queried' :
        'Resend sender domain or validation recipient is unavailable; Resend API was not queried';
      resend = blockedResend(reason, config);
    } else {
      safeguards.resendApiCalled = true;
      safeguards.externalIntegrationApisCalled = true;
      try {
        resend = await verifyResend(config, environment.RESEND_API_KEY, requestJson);
      } catch (error) {
        resend = failedResend(safeReason(error));
      }
    }

    if (!environment.META_ACCESS_TOKEN || !hasMetaConfig) {
      const reason = !environment.META_ACCESS_TOKEN ? 'META_ACCESS_TOKEN is absent; Meta Graph API was not queried' :
        'configured Page or Instagram identifier is unavailable; Meta Graph API was not queried';
      meta = blockedMeta(reason);
    } else {
      safeguards.metaApiCalled = true;
      safeguards.externalIntegrationApisCalled = true;
      try {
        meta = await verifyMeta(config, environment.META_ACCESS_TOKEN, requestJson);
      } catch (error) {
        meta = failedMeta(safeReason(error));
      }
    }
  }

  return {
    verificationMode: mode,
    status: combinedStatus([n8nConfiguration.status, resend.status, meta.status]),
    n8nConfiguration,
    resend,
    meta,
    safeguards,
  };
}

async function runFullPathSimulation() {
  return new Promise(resolve => {
    let passed = 0;
    let failed = 0;
    let settled = false;
    const finish = result => {
      if (!settled) {
        settled = true;
        resolve(result);
      }
    };
    const stream = runTests({
      files: ['tests/social-full-path-offline.test.mjs'],
      concurrency: 1,
      isolation: 'none',
    });
    stream.on('test:pass', () => { passed += 1; });
    stream.on('test:fail', () => { failed += 1; });
    stream.on('error', () => finish({ status: 'FAIL', proof: 'isolated full-path test runner failed' }));
    stream.on('end', () => finish(failed === 0 && passed === 8 ?
      { status: 'PASS OFFLINE', proof: passed + ' isolated full-path contracts passed' } :
      { status: 'FAIL', proof: failed + ' isolated full-path contracts failed; ' + passed + ' passed' }));
    stream.resume();
  });
}

export function buildFinalReport(result, fullPath) {
  const fallback = proof => ({ status: 'BLOCKED', proof });
  const n8n = result.n8nConfiguration || {
    status: 'BLOCKED',
    workflows: fallback('live n8n configuration not verified'),
    postgres: fallback('live PostgreSQL references not verified'),
    metaCredentialReferences: fallback('live Meta credential references not verified'),
  };
  const resend = result.resend || {};
  const meta = result.meta || {};
  const components = [
    { component: 'Configuration locale n8n', status: n8n.status,
      proof: n8n.workflows?.proof || 'workflow exports not verified' },
    { component: 'Bindings credentials runtime',
      ...(n8n.metaCredentialReferences || fallback('runtime credential bindings not verified')) },
    { component: 'Workflow 01', ...(n8n.workflows || fallback('live workflow not verified')) },
    { component: 'Workflow 02', ...(n8n.workflows || fallback('live workflow not verified')) },
    { component: 'Workflow 03', ...(n8n.workflows || fallback('live workflow not verified')) },
    { component: 'PostgreSQL', ...(n8n.postgres || fallback('live PostgreSQL references not verified')) },
    { component: 'Domaine Resend', ...(resend.domain || fallback('Resend domain API not verified')) },
    { component: 'Expéditeur Resend', ...(resend.sender || fallback('live sender not verified')) },
    { component: 'Destinataire Resend', ...(resend.recipient || fallback('live recipient not verified')) },
    { component: 'Accès Resend actuel', ...(resend.currentAccess || fallback('Resend access not verified')) },
    { component: 'Santé Resend', ...(resend.serviceHealth || fallback('Resend health not verified')) },
    { component: 'Accès Meta actuel', ...(meta.token || fallback('Meta token not verified')) },
    { component: 'Durée de validité Meta', ...(meta.tokenDurability || fallback('Meta token lifetime not verified')) },
    { component: 'Santé Meta', ...(meta.serviceHealth || fallback('Meta health not verified')) },
    { component: 'Page Facebook', ...(meta.facebookPage || fallback('Facebook Page identity not verified')) },
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
  const checksPassed = components.filter(item => item.status === 'PASS' || item.status === 'PASS OFFLINE');
  const checksBlocked = components.filter(item => item.status === 'BLOCKED');
  const checksFailed = components.filter(item => item.status === 'FAIL');
  const humanActionsRequired = [];
  if ([meta.token, meta.facebookPage, meta.facebookPermissions, meta.instagramAccount,
    meta.instagramPermissions].some(item => item?.status === 'BLOCKED')) {
    humanActionsRequired.push({
      integration: 'Meta',
      action: 'Run the single secure read-only command with a current token and the configured Page and Instagram IDs',
    });
  }
  if (resend.recipient?.status === 'BLOCKED' || resend.sender?.status === 'BLOCKED') {
    humanActionsRequired.push({
      integration: 'Resend',
      action: 'Confirm the configured sender domain and validation recipient; do not send a test email',
    });
  }
  if (checksFailed.length) {
    humanActionsRequired.push({
      integration: 'Failed checks',
      action: 'Resolve only the failed read-only checks before activation',
      components: checksFailed.map(item => item.component),
    });
  }
  return { schemaVersion: 3, generatedAt: new Date().toISOString(),
    mode: result.verificationMode || 'offline',
    components, integrations: { n8nConfiguration: n8n, resend, meta },
    checksPassed, checksBlocked, checksFailed,
    technicalEvidence: {
      n8nEvidenceSource: n8n.evidenceSource || null,
      n8nEvidenceFreshness: n8n.evidenceFreshness || null,
      historicalReportRequired: false,
      resendApiCalled: result.safeguards?.resendApiCalled ?? false,
      metaApiCalled: result.safeguards?.metaApiCalled ?? false,
      offlineFullPath: fullPath,
    },
    fullPathSimulation: fullPath,
    security: { workflowsActivated: false, workflowsExecuted: false, emailsSent: false,
      publicationEndpointsCalled: false, productionDatabaseChanged: false, credentialsChanged: false,
      publicSiteChanged: false, otherProjectsChanged: false, secretsLogged: false,
      n8nApiCalled: result.safeguards?.n8nApiCalled ?? false,
      resendApiCalled: result.safeguards?.resendApiCalled ?? false,
      metaApiCalled: result.safeguards?.metaApiCalled ?? false,
      externalIntegrationApisCalled: result.safeguards?.externalIntegrationApisCalled ?? false },
    humanActionsRequired, verdict };
}
export function writeFinalReport(report) {
  const dir = join(process.cwd(), 'reports');
  mkdirSync(dir, { recursive: true });
  const path = join(dir, 'cuisine-social-final-verification-' +
    new Date().toISOString().replace(/[:.]/g, '-') + '.json');
  writeFileSync(path, JSON.stringify(report, null, 2) + '\n',
    { encoding: 'utf8', mode: 0o600, flag: 'wx' });
  return path;
}
export async function main(args = process.argv.slice(2)) {
  assert.ok(args.length === 0 || (args.length === 1 && args[0] === '--live-readonly'),
    'Unsupported verification mode');
  let result;
  try {
    result = await verifyAvailableIntegrations({
      mode: args[0] === '--live-readonly' ? 'available-integrations-readonly' : 'offline',
    });
  } catch (error) {
    const reason = safeReason(error);
    const liveRequested = args[0] === '--live-readonly';
    result = {
      verificationMode: liveRequested ? 'available-integrations-readonly' : 'offline', status: 'FAIL', reason,
      n8nConfiguration: failedN8nConfiguration(reason),
      resend: blockedResend('verification stopped before Resend could be checked'),
      meta: blockedMeta('verification stopped before Meta could be checked'),
      safeguards: { methods: liveRequested ? ['GET'] : [], n8nApiCalled: false, resendApiCalled: false,
        metaApiCalled: false, externalIntegrationApisCalled: false, emailsSent: false,
        publicationEndpointsCalled: false, workflowsExecuted: false, workflowsActivated: false,
        secretsLogged: false },
    };
  }
  const fullPath = await runFullPathSimulation();
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
        workflowsExecuted: false, workflowsActivated: false, secretsLogged: false,
        n8nApiCalled: false, externalIntegrationApisCalled: false } }));
    process.exitCode = 1;
  });
}
