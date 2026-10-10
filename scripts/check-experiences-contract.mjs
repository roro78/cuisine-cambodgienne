import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const landing = read('src/pages/experiences/index.astro');
const detail = read('src/pages/experiences/grand-diner-khmer.astro');
const landingStyle = read('src/styles/experiences-prelaunch.css');
const detailStyle = read('src/styles/grand-diner-concept.css');
const preview = read('src/components/DinnerPreview.astro');
const calculator = read('src/utils/dinnerPreview.mjs');
const sitemap = read('src/pages/sitemap.xml.ts');
const workshops = read('src/data/workshops.ts');
const failures = [];

function requireCondition(condition, explanation) {
  if (!condition) failures.push(explanation);
}

for (const [route, text] of [['/experiences/', landing], ['/experiences/grand-diner-khmer/', detail]]) {
  requireCondition(/\bnoindex\b/.test(text), `${route} must remain noindex during prelaunch`);
  requireCondition(text.includes('<SiteHeader />') && text.includes('<SiteFooter />'), `${route} must use existing site chrome`);
  requireCondition(!/<form\b/i.test(text), `${route} must not collect visitor details`);
  requireCondition(!/\b(stripe|checkout|commander maintenant|réserver maintenant)\b/i.test(text), `${route} must not enable paid conversion`);
  const localImages = [...text.matchAll(/(?:src|image)=["'](\/images\/[^"']+)["']/g)].map((x) => x[1]);
  for (const localImage of localImages) {
    requireCondition(fs.existsSync(path.join(root, 'public', localImage.slice(1))), `Referenced asset is missing: ${localImage}`);
  }
}

requireCondition(!sitemap.includes("'/experiences/'"), 'Unlaunched experiences must not appear in XML sitemap');
requireCondition(!/<form\\b/i.test(preview), 'Preview must not collect personal information');
requireCondition(landing.includes("Partenaire recherché"), 'Partner search state must remain explicit');
requireCondition(landing.includes("se poursuit indépendamment"), 'Digital offer must not be tied to a specialist');
requireCondition(landing.includes('href="/experiences/grand-diner-khmer/"'), 'Landing must link to concept');
requireCondition(landing.includes('href="/apprendre/"'), 'Free workshops must stay discoverable');
requireCondition(detail.includes('import DinnerPreview') && detail.includes('<DinnerPreview />'), 'Grand Dîner must render the real preview component');
requireCondition(preview.includes('data-preview-guests={guests}') && preview.includes('[2, 4, 6]'), 'Preview must offer 2/4/6 guests');
requireCondition(preview.includes('data-preview-recipes={JSON.stringify(previewData)}'), 'Preview must use existing catalogue data');
requireCondition(preview.includes('aria-pressed') && preview.includes('aria-live="polite"'), 'Preview must expose accessible button state and announcements');
requireCondition(preview.includes('data-preview-copy') && calculator.includes('buildShoppingListText'), 'Copyable shopping list must be present');
requireCondition(calculator.includes('amok-trey') && calculator.includes('chek-ktis'), 'Preview recipes must be the established pilot menu');
requireCondition(detail.includes('href="/apprendre/"'), 'Concept must link to free existing workshops');
requireCondition(detail.includes("Aucune vente ni réservation ouverte"), 'Concept cannot be mistaken for a released product');
requireCondition(landingStyle.includes('.exp-page') && detailStyle.includes('.dinner-concept'), 'Commercial CSS must stay namespaced');
requireCondition((workshops.match(/slug:/g) || []).length >= 6, 'Existing workshop catalog must remain present');

if (failures.length) {
  console.error('Experience prelaunch contract failed:\n' + failures.map((failure) => '- ' + failure).join('\n'));
  process.exitCode = 1;
} else {
  console.log('Experience prelaunch contract: PASS');
}
