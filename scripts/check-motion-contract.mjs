import fs from 'node:fs';

const motion = fs.readFileSync('src/scripts/motion.ts','utf8');
const storytelling = fs.readFileSync('src/scripts/storytelling.ts','utf8');
const css = fs.readFileSync('src/styles/home-v16.css','utf8');
const home = fs.readFileSync('src/pages/index.astro','utf8');

const failures = [];

if (/prefers-reduced-motion:[^\n]*reduce[\s\S]{0,180}?return \(\) => \{\};/.test(motion)) {
  failures.push('motion.ts must not abort the whole motion system in reduced-motion mode');
}

if (!home.includes("import '../styles/home-v16.css';")) {
  failures.push('Home V16 must load its dedicated stylesheet');
}

const requiredSections = [
  'data-v16-hero',
  'data-v16-morning',
  'data-v16-market',
  'data-v16-gesture',
  'data-v16-table',
  'data-v16-glossary'
];

requiredSections.forEach((marker) => {
  if (!home.includes(marker)) failures.push(`Home V16 section missing: ${marker}`);
});

if (home.includes('data-v14-dishes') || home.includes('data-v14-flavors') || home.includes('data-v14-desire')) {
  failures.push('Home V16 must not keep the repetitive V14 card chapters');
}

if (!home.includes('Le Cambodge se mange tôt.') || !home.includes('Le produit donne le ton.') || !home.includes('On ne cuisine pas un plat seul.')) {
  failures.push('V16 culinary day narrative headings are incomplete');
}

if (!storytelling.includes('setupHero(hero)') || !storytelling.includes('setupMarket(market)') || !storytelling.includes('setupGesture(gesture)') || !storytelling.includes('setupTable(table)') || !storytelling.includes('setupGlossary(glossary)')) {
  failures.push('V16 storytelling must own the five cinematic scroll scenes');
}

if (!storytelling.includes("gsap.set(track, { xPercent: -(100 - 100 / panels.length) * p })")) {
  failures.push('V16 market must travel horizontally while the page scrolls vertically');
}

if (!storytelling.includes("document.documentElement.classList.add('v16-reduced-motion')")) {
  failures.push('V16 reduced-motion mode must keep a dedicated static fallback');
}

if (!css.includes('/* V16 — Cuisine du Cambodge: editorial culinary journey */')) {
  failures.push('Home V16 stylesheet marker is missing');
}

if (!css.includes('.v16-market-track') || !css.includes('width:300%')) {
  failures.push('V16 market horizontal track styles are missing');
}

if (!css.includes('@media(prefers-reduced-motion:reduce)')) {
  failures.push('V16 reduced-motion CSS is missing');
}

if (!/@media\(prefers-reduced-motion:reduce\)[\s\S]*?\.v16-scroll-scene\{min-height:auto\}/.test(css)) {
  failures.push('Reduced motion must return V16 scroll scenes to natural flow');
}

if (!storytelling.includes('panel.inert = !interactive') || !storytelling.includes('panel.tabIndex = interactive ? 0 : -1')) {
  failures.push('Off-screen market panels must be removed from the tab order');
}

if (!storytelling.includes('if (cta) cta.tabIndex = -1') || !storytelling.includes('cta.tabIndex = reveal > .55 ? 0 : -1')) {
  failures.push('Table CTA tab order must follow its scroll reveal');
}

const directImageRoles = [...home.matchAll(/src=\{images\.([A-Za-z0-9_]+)\.src\}/g)].map((match) => match[1]);
const dataImageRoles = [...home.matchAll(/\bimage:\s*images\.([A-Za-z0-9_]+)/g)].map((match) => match[1]);
const primaryImageRoles = [...directImageRoles, ...dataImageRoles];
const duplicateRoles = primaryImageRoles.filter((role,index) => primaryImageRoles.indexOf(role) !== index);
if (duplicateRoles.length) {
  failures.push(`V16 home image subjects must have unique primary roles; repeated roles: ${[...new Set(duplicateRoles)].join(', ')}`);
}
const expectedPrimaryRoles = ['market','kampot','tamarind','prahok','kroeung','amok','lokLak'];
expectedPrimaryRoles.forEach((role) => {
  if (!primaryImageRoles.includes(role)) failures.push(`Missing V16 primary image role: ${role}`);
});

if (failures.length) {
  console.error('Motion contract failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Motion contract OK — V16 culinary journey');
