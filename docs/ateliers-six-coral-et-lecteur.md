# Les six ateliers en narration Coral

- **Une piste MP3 continue par atelier**, 5 chapitres (présentation + 4 gestes).
- Chaque piste est obtenue par cinq synthèses distinctes de gpt-4o-mini-tts via le backend Squaia Render sécurisé, voix standard Coral, puis par assemblage au niveau des trames MP3 MPEG-2 Layer III CBR 128 kb/s / 24 kHz.
- Les horodatages sont calculés à partir des trames réellement reçues (576 échantillons à 24 kHz par trame), non d'une estimation de mots.
- Aucune musique n'a été ajoutée ni demandée.
- Consignes : français standard de France, conversationnel, joyeux et chaleureux, sans accent québécois demandé. La prononciation exacte reste subjective et doit être évaluée à l'écoute.
- Les textes sont éditoriaux et alignés sur src/data/workshops.ts et src/data/workshopLearning.ts. Ce ne sont ni des recettes complètes, ni des tutoriels vidéo.
- Les durées audio d'environ 2 minutes sont différentes de la durée pédagogique des ateliers (20 à 50 minutes) : on peut mettre en pause pour cuisiner.
- Contrôle statique : node scripts/check-workshop-audio.mjs, sans appel OpenAI ou CI.
- Page : lecteur à progression, chapitres et transcription. Mode libre par défaut ; « Suivre la narration » est une option. Tout défilement manuel désactive le suivi, sans couper la lecture.
- Coral est provisoire : une voix personnalisée basée sur Claire Ly ne sera envisagée qu'avec les enregistrements et le consentement vocal exigés par le prestataire, et accès API requis. Aucun enregistrement de Claire n'a été utilisé dans ces fichiers.

## Publication
Tester les six sons et la navigation sur mobile/ordinateur avant déploiement OVH. Aucune génération pendant le build Astro. Le contenu de public/audio/workshops est statique. La production OVH doit être réalignée via le processus dédié à la branche ovh-production sans toucher à Squaia.
