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

/* V18: every public Khmer recipe must have a real local image, including the
 * three additional dishes and the five cards that previously had placeholders.
 * The actual file must exist in Git; referencing a future URL is not enough. */
const blocks=[...recipes.matchAll(/^    slug:\s*'([^']+)'/gm)].map((m,i,a)=>
  ({slug:m[1],source:recipes.slice(m.index,a[i+1]?.index ?? recipes.length)}));
if(blocks.length!==13) failures.push(`V18 expects 13 recipe sheets, found ${blocks.length}`);
for(const {slug,source} of blocks){
  const image=source.match(/^    image:\s*'([^']+)'/m)?.[1];
  if(!image) failures.push(`Recipe ${slug} has no photographic illustration`);
  else if(!fs.existsSync('public'+image)) failures.push(`Recipe ${slug} references missing image ${image}`);
  if(!/^    imageWidth:\s*\d+/m.test(source) || !/^    imageHeight:\s*\d+/m.test(source))
    failures.push(`Recipe ${slug} is missing intrinsic photo dimensions`);
}
for(const slug of ['samlor-kako','cha-kroeung','num-plae-ai'])
  if(!slugs.includes(slug)) failures.push(`V18 new Khmer recipe missing: ${slug}`);
if(!detail.includes('recipe-v18-more-card') || !detail.includes('relatedRecipes.map'))
  failures.push('V18 recipe sheets must cross-link additional photographed recipes');


if (!recipes.includes('baseServings: number')) failures.push('Recipe model must expose baseServings');
if (!recipes.includes('quantity?: number')) failures.push('Recipe ingredients must expose numeric quantities');
if (!recipes.includes('cue?: string') || !recipes.includes('mistake?: string')) failures.push('Guided recipe steps must expose cue and mistake fields');

if (!detail.includes('data-recipe-servings-root')) failures.push('Recipe detail must render servings controls');
if (!detail.includes('data-ingredient-quantity')) failures.push('Recipe detail must expose scalable ingredient quantities');
if (!detail.includes('data-serving-summary aria-live="polite"') ||
    !servings.includes("summary.textContent = `${current} personne${current > 1 ? 's' : ''}`")) {
  failures.push('Recipe hero servings must stay in sync with the adjustable ingredient quantities');
}
if (!detail.includes('totalMinutes(recipe.cookTime) > 0 && <div><dt>Cuisson</dt>') ||
    !detail.includes('...(totalMinutes(recipe.cookTime) > 0 ? { cookTime:')) {
  failures.push('Uncooked recipe detail must not show an invented zero-minute cooking step in the facts or schema');
}
if (!detail.includes('data-ingredient-check')) failures.push('Recipe detail must expose ingredient checklist controls');
if (!detail.includes('data-guided-step')) failures.push('Recipe detail must render guided steps');
if (!detail.includes('Le bon repère') || !detail.includes('À éviter')) failures.push('Recipe detail must teach cues and common mistakes');
if (!detail.includes('getGlossaryEntries(recipe.glossarySlugs ?? recipe.relatedIngredients ?? [])')) failures.push('Recipe detail must use per-recipe glossary metadata without restrictive whitelists');

if (!servings.includes('currentEls.forEach')) failures.push('All visible serving counters must update together');
if (!servings.includes('original * factor')) failures.push('Ingredient quantities must scale from base servings');
if (!servings.includes("data.scalable !== 'false'") && !servings.includes("dataset.scalable !== 'false'")) failures.push('Non-scalable ingredients must stay fixed');

const sharedHeroUsed = listing.includes('<EditorialSectionHero');
const culinaryIntro = listing.includes('les ingrédients, les quantités et les gestes');
if (!(culinaryIntro || (listing.includes('Quantités pour chaque plat') && listing.includes('Préparation pas à pas')))) {
  failures.push('Recipe listing must clearly explain ingredients, quantities and cooking steps');
}
if (!listing.includes('data-recipe-filter="soupe"') || !listing.includes('data-recipe-filter="dessert"')) failures.push('Recipe catalog must expose broader discovery filters');

