import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateBlueprintFile, PHASE_IDS } from '../scripts/check-workshop-blueprints.mjs';
import { buildCookingAudioStoryboard } from '../scripts/export-cooking-workshop-audio.mjs';

const expected = ['lok-lak','samlor-machu','num-banh-chok','kuy-teav','bai-sach-chrouk'];
const page = readFileSync('src/pages/apprendre/pratique/[slug].astro','utf8');

for (const slug of expected) {
  test('Atelier complet ' + slug + ' : ingrédients canoniques, gestes, enseignement et audio préparé', async () => {
    const { data, recipes, errors } = await validateBlueprintFile('src/data/atelier-recette-guides/'+slug+'.json');
    assert.deepEqual(errors, []);
    assert.ok(recipes.some(r=>r.slug===data.sourceRecipeSlug));
    assert.deepEqual(data.phases.map(p=>p.id), PHASE_IDS);
    assert.equal(data.status,'draft');
    assert.ok(['script_only','generated_review_pending'].includes(data.audio.status));
    assert.equal(data.review.productionApproved,false);
    assert.ok(data.phases.every(p=>p.actions.length>=2 && p.check.length>25 && p.recovery.length>25));
    const plan = buildCookingAudioStoryboard(data);
    assert.equal(plan.chapters.length,7);
    assert.equal(plan.numberOfChapters,7);
    assert.equal(plan.generationRequested,false);
    assert.deepEqual(plan.chapters.slice(1).map(p=>p.id),PHASE_IDS);
    const recipe=recipes.find(r=>r.slug===slug);
    assert.equal(data.canonicalServings,recipe.baseServings);
  });
}
test('Une source d’ingrédients, photos existantes, données privées absentes', () => {
  assert.match(page,/recipe[.]ingredients[.]map/);
  assert.match(page,/ingredientText[(]ingredient[)]/);
  assert.match(page,/noindex=\{guide[.]status !== 'release_ready'\}/);
  assert.match(page,/guide[.]phases[.]map/);
  assert.match(page,/Si quelque chose ne fonctionne pas/);
  assert.match(page,/Ce que vous apprenez/);
  assert.doesNotMatch(page,/n8n|resend|socialCatalog|password|OPENAI_API_KEY/);
});
