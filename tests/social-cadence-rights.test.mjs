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

test('daily drafting keeps private rights, credits third-party photos and omits internal production credits',()=>{
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
      assert.equal(c.endsWith(rights.credit), !rights.generated);
      if (rights.generated) assert.doesNotMatch(c, /Illustration créée|Provenance|credits-photos/i);
      else assert.ok(c.includes(entry.url));
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

test('all twelve reviewed sources use verified square assets and accept only grounded Ollama selections', async () => {
  const {build}=await import('esbuild');
  const {default:sharp}=await import('sharp');
  const {createHash}=await import('node:crypto');
  const {readdirSync}=await import('node:fs');
  const bundle=await build({
    entryPoints:[new URL('../src/data/socialCatalog.ts',import.meta.url).pathname],
    platform:'node',format:'esm',bundle:true,write:false,logLevel:'error',
  });
  const {getSocialCatalog}=await import('data:text/javascript;base64,'+
    Buffer.from(bundle.outputFiles[0].text).toString('base64'));
  const revision='-v20261126.jpg';
  const directory=new URL('../public/social-assets/',import.meta.url);
  const assets=readdirSync(directory).filter(file=>file.endsWith(revision));
  assert.equal(assets.length,12);
  const catalog=getSocialCatalog();
  const families=new Set();
  const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

  for (const asset of assets) {
    const source=catalog.find(item=>item.imageUrl?.endsWith('/'+asset.replace(revision,'.jpg')));
    assert.ok(source,asset);
    families.add(source.kind);
    const selected=take([source])[0];
    const {editorialOptions,imageUrl}=selected.json;
    const rights=selected.json.source.socialRights;
    assert.equal(imageUrl,site+'/social-assets/'+asset);
    assert.equal(editorialOptions.length,2);
    const bytes=readFileSync(new URL(asset,directory));
    const metadata=await sharp(bytes).metadata();
    assert.deepEqual([metadata.format,metadata.width,metadata.height],['jpeg',1080,1080]);
    assert.equal(Boolean(metadata.xmp?.includes('trainedAlgorithmicMedia')),rights.generated);
    assert.equal(sha(bytes),rights.sha256);
    assert.equal(sha(readFileSync(new URL('../public'+rights.path,import.meta.url))),rights.originalSha256);
    for (const top of [0,1064]) {
      const strip=await sharp(bytes).extract({left:0,top,width:1080,height:16}).png().toBuffer();
      const {channels}=await sharp(strip).stats();
      assert.ok(channels.slice(0,3).some(channel=>channel.stdev>6),'uniform edge: '+asset);
    }

    const request=get(draft,'Rédiger via Llama sur Ollama');
    assert.equal(request.onError,'continueRegularOutput');
    const payload=JSON.parse(runInNewContext(request.parameters.body.slice(3,-2),{$json:selected.json}));
    assert.equal(payload.model,'llama3.2:latest');
    const schema=payload.response_format.json_schema.schema;
    assert.equal(payload.response_format.type,'json_schema');
    assert.equal(schema.additionalProperties,false);
    assert.deepEqual(schema.required,['facebook','instagram']);
    assert.deepEqual(schema.properties.facebook.enum,[0,1]);
    assert.deepEqual(schema.properties.instagram.enum,[0,1]);
    assert.equal(JSON.parse(payload.messages[1].content).options.length,2);
    const evaluate=(input,selection=selected)=>call(draft,'Vérifier et cadrer les textes',{
      $:()=>({first:()=>selection}),$input:{first:()=>({json:input})},
    })[0].json;
    const answer=value=>({choices:[{message:{content:JSON.stringify(value)}}]});
    const chosen=evaluate(answer({facebook:1,instagram:0}));
    assert.equal(chosen.generationMode,'ollama_borne');
    assert.ok(chosen.facebookCaption.startsWith(editorialOptions[1].facebook+'\n\n'));
    assert.ok(chosen.instagramCaption.startsWith(editorialOptions[0].instagram+'\n\n'));
    assert.notEqual(chosen.facebookCaption,chosen.instagramCaption);
    assert.ok(chosen.claimsUsed.every(fact=>source.facts.includes(fact)));
    assert.deepEqual(Array.from(chosen.source.socialEditorial.facebookFacts),Array.from(editorialOptions[1].facts));
    assert.deepEqual(Array.from(chosen.source.socialEditorial.instagramFacts),Array.from(editorialOptions[0].facts));
    assert.equal(chosen.source.socialRights.credit,rights.credit);
    for (const caption of [chosen.facebookCaption,chosen.instagramCaption]) {
      assert.equal(caption.endsWith(rights.credit),!rights.generated);
      if (rights.generated) assert.doesNotMatch(caption,/Illustration créée|Provenance|credits-photos/);
    }

    const offline=evaluate({error:'offline'});
    assert.equal(offline.modelValidation,'ollama_indisponible');
    assert.equal(offline.generationMode,'catalogue_deterministe');
    assert.ok(offline.facebookCaption.startsWith(editorialOptions[0].facebook));
    assert.ok(offline.instagramCaption.startsWith(editorialOptions[1].instagram));
    for (const value of [
      {facebook:2,instagram:0},{facebook:0,instagram:'0'},
      {facebook:1,instagram:0,caption:'Une anecdote fabriquée'},
    ]) {
      const rejected=evaluate(answer(value));
      assert.equal(rejected.modelValidation,'schema_invalide');
      assert.equal(rejected.facebookCaption,offline.facebookCaption);
      assert.equal(rejected.instagramCaption,offline.instagramCaption);
    }
    const modified={...source,fingerprint:'0'.repeat(16)};
    assert.equal(take([modified])[0].json.editorialOptions.length,0);
    assert.throws(()=>take([source],[{source_id:source.id}]),/droits_verifies/);
  }
  assert.deepEqual([...families].sort(),['atelier','culture','ingredient','recette','technique']);
});
