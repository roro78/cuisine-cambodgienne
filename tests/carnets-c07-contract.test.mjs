import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const data=readFileSync('src/data/culture.ts','utf8');
const template=readFileSync('src/pages/culture/[slug].astro','utf8');
const credits=readFileSync('src/pages/credits-photos.astro','utf8');
const social=readFileSync('src/data/socialCatalog.ts','utf8');
const plan=readFileSync('docs/carnets/PLAN-REFONTE-CARNETS.md','utf8');

const start=data.indexOf("    slug: 'construire-repas-cambodgien'");
const end=data.indexOf("\n  }\n];",start);
assert.ok(start>=0&&end>start,'C07 must retain its canonical URL');
const c07=data.slice(start,end);

assert.match(c07,/title: 'À la table cambodgienne, ce que partager veut dire'/);
assert.match(c07,/eyebrow: 'Vie quotidienne'/);
assert.equal([...c07.matchAll(/^        title: /gm)].length,6,'C07 must have six social-history chapters');
assert.equal([...c07.matchAll(/^          '/gm)].length,18,'C07 must have eighteen cultural paragraphs');
assert.match(c07,/La solidarité peut dépasser la maison/);
assert.match(c07,/Des tables qui changent avec la vie/);
assert.doesNotMatch(c07,/title: 'Composer à la maison'|Associer des goûts et des textures|Pour commencer simplement : un riz jasmin/,'No recipe or menu instruction in C07');
assert.match(c07,/image: '\/images\/cuisine\/v19-table-partage-desktop-1440\.webp'/);
assert.match(c07,/imageAlt: 'Illustration éditoriale de convives partageant des plats et du riz/);
for(const width of [800,1200,1440]) {
  assert.ok(existsSync(`public/images/cuisine/v19-table-partage-desktop-${width}.webp`),`Missing image variant ${width}`);
}
assert.match(c07,/socialImage: '\/images\/cuisine\/v17-table-meal-1600\.jpg'/,'Preexisting social image must stay available');
assert.match(c07,/socialImageRole: 'article'/,'Preexisting social photo must not be relabeled as AI illustration');
assert.match(social,/article\.socialImageRole \?\? 'illustration'/,'Social compatibility gate');
assert.match(credits,/une composition éditoriale d’un repas autour d’une table/,'The existing credit/illustrative disclaimer must remain');
assert.doesNotMatch(template, /culture-related|relatedContent|\\/recettes\\/|\\/ingredients\\//, 'Culture article template must never recommend recipes, workshops or ingredient shopping');
assert.match(template,/'construire-repas-cambodgien': \['riz-jasmin'\]/,'No amok or lok-lak menu suggestions in C07 glossary');
assert.match(template,/Illustration éditoriale d’un repas partagé/,'Site must clearly distinguish illustrative scene from documentary photography');
assert.match(c07,/journals\.sagepub\.com\/doi\/10\.1177\/0956247819863246/,'Social-solidarity claim must remain internally traceable');
assert.match(c07,/chefnak\.com\/cambodian-cuisine-guide/,'Table customs must remain internally traceable');
assert.doesNotMatch(c07,/tourismGuide/,'Broken generic tourism reference removed');
assert.doesNotMatch(template,/article\.sources\.map\s*\(/,'No documentary sources in public page');
assert.equal([...data.matchAll(/^    slug: '/gm)].length,7,'Preserve all seven historic Carnets');
assert.match(plan,/J13 —/,'Immutable journal must record C07 milestone');

console.log('PASS C07: sociability not menu instructions, illustrative photo labeled, internal sources, seven slugs retained.');
