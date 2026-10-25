import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';

const culture=readFileSync('src/data/culture.ts','utf8');
const detail=readFileSync('src/pages/culture/[slug].astro','utf8');
const index=readFileSync('src/pages/culture/index.astro','utf8');
const social=readFileSync('src/data/socialCatalog.ts','utf8');

const start=culture.indexOf("    slug: 'comprendre-le-kroeung'");
const end=culture.indexOf("    slug: 'comprendre-amok'");
assert.ok(start>=0 && end>start,'The existing /culture/comprendre-le-kroeung/ slug must remain unchanged');
const c03=culture.slice(start,end);

assert.match(c03,/title: 'Le kroeung, une mémoire de la cuisine khmère'/);
assert.match(c03,/eyebrow: 'Mémoire culinaire'/);
assert.equal([...c03.matchAll(/^        title: /gm)].length,5,'Exactly five historical and cultural chapters');
assert.equal([...c03.matchAll(/^          '/gm)].length,15,'Exactly 15 cultural paragraphs');
assert.match(c03,/image: '\/images\/cuisine\/carnet-kroeung-memoire-1536\.webp'/,'Verified editorial hero C03');
assert.match(c03,/imageAlt: 'Scène illustrative de deux générations/,'New cover should be unmistakably illustrative');
for(const width of [480,800,1200,1600]) {
  assert.ok(existsSync(`public/images/cuisine/kroeung-${width}.webp`),`Old hero variant ${width} must remain available`);
}
assert.match(c03,/socialImage: '\/images\/cuisine\/carnet-kroeung-memoire-1536\.webp'/,'Social image matches the cultural hero');
assert.match(c03,/socialImageRole: 'illustration'/,'Generative illustration must not be mislabeled a documentary photo');
for(const width of [480,800,1200,1536]) assert.ok(existsSync('public/images/cuisine/carnet-kroeung-memoire-'+width+'.webp'),'Missing new C03 variant '+width);
assert.match(social,/article\.socialImage \?\? article\.image/,'Other social cards remain compatible');
assert.doesNotMatch(c03,/tourismGuide|tourismcambodia\.org/,'Broken generic document must not appear in C03');
assert.match(c03,/yourstory\.tenement\.org\/stories\/kroeung/,'Cultural memory should have a verifiable internal record');
assert.match(c03,/mekongreview\.com\/eating-amok/,'Historical claims must be internally traceable');

for (const phrase of [
  'Le mortier change notre manière de préparer',
  'Chaque aromate prend sa place',
  'Du récit au geste, sans confondre les deux',
  'Pour découvrir cette transformation concrètement'
]) assert.ok(!c03.includes(phrase),`Tutorial passage must be removed from C03: ${phrase}`);

assert.ok(!/culture-related|relatedContent/.test(detail) && !detail.includes('/recettes/') && !detail.includes('/ingredients/'), 'Culture article template must never recommend recipes or ingredients');
assert.doesNotMatch(detail, /GlossaryStrip|glossaryByArticle|getGlossaryEntries/, 'Carnets must not show instructional GlossaryStrip blocks');
assert.doesNotMatch(detail,/article\.sources\.map\s*\(/,'Documentary sources remain private');
assert.match(index,/const heritagePath = \[/,'Culture index must provide cultural-only navigation');
assert.doesNotMatch(index,/culinaryPath|\/(?:apprendre|recettes)\//,'Culture index must not push towards practical workshops or recipes');
assert.equal([...culture.matchAll(/^    slug: '/gm)].length,7,'All original slugs must remain stable');

console.log('PASS C03: history, memory and diaspora only; no tutorial or recipe funnel; editorial proofs remain internal.');
