import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const landing = read('src/pages/experiences/index.astro');
const detail = read('src/pages/experiences/grand-diner-khmer.astro');
const reception = read('src/pages/experiences/grand-diner-khmer/carnet-de-reception.astro');
const receptionStyle = read('src/styles/reception-notebook.css');
const receptionModel = read('src/utils/dinnerReception.mjs');
const landingStyle = read('src/styles/experiences-prelaunch.css');
const detailStyle = read('src/styles/grand-diner-concept.css');
const preview = read('src/components/DinnerPreview.astro');
const timeline = read('src/components/DinnerTimeline.astro');
const kitchen = read('src/components/DinnerKitchenGuide.astro');
const pack = read('src/components/DinnerPack.astro');
const packModel = read('src/utils/dinnerPack.mjs');
const kitchenModel = read('src/utils/dinnerKitchenGuide.mjs');
const timelineCalculator = read('src/utils/dinnerTimeline.mjs');
const calculator = read('src/utils/dinnerPreview.mjs');
const sitemap = read('src/pages/sitemap.xml.ts');
const workshops = read('src/data/workshops.ts');
const failures = [];

function requireCondition(condition, explanation) {
  if (!condition) failures.push(explanation);
}

for (const [route, text] of [['/experiences/', landing], ['/experiences/grand-diner-khmer/', detail], ['/experiences/grand-diner-khmer/carnet-de-reception/', reception]]) {
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
requireCondition(!sitemap.includes('carnet-de-reception'), 'Reception notebook must stay out of sitemap during prelaunch');
requireCondition(!/<form\b/i.test(preview) && !/<form\b/i.test(timeline) && !/<form\b/i.test(kitchen) && !/<form\b/i.test(pack), 'Preview must not collect personal information');
requireCondition(landing.includes("Partenaire recherché"), 'Partner search state must remain explicit');
requireCondition(landing.includes("se poursuit indépendamment"), 'Digital offer must not be tied to a specialist');
requireCondition(landing.includes('href="/experiences/grand-diner-khmer/"'), 'Landing must link to concept');
requireCondition(landing.includes('href="/apprendre/"'), 'Free workshops must stay discoverable');
requireCondition(detail.includes('import DinnerPreview') && detail.includes('<DinnerPreview />'), 'Grand Dîner must render the real preview component');
requireCondition(detail.includes('import DinnerTimeline') && detail.includes('<DinnerTimeline />'), 'Grand Dîner must show the real indicative planner');
requireCondition(detail.includes('import DinnerKitchenGuide') && detail.includes('<DinnerKitchenGuide />'), 'Grand Dîner must include stepwise kitchen preview');
requireCondition(detail.includes('import DinnerPack') && detail.includes('<DinnerPack />'), 'Grand Dîner must include the private downloadable roadmap');
requireCondition(detail.includes('href="/experiences/grand-diner-khmer/carnet-de-reception/"'), 'Grand Dîner must link to the original reception notebook');
requireCondition(pack.includes('data-pack-carnet') && pack.includes('new URLSearchParams({ convives: String(guests), service: time, partage: includeSide'), 'Personal dinner pack must carry validated choices into notebook');
requireCondition(reception.includes('buildReceptionNotebook(recipeData)') && reception.includes('data-reception-notebook'), 'Notebook must derive timings from existing public recipes');
requireCondition(reception.includes('data-reception-task') && reception.includes('getNotebookProgress') && reception.includes('data-reception-side-menu'), 'Notebook must offer progress and correctly hide optional dish');
requireCondition(reception.includes('data-reception-print') && reception.includes('window.print()') && receptionStyle.includes('@media print'), 'Notebook must support browser printing without server-side capture');
requireCondition(reception.includes('id="carnet-degustation"') && reception.includes('data-reception-side-tasting') && reception.includes('sideTasting.hidden = !side.checked'), 'Tasting worksheet must track the optional dish safely');
requireCondition(reception.includes('reception-writing-lines') && receptionStyle.includes('@media print') && receptionStyle.includes('.reception-tasting-card'), 'Culinary rehearsal must include printable original feedback prompts');
requireCondition(!/<textarea\b|<form\b/i.test(reception), 'Prelaunch tasting workbook must not collect personal notes online');
requireCondition(receptionStyle.includes('.reception-notebook') && receptionStyle.includes('[hidden]{display:none!important}'), 'Notebook styles must be scoped and respect inactive controls');
requireCondition(receptionStyle.includes('.reception-content{overflow:visible!important}'), 'Printable multi-page notebook must not clip its pages');
requireCondition(
  ['data-reception-print-guests', 'data-reception-print-time', 'data-reception-print-menu'].every((attribute) => reception.includes(attribute)) &&
  reception.includes('summaryGuests.textContent = notebook.guests') &&
  reception.includes('summaryMenu.textContent = side.checked'),
  'Printable reception book must identify the selected guests, service time and optional dish'
);
requireCondition(
  receptionStyle.includes('.reception-configuration-summary') &&
  receptionStyle.includes('.reception-configuration-summary strong{color:#111!important}'),
  'Print configuration summary must remain legible in monochrome'
);

requireCondition(receptionModel.includes('RECEPTION_VALIDATION') && receptionModel.includes('essai culinaire réel'), 'Do not claim unperformed culinary validation');
requireCondition(receptionModel.includes('RECEPTION_SAFETY') && receptionModel.includes('Ne goûtez jamais'), 'Safety reminder must survive in reception narrative');

requireCondition(detail.includes('aria-label="Accéder aux étapes de l’expérience"') && ['#apercu', '#planning', '#cuisine-guidee', '#ma-feuille-de-route'].every((anchor) => detail.includes('href="' + anchor + '"')), 'Four-stage journey navigation must remain keyboard-accessible');
requireCondition(timeline.includes('id="planning"') && preview.includes('id="apercu"') && kitchen.includes('id="cuisine-guidee"') && pack.includes('id="ma-feuille-de-route"'), 'Journey navigation must target real component sections');
requireCondition(kitchen.includes('data-kitchen-dishes={JSON.stringify(dishes)}') && kitchen.includes('data-guide-previous') && kitchen.includes('data-guide-next') && kitchen.includes('data-guide-complete'), 'Kitchen guide must expose actual step controls');
requireCondition(kitchen.includes('data-guide-progress') && kitchen.includes('aria-live="polite"'), 'Kitchen guide must expose visible and accessible progress');
requireCondition(kitchen.includes('positions = new Map') && kitchen.includes('completed = new Map'), 'Kitchen steps should preserve state when switching dishes');
requireCondition(kitchenModel.includes('AMOK_RAW_EGG_CAUTION') && kitchenModel.includes('Ne goûtez pas') && kitchen.includes('avant</strong>'), 'Raw-egg tasting safety override must be present');
requireCondition(kitchenModel.includes('PRAHOK_RAW_PORK_CAUTION') && kitchenModel.includes('porc cuire complètement'), 'Optional pork dish must forbid tasting before fully cooked');
requireCondition(kitchenModel.includes("PILOT_GUIDE_SIDE_SLUG = 'prahok-ktis'") && kitchen.includes('hidden={dish.slug === PILOT_GUIDE_SIDE_SLUG}'), 'Optional guided recipe must be opt-in and hidden by default');
requireCondition(kitchen.includes("'dinner:side'") && detailStyle.includes('.dinner-kitchen-navigation button[hidden]{display:none}'), 'Opt-out must reliably hide the optional kitchen tab');
requireCondition(timeline.includes('data-service-time') && timeline.includes('data-timing-recipes={JSON.stringify(timingData)}'), 'Planning must use public recipe durations');
requireCondition(timeline.includes('role="status"') && timeline.includes('aria-live="polite"'), 'Planning changes must be announced accessibly');
requireCondition(timeline.includes('marge de 15 min') || timeline.includes('marge de 15 min'.toUpperCase()) || timeline.includes('marge de 15'), 'Planning margin must be disclosed');
requireCondition(timelineCalculator.includes('readRecipeDuration') && timelineCalculator.includes('PLANNING_MARGIN_MINUTES'), 'Timeline utility must declare its assumptions');
requireCondition(preview.includes('data-preview-guests={guests}') && preview.includes('[2, 4, 6]'), 'Preview must offer 2/4/6 guests');
requireCondition(preview.includes('data-preview-recipes={JSON.stringify(previewData)}'), 'Preview must use existing catalogue data');
requireCondition(preview.includes('aria-pressed') && preview.includes('aria-live="polite"'), 'Preview must expose accessible button state and announcements');
requireCondition(preview.includes('data-preview-copy') && calculator.includes('buildShoppingListText'), 'Copyable shopping list must be present');
requireCondition(preview.includes('data-preview-key') && preview.includes('const selected = new Set'), 'Checked shopping ingredients must survive changes of serving size');
requireCondition(calculator.includes('amok-trey') && calculator.includes('chek-ktis'), 'Preview recipes must be the established pilot menu');
requireCondition(calculator.includes("PILOT_SIDE_SLUG = 'prahok-ktis'") && preview.includes('data-preview-side-toggle') && preview.includes('data-preview-side={JSON.stringify(optionalData)}'), 'Prahok side must be real opt-in recipe data');
requireCondition(preview.includes("new CustomEvent('dinner:side'") && pack.includes("'dinner:side'") && pack.includes('data-pack-side-label'), 'Optional side must update the dinner pack and preview');
requireCondition(packModel.includes('includeSide = false') && packModel.includes('Optional accompaniment is missing'), 'Extra dish must not be silently included without its recipe');
requireCondition(preview.includes("new CustomEvent('dinner:guests'") && timeline.includes("new CustomEvent('dinner:time'"), 'Recipe selectors must notify the roadmap');
requireCondition(pack.includes("'dinner:guests'") && pack.includes("'dinner:time'") && pack.includes('data-dinner-pack-recipes={JSON.stringify(packRecipes)}'), 'Roadmap must sync with both validated controls');
requireCondition(pack.includes('Blob([summary]') && pack.includes('URL.revokeObjectURL') && !/fetch\s*\(/.test(pack), 'Roadmap export must be local and clean up its temporary URL');
requireCondition(packModel.includes('buildPilotShoppingList') && packModel.includes('buildPilotServicePlan'), 'Roadmap must reuse the tested calculators');
requireCondition(packModel.includes('Ne jamais goûter') && packModel.includes('Aperçu gratuit'), 'Downloaded roadmap must disclose food safety and prototype status');
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
