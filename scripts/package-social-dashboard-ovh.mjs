import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
export const socialDashboardFiles=Object.freeze(['index.php','catalog-readonly.php','n8n-wait-readonly.php','diagnostic-cli.php','.htaccess']);
export async function packageSocialDashboard({commit,output}){
 if(!/^[a-f0-9]{40}$/.test(commit))throw Error('SOURCE_COMMIT_REQUIRED');
 const blobs=socialDashboardFiles.map(name=>({name,bytes:execFileSync('git',['show',commit+':public/gestion-social/'+name])}));
 const dir=resolve(output);await mkdir(dir);await mkdir(join(dir,'gestion-social'));
 const files=[];
 for(const {name,bytes} of blobs){
  await writeFile(join(dir,'gestion-social',name),bytes,{flag:'wx',mode:0o600});
  files.push({source:'public/gestion-social/'+name,destination:'gestion-social/'+name,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
 }
 const manifest={commit,status:'PREPARED_NOT_TRANSFERRED_NOT_RECEIVED',files,private_configuration_included:false,
  requirements:['PHP >= 8.1','pdo_pgsql','curl','HTTPS/session/CSRF','private config outside webroot','SELECT-only role and RLS verified by diagnostic-cli.php'],
  activation_gate:'social_dashboard_received must remain absent/false until real private reception',rollback:'Back up the current directory if present. Restore only verified backups; do not remove user files.'};
 await writeFile(join(dir,'MANIFEST.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx',mode:0o600});
 return manifest;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [commit,output]=process.argv.slice(2);if(!output)throw Error('USAGE_COMMIT_OUTPUT');
 const manifest=await packageSocialDashboard({commit,output});console.log('SOCIAL_PACKAGE_PREPARED '+JSON.stringify({commit,files:manifest.files.length,transferred:false}));
}
