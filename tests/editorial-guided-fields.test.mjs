import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

test('public guided fields match full canonical source versions without leaking scripts/sources',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'cdc-guided-'));
 try {
  const a=await build({entryPoints:[fileURLToPath(new URL('../src/pages/editorial-guided-fields.json.ts',import.meta.url))],
   bundle:true,format:'esm',platform:'node',target:'node22',write:false,logLevel:'silent'});
  const b=await build({entryPoints:[fileURLToPath(new URL('../src/pages/editorial-source-index.json.ts',import.meta.url))],
   bundle:true,format:'esm',platform:'node',target:'node22',write:false,logLevel:'silent'});
  const guidedPath=join(dir,'guided.mjs'), indexPath=join(dir,'canonical.mjs');
  await writeFile(guidedPath,a.outputFiles[0].text);
  await writeFile(indexPath,b.outputFiles[0].text);
  const guided=await import(pathToFileURL(guidedPath).href), canon=await import(pathToFileURL(indexPath).href);
  const payload=await (await guided.GET({})).json();
  assert.equal(payload.schemaVersion,1);
  assert.equal(payload.dataContract,'approved-public-form-fields-v1');
  const index=new Map(canon.getEditorialSourceIndex().map(x=>[x.id,x]));
  assert.ok(payload.items.length>=15);
  assert.equal(payload.items.length,new Set(payload.items.map(x=>x.id)).size);
  for(const item of payload.items){
   const original=index.get(item.id);
   assert.ok(original,'unknown page '+item.id);
   assert.equal(item.fingerprint,original.fingerprint,'full-record digest mismatch for '+item.id);
   assert.equal(item.model,original.model);
   assert.deepEqual(Object.keys(item).sort(),['editable','fields','fingerprint','id','model']);
   assert.ok(['recette','atelier'].includes(item.id.split(':')[0]));
   if(item.model==='cookingWorkshopGuides'){
    assert.equal(item.editable,false);
    assert.ok(item.fields.phases.every(x=>Object.keys(x).sort().join(',')==='id,learning,title'));
   }else assert.equal(item.editable,true);
  }
  const recipe=payload.items.find(x=>x.id==='recette:amok-trey');
  assert.ok(recipe);
  assert.ok(recipe.fields.ingredients.some(x=>x.scalable===false));
  assert.ok(recipe.fields.steps.some(x=>x.cue));
  const serialized=JSON.stringify(payload);
  for(const key of ['audioScript','culinaryReferences','sourceReferences','sources','password_hash',
    'imageWidths','audioPath','n8n','private_config']){
    assert.ok(!serialized.includes('"'+key+'":'),'unexpected internal field '+key);
  }
 }finally{await rm(dir,{recursive:true,force:true})}
});

test('PHP view only renders typed forms in guarded private session', async()=>{
 const {readFile}=await import('node:fs/promises');
 const ui=await readFile(new URL('../public/gestion-contenus/index.php',import.meta.url),'utf8');
 const lib=await readFile(new URL('../public/gestion-contenus/lib.php',import.meta.url),'utf8');
 assert.match(ui,/\$guidedEditable/);
 assert.match(ui,/cmsBuildGuidedPatch/);
 assert.match(ui,/csrf/);
 assert.match(ui,/canonical_fingerprint/);
 assert.match(ui,/cmsEsc\(\(string\)\$rowValue\)/);
 assert.match(ui,/Cet atelier utilise le parcours audio validé/);
 assert.match(lib,/GUIDED_SOURCE/);
 assert.match(lib,/STRUCTURE_GUIDED_ROW_KEYS/);
 assert.doesNotMatch(ui,/\b(?:INSERT INTO|DELETE FROM|graph\.facebook\.com)\b/);
});
