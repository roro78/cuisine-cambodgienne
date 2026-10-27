#!/usr/bin/env node
/**
 * Build an isolated CMS-only OVH release package. NO FTP, API calls or deploy.
 * Run only after Astro build: node scripts/package-cms-ovh-release.mjs dist /tmp/cms-ovh-bundle
 */
import { copyFile, mkdir, rm, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFile } from 'node:fs/promises';
import { cmsReception } from './check-cms-ovh-readiness.mjs';

const filenames=[
 'social-feed.json',
 'editorial-source-index.json',
 'editorial-guided-fields.json',
 'gestion-contenus/index.php',
 'gestion-contenus/lib.php',
 'gestion-contenus/.htaccess'
];
export async function packageCmsRelease({dist,out}){
 const source=resolve(dist),destination=resolve(out);
 if(source===destination || destination.startsWith(source+'/'))throw Error('INVALID_DESTINATION');
 await cmsReception({dir:source});
 await rm(destination,{recursive:true,force:true});
 await mkdir(destination,{recursive:true,mode:0o700});
 const files=[];
 for(const filename of filenames){
  const input=join(source,filename),output=join(destination,filename);
  const info=await stat(input);
  if(!info.isFile()||info.size>524288)throw Error('INVALID_FILE_'+filename);
  await mkdir(resolve(output,'..'),{recursive:true});
  await copyFile(input,output);
  const data=await readFile(output);
  files.push({path:filename,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')});
 }
 const manifest={
  contract:'cdc-ovh-cms-bundle-v1',
  staticFiles:filenames.length,
  files,
  requires:{
   protocol:'https',
   php:'8.2+',
   credentialFile:'~/.cuisine-asset-portal/config.php',
   protectedDrafts:'~/.cuisine-asset-portal/editorial-drafts/',
   manualUpload:true,
   existingContentUntouched:true
  },
  note:'No website-wide upload or automatic publication. Restore these exact files on failure.'
 };
 await writeFile(join(destination,'CMS-OVH-MANIFEST.json'),JSON.stringify(manifest,null,2)+'\n',{mode:0o600});
 await writeFile(join(destination,'README.txt'),
  'Cuisine du Cambodge — CMS OVH scoped release (NO AUTO DEPLOY)\n'+
  'Transfer only the 3 root JSON indexes and the 3 files in gestion-contenus/.\n'+
  'Before transfer, BACK UP any existing versions of these exact 6 files.\n'+
  'Require HTTPS and PHP execution, Apache deny for lib.php, private config outside webroot.\n'+
  'Do not transfer CMS-OVH-MANIFEST.json or README.txt into the site webroot.\n'+
  'Do not trigger ovh-production full-site replacement or any n8n/Meta workflow.\n'+
  'After transfer run: node scripts/check-cms-ovh-readiness.mjs --url https://www.cuisine-du-cambodge.com/\n'+
  'On a failed login or index check, restore the 6 backed-up files and block CMS access.\n',
  {mode:0o600});
 return manifest;
}
async function main(){
 const [dist,out,...rest]=process.argv.slice(2);
 if(!dist||!out||rest.length)throw Error('Usage: node package-cms-ovh-release.mjs DIST OUTPUT_DIR');
 const manifest=await packageCmsRelease({dist,out});
 process.stdout.write('CMS_OVH_SCOPED_PACKAGE_READY '+JSON.stringify({
  files:manifest.staticFiles,destination:resolve(out)
 })+'\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{await main()}catch(e){process.stderr.write('CMS_OVH_PACKAGE_BLOCKED '+(e?.message||'UNKNOWN')+'\n');process.exitCode=1}
}
