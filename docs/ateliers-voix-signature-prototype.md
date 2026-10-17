# Cuisine du Cambodge — voix signature des six ateliers

Statut : prototype logiciel prêt à l'essai. Aucun MP3 produit, aucune voix validée, aucun déploiement.

## Voix recherchée

Une narratrice originale : adulte, féminine, chaleureuse, français immédiatement compréhensible, débit naturel et éventuelle coloration bilingue franco-cambodgienne, si l'outil y parvient naturellement. La voix d'une personne connue n'est ni téléchargée ni clonée. Ne pas prétendre avoir obtenu un accent authentique sans l'avoir écouté.

## Essai principal : ElevenLabs Voice Design

Commande sans coût : node scripts/preview-workshop-voice.mjs

Commande à ne lancer qu'avec un compte ElevenLabs et ELEVENLABS_API_KEY configurée dans l'environnement sécurisé : node scripts/preview-workshop-voice.mjs --generate

Un seul appel au point de terminaison /v1/text-to-voice/design. Réponses et identifiants des aperçus conservés uniquement en local, dans qa-artifacts/workshop-voices/ (ignoré par Git). La limite --max-previews concerne les fichiers enregistrés, pas nécessairement les crédits consommés. Le prototype ne crée aucune voix persistante.

IMPORTANT : la clé OpenAI existante n'est pas utilisable auprès d'ElevenLabs ; ce sont des fournisseurs et facturations différents.

## Essai alternatif : clé OpenAI existante

Simulation : node scripts/preview-workshop-voice.mjs --provider=openai --voice=shimmer
Génération demandée expressément, avec OPENAI_API_KEY sécurisée : node scripts/preview-workshop-voice.mjs --generate --provider=openai --voice=shimmer

Une seule piste courte est générée à partir de l'extrait du mortier. Cette solution utilise une voix OpenAI prédéfinie, pas une voix originale persistante.

## Vérifications humaines avant génération des ateliers

- Français naturel, débit pédagogique et timbre agréable.
- Prononciation des mots « kroeung », « citronnelle », « galanga ».
- Ni caricature d'accent ni imitation d'une personne identifiable.
- Test sur mobile/ordinateur, écoute complète, absence de saturation.
- Refuser la voix si la coloration franco-cambodgienne n'est pas convaincante ; préférer le français naturel plutôt qu'un accent forcé.

## Architecture du lecteur retenue, hors périmètre de cette PR

- Six MP3 finaux : un par atelier. Chaque fichier est assemblé à partir de cinq segments (introduction et quatre étapes).
- Chapitres construits à partir des durées réelles de ces segments, possibilité de remplacer un seul segment au montage.
- Navigation libre par défaut. Bouton « Suivre la narration » pour synchroniser le scroll sur les changements de chapitre.
- Si la personne fait défiler manuellement : arrêt du scroll automatique, sans stopper l'audio.
- Lecteur lecture/pause, chapitres, curseur temporel, prise en compte du mobile et de prefers-reduced-motion.
- Rester compatible avec les quatre étapes qui sont actuellement affichées une à une par le tutoriel V22.

## Gates

1. Écouter au plus trois aperçus et choisir/refuser une voix.
2. Relire les textes complets des six ateliers et les prononciations.
3. Générer les segments de manière plafonnée, vérifier durées et assembler les six MP3.
4. Intégrer le lecteur au V22 actuel, QA mobile/desktop, sans JavaScript et accessibilité.
5. Valider avant fusion et déploiement OVH.

Documentation des APIs :
- https://elevenlabs.io/docs/api-reference/text-to-voice/design
- https://developers.openai.com/api/docs/guides/text-to-speech
- https://developers.openai.com/api/docs/guides/custom-voices
