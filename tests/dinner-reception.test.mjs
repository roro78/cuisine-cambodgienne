import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildReceptionNotebook, getNotebookProgress,
  RECEPTION_STATUS, RECEPTION_SIDE_NOTE, RECEPTION_SAFETY, RECEPTION_VALIDATION
} from '../src/utils/dinnerReception.mjs';

const catalogue = [
  { slug:'amok-trey', title:'Amok Trey', baseServings:4, prepTime:'30 min', cookTime:'25 min',
    ingredients:[{quantity:250,unit:'ml',name:'lait de coco'},{quantity:600,unit:'g',name:'poisson blanc'}], equipment:['Panier vapeur'] },
  { slug:'chek-ktis', title:'Chek Ktis', baseServings:4, prepTime:'10 min', cookTime:'15 min',
    ingredients:[{quantity:400,unit:'ml',name:'lait de coco'},{quantity:4,name:'bananes'}], equipment:['Casserole'] },
  { slug:'prahok-ktis', title:'Prahok Ktis', baseServings:4, prepTime:'25 min', cookTime:'25 min',
    ingredients:[{quantity:250,unit:'ml',name:'lait de coco'},{quantity:400,unit:'g',name:'porc haché'}], equipment:['Poêle'] },
];

test('notebook defaults to a real two-recipe menu with five original chapters',()=>{
 const n=buildReceptionNotebook(catalogue);
 assert.equal(n.guests,2);
 assert.equal(n.serviceTime,'20:00');
 assert.equal(n.includeSide,false);
 assert.deepEqual(n.chapters.map(c=>c.id),['choix','mise-en-place','feu','table','dessert']);
 assert.equal(n.tasksCount,15);
 assert.equal(n.pack.menu.length,2);
 assert.equal(n.sideMinutes,null);
});

test('the published recipe metadata alone determines timing, no guaranteed coordination',()=>{
 const n=buildReceptionNotebook(catalogue,{guests:4,serviceTime:'19:30'});
 assert.deepEqual(n.pack.timeline.steps.map(step=>step.time),['18h20','18h50','19h05','19h30']);
 assert.equal(n.dessertMinutes,25);
 assert.match(n.validation,/essai culinaire réel/);
 assert.match(n.status,/cours d’essai/);
});

test('optional prahok inserts a distinct chapter but cannot silently alter the Amok schedule',()=>{
 const base=buildReceptionNotebook(catalogue,{guests:4,serviceTime:'20:00'});
 const plus=buildReceptionNotebook(catalogue,{guests:4,serviceTime:'20:00',includeSide:true});
 assert.deepEqual(plus.chapters.map(x=>x.id),['choix','mise-en-place','feu','partage','table','dessert']);
 assert.equal(plus.pack.menu.length,3);
 assert.equal(plus.tasksCount,18);
 assert.equal(plus.sideMinutes,50);
 assert.deepEqual(plus.pack.timeline.steps,base.pack.timeline.steps);
 assert.match(RECEPTION_SIDE_NOTE,/Aucun chevauchement/);
});

test('the consolidated shopping-list quantities follow the visitor choice',()=>{
 const a=buildReceptionNotebook(catalogue,{guests:2});
 const b=buildReceptionNotebook(catalogue,{guests:6,includeSide:true});
 assert.equal(a.pack.items.find(x=>x.name==='lait de coco').quantity,325);
 assert.equal(b.pack.items.find(x=>x.name==='lait de coco').quantity,1350);
});

test('every phase/task identifier is stable and unique even with the optional chapter',()=>{
 const a=buildReceptionNotebook(catalogue,{includeSide:true});
 const keys=a.chapters.flatMap(c=>c.tasks.map(t=>c.id+':'+t.id));
 assert.equal(keys.length,new Set(keys).size);
 assert.ok(a.chapters.every(c=>c.title&&c.description&&c.lesson&&c.tasks.length===3));
});

test('progress counts only the visible menu chapters and ignores stale/unknown task ids',()=>{
 const a=buildReceptionNotebook(catalogue);
 const b=buildReceptionNotebook(catalogue,{includeSide:true});
 const completed=new Set(['choix:sources','mise-en-place:aromates','partage:prahok','random:unknown']);
 assert.deepEqual(getNotebookProgress(a,completed),{done:2,total:15,percentage:13});
 assert.deepEqual(getNotebookProgress(b,completed),{done:3,total:18,percentage:17});
});

test('invalid menu settings and missing recipe sources fail closed',()=>{
 assert.throws(()=>buildReceptionNotebook(catalogue,{guests:13}),RangeError);
 assert.throws(()=>buildReceptionNotebook(catalogue,{serviceTime:'23:00'}),RangeError);
 assert.throws(()=>buildReceptionNotebook(catalogue,{includeSide:'yes'}),TypeError);
 assert.throws(()=>buildReceptionNotebook(catalogue.slice(0,2),{includeSide:true}),RangeError);
 assert.throws(()=>getNotebookProgress(null,new Set()),TypeError);
 assert.throws(()=>getNotebookProgress(buildReceptionNotebook(catalogue),[]),TypeError);
});

test('original reception guide explicitly addresses raw products and avoids claims of culinary validation',()=>{
 assert.match(RECEPTION_SAFETY,/œufs et du poisson crus/);
 assert.match(RECEPTION_SAFETY,/Ne goûtez jamais/);
 assert.match(RECEPTION_VALIDATION,/cuisson/);
 assert.match(RECEPTION_STATUS,/Ni atelier animé ni produit commercialisé/);
 const n=buildReceptionNotebook(catalogue);
 assert.ok(n.chapters.some(c=>c.lesson.includes('après cuisson complète')));
});
