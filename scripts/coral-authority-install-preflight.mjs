/** Local package verifier ONLY. Cannot connect, copy to a host, start a service or apply config. */
import {readFile} from 'node:fs/promises';import {join} from 'node:path';import {createHash} from 'node:crypto';import {pathToFileURL} from 'node:url';
const targets=['coral-v2-ai.php','index.php','publication-gap-audit.php'];
export async function coralAuthorityInstallPreflight(folder){
 const m=JSON.parse(await readFile(join(folder,'manifest.json'),'utf8'));
 if(m.contract!=='cdc-coral-authority-install-plan-v1'||m.apply_authorized!==false||m.production_writes!==0||m.generation_enabled!==false||m.openai_calls!==0
  ||Object.keys(m.files||{}).sort().join(',')!==targets.join(',')||Object.keys(m.dependencies||{}).sort().join(',')!=='.htaccess,lib.php')throw Error('INSTALL_PLAN_INVALID');
 for(const name of targets){const p=m.files[name];if(!/^[a-f0-9]{64}$/.test(p.before_sha256||'')||!/^[a-f0-9]{64}$/.test(p.after_sha256||''))throw Error('INSTALL_PLAN_INVALID');
  for(const [directory,prefix] of [['CANDIDATE','after'],['ROLLBACK_PUBLIC','before']]){const bytes=await readFile(join(folder,directory,name));
   if(createHash('sha256').update(bytes).digest('hex')!==p[prefix+'_sha256']||bytes.length!==p[prefix+'_bytes'])throw Error('INSTALL_PACKAGE_HASH');}
 }
 return {status:'LOCAL_PACKAGE_VERIFIED',target_files:targets,remote_writes:0,ready_for_scope_authorization:true,
  remote_hash_readback_required:true,private_config_backup_required:true,installation_authorized:false,generation_authorized:false};
}
/** Public source payload only. Never exports observed host hashes, modes, paths or config. */
export async function coralAuthorityDeliveryManifest(folder){
 await coralAuthorityInstallPreflight(folder);const files=[];
 for(const name of targets){const bytes=await readFile(join(folder,'CANDIDATE',name));files.push({repo_path:'public/gestion-contenus/'+name,sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length});}
 return {contract:'cdc-coral-authority-delivery-redacted-v1',public_payload_source_sha:'0d5a688f7184d556a51dd1981593300d9421826b',
  files,dependencies:[{repo_path:'public/gestion-contenus/lib.php',delivery:'unchanged'},{repo_path:'public/gestion-contenus/.htaccess',delivery:'unchanged'}],
  php_qualification:['8.3','8.4'],permissions:{public_files:'preserve verified target modes',private_directory:'0700',private_token:'0600 or 0400; effective owner; readonly mount'},
  private_configuration:'not included',host_details_included:false,observed_host_hashes_included:false,
  authorization:{delivery:false,authority_activation:false,secret_creation:false,worker_installation:false,paid_calls:false},
  before_any_write:['new targeted authorization','fresh private host readback','verified rollback outside webroot'],
  reception:['HTTPS and distinct Bearer','fresh challenge','current version and revocable rights','network failure closed','generation remains disabled']};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 if(!['--verify-local','--manifest-redacted'].includes(process.argv[2])||process.argv.length!==4)throw Error('INSTALL_APPLY_DISABLED');
 console.log(JSON.stringify(await (process.argv[2]==='--verify-local'?coralAuthorityInstallPreflight:coralAuthorityDeliveryManifest)(process.argv[3])));
}
