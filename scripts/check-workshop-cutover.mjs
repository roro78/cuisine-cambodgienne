// Static release contract: no browser, TTS, n8n or network requests.
import assert from 'node:assert/strict';
import { existsSync,readFileSync } from 'node:fs';
import { join } from 'node:path';
import { legacyWorkshopRedirects,workshopCutoverApproved,expectedWorkshopHtaccess } from './workshop-cutover-seo.mjs';
const ready=workshopCutoverApproved(),read=p=>readFileSync(p,'utf8');
const page=p=>join('dist',p.replace(/^\//,''),'index.html');
const sitemap=read('dist/sitemap.xml');
const listing=read(page('/apprendre/'));
const social=JSON.parse(read('dist/social-feed.json')).items.filter(item=>item.kind==='atelier');
assert.equal(social.length,6,'Expected six active workshop sources');
assert.equal(read('dist/.htaccess'),expectedWorkshopHtaccess(read('public/.htaccess')),'Gated Apache rules mismatch');
for(const [slug,target] of legacyWorkshopRedirects){
  const path='/apprendre/'+slug+'/';
  assert.equal(sitemap.includes('<loc>https://www.cuisine-du-cambodge.com'+path+'</loc>'),!ready,'Old sitemap URL '+slug);
  assert.equal(existsSync(page(path)),!ready,'Old page generated at wrong gate '+slug);
  assert.equal(listing.includes('href="'+path+'"'),!ready,'Old index link '+slug);
  assert.equal(social.some(item=>new URL(item.url).pathname===path),!ready,'Old social link '+slug);
  if(ready)assert.ok(existsSync(page(target)),'Redirect target must exist: '+target);
}
for(const slug of ['kroeung-jaune','lok-lak','samlor-machu','num-banh-chok','kuy-teav','bai-sach-chrouk']){
  const g=JSON.parse(read('src/data/atelier-recette-guides/'+slug+'.json'));
  const route=slug==='kroeung-jaune'?'/apprendre/pratique/kroeung-jaune/':'/apprendre/pratique/'+g.slug+'/';
  assert.ok(existsSync(page(route)),'New guide missing '+slug);
  const html=read(page(route));
  assert.equal(/name="robots" content="noindex/.test(html),!ready,'New guide robots '+slug);
  assert.equal(sitemap.includes('<loc>https://www.cuisine-du-cambodge.com'+route+'</loc>'),ready,'New guide sitemap '+slug);
  assert.equal(listing.includes('href="'+route+'"'),ready,'New guide listing '+slug);
  assert.equal(social.some(item=>new URL(item.url).pathname===route),ready,'New guide social '+slug);
  assert.ok(g.audio.asset?.audioUrl,'Approved MP3 reference absent '+slug);
  assert.ok(existsSync(join('dist',g.audio.asset.audioUrl.replace(/^\//,''))),'Built MP3 absent '+slug);
  if(ready){
    assert.equal(g.review.productionApproved,true,'Owner approval missing '+slug);
    assert.ok(read(page('/recettes/'+g.sourceRecipeSlug+'/')).includes('href="'+route+'"'),'Recipe guide link missing '+slug);
  }
}
console.log('PASS: six workshop routes, MP3, sitemap, old-URL cutover and social catalog ('+(ready?'release':'draft')+')');
