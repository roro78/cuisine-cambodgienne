import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
const page=fs.readFileSync('src/components/V17HomeExperience.astro','utf8');
const preview=fs.readFileSync('src/pages/v17-accueil-preview.astro','utf8');
const css=fs.readFileSync('src/styles/v17-accueil-rebuild.css','utf8');
const generatedCss=fs.readFileSync('src/styles/v17-generated-media.css','utf8');
const home=fs.readFileSync('src/pages/index.astro','utf8');
const sitemap=fs.readFileSync('src/pages/sitemap.xml.ts','utf8');
const header=fs.readFileSync('src/components/SiteHeader.astro','utf8');
const footer=fs.readFileSync('src/components/SiteFooter.astro','utf8');
const credits=fs.readFileSync('src/pages/credits-photos.astro','utf8');
assert.match(preview, /\bnoindex\b/);
assert.match(preview, /<V17HomeExperience preview/);
assert.match(home, /<V17HomeExperience\s*\/>/);
assert.doesNotMatch(home, /\bnoindex\b/,'Public home must be indexable');
assert.doesNotMatch(home, /Prévisualisation/,'Public home title must not mention preview');
assert.match(page, /<SiteHeader\s*\/>/);
assert.match(page, /<SiteFooter\s*\/>/);
assert.equal((page.match(/<h1\b/g)||[]).length,1);
assert.equal((page.match(/<h2\b/g)||[]).length,6);
for(const selector of ['v17r-hero','v17r-market','v17r-palette','v17r-gestures','v17r-table','v17r-dessert','v17r-finale']){
  assert.match(page,new RegExp('class="'+selector+'(?:\\s|\")'));
}
const requiredLinks=['/recettes/','/ingredients/','/glossaire/','/apprendre/','/culture/construire-repas-cambodgien/','/recettes/chek-ktis/','/apprendre/piler-aromates-au-mortier/','/credits-photos/#illustrations-ia'];
for(const href of requiredLinks)assert.ok(page.includes('href="'+href+'"'),'Missing genuine CTA '+href);
for(const href of ['/recettes/','/glossaire/','/apprendre/','/culture/','/a-propos/'])assert.ok(header.includes('href="'+href+'"'),'Existing header changed '+href);
for(const href of ['/ingredients/','/credits-photos/'])assert.ok(footer.includes('href="'+href+'"'),'Existing footer changed '+href);
for(const path of [...page.matchAll(/(?:src|href)=\{?(?:hero|market|kampot|tamarind|lokLak)\}?/g)])assert.ok(path);
for(const img of ['v17-angkor-sunset-1600.jpg','v17-amok-rice-1920.jpg','v17-amok-rice-960.jpg','v17-fruit-market-1920.jpg','v17-fruit-market-960.jpg','v17-khmer-table-1280.webp','v17-khmer-table-640.webp','v17-chek-ktis-960.jpg','v17-num-kom-900.jpg','v17-galangal-1000.jpg','v17-chili-450.png','kampot-1600.webp'])assert.ok(fs.existsSync('public/images/cuisine/'+img),'Missing stock photo '+img);
assert.match(page,/data-media-status="photographie-geste-generique"/);
assert.match(page,/photo d.illustration|photo illustrative|photographie illustrative/i,'No false claim that the mortar photo documents Khmer preparation');
for (const img of [
  'v17-market-live-1800.jpg',
  'v17-mortar-hands-1600.jpg',
  'v17-angkor-sunset-1600.jpg',
  'v17-table-meal-1600.jpg',
]) assert.ok(fs.existsSync('public/images/cuisine/'+img),'Missing verified V17 photograph '+img);
// The approved generated market is a required V17 asset. Missing or replaced
// binaries must fail CI; production must never silently show an older photo.
const aiMarketPath='public/images/cuisine/v17-marche-cambodgien-ia.webp';
assert.ok(fs.existsSync(aiMarketPath),'Approved AI market binary is missing');
const aiMarketBytes=fs.readFileSync(aiMarketPath);
assert.equal(aiMarketBytes.subarray(0,4).toString(),'RIFF','Market artwork must be a real WebP');
assert.equal(aiMarketBytes.subarray(8,12).toString(),'WEBP','Market artwork must be a real WebP');
assert.equal(createHash('sha256').update(aiMarketBytes).digest('hex'),
  'f6556fcfdf3de5159e12083d40cf96872a1000d956b1e2eb9874f8bec272721b',
  'Market artwork must match the approved generated WebP');
