import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildFinalReport, buildOfflineResult, evaluateMeta, evaluateResend,
  extractLiveIntegrationConfig, loadOfflineN8nEvidence,
  verifyAvailableIntegrations } from '../scripts/verify-cuisine-integrations-readonly.mjs';

const files = ['01-drafts-email-approval.json', '02-publish-approved.json', '03-reconcile-instagram.json'];
const load = filename => JSON.parse(readFileSync(new URL('../automation/n8n/' + filename, import.meta.url), 'utf8'));

function liveWorkflows() {
  const workflows = files.map(load);
  for (const workflow of workflows) for (const node of workflow.nodes) {
    if (node.type === 'n8n-nodes-base.postgres') {
      node.credentials = { postgres: { id: 'dedicated-postgres', name: 'Cuisine du Cambodge PostgreSQL' } };
    }
    if (node.type === 'n8n-nodes-base.httpRequest' &&
      /resend\.com|graph\.facebook\.com/.test(String(node.parameters?.url || ''))) {
      node.credentials = { httpHeaderAuth: { id: 'dedicated-api', name: 'Dedicated API' } };
    }
  }
  const resend = workflows[0].nodes.find(node => node.name === 'Envoyer la demande de validation Resend');
  resend.parameters.body = resend.parameters.body
    .replace('social@CONFIGURER_DOMAINE_VERIFIE', 'social@cuisine-du-cambodge.com')
    .replace('CONFIGURER_EMAIL_VALIDATION', 'validation@example.com');
  for (const workflow of workflows) for (const node of workflow.nodes) if (typeof node.parameters?.url === 'string') {
    node.parameters.url = node.parameters.url.replace(/CONFIGURER_FACEBOOK_PAGE_ID/g, '123456789')
      .replace(/CONFIGURER_INSTAGRAM_USER_ID/g, '987654321');
  }
  return workflows;
}

test('live configuration extraction requires real emails, matching Meta IDs and one credential', () => {
  const config = extractLiveIntegrationConfig(liveWorkflows());
  assert.equal(config.senderDomain, 'cuisine-du-cambodge.com');
  assert.equal(config.facebookPageId, '123456789');
  assert.equal(config.instagramUserId, '987654321');
  const bad = liveWorkflows();
  bad[2].nodes.find(node => node.name === 'Publier Instagram une seule fois').parameters.url =
    'https://graph.facebook.com/v26.0/111111111/media_publish';
  assert.throws(() => extractLiveIntegrationConfig(bad), /identifiers diverge/);
});

test('Resend evaluation proves a verified domain without sending email', () => {
  const config = extractLiveIntegrationConfig(liveWorkflows());
  const result = evaluateResend(config, { ok: true, data: { data: [
    { id: 'domain-id', name: config.senderDomain, status: 'verified' },
  ] } }, { ok: true, data: { status: 'verified', records: [] } });
  assert.equal(result.status, 'PASS');
  assert.equal(result.domain.status, 'PASS');
  assert.equal(result.recipient.status, 'PASS');
});

test('Resend evaluation reports unverified DNS metadata without serializing record values', () => {
  const config = extractLiveIntegrationConfig(liveWorkflows());
  const result = evaluateResend(config, { ok: true, data: { data: [
    { id: 'domain-id', name: config.senderDomain, status: 'pending' },
  ] } }, { ok: true, data: { status: 'pending', records: [
    { type: 'TXT', name: 'resend._domainkey', value: 'public-dns-value', status: 'pending' },
  ] } });
  assert.equal(result.status, 'FAIL');
  assert.deepEqual(result.domain.dnsRecords[0], { type: 'TXT', name: 'resend._domainkey',
    status: 'pending', priority: null, ttl: null });
  assert.ok(!JSON.stringify(result).includes('public-dns-value'));
});

test('Meta evaluation proves current token validity, Page link and required permissions', () => {
  const config = extractLiveIntegrationConfig(liveWorkflows());
  const permissions = [...new Set(['pages_show_list', 'pages_read_engagement', 'pages_manage_posts',
    'instagram_basic', 'instagram_content_publish'])].map(permission => ({ permission, status: 'granted' }));
  const result = evaluateMeta(config, { ok: true, data: { id: config.facebookPageId,
    instagram_business_account: { id: config.instagramUserId } } }, { ok: true, data: { data: permissions } });
  assert.equal(result.status, 'PASS');
  assert.equal(result.facebookPage.status, 'PASS');
  assert.equal(result.facebookPermissions.status, 'PASS');
  assert.equal(result.instagramAccount.status, 'PASS');
  assert.equal(result.instagramPermissions.status, 'PASS');
  assert.equal(result.token.status, 'PASS');
  assert.equal(result.tokenDurability.status, 'BLOCKED');
  assert.equal(result.serviceHealth.status, 'PASS');
});

