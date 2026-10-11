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

if (!home.includes('Le matin, les rues sentent déjà le bouillon et les grillades.') || !home.includes('Au marché, tout commence par les produits.') || !home.includes('À table, les plats se partagent.')) {
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

const scrollHeights = [
  [/\.v16-hero\{min-height:(\d+)svh/, 220, 'desktop hero'],
  [/\.v16-market\{min-height:(\d+)svh/, 270, 'desktop market'],
  [/  \.v16-hero\{min-height:(\d+)svh/, 195, 'mobile hero'],
  [/  \.v16-market\{min-height:(\d+)svh/, 235, 'mobile market']
];
for (const [pattern, max, label] of scrollHeights) {
  const match = css.match(pattern);
  if (!match || Number(match[1]) > max) failures.push(`Storytelling ${label} scene should not have excessive scroll height`);
}
if (!home.includes('class="v16-hero-actions"') ||
    !home.includes('href="/recettes/">Voir les recettes') ||
    !home.includes('href="/apprendre/">Apprendre les gestes')) {
  failures.push('Home hero must provide direct recipe and workshop navigation before long scroll');
}
if (!css.includes('.v16-hero-actions a:focus-visible')) {
  failures.push('Direct hero links must show clear keyboard focus');
}

if (css.lastIndexOf('@media(max-height:700px)') < css.lastIndexOf('@media(max-width:620px)')) {
  failures.push('Short-height hero rules must come after narrow-width rules in the CSS cascade');
}
if (!css.includes('@media(max-height:700px)') || !css.includes('@media(max-height:420px)') ||
    !css.includes('.v16-hero-orbit{display:none}')) {
  failures.push('Short-height hero must reflow text, buttons and decorative chips safely');
}
if (!storytelling.includes("shortcuts.forEach((link) => {") ||
    !storytelling.includes("link.tabIndex = p < .78 ? 0 : -1")) {
  failures.push('Fading quick links must leave keyboard tab order before they disappear');
}

if (!storytelling.includes("shortcuts.some((link) => document.activeElement === link)") ||
    !storytelling.includes("visibleHeaderLink?.focus({ preventScroll: true })") ||
    !storytelling.includes("if (p >= .78 && shortcuts.some")) {
  failures.push('Focused hero CTA must move to a visible header target before fading on scroll or resize');
}

const extremeZoom = '@media(max-width:440px) and (max-height:420px)';
const extremeCss = css.slice(css.lastIndexOf(extremeZoom));
if (!css.includes(extremeZoom) ||
    !extremeCss.includes('.v16-hero{min-height:0}') ||
    !extremeCss.includes('position:relative;top:auto;height:auto;min-height:0;') ||
    !extremeCss.includes('overflow:visible;display:block;') ||
    !extremeCss.includes('transform:none!important;opacity:1!important;visibility:visible!important;')) {
  failures.push('400% zoom hero must grow and scroll naturally instead of clipping focused actions');
}
if (!storytelling.includes("const compactHero = window.matchMedia('(max-width: 440px) and (max-height: 420px)')") ||
    !storytelling.includes('const applyHeroProgress = (p: number) => {') ||
    !storytelling.includes('onRefresh: (self) => applyHeroProgress(self.progress)') ||
    !storytelling.includes('onUpdate: (self) => applyHeroProgress(self.progress)') ||
    !storytelling.includes('if (compactHero.matches) {')) {
  failures.push('400% zoom hero must reapply GSAP state and accessible CTA on entering AND leaving compact layout, even without scroll progress changes');
}
if (!storytelling.includes('gsap.set(copy, {') || !storytelling.includes('gsap.set(image, {') ||
    !storytelling.includes('link.tabIndex = p < .78 ? 0 : -1;')) {
  failures.push('Hero refresh must reapply image, text and keyboard tab state together');
}


if (!css.includes('@media(max-width:620px) and (max-height:740px)') ||
    !css.includes('.v16-market-head h2{font-size:clamp(1.8rem,8vw,2.35rem)') ||
    !css.includes('.v16-market-panel-copy h3{font-size:clamp(1.95rem,8.8vw,2.8rem)') ||
    !css.includes('.v16-market-panel-copy strong{font-size:.82rem;line-height:1.45}')) {
  failures.push('Short mobile market scene must compact heading and caption without clipping them');
}
if (!css.includes('@media(hover:none) and (pointer:coarse)') ||
    !css.includes('.v16-orbit-chip{backdrop-filter:none;-webkit-backdrop-filter:none;') ||
    !css.includes('.v16-dish{backdrop-filter:none;-webkit-backdrop-filter:none}')) {
  failures.push('Touch devices must not use expensive backdrop blur on animated hero chips and table dishes');
}

if (failures.length) {
  console.error('Motion contract failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Motion contract OK — V16 culinary journey');
