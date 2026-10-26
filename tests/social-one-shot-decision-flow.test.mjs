import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

// Execute the EXACT Code node source from the existing Workflow 01 export.
// Pure local fixtures: no n8n execution, PostgreSQL write, Resend or Meta.
const workflow=JSON.parse(readFileSync(
  new URL('../automation/n8n/01-drafts-email-approval.json',import.meta.url),'utf8'));
const node=(name)=>{
  const found=workflow.nodes.filter(n=>n.name===name);
  assert.equal(found.length,1,'Expected exactly one '+name);
  return found[0];
};
const execute=(name,context)=>runInNewContext(
  '(function(){\n'+node(name).parameters.jsCode+'\n})()',context,{timeout:1500});
const img='https://www.cuisine-du-cambodge.com/social-assets/recette-test.jpg';
const source={
 id:'recette:unique-test',kind:'recette',title:'Recette de démonstration',
 url:'https://www.cuisine-du-cambodge.com/recettes/unique-test/',
 summary:'Préparation illustrative pour test à blanc',
 facts:['Une étape de préparation test suffisamment longue pour valider les données.'],
 fingerprint:'abcdefabcdefabcd',imageUrl:img
};

test('one-shot: existing selector takes one eligible source and excludes one without photo',()=>{
 const feed={product:'cuisine-du-cambodge',schemaVersion:1,
   items:[{...source,imageUrl:null,id:'recette:without-media'},source]};
 const context={
   $:(name)=>{
     assert.equal(name,'Lire le catalogue du site');
     return {first:()=>({json:feed})};
   },
   $input:{all:()=>[]}
 };
 const result=execute('Choisir un contenu original',context);
 assert.equal(result.length,1);
 assert.equal(result[0].json.sourceId,source.id);
 assert.equal(result[0].json.imageUrl,img);
 assert.equal(result[0].json.fingerprint,source.fingerprint);
});

test('one-shot: existing insert is idempotent and original email links to original Wait',()=>{
 const sql=node('Enregistrer le brouillon').parameters.query;
 assert.match(sql,/ON CONFLICT \(scheduled_date\) DO NOTHING/i);
 assert.match(sql,/RETURNING id,scheduled_date/i);
 assert.match(node('Brouillon inséré ?').parameters.conditions.conditions[0].leftValue,/Number\.isSafeInteger/);
 const email=node('Envoyer la demande de validation Resend');
 assert.match(email.parameters.body,/\$execution\.resumeFormUrl/);
 assert.match(email.parameters.body,/AUCUNE PUBLICATION sans validation/);
 const wait=node('Attendre une décision via formulaire');
 assert.equal(wait.parameters.resume,'form');
 assert.equal(wait.parameters.resumeAmount,72);
 assert.equal(wait.parameters.resumeUnit,'hours');
 const choices=wait.parameters.formFields.values[0].fieldOptions.values.map(v=>v.option);
 assert.deepEqual(choices,['Approuver','Demander une modification','Refuser']);
});

test('one-shot: revision is recorded only against original draft ID, never an implicit approval',()=>{
 const saved={id:'9007199254740993'}; // larger than JS MAX_SAFE_INTEGER
 const context={
   $input:{first:()=>({json:{data:{
     Decision:'Demander une modification',
     Commentaire:'Test unique : vérifier la traçabilité, ne pas publier.'
   }}})},
   $:(name)=>{
     assert.equal(name,'Enregistrer le brouillon');
     return {first:()=>({json:saved})};
   }
 };
 const out=execute('Interpréter la décision',context);
 assert.equal(out.length,1);
 assert.equal(out[0].json.id,saved.id);
 assert.equal(out[0].json.decision,'revision_requested');
 assert.match(out[0].json.note,/ne pas publier/);
 const sql=node('Persister la décision humaine').parameters.query;
 assert.match(sql,/WHERE id=\$3 AND status='draft'/);
 assert.match(sql,/SET status=\$1, human_decision=\$1/);
 const emptyComment={...context,$input:{first:()=>({json:{data:{
   Decision:'Demander une modification',Commentaire:'  '
 }}})}};
 assert.throws(()=>execute('Interpréter la décision',emptyComment),
   /commentaire_requis_pour_modification/);
});
