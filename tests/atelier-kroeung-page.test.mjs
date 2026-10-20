import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateBlueprintFile, PHASE_IDS } from '../scripts/check-workshop-blueprints.mjs';
import { buildCookingAudioStoryboard } from '../scripts/export-cooking-workshop-audio.mjs';

const { data: workshop, recipes, errors } = await validateBlueprintFile('src/data/atelier-recette-guides/kroeung-jaune.json');
const recipe = recipes.find((item) => item.slug === workshop.sourceRecipeSlug);
const source = readFileSync('src/pages/apprendre/pratique/kroeung-jaune.astro','utf8');
test('Atelier kroeung : vraie recette, six phases, ingrédients et rendement canonique', () => {
  assert.deepEqual(errors, []);
  assert.equal(recipe.slug, 'kroeung-jaune');
  assert.notEqual(workshop.slug,'kroeung-jaune-au-mortier','A real workshop must not reuse the example slug');
  assert.equal(workshop.canonicalServings, recipe.baseServings);
  assert.deepEqual(workshop.phases.map((phase) => phase.id), PHASE_IDS);
  assert.match(source, /recipe[.]ingredients[.]map/);
  assert.match(source, /ingredientLine[(]item[)]/);
  assert.match(source, /Ce que vous faites/);
  assert.match(workshop.phases[2].actions.join(' '), /toute la citronnelle et tout le galanga/);
  assert.match(source, /Comment savoir si c’est réussi/);
  assert.match(source, /Si le résultat n’est pas bon/);
  assert.match(source, /Utiliser le kroeung dans un Amok Trey/);
});
test('Un atelier non validé ne se déclare pas publiable ni enregistré', () => {
  assert.equal(workshop.status,'draft');
  assert.equal(workshop.audio.status,'script_only');
  assert.equal(workshop.review.productionApproved,false);
  assert.match(source,/noindex=\{workshop[.]status !== 'release_ready'\}/);
  assert.match(source,/sans MP3/);
  assert.ok(!source.includes('<WorkshopChapterPlayer'));
  assert.ok(!source.includes('Voix IA'));
  const plan = buildCookingAudioStoryboard(workshop);
  assert.equal(plan.numberOfChapters,7);
  assert.equal(plan.generationRequested,false);
});
