import assert from 'node:assert/strict';
import fs from 'node:fs';
const page=fs.readFileSync('src/pages/v17-accueil-preview.astro','utf8');
const css=fs.readFileSync('src/styles/v17-accueil-rebuild.css','utf8');
const home=fs.readFileSync('src/pages/index.astro','utf8');
const sitemap=fs.readFileSync('src/pages/sitemap.xml.ts','utf8');
const header=fs.readFileSync('src/components/SiteHeader.astro','utf8');
const footer=fs.readFileSync('src/components/SiteFooter.astro','utf8');
assert.match(page, /\bnoindex\b/);
assert.match(page, /<SiteHeader\s*\/>/);
assert.match(page, /<SiteFooter\s*\/>/);
assert.equal((page.match(/<h1\b/g)||[]).length,1);
assert.equal((page.match(/<h2\b/g)||[]).length,6);
for(const selector of ['v17r-hero','v17r-market','v17r-palette','v17r-gestures','v17r-table','v17r-dessert','v17r-finale']){
  assert.match(page,new RegExp('class="'+selector+'"'));
}
const requiredLinks=['/recettes/','/ingredients/','/glossaire/','/apprendre/','/culture/construire-repas-cambodgien/','/recettes/chek-ktis/','/apprendre/piler-aromates-au-mortier/','/credits-photos/'];
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
  'v17-angkor-dusk-1800.jpg',
  'v17-table-meal-1600.jpg',
]) assert.ok(fs.existsSync('public/images/cuisine/'+img),'Missing verified V17 photograph '+img);
assert.match(page,/Radosław Botev/);
assert.match(page,/Filipp Romanovski/);
assert.match(page,/Bahnfrend/);
assert.match(page,/Eric Hossinger/);
assert.match(page,/v17r-gestures-main/);
assert.match(page,/v17r-table-detail/);
for(const media of [
 'v17-banana-leaves.svg','v17-plumeria.svg','v17-lemongrass.svg','v17-lime.svg'
]) assert.ok(fs.existsSync('public/images/brand/'+media),'Missing original botanical decoration '+media);
assert.ok(fs.existsSync('public/images/cuisine/v17-kroeung-final.jpg'));
assert.ok(fs.existsSync('public/images/brand/v17-spice-bowls.svg'),'Missing original pepper/turmeric illustration');
assert.match(page,/v17r-finale-stamp/,'Missing Angkor finale illustration');
assert.match(page,/v17r-hero-sidebar/,'Missing storyboard side annotation');
assert.match(page,/v17r-spice-bowls/,'Missing spice bowl visual');
assert.match(page,/v17r-gestures-kroeung/);
assert.match(page,/<details><summary>Sources photographiques/);
assert.match(page,/class="v17r-wave/);
assert.match(page,/Red_Kroeung_Paste.jpg/);
const script=fs.readFileSync('src/scripts/v17AccueilMotion.ts','utf8');
assert.match(page,/initV17AccueilMotion/);
assert.match(script,/gsap\.matchMedia\(\)/);
assert.match(script,/prefers-reduced-motion: no-preference/);
assert.match(script,/\.v17r-palette-a/);
assert.match(script,/\.v17r-palette-b/);
assert.match(script,/scrub: \.75/);
assert.doesNotMatch(script,/pin:\s*true|ScrollSmoother|window\.scrollTo/);


assert.match(page,/Assortiment de spécialités khmères photographié à Phnom Penh/);
assert.doesNotMatch(page, /\/v17-preview\/|home-v17-preview\.css|home-v17-air\.css/);
assert.doesNotMatch(home,/v17-accueil-preview|v17-accueil-rebuild/,'V16 home untouched');
assert.doesNotMatch(sitemap,/v17-accueil-preview/,'Preview must not be in sitemap');
assert.match(css, /@media\(max-width:760px\)/);
assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
assert.match(css, /\.v17r-wrap/);
assert.doesNotMatch(css,/ScrollSmoother|scroll-snap-type|position:\s*fixed/);
console.log('V17 accueil D2: PASS — 7 scenes, real links, previews isolated, assets declared');
