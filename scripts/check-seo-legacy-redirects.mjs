import { expectedWorkshopHtaccess, workshopCutoverApproved, legacyWorkshopRedirects, workshopRedirectRule } from './workshop-cutover-seo.mjs';
// SEO contract: one-hop historical links + canonical HTTPS/www + compiled OVH output.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const apache = read('public/.htaccess');
const lines = apache.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
const hostGuard = 'RewriteCond %{HTTP_HOST} ^(www[.])?cuisine-du-cambodge[.]com$ [NC]';
const expected = [
  'RewriteRule ^recettes-cambodgiennes/?$ https://www.cuisine-du-cambodge.com/recettes/ [R=301,L,NE]',
  'RewriteRule ^le-riz-symbole-de-vie-au-cambodge/?$ https://www.cuisine-du-cambodge.com/culture/le-riz-symbole-de-vie-au-cambodge/ [R=301,L,NE]',
  'RewriteRule ^recettes/recettes_khmeres_poulet_curry[.]php$ https://www.cuisine-du-cambodge.com/recettes/curry-poulet-khmer/ [R=301,L,NE]',
  'RewriteRule ^nom-krob-totim-dessert-cambodgien-tapioca/?$ https://www.cuisine-du-cambodge.com/recettes/nom-krob-totim/ [R=301,L,NE]',
  'RewriteRule ^recette-cambodgienne-samla-mchou-yuan/?$ https://www.cuisine-du-cambodge.com/recettes/samla-mchou-yuon/ [R=301,L,NE]'
];
assert.ok(lines.includes('RewriteEngine On'), 'Apache mod_rewrite must be enabled');
assert.ok(!lines.some((line) => line.startsWith('RedirectMatch ') || line.startsWith('Redirect 301 ')),
  'Mixed mod_alias redirects could create additional hops for legacy URLs');
for (const rule of expected) {
  const at = lines.indexOf(rule);
  assert.ok(at > 0, `Missing exact historical 301: ${rule}`);
  assert.equal(lines[at - 1], hostGuard, `Missing same-domain guard before ${rule}`);
}
assert.ok(!/les-marches-cambodgiens/.test(apache),
  'Do not invent an editorially unrelated redirect for the unresolved market citation');

const canonical = [
  'RewriteCond %{HTTP_HOST} ^cuisine-du-cambodge[.]com$ [NC]',
  'RewriteRule ^(.*)$ https://www.cuisine-du-cambodge.com/$1 [R=301,L,NE]',
  'RewriteCond %{HTTP_HOST} ^www[.]cuisine-du-cambodge[.]com$ [NC]',
  'RewriteCond %{HTTPS} !=on',
  'RewriteRule ^(.*)$ https://www.cuisine-du-cambodge.com/$1 [R=301,L,NE]'
];
const afterLegacy = lines.slice(lines.indexOf(expected.at(-1)) + 1);
let last = -1;
for (const token of canonical) {
  const idx = afterLegacy.indexOf(token, last + 1);
  assert.ok(idx > last, `Canonical redirection missing or out of order: ${token}`);
  last = idx;
}
assert.equal(lines.filter((line) => line.startsWith('RewriteRule ')).length, 7,
  'Exactly five historical and two canonical redirect rules expected');

const culture = read('src/data/culture.ts');
assert.ok(culture.includes("slug: 'le-riz-symbole-de-vie-au-cambodge'"), 'Cultural target missing');
assert.ok(existsSync('src/pages/recettes/index.astro'), 'Recipe index missing');
const restored = read('src/data/restoredRecipes.ts');
const sitemapSource = read('src/pages/sitemap.xml.ts');
const index = read('src/pages/recettes/index.astro');
const template = read('src/components/RestoredRecipe.astro');
assert.ok(template.includes('recipeJsonLd') && template.includes('schema.org'), 'Recipe schema missing');
for (const slug of ['curry-poulet-khmer', 'nom-krob-totim', 'samla-mchou-yuon']) {
  assert.ok(restored.includes(`slug: '${slug}'`), `Recipe data missing: ${slug}`);
  assert.ok(existsSync(`src/pages/recettes/${slug}.astro`), `Recipe page missing: ${slug}`);
}
assert.ok(sitemapSource.includes('restoredRecipes.map'), 'Sitemap missing restored recipes');
assert.ok(index.includes('restoredRecipes.map'), 'Catalog missing historical recipe links');

if (existsSync('dist/')) {
  assert.ok(existsSync('dist/.htaccess'), 'Compiled Apache redirect file missing');
  assert.equal(read('dist/.htaccess'), expectedWorkshopHtaccess(apache), 'Compiled .htaccess differs from gated source');
  if(workshopCutoverApproved()){
    for(const [from,to] of legacyWorkshopRedirects)
      assert.ok(read('dist/.htaccess').includes(workshopRedirectRule(from,to)),'Missing workshop 301 '+from);
  } else assert.ok(!read('dist/.htaccess').includes('RewriteRule ^apprendre/'),'Early 301 to a noindex draft');
  for (const file of [
    'dist/recettes/curry-poulet-khmer/index.html',
    'dist/recettes/nom-krob-totim/index.html',
    'dist/recettes/samla-mchou-yuon/index.html',
    'dist/culture/le-riz-symbole-de-vie-au-cambodge/index.html'
  ]) assert.ok(existsSync(file), `Missing destination after build: ${file}`);
  const sitemap = read('dist/sitemap.xml');
  for (const slug of ['curry-poulet-khmer', 'nom-krob-totim', 'samla-mchou-yuon'])
    assert.ok(sitemap.includes(`/recettes/${slug}/`), `Sitemap missing: ${slug}`);
}
console.log('PASS: five one-hop historical redirects, canonical host and protocol, 3 recipes and build outputs');
