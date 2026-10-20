import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Offline contracts run the actual JavaScript stored in the n8n exports.
// They do not call Meta, Supabase, Ollama, Resend, or the n8n API.
const load = name => JSON.parse(readFileSync(new URL('../automation/n8n/' + name, import.meta.url), 'utf8'));
const workflow01 = load('01-drafts-email-approval.json');
const workflow02 = load('02-publish-approved.json');
const workflow03 = load('03-reconcile-instagram.json');
const get = (workflow, name) => {
  const matches = workflow.nodes.filter(n => n.name === name);
  assert.equal(matches.length, 1, 'Expected exactly one node: ' + name);
  return matches[0];
};
const execute = (workflow, name, context) => vm.runInNewContext(
  '(function(){\n' + get(workflow, name).parameters.jsCode + '\n})()',
  { ...context, URL }
);
const source = Object.freeze({
  id: 'recette:amok', fingerprint: 'new-fingerprint', kind: 'recette',
  title: 'Amok', summary: 'Cuisine du Cambodge',
  facts: ['Le poisson est cuit à la vapeur.'],
  url: 'https://www.cuisine-du-cambodge.com/recettes/amok',
  imageUrl: 'https://www.cuisine-du-cambodge.com/social-assets/amok.jpg',
});
const sourceOld = Object.freeze({
  ...source, id: 'recette:other', fingerprint: 'old-fingerprint',
  imageUrl: 'https://www.cuisine-du-cambodge.com/social-assets/other.jpg',
});
const catalog = sources => ({
  'Lire le catalogue du site': { first: () => ({ json: {
    product: 'cuisine-du-cambodge', schemaVersion: 1, items: sources,
  } }) },
});
const select = (sources, history = []) => execute(workflow01, 'Choisir un contenu original', {
  $: name => {
    assert.equal(name, 'Lire le catalogue du site');
    return catalog(sources)[name];
  },
  $input: { all: () => history.map(json => ({ json })) },
});

test('the three workflow exports remain inactive and Workflow 01 retains 11 nodes', () => {
  for (const w of [workflow01, workflow02, workflow03]) assert.equal(w.active, false);
  assert.equal(workflow01.nodes.length, 11);
  assert.equal(get(workflow01, 'Choisir un contenu original').parameters.mode, 'runOnceForAllItems');
});

test('real selector preserves catalog metadata, social images, and new-source priority', () => {
  const out = select([sourceOld, source], [{
    source_id: sourceOld.id, source_fingerprint: sourceOld.fingerprint,
    uses: 3, latest_date: '2026-10-19',
  }]);
  assert.equal(out.length, 1);
  assert.equal(out[0].json.sourceId, source.id);
  assert.equal(out[0].json.fingerprint, source.fingerprint);
  assert.equal(out[0].json.imageUrl, source.imageUrl);
  assert.match(out[0].json.scheduledDate, /^\d{4}-\d{2}-\d{2}$/);
});

test('selector rejects an empty catalog or invalid social images', () => {
  assert.throws(() => select([]), /aucun_media_JPEG/);
  assert.throws(() => select([{ ...source, imageUrl: 'https://evil.example/image.png' }]), /aucun_media_JPEG/);
});

const selection = () => select([source])[0];
const modelResponse = data => ({ choices: [{ message: { content: JSON.stringify(data) } }] });
const validate = response => execute(workflow01, 'Vérifier et cadrer les textes', {
  $: name => {
    assert.equal(name, 'Choisir un contenu original');
    return { first: selection };
  },
  $input: { first: () => ({ json: response }) },
});

test('actual validation code accepts a bounded, sourced Ollama mock response', () => {
  const result = validate(modelResponse({
    facebookCaption: 'Découvrez cette recette et ses ingrédients dans notre carnet cambodgien. '.repeat(3),
    instagramCaption: 'Un plat cambodgien à découvrir avec notre recette expliquée en détail. '.repeat(3),
    claimsUsed: ['Le poisson est cuit à la vapeur.'],
  }));
  assert.equal(result.length, 1);
  assert.equal(result[0].json.sourceId, source.id);
  assert.match(result[0].json.facebookCaption, /utm_source=facebook/);
  assert.match(result[0].json.instagramCaption, /cuisine-du-cambodge\.com/);
});

