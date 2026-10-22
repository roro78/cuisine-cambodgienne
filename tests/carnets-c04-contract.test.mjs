import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const culture=readFileSync('src/data/culture.ts','utf8');
const detail=readFileSync('src/pages/culture/[slug].astro','utf8');
const credits=readFileSync('src/pages/credits-photos.astro','utf8');
const social=readFileSync('src/data/socialCatalog.ts','utf8');
const plan=readFileSync('docs/carnets/PLAN-REFONTE-CARNETS.md','utf8');

const start=culture.indexOf("    slug: 'comprendre-amok'");
const end=culture.indexOf("    slug: 'kep-marche-crabe-poivre'");
assert.ok(start>=0&&end>start,'C04 must keep the existing canonical route');
const c04=culture.slice(start,end);
assert.match(c04,/title: 'L’amok, entre patrimoine et tables d’aujourd’hui'/);
assert.match(c04,/eyebrow: 'Mémoire culinaire'/);
assert.equal([...c04.matchAll(/^        title: /gm)].length,6,'Six cultural chapters required');
assert.equal([...c04.matchAll(/^          '/gm)].length,18,'18 cultural paragraphs required');
assert.match(c04,/image: '\/images\/cuisine\/amok-1600\.webp'/,'Use the existing horizontal Ben Yapp image in preview');
assert.match(c04,/imageAlt: 'Amok de poisson servi dans des feuilles de bananier/);
for(const width of [480,800,1200,1600]) {
  assert.ok(existsSync(`public/images/cuisine/amok-${width}.webp`),`Missing hero width ${width}`);
}
assert.match(c04,/socialImage: '\/images\/cuisine\/amok-alt-1600\.webp'/,'Old social media asset must remain');
assert.match(c04,/socialImageRole: 'article'/,'Existing documentary photo must not be reclassified as illustration');
assert.match(social,/article\.socialImageRole \?\? 'illustration'/);
assert.match(credits,/Photo : Ben Yapp · CC BY 2\.0/,'Keep legally necessary CC attribution in photo credits');
assert.match(c04,/cambodiaembassyuk\.org\/fish-amok-recipe/,'Royal claim must be internally traceable');
assert.match(c04,/audreygillan\.com\/archives\/cambodia-the-art-of-amok/,'Special occasions claim must be sourced internally');
assert.match(c04,/latimes\.com\/archives\/la-xpm-1990/,'Diaspora mention must be internally traceable');
assert.doesNotMatch(c04,/tourismGuide|tourismcambodia\.org/,'Do not retain broken reference');
for(const phrase of [
  'Pourquoi la vapeur change tout',
  'Ce qu’il faut retenir en cuisine',
  'Goûter la base avant',
  'Une préparation liée et parfumée',
  'réussir une texture liée'
]) assert.ok(!c04.includes(phrase),`No old tutorial passage: ${phrase}`);
assert.doesNotMatch(detail, /culture-related|relatedContent|\\/recettes\\/|\\/ingredients\\//, 'Culture article template must never recommend recipes, workshops or ingredient shopping');
assert.match(detail,/'comprendre-amok': \['amok'\]/,'Glossary limited to subject instead of recipe ingredient list');
assert.doesNotMatch(detail,/article\.sources\.map\s*\(/,'Never show documentary bibliography');
assert.equal([...culture.matchAll(/^    slug: '/gm)].length,7);
assert.match(plan,/J11 — Carnet C04 Amok/,'Journal must retain cultural C04 milestone');

console.log('PASS: C04 is a cultural Amok history with no recipe tutorial, public bibliography or route regression.');
