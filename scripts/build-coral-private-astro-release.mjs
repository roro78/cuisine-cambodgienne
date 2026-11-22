#!/usr/bin/env node
/**
 * Offline-only Astro builder for an EXACT, human-reviewed Coral Studio release.
 *
 * Run ONLY inside a disposable, private and clean checkout pinned to the
 * approved Git commit. The checkout is allowed to be modified; never use main,
 * ovh-production or a developer's normal worktree. No upload, public Git write,
 * OpenAI call or OVH publication is performed.
 *
 * node scripts/build-coral-private-astro-release.mjs
 *   --packet /private/private-build-inputs.json
 *   --audio /private/verified-final.mp3
 *   --source-sha <40 hex> --out /private/new-bundle
 *
 * The external launcher must provision the disposable checkout and pass the
 * source commit deliberately. This CLI verifies both before any write.
 */
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile,stat,lstat,realpath,mkdir,readdir} from 'node:fs/promises';
import {resolve,join,dirname,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {projectCoralStudioBlueprint} from './project-coral-studio-blueprint.mjs';
import {loadCanonicalRecipes,validateWorkshopBlueprint} from './check-workshop-blueprints.mjs';
import {packageCoralStudioRelease,validateCoralPrivateVisual,CORAL_BUILD_PACKET_MAX} from './package-coral-approved-release.mjs';
import {preserveCoralSharedPages,preserveCoralIndexes} from './coral-preserve-published-pages.mjs';

const sha=x=>createHash('sha256').update(x).digest('hex');
const safeName=/^[a-z0-9][a-z0-9-]{2,99}$/;
const AMOK_V4_SYNC_SHA='c0eb5d2e2597d42ea2e6f2553a18c257417b9b93';
const AMOK_MP3='audio/workshops/atelier-pratique-amok-trey/atelier-coral-v4.mp3';
const AMOK_PAGE='apprendre/pratique/amok-trey/index.html';
const fail=code=>{throw Error('CORAL_PRIVATE_BUILD_'+code);};
async function privateFile(path,max){
 const s=await lstat(path);
 if(!s.isFile()||s.isSymbolicLink()||s.size<1||s.size>max)fail('INPUT_FILE');
 return readFile(path);
}
function run(command,args,cwd){
 try{return execFileSync(command,args,{cwd,encoding:'utf8',timeout:180000,
  stdio:['ignore','pipe','pipe'],maxBuffer:1000000}).trim();}
 catch{fail('PROCESS_'+command.replace(/[^a-z]/gi,''));}
}
export function verifyPrivateBuildCheckout(root,sourceSha){
 if(!/^[a-f0-9]{40}$/.test(sourceSha??''))fail('SOURCE_SHA');
 const original=run('git',['rev-parse','--show-toplevel'],root);
 if(resolve(original)!==resolve(root))fail('CHECKOUT_ROOT');
 if(run('git',['rev-parse','HEAD'],root)!==sourceSha)fail('WRONG_COMMIT');
 // PR #237 was merged after the Coral branch was opened. Never replace the
 // live catalogue/sitemap using a checkout that predates Amok Trey V4.
 run('git',['merge-base','--is-ancestor',AMOK_V4_SYNC_SHA,sourceSha],root);
 if(run('git',['status','--porcelain','--untracked-files=all'],root)!=='')
  fail('CHECKOUT_NOT_CLEAN');
 return sourceSha;
}
/**
 * Only touches the isolated checkout, with JSON imports like the six originals.
 * The published site and the existing six blueprints/MP3 are never modified.
 */
export async function prepareCoralPrivateAstroOverlay({root,blueprint,intent,audioBytes,importName='coralStudioPrivate'}){
 const slug=intent.candidate_public_slug;
 if(!safeName.test(slug)||blueprint.slug!==slug||
   blueprint.sourceRecipeSlug!==intent.recipe_slug||
   blueprint.audio?.asset?.audioUrl!=='/'+intent.candidate_audio_path||
   !Buffer.isBuffer(audioBytes)||audioBytes.length!==intent.mp3_bytes||
   sha(audioBytes)!==intent.mp3_sha256)
   fail('OVERLAY_IDENTITY');
 const audioPath=resolve(root,'public',intent.candidate_audio_path);
 const guidePath=resolve(root,'src/data/atelier-recette-guides',slug+'.json');
 const audioManifestPath=resolve(root,'src/data/atelier-recette-audio','coral-studio-'+slug+'.json');
 const guideRoot=resolve(root,'src/data/atelier-recette-guides');
 const assetRoot=resolve(root,'public/audio/workshops');
 for(const path of [audioPath,guidePath,audioManifestPath]){
  if(!(path.startsWith(guideRoot+sep)||path.startsWith(assetRoot+sep)||
     path.startsWith(resolve(root,'src/data/atelier-recette-audio')+sep)))fail('OVERLAY_PATH');
 }
 // Human-reviewed existing media must be present in the pinned public tree.
 const image=resolve(root,'public',blueprint.media.finishedPreparationImage.slice(1));
 const imageRoot=await realpath(resolve(root,'public/images/cuisine'));
 if(!image.startsWith(imageRoot+sep)||(await realpath(image))!==image||
   (await lstat(image)).isSymbolicLink()||
   !/^[a-f0-9]{64}$/.test(intent.visualSha256??'')||
   sha(await privateFile(image,8000000))!==intent.visualSha256)
   fail('MEDIA_SHA');
 // Intentionally check against the HUMAN profile in the caller as well.
 const reg=resolve(root,'src/data/cookingWorkshopGuides.ts');
 const text=(await privateFile(reg,20000)).toString('utf8');
 const line=text.match(/^export const cookingWorkshopGuides=\[([^\n;]+)\];$/m);
 if(!line||!/^coralStudioPrivate[0-9]*$/.test(importName)||text.includes("import "+importName+" from "))fail('REGISTRY');
 const edit="import "+importName+" from './atelier-recette-guides/"+slug+".json';\n"+
  text.replace(line[0],"export const cookingWorkshopGuides=["+line[1]+","+importName+"];");
 // Missing files are mandatory: collision with a previously published guide
 // or an older audio version must never overwrite anything.
 for(const path of [guidePath,audioManifestPath,audioPath]){
  try{await lstat(path);fail('TARGET_EXISTS');}
  catch(e){if(e.code!=='ENOENT')throw e;}
 }
 await mkdir(dirname(audioPath),{recursive:true,mode:0o700});
 await writeFile(guidePath,JSON.stringify(blueprint,null,2)+'\n',{flag:'wx',mode:0o600});
 const manifest={atelier:slug,canonicalRecipe:intent.recipe_slug,
  status:'audio_validated',voice:'coral',privateTranscript:true,
  audioUrl:blueprint.audio.asset.audioUrl,
  durationSec:intent.mp3_duration_seconds,sha256:intent.mp3_sha256,
  chapters:blueprint.audio.asset.chapters,
  scriptSha256:blueprint.audio.asset.scriptSha256,
  review:{acousticListening:true,mobile:true,desktop:true},
  sourceBackend:'Coral Speech (private reviewed Studio)'};
 await writeFile(audioManifestPath,JSON.stringify(manifest,null,2)+'\n',{flag:'wx',mode:0o600});
 await writeFile(audioPath,audioBytes,{flag:'wx',mode:0o600});
 await writeFile(reg,edit,{flag:'w',mode:0o600});
 return {guidePath,audioManifestPath,audioPath,registryPath:reg};
}
/** Prevent a new scoped release from silently dropping the published Amok V4.
 * Its exact original audio/page must survive an unrelated Astro rebuild.
 */
export async function verifyHistoricalAmokV4({root,dist}){
 const release=JSON.parse((await privateFile(
   resolve(root,'releases/amok-trey-v4/manifest.json'),64000)).toString('utf8'));
 if(!Array.isArray(release.files)||release.files.length!==5)fail('AMOK_MANIFEST');
 for(const path of [AMOK_MP3,AMOK_PAGE]){
   const entry=release.files.find(f=>f.path===path);
   if(!entry||!/^([a-f0-9]{64})$/.test(entry.sha256??''))
     fail('AMOK_ENTRY');
   const bytes=await privateFile(resolve(dist,path),32000000);
   if(sha(bytes)!==entry.sha256)fail('AMOK_REGRESSION');
 }
 for(const file of ['apprendre/index.html','sitemap.xml']){
   const text=(await privateFile(resolve(dist,file),500000)).toString('utf8');
   if(!text.includes('/apprendre/pratique/amok-trey/'))
     fail('AMOK_CATALOGUE_REGRESSION');
 }
 return true;
}

export async function verifyCoralBuiltIndexes({dist,intent}){
 const [social,canonical,guided]=await Promise.all([
  'social-feed.json','editorial-source-index.json','editorial-guided-fields.json'
 ].map(async file=>{
  const payload=JSON.parse((await privateFile(join(dist,file),500000)).toString('utf8'));
  if(!Array.isArray(payload.items))fail('INDEX');
  return payload.items;
 }));
 const recipe=canonical.find(record=>record.id==='recette:'+intent.recipe_slug);
 if(!recipe||recipe.fingerprint!==intent.recipe_sha256)fail('RECIPE_SHA_STALE');
 const id='atelier:'+intent.candidate_public_slug;
 const workshop=canonical.find(record=>record.id===id);
 const guide=guided.find(record=>record.id===id);
 const link='https://www.cuisine-du-cambodge.com/apprendre/pratique/'+intent.candidate_public_slug+'/';
 if(!workshop||workshop.model!=='cookingWorkshopGuides'||!guide||
   guide.model!==workshop.model||guide.fingerprint!==workshop.fingerprint||
   !/^[a-f0-9]{64}$/.test(workshop.fingerprint)||!social.some(record=>record.id===id&&record.url===link))
   fail('WORKSHOP_INDEX_MISMATCH');
 return workshop.fingerprint;
}
// The archived approved job remains private. Only reapply records confirmed in
// the live canonical index, so a staged or rolled back workshop is excluded.
async function restorePublishedOverlays({root,history,baseline,recipes}){
 const live=JSON.parse(await privateFile(join(baseline,'editorial-source-index.json'),524288));
 const confirmed=new Map(live.items.map(row=>[row.id,row]));
 const restored=[];
 let count=0;
 for(const job of (await readdir(history,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){
  if(!job.isDirectory()||! /^[a-f0-9]{48}$/.test(job.name))continue;
  const dir=join(history,job.name);
  let manifest;
  try{manifest=JSON.parse(await privateFile(join(dir,'bundle','BUNDLE-MANIFEST-PRIVE.json'),64000));}
  catch(e){if(e.code==='ENOENT')continue;throw e;}
  const id='atelier:'+manifest.publicSlug;
  if(!confirmed.has(id))continue;
  if(manifest.requestId!==job.name||confirmed.get(id).fingerprint!==manifest.workshopSourceSha256)
    fail('PUBLISHED_HISTORY_CHANGED');
  const prior=JSON.parse(await privateFile(join(dir,'canonical-inputs.json'),CORAL_BUILD_PACKET_MAX));
  if(prior.intent?.request_id!==job.name||prior.intent?.mp3_sha256!==manifest.audioSha256)
    fail('PUBLISHED_HISTORY_ID');
  const visual=validateCoralPrivateVisual(prior);
  if(visual)await writeFile(join(root,'public',visual.path),visual.bytes,{flag:'wx'});
  const blueprint=projectCoralStudioBlueprint({...prior,recipes});
  await prepareCoralPrivateAstroOverlay({root,blueprint,intent:{
    ...prior.intent,visualSha256:prior.profile.visualSha256},
    audioBytes:await privateFile(join(dir,'canonical-audio.mp3'),32000000),
    importName:'coralStudioPrivate'+ ++count});
  restored.push([id,manifest.workshopSourceSha256]);
 }
 return restored;
}
export async function buildCoralPrivateAstroRelease({root,packetPath,audioPath,out,sourceSha,baseline,history}){
 const checkout=resolve(root),destination=resolve(out);
 if(destination===checkout||destination.startsWith(checkout+sep)||
   checkout.startsWith(destination+sep))fail('OUTSIDE_CHECKOUT_REQUIRED');
 const packetReal=await realpath(resolve(packetPath)),audioReal=await realpath(resolve(audioPath));
 if(packetReal.startsWith(checkout+sep)||audioReal.startsWith(checkout+sep))
   fail('INPUTS_MUST_BE_PRIVATE');
 verifyPrivateBuildCheckout(checkout,sourceSha);
 const packet=JSON.parse((await privateFile(packetReal,CORAL_BUILD_PACKET_MAX)).toString('utf8'));
 if(packet?.contract!=='cdc-coral-studio-private-build-inputs-v1'||
   !packet.source||!packet.profile||!packet.intent)fail('PACKET');
 const bytes=await privateFile(audioReal,32000000);
 const recipes=await loadCanonicalRecipes();
 const visual=validateCoralPrivateVisual(packet);
 if(visual&&!baseline)fail('PRIVATE_VISUAL_BASELINE_REQUIRED');
 if(visual)await writeFile(join(checkout,'public',visual.path),visual.bytes,{flag:'wx'});
 const blueprint=projectCoralStudioBlueprint({
  source:packet.source,intent:packet.intent,profile:packet.profile,recipes});
 if(blueprint.media.finishedPreparationImage!==packet.profile.media.finishedPreparationImage)
   fail('MEDIA_PROFILE');
 if(blueprint.review.productionApproved!==true)fail('HUMAN_APPROVAL');
 if(packet.intent.recipe_slug==='amok-trey')fail('AMOK_V4_RECIPE_REVIEW_REQUIRED');
 const check=validateWorkshopBlueprint({...blueprint,status:'review'},recipes);
 if(check.length)fail('BLUEPRINT');
 const restored=history?await restorePublishedOverlays({root:checkout,history,baseline,recipes}):[];
 // The scratch checkout is now the ONLY mutable tree. Caller destroys it on
 // failure or success; source commit + historical main tree stay unchanged.
 await prepareCoralPrivateAstroOverlay({root:checkout,blueprint,intent:{
   ...packet.intent,visualSha256:packet.profile.visualSha256},audioBytes:bytes});
 run('node',['scripts/check-workshop-blueprints.mjs',
  'src/data/atelier-recette-guides/'+packet.intent.candidate_public_slug+'.json'],checkout);
 run('npm',['run','build'],checkout);
 const dist=join(checkout,'dist');
 await verifyHistoricalAmokV4({root:checkout,dist});
 if(restored.length){
  const index=JSON.parse(await privateFile(join(dist,'editorial-source-index.json'),524288));
  const built=new Map(index.items.map(row=>[row.id,row.fingerprint]));
  if(restored.some(([id,hash])=>built.get(id)!==hash))fail('PUBLISHED_HISTORY_REBUILD');
 }
 const workshopSourceSha256=await verifyCoralBuiltIndexes({dist,intent:packet.intent});
 const baseSha256=baseline?{
  ...await preserveCoralSharedPages({intent:packet.intent,directory:baseline,dist}),
  ...await preserveCoralIndexes({intent:packet.intent,directory:baseline,dist})
 }:null;
 const result=await packageCoralStudioRelease({
  intent:packet.intent,dist,audio:audioReal,
  out:destination,sourceSha,includeIndexes:baseline!==null&&baseline!==undefined,privateVisualSha:visual?.hash??null});
 // These are verified by THIS BUILD ONLY. The live OVH inventory, owner
 // authorization, out-of-webroot backup and crash recovery remain separate.
 result.sourceCommitVerified=true;
 result.nativeBlueprintVerified=true;
 result.mediaRightsVerified=true;
 result.mediaImageSha256=packet.profile.visualSha256;
 result.workshopSourceSha256=workshopSourceSha256;
 result.builderContract='cdc-coral-private-verified-astro-builder-v1';
 if(baseSha256)result.baseSha256=baseSha256;
 await writeFile(join(destination,'BUNDLE-MANIFEST-PRIVE.json'),
  JSON.stringify(result,null,2)+'\n',{flag:'w',mode:0o600});
 return result;
}
async function main(){
 const args=process.argv.slice(2),o={};
 for(let i=0;i<args.length;i+=2){
  if(!['--packet','--audio','--source-sha','--out','--baseline','--history'].includes(args[i])||
     !args[i+1]||Object.hasOwn(o,args[i]))fail('ARGS');
  o[args[i]]=args[i+1];
 }
 if(!['--packet','--audio','--source-sha','--out'].every(key=>Object.hasOwn(o,key)))fail('ARGS');
 await buildCoralPrivateAstroRelease({
  root:process.cwd(),packetPath:o['--packet'],
  audioPath:o['--audio'],out:o['--out'],sourceSha:o['--source-sha'],baseline:o['--baseline'],history:o['--history']});
 process.stdout.write('CORAL_PRIVATE_ASTRO_BUILT_STAGED_ONLY; OVH_UNCHANGED\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 main().catch(()=>{process.stderr.write('CORAL_PRIVATE_ASTRO_BUILD_BLOCKED\n');process.exitCode=1;});
}
