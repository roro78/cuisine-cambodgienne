#!/usr/bin/env node
/** One MP3 + exact chapter timeline per workshop. No network or API usage. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const slugs = [
  'piler-aromates-au-mortier', 'equilibrer-une-sauce', 'saisir-viande-poele',
  'fraicheur-herbes-agrumes', 'bouillon-leger-savoureux', 'composer-repas-cambodgien'
];
if (slugs.length !== 6) throw new Error('Six ateliers requis.');
let total = 0;
for (const slug of slugs) {
  const jsonFile = path.join(root, 'src/data/workshop-audio', slug + '.json');
  const { slug: storedSlug, voice, audio, duration, chapters } = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
  if (storedSlug !== slug || voice !== 'coral' || !Array.isArray(chapters) || chapters.length !== 5) {
    throw new Error('Atelier ou chapitres invalides : ' + slug);
  }
  if (audio !== '/audio/workshops/' + slug + '/atelier-coral.mp3') throw new Error('URL incohérente : ' + slug);
  const binary = fs.readFileSync(path.join(root, 'public', audio.slice(1)));
  if (binary.length < 50_000 || binary.length % 384 !== 0) throw new Error('Audio incomplet : ' + slug);
  // OpenAI TTS: MPEG-2 Layer III, 24 kHz mono, CBR 128 kb/s, frame 384 bytes.
  for (let at = 0; at < binary.length; at += 384) {
    const header = binary.readUInt32BE(at);
    const version = (header >>> 19) & 3;
    const layer = (header >>> 17) & 3;
    const bitrate = (header >>> 12) & 15;
    const sampleRate = (header >>> 10) & 3;
    if ((header >>> 21) !== 2047 || version !== 2 || layer !== 1 || bitrate !== 12 || sampleRate !== 1) {
      throw new Error('Trame MP3 incohérente : ' + slug + ' @ ' + at);
    }
  }
  const actualSeconds = binary.length / 16_000;
  if (!Number.isFinite(duration) || Math.abs(duration - actualSeconds) > 0.03) throw new Error('Durée MP3 erronée : ' + slug);
  if (duration < 45 || duration > 600) throw new Error('Durée hors limites : ' + slug);
  if (chapters[0].start !== 0) throw new Error('Introduction manquante : ' + slug);
  let previous = -1;
  for (const [index, chapter] of chapters.entries()) {
    if (!chapter.title || typeof chapter.text !== 'string' || chapter.text.length < 80 ||
        !Number.isFinite(chapter.start) || chapter.start <= previous || chapter.start >= duration) {
      throw new Error('Chapitre invalide : ' + slug + '/' + index);
    }
    previous = chapter.start;
  }
  total += binary.length;
  console.log('PASS', slug, actualSeconds.toFixed(3) + 's', binary.length + ' bytes', '5 chapitres');
}
console.log('PASS six ateliers : ' + total + ' octets audio, 30 chapitres.');
