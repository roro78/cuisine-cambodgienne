import test from 'node:test';
import assert from 'node:assert/strict';
import { validateBlueprintFile, validateWorkshopBlueprint, PHASE_IDS } from '../scripts/check-workshop-blueprints.mjs';
import { buildCookingAudioStoryboard } from '../scripts/export-cooking-workshop-audio.mjs';
const path = 'docs/ateliers/exemples/exemple-kroeung-jaune.json';
const { data: model, recipes } = await validateBlueprintFile(path);
const clone = () => structuredClone(model);

test('Exemple du référentiel = atelier complet tiré d’une vraie recette', () => {
  assert.deepEqual(validateWorkshopBlueprint(model, recipes), []);
  assert.deepEqual(model.phases.map(x => x.id), PHASE_IDS);
  assert.equal(model.sourceRecipeSlug, 'kroeung-jaune');
  assert.equal(model.status, 'draft');
  assert.equal(model.media.imageValidated, false);
  assert.equal(model.review.productionApproved, false);
});
test('Le storyboard est une introduction + 6 chapitres alignés, sans appel TTS', () => {
  const plan = buildCookingAudioStoryboard(model);
  assert.equal(plan.numberOfChapters, 7);
  assert.deepEqual(plan.chapters.slice(1).map(x => x.id), PHASE_IDS);
  assert.deepEqual(plan.chapters.slice(1).map(x => x.title), model.phases.map(x => x.title));
  assert.equal(plan.generationRequested, false);
  assert.equal(plan.productionApproved, false);
  assert.equal(plan.kind, 'cooking-workshop-audio-storyboard');
});
test('Un atelier sans recette ou ingrédient sourcé est rejeté', () => {
  let sample = clone();
  sample.sourceRecipeSlug = 'recette-inexistante';
  assert.ok(validateWorkshopBlueprint(sample, recipes).some(x => x.includes('sourceRecipeSlug')));
  sample = clone();
  sample.phases[2].ingredientNames.push('sirop inventé');
  assert.ok(validateWorkshopBlueprint(sample, recipes).some(x => x.includes('Ingrédient absent')));
});
test('Les six phases, la narration et la sécurité sont obligatoires', () => {
  let sample = clone();
  sample.phases.splice(2,1);
  assert.ok(validateWorkshopBlueprint(sample, recipes).some(x => x.includes('exactement six')));
  sample = clone();
  sample.phases[3].audioScript = 'Court.';
  assert.ok(validateWorkshopBlueprint(sample, recipes).some(x => x.includes('audioScript')));
  sample = clone();
  sample.phases[4].check = '';
  assert.ok(validateWorkshopBlueprint(sample, recipes).some(x => x.includes('check')));
});
test('Aucune publication avant images réelles, écoute et validation mobile', () => {
  const sample = clone();
  sample.status = 'release_ready';
  sample.audio.status = 'validated';
  assert.ok(validateWorkshopBlueprint(sample, recipes).some(x => x.includes('NO GO')));
});
