import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,chmod,symlink,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {readCoralOpenAISecret,CORAL_OPENAI_SECRET_PATH} from '../scripts/coral-openai-secret.mjs';

async function folder(t){
  const root=await mkdtemp(join(tmpdir(),'coral-docker-secret-'));
  t.after(()=>rm(root,{recursive:true,force:true}));
  return root;
}
const key='sk-proj-'+'a'.repeat(35);
test('default worker secret location is isolated from PHP Studio and Render',()=>{
  assert.equal(CORAL_OPENAI_SECRET_PATH,'/run/secrets/cdc_coral_openai_key');
});
test('dedicated Docker secret is read with final newline, without any log or network',async t=>{
  const dir=await folder(t),f=join(dir,'key');
  await writeFile(f,key+'\n',{mode:0o600,flag:'wx'});
  assert.equal(readCoralOpenAISecret(f),key);
  assert.equal(process.env.OPENAI_API_KEY,undefined);
});
test('missing, invalid, whitespace and unsafe secrets fail closed with generic errors',async t=>{
  const dir=await folder(t),f=join(dir,'secret'),link=join(dir,'link');
  assert.throws(()=>readCoralOpenAISecret(join(dir,'missing')),/CORAL_OPENAI_SECRET_UNAVAILABLE/);
  await writeFile(f,'sk-proj-invalid with spaces',{mode:0o600});
  assert.throws(()=>readCoralOpenAISecret(f),/CORAL_OPENAI_SECRET_INVALID/);
  await writeFile(f,key+' \n',{mode:0o600});
  assert.throws(()=>readCoralOpenAISecret(f),/CORAL_OPENAI_SECRET_INVALID/);
  await writeFile(f,key,{mode:0o600});
  await symlink(f,link);
  assert.throws(()=>readCoralOpenAISecret(link),/CORAL_OPENAI_SECRET_UNAVAILABLE/);
  if(process.platform!=='win32'){
    await chmod(f,0o666);
    assert.throws(()=>readCoralOpenAISecret(f),/CORAL_OPENAI_SECRET_UNAVAILABLE/);
  }
});
