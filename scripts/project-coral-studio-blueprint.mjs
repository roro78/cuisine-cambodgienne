#!/usr/bin/env node
/**
 * Translate a CURRENT owner-reviewed Studio workshop into the existing
 * Astro cooking-workshop blueprint. No AI, TTS or deployment.
 *
 * The release intent is a checksum-only Studio authorization; it is NOT
 * enough by itself to infer media rights, culinary provenance or device QA.
 * The separate human profile must explicitly provide missing decisions.
 *
 * CLI: node scripts/project-coral-studio-blueprint.mjs
 *  --source /private/studio-creation.json
 *  --intent /private/studio-release-intent.json
 *  --profile /private/reviewed-publication-profile.json
 *  --out /private/reviewed-blueprint.json
 */
import {readFile,writeFile,lstat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {readFileSync,lstatSync,realpathSync} from 'node:fs';
import {resolve,sep} from 'node:path';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {loadCanonicalRecipes,validateWorkshopBlueprint} from './check-workshop-blueprints.mjs';
import {validateCoralStudioReleaseIntent} from './package-coral-approved-release.mjs';
const digest=text=>createHash('sha256').update(text).digest('hex');
const shaFile=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const ids=['intro','installer','preparer','assembler','maitriser','rectifier','terminer'];
const fail=msg=>{throw Error('CORAL_BLUEPRINT_'+msg);};
const validText=(s,n=20)=>typeof s==='string'&&s.trim().length>=n;
const validList=(arr,minimum=1)=>Array.isArray(arr)&&arr.length>=minimum&&
  arr.every(item=>validText(item,12));

export function projectCoralStudioBlueprint({source,intent,profile,recipes}){
 const r=validateCoralStudioReleaseIntent(intent);
 if(!source||source.kind!=='atelier'||source.id!==r.creation_id||
   source.version!==r.creation_version||source.slug!==r.candidate_public_slug||
   source.atelier_reference?.recipeSlug!==r.recipe_slug||
   !validText(source.title,18))fail('SOURCE');
 if(!profile||profile.contract!=='cdc-coral-studio-reviewed-blueprint-v1'||
   profile.creationId!==r.creation_id||profile.creationVersion!==r.creation_version||
   profile.requestId!==r.request_id||profile.bindingSha256!==r.binding_sha256)
   fail('PROFILE_NOT_MATCHED');
 if(!Array.isArray(recipes))fail('RECIPE_INDEX');
 const recipe=recipes.find(x=>x.slug===r.recipe_slug);
 if(!recipe||!Number.isInteger(recipe.baseServings)||recipe.baseServings<1||
    !Array.isArray(recipe.ingredients)||!recipe.ingredients.length)
   fail('CANONICAL_RECIPE');
 if(!['Facile','Intermédiaire','Avancé'].includes(profile.difficulty)||
   !validList(profile.safety,1)||
   !profile.allergens||!['declared','none'].includes(profile.allergens.status)||
   !Array.isArray(profile.allergens.items)||
   (profile.allergens.status==='declared'&&!validList(profile.allergens.items,1))||
   (profile.allergens.status==='none'&&profile.allergens.items.length>0)||
   !profile.media||!/^\/images\/cuisine\/[a-z0-9-]+\.webp$/.test(profile.media.finishedPreparationImage??'')||
   profile.media.imageValidated!==true||profile.media.rightsValidated!==true||
   !Array.isArray(profile.media.stepImagePaths)||profile.media.stepImagePaths.length!==0||
   !validText(profile.artworkRightsEvidence,20)||
   !/^[a-f0-9]{64}$/.test(profile.visualSha256??''))
   fail('HUMAN_MEDIA_AND_SAFETY');
 // The Studio approval was for exact image bytes, not just a reusable URL.
 // A local build must use the same existing public image and fingerprint.
 const imagePath=resolve('public',profile.media.finishedPreparationImage.slice(1));
 const mediaRoot=realpathSync(resolve('public/images/cuisine'));
 if(!realpathSync(imagePath).startsWith(mediaRoot+sep)||
    lstatSync(imagePath).isSymbolicLink()||
    shaFile(imagePath)!==profile.visualSha256)fail('VISUAL_SHA_STALE');
 const verified=profile.review;
 if(!verified||['recipeValidated','editorialValidated','audioListeningValidated',
   'mobileValidated','desktopValidated','productionApproved'].some(key=>verified[key]!==true)||
   !validText(profile.deviceQaEvidence,20)||!validText(profile.culinaryApprovalEvidence,20))
   fail('HUMAN_REVIEW_REQUIRED');
 const f=source.fields,details=source.atelier_phase_details?.phases,
   scripts=source.atelier_scripts?.chapters;
 if(!f||!validText(f.finalPreparation,35)||!validText(f.learningGoal,60)||
   !validText(f.portionLabel,12)||!validText(f.intro,30)||
   !validList(f.beforeStarting)||!validList(f.equipment)||
   !Array.isArray(f.phases)||f.phases.length!==6||
   !Array.isArray(details)||details.length!==6||
   !Array.isArray(scripts)||scripts.length!==7)
   fail('ATELIER_FIELDS');
 const voice=[];
 for(let i=0;i<7;i++){
   const row=scripts[i];
   if(row?.id!==ids[i]||row.index!==i||!validText(row.text,120)||
     digest(row.text)!==r.chapters[i].text_sha256)
     fail('SCRIPT_SOURCE_MISMATCH');
   voice.push(row.text);
 }
 const phases=[];let duration=0;
 for(let i=0;i<6;i++){
   const a=f.phases[i],p=details[i],id=ids[i+1];
   if(!a||!p||p.index!==i||p.id!==id||
     p.sourceTitle!==a.title||p.sourceLearning!==a.learning||
     !Number.isInteger(Number(p.minutes))||Number(p.minutes)<1||
     !Array.isArray(p.actions)||p.actions.length<2||
     !Array.isArray(p.ingredientNames))
     fail('PHASE_SOURCE');
   const fields=['observe','check','mistake','recovery','safety','pausePrompt'];
   if(fields.some(field=>!validText(p[field],field==='pausePrompt'?20:24))||
     p.actions.some(v=>!validText(v,45)))
     fail('PHASE_REVIEW');
   const row={id,title:a.title,minutes:Number(p.minutes),
     ingredientNames:p.ingredientNames,actions:p.actions,observe:p.observe,
     check:p.check,mistake:p.mistake,recovery:p.recovery,
     learning:a.learning,safety:p.safety,pausePrompt:p.pausePrompt,
     audioScript:voice[i+1]};
   duration+=row.minutes;phases.push(row);
 }
 const scriptSha256=digest(JSON.stringify(voice));
 const blueprint={
   schemaVersion:1,kind:'cooking-workshop',status:'release_ready',
   slug:r.candidate_workshop_slug,title:source.title,sourceRecipeSlug:r.recipe_slug,
   finalPreparation:f.finalPreparation,learningGoal:f.learningGoal,
   difficulty:profile.difficulty,canonicalServings:recipe.baseServings,
   portionLabel:f.portionLabel,
   duration:{preparationMinutes:0,practicalMinutes:duration,waitingMinutes:0,
     waitingNote:'La préparation et la cuisson sont comprises dans les six phases ; mettez la narration en pause selon le geste.'},
   recipeIngredients:{mode:'canonical-recipe',additionalTrialIngredients:[]},
   equipment:f.equipment,beforeStarting:f.beforeStarting,safety:profile.safety,
   allergens:profile.allergens,
   sources:{recipeSource:'/recettes/'+r.recipe_slug+'/',
     culturalNote:recipe.context||recipe.intro,
     pedagogicalAdaptation:f.intro},
   phases,
   audio:{mode:'guided-cooking',status:'validated',voice:'coral',
     intro:voice[0],storyboardVersion:2,publicProviderMention:false,
     asset:{audioUrl:'/'+r.candidate_audio_path,
       durationSec:r.mp3_duration_seconds,sha256:r.mp3_sha256,
       chapters:r.chapters.map((ch,i)=>({id:ch.id,title:i===0?'Introduction':phases[i-1].title,
         startSec:ch.startSec,endSec:ch.endSec})),scriptSha256},
     editorialTextApproved:true,approvedScriptSha256:scriptSha256,
     editorialApprovalScope:'Sept narrations exactes relues dans le Studio',
     editorialApprovalDate:profile.approvedDate},
   media:profile.media,review:verified,
   releaseAuthorization:{ownerApproved:true,approvedOn:profile.approvedDate,
     scope:'studio-coral-'+r.candidate_workshop_slug,
     sourceBasedRecipeReviewAccepted:true,
     acceptsPendingPhysicalDeviceQA:false,
     authorizesExistingIllustrations:true,
     note:'Publication explicitement approuvée après revue culinaire, droits médias, écoute intégrale et QA des appareils.'}
 };
 const errors=validateWorkshopBlueprint(
   {...blueprint,status:'review'},recipes);
 if(errors.length)fail('CONTRACT_'+errors.slice(0,8).join('|').replace(/\s+/g,'_'));
 return blueprint;
}
async function main(){
 const args=process.argv.slice(2),options={};
 for(let i=0;i<args.length;i+=2){
   if(!['--source','--intent','--profile','--out'].includes(args[i])||
     !args[i+1]||Object.hasOwn(options,args[i]))fail('ARGS');
   options[args[i]]=args[i+1];
 }
 if(Object.keys(options).length!==4)fail('ARGS');
 async function file(p){const target=resolve(p),s=await lstat(target);
   if(!s.isFile()||s.isSymbolicLink()||s.size>64000)fail('PRIVATE_FILE');
   return JSON.parse(await readFile(target,'utf8'));}
 const [source,intent,profile,recipes]=await Promise.all([
   file(options['--source']),file(options['--intent']),file(options['--profile']),
   loadCanonicalRecipes()]);
 const blueprint=projectCoralStudioBlueprint({source,intent,profile,recipes});
 await writeFile(resolve(options['--out']),JSON.stringify(blueprint,null,2)+'\n',{flag:'wx',mode:0o600});
 process.stdout.write('CORAL_STUDIO_ASTRO_BLUEPRINT_REVIEWED_NOT_PUBLISHED\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 main().catch(e=>{process.stderr.write(String(e.message||'BLUEPRINT_FAILED')+'\n');process.exitCode=1;});
}
