import type { APIRoute } from 'astro';
import { recipes } from '../data/recipes';
import { cultureArticles } from '../data/culture';
import { ingredientGuides } from '../data/ingredients';
import { recipeTechniqueGuides } from '../data/recipeTechniques';
import { restoredRecipes } from '../data/restoredRecipes';
import { workshops } from '../data/workshops';
import { releasedCookingWorkshopGuides, completeCookingWorkshopCutoverReady } from '../data/cookingWorkshopGuides';
import { editorialRecordFingerprint } from './editorial-source-index.json';

/**
 * Explicitly public, review-only form fields that already appear on rendered
 * recipe/lesson pages. Never export sources, scripts, unreleased workshops,
 * media metadata or backend configuration here.
 */
interface GuidedItem {
  id: string;
  model: 'recipes' | 'restoredRecipes' | 'workshops' | 'cookingWorkshopGuides' | 'culture' | 'ingredients' | 'recipeTechniques';
  fingerprint: string;
  editable: boolean;
  fields: Record<string, unknown>;
}
export function getGuidedEditorialFields(): GuidedItem[] {
  const out: GuidedItem[] = [];
  // Public copy only; never expose documentation sources, private reviews,
  // social approval state, audioScript, audio paths or internal media manifests.
  for (const article of cultureArticles) out.push({
    id: 'culture:' + article.slug, model: 'culture',
    fingerprint: editorialRecordFingerprint('culture', article),
    editable: true,
    fields: {
      eyebrow: article.eyebrow, intro: article.intro,
      seoDescription: article.seoDescription, readingTime: article.readingTime,
      sections: article.sections.map(section => ({
        title: section.title, paragraphs: [...section.paragraphs]
      }))
    }
  });
  for (const guide of ingredientGuides) out.push({
    id: 'ingredient:' + guide.slug, model: 'ingredients',
    fingerprint: editorialRecordFingerprint('ingredients', guide),
    editable: true,
    fields: {
      intro: guide.intro, seoDescription: guide.seoDescription, role: guide.role,
      ...Object.fromEntries(['deepDive','profile','uses','tips','choose','keep',
        'pairings','mistakes','seoKeywords'].map(key =>
          [key, [...guide[key as keyof typeof guide] as string[]]]))
    }
  });
  for (const guide of recipeTechniqueGuides) out.push({
    id: 'technique:' + guide.slug, model: 'recipeTechniques',
    fingerprint: editorialRecordFingerprint('recipeTechniques', guide),
    editable: true,
    fields: {
      description: guide.description, introduction: guide.introduction,
      preparation: guide.preparation, yieldLabel: guide.yieldLabel,
      supplies: [...guide.supplies],
      steps: guide.steps.map(step => ({...step})),
      alternatives: guide.alternatives.map(item => ({...item})),
      questions: guide.questions.map(item => ({...item}))
    }
  });
  for (const recipe of recipes) out.push({
    id: 'recette:' + recipe.slug,
    model: 'recipes',
    fingerprint: editorialRecordFingerprint('recipes', recipe),
    editable: true,
    fields: {
      intro: recipe.intro, description: recipe.description, context: recipe.context,
      ...(recipe.beforeYouStart ? {beforeYouStart:recipe.beforeYouStart}:{}),
      ...(recipe.prepHeading ? {prepHeading:recipe.prepHeading}:{}),
      ...(recipe.servingTip ? {servingTip:recipe.servingTip}:{}),
      ...(recipe.servingHeading ? {servingHeading:recipe.servingHeading}:{}),
      ...(recipe.servingsLabel ? {servingsLabel:recipe.servingsLabel}:{}),
      ...(recipe.moment ? {moment:recipe.moment}:{}),
      ...(recipe.location ? {location:recipe.location}:{}),
      ...(recipe.keyPoints ? {keyPoints:[...recipe.keyPoints]}:{}),
      ...(recipe.notes ? {notes:[...recipe.notes]}:{}),
      ...(recipe.substitutions ? {substitutions:[...recipe.substitutions]}:{}),
      ...(recipe.equipment ? {equipment:[...recipe.equipment]}:{}),
      ...(recipe.faqs ? {faqs:recipe.faqs.map(faq=>({...faq}))}:{}),
      baseServings: recipe.baseServings,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      ingredients: recipe.ingredients.map(i => ({
        name: i.name, ...(i.quantity !== undefined ? {quantity: i.quantity} : {}),
        ...(i.unit !== undefined ? {unit: i.unit} : {}),
        ...(i.note !== undefined ? {note: i.note} : {}),
        ...(i.group !== undefined ? {group: i.group} : {}),
        ...(i.scalable !== undefined ? {scalable: i.scalable} : {})
      })),
      steps: recipe.steps.map(step => ({...step}))
    }
  });
  for (const recipe of restoredRecipes) out.push({
    id: 'recette:' + recipe.slug,
    model: 'restoredRecipes',
    fingerprint: editorialRecordFingerprint('restoredRecipes', recipe),
    editable: true,
    fields: {
      kicker:recipe.kicker, description:recipe.description,
      intro:recipe.intro, servings:recipe.servings,
      ...(recipe.imageCaption ? {imageCaption:recipe.imageCaption}:{}),
      tips:[...recipe.tips],
      prepTime: recipe.prepTime, cookTime: recipe.cookTime,
      ingredients: [...recipe.ingredients],
      steps: recipe.steps.map(step => ({title: step.title, text: step.text}))
    }
  });
  if (completeCookingWorkshopCutoverReady) {
    for (const guide of releasedCookingWorkshopGuides) out.push({
      id: 'atelier:' + guide.slug,
      model: 'cookingWorkshopGuides',
      fingerprint: editorialRecordFingerprint('cookingWorkshopGuides', guide),
      editable: true,
      // Proposal of pedagogical wording, not a modification of approved audio.
      // NEVER export phase audioScript, MP3 URLs or release authorization.
      fields: {
        finalPreparation:guide.finalPreparation, learningGoal:guide.learningGoal,
        portionLabel:guide.portionLabel,
        beforeStarting:[...guide.beforeStarting], equipment:[...guide.equipment],
        phases: guide.phases.map(phase => ({
          id: phase.id, title: phase.title, learning: phase.learning
        }))
      }
    });
  } else {
    for (const workshop of workshops) out.push({
      id: 'atelier:' + workshop.slug,
      model: 'workshops',
      fingerprint: editorialRecordFingerprint('workshops', workshop),
      editable: true,
      fields: {
        steps: workshop.steps.map(step => ({
          title: step.title, action: step.action, observe: step.observe,
          cue: step.cue, success: step.success,
          ...(step.mistake !== undefined ? {mistake: step.mistake} : {})
        }))
      }
    });
  }
  return out.sort((a,b)=>a.id.localeCompare(b.id,'en'));
}
export const GET: APIRoute = () => new Response(JSON.stringify({
  product: 'cuisine-du-cambodge',
  schemaVersion: 1,
  dataContract: 'approved-public-form-fields-v2',
  items: getGuidedEditorialFields()
}), {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=300',
    'X-Robots-Tag': 'noindex, nofollow'
  }
});
