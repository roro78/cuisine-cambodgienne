#!/usr/bin/env node
/**
 * Private Studio Coral publication-intent -> scoped, inspectable Astro bundle.
 *
 * This is a PACKAGER, not a publisher. It cannot perform a live OVH backup,
 * read an authenticated server tree, approve artwork or mutate GitHub.
 * A Studio intent is untrusted input: the current Studio authority MUST be
 * rechecked by a separate authenticated publisher immediately before commit.
 *
 * Usage:
 * node scripts/package-coral-approved-release.mjs \
 *   --intent /private/release-intent.json --dist /safe/astro/dist \
 *   --audio /private/verified-final.mp3 --out /private/release-bundle \
 *   --source-sha 0123456789012345678901234567890123456789
 *
 * No HTTP, OpenAI, GitHub or OVH calls. No input files are modified.
 */
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir,lstat,realpath} from 'node:fs/promises';
import {resolve,join,dirname,sep} from 'node:path';
import {pathToFileURL} from 'node:url';

const IDS=Object.freeze(['intro','installer','preparer','assembler','maitriser','rectifier','terminer']);
const SHA=/^[a-f0-9]{64}$/;
const SHA40=/^[a-f0-9]{40}$/;
const SLUG=/^[a-z0-9][a-z0-9-]{2,99}$/;
const RID=/^[a-f0-9]{48}$/;
const CREATION=/^c-[a-f0-9]{24}$/;
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const fail=code=>{throw Error('CORAL_SCOPED_RELEASE_'+code);};
function isObject(value){return value!==null&&typeof value==='object'&&!Array.isArray(value);}
function checkPath(root,path){
  if(!path||path.startsWith('/')||path.includes('\\')||
    path.split('/').some(part=>!part||part==='.'||part==='..'||part.startsWith('.')))
    fail('PATH');
  const absolute=resolve(root,path);
  if(!absolute.startsWith(resolve(root)+sep))fail('OUTSIDE');
  return absolute;
}
async function bytesAt(path,max){
  const s=await lstat(path);
  if(!s.isFile()||s.isSymbolicLink()||s.size<1||s.size>max)fail('INPUT_FILE');
  const bytes=await readFile(path);
  if(bytes.length!==s.size)fail('INPUT_CHANGED');
  return bytes;
}
export function validateCoralStudioReleaseIntent(value){
  if(!isObject(value)||value.contract!=='cdc-coral-studio-release-intent-v1'||
    !CREATION.test(value.creation_id??'')||
    !Number.isInteger(value.creation_version)||value.creation_version<1||value.creation_version>9999||
    !RID.test(value.request_id??'')||
    !SHA.test(value.binding_sha256??'')||!SHA.test(value.recipe_sha256??'')||
    !SLUG.test(value.recipe_slug??'')||!SLUG.test(value.candidate_public_slug??'')||
    value.candidate_workshop_slug!=='atelier-pratique-'+value.candidate_public_slug||
    value.candidate_audio_path!=='audio/workshops/'+value.candidate_workshop_slug+
      '/atelier-coral-'+String(value.mp3_sha256??'').slice(0,12)+'.mp3'||
    !SHA.test(value.mp3_sha256??'')||
    value.voice!=='coral'||value.model!=='gpt-4o-mini-tts'||value.speed_milli!==930||
    !Number.isInteger(value.mp3_bytes)||value.mp3_bytes<1024||value.mp3_bytes>32000000||
    !Number.isFinite(value.mp3_duration_seconds)||value.mp3_duration_seconds<=0||
    value.mp3_duration_seconds>14400||
    value.human_publication_consent!==true||
    value.publication_ready!==false||value.deployment_triggered!==false||
    !Array.isArray(value.chapters)||value.chapters.length!==7)
    fail('INTENT');
  let end=0;
  for(let i=0;i<7;i++){
    const chapter=value.chapters[i];
    if(!isObject(chapter)||chapter.id!==IDS[i]||!SHA.test(chapter.text_sha256??'')||
      Object.hasOwn(chapter,'text')||
      !Number.isFinite(chapter.startSec)||!Number.isFinite(chapter.endSec)||
      Math.abs(chapter.startSec-end)>0.02||chapter.endSec<=chapter.startSec)
      fail('CHAPTER');
    end=chapter.endSec;
  }
  if(Math.abs(end-value.mp3_duration_seconds)>0.2)fail('DURATION');
  return value;
}
export async function packageCoralStudioRelease({intent,dist,audio,out,sourceSha}){
  const r=validateCoralStudioReleaseIntent(intent);
  if(!SHA40.test(sourceSha??''))fail('SOURCE_COMMIT');
  const src=resolve(dist),target=resolve(out),audioPath=resolve(audio);
  if(src===target||target.startsWith(src+sep)||src.startsWith(target+sep)||
    audioPath===target||audioPath.startsWith(target+sep))fail('FOLDER_CONFLICT');
  const statDist=await lstat(src);
  if(!statDist.isDirectory()||statDist.isSymbolicLink())fail('ASTRO_BUILD');
  const page='apprendre/pratique/'+r.candidate_public_slug+'/index.html';
  const recipe='recettes/'+r.recipe_slug+'/index.html';
  const index='apprendre/index.html';
  const sitemap='sitemap.xml';
  const files=[r.candidate_audio_path,page,recipe,index,sitemap];
  if(new Set(files).size!==5)fail('TARGET_COLLISION');
  // Don't let a text-only "intent" authorize modifications to CMS/PHP, the
  // social index or any previous workshop media.
  for(const path of files){
    if(!/^(?:audio\/workshops\/[a-z0-9-]+\/atelier-coral-[a-f0-9]{12}\.mp3|apprendre\/pratique\/[a-z0-9-]+\/index\.html|recettes\/[a-z0-9-]+\/index\.html|apprendre\/index\.html|sitemap\.xml)$/.test(path))
      fail('SCOPE');
  }
  // Refuse symlinked parents or a private audio outside its expected tree.
  const realDist=await realpath(src);
  if(realDist!==src)fail('ASTRO_SYMLINK_PARENT');
  const audioBytes=await bytesAt(audioPath,32000000);
  if(audioBytes.length!==r.mp3_bytes||sha(audioBytes)!==r.mp3_sha256)fail('AUDIO_SHA');
  const payload=new Map([[r.candidate_audio_path,audioBytes]]);
  for(const name of [page,recipe,index,sitemap]){
    const input=checkPath(src,name);
    const realInput=await realpath(input);
    if(!realInput.startsWith(realDist+sep))fail('ASTRO_INPUT_LINK');
    payload.set(name,await bytesAt(input,400000));
  }
  // The blueprint and the public pages must ALREADY be compiled in Astro.
  // No string insertion into existing production HTML is allowed here.
  const url='/apprendre/pratique/'+r.candidate_public_slug+'/';
  const audioUrl='/'+r.candidate_audio_path;
  const pageText=payload.get(page).toString('utf8');
  if(!pageText.includes(audioUrl)||!pageText.includes('/recettes/'+r.recipe_slug+'/'))fail('ASTRO_PAGE');
  for(const name of [recipe,index]){
    if(!payload.get(name).toString('utf8').includes(url))fail('ASTRO_LINK_'+name);
  }
  if(!payload.get(sitemap).toString('utf8').includes(url))fail('SITEMAP');
  // If Astro already has an audio at the target path, require identical bytes.
  try{
    const dest=checkPath(src,r.candidate_audio_path);
    if(!(await realpath(dest)).startsWith(realDist+sep))fail('DIST_AUDIO_LINK');
    const built=await bytesAt(dest,32000000);
    if(sha(built)!==r.mp3_sha256)fail('DIST_AUDIO_CHANGED');
  }catch(error){if(error?.code!=='ENOENT')throw error;}
  // Check EVERY input before attempting any output write.
  const entries=files.map(path=>({path,bytes:payload.get(path).length,
    sha256:sha(payload.get(path)),action:'add-or-scoped-replace'}));
  if(entries[0].sha256!==r.mp3_sha256)fail('AUDIO_CHANGED');
  // Never remove or reuse an output directory: an old bundle is immutable.
  await mkdir(target,{recursive:false,mode:0o700});
  for(const entry of entries){
    const path=checkPath(target,entry.path);
    await mkdir(dirname(path),{recursive:true,mode:0o700});
    await writeFile(path,payload.get(entry.path),{flag:'wx',mode:0o600});
    if(sha(await bytesAt(path,32000000))!==entry.sha256)fail('BUNDLE_SHA');
  }
  const manifest={contract:'cdc-coral-scoped-astro-bundle-v1',
    sourceCommit:sourceSha,sourceCommitVerified:false,
    creationId:r.creation_id,creationVersion:r.creation_version,
    requestId:r.request_id,bindingSha256:r.binding_sha256,
    audioSha256:r.mp3_sha256,files:entries,
    // Trust boundary: current private authorizations and live OVH state must
    // be verified again by a separate, authenticated deployment executor.
    deployable:false,published:false,studioAuthorityFreshlyRechecked:false,
    privateBackupVerified:false,rollbackRehearsed:false,
    liveTargetHashesVerified:false,sharedAssetsVerified:false,
    requires:['fresh_authenticated_studio_authority','pinned_git_checkout','native_blueprint_review',
      'media_rights','live_inventory_and_sha_preconditions',
      'off_webroot_backup_and_restore_test','scoped_ovh_publish_and_receipt']};
  await writeFile(join(target,'BUNDLE-MANIFEST-PRIVE.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx',mode:0o600});
  return manifest;
}
async function main(){
  const argv=process.argv.slice(2),opt={};
  for(let i=0;i<argv.length;i+=2){
    const k=argv[i];
    if(!['--intent','--dist','--audio','--out','--source-sha'].includes(k)||!argv[i+1]||
      Object.hasOwn(opt,k))fail('ARGS');
    opt[k]=argv[i+1];
  }
  if(Object.keys(opt).length!==5)fail('ARGS');
  const intentBytes=await bytesAt(resolve(opt['--intent']),64000);
  const intent=JSON.parse(intentBytes.toString('utf8'));
  const output=await packageCoralStudioRelease({
    intent,dist:opt['--dist'],audio:opt['--audio'],
    out:opt['--out'],sourceSha:opt['--source-sha']
  });
  process.stdout.write('CORAL_SCOPED_BUNDLE_PREPARED_ONLY '+output.files.length+' files; OVH_UNCHANGED\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  main().catch(e=>{process.stderr.write(String(e.message||'SCOPED_BUNDLE_FAILED')+'\n');process.exitCode=1;});
}