const heroVisual = listing.match(/<div class="recipes-journey-visual"[\s\S]*?<\/div>/)?.[0] ?? '';
const heroFigures = (heroVisual.match(/<figure>/g) ?? []).length;
if (sharedHeroUsed) {
  const sharedHero = fs.readFileSync('src/components/EditorialSectionHero.astro','utf8');
  if ((listing.match(/<EditorialSectionHero/g) ?? []).length !== 1 ||
      !listing.includes('image="/images/cuisine/kroeung-1600.webp"') ||
      (sharedHero.match(/<figure\b/g) ?? []).length !== 1 ||
      !sharedHero.includes('fetchpriority="high"')) {
    failures.push('Shared glossary-style recipe introduction must render one meaningful, eagerly loaded photograph');
  }
} else if (heroFigures !== 1) {
  failures.push(`V16 recipe hero must render exactly one primary image, found ${heroFigures}`);
}
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

if (!detail.includes('Ne goûtez jamais une préparation contenant de la viande, du poisson ou des œufs crus.') || detail.includes('Prenez votre temps, goûtez et ajustez.')) {
  failures.push('Guided method must not use a generic invitation to taste potentially raw food');
}
if (!amok.includes('poisson et les œufs sont complètement cuits avant de servir')) {
  failures.push('Amok FAQ must require complete cooking before serving');
}

if (listing.includes('{recipe.prepTime} + {recipe.cookTime}')) failures.push('Catalog must not display 0 min for uncooked preparations');
if (!listing.includes('minutes(recipe.cookTime) > 0') || !listing.includes('de préparation')) failures.push('Catalog must distinguish preparation from cooking without inventing times');


const recipeBlocks = recipes.split(/\r?\n  \{\r?\n    slug: '/).slice(1);
const withTips = recipeBlocks.filter((block) =>
  /\r?\n    beforeYouStart: '[^\r\n]+'/.test(block) &&
  /\r?\n    prepHeading: '[^\r\n]+'/.test(block) &&
  /\r?\n    servingTip: '[^\r\n]+'/.test(block) &&
  /\r?\n    servingHeading: '[^\r\n]+'/.test(block)
);
if (!recipes.includes('beforeYouStart?: string') || !recipes.includes('prepHeading?: string') ||
    !recipes.includes('servingTip?: string') || !recipes.includes('servingHeading?: string') ||
    withTips.length !== slugs.length) {
  failures.push('All structured recipes must include distinct practical preparation and serving notes');
}
if (!detail.includes('class="recipe-v15-kitchen-intro"') ||
    !detail.includes('recipe.beforeYouStart') || !detail.includes('recipe.prepHeading') ||
    !detail.includes('recipe.servingTip') || !detail.includes('recipe.servingHeading') ||
    !recipeCss.includes('.recipe-kitchen-note') ||
    !recipeCss.includes('.recipe-v15-kitchen-intro{grid-template-columns:1fr}')) {
  failures.push('Practical notes must render as accessible, responsive content before cooking controls');
}
const samlor = recipeSegment('samlor-machu');
if (!samlor.includes('Quand le poisson ou le poulet et les légumes sont cuits, ajoutez le tamarin') ||
    !samlor.includes('Le poisson ou le poulet doit être complètement cuit avant de goûter')) {
  failures.push('Samlor Machu must not prompt tasting a broth containing raw fish or poultry');
}

if (!detail.includes('aria-label="Accès rapide à la recette"') ||
    !detail.includes('href="#ingredients"') || !detail.includes('href="#etapes"') ||
    !detail.includes('class="recipe-v15-sidebar" id="ingredients"') ||
    !detail.includes('class="recipe-guided-method" id="etapes"')) {
  failures.push('Recipe hero quick links must lead to real ingredients and method anchors');
}
if (!v16Css.includes('.recipe-v16 .recipe-quick-links a:focus-visible') ||
    !v16Css.includes('scroll-margin-top:calc(var(--site-header-offset,4.75rem) + 1rem)')) {
  failures.push('Recipe quick links must be keyboard-visible with anchors clear of the fixed header');
}
if (!v16Css.includes('@media(max-width:900px)') ||
    !v16Css.includes('.recipe-v16 .recipe-v15-hero{min-height:0;gap:1.4rem}') ||
    !v16Css.includes('.recipe-v16 .recipe-v15-cover{aspect-ratio:4/3;max-height:42svh}') ||
    !v16Css.includes('@media(max-width:440px) and (max-height:420px)')) {
  failures.push('Mobile recipe hero must avoid an excessive full-viewport height without clipping at zoom');
}


if (failures.length) {
  console.error('Recipe contract failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Recipe contract OK — ${slugs.length} recipes`);
