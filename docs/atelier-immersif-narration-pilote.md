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


## Livraison du pilote — photos

Le pack WebP créé dans ChatGPT n'est pas encore ajouté comme fichiers binaires à GitHub. La PR #57 contient maintenant un importeur reproductible.

1. Télécharger le fichier \`atelier-pilote-mortier-pack.zip\` fourni dans ChatGPT.
2. Dans un clone local de la branche \`feat/atelier-immersif-audio-guide-20261017\`, extraire le contenu de l'archive dans \`atelier-pilote-mortier/\` (l'archive contient déjà le répertoire \`public/images/workshops/\`).
3. \`npm install --no-audit --no-fund\`
4. \`node scripts/apply-workshop-mortier-pack.mjs --source=atelier-pilote-mortier\` (vérification seule, aucun changement).
5. \`node scripts/apply-workshop-mortier-pack.mjs --source=atelier-pilote-mortier --apply\` (copie des quatre binaires approuvés et activation du rendu).
6. \`npm run test:workshop && npm run check && npm run test:editorial && npm run build\`, inspection du résultat en navigateur mobile et desktop.
7. Ajouter puis pousser les quatre fichiers WebP et \`src/data/workshopAudio.ts\` sur **cette branche uniquement** ; ne pas publier sur OVH avant validation.

L'importeur vérifie les empreintes SHA-256 des images réelles et leurs dimensions via Sharp ; une image modifiée est refusée. Aucun autre asset n'est accepté silencieusement.

## Livraison du pilote — narration MP3 préenregistrée

Le script \`scripts/generate-workshop-audio.mjs\` utilise l'API OpenAI depuis une machine autorisée, uniquement sur option explicite. **Ne jamais placer la clé API dans une conversation, un fichier source, une PR ou un secret GitHub Actions si ce n'est pas nécessaire.**

- \`node scripts/generate-workshop-audio.mjs --dry-run --track=all\` : inventaire des cinq segments (aucun appel, aucune facturation).
- Configurer \`OPENAI_API_KEY\` en variable d'environnement **localement** à partir du compte API qui sera facturé. Le script n'enregistre jamais la clé.
- \`node scripts/generate-workshop-audio.mjs --generate --track=intro --voice=shimmer\` : produit **un seul exemple de voix** pour validation humaine.
- Une fois la voix approuvée : \`node scripts/generate-workshop-audio.mjs --generate --track=all --voice=shimmer\`. Un MP3 existant est conservé, sauf \`--force\`.
- Les fichiers arrivent dans \`public/audio/workshops/piler-aromates-au-mortier/intro.mp3\` et \`etape-01.mp3\` à \`etape-04.mp3\`.
- Dès que les **cinq** pistes sont présentes au build, Astro utilise les MP3 dans le lecteur. Sinon, synthèse française gratuite de l'appareil avec transcription. Le lecteur **ne fait aucun appel API depuis le navigateur**.

L'API prend en charge les instructions d'accent et de ton, mais le rendu **francophone avec légère coloration cambodgienne** reste une hypothèse à tester. Valider chaque extrait, la prononciation khmère, le rythme et les droits d'utilisation avant diffusion. Les voix standards OpenAI sont encore optimisées avant tout pour l'anglais : ne pas présenter une voix quelconque comme une vraie cuisinière cambodgienne. Le site mentionne explicitement « générée par IA » si les MP3 sont activés.

## État au 17 octobre 2026

- Code distant GitHub : présent, PR #57 toujours en brouillon.
- Contrôles statiques des références et de la préparation audio : validés depuis le connecteur GitHub (sans exécuter de build).
- Import WebP dans GitHub : **à exécuter depuis un environnement disposant du clone Git et de l'archive locale** ; non effectué par le connecteur disponible.
- Appels TTS payants : **aucun effectué** ; la clé du second compte n'est pas accessible ici.
- Test navigateur, build intégral, CI : **non validés**.
