# Référentiel permanent — Ateliers immersifs et narration Coral V2

**Cuisine du Cambodge · norme éditoriale et technique V2 · 21 octobre 2026**

**STATUT : RÉFÉRENTIEL RÉUTILISABLE POUR TOUS LES FUTURS ATELIERS.** Ce document complète le [référentiel structurel des ateliers et MP3](./REFERENTIEL-ATELIER-CUISINE-ET-MP3.md) fusionné en PR #90. **En matière de narration immersive, de durée et de quantités vocales, cette V2 prime sur les recommandations de longueur des anciennes capsules.** Les contraintes de sources, recette réelle, photographies et droits, sécurité, six phases et publication de PR #90 restent obligatoires.

## Contrat lexical bloquant — avant approbation, avant Coral

Une recette ou un atelier se **prépare** et se **cuisine** : on coupe, émince, pile, mélange, fait revenir, laisse mijoter, rectifie l'assaisonnement et dresse. Le mot **« fabriquer »** et toutes ses flexions, ainsi que « fabrication », sont **interdits dans tout contenu éditorial de recette, fiche pratique et narration**. Ne pas écrire non plus « construire une sauce », « construire un bouillon », « chantier », « poste » (dire « plan de travail »), « monter les bols » (dire « dresser les bols »). Les identifiants internes `installer`, `preparer`, `assembler`, `maitriser`, `rectifier`, `terminer` restent stables ; ce ne sont pas des titres obligatoires pour le visiteur.

**Ordre non négociable** : recette et ingrédients contrôlés → fiche pratique complète → sept textes parlés lisibles remis à l'utilisateur → **approbation explicite des textes** → synthèse Coral → écoute et contrôle des chapitres sur mobile. L'existence d'un MP3 ne vaut jamais approbation. Modifier une phrase parlée invalide l'association au MP3 précédent, lequel doit être conservé séparément, sans lecture sous le nouveau script.

Le contrôle automatique `node scripts/check-culinary-lexicon.mjs` bloque le catalogue et les fiches de revue s'il trouve du vocabulaire de chantier ou une narration modifiée encore associée à une ancienne piste. La passerelle TTS exige en plus les validations humaines et l'empreinte exacte du script approuvé avant tout appel audio.


## 1. Modèle réellement approuvé

**Atelier étalon : Lok Lak V2, bœuf MARINÉ AVANT SAISIE.** Le script de référence est [lok-lak-coral-v2-preproduction.md](./scripts/lok-lak-coral-v2-preproduction.md) et les champs parlés réellement enregistrés figurent dans `src/data/atelier-recette-guides/lok-lak.json`. Sa piste est `public/audio/workshops/lok-lak-de-la-poele-a-l-assiette/atelier-coral-v2.mp3`, **789,936 secondes (13 min 10 s)**, sept chapitres. SHA-256 : `d3f5558c07f7aff5c4c57ccf7c662544079744dc0fa8223ec869a6b061d0912e`.

Le propriétaire du site a **validé ce MP3 à l'écoute** le 20 octobre 2026 ; les champs `review.audioListeningValidated` et `manifest.review.acousticListening` valent `true`. **Ni test de cuisine, ni photos/droits, ni validation de navigation humaine Android/desktop ni publication ne sont implicitement approuvés.** L'exemple fixe **la qualité de la narration**, pas une durée obligatoire ni la recette des autres plats.

**Ne jamais modifier, générer à nouveau ou remplacer la V2 approuvée sans nouvelle décision explicite. Ne jamais effacer les fichiers V1 historiques.**

## 2. Promesse pédagogique et public

- Public prioritaire : **personnes qui cuisinent déjà un peu**, prêtes à progresser sur de vrais gestes. Niveau accessible sans vocabulaire technique non expliqué ; pas de cours réduit aux généralités.
- Ambition : **cours susceptible d'être payant**. On prépare le plat ou la préparation du début à la fin, avec conseils qui ont une valeur culinaire réelle.
- Contrat principal : après avoir choisi le nombre de convives et préparé les quantités de sa fiche, une personne doit pouvoir **réussir la recette en suivant surtout le MP3, sans lire le texte en continu**.
- Même trame sur la fiche et l'audio ; le texte est aussi **entièrement utilisable sans son et sans JavaScript**. Aucun geste indispensable n'est seulement dans l'audio.

## 3. La cuisinière : direction artistique vocale

Une **cuisinière francophone, voix féminine Coral**, qui parle comme une créatrice de contenu culinaire **présente à côté de l'élève** : souriante, chaleureuse, complice, experte, rassurante et encourageante.

