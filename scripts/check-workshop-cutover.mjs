// Static release contract: no browser, TTS, n8n or network requests.
import assert from 'node:assert/strict';
import { existsSync,readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildSync } from 'esbuild';
import { legacyWorkshopRedirects,retiredWorkshopAudioPaths,workshopCutoverApproved,expectedWorkshopHtaccess } from './workshop-cutover-seo.mjs';
const ready=workshopCutoverApproved(),read=p=>readFileSync(p,'utf8');
const page=p=>join('dist',p.replace(/^\//,''),'index.html');
const sitemap=read('dist/sitemap.xml');
const listing=read(page('/apprendre/'));
const social=JSON.parse(read('dist/social-feed.json')).items.filter(item=>item.kind==='atelier');
const {outputFiles}=buildSync({
  stdin:{contents:`
    export { cookingWorkshopGuides } from './src/data/cookingWorkshopGuides';
    export { getWorkshopPresentation } from './src/data/workshopPresentation';
  `,resolveDir:process.cwd()},
  bundle:true,write:false,format:'esm',platform:'node'
});
const {cookingWorkshopGuides,getWorkshopPresentation}=await import(
  'data:text/javascript;base64,'+Buffer.from(outputFiles[0].contents).toString('base64')
);
const releasedGuides=cookingWorkshopGuides.filter(guide=>guide.status==='release_ready');
assert.equal(social.length,ready?releasedGuides.length:legacyWorkshopRedirects.length,'Unexpected active workshop count');
if(ready){
 for(const item of social){
   assert.ok(item.imageUrl,'Released workshop must have a generated social JPEG: '+item.id);
   assert.ok(existsSync(join('dist',new URL(item.imageUrl).pathname.slice(1))),'Missing released social image '+item.id);
 }
}
assert.equal(read('dist/.htaccess'),expectedWorkshopHtaccess(read('public/.htaccess')),'Gated Apache rules mismatch');
assert.equal(retiredWorkshopAudioPaths.length,11,'Only six previous workshop recordings and five outdated V2 files may be pruned');
for(const path of retiredWorkshopAudioPaths)
  assert.equal(existsSync(join('dist',path.replace(/^\//,''))),!ready,
    'Superseded MP3 incorrectly retained or removed: '+path);
for(const [slug,target] of legacyWorkshopRedirects){
  const path='/apprendre/'+slug+'/';
  assert.equal(sitemap.includes('<loc>https://www.cuisine-du-cambodge.com'+path+'</loc>'),!ready,'Old sitemap URL '+slug);
  assert.equal(existsSync(page(path)),!ready,'Old page generated at wrong gate '+slug);
  assert.equal(listing.includes('href="'+path+'"'),!ready,'Old index link '+slug);
  assert.equal(social.some(item=>new URL(item.url).pathname===path),!ready,'Old social link '+slug);
  if(ready)assert.ok(existsSync(page(target)),'Redirect target must exist: '+target);
}
for(const g of cookingWorkshopGuides){
  const slug=g.sourceRecipeSlug;
  const route='/apprendre/pratique/'+getWorkshopPresentation(g).publicSlug+'/';
  const visible=ready&&g.status==='release_ready';
  assert.ok(existsSync(page(route)),'New guide missing '+slug);
  const html=read(page(route));
  assert.equal(/name="robots" content="noindex/.test(html),!visible,'New guide robots '+slug);
  assert.equal(sitemap.includes('<loc>https://www.cuisine-du-cambodge.com'+route+'</loc>'),visible,'New guide sitemap '+slug);
  assert.equal(listing.includes('href="'+route+'"'),visible,'New guide listing '+slug);
  assert.equal(social.some(item=>new URL(item.url).pathname===route),visible,'New guide social '+slug);
  assert.ok(g.audio.asset?.audioUrl,'Approved MP3 reference absent '+slug);
  assert.ok(existsSync(join('dist',g.audio.asset.audioUrl.replace(/^\//,''))),'Built MP3 absent '+slug);
  if(visible){
    assert.equal(g.review.productionApproved,true,'Owner approval missing '+slug);
    assert.ok(read(page('/recettes/'+g.sourceRecipeSlug+'/')).includes('href="'+route+'"'),'Recipe guide link missing '+slug);
  }
}
console.log('PASS: workshop routes, MP3, sitemap, old-URL cutover and social catalog ('+(ready?'release':'draft')+')');
