import fs from 'node:fs';

const recipes = fs.readFileSync('src/data/recipes.ts','utf8');
const detail = fs.readFileSync('src/pages/recettes/[slug].astro','utf8');
const listing = fs.readFileSync('src/pages/recettes/index.astro','utf8');
const servings = fs.readFileSync('src/scripts/recipeServings.ts','utf8');
const recipeCss = fs.readFileSync('src/styles/recipe-v15.css','utf8');

const failures = [];

const slugs = [...recipes.matchAll(/slug:\s*'([^']+)'/g)].map((match) => match[1]);
if (slugs.length < 10) failures.push(`Expected at least 10 structured recipes, found ${slugs.length}`);

if (!recipes.includes('baseServings: number')) failures.push('Recipe model must expose baseServings');
if (!recipes.includes('quantity?: number')) failures.push('Recipe ingredients must expose numeric quantities');
if (!recipes.includes('cue?: string') || !recipes.includes('mistake?: string')) failures.push('Guided recipe steps must expose cue and mistake fields');

if (!detail.includes('data-recipe-servings-root')) failures.push('Recipe detail must render servings controls');
if (!detail.includes('data-ingredient-quantity')) failures.push('Recipe detail must expose scalable ingredient quantities');
if (!detail.includes('data-ingredient-check')) failures.push('Recipe detail must expose ingredient checklist controls');
if (!detail.includes('data-guided-step')) failures.push('Recipe detail must render guided steps');
if (!detail.includes('Le bon repère') || !detail.includes('À éviter')) failures.push('Recipe detail must teach cues and common mistakes');
if (!detail.includes('getGlossaryEntries(recipe.glossarySlugs ?? recipe.relatedIngredients ?? [])')) failures.push('Recipe detail must use per-recipe glossary metadata without restrictive whitelists');

if (!servings.includes('currentEls.forEach')) failures.push('All visible serving counters must update together');
if (!servings.includes('original * factor')) failures.push('Ingredient quantities must scale from base servings');
if (!servings.includes("data.scalable !== 'false'") && !servings.includes("dataset.scalable !== 'false'")) failures.push('Non-scalable ingredients must stay fixed');

if (!listing.includes('Portions ajustables') || !listing.includes('Étapes guidées')) failures.push('Recipe listing must advertise guided/scalable recipe value');
if (!listing.includes('data-recipe-filter="soupe"') || !listing.includes('data-recipe-filter="dessert"')) failures.push('Recipe catalog must expose broader discovery filters');

if (!recipeCss.includes('top:var(--site-header-offset, 4.75rem)')) failures.push('Sticky recipe filters must stay below the fixed site header');
if (!recipeCss.includes('top:calc(var(--site-header-offset, 4.75rem) + 1rem)')) failures.push('Sticky ingredients card must stay below the fixed site header');
if (!recipeCss.includes('.recipe-v15 .recipe-related,') || !recipeCss.includes('.recipe-v15 .recipe-back{')) failures.push('Trailing recipe content must retain horizontal page gutters');

const requiredGlossaryContracts = [
  "glossarySlugs: ['amok', 'kroeung', 'combava', 'lait-de-coco', 'sucre-de-palme']",
  "glossarySlugs: ['poivre-de-kampot', 'lok-lak']",
  "glossarySlugs: ['kroeung', 'citronnelle', 'combava', 'galanga', 'curcuma']"
];
requiredGlossaryContracts.forEach((signature) => {
  if (!recipes.includes(signature)) failures.push(`Missing preserved glossary coverage: ${signature}`);
});

const requiredNewRecipes = ['bai-sach-chrouk','kuy-teav','num-banh-chok','num-pang','samlor-machu','prahok-ktis','chek-ktis'];
requiredNewRecipes.forEach((slug) => {
  if (!slugs.includes(slug)) failures.push(`Missing V15 recipe: ${slug}`);
});

if (failures.length) {
  console.error('Recipe contract failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Recipe contract OK — ${slugs.length} recipes`);
