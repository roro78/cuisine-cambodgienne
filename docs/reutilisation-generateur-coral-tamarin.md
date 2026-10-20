# Réutilisation de la génération Coral — Render IA-Coach

La source de vérité de la clé OpenAI est **le backend Render IA-Coach existant**. La clé n'est **pas** et ne doit pas être dupliquée dans GitHub Actions. Il n'y a aucun secret à saisir.

Le workflow unique `.github/workflows/coral-tamarin-existing-one-shot.yml` est déclenché par la modification de **son propre fichier** sur la seule branche `feat/atelier-guide-sauce-tamarin-pilote-20261019`. Il charge le générateur original `scripts/generate-workshop-audio.mjs` du commit `9992b7db7befc50658b1db365d86fc62b751551a`, le valide à blanc puis envoie les sept textes préparés à l'API TTS du backend Render IA-Coach, qui délègue à `gpt-4o-mini-tts` avec voix `coral`. L'adaptateur existant `scripts/bridge-guided-tamarin-existing-coral.mjs` fait ces appels : il n'implémente aucun modèle TTS.

**Sécurité :** exactement une introduction et six étapes de ce nouvel atelier ; zéro modification sur Squaia, sa configuration, ses autres endpoints ou ses fichiers ; aucune génération des anciens MP3 ; un appel à la fois ; refus de remplacer des fichiers ; signature MP3 et durée ffprobe vérifiées ; décodage ffmpeg complet ; les deux nouveaux fichiers seulement sont ajoutés à la branche brouillon. GitHub Actions enregistre également un artefact de revue. Aucun déploiement OVH, aucune publication sociale, aucun changement n8n.

La piste : `public/audio/workshops/pratique-sauce-tamarin/atelier-coral.mp3`. Le manifeste associé : `src/data/guided-workshop-audio/sauce-tamarin.json`. Ils restent en **audio_generated_review_pending** tant que l'écoute et le fonctionnement sur téléphone ne sont pas confirmés. Le lecteur partagé, sujet de la PR #67, n'est pas modifié.

Ne pas relancer le workflow après un succès : sept appels TTS facturables sont attendus une seule fois. En cas d'échec intermédiaire, consulter les logs et l'artefact avant toute nouvelle tentative.