assert.ok(page.includes('v17-marche-cambodgien-ia.webp'),'Approved market source required');
assert.match(page,/v17r-market-visual--generated/);
assert.match(page,/Marché imaginaire inspiré du Cambodge/);
assert.match(page,/v17r-hero-disclosure/);
assert.match(page,/Certaines scènes sont des illustrations créées avec l’IA/);
assert.match(credits,/id="illustrations-ia"/);
assert.match(credits,/marché terrestre imaginaire inspiré du Cambodge/);
assert.doesNotMatch(page,/marketIsIllustrated|v17-market-live-1800/,
  'No silent return to the obsolete documentary market');
assert.match(credits,/Filipp Romanovski/);
assert.match(credits,/composition éditoriale d’un repas/);
assert.match(credits,/Radek Kucharski/);
assert.match(credits,/Angkor_Wat_Reflection_\(46810498612\)\.jpg/);
assert.doesNotMatch(page,/v17r-finale-credit/,'Long author license line belongs to dedicated credits page');
assert.match(page,/v17r-gestures-main/);
assert.doesNotMatch(page,/v17r-table-detail/,'No detached bowl inset in the immersive table scene');
assert.ok(fs.existsSync('public/images/cuisine/v17-num-plae-ai-641.jpg'),'Num Plae Ai approved real photograph missing');
assert.match(credits,/les desserts/,'Generated dessert source must be disclosed in credits');
assert.match(page,/v17-desserts-khmers-generes\.webp/,'Missing generated editorial dessert source');
assert.doesNotMatch(page,/v17-khmer-sweets-1400|v17-amok-coconut-1800|v17-num-krouch-1400/,'Rejected image still appears on page');

