/**
 * Génère le plan des SEPTS chapitres, exclusivement hors ligne.
 * Aucun accès au backend Render / TTS. Aucune génération ni coût.
 * node scripts/export-cooking-workshop-audio.mjs <fiche-atelier.json>
 */
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { validateBlueprintFile } from './check-workshop-blueprints.mjs';

export function buildCookingAudioStoryboard(atelier) {
  const chapters = [
    { index: 0, id: 'intro', title: 'Bienvenue et mise en place', text: atelier.audio.intro },
    ...atelier.phases.map((phase, i) => ({
      index: i + 1,
      id: phase.id,
      title: phase.title,
      text: phase.audioScript,
      pausePrompt: phase.pausePrompt,
      observedResult: phase.check,
      safety: phase.safety
    }))
  ];
  return {
    contractVersion: 1,
    kind: 'cooking-workshop-audio-storyboard',
    status: 'text_validated_only_no_tts',
    atelier: atelier.slug,
    canonicalRecipe: atelier.sourceRecipeSlug,
    voice: atelier.audio.voice,
    locale: 'fr-FR',
    instructions: "Voix naturelle et chaleureuse de guide culinaire. Parlez aux personnes qui cuisinent. Invitez à faire pause, à observer le plat, à corriger leur geste. N'inventez jamais des durées ou des quantités. Ne prétendez pas recevoir des réponses de l'utilisateur.",
    numberOfChapters: chapters.length,
    chapters,
    generationRequested: false,
    productionApproved: false
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const path = process.argv[2];
  if (!path) throw new Error('Préciser un fichier JSON conforme au référentiel des ateliers.');
  const { data, errors } = await validateBlueprintFile(path);
  if (errors.length) throw new Error('Storyboard refusé :\n- ' + errors.join('\n- '));
  process.stdout.write(JSON.stringify(buildCookingAudioStoryboard(data), null, 2) + '\n');
}
