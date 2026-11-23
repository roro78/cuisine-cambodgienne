/** Disposable, synthetic Docker qualification. No production network is attached. */
import {spawnSync} from 'node:child_process';
import {mkdtemp,writeFile,readFile,rm,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes} from 'node:crypto';
import assert from 'node:assert/strict';
import {validateCoralCompose,validateCoralMaintenanceCompose,validateCoralTraefikRoute,validateCoralStagingCompose} from './validate-coral-compose.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const lock=JSON.parse(await readFile(join(root,'deploy/coral/images.lock.json'),'utf8'));
const nonce=randomBytes(8).toString('hex'),label='cdc.coral.test='+nonce;
const prefix='cdc-coral-test-'+nonce;
const fixture=await mkdtemp(join(tmpdir(),prefix+'-'));
await writeFile(join(fixture,'.test-owner'),nonce,{mode:0o600});
const networkNames=[],containerNames=[];
let workerImage=null;
const evidence={nonce,checks:[],productionChanges:false,realApiKey:false,paidApiCalls:0,ttsCalls:0};
const token='synthetic-docker-job-token-not-production';
const fakeKey='sk-proj-'+'synthetic'.repeat(8);
function docker(args,{input,timeout=120000,allowFailure=false,env=process.env}={}){
  const r=spawnSync('docker',args,{cwd:root,input,env,encoding:'utf8',timeout,maxBuffer:8*1024*1024});
  if((r.status!==0||r.error)&&!allowFailure){
    const safe=x=>String(x||'').replaceAll(fakeKey,'[synthetic-key]').replaceAll(token,'[synthetic-token]')
      .replaceAll(fixture,'<fixture>').replaceAll(root,'<source>').slice(-2500);
    evidence.failure={operation:args[0],exitCode:r.status,stderr:safe(r.stderr),stdout:safe(r.stdout)};
    throw Error('DOCKER_'+args[0]+'_FAILED');
  }
  return r;
}
const json=args=>JSON.parse(docker(args).stdout);
const check=(name,ok)=>{assert.ok(ok,name);evidence.checks.push({name,pass:true});};
function inspect(name){return json(['inspect',name])[0];}
function owned(name){return inspect(name).Config.Labels?.['cdc.coral.test']===nonce;}
function run(name,image,args=[],options=[]){
  const full=prefix+'-'+name;containerNames.push(full);
  docker(['run','-d','--name',full,'--label',label,'--cpus','0.5','--memory','256m',
    '--pids-limit','64','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges',
    ...options,image,...args]);return full;
}
function baseNode(script,{network='none',mounts=[],user='1000:1000',allowFailure=false}={}){
  return docker(['run','--rm','-i','--network',network,'--user',user,'--cpus','0.5',
    '--memory','512m','--pids-limit','64','--read-only','--cap-drop','ALL',
    '--security-opt','no-new-privileges',...mounts,lock.node,'node','--input-type=module','-'],
  {input:script,allowFailure});
}
function worker(name,{state='state',secret='token',provider='ollama',approved=false,readonlyJobs=false}={}){
  return run(name,workerImage,[],['--network',networkNames[0],'--user','1000:1000',
    '--mount',`type=bind,src=${join(fixture,state,'jobs')},dst=/state/jobs${readonlyJobs?',readonly':''}`,
    '--mount',`type=bind,src=${join(fixture,state,'budget')},dst=/state/budget`,
    '--mount',`type=bind,src=${join(fixture,'secrets',secret)},dst=/run/secrets/cdc_editorial_job_token,readonly`,
    '--mount',`type=bind,src=${join(fixture,'secrets','api')},dst=/run/secrets/cdc_coral_openai_key,readonly`,
    '-e','CDC_EDITORIAL_JOB_SERVICE_ENABLED=true','-e','CDC_EDITORIAL_JOB_BIND_HOST=0.0.0.0',
    '-e','CDC_EDITORIAL_JOB_DIR=/state/jobs','-e','CDC_EDITORIAL_JOB_TOKEN_FILE=/run/secrets/cdc_editorial_job_token',
    '-e','CDC_EDITORIAL_JOB_PROVIDER='+provider,'-e','CDC_CORAL_EXTERNAL_QUALIFIED='+approved,
    '-e','CDC_CORAL_EXTERNAL_ENABLED='+approved,'-e','CDC_CORAL_EXTERNAL_MODEL=gpt-6-luna',
    '-e','CDC_CORAL_EXTERNAL_DAILY_USD=0.01','-e','CDC_CORAL_EXTERNAL_BUDGET_DIR=/state/budget']);
}
function exited(name){return docker(['wait',name],{timeout:20000}).stdout.trim();}
function client(script,network=networkNames[0]){
  return baseNode(script,{network,mounts:['--mount',`type=bind,src=${join(fixture,'cert.pem')},dst=/ca.pem,readonly`]}).stdout.trim();
}
async function waitReady(name){
  for(let i=0;i<30;i++){
    const r=baseNode(`try{const r=await fetch('http://${name}:18678/');process.exit(r.status===401?0:1)}catch{process.exit(1)}`,
      {network:networkNames[0],allowFailure:true});
    if(r.status===0)return;
    if(inspect(name).State.Status==='exited')throw Error('WORKER_EXITED');
    await new Promise(r=>setTimeout(r,500));
  }
  throw Error('WORKER_NOT_READY');
}
try{
  const context=docker(['context','show']).stdout.trim();
  const endpoint=json(['context','inspect',context])[0].Endpoints.docker.Host;
  const target=process.env.DOCKER_HOST||endpoint;
  if(!/^(unix|npipe):/.test(target))throw Error('LOCAL_DOCKER_SOCKET_REQUIRED');
  const names=docker(['ps','--format','{{.Names}}']).stdout.split('\n');
  const shared=names.some(n=>/^(n8n|ollama|qdrant|n8n-traefik-1|n8n-postgres-1)$/.test(n));
  if(shared&&process.env.CORAL_TEST_ALLOW_SHARED_DAEMON!=='1')throw Error('SHARED_DAEMON_REQUIRES_EXPLICIT_TEST_OPT_IN');
  const baseline=docker(['ps','-q']).stdout.split(/\s+/).filter(Boolean).map(id=>inspect(id)).map(x=>({
    id:x.Id,image:x.Image,started:x.State.StartedAt,mounts:x.Mounts,networks:Object.keys(x.NetworkSettings.Networks).sort()}));
  evidence.sharedDaemon=shared;evidence.baselineContainerCount=baseline.length;
  docker(['pull',lock.node],{timeout:240000});
  if(docker(['image','inspect',lock.traefikTest],{allowFailure:true}).status!==0)
    docker(['pull',lock.traefikTest],{timeout:240000});
  const version=baseNode('console.log(process.version)').stdout.trim();
  evidence.node=version;check('pinned Node 22 image',/^v22\./.test(version));
  const unit=docker(['run','--rm','--network','none','--user','1000:1000','--cpus','0.75',
    '--memory','512m','--pids-limit','128','--read-only','--cap-drop','ALL',
    '--tmpfs','/tmp:rw,noexec,nosuid,size=128m,uid=1000,gid=1000,mode=0700',
    '--mount',`type=bind,src=${root},dst=/test,readonly`,'--workdir','/test',lock.node,
    'node','--test','--test-concurrency=1','tests/editorial-job-runtime.test.mjs',
    'tests/coral-state-backup.test.mjs','tests/coral-compose.test.mjs','tests/coral-openai-secret.test.mjs',
    'tests/editorial-ai-job-gateway.test.mjs','tests/coral-external-job-provider.test.mjs']);
  evidence.linuxUnitTests={pass:Number(unit.stdout.match(/# pass (\d+)/)?.[1]),
    fail:Number(unit.stdout.match(/# fail (\d+)/)?.[1]),skipped:Number(unit.stdout.match(/# skipped (\d+)/)?.[1])};
  check('Linux unit tests with Unix permissions and no external network',evidence.linuxUnitTests.fail===0&&evidence.linuxUnitTests.skipped===0);
  const buildTag=prefix+'-worker';
  docker(['build','--label',label,'--build-arg','SOURCE_REVISION='+
    (process.env.GITHUB_SHA||'isolated-worktree'),'-f','deploy/coral/Dockerfile','-t',buildTag,'.'],{timeout:240000});
  workerImage=json(['image','inspect',buildTag])[0].Id;evidence.workerImage=workerImage;
  const openssl=process.env.OPENSSL_BIN||'openssl';
  const cert=spawnSync(openssl,['req','-x509','-newkey','ed25519','-nodes',
    '-keyout',join(fixture,'key.pem'),'-out',join(fixture,'cert.pem'),'-days','1',
    '-subj','/CN=n8n.orvekio.com','-addext','subjectAltName=DNS:n8n.orvekio.com'],{encoding:'utf8',timeout:30000});
  if(cert.status!==0)throw Error('TEST_CERTIFICATE_CREATION_FAILED');
  // This isolated fixture contains no real credential, media or database file.
  docker(['run','--rm','-i','--network','none','--user','0:0','--cap-drop','ALL',
    '--cpus','0.5','--memory','128m','--pids-limit','32',
    '--cap-add','CHOWN','--cap-add','DAC_OVERRIDE','--mount',`type=bind,src=${fixture},dst=/fixture`,lock.node,'node','--input-type=module','-'],{
    input:`import fs from 'node:fs';const b='/fixture';
    for(const p of ['state','state/jobs','state/budget','state/config','secrets','archives','recovery'])fs.mkdirSync(b+'/'+p,{mode:0o700,recursive:true});
    fs.writeFileSync(b+'/secrets/token',${JSON.stringify(token)},{mode:0o400});
    fs.writeFileSync(b+'/secrets/unsafe',${JSON.stringify(token)},{mode:0o644});
    fs.writeFileSync(b+'/secrets/wrong-owner',${JSON.stringify(token)},{mode:0o400});
    fs.writeFileSync(b+'/secrets/api',${JSON.stringify(fakeKey)},{mode:0o400});
    fs.writeFileSync(b+'/secrets/backup','a'.repeat(64),{mode:0o400});
    fs.writeFileSync(b+'/state/config/runtime.json','{"synthetic":true}',{mode:0o600});
    fs.writeFileSync(b+'/state/budget/budget-test.json','{"requests":[{"reservedUsd":0.01,"state":"unknown-after-reservation"}]}',{mode:0o600});
    function own(p){for(const n of fs.readdirSync(p)){const q=p+'/'+n;if(fs.statSync(q).isDirectory())own(q);if(!q.endsWith('/wrong-owner'))fs.chownSync(q,1000,1000);}if(p!==b)fs.chownSync(p,1000,1000)}own(b);`
  });
  const env={...process.env,CDC_CORAL_WORKER_IMAGE:workerImage,CDC_CORAL_MODEL:'gpt-6-luna',
    CDC_CORAL_DAILY_USD:'0.01',CDC_CORAL_STATE_DIR:join(fixture,'state'),
    CDC_CORAL_OPENAI_SECRET_FILE:join(fixture,'secrets/api'),CDC_CORAL_JOB_TOKEN_FILE:join(fixture,'secrets/token'),
    CDC_CORAL_BACKUP_KEY_FILE:join(fixture,'secrets/backup'),CDC_CORAL_ARCHIVE_DIR:join(fixture,'archives'),
    CDC_CORAL_RECOVERY_DIR:join(fixture,'recovery'),
    CDC_CORAL_ALLOWED_SOURCE_CIDRS:'192.0.2.10/32'};
  const compose=JSON.parse(docker(['compose','-f','deploy/coral/compose.yaml','--profile','runtime','config','--format','json'],{env}).stdout);
  check('Compose keeps the private tmpfs as one mount, not seven YAML entries',
    Array.isArray(compose.services['coral-job-worker'].tmpfs)&&compose.services['coral-job-worker'].tmpfs.length===1
    &&compose.services['coral-job-worker'].tmpfs[0].startsWith('/tmp:')
    &&['noexec','nosuid','uid=1000','gid=1000','mode=0700'].every(x=>compose.services['coral-job-worker'].tmpfs[0].includes(x)));
  check('real Compose runtime normalization passes security contract',validateCoralCompose(compose).status==='PASS');
  const stagingCompose=JSON.parse(docker(['compose','-f','deploy/coral/compose.yaml',
    '-f','deploy/coral/compose.staging.yaml','--profile','runtime','config','--format','json'],{env}).stdout);
  check('isolated Coral staging config boots without OpenAI or Traefik route',
    validateCoralStagingCompose(stagingCompose).status==='PASS');
  const routeCompose=JSON.parse(docker(['compose','-f','deploy/coral/compose.yaml',
    '-f','deploy/coral/compose.traefik.yaml','--profile','runtime','config','--format','json'],{env}).stdout);
  check('optional Traefik route has CIDR, throttle and in-flight controls',
    validateCoralTraefikRoute(routeCompose).status==='PASS');
  const noSourceEnv={...env};delete noSourceEnv.CDC_CORAL_ALLOWED_SOURCE_CIDRS;
  check('route refuses Compose rendering without verified source',
    docker(['compose','-f','deploy/coral/compose.yaml','-f','deploy/coral/compose.traefik.yaml',
      'config'],{env:noSourceEnv,allowFailure:true}).status!==0);
  const maintenanceCompose=JSON.parse(docker(['compose','-f','deploy/coral/compose.maintenance.yaml','--profile','maintenance','config','--format','json'],{env}).stdout);
  check('real Compose maintenance normalization passes isolation contract',validateCoralMaintenanceCompose(maintenanceCompose).status==='PASS');
  for(const kind of ['ingress','provider']){
    const name=prefix+'-'+kind;docker(['network','create','--internal','--label',label,name]);networkNames.push(name);
  }
  const fakeOllama=run('ollama',lock.node,['node','--input-type=module','-e',
    "import{createServer}from'node:http';let calls=0;createServer(async(q,r)=>{for await(const x of q){};r.setHeader('content-type','application/json');if(q.url==='/stats')return r.end(JSON.stringify({calls}));calls++;r.end(JSON.stringify({done:true,message:{content:'{}'}}))}).listen(11434,'0.0.0.0')"],
    ['--network',networkNames[1],'--network-alias','ollama','--user','1000:1000']);
  const w=worker('worker');docker(['network','connect',networkNames[1],w]);await waitReady(w);
  const dynamic=`http:\n  routers:\n    coral:\n      rule: 'Host(\`n8n.orvekio.com\`) && PathPrefix(\`/editorial-ai/v1/jobs/\`)'\n      entryPoints: [websecure]\n      tls: {}\n      service: coral\n  services:\n    coral:\n      loadBalancer:\n        servers:\n          - url: http://${w}:18678\ntls:\n  certificates:\n    - certFile: /cert.pem\n      keyFile: /key.pem\n`;
  await writeFile(join(fixture,'traefik.yaml'),dynamic,{mode:0o644});
  const proxy=run('traefik',lock.traefikTest,[
    '--entrypoints.websecure.address=:8443','--providers.file.filename=/fixture.yaml','--log.level=ERROR'],
    ['--network',networkNames[0],'--user','1000:1000',
      '--mount',`type=bind,src=${join(fixture,'traefik.yaml')},dst=/fixture.yaml,readonly`,
      '--mount',`type=bind,src=${join(fixture,'cert.pem')},dst=/cert.pem,readonly`,
      '--mount',`type=bind,src=${join(fixture,'key.pem')},dst=/key.pem,readonly`]);
  const id='a'.repeat(48);
  const request={contract:'cdc-editorial-ai-content-request-v1',scope:'creation-form-core-v1',
    brief:{kind:'culture',title:'Synthetic Docker fixture'},response_schema:{type:'object',additionalProperties:false},
    timeout_seconds:20,max_output_tokens:6000,response_max_bytes:30000};
  const tlsClient=`import https from 'node:https';import fs from 'node:fs';
    const call=(method,auth,body)=>new Promise((accept,reject)=>{const q=https.request({hostname:'${proxy}',port:8443,servername:'n8n.orvekio.com',ca:fs.readFileSync('/ca.pem'),path:'/editorial-ai/v1/jobs/${id}',method,headers:{host:'n8n.orvekio.com',...(auth?{authorization:'Bearer ${token}'}:{}),'content-type':'application/json'}},r=>{let s='';r.on('data',b=>s+=b);r.on('end',()=>accept({status:r.statusCode,body:s}));});q.on('error',reject);q.end(body)});`;
  let result;
  for(let i=0;i<20;i++){
    try{result=JSON.parse(client(tlsClient+"console.log(JSON.stringify(await call('GET',false)))"));break;}
    catch{evidence.tlsReadinessRetries=(evidence.tlsReadinessRetries||0)+1;await new Promise(r=>setTimeout(r,500));}
  }
  check('private Traefik TLS verifies fixture CA and rejects anonymous request',result?.status===401);
  delete evidence.failure; // Initial TLS probes can precede file-provider readiness.
  result=JSON.parse(client(tlsClient+`console.log(JSON.stringify(await call('PUT',true,${JSON.stringify(JSON.stringify(request))})))`));
  check('private authenticated submission',result.status===202);
  for(let i=0;i<25;i++){
    result=JSON.parse(client(tlsClient+"console.log(JSON.stringify(await call('GET',true)))"));
    if(JSON.parse(result.body).status==='succeeded')break;
    await new Promise(r=>setTimeout(r,300));
  }
  check('worker reaches synthetic Ollama on separate private network',JSON.parse(result.body).status==='succeeded');
  const cfg=inspect(w);
  check('no published port and non-root readonly runtime',Object.keys(cfg.HostConfig.PortBindings||{}).length===0
    &&cfg.HostConfig.ReadonlyRootfs&&cfg.Config.User==='1000:1000');
  check('no provider or bearer credential in environment',!cfg.Config.Env.some(x=>/^(OPENAI_API_KEY|CDC_EDITORIAL_JOB_TOKEN)=/.test(x)));
  check('secret file bind mounts are readonly',cfg.Mounts.filter(m=>m.Destination.startsWith('/run/secrets/')).every(m=>!m.RW));
  check('no shared production or PostgreSQL network',Object.keys(cfg.NetworkSettings.Networks).every(n=>networkNames.includes(n)));
  for(const secret of ['unsafe','wrong-owner']){
    const bad=worker('bad-'+secret,{secret});check('reject '+secret+' secret file',exited(bad)==='1');
  }
  const readonly=worker('readonly-jobs',{readonlyJobs:true});check('reject readonly queue volume at startup',exited(readonly)==='1');
  const gate=worker('unqualified',{provider:'openai-coral'});check('external flags remain required',exited(gate)==='1');
  const openai=worker('synthetic-openai',{provider:'openai-coral',approved:true});await waitReady(openai);
  check('synthetic OpenAI file is consumed without generation',inspect(openai).State.Running);
  const log=docker(['logs',openai]).stdout+docker(['logs',w]).stdout;
  check('startup logs contain no synthetic key or token',!log.includes(fakeKey)&&!log.includes(token));
  docker(['stop','-t','5',w]);docker(['stop','-t','5',openai]);
  const maintenance=['--mount',`type=bind,src=${join(fixture,'state')},dst=/state,readonly`,
    '--mount',`type=bind,src=${join(fixture,'archives')},dst=/archives`,
    '--mount',`type=bind,src=${join(fixture,'secrets','backup')},dst=/backup-key,readonly`,
    '--mount',`type=bind,src=${join(fixture,'recovery')},dst=/recovery`];
  const backup=baseNode("import{backupCoralState,restoreCoralState}from'/app/scripts/coral-state-backup.mjs';const a={archive:'/archives/coral.enc',keyFile:'/backup-key',offline:true};await backupCoralState({...a,stateDir:'/state'});await restoreCoralState({...a,stateDir:'/recovery/new-state'});console.log('RESTORE_OK')",{mounts:[...maintenance,
    '--mount',`type=bind,src=${join(root,'scripts')},dst=/app/scripts,readonly`]});
  check('offline encrypted backup and isolated restore',backup.stdout.includes('RESTORE_OK'));
  const restored=worker('restored',{state:'recovery/new-state'});check('restored worker requires explicit review',exited(restored)==='1');
  const perms=baseNode("import fs from'node:fs';const a=fs.statSync('/recovery/new-state/jobs');const b=fs.statSync('/recovery/new-state/budget/budget-test.json');console.log(JSON.stringify({directory:a.mode&511,file:b.mode&511,ledger:JSON.parse(fs.readFileSync('/recovery/new-state/budget/budget-test.json')).requests[0].reservedUsd}))",{mounts:maintenance});
  const p=JSON.parse(perms.stdout);check('restored volume permissions and reservation preserved',p.directory===0o700&&p.file===0o600&&p.ledger===0.01);
  for(const [index,old] of baseline.entries()){const now=inspect(old.id);check('preserve pre-existing container '+(index+1),
    now.Image===old.image&&now.State.StartedAt===old.started&&JSON.stringify(now.Mounts.slice().sort((a,b)=>a.Destination.localeCompare(b.Destination)))===JSON.stringify(old.mounts.slice().sort((a,b)=>a.Destination.localeCompare(b.Destination)))
    &&JSON.stringify(Object.keys(now.NetworkSettings.Networks).sort())===JSON.stringify(old.networks));}
  evidence.status='PASS';
}catch(error){evidence.status='FAIL';evidence.error=error.message;process.exitCode=1;}
finally{
  const cleanup=[];
  for(const name of containerNames.reverse())try{
    if(owned(name)){docker(['rm','-f',name]);cleanup.push(name);}
  }catch{if(docker(['inspect',name],{allowFailure:true}).status===0)evidence.cleanupIncomplete=true;}
  for(const name of networkNames.reverse())try{
    const obj=json(['network','inspect',name])[0];
    if(obj.Labels?.['cdc.coral.test']===nonce)docker(['network','rm',name]);else evidence.cleanupIncomplete=true;
  }catch{evidence.cleanupIncomplete=true;}
  if(workerImage)docker(['image','rm',workerImage],{allowFailure:true});
  if(await readFile(join(fixture,'.test-owner'),'utf8')===nonce){
    docker(['run','--rm','-i','--network','none','--user','0:0','--cap-drop','ALL',
      '--cpus','0.5','--memory','128m','--pids-limit','32',
      '--cap-add','DAC_OVERRIDE','--cap-add','FOWNER','--mount',`type=bind,src=${fixture},dst=/fixture`,lock.node,
      'node','--input-type=module','-'],{input:`import fs from'node:fs';if(fs.readFileSync('/fixture/.test-owner','utf8')!==${JSON.stringify(nonce)})process.exit(2);for(const p of fs.readdirSync('/fixture'))fs.rmSync('/fixture/'+p,{recursive:true,force:true});`,allowFailure:true});
    try{await rm(fixture,{recursive:true});}catch{evidence.cleanupIncomplete=true;}
  }
  evidence.cleanedContainers=cleanup.length;
  if(evidence.cleanupIncomplete){evidence.status='FAIL';process.exitCode=1;}
  const out=resolve(process.env.CORAL_TEST_REPORT||join(root,'artifacts/coral-runtime-docker.json'));
  await mkdir(dirname(out),{recursive:true});await writeFile(out,JSON.stringify(evidence,null,2)+'\n');
  console.log(JSON.stringify(evidence));
}
