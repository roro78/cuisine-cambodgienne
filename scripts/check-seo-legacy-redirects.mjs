// Historical-link recovery contract — safe redirects, restored pages and OVH output.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const apache = read('public/.htaccess');
const lines = apache.split(/\r?\n/).map((line) => line.trim());
const expected = [
  'RedirectMatch 301 ^/recettes-cambodgiennes/?$ https://www.cuisine-du-cambodge.com/recettes/',
  'RedirectMatch 301 ^/le-riz-symbole-de-vie-au-cambodge/?$ https://www.cuisine-du-cambodge.com/culture/le-riz-symbole-de-vie-au-cambodge/',
  'RedirectMatch 301 ^/recettes/recettes_khmeres_poulet_curry[.]php$ https://www.cuisine-du-cambodge.com/recettes/curry-poulet-khmer/',
  'RedirectMatch 301 ^/nom-krob-totim-dessert-cambodgien-tapioca/?$ https://www.cuisine-du-cambodge.com/recettes/nom-krob-totim/',
  'RedirectMatch 301 ^/recette-cambodgienne-samla-mchou-yuan/?$ https://www.cuisine-du-cambodge.com/recettes/samla-mchou-yuon/'
];
for (const rule of expected) assert.ok(lines.includes(rule), `Missing exact Apache 301: ${rule}`);
assert.equal(lines.filter((line) => line.startsWith('RedirectMatch 301 ')).length, expected.length,
  'Review any extra historical redirects before releasing');
assert.ok(!/les-marches-cambodgiens/.test(apache),
  'Undocumented redirect: these old URLs are not yet confirmed editorial matches');

const culture = read('src/data/culture.ts');
assert.ok(culture.includes("slug: 'le-riz-symbole-de-vie-au-cambodge'"), 'Restored rice article missing');
assert.ok(existsSync('src/pages/recettes/index.astro'), 'Recipe index missing');
const restored = read('src/data/restoredRecipes.ts');
const sitemapSource = read('src/pages/sitemap.xml.ts');
const index = read('src/pages/recettes/index.astro');
const template = read('src/components/RestoredRecipe.astro');
assert.ok(template.includes("recipeJsonLd") && template.includes("schema.org"), 'Recipe schema missing');
for (const slug of ['curry-poulet-khmer', 'nom-krob-totim', 'samla-mchou-yuon']) {
  assert.ok(restored.includes(`slug: '${slug}'`), `Recipe data missing: ${slug}`);
  assert.ok(existsSync(`src/pages/recettes/${slug}.astro`), `Recipe route missing: ${slug}`);
}
assert.ok(sitemapSource.includes('restoredRecipes.map'), 'Restored recipes missing from sitemap');
assert.ok(index.includes('restoredRecipes.map'), 'No internal links from recipe catalogue');

if (existsSync('dist/')) {
  assert.ok(existsSync('dist/.htaccess'), 'Compiled Apache redirect file missing');
  assert.equal(read('dist/.htaccess'), apache, 'Compiled redirect content differs');
  const expectedHtml = [
    'dist/recettes/curry-poulet-khmer/index.html',
    'dist/recettes/nom-krob-totim/index.html',
    'dist/recettes/samla-mchou-yuon/index.html',
    'dist/culture/le-riz-symbole-de-vie-au-cambodge/index.html'
  ];
  for (const path of expectedHtml) assert.ok(existsSync(path), `Built destination missing: ${path}`);
  assert.ok(existsSync('dist/sitemap.xml'), 'Built sitemap missing');
  const sitemap = read('dist/sitemap.xml');
  for (const slug of ['curry-poulet-khmer', 'nom-krob-totim'])
    assert.ok(sitemap.includes(`/recettes/${slug}/`), `Sitemap missing: ${slug}`);
}
console.log('PASS: five relevant 301 rules, historical recipes, sitemap and deployment artefacts.');
