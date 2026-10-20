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
    assert.ok(Array.isArray(data.sources.safetyReferences) && data.sources.safetyReferences.length>0,'Les repères cuisson/conservation doivent citer des sources');
    assert.ok(data.sources.safetyReferences.every(ref=>/^https:\/\//.test(ref.url) && ref.title.length>15),'Chaque source de sécurité possède un titre et une URL vérifiables');
    assert.ok(data.safety.length>=3,'Rappels de sécurité concrets disponibles dans la fiche');

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
  assert.match(page,/workshopIngredients[.]map/);
  assert.match(page,/recipe[.]ingredients[.]slice[(]0, 7[)]/);
  assert.match(page,/data-workshop-servings-root/);
  assert.match(page,/data-workshop-ingredient-quantity/);
  assert.match(page,/noindex=\{guide[.]status !== 'release_ready'\}/);
  assert.match(page,/guide[.]phases[.]map/);
  assert.match(page,/Si quelque chose ne fonctionne pas/);
  assert.match(page,/Ce que vous apprenez/);
  assert.match(page,/recipe[.]substitutions[.]map/);
  assert.match(page,/guide[.]media[.]finishedPreparationImage/);
  for(const path of ['src/pages/apprendre/index.astro','src/pages/recettes/[slug].astro','src/pages/sitemap.xml.ts']){
    const source=readFileSync(path,'utf8');
    assert.match(source,/releasedCookingWorkshopGuides|getReleasedCookingWorkshopForRecipe/);
  }
  assert.doesNotMatch(page,/n8n|resend|socialCatalog|password|OPENAI_API_KEY/);
});

test('Lok Lak V2 : sept chapitres cuisinables, MP3 antérieur conservé mais non publiable', async () => {
  const { data, recipes, errors } = await validateBlueprintFile('src/data/atelier-recette-guides/lok-lak.json');
  assert.deepEqual(errors, []);
  assert.equal(data.audio.storyboardVersion, 2);
  assert.ok(['script_only','generated_review_pending'].includes(data.audio.status));
  assert.equal(data.review.productionApproved, false);
  if(data.audio.status === 'script_only') assert.equal(data.audio.asset, undefined, 'Old MP3 must not appear as the active V2 audio');
  else assert.match(data.audio.asset.audioUrl, /atelier-coral-v2[.]mp3$/, 'V2 must never overwrite old MP3');
  assert.match(data.audio.previousAsset.sha256, /^[a-f0-9]{64}$/);
  const plan = buildCookingAudioStoryboard(data);
  assert.deepEqual(plan.chapters.map(c => c.id), ['intro', ...PHASE_IDS]);
  assert.ok(plan.chapters[0].text.length >= 350, 'Welcome and preparation before starting');
  assert.ok(plan.chapters.slice(1).every(c => c.text.length >= 650), 'Each spoken chapter must guide real gestures');
  assert.match(plan.chapters.at(-1).text, /bon appétit/i);
  assert.match(plan.chapters[2].text, /marinade|mariner/i, 'Découpe et marinade avant cuisson');
  assert.match(plan.chapters[2].text, /réfrigérateur/i, 'Marinade au frais');
  assert.match(plan.chapters[3].text, /citron|crudités/i, 'Légumes et condiment préparés pendant la marinade');
  assert.match(plan.chapters[4].text, /bœuf.*mariné|mariné.*bœuf|marinade/i, 'On saisit le bœuf déjà mariné');
  assert.doesNotMatch(plan.chapters[5].text, /versez.*marinade.*crue|versez.*sauce soja/i, 'Aucune marinade crue versée en fin de cuisson');
  assert.equal(data.duration.waitingMinutes,15,'Marinade de vingt minutes dont cinq avec préparation des garnitures');
  assert.ok(data.recipeIngredients.additionalTrialIngredients.some(i=>i.name==='huile neutre pour la saisie'),'Huile pédagogique signalée à part');
  assert.doesNotMatch(plan.chapters.map(c => c.text).join(' '), /quatre assiettes|600 grammes|300 grammes/i, 'Narration must not freeze portions');
  assert.ok(recipes.find(r => r.slug === 'lok-lak').ingredients.length === 8, 'Canonical recipe unchanged');
  assert.match(page, /guide[.]audio[.]status === 'script_only'/, 'Do not render superseded audio');
});
