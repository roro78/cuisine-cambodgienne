import test from 'node:test';
import assert from 'node:assert/strict';
import {AMOK_TRACKS,amokChapterTimeline,releasePreflight} from '../scripts/prepare-amok-v4-audio-release.mjs';

test('Amok V4 seven exact MP3 byte sizes yield an unrounded 714.792 sec timeline',()=>{
 const plan=amokChapterTimeline();
 assert.equal(plan.bytes,11436672);
 assert.equal(plan.durationSec,714.792);
 assert.deepEqual(plan.chapters.map(c=>c.startSec),[
  0,67.68,198.6,298.272,417.936,533.52,635.064
 ]);
 assert.equal(plan.chapters.at(-1).endSec,714.792);
 assert.equal(AMOK_TRACKS.length,7);
 assert.equal(new Set(AMOK_TRACKS.map(t=>t.id)).size,7);
 assert.ok(AMOK_TRACKS.every(t=>/^[a-f0-9]{64}$/.test(t.sha256)
   &&/^[a-f0-9]{64}$/.test(t.textSha256)));
});

test('no partial or malformed seven-track manifest can masquerade as complete',()=>{
 assert.throws(()=>amokChapterTimeline(AMOK_TRACKS.slice(0,6)),/AMOK_CHAPTER_CONTRACT/);
 const bad=AMOK_TRACKS.map(t=>({...t}));
 bad[2].bytes+=1;
 assert.throws(()=>amokChapterTimeline(bad),/AMOK_CHAPTER_CONTRACT/);
 bad[2].bytes-=1;
 bad[0].id='unknown';
 assert.throws(()=>amokChapterTimeline(bad),/AMOK_CHAPTER_CONTRACT/);
});

test('publication preflight cannot run without explicit private directory',()=>{
 assert.throws(()=>releasePreflight({dir:'./'}),/AMOK_ABSOLUTE_PRIVATE_DIR_REQUIRED/);
});
