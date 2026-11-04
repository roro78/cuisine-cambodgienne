import test from 'node:test';
import assert from 'node:assert/strict';
import {validateCoralCompose,validateCoralMaintenanceCompose} from '../scripts/validate-coral-compose.mjs';
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
