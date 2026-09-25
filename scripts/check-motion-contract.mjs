import fs from 'node:fs';

const motion = fs.readFileSync('src/scripts/motion.ts', 'utf8');
const storytelling = fs.readFileSync('src/scripts/storytelling.ts', 'utf8');
const css = fs.readFileSync('src/styles/global.css', 'utf8');

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

if (failures.length) {
  console.error('Motion contract failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Motion contract OK');
