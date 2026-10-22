import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const all=readFileSync('src/data/culture.ts','utf8');
const page=readFileSync('src/pages/culture/[slug].astro','utf8');
const plan=readFileSync('docs/carnets/PLAN-REFONTE-CARNETS.md','utf8');
const start=all.indexOf("    slug: 'le-riz-symbole-de-vie-au-cambodge'");
const stop=all.indexOf("    slug: 'poivre-de-kampot'");
assert.ok(start>=0 && stop>start,'Historical C01 route must remain');
const c01=all.slice(start,stop);

assert.match(c01,/title: 'Le riz, au cœur de la vie cambodgienne'/);
assert.equal([...c01.matchAll(/^        title: /gm)].length,7,'Seven heritage chapters must be kept');
assert.match(c01,/Un riz récompensé sept fois au niveau mondial/);
assert.match(c01,/partagé la première place du concours/,'Shared World Rice title 2025 must not be lost');
assert.match(c01,/avec le riz vietnamien ST25/,'Vietnam ST25 joint laureate must be explicit');
assert.match(c01,/Des rizières aux marchés, une filière qui relie les territoires/,'The practical closing section must become an economic-cultural narrative');
assert.match(c01,/Sampeah Preah Khe/,'Cultural Water and Moon Festival context must remain');
assert.match(c01,/Ok Ambok/,'Festival rice reference must be culturally grounded');
assert.match(c01,/cambodianess\.com\/index\.php\/article\/exploring-the-roots-of-the-water-festival/,'Primary interview evidence internal');
assert.match(c01,/akp\.gov\.kh\/fr\/post\/detail\/352424/,'Cambodian Water Festival evidence internal');
assert.doesNotMatch(c01,/Comment découvrir le riz cambodgien chez soi \?|Commencez par comparer deux riz|Faites-les cuire séparément|Pour cuisiner, on choisira/,'No old rice-tasting workshop');
assert.match(c01,/gallery: \[/,'Original media gallery must be preserved');
assert.match(c01,/Cambodian_farmers_planting_rice\.jpg/);
assert.match(c01,/Cambodia_rice\.jpg/);
assert.match(c01,/Ak_Ambok\.jpg/);
assert.match(c01,/Cambodia%27s_rice_fields\.jpg/);
for (const author of ['Dmitry A. Mottl','Brad Collis','Chhoukkosal','Willuconquer']) {
  assert.match(page+all,new RegExp(author.replaceAll('.','\\.')),'Mandatory media credits must be kept');
}
assert.doesNotMatch(page,/rice-workshop-link|completeCookingWorkshopCutoverReady|apprendre\/composer-repas-cambodgien/,'C01 page must never funnel to cooking atelier');
assert.match(page,/article\.slug === 'le-riz-symbole-de-vie-au-cambodge'\s*\n\s*\? \[\]/,'No recipe carousel for C01');
assert.doesNotMatch(page,/article\.sources\.map\s*\(/,'No documentary bibliography visible');
assert.equal([...all.matchAll(/^    slug: '/gm)].length,7,'All seven historic slugs must survive');
assert.match(plan,/J14 —/,'C01 must be added to immutable project pilot');

console.log('PASS C01: rice cultural heritage, joint 2025 award, festivals, 4 attributed images, no recipes or public references.');
