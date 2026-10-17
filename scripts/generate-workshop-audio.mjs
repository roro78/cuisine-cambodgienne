#!/usr/bin/env node
/**
 * Génération ponctuelle des voix d'atelier. Aucun secret, aucune génération côté site.
 *   node scripts/generate-workshop-audio.mjs --dry-run
 *   OPENAI_API_KEY=... node scripts/generate-workshop-audio.mjs --generate --track=intro
 *   OPENAI_API_KEY=... node scripts/generate-workshop-audio.mjs --generate --track=all
 * L'API n'est JAMAIS appelée sans --generate.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataPath = path.join(root, 'src/data/workshop-mortier-narration.json');
const outputDir = path.join(root, 'public/audio/workshops/piler-aromates-au-mortier');
const args = process.argv.slice(2);
const has = (v) => args.includes(v);
const get = (key, fallback) => args.find((a) => a.startsWith(key + '='))?.slice(key.length + 1) ?? fallback;
const isGenerate = has('--generate');
const isDryRun = has('--dry-run') || !isGenerate;
const force = has('--force');
const track = get('--track', 'intro');
const voice = get('--voice', 'shimmer');
const model = 'gpt-4o-mini-tts';
const allowedVoices = new Set(['alloy','ash','ballad','coral','echo','fable','nova','onyx','sage','shimmer','verse','marin','cedar']);
if (has('--help')) {
  console.log('Usage: node scripts/generate-workshop-audio.mjs [--dry-run | --generate] [--track=intro|01|02|03|04|all] [--voice=shimmer] [--force]');
  process.exit(0);
}
if (!allowedVoices.has(voice)) throw new Error('Voice not supported: ' + voice);
if (!new Set(['intro','01','02','03','04','all']).has(track)) throw new Error('Invalid track. Use intro, 01..04, or all.');
const source = JSON.parse(await fs.readFile(dataPath, 'utf8'));
if (typeof source.intro !== 'string' || source.steps?.length !== 4 || !source.steps.every((s) => typeof s === 'string')) {
  throw new Error('Editorial source must have an intro and exactly four steps.');
}
const items = [
  { id: 'intro', text: source.intro, output: 'intro.mp3' },
  ...source.steps.map((text, index) => ({ id: String(index + 1).padStart(2, '0'), text, output: 'etape-' + String(index + 1).padStart(2, '0') + '.mp3' }))
].filter((item) => track === 'all' || item.id === track);
const instructions = [
  'Speak French from France, warmly, calmly and clearly, with a mature feminine sounding storytelling delivery if supported by the selected voice.',
  'Aim for a very subtle, natural Cambodian French influence if you can produce it authentically; never exaggerate, parody, or force an Asian accent.',
  'A friendly cooking workshop instructor: gentle pace, small natural pauses, human warmth. No advertising or dramatic acting.',
  'Take special care pronouncing Cambodian culinary words like kroeung; if unsure, prefer a clear natural French reading to an invented Khmer pronunciation.',
  'This is narrated educational content, not a dialogue or a two-person podcast.'
].join(' ');
for (const item of items) {
  if (!item.text.trim() || item.text.length > 4096) throw new Error('Text length outside API limits for track ' + item.id);
}
console.log('Atelier mortier / ' + (isDryRun ? 'DRY RUN – aucun appel API' : 'GENERATION EXPLICITE'));
console.log('Model: ' + model + '; voice: ' + voice + '; tracks: ' + items.map((i) => i.id).join(', '));
for (const item of items) {
  const destination = path.join(outputDir, item.output);
  let existing = false;
  try { existing = (await fs.stat(destination)).size > 512; } catch { /* absent */ }
  console.log(item.id + ': ' + item.text.length + ' chars -> ' + path.relative(root, destination) + (existing ? ' (exists)' : ''));
}
if (isDryRun) process.exit(0);
const key = process.env.OPENAI_API_KEY;
if (!key || !key.startsWith('sk-')) throw new Error('OPENAI_API_KEY is missing or malformed. Do not paste secrets into chat, code or GitHub.');
await fs.mkdir(outputDir, { recursive: true });
for (const item of items) {
  const destination = path.join(outputDir, item.output);
  const temp = destination + '.partial';
  try {
    if (!force && (await fs.stat(destination)).size > 512) {
      console.log(item.id + ': SKIPPED existing file; use --force to regenerate.');
      continue;
    }
  } catch { /* absent */ }
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, voice, input: item.text, instructions, response_format: 'mp3', speed: 0.93 }),
    signal: AbortSignal.timeout(90000)
  });
  if (!response.ok) {
    const details = (await response.text()).slice(0, 400).replace(/sk-[a-zA-Z0-9_-]+/g, '[secret]');
    throw new Error('TTS returned HTTP ' + response.status + ': ' + details);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength < 1024) throw new Error('Suspiciously short MP3 on ' + item.id);
  // ID3 header, or raw MP3 frame sync. Reject HTML/JSON returned as a faux audio response.
  if (!(buffer.subarray(0,3).toString() === 'ID3' || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0))) {
    throw new Error('Unexpected audio bytes for ' + item.id);
  }
  await fs.writeFile(temp, buffer);
  await fs.rename(temp, destination);
  const sha = createHash('sha256').update(buffer).digest('hex');
  console.log(item.id + ': WRITTEN ' + buffer.byteLength + ' bytes sha256=' + sha.slice(0,16));
}
console.log('Audio généré localement. Écoute humaine obligatoire avant d’ajouter les MP3 à GitHub.');
