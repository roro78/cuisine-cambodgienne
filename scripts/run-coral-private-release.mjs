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
 *
 * Provisioned host must have git, Node 22, npm, ffprobe and writable private
 * storage. The token is never printed. A fresh detached worktree is created
 * per request; the existing Studio/Coral approval is still checked AGAIN when
 * the owner later presses Publier on OVH.
 */
import {createHash} from 'node:crypto';
import {readFile,lstat,mkdir,realpath,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve,join,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const fail=reason=>{throw Error('CORAL_PRIVATE_RELEASE_'+reason);};
async function safeFile(path,max=90000){
 const info=await lstat(path);
 if(!info.isFile()||info.isSymbolicLink()||info.size<1||info.size>max)
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
 const request=JSON.parse((await safeFile(join(folder,'request.json'))).toString('utf8'));
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
 return {packet:join(privateDir,'private-build-inputs.json'),audio,job};
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
 // Atomic exclusive directory claim means failed/uncertain runs require review;
 // no automated re-generation, re-synthesis or duplicate staging.
 await mkdir(dir,{mode:0o700});
 const checkout=join(dir,'checkout'),bundle=join(dir,'bundle');
 command('git',['worktree','add','--detach',checkout,sourceSha],git,120000);
 command('npm',['ci','--no-audit','--no-fund'],checkout,240000);
 command('node',['scripts/build-coral-private-astro-release.mjs',
   '--packet',reviewed.packet,'--audio',reviewed.audio,
   '--source-sha',sourceSha,'--out',bundle],checkout,240000);
 // Actual HTTPS transfer of public-only static assets to OVH private staging.
 // The target can never publish on this endpoint.
 command('node',['scripts/transfer-coral-bundle-to-ovh.mjs',
   '--bundle',bundle,'--token-file',resolve(tokenFile)],checkout,240000);
 const receipt={contract:'cdc-coral-private-release-run-v1',
  requestId:job,sourceCommit:sourceSha,stagedOnly:true,published:false,
  completedAt:new Date().toISOString()};
 await writeFile(join(dir,'stage-receipt.json'),JSON.stringify(receipt)+'\n',
   {flag:'wx',mode:0o600});
 return receipt;
}
async function main(){
 const argv=process.argv.slice(2),args={};
 for(let i=0;i<argv.length;i+=2){
   if(!['--job-root','--job','--repo','--source-sha','--output-root','--token-file'].includes(argv[i])
     ||!argv[i+1]||Object.hasOwn(args,argv[i]))fail('ARGS');
   args[argv[i]]=argv[i+1];
 }
 if(Object.keys(args).length!==6)fail('ARGS');
 const result=await runCoralPrivateRelease({
   jobRoot:args['--job-root'],job:args['--job'],repo:args['--repo'],
   sourceSha:args['--source-sha'],outputRoot:args['--output-root'],
   tokenFile:args['--token-file']});
 process.stdout.write('CORAL_PRIVATE_RELEASE_STAGED_ONLY '+result.requestId.slice(0,12)+'\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)
 main().catch(()=>{process.stderr.write('CORAL_PRIVATE_RELEASE_BLOCKED\n');process.exitCode=1;});
