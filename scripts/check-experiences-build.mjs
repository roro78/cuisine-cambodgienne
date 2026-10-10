import fs from 'node:fs';
import path from 'node:path';

/**
 * Checks the actual Astro build output, not merely source templates.
 * Staging only: this does not deploy the prelaunch experience.
 */
const root = path.join(process.cwd(), 'dist');
const fails = [];
function requirePage(route, label) {
  const file = path.join(root, ...route.split('/').filter(Boolean), 'index.html');
  if (!fs.existsSync(file)) {
    fails.push(label + ': built HTML missing at ' + path.relative(process.cwd(), file));
    return '';
  }
  const content = fs.readFileSync(file, 'utf8');
  if (!/<html\s+lang=["']fr["']/i.test(content)) fails.push(label + ': missing French document language');
  if (!/<title>[^<]+<\/title>/i.test(content)) fails.push(label + ': missing document title');
  return content;
}
const routeChecks = [
  ['/experiences/', 'Experience landing', ['Grand Dîner Khmer']],
  ['/experiences/grand-diner-khmer/', 'Grand Dîner Khmer', ['data-dinner-preview', 'data-dinner-timeline', 'data-kitchen-guide', 'data-dinner-pack', 'carnet-de-reception/']],
  ['/experiences/grand-diner-khmer/carnet-de-reception/', 'Reception notebook', ['data-reception-notebook', 'data-reception-print-guests', 'data-reception-print-time', 'data-reception-print-menu', 'carnet-degustation', 'data-reception-print']]
];
for (const [route, label, markers] of routeChecks) {
  const html = requirePage(route, label);
  if (!html) continue;
  if (!/<meta\s+name=["']robots["']\s+content=["']noindex,follow["']/i.test(html)) fails.push(label + ': prelaunch route must remain noindex');
  if (/<form[\s>]/i.test(html)) fails.push(label + ': unexpected data-collection form');
  for (const marker of markers) if (!html.includes(marker)) fails.push(label + ': missing ' + marker);
}
const workshopSlugs = [
  'piler-aromates-au-mortier',
  'equilibrer-une-sauce',
  'saisir-viande-poele',
  'fraicheur-herbes-agrumes',
  'bouillon-leger-savoureux',
  'composer-repas-cambodgien'
];
for (const slug of workshopSlugs) requirePage('/apprendre/' + slug + '/', 'Workshop ' + slug);
const sitemap = path.join(root, 'sitemap.xml');
if (!fs.existsSync(sitemap)) fails.push('Sitemap was not generated');
else {
  const content = fs.readFileSync(sitemap, 'utf8');
  for (const slug of workshopSlugs) if (!content.includes('/apprendre/' + slug + '/')) fails.push('Sitemap omits ' + slug);
  if (content.includes('/experiences/')) fails.push('Unlaunched experiences must stay out of sitemap');
}
const amok = requirePage('/recettes/amok-trey/', 'Public Amok safety');
const prahok = requirePage('/recettes/prahok-ktis/', 'Public Prahok safety');
if (amok && !amok.includes('Ne goûtez plus la préparation')) fails.push('Amok raw-egg/fish warning from PR #25 not included');
if (prahok && !prahok.includes('Goûtez uniquement lorsque le porc')) fails.push('Prahok complete-cooking requirement from PR #25 not included');
if (fails.length) {
  console.error('Built experiences smoke FAILED:\n' + fails.map((fail) => '- ' + fail).join('\n'));
  process.exitCode = 1;
} else {
  console.log('Built experiences smoke: PASS (3 prelaunch pages, 6 workshops, 2 safe public recipes, sitemap)');
}