test('actual Ollama validator rejects malformed JSON, fabricated evidence, and short text', () => {
  assert.throws(() => validate({ choices: [{ message: { content: '{broken' } }] }), /reponse_llama_non_json/);
  assert.throws(() => validate(modelResponse({
    facebookCaption: 'Description satisfaisante. '.repeat(8),
    instagramCaption: 'Description satisfaisante. '.repeat(8),
    claimsUsed: ['Un prix mondial remporté en 2025'],
  })), /preuves_non_verifiables/);
  assert.throws(() => validate(modelResponse({
    facebookCaption: 'court', instagramCaption: 'court', claimsUsed: [],
  })), /legendes_vides_ou_longues/);
});

test('Ollama outbound request uses JSON.stringify, including special characters', () => {
  const body = get(workflow01, 'Rédiger via Llama sur Ollama').parameters.body;
  assert.ok(body.startsWith('={{JSON.stringify(') && body.endsWith(')}}'));
  const payload = vm.runInNewContext(body.slice(3, -2), {
    $json: { source: { ...source, summary: 'Poisson "amok"\nCitronnelle et épices' } },
  });
  const parsed = JSON.parse(payload);
  assert.equal(parsed.model, 'llama3.2:latest');
  assert.match(parsed.messages[1].content, /Poisson/);
  assert.match(parsed.messages[1].content, /Citronnelle/);
});

const decide = (decision, note = '') => execute(workflow01, 'Interpréter la décision', {
  $: name => {
    assert.equal(name, 'Enregistrer le brouillon');
    return { first: () => ({ json: { id: 42 } }) };
  },
  $input: { first: () => ({ json: { data: { Decision: decision, Commentaire: note } } }) },
});

test('approval is explicitly human and revision requires a comment', () => {
  for (const [label, status, note] of [
    ['Approuver', 'approved', ''],
    ['Refuser', 'rejected', ''],
    ['Demander une modification', 'revision_requested', 'Corriger le texte'],
  ]) {
    const out = decide(label, note);
    assert.equal(out.length, 1);
    assert.equal(out[0].json.decision, status);
    assert.equal(out[0].json.id, 42);
  }
  assert.throws(() => decide('Demander une modification'), /commentaire_requis_pour_modification/);
  assert.equal(decide('Inconnu')[0].json.decision, 'rejected');
});

test('duplicate-date SQL cannot return an inserted ID and no phantom approval status exists', () => {
  const insert = get(workflow01, 'Enregistrer le brouillon');
  assert.match(insert.parameters.query, /ON CONFLICT \(scheduled_date\) DO NOTHING RETURNING id/);
  assert.notEqual(insert.alwaysOutputData, true);
  const subsequent = workflow01.connections[insert.name].main[0][0].node;
  assert.equal(subsequent, 'Envoyer la demande de validation Resend');
  // Structural check only. Remote n8n behavior when Postgres returns 0 items remains unverified.
  assert.match(get(workflow01, 'Persister la décision humaine').parameters.query, /status='draft'/);
});

test('Instagram status parsing and ready-container filtering use real code', () => {
  const status = execute(workflow03, 'Lire le statut Meta', {
    $: () => ({ first: () => ({ json: { id: 42, instagram_container_id: 'container-1' } }) }),
    $input: { first: () => ({ json: { status_code: 'FINISHED' } }) },
  });
  assert.equal(status[0].json.status, 'FINISHED');
  const ready = execute(workflow03, 'Ne garder que les conteneurs prêts', {
    $input: { all: () => [
      { json: { id: 42, ig_state: 'submitting' } },
      { json: { id: 43, ig_state: 'container_created' } },
    ] },
  });
  assert.equal(ready.length, 1);
  assert.equal(ready[0].json.id, 42);
});
