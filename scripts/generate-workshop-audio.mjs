#!/usr/bin/env node
/**
 * Generation des MP3 des SIX ateliers, avec le moteur OpenAI deja utilise dans Squaia.
 * Utilise OPENAI_API_KEY ; n'accede jamais aux anciens MP3 de Squaia.
 *
 * Simulation sans cout : node scripts/generate-workshop-audio.mjs --dry-run --workshop=all --track=all
 * Un seul essai : node scripts/generate-workshop-audio.mjs --generate --track=intro
 * Lot explicite : node scripts/generate-workshop-audio.mjs --generate --workshop=all --track=all --max-files=40
 *
 * Aucun appel API sans --generate. Aucun remplacement sans --force.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const has = (name) => args.includes('--' + name);
const arg = (name, fallback) => args.find((a) => a.startsWith('--' + name + '='))?.slice(name.length + 3) ?? fallback;
const generate = has('generate');
const dryRun = has('dry-run') || !generate;
const force = has('force');
const workshopName = arg('workshop', 'piler-aromates-au-mortier');
const track = arg('track', 'intro');
const voice = arg('voice', 'shimmer');
const maxFiles = Number(arg('max-files', '1'));
const model = 'gpt-4o-mini-tts';
const allowedVoices = new Set(['alloy','ash','ballad','coral','echo','fable','nova','onyx','sage','shimmer','verse','marin','cedar']);

if (has('help')) {
  console.log('Usage: node scripts/generate-workshop-audio.mjs [--dry-run|--generate] [--workshop=slug|all] [--track=intro|01|02|...|all] [--voice=shimmer] [--max-files=1] [--force]');
  process.exit(0);
}
if (generate && has('dry-run')) throw new Error('--generate et --dry-run sont incompatibles.');
if (!allowedVoices.has(voice)) throw new Error('Voix non prise en charge : ' + voice);
if (!Number.isSafeInteger(maxFiles) || maxFiles < 1 || maxFiles > 40) throw new Error('--max-files doit etre un entier de 1 a 40.');
if (!/^(all|intro|\d{2})$/.test(track)) throw new Error('--track doit valoir intro, 01, 02..., ou all.');

const workshopsSource = await fs.readFile(path.join(root, 'src/data/workshops.ts'), 'utf8');
const result = ts.transpileModule(workshopsSource, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 }, reportDiagnostics: true });
if (result.diagnostics?.some((d) => d.category === ts.DiagnosticCategory.Error)) throw new Error('Donnees des ateliers TypeScript invalides.');
const imported = await import('data:text/javascript;base64,' + Buffer.from(result.outputText).toString('base64'));
const workshops = imported.workshops;
if (!Array.isArray(workshops) || workshops.length !== 6) throw new Error('Les SIX ateliers attendus ne sont pas presents.');
if (workshops.some((w) => !/^[a-z0-9-]+$/.test(w.slug) || !Array.isArray(w.steps) || !w.steps.length)) throw new Error('Slug ou etapes invalides.');
const selected = workshopName === 'all' ? workshops : workshops.filter((w) => w.slug === workshopName);
if (!selected.length) throw new Error('Atelier inconnu : ' + workshopName);
const mortar = JSON.parse(await fs.readFile(path.join(root, 'src/data/workshop-mortier-narration.json'), 'utf8'));
function narrationFor(workshop) {
  if (workshop.slug === 'piler-aromates-au-mortier') return mortar;
  return {
    intro: 'Bienvenue dans l’atelier « ' + workshop.title + ' ». Nous allons avancer tranquillement, geste apres geste. Preparez votre materiel et gardez les reperes visuels sous les yeux. Vous pouvez ecouter chaque etape separement.',
    steps: workshop.steps.map((step, index) =>
      'Étape ' + (index + 1) + ' : ' + step.title + '. ' + step.action + ' ' + step.observe + ' Votre repere : ' + step.cue + ' Pour savoir si l’etape est reussie : ' + step.success)
  };
}
const instructions = [
  'Narrate in French with a warm, natural, mature female-sounding voice. Calm, clear, expressive cooking instruction.',
  'A very subtle Cambodian-French cadence can be attempted if natural. Do not imitate any identifiable person or caricature an accent.',
  'Use short breathing pauses; no advertisement or dramatic performance.',
  'Preserve Khmer culinary words. Do not invent phonetics for unfamiliar words.'
].join(' ');

const items = [];
for (const workshop of selected) {
  const narration = narrationFor(workshop);
  if (!Array.isArray(narration.steps) || narration.steps.length !== workshop.steps.length) throw new Error('Narration incoherente : ' + workshop.slug);
  const candidates = [{ id: 'intro', text: narration.intro, filename: 'intro.mp3' }]
    .concat(narration.steps.map((text, index) => ({
      id: String(index + 1).padStart(2, '0'), text, filename: 'etape-' + String(index + 1).padStart(2, '0') + '.mp3'
    })));
  for (const candidate of candidates.filter((item) => track === 'all' || item.id === track)) {
    if (typeof candidate.text !== 'string' || !candidate.text.trim() || candidate.text.length > 4096) throw new Error('Texte trop long ou vide : ' + workshop.slug + '/' + candidate.id);
    items.push({ ...candidate, slug: workshop.slug, output: path.join(root, 'public/audio/workshops', workshop.slug, candidate.filename) });
  }
}
if (!items.length) throw new Error('Aucune piste correspondant au filtre.');

async function inspect(output) {
  try {
    const buffer = await fs.readFile(output);
    const signature = buffer.subarray(0, 3).toString() === 'ID3' || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0);
    return { exists: true, valid: buffer.length > 1024 && signature };
  } catch (error) {
    if (error.code === 'ENOENT') return { exists: false, valid: false };
    throw error;
  }
}
const plan = [];
for (const item of items) {
  const state = await inspect(item.output);
  plan.push({ ...item, ...state, action: state.exists && !force ? 'SKIP' : 'GENERATE' });
}
const pending = plan.filter((item) => item.action === 'GENERATE');
console.log('Cuisine du Cambodge / ' + (dryRun ? 'DRY RUN - aucun appel API' : 'GENERATION EXPLICITE'));
console.log('Provider=OpenAI; model=' + model + '; voice=' + voice + '; pistes=' + items.length + '; a generer=' + pending.length);
for (const item of plan) console.log('[' + item.action + '] ' + item.slug + '/' + item.filename + (item.exists && !item.valid ? ' (MP3 invalide)' : ''));
if (dryRun) process.exit(0);
if (plan.some((item) => item.exists && !item.valid && !force)) throw new Error('MP3 invalide present : intervention ou --force requis.');
if (pending.length > maxFiles) throw new Error('Plafond de securite : ' + pending.length + ' pistes pour --max-files=' + maxFiles + '. Aucun appel effectue.');
if (!pending.length) {
  console.log('Aucun MP3 a generer : toutes les pistes existent.');
  process.exit(0);
}
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey || !apiKey.startsWith('sk-')) throw new Error('OPENAI_API_KEY absente ou invalide. Ne pas placer la cle dans le depot.');

for (const item of pending) {
  await fs.mkdir(path.dirname(item.output), { recursive: true });
  const temp = item.output + '.partial';
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, voice, input: item.text, instructions, response_format: 'mp3', speed: 0.93 }),
    signal: AbortSignal.timeout(90000)
  });
  if (!response.ok) {
    const details = (await response.text()).slice(0, 240).replace(/sk-[a-zA-Z0-9_-]+/g, '[secret]');
    throw new Error('OpenAI TTS HTTP ' + response.status + ' : ' + details);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const signature = buffer.subarray(0, 3).toString() === 'ID3' || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0);
  if (buffer.length <= 1024 || !signature) throw new Error('MP3 recu invalide : ' + item.slug + '/' + item.filename);
  try {
    await fs.writeFile(temp, buffer);
    await fs.rename(temp, item.output);
  } finally {
    await fs.unlink(temp).catch(() => {});
  }
  console.log('WRITTEN ' + item.slug + '/' + item.filename + ' bytes=' + buffer.length + ' sha256=' + createHash('sha256').update(buffer).digest('hex').slice(0, 16));
}
console.log('Generation terminee : ecoute humaine et import GitHub necessaires avant OVH.');
