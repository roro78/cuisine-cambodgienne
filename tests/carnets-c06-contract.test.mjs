import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const all=readFileSync('src/data/culture.ts','utf8');
const template=readFileSync('src/pages/culture/[slug].astro','utf8');
const credits=readFileSync('src/pages/credits-photos.astro','utf8');

const a=all.indexOf("    slug: 'prahok-fermentation-umami'");
const b=all.indexOf("    slug: 'construire-repas-cambodgien'");
assert.ok(a>=0&&b>a,'Preserve original C06 canonical URL');
const c06=all.slice(a,b);

assert.match(c06,/title: 'Prahok, quand la pêche devient patrimoine'/);
assert.match(c06,/eyebrow: 'Mémoire culinaire'/);
assert.equal([...c06.matchAll(/^        title: /gm)].length,6,'Six cultural chapters required');
assert.equal([...c06.matchAll(/^          '/gm)].length,18,'Eighteen paragraphs required');
assert.match(c06,/Le Tonlé Sap, un paysage qui change avec les saisons/);
assert.match(c06,/Des savoirs et des revenus portés par des productrices/);
assert.match(c06,/Préserver le prahok,/);
assert.match(c06,/image: '\/images\/cuisine\/prahok-1600\.webp'/,'Do not silently change old photography');
assert.match(c06,/imageAlt: 'Bol de prahok ktis entouré de crudités/,'Photograph must be described as cooked food, never production reportage');
for(const width of [480,800,1200,1600]) assert.ok(existsSync(`public/images/cuisine/prahok-${width}.webp`),`Missing existing width ${width}`);
assert.match(credits,/Photo : Thomas Wanhoff · CC BY-SA 2\.0/,'Existing CC credit must stay');
assert.match(c06,/doi\.org\/10\.1080\/07409710\.2025\.2564492/,'Women producers research internal evidence');
assert.match(c06,/link\.springer\.com\/article\/10\.1007\/s10113-026-02706-8/,'Current 2026 fisheries study internal evidence');
assert.match(c06,/link\.springer\.com\/article\/10\.1186\/s42779-019-0027-1/,'Historic seasonal pattern internal evidence');
assert.doesNotMatch(c06,/tourismGuide/,'Remove broken generic tourist source');
for(const old of [
  'Le dosage comme apprentissage',
  'Avec quoi le découvrir',
  'Pour découvrir le prahok, commencez',
  'ajouter prahok, sauce de poisson',
  'Le meilleur réflexe consiste donc à commencer'
]) assert.ok(!c06.includes(old),`No practical or risky home-preservation instruction: ${old}`);
assert.match(template,/article\.slug === 'prahok-fermentation-umami'\s*\n\s*\? \[\]/,'No practical ingredients list attached to C06');
assert.match(template,/'prahok-fermentation-umami': \['prahok'\]/,'C06 glossary stays cultural');
assert.doesNotMatch(template,/article\.sources\.map\s*\(/,'Never show public bibliography');
assert.equal([...all.matchAll(/^    slug: '/gm)].length,7,'All seven slugs must survive');
assert.match(readFileSync('docs/carnets/PLAN-REFONTE-CARNETS.md','utf8'),/J12 — C06/,'Immutable journal must record C06 cultural milestone');
console.log('PASS C06: Tonle Sap social heritage, women producers, fisheries, no fermentation tutorial or source display.');
