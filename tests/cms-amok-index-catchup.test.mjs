import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,lstat} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {prepareAmokIndexCatchup} from '../scripts/prepare-amok-index-catchup.mjs';

const ORIGIN='https://www.cuisine-du-cambodge.com/';
const NAMES=['social-feed.json','editorial-source-index.json','editorial-guided-fields.json'];
const AMOK='atelier:atelier-pratique-amok-trey';
const IMAGE='social-assets/atelier-atelier-pratique-amok-trey.jpg';
const recipe='recette:amok-trey',historic='atelier:historic-workshop';
const hex=(char,len)=>char.repeat(len);
const currentSocialRecipe={id:recipe,kind:'recette',fingerprint:hex('a',16),
 title:'Amok Trey',url:ORIGIN+'recettes/amok-trey/'};
const currentSocialWorkshop={id:historic,kind:'atelier',fingerprint:hex('b',16),
 title:'Existing workshop',url:ORIGIN+'apprendre/pratique/historic-workshop/'};
const amokSocial={id:AMOK,kind:'atelier',fingerprint:hex('c',16),
 title:'Amok Trey V4',url:ORIGIN+'apprendre/pratique/amok-trey/',
 originalImageUrl:ORIGIN+'images/cuisine/amok.webp',imageUrl:ORIGIN+IMAGE};
const baseRecipeFields={intro:'Intro',description:'Description',context:'Context',
 baseServings:4,prepTime:'20 min',cookTime:'25 min',
 ingredients:[{name:'poisson',quantity:500,unit:'g'}],
 steps:[{title:'Mélanger',text:'Mélanger le poisson'}]};
const amokPC={version:1,sourceFingerprint:hex('d',64),
 steps:[{index:0,sourceText:'Mélanger le poisson',anchors:['le poisson']}]};
