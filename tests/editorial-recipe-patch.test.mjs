import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import {
  prepareReviewedRecipePatch, validateReviewedRecipeRequest
} from '../scripts/apply-reviewed-recipe-request.mjs';

async function loadRecords(path, source) {
  const out=await build({stdin:{
    contents:source,resolveDir:process.cwd(),
    sourcefile:fileURLToPath(new URL('../'+path,import.meta.url)),loader:'ts'
  },bundle:true,write:false,format:'esm',platform:'node',target:'node22',logLevel:'silent'});
  const uri='data:text/javascript;base64,'+
    Buffer.from(out.outputFiles[0].text,'utf8').toString('base64');
  return import(uri);
}
function requestFor(model, slug, record, changes) {
  return {
    contract:'cuisine-cms-recipe-patch-v1',source_id:'recette:'+slug,
    source_model:model, source_path:'src/data/'+model+'.ts',
    canonical_sha256:createHash('sha256').update(JSON.stringify({model,record})).digest('hex'),
    social_fingerprint:'a'.repeat(16),review_version:3,
    changes:{schema_version:1,...changes},publication:'none'
  };
}
test('patch only the selected real recipe, preserve every other Astro field',async()=>{
 const path='src/data/recipes.ts';
 const source=await readFile(new URL('../'+path,import.meta.url),'utf8');
 const {recipes}=await loadRecords(path,source);
 const current=structuredClone(recipes.find(x=>x.slug==='amok-trey'));
 assert.ok(current);
 const nextSteps=current.steps.map((s,i)=>i===0?{...s,text:s.text+' Vérifier la texture.'}:s);
 const nextIngredients=current.ingredients.map((x,i)=>i===0?{...x,quantity:x.quantity+20}:x);
 const req=requestFor('recipes','amok-trey',current,{
    baseServings:current.baseServings+1,steps:nextSteps,ingredients:nextIngredients
 });
 const out=prepareReviewedRecipePatch({request:req,source,record:current});
 assert.equal(out.changes.length,3);
 assert.equal(out.targetPath,path);
 assert.notEqual(out.output,source);
 const parsed=ts.createSourceFile(path,out.output,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
 assert.equal(parsed.parseDiagnostics.length,0);
 const changed=await loadRecords(path,out.output);
 const updated=changed.recipes.find(x=>x.slug==='amok-trey');
 assert.equal(updated.baseServings,current.baseServings+1);
 assert.equal(updated.ingredients[0].quantity,current.ingredients[0].quantity+20);
 assert.ok(updated.steps[0].text.endsWith('Vérifier la texture.'));
 for(const key of Object.keys(current))if(!['baseServings','ingredients','steps'].includes(key))
   assert.deepEqual(updated[key],current[key],'unexpected mutation '+key);
 assert.deepEqual(changed.recipes.filter(x=>x.slug!=='amok-trey'),
   recipes.filter(x=>x.slug!=='amok-trey'));
 assert.equal(source.includes('Vérifier la texture.'),false);
});
test('historic restored recipes support full text ingredients',async()=>{
 const path='src/data/restoredRecipes.ts';
 const source=await readFile(new URL('../'+path,import.meta.url),'utf8');
 const {restoredRecipes}=await loadRecords(path,source);
 const current=restoredRecipes[0];
 const req=requestFor('restoredRecipes',current.slug,current,{
   prepTime:'37 min',
   ingredients:current.ingredients.map((x,i)=>i===0?x+' (vérifié)':x)
 });
 const result=prepareReviewedRecipePatch({request:req,source,record:current});
 const x=(await loadRecords(path,result.output)).restoredRecipes[0];
 assert.equal(x.prepTime,'37 min');
 assert.ok(x.ingredients[0].endsWith('(vérifié)'));
 assert.deepEqual(x.sources,current.sources);
 assert.deepEqual(x.steps,current.steps);
});
test('refuse stale source SHA, changed rows, injected metadata and PR privilege escalation',async()=>{
 const path='src/data/recipes.ts';
 const source=await readFile(new URL('../'+path,import.meta.url),'utf8');
 const {recipes}=await loadRecords(path,source);
 const current=recipes[0];
 const good=requestFor('recipes',current.slug,current,{baseServings:5});
 function rejects(p,r=/CMS_RECIPE_PATCH_/) {
   assert.throws(()=>prepareReviewedRecipePatch({request:p,source,record:current}),r);
 }
 rejects({...good,canonical_sha256:'f'.repeat(64)},/SOURCE_CHANGED/);
 rejects({...good,publication:'live'},/INVALID_ENVELOPE/);
 rejects({...good,source_path:'src/data/culture.ts'},/INVALID_ENVELOPE/);
 rejects({...good,changes:{schema_version:1,slug:'evil'}},/UNSUPPORTED_CHANGES/);
 rejects({...good,changes:{schema_version:1,steps:current.steps.slice(0,-1)}},/ROW_COUNT_CHANGED/);
 const injected=current.ingredients.map(i=>({...i}));
 injected[0].secret='x';
 rejects({...good,changes:{schema_version:1,ingredients:injected}},/ROW_KEYS_CHANGED/);
 const removed=current.ingredients.map(i=>({...i}));
 delete removed[0].group;
 rejects({...good,changes:{schema_version:1,ingredients:removed}},/ROW_KEYS_CHANGED/);
 const scaled=current.ingredients.map(i=>({...i}));
 const last=scaled.find(i=>i.scalable===false);last.scalable=true;
 rejects({...good,changes:{schema_version:1,ingredients:scaled}},/SCALABLE_PROTECTED/);
 rejects({...good,changes:{schema_version:1,baseServings:current.baseServings}},/NO_DIFFERENCE/);
 assert.equal(validateReviewedRecipeRequest(good).path,path);
});
