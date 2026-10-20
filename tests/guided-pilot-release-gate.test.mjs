import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {transformSync} from 'esbuild';
import {guidedPilotReleaseBlockers} from '../scripts/verify-guided-pilot-release.mjs';

const source=readFileSync(new URL('../src/data/guidedWorkshops.ts',import.meta.url),'utf8');
const compiled=transformSync(source,{loader:'ts',format:'esm',target:'es2022'}).code;
const {tamarindGuidedWorkshop:pilot}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
const manifest=JSON.parse(readFileSync(new URL('../src/data/guided-workshop-audio/sauce-tamarin.json',import.meta.url),'utf8'));

test('Pilote tamarin actuel reste non validé même si le nouveau MP3 existe',()=>{
  assert.equal(pilot.status,'pilot_review');
  assert.equal(manifest.chapters.length,7);
  assert.equal(manifest.review.acousticListening,false);
  assert.equal(pilot.release.productionApproved,false);
});

test('Basculer seulement le statut validé reste un NO GO',()=>{
  const converted=structuredClone(pilot);
  converted.status='validated';
  const errors=guidedPilotReleaseBlockers(converted,manifest,false);
  assert.ok(errors.some(e=>e.includes('PR #90')));
  assert.ok(errors.some(e=>e.includes('catalogue canonique')));
  assert.ok(errors.some(e=>e.includes('Photographie finale')));
  assert.ok(errors.some(e=>e.includes('manifeste MP3')||e.includes('manifeste audio')));
});

test('Déclarer artificiellement tous les booléens vrais ne corrige ni phases ni recette',()=>{
  const converted=structuredClone(pilot);
  converted.status='validated';
  converted.release.photoUrl='/images/cuisine/faux.webp';
  for(const field of Object.keys(converted.release))if(field!=='photoUrl')converted.release[field]=true;
  const m=structuredClone(manifest);
  m.status='audio_validated';
  for(const key of Object.keys(m.review))m.review[key]=true;
  const errors=guidedPilotReleaseBlockers(converted,m,false);
  assert.ok(errors.some(e=>e.includes('PR #90')));
  assert.ok(errors.some(e=>e.includes('catalogue canonique')));
});

test('Un scénario conforme au contrat mécanique peut être évalué sans toucher au MP3 actuel',()=>{
  const converted=structuredClone(pilot);
  converted.status='validated';
  converted.steps.forEach((s,i)=>s.id=['installer','preparer','assembler','maitriser','rectifier','terminer'][i]);
  converted.release.photoUrl='/images/cuisine/preuve-reelle.webp';
  for(const key of Object.keys(converted.release))if(key!=='photoUrl')converted.release[key]=true;
  const m=structuredClone(manifest);
  m.status='audio_validated';
  m.chapters.forEach((c,i)=>c.id=i===0?'intro':converted.steps[i-1].id);
  for(const key of Object.keys(m.review))m.review[key]=true;
  assert.deepEqual(guidedPilotReleaseBlockers(converted,m,true),[]);
});
