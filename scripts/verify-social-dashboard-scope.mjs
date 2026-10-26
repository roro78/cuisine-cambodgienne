#!/usr/bin/env node
/**
 * Enforce the user-approved PR #129 boundary against accidental regressions.
 * Executed inside the targeted GitHub Action with origin/main history present.
 * Entirely offline/read-only; no Git writes, DB, Meta, n8n or Resend access.
 */
import {execFileSync} from 'node:child_process';

const allow=new Set([
  '.github/workflows/social-backoffice-p0-check.yml',
  'automation/n8n/sql/social-approval-readonly-diagnostics.sql',
  'automation/n8n/sql/social-viewer-role-provisioning-REVIEW.sql',
  'docs/SOCIAL_AUTOMATION_PLAN_20261026.md',
  'docs/SOCIAL_PRIVATE_REVIEW_READONLY_20261025.md',
  'public/gestion-social/catalog-readonly.php',
  'public/gestion-social/index.php',
  'public/gestion-social/diagnostic-cli.php',
  'public/gestion-social/n8n-wait-readonly.php',
  'scripts/verify-social-dashboard-scope.mjs',
  'tests/php/social-catalog-readonly-smoke.php',
  'tests/php/social-n8n-wait-readonly-smoke.php',
  'tests/social-private-dashboard-contract.test.mjs',
  'tests/social-private-dashboard-history.test.mjs',
  'tests/social-private-dashboard-http-smoke.test.mjs',
  'tests/social-one-shot-decision-flow.test.mjs',
  'tests/social-viewer-ovh-cli-smoke.test.mjs'
]);
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:1024*1024});
try {
  git('rev-parse','--verify','origin/main^{commit}');
  const modified=git('diff','--name-only','--diff-filter=ACDMRT','origin/main...HEAD','--')
    .split('\n').map(x=>x.trim()).filter(Boolean);
  if(!modified.length)throw Error('Empty/unknown PR diff: cannot certify scope');
  const disallowed=modified.filter(path=>!allow.has(path));
  if(disallowed.length)throw Error('OUT-OF-SCOPE PR files: '+disallowed.join(', '));
  // Redundant, explicit no-touch guard for the functioning social engine.
  const untouchable=[
    'automation/n8n/01-drafts-email-approval.json',
    'automation/n8n/02-publish-approved.json',
    'automation/n8n/03-reconcile-instagram.json',
    'automation/n8n/schema.sql',
    'src/data/socialCatalog.ts',
    'src/pages/social-feed.json.ts'
  ];
  for(const path of untouchable){
    const delta=git('diff','--name-only','origin/main...HEAD','--',path).trim();
    if(delta)throw Error('Protected social source/workflow changed: '+path);
  }
  console.log('SOCIAL_DASHBOARD_SCOPE_GUARD_PASS ('+modified.length+' permitted files; no workflow/feed changes)');
}catch(error){
  console.error('SOCIAL_DASHBOARD_SCOPE_GUARD_FAIL: '+error.message);
  process.exitCode=1;
}
