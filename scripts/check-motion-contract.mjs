import fs from 'node:fs';

const motion = fs.readFileSync('src/scripts/motion.ts', 'utf8');
const storytelling = fs.readFileSync('src/scripts/storytelling.ts', 'utf8');
const css = fs.readFileSync('src/styles/global.css', 'utf8');
const home = fs.readFileSync('src/pages/index.astro', 'utf8');
const culinaryTrail = fs.readFileSync('src/components/HomeCulinaryTrail.astro', 'utf8');

const failures = [];

if (/prefers-reduced-motion:[^\n]*reduce[\s\S]{0,180}?return \(\) => \{\};/.test(motion)) {
  failures.push('motion.ts must not abort the whole motion system in reduced-motion mode');
}

if (/if \(reduceMotion\)[\s\S]{0,220}?return \(\) => \{\};/.test(storytelling)) {
  failures.push('storytelling.ts must not abort the entire storytelling experience in reduced-motion mode');
}

if (/@media\(prefers-reduced-motion:reduce\)[\s\S]{0,220}?\.scroll-film-canvas[^\{]*\{[^}]*display\s*:\s*none/.test(css)) {
  failures.push('reduced-motion CSS must not hide the storytelling canvas');
}

if (/@media\(prefers-reduced-motion:reduce\)[\s\S]{0,120}?\.motion-layer\s*\{[^}]*display\s*:\s*none/.test(css)) {
  failures.push('reduced-motion CSS must not hide the entire global motion layer');
}

if (!storytelling.includes('drawCover(next.img, 1, 0, 0, eased)')) {
  failures.push('reduced-motion storytelling crossfade fallback is missing');
}

const homeTrailMarker = '/* V12.1 — guaranteed four-object home culinary trail visibility */';
const homeTrailHotfixIndex = css.lastIndexOf(homeTrailMarker);
if (homeTrailHotfixIndex < 0) {
  failures.push('home culinary trail visibility hotfix is missing');
} else {
  const homeTrailHotfix = css.slice(homeTrailHotfixIndex);
  if (!/@media\(max-width:720px\)[\s\S]*?\.home-trail-object[\s\S]*?display\s*:\s*block/.test(homeTrailHotfix)) {
    failures.push('mobile CSS must keep all home culinary objects visible');
  }
  if (!/@media\(prefers-reduced-motion:reduce\)[\s\S]*?\.home-trail-object\s*\{[^}]*display\s*:\s*block!important/.test(homeTrailHotfix)) {
    failures.push('reduced-motion CSS must keep all home culinary objects visible');
  }
}

if (/data-home-culinary-object[\s\S]*?autoAlpha:\s*index\s*===\s*0\s*\?\s*\.2\s*:\s*0/.test(motion)) {
  failures.push('reduced-motion JS must not hide three of the four home culinary objects');
}

if (!storytelling.includes('const scaled = lastProgress * 5;')) {
  failures.push('film imagery and five copy chapters must share the same five-segment progression');
}

if (!storytelling.includes('updateCulinaryObjects(progress)')) {
  failures.push('storytelling.ts must own the chapter-bound culinary object progression');
}

if (!storytelling.includes("classList.toggle('is-reduced-current', isCurrent)")) {
  failures.push('reduced-motion mode must mark only the current culinary object');
}

if (!css.includes('.home-trail-object.is-reduced-current')) {
  failures.push('reduced-motion CSS must reveal only the current culinary object');
}

if (!storytelling.includes('if (transition <= 0) return;')) {
  failures.push('the next chapter image must stay hidden until its transition starts');
}

if (motion.includes('homeCulinaryObjects') || motion.includes("'[data-home-culinary-object]'")) {
  failures.push('global motion must not compete with storytelling for home culinary objects');
}

if (!home.includes('<HomeCulinaryTrail />') || home.indexOf('<HomeCulinaryTrail />') > home.indexOf('film-copy film-copy-0')) {
  failures.push('the culinary trail must live inside the film stage before its chapter copy');
}

const filmScenes = culinaryTrail.match(/data-film-scene=/g) ?? [];
if (filmScenes.length !== 4) {
  failures.push('leaf, lemongrass, pepper and steam must each declare a film chapter');
}

if (!css.includes('/* V13 — cinematic scroll film and chapter-bound culinary objects */')) {
  failures.push('V13 cinematic film styles are missing');
}

if (failures.length) {
  console.error('Motion contract failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Motion contract OK');
