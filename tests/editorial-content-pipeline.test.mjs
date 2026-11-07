import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {EDITORIAL_KINDS,makeEditorialIdea,normalizeEditorialTitle,
  editorialSlug,findEditorialOverlaps,assertNoExactDuplicate,
  validateEditorialProposal,transitionEditorialProposal,
  contentIdeaFingerprint,selectNextEditorialWorkshop} from '../scripts/editorial-content-pipeline.mjs';

const make=(kind='recette',title='Amok de poisson')=>
  makeEditorialIdea({kind,title,angle:'Une approche culinaire approfondie'});
const sections=[{title:'Une première section',paragraphs:['Texte complet avec des informations à vérifier.']}];
const workshop=(id,title,date,recipe='amok-trey')=>({id:'c-'+id.repeat(24),version:1,
 kind:'atelier',title,slug:editorialSlug(title),state:'draft',target_date:date,
 atelier_reference:{recipeSlug:recipe}});
const recipes=[{id:'recette:amok-trey',fingerprint:'a'.repeat(64)}];
const fallback={title:'Amok Trey — Réussir un poisson au lait de coco à la vapeur',recipeSlug:'amok-trey'};

test('selection preserves published workshops and quarantined drafts, returns a candidate without fake scheduling',()=>{
 const historical=workshop('a','Atelier historique','2026-11-12','kroeung-jaune');
 historical.source_binding={source_id:'atelier:atelier-historique'};
 const technical=workshop('b','Données privées de qualification',null);
 const input={records:[technical,historical],published:[],recipes,excludedCreationIds:[technical.id],fallback};
 const before=JSON.stringify(input),result=selectNextEditorialWorkshop(input);
 assert.equal(result.selection.origin,'candidate');assert.equal(result.selection.creation_id,null);
 assert.equal(result.selection.target_date,null);assert.equal(result.selection.recipe_id,'recette:amok-trey');
 assert.equal(result.selection.publication_authorized,false);assert.equal(result.selection.human_semantic_review_required,true);
 assert.equal(result.blocked.length,2);assert.equal(result.provider_calls,0);assert.equal(result.production_writes,0);
 assert.equal(JSON.stringify(input),before);
 assert.equal(result.selection.preparation_key,selectNextEditorialWorkshop(input).selection.preparation_key);
});
test('calendar priority and existing draft identity are reused, never inferred from titles',()=>{
 const later=workshop('c','Travail suivant','2026-11-20','other');
 const first=workshop('d','Atelier prioritaire','2026-11-11');
 const r=selectNextEditorialWorkshop({records:[later,first],published:[],recipes,fallback});
 assert.equal(r.selection.creation_id,first.id);assert.equal(r.selection.origin,'calendar');
 const undated=workshop('e','Amok en projet',null);
 const a=selectNextEditorialWorkshop({records:[undated],published:[],recipes,fallback});
 assert.equal(a.selection.creation_id,undated.id);assert.equal(a.selection.origin,'existing_draft');
 const missing={...first,atelier_reference:{recipeSlug:''}};
 assert.throws(()=>selectNextEditorialWorkshop({records:[missing],published:[],recipes,fallback}),/EDITORIAL_CANONICAL_REFERENCE/);
 assert.throws(()=>selectNextEditorialWorkshop({records:[{...first,target_date:'2026-02-30'}],published:[],recipes}),/EDITORIAL_SELECTION_RECORD/);
});
test('selection fails closed on ambiguous drafts and exact published duplicates',()=>{
 assert.throws(()=>selectNextEditorialWorkshop({records:[workshop('c','Amok A',null),workshop('d','Amok B',null)],published:[],recipes,fallback}),/EDITORIAL_MULTIPLE_DRAFTS/);
 assert.throws(()=>selectNextEditorialWorkshop({records:[],published:[{kind:'atelier',title:fallback.title}],recipes,fallback}),/EDITORIAL_DUPLICATE_BLOCKED/);
 const first=workshop('e','Amok B',null);
 assert.throws(()=>selectNextEditorialWorkshop({records:[first,first],published:[],recipes}),/EDITORIAL_SELECTION_RECORD/);
 assert.throws(()=>selectNextEditorialWorkshop({records:[],published:[],recipes:[{id:'recette:amok-trey',fingerprint:'bad'}],fallback}),/EDITORIAL_CANONICAL_REFERENCE/);
});

test('all editorial families accept the same manual and AI idea contract',()=>{
  assert.deepEqual(EDITORIAL_KINDS,[
    'recette','atelier','culture','ingredient','technique'
  ]);
  for(const kind of EDITORIAL_KINDS){
    for(const origin of ['manual','ai']){
      const p=makeEditorialIdea({kind,origin,title:'Patrimoine khmer',
        angle:'Angle historique et culinaire inédit',channels:['site','instagram'],
        target_date:'2026-11-20'});
      assert.equal(p.stage,'idea');
      assert.equal(p.origin,origin);
      assert.match(contentIdeaFingerprint(p),/^[0-9a-f]{64}$/);
      assert.equal(validateEditorialProposal(p),p);
    }
  }
});

