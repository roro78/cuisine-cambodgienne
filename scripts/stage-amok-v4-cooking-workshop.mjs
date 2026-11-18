#!/usr/bin/env node
/**
 * Import the OWNER'S saved private Amok Trey v4 into the shared cooking-
 * workshop page. Does not generate speech, connect to servers, push or deploy.
 *
 * The script NEVER reads sources from GitHub: --source is the existing private
 * V4 on the owner machine. The seven exact narration SHA256s are verified by
 * releasePreflight BEFORE any public file write.
 *
 * The --listen-approved flag must be set ONLY after real full-track listening.
 * A preview-only approval is NOT sufficient for the release gate.
 */
import {readFileSync,existsSync,mkdirSync,copyFileSync,writeFileSync,statSync,constants} from 'node:fs';
import {resolve,dirname,join,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {
  AMOK_ID, AMOK_TRACKS,amokChapterTimeline,releasePreflight
} from './prepare-amok-v4-audio-release.mjs';
import {
  loadCanonicalRecipes,validateWorkshopBlueprint
} from './check-workshop-blueprints.mjs';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const TARGET_SLUG='atelier-pratique-amok-trey';
const URL='/audio/workshops/'+TARGET_SLUG+'/atelier-coral-v4.mp3';
const MP3_SHA='177ccaad9b45a18c11270d9a949e8d19f55516e8e045745615d32f5c2d4bceff';
const MP3_NAME='amok-trey-v4-coral-integral.mp3';
const TARGET_BLUEPRINT=join(ROOT,'src/data/atelier-recette-guides/amok-trey.json');
const TARGET_MANIFEST=join(ROOT,'src/data/atelier-recette-audio/amok-trey-v4.json');
const TARGET_MP3=join(ROOT,'public',URL.slice(1));
const REGISTER=join(ROOT,'src/data/cookingWorkshopGuides.ts');
const hash=value=>createHash('sha256').update(value).digest('hex');
const err=(code)=>{throw Error('AMOK_STAGING_BLOCKED_'+code)};

const ids=AMOK_TRACKS.map(t=>t.id);
const args=process.argv.slice(2);
const getArg=(name)=>args.find(s=>s.startsWith('--'+name+'='))?.slice(name.length+3);
const sourcePath=getArg('source');
const privateDir=getArg('private-dir');
const listened=args.includes('--full-audio-listened');
const stage=args.includes('--stage');
const allowed=['--full-audio-listened','--stage'];
if(!args.every(a=>allowed.includes(a)||a.startsWith('--source=')||a.startsWith('--private-dir='))||
   args.filter(a=>a.startsWith('--source=')).length!==1||
   args.filter(a=>a.startsWith('--private-dir=')).length!==1||
   !sourcePath||!privateDir||!isAbsolute(sourcePath)||!isAbsolute(privateDir))
 err('USAGE_ABSOLUTE_PATHS_REQUIRED');
if(stage&&!listened)err('COMPLETE_LISTENING_NOT_CONFIRMED');

// This function validates 7 texts and all real, private MP3 bytes first.
// It uses ffprobe but does NOT make an OpenAI request.
const verified=releasePreflight({dir:privateDir,source:sourcePath}).result;
if(!verified.sourceVerified)err('SOURCE_V4_NOT_VERIFIED');
const source=JSON.parse(readFileSync(sourcePath,'utf8'));
if(source.id!==AMOK_ID||source.version!==4||source.kind!=='atelier')
  err('WRONG_SOURCE');
if(source.atelier_reference?.recipeSlug!=='amok-trey')
  err('RECIPE_REFERENCE_MISMATCH');
const f=source.fields;
const p=source.atelier_phase_details?.phases;
const narrations=source.atelier_scripts?.chapters;
if(!f||!Array.isArray(f.phases)||f.phases.length!==6||
   !Array.isArray(p)||p.length!==6||!Array.isArray(narrations)||narrations.length!==7)
 err('PRIVATE_V4_INCOMPLETE');
const recipes=await loadCanonicalRecipes();
const recipe=recipes.find(r=>r.slug==='amok-trey');
if(!recipe||!Number.isInteger(recipe.baseServings)||recipe.baseServings<1)
 err('CANONICAL_RECIPE_MISSING');
const timeline=amokChapterTimeline();
const chapterTitles=['Bienvenue et mise en place',...f.phases.map(x=>x.title)];
const chapters=ids.map((id,i)=>({
 id,title:chapterTitles[i],
 startSec:timeline.chapters[i].startSec,
 endSec:timeline.chapters[i].endSec
}));
const scriptTexts=narrations.map(c=>c.text);
const scriptSha256=hash(JSON.stringify(scriptTexts));
const sourceAsset={
 audioUrl:URL,durationSec:timeline.durationSec,
 sha256:MP3_SHA,chapters,scriptSha256
};
const sourceNotes=recipe.context??recipe.intro??'';
const phaseRows=p.map((detail,i)=>{
 const meta=f.phases[i];
 if(detail.id!==ids[i+1]||Number(detail.index)!==i||
    detail.sourceTitle!==meta.title||
    detail.sourceLearning!==meta.learning)err('PHASE_SOURCE_CHANGED');
 const minutes=Number(detail.minutes);
 if(!Number.isInteger(minutes)||minutes<1||minutes>240)err('PHASE_MINUTES');
 for(const key of ['observe','check','mistake','recovery','safety','pausePrompt'])
   if(typeof detail[key]!=='string'||!detail[key].trim())err('PHASE_'+key+'_MISSING');
 return {
   id:ids[i+1],
   title:meta.title,
   minutes,
   ingredientNames:detail.ingredientNames,
   actions:detail.actions,
   observe:detail.observe,
   check:detail.check,
   mistake:detail.mistake,
   recovery:detail.recovery,
   learning:meta.learning,
   safety:detail.safety,
   pausePrompt:detail.pausePrompt,
   audioScript:scriptTexts[i+1]
 };
});
const total=phaseRows.reduce((a,p)=>a+p.minutes,0);
const mediaImage='/images/cuisine/v19-amok-trey-1440.webp';
if(!existsSync(join(ROOT,'public',mediaImage.slice(1))))err('CANONICAL_IMAGE_MISSING');
const blueprint={
 schemaVersion:1,
 kind:'cooking-workshop',
 status:stage?'release_ready':'review',
 slug:TARGET_SLUG,
 title:source.title,
 sourceRecipeSlug:'amok-trey',
 finalPreparation:f.finalPreparation,
 learningGoal:f.learningGoal,
 difficulty:recipe.difficulty||'Intermédiaire',
 canonicalServings:recipe.baseServings,
 portionLabel:f.portionLabel,
 duration:{
   preparationMinutes:0,practicalMinutes:total,waitingMinutes:0,
   waitingNote:'Les six phases comprennent la préparation et la cuisson ; arrêtez ou prolongez la lecture selon les gestes réels.'
 },
 recipeIngredients:{mode:'canonical-recipe',additionalTrialIngredients:[]},
 equipment:f.equipment,
 beforeStarting:f.beforeStarting,
 safety:p.map(x=>x.safety).filter(Boolean),
 allergens:{
   status:'declared',
   items:['poisson (poisson blanc et sauce de poisson)','œufs']
 },
 sources:{
   recipeSource:'/recettes/amok-trey/',
   culturalNote:sourceNotes,
   pedagogicalAdaptation:f.intro
 },
 phases:phaseRows,
 audio:{
   mode:'guided-cooking',
   status:stage?'validated':'generated_review_pending',
   voice:'coral',
   intro:scriptTexts[0],
   storyboardVersion:2,
   publicProviderMention:false,
   asset:sourceAsset,
   editorialTextApproved:true,
   approvedScriptSha256:scriptSha256,
   editorialApprovalScope:'sept narrations exactes de l’atelier Amok Trey V4',
   editorialApprovalDate:'2026-11-09'
 },
 media:{
   finishedPreparationImage:mediaImage,
   imageValidated:true,
   rightsValidated:false,
   stepImagePaths:[]
 },
 review:{
   recipeValidated:true,
   editorialValidated:true,
   audioListeningValidated:listened,
   mobileValidated:false,
   desktopValidated:false,
   productionApproved:stage
 },
 releaseAuthorization:stage?{
   ownerApproved:true,
   approvedOn:'2026-11-18',
   scope:'amok-trey-v4',
   sourceBasedRecipeReviewAccepted:true,
   acceptsPendingPhysicalDeviceQA:true,
   authorizesExistingIllustrations:true,
   note:'Accord de mise en production du propriétaire le 18 novembre 2026 ; sept narrations, visa et revue culinaires issus du Studio V4 ; écoute intégrale distinctement confirmée via la commande.'
 }:undefined
};
const errors=validateWorkshopBlueprint(blueprint,recipes);
if(errors.length) {
  // Only public field names and validation diagnostics; never private script content.
  const clean=errors.map(e=>e.replace(/'.*?'/g,"[champ]")).slice(0,30);
  process.stderr.write('AMOK_BLUEPRINT_NOT_RELEASE_READY\n'+clean.join('\n')+'\n');
  process.exit(1);
}

const manifest={
 atelier:TARGET_SLUG,canonicalRecipe:'amok-trey',
 status:stage?'audio_generated_review_pending':'audio_generated_review_pending',
 voice:'coral',audioUrl:URL,
 durationSec:timeline.durationSec,sha256:MP3_SHA,chapters,
 scriptSha256,
 review:{acousticListening:listened,mobile:false,desktop:false},
 sourceBackend:'Orvekio/OpenAI Speech'
};
const js=readFileSync(REGISTER,'utf8');
const anchor="import baiSachChrouk from './atelier-recette-guides/bai-sach-chrouk.json';";
const list="export const cookingWorkshopGuides=[kroeung,lokLak,samlorMachu,numBanhChok,kuyTeav,baiSachChrouk];";
if(!js.includes(anchor)||!js.includes(list))err('REGISTRY_UNEXPECTED');
const updated=js.replace(anchor,anchor+"\nimport amokTrey from './atelier-recette-guides/amok-trey.json';")
  .replace(list,"export const cookingWorkshopGuides=[kroeung,lokLak,samlorMachu,numBanhChok,kuyTeav,baiSachChrouk,amokTrey];");

if(!stage) {
 // Safe: dry-run only; no texts written to public and no copy of MP3 to web.
 console.log('AMOK_PRIVATE_SOURCE_MP3_AND_BLUEPRINT_VALID');
 console.log('AMOK_RELEASE_NOT_STAGED: use --stage --full-audio-listened after integral listening approval');
 process.exit(0);
}

if([TARGET_BLUEPRINT,TARGET_MANIFEST,TARGET_MP3].some(existsSync)||js.includes('import amokTrey '))
 err('STAGE_ALREADY_EXISTS_USE_VERSIONED_REVIEW');
mkdirSync(dirname(TARGET_MP3),{recursive:true});
writeFileSync(TARGET_BLUEPRINT,JSON.stringify(blueprint,null,2)+'\n',{flag:'wx'});
writeFileSync(TARGET_MANIFEST,JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
copyFileSync(join(privateDir,MP3_NAME),TARGET_MP3,constants.COPYFILE_EXCL);
writeFileSync(REGISTER,updated);
if(statSync(TARGET_MP3).size!==timeline.bytes||
   hash(readFileSync(TARGET_MP3))!==MP3_SHA)err('STAGED_AUDIO_CHANGED');
execFileSync(process.execPath,['scripts/check-workshop-blueprints.mjs',
  'src/data/atelier-recette-guides/amok-trey.json'],{cwd:ROOT,stdio:'inherit'});
execFileSync(process.execPath,['scripts/check-amok-v4-publication.mjs'],{cwd:ROOT,stdio:'inherit'});
console.log('AMOK_STAGED_IN_LOCAL_GIT_TREE_ONLY');
console.log('NOT_COMMITTED_NOT_DEPLOYED');
