import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,mkdir,writeFile,readFile,rm,stat,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {packageCoralStudioRelease,validateCoralStudioReleaseIntent} from '../scripts/package-coral-approved-release.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const ids=['intro','installer','preparer','assembler','maitriser','rectifier','terminer'];
const audio=Buffer.concat([Buffer.from('ID3'),Buffer.alloc(2045,23)]);
function intent(){
  const mp3=sha(audio);
  return {contract:'cdc-coral-studio-release-intent-v1',
    creation_id:'c-'+'1'.repeat(24),creation_version:4,request_id:'2'.repeat(48),
    binding_sha256:'3'.repeat(64),recipe_sha256:'4'.repeat(64),
    recipe_slug:'amok-trey',candidate_public_slug:'amok-trey',
    candidate_workshop_slug:'atelier-pratique-amok-trey',
    candidate_audio_path:'audio/workshops/atelier-pratique-amok-trey/atelier-coral-'+mp3.slice(0,12)+'.mp3',
    voice:'coral',model:'gpt-4o-mini-tts',speed_milli:930,
    mp3_sha256:mp3,mp3_bytes:audio.length,mp3_duration_seconds:70,
    chapters:ids.map((id,i)=>({id,text_sha256:sha(Buffer.from('fiction '+id)),
      startSec:i*10,endSec:(i+1)*10})),
    human_publication_consent:true,publication_ready:false,deployment_triggered:false
  };
}
async function fixture(){
  const root=await mkdtemp(join(tmpdir(),'coral-scope-fixture-'));
  const dist=join(root,'dist');await mkdir(dist);
  const r=intent();
  const page='apprendre/pratique/amok-trey/index.html';
  const files={
    [page]:'<!doctype html><a href="/recettes/amok-trey/">Recette</a><audio src="/'+r.candidate_audio_path+'"></audio>',
    'recettes/amok-trey/index.html':'<a href="/apprendre/pratique/amok-trey/">Atelier</a>',
    'apprendre/index.html':'<a href="/apprendre/pratique/amok-trey/">Amok</a>',
    'sitemap.xml':'<loc>https://www.cuisine-du-cambodge.com/apprendre/pratique/amok-trey/</loc>'
  };
  for(const [p,body] of Object.entries(files)){
    await mkdir(dirname(join(dist,p)),{recursive:true});await writeFile(join(dist,p),body);
  }
  const audioFile=join(root,'private-audio.mp3');await writeFile(audioFile,audio);
  return {root,dist,audioFile,r,files,out:join(root,'bundle'),sourceSha:'a'.repeat(40)};
}
test('real Studio release consent builds exactly 5 verified static files, never deploys',async()=>{
  const f=await fixture();
  try{
    const m=await packageCoralStudioRelease({
      intent:f.r,dist:f.dist,audio:f.audioFile,out:f.out,sourceSha:f.sourceSha});
    assert.equal(m.files.length,5);
    assert.equal(m.deployable,false);
    assert.equal(m.published,false);
    assert.equal(m.privateBackupVerified,false);
    assert.equal(m.sourceCommitVerified,false,'a CLI argument is not a trusted checkout');
    assert.equal(m.studioAuthorityFreshlyRechecked,false);
    const delivered=await readFile(join(f.out,f.r.candidate_audio_path));
    assert.equal(sha(delivered),f.r.mp3_sha256);
    assert.equal((await stat(join(f.out,'BUNDLE-MANIFEST-PRIVE.json'))).isFile(),true);
    assert.equal((await stat(join(f.dist,'sitemap.xml'))).isFile(),true,'no source mutation');
    await assert.rejects(packageCoralStudioRelease({
      intent:f.r,dist:f.dist,audio:f.audioFile,out:f.out,sourceSha:f.sourceSha}),/EEXIST/);
  }finally{await rm(f.root,{recursive:true,force:true});}
});
test('reject invalid voice, missing approval, edited scripts, path traversal and tampered MP3',async()=>{
  const good=intent();
  for(const change of [
    {...good,voice:'other'},
    {...good,human_publication_consent:false},
    {...good,publication_ready:true},
    {...good,candidate_public_slug:'../overwrite'},
    {...good,chapters:good.chapters.slice(1)},
    {...good,chapters:good.chapters.map((c,i)=>i===4?{...c,text:'secret narration'}:c)},
    {...good,mp3_duration_seconds:11},
  ]) assert.throws(()=>validateCoralStudioReleaseIntent(change),/CORAL_SCOPED_RELEASE/);
  const f=await fixture();
  try{
    await writeFile(f.audioFile,Buffer.alloc(2048,44));
    await assert.rejects(packageCoralStudioRelease({
      intent:f.r,dist:f.dist,audio:f.audioFile,out:f.out,sourceSha:f.sourceSha}),/CORAL_SCOPED_RELEASE_AUDIO_SHA/);
    await assert.rejects(stat(f.out),{code:'ENOENT'},'no partial output on invalid input');
  }finally{await rm(f.root,{recursive:true,force:true});}
});
test('broken public navigation or manipulated built audio block packaging',async()=>{
  const f=await fixture();
  try{
    await writeFile(join(f.dist,'apprendre/index.html'),'<html>no public link</html>');
    await assert.rejects(packageCoralStudioRelease({
      intent:f.r,dist:f.dist,audio:f.audioFile,out:f.out,sourceSha:f.sourceSha}),/CORAL_SCOPED_RELEASE_ASTRO_LINK/);
    await assert.rejects(stat(f.out),{code:'ENOENT'});
    await writeFile(join(f.dist,'apprendre/index.html'),'<a href="/apprendre/pratique/amok-trey/">Atelier</a>');
    const path=join(f.dist,f.r.candidate_audio_path);
    await mkdir(dirname(path),{recursive:true});await writeFile(path,Buffer.alloc(2048,9));
    await assert.rejects(packageCoralStudioRelease({
      intent:f.r,dist:f.dist,audio:f.audioFile,out:f.out,sourceSha:f.sourceSha}),/CORAL_SCOPED_RELEASE_DIST_AUDIO_CHANGED/);
  }finally{await rm(f.root,{recursive:true,force:true});}
});
test('refuse a symbolic link to build HTML',async()=>{
  const f=await fixture();
  try{
    const file=join(f.dist,'apprendre/index.html');
    await rm(file);await symlink(join(f.dist,'sitemap.xml'),file);
    await assert.rejects(packageCoralStudioRelease({
      intent:f.r,dist:f.dist,audio:f.audioFile,out:f.out,sourceSha:f.sourceSha}),/CORAL_SCOPED_RELEASE_(ASTRO_INPUT_LINK|INPUT_FILE)/);
  }finally{await rm(f.root,{recursive:true,force:true});}
});
