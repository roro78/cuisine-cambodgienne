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
import { cmsReception, verifyCmsIndexes } from './check-cms-ovh-readiness.mjs';
import { isDeepStrictEqual } from 'node:util';

const filenames=[
 'social-feed.json',
 'editorial-source-index.json',
 'editorial-guided-fields.json',
 'gestion-contenus/index.php',
 'gestion-contenus/lib.php',
 'gestion-contenus/publication-gap-audit.php',
 'gestion-contenus/.htaccess',
 'gestion-contenus/atelier-narrations.json',
 'gestion-contenus/coral-v2-contract.json',
 'gestion-contenus/coral-v2-ai.php',
 'gestion-contenus/narrations-export.php'
];
const publicIndexes=filenames.slice(0,3);
const studioCode=['gestion-contenus/index.php','gestion-contenus/lib.php'];
/** An index-free Studio update is permitted only with an exact shared public
 * projection. The live index bytes are evidence, NEVER packaged. */
export async function verifyStudioReleaseCompatibility(dist,liveDir){
 const build={},live={},productionIndexes=[];
 for(const name of publicIndexes){
  for(const [dir,target] of [[dist,build],[liveDir,live]]){
   const raw=await readFile(join(dir,name));
   if(raw.length>524288)throw Error('INVALID_INDEX_SIZE');
   target[name]=JSON.parse(raw);
   if(target===live)productionIndexes.push({path:name,sha256:createHash('sha256').update(raw).digest('hex'),bytes:raw.length});
  }
 }
 const liveCounts=verifyCmsIndexes(live),buildCounts=verifyCmsIndexes(build);
 const extraIds=[];
 for(const name of publicIndexes){
  const indexed=new Map(build[name].items.map(item=>[item.id,item]));
  for(const item of live[name].items){
   if(!isDeepStrictEqual(indexed.get(item.id),item))throw Error('LIVE_INDEX_DIVERGENCE '+name+' '+item.id);
   indexed.delete(item.id);
  }
  if(name===publicIndexes[0])extraIds.push(...indexed.keys());
 }
 return {liveCounts,buildCounts,buildOnlyIds:extraIds.sort(),productionIndexes};
}
export async function packageCmsRelease({dist,out,liveDir}){
 const source=resolve(dist),destination=resolve(out);
 if(source===destination || destination.startsWith(source+'/'))throw Error('INVALID_DESTINATION');
 await cmsReception({dir:source});
 const studioOnly=liveDir!==undefined;
 const live=studioOnly?resolve(liveDir):null;
 if(studioOnly&&(destination===live||destination.startsWith(live+'/')||live.startsWith(destination+'/')))
  throw Error('INVALID_DESTINATION');
 const compatibility=studioOnly?await verifyStudioReleaseCompatibility(source,live):null;
 // Studio-only bundles must use a fresh output directory.
 if(!studioOnly)await rm(destination,{recursive:true,force:true});
 await mkdir(destination,{recursive:!studioOnly,mode:0o700});
 const selected=studioOnly?studioCode:filenames;
 const files=[];
 for(const filename of selected){
  const input=join(source,filename),output=join(destination,filename);
  const info=await stat(input);
  if(!info.isFile()||info.size>524288)throw Error('INVALID_FILE_'+filename);
  await mkdir(resolve(output,'..'),{recursive:true});
  await copyFile(input,output);
  const data=await readFile(output);
  files.push({path:filename,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')});
 }
 const manifest={
  contract:studioOnly?'cdc-ovh-studio-code-only-v1':'cdc-ovh-cms-bundle-v1',
  staticFiles:selected.length,
  ...(studioOnly?{compatibility}:{}),
  files,
  requires:{
   protocol:'https',
   php:'8.2+',
   credentialFile:'~/.cuisine-asset-portal/config.php',
   protectedDrafts:'~/.cuisine-asset-portal/editorial-drafts/',
   manualUpload:true,
   existingContentUntouched:true,
   ...(studioOnly?{publicIndexesUntouched:true,remoteBackupAndRestoreRequired:true}:{})
  },
  note:'No website-wide upload or automatic publication. Restore these exact files on failure.'
 };
 await writeFile(join(destination,'CMS-OVH-MANIFEST.json'),JSON.stringify(manifest,null,2)+'\n',{mode:0o600});
 await writeFile(join(destination,'README.txt'),
  studioOnly?
  'Cuisine du Cambodge — Studio code only (NO AUTO DEPLOY)\n'+
  'Only index.php and lib.php are in scope. Never upload the three public indexes, narration snapshot, assets, manifests or README.\n'+
  'Compare the actual remote files and dependencies first; BACK UP both files outside the webroot, verify their SHA256 and restore to an isolated directory before transfer.\n'+
  'Check the exact live index hashes in this manifest again before and after installation. Stop if they differ. No website-wide publication.\n':
  'Cuisine du Cambodge — CMS OVH scoped release (NO AUTO DEPLOY)\n'+
  'Transfer only the 3 root JSON indexes and 8 Studio files, including the protected Coral scripts in gestion-contenus/.\n'+
  'Before transfer, BACK UP any existing versions of these exact 11 files.\n'+
  'Require HTTPS, executable PHP and Apache denies for all private PHP helpers AND atelier-narrations.json; keep config outside webroot.\n'+
  'This package intentionally excludes optional AI adapters and never enables an AI provider.\n'+
  'Do not transfer CMS-OVH-MANIFEST.json or README.txt into the site webroot.\n'+
  'Do not trigger ovh-production full-site replacement or any n8n/Meta workflow.\n'+
  'After transfer run: node scripts/check-cms-ovh-readiness.mjs --url https://www.cuisine-du-cambodge.com/\n'+
  'On a failed login or index check, restore the backed-up files and block CMS access.\n',
  {mode:0o600});
 return manifest;
}
async function main(){
 const [dist,out,...rest]=process.argv.slice(2);
 const liveDir=rest.length===2&&rest[0]==='--studio-only'?rest[1]:undefined;
 if(!dist||!out||(rest.length&&!liveDir))throw Error('Usage: node package-cms-ovh-release.mjs DIST OUTPUT_DIR [--studio-only LIVE_INDEX_DIR]');
 const manifest=await packageCmsRelease({dist,out,liveDir});
 process.stdout.write('CMS_OVH_SCOPED_PACKAGE_READY '+JSON.stringify({
  files:manifest.staticFiles,destination:resolve(out)
 })+'\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{await main()}catch(e){process.stderr.write('CMS_OVH_PACKAGE_BLOCKED '+(e?.message||'UNKNOWN')+'\n');process.exitCode=1}
}
