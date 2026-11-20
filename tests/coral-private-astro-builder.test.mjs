import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {prepareCoralPrivateAstroOverlay,verifyHistoricalAmokV4} from '../scripts/build-coral-private-astro-release.mjs';

const sha=x=>createHash('sha256').update(x).digest('hex');
async function fixture(){
 const root=await mkdtemp(join(tmpdir(),'coral-private-overlay-'));
 for(const d of ['public/images/cuisine','src/data/atelier-recette-guides',
  'src/data/atelier-recette-audio'])
  await mkdir(join(root,d),{recursive:true});
 const registry="import kroeung from './atelier-recette-guides/kroeung-jaune.json';\n"+
  "export const cookingWorkshopGuides=[kroeung];\n";
 await writeFile(join(root,'src/data/cookingWorkshopGuides.ts'),registry);
 const image=Buffer.alloc(150,8);
 await writeFile(join(root,'public/images/cuisine/test-dish.webp'),image);
 const audio=Buffer.alloc(2048,42),audioHash=sha(audio);
 const audioRel='audio/workshops/atelier-pratique-test-course/atelier-coral-'+
   audioHash.slice(0,12)+'.mp3';
 const intent={candidate_public_slug:'test-course',recipe_slug:'amok-trey',
  candidate_audio_path:audioRel,mp3_bytes:audio.length,mp3_sha256:audioHash,
  visualSha256:sha(image),mp3_duration_seconds:90};
 const blueprint={slug:'test-course',sourceRecipeSlug:'amok-trey',
  media:{finishedPreparationImage:'/images/cuisine/test-dish.webp'},
  audio:{asset:{audioUrl:'/'+audioRel,
   chapters:[{id:'intro',title:'Introduction',startSec:0,endSec:90}],
   scriptSha256:'f'.repeat(64)}}};
 return {root,registry,intent,blueprint,audio};
}
test('private overlay registers one new Astro workshop and audio, without changing six historical files',async()=>{
 const f=await fixture();
 try{
  const locations=await prepareCoralPrivateAstroOverlay({
   root:f.root,blueprint:f.blueprint,intent:f.intent,audioBytes:f.audio});
  const text=await readFile(locations.registryPath,'utf8');
  assert.match(text,/import kroeung/);
  assert.match(text,/import coralStudioPrivate from '.\/atelier-recette-guides\/test-course.json'/);
  assert.match(text,/cookingWorkshopGuides=\[kroeung,coralStudioPrivate\]/);
  const saved=JSON.parse(await readFile(locations.guidePath,'utf8'));
  assert.equal(saved.slug,'test-course');
  const manifest=JSON.parse(await readFile(locations.audioManifestPath,'utf8'));
  assert.equal(manifest.atelier,'test-course');
  assert.equal(manifest.sha256,f.intent.mp3_sha256);
  assert.equal(sha(await readFile(locations.audioPath)),f.intent.mp3_sha256);
  await assert.rejects(prepareCoralPrivateAstroOverlay({
   root:f.root,blueprint:f.blueprint,intent:f.intent,audioBytes:f.audio}),/REGISTRY|TARGET_EXISTS/);
 }finally{await rm(f.root,{recursive:true,force:true});}
});
test('private build overlay fails closed when a reviewed image or audio changes',async()=>{
 const f=await fixture();
 try{
  await assert.rejects(prepareCoralPrivateAstroOverlay({
   root:f.root,blueprint:f.blueprint,intent:{...f.intent,visualSha256:'0'.repeat(64)},
   audioBytes:f.audio}),/MEDIA_SHA/);
  await assert.rejects(prepareCoralPrivateAstroOverlay({
   root:f.root,blueprint:f.blueprint,intent:f.intent,
   audioBytes:Buffer.alloc(2048,7)}),/OVERLAY_IDENTITY/);
  assert.equal(await readFile(join(f.root,'src/data/cookingWorkshopGuides.ts'),'utf8'),f.registry);
 }finally{await rm(f.root,{recursive:true,force:true});}
});

test('pinned build refuses any loss of Amok Trey V4 audio, page or catalogue',async()=>{
 const root=await mkdtemp(join(tmpdir(),'coral-amok-preservation-'));
 try{
  const dist=join(root,'dist');
  const mp3Path='audio/workshops/atelier-pratique-amok-trey/atelier-coral-v4.mp3';
  const pagePath='apprendre/pratique/amok-trey/index.html';
  const mp3=Buffer.from('ID3-SYNTHETIC-AMOK'),page=Buffer.from('<html>Amok V4 original</html>');
  const manifest={files:[
   {path:mp3Path,sha256:sha(mp3)},
   {path:pagePath,sha256:sha(page)},
   {path:'other-one',sha256:'a'.repeat(64)},
   {path:'other-two',sha256:'b'.repeat(64)},
   {path:'other-three',sha256:'c'.repeat(64)}
  ]};
  await mkdir(join(root,'releases/amok-trey-v4'),{recursive:true});
  await writeFile(join(root,'releases/amok-trey-v4/manifest.json'),JSON.stringify(manifest));
  for(const [path,bytes] of [
   [mp3Path,mp3],[pagePath,page],
   ['apprendre/index.html',Buffer.from('Atelier /apprendre/pratique/amok-trey/')],
   ['sitemap.xml',Buffer.from('<loc>/apprendre/pratique/amok-trey/</loc>')]
  ]){
   const target=join(dist,path);await mkdir(dirname(target),{recursive:true});
   await writeFile(target,bytes);
  }
  assert.equal(await verifyHistoricalAmokV4({root,dist}),true);
  await writeFile(join(dist,pagePath),Buffer.from('regressed page'));
  await assert.rejects(verifyHistoricalAmokV4({root,dist}),/AMOK_REGRESSION/);
  await writeFile(join(dist,pagePath),page);
  await writeFile(join(dist,'sitemap.xml'),Buffer.from('<xml>missing atelier</xml>'));
  await assert.rejects(verifyHistoricalAmokV4({root,dist}),/AMOK_CATALOGUE_REGRESSION/);
 }finally{await rm(root,{recursive:true,force:true});}
});
