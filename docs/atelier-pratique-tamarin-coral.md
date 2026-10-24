# Atelier guidé au tamarin — dossier de production Coral (sans génération)

> **Mise à jour du 22/10/2026 : le MP3 pilote existe déjà** dans `public/audio/workshops/pratique-sauce-tamarin/atelier-coral.mp3` et son manifeste de sept chapitres existe aussi. Le fichier est repris à l'identique depuis #88 ; **ne pas exécuter le générateur ou la passerelle Coral**. Ce document garde l'historique de préparation initiale, pas l'état actuel de génération. L'écoute intégrale humaine et les validations mobile/desktop restent **non effectuées**, le statut `audio_generated_review_pending` n'est pas changé. Aucune publication.

## Cible
Atelier distinct : \`/apprendre/pratique/sauce-tamarin/\`, non lié aux pistes des six ateliers historiques.

- **Unique source éditoriale** : \`src/data/guidedWorkshops.ts\`, champs \`steps[].narrationDraft\`. La recette et ses proportions ont une source publiée.
- **Export vérifié sans TTS** : \`node scripts/export-guided-workshop-narration.mjs --check\`.
- **Export éditorial** : \`node scripts/export-guided-workshop-narration.mjs > /tmp/sauce-tamarin-coral-plan.json\`.
- **Six chapitres propres** : délayer, chauffer/filtrer, assaisonner, comparer, rectifier, servir.
- **Voix prévue** : Coral, \`gpt-4o-mini-tts\`, français standard, proche du dispositif existant. *Aucun fichier vocal n'est généré par le script.*
- **Destination à créer seulement après génération contrôlée** : \`public/audio/workshops/pratique-sauce-tamarin/atelier-coral.mp3\`.
- **Manifest futur isolé** : \`src/data/guided-workshop-audio/sauce-tamarin.json\`, indépendant de \`src/data/workshop-audio\`.

## Étapes non négociables pour la génération

1. Contrôler le script exporté contre le texte affiché et la recette source (dont 80 ml d'eau / 2 cuillères tamarin / 2 sucre / 2 sauce de poisson).
2. Utiliser uniquement un accès TTS autorisé et fonctionnel ; ne pas appeler automatiquement les infrastructures de Squaia, ORVEKIO ou AhoraGO.
3. Synthétiser **uniquement ces six chapitres pour ce nouvel atelier**, une fois ; ne pas relancer les synthèses des six anciennes pistes.
4. Rassembler les six segments selon le format réellement reçu ; mesurer leurs débuts/fins par analyse des trames MP3, jamais à partir d'une estimation de durée par mot.
5. Relire et écouter chaque segment, en particulier les quantités, les mots cambodgiens et le son mobile. Corriger avant toute fusion.
6. Conserver les anciens fichiers et métadonnées inchangés. Intégrer la nouvelle narration dans le lecteur existant **uniquement après** résolution de la PR parallèle concernant le dock mobile.
7. Ajouter des tests : intégrité MP3, six bornes de chapitres, arrêt/reprise, boutons mobile/desktop, et absence de lecture du MP3 d'une autre page.

## Images / honnêteté éditoriale

La photographie courante ne montre que les gousses de tamarin et le texte le dit. Les visuels Commons repérés ne correspondent pas fidèlement à la sauce de cette recette cambodgienne ; **ils ne doivent pas être présentés comme la sauce réalisée**. Publier une vraie photographie de la sauce terminée avec origine/licence documentée, ou maintenir le pilote en noindex jusqu'à disponibilité.

## Suivi de l'autre chantier

PR #67, #63, #57 : lecteur et voix ; PR #83 : catalogue social. Les fichiers de ces chantiers ne sont pas touchés.
