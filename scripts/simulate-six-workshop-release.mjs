/**
 * Simulates a future approved release ONLY within this transient CI checkout.
 * Never changes a git ref, credential, n8n workflow, Meta account or OVH branch.
 * Synthetic approvals are strictly test fixtures, not real-world attestations.
 * All six guide bytes and the original dist/ are restored in finally.
 */
import assert from 'node:assert/strict';
import {existsSync,readFileSync,writeFileSync,renameSync,rmSync,copyFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
const slugs=['kroeung-jaune','lok-lak','samlor-machu','num-banh-chok','kuy-teav','bai-sach-chrouk'];
// If the owner-authorized real release is already built, verify it directly.
// The isolated draft simulation below remains available for future drafts.
const actual=slugs.map(slug=>JSON.parse(readFileSync('src/data/atelier-recette-guides/'+slug+'.json','utf8')));
if(actual.every(guide=>guide.status==='release_ready')){
  assert.ok(actual.every(guide=>guide.releaseAuthorization?.ownerApproved===true),'Missing owner authorization');
  assert.ok(existsSync('dist/sitemap.xml'),'Build output missing');
  execFileSync(process.execPath,['scripts/check-workshop-cutover.mjs'],{stdio:'inherit',timeout:120000});
  console.log('WORKSHOP_RELEASE_SIMULATION_PASS — owner-authorized release candidate verified, no fake QA');
  process.exit(0);
}
const saved=new Map();
const dist=path.resolve('dist');
const backup=path.resolve('dist.workshop-simulation-backup');
assert.ok(!existsSync(backup),'Refusing to replace an existing simulation backup');
const hadDist=existsSync(dist);
const run=(cmd,...args)=>execFileSync(cmd,args,{stdio:'inherit',timeout:7*60*1000});
try{
  if(hadDist)renameSync(dist,backup);
  for(const slug of slugs){
    const filename='src/data/atelier-recette-guides/'+slug+'.json';
    const data=readFileSync(filename,'utf8'); saved.set(filename,data);
    const obj=JSON.parse(data);
    assert.equal(obj.status,'draft','Simulation requires real guides to remain drafts');
    assert.equal(obj.review.productionApproved,false,'Real release approval cannot pre-exist');
    assert.equal(obj.media.imageValidated,true,'Use pre-approved illustrations');
    assert.ok(obj.media.finishedPreparationImage);
    obj.status='release_ready'; obj.audio.status='validated';
    for(const key of Object.keys(obj.review))obj.review[key]=true;
    obj.media.rightsValidated=true; // Test-only fixture: not an actual license validation.
    writeFileSync(filename,JSON.stringify(obj,null,2)+'\n');
  }
  run('npm','run','build');
  copyFileSync('public/.htaccess','dist/.htaccess');
  for(const job of [
    'scripts/build-workshop-redirects.mjs',
    'scripts/prune-legacy-workshop-audio.mjs',
    'scripts/check-seo-legacy-redirects.mjs',
    'scripts/check-seo-sitemap-integrity.mjs',
    'scripts/check-workshop-cutover.mjs'
  ])run(process.execPath,job);
  // The new pages are indexable and every historical workshop file absent.
  for(const slug of slugs){
    const guide=JSON.parse(readFileSync('src/data/atelier-recette-guides/'+slug+'.json','utf8'));
    const route=slug==='kroeung-jaune'?'kroeung-jaune':guide.slug;
    const html=readFileSync('dist/apprendre/pratique/'+route+'/index.html','utf8');
    assert.doesNotMatch(html,/<meta name="robots" content="noindex/);
    assert.ok(html.includes(guide.media.finishedPreparationImage),'Selected image not displayed '+slug);
    assert.ok(html.includes(guide.audio.asset.audioUrl),'Approved audio not displayed '+slug);
  }
  console.log('WORKSHOP_RELEASE_SIMULATION_PASS — 6/6 indexable, legacy 301 + MP3 pruned, social switched');
}finally{
  for(const [filename,content] of saved)writeFileSync(filename,content);
  if(existsSync(dist))rmSync(dist,{recursive:true,force:true});
  if(hadDist)renameSync(backup,dist);
  console.log('WORKSHOP_RELEASE_SIMULATION_RESTORED — original draft flags and dist');
}
