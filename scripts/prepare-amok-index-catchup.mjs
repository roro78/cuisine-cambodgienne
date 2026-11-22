#!/usr/bin/env node
/**
 * Read-only production catch-up candidate for ALREADY-published Amok V4.
 * Merge only its missing three public-index entries and existing social JPEG.
 * The live site is NEVER written; no Studio, audio, private journal or n8n call.
 *
 * After a clean Astro build:
 * node scripts/prepare-amok-index-catchup.mjs --dist dist --out /private/candidate
 *
 * The resulting four files are NOT authorized for upload. An operator must
 * reconcile private Studio approvals, source fingerprints and backup/rollback
 * on OVH before any separately approved transfer.
 */
import {createHash} from 'node:crypto';
import {readFile,lstat,realpath,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,dirname,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {verifyCmsIndexes} from './check-cms-ovh-readiness.mjs';

const ORIGIN='https://www.cuisine-du-cambodge.com/';
const NAMES=['social-feed.json','editorial-source-index.json','editorial-guided-fields.json'];
const AMOK_ID='atelier:atelier-pratique-amok-trey';
const JPEG='social-assets/atelier-atelier-pratique-amok-trey.jpg';
const MAX_JSON=524288;
const sha=b=>createHash('sha256').update(b).digest('hex');
const fail=reason=>{throw Error('AMOK_CATCHUP_'+reason);};

async function localFile(root,path,max) {
 const target=resolve(root,path),base=await realpath(root);
 if(!target.startsWith(base+sep))fail('PATH');
 const info=await lstat(target);
 if(!info.isFile()||info.isSymbolicLink()||info.size<1||info.size>max||
    await realpath(target)!==target)fail('LOCAL_FILE');
 return readFile(target);
}
async function liveFile(name,fetcher) {
 // Fixed origin and exact filename; never pass credentials or follow redirects.
 const response=await fetcher(new URL(name,ORIGIN),{
  method:'GET',redirect:'error',cache:'no-store',
  headers:{Accept:'application/json','Cache-Control':'no-cache'},
  signal:AbortSignal.timeout(12000)});
 if(response.status!==200||!response.body||
   !(response.headers.get('content-type')||'').toLowerCase().includes('json'))
   fail('REMOTE_INDEX');
 const chunks=[];let length=0;
 for await(const part of response.body){
  length+=part.length;
  if(length>MAX_JSON)fail('REMOTE_SIZE');
  chunks.push(Buffer.from(part));
 }
 if(!length)fail('EMPTY_INDEX');
 return Buffer.concat(chunks);
}
function parse(data) {
 try{return JSON.parse(data.toString('utf8'));}
 catch{fail('INVALID_JSON');}
}
function rowById(index) {
 const map=new Map(index.items.map(r=>[r.id,r]));
 if(map.size!==index.items.length)fail('DUPLICATE');
 return map;
}

/** Stages a four-file *candidate*, with a private manifest, never a release. */
export async function prepareAmokIndexCatchup({dist,out,fetcher=fetch}) {
 const root=resolve(dist),target=resolve(out);
 if(root===target||target.startsWith(root+sep)||root.startsWith(target+sep))
   fail('OUTPUT_LOCATION');
 const liveBytes=await Promise.all(NAMES.map(name=>liveFile(name,fetcher)));
 const builtBytes=await Promise.all(NAMES.map(name=>localFile(root,name,MAX_JSON)));
 const live=Object.fromEntries(NAMES.map((name,i)=>[name,parse(liveBytes[i])]));
 const built=Object.fromEntries(NAMES.map((name,i)=>[name,parse(builtBytes[i])]));
 // The same parser used for CI and the Studio must accept BOTH sets.
 const before=verifyCmsIndexes(live),after=verifyCmsIndexes(built);
 if(after.social!==before.social+1||after.canonical!==before.canonical+1||
    after.guided!==before.guided+1)fail('NOT_SINGLE_CATCHUP');
 const candidates={};const provenance={};const sourceDrift=new Set();
 for(let i=0;i<NAMES.length;i++){
  const name=NAMES[i],previous=live[name],candidate=built[name];
  const old=rowById(previous),next=rowById(candidate);
  if(old.has(AMOK_ID)||!next.has(AMOK_ID)||next.size!==old.size+1)
    fail('AMOK_STATE');
  for(const [id,entry] of old){
   const buildEntry=next.get(id);
   if(!buildEntry)fail('MISSING_HISTORY');
   if(i===0&&entry.kind!==buildEntry.kind)fail('HISTORY_TYPE');
   if(i>0&&entry.model!==buildEntry.model)fail('HISTORY_TYPE');
   if(entry.fingerprint!==buildEntry.fingerprint)sourceDrift.add(id);
  }
  const entry=next.get(AMOK_ID);
  if(i===0){
   if(entry.kind!=='atelier'||
     entry.url!==ORIGIN+'apprendre/pratique/amok-trey/'||
     entry.imageUrl!==ORIGIN+JPEG||
     typeof entry.originalImageUrl!=='string'||
     !entry.originalImageUrl.startsWith(ORIGIN+'images/'))
      fail('AMOK_SOCIAL_IDENTITY');
  }else if(entry.model!=='cookingWorkshopGuides')fail('AMOK_MODEL');
  if(i===2&&entry.fingerprint!==rowById(built[NAMES[1]]).get(AMOK_ID)?.fingerprint)
    fail('AMOK_GUIDED_SHA');
  // Retain every current public row without rewriting its field-level data,
  // including the optional Amok recipe portionContract from the live Studio.
  const merged={...previous,items:[...previous.items,entry]};
  const bytes=Buffer.from(JSON.stringify(merged));
  if(bytes.length>MAX_JSON)fail('OUTPUT_SIZE');
  candidates[name]=merged;
  provenance[name]={beforeSha256:sha(liveBytes[i]),candidateSha256:sha(bytes),
    beforeCount:previous.items.length,candidateCount:merged.items.length};
 }
 const counts=verifyCmsIndexes(candidates);
 const jpeg=await localFile(root,JPEG,8000000);
 if(jpeg.length<1024||jpeg[0]!==0xff||jpeg[1]!==0xd8||
   jpeg[2]!==0xff||jpeg.at(-2)!==0xff||jpeg.at(-1)!==0xd9)
   fail('JPEG_INTEGRITY');
 // One-time candidate never qualifies permissions or live restore on its own.
 const manifest={
  contract:'cdc-amok-v4-additive-index-catchup-candidate-v1',
  alreadyPublishedIdentity:AMOK_ID,recordsBefore:before,recordsCandidate:counts,
  files:[...NAMES.map(name=>({path:name,...provenance[name]})),
    {path:JPEG,bytes:jpeg.length,candidateSha256:sha(jpeg)}],
  existingSourceFingerprintDifferences:[...sourceDrift].sort(),
  preservesExistingRows:true,preconditionsMustMatchLiveHashes:true,
  privateStudioApprovalsChecked:false,privateBackupVerified:false,
  rollbackQualifiedOnLive:false,deployable:false,published:false
 };
 await mkdir(target,{mode:0o700});
 for(const name of NAMES)await writeFile(join(target,name),
   JSON.stringify(candidates[name]),{flag:'wx',mode:0o600});
 const jpegPath=join(target,JPEG);
 await mkdir(dirname(jpegPath),{recursive:true,mode:0o700});
 await writeFile(jpegPath,jpeg,{flag:'wx',mode:0o600});
 await writeFile(join(target,'CANDIDATE-MANIFEST-PRIVATE.json'),
   JSON.stringify(manifest,null,2)+'\n',{flag:'wx',mode:0o600});
 return manifest;
}
async function main(){
 const a=process.argv.slice(2);
 if(a.length!==4||a[0]!=='--dist'||a[2]!=='--out'||!a[1]||!a[3])
   fail('ARGS');
 const m=await prepareAmokIndexCatchup({dist:a[1],out:a[3]});
 process.stdout.write('AMOK_CATCHUP_CANDIDATE_ONLY '+JSON.stringify({
  records:m.recordsCandidate,files:m.files.length,deployable:false,
  privateReviewRequired:true})+'\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)
 main().catch(e=>{process.stderr.write(e.message.startsWith('AMOK_CATCHUP_')
   ?e.message+'\n':'AMOK_CATCHUP_BLOCKED\n');process.exitCode=1;});
