import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const workflow = JSON.parse(readFileSync(new URL('../automation/n8n/01-drafts-email-approval.json', import.meta.url), 'utf8'));
const byId = id => {
  const matches = workflow.nodes.filter(node => node.id === id);
  assert.equal(matches.length, 1, 'Expected exactly one node with id ' + id);
  return matches[0];
};
const selector = byId('76370edb-44be-5bba-a884-cfc519c10a77');
const validator = byId('4ca636b2-a6ab-5161-b502-bab6cb491d5f');
const insert = byId('17b6e2bd-8a5e-5563-95ec-4e5748cd7db2');
const resend = byId('c2dac383-8325-58f5-a85e-41636a0faba1');
const wait = byId('17deb78c-2a85-546d-b077-6c1cc0cc8e99');
const decision = byId('441a0d68-5048-5f18-8dd5-a71d82212786');
const guard = byId('cuisine-draft-insert-guard');

const runCode = (node, context) => vm.runInNewContext(
  '(function(){\n' + node.parameters.jsCode + '\n})()',
  context,
);
const evalExpression = (expression, context) => {
  assert.ok(expression.startsWith('={{') && expression.endsWith('}}'));
  return vm.runInNewContext(expression.slice(3, -2), context);
};
const guardAllows = id => {
  const expression = guard.parameters.conditions.conditions[0].leftValue;
  const value = evalExpression(expression, { $json: { id } });
  assert.equal(typeof value, 'boolean');
  return value === true;
};

// Sanitized execution-406-shaped fixture: it preserves the public catalog schema,
// URL and image formats involved in the failure without containing credentials.
const source406 = Object.freeze({
  id: 'ingredient:kroeung',
  kind: 'ingredient',
  title: 'Kroeung',
  url: 'https://www.cuisine-du-cambodge.com/ingredients/kroeung/',
  summary: 'Une pâte d’aromates fraîche et parfumée.',
  facts: [
    'Une pâte d’aromates fraîche et très parfumée, au cœur de nombreux plats khmers.',
    'Le kroeung est une famille de pâtes fraîches d’aromates pilés.',
    'Émincer très finement avant de piler.',
  ],
  sourceReferences: [],
  originalImageUrl: 'https://www.cuisine-du-cambodge.com/images/ingredients/kroeung.webp',
  imageUrl: 'https://www.cuisine-du-cambodge.com/social-assets/ingredient-kroeung.jpg',
  imageRole: 'article',
  fingerprint: 'fixture-406-redacted',
});
const feed406 = Object.freeze({
  schemaVersion: 1,
  product: 'cuisine-du-cambodge',
  siteUrl: 'https://www.cuisine-du-cambodge.com',
  items: [source406],
});
const select = (feed = feed406, history = []) => runCode(selector, {
  $: name => {
    assert.equal(name, 'Lire le catalogue du site');
    return { first: () => ({ json: feed }) };
  },
  $input: { all: () => history.map(json => ({ json })) },
});
const validate = (selection, modelJson) => runCode(validator, {
  $: name => {
    assert.equal(name, selector.name);
    return { first: () => selection };
  },
  $input: { first: () => ({ json: modelJson }) },
});
const expressionContext = json => ({ $json: json });

test('regression: the execution 406 failure is reproduced only by the removed URL global dependency', () => {
  assert.equal(vm.runInNewContext('typeof URL', {}), 'undefined');
  const previousUrlInstruction =
    "let page;try{page=new URL(source.url)}catch{throw Error('catalogue_url_invalide')}";
  const selection = select()[0];
  assert.equal(typeof selection.json.source.url, 'string');
  assert.equal(selection.json.source.url, source406.url);
  assert.throws(() => runCode({ parameters: { jsCode: previousUrlInstruction } }, {
    $: () => ({ first: () => selection }),
    $input: { first: () => ({ json: { choices: [] } }) },
  }), /catalogue_url_invalide/);
});

