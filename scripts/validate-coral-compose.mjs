import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
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
