#!/usr/bin/env node
/**
 * Fail-closed guard for the legacy full-site OVH publisher.
 * The GitHub->OVH webhook is live; changing ovh-production changes production.
 * The full Astro dist currently contains PHP and CMS indexes that are installed
 * separately on OVH. Never accidentally overwrite them through a site release.
 */
import { lstat, readdir } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

export const ovhProtectedPrefixes = Object.freeze([
  'gestion-contenus/',
  'gestion-social/',
  'gestion-visuels/',
  '.cuisine-asset-portal/',
  'editorial-drafts/',
  'editorial-visuals/'
]);
export const ovhProtectedFiles = Object.freeze([
  'social-feed.json',
  'editorial-source-index.json',
  'editorial-guided-fields.json'
]);

export function ovhIsProtectedPath(input) {
  if (typeof input !== 'string' || input.startsWith('/') || input.includes('\\')
      || input.split('/').some(x => x === '..' || x === '.' || x === ''))
    throw new Error('OVH_INVALID_FILE_PATH');
  return ovhProtectedPrefixes.some(prefix => input.startsWith(prefix))
    || ovhProtectedFiles.includes(input)
    || input.split('/').some(segment => segment === '.env'
      || segment.startsWith('.env.') || segment === 'config.php');
}

export function ovhAuditPaths(paths) {
  if (!Array.isArray(paths) || paths.some(p => typeof p !== 'string'))
    throw new Error('OVH_INVALID_MANIFEST');
  const blocked = [];
  for (const path of paths) {
    if (ovhIsProtectedPath(path)) blocked.push(path);
  }
  return {passed: blocked.length === 0, blocked: blocked.sort()};
}

export async function ovhScanDist(dir) {
  const root=resolve(dir);
  if (!(await lstat(root)).isDirectory()) throw new Error('OVH_DIST_NOT_DIRECTORY');
  const files=[];
  async function walk(folder) {
    for(const item of await readdir(folder, {withFileTypes:true})) {
      const full=join(folder,item.name);
      const meta=await lstat(full);
      if(meta.isSymbolicLink()) throw new Error('OVH_SYMLINK_IN_DIST');
      if(meta.isDirectory()) {await walk(full);continue;}
      if(!meta.isFile()) throw new Error('OVH_INVALID_DIST_ENTRY');
      const name=relative(root,full).split(sep).join('/');
      if(!name||name.startsWith('../')) throw new Error('OVH_PATH_OUTSIDE_DIST');
      files.push(name);
    }
  }
  await walk(root);
  return ovhAuditPaths(files);
}
async function main() {
  const args=process.argv.slice(2);
  if(args.length!==1) throw new Error('USAGE: node scripts/check-ovh-publish-scope.mjs DIST');
  const result=await ovhScanDist(args[0]);
  if (!result.passed) {
    process.stderr.write('OVH_FULL_PUBLISH_BLOCKED: private CMS or coupled indexes would be deployed by the full-site workflow. Use the scoped 7-file CMS release after verified OVH backup.\n');
    process.stderr.write('Protected paths ('+result.blocked.length+'): '+result.blocked.slice(0,12).join(', ')+'\n');
    process.exitCode=1;
  } else {
    process.stdout.write('OVH_FULL_PUBLISH_SCOPE_PASS: no protected CMS or index files in candidate\n');
  }
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  try{await main()}catch(e){process.stderr.write('OVH_FULL_PUBLISH_SCOPE_ERROR: '+String(e?.message||'unknown')+'\n');process.exitCode=1}
}
