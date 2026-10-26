import type { APIRoute } from 'astro';
import { recipes } from '../data/recipes';
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
  model: 'recipes' | 'restoredRecipes' | 'workshops' | 'cookingWorkshopGuides';
  fingerprint: string;
  editable: boolean;
  fields: Record<string, unknown>;
}
export function getGuidedEditorialFields(): GuidedItem[] {
  const out: GuidedItem[] = [];
  for (const recipe of recipes) out.push({
    id: 'recette:' + recipe.slug,
    model: 'recipes',
    fingerprint: editorialRecordFingerprint('recipes', recipe),
    editable: true,
    fields: {
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
      editable: false,
      // The full approved audioScript is deliberately excluded.
      fields: {phases: guide.phases.map(phase => ({
        id: phase.id, title: phase.title, learning: phase.learning
      }))}
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
  dataContract: 'approved-public-form-fields-v1',
  items: getGuidedEditorialFields()
}), {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=300',
    'X-Robots-Tag': 'noindex, nofollow'
  }
});