for(const media of [
 'v17-banana-leaves.svg','v17-plumeria.svg','v17-lemongrass.svg','v17-lime.svg'
]) assert.ok(fs.existsSync('public/images/brand/'+media),'Missing original botanical decoration '+media);
assert.ok(fs.existsSync('public/images/cuisine/v17-kroeung-final.jpg'));
assert.ok(fs.existsSync('public/images/brand/v17-spice-bowls.svg'),'Missing original pepper/turmeric illustration');
assert.match(page,/v17r-finale-stamp/,'Missing Angkor finale illustration');
assert.doesNotMatch(page,/v17r-hero-sidebar|v17r-table-handnote|v17r-market-note/,'Decorative microcopy must not clutter or overlap premium headlines');
assert.doesNotMatch(page,/v17r-gestures-steps/,'Gesture icon list must not duplicate the large three-line heading');
assert.doesNotMatch(page,/v17r-image-warning/,'Generic mortar photography caveat belongs to the credits page');
assert.match(credits,/Illustration générique du geste/,'Mortar caveat remains transparently credited');
assert.match(page,/v17r-spice-bowls/,'Missing spice bowl visual');
assert.match(page,/v17r-gestures-kroeung/);
assert.doesNotMatch(page,/v17r-preview-notice|v17r-table-clarity/,'No disruptive repeated credit blocks on the homepage');
assert.match(page,/class="v17r-wave/);
assert.match(credits,/Red_Kroeung_Paste.jpg/);
const script=fs.readFileSync('src/scripts/v17AccueilMotion.ts','utf8');
assert.match(page,/initV17AccueilMotion/);
assert.match(script,/gsap\.matchMedia\(\)/);
assert.match(script,/prefers-reduced-motion: no-preference/);
assert.match(script,/\.v17r-palette-a/);
assert.match(script,/\.v17r-palette-b/);
assert.match(script,/scrub: \.75/);
assert.match(script,/const chapterPerformance =/,'D15: named chapter arrival and exit choreography required');
assert.match(script,/const heroDeparture =/,'D15: hero departure choreography required');
assert.match(page,/v17r-gestures--cinematic/,'Mortar cinematic composition missing');
assert.match(page,/data-v17-mortar-scene/,'Mortar scroll trigger missing');
assert.equal((page.match(/v17r-gesture-word/g)||[]).length,4,
  'Mortar requires three independent animated words and accent class');
assert.match(page,/v17-mortar-cinema\.css/,'Mortar last-scene stylesheet must be loaded');
assert.match(script,/const mortarCinema =/,'Dedicated mortar storyboard missing');

const handoffCss=fs.readFileSync('src/styles/v17-scene-handoffs.css','utf8');
assert.ok(page.includes('v17-scene-handoffs.css'),'D14 transition styles missing');
for(const name of ['aroma','sweet','journey']){
  assert.ok(page.includes('v17r-handoff--'+name),'D14 bridge missing: '+name);
}
assert.equal((page.match(/class="v17r-handoff /g)||[]).length,3,
  'Only three new editorial bridges; original seam count remains unchanged');
assert.ok(script.includes('const sceneHandoffs ='),'D14 transition choreography missing');
assert.ok(script.includes('sceneHandoffs(false)') && script.includes('sceneHandoffs(true)'),
  'D14 motion must support desktop and mobile');
assert.ok(script.includes("clipPath: 'inset(0% 0% 0% 0%)'"),
  'D14 photo masks must fully reveal the artworks');
assert.match(handoffCss,/height: 0;/,'D14 bridges cannot create empty scroll space');
assert.match(handoffCss,/pointer-events: none;/,'D14 bridges cannot block input');
assert.doesNotMatch(handoffCss,/--vr-(?:ivory|forest|orange|yellow|lime)\s*:/,
  'D14 must not override approved brand colors');

assert.match(script,/mortarCinema\(false\)/,'Desktop mortar motion missing');
assert.match(script,/mortarCinema\(true\)/,'Mobile mortar motion missing');
assert.equal(script.split("chapterPerformance('.v17r-").length-1,6,
  'D18: table and desserts have individual narratives instead of generic heading flights');
// D21: abandon the four-cutout prototype in favor of one static generated photograph.
const editorialCss=fs.readFileSync('src/styles/v17-d21-editorial-table.css','utf8');
assert.ok(page.includes('v17-d21-editorial-table.css') && page.includes('data-v17-table-editorial') &&
  page.includes('v17-tablee-khmere-generee.webp'), 'D22 feast photography missing');
for (const slug of ['amok-trey','lok-lak','num-banh-chok','prahok-ktis']) {
  assert.ok(page.includes("slug: '"+slug+"'"), 'D22 featured recipe not connected to catalogue: '+slug);
}
assert.match(page,/href=\{dish\.url\}/,'D22 each recipe must have its own dynamic anchor');
assert.match(page,/<ol class="v17r-table-recipes"/,'D22 four food story chapters required');
assert.match(page,/data-v17-table-recipe/,'D22 recipes must be individually animatable');
assert.match(page,/v17r-table-recipe-image/,'D22 mobile chapter must use its own food photograph');
assert.equal((page.match(/class="v17r-table-fullbleed"/g)||[]).length,1,
  'D21 requires exactly one full-bleed photo');
assert.doesNotMatch(page,/v17r-table-dish|v17r-table-ripple|data-v17-table-assemble/,
  'Old individual moving plates must be removed');
assert.ok(!page.includes('v17-d18-table-assemble.css') &&
  !page.includes('v18-table-cutout-dishes.css'),
  'Abandoned plate styles must not load');
assert.ok(script.includes('const tableEditorial =') &&
  script.includes('tableEditorial(false, window.matchMedia(') &&
  script.includes('tableEditorial(true)') && !script.includes('const assembleTable =') &&
  script.includes('y:tablet?(i===0?-18:22)') &&
  script.includes('recipes.length!==4') &&
  script.includes('gsap.set(recipes,{autoAlpha:.78,y:14})'),
  'D22 four readable interactive recipe labels, photography remains static');
assert.ok(editorialCss.includes('object-fit:cover') &&
  editorialCss.includes('position:sticky') &&
  editorialCss.includes('min-width:761px') &&
  editorialCss.includes('max-width:1100px') &&
  editorialCss.includes('prefers-reduced-motion:reduce'),
  'D21 cinematic image, tablet layout, reduced-motion fallback');
for(const url of ['/recettes/','/culture/construire-repas-cambodgien/']){
  assert.ok(page.includes('href="'+url+'"'),'Missing editorial navigation '+url);
}
assert.ok(script.includes('const dessertBloom =') && script.includes('dessertBloom(true)') &&
  script.includes('dessertBloom(false)'),'D17: photo iris reveal must work desktop and mobile');
assert.ok(script.includes('const travellingAromatic =') &&
  script.includes('travellingAromatic();'),'D17: continuous market-to-mortar object missing');
const d17Styles=fs.readFileSync('src/styles/v17-d17-cinematic-scenes.css','utf8');
assert.ok(page.includes('v17-d17-cinematic-scenes.css'),'D17 final art-direction styles not loaded');
assert.ok(page.includes('data-v17-aromatic-traveller'),'D17 one travelling aromatic node missing');
assert.ok(d17Styles.includes('object-fit: cover') && d17Styles.includes('border-radius: 0'),
  'D17 desserts must fill the entire photographic chapter, never a rectangular card');
assert.ok(d17Styles.includes('prefers-reduced-motion: reduce'),
  'D17 must honor reduced motion');
assert.ok(script.includes('mobile ? 145 : 170'),
  'D16: horizontal titles must travel more than their own width');
assert.ok(script.includes('mobile ? -110 : -165') &&
          script.includes('mobile ? 110 : 155'),
  'D16: ingredients and table titles must enter from opposing vertical directions');
assert.ok(script.includes('timeline.to(heading, { ...departure'),
  'D16: chapter title must exit after a reading hold');
assert.ok(script.includes('mobile ? 155 : 190'),
  'D16: individual mortar words require cinematic lateral trajectories');
assert.ok(script.includes('trigger: heading') &&
          script.includes("end: 'top 8%'"),
  'D16: heading entrance and exit must stay synchronized with visible viewport position');
assert.match(script,/scrub: mobile/,
  'D15: motion must respond to native scrolling on both form factors');
assert.doesNotMatch(script,/pin:\s*true|ScrollSmoother|window\.scrollTo/);


assert.match(credits,/composition éditoriale d’un repas autour d’une table/);
assert.doesNotMatch(page,/montage éditorial, pas une même tablée/);
assert.doesNotMatch(page, /\/v17-preview\/|home-v17-preview\.css|home-v17-air\.css/);
assert.match(home, /V17HomeExperience/, 'D8 release must actually promote V17 on /');
assert.match(home, /BaseLayout/, 'D8 index must retain canonical SEO layout');
assert.doesNotMatch(sitemap,/v17-accueil-preview/,'Preview must not be in sitemap');
assert.match(css, /@media\(max-width:760px\)/);
assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
assert.match(css, /\.v17r-wrap/);
assert.match(generatedCss, /\.v17r-hero--generated \.v17r-hero-dish/,
  'The generated hero must have its own monumental photographic composition');
assert.match(generatedCss, /\.v17r-dessert-art--generated \.v17r-dessert-generated/,
  'The dessert scene must display one complete AI-generated editorial tableau');
for(const name of [
  'v17-hero-amok-genere.webp',
  'v17-tablee-khmere-generee.webp',
  'v17-desserts-khmers-generes.webp',
  'v17-lok-lak-genere.webp',
  'v17-nom-banh-chok-genere.webp'
]) assert.ok(fs.existsSync('public/images/cuisine/'+name), 'Missing generated image '+name);
assert.match(page, /images\/cuisine\/v17-hero-amok-genere\.webp/);
assert.match(page, /images\/cuisine\/v17-tablee-khmere-generee\.webp/);
assert.match(page, /images\/cuisine\/v17-desserts-khmers-generes\.webp/);
assert.doesNotMatch(css,/ScrollSmoother|scroll-snap-type|position:\s*fixed/);
console.log('V17 D8: PASS — public / reuses 7 V17 scenes, preview remains noindex, assets and links verified');
