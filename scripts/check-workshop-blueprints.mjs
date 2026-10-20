/**
 * Contrat éditorial des ateliers-recettes. Aucune synthèse TTS ni action réseau.
 * node scripts/check-workshop-blueprints.mjs [chemin-fiche.json ...]
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve, join, relative, isAbsolute } from 'node:path';
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
  if (!Number.isInteger(atelier.canonicalServings) || atelier.canonicalServings <= 0)
    errors.push('canonicalServings doit être un nombre entier positif correspondant à la recette.');

  const recipe = recipes.find(item => item.slug === atelier.sourceRecipeSlug);
  if (!recipe) errors.push('sourceRecipeSlug absent des recettes canoniques : ' + atelier.sourceRecipeSlug);
  if (recipe && (!recipe.ingredients?.length || !recipe.steps?.length)) errors.push('Recette source incomplète.');
  if (recipe && atelier.canonicalServings !== recipe.baseServings) errors.push('Les portions ne correspondent pas à la recette canonique.');
  if (recipe?.servingsLabel && !atelier.portionLabel?.toLowerCase().includes(recipe.servingsLabel.toLowerCase()))
    errors.push('Le rendement affiché doit mentionner l’unité de la recette canonique.');
  if (!atelier.recipeIngredients || atelier.recipeIngredients.mode !== 'canonical-recipe') errors.push('Les ingrédients de base doivent venir directement de la recette source.');
  const trialIngredients = requireArray(atelier.recipeIngredients?.additionalTrialIngredients || [], 'additionalTrialIngredients', 0);
  for (const ingredient of trialIngredients) {
    requireText(ingredient.name, 'additionalTrialIngredients.name', 4);
    requireText(ingredient.quantity, 'additionalTrialIngredients.quantity', 2);
    requireText(ingredient.purpose, 'additionalTrialIngredients.purpose', 18);
  }
  for (const key of ['preparationMinutes', 'practicalMinutes', 'waitingMinutes']) {
    const value = atelier.duration?.[key];
    if (!Number.isInteger(value) || value < 0 || value > 480) errors.push('duration.' + key + ' invalide.');
  }
  if (atelier.duration?.practicalMinutes === 0) errors.push('Un atelier doit comporter de vrais gestes culinaires.');
  if (atelier.duration?.preparationMinutes > 0 && !atelier.duration?.waitingNote?.includes('hors des six phases'))
    errors.push('Durée de préparation séparée : préciser explicitement le temps hors des six phases pour éviter un double comptage.');
  requireText(atelier.duration?.waitingNote, 'duration.waitingNote', 10);
  const allergens = atelier.allergens;
  if (!allergens || !['none','declared'].includes(allergens.status) || !Array.isArray(allergens.items) ||
      (allergens.status === 'declared' && allergens.items.length === 0) ||
      (allergens.status === 'none' && allergens.items.length !== 0))
    errors.push('allergens : déclarer une liste non vide, ou explicitement none et [].');
  if (allergens?.status === 'declared') for (const item of allergens.items) requireText(item, 'allergens.items[]', 3);
  const names = (recipe?.ingredients || []).map(x => x.name.toLowerCase()).join(' ');
  const recognisable = /sauce de poisson|sauce d.hu.tre|sauce soja|arachide|cacahu.te|crevette|poisson|lait de vache|œuf|oeuf|beurre|farine de bl./i;
  if (allergens?.status === 'none' && recognisable.test(names))
    errors.push('Allergène probable dans la recette ; expliciter allergens, ne pas déclarer none sans vérification.');
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
  const trialNames = trialIngredients.map(item => item.name);
  const allowedNames = new Set([...canonicalIngredients,...trialNames]);
  if (allowedNames.size !== canonicalIngredients.size + trialNames.length) errors.push('Les ingrédients d’essai doivent être différents de ceux de la recette canonique, sans doublons.');
  const ingredientsSeen = new Set();
  const trialSeen = new Set();
  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    if (!phase || typeof phase !== 'object') { errors.push('phase ' + (i + 1) + ' invalide'); continue; }
    if (phase.id !== PHASE_IDS[i]) errors.push('Phase ' + (i + 1) + ' : ID attendu ' + PHASE_IDS[i]);
    requireText(phase.title, 'phases[' + i + '].title', 15);
    if (!Number.isInteger(phase.minutes) || phase.minutes <= 0) errors.push('Temps de phase invalide : ' + phase.id);
    const names = phase.ingredientNames;
    if (!Array.isArray(names)) errors.push('ingredientNames doit être un tableau : ' + phase.id);
    else for (const name of names) {
      if (!allowedNames.has(name)) errors.push('Ingrédient absent de la recette canonique et des réserves déclarées : ' + name);
      if (i > 0) {
        if (canonicalIngredients.has(name)) ingredientsSeen.add(name);
        if (trialNames.includes(name)) trialSeen.add(name);
      }
    }
    for (const field of ['actions']) {
      const actions = requireArray(phase[field], phase.id + '.' + field, 2);
      actions.forEach(action => requireText(action, phase.id + '.actions[]', 45));
    }
    for (const field of ['observe', 'check', 'mistake', 'recovery', 'learning', 'safety']) requireText(phase[field], phase.id + '.' + field, 24);
    requireText(phase.audioScript, phase.id + '.audioScript', 90);
    if (typeof phase.audioScript === 'string' && phase.audioScript.length > 1200) errors.push('Chapitre trop long à relire : ' + phase.id);
    const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
    const narration = normalize(phase.audioScript);
    if (phase.actions?.some(action => {
      const actionText = normalize(action);
      return actionText.length >= 45 && narration.includes(actionText);
    })) errors.push('Le script audio répète un bloc d’action écrit : ' + phase.id);
    requireText(phase.pausePrompt, phase.id + '.pausePrompt', 20);
  }
  if (recipe && phases.length === 6) for (const ingredient of recipe.ingredients) {
    if (!ingredientsSeen.has(ingredient.name)) errors.push('Ingrédient de recette non affecté à une phase active de cuisine : ' + ingredient.name);
  }
  for (const name of trialNames) if (!trialSeen.has(name)) errors.push('Ingrédient d’essai non affecté à une phase active : ' + name);
  if (phases.length === 6 && Number.isInteger(atelier.duration?.practicalMinutes)) {
    const total = phases.reduce((sum,phase) => sum + (Number.isInteger(phase.minutes) ? phase.minutes : 0),0);
    if (total !== atelier.duration.practicalMinutes) errors.push('Durée incohérente : la somme des six phases doit être égale à duration.practicalMinutes.');
  }
  const audio = atelier.audio || {};
  if (audio.mode !== 'guided-cooking') errors.push('Audio doit être un accompagnement guidé.');
  if (audio.status !== 'script_only' && audio.status !== 'generated_review_pending' && audio.status !== 'validated') errors.push('audio.status invalide.');
  if (audio.voice !== 'coral') errors.push('Voix non prise en charge : seul coral est autorisé par le générateur existant.');
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
    const asset = audio.asset;
    if (!asset || typeof asset !== 'object' || !/^\/audio\/workshops\/[a-z0-9-]+\/[^/]+[.]mp3$/.test(asset.audioUrl || '') ||
        !Number.isFinite(asset.durationSec) || asset.durationSec <= 0 ||
        !/^[a-f0-9]{64}$/.test(asset.sha256 || '') ||
        !Array.isArray(asset.chapters) || asset.chapters.length !== 7 ||
        asset.chapters.some((part,index) => {
          const expected = index === 0 ? 'intro' : PHASE_IDS[index - 1];
          return part.id !== expected || !Number.isFinite(part.startSec) ||
            !Number.isFinite(part.endSec) || part.endSec <= part.startSec ||
            (index > 0 && Math.abs(part.startSec - asset.chapters[index-1].endSec) > 0.03);
        }) || Math.abs((asset.chapters.at(-1)?.endSec || 0) - asset.durationSec) > 0.2 ||
        Math.abs(asset.chapters[0]?.startSec || 0) > 0.03) errors.push('NO GO : manifeste audio mesuré invalide ou incomplet (7 chapitres, durée, SHA256 et URL obligatoires).');
    if (typeof asset?.audioUrl === 'string' && asset.audioUrl.startsWith('/audio/workshops/')) {
      const audioFile = resolve('public', asset.audioUrl.slice(1));
      const publicRoot = resolve('public');
      const rel = relative(publicRoot,audioFile);
      if (rel.startsWith('..') || isAbsolute(rel) || !existsSync(audioFile) || !statSync(audioFile).isFile()) {
        errors.push('NO GO : MP3 réel manquant : ' + asset.audioUrl);
      } else {
        const bytes = readFileSync(audioFile);
        if (bytes.length < 1024 || !(bytes.subarray(0,3).toString() === 'ID3' || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)))
          errors.push('NO GO : fichier MP3 non valide.');
        if (createHash('sha256').update(bytes).digest('hex') !== asset.sha256) errors.push('NO GO : empreinte SHA256 du MP3 incorrecte.');
        try {
          const duration=Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',audioFile],{encoding:'utf8'}).trim());
          if (!Number.isFinite(duration) || Math.abs(duration-asset.durationSec)>0.2) errors.push('NO GO : la durée MP3 mesurée ne correspond pas au manifeste.');
        } catch { errors.push('NO GO : ffprobe obligatoire pour mesurer le MP3 avant publication.'); }
      }
    }
    if (audio.status !== 'validated' || !media.finishedPreparationImage || !media.imageValidated || !media.rightsValidated ||
        Object.values(review).some(value => value !== true)) errors.push('NO GO : gate final incomplet (audio, images, droits, validation humaine, tests).');
  }
  if ((atelier.status === 'release_ready' || options.checkMediaFiles) && media.finishedPreparationImage) {
    const root = resolve('public');
    const imagePath = resolve(root, media.finishedPreparationImage.replace(/^\//,''));
    const rel = relative(root,imagePath);
    if (!media.finishedPreparationImage.startsWith('/') || rel.startsWith('..') || isAbsolute(rel) ||
        !existsSync(imagePath) || !statSync(imagePath).isFile())
      errors.push('NO GO : photographie finale absente : ' + media.finishedPreparationImage);
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
  // En CI, contrôler automatiquement toute nouvelle fiche que l'on ajoute au catalogue.
  if (!files.length) {
    files.push('docs/ateliers/exemples/exemple-kroeung-jaune.json');
    const folder = 'src/data/atelier-recette-guides';
    if (existsSync(folder)) {
      for (const name of readdirSync(folder).filter(name => name.endsWith('.json')).sort()) files.push(join(folder, name));
    }
  }
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
