import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {isIP} from 'node:net';
const immutable=x=>typeof x==='string'&&/^(?:[A-Za-z0-9._:/-]+@)?sha256:[a-f0-9]{64}$/.test(x);
function hardening(service){
  if(!immutable(service.image)||service.user!=='1000:1000'||service.read_only!==true
    ||service.privileged||service.ports?.length||!service.cap_drop?.includes('ALL')
    ||!service.security_opt?.some(x=>x==='no-new-privileges:true'||x==='no-new-privileges'))
    throw Error('CORAL_COMPOSE_HARDENING');
  if(Object.keys(service.environment||{}).some(x=>x==='OPENAI_API_KEY'||x==='CDC_EDITORIAL_JOB_TOKEN'))
    throw Error('CORAL_COMPOSE_SECRET_ENV');
  if((service.volumes||[]).some(v=>String(v.source).includes('docker.sock')||String(v.source).includes('postgres')))
    throw Error('CORAL_COMPOSE_MOUNT');
}
export function validateCoralCompose(c){
  if(Object.keys(c.services||{}).join()!=='coral-job-worker')throw Error('CORAL_COMPOSE_SCOPE');
  const s=c.services['coral-job-worker'];hardening(s);
  if(s.network_mode||JSON.stringify(Object.keys(s.networks||{}).sort())!==JSON.stringify(['egress','ingress','provider']))
    throw Error('CORAL_COMPOSE_NETWORK');
  if(!c.networks?.ingress?.internal||!c.networks?.provider?.internal||c.networks?.egress?.internal
    ||Object.values(c.networks||{}).some(n=>n.external||n.name==='n8n_default'))throw Error('CORAL_COMPOSE_NETWORK');
  const names=(s.secrets||[]).map(x=>typeof x==='string'?x:x.source).sort();
  if(JSON.stringify(names)!==JSON.stringify(['cdc_coral_openai_key','cdc_editorial_job_token']))throw Error('CORAL_COMPOSE_SECRETS');
  const api=c.secrets?.cdc_coral_openai_key?.file,token=c.secrets?.cdc_editorial_job_token?.file;
  if(!api||!token||resolve(api)===resolve(token))throw Error('CORAL_COMPOSE_SECRETS');
  if(s.environment?.CDC_EDITORIAL_JOB_TOKEN_FILE!=='/run/secrets/cdc_editorial_job_token'
    ||s.environment?.CDC_EDITORIAL_JOB_BIND_HOST!=='0.0.0.0')throw Error('CORAL_COMPOSE_RUNTIME');
  if((s.volumes||[]).some(v=>v.bind?.create_host_path!==false))throw Error('CORAL_COMPOSE_IMPLICIT_DIRECTORY');
  return {status:'PASS',services:1,publishedPorts:0};
}
/** A live but unexposed staging worker: only existing Ollama routing, NEVER OpenAI. */
export function validateCoralStagingCompose(c){
  validateCoralCompose(c);
  const s=c.services['coral-job-worker'],env=s.environment||{},labels=s.labels||{};
  if(env.CDC_EDITORIAL_JOB_SERVICE_ENABLED!=='true'
    ||env.CDC_EDITORIAL_JOB_PROVIDER!=='ollama'
    ||env.CDC_CORAL_EXTERNAL_QUALIFIED!=='false'
    ||env.CDC_CORAL_EXTERNAL_ENABLED!=='false'
    ||s.restart!=='no'
    ||Object.keys(labels).join()!=='traefik.enable'
    ||labels['traefik.enable']!=='false')
    throw Error('CORAL_STAGING_REFUSED');
  return {status:'PASS',routeEnabled:false,externalProviderEnabled:false,publishedPorts:0};
}
/** Validate the OPTIONAL exposed route after Compose has resolved its labels. */
export function validateCoralTraefikRoute(c){
  const s=c.services?.['coral-job-worker'],l=s?.labels;
  if(!s||!l||s.ports?.length||l['traefik.enable']!=='true'
    ||l['traefik.docker.network']!=='cdc-coral-ingress'
    ||l['traefik.http.routers.cdc-coral.rule']!=='Host(`n8n.orvekio.com`) && PathPrefix(`/editorial-ai/v1/jobs/`)'
    ||l['traefik.http.routers.cdc-coral.entrypoints']!=='websecure'
    ||l['traefik.http.routers.cdc-coral.tls']!=='true'
    ||l['traefik.http.routers.cdc-coral.service']!=='cdc-coral'
    ||l['traefik.http.services.cdc-coral.loadbalancer.server.port']!=='18678'
    ||l['traefik.http.routers.cdc-coral.middlewares']!=='cdc-coral-allow@docker,cdc-coral-rate@docker,cdc-coral-flight@docker')
    throw Error('CORAL_TRAEFIK_ROUTE');
  const allowed=l['traefik.http.middlewares.cdc-coral-allow.ipallowlist.sourcerange'];
  if(typeof allowed!=='string')throw Error('CORAL_TRAEFIK_SOURCES');
  const cidrs=allowed.split(',').map(x=>x.trim());
  if(cidrs.length<1||cidrs.length>8||!cidrs.every(value=>{
    const parts=value.split('/');
    if(parts.length!==2||!(/^[0-9]{1,3}$/).test(parts[1]))return false;
    const family=isIP(parts[0]),bits=Number(parts[1]);
    return (family===4&&bits>=24&&bits<=32)||(family===6&&bits>=64&&bits<=128);
  }))throw Error('CORAL_TRAEFIK_SOURCES');
  const bounded=(name,min,max)=>{
    const v=l[name];return typeof v==='string'&&(/^[0-9]+$/).test(v)&&Number(v)>=min&&Number(v)<=max;
  };
  if(!bounded('traefik.http.middlewares.cdc-coral-rate.ratelimit.average',1,120)
    ||l['traefik.http.middlewares.cdc-coral-rate.ratelimit.period']!=='1m'
    ||!bounded('traefik.http.middlewares.cdc-coral-rate.ratelimit.burst',1,12)
    ||!bounded('traefik.http.middlewares.cdc-coral-flight.inflightreq.amount',1,4))
    throw Error('CORAL_TRAEFIK_ADMISSION');
  return {status:'PASS',sourceCidrs:cidrs.length,rateLimited:true,concurrencyLimited:true};
}
export function validateCoralMaintenanceCompose(c){
  if(Object.keys(c.services||{}).sort().join()!=='coral-backup,coral-restore')throw Error('CORAL_COMPOSE_SCOPE');
  for(const s of Object.values(c.services)){
    hardening(s);
    if(s.network_mode!=='none'||(s.secrets||[]).some(x=>(typeof x==='string'?x:x.source)!=='cdc_coral_backup_key'))
      throw Error('CORAL_MAINTENANCE_ISOLATION');
  }
  return {status:'PASS',services:2,publishedPorts:0};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  try{let raw='';for await(const chunk of process.stdin){raw+=chunk;if(raw.length>1000000)throw Error('SIZE');}
    console.log(JSON.stringify((process.argv[2]==='maintenance'?validateCoralMaintenanceCompose:validateCoralCompose)(JSON.parse(raw))));
  }catch{process.stderr.write('CORAL_COMPOSE_REFUSED\n');process.exitCode=1;}
}
