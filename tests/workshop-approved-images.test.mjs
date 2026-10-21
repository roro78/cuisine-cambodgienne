import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
const photos={
  "kroeung-jaune": "/images/cuisine/v19-mortier-kroeung-1440.webp",
  "lok-lak": "/images/cuisine/v19-lok-lak-1440.webp",
  "samlor-machu": "/images/cuisine/v18-samlor-machu.webp",
  "num-banh-chok": "/images/cuisine/v19-num-banh-chok-1440.webp",
  "kuy-teav": "/images/cuisine/v18-kuy-teav.webp",
  "bai-sach-chrouk": "/images/cuisine/v19-bai-sach-chrouk-1440.webp"
};
for(const [slug,expected] of Object.entries(photos))test('Image approuvée : '+slug,()=>{
  const guide=JSON.parse(readFileSync('src/data/atelier-recette-guides/'+slug+'.json','utf8'));
  assert.equal(guide.media.finishedPreparationImage,expected);
  assert.equal(guide.media.imageValidated,true,'Image selected by owner');
  assert.equal(guide.media.rightsValidated,false,'Do not invent licensing attestations');
  assert.equal(guide.review.productionApproved,true,'Explicit owner release approval');
  assert.equal(guide.status,'release_ready');
  assert.equal(guide.releaseAuthorization?.ownerApproved,true);
  assert.equal(guide.review.mobileValidated,false,'No invented phone QA');
  assert.equal(guide.review.desktopValidated,false,'No invented desktop QA');
  const asset=join('public',expected.slice(1));
  assert.ok(existsSync(asset),'Missing pre-existing approved visual '+expected);
  const bytes=readFileSync(asset);
  assert.equal(bytes.toString('ascii',0,4),'RIFF');
  assert.equal(bytes.toString('ascii',8,12),'WEBP');
});
test('Pages ateliers : les visuels approuvés sont servis dès le brouillon, sans prétendre être des photos',()=>{
 for(const path of ['src/pages/apprendre/pratique/[slug].astro','src/pages/apprendre/pratique/kroeung-jaune.astro']){
  const text=readFileSync(path,'utf8');
  assert.match(text,/media.finishedPreparationImage \|\| recipe.image/);
  assert.doesNotMatch(text,/Photographie de la préparation terminée|photographie finale à valider|Photographie du kroeung jaune terminé/);
  assert.doesNotMatch(text,/image générée par IA|voix IA/i);
 }
});
