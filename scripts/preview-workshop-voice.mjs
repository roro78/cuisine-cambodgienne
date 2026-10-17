#!/usr/bin/env node
/**
 * Prototype NON publié de voix des ateliers, sans clonage ni audio de tiers.
 *
 * Dry-run (gratuit) :
 *   node scripts/preview-workshop-voice.mjs
 *   node scripts/preview-workshop-voice.mjs --provider=openai --voice=marin
 *
 * Une demande payante, uniquement sur ordre explicite :
 *   ELEVENLABS_API_KEY=... node scripts/preview-workshop-voice.mjs --generate
 *   OPENAI_API_KEY=... node scripts/preview-workshop-voice.mjs --generate --provider=openai --voice=shimmer
 *
 * Sorties LOCALES ignorées par Git : qa-artifacts/workshop-voices/
 * Aucun MP3 d'atelier n'est généré, remplacé ou déployé par ce script.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (name) => args.includes('--' + name);
const value = (name, fallback) => args.find((a) => a.startsWith('--' + name + '='))?.slice(name.length + 3) ?? fallback;
const generate = flag('generate');
const provider = value('provider', 'elevenlabs');
const voice = value('voice', 'shimmer');
const maxPreviews = Number(value('max-previews', '3'));
const voices = new Set(['alloy','ash','ballad','coral','echo','fable','nova','onyx','sage','shimmer','verse','marin','cedar']);

if (flag('help')) {
  console.log('Usage: node scripts/preview-workshop-voice.mjs [--generate | --dry-run] [--provider=elevenlabs|openai] [--voice=shimmer] [--max-previews=1..3]');
  process.exit(0);
}
if (generate && flag('dry-run')) throw new Error('--generate et --dry-run sont incompatibles');
if (!['elevenlabs', 'openai'].includes(provider)) throw new Error('Provider inconnu');
if (!voices.has(voice)) throw new Error('Voix OpenAI invalide');
if (!Number.isSafeInteger(maxPreviews) || maxPreviews < 1 || maxPreviews > 3) {
  throw new Error('max-previews doit etre compris entre 1 et 3');
}

const description = [
  'An original, natural female speaking voice for a French-language Cambodian cooking workshop.',
  'Adult, warmly conversational, softly textured timbre, medium-low pitch, calm and authentic rather than polished radio delivery.',
  'Fluent and easily understood metropolitan French, with only a subtle plausible French-Cambodian bilingual influence in rhythm or intonation, if naturally achievable.',
  'Unhurried guidance, delicate phrasing, well-shaped pauses, tender authority and clear pronunciation of culinary terms.',
  'No parody, no exaggerated accent, no imitation of any existing speaker, broadcaster or public figure.'
].join(' ');

const excerpt = [
  'Bienvenue dans cet atelier consacré au mortier. Aujourd’hui, nous allons préparer les aromates du kroeung,',
  'cette pâte parfumée que l’on retrouve dans la cuisine cambodgienne.',
  'Commencez par couper très finement la citronnelle et le galanga.',
  'Prenez le temps de sentir les parfums qui se libèrent. Puis, avec le pilon, écrasez les aromates par petites quantités.',
  'Nous cherchons une pâte souple et homogène, pas à aller vite.'
].join(' ');

const outDir = path.join(root, 'qa-artifacts', 'workshop-voices');
const prefix = provider === 'elevenlabs' ? 'voice-originale' : 'voix-openai-' + voice;
const manifestPath = path.join(outDir, prefix + '.json');

console.log('CUISINE DU CAMBODGE - TEST DE VOIX (' + (generate ? 'GENERATION EXPLICITE' : 'DRY RUN - 0 appel API') + ')');
console.log('Fournisseur : ' + provider + (provider === 'openai' ? ' / ' + voice + ' (voix existante, non originale)' : ' / Voice Design (nouvelle voix, non clonee)'));
console.log('Texte : ' + excerpt.length + ' caracteres. Destination locale : ' + path.relative(root, outDir));
console.log('Aucun atelier complet, aucune recette et aucun deploiement OVH ne sont concernes.');
if (!generate) {
  console.log('Description de la voix : ' + description);
  console.log('Texte d’essai : ' + excerpt);
  process.exit(0);
}

try {
  await fs.access(manifestPath);
  throw new Error('Prototype deja present : suppression manuelle requise avant une nouvelle generation (' + path.relative(root, manifestPath) + ')');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

let previews = [];
if (provider === 'elevenlabs') {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error('ELEVENLABS_API_KEY absente. La cle OPENAI_API_KEY ne fonctionne pas chez ElevenLabs.');
  const response = await fetch('https://api.elevenlabs.io/v1/text-to-voice/design', {
    method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      voice_description: description,
      text: excerpt,
      model_id: 'eleven_multilingual_ttv_v2',
      auto_generate_text: false,
      should_enhance: false,
      guidance_scale: 5
    }),
    signal: AbortSignal.timeout(120000)
  });
  if (!response.ok) throw new Error('ElevenLabs HTTP ' + response.status + ' (aucune generation confirmee)');
  const json = await response.json();
  if (!Array.isArray(json.previews) || !json.previews.length) throw new Error('Aucun apercu audio recu');
  previews = json.previews.slice(0, maxPreviews).map((item, index) => ({
    id: item.generated_voice_id,
    name: prefix + '-' + String(index + 1).padStart(2, '0') + '.mp3',
    buffer: Buffer.from(item.audio_base_64 || '', 'base64'),
    duration: item.duration_secs ?? null
  }));
} else {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY absente');
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini-tts',
      voice,
      input: excerpt,
      instructions: 'Speak natural conversational French in a warm mature feminine storytelling style if possible. Use gentle pauses and clear Khmer culinary words. A very subtle Cambodian-French bilingual cadence only if natural; no caricature, and do not imitate any identifiable person.',
      response_format: 'mp3',
      speed: 0.93
    }),
    signal: AbortSignal.timeout(120000)
  });
  if (!response.ok) throw new Error('OpenAI HTTP ' + response.status + ' (aucune generation confirmee)');
  previews = [{ id: null, name: prefix + '.mp3', buffer: Buffer.from(await response.arrayBuffer()), duration: null }];
}

for (const preview of previews) {
  const b = preview.buffer;
  const mp3 = b.length >= 1024 && (b.subarray(0, 3).toString() === 'ID3' || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0));
  if (!mp3) throw new Error('Fichier MP3 invalide, aucun fichier publie');
}
await fs.mkdir(outDir, { recursive: true });
for (const preview of previews) {
  const destination = path.join(outDir, preview.name);
  await fs.writeFile(destination, preview.buffer, { flag: 'wx' });
  console.log('A ECOUTER : ' + path.relative(root, destination) + ' (' + preview.buffer.length + ' octets)');
}
await fs.writeFile(manifestPath, JSON.stringify({
  provider, voice: provider === 'openai' ? voice : null,
  text: excerpt, description,
  previews: previews.map(({ id, name, duration }) => ({ generated_voice_id: id, file: name, duration_secs: duration })),
  approved: false,
  note: 'Aucun clonage de voix. Validation humaine et nouvelle autorisation avant la generation des ateliers.'
}, null, 2) + '\n', { flag: 'wx' });
console.log('PROTOTYPE PRODUIT LOCALEMENT. Aucun envoi sur GitHub ni OVH.');