**À faire :**
- Employer un français oral vivant, des phrases parfois courtes, un « on » naturel, quelques apartés appropriés et une progression logique. S'adresser à l'auditeur sans surjeu.
- Expliquer **quoi faire, comment le faire, pourquoi cela fonctionne, comment reconnaître le résultat et comment rattraper** une erreur fréquente.
- Varier l'accroche : « Bonjour et bienvenue ! », « Bonjour ! », « Coucou ! » selon le plat. Une introduction suffit, pas de salutation au début de chaque chapitre.
- Varier la conclusion : « Bon appétit ! », « Régalez-vous ! », « Bonne dégustation ! », avec un vrai bilan pédagogique. Pour une pâte crue à utiliser ultérieurement, préférer « Bonne cuisine ! » : ne pas inviter à manger une préparation qui ne doit pas l'être.
- Encouragements spécifiques, sobres : « Si ça rend un peu d'eau, ça arrive. Réduisez la quantité dans la poêle et reprenez », jamais faux compliment automatique.
- Expliquer à voix haute chaque grande transition : « Maintenant, notre viande est marinée, on va passer à la saisie. » La page suit les grandes phases ; **elle ne remplace pas ces annonces**.

**À proscrire :**
- Voix robotique, slogans marketing, pédagogie scolaire récitative, fiches lues mot à mot, longues généralités, injonctions répétées, « bravo ! » mécanique.
- Prétendre voir, sentir ou goûter réellement le plat de l'utilisateur, reconnaître le moment où il revient, ou dialoguer en temps réel : il s'agit d'**un MP3 préenregistré**, pas d'une IA interactive.
- « Vous pouvez mettre pause » toutes les vingt secondes ; réserver cette phrase aux gestes ou attentes qui le justifient.
- Inventer des anecdotes personnelles ou attribuer une coutume khmère à tout un pays sans source.

## 4. Quantités et matériel — règle non négociable

