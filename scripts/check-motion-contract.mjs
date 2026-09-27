import fs from 'node:fs';

const motion = fs.readFileSync('src/scripts/motion.ts', 'utf8');
const storytelling = fs.readFileSync('src/scripts/storytelling.ts', 'utf8');
const css = fs.readFileSync('src/styles/home-v14.css', 'utf8');
const home = fs.readFileSync('src/pages/index.astro', 'utf8');

const failures = [];

if (/prefers-reduced-motion:[^\n]*reduce[\s\S]{0,180}?return \(\) => \{\};/.test(motion)) {
  failures.push('motion.ts must not abort the whole motion system in reduced-motion mode');
}

if (!home.includes("import '../styles/home-v14.css';")) {
  failures.push('Home V14 must load its dedicated stylesheet');
}

const requiredSections = [
  'data-v14-hero',
  'data-v14-dishes',
  'data-v14-flavors',
  'data-v14-market',
  'data-v14-tastes',
  'data-v14-home-cook',
  'data-v14-desire',
  'data-v14-table'
];

requiredSections.forEach((marker) => {
  if (!home.includes(marker)) failures.push(`Home V14 section missing: ${marker}`);
});

if (home.includes('data-scroll-film') || home.includes('<HomeCulinaryTrail')) {
  failures.push('V14 home must not fall back to the old five-photo V13 scroll-film architecture');
}

if (!home.includes('Par où commencer ?') || !home.includes('Les saveurs du Cambodge.') || !home.includes('Street food & marchés.')) {
  failures.push('V14 culinary narrative headings are incomplete');
}

if (home.includes('02 — Kroeung') || home.includes('Le mortier réveille')) {
  failures.push('Kroeung must not be a central homepage chapter in V14');
}

if (!storytelling.includes('setupHero(hero)') || !storytelling.includes('setupMarket(market)') || !storytelling.includes('setupTable(table)')) {
  failures.push('V14 storytelling must own hero, market and table scroll mechanics');
}

if (!storytelling.includes("gsap.set(track, { xPercent: -80 * p })")) {
  failures.push('The market chapter must travel horizontally while the page scrolls vertically');
}

if (!storytelling.includes('setupDesireTabs(reducedMotion, cleanup)')) {
  failures.push('The desire chapter must remain explicitly interactive');
}

if (!storytelling.includes("document.documentElement.classList.add('v14-reduced-motion')")) {
  failures.push('V14 reduced-motion mode must keep a dedicated static fallback');
}

if (!css.includes('/* Home V14 — culinary journey')) {
  failures.push('Home V14 stylesheet marker is missing');
}

if (!css.includes('.v14-market-track') || !css.includes('width:500%')) {
  failures.push('Market horizontal track styles are missing');
}

if (!css.includes('@media(prefers-reduced-motion:reduce)')) {
  failures.push('V14 reduced-motion CSS is missing');
}

if (!/@media\(prefers-reduced-motion:reduce\)[\s\S]*?\.v14-scroll-section\{height:auto!important\}/.test(css)) {
  failures.push('Reduced motion must return V14 scroll chapters to natural document flow');
}

if (!home.includes('role="tablist"') || !home.includes('role="tabpanel"')) {
  failures.push('Desire interaction must expose accessible tab semantics');
}

if (!home.includes('tabindex={index === 0 ? 0 : -1}')) {
  failures.push('Desire tabs must start with a single tab stop');
}

if (!storytelling.includes('setCardInteractive(card, isActive)') || !storytelling.includes('setCardInteractive(card, Math.abs(distance) < .48)')) {
  failures.push('Off-screen dish and taste cards must be removed from the tab order');
}

if (!storytelling.includes('if (cta) cta.tabIndex = -1') || !storytelling.includes('cta.tabIndex = reveal >= .5 ? 0 : -1')) {
  failures.push('Table CTA tab order must follow its scroll reveal');
}

if (!storytelling.includes("event.key === 'ArrowRight'") || !storytelling.includes("event.key === 'Home'") || !storytelling.includes("event.key === 'End'")) {
  failures.push('Desire tablist must implement keyboard arrow/Home/End navigation');
}

if (failures.length) {
  console.error('Motion contract failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Motion contract OK');
