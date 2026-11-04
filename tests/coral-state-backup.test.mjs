import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,stat,rm,chmod,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createCipheriv,randomBytes} from 'node:crypto';
import {backupCoralState,restoreCoralState} from '../scripts/coral-state-backup.mjs';
import {editorialJobRuntimeConfig,createJobGateway} from '../scripts/editorial-ai-job-gateway.mjs';
const id='a'.repeat(48),token='synthetic-backup-job-token-not-production';
const request={contract:'cdc-editorial-ai-content-request-v1',scope:'creation-form-core-v1',
  brief:{kind:'culture',title:'Synthetic restore fixture'},response_schema:{type:'object',additionalProperties:false},
  timeout_seconds:20,max_output_tokens:6000,response_max_bytes:30000};
async function fixture(t){
  const root=await mkdtemp(join(tmpdir(),'cdc-backup-'));t.after(()=>rm(root,{recursive:true,force:true}));
  const state=join(root,'state'),keyFile=join(root,'backup-key'),archive=join(root,'state.enc');
  await mkdir(state,{mode:0o700});for(const d of ['jobs','budget','config'])await mkdir(join(state,d),{mode:0o700});
  await writeFile(keyFile,'a'.repeat(64),{mode:0o400});
  await writeFile(join(state,'budget','budget-test.json'),JSON.stringify({requests:[{jobId:id,reservedUsd:0.01,state:'unknown-after-reservation'}]}),{mode:0o600});
  await writeFile(join(state,'config','runtime.json'),'{"source":"synthetic"}',{mode:0o600});
  return {root,state,keyFile,archive,options:{stateDir:state,keyFile,archive,offline:true}};
}
test('encrypted restore preserves reservations and started jobs, and seals startup',async t=>{
  const f=await fixture(t);let calls=0;
  const gateway=await createJobGateway({root:join(f.state,'jobs'),token,provider:async()=>{calls++;return '{}';}});
  await gateway.submit(id,request);await writeFile(join(f.state,'jobs',id,'started.json'),'{}',{mode:0o600});
  await backupCoralState(f.options);
  const encrypted=await readFile(f.archive,'utf8');assert.ok(!encrypted.includes('reservedUsd'));assert.ok(!encrypted.includes('Synthetic restore'));
  const restored=join(f.root,'restored');
  assert.equal((await restoreCoralState({...f.options,stateDir:restored})).status,'RESTORED_REVIEW_REQUIRED');
  assert.equal(await readFile(join(restored,'budget','budget-test.json'),'utf8'),await readFile(join(f.state,'budget','budget-test.json'),'utf8'));
  assert.throws(()=>editorialJobRuntimeConfig({CDC_EDITORIAL_JOB_SERVICE_ENABLED:'true',CDC_EDITORIAL_JOB_DIR:join(restored,'jobs'),CDC_EDITORIAL_JOB_TOKEN:token}),/JOB_RESTORE_REVIEW_REQUIRED/);
  const after=await createJobGateway({root:join(restored,'jobs'),token,provider:async()=>{calls++;return '{}';}});
  assert.equal((await after.state(id)).status,'failed');await after.workOnce();assert.equal(calls,0);
  if(process.platform!=='win32'){
    assert.equal((await stat(restored)).mode&0o777,0o700);
    assert.equal((await stat(join(restored,'budget','budget-test.json'))).mode&0o777,0o600);
    assert.equal((await stat(f.archive)).mode&0o777,0o600);
  }
  await assert.rejects(restoreCoralState({...f.options,stateDir:restored}),/TARGET_EXISTS/);
});
test('wrong key, tampering and existing archives fail without replacing data',async t=>{
  const f=await fixture(t);await backupCoralState(f.options);
  await assert.rejects(backupCoralState(f.options),/EEXIST/);
  const wrong=join(f.root,'wrong');await writeFile(wrong,'b'.repeat(64),{mode:0o400});
  await assert.rejects(restoreCoralState({...f.options,keyFile:wrong,stateDir:join(f.root,'bad')}),/CORAL_BACKUP_INVALID/);
  const obj=JSON.parse(await readFile(f.archive,'utf8'));obj.tag='0'.repeat(32);await writeFile(f.archive,JSON.stringify(obj),{mode:0o600});
  await assert.rejects(restoreCoralState({...f.options,stateDir:join(f.root,'bad')}),/CORAL_BACKUP_INVALID/);
});
test('offline confirmation, secret namespaces and unsafe filesystem entries are refused',async t=>{
  const f=await fixture(t);
  await assert.rejects(backupCoralState({...f.options,offline:false}),/OFFLINE_REQUIRED/);
  await mkdir(join(f.state,'secrets'),{mode:0o700});
  await assert.rejects(backupCoralState(f.options),/CORAL_BACKUP_PATH/);
  await rm(join(f.state,'secrets'),{recursive:true});
  if(process.platform!=='win32'){
    await chmod(join(f.state,'budget','budget-test.json'),0o644);
    await assert.rejects(backupCoralState(f.options),/PERMISSIONS/);
    await chmod(join(f.state,'budget','budget-test.json'),0o600);
    await symlink(f.keyFile,join(f.state,'jobs','link'));
    await assert.rejects(backupCoralState(f.options),/PERMISSIONS/);
  }
});
test('authenticated malformed manifests cannot traverse outside the new restore target',async t=>{
  const f=await fixture(t),iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',Buffer.from('a'.repeat(64),'hex'),iv);
  cipher.setAAD(Buffer.from('cdc-coral-state-backup-v1'));
  const data=Buffer.concat([cipher.update(JSON.stringify({format:'cdc-coral-state-backup-v1',entries:[{path:'../escape',type:'directory'}]})),cipher.final()]);
  await writeFile(f.archive,JSON.stringify({format:'cdc-coral-state-backup-v1',iv:iv.toString('hex'),tag:cipher.getAuthTag().toString('hex'),data:data.toString('base64')}),{mode:0o600});
  await assert.rejects(restoreCoralState({...f.options,stateDir:join(f.root,'new')}),/CORAL_BACKUP_PATH/);
});