test('complete nominal simulation reaches a prepared Resend payload and human form without external calls', () => {
  assert.equal(feed406.schemaVersion, 1);
  assert.equal(feed406.product, 'cuisine-du-cambodge');
  const selection = select()[0];
  assert.equal(selection.json.source, source406);
  assert.equal(selection.json.source.url, source406.url);
  assert.equal(selection.json.imageUrl, source406.imageUrl);

  const generated = validate(selection, {
    choices: [{ message: { content: '{not valid JSON' } }],
  })[0].json;
  assert.equal(generated.generationMode, 'catalogue_deterministe');
  assert.equal(generated.modelValidation, 'json_invalide');
  assert.ok(generated.claimsUsed.every(fact => source406.facts.includes(fact)));
  assert.ok(generated.claimsUsed.length>=1);
  assert.ok(generated.facebookCaption.length >= 100 && generated.facebookCaption.length <= 850);
  assert.ok(generated.instagramCaption.length >= 90 && generated.instagramCaption.length <= 700);
  assert.ok(generated.facebookCaption.includes('https://www.cuisine-du-cambodge.com/ingredients/kroeung/'));
  assert.doesNotMatch(generated.facebookCaption,/utm_/);
  assert.equal(generated.imageUrl, source406.imageUrl);

  const parameters = evalExpression(insert.parameters.options.queryReplacement, expressionContext(generated));
  assert.equal(parameters.length, 7);
  assert.equal(parameters[0], source406.id);
  assert.equal(parameters[1], source406.fingerprint);
  assert.deepEqual(JSON.parse(parameters[2]), source406);
  assert.equal(parameters[3], generated.scheduledDate);
  assert.equal(parameters[4], generated.facebookCaption);
  assert.equal(parameters[5], generated.instagramCaption);
  assert.equal(parameters[6], source406.imageUrl);
  assert.ok(insert.parameters.query.includes('ON CONFLICT (scheduled_date) DO NOTHING RETURNING id,scheduled_date'));

  const database = new Map();
  const insertDraft = values => {
    if (database.has(values[3])) return {};
    const row = { id: 4060 + database.size, scheduled_date: values[3] };
    database.set(values[3], row);
    return row;
  };
  const inserted = insertDraft(parameters);
  assert.ok(inserted.id);
  assert.equal(guardAllows(String(inserted.id)), true);

  const configuredExpression = resend.parameters.body
    .replace('Cuisine du Cambodge <social@CONFIGURER_DOMAINE_VERIFIE>',
      'Cuisine du Cambodge <validation@notifications.cuisine-du-cambodge.com>')
    .replace('CONFIGURER_EMAIL_VALIDATION', 'validation@example.com');
  const formUrl = 'https://n8n.orvekio.com/form-waiting/execution-406-redacted';
  const payload = JSON.parse(evalExpression(configuredExpression, {
    $: name => {
      assert.equal(name, validator.name);
      return { first: () => ({ json: generated }) };
    },
    $execution: { resumeFormUrl: formUrl },
  }));
  assert.equal(payload.from,
    'Cuisine du Cambodge <validation@notifications.cuisine-du-cambodge.com>');
  assert.deepEqual(Array.from(payload.to), ['validation@example.com']);
  assert.match(payload.subject, /Cuisine du Cambodge/);
  assert.match(payload.text, new RegExp(source406.title));
  assert.ok(payload.text.includes(source406.imageUrl));
  assert.ok(payload.text.includes(generated.facebookCaption));
  assert.ok(payload.text.includes(generated.instagramCaption));
  assert.ok(payload.text.includes(formUrl));
  assert.match(payload.text, /Aucune publication sans accord explicite/i);

  assert.equal(wait.parameters.resume, 'form');
  assert.equal(wait.parameters.limitWaitTime, true);
  assert.equal(wait.parameters.resumeAmount, 72);
  assert.equal(wait.parameters.resumeUnit, 'hours');
  const decisionField = wait.parameters.formFields.values.find(field => field.fieldLabel === 'Decision');
  assert.deepEqual(Array.from(decisionField.fieldOptions.values.map(option => option.option)).sort(),
    ['Approuver', 'Demander une modification', 'Refuser'].sort());
  assert.equal(workflow.active, false);
  assert.ok(!workflow.nodes.some(node => String(node.parameters?.url || '').includes('graph.facebook.com')));
});

test('duplicate-date simulation stops before Resend and nominal decision outputs stay fail-closed', () => {
  const selection = select()[0];
  const generated = validate(selection, { choices: [] })[0].json;
  const parameters = evalExpression(insert.parameters.options.queryReplacement, expressionContext(generated));
  const database = new Map([[parameters[3], { id: 4050, scheduled_date: parameters[3] }]]);
  const duplicateResult = database.has(parameters[3]) ? {} : { id: 4061 };
  assert.equal(Object.hasOwn(duplicateResult, 'id'), false);
  assert.equal(guardAllows(duplicateResult.id), false);
  assert.equal(workflow.connections[guard.name].main[1].length, 0);

  const interpret = (Decision, Commentaire = '') => runCode(decision, {
    $: name => {
      if(name===insert.name) return {first:()=>({json:{id:4060}})};
      if(name===validator.name) return {first:()=>({json:validate(select()[0],{choices:[]})[0].json})};
      throw Error('Unexpected node: '+name);
    },
    $input: { first: () => ({ json: { data: { Decision, Commentaire } } }) },
  })[0].json;
  assert.equal(interpret('Approuver').decision, 'approved');
  assert.equal(interpret('Approuver').id, '4060');
  assert.equal(interpret('Refuser').decision, 'rejected');
  assert.equal(interpret('Demander une modification', 'Revoir le titre').decision, 'revision_requested');
  assert.throws(() => interpret('Demander une modification'), /commentaire_requis_pour_modification/);
  assert.throws(()=>interpret('Valeur inconnue'),/decision_non_reconnue/);
});

test('invalid catalog shapes, external URLs and unverifiable facts fail before persistence', () => {
  assert.throws(() => select({ ...feed406, product: 'other' }), /catalogue_non_valide/);
  assert.throws(() => select({ ...feed406, items: [] }), /aucun_media_JPEG/);
  const external = { ...source406, url: 'https://evil.example/ingredients/kroeung/' };
  const selectedExternal = select({ ...feed406, items: [external] })[0];
  assert.throws(() => validate(selectedExternal, { choices: [] }), /catalogue_url_invalide/);
  const insufficient = { ...source406, facts: ['Trop court.'] };
  const selectedInsufficient = select({ ...feed406, items: [insufficient] })[0];
  assert.throws(() => validate(selectedInsufficient, { choices: [] }),
    /catalogue_insuffisant_pour_legendes/);
});
