import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { transformSync } from 'esbuild';
const source = readFileSync(new URL('../src/data/guidedWorkshops.ts', import.meta.url), 'utf8');
const compiled = transformSync(source, { loader: 'ts', format: 'esm', target: 'es2022' }).code;
const { tamarindGuidedWorkshop: workshop } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));
const page = readFileSync(new URL('../src/pages/apprendre/pratique/sauce-tamarin.astro', import.meta.url), 'utf8');

test('pilot is separated from the six historical lessons and stays noindex', () => {
  assert.equal(workshop.status, 'pilot_review');
  assert.equal(workshop.recipeSource.status, 'source_verified');
  assert.equal(workshop.recipeSource.url, 'https://cambodiarecipe.com/tamarind-sauce/');
  assert.ok(workshop.recipeSource.crossCheckUrls.length >= 2);
  assert.match(page, /workshop.recipeSource.url/);
  assert.match(page, /noindex=\{workshop.status !== 'validated'\}/);
  assert.match(workshop.historyUrl, /^\/apprendre\/equilibrer-une-sauce\/$/);
  assert.ok(!page.includes('getWorkshopAudio('), 'No historical Coral file may be presented as the new narration');
  assert.ok(!page.includes('Recipe"'), 'Do not claim Recipe structured data until culinary verification');
  for (const slug of ['piler-aromates-au-mortier','equilibrer-une-sauce','saisir-viande-poele','fraicheur-herbes-agrumes','bouillon-leger-savoureux','composer-repas-cambodgien']) {
    assert.ok(existsSync(new URL('../src/data/workshop-audio/' + slug + '.json', import.meta.url)));
  }
});
test('every ingredient has a real quantity and is referenced in an executable step', () => {
  const ids = workshop.ingredients.map(i => i.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(workshop.ingredients.length >= 4);
  const byId = Object.fromEntries(workshop.ingredients.map(i => [i.id, i.quantity]));
  assert.equal(byId.tamarin, '2 c. à soupe');
  assert.equal(byId.eau, '80 ml');
  assert.equal(byId.sucre, '2 c. à soupe rases');
  assert.equal(byId.poisson, '30 ml (2 c. à soupe)');
  assert.ok(workshop.ingredients.some(i => i.id === 'ail'));
  assert.ok(workshop.ingredients.some(i => i.id === 'piment'));
  for (const i of workshop.ingredients) {
    assert.ok(i.label.length > 12, 'Ingredient not identified: ' + i.id);
    assert.match(i.quantity, /^\d+\s*(?:g|ml|c\. à soupe|gousses|petits piments)\b/u, 'Explicit measured unit required: ' + i.id);
    assert.ok(workshop.steps.some(s => s.ingredients.includes(i.id)), 'Unused ingredient ' + i.id);
  }
  for (const s of workshop.steps) {
    for (const id of s.ingredients) assert.ok(ids.includes(id), 'Unknown ingredient ' + id);
    assert.ok(s.instructions.length >= 2);
    for (const action of s.instructions) assert.ok(action.length >= 45, 'Vague action in ' + s.id);
  }
});
test('all six stages teach measurable actions, cues, troubleshooting and audio script drafts', () => {
  assert.equal(workshop.steps.length, 6);
  assert.equal(new Set(workshop.steps.map(s => s.id)).size, workshop.steps.length);
  for (const s of workshop.steps) {
    assert.ok(s.minutes > 0 && Number.isInteger(s.minutes));
    for (const field of ['check', 'tip', 'recovery', 'narrationDraft']) assert.ok(s[field].length >= 60, field + ' missing on ' + s.id);
    assert.ok(page.includes('step.'), 'Dynamic step rendering expected');
  }
  assert.match(source, /10 ml de sauce/);
  assert.match(source, /quatre bols|quatre coupelles/i);
  assert.match(source, /une cuillère à café, soit environ 5 ml/);
  assert.match(source, /une expérience pédagogique ajoutée à la recette publiée/);
});
test('existing urls, safety checks and no social eligibility for the draft', () => {
  assert.ok(workshop.ingredientUrl.startsWith('/ingredients/'));
  assert.ok(workshop.relatedRecipeUrls.length > 0);
  assert.ok(workshop.safety.some(s => /poisson/i.test(s)));
  assert.ok(workshop.safety.some(s => /cuillères propres/i.test(s)));
  assert.ok(!readFileSync(new URL('../src/data/socialCatalog.ts', import.meta.url), 'utf8').includes('guidedWorkshops'));
});
