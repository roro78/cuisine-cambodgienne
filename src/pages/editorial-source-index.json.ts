import type { APIRoute } from 'astro';
import { createHash } from 'node:crypto';
import { recipes } from '../data/recipes';
import { restoredRecipes } from '../data/restoredRecipes';
import { cultureArticles } from '../data/culture';
import { ingredientGuides } from '../data/ingredients';
import { workshops } from '../data/workshops';
import { cookingWorkshopGuides, completeCookingWorkshopCutoverReady, releasedCookingWorkshopGuides } from '../data/cookingWorkshopGuides';
import { recipeTechniqueGuides } from '../data/recipeTechniques';
import { getSocialCatalog } from '../data/socialCatalog';

/**
 * Public, non-secret revision INDEX, never a copy of the editorial body.
 * A complete record is hashed, including all ingredients, steps, scripts,
 * approved media metadata and references; none of those fields is exported.
 * This index is separate from social-feed.json and never affects n8n.
 */
type ContentKind = 'recette' | 'culture' | 'atelier' | 'ingredient' | 'technique';
type Item = { id: string; kind: ContentKind; model: string; fingerprint: string };
const records: Item[] = [];
function add(kind: ContentKind, slug: string, model: string, fullRecord: object): void {
  records.push({
    id: `${kind}:${slug}`, kind, model,
    fingerprint: createHash('sha256').update(JSON.stringify({ model, record: fullRecord })).digest('hex')
  });
}

export function getEditorialSourceIndex(): Item[] {
  records.length = 0;
  recipes.forEach(record => add('recette', record.slug, 'recipes', record));
  restoredRecipes.forEach(record => add('recette', record.slug, 'restoredRecipes', record));
  cultureArticles.forEach(record => add('culture', record.slug, 'culture', record));
  ingredientGuides.forEach(record => add('ingredient', record.slug, 'ingredients', record));
  if (completeCookingWorkshopCutoverReady) {
    releasedCookingWorkshopGuides.forEach(record => add('atelier', record.slug, 'cookingWorkshopGuides', record));
  } else {
    workshops.forEach(record => add('atelier', record.slug, 'workshops', record));
  }
  recipeTechniqueGuides.forEach(record => add('technique', record.slug, 'recipeTechniques', record));
  const ids = records.map(item => item.id);
  const socialIds = getSocialCatalog().map(item => item.id);
  if (ids.length !== new Set(ids).size ||
      ids.length !== socialIds.length ||
      ids.some(id => !socialIds.includes(id))) {
    throw new Error('editorial_index_catalog_mismatch');
  }
  return [...records].sort((a,b) => a.id.localeCompare(b.id,'en'));
}

export const GET: APIRoute = () => new Response(JSON.stringify({
  product: 'cuisine-du-cambodge',
  schemaVersion: 1,
  digest: 'sha256-full-astro-record-v1',
  items: getEditorialSourceIndex()
}), {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=300',
    'X-Robots-Tag': 'noindex, nofollow'
  }
});
