# Relance du MP3 Coral — réutilisation du générateur historique

Ce lot **ne crée pas de second générateur TTS**. Il emploie le code existant `scripts/generate-workshop-audio.mjs` de la branche `feat/atelier-immersif-audio-guide-20261017`, épinglé sur le commit `9992b7db7befc50658b1db365d86fc62b751551a`. Aucune modification n'est apportée à cette branche.

Un **adaptateur de données temporaire** présente uniquement la narration validée du nouvel atelier sous un identifiant local historique requis par le générateur existant. Cet identifiant temporaire n'est ni enregistré dans `src/data/workshops.ts` du vrai dépôt, ni exposé dans la page. Les cinq autres entrées du catalogue fictif sont inertes. La commande du générateur cible seulement les sept parties de ce nouvel atelier : introduction + six étapes, voix Coral et modèle gpt-4o-mini-tts.

Le workflow `.github/workflows/coral-tamarin-existing-one-shot.yml` se déclenche **une fois lors de l'ajout de ce fichier**, uniquement sur la branche PR #88. Il effectue un dry-run même sans clé. La synthèse ne s'exécute que si le secret `OPENAI_API_KEY` est déjà disponible dans les GitHub Actions de ce dépôt. Aucun secret n'est affiché ou demandé. S'il est absent, le workflow annonce le blocage et ne génère aucun son.

Avec la clé, sept MP3 sont réalisés, contrôlés (signature, ffprobe) puis assemblés en une piste séparée :
- `public/audio/workshops/pratique-sauce-tamarin/atelier-coral.mp3`
- `src/data/guided-workshop-audio/sauce-tamarin.json`

Ces fichiers sont **conservés uniquement comme artefact de revue privé** par le workflow : aucun commit automatique, aucune mise en production, aucun appel Render/Squaia/n8n, aucune modification des six MP3 déjà publiés. La validation à l'écoute et l'intégration au lecteur auront lieu après récupération de l'artefact, exclusivement dans la PR #88. Pas de régénération automatique ou d'exécution récurrente.
