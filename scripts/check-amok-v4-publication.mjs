#!/usr/bin/env node
/** Amok Trey v4 publication gate. No API calls, writes, or synthetic audio. */
import {createHash} from 'node:crypto';
import {existsSync,readFileSync,readdirSync,statSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {AMOK_TRACKS,amokChapterTimeline} from './prepare-amok-v4-audio-release.mjs';

const root=fileURLToPath(new URL('..',import.meta.url));
const relativeFile=(...paths)=>join(root,...paths);
const blueprint=relativeFile('src','data','atelier-recette-guides','amok-trey.json');
const manifest=relativeFile('src','data','atelier-recette-audio','amok-trey-v4.json');
const audioDir=relativeFile('public','audio','workshops','atelier-pratique-amok-trey');
const audio=join(audioDir,'atelier-coral-v4.mp3');
const url='/audio/workshops/atelier-pratique-amok-trey/atelier-coral-v4.mp3';
const SHA='177ccaad9b45a18c11270d9a949e8d19f55516e8e045745615d32f5c2d4bceff';
const BYTES=11436672;
const fail=message=>{throw Error('AMOK_RELEASE_NO_GO: '+message)};
const digest=value=>createHash('sha256').update(value).digest('hex');
const expected=amokChapterTimeline();
const expectedIds=AMOK_TRACKS.map(t=>t.id);
const hasAudioDir=existsSync(audioDir);
const publicFiles=hasAudioDir?readdirSync(audioDir):[];

if(!existsSync(blueprint)){
  if(existsSync(manifest)||publicFiles.length)
    fail('private or unapproved Amok audio accidentally staged in public code');
  console.log('AMOK_RELEASE_PENDING: no public blueprint, no public media; historical workshops unchanged.');
  process.exit(0);
}

const guide=JSON.parse(readFileSync(blueprint,'utf8'));
if(guide.sourceRecipeSlug!=='amok-trey'||guide.slug!=='atelier-pratique-amok-trey'||
   guide.kind!=='cooking-workshop'||guide.schemaVersion!==1)
  fail('wrong Amok blueprint identity');

if(guide.status!=='release_ready'){
  if(existsSync(manifest)||publicFiles.length)
    fail('draft/review must not introduce publicly accessible Amok audio');
  console.log('AMOK_RELEASE_PENDING: blueprint not approved for public release.');
  process.exit(0);
}

if(publicFiles.length!==1||publicFiles[0]!=='atelier-coral-v4.mp3')
  fail('release must publish only the verified integral MP3, not private fragments/ZIP');
if(!existsSync(manifest)||!existsSync(audio))
  fail('published audio/manifest missing');

const m=JSON.parse(readFileSync(manifest,'utf8'));
if(m.atelier!==guide.slug||m.canonicalRecipe!=='amok-trey'||
   m.voice!=='coral'||m.audioUrl!==url||
   m.sha256!==SHA||Math.abs(m.durationSec-expected.durationSec)>0.001||
   !Array.isArray(m.chapters)||m.chapters.length!==7)
  fail('manifest identity/duration/digest mismatch');

if(m.chapters.some((c,i)=>c.id!==expectedIds[i]||
   !Number.isFinite(c.startSec)||!Number.isFinite(c.endSec)||
   Math.abs(c.startSec-expected.chapters[i].startSec)>0.001||
   Math.abs(c.endSec-expected.chapters[i].endSec)>0.001))
  fail('chapter cues differ from original track lengths');

const scripts=[guide.audio?.intro,...(guide.phases??[]).map(p=>p.audioScript)];
if(scripts.length!==7||scripts.some((s,i)=>typeof s!=='string'||
   digest(s)!==AMOK_TRACKS[i].textSha256))
  fail('approved v4 narrations must match seven source hashes');
const sourceHash=digest(JSON.stringify(scripts));
if(m.scriptSha256!==sourceHash)fail('narration/version provenance mismatch');

if(!guide.audio?.asset||guide.audio.asset.audioUrl!==url||
   guide.audio.asset.sha256!==SHA||
   Math.abs(guide.audio.asset.durationSec-expected.durationSec)>0.001)
  fail('blueprint asset does not match verified MP3');

if(statSync(audio).size!==BYTES||digest(readFileSync(audio))!==SHA)
  fail('public MP3 differs from private verified original');

console.log('AMOK_RELEASE_AUDIO_GATE_OK: seven chapters, v4 texts and integral MP3 match; human listening, deployment and HTTP 200/206 remain separate.');
