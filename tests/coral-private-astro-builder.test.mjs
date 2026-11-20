import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {dirname,join} from 'node:path';
import {prepareCoralPrivateAstroOverlay,verifyHistoricalAmokV4,verifyCoralBuiltIndexes} from '../scripts/build-coral-private-astro-release.mjs';
import {preserveCoralSharedPages} from '../scripts/coral-preserve-published-pages.mjs';

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
  assert.equal(manifest.privateTranscript,true);
  assert.equal(sha(await readFile(locations.audioPath)),f.intent.mp3_sha256);
  await assert.rejects(prepareCoralPrivateAstroOverlay({
   root:f.root,blueprint:f.blueprint,intent:f.intent,audioBytes:f.audio}),/REGISTRY|TARGET_EXISTS/);
 }finally{await rm(f.root,{recursive:true,force:true});}
});

test('scoped release keeps the bytes and links of workshops absent from the pinned checkout',async()=>{
 const root=await mkdtemp(join(tmpdir(),'coral-published-pages-'));
 try{
  const directory=join(root,'live'),dist=join(root,'dist');
  const path='/apprendre/pratique/test-course/';
  const link='<a href="'+path+'">Nouveau</a>';
  const old='<a href="/apprendre/pratique/untracked-previous-course/">Publié</a>';
  const recipeBlock='<section class="recipe-workshops" aria-label="Préparer la recette dans un atelier complet"><div>';
  const catalogue='<section class="v16-workshop-list" aria-label="Ateliers de cuisine complets">';
  const card='<article class="v16-workshop"><div class="v16-workshop-number">01</div>';
  const oldLocation='<url><loc>https://www.cuisine-du-cambodge.com/apprendre/pratique/amok-trey/</loc></url>';
  const location='<url><loc>https://www.cuisine-du-cambodge.com'+path+'</loc></url>';
  const files=[
    ['recettes/test-recipe/index.html',recipeBlock+old+'</div></section>',recipeBlock+link+'</div></section>'],
    ['apprendre/index.html',catalogue+card+old+'</article></section>',catalogue+card+link+'</article></section>'],
    ['sitemap.xml','<urlset>'+oldLocation+'</urlset>','<urlset>'+location+'</urlset>']
  ];
  for(const [file,live,built] of files){
   for(const [folder,content] of [[directory,live],[dist,built]]){
    const target=join(folder,file);
    await mkdir(dirname(target),{recursive:true});
    await writeFile(target,content);
   }
  }
  const hash='1'.repeat(64);
  const intent={
   contract:'cdc-coral-studio-release-intent-v1',creation_id:'c-'+'a'.repeat(24),creation_version:1,
   request_id:'b'.repeat(48),binding_sha256:hash,recipe_sha256:hash,recipe_slug:'test-recipe',
   candidate_public_slug:'test-course',candidate_workshop_slug:'atelier-pratique-test-course',
   candidate_audio_path:'audio/workshops/atelier-pratique-test-course/atelier-coral-'+hash.slice(0,12)+'.mp3',
   mp3_sha256:hash,mp3_bytes:2048,mp3_duration_seconds:7,voice:'coral',model:'gpt-4o-mini-tts',
   speed_milli:930,human_publication_consent:true,publication_ready:false,deployment_triggered:false,
   chapters:['intro','installer','preparer','assembler','maitriser','rectifier','terminer']
    .map((id,i)=>({id,startSec:i,endSec:i+1,text_sha256:hash}))
  };
  const baseline=await preserveCoralSharedPages({intent,directory,dist});
  const outputs=await Promise.all(files.map(([file])=>readFile(join(dist,file),'utf8')));
  assert.deepEqual(baseline,Object.fromEntries(files.map(([file,live])=>[file,sha(live)])));
  assert.equal(outputs[0].replace(link,''),files[0][1]);
  assert.equal(outputs[1].replace(card.replace('01','02')+link+'</article>',''),files[1][1]);
  assert.equal(outputs[2].replace('  '+location+'\n',''),files[2][1]);
 }finally{await rm(root,{recursive:true,force:true});}
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

test('built indexes bind the workshop to the exact approved canonical recipe',async()=>{
 const dist=await mkdtemp(join(tmpdir(),'coral-index-binding-'));
 try{
  const workshop={id:'atelier:test-course',model:'cookingWorkshopGuides',fingerprint:'a'.repeat(64)};
  const recipe={id:'recette:test-recipe',fingerprint:'b'.repeat(64)};
  const intent={candidate_public_slug:'test-course',recipe_slug:'test-recipe',recipe_sha256:recipe.fingerprint};
  const save=(path,items)=>writeFile(join(dist,path),JSON.stringify({items}));
  await save('social-feed.json',[{id:workshop.id,url:'https://www.cuisine-du-cambodge.com/apprendre/pratique/test-course/'}]);
  await save('editorial-source-index.json',[workshop,recipe]);
  await save('editorial-guided-fields.json',[workshop]);
  assert.equal(await verifyCoralBuiltIndexes({dist,intent}),workshop.fingerprint);
  await assert.rejects(verifyCoralBuiltIndexes({dist,intent:{...intent,recipe_sha256:'c'.repeat(64)}}),/RECIPE_SHA_STALE/);
  await save('editorial-guided-fields.json',[]);
  await assert.rejects(verifyCoralBuiltIndexes({dist,intent}),/WORKSHOP_INDEX_MISMATCH/);
 }finally{await rm(dist,{recursive:true,force:true});}
});
