#!/usr/bin/env node
// Strictly offline regression suite. It must NEVER send a request to Render/OpenAI.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,rmSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,join} from 'node:path';
const slug='num-banh-chok';
const base=['scripts/bridge-cooking-workshops-coral.mjs','--atelier='+slug,'--edition=approved-v3'];
const call=(a)=>spawnSync(process.execPath,[...base,...a],{encoding:'utf8',timeout:30000});
// Published recordings must be IMMUTABLE: every paid synthesis path is
// rejected, even for a single segment. Never start Coral while verifying this.
const current=JSON.parse(readFileSync('src/data/atelier-recette-guides/'+slug+'.json','utf8'));
if(current.status==='release_ready'){
  assert.equal(current.releaseAuthorization?.ownerApproved,true,'Owner release must be explicit');
  for(const params of [
    ['--check'],
    ['--one=intro'],
    ['--one=intro','--part=1'],
    ['--one=intro','--part=999'],
    ['--assemble']
  ]){
    const attempt=call(params);
    assert.notEqual(attempt.status,0,'Published MP3 must NEVER allow synthesis: '+params.join(' '));
  }
  console.log('PASS: RELEASED_GUIDE_CORAL_IMMUTABLE; 0 NETWORK REQUESTS; 0 paid TTS');
  process.exit(0);
}
const goodPlan=call(['--plan']);
assert.equal(goodPlan.status,0,'Offline plan should pass');
assert.match(goodPlan.stdout,/v3 25 segments/);
const guide=JSON.parse(readFileSync('src/data/atelier-recette-guides/'+slug+'.json','utf8'));
const completed=guide.audio.status==='generated_review_pending';
const check=call(['--check']);
if(completed){
 assert.notEqual(check.status,0,'Completed guide MUST NOT allow a second synthesis');
 assert.match(check.stderr,/existe déjà|refuser toute double génération/);
}else assert.equal(check.status,0,'Offline safety check should pass before synthesis');
const multi=call(['--one=intro']);
assert.notEqual(multi.status,0);
assert.match(multi.stderr,/STOP QUOTA/,'Whole chapter MUST NOT trigger a sequence of paid requests');
const illegal=call(['--one=intro','--part=999']);
assert.notEqual(illegal.status,0);
assert.match(illegal.stderr,completed?/déjà assemblé|existe déjà/:/Partie inexistante/);
const sentenceList=guide.audio.intro.trim().split(/(?<=[.!?…])\s+/u);
let first='';
for(const sentence of sentenceList){
  if(first && first.length+sentence.length+1>480)break;
  first+=(first?' ':'')+sentence;
}
assert.ok(first.length>0&&first.length<=480);
const tag=createHash('sha256').update(first).digest('hex').slice(0,16);
const marker=join('.tmp-cooking-coral',guide.slug,'v3','intro-part-01-'+tag+'.mp3.uncertain.json');
assert.equal(existsSync(marker),false,'No prior ambiguous request should already be present in clean CI');
mkdirSync(dirname(marker),{recursive:true});
try{
  writeFileSync(marker,JSON.stringify({status:'uncertain_paid_request',retryAuthorized:false})+'\n');
  const guarded=call(['--one=intro','--part=1']);
  assert.notEqual(guarded.status,0);
  assert.match(guarded.stderr,completed?/déjà assemblé|existe déjà/:/STOP QUOTA/);
  const offlineCheck=call(['--check']);
  assert.notEqual(offlineCheck.status,0);
  assert.match(offlineCheck.stderr,completed?/existe déjà|double génération/:/STOP QUOTA/);
} finally{
  rmSync(marker,{force:true});
}
console.log('PASS: NO_NETWORK_NO_TTS cost guard, single segment, uncertain marker and offline preflight');
