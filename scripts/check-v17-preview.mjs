import fs from 'node:fs';
import assert from 'node:assert/strict';

const page = fs.readFileSync('src/pages/v17-preview.astro','utf8');
const css = fs.readFileSync('src/styles/home-v17-preview.css','utf8');
const motion = fs.readFileSync('src/scripts/v17PreviewMotion.ts','utf8');
const homeV16 = fs.readFileSync('src/pages/index.astro','utf8');
const sitemap = fs.readFileSync('src/pages/sitemap.xml.ts','utf8');

assert.match(page, /<BaseLayout[\s\S]*?noindex/);
assert.match(page, /<h1 id="v17-hero-title"/);
assert.match(page, /DU GOÛT\./);
assert.match(page, /DU <span class="v17-hero-accent">CAMBODGE/);
assert.match(page, /<SiteHeader\s*\/>/, 'Reuse accessible V16 mobile navigation');
assert.match(page, /v17-hero-stage/);
assert.equal((page.match(/<section class="v17-(hero|market|gesture|table|finale)"/g)||[]).length,5);
assert.match(page, /data-v17-scene="market"/);
assert.match(page, /data-v17-scene="gesture"/);
assert.match(page, /data-v17-scene="table"/);
assert.match(page, /data-v17-scene="finale"/);
assert.match(page, /v17-illustration-chili/);
assert.match(page, /v17-illustration-leaf/);
assert.match(page, /Les dessins de feuilles et de piments sont décoratifs/);
assert.match(page, /href="\/recettes\/"/);
assert.match(page, /href="\/apprendre\/"/);
assert.match(page, /href="\/glossaire\/"/);
assert.match(page, /href="\/recettes\/amok-trey\/"/);
assert.match(page, /href="\/apprendre\/piler-aromates-au-mortier\/"/);
assert.match(page, /href="\/credits-photos\/"/);
assert.match(page, /sharonang, CC0 1\.0/);
assert.match(page, /McKay Savage, CC BY 2\.0/);
assert.match(page, /Trilinguist, CC BY-SA 3\.0/);
assert.match(page, /Jason Eppink, CC BY 2\.0/);
assert.doesNotMatch(page, /<form\b|localStorage|Stripe|set:html/);
assert.doesNotMatch(sitemap, /v17-preview/);
assert.doesNotMatch(homeV16, /v17-preview|home-v17-preview/);

assert.match(css, /--v17-white:\s*#fffdf7/);
assert.match(css, /--v17-orange:\s*#ff6339/);
assert.match(css, /--v17-lime:\s*#d9f16d/);
assert.match(css, /--v17-mango:\s*#ffcf43/);
assert.doesNotMatch(css, /--v17-serif|#203127|#934a38/);
assert.match(css, /@media\(max-width:760px\)/);
assert.match(css, /@media\(max-width:360px\)/);
assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
assert.match(css, /\.v17-skip-link:focus/);
function firstRule(selector) {
  const index = css.indexOf(selector + '{');
  assert.ok(index >= 0, 'Missing styling for ' + selector);
  return css.slice(index + selector.length + 1).split('}')[0];
}
for (const selector of ['.v17-hero-photo', '.v17-market-large', '.v17-market-small', '.v17-gesture-paste', '.v17-preview .v17-table-photo']) {
  const rule = firstRule(selector);
  assert.doesNotMatch(rule, /transform:\\s*rotate\\(/, selector + ' must not rotate like Polaroid');
  assert.doesNotMatch(rule, /box-shadow:\\s*(?!none)/, selector + ' must not have scrapbook shadow');
  assert.match(rule, /border:\\s*0/, selector + ' must have no thick frame');
}
assert.match(firstRule('.v17-market-collage'), /display:grid/);
assert.match(firstRule('.v17-market-large'), /border-radius:/);
assert.match(firstRule('.v17-market-small'), /border-radius:/);

assert.match(motion, /prefers-reduced-motion: no-preference/);
assert.match(motion, /\(min-width: 761px\)/);
assert.match(motion, /mm\.revert\(\)/);
assert.doesNotMatch(motion, /pin:\s*true|ScrollSmoother|autoAlpha: 0/);
assert.doesNotMatch(page, /v17-bridge-market|v17-bridge-table|v17-hero-serial/);

for(const width of [960,1920]){
  assert.ok(fs.existsSync(`public/images/cuisine/v17-amok-rice-${width}.jpg`));
  assert.ok(fs.existsSync(`public/images/cuisine/v17-fruit-market-${width}.jpg`));
}
for(const width of [640,1280]){
  assert.ok(fs.existsSync(`public/images/cuisine/v17-khmer-table-${width}.webp`));
}
assert.ok(fs.existsSync('public/images/cuisine/v17-kroeung-final.jpg'));
for (const [,path] of page.matchAll(/'(\/images\/cuisine\/[^']+)'/g)) {
  assert.ok(fs.existsSync('public' + path), 'Image missing: ' + path);
}
console.log('V17 Fresh & Bold contract: PASS — isolated, bright, linked, source credited');
