import test from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {coralAuthorityInstallPreflight,coralAuthorityDeliveryManifest} from '../scripts/coral-authority-install-preflight.mjs';import {audioSha} from '../scripts/coral-tts-audio.mjs';
import {execFileSync} from 'node:child_process';
test('local package verifies exact candidate and rollback, refuses drift or extra targets, and never authorizes deployment',async t=>{
 const root=await mkdtemp(join(tmpdir(),'cdc-coral-install-plan-'));t.after(()=>rm(root,{recursive:true,force:true}));const bytes=Buffer.from('public fixture only');
 const m={contract:'cdc-coral-authority-install-plan-v1',apply_authorized:false,production_writes:0,generation_enabled:false,openai_calls:0,files:{},dependencies:{'lib.php':{},'.htaccess':{}}};
 for(const d of ['CANDIDATE','ROLLBACK_PUBLIC'])await mkdir(join(root,d));
 for(const name of ['coral-v2-ai.php','index.php','publication-gap-audit.php']){for(const d of ['CANDIDATE','ROLLBACK_PUBLIC'])await writeFile(join(root,d,name),bytes);m.files[name]={before_sha256:audioSha(bytes),after_sha256:audioSha(bytes),before_bytes:bytes.length,after_bytes:bytes.length};}
 const save=()=>writeFile(join(root,'manifest.json'),JSON.stringify(m));await save();const p=await coralAuthorityInstallPreflight(root);assert.equal(p.remote_writes,0);assert.equal(p.installation_authorized,false);assert.equal(p.private_config_backup_required,true);
 m.files['index.php'].host_private_path='not-for-publication';m.dependencies['lib.php'].observed_host='not-for-publication';await save();
 const redacted=await coralAuthorityDeliveryManifest(root);assert.equal(redacted.files.length,3);assert.equal(redacted.host_details_included,false);assert.ok(Object.values(redacted.authorization).every(v=>v===false));assert.ok(!JSON.stringify(redacted).includes('not-for-publication'));assert.ok(!JSON.stringify(redacted).includes('before_sha256'));
 await writeFile(join(root,'CANDIDATE','index.php'),'corrupt');await assert.rejects(coralAuthorityInstallPreflight(root),/HASH/);await writeFile(join(root,'CANDIDATE','index.php'),bytes);
 m.files['../../config.php']={};await save();await assert.rejects(coralAuthorityInstallPreflight(root),/INVALID/);delete m.files['../../config.php'];m.apply_authorized=true;await save();await assert.rejects(coralAuthorityInstallPreflight(root),/INVALID/);
});
test('published redacted delivery manifest binds exactly three canonical Git PHP files without host state',async()=>{
 const m=JSON.parse(await readFile('deploy/coral/authority-delivery.redacted.json','utf8'));assert.equal(m.contract,'cdc-coral-authority-delivery-redacted-v1');assert.equal(m.files.length,3);
 assert.deepEqual(m.files.map(f=>f.repo_path).sort(),['coral-v2-ai.php','index.php','publication-gap-audit.php'].map(n=>'public/gestion-contenus/'+n));
 for(const file of m.files){const bytes=execFileSync('git',['show','HEAD:'+file.repo_path],{windowsHide:true});assert.equal(audioSha(bytes),file.sha256);assert.equal(bytes.length,file.bytes);}
 assert.equal(m.host_details_included,false);assert.equal(m.observed_host_hashes_included,false);assert.ok(Object.values(m.authorization).every(v=>v===false));
});