test('Meta evaluation identifies missing permissions and mismatched Instagram association', () => {
  const config = extractLiveIntegrationConfig(liveWorkflows());
  const result = evaluateMeta(config, { ok: true, data: { id: config.facebookPageId,
    instagram_business_account: { id: 'different' } } }, { ok: true, data: { data: [
    { permission: 'pages_show_list', status: 'granted' },
  ] } });
  assert.equal(result.status, 'FAIL');
  assert.equal(result.instagramAccount.status, 'FAIL');
  assert.ok(result.facebookPermissions.missing.includes('pages_manage_posts'));
  assert.ok(result.instagramPermissions.missing.includes('instagram_content_publish'));
});
test('offline evidence uses current exports and never claims runtime credential validity', () => {
  const evidence = loadOfflineN8nEvidence();
  assert.equal(evidence.status, 'PASS OFFLINE');
  assert.equal(evidence.evidenceFreshness, 'current checkout');
  assert.equal(evidence.workflows.status, 'PASS OFFLINE');
  assert.equal(evidence.metaCredentialReferences.status, 'BLOCKED');
  const result = buildOfflineResult(evidence);
  assert.equal(result.status, 'BLOCKED');
  assert.equal(result.n8nConfiguration.status, 'PASS OFFLINE');
  assert.equal(result.meta.token.status, 'BLOCKED');
  assert.equal(result.meta.tokenDurability.status, 'BLOCKED');
  assert.equal(result.meta.facebookPermissions.status, 'BLOCKED');
  assert.equal(result.meta.instagramPermissions.status, 'BLOCKED');
  assert.deepEqual(result.safeguards.methods, []);
  assert.equal(result.safeguards.externalIntegrationApisCalled, false);
  assert.equal(result.safeguards.publicationEndpointsCalled, false);
});

test('offline final report separates configuration, access, health and token lifetime', () => {
  const result = buildOfflineResult();
  const report = buildFinalReport(result, { status: 'PASS OFFLINE', proof: 'simulated' });
  assert.equal(report.mode, 'offline');
  assert.equal(report.verdict, 'BLOQUÉ');
  assert.equal(report.components.find(item => item.component === 'Configuration locale n8n').status, 'PASS OFFLINE');
  assert.equal(report.components.find(item => item.component === 'Accès Meta actuel').status, 'BLOCKED');
  assert.equal(report.components.find(item => item.component === 'Durée de validité Meta').status, 'BLOCKED');
  assert.equal(report.technicalEvidence.historicalReportRequired, false);
  assert.equal(report.security.externalIntegrationApisCalled, false);
});

test('missing Resend key blocks only Resend while n8n and Meta continue', async () => {
  const config = extractLiveIntegrationConfig(liveWorkflows());
  const calls = [];
  const result = await verifyAvailableIntegrations({
    mode: 'available-integrations-readonly',
    environment: { N8N_API_KEY: 'available', META_ACCESS_TOKEN: 'available' },
    configLoader: async () => config,
    requestJson: async url => {
      calls.push(url);
      if (url.includes('/me/permissions')) return { ok: true, data: { data: [
        ...new Set(['pages_show_list', 'pages_read_engagement', 'pages_manage_posts',
          'instagram_basic', 'instagram_content_publish']),
      ].map(permission => ({ permission, status: 'granted' })) } };
      return { ok: true, data: { id: config.facebookPageId,
        instagram_business_account: { id: config.instagramUserId } } };
    },
  });
  assert.equal(result.n8nConfiguration.status, 'PASS OFFLINE');
  assert.equal(result.resend.status, 'BLOCKED');
  assert.equal(result.resend.domain.status, 'BLOCKED');
  assert.equal(result.resend.recipient.status, 'PASS OFFLINE');
  assert.equal(result.meta.status, 'PASS');
  assert.equal(result.meta.facebookPage.status, 'PASS');
  assert.equal(result.meta.facebookPermissions.status, 'PASS');
  assert.equal(result.meta.instagramAccount.status, 'PASS');
  assert.equal(result.meta.instagramPermissions.status, 'PASS');
  assert.equal(result.safeguards.resendApiCalled, false);
  assert.equal(result.safeguards.metaApiCalled, true);
  assert.equal(calls.length, 2);
  assert.ok(calls.every(url => url.startsWith('https://graph.facebook.com/')));
});

