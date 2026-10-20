/**
 * Contrat éditorial des ateliers-recettes. Aucune synthèse TTS ni action réseau.
 * node scripts/check-workshop-blueprints.mjs [chemin-fiche.json ...]
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { transformSync } from 'esbuild';

export const PHASE_IDS = ['installer', 'preparer', 'assembler', 'maitriser', 'rectifier', 'terminer'];

export async function loadCanonicalRecipes() {
  const source = readFileSync(new URL('../src/data/recipes.ts', import.meta.url), 'utf8');
  const code = transformSync(source, { loader: 'ts', format: 'esm', target: 'es2022' }).code;
  const data = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
  return data.recipes;
}

export function validateWorkshopBlueprint(atelier, recipes, options = {}) {
  const errors = [];
  const requireText = (value, at, min = 18) => {
    if (typeof value !== 'string' || value.trim().length < min) {
      errors.push(at + ' doit contenir un texte explicite (minimum ' + min + ' caractères).');
    }
  };
  const requireArray = (value, at, min = 1) => {
    if (!Array.isArray(value) || value.length < min) {
      errors.push(at + ' doit contenir au moins ' + min + ' élément(s).');
      return [];
    }
    return value;
  };
  const requireBoolean = (value, at) => {
    if (typeof value !== 'boolean') errors.push(at + ' doit être un booléen.');
  };
  if (!atelier || typeof atelier !== 'object' || Array.isArray(atelier)) return ['Fiche atelier absente ou invalide.'];
  if (atelier.schemaVersion !== 1 || atelier.kind !== 'cooking-workshop') errors.push('schemaVersion=1 et kind=cooking-workshop obligatoires.');
  if (!['draft', 'review', 'release_ready'].includes(atelier.status)) errors.push('Statut de publication invalide.');
  requireText(atelier.slug, 'slug', 6);
  if (!/^[a-z0-9-]+$/.test(atelier.slug || '')) errors.push('slug non URL-safe.');
  requireText(atelier.title, 'title', 18);
  requireText(atelier.finalPreparation, 'finalPreparation', 35);
  requireText(atelier.learningGoal, 'learningGoal', 60);
  requireText(atelier.portionLabel, 'portionLabel', 12);
  const recipe = recipes.find(item => item.slug === atelier.sourceRecipeSlug);
  if (!recipe) errors.push('sourceRecipeSlug absent des recettes canoniques : ' + atelier.sourceRecipeSlug);
  if (recipe && (!recipe.ingredients?.length || !recipe.steps?.length)) errors.push('Recette source incomplète.');
  if (!atelier.recipeIngredients || atelier.recipeIngredients.mode !== 'canonical-recipe') errors.push('Les ingrédients de base doivent venir directement de la recette source.');
  for (const ingredient of requireArray(atelier.recipeIngredients?.additionalTrialIngredients || [], 'additionalTrialIngredients', 0)) {
    requireText(ingredient.name, 'additionalTrialIngredients.name', 4);
    requireText(ingredient.quantity, 'additionalTrialIngredients.quantity', 2);
    requireText(ingredient.purpose, 'additionalTrialIngredients.purpose', 18);
  }
  for (const key of ['preparationMinutes', 'practicalMinutes', 'waitingMinutes']) {
    const value = atelier.duration?.[key];
    if (!Number.isInteger(value) || value < 0 || value > 480) errors.push('duration.' + key + ' invalide.');
  }
  if (atelier.duration?.practicalMinutes === 0) errors.push('Un atelier doit comporter de vrais gestes culinaires.');
  requireText(atelier.duration?.waitingNote, 'duration.waitingNote', 10);
  for (const field of ['equipment', 'beforeStarting', 'safety']) {
    const arr = requireArray(atelier[field], field, 1);
    for (const item of arr) requireText(item, field + '[]', 12);
  }
  if (atelier.sources?.recipeSource !== '/recettes/' + atelier.sourceRecipeSlug + '/') errors.push('sources.recipeSource doit lier la recette canonique.');
  requireText(atelier.sources?.culturalNote, 'sources.culturalNote', 30);
  requireText(atelier.sources?.pedagogicalAdaptation, 'sources.pedagogicalAdaptation', 30);

  const phases = requireArray(atelier.phases, 'phases', 6);
  if (phases.length !== 6) errors.push('Il faut exactement six phases culinaires.');
  const canonicalIngredients = new Set((recipe?.ingredients || []).map(item => item.name));
  const ingredientsSeen = new Set();
  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    if (!phase || typeof phase !== 'object') { errors.push('phase ' + (i + 1) + ' invalide'); continue; }
    if (phase.id !== PHASE_IDS[i]) errors.push('Phase ' + (i + 1) + ' : ID attendu ' + PHASE_IDS[i]);
    requireText(phase.title, 'phases[' + i + '].title', 15);
    if (!Number.isInteger(phase.minutes) || phase.minutes <= 0) errors.push('Temps de phase invalide : ' + phase.id);
    const names = phase.ingredientNames;
    if (!Array.isArray(names)) errors.push('ingredientNames doit être un tableau : ' + phase.id);
    else for (const name of names) {
      if (!canonicalIngredients.has(name)) errors.push('Ingrédient absent de la recette canonique : ' + name);
      ingredientsSeen.add(name);
    }
    for (const field of ['actions']) {
      const actions = requireArray(phase[field], phase.id + '.' + field, 2);
      actions.forEach(action => requireText(action, phase.id + '.actions[]', 45));
    }
    for (const field of ['observe', 'check', 'mistake', 'recovery', 'learning', 'safety']) requireText(phase[field], phase.id + '.' + field, 24);
    requireText(phase.audioScript, phase.id + '.audioScript', 90);
    if (typeof phase.audioScript === 'string' && phase.audioScript.length > 1200) errors.push('Chapitre trop long à relire : ' + phase.id);
    if (phase.actions?.some(action => action.trim() === phase.audioScript?.trim())) errors.push('Le script audio répète mot pour mot une action écrite : ' + phase.id);
    requireText(phase.pausePrompt, phase.id + '.pausePrompt', 20);
  }
  if (recipe && phases.length === 6) for (const ingredient of recipe.ingredients) {
    if (!ingredientsSeen.has(ingredient.name)) errors.push('Ingrédient de recette non affecté à une phase : ' + ingredient.name);
  }
  const audio = atelier.audio || {};
  if (audio.mode !== 'guided-cooking') errors.push('Audio doit être un accompagnement guidé.');
  if (audio.status !== 'script_only' && audio.status !== 'generated_review_pending' && audio.status !== 'validated') errors.push('audio.status invalide.');
  requireText(audio.voice, 'audio.voice', 3);
  requireText(audio.intro, 'audio.intro', 100);
  if (audio.publicProviderMention !== false) errors.push('Ne pas afficher le nom du fournisseur de voix.');
  const media = atelier.media || {};
  requireText(typeof media.finishedPreparationImage === 'string' ? media.finishedPreparationImage : null, 'media.finishedPreparationImage', 0);
  requireBoolean(media.imageValidated, 'media.imageValidated');
  requireBoolean(media.rightsValidated, 'media.rightsValidated');
  if (!Array.isArray(media.stepImagePaths)) errors.push('media.stepImagePaths doit être un tableau.');
  const review = atelier.review || {};
  for (const gate of ['recipeValidated', 'editorialValidated', 'audioListeningValidated', 'mobileValidated', 'desktopValidated', 'productionApproved']) requireBoolean(review[gate], 'review.' + gate);
  if (atelier.status === 'release_ready') {
    if (audio.status !== 'validated' || !media.finishedPreparationImage || !media.imageValidated || !media.rightsValidated ||
        Object.values(review).some(value => value !== true)) errors.push('NO GO : gate final incomplet (audio, images, droits, validation humaine, tests).');
  }
  if (options.checkMediaFiles && media.finishedPreparationImage && !existsSync(resolve('public', media.finishedPreparationImage.replace(/^\//, '')))) {
    errors.push('Photographie finale absente : ' + media.finishedPreparationImage);
  }
  return errors;
}

export async function validateBlueprintFile(path) {
  const data = JSON.parse(readFileSync(resolve(path), 'utf8'));
  const recipes = await loadCanonicalRecipes();
  const errors = validateWorkshopBlueprint(data, recipes);
  return { data, recipes, errors };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const files = process.argv.slice(2);
  if (!files.length) files.push('docs/ateliers/exemples/exemple-kroeung-jaune.json');
  let invalid = 0;
  for (const file of files) {
    try {
      const { data, errors } = await validateBlueprintFile(file);
      if (errors.length) {
        console.error('FAIL ' + file + ' (' + data.slug + ')\n- ' + errors.join('\n- '));
        invalid++;
      } else console.log('PASS ' + file + ' : six phases, vraie recette, sept textes vocaux, gates cohérents.');
    } catch (error) {
      console.error('FAIL ' + file + ' : ' + error.message);
      invalid++;
    }
  }
  if (invalid) process.exitCode = 1;
}
