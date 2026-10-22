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
  assert.match(claim.parameters.query, /human_decision='approved'/);
  assert.match(claim.parameters.query, /approved_at IS NOT NULL/);
  assert.match(claim.parameters.query, /decided_at IS NOT NULL/);
  assert.match(claim.parameters.query, /FOR UPDATE SKIP LOCKED/);
  assert.match(sql, /UNIQUE \(scheduled_date\)/);
  assert.match(sql, /fb_state.*DEFAULT 'pending'/);
  assert.match(sql, /ig_state.*DEFAULT 'pending'/);
});

test('Instagram media_publish only occurs after Meta container status is FINISHED', () => {
  const w=n8n('03-reconcile-instagram.json');
  const reservation=w.nodes.find((n)=>n.name==='Réserver un conteneur à examiner').parameters.query;
  assert.match(reservation,/human_decision='approved'/);
  assert.match(reservation,/approved_at IS NOT NULL/);
  assert.match(reservation,/decided_at IS NOT NULL/);
  assert.match(reservation,/fb_state='published'/);
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
  assert.match(s,/completeCookingWorkshopCutoverReady/, 'V2 workshop cutover must remain guarded');
  assert.match(s,/releasedCookingWorkshopGuides\.map/, 'Released guides must be supported');
  assert.match(s,/workshops\.map/, 'Historical six-workshop fallback must remain');
  assert.match(s,/\.\.\.recipeTechniqueGuides\.map/);
  assert.match(s,/social_catalog_duplicate_ids/);
  assert.match(s,/sha256/);
});

test('restored historical recipes enter social catalog without auto-publishable images', () => {
  const s=text('src/data/socialCatalog.ts');
  assert.match(s,/import \{ restoredRecipes \} from '\.\/restoredRecipes'/);
  assert.match(s,/\.\.\.restoredRecipes\.map/);
  assert.match(s,/undefined, 'none', recipe\.sources\.map/);
  assert.match(s,/releasedCookingWorkshopGuides/,'Current workshop social entries must survive the port');
});

test('Resend email never runs when PostgreSQL draft insertion returns no id', () => {
  const w=n8n('01-drafts-email-approval.json');
  const insert=w.nodes.find(n=>n.name==='Enregistrer le brouillon');
  const gate=w.nodes.find(n=>n.name==='Brouillon inséré ?');
  assert.ok(insert, 'Postgres insert must exist');
  assert.ok(gate, 'Explicit insert guard must exist');
  assert.match(insert.parameters.query,/ON CONFLICT \(scheduled_date\) DO NOTHING RETURNING id/);
  assert.equal(gate.type,'n8n-nodes-base.if');
  assert.equal(gate.parameters.conditions.conditions.length,1);
  const condition=gate.parameters.conditions.conditions[0];
  assert.equal(condition.leftValue,'={{ $json.id !== undefined && $json.id !== null && /^[1-9][0-9]*$/.test(String($json.id)) }}');
  assert.equal(condition.operator.type,'boolean');
  assert.equal(condition.operator.operation,'true');
  // PostgreSQL BIGINT can be supplied as a decimal string, not only a JS number.
  const validInsertId = (id) => id !== undefined && id !== null && /^[1-9][0-9]*$/.test(String(id));
  for (const id of [1,'1',42,'9007199254740993']) assert.equal(validInsertId(id),true);
  for (const id of [null,undefined,'',0,'0',-1,'bad',{},true]) assert.equal(validInsertId(id),false);
  assert.match(sql,/id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY/);
  assert.deepEqual(w.connections['Enregistrer le brouillon'].main[0].map(edge=>edge.node),['Brouillon inséré ?']);
  assert.deepEqual(w.connections['Brouillon inséré ?'].main[0].map(edge=>edge.node),['Envoyer la demande de validation Resend']);
  assert.deepEqual(w.connections['Brouillon inséré ?'].main[1],[]);
  assert.equal(w.active,false,'Do not activate workflow when modifying export');
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
