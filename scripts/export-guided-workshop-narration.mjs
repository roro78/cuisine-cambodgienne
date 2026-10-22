/**
 * Offline storyboard export only: never calls TTS, Render, Squaia or any service.
 * Usage: node scripts/export-guided-workshop-narration.mjs > /tmp/sauce-tamarin-coral-plan.json
 * Usage: node scripts/export-guided-workshop-narration.mjs --check
 */
import { readFileSync } from 'node:fs';
import { transformSync } from 'esbuild';

const src = readFileSync(new URL('../src/data/guidedWorkshops.ts', import.meta.url), 'utf8');
const compiled = transformSync(src, { loader: 'ts', format: 'esm', target: 'es2022' });
const { tamarindGuidedWorkshop: atelier } = await import(
  'data:text/javascript;base64,' + Buffer.from(compiled.code).toString('base64')
);

if (atelier.slug !== 'sauce-tamarin' || atelier.recipeSource.status !== 'source_verified') {
  throw new Error('No verified source for this pilot');
}
if (atelier.status === 'validated') {
  throw new Error('Do not silently treat an audio draft as a published recording');
}
if (atelier.steps.length !== 6 || new Set(atelier.steps.map(step => step.id)).size !== 6) {
  throw new Error('Expected six unique steps');
}
if (atelier.steps.some(step => !step.narrationDraft || step.narrationDraft.trim().length < 80)) {
  throw new Error('One or more narration chapters are incomplete');
}
const chapters = atelier.steps.map((step, index) => ({
  index: index + 1,
  id: step.id,
  title: step.title,
  text: step.narrationDraft.trim()
}));
const payload = {
  status: 'script_only_no_mp3',
  atelier: atelier.id,
  source: atelier.recipeSource.url,
  voice: 'coral',
  ttsModel: 'gpt-4o-mini-tts',
  language: 'fr-FR',
  instructions: 'Français naturel de France, voix féminine Coral, chaleureux, très clair, rythme adapté à un cours culinaire. Ne pas imiter une personne réelle. Respecter les quantités et les prononciations.',
  outputMp3: 'public/audio/workshops/pratique-sauce-tamarin/atelier-coral.mp3',
  outputManifest: 'src/data/guided-workshop-audio/sauce-tamarin.json',
  chapters,
  chapterTimes: 'not_available_until_actual_mp3_generated',
  billing: 'NO_TTS_CALL_MADE',
  warnings: ['Generate only this single atelier.', 'Verify measured MP3 duration and actual chapter boundaries.', 'Do not overwrite any six historical MP3s.', 'Do not activate any n8n/Meta/Resend workflows.']
};
if (process.argv.includes('--check')) {
  if (!payload.chapters.every(chapter => chapter.text.length >= 80)) process.exit(1);
  process.stdout.write('Guided Coral storyboard PASS: 6 chapters, audio not generated.\n');
} else {
  process.stdout.write(JSON.stringify(payload, null, 2) + '\n');
}