test('missing Meta token blocks only Meta while n8n and Resend continue', async () => {
  const config = extractLiveIntegrationConfig(liveWorkflows());
  const calls = [];
  const result = await verifyAvailableIntegrations({
    mode: 'available-integrations-readonly',
    environment: { N8N_API_KEY: 'available', RESEND_API_KEY: 'available' },
    configLoader: async () => config,
    requestJson: async url => {
      calls.push(url);
      return url.endsWith('/domains') ?
        { ok: true, data: { data: [{ id: 'domain-id', name: config.senderDomain, status: 'verified' }] } } :
        { ok: true, data: { status: 'verified', records: [] } };
    },
  });
  assert.equal(result.n8nConfiguration.status, 'PASS OFFLINE');
  assert.equal(result.resend.status, 'PASS');
  assert.equal(result.meta.status, 'BLOCKED');
  assert.equal(result.safeguards.resendApiCalled, true);
  assert.equal(result.safeguards.metaApiCalled, false);
  assert.equal(calls.length, 2);
  assert.ok(calls.every(url => url.startsWith('https://api.resend.com/')));
});

test('a Resend failure does not prevent available Meta read-only checks', async () => {
  const config = extractLiveIntegrationConfig(liveWorkflows());
  const calls = [];
  const result = await verifyAvailableIntegrations({
    mode: 'available-integrations-readonly',
    environment: {
      N8N_API_KEY: 'available', RESEND_API_KEY: 'available', META_ACCESS_TOKEN: 'available',
    },
    configLoader: async () => config,
    requestJson: async url => {
      calls.push(url);
      if (url.startsWith('https://api.resend.com/')) throw new Error('request timeout');
      if (url.includes('/me/permissions')) return { ok: true, data: { data: [
        ...new Set(['pages_show_list', 'pages_read_engagement', 'pages_manage_posts',
          'instagram_basic', 'instagram_content_publish']),
      ].map(permission => ({ permission, status: 'granted' })) } };
      return { ok: true, data: { id: config.facebookPageId,
        instagram_business_account: { id: config.instagramUserId } } };
    },
  });
  assert.equal(result.resend.status, 'FAIL');
  assert.equal(result.meta.facebookPage.status, 'PASS');
  assert.equal(result.meta.instagramPermissions.status, 'PASS');
  assert.ok(calls.some(url => url.startsWith('https://api.resend.com/')));
  assert.equal(calls.filter(url => url.startsWith('https://graph.facebook.com/')).length, 2);
});

test('default verification is offline and never calls a provider even when secrets exist', async () => {
  let requestCalled = false;
  const result = await verifyAvailableIntegrations({
    environment: { RESEND_API_KEY: 'available', META_ACCESS_TOKEN: 'available' },
    requestJson: async () => { requestCalled = true; },
  });
  assert.equal(result.verificationMode, 'offline');
  assert.equal(result.n8nConfiguration.status, 'PASS OFFLINE');
  assert.equal(result.resend.status, 'BLOCKED');
  assert.equal(result.meta.status, 'BLOCKED');
  assert.equal(requestCalled, false);
  assert.deepEqual(result.safeguards.methods, []);
  assert.equal(result.safeguards.n8nApiCalled, false);
  assert.equal(result.safeguards.externalIntegrationApisCalled, false);
});

test('final report uses only the required status vocabulary and exposes evidence and action lists', () => {
  const result = { status: 'BLOCKED', resend: { status: 'PASS',
    domain: { status: 'PASS', proof: 'verified' }, recipient: { status: 'PASS', proof: 'configured' } },
    meta: { status: 'BLOCKED', token: { status: 'BLOCKED', proof: 'duration unknown' },
      facebookPermissions: { status: 'PASS', proof: 'granted', missing: [] },
      instagramAccount: { status: 'PASS', proof: 'linked' },
      instagramPermissions: { status: 'PASS', proof: 'granted', missing: [] } } };
  const report = buildFinalReport(result, { status: 'PASS OFFLINE', proof: 'simulated' });
  assert.equal(report.verdict, 'BLOQUÉ');
  assert.equal(report.components.length, 21);
  assert.ok(report.components.every(item => ['PASS', 'PASS OFFLINE', 'BLOCKED', 'FAIL'].includes(item.status)));
  assert.ok(Array.isArray(report.checksPassed));
  assert.ok(Array.isArray(report.checksBlocked));
  assert.ok(Array.isArray(report.checksFailed));
  assert.ok(report.humanActionsRequired.some(item => item.integration === 'Meta'));
});
