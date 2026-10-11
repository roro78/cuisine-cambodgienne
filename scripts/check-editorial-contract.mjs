import fs from 'node:fs';

const header = fs.readFileSync('src/components/SiteHeader.astro','utf8');
const navigation = fs.readFileSync('src/scripts/navigation.ts','utf8');
const globalStyles = fs.readFileSync('src/styles/global.css','utf8');
const learn = fs.readFileSync('src/pages/apprendre/index.astro','utf8');
const workshopDetail = fs.readFileSync('src/pages/apprendre/[slug].astro','utf8');
const workshopData = fs.readFileSync('src/data/workshops.ts','utf8');
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
const workshopCount = (workshopData.match(/\bn: '\d{2}'/g) ?? []).length;
if (workshopCount !== 6) {
  failures.push(`Workshop data must expose exactly 6 workshops, found ${workshopCount}`);
}
if (!learn.includes('href={`/apprendre/${workshop.slug}/`}') || !learn.includes('Commencer l’atelier')) {
  failures.push('Workshop cards must route to dedicated workshop detail pages');
}
if (!workshopDetail.includes("'@type': 'HowTo'") || !workshopDetail.includes('Vous avez réussi si…') || !workshopDetail.includes('Passer à la pratique')) {
  failures.push('Workshop detail must keep HowTo semantics, success cues and recipe practice links');
}
if (!recipes.includes('getWorkshopsForRecipe') || !recipes.includes('recipe-workshops')) {
  failures.push('Recipe detail must link back to relevant workshops');
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

if (!recipes.includes('recipe-v15 recipe-v16') || !recipes.includes('Les étapes, les gestes et les bons repères.')) {
  failures.push('Recipe detail must keep the V16 culinary editorial layer');
}

if (about.includes('Et si le goût ou la texture seront différents') || !about.includes('nous proposons un remplacement et expliquons ce qu’il change')) {
  failures.push('About ingredient substitutions must use natural, accurate French');
}
if (recipes.includes('Prenez votre temps, goûtez et ajustez.') ||
    !recipes.includes('Ne goûtez les préparations que lorsque leur composition le permet.')) {
  failures.push('Guided recipe headings cannot invite tasting raw ingredients');
}

const toneCorpus = [home, learn, workshopDetail, workshopData, culture, about, glossary, recipes, cultureData, recipeData, ingredientData, glossaryData].join('\n');
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

if (!culture.includes("href:'/recettes/kuy-teav/', cta:'Voir la recette →'")) failures.push('Morning card must link explicitly to the relevant noodle recipe');
if (culture.includes("title:'Au petit matin, les gargotes sont déjà ouvertes'")) failures.push('Morning culture card must not misleadingly link to generic meal article');
if (!culture.includes('<strong>{moment.cta}</strong>')) failures.push('Editorial cards must accurately label linked destination');

if (!navigation.includes("const desktopQuery = window.matchMedia('(min-width: 721px)')") ||
    !navigation.includes("desktopQuery.addEventListener('change', onViewportChange)") ||
    !navigation.includes("desktopQuery.removeEventListener('change', onViewportChange)")) {
  failures.push('Open mobile drawer must close and unlock scrolling when viewport becomes desktop');
}
if (!navigation.includes("event.key === 'Tab'") ||
    !navigation.includes("event.shiftKey && document.activeElement === first") ||
    !navigation.includes("focusables[0] ?? dialog") ||
    !navigation.includes("dialog?.contains(document.activeElement)")) {
  failures.push('Mobile modal must focus inside the dialog and contain keyboard navigation');
}
if (!header.includes('role="dialog" aria-modal="true" aria-labelledby="mobile-menu-title"') ||
    !header.includes('aria-label="Menu de navigation"')) {
  failures.push('Mobile drawer must declare the dialog role and consistent accessible name');
}
if (!navigation.includes('el.inert = open ? true') ||
    !navigation.includes('restoreBackground()') ||
    !navigation.includes("document.addEventListener('pointerdown', onOutsidePointer)") ||
    !navigation.includes("document.removeEventListener('pointerdown', onOutsidePointer)")) {
  failures.push('Mobile modal must isolate background and support backdrop dismissal with cleanup');
}
if (!globalStyles.includes('.mobile-menu summary:focus-visible') ||
    !globalStyles.includes('.mobile-menu-panel nav a:focus-visible')) {
  failures.push('Mobile navigation must display visible focus indicators');
}

if (!navigation.includes('if (closedForDesktop) brandLink?.focus()') ||
    !navigation.includes('(desktopQuery.matches ? brandLink : summary)?.focus()')) {
  failures.push('Closing mobile drawer on desktop resize must return focus to visible desktop navigation');
}

if (!header.includes('class="mobile-menu-close" type="button" aria-label="Fermer le menu"') ||
    !navigation.includes("const focusables = [closeButton, ...links]") ||
    !navigation.includes("closeButton?.addEventListener('click', closeMenu)") ||
    !navigation.includes("closeButton?.removeEventListener('click', closeMenu)")) {
  failures.push('Modal mobile drawer must have an accessible in-dialog close button in the focus cycle');
}
if (!globalStyles.includes('.mobile-menu summary:focus-visible{outline:3px solid #49351f') ||
    !globalStyles.includes('.site-nav[data-site-header].is-overlay-top .mobile-menu summary:focus-visible') ||
    !globalStyles.includes('.mobile-menu-close:focus-visible')) {
  failures.push('Mobile light-header summary focus ring must contrast; dark drawer controls need visible focus');
}

if (failures.length) {
  console.error('Editorial contract failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Editorial contract OK — V16 navigation and page identities');
