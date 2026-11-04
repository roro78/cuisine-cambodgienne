import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,chmod,rm,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {editorialJobRuntimeConfig} from '../scripts/editorial-ai-job-gateway.mjs';
import {readEditorialJobToken} from '../scripts/private-runtime-secret.mjs';

const token='synthetic-file-token-not-a-production-credential';
async function fixture(t){
  const root=await mkdtemp(join(tmpdir(),'cdc-runtime-'));
  t.after(()=>rm(root,{recursive:true,force:true}));
  const jobs=join(root,'jobs'),secret=join(root,'token');
  await mkdir(jobs,{mode:0o700});await writeFile(secret,token+'\n',{mode:0o400});
  return {root,jobs,secret,env:{CDC_EDITORIAL_JOB_SERVICE_ENABLED:'true',
    CDC_EDITORIAL_JOB_DIR:jobs,CDC_EDITORIAL_JOB_TOKEN_FILE:secret}};
}
test('loopback remains default; container binding uses a distinct private token file',async t=>{
  const {env}=await fixture(t);
  assert.equal(editorialJobRuntimeConfig(env).bindHost,'127.0.0.1');
  const cfg=editorialJobRuntimeConfig({...env,CDC_EDITORIAL_JOB_BIND_HOST:'0.0.0.0'});
  assert.equal(cfg.token,token);assert.equal(cfg.bindHost,'0.0.0.0');
  const legacy={...env,CDC_EDITORIAL_JOB_TOKEN_FILE:undefined,CDC_EDITORIAL_JOB_TOKEN:token};
  assert.equal(editorialJobRuntimeConfig(legacy).token,token);
  assert.throws(()=>editorialJobRuntimeConfig({...legacy,CDC_EDITORIAL_JOB_BIND_HOST:'0.0.0.0'}),/JOB_TOKEN_FILE_REQUIRED/);
  assert.throws(()=>editorialJobRuntimeConfig({...env,CDC_EDITORIAL_JOB_TOKEN:token}),/JOB_TOKEN_AMBIGUOUS/);
});
test('invalid listen address, store and external gates fail before startup',async t=>{
  const {env}=await fixture(t);
  assert.throws(()=>editorialJobRuntimeConfig({...env,CDC_EDITORIAL_JOB_SERVICE_ENABLED:'false'}),/JOB_SERVICE_DISABLED/);
  assert.throws(()=>editorialJobRuntimeConfig({...env,CDC_EDITORIAL_JOB_BIND_HOST:'192.0.2.1'}),/JOB_BIND_HOST/);
  assert.throws(()=>editorialJobRuntimeConfig({...env,CDC_EDITORIAL_JOB_DIR:'relative'}),/JOB_STORE_CONFIG/);
  assert.throws(()=>editorialJobRuntimeConfig({...env,CDC_EDITORIAL_JOB_PROVIDER:'other'}),/JOB_PROVIDER_KIND/);
  for(const enabled of [undefined,'false','true'])assert.throws(()=>editorialJobRuntimeConfig({
    ...env,CDC_EDITORIAL_JOB_PROVIDER:'openai-coral',CDC_CORAL_EXTERNAL_QUALIFIED:'false',
    CDC_CORAL_EXTERNAL_ENABLED:enabled}),/CORAL_EXTERNAL_NOT_APPROVED/);
});
test('restored state cannot start without an explicit review',async t=>{
  const {env,jobs}=await fixture(t);await writeFile(join(jobs,'.restore-review-required'),'{}',{mode:0o600});
  assert.throws(()=>editorialJobRuntimeConfig(env),/JOB_RESTORE_REVIEW_REQUIRED/);
});

test('external startup requires a distinct private writable budget directory',async t=>{
  const {env,root,jobs}=await fixture(t);
  const external={...env,CDC_EDITORIAL_JOB_PROVIDER:'openai-coral',
    CDC_CORAL_EXTERNAL_QUALIFIED:'true',CDC_CORAL_EXTERNAL_ENABLED:'true'};
  for(const dir of [undefined,'relative',jobs])assert.throws(()=>editorialJobRuntimeConfig({
    ...external,CDC_CORAL_EXTERNAL_BUDGET_DIR:dir}),/CORAL_BUDGET_STORE/);
  const budget=join(root,'budget');await mkdir(budget,{mode:0o700});
  const valid={...external,CDC_CORAL_EXTERNAL_BUDGET_DIR:budget};
  assert.equal(editorialJobRuntimeConfig(valid).providerKind,'openai-coral');
  if(process.platform!=='win32'){
    await chmod(budget,0o755);assert.throws(()=>editorialJobRuntimeConfig(valid),/CORAL_BUDGET_STORE/);
    await chmod(budget,0o500);assert.throws(()=>editorialJobRuntimeConfig(valid));
    await chmod(budget,0o700);
  }
});
test('token files reject whitespace, empty values, bad permissions and symlinks',async t=>{
  const {env,secret,root}=await fixture(t);
  await chmod(secret,0o600);await writeFile(secret,token+' \n');
  assert.throws(()=>readEditorialJobToken(env,'0.0.0.0'),/JOB_TOKEN_INVALID/);
  await writeFile(secret,'short');
  assert.throws(()=>readEditorialJobToken(env,'0.0.0.0'),/JOB_TOKEN_UNAVAILABLE/);
  await writeFile(secret,'sk-'+'synthetic'.repeat(8));
  assert.throws(()=>readEditorialJobToken(env,'0.0.0.0'),/JOB_TOKEN_INVALID/);
  await writeFile(secret,token);
  if(process.platform!=='win32'){
    await chmod(secret,0o644);assert.throws(()=>readEditorialJobToken(env,'0.0.0.0'),/JOB_TOKEN_UNAVAILABLE/);
    await chmod(secret,0o600);const link=join(root,'link');await symlink(secret,link);
    assert.throws(()=>readEditorialJobToken({...env,CDC_EDITORIAL_JOB_TOKEN_FILE:link},'0.0.0.0'),/JOB_TOKEN_UNAVAILABLE/);
    const fifo=join(root,'fifo');assert.equal(spawnSync('mkfifo',[fifo]).status,0);
    assert.throws(()=>readEditorialJobToken({...env,CDC_EDITORIAL_JOB_TOKEN_FILE:fifo},'0.0.0.0'),/JOB_TOKEN_UNAVAILABLE/);
    await chmod(env.CDC_EDITORIAL_JOB_DIR,0o755);assert.throws(()=>editorialJobRuntimeConfig(env),/JOB_STORE/);
  }
});
test('CLI startup errors do not disclose paths, file contents or environment values',async t=>{
  const {env,secret}=await fixture(t);
  const childEnv={...process.env};for(const key of Object.keys(childEnv))
    if(key.startsWith('CDC_EDITORIAL_')||key.startsWith('CDC_CORAL_')||key==='OPENAI_API_KEY')delete childEnv[key];
  const result=spawnSync(process.execPath,[fileURLToPath(new URL('../scripts/editorial-ai-job-gateway.mjs',import.meta.url))],{
    env:{...childEnv,...env,CDC_EDITORIAL_JOB_TOKEN:token},encoding:'utf8',timeout:10000});
  assert.equal(result.status,1);assert.equal(result.stderr,'JOB_STARTUP_REFUSED\n');
  assert.equal(result.stdout,'');assert.ok(!result.stderr.includes(secret));assert.ok(!result.stderr.includes(token));
});
