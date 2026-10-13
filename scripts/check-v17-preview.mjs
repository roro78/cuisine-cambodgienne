import fs from 'node:fs';
import assert from 'node:assert/strict';

const page = fs.readFileSync('src/pages/v17-preview.astro','utf8');
const css = fs.readFileSync('src/styles/home-v17-preview.css','utf8');
const motion = fs.readFileSync('src/scripts/v17PreviewMotion.ts','utf8');
const airy = fs.readFileSync('src/styles/home-v17-air.css','utf8');
const homeV16 = fs.readFileSync('src/pages/index.astro','utf8');
const sitemap = fs.readFileSync('src/pages/sitemap.xml.ts','utf8');

assert.match(page, /<BaseLayout[\s\S]*?noindex/);
assert.match(page, /<h1 id="v17-hero-title"/);
assert.match(page, /LE CAMBODGE/);
assert.match(page, /DANS VOTRE <em class="v17-hero-accent">ASSIETTE/);
assert.match(page, /<SiteHeader\s*\/>/, 'Reuse accessible V16 mobile navigation');
assert.match(page, /home-v17-air\.css/);
assert.doesNotMatch(page, /class="v17-marquee"|class="v17-sticker/);
assert.match(airy, /\.v17-shell \.v17-market-head h2\{/);
assert.match(airy, /\.v17-shell \.v17-pantry-heading h2\{/);
assert.match(airy, /\.v17-shell \.v17-finale\{/);
assert.match(airy, /text-align:right/);
assert.match(airy, /text-align:center/);
assert.match(airy, /text-align:left/);
assert.match(airy, /max-width:760px/);
assert.doesNotMatch(airy, /scroll-snap-type|position:\s*fixed/);
assert.match(page, /v17-hero-stage/);
assert.equal((page.match(/<section class="v17-(hero|market|pantry|gesture|table|sweets|finale)"/g)||[]).length,7);
assert.match(page, /data-v17-scene="market"/);
assert.match(page, /data-v17-scene="gesture"/);
assert.match(page, /data-v17-scene="table"/);
assert.match(page, /data-v17-scene="finale"/);
assert.match(page, /v17-hero-chili/);
assert.match(page, /data-v17-ingredient="left"/);
assert.match(page, /data-v17-ingredient="top"/);
assert.match(page, /data-v17-ingredient="right"/);
assert.match(page, /data-v17-sweet="left"/);
assert.match(page, /data-v17-sweet="right"/);
assert.match(page, /href="\/recettes\/chek-ktis\/"/);
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
assert.match(page, /Marie, CC BY-SA 2\.0/);
assert.match(page, /MoonsMoon, CC BY 4\.0/);
assert.match(page, /Spicy Anonymous, CC0/);
assert.match(page, /Liza Daly, domaine public/);
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
  assert.doesNotMatch(rule, /transform:\s*rotate\(/, selector + ' must not rotate like Polaroid');
  assert.doesNotMatch(rule, /box-shadow:\s*(?!none)/, selector + ' must not have scrapbook shadow');
  assert.match(rule, /border:\s*0/, selector + ' must have no thick frame');
}
assert.match(firstRule('.v17-market-collage'), /display:grid/);
assert.match(firstRule('.v17-market-large'), /border-radius:/);
assert.match(firstRule('.v17-market-small'), /border-radius:/);

assert.match(motion, /prefers-reduced-motion: no-preference/);
assert.match(motion, /\(min-width: 761px\)/);
assert.match(motion, /mm\.revert\(\)/);
assert.doesNotMatch(motion, /pin:\s*true|ScrollSmoother|autoAlpha: 0/);
assert.doesNotMatch(page, /v17-bridge-market|v17-bridge-table|v17-hero-serial/);
assert.match(motion, /data-v17-ingredient/);
assert.match(motion, /data-v17-sweet/);
assert.match(motion, /scrub: \.8/);
assert.match(motion, /scrub: \.75/);
assert.doesNotMatch(motion, /pin:\s*true|ScrollSmoother|window\.scrollTo/);
assert.match(css, /\.v17-pantry-stage\{/);
assert.match(css, /\.v17-sweets-gallery\{/);
assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);

for(const width of [960,1920]){
  assert.ok(fs.existsSync(`public/images/cuisine/v17-amok-rice-${width}.jpg`));
  assert.ok(fs.existsSync(`public/images/cuisine/v17-fruit-market-${width}.jpg`));
}
for(const width of [640,1280]){
  assert.ok(fs.existsSync(`public/images/cuisine/v17-khmer-table-${width}.webp`));
}
assert.ok(fs.existsSync('public/images/cuisine/v17-kroeung-final.jpg'));
for (const name of ['v17-chek-ktis-960.jpg','v17-num-kom-900.jpg','v17-galangal-1000.jpg','v17-chili-450.png']) {
  assert.ok(fs.existsSync('public/images/cuisine/' + name), 'New V17.3 licensed media missing: ' + name);
}
for (const [,path] of page.matchAll(/'(\/images\/cuisine\/[^']+)'/g)) {
  assert.ok(fs.existsSync('public' + path), 'Image missing: ' + path);
}

// V17.4: creative gate: all editorial photos have intentionally non-square crops.
// Small transparent ingredient cutouts and decorative SVGs are not photo cards.
for (const selector of ['.v17-hero-photo', '.v17-market-large', '.v17-market-small',
                       '.v17-gesture-paste img', '.v17-preview .v17-table-photo',
                       '.v17-sweets-feature img', '.v17-sweets-secondary img']) {
  const rule = firstRule(selector);
  assert.match(rule, /aspect-ratio:/, selector + ' must declare an intentional crop');
  assert.doesNotMatch(rule, /aspect-ratio:\s*1(?:[;\s]|$)/,
    selector + ' must not use a square 1:1 photo');
}
assert.match(motion, /clipPath: 'inset\(0% 24% 0% 0%\)'/);
assert.match(motion, /clipPath: 'inset\(0% 0% 0% 0%\)'/);
for (const scene of ['market','pantry','gesture','table','sweets','finale']) {
  assert.match(page,new RegExp('data-v17-title="'+scene+'"'),'V17.5 scene title must carry unique choreography');
}
assert.equal((page.match(/class="v17-connector /g)||[]).length,2);
assert.match(motion,/titleDirections/);

console.log('V17.4 non-square photo composition contract: PASS');
