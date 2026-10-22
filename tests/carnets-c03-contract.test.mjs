import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';

const culture=readFileSync('src/data/culture.ts','utf8');
const template=readFileSync('src/pages/culture/[slug].astro','utf8');
const social=readFileSync('src/data/socialCatalog.ts','utf8');
const manifest=JSON.parse(readFileSync('src/data/atelier-recette-guides/kroeung-jaune.json','utf8'));

const start=culture.indexOf("    slug: 'comprendre-le-kroeung'");
const end=culture.indexOf("    slug: 'comprendre-amok'");
assert.ok(start>=0&&end>start,'C03 must keep its original URL slug');
const c03=culture.slice(start,end);
assert.match(c03,/title: 'Le kroeung, des gestes qui se transmettent'/);
assert.equal([...c03.matchAll(/^        title: /gm)].length,6);
assert.equal([...c03.matchAll(/^          '/gm)].length,18);
assert.match(c03,/image: '\/images\/cuisine\/v19-mortier-kroeung-1440\.webp'/);
assert.match(c03,/imageAlt: 'Des mains pilent des aromates au mortier/);
for(const width of [800,1200,1440]) {
  assert.ok(existsSync(`public/images/cuisine/v19-mortier-kroeung-${width}.webp`),`Photo responsive ${width} missing`);
}
assert.match(c03,/socialImage: '\/images\/cuisine\/kroeung-1600\.webp'/);
assert.match(c03,/socialImageRole: 'article'/);
assert.match(social,/article\.socialImageRole \?\? 'illustration'/);
assert.doesNotMatch(c03,/url: tourismGuide/);
assert.match(c03,/chefnak\.com\/cambodian-kroeung/);
assert.match(c03,/cambodianess\.com/);
assert.doesNotMatch(template,/article\.sources\.map\s*\(/,'No public bibliography');
assert.equal([...culture.matchAll(/^    slug: '/gm)].length,7);
assert.equal(manifest.media?.finishedPreparationImage,'/images/cuisine/v19-mortier-kroeung-1440.webp');
assert.equal(manifest.media?.rightsValidated,false,'Photo rights remain an unresolved publication gate; do not silently claim approval');
console.log('PASS C03: six chapters, 18 paragraphs, known responsive media, preserved social asset, sources internal and rights gate honest.');
