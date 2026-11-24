import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read = file => JSON.parse(readFileSync(new URL('../automation/n8n/'+file, import.meta.url)));
const draft = read('01-drafts-email-approval.json');
const publish = read('02-publish-approved.json');
const get = (workflow,name) => workflow.nodes.find(node => node.name===name);
const call = (workflow,name,context) => runInNewContext('(function(){'+get(workflow,name).parameters.jsCode+'})()',context);
const site = 'https://www.cuisine-du-cambodge.com';
const sample = (kind,slug,path) => ({
  id:kind+':'+slug, kind, fingerprint:'1234123412341234', title:'Cuisine cambodgienne',
  url:site+'/'+kind+'/'+slug+'/',
  facts:['Les bords des petits morceaux restent fermes quand on les coupe avant le service.'],
  originalImageUrl:site+'/images/cuisine/'+path,
  imageUrl:site+'/social-assets/'+kind+'-'+slug+'.jpg',
});
const samples = [
  sample('recette','amok-trey','v19-amok-trey-1440.webp'),
  sample('ingredient','tamarin','tamarind-1600.webp'),
  sample('culture','kep-marche-crabe-poivre','kep-market-1600.webp'),
  sample('atelier','lok-lak-de-la-poele-a-l-assiette','v19-lok-lak-1440.webp'),
  sample('technique','pickles-carotte-concombre','v19-bai-sach-chrouk-1440.webp'),
];

const take = (items, history=[]) => call(draft,'Choisir un contenu original',{
  $:()=>({first:()=>({json:{product:'cuisine-du-cambodge',schemaVersion:1,items}})}),
  $input:{all:()=>history.map(json=>({json}))},
});

test('daily drafting validates the provenance and appends the same non-model credit on both networks',()=>{
  for (const entry of samples) {
    const selected=take([entry])[0];
    const rights=selected.json.source.socialRights;
    assert.equal(rights.approved,true);
    assert.match(rights.sha256,/^[a-f\d]{64}$/);
    assert.ok(rights.license && rights.author && rights.original && rights.adaptation);
    if (entry.kind==='ingredient'||entry.kind==='culture') {
      assert.match(rights.credit,/CC BY-SA.*Original : https:\/\/commons\.wikimedia\.org/);
      assert.equal(rights.generated,false);
    } else {
      assert.match(rights.credit,/Illustration créée avec l’IA/);
      assert.equal(rights.generated,true);
    }
    const result=call(draft,'Vérifier et cadrer les textes',{
      $:()=>({first:()=>selected}),$input:{first:()=>({json:{choices:[]}})},
    })[0].json;
    assert.notEqual(result.facebookCaption,result.instagramCaption);
    for (const c of [result.facebookCaption,result.instagramCaption]) {
      assert.ok(c.includes(entry.url));
      assert.ok(c.endsWith(rights.credit));
      assert.ok(c.includes(entry.facts[0]));
    }
  }
});

test('a reserved date, already-used source and unverified asset are excluded before Ollama',()=>{
  assert.equal(take(samples,[{slot_reserved:true}]).length,0);
  assert.throws(()=>take([samples[0]],[{source_id:samples[0].id}]),/droits_verifies/);
  assert.throws(()=>take([{...samples[0],originalImageUrl:site+'/images/cuisine/autre.jpg'}]),/droits_verifies/);
  assert.throws(()=>take([sample('technique','bouillon-leger-maison','v18-kuy-teav.webp')]),/droits_verifies/);
});

test('the image digest is checked both before drafting and before outgoing Meta calls',()=>{
  for (const [flow,isDraft] of [[draft,true],[publish,false]]) {
    const rights={approved:true,sha256:'a'.repeat(64)};
    const claim=isDraft?{source:{socialRights:rights}}:{source_snapshot:{socialRights:rights}};
    const run=digest=>call(flow,'Confirmer le JPEG et ses droits',{
      $:()=>({first:()=>({json:claim})}),$input:{first:()=>({json:{assetSha256:digest}})}
    });
    assert.equal(run(rights.sha256)[0].json,claim);
    assert.throws(()=>run('b'.repeat(64)),/jpeg_social_non_conforme/);
    assert.equal(get(flow,'Empreinte du JPEG social').parameters.type,'SHA256');
    assert.equal(flow.connections['Télécharger le JPEG à vérifier'].main[0][0].node,'Empreinte du JPEG social');
  }
});

test('retired one-off nodes are absent and a new human approval binds captions, image and rights',()=>{
  assert.ok(draft.nodes.every(n=>!n.type.endsWith('.manualTrigger')));
  assert.doesNotMatch(JSON.stringify(draft),/kampong-speu-v6-2|2026-11-25|Relancer la validation Kampong/);
  const sentence=get(draft,'Persister la décision humaine').parameters.query;
  const claim=get(publish,'Claim atomique uniquement si validé').parameters.query;
  const seal=/jsonb_build_array\(facebook_caption,instagram_caption,image_url,source_snapshot->'socialRights'\)/;
  assert.match(sentence,seal);
  assert.match(claim,seal);
  assert.match(sentence,/CASE WHEN \$1='approved'/);
  assert.match(claim,/status='approved' AND human_decision='approved'/);
  assert.match(get(draft,'Attendre une décision via formulaire').parameters.formDescription,/socialRights\.credit/);
});
