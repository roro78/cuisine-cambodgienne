import fs from 'node:fs';

const header = fs.readFileSync('src/components/SiteHeader.astro','utf8');
const learn = fs.readFileSync('src/pages/apprendre/index.astro','utf8');
const culture = fs.readFileSync('src/pages/culture/index.astro','utf8');
const about = fs.readFileSync('src/pages/a-propos.astro','utf8');
const glossary = fs.readFileSync('src/pages/glossaire/index.astro','utf8');
const recipes = fs.readFileSync('src/pages/recettes/[slug].astro','utf8');
const home = fs.readFileSync('src/pages/index.astro','utf8');
const cultureData = fs.readFileSync('src/data/culture.ts','utf8');
const recipeData = fs.readFileSync('src/data/recipes.ts','utf8');
const ingredientData = fs.readFileSync('src/data/ingredients.ts','utf8');
const glossaryData = fs.readFileSync('src/data/glossary.ts','utf8');

const failures = [];

const requiredNav = ['Recettes','Glossaire','Ateliers','Carnets','À propos'];
requiredNav.forEach((label) => {
  if (!header.includes(`>${label}<`)) failures.push(`Header navigation missing: ${label}`);
});
if (header.includes('>Ingrédients<') || header.includes('>Apprendre<') || header.includes('>Culture<')) {
  failures.push('Header must use V16 editorial labels instead of Ingredients/Apprendre/Culture');
}
if (!header.includes('href="/glossaire/"') || !header.includes('href="/apprendre/"') || !header.includes('href="/culture/"')) {
  failures.push('V16 navigation routes are incomplete');
}

if (!learn.includes('Les ateliers') || !learn.includes('Apprendre les bons gestes, simplement.')) {
  failures.push('Learning page must remain workshop-led, not recipe-led');
}
const workshopBlock = learn.match(/const workshops = \[([\s\S]*?)\];\n\nconst schema/)?.[1] ?? '';
const workshopCount = (workshopBlock.match(/\bn:'\d{2}'/g) ?? []).length;
if (workshopCount !== 6) {
  failures.push(`Workshop page must expose exactly 6 V16 workshops, found ${workshopCount}`);
}

if (!culture.includes('Carnets du Cambodge') || !culture.includes('Des marchés animés aux repas partagés.')) {
  failures.push('Culture page must keep the Carnets editorial identity');
}

if (!about.includes('Une recette claire, avec de la place pour les variantes.') || !about.includes('Ce qui nous tient à cœur')) {
  failures.push('About page must keep the V16 editorial method and boundaries');
}

if (!glossary.includes('data-glossary-search') || !glossary.includes('data-glossary-family') || !glossary.includes('data-glossary-card')) {
  failures.push('Glossary must keep search, family filters and filterable entries');
}

if (!recipes.includes('recipe-v15 recipe-v16') || !recipes.includes('Prenez votre temps, goûtez et ajustez.')) {
  failures.push('Recipe detail must keep the V16 culinary editorial layer');
}

const toneCorpus = [home, learn, culture, about, glossary, recipes, cultureData, recipeData, ingredientData, glossaryData].join('\n');
const forbiddenArtificialCopy = [
  'Le Cambodge se mange tôt.',
  'Le produit donne le ton.',
  'On ne cuisine pas un plat seul.',
  'le prahok travaille en arrière-plan',
  'construire l’acidité',
  'terrain d’apprentissage',
  'comprendre cette architecture',
  'Une version praticable, pas une version universelle.',
  'Ce que le site ne veut pas devenir.',
  'Cuire, goûter, ajuster.'
];
forbiddenArtificialCopy.forEach((phrase) => {
  if (toneCorpus.toLowerCase().includes(phrase.toLowerCase())) {
    failures.push(`Artificial editorial phrasing reintroduced: ${phrase}`);
  }
});

if (failures.length) {
  console.error('Editorial contract failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Editorial contract OK — V16 navigation and page identities');
