import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const page = fs.readFileSync('src/pages/apprendre/[slug].astro', 'utf8');
const audio = fs.readFileSync('src/data/workshopAudio.ts', 'utf8');
const player = fs.readFileSync('src/scripts/workshopAudio.ts', 'utf8');
const style = fs.readFileSync('src/styles/workshop-immersive.css', 'utf8');
const exporter = fs.readFileSync('scripts/generate-workshop-audio.mjs', 'utf8');
const importer = fs.readFileSync('scripts/apply-workshop-mortier-pack.mjs', 'utf8');

test('Six original workshops keep their HowTo and successful completion criteria', () => {
  assert.match(page, /'@type': 'HowTo'/);
  assert.match(page, /Vous avez réussi si…/);
  assert.match(page, /workshop\.steps\.map/);
});
test('Audio works without a paid API and offers an accessible transcript', () => {
  assert.match(page, /data-workshop-voice/);
  assert.match(page, /data-workshop-narration/);
  assert.match(page, /audioReady/);
  assert.match(page, /fs\.statSync/);
  assert.match(page, /data-voice-transcript/);
  assert.match(page, /data-voice-step=/);
  assert.match(player, /SpeechSynthesisUtterance/);
  assert.match(player, /new Audio\(\)/);
  assert.match(player, /media\.play\(\)/);
  assert.match(player, /pagehide/);
  assert.match(player, /document\.hidden/);
  assert.match(player, /aria-pressed/);
  assert.doesNotMatch(player, /fetch\s*\(/);
});
test('Mortar production imagery is gated until binary WebP assets are committed', () => {
  assert.match(audio, /mortarImagePackReady = false/);
  for (const index of ['01','02','03','04']) assert.ok(audio.includes('mortier-etape-' + index + '.webp'));
  assert.match(page, /mortarImagePackReady/);
});
test('Mobile and keyboard controls are styled and motion settings respected', () => {
  assert.match(style, /max-width:740px/);
  assert.match(style, /focus-visible/);
  assert.match(style, /prefers-reduced-motion:reduce/);
});

test('TTS exporter defaults to zero API calls and does not require a key', () => {
  assert.match(exporter, /--generate/);
  assert.match(exporter, /--dry-run/);
  assert.match(exporter, /process\.env\.OPENAI_API_KEY/);
  const run = spawnSync(process.execPath, ['scripts/generate-workshop-audio.mjs','--dry-run','--track=all'], {
    encoding: 'utf8', env: { ...process.env, OPENAI_API_KEY: '' }
  });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /DRY RUN/);
  assert.match(run.stdout, /etape-04\.mp3/);
});

test('Image importer requires matching SHA-256 and offers read-only verification', () => {
  assert.match(importer, /createHash\('sha256'\)/);
  assert.match(importer, /--apply/);
  assert.match(importer, /mortarImagePackReady = true/);
  assert.match(importer, /metadata\.format !== 'webp'/);
});
