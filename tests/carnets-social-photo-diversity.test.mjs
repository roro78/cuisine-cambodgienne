import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const culture=readFileSync('src/data/culture.ts','utf8');
const index=readFileSync('src/pages/culture/index.astro','utf8');
const cut=slug=>{
 const a=culture.indexOf("slug: '"+slug+"'");
 assert.ok(a>0,'Missing '+slug);
 const b=culture.indexOf("\n  },",a);
 return culture.slice(a,b<0?undefined:b);
};
assert.match(index,/const momentDefinitions = \[/);
assert.match(index,/cultureArticles\.find\(\(entry\) => entry\.slug === definition\.slug\)/);
assert.match(index,/new Set\(moments\.map\(\(moment\) => moment\.image\)\)/);
assert.match(index,/alt=\{moment\.imageAlt\}/);
assert.match(index,/srcset=\{moment\.imageWidths/);
assert.doesNotMatch(index,/image:\s*'\/images\/cuisine\/v17-table-meal-1600\.jpg'/,'No recycled restaurant image');
const m03=cut('comprendre-le-kroeung');
const m07=cut('construire-repas-cambodgien');
const m01=cut('le-riz-symbole-de-vie-au-cambodge');
assert.match(m03,/socialImage: '\/images\/cuisine\/carnet-kroeung-memoire-1536\.webp'/);
assert.match(m07,/socialImage: '\/images\/cuisine\/v19-table-partage-desktop-1440\.webp'/);
assert.match(m01,/socialImage: '\/images\/cuisine\/v17-khmer-table-1280\.webp'/);
assert.match(m01,/image: 'https:\/\/upload\.wikimedia\.org/,'Documentary rizière article preserved');
for(const filename of ['carnet-kroeung-memoire-1536.webp','v19-table-partage-desktop-1440.webp','v17-khmer-table-1280.webp']){
 assert.ok(existsSync('public/images/cuisine/'+filename),filename+' missing');
}
assert.match(m03,/socialImageRole: 'illustration'/);
assert.match(m07,/socialImageRole: 'illustration'/);
console.log('PASS Carnets distinct social media and listing; original articles preserved.');
