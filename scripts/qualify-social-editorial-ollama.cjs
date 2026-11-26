// Exercise the reviewed workflow against the installed local Ollama only.
// Usage on Orvekio: node qualify-social-editorial-ollama.cjs 01.json social-feed.json
'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');

const [workflowFile, catalogueFile] = process.argv.slice(2);
const load = file => JSON.parse(readFileSync(file, 'utf8'));
const workflow = load(workflowFile);
const catalogue = load(catalogueFile);
const endpoint = 'http://ollama:11434/v1/chat/completions';
const findNode = name => {
  const matches = workflow.nodes.filter(node => node.name === name);
  assert.equal(matches.length, 1, name);
  return matches[0];
};
const selector = findNode('Choisir un contenu original');
const prompt = findNode('Rédiger via Llama sur Ollama');
const formatter = findNode('Vérifier et cadrer les textes');
assert.equal(workflow.active, false);
assert.equal(prompt.parameters.url, endpoint);

const execute = (node, context) => runInNewContext(
  '(function(){\n' + node.parameters.jsCode + '\n})()', context, {timeout: 1000},
);
const sources = [
  'recette:lok-lak',
  'atelier:num-banh-chok-sauce-et-herbes-fraiches',
  'ingredient:tamarin',
  'technique:pickles-carotte-concombre',
  'culture:kep-marche-crabe-poivre',
];

async function qualify() {
  for (const id of sources) {
    const source = catalogue.items.find(item => item.id === id);
    assert.ok(source, id);
    const [selection] = execute(selector, {
      $: () => ({first: () => ({json: {...catalogue, items: [source]}})}),
      $input: {all: () => []},
    });
    assert.equal(selection.json.editorialOptions.length, 2, id);
    const body = runInNewContext(prompt.parameters.body.slice(3, -2), {$json: selection.json});
    assert.equal(JSON.parse(body).model, 'llama3.2:latest');
    const started = Date.now();
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body,
      redirect: 'error',
      signal: AbortSignal.timeout(prompt.parameters.options.timeout),
    });
    assert.equal(response.status, 200, id);
    const json = await response.json();
    const [{json: output}] = execute(formatter, {
      $: () => ({first: () => selection}),
      $input: {first: () => ({json})},
    });
    assert.equal(output.modelValidation, 'valide_transmis',
      id + ' · réponse Ollama ' + String(json.choices?.[0]?.message?.content).slice(0,160));
    assert.equal(output.generationMode, 'ollama_borne', id);
    assert.ok(output.claimsUsed.every(fact => source.facts.includes(fact)), id);
    assert.notEqual(output.facebookCaption, output.instagramCaption, id);
    const choice = JSON.parse(json.choices[0].message.content.trim()
      .replace(/^\x60{3}(?:json)?\s*/i, '').replace(/\s*\x60{3}$/, ''));
    console.log(JSON.stringify({
      id, model: json.model, ms: Date.now() - started, choice,
      proofCount: output.claimsUsed.length,
    }));
  }
}

qualify().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
