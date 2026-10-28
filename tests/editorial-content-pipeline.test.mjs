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
  contentIdeaFingerprint} from '../scripts/editorial-content-pipeline.mjs';

const make=(kind='recette',title='Amok de poisson')=>
  makeEditorialIdea({kind,title,angle:'Une approche culinaire approfondie'});
const sections=[{title:'Une première section',paragraphs:['Texte complet avec des informations à vérifier.']}];

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
