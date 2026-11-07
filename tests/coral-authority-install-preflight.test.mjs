import test from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {coralAuthorityInstallPreflight} from '../scripts/coral-authority-install-preflight.mjs';import {audioSha} from '../scripts/coral-tts-audio.mjs';
test('local package verifies exact candidate and rollback, refuses drift or extra targets, and never authorizes deployment',async t=>{
 const root=await mkdtemp(join(tmpdir(),'cdc-coral-install-plan-'));t.after(()=>rm(root,{recursive:true,force:true}));const bytes=Buffer.from('public fixture only');
 const m={contract:'cdc-coral-authority-install-plan-v1',apply_authorized:false,production_writes:0,generation_enabled:false,openai_calls:0,files:{},dependencies:{'lib.php':{},'.htaccess':{}}};
 for(const d of ['CANDIDATE','ROLLBACK_PUBLIC'])await mkdir(join(root,d));
 for(const name of ['coral-v2-ai.php','index.php','publication-gap-audit.php']){for(const d of ['CANDIDATE','ROLLBACK_PUBLIC'])await writeFile(join(root,d,name),bytes);m.files[name]={before_sha256:audioSha(bytes),after_sha256:audioSha(bytes),before_bytes:bytes.length,after_bytes:bytes.length};}
 const save=()=>writeFile(join(root,'manifest.json'),JSON.stringify(m));await save();const p=await coralAuthorityInstallPreflight(root);assert.equal(p.remote_writes,0);assert.equal(p.installation_authorized,false);assert.equal(p.private_config_backup_required,true);
 await writeFile(join(root,'CANDIDATE','index.php'),'corrupt');await assert.rejects(coralAuthorityInstallPreflight(root),/HASH/);await writeFile(join(root,'CANDIDATE','index.php'),bytes);
 m.files['../../config.php']={};await save();await assert.rejects(coralAuthorityInstallPreflight(root),/INVALID/);delete m.files['../../config.php'];m.apply_authorized=true;await save();await assert.rejects(coralAuthorityInstallPreflight(root),/INVALID/);
});
