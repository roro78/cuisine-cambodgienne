# Cuisine du Cambodge — voix féminine des six ateliers

**Décision du 17 octobre 2026** : commencer avec une voix féminine française naturelle. Pas d'accent cambodgien recherché, pas de voix de référence externe, pas de clonage, pas d'ElevenLabs. Utiliser le moteur OpenAI déjà employé pour Squaia, mais isoler le chantier et son quota.

**Statut** : prototype de génération courte préparé. Aucun MP3 enregistré ou écouté dans le cadre de cette PR. Aucun déploiement.

## Prototype sans facturation implicite

Le script `scripts/preview-workshop-voice.mjs` propose la voix OpenAI `shimmer` par défaut. Possibilité d'évaluer ensuite `coral`, `nova` ou `marin` sans présumer qu'elles sonneront toutes également féminines. La sélection finale dépend de l'écoute.

Simulation, sans API ni frais :
- `node scripts/preview-workshop-voice.mjs`
- `node scripts/preview-workshop-voice.mjs --voice=coral`

Une seule piste d'essai (appel payant **uniquement** avec `--generate`) :
- `node scripts/preview-workshop-voice.mjs --generate --voice=shimmer`

La variable `OPENAI_API_KEY` doit exister dans l'environnement d'exécution. Ne pas placer la clé dans le dépôt, GitHub Actions, un message ou le frontend. Le script n'essaie pas de la récupérer sur Render ou dans Squaia. Son prix relève de la facturation API OpenAI : on ne doit pas le confondre avec le quota GitHub Actions.

Sortie locale seulement : `qa-artifacts/workshop-voices/essai-shimmer.mp3` (ignorée par Git). Refus d'écraser un essai préexistant. Aucun MP3 de recette, aucun MP3 des six ateliers, aucun déploiement backend ou OVH.

## Réception de la voix

Écouter le passage pilote du mortier sur mobile et ordinateur : voix féminine perceptible, français clair, débit calme, chaleur humaine, vocabulaire culinaire bien prononcé (« kroeung », « galanga », « citronnelle »). Aucun accent artificiel, ni effet publicitaire.

## Architecture du lecteur validée, non intégrée par ce prototype

Un seul MP3 final par atelier, soit six. Au montage : introduction et quatre étapes générées séparément, puis réunies ; durées mesurées et chapitres calculés. Les segments sources sont conservés pour éviter de régénérer inutilement l'ensemble après correction d'une seule étape.

Mode libre par défaut. Bouton « Suivre la narration » activant le défilement doux à chaque changement de chapitre. Si l'utilisateur défile à la main, désactiver l'auto-scroll sans interrompre la voix. Prévoir boutons lecture, pause, timeline et navigation par chapitres, en tenant compte du tutoriel actuel (une étape visible à la fois avec JS), du clavier et de prefers-reduced-motion.

## Étapes restantes

1. Tester le générateur localement avec Node ; le rendu vocal réel n'est pas encore vérifié.
2. Produire un seul MP3 d'essai explicite, écouter et approuver la voix.
3. Relire les six narrations avant toute génération en lot.
4. Générer, assembler et mesurer les six MP3 finaux ; vérifier la synchronisation.
5. Intégrer et tester le lecteur ; fusion / OVH seulement après validation.

Documentation du moteur : https://developers.openai.com/api/docs/guides/text-to-speech
