import fs from 'node:fs';
import assert from 'node:assert/strict';

const page = fs.readFileSync('src/pages/v17-preview.astro', 'utf8');
const css = fs.readFileSync('src/styles/home-v17-preview.css', 'utf8');
const motion = fs.readFileSync('src/scripts/v17PreviewMotion.ts', 'utf8');
const production = fs.readFileSync('src/pages/index.astro', 'utf8');
const sitemap = fs.readFileSync('src/pages/sitemap.xml.ts', 'utf8');

assert.match(page, /<BaseLayout[\s\S]*?noindex/);
assert.match(page, /aria-labelledby="v17-hero-title"/);
assert.match(page, /<h1 id="v17-hero-title">/);
assert.match(page, /href="\/recettes\/"/);
assert.match(page, /href="\/apprendre\/"/);
assert.match(page, /href="\/credits-photos\/"/);
assert.doesNotMatch(page, /<form\b|localStorage|fetch\(|Stripe|set:html/);
assert.doesNotMatch(sitemap, /v17-preview/);
assert.doesNotMatch(production, /v17-preview|home-v17-preview/);
assert.match(css, /@media\(max-width:760px\)/);
assert.match(css, /@media\(max-width:360px\)/);
assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
assert.match(css, /\.v17-preview a:focus-visible/);
assert.match(motion, /prefers-reduced-motion: no-preference/);
assert.match(motion, /media\.revert\(\)/);

const photos = [...page.matchAll(/src=\{images\.([A-Za-z]+)\}/g)].map((x) => x[1]);
assert.equal(photos.length, 4, 'Quatre photos documentees dont une nouvellement sourcee');
assert.equal(new Set(photos).size, photos.length, 'Ne pas reutiliser la meme photo sur le prototype');
assert.match(page, /v17-amok-rice-960\.jpg 960w, \/images\/cuisine\/v17-amok-rice-1920\.jpg 1920w/);
assert.match(page, /sharonang \(Wikimedia Commons, CC0 1\.0\)/);
assert.match(page, /https:\/\/commons\.wikimedia\.org\/wiki\/File:Fish_Amok_with_Rice\.jpg/);
for (const width of [960, 1920]) {
  assert.ok(fs.existsSync(`public/images/cuisine/v17-amok-rice-${width}.jpg`), `Missing responsive V17 photo (${width}px)`);
}
for (const [, path] of page.matchAll(/'(\/images\/cuisine\/[^']+)'/g)) {
  assert.ok(fs.existsSync('public' + path), 'Image manquante : ' + path);
}
console.log('V17-01 preview contract: PASS (isolation, liens, accessibilite, photos et mouvement)');
