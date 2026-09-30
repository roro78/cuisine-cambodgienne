import fs from 'node:fs';

const header = fs.readFileSync('src/components/SiteHeader.astro','utf8');
const learn = fs.readFileSync('src/pages/apprendre/index.astro','utf8');
const culture = fs.readFileSync('src/pages/culture/index.astro','utf8');
const about = fs.readFileSync('src/pages/a-propos.astro','utf8');
const glossary = fs.readFileSync('src/pages/glossaire/index.astro','utf8');
const recipes = fs.readFileSync('src/pages/recettes/[slug].astro','utf8');

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

if (!learn.includes('Les ateliers') || !learn.includes('On n’apprend pas une cuisine en mémorisant des recettes.')) {
  failures.push('Learning page must remain workshop-led, not recipe-led');
}
if ((learn.match(/v16-workshop/g) ?? []).length < 6) {
  failures.push('Workshop page must expose the V16 hands-on workshop structure');
}

if (!culture.includes('Carnets du Cambodge') || !culture.includes('Des marchés du matin aux grandes tables.')) {
  failures.push('Culture page must keep the Carnets editorial identity');
}

if (!about.includes('Une version praticable, pas une version universelle.') || !about.includes('Ce que le site ne veut pas devenir.')) {
  failures.push('About page must keep the V16 editorial method and boundaries');
}

if (!glossary.includes('data-glossary-search') || !glossary.includes('data-glossary-family') || !glossary.includes('data-glossary-card')) {
  failures.push('Glossary must keep search, family filters and filterable entries');
}

if (!recipes.includes('recipe-v15 recipe-v16') || !recipes.includes('Cuire, goûter, ajuster.')) {
  failures.push('Recipe detail must keep the V16 culinary editorial layer');
}

if (failures.length) {
  console.error('Editorial contract failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Editorial contract OK — V16 navigation and page identities');
