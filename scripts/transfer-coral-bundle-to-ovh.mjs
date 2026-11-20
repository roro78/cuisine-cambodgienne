#!/usr/bin/env node
/**
 * Push five already-built PUBLIC artifacts (never the private Studio source)
 * through the authenticated existing Studio HTTPS endpoint.
 *
 * NO production publication. All requests stage to a private OVH directory.
 * Builder must run separately in a pinned and disposable private checkout.
 *
 * node scripts/transfer-coral-bundle-to-ovh.mjs
 *   --bundle /private/coral-bundle
 *   --token-file /private/ovh-coral-stage-secret
 */
import {createHash} from 'node:crypto';
import {readFile,lstat,realpath} from 'node:fs/promises';
import {resolve,sep,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {readPrivateRuntimeSecret} from './private-runtime-secret.mjs';
const ENDPOINT='https://www.cuisine-du-cambodge.com/gestion-contenus/?coral_stage=1';
const HASH=/^[a-f0-9]{64}$/;
const sha=data=>createHash('sha256').update(data).digest('hex');
const fail=msg=>{throw Error('CORAL_OVH_STAGE_'+msg);};
const envelope={contract:'cdc-coral-ovh-staging-v1'};
async function file(path,max){
 const info=await lstat(path);
 if(!info.isFile()||info.isSymbolicLink()||info.size<1||info.size>max)
   fail('FILE');
 const data=await readFile(path);
 if(data.length!==info.size)fail('FILE_CHANGED');
 return data;
}
export async function transferCoralBundle({bundle,send}){
 if(typeof send!=='function')fail('TRANSPORT');
 const root=resolve(bundle),canonical=await realpath(root);
 if(root!==canonical||!(await lstat(root)).isDirectory())fail('BUNDLE_DIRECTORY');
 const raw=await file(join(root,'BUNDLE-MANIFEST-PRIVE.json'),64000);
 const m=JSON.parse(raw.toString('utf8'));
 if(m?.contract!=='cdc-coral-scoped-astro-bundle-v1'
   ||m?.builderContract!=='cdc-coral-private-verified-astro-builder-v1'
   ||m.sourceCommitVerified!==true||m.nativeBlueprintVerified!==true
   ||m.mediaRightsVerified!==true||m.deployable!==false||m.published!==false
   ||!/^[a-f0-9]{40}$/.test(m.sourceCommit??'')
   ||!/^[a-f0-9]{48}$/.test(m.requestId??'')
   ||!HASH.test(m.mediaImageSha256??'')
   ||!Array.isArray(m.files)||m.files.length!==5)fail('MANIFEST');
 const slug=m.publicSlug,recipe=m.recipeSlug,audio=m.audioSha256;
 if(!/^[a-z0-9][a-z0-9-]{2,99}$/.test(slug??'')
   ||!/^[a-z0-9][a-z0-9-]{2,99}$/.test(recipe??'')
   ||!HASH.test(audio??''))fail('IDENTITY');
 const paths=['audio/workshops/atelier-pratique-'+slug+'/atelier-coral-'+audio.slice(0,12)+'.mp3',
   'apprendre/pratique/'+slug+'/index.html',
   'recettes/'+recipe+'/index.html','apprendre/index.html','sitemap.xml'];
 if(Object.keys(m.baseSha256??{}).join('\n')!==paths.slice(2).join('\n')||
   Object.values(m.baseSha256).some(value=>!HASH.test(value)))
   fail('BASELINE');
 if(m.files.some((e,i)=>e?.path!==paths[i]||!HASH.test(e.sha256??'')
   ||!Number.isInteger(e.bytes)||e.bytes<1||e.bytes>32000000||
   e.action!=='add-or-scoped-replace')||m.files[0].sha256!==audio)
   fail('FILE_SET');
 const payloads=[];
 for(const entry of m.files){
   const target=resolve(root,entry.path),actual=await realpath(target);
   if(!actual.startsWith(canonical+sep)||actual!==target)fail('SYMLINK');
   const bytes=await file(actual,32000000);
   if(bytes.length!==entry.bytes||sha(bytes)!==entry.sha256)
     fail('BUNDLE_SHA');
   payloads.push(bytes);
 }
 const req={...envelope,requestId:m.requestId};
 // Nothing is sent until every file has been verified locally.
 let r=await send({...req,op:'begin',manifest:m});
 if(r?.requestId!==m.requestId||!['receiving','sealed'].includes(r.stage))
   fail('BEGIN_ACK');
 if(r.stage==='sealed')return {requestId:m.requestId,stage:'sealed',replayed:true};
 for(let i=0;i<paths.length;i++){
   const bytes=payloads[i];
   for(let offset=0;offset<bytes.length;offset+=245760){
     const chunk=bytes.subarray(offset,Math.min(offset+245760,bytes.length));
     r=await send({...req,op:'append',path:paths[i],offset,
       chunkSha256:sha(chunk),payloadB64:chunk.toString('base64')});
     if(r?.requestId!==m.requestId||r.stage!=='receiving'||r.path!==paths[i]
       ||r.offset!==offset+chunk.length)fail('CHUNK_ACK');
   }
 }
 r=await send({...req,op:'seal'});
 if(r?.requestId!==m.requestId||r.stage!=='sealed')fail('SEAL_ACK');
 return {requestId:m.requestId,stage:'sealed',replayed:false};
}
function sender(token){
 return async payload=>{
   const controller=AbortSignal.timeout(15000);
   const response=await fetch(ENDPOINT,{method:'POST',redirect:'error',signal:controller,
     headers:{Authorization:'Bearer '+token,'Content-Type':'application/json',
      'Cache-Control':'no-store',Accept:'application/json'},
     body:JSON.stringify(payload)});
   if(response.status!==200||!/^application\/json(?:;|$)/i.test(
     response.headers.get('content-type')||''))fail('HTTP');
   const data=await response.text();
   if(data.length>1024)fail('RESPONSE_SIZE');
   return JSON.parse(data);
 };
}
export function transferCoralBundleToOvh({bundle,tokenFile}){
 const token=readPrivateRuntimeSecret(tokenFile,{
   minBytes:64,maxBytes:66,unavailable:'CORAL_STAGE_SECRET_UNAVAILABLE',
   invalid:'CORAL_STAGE_SECRET_INVALID',validate:s=>/^[a-f0-9]{64}$/.test(s)});
 return transferCoralBundle({bundle,send:sender(token)});
}
async function main(){
 const argv=process.argv.slice(2),args={};
 for(let i=0;i<argv.length;i+=2){
   if(!['--bundle','--token-file'].includes(argv[i])||!argv[i+1]||
      Object.hasOwn(args,argv[i]))fail('ARGS');
   args[argv[i]]=argv[i+1];
 }
 if(Object.keys(args).length!==2)fail('ARGS');
 const result=await transferCoralBundleToOvh({bundle:args['--bundle'],tokenFile:args['--token-file']});
 process.stdout.write('CORAL_OVH_BUNDLE_STAGED_NOT_PUBLISHED '+result.requestId.slice(0,12)+'\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)
 main().catch(()=>{process.stderr.write('CORAL_OVH_STAGE_BLOCKED\n');process.exitCode=1;});
