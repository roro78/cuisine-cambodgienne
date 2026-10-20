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

test('Codex : exigences strictes de publication audio et photographie', () => {
  const sample = clone(); sample.status = 'release_ready';
  sample.audio.status = 'validated';
  for (const key of Object.keys(sample.review)) sample.review[key]=true;
  sample.media.imageValidated = sample.media.rightsValidated = true;
  sample.media.finishedPreparationImage = '/images/n-existe-pas.webp';
  const errors=validateWorkshopBlueprint(sample,recipes);
  assert.ok(errors.some(x=>x.includes('manifeste audio')));
  assert.ok(errors.some(x=>x.includes('photographie finale absente')));
});
test('Codex : réserves d’essais légitimes, dosage, et utilisation réelle des ingrédients', () => {
  const sample=clone();
  sample.recipeIngredients.additionalTrialIngredients.push({name:'eau supplémentaire',quantity:'15 ml',purpose:'Pour comparer deux textures sans diluer la base'});
  sample.phases[4].ingredientNames.push('eau supplémentaire');
  assert.deepEqual(validateWorkshopBlueprint(sample, recipes), []);
  sample.phases[4].ingredientNames.push('ingrédient inventé');
  assert.ok(validateWorkshopBlueprint(sample,recipes).some(x=>x.includes('Ingrédient absent')));
  const second=clone();
  second.phases[3].ingredientNames = [];
  second.phases[1].ingredientNames = second.phases[1].ingredientNames.filter(x=>x!=='curcuma frais');
  assert.ok(validateWorkshopBlueprint(second,recipes).some(x=>x.includes('Ingrédient de recette non affecté')));
});
test('Codex : temps, portions, allergènes, voix et copie littérale bloqués', () => {
  const check=fn=>{const s=clone();fn(s);return validateWorkshopBlueprint(s,recipes)};
  assert.ok(check(s=>s.canonicalServings=4).some(x=>x.includes('portions')));
  assert.ok(check(s=>s.duration.practicalMinutes=99).some(x=>x.includes('Durée incohérente')));
  assert.ok(check(s=>delete s.allergens).some(x=>x.includes('allergens')));
  assert.ok(check(s=>s.audio.voice='other').some(x=>x.includes('Voix non prise')));
  assert.ok(check(s=>s.phases[2].audioScript='Voici ce que vous allez faire : '+s.phases[2].actions[0]+' Faites pause pour essayer.').some(x=>x.includes('répète un bloc')));
});
