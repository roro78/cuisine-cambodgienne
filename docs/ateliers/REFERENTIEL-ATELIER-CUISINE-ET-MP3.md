# Référentiel obligatoire — Ateliers de cuisine et guides MP3

**Version 1.0 — 20 octobre 2026.** Ce document est la source de vérité pour toute **nouvelle création ou refonte** d'un atelier de Cuisine du Cambodge. Il n'homologue pas rétroactivement les six anciennes capsules de gestes. Les recettes historiques restent inchangées.

## La promesse d'un véritable atelier

Un atelier est une **préparation que le visiteur réalise de bout en bout** : il part des ingrédients, organise son plan de travail, apprend un geste, vérifie le résultat et termine avec quelque chose de concret à servir ou utiliser. Une astuce, une expérience isolée ou une liste de conseils n'est pas un atelier, même si elle comporte une vidéo ou un MP3.

Cette démarche recoupe les cours de cuisine observés : démonstration et participation active, ingrédients et matériel, recette exécutée pas à pas, dégustation et apprentissage transférable.

**Références externes :**
- [Culinère, Paris : pratique, dégustation et gestes techniques](https://culinere.com/en/experiences/cooking-classes/)
- [L'École du 3ème Cercle : recettes faites en cuisine et dégustées](https://www.cours-de-cuisine-paris.fr/en)
- [Terres Rouges, Cambodge : ingrédients frais et cuisine khmère guidée](https://terresrougescollection.com/gastronomie/)
- [Cours de cuisine khmère : courses, préparation et dégustation](https://www.voyagecambodge.com/guide-cambodge/activite/cours-cuisine)

## Contrat éditorial — champs obligatoires

1. **Promesse et résultat matériel :** titre décrivant ce que l'on fabrique, plat ou préparation identifiée, objectif technique mesurable, photographie fidèle du résultat avant publication définitive.
2. **Recette source unique :** slug d'une vraie recette du site, non un simple lien « pour aller plus loin ». Les **quantités et ingrédients sont dérivés de cette recette** ; ils doivent être visibles dans l'atelier, pas seulement sur une page distante. Les réserves spécifiques aux expériences figurent séparément. Si aucune recette n'existe, la créer et valider d'abord, en supplément des articles historiques.
3. **Avant de commencer :** portions/rendement, niveau, durée réelle (gestes + cuisson + attente/refroidissement), ustensiles quantifiés, mise en place, ingrédients à préparer à l'avance, substitutions réalistes, allergènes et sécurité alimentaire. Ne jamais demander de goûter une préparation crue à risque.
4. **Six phases pratiques fixes :** chaque phase comporte titre, temps, ingrédients concernés, actions exécutables, chose à voir/sentir/entendre/toucher ou goûter **si sûr**, test de réussite, erreur fréquente et geste de rattrapage, point de savoir-faire et consigne de sécurité appropriée.
5. **Résultat :** dressage, portion servie, comparaison gustative/sensorielle, conservation prudente sourcée si nécessaire, compétence que l'on pourra refaire.
6. **Sources/culture :** nom khmer vérifié s'il est utilisé, contexte culturel sans généralisation, attribution des sources et variantes signalées ; distinguer clairement recette sourcée et expérience pédagogique créée par le site.
7. **Médias :** vraie image des ingrédients **et** vraie image du résultat au plus tard pour la publication ; illustrations d'étapes fidèles à ce qui se réalise. Ne jamais annoncer une image de matière première comme photo du plat terminé.
8. **Accessibilité :** recette réalisable sans MP3 ni JavaScript ; étapes lisibles sur smartphone, liens et transcript accessibles.

### Les six phases invariantes (adaptation culinaire autorisée)

| Phase | Nom de contrat | Ce que fait réellement l'élève |
|---|---|---|
| 1 | installer | Réunit ingrédients, mesures, ustensiles ; sécurise le poste et se met en place. |
| 2 | preparer | Lave, taille, dose et prépare les ingrédients qui entrent dans la recette. |
| 3 | assembler | Réunit les éléments de la base et comprend leurs proportions. |
| 4 | maitriser | Effectue le geste essentiel : piler, cuire, saisir, infuser, émulsionner, etc. |
| 5 | rectifier | Contrôle réellement le résultat ; ajuste sans geste automatique ni dégustation dangereuse. |
| 6 | terminer | Termine, dresse, sert ou conditionne et récapitule la compétence. |

La phase 4 **n'impose pas une cuisson** si la recette est sans cuisson (ex. kroeung cru). Les 6 phases ne sont pas forcément de durée égale. Les petits exercices d'observation **s'insèrent dans la recette**, ils ne remplacent pas la recette.

## Contrat du MP3 — même atelier, même référence éditoriale

- **Sept chapitres** : une introduction suivie des six phases **dans le même ordre**, identifiées par les mêmes IDs. C'est la trame standard pour les nouveaux enregistrements. Les anciens MP3 à cinq chapitres restent des **capsules techniques historiques**, et ne doivent pas être renommés en nouveaux guides de recette.
- **Introduction (20–45 s indicatif)** : résultat concret promis, durée indicative, sécurité utile, incitation à préparer les ingrédients et à **mettre en pause** pendant le geste.
- **Chapitres pratiques** : une invitation à agir, une raison culinaire, **un repère sensoriel observable**, un piège fréquent et/ou une correction, puis une **pause à faire par l'utilisateur**. Le MP3 n'est ni la lecture de l'article ni un métronome ; le passage de chapitre n'est pas prétendument interactif.
- **Narration tirée du même modèle** que la fiche : ID, quantités et titres cohérents. Pas de copier-coller intégral des actions écrites. Ne pas inventer de chronologie ni de dosage différent.
- **Voix** : voix féminine française Coral utilisée par l'infrastructure existante tant que ce choix est maintenu ; aucun secret de backend dans le dépôt et aucune mention du fournisseur dans l'interface publique.
- **Un seul générateur** : produire un storyboard vérifiable **hors ligne** avec le script d'export, puis réutiliser le backend existant. Ne jamais créer de nouveau service ou demander une clé API ; génération segment par segment, sauvegarde après chaque chapitre, reprise sans synthèse des pistes déjà conformes.
- **Manifeste technique mesuré** : audioUrl, durée réelle et débuts des sept chapitres dérivés des vrais fichiers par ffprobe/ffmpeg, empreinte SHA256, scripts source, statut et résultat des revues. Ne pas prendre les temps de l'atelier écrit pour des minutages audio.
- **Préproduction obligatoire** : contrôle des textes, synthèse, décodage, écoute humaine intégrale (prononciation du khmer, des quantités, blancs/coupures), mobile Android et desktop, navigation des chapitres, transcript, sécurité, respect de la recette. Interdiction de déclarer un PASS acoustique en l'absence d'écoute réelle.
- **Publication par gates** : photo finale fidèle + recette vérifiée + CI + audio intégral et écouté + QA mobile/desktop + revue avant passage en publication. Pas de fusion ni OVH automatique dans un workflow TTS.

### Contrat technique réutilisable

Copier le fichier [exemple-kroeung-jaune.json](./exemples/exemple-kroeung-jaune.json) dans une nouvelle fiche de travail : ne pas réutiliser la même identité/slug. Le JSON est une **fiche de conception**, pas un contenu automatiquement publié.

- L'interface se base sur la **recette canonique** (champ sourceRecipeSlug) pour construire ingrédients et proportions. Les champs additionalTrialIngredients ne contiennent **que** les quantités utiles aux exercices, sans doubler la base.
- Les six objets phases portent les IDs imposés ci-dessus, le texte, l'observation, le diagnostic et le script audio.
- Le storyboard TTS se calcule sans réseau en une commande : \`node scripts/export-cooking-workshop-audio.mjs docs/ateliers/exemples/exemple-kroeung-jaune.json\`.
- Vérification éditoriale hors ligne : \`node scripts/check-workshop-blueprints.mjs docs/ateliers/exemples/exemple-kroeung-jaune.json\`.
- Les tests automatiques refusent une source recette absente, un champ obligatoire vide, une phase manquante, un ingrédient inventé dans la liste de référence ou une narration qui reproduit littéralement l'instruction principale.
- L'exemple kroeung constitue une **démonstration de la trame**, pas une validation gustative, une génération vocale ni une nouvelle publication.

## Migration : six fiches à refondre, sans remplacer les archives

| Ancienne fiche (conservée pendant la migration) | Recette canonique | Futur atelier complet |
|---|---|---|
| piler-aromates-au-mortier | kroeung-jaune | Fabriquer son kroeung jaune, du taillage à la pâte |
| equilibrer-une-sauce | samlor-machu | Préparer le Samlor Machu et équilibrer son acidité |
| saisir-viande-poele | lok-lak | Réaliser le Lok Lak, de la mise en place à la saisie |
| fraicheur-herbes-agrumes | num-banh-chok | Préparer le Num Banh Chok et ses garnitures fraîches |
| bouillon-leger-savoureux | kuy-teav | Préparer le Kuy Teav et construire son bouillon |
| composer-repas-cambodgien | bai-sach-chrouk | Préparer le Bai Sach Chrouk, riz et garnitures compris |

**Attention au périmètre :** ces associations sont des décisions éditoriales de refonte, pas des ateliers déjà créés ou validés. Les vieux textes, les six MP3 et les URL restent inchangés tant que les nouveaux ne sont pas approuvés. La PR #88 Sauce tamarin est un chantier parallèle : il faudra y adapter ce contrat sans régénérer son MP3 existant par inadvertance. Les contenus n8n, réseaux sociaux et les autres chantiers ne sont pas concernés.

## Checklist des gates

- **G0** recette source et portions vérifiées ; tous les ingrédients et quantités explicités ;
- **G1** six phases réalisables, geste compris, contrôles sensoriels sûrs, dépannage ;
- **G2** images fidèles aux gestes et au plat terminé, droits vérifiés ;
- **G3** sept scripts cohérents, sans duplication « texte lu », approuvés avant TTS ;
- **G4** MP3 réel mesuré, intégralement écouté, chapitre et transcription exacts ;
- **G5** responsive tactile/clavier, no-JS, SEO, liens recette ↔ atelier ;
- **G6** PR review, CI, approbation humaine, publication OVH manuelle puis vérification publique.

**Statut documentaire 20/10/2026 :** le référentiel et son exemple peuvent être validés séparément ; ni les six ateliers historiques ni le pilote tamarin n'obtiennent automatiquement le statut G6.