test('human validation and the editorial calendar cannot be bypassed',()=>{
  const idea=make();
  assert.throws(()=>transitionEditorialProposal(idea,'approved'),/EDITORIAL_TRANSITION_FORBIDDEN/);
  assert.throws(()=>transitionEditorialProposal(idea,'draft'),/PROPOSAL_INCOMPLETE/);
  const draft=transitionEditorialProposal(idea,'draft',{
    summary:'Une recette traditionnelle',sections
  });
  const review=transitionEditorialProposal(draft,'review');
  assert.throws(()=>transitionEditorialProposal(review,'approved'),/HUMAN_REVIEW_REQUIRED/);
  const approved=transitionEditorialProposal(review,'approved',{
    reviewed_by:'relecteur humain',reviewed_at:'2026-10-28T12:00:00Z'
  });
  assert.throws(()=>transitionEditorialProposal(approved,'scheduled'),/CALENDAR_DATE_REQUIRED/);
  const scheduled=transitionEditorialProposal(approved,'scheduled',{
    target_date:'2026-11-01',channels:['site','facebook','instagram']
  });
  assert.throws(()=>transitionEditorialProposal(scheduled,'published'),/PUBLICATION_PROOF_REQUIRED/);
  const published=transitionEditorialProposal(scheduled,'published',{
    publication_evidence:'https://www.cuisine-du-cambodge.com/recettes/amok-de-poisson/'
  });
  assert.equal(published.stage,'published');
  assert.equal(idea.stage,'idea');
});

test('date, channel, schema, and draft provenance guards prevent unsafe automation',()=>{
 const base=make();
 assert.throws(()=>validateEditorialProposal({...base,channels:['instagram']}),/PROPOSAL_PLAN_INVALID/);
 assert.throws(()=>validateEditorialProposal({...base,channels:['site','site']}),/PROPOSAL_PLAN_INVALID/);
 assert.throws(()=>validateEditorialProposal({...base,target_date:'2026-02-30'}),/PROPOSAL_PLAN_INVALID/);
 assert.throws(()=>validateEditorialProposal({...base,origin:'autopublish'}),/PROPOSAL_FIELDS_INVALID/);
 assert.throws(()=>validateEditorialProposal({...base,unknown:'token'}),/PROPOSAL_SHAPE_INVALID/);
 assert.throws(()=>validateEditorialProposal({...base,title:'Amok changé'}),/PROPOSAL_FIELDS_INVALID/);
 assert.throws(()=>validateEditorialProposal({...base,sections:[{title:'A',paragraphs:['']}]})
   ,/PROPOSAL_SECTIONS_INVALID/);
});

test('duplicate protections distinguish an exact title, close title and complementary editorial angles',()=>{
 assert.equal(normalizeEditorialTitle('  Amôk   Trèy ! '),'amok trey');
 assert.equal(editorialSlug('Kroéung jaune !'),'kroeung-jaune');
 const candidate=make('recette','Amok Trey');
 const published=[{kind:'recette',id:'recette:amok-trey',slug:'amok-trey',title:'Amôk Trèy'},
  {kind:'culture',id:'culture:amok',title:'Amok Trey'}];
 const blocked=findEditorialOverlaps(candidate,published);
 assert.equal(blocked.length,1);
 assert.equal(blocked[0].reason,'exact_title_or_slug');
 assert.throws(()=>assertNoExactDuplicate(candidate,published),/EDITORIAL_DUPLICATE_BLOCKED/);
 assert.equal(assertNoExactDuplicate(make('culture','Amok Trey'),[
   {kind:'recette',id:'recette:amok-trey',title:'Amok Trey'}]).length,0);
 const similar=findEditorialOverlaps(make('atelier','Préparer le porc caramélisé'),
   [],[{kind:'atelier',title:'Cuisiner le porc caramélisé'}]);
 assert.equal(similar[0].reason,'similar_title');
});

test('real published social catalog is the input to duplication checks, no hard-coded number of pages',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'cdc-pipeline-real-'));
 try{
   const a=await build({entryPoints:[
     fileURLToPath(new URL('../src/data/socialCatalog.ts',import.meta.url))],
     bundle:true,format:'esm',platform:'node',target:'node22',write:false,logLevel:'silent'});
   const filename=join(dir,'catalog.mjs');
   await writeFile(filename,a.outputFiles[0].text);
   const {getSocialCatalog}=await import(pathToFileURL(filename).href);
   const published=getSocialCatalog().map(x=>({
     id:x.id,kind:x.kind,title:x.title,slug:x.id.split(':')[1]
   }));
   assert.ok(published.length>20);
   for(const page of published){
     const idea=make(page.kind,page.title);
     assert.throws(()=>assertNoExactDuplicate(idea,published),
       /EDITORIAL_DUPLICATE_BLOCKED/,
       'existing published page slipped through: '+page.id);
   }
 }finally{await rm(dir,{recursive:true,force:true})}
});
