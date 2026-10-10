import fs from 'node:fs';

const recipes = fs.readFileSync('src/data/recipes.ts','utf8');
const detail = fs.readFileSync('src/pages/recettes/[slug].astro','utf8');
const listing = fs.readFileSync('src/pages/recettes/index.astro','utf8');
const servings = fs.readFileSync('src/scripts/recipeServings.ts','utf8');
const recipeCss = fs.readFileSync('src/styles/recipe-v15.css','utf8');
const v16Css = fs.readFileSync('src/styles/v16-editorial.css','utf8');

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

const heroVisual = listing.match(/<div class="recipes-journey-visual"[\s\S]*?<\/div>/)?.[0] ?? '';
const heroFigures = (heroVisual.match(/<figure>/g) ?? []).length;
if (heroFigures !== 1) failures.push(`V16 recipe hero must render exactly one primary image, found ${heroFigures}`);
if (heroVisual.includes('amok-1600.webp')) failures.push('V16 recipe hero must not preload the hidden/repeated Amok image');

if (!/@media\(max-width:900px\)[\s\S]*?\.recipes-v16 \.recipe-v15-card:nth-child\(1\)[\s\S]*?grid-column:auto/.test(v16Css)) failures.push('V16 recipe cards must reset editorial column spans below 900px');
if (!/@media\(max-width:620px\)[\s\S]*?\.recipe-v16 \.recipe-guided-step\{grid-template-columns:2\.8rem minmax\(0,1fr\);padding:1rem 0\}/.test(v16Css)) failures.push('V16 guided recipe steps must compact on mobile');

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

// Regressions in public food-safety copy must be caught even before the guided-dinner PR ships.
const recipeSegment = (slug) => recipes.split("slug: '" + slug + "',")[1]?.split(/\n  \{\n    slug: '/)[0] ?? '';
const amok = recipeSegment('amok-trey');
const prahok = recipeSegment('prahok-ktis');
if (!amok.includes('Ne goûtez plus la préparation après l’ajout des œufs crus ni après celui du poisson cru.')) {
  failures.push('Amok must forbid tasting after adding raw eggs or raw fish');
}
if (!amok.includes('Rectifier l’assaisonnement avant les œufs et le poisson crus')) {
  failures.push('Amok tasting must occur before raw eggs and fish are added');
}
if (!prahok.includes('Goûtez uniquement lorsque le porc et toute la préparation sont complètement cuits')) {
  failures.push('Prahok Ktis must not suggest tasting undercooked minced pork');
}
if (!prahok.includes('Ne goûtez jamais une préparation contenant du porc cru ou insuffisamment cuit.')) {
  failures.push('Prahok Ktis must warn against tasting raw pork');
}

if (listing.includes('{recipe.prepTime} + {recipe.cookTime}')) failures.push('Catalog must not display 0 min for uncooked preparations');
if (!listing.includes('minutes(recipe.cookTime) > 0') || !listing.includes('de préparation')) failures.push('Catalog must distinguish preparation from cooking without inventing times');

if (failures.length) {
  console.error('Recipe contract failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Recipe contract OK — ${slugs.length} recipes`);
