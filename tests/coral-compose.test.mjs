import test from 'node:test';
import assert from 'node:assert/strict';
import {validateCoralCompose,validateCoralMaintenanceCompose,validateCoralTraefikRoute} from '../scripts/validate-coral-compose.mjs';
function valid(){return {services:{'coral-job-worker':{
  image:'sha256:'+'a'.repeat(64),user:'1000:1000',read_only:true,cap_drop:['ALL'],security_opt:['no-new-privileges:true'],
  environment:{CDC_EDITORIAL_JOB_BIND_HOST:'0.0.0.0',CDC_EDITORIAL_JOB_TOKEN_FILE:'/run/secrets/cdc_editorial_job_token'},
  networks:{ingress:{},provider:{},egress:{}},secrets:[{source:'cdc_coral_openai_key'},{source:'cdc_editorial_job_token'}],
  volumes:[{source:'/synthetic/jobs',bind:{create_host_path:false}}]}},
  networks:{ingress:{internal:true},provider:{internal:true},egress:{}},
  secrets:{cdc_coral_openai_key:{file:'/synthetic/api'},cdc_editorial_job_token:{file:'/synthetic/token'}}};}
test('private container spec permits no published port, mutable image, host network, or secret environment',()=>{
  assert.equal(validateCoralCompose(valid()).status,'PASS');
  for(const change of [s=>s.ports=[{published:'18678'}],s=>s.image='node:latest',s=>s.user='0:0',
    s=>s.read_only=false,s=>s.environment.OPENAI_API_KEY='synthetic',s=>s.network_mode='host']){
    const c=valid();change(c.services['coral-job-worker']);assert.throws(()=>validateCoralCompose(c));
  }
  const same=valid();same.secrets.cdc_editorial_job_token.file='/synthetic/api';assert.throws(()=>validateCoralCompose(same),/SECRETS/);
  const shared=valid();shared.networks.ingress.external=true;assert.throws(()=>validateCoralCompose(shared),/NETWORK/);
});
test('backup maintenance has no network or application credential',()=>{
  const s=valid().services['coral-job-worker'];delete s.networks;
  s.environment={};s.network_mode='none';s.secrets=[{source:'cdc_coral_backup_key'}];
  const c={services:{'coral-backup':s,'coral-restore':structuredClone(s)}};
  assert.equal(validateCoralMaintenanceCompose(c).status,'PASS');
  c.services['coral-backup'].secrets.push({source:'cdc_coral_openai_key'});
  assert.throws(()=>validateCoralMaintenanceCompose(c),/ISOLATION/);
});

test('optional TLS route requires a narrow allowlist, rate cap and concurrency cap',()=>{
  const c=valid(),l={
    'traefik.enable':'true','traefik.docker.network':'cdc-coral-ingress',
    'traefik.http.routers.cdc-coral.rule':'Host(`n8n.orvekio.com`) && PathPrefix(`/editorial-ai/v1/jobs/`)',
    'traefik.http.routers.cdc-coral.entrypoints':'websecure',
    'traefik.http.routers.cdc-coral.tls':'true',
    'traefik.http.routers.cdc-coral.service':'cdc-coral',
    'traefik.http.services.cdc-coral.loadbalancer.server.port':'18678',
    'traefik.http.routers.cdc-coral.middlewares':'cdc-coral-allow@docker,cdc-coral-rate@docker,cdc-coral-flight@docker',
    'traefik.http.middlewares.cdc-coral-allow.ipallowlist.sourcerange':'192.0.2.10/32',
    'traefik.http.middlewares.cdc-coral-rate.ratelimit.average':'120',
    'traefik.http.middlewares.cdc-coral-rate.ratelimit.period':'1m',
    'traefik.http.middlewares.cdc-coral-rate.ratelimit.burst':'12',
    'traefik.http.middlewares.cdc-coral-flight.inflightreq.amount':'4'
  };c.services['coral-job-worker'].labels=l;
  assert.equal(validateCoralTraefikRoute(c).status,'PASS');
  for(const source of ['','0.0.0.0/0','::/0','10.0.0.0/8','192.0.2.10/23','not-an-ip','192.0.2.10/32,0.0.0.0/0']){
    const invalid=structuredClone(c);invalid.services['coral-job-worker'].labels[
      'traefik.http.middlewares.cdc-coral-allow.ipallowlist.sourcerange']=source;
    assert.throws(()=>validateCoralTraefikRoute(invalid),/SOURCES/);
  }
  for(const key of ['traefik.http.routers.cdc-coral.middlewares',
    'traefik.http.middlewares.cdc-coral-rate.ratelimit.average',
    'traefik.http.middlewares.cdc-coral-rate.ratelimit.period',
    'traefik.http.middlewares.cdc-coral-flight.inflightreq.amount']){
    const invalid=structuredClone(c);delete invalid.services['coral-job-worker'].labels[key];
    assert.throws(()=>validateCoralTraefikRoute(invalid));
  }
});
