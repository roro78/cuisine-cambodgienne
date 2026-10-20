import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

const blueprintPath='src/data/atelier-recette-guides/lok-lak.json';
const previousManifestPath='src/data/atelier-recette-audio/lok-lak.json';
const v2ManifestPath='src/data/atelier-recette-audio/lok-lak-v2.json';
const v1Mp3Path='public/audio/workshops/lok-lak-de-la-poele-a-l-assiette/atelier-coral.mp3';

test('Lok Lak V2 : plan Coral hors ligne en petits segments, sept grandes phases',()=>{
  const out=execFileSync(process.execPath,['scripts/bridge-cooking-workshops-coral.mjs','--atelier=lok-lak','--plan'],{encoding:'utf8'});
  assert.match(out,/CORAL_OFFLINE_PLAN lok-lak-de-la-poele-a-l-assiette v2 \d+ segments/);
  const count=Number(out.match(/v2 (\d+) segments/)?.[1]);
  assert.ok(count>=14,'Une V2 détaillée ne tient pas dans les sept courtes pistes précédentes');
  const ids=['intro','installer','preparer','assembler','maitriser','rectifier','terminer'];
  for(const id of ids)assert.match(out,new RegExp('\\b'+id+':\\d+\\b'),'Plan includes '+id);
});

test('Le MP3 Lok Lak V1 reste une archive et ne prend jamais la place de la V2',()=>{
  const b=JSON.parse(readFileSync(blueprintPath,'utf8'));
  const old=JSON.parse(readFileSync(previousManifestPath,'utf8'));
  assert.equal(b.audio.storyboardVersion,2);
  assert.equal(old.sha256,b.audio.previousAsset.sha256);
  assert.ok(existsSync(v1Mp3Path),'Do not delete or replace original draft recording');
  if(b.audio.status==='script_only'){
    assert.equal(b.audio.asset,undefined,'Do not attach the old recording to the new lesson');
    assert.equal(existsSync(v2ManifestPath),false,'V2 manifest is not created before synthesis');
  }else{
    assert.equal(b.audio.asset.audioUrl,'/audio/workshops/lok-lak-de-la-poele-a-l-assiette/atelier-coral-v2.mp3');
    assert.ok(existsSync(v2ManifestPath),'V2 manifest must be distinct from the V1 one');
  }
});

test('Le feu vert TTS reste explicitement absent tant que la revue du cours est incomplete',()=>{
  const approval='docs/ateliers/GO-LOK-LAK-V2.txt';
  if(existsSync(approval)) {
    assert.equal(readFileSync(approval,'utf8').trim(),'APPROUVE-POUR-ENREGISTREMENT-LOK-LAK-V2','Only the explicit signed-off action may request paid TTS');
  }
  const workflow=readFileSync('.github/workflows/coral-lok-lak-v2-review.yml','utf8');
  const blueprint=JSON.parse(readFileSync(blueprintPath,'utf8'));
  const expectedCheckpoint='.tmp-cooking-coral/'+blueprint.slug+'/v2';
  assert.ok(workflow.includes(expectedCheckpoint),'Checkpoint path must match the real workshop slug');
  assert.equal(workflow.split(expectedCheckpoint).length-1,8,
    'One restore and seven chapter uploads must use the same source directory');
  assert.equal(workflow.includes('.tmp-cooking-coral/lok-lak/v2'),false,'Never use the short recipe slug for TTS tracks');
  assert.equal((workflow.match(/if-no-files-found: error/g)||[]).length,8,
    'Every checkpoint must fail visibly when missing');
  assert.match(workflow,/GO-LOK-LAK-V2[.]txt/);
  assert.match(workflow,/APPROUVE-POUR-ENREGISTREMENT-LOK-LAK-V2/);
  assert.doesNotMatch(workflow,/deploy|publish.*ovh/i,'No deployment in audio-only workflow');
});
