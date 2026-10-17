# Atelier immersif et narration — pilote du mortier

## Périmètre de la branche

- Les six ateliers existants conservent leurs informations, leurs liens recettes et leur HowTo.
- Un guide vocal par atelier et par étape est disponible en **prévisualisation navigateur**, uniquement à l'initiative de la personne qui consulte la page.
- Les contrôles incluent lecture, pause, reprise, arrêt, suivant, boutons par étape et lecteur flottant.
- Une transcription complète accompagne le guide, qui est annoncé comme une synthèse vocale de l'appareil, **pas** comme la voix d'une véritable cuisinière.
- Le mortier sert de pilote pour les photographies IA : quatre étapes photographiques et une comparaison avant/après à l'étape 4.

## Limite actuelle de la voix

La synthèse du navigateur est gratuite et ne nécessite pas de clé ni d'appel à une API. En revanche, les timbres, prononciations, comportements en arrière-plan et langues disponibles dépendent de l'appareil. **Elle ne garantit ni une voix féminine, ni une coloration cambodgienne authentique.**

La cible de production est une narration monologue naturelle, française avec légère coloration khmère, obtenue par une locutrice autorisée ou par une synthèse préenregistrée validée avec une locutrice compétente. Avant publication commerciale : droits sur la voix, transparence IA, vérification de la prononciation de « kroeung », « galanga », « citronnelle », « curcuma ».

## Photos générées avec ChatGPT

Les photos sont préparées hors GitHub dans un pack séparé, en WebP 1240 pixels maximum (~600 Ko au total). Elles sont destinées aux chemins :

- `public/images/workshops/mortier-etape-01.webp`
- `public/images/workshops/mortier-etape-02.webp`
- `public/images/workshops/mortier-etape-03.webp`
- `public/images/workshops/mortier-etape-04.webp`

L'interface des étapes illustrées est déjà codée, mais **son activation est verrouillée** par `mortarImagePackReady=false` dans `src/data/workshopAudio.ts`. Ne passer à `true` qu'après avoir importé les quatre vrais binaires dans GitHub, validé le build Astro, les alt text, la cohérence technique des gestes et l'affichage desktop/mobile. Cette branche n'inclut pas encore les quatre WebP ; ne pas considérer le lot photo comme intégré.

## Vérifications

- Tests statiques spécifiques : `node --test tests/workshop-voice-contract.test.mjs`.
- Puis `npm run check`, `npm run build`, `npm run test:editorial` et revue mobile/desktop.
- Tests de restitution audio sur Android/Chrome, iOS/Safari, bureau/Firefox, comportement de pause et navigation au clavier.
- Tester la vraie voix préenregistrée à part avant d'afficher des attributs « voix cambodgienne ».
- Aucune publication OVH ou merge automatique ; une validation humaine est requise.

## Corrections avant mise en production

1. Importer les quatre WebP du pack fourni séparément et passer le verrou image après QA pédagogique.
2. Vérifier le rendu réel de l'interface et le lecteur sur plusieurs navigateurs.
3. Choisir, enregistrer ou générer avec consentement la vraie narration française à légère coloration khmère (pas de clonage sans autorisation).
4. Remplacer si souhaité le moteur vocal natif par des fichiers audio statiques contrôlés, sans requête de génération au moment de l'écoute.