function fixture(){
 const social={product:'cuisine-du-cambodge',schemaVersion:1,siteUrl:ORIGIN,
  items:[currentSocialRecipe,currentSocialWorkshop]};
 const canonical={product:'cuisine-du-cambodge',schemaVersion:1,
  digest:'sha256-full-astro-record-v1',
  items:[{id:recipe,kind:'recette',model:'recipes',fingerprint:hex('d',64)},
   {id:historic,kind:'atelier',model:'cookingWorkshopGuides',fingerprint:hex('e',64)}]};
 const guided={product:'cuisine-du-cambodge',schemaVersion:1,
  dataContract:'approved-public-form-fields-v2',items:[
   {id:recipe,model:'recipes',fingerprint:hex('d',64),editable:true,
    portionContract:structuredClone(amokPC),fields:structuredClone(baseRecipeFields)},
   {id:historic,model:'cookingWorkshopGuides',fingerprint:hex('e',64),
    editable:true,fields:{finalPreparation:'Historic',learningGoal:'Historic lesson',phases:[]}}
  ]};
 const live=[social,canonical,guided];
 const built=structuredClone(live);
 // Build can have a new source fingerprint for existing recipe; the live
 // approved public row and its protected portion bindings must not change.
 built[0].items[0].title='A different local recipe build';
 built[0].items[0].fingerprint=hex('f',16);
 built[1].items[0].fingerprint=hex('f',64);
 built[2].items[0].fingerprint=hex('f',64);
 delete built[2].items[0].portionContract;
 built[0].items.push(structuredClone(amokSocial));
 built[1].items.push({id:AMOK,kind:'atelier',model:'cookingWorkshopGuides',
  fingerprint:hex('1',64)});
 built[2].items.push({id:AMOK,model:'cookingWorkshopGuides',
  fingerprint:hex('1',64),editable:true,
  fields:{finalPreparation:'Amok finished',learningGoal:'Steam fish',phases:[]}});
 return {live,built};
}
async function setup(t){
 const root=await mkdtemp(join(tmpdir(),'cdc-amok-catchup-'));
 t.after(async()=>rm(root,{recursive:true,force:true}));
 const dist=join(root,'dist'),out=join(root,'candidate');
 await mkdir(dist);
 const {live,built}=fixture();
 async function storeBuilt(){
  for(let i=0;i<NAMES.length;i++)await writeFile(join(dist,NAMES[i]),JSON.stringify(built[i]));
 }
 await storeBuilt();
 await mkdir(join(dist,'social-assets'));
 const jpeg=Buffer.concat([Buffer.from([0xff,0xd8,0xff,0xe0]),
  Buffer.alloc(2000,42),Buffer.from([0xff,0xd9])]);
 await writeFile(join(dist,IMAGE),jpeg);
 const fetcher=async url=>{
  const name=new URL(url).pathname.slice(1);
  const i=NAMES.indexOf(name);
  assert.notEqual(i,-1);
  return new Response(JSON.stringify(live[i]),{status:200,
   headers:{'content-type':'application/json'}});
 };
 return {root,dist,out,live,built,fetcher,storeBuilt};
}
test('Amok V4 catch-up preserves prior portion contract and all historical rows',async t=>{
 const f=await setup(t);
 const result=await prepareAmokIndexCatchup(f);
 assert.equal(result.deployable,false);
 assert.equal(result.published,false);
 assert.equal(result.files.length,4);
 assert.equal(result.recordsBefore.canonical,2);
 assert.equal(result.recordsCandidate.canonical,3);
 assert.deepEqual(result.existingSourceFingerprintDifferences,[recipe]);
 for(let i=0;i<NAMES.length;i++){
  const out=JSON.parse(await readFile(join(f.out,NAMES[i]),'utf8'));
  assert.deepEqual(out.items.slice(0,2),f.live[i].items);
  assert.deepEqual(out.items.at(-1),f.built[i].items.at(-1));
 }
 const protectedRecipe=JSON.parse(await readFile(join(f.out,NAMES[2]),'utf8')).items[0];
 assert.deepEqual(protectedRecipe.portionContract,amokPC);
 assert.deepEqual(await readFile(join(f.out,IMAGE)),await readFile(join(f.dist,IMAGE)));
 const manifest=JSON.parse(await readFile(join(f.out,'CANDIDATE-MANIFEST-PRIVATE.json'),'utf8'));
 assert.equal(manifest.privateStudioApprovalsChecked,false);
 assert.equal(manifest.privateBackupVerified,false);
 assert.equal(manifest.preconditionsMustMatchLiveHashes,true);
});
test('reject changed Amok source contract and never create candidate',async t=>{
 const f=await setup(t);
 f.live[2].items[0].portionContract.sourceFingerprint=hex('a',64);
 await assert.rejects(prepareAmokIndexCatchup(f),/GUIDED_PORTION_CONTRACT/);
 await assert.rejects(lstat(f.out),{code:'ENOENT'});
});
test('reject losing an existing editorial row during catch-up',async t=>{
 const f=await setup(t);
 for(const index of f.built)index.items.splice(1,1);
 await f.storeBuilt();
 await assert.rejects(prepareAmokIndexCatchup(f),/NOT_SINGLE_CATCHUP|MISSING_HISTORY/);
});
test('reject an unrelated additional article',async t=>{
 const f=await setup(t);
 for(const index of f.built){
  const copy={...index.items[1],id:'atelier:unrelated-extra'};
  index.items.push(copy);
 }
 await f.storeBuilt();
 await assert.rejects(prepareAmokIndexCatchup(f),/NOT_SINGLE_CATCHUP/);
});
test('reject missing social image, even with valid indexes',async t=>{
 const f=await setup(t);
 await writeFile(join(f.dist,IMAGE),Buffer.from('NOT JPEG'));
 await assert.rejects(prepareAmokIndexCatchup(f),/JPEG_INTEGRITY/);
});
test('reject foreign social URL for new Amok identity',async t=>{
 const f=await setup(t);
 f.built[0].items.at(-1).url='https://other.example/amok/';
 await f.storeBuilt();
 await assert.rejects(prepareAmokIndexCatchup(f),/AMOK_SOCIAL_IDENTITY/);
});
test('a production index read error cannot write anything',async t=>{
 const f=await setup(t);
 await assert.rejects(prepareAmokIndexCatchup({
  ...f,fetcher:async()=>new Response('offline',{status:503})
 }),/REMOTE_INDEX/);
 await assert.rejects(lstat(f.out),{code:'ENOENT'});
});
test('refuse placing candidate inside the Astro build directory',async t=>{
 const f=await setup(t);
 await assert.rejects(prepareAmokIndexCatchup({
  ...f,out:join(f.dist,'out')
 }),/OUTPUT_LOCATION/);
});
