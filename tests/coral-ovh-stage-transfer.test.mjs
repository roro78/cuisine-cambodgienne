import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,mkdir,writeFile,rm,readFile,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {transferCoralBundle} from '../scripts/transfer-coral-bundle-to-ovh.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
async function fixture(){
 const root=await mkdtemp(join(tmpdir(),'coral-transfer-'));
 const mp3=Buffer.concat([Buffer.from('ID3'),Buffer.alloc(510000,76)]);
 const mp3sha=sha(mp3),slug='safe-course',recipe='amok-trey';
 const paths=['audio/workshops/atelier-pratique-'+slug+'/atelier-coral-'+mp3sha.slice(0,12)+'.mp3',
  'apprendre/pratique/'+slug+'/index.html',
  'recettes/'+recipe+'/index.html','apprendre/index.html','sitemap.xml'];
 const data=[mp3,Buffer.from('audio + recipe'),Buffer.from('recipe to course'),
  Buffer.from('index to course'),Buffer.from('course sitemap')];
 const files=paths.map((path,i)=>({path,bytes:data[i].length,
  sha256:sha(data[i]),action:'add-or-scoped-replace'}));
 for(let i=0;i<paths.length;i++){
  const name=join(root,paths[i]);
  await mkdir(dirname(name),{recursive:true});await writeFile(name,data[i]);
 }
 const manifest={contract:'cdc-coral-scoped-astro-bundle-v1',
  builderContract:'cdc-coral-private-verified-astro-builder-v1',
  sourceCommit:'a'.repeat(40),sourceCommitVerified:true,nativeBlueprintVerified:true,
  mediaRightsVerified:true,mediaImageSha256:'e'.repeat(64),
  requestId:'b'.repeat(48),publicSlug:slug,recipeSlug:recipe,audioSha256:mp3sha,
  baseSha256:Object.fromEntries(paths.slice(2).map(path=>[path,'1'.repeat(64)])),
  deployable:false,published:false,files};
 await writeFile(join(root,'BUNDLE-MANIFEST-PRIVE.json'),JSON.stringify(manifest));
 return {root,manifest,paths,data};
}
test('stages only exact five verified outputs and supports sealed replay without network secrets',async()=>{
 const f=await fixture();const accepted=new Map();let calls=0,sealed=false;
 const send=async payload=>{
  calls++;
  assert.equal(payload.contract,'cdc-coral-ovh-staging-v1');
  assert.equal(payload.requestId,f.manifest.requestId);
  if(payload.op==='begin'){
   assert.deepEqual(payload.manifest,f.manifest);
   return {requestId:payload.requestId,stage:sealed?'sealed':'receiving'};
  }
  if(payload.op==='append'){
   assert.ok(f.paths.includes(payload.path));
   const chunk=Buffer.from(payload.payloadB64,'base64');
   assert.ok(chunk.length<=245760);
   assert.equal(sha(chunk),payload.chunkSha256);
   const prior=accepted.get(payload.path)||Buffer.alloc(0);
   assert.equal(payload.offset,prior.length);
   accepted.set(payload.path,Buffer.concat([prior,chunk]));
   return {requestId:payload.requestId,stage:'receiving',
     path:payload.path,offset:prior.length+chunk.length};
  }
  if(payload.op==='seal'){
   for(let i=0;i<f.paths.length;i++)
    assert.deepEqual(accepted.get(f.paths[i]),f.data[i]);
   sealed=true;return {requestId:payload.requestId,stage:'sealed'};
  }
  throw Error('UNEXPECTED_OPERATION');
 };
 try{
  const status=await transferCoralBundle({bundle:f.root,send});
  assert.equal(status.stage,'sealed');assert.equal(status.replayed,false);
  const before=calls;
  const repeated=await transferCoralBundle({bundle:f.root,send});
  assert.equal(repeated.replayed,true);assert.equal(calls,before+1);
 }finally{await rm(f.root,{recursive:true,force:true});}
});
test('rejects stale media and symlinks before submitting any network request',async()=>{
 const f=await fixture();let sent=false;const send=async()=>{sent=true;throw Error('SHOULD_NOT_SEND');};
 try{
  await writeFile(join(f.root,f.paths[1]),'tampered');
  await assert.rejects(transferCoralBundle({bundle:f.root,send}),/CORAL_OVH_STAGE_BUNDLE_SHA/);
  assert.equal(sent,false);
  await writeFile(join(f.root,f.paths[1]),f.data[1]);
  await rm(join(f.root,f.paths[4]));
  await symlink(join(f.root,f.paths[3]),join(f.root,f.paths[4]));
  await assert.rejects(transferCoralBundle({bundle:f.root,send}),/CORAL_OVH_STAGE_SYMLINK/);
  assert.equal(sent,false);
 }finally{await rm(f.root,{recursive:true,force:true});}
});
