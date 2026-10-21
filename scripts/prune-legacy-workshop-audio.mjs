// Prune only deployment copies of superseded Coral MP3s after six approved guides
// are built, routed, indexed and redirected. Source assets stay untouched.
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, unlinkSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { legacyWorkshopAudioPaths, legacyWorkshopRedirects, workshopCutoverApproved, workshopRedirectRule } from './workshop-cutover-seo.mjs';

if (!workshopCutoverApproved()) {
  console.log('PASS: draft cutover; historic MP3s retained in deployment build');
  process.exit(0);
}

const DIST=resolve('dist');
const apache=readFileSync(join(DIST,'.htaccess'),'utf8');
const textExtensions=new Set(['.html','.xml','.json','.js','.css','.txt','.webmanifest']);
const scan=(directory, files=[])=>{
  for(const entry of readdirSync(directory,{withFileTypes:true})){
    const p=join(directory,entry.name);
    if(entry.isDirectory())scan(p,files);
    else if([...textExtensions].some(extension=>p.endsWith(extension)))files.push(p);
  }
  return files;
};
for(const [slug,target] of legacyWorkshopRedirects){
  assert.ok(!existsSync(join(DIST,'apprendre',slug,'index.html')),'Historic page still published: '+slug);
  assert.ok(existsSync(join(DIST,target.replace(/^\//,''),'index.html')),'Redirect destination missing: '+target);
  assert.ok(apache.includes(workshopRedirectRule(slug,target)),'Permanent redirect missing: '+slug);
}
const files=scan(DIST);
for(const media of legacyWorkshopAudioPaths){
  const oldAsset=resolve(DIST,media.slice(1));
  assert.ok(oldAsset.startsWith(DIST+'/'),'Unexpected audio path');
  for(const file of files){
    if(readFileSync(file,'utf8').includes(media))
      throw Error('Refusing to remove still-referenced MP3 '+media+' referenced by '+file);
  }
  if(existsSync(oldAsset)){
    assert.ok(statSync(oldAsset).isFile(),'Historic MP3 path is not a file '+media);
    unlinkSync(oldAsset);
  }
}
console.log('PASS: six unreferenced superseded MP3s excluded from release build; approved audio untouched');
