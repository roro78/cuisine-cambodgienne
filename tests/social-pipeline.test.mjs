import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const n8n = (f) => JSON.parse(readFileSync(new URL(`../automation/n8n/${f}`, import.meta.url), 'utf8'));
const sql = readFileSync(new URL('../automation/n8n/schema.sql', import.meta.url), 'utf8');
const text = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

for (const f of ['01-drafts-email-approval.json','02-publish-approved.json','03-reconcile-instagram.json']) {
  test(`${f} is a connected inactive workflow with no embedded credentials`, () => {
    const w = n8n(f);
    const names = new Set(w.nodes.map((node) => node.name));
    assert.equal(names.size, w.nodes.length);
    assert.equal(w.active, false);
    assert.equal(w.settings.timezone, 'Europe/Paris');
    for (const node of w.nodes) {
      assert.equal(node.credentials, undefined, `${node.name} has an embedded credential`);
      assert.equal(node.disabled, undefined);
    }
    for (const [src, edges] of Object.entries(w.connections)) {
      assert.ok(names.has(src));
      for (const targets of edges.main) for (const target of targets) assert.ok(names.has(target.node));
    }
  });
}

test('outbound Meta publication cannot precede an approved atomic DB claim', () => {
  const w = n8n('02-publish-approved.json');
  const names = w.nodes.map((n) => n.name);
  assert.ok(names.indexOf('Claim atomique uniquement si validé') < names.indexOf('Publier la photo Facebook'));
  const claim = w.nodes.find((n) => n.name === 'Claim atomique uniquement si validé');
  assert.match(claim.parameters.query, /status='approved'/);
  assert.match(claim.parameters.query, /FOR UPDATE SKIP LOCKED/);
  assert.match(sql, /UNIQUE \(scheduled_date\)/);
  assert.match(sql, /fb_state.*DEFAULT 'pending'/);
  assert.match(sql, /ig_state.*DEFAULT 'pending'/);
});

test('Instagram media_publish only occurs after Meta container status is FINISHED', () => {
  const w=n8n('03-reconcile-instagram.json');
  const query=w.nodes.find((n)=>n.name==='Enregistrer READY ou reporter').parameters.query;
  assert.match(query,/WHEN \$1='FINISHED' THEN 'submitting'/);
  assert.match(query,/ELSE 'manual_review'/);
  assert.ok(w.nodes.some((n)=>n.name==='Ne garder que les conteneurs prêts'));
});

test('source content catalog is data-derived and rejects invented duplicate IDs', () => {
  const s=text('src/data/socialCatalog.ts');
  assert.match(s,/\.\.\.recipes\.map/);
  assert.match(s,/\.\.\.ingredientGuides\.map/);
  assert.match(s,/\.\.\.cultureArticles\.map/);
  assert.match(s,/\.\.\.workshops\.map/);
  assert.match(s,/\.\.\.recipeTechniqueGuides\.map/);
  assert.match(s,/social_catalog_duplicate_ids/);
  assert.match(s,/sha256/);
});

test('approval uses email and an explicit form POST; missing action defaults to rejection', () => {
  const w=n8n('01-drafts-email-approval.json');
  const approval=w.nodes.find(n=>n.name==='Attendre une décision via formulaire');
  assert.equal(approval.parameters.resume,'form');
  assert.equal(approval.parameters.limitWaitTime,true);
  const decision=w.nodes.find(n=>n.name==='Interpréter la décision');
  assert.match(decision.parameters.jsCode,/d==='Approuver'\?'approved'/);
  assert.ok(!w.nodes.some(n=>/graph\.facebook\.com\/.*\/(photos|media_publish)/.test(n.parameters?.url||'')));
});

test('a revision request is non-publishable, auditable, and requires a human note', () => {
  const w=n8n('01-drafts-email-approval.json');
  const fields=w.nodes.find(n=>n.name==='Attendre une décision via formulaire').parameters.formFields.values;
  assert.ok(fields.some(f=>f.fieldOptions?.values?.some(v=>v.option==='Demander une modification')));
  assert.ok(fields.some(f=>f.fieldLabel==='Commentaire'&&f.fieldType==='textarea'));
  const decision=w.nodes.find(n=>n.name==='Interpréter la décision');
  assert.match(decision.parameters.jsCode,/commentaire_requis_pour_modification/);
  assert.match(sql,/revision_requested/);
  assert.match(sql,/human_note TEXT/);
});