- La fiche propose un **nombre de convives modifiable** ; les quantités doivent être recalculées et visibles sur la page. Vérifier les ingrédients fractionnaires, les œufs, les sauces, les garnitures et les unités, notamment à 1, 2, 4, 6, 8 ou 12 personnes.
- **Un MP3 unique pour toutes les portions. Ne pas annoncer de grammages, volumes ou nombres d'ingrédients qui changent avec les convives** : ni « 200 g de poulet », ni « prenez quatre tomates », ni « deux assiettes ».
- Dire au début : « Choisissez votre nombre de convives sur la fiche et préparez les quantités indiquées. » Ensuite nommer **chaque ingrédient au moment de l'utiliser**, sans chiffre de portion.
- Les **repères de technique invariants** sont permis à la voix : cubes d'environ 2–3 cm, « laisser mariner vingt minutes au frais », température à cœur sourcée, texture, consistance, couleur. Distinguer nettement ces repères des quantités variables.
- La cuisinière **annonce le matériel au début**, de manière naturelle et suffisamment courte (généralement moins d'une minute) ; compter les ustensiles uniquement si leur nombre ne dépend pas des convives.
- Chaque ajout pédagogique au catalogue canonique (huile de cuisson, eau, pickles, accompagnement, etc.) doit figurer **séparément** sur la fiche, avec sa provenance, son rôle et ses quantités adaptables. **Ne jamais ajouter un ingrédient dans la voix qui manque à la fiche.**

## 5. Sept chapitres, six étapes invariantes

L'enregistrement comprend exactement **intro + installer + preparer + assembler + maitriser + rectifier + terminer**. Ces identifiants sont immuables, mais les titres entendus et le contenu changent selon le plat, la technique et l'ordre réel des opérations. Les phases ne sont **pas des cases à remplir artificiellement** : chaque phase correspond à un travail culinaire réel, réalisable et vérifiable.

| Chapitre | Contenu oral obligatoire |
|---|---|
| **intro** | Salutation humaine ; plat/résultat ; compétence du jour ; portions sur la fiche ; annonces du rythme, de la possibilité de pause et, s'il y a lieu, de l'attente réelle. |
| **installer** | Présenter clairement le matériel ; plan de travail ; ingrédients principaux et bol(s) nécessaires ; allergies/précautions utiles, séparation cru/cuit ; invit­er à mettre pause pour s'installer. |
| **preparer** | Découpes précises, tailles, lavages, hachages, mesures à la fiche, marinades ou bases faites **avant** la cuisson si la recette l'exige ; ordre technique exact et gestes reproductibles. |
| **assembler** | Construire les préparations restantes, bouillon, sauces, condiment, garnitures ; expliquer les rôles des saveurs et comment organiser les temps morts. Si la viande marine : préparer légumes/condiment pendant l'attente. |
| **maitriser** | Geste-clé détaillé (saisir, piler, cuire, infuser, etc.) : intensité/position, chronologie, temps indicatifs non trompeurs, indices sensoriels, risques, fournées, erreurs et correction ; sécurité. |
| **rectifier** | Tester la cuisson/texture/acidité ou assaisonnement **de façon sûre**, ajuster précisément, expliquer les solutions aux incidents (trop salé, trop liquide, brûlé, trop ferme) sans inventer de garantie. |
| **terminer** | Finaliser/dresser/conserver selon le plat, comparer les sensations, rappeler deux ou trois acquis réutilisables, conclusion chaleureuse et appropriée. |

Chaque chapitre comporte, selon sa fonction, **un geste compréhensible, un pourquoi, au moins un repère vérifiable, un risque courant et une correction réaliste**. Les repères d'une soupe, d'un mortier et d'un sauté **ne sont pas interchangeables**. Les préparations intermédiaires indispensables ne doivent jamais être éludées par « ajoutez votre bouillon/sauce/pickles » sans recette, sous-préparation ou lien explicite et consignes de mise en place.

La narration est **intégrale et naturelle**, pas une liste d'étapes récitées. Le Lok Lak étalon dure 13:10. Les autres cours peuvent durer moins ou plus selon leur complexité ; une piste de 1–2 minutes qui omet des gestes **n'est pas un atelier complet**. Ne pas allonger artificiellement : mesurer la durée résultant de l'explication utile.

## 6. Contrat des pauses et de la page

- Les pauses sont **invitations vocales uniquement**, à la fin d'une préparation significative ou durant un repos/cuisson nécessitant une action de l'élève. Exemple : « Prenez le temps de finir vos découpes. Vous pouvez mettre le guide en pause et relancer quand tout est prêt. »
- **La narration MP3 poursuit si la personne ne touche pas Pause.** Aucun arrêt magique, aucune attente détectée et aucune commande vocale.
- À la suite du texte dans le MP3, une reprise orale naturelle : « Voilà, maintenant que nos légumes sont prêts, passons à… » Ne pas prétendre observer le vrai geste effectué.
- **Le défilement automatique est facultatif** avec « Suivre la narration ». Défilement **seulement aux six frontières de phase**, pas à chaque phrase ni à chaque mouvement du couteau. Défilement manuel/tactile = désactivation du suivi, **sans mettre le son en pause**.
- Sur mobile : mini-lecteur visible lorsque l'audio est actif, contrôles Play/Pause/Arrêt et suivi de phase, navigation tactile ; prise en compte du mode réduction des animations. Aucun doublon de piste audio.
- Contrôler l'alignement des chapitres depuis les **timestamps mesurés de la vraie piste**, et non les minutes théoriques de cuisine. Permettre l'écoute sans défilement, les sauts de chapitre, et l'usage sans JS via les textes.

## 7. Recettes, sources et sécurité

Pour chaque atelier, relire la recette canonique `src/data/recipes.ts`, sa fiche atelier et **au moins deux sources culinaires fiables externes**, privilégiant auteurs cambodgiens et références locales documentées. Conserver liens, date de vérification, faits, variantes, hypothèses et divergences. **Ne pas prétendre à une tradition unique** ; un choix d'atelier différent doit être expliqué, sans retoucher silencieusement l'article historique.

Avant de synthétiser, vérifier **chaque ingrédient et sous-préparation** dans les étapes et dans l'audio ; aucun « bouillon », « sauce », « kroeung » ou « pickles » préparé de manière implicite. Relever allergènes, contamination croisée, température à cœur et refroidissement/conservation avec sources adaptées ; ne jamais déduire une cuisson sûre du seul brunissement ou d'une durée indicative. Pas de conseil risqué improvisé.

Pour la prépublication, photographies **fidèles au vrai plat réalisé** et droits vérifiables ; ne jamais déclarer validée une image provisoire ou générée qui ne prouve pas le résultat cuisiné.

## 8. Contrat technique, synthèse et sauvegardes

- Les fichiers `src/data/atelier-recette-guides/<recette>.json` et `src/data/atelier-recette-audio/<recette>-v2.json` sont la source de vérité machine. `storyboardVersion: 2`, script actuel intégré au blueprint, et manifeste de l'ancienne version conservé.
- Adapter le **générateur existant** `scripts/bridge-cooking-workshops-coral.mjs` (actuellement V2 limité à `lok-lak`) pour les autres recettes **sans créer de nouveau backend, sans demander de secrets**, et sans altérer le Lok Lak approuvé. Utiliser Coral sur l'infrastructure Render existante.
- `--plan` et `--check` sont **hors ligne** ; lancer ces contrôles avant tout TTS. Les sous-segments TTS sont de taille prudente, puis **assemblés en un MP3 par atelier**, avec **sept chapitres visibles seulement**.
- Checkpoint unique par atelier + chapitre + index + empreinte du texte ; **refuser toute piste partielle/ancienne sous le mauvais hash**. Sauvegarder chaque sous-piste immédiatement dans GitHub Actions et exiger un artefact réel non vide. Récupération/reprise sans répéter un fragment déjà synthétisé.
- **Une génération par atelier et par version, séquentielle**, pas de boucle incontrôlée ni de déploiement automatique. Timeout incertain : arrêter le segment ; ne jamais réessayer aveuglément une réponse peut-être facturée. La reprise doit se baser sur la vérification des artefacts réels. Ne pas introduire de planification.
- Sortie nouvelle V2 (`atelier-coral-v2.mp3`) **distincte du fichier V1** ; manifeste distinct à sept chapitres ; hash SHA-256, durée et timestamps `ffprobe`. Protéger les cinq fichiers MP3 existants, les six MP3 historiques et le Lok Lak V2 déjà validé.
- **Ne jamais prétendre « écoute humaine validée » après une simple CI.** En cas d'approbation d'écoute par le propriétaire, `blueprint.review.audioListeningValidated` et `manifest.review.acousticListening` se synchronisent uniquement pour **le SHA du MP3 exact**.
- QA obligatoire : `node scripts/check-workshop-blueprints.mjs`, tests recette/éditoriaux/audio, `npm run check`, `npm run build`, tests Playwright mobile 360/480/800 px et desktop, navigation/pause/scroll et lien vers MP3 réel ; ne pas masquer les échecs.

## 9. Modèle de rédaction (à adapter au plat, jamais à copier tel quel)

**Intro :** « Bonjour et bienvenue ! Aujourd'hui, on prépare ensemble [plat]. Le geste qu'on va travailler, c'est [technique]. Vous avez déjà préparé les quantités de la fiche pour vos convives ? Je vous accompagne jusqu'au service… Allez, on commence ! »

**Matériel :** « Pour cuisiner tranquillement, prenez [ustensiles réellement utilisés]. Installez [ingrédients/bols]. On garde [cru] bien séparé de [crudités]. Quand tout est prêt, on passe à la préparation. »

**Geste :** « Commencez par [action exacte + taille ou repère technique invariant]. Le petit détail qui change tout : [pourquoi]. Vous cherchez [aspect/sensation vérifiable]. Si [problème fréquent], [rattrapage réel]. »

**Pause facultative :** « Prenez votre temps pour [préparation]. Vous pouvez mettre le guide en pause, et relancer lorsque vous êtes prêt. »

**Reprise naturelle enregistrée :** « Voilà, maintenant que [résultat attendu], on va s'occuper de [phase suivante]. »

**Fin :** « Aujourd'hui, vous avez appris [gestes transférables]. Merci d'avoir cuisiné avec moi. [Bon appétit / régalez-vous / bonne cuisine, selon la préparation] ! »

Ne pas produire de scripts identiques avec seulement le nom du plat remplacé. Chaque aliment nécessite **des consignes sensorielles, risques et corrections propres**, vérifiées dans la recette.

## 10. Gates — ne pas mélanger les états

- **V0 Source** : recette et variantes documentées, tous les ingrédients et préparations expliqués, portions adaptables, sécurité.
- **V1 Script** : sept textes **entiers, jouables sans regarder la page**, relus contre les gestes et les sources, puis intégrés à la fiche. Sans validation du script, pas de synthèse payante.
- **V2 Technique** : nouveau MP3 Coral enregistré une fois, MP3 lisible, hash et timestamps exacts, tests automatisés et responsive.
- **V3 Écoute humaine** : l'utilisateur écoute le fichier réel et exprime sa validation du rendu vocal. Ne jamais inventer cette approbation.
- **V4 Réalité culinaire** : recette cuisinée, résultat vérifié, photos du plat réel + droits, tests humains Android/desktop.
- **V5 Publication** : autorisation explicite distincte, `release_ready` seulement si toutes les preuves sont présentes ; revue PR, merge et OVH manuel, puis contrôle du site public.

**Règle absolue :** pouvoir écrire « techniquement prêt pour préécoute » ne donne pas le droit d'écrire « prêt à vendre » ou « publié ». Les cinq autres ateliers restent en `draft` tant que leurs preuves propres sont absentes.

## 11. Périmètre et héritage

Préserver la PR #89 réseaux sociaux/n8n, la PR #88 tamarin, les recettes et articles historiques, les anciens MP3, les paramètres secrets et les déploiements OVH. Cette norme s'applique aux **cinq prochains ateliers et à tous les ateliers créés après eux**. Un ajout futur doit consulter ce référentiel **avant** tout script ou synthèse.
