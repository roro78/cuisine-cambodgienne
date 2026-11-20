import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {projectCoralStudioBlueprint} from '../scripts/project-coral-studio-blueprint.mjs';
import {loadCanonicalRecipes,validateWorkshopBlueprint} from '../scripts/check-workshop-blueprints.mjs';
const guide=JSON.parse(readFileSync('src/data/atelier-recette-guides/kroeung-jaune.json','utf8'));
const sha=text=>createHash('sha256').update(text).digest('hex');
function fixture(recipes){
 const slug=guide.sourceRecipeSlug,voice=[guide.audio.intro,...guide.phases.map(p=>p.audioScript)];
 const creation='c-'+'c'.repeat(24),job='f'.repeat(48);
 const source={id:creation,version:5,kind:'atelier',slug,
  title:guide.title,atelier_reference:{recipeSlug:slug},
  fields:{intro:guide.sources.pedagogicalAdaptation,finalPreparation:guide.finalPreparation,
   learningGoal:guide.learningGoal,portionLabel:guide.portionLabel,
   beforeStarting:guide.beforeStarting,equipment:guide.equipment,
   phases:guide.phases.map(p=>({title:p.title,learning:p.learning}))},
  atelier_phase_details:{phases:guide.phases.map((p,i)=>({
   index:i,id:p.id,sourceTitle:p.title,sourceLearning:p.learning,
   minutes:p.minutes,ingredientNames:p.ingredientNames,actions:p.actions,
   observe:p.observe,check:p.check,mistake:p.mistake,recovery:p.recovery,
   safety:p.safety,pausePrompt:p.pausePrompt
  }))},
  atelier_scripts:{chapters:voice.map((text,index)=>({
   index,id:index===0?'intro':guide.phases[index-1].id,text,editorNote:''
  }))}
 };
 const audio=guide.audio.asset;
 const intent={contract:'cdc-coral-studio-release-intent-v1',
  creation_id:creation,creation_version:5,request_id:job,
  binding_sha256:sha('synthetic source binding'),recipe_sha256:sha('synthetic canonical recipe'),
  recipe_slug:slug,candidate_public_slug:slug,candidate_workshop_slug:'atelier-pratique-'+slug,
  candidate_audio_path:'audio/workshops/atelier-pratique-'+slug+'/atelier-coral-'+audio.sha256.slice(0,12)+'.mp3',
  voice:'coral',model:'gpt-4o-mini-tts',speed_milli:930,
  mp3_sha256:audio.sha256,mp3_bytes:2200,mp3_duration_seconds:audio.durationSec,
  chapters:audio.chapters.map((c,i)=>({
   id:c.id,text_sha256:sha(voice[i]),startSec:c.startSec,endSec:c.endSec
  })),
  human_publication_consent:true,publication_ready:false,deployment_triggered:false
 };
 const profile={contract:'cdc-coral-studio-reviewed-blueprint-v1',
  creationId:creation,creationVersion:5,requestId:job,bindingSha256:intent.binding_sha256,
  difficulty:guide.difficulty,safety:guide.safety,allergens:guide.allergens,
  media:{...guide.media,rightsValidated:true},
  visualSha256:sha(readFileSync(resolve('public',guide.media.finishedPreparationImage.slice(1)))),
  approvedDate:'2026-11-20',
  artworkRightsEvidence:'Fiction de contrôle : licence et image approuvées.',
  deviceQaEvidence:'Fiction de contrôle : essai de lecture tactile et bureau.',
  culinaryApprovalEvidence:'Fiction de contrôle : recette vérifiée avant publication.',
  review:{recipeValidated:true,editorialValidated:true,
   audioListeningValidated:true,mobileValidated:true,desktopValidated:true,
   productionApproved:true}
 };
 return {source,intent,profile,recipes};
}
test('convert existing real seven-chapter culinary structure into native Astro blueprint with provenance',async()=>{
 const p=fixture(await loadCanonicalRecipes());
 const r=projectCoralStudioBlueprint(p);
 assert.equal(r.kind,'cooking-workshop');
 assert.equal(r.slug,p.intent.candidate_workshop_slug);
 assert.equal(r.phases.length,6);
 assert.equal(r.audio.asset.chapters.length,7);
 assert.equal(r.audio.asset.sha256,p.intent.mp3_sha256);
 assert.equal(r.audio.asset.scriptSha256,sha(JSON.stringify([
  guide.audio.intro,...guide.phases.map(x=>x.audioScript)])));
 assert.equal(r.media.rightsValidated,true);
 assert.equal(r.sources.recipeSource,'/recettes/'+guide.sourceRecipeSlug+'/');
 assert.equal(r.review.productionApproved,true);
 assert.equal(validateWorkshopBlueprint({...r,status:'review'},p.recipes).length,0);
 assert.ok(!JSON.stringify(p.intent).includes(guide.audio.intro));
});
test('never invent editorial, device, allergen or media approval',async()=>{
 const f=fixture(await loadCanonicalRecipes());
 const changes=[
  {profile:{...f.profile,review:{...f.profile.review,mobileValidated:false}}},
  {profile:{...f.profile,artworkRightsEvidence:''}},
  {profile:{...f.profile,media:{...f.profile.media,rightsValidated:false}}},
  {profile:{...f.profile,visualSha256:'f'.repeat(64)}},
  {profile:{...f.profile,allergens:{status:'none',items:[]}}},
  {intent:{...f.intent,recipe_slug:'different-recipe'}},
  {source:{...f.source,version:6}},
  {source:{...f.source,atelier_scripts:{chapters:
    f.source.atelier_scripts.chapters.map((row,i)=>i===3?{...row,text:row.text+' malicious edit'}:row)}}}
 ];
 for(const modify of changes){
  const q={...f,...modify};
  if(modify.profile?.allergens?.status==='none'&&f.profile.allergens.status==='none')continue;
  assert.throws(()=>projectCoralStudioBlueprint(q),/CORAL_BLUEPRINT|CORAL_SCOPED_RELEASE/);
 }
});
