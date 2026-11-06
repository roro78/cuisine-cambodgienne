/** Dedicated OFFLINE process for realistic load + real process restart. No network/provider/key. */
import {readFile,writeFile,mkdir,readdir,lstat} from 'node:fs/promises';
import {join,resolve,basename} from 'node:path';
import {performance} from 'node:perf_hooks';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createSimulatedTtsJobs,ttsRequestId} from '../../scripts/coral-tts-jobs.mjs';
import {audioSha,simulatedTtsProvider,TTS_CHAPTER_IDS} from '../../scripts/coral-tts-audio.mjs';
import {createJobGateway} from '../../scripts/editorial-ai-job-gateway.mjs';
import {coralTtsLoadScenarios} from '../../scripts/coral-tts-load-scenarios.mjs';
import {coralCostPlan} from '../../scripts/coral-tts-cost-plan.mjs';
const [stage,folder,name]=process.argv.slice(2),root=resolve(folder||'');
if(!['begin','resume'].includes(stage)||!basename(root).startsWith('cdc-coral-load-')||!['representative','bounded-adverse'].includes(name))throw Error('LOAD_FIXTURE_ONLY');
const scenario=(await coralTtsLoadScenarios()).find(s=>s.name===name);
let ffmpegVersion='unavailable';try{ffmpegVersion=(await promisify(execFile)('ffmpeg',['-version'],{timeout:5000,maxBuffer:20000,windowsHide:true})).stdout.split('\n')[0];}catch{}
const r={contract:'cdc-coral-private-tts-request-v1',creation_id:'c-'+'a'.repeat(24),creation_version:3,binding_sha256:'b'.repeat(64),recipe_sha256:'c'.repeat(64),
 chapters:TTS_CHAPTER_IDS.map(id=>{const text='Donnée synthétique non publiable, aucune voix ni recommandation culinaire réelle. '.repeat(3)+id;return {id,text,sha256:audioSha(text)};}),
 voice:'test-tone',provider:'simulated-tone-v1',rights_sha256:'d'.repeat(64),reviews_sha256:'e'.repeat(64),reserve_microusd:7000};
r.request_id=ttsRequestId(r);const spec=join(root,'load-spec.json');
if(stage==='begin')await writeFile(spec,JSON.stringify({contract:'cdc-isolated-coral-load-v1',scenario:name,request:r}),{flag:'wx',mode:0o600});
else if(JSON.stringify(JSON.parse(await readFile(spec,'utf8')))!==JSON.stringify({contract:'cdc-isolated-coral-load-v1',scenario:name,request:r}))throw Error('LOAD_FIXTURE_ONLY');
const metricsDir=join(root,'metrics-'+stage);await mkdir(metricsDir,{mode:0o700});
const audioTools={};
if(process.platform==='linux'){
 const quote=s=>"'"+s.replaceAll("'","'\\''")+"'";
 for(const tool of ['ffmpeg','ffprobe']){
  const wrapper=join(root,tool+'-'+stage+'.sh');
  await writeFile(wrapper,'#!/bin/sh\numask 077\nkind=probe\n'+(tool==='ffmpeg'?'kind=decode\ncase " $* " in *" -f concat "*) kind=assemble;; esac\n':'')+
   'out=$(mktemp '+quote(join(metricsDir,tool+'.XXXXXX'))+')\nexec /usr/bin/time -f '+
   quote('{"operation":"')+'"$kind"'+quote('","wall_seconds":%e,"user_seconds":%U,"system_seconds":%S,"max_rss_kib":%M}')+' -o "$out" /usr/bin/'+tool+' "$@"\n',{mode:0o700});
  audioTools[tool]=wrapper;
 }
}
let calls=0;const tone=simulatedTtsProvider({durations:scenario.durations});
const jobs=createSimulatedTtsJobs({authorize:async()=>true,budgetDir:join(root,'budget'),audioTools,pauseAfter:stage==='begin'?3:null,
 provider:{...tone,async synthesize(p){calls++;return tone.synthesize(p);}}});
const gateway=await createJobGateway({root:join(root,'jobs'),token:'isolated-load-queue-token-'.repeat(3),provider:async()=>{throw Error('NO_PROVIDER')},ttsJobs:jobs});
let cgroupCpuStart=null;try{cgroupCpuStart=Number((await readFile('/sys/fs/cgroup/cpu.stat','utf8')).match(/^usage_usec (\d+)$/m)?.[1]);}catch{}
const started=performance.now(),cpu=process.cpuUsage();
if(stage==='begin')await gateway.submit(r.request_id,r);else await gateway.ttsOperation(r.request_id,'resume');
await gateway.workOnce();const state=await gateway.state(r.request_id),elapsed=performance.now()-started,used=process.cpuUsage(cpu);
const measurements=[];
for(const file of await readdir(metricsDir))measurements.push({tool:file.split('.')[0],...JSON.parse(await readFile(join(metricsDir,file),'utf8'))});
let cgroup=null;
try{cgroup={memory_peak_bytes:Number(await readFile('/sys/fs/cgroup/memory.peak','utf8')),
 memory_max:(await readFile('/sys/fs/cgroup/memory.max','utf8')).trim(),cpu_max:(await readFile('/sys/fs/cgroup/cpu.max','utf8')).trim(),
 cpu_stat:(await readFile('/sys/fs/cgroup/cpu.stat','utf8')).trim()};}catch{}
if(cgroup&&Number.isFinite(cgroupCpuStart))cgroup.cpu_usage_usec_delta=Number(cgroup.cpu_stat.match(/^usage_usec (\d+)$/m)?.[1])-cgroupCpuStart;
const report={scenario,stage,pid:process.pid,node_version:process.version,ffmpeg_version:ffmpegVersion,calls,status:state.status,error:state.error,completed_chapters:state.completed_chapters,
 wall_ms:elapsed,node_cpu_user_ms:used.user/1000,node_cpu_system_ms:used.system/1000,node_max_rss_kib:process.resourceUsage().maxRSS,
 audio_commands:measurements,cgroup};
if(state.status==='succeeded'){
 const manifest=JSON.parse(state.result);report.manifest=manifest;
 const dir=join(root,'jobs',r.request_id,'tts');let disk=0;
 for(const file of await readdir(dir))disk+=(await lstat(join(dir,file))).size;
 report.tts_directory_bytes=disk;report.cost_plan=coralCostPlan({seconds:scenario.durations.reduce((a,b)=>a+b,0),textTokensEstimate:scenario.text_tokens_estimate});
}
await writeFile(join(root,'report-'+stage+'.json'),JSON.stringify(report,null,2),{mode:0o600});
console.log(JSON.stringify({status:report.status,calls,error:report.error,report:'report-'+stage+'.json'}));
if((stage==='begin'&&(state.status!=='interrupted'||state.completed_chapters!==3||calls!==3))
 ||(stage==='resume'&&(state.status!=='succeeded'||calls!==4)))process.exitCode=1;
