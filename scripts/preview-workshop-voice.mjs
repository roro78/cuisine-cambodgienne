#!/usr/bin/env node
/**
 * Test ponctuel de voix féminine pour les ateliers Cuisine du Cambodge.
 *
 * Sans coût :
 *   node scripts/preview-workshop-voice.mjs
 *   node scripts/preview-workshop-voice.mjs --voice=coral
 *
 * UN MP3 d'essai, avec OPENAI_API_KEY configurée dans l'environnement :
 *   node scripts/preview-workshop-voice.mjs --generate --voice=shimmer
 *
 * Aucun appel API sans --generate. Aucun accès à Squaia ni à ses anciens MP3.
 * Aucune génération des six ateliers, aucun déploiement. Sortie locale ignorée par Git.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const has = (name) => args.includes('--' + name);
const value = (name, fallback) => args.find((a) => a.startsWith('--' + name + '='))?.slice(name.length + 3) ?? fallback;
const generate = has('generate');
const voice = value('voice', 'shimmer');
const voices = new Set(['shimmer', 'coral', 'nova', 'marin']);
const allowedArgs = /^(--dry-run|--generate|--help|--voice=(shimmer|coral|nova|marin))$/;
if (args.some((item) => !allowedArgs.test(item))) throw new Error('Argument inconnu ou voix non prise en charge.');
if (has('help')) {
  console.log('Usage: node scripts/preview-workshop-voice.mjs [--dry-run | --generate] [--voice=shimmer|coral|nova|marin]');
  process.exit(0);
}
if (generate && has('dry-run')) throw new Error('--generate et --dry-run sont incompatibles.');
if (!voices.has(voice)) throw new Error('Voix non prise en charge.');

const excerpt = [
  'Bienvenue dans cet atelier consacré au mortier. Aujourd’hui, nous allons préparer les aromates du kroeung,',
  'cette pâte parfumée de la cuisine cambodgienne.',
  'Commencez par couper très finement la citronnelle et le galanga.',
  'Prenez le temps de sentir les parfums qui se libèrent. Puis, avec le pilon, écrasez les aromates par petites quantités.',
  'Nous cherchons une pâte souple et homogène, sans nous presser.'
].join(' ');
const instructions = [
  'Parle en français avec une voix féminine douce, adulte, chaleureuse, naturelle et très compréhensible, si la voix choisie le permet.',
  'Tu animes un atelier de cuisine. Parle calmement, comme une cuisinière qui guide un geste.',
  'Respecte des pauses naturelles et prononce soigneusement les noms des ingrédients.',
  'N’essaie pas de produire un accent cambodgien, de caricaturer un accent ou d’imiter une personne réelle.',
  'Évite le ton publicitaire, l’enthousiasme forcé et les intonations de robot.'
].join(' ');

const outDir = path.join(root, 'qa-artifacts', 'workshop-voices');
const destination = path.join(outDir, 'essai-' + voice + '.mp3');
console.log('Cuisine du Cambodge - VOIX FEMININE STANDARD - ' + (generate ? 'GENERATION EXPLICITE' : 'DRY RUN / AUCUN APPEL API'));
console.log('OpenAI gpt-4o-mini-tts; voix=' + voice + '; caracteres=' + excerpt.length + '; destination=' + path.relative(root, destination));
console.log('Pas de clonage, pas de nouvelle voix a creer, pas de backend, pas de MP3 de recettes ni de Squaia.');
if (!generate) {
  console.log('Texte : ' + excerpt);
  process.exit(0);
}

try {
  await fs.access(destination);
  throw new Error('MP3 d’essai deja present. Pas d’ecrasement automatique : ' + path.relative(root, destination));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const key = process.env.OPENAI_API_KEY;
if (!key || !key.startsWith('sk-')) throw new Error('OPENAI_API_KEY absente ou invalide. Ne jamais coller la cle dans un commit ni dans le chat.');
const response = await fetch('https://api.openai.com/v1/audio/speech', {
  method: 'POST',
  headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'gpt-4o-mini-tts',
    voice,
    input: excerpt,
    instructions,
    response_format: 'mp3',
    speed: 0.93
  }),
  signal: AbortSignal.timeout(120000)
});
if (!response.ok) {
  throw new Error('OpenAI HTTP ' + response.status + '. Aucune piste valide enregistree.');
}
const buffer = Buffer.from(await response.arrayBuffer());
const validMp3 = buffer.length > 1024 &&
  (buffer.subarray(0, 3).toString() === 'ID3' || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0));
if (!validMp3) throw new Error('Reponse audio invalide.');
await fs.mkdir(outDir, { recursive: true });
await fs.writeFile(destination, buffer, { flag: 'wx' });
console.log('MP3 LOCAL GENERE : ' + path.relative(root, destination));
console.log('A ECOUTER ET VALIDER AVANT GENERATION DES SIX ATELIERS. AUCUN DEPLOIEMENT.');
