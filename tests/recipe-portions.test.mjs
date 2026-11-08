import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const bundled=await build({stdin:{contents:"export {recipes} from './src/data/recipes'; export * from './src/utils/recipePortions';",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node'});
const m=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
const amok=m.recipes.find(r=>r.slug==='amok-trey'),rules=m.portionBindings['amok-trey'];
test('canonical recipe and explicit instruction slots agree for 1,2,4,8,12 and repeated changes',()=>{
 const snapshot=JSON.stringify(amok);
 for(const n of [1,2,4,8,12,1,12,2,4]){
  const coconut=m.resolvePortionValue(amok,{kind:'ingredient',ingredient:'lait de coco'});
  const reserve=m.resolvePortionValue(amok,{kind:'reserve',ingredient:'lait de coco',fraction:.06});
  const total=m.scaledQuantity(coconut.amount,4,n,coconut.scalable);
  const reserved=m.scaledQuantity(reserve.amount,4,n,reserve.scalable);
  assert.equal(total,250*n/4);assert.equal(reserved,total*.06);assert.equal(total-reserved+reserved,total);
  const text=m.renderPortionText(amok,amok.steps[0].text,rules.steps[0],n);
  assert.ok(text.includes(m.portionLabel(total,'ml')));assert.ok(text.includes(m.portionLabel(reserved,'ml',true)));
  const containers=m.renderPortionText(amok,amok.steps[3].text,rules.steps[3],n);
  assert.ok(containers.includes(n+' ramequin'+(n>1?'s':'')));
  assert.ok(containers.includes('18 à 25 minutes'));
  if(n!==4){assert.ok(!text.includes('250 ml'));assert.ok(!containers.includes('quatre ramequins'));}
 }
 assert.equal(JSON.stringify(amok),snapshot);
});
test('all canonical recipes preserve their explicit non-proportional ingredients',()=>{
 for(const recipe of m.recipes)for(const n of [1,2,4,8,12])for(const i of recipe.ingredients){
  if(i.quantity===undefined)continue;
  const actual=m.scaledQuantity(i.quantity,recipe.baseServings,n,i.scalable!==false);
  assert.equal(actual,i.scalable===false?i.quantity:i.quantity*n/recipe.baseServings);
 }
 const leaves=amok.ingredients.filter(i=>i.scalable===false);
 assert.equal(leaves.length,2);
});
test('new explicit bindings are reusable; stale anchors, arbitrary portions and invalid reserves fail closed',()=>{
 const future={...amok,slug:'future-recipe'};
 assert.match(m.renderPortionText(future,'Dose : 250 ml.',[{literal:'250 ml',value:{kind:'ingredient',ingredient:'lait de coco'}}],2),/125 ml/);
 assert.equal(m.renderPortionText(future,'Préparez quatre bols.',[{literal:'quatre bols',value:{kind:'containers',perServing:1,singular:'bol',plural:'bols'}}],2),'Préparez 2 bols.');
 assert.throws(()=>m.portionSegments(amok,'Quantité changée',rules.steps[0]),/BINDING_STALE/);
 assert.throws(()=>m.scaledQuantity(1,4,1.5),/PORTION_INPUT/);
 assert.throws(()=>m.resolvePortionValue(amok,{kind:'reserve',ingredient:'lait de coco',fraction:2}),/RESERVE/);
});
