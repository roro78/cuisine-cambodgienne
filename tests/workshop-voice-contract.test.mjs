import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = fs.readFileSync('src/pages/apprendre/[slug].astro', 'utf8');
const audio = fs.readFileSync('src/data/workshopAudio.ts', 'utf8');
const player = fs.readFileSync('src/scripts/workshopAudio.ts', 'utf8');
const style = fs.readFileSync('src/styles/workshop-immersive.css', 'utf8');

test('Six original workshops keep their HowTo and successful completion criteria', () => {
  assert.match(page, /'@type': 'HowTo'/);
  assert.match(page, /Vous avez réussi si…/);
  assert.match(page, /workshop\.steps\.map/);
});
test('Audio works without a paid API and offers an accessible transcript', () => {
  assert.match(page, /data-workshop-voice/);
  assert.match(page, /data-workshop-narration/);
  assert.match(page, /data-voice-transcript/);
  assert.match(page, /data-voice-step=/);
  assert.match(player, /SpeechSynthesisUtterance/);
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
