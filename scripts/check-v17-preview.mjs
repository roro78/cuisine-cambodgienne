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
assert.equal(photos.length, 5, 'Cinq photos documentees sur le prototype V17');
assert.equal(new Set(photos).size, photos.length, 'Ne pas reutiliser la meme photo sur le prototype');
assert.match(page, /v17-amok-rice-960\.jpg 960w, \/images\/cuisine\/v17-amok-rice-1920\.jpg 1920w/);
assert.match(page, /Amok — sharonang, CC0 1\.0/);
assert.match(page, /https:\/\/commons\.wikimedia\.org\/wiki\/File:Fish_Amok_with_Rice\.jpg/);
for (const width of [960, 1920]) {
  assert.ok(fs.existsSync(`public/images/cuisine/v17-amok-rice-${width}.jpg`), `Missing responsive V17 amok photo (${width}px)`);
  assert.ok(fs.existsSync(`public/images/cuisine/v17-fruit-market-${width}.jpg`), `Missing responsive V17 market photo (${width}px)`);
}
assert.match(page, /v17-fruit-market-960\.jpg 960w, \/images\/cuisine\/v17-fruit-market-1920\.jpg 1920w/);
assert.match(page, /McKay Savage, CC BY 2\.0/);
assert.match(page, /Trilinguist, CC BY-SA 3\.0/);
assert.match(page, /https:\/\/commons\.wikimedia\.org\/wiki\/File:Red_Kroeung_Paste\.jpg/);
assert.ok(fs.existsSync('public/images/cuisine/v17-kroeung-final.jpg'), 'Missing documented final kroeung photograph');
assert.match(page, /La photo montre une pâte terminée, pas les étapes de notre atelier/);
assert.doesNotMatch(motion, /autoAlpha: 0/);
assert.doesNotMatch(page, /Au marché de Kep/);
for (const [, path] of page.matchAll(/'(\/images\/cuisine\/[^']+)'/g)) {
  assert.ok(fs.existsSync('public' + path), 'Image manquante : ' + path);
}
console.log('V17-01 preview contract: PASS (isolation, liens, accessibilite, photos et mouvement)');
