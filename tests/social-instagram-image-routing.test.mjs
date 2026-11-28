import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const flow=JSON.parse(readFileSync(new URL('../automation/n8n/02-publish-approved.json',import.meta.url)));
const node=name=>flow.nodes.find(n=>n.name===name);
const origin='https://www.cuisine-du-cambodge.com/social-assets/';
const mirror='https://raw.githubusercontent.com/roro78/cuisine-cambodgienne/93ffd3eea5e0724af226263f8c69571d769cb153/public/social-assets/';
const files=[
  'recette-amok-trey','recette-lok-lak','recette-bai-sach-chrouk','recette-num-banh-chok',
  'atelier-lok-lak-de-la-poele-a-l-assiette','atelier-num-banh-chok-sauce-et-herbes-fraiches',
  'atelier-bai-sach-chrouk-porc-riz-et-pickles','technique-pickles-carotte-concombre',
  'ingredient-tamarin','ingredient-poivre-de-kampot','ingredient-prahok'
].map(name=>name+'-v20261126.jpg');
const expr=(value,row)=>{
  assert.ok(value.startsWith('={{')&&value.endsWith('}}'));
  return runInNewContext(value.slice(3,-2),{
    $:name=>{
      assert.equal(name,'Claim atomique uniquement si validé');
      return {first:()=>({json:row})};
    }
  },{timeout:1000});
};
const route=(image_url)=>{
  const row={image_url,instagram_caption:'Bœuf, poivre et citron vert.\n\nCuisine du Cambodge'};
  const download=expr(node('Télécharger le JPEG à vérifier').parameters.url,row);
  const payload=JSON.parse(expr(node('Créer le conteneur Instagram').parameters.body,row));
  assert.equal(payload.image_url,download);
  assert.equal(payload.caption,row.instagram_caption);
  return download;
};

test('incident 519: all eleven reviewed assets use the pinned mirror for both verification and Instagram',()=>{
  for(const name of files) assert.equal(route(origin+name),mirror+name);
});

test('unqualified names, versions and unrelated URLs are not mapped to the mirror',()=>{
  for(const url of [
    origin+'culture-kep-marche-crabe-poivre-v20261127.jpg',
    origin+'recette-lok-lak-v20261127.jpg',
    origin+'recette-future-v20261126.jpg',
    origin+'recette-lok-lak-v20261126.jpg?variant=1',
    'https://other.invalid/social-assets/recette-lok-lak-v20261126.jpg'
  ]) assert.equal(route(url),url);
  // This is the routing expression alone. The existing upstream claim/guard rejects foreign URLs.
});

test('Facebook still uses the approved original URL and the SHA-256 gate precedes all Meta writes',()=>{
  const fb=node('Publier la photo Facebook').parameters.bodyParameters.parameters;
  assert.equal(fb.find(p=>p.name==='url').value,'={{ $json.image_url }}');
  assert.equal(fb.find(p=>p.name==='caption').value,'={{ $json.facebook_caption }}');
  const next=name=>flow.connections[name].main[0].map(edge=>edge.node);
  assert.deepEqual(next('Vérifier la réservation avant Meta'),['Télécharger le JPEG à vérifier']);
  assert.deepEqual(next('Télécharger le JPEG à vérifier'),['Empreinte du JPEG social']);
  assert.deepEqual(next('Empreinte du JPEG social'),['Confirmer le JPEG et ses droits']);
  assert.deepEqual(next('Confirmer le JPEG et ses droits'),['Publier la photo Facebook']);
  assert.deepEqual(next('Mémoriser le résultat Facebook'),['Créer le conteneur Instagram']);
  assert.equal(node('Empreinte du JPEG social').parameters.type,'SHA256');
  const row={source_snapshot:{socialRights:{approved:true,sha256:'a'.repeat(64)}}};
  const gate=digest=>runInNewContext('(function(){'+node('Confirmer le JPEG et ses droits').parameters.jsCode+'})()',{
    $:()=>({first:()=>({json:row})}),$input:{first:()=>({json:{assetSha256:digest}})}
  });
  assert.equal(gate('a'.repeat(64))[0].json,row);
  assert.throws(()=>gate('b'.repeat(64)),/jpeg_social_non_conforme/);
});
