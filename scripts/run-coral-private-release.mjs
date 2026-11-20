#!/usr/bin/env node
/**
 * One-shot/cron-friendly operator-side runner for the existing Coral V2 store.
 * It consumes an ALREADY-approved and ALREADY-generated private job; no HTTP
 * backend is added and this tool NEVER invokes OpenAI or mutates public Git.
 *
 * node scripts/run-coral-private-release.mjs \
 *   --job-root /private/worker-jobs --job <48-hex> \
 *   --repo /private/pinned-git-repository --source-sha <40-hex> \
 *   --output-root /private/astro-releases --token-file /private/ovh-stage-token
 * Run with --pending 1 instead of --job to process approved work from a timer.
 *
 * Provisioned host must have git, Node 22, npm, ffprobe and writable private
 * storage. The token is never printed. A fresh detached worktree is created
 * per request; the existing Studio/Coral approval is still checked AGAIN when
 * the owner later presses Publier on OVH.
 */
import {createHash} from 'node:crypto';
import {readFile,lstat,mkdir,mkdtemp,realpath,writeFile,readdir,rename,rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve,join,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {transferCoralBundleToOvh,coralOvhStageStatus} from './transfer-coral-bundle-to-ovh.mjs';
import {snapshotCoralSharedPages} from './coral-preserve-published-pages.mjs';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const fail=reason=>{throw Error('CORAL_PRIVATE_RELEASE_'+reason);};
async function safeFile(path,max=90000){
 const info=await lstat(path);
 if(!info.isFile()||info.isSymbolicLink()||info.size<1||info.size>max||
   (process.platform!=='win32'&&(info.mode&0o077)!==0))
   fail('FILE');
 const b=await readFile(path);
 if(b.length!==info.size)fail('FILE_CHANGED');
 return b;
}
async function safeDir(path){
 const stat=await lstat(path);
 if(!stat.isDirectory()||stat.isSymbolicLink()||
   (process.platform!=='win32'&&(stat.mode&0o077)!==0))
    fail('PRIVATE_DIRECTORY');
 return realpath(path);
}
export async function inspectCoralPrivateRelease({jobRoot,job}){
 if(!/^[a-f0-9]{48}$/.test(job??''))fail('JOB');
 const root=await safeDir(resolve(jobRoot)),folder=join(root,job),privateDir=join(folder,'real-tts');
 await safeDir(folder);await safeDir(privateDir);
 const request=JSON.parse((await safeFile(join(folder,'request.json'),94096)).toString('utf8'));
 const packet=JSON.parse((await safeFile(join(privateDir,'private-build-inputs.json'))).toString('utf8'));
 const intent=JSON.parse((await safeFile(join(privateDir,'release-intent.json'))).toString('utf8'));
 const manifest=JSON.parse((await safeFile(join(privateDir,'manifest.json'))).toString('utf8'));
 const state=JSON.parse((await safeFile(join(privateDir,'state.json'))).toString('utf8'));
 if(request.id!==job||request.request?.request_id!==job||
   request.request?.contract!=='cdc-coral-private-speech-request-v1'||
   packet.contract!=='cdc-coral-studio-private-build-inputs-v1'||
   packet.intent?.request_id!==job||JSON.stringify(packet.intent)!==JSON.stringify(intent)||
   intent.request_id!==job||manifest.request_id!==job||state.status!=='succeeded'||
   state.manifest_sha256!==manifest.sha256||
   manifest.sha256!==intent.mp3_sha256||
   manifest.bytes!==intent.mp3_bytes||
   packet.source?.id!==intent.creation_id||
   packet.source?.version!==intent.creation_version||
   !/^final-[a-f0-9]{64}\.mp3$/.test(manifest.file??'')||
   manifest.file!=='final-'+manifest.sha256+'.mp3')
   fail('INCONSISTENT_JOB');
 const audio=join(privateDir,manifest.file);
 const bytes=await safeFile(audio,32000000);
 if(bytes.length!==manifest.bytes||sha(bytes)!==manifest.sha256)
   fail('AUDIO_SHA');
 return {packet:join(privateDir,'private-build-inputs.json'),audio,job,
  audioSha256:manifest.sha256,intent};
}
function command(binary,args,cwd,timeout){
 try{execFileSync(binary,args,{cwd,timeout,stdio:'ignore',env:{
   ...process.env,CI:'true',npm_config_audit:'false',npm_config_fund:'false'
 }});}
 catch{fail('COMMAND_FAILED_'+binary.replace(/[^a-z0-9]/gi,''));}
}
export async function runCoralPrivateRelease({
 jobRoot,job,repo,sourceSha,outputRoot,tokenFile
}){
 if(!/^[a-f0-9]{40}$/.test(sourceSha??''))fail('SOURCE_COMMIT');
 const reviewed=await inspectCoralPrivateRelease({jobRoot,job});
 const git=await realpath(resolve(repo)),output=await safeDir(resolve(outputRoot));
 // Never build in the source repository or alongside worker job data.
 const worker=await realpath(resolve(jobRoot));
 if(git===output||git.startsWith(output+sep)||output.startsWith(git+sep)||
    worker===output||worker.startsWith(output+sep)||output.startsWith(worker+sep))
   fail('ROOT_CONFLICT');
 const dir=join(output,job);
 await mkdir(dir,{recursive:true,mode:0o700});
 await safeDir(dir);
 // Keep immutable, private canonical inputs with each output release.
 for(const [source,name,max] of [[reviewed.packet,'canonical-inputs.json',90000],
   [reviewed.audio,'canonical-audio.mp3',32000000]]){
   const bytes=await safeFile(source,max);
   const target=join(dir,name);
   try{await safeFile(target,max);}
   catch(e){
     if(e.code!=='ENOENT')throw e;
     const scratch=await mkdtemp(join(dir,'archive-'));
     try{
       const copy=join(scratch,name);
       await writeFile(copy,bytes,{flag:'wx',mode:0o600});
       await rename(copy,target);
     }finally{await rm(scratch,{recursive:true,force:true});}
   }
   if(!bytes.equals(await safeFile(target,max)))fail('CANONICAL_ARCHIVE_CHANGED');
 }
 const bundle=join(dir,'bundle');
 let manifestBytes;
 try{manifestBytes=await safeFile(join(bundle,'BUNDLE-MANIFEST-PRIVE.json'));}
 catch(error){if(error.code!=='ENOENT')throw error;}
 if(!manifestBytes){
   const scratch=await mkdtemp(join(dir,'build-'));
   const checkout=join(scratch,'checkout');
   const scratchBundle=join(scratch,'bundle');
   const baseline=join(scratch,'baseline');
   let worktreeAdded=false;
   try{
     await snapshotCoralSharedPages({intent:reviewed.intent,directory:baseline});
     command('git',['worktree','add','--detach',checkout,sourceSha],git,120000);
     worktreeAdded=true;
     command('npm',['ci','--no-audit','--no-fund'],checkout,240000);
     command('node',['scripts/build-coral-private-astro-release.mjs',
       '--packet',reviewed.packet,'--audio',reviewed.audio,
       '--source-sha',sourceSha,'--out',scratchBundle,'--baseline',baseline,'--history',output],checkout,240000);
     await rename(scratchBundle,bundle);
   }finally{
     if(worktreeAdded)command('git',['worktree','remove','--force',checkout],git,120000);
     if(await safeDir(scratch)!==scratch)fail('ROOT_CONFLICT');
     await rm(scratch,{recursive:true,force:true});
   }
   manifestBytes=await safeFile(join(bundle,'BUNDLE-MANIFEST-PRIVE.json'));
 }
 await safeDir(bundle);
 const manifest=JSON.parse(manifestBytes.toString('utf8'));
 if(manifest.sourceCommit!==sourceSha||manifest.requestId!==job||
    manifest.audioSha256!==reviewed.audioSha256)
   fail('BUNDLE_IDENTITY');
 // The same sealed/partially received bundle may be sent again after a lost
 // ACK. The PHP receiver compares bytes on replay and never publishes here.
 await transferCoralBundleToOvh({bundle,tokenFile:resolve(tokenFile)});
 const receipt={contract:'cdc-coral-private-release-run-v1',
  requestId:job,sourceCommit:sourceSha,stagedOnly:true,published:false,
  completedAt:new Date().toISOString()};
 const receiptFile=join(dir,'stage-receipt.json');
 try{await writeFile(receiptFile,JSON.stringify(receipt)+'\n',{flag:'wx',mode:0o600});}
 catch(error){if(error.code!=='EEXIST')throw error;}
 return receipt;
}
export async function runPendingCoralPrivateReleases(options,{run=runCoralPrivateRelease,status=coralOvhStageStatus}={}){
 const root=await safeDir(resolve(options.jobRoot));
 const output=await safeDir(resolve(options.outputRoot));
 let staged=0,blocked=0;
 for(const entry of (await readdir(root,{withFileTypes:true}))) {
   const job=entry.name;
   if(!entry.isDirectory()||!/^[a-f0-9]{48}$/.test(job))continue;
   try{
     await lstat(join(root,job,'real-tts','private-build-inputs.json'));
   }catch(error){if(error.code==='ENOENT')continue;throw error;}
   try{
     const dir=join(output,job);
     if(options.tokenFile){
       let bundled=false;
       try{await safeFile(join(dir,'bundle','BUNDLE-MANIFEST-PRIVE.json'));bundled=true;}
       catch(e){if(e.code!=='ENOENT')throw e;}
       if(bundled){
         const state=await status({job,tokenFile:options.tokenFile});
         if(['sealed','closed','busy'].includes(state))continue;
         if(state==='stale'){
           const previous=await mkdtemp(join(dir,'superseded-'));
           await rename(join(dir,'bundle'),join(previous,'bundle'));
           try{await rename(join(dir,'stage-receipt.json'),join(previous,'stage-receipt.json'));}
           catch(e){if(e.code!=='ENOENT')throw e;}
         }
       }
     }else{
       try{await safeFile(join(dir,'stage-receipt.json'));continue;}
       catch(e){if(e.code!=='ENOENT')throw e;}
     }
     await run({...options,job});staged++;
   }catch(error){blocked++;}

 }
 return {staged,blocked};
}
async function main(){
 const argv=process.argv.slice(2),args={};
 for(let i=0;i<argv.length;i+=2){
   if(!['--job-root','--job','--repo','--source-sha','--output-root','--token-file','--pending'].includes(argv[i])
     ||!argv[i+1]||Object.hasOwn(args,argv[i]))fail('ARGS');
   args[argv[i]]=argv[i+1];
 }
 if(Object.keys(args).length!==6||Boolean(args['--job'])===(args['--pending']==='1'))fail('ARGS');
 const options={
   jobRoot:args['--job-root'],job:args['--job'],repo:args['--repo'],
   sourceSha:args['--source-sha'],outputRoot:args['--output-root'],
   tokenFile:args['--token-file']};
 if(args['--pending']==='1'){
   const result=await runPendingCoralPrivateReleases(options);
   process.stdout.write('CORAL_PRIVATE_RELEASE_QUEUE staged='+result.staged+' blocked='+result.blocked+'\n');
   if(result.blocked)process.exitCode=1;
   return;
 }
 const result=await runCoralPrivateRelease(options);
 process.stdout.write('CORAL_PRIVATE_RELEASE_STAGED_ONLY '+result.requestId.slice(0,12)+'\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)
 main().catch(()=>{process.stderr.write('CORAL_PRIVATE_RELEASE_BLOCKED\n');process.exitCode=1;});
