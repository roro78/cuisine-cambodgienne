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
import {readFile,writeFile,stat,lstat,realpath,mkdir} from 'node:fs/promises';
import {resolve,join,dirname,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {projectCoralStudioBlueprint} from './project-coral-studio-blueprint.mjs';
import {loadCanonicalRecipes,validateWorkshopBlueprint} from './check-workshop-blueprints.mjs';
import {packageCoralStudioRelease} from './package-coral-approved-release.mjs';

const sha=x=>createHash('sha256').update(x).digest('hex');
const safeName=/^[a-z0-9][a-z0-9-]{2,99}$/;
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
 if(run('git',['status','--porcelain','--untracked-files=all'],root)!=='')
  fail('CHECKOUT_NOT_CLEAN');
 return sourceSha;
}
/**
 * Only touches the isolated checkout, with JSON imports like the six originals.
 * The published site and the existing six blueprints/MP3 are never modified.
 */
export async function prepareCoralPrivateAstroOverlay({root,blueprint,intent,audioBytes}){
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
 if(!line||text.includes("import coralStudioPrivate from "))fail('REGISTRY');
 const edit="import coralStudioPrivate from './atelier-recette-guides/"+slug+".json';\n"+
  text.replace(line[0],"export const cookingWorkshopGuides=["+line[1]+",coralStudioPrivate];");
 // Missing files are mandatory: collision with a previously published guide
 // or an older audio version must never overwrite anything.
 for(const path of [guidePath,audioManifestPath,audioPath]){
  try{await lstat(path);fail('TARGET_EXISTS');}
  catch(e){if(e.code!=='ENOENT')throw e;}
 }
 await mkdir(dirname(audioPath),{recursive:true,mode:0o700});
 await writeFile(guidePath,JSON.stringify(blueprint,null,2)+'\n',{flag:'wx',mode:0o600});
 const manifest={atelier:slug,canonicalRecipe:intent.recipe_slug,
  status:'audio_validated',voice:'coral',
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
export async function buildCoralPrivateAstroRelease({root,packetPath,audioPath,out,sourceSha}){
 const checkout=resolve(root),destination=resolve(out);
 if(destination===checkout||destination.startsWith(checkout+sep)||
   checkout.startsWith(destination+sep))fail('OUTSIDE_CHECKOUT_REQUIRED');
 const packetReal=await realpath(resolve(packetPath)),audioReal=await realpath(resolve(audioPath));
 if(packetReal.startsWith(checkout+sep)||audioReal.startsWith(checkout+sep))
   fail('INPUTS_MUST_BE_PRIVATE');
 verifyPrivateBuildCheckout(checkout,sourceSha);
 const packet=JSON.parse((await privateFile(packetReal,85000)).toString('utf8'));
 if(packet?.contract!=='cdc-coral-studio-private-build-inputs-v1'||
   !packet.source||!packet.profile||!packet.intent)fail('PACKET');
 const bytes=await privateFile(audioReal,32000000);
 const recipes=await loadCanonicalRecipes();
 const blueprint=projectCoralStudioBlueprint({
  source:packet.source,intent:packet.intent,profile:packet.profile,recipes});
 if(blueprint.media.finishedPreparationImage!==packet.profile.media.finishedPreparationImage)
   fail('MEDIA_PROFILE');
 if(blueprint.review.productionApproved!==true)fail('HUMAN_APPROVAL');
 const check=validateWorkshopBlueprint({...blueprint,status:'review'},recipes);
 if(check.length)fail('BLUEPRINT');
 // The scratch checkout is now the ONLY mutable tree. Caller destroys it on
 // failure or success; source commit + historical main tree stay unchanged.
 await prepareCoralPrivateAstroOverlay({root:checkout,blueprint,intent:{
   ...packet.intent,visualSha256:packet.profile.visualSha256},audioBytes:bytes});
 run('node',['scripts/check-workshop-blueprints.mjs',
  'src/data/atelier-recette-guides/'+packet.intent.candidate_public_slug+'.json'],checkout);
 run('npm',['run','build'],checkout);
 const result=await packageCoralStudioRelease({
  intent:packet.intent,dist:join(checkout,'dist'),audio:audioReal,
  out:destination,sourceSha});
 // These are verified by THIS BUILD ONLY. The live OVH inventory, owner
 // authorization, out-of-webroot backup and crash recovery remain separate.
 result.sourceCommitVerified=true;
 result.nativeBlueprintVerified=true;
 result.mediaRightsVerified=true;
 result.mediaImageSha256=packet.profile.visualSha256;
 result.builderContract='cdc-coral-private-verified-astro-builder-v1';
 await writeFile(join(destination,'BUNDLE-MANIFEST-PRIVE.json'),
  JSON.stringify(result,null,2)+'\n',{flag:'w',mode:0o600});
 return result;
}
async function main(){
 const args=process.argv.slice(2),o={};
 for(let i=0;i<args.length;i+=2){
  if(!['--packet','--audio','--source-sha','--out'].includes(args[i])||
     !args[i+1]||Object.hasOwn(o,args[i]))fail('ARGS');
  o[args[i]]=args[i+1];
 }
 if(Object.keys(o).length!==4)fail('ARGS');
 await buildCoralPrivateAstroRelease({
  root:process.cwd(),packetPath:o['--packet'],
  audioPath:o['--audio'],out:o['--out'],sourceSha:o['--source-sha']});
 process.stdout.write('CORAL_PRIVATE_ASTRO_BUILT_STAGED_ONLY; OVH_UNCHANGED\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 main().catch(()=>{process.stderr.write('CORAL_PRIVATE_ASTRO_BUILD_BLOCKED\n');process.exitCode=1;});
}
