import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildFinalReport, evaluateMeta, evaluateResend,
  extractLiveIntegrationConfig } from '../scripts/verify-cuisine-integrations-readonly.mjs';

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

test('Resend evaluation reports unverified DNS records without mutation', () => {
  const config = extractLiveIntegrationConfig(liveWorkflows());
  const result = evaluateResend(config, { ok: true, data: { data: [
    { id: 'domain-id', name: config.senderDomain, status: 'pending' },
  ] } }, { ok: true, data: { status: 'pending', records: [
    { type: 'TXT', name: 'resend._domainkey', value: 'public-dns-value', status: 'pending' },
  ] } });
  assert.equal(result.status, 'FAIL');
  assert.deepEqual(result.domain.dnsRecords[0], { type: 'TXT', name: 'resend._domainkey',
    value: 'public-dns-value', status: 'pending', priority: null, ttl: null });
});

test('Meta evaluation verifies the Page link and required permissions but blocks token durability', () => {
  const config = extractLiveIntegrationConfig(liveWorkflows());
  const permissions = [...new Set(['pages_show_list', 'pages_read_engagement', 'pages_manage_posts',
    'instagram_basic', 'instagram_content_publish'])].map(permission => ({ permission, status: 'granted' }));
  const result = evaluateMeta(config, { ok: true, data: { id: config.facebookPageId,
    instagram_business_account: { id: config.instagramUserId } } }, { ok: true, data: { data: permissions } });
  assert.equal(result.status, 'BLOCKED');
  assert.equal(result.facebookPage.status, 'PASS');
  assert.equal(result.facebookPermissions.status, 'PASS');
  assert.equal(result.instagramAccount.status, 'PASS');
  assert.equal(result.instagramPermissions.status, 'PASS');
  assert.equal(result.token.status, 'BLOCKED');
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
test('final report uses only the required status vocabulary and blocks unproven token durability', () => {
  const result = { status: 'BLOCKED', resend: { status: 'PASS',
    domain: { status: 'PASS', proof: 'verified' }, recipient: { status: 'PASS', proof: 'configured' } },
    meta: { status: 'BLOCKED', token: { status: 'BLOCKED', proof: 'duration unknown' },
      facebookPermissions: { status: 'PASS', proof: 'granted', missing: [] },
      instagramAccount: { status: 'PASS', proof: 'linked' },
      instagramPermissions: { status: 'PASS', proof: 'granted', missing: [] } } };
  const report = buildFinalReport(result, { status: 'PASS OFFLINE', proof: 'simulated' });
  assert.equal(report.verdict, 'BLOQUÉ');
  assert.equal(report.components.length, 13);
  assert.ok(report.components.every(item => ['PASS', 'PASS OFFLINE', 'BLOCKED', 'FAIL'].includes(item.status)));
});