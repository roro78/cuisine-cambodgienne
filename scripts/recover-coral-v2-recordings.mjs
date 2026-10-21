#!/usr/bin/env node
/**
 * Recover a completed Coral V2 MP3 from a GitHub Actions artifact.
 * Offline, SHA-verified and protected against overwriting previously approved recordings.
 * Usage: node scripts/recover-coral-v2-recordings.mjs --source=.coral-recovery
 */
import {existsSync,readFileSync,writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
import {join,dirname,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const source=process.argv.find(x=>x.startsWith('--source='))?.slice(9);
if(!source||process.argv.length!==3)throw Error('Use --source=path; no TTS mode exists.');
const names=['kroeung-jaune','bai-sach-chrouk','samlor-machu','kuy-teav','num-banh-chok'];
const ids=['intro','installer','preparer','assembler','maitriser','rectifier','terminer'];
let recovered=0;
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
for(const slug of names){
  const artifactManifest=join(source,'src/data/atelier-recette-audio',slug+'-v2.json');
  if(!existsSync(artifactManifest)){console.log('CORAL_RECOVERY_NOT_READY '+slug);continue;}
  const manifest=JSON.parse(readFileSync(artifactManifest,'utf8'));
  const guideFile=resolve('src/data/atelier-recette-guides',slug+'.json');
  const guide=JSON.parse(readFileSync(guideFile,'utf8'));
  if(guide.audio.storyboardVersion!==2||guide.status!=='draft')throw Error('Not eligible V2 draft '+slug);
  if(guide.sourceRecipeSlug!==slug||manifest.atelier!==guide.slug||manifest.canonicalRecipe!==slug||manifest.voice!=='coral')throw Error('Identity mismatch '+slug);
  if(!manifest.audioUrl.startsWith('/audio/workshops/'+guide.slug+'/')||!manifest.audioUrl.endsWith('/atelier-coral-v2.mp3'))
    throw Error('Unexpected MP3 path '+slug);
  if(manifest.review?.acousticListening!==false)throw Error('Human review cannot be imported as approved '+slug);
  if(!Array.isArray(manifest.chapters)||manifest.chapters.length!==7||manifest.chapters.some((ch,i)=>ch.id!==ids[i]||ch.endSec<=ch.startSec))throw Error('Seven measured chapters required '+slug);
  if(Math.abs(manifest.chapters[0].startSec)>0.03||Math.abs(manifest.chapters.at(-1).endSec-manifest.durationSec)>0.2)throw Error('Duration mismatch '+slug);
  const expectedScriptHash=createHash('sha256').update(JSON.stringify([guide.audio.intro,...guide.phases.map(p=>p.audioScript)])).digest('hex');
  if(manifest.scriptSha256!==expectedScriptHash)throw Error('Source narration changed, do not import obsolete audio '+slug);
  const relMp3='public'+manifest.audioUrl;
  const inputMp3=join(source,relMp3);
  if(!existsSync(inputMp3)||sha(inputMp3)!==manifest.sha256)throw Error('SHA mismatch on saved MP3 '+slug);
  const actual=Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',inputMp3],{encoding:'utf8'}).trim());
  if(!Number.isFinite(actual)||Math.abs(actual-manifest.durationSec)>0.2)throw Error('Invalid ffprobe duration '+slug);
  const targetManifest='src/data/atelier-recette-audio/'+slug+'-v2.json';
  if(existsSync(relMp3)&&sha(relMp3)!==manifest.sha256)throw Error('Different V2 MP3 exists; cannot overwrite '+slug);
  if(existsSync(targetManifest)&&JSON.parse(readFileSync(targetManifest,'utf8')).sha256!==manifest.sha256)throw Error('Different manifest exists; cannot overwrite '+slug);
  mkdirSync(dirname(relMp3),{recursive:true});
  if(!existsSync(relMp3))copyFileSync(inputMp3,relMp3);
  if(!existsSync(targetManifest))copyFileSync(artifactManifest,targetManifest);
  guide.audio.asset={
    audioUrl:manifest.audioUrl,durationSec:manifest.durationSec,sha256:manifest.sha256,
    chapters:manifest.chapters,scriptSha256:manifest.scriptSha256
  };
  guide.audio.status='generated_review_pending';
  guide.review.audioListeningValidated=false;
  guide.review.productionApproved=false;
  writeFileSync(guideFile,JSON.stringify(guide,null,2)+'\n');
  console.log('CORAL_RECOVERED '+slug+' '+actual.toFixed(3)+' sec '+manifest.sha256);
  recovered++;
}
console.log('CORAL_RECOVERY_SUMMARY '+recovered+' restored, 0 new synthesis requests');
