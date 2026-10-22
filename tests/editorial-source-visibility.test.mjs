import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');

// Les références documentaires sont conservées en données et dans docs/,
// mais ne sont pas présentées sous forme de bibliographie dans les pages publiques.
const publicFiles = [
  'src/pages/culture/[slug].astro',
  'src/components/RestoredRecipe.astro',
  'src/pages/apprendre/pratique/[slug].astro',
  'src/pages/apprendre/pratique/kroeung-jaune.astro',
  'src/pages/a-propos.astro',
  'src/pages/recettes/index.astro',
];

const bannedDisplayExpressions = [
  /article\.sources\.map\s*\(/,
  /recipe\.sources\.map\s*\(/,
  /guide\.sources\.(?:culinaryReferences|safetyReferences)\.map\s*\(/,
  /workshop\.sources\.culinaryReferences\.map\s*\(/,
  /<\s*(?:h[1-6]|summary|p)[^>]*>\s*(?:Sources(?: utilisées| de l’atelier| des repères de sécurité alimentaire)?|Références culinaires)/i,
  /Les sources citées à la fin de chaque carnet/i,
  /chaque carnet indique les références utilisées/i,
];

for (const path of publicFiles) {
  const source = read(path);
  for (const banned of bannedDisplayExpressions) {
    assert.doesNotMatch(source, banned, `Public reference listing must not render in ${path}: ${banned}`);
  }
}

// La sécurité culinaire reste visible ; les références internes restent consultables pour la QA.
const workshop = read('src/pages/apprendre/pratique/[slug].astro');
assert.match(workshop, /Sécurité et allergènes/);
assert.match(workshop, /guide\.safety\.map/);
assert.match(read('src/data/culture.ts'), /sources:\s*\[/);
assert.match(read('src/data/restoredRecipes.ts'), /sources:\s*\[/);

// Attributions sous licence : les crédits photo NE sont PAS des bibliographies
// et ne doivent jamais être supprimés par ce nettoyage éditorial.
const credits = read('src/pages/credits-photos.astro');
assert.match(credits, /Crédits photos/);
assert.match(credits, /CC BY(?:-SA)?/);
assert.match(credits, /creativecommons\.org|commons\.wikimedia\.org/);
assert.match(read('src/components/SiteFooter.astro'), /href="\/credits-photos\/"/);

console.log('PASS: références éditoriales non affichées, sécurité et crédits photos conservés.');
