import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const culture = readFileSync('src/data/culture.ts','utf8');
const articlePage = readFileSync('src/pages/culture/[slug].astro','utf8');
const index = readFileSync('src/pages/culture/index.astro','utf8');
const credits = readFileSync('src/pages/credits-photos.astro','utf8');
const socialCatalog = readFileSync('src/data/socialCatalog.ts','utf8');

const start = culture.indexOf("    slug: 'kep-marche-crabe-poivre'");
const end = culture.indexOf("    slug: 'prahok-fermentation-umami'");
assert.ok(start>=0&&end>start,'Kep canonical slug must be preserved');
const c05 = culture.slice(start,end);

assert.match(c05,/title: 'Kep, au marché des crabes, entre mer et poivre'/);
assert.equal([...c05.matchAll(/^        title: /gm)].length,6,'Kep must have six chapters');
assert.equal([...c05.matchAll(/^        paragraphs: \[/gm)].length,6,'Kep must have six sets of paragraphs');
assert.equal([...c05.matchAll(/^          '/gm)].length,18,'Kep must contain 18 paragraphs');
assert.doesNotMatch(c05,/url: tourismGuide/,'Broken old tourism URL must be removed from Kep');
assert.match(c05,/seafdec\.or\.th/,'Fisheries evidence must be retained internally');
assert.match(c05,/fao\.org\/cambodia\/news/,'2026 fisheries protection must be internally verifiable');
assert.match(c05,/imageAlt: 'Étals et visiteurs sous les auvents colorés du marché de Kep, au Cambodge'/);
assert.match(c05,/Kep_Crab_Market\.jpg\/1280px-Kep_Crab_Market\.jpg/,'Staging hero is real Kep market, not pepper sacks');
assert.match(c05,/socialImage: '\/images\/cuisine\/kep-market-1600\.webp'/,'Social catalogue image is retained until approved replacement');
assert.match(c05,/socialImageRole: 'article'/,'Legacy documentary photo must stay typed as photo, not illustration');
assert.match(socialCatalog,/article\.socialImage \?\? article\.image/);
assert.match(socialCatalog,/article\.socialImageRole \?\? 'illustration'/,'Role override must avoid social regression for C05');
assert.match(credits,/Photo : Mx\. Granger · CC0 1\.0/);
assert.match(credits,/Photo : PsamatheM · CC BY-SA 4\.0/);
assert.match(index,/featuredArticle\.imageWidths\.length \? imageSrcSet/,'No empty srcset for external image');
assert.doesNotMatch(articlePage,/article\.sources\.map\s*\(/,'No public bibliography');
assert.equal([...culture.matchAll(/^    slug: '/gm)].length,7,'All seven original slugs must survive');

console.log('PASS: C05 six chapters; coastal sustainability facts; separate media credits; internal-only references; social catalogue preserved.');
