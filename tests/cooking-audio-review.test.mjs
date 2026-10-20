import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyCookingAudioReview } from '../scripts/verify-cooking-audio-review.mjs';
import { readFileSync } from 'node:fs';

const fixture=()=>({
  blueprint:{
    status:'draft',
    audio:{status:'generated_review_pending'},
    review:{audioListeningValidated:false,mobileValidated:false,desktopValidated:false}
  },
  manifest:{
    status:'audio_generated_review_pending',
    review:{acousticListening:false,mobile:false,desktop:false}
  }
});

test('Un MP3 généré sans écoute reste en prépublication',()=>{
  const {blueprint,manifest}=fixture();
  assert.deepEqual(verifyCookingAudioReview(blueprint,manifest),[]);
});

test('La fiche ne peut pas se déclarer approuvée si le manifeste refuse l’écoute',()=>{
  const {blueprint,manifest}=fixture();
  blueprint.review.audioListeningValidated=true;
  assert.match(verifyCookingAudioReview(blueprint,manifest).join(' '),/Contradiction de revue acousticListening/);
});

test('Changer simplement le statut audio en validated ne suffit pas',()=>{
  const {blueprint,manifest}=fixture();
  blueprint.audio.status='validated';
  assert.ok(verifyCookingAudioReview(blueprint,manifest).length>=2);
});

test('Chaque confirmation, même partielle, doit être synchronisée',()=>{
  const {blueprint,manifest}=fixture();
  manifest.review.acousticListening=true;
  blueprint.review.audioListeningValidated=true;
  assert.deepEqual(verifyCookingAudioReview(blueprint,manifest),[]);
});

test('La validation complète cohérente reste possible après les vrais contrôles humains',()=>{
  const {blueprint,manifest}=fixture();
  blueprint.audio.status='validated';
  manifest.status='audio_validated';
  for(const f of Object.keys(manifest.review))manifest.review[f]=true;
  for(const f of Object.keys(blueprint.review))blueprint.review[f]=true;
  assert.deepEqual(verifyCookingAudioReview(blueprint,manifest),[]);
  blueprint.status='release_ready';
  assert.deepEqual(verifyCookingAudioReview(blueprint,manifest),[]);
});

test('La publication reste refusée si la revue desktop manque',()=>{
  const {blueprint,manifest}=fixture();
  blueprint.status='release_ready';
  manifest.review.acousticListening=blueprint.review.audioListeningValidated=true;
  manifest.review.mobile=blueprint.review.mobileValidated=true;
  assert.ok(verifyCookingAudioReview(blueprint,manifest).some(e=>e.includes('Publication refusée')));
});

test('Une validation déclarée uniquement par le manifeste est également interdite',()=>{
  const {blueprint,manifest}=fixture();
  manifest.status='audio_validated';
  assert.ok(verifyCookingAudioReview(blueprint,manifest).some(e=>e.includes('avant validation')));
});

test('Lok Lak V2 : approbation audio explicite sans validations de publication inventées',()=>{
  const blueprint=JSON.parse(readFileSync('src/data/atelier-recette-guides/lok-lak.json','utf8'));
  const manifest=JSON.parse(readFileSync('src/data/atelier-recette-audio/lok-lak-v2.json','utf8'));
  assert.equal(blueprint.audio.asset?.sha256,manifest.sha256,'Ecoute attachee a la bonne version MP3');
  assert.equal(blueprint.review.audioListeningValidated,true,'Ecoute utilisateur approuvee');
  assert.equal(manifest.review.acousticListening,true,'Manifeste de revue synchronise');
  assert.equal(blueprint.review.mobileValidated,false,'Validation utilisateur mobile non alleguee');
  assert.equal(blueprint.review.desktopValidated,false,'Validation utilisateur desktop non alleguee');
  assert.equal(blueprint.review.recipeValidated,false,'Essai en cuisine non allegue');
  assert.equal(blueprint.review.productionApproved,false,'Publication non autorisee');
  assert.equal(blueprint.audio.status,'generated_review_pending','L etat technique attend encore les controles mobiles et desktop');
  assert.equal(manifest.status,'audio_generated_review_pending','L audio complet nest pas marque audio_validated');
  assert.deepEqual(verifyCookingAudioReview(blueprint,manifest),[],'Validation partielle coherente');
});
