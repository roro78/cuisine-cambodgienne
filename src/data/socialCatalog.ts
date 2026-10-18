import { createHash } from 'node:crypto';
import { recipes } from './recipes';
import { ingredientGuides } from './ingredients';
import { cultureArticles } from './culture';
import { workshops } from './workshops';
import { recipeTechniqueGuides } from './recipeTechniques';

export type SocialSourceKind = 'recette' | 'ingredient' | 'culture' | 'atelier' | 'technique';
export interface SocialSource {
  id: string;
  kind: SocialSourceKind;
  title: string;
  url: string;
  summary: string;
  facts: string[];
  sourceReferences: string[];
  originalImageUrl: string | null;
  imageUrl: string | null;
  imageRole: 'article' | 'illustration' | 'none';
  fingerprint: string;
}

const BASE_URL = 'https://www.cuisine-du-cambodge.com';
const full = (path: string): string => new URL(path, BASE_URL).href;
const compact = (list: Array<string | undefined | null>, max = 8): string[] =>
  [...new Set(list.map(item => String(item ?? '').trim()).filter(Boolean))].slice(0, max);
const fingerprint = (value: object): string => createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 16);

const create = (
  kind: SocialSourceKind,
  slug: string,
  title: string,
  path: string,
  summary: string,
  facts: string[],
  sourceImage: string | undefined,
  imageRole: SocialSource['imageRole'] = 'article',
  sourceReferences: string[] = []
): SocialSource => {
  const image = sourceImage?.startsWith('/images/') ? sourceImage : null;
  const safeFacts = compact([summary, ...facts], 9);
  const source: SocialSource = {
    id: `${kind}:${slug}`,
    kind,
    title,
    url: full(path),
    summary,
    facts: safeFacts,
    sourceReferences,
    originalImageUrl: image ? full(image) : null,
    imageUrl: image ? full(`/social-assets/${kind}-${slug}.jpg`) : null,
    imageRole: image ? imageRole : 'none',
    fingerprint: ''
  };
  source.fingerprint = fingerprint({ title, summary, facts: safeFacts, image, sourceReferences });
  return source;
};

/** Build-time, editorially grounded catalog. No model-generated facts enter this feed. */
export function getSocialCatalog(): SocialSource[] {
  const items: SocialSource[] = [
    ...recipes.map(recipe => create(
      'recette', recipe.slug, recipe.title, `/recettes/${recipe.slug}/`, recipe.intro,
      [
        `Préparation : ${recipe.prepTime}. Cuisson : ${recipe.cookTime}.`,
        `Ingrédients : ${recipe.ingredients.map(ingredient => ingredient.name).join(', ')}.`,
        ...recipe.steps.slice(0, 3).map(step => `${step.title} : ${step.text}`),
        ...(recipe.keyPoints ?? []).slice(0, 2)
      ],
      recipe.image
    )),
    ...ingredientGuides.map(ingredient => create(
      'ingredient', ingredient.slug, ingredient.title, `/ingredients/${ingredient.slug}/`, ingredient.intro,
      [ingredient.role, ...ingredient.tips.slice(0, 3)], ingredient.image
    )),
    ...cultureArticles.map(article => create(
      'culture', article.slug, article.title, `/culture/${article.slug}/`, article.intro,
      [article.sections[0]?.paragraphs[0], ...article.sections.map(section => section.title)],
      article.image, 'article', article.sources.map(source => source.url)
    )),
    ...workshops.map(workshop => {
      // Only the mortier atelier has its own approved, on-page step photo in the catalog.
      // Other lessons must get a suitable, rights-reviewed visual before Instagram publishing.
      const image = workshop.slug === 'piler-aromates-au-mortier'
        ? '/images/workshops/mortier-etape-03.webp'
        : undefined;
      return create(
        'atelier', workshop.slug, workshop.title, `/apprendre/${workshop.slug}/`, workshop.intro,
        [workshop.objective, ...workshop.outcomes.slice(0, 3)], image
      );
    }),
    ...recipeTechniqueGuides.map(technique => create(
      'technique', technique.slug, technique.title, `/techniques/${technique.slug}/`, technique.description,
      [technique.introduction, ...technique.steps.slice(0, 2).map(step => `${step.title} : ${step.text}`)],
      technique.image
    ))
  ];
  const ids = items.map(item => item.id);
  if (ids.length !== new Set(ids).size) throw new Error('social_catalog_duplicate_ids');
  return items;
}
