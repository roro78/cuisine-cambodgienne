# Cuisine du Cambodge — Référentiel permanent de génération IA éditoriale et visuelle

**Version 1.0 — 28 octobre 2026.** Contrat **cible** de production, non annonce d'une IA déjà raccordée au Studio. À appliquer à toute nouvelle recette, tout atelier, Carnet, ingrédient ou technique, sans recréer de gabarit ni réécrire le contenu existant. L'IA reste un assistant sous validation humaine.

**Point de reprise confirmé — 29 octobre 2026 (GitHub) :**

| Lot | État et preuve | Portée réellement acquise |
|---|---|---|
| P1C-C1 | [PR #150](https://github.com/roro78/cuisine-cambodgienne/pull/150) fusionnée | Contrat structuré des cinq familles, sans fournisseur |
| P1C-C2 | [PR #151](https://github.com/roro78/cuisine-cambodgienne/pull/151) fusionnée sur `0db7bcb` | Générer une proposition simulable → relire/corriger → sauvegarder **explicitement** en privé |
| P1C-C3 S1 | [PR #152](https://github.com/roro78/cuisine-cambodgienne/pull/152) fusionnée sur `d14be5f` | Préparer/valider mécaniquement les sorties structurées, sans benchmark réel |
| P1C-C4A | [PR #153](https://github.com/roro78/cuisine-cambodgienne/pull/153) fusionnée sur `7c46a3b` | Diagnostics des écarts Astro, publication systématiquement bloquée |
| P1C-C4B1 | [PR #154](https://github.com/roro78/cuisine-cambodgienne/pull/154) fusionnée sur `dafea2d` | Profil **humain** recette (difficulté/catégorie/tags), versionné et séparé du contrat IA |
| P1C-C4B2 | [PR #155](https://github.com/roro78/cuisine-cambodgienne/pull/155) fusionnée sur `5fcc50e` | Projection **privée** des champs de base Recipe avec quantités numériques strictement validées |
| P1C-C4B3 | [PR #157](https://github.com/roro78/cuisine-cambodgienne/pull/157) fusionnée sur `b833029` | Détails humains des ingrédients et gestes, liés à leurs lignes d’origine ; aucun déplacement silencieux |
| P1C-C3B | [PR #158](https://github.com/roro78/cuisine-cambodgienne/pull/158) fusionnée sur `dfa91dc` | Pont d’essai local Ollama S1 manuel ; **aucun modèle ni résultat réel évalué** |
| P1C-C4C1 | [PR #159](https://github.com/roro78/cuisine-cambodgienne/pull/159) fusionnée sur `d1f69cf` | Dossier documentaire Carnets versionné et privé, non exporté vers les pages publiques |
| P1C-C4C2 | [PR #162](https://github.com/roro78/cuisine-cambodgienne/pull/162) fusionnée sur `8647ab9` | Projections privées IngredientGuide et RecipeTechniqueGuide ; seuls les liens canoniques humains vers des pages publiées sont acceptés |
| P1C-C4C3A | [PR #163](https://github.com/roro78/cuisine-cambodgienne/pull/163) fusionnée sur `47be2cc` | Lien recette source avec empreinte de catalogue et précontrôle des six phases d'atelier, sans scripts ni MP3 approuvés |
| P1C-C4C3B | [PR #165](https://github.com/roro78/cuisine-cambodgienne/pull/165) fusionnée sur `c64cb78` | Six phases humaines détaillées (gestes, durée, contrôles, erreurs, sécurité), ancrées à la recette et à leurs titres ; pas de validation culinaire réelle |
| P1C-C4C3C | [PR #166](https://github.com/roro78/cuisine-cambodgienne/pull/166) fusionnée sur `60946ff` | Sept narrations humaines privées liées au SHA256 pédagogique ; **brouillons prêts à relire, jamais approbations audio** |
| P1C-C4C3D | [PR #168](https://github.com/roro78/cuisine-cambodgienne/pull/168) fusionnée sur `ddaaf84` | Visas humains séparés des 7 textes, versionnés, révocables et audités ; **n'autorisent aucun MP3** |
| P1C-C4C3E | [PR #169](https://github.com/roro78/cuisine-cambodgienne/pull/169) fusionnée sur `e2ec8ae` | Audit privé à la demande de la recette Astro : SHA256 complet, ingrédients, portions ; **sans validation culinaire automatique** |

Les CI de branche des PR fonctionnelles jusqu'à **#169** sont SUCCESS
sous Astro/Node et PHP 8.3/8.4, avec non-régressions mobile et audio existant.
Les CI **après fusion** de #166
([run #40850988200](https://github.com/roro78/cuisine-cambodgienne/actions/runs/40850988200))
et de #168
([run #40859525074](https://github.com/roro78/cuisine-cambodgienne/actions/runs/40859525074))
sont SUCCESS. La CI après fusion de #169 est à réceptionner séparément.
Une CI GitHub ne prouve ni un transfert OVH ni une recette en production.

**Aucun fournisseur IA réel n'est activé, aucun modèle n'a été évalué en
conditions réelles, aucune passerelle n8n n'est réceptionnée, aucune génération
d'image/audio n'est lancée et aucun déploiement OVH n'a eu lieu.** Le contrat
`creation-form-core-v1` demeure volontairement indépendant du profil humain
C4B1 ; il ne produit pas encore une recette complète validée.

**Priorités à poursuivre sans réinventer (mise à jour C4C3E) :**

1. **Qualifier le fournisseur** : vérifier plus tard sur ordinateur l’accès
   authentifié au n8n OVH et au réseau Docker d’Ollama ; ne demander aucun
   identifiant dans le chat. Lancer ensuite un essai contrôlé des briefs et S1
   structuré, par modèle et famille, puis relever la latence, la qualité et
   les coûts réels. Aucun résultat réel n’est aujourd’hui attesté.
2. **C4B4/P2 recettes** : C4B3 (ingrédients et gestes) est fusionné ; préparer
   liens, FAQ, médias et droits vérifiés avant un aperçu Astro fidèle.
   Ne pas transformer une projection privée en autorisation de publier.
3. **C4C3F — visa culinaire distinct et réception Coral** :
   C4C3D permet désormais de viser et révoquer chacun des **sept textes**
   par version ; les journaux sont séparés des réponses IA et rendent
   automatiquement caducs les visas d'une ancienne version. C4C3E ajoute
   une comparaison **sur demande, en lecture seule** avec le SHA256 intégral,
   les ingrédients et portions de la recette Astro publiée. Les synonymes
   sont seulement signalés et les anciens modèles ne reçoivent aucune dose
   inventée. **Ni les visas de texte ni le rapport de concordance ne
   valident encore les quantités, allergies, cuissons ou gestes.**
   Ajouter un contrôle humain explicitement lié au SHA256 intégral de la
   recette, puis séparer approbation de textes, autorisation TTS et écoute
   du MP3 réel. Contrôler les sept chapitres, durées et scroll mobile
   avant toute diffusion ; ne jamais écraser les MP3 validés.
   Les fiches ingrédients/techniques C4C2 restent à compléter côté
   médias et droits. Les sources documentaires des Carnets C4C1 restent
   strictement **privées**.
4. **P2/P3** : vrai aperçu Astro privé fidèle, conversion typée complète,
   validations et PR de publication **distinctes** uniquement sur autorisation.
5. **Exploitation** : conserver le calendrier et les workflows n8n 01/02/03
   inchangés. Réceptionner le futur paquet OVH complet avant toute livraison,
   notamment `index.php`, `lib.php` et `publication-gap-audit.php`.

Ce point de reprise complète le présent référentiel et ne remplace pas les
référentiels spécialisés. Les sources documentaires de travail restent privées ;
les crédits obligatoires des médias doivent être respectés.

**Références normatives existantes, à préserver :**
- \`CMS-STUDIO-ARCHITECTURE.md\` — éditeur partagé, stockage privé, contrat des fiches et publication.
- \`EDITORIAL-AI-MEDIA-PIPELINE.md\` — étapes P0–P5, entrées manuelles/IA et calendrier.
- \`PLAN-EDITORIAL-MEDIA-ACQUISITION-20261025.md\` — veille, anti-doublon, pilotage sur 90 jours, canaux et mesures.
- \`carnets/PLAN-REFONTE-CARNETS.md\` — choix d'angle, recherche, contenu et iconographie culturels.
- \`ateliers/REFERENTIEL-ATELIER-CUISINE-ET-MP3.md\` et \`ateliers/REFERENTIEL-NARRATION-IMMERSIVE-V2.md\` — six phases de cuisine, sept chapitres, voix Coral et validation.
- \`inventaire-medias-cuisine.md\`, \`SOCIAL_CARNETS_VISUELS_FOLLOWUP_20261025.md\`, \`SOCIAL_CONTENT_QA_GATE_20261025.md\` — fidélité des photos, limites des ressources et aperçus sociaux.

En cas de divergence, le **référentiel spécifique à la catégorie** prévaut pour ses champs et sa qualité (notamment la norme ateliers Coral V2). Le présent document les rassemble sans les remplacer.

## 1. Deux portes d'entrée, une seule architecture

- **Création manuelle** : le propriétaire choisit une catégorie, rédige les champs du Studio et sauvegarde une révision privée.
- **Création assistée par IA (cible, non encore branchée)** : brief du propriétaire ou suggestion du plan média → vérification préalable du catalogue → rédaction de la **même structure de champs** → brouillon privé, clairement identifié comme proposition IA.
- **Modification de contenu existant** : conserver l'ID et les protections de version/fingerprint ; ne pas recréer une deuxième URL quand l'enrichissement de la fiche actuelle suffit.
- Les réponses IA doivent être validées côté serveur contre une **projection publique explicitement autorisée** du modèle Astro ; ne jamais générer du PHP ou du TypeScript libre susceptible de changer l'architecture.
- Le formulaire \`public/gestion-contenus/index.php\` et les composants de \`lib.php\` restent les seuls gabarits d'administration. Les champs métiers varient, l'UX et le cycle de vie ne varient pas.

Le module de planification \`scripts/editorial-content-pipeline.mjs\` et ses états existent. Les lots P1C-B, C1, C2, C3, C4A, C4B1/B2/B3 et C4C1/C2/C3A/B/C/D/E sont intégrés dans GitHub, avec les protections de version, provenance et validation humaine décrites ci-dessus. **Le fournisseur IA réel, la rédaction complète de tous les champs métier, les blueprints Coral V2 générés, la conversion/pagination Astro prête à publier, les visuels en self-service et le calendrier média multicanal ne sont pas encore opérationnels.**

## 2. Brief commun obligatoire avant toute génération

Une proposition possède, au minimum :
1. **Identité** : type, titre de travail, slug, langue française, provenance manuelle/IA, sujet et relation éventuelle à une page existante.
2. **Promesse éditoriale** : besoin précis du lecteur, angle nouveau, statut de connaissance (faits confirmés, variantes, points à vérifier), objectif SEO spécifique sans remplissage artificiel.
3. **Lien au catalogue** : recette ou ingrédient canonique, guides frères et liens internes pertinents, statut anti-doublon et décision « nouvelle page ou enrichissement ».
4. **Contexte** : publics et niveau, occasion, ingrédient disponible, saisonnalité/actualité si vérifiée, contrainte de sécurité alimentaire ou de droit média.
5. **Production prévue** : champs du modèle, visuels requis, audio éventuel et dépendances, date cible **indicative**, canaux envisagés, responsables de relecture.
6. **Preuves internes** : faits vérifiés, sources de recherche et dates, provenance des images, licences/autorisations, divergences, validation humaine. Ces références de travail ne sont **pas affichées sur nos pages publiques** ; les crédits légalement requis pour des images, en revanche, doivent être respectés.

Une IA peut suggérer des idées et des briefs ; elle ne peut pas inventer une étude d'audience, un passage historique, une dégustation ni une photographie documentaire.

## 3. Modèles de contenus — cinq contrats non interchangeables

| Famille | Modèle canonique à réutiliser | Minimum éditorial avant relecture humaine | Interdits / particularités |
|---|---|---|---|
| **Recette** | \`src/data/recipes.ts\` et, si modèle historique applicable, \`src/data/restoredRecipes.ts\` | Titre exact du plat, introduction, contexte vérifié, portions adaptables, préparation/cuisson, ingrédients et unités structurés, déroulé intégral des sous-préparations, astuces/variantes réellement justifiées, sécurité, SEO, photo fidèle au résultat | Ne pas inventer des ingrédients ou réduire la recette à une légende sociale ; ne pas changer silencieusement une recette déjà approuvée |
| **Atelier** | \`src/data/cookingWorkshopGuides.ts\`, blueprints \`src/data/atelier-recette-guides/\` et manifestes audio existants | **Recette source canonique approuvée** et quantités cohérentes, objectif pédagogique, mise en place et matériel, **six phases** \`installer/preparer/assembler/maitriser/rectifier/terminer\`, gestes exécutables, repères sensoriels et corrections, sécurité, résultat vérifiable | Le formulaire de création privée P1B **ne suffit pas encore** à constituer une fiche Astro/atelier conforme V2. Une narration complète exige sept chapitres (intro + six phases), validation du texte, synthèse Coral et écoute humaine avant publication. Aucune régénération ni remplacement automatique des MP3 approuvés |
| **Carnet culturel** | \`src/data/culture.ts\` ; plan \`docs/carnets/PLAN-REFONTE-CARNETS.md\` | Angle culturel singulier, chapô documentaire, contexte historique/géographique prudent, **5–7 sections utiles comme repère** (souvent 900–1 500 mots seulement si le sujet le justifie), vérification interne des faits et liens internes | **Jamais un tutoriel, une recette rédigée en culture ou un atelier déguisé** ; pas de bibliographie visible, de reportage fictif, de légende présentant une illustration IA comme une photo d'événement réel |
| **Ingrédient** | \`src/data/ingredients.ts\` | Rôle culinaire, profil aromatique, emplois réels, choix, conservation vérifiée, substitutions et accords pertinents, erreurs à éviter, données SEO et photo identifiée correctement | Ne pas inventer propriétés médicinales, noms scientifiques ou conseils de conservation non fiables ; liens cohérents avec recettes et ateliers |
| **Technique** | \`src/data/recipeTechniques.ts\` | Objectif concret, fournitures/matériel, étapes réalisables et points de contrôle, alternatives adaptées, questions fréquentes, sécurité, images de gestes exactes si nécessaire | Ne pas recopier l'atelier complet ni présenter un procédé dangereux comme maîtrisé sans vérification |

**Exception technique importante** : une projection guidée existante peut n'exposer qu'une partie des champs des modèles Astro, et le formulaire de création manuelle P1B ne gère pas encore l'ensemble des médias ni des chapitres audio. La conversion en nouvelle page est **bloquée** tant que les champs requis du **véritable modèle cible** ne sont pas tous validés. Ne pas extrapoler à partir d'un brouillon \`review\` qu'une page est publiable.

## 4. Production visuelle — une identité, pas une photo recyclée

**Règle commune :** chaque visuel doit illustrer le sujet précis et le bon stade de préparation. Exiger composition, angle de prise de vue, lumière, accessoires et arrière-plan variés à travers les nouvelles fiches ; ne pas déplacer simplement un plat dans une série de compositions identiques.

**Visuels du site** :
- préparer une image principale adaptée à la mise en page réelle, des variantes responsive (p. ex. WebP 480/800/1200 px et largeurs supplémentaires si le composant en a besoin) ; **vérifier les dimensions et le ratio du composant existant**, sans imposer un unique ratio universel ;
- renseigner la description alternative, la destination d'image, la légende, le sujet photographié et les droits/provenances ;
- contrôler le cadrage mobile et ordinateur **sur la vraie page**, et ne jamais recycler une illustration sans lien avec l'article ;
- pour les recettes et ateliers qui promettent une préparation réalisée, fournir une photographie crédible du **vrai résultat cuisiné** avant publication ; une image IA peut être un **concept visuel provisoire** mais ne prouve pas que le plat a été exécuté ni testé ;
- pour les Carnets, une illustration IA est possible si elle est explicitement traitée comme **illustration éditoriale**, sans fausse preuve documentaire, fausse localisation ou fausse personne identifiée.

**Visuels sociaux après publication du site** :
- le catalogue actuel utilise un **JPEG 1080 × 1080** pour les aperçus Facebook/Instagram ; respecter ce contrat tant que la chaîne existante n'est pas modifiée et testée ;
- contrôler zone de sécurité, cohérence entre titre, légende, photo et URL canonique ; surveiller les éventuels recadrages de miniatures Instagram (grille profil 3:4) séparément du fil ;
- prévisualisation sur téléphone dans un fil compact d'environ **300 CSS px** (370 au choix), sans image qui occupe artificiellement toute la hauteur de l'écran ; il s'agit d'une simulation, pas d'une reproduction parfaite de Meta ;
- ne jamais envoyer un visuel à Meta tant que la version, son cadrage et les textes ne sont pas approuvés.

**Registre média privé avant intégration :** ID de contenu, usage/plateforme, catégorie, sujet, statut photo ou illustration IA, prompt/paramètres si généré, référence du fichier original, déclinaisons, dimensions/format, auteur/provenance/droits, texte alternatif, validation et empreinte. Ne pas affirmer disposer de droits qui ne sont pas établis.

## 5. Pipeline éditorial complet (cible, plusieurs jalons encore non construits)

1. **Veille et backlog** : catalogue Git réel, lacunes, questions audience, Search Console et Trends si effectivement connectés, informations d'actualité vérifiées. Proposition IA possible, jamais publication directe.
2. **Priorisation** : plan glissant **90 jours**, revue mensuelle et sélection hebdomadaire ; évaluer apport nouveau, authenticité, faisabilité média, pertinence SEO, parcours de lecture et intérêt mesuré. Pilote historique proposé : maximum une page nouvelle/semaine et deux à quatre propositions sociales/semaine, **hypothèses à ajuster** après observation.
3. **Anti-doublons** : IDs/slugs/titres exacts bloqués dans la famille ; variantes orthographiques/khmères, parenté des recettes, intention de recherche et projets non publiés contrôlés ; similarités signalées pour arbitrage humain. Un Carnet sur l'histoire du kroeung n'est pas un doublon automatique d'une recette du kroeung.
4. **Brief** : angle, champs et médias, relation aux pages, contraintes factuelles, choix manuel ou IA ; validation de l'idée par l'éditeur.
5. **Brouillon** : un seul modèle de formulaire pour la famille ; IA remplit des champs structurés **uniquement en proposition**, conservés en versions privées comme les brouillons manuels.
6. **Vérification** : contrôle documentaire interne, révision culinaire et sécurité, cohérence SEO, authenticité, accessibilité, droits, alt-text, correction et relecture humaine ; renvoyer vers le brouillon si besoin.
7. **Visuels** : choix photo existante ou nouveau brief IA/photo, vérification des droits et de la fidélité, formats du site, variantes sociales ; pas de visuel provisoire présenté comme approuvé.
8. **Atelier audio si pertinent** : sept scripts complets, relecture et approbation → synthèse Coral contrôlée → écoute humaine → mesure des timestamps et tests du suivi page/audio. Aucune synthèse automatique à la création d'un atelier.
9. **Aperçu fidèle puis publication site** : transformer la proposition approuvée en **véritable record typé** du bon \`src/data/\`, dans le gabarit Astro partagé ; créer PR, CI, réception mobile/desktop, approbation et déploiement OVH vérifié. Une case « À relire » ne publie rien.
10. **Campagne sociale** : contenu canonique en ligne + visuel validé → variantes Facebook/Instagram, prévisualisation réaliste, contrôle de doublon de posts, **autorisation sociale distincte** → workflows n8n 01/02/03 avec idempotence.
11. **Mesure** : pages vues/visites attribuables, GSC, performances Meta accessibles, qualité, conversions et retour de communauté ; réinjecter dans le calendrier sans inventer de statistiques.

**États à ne pas confondre** : idée → brouillon → à relire → éditorial approuvé → média approuvé → prêt techniquement → publié sur le site → social proposé → social approuvé → social réellement publié. Les libellés techniques actuels \`draft/review\` ne couvrent pas encore tout ce parcours.

## 6. Règles d'exploitation et tests

- **Source de vérité** : modèles Astro existants, liens canoniques et bibliothèque actualisée, pas un second site de pages IA.
- **Isolation** : brouillons privés hors webroot ; configuration et secrets hors du navigateur et hors du dépôt ; aucune IA ne reçoit le contenu des sessions, jetons Meta ni secrets PHP.
- **Aucun doublon** garanti par un simple seuil de similarité : contrôle mécanique + vérification éditoriale/humaine.
- **Coûts IA** : prévenir les synthèses Coral inutiles, ne générer qu'après vérification du brief et de l'absence de doublon, relancer par étape sans altérer les MP3 approuvés.
- **Tests de régression** : tests des cinq modèles existants, contrat guided, slug/canonical, sorties HTML, sécurité/CSRF, images responsive, SEO, recette complète, MP3 et mobile. Bloquer une nouvelle catégorie mal définie plutôt que l'envoyer à un modèle libre.
- **État actuel** : la saisie manuelle privée P1B est intégrée. Le calendrier, corrigé par `106537c`, est **réceptionné par le propriétaire le 28 octobre : filtres et versions existantes vérifiés**, avec contrôle public GET PASS distinct. Les lots P1C-B à C4B2 sont fusionnés dans GitHub ; aucun fournisseur réel n'est activé et aucun déploiement IA OVH n'a eu lieu. Les contenus Astro complets, la génération visuelle, les ateliers Coral V2 générés, l'aperçu fidèle et la diffusion restent à développer et valider.
- **À chaque nouvelle conversation/IDE** : relire ce document et les référentiels spécialisés, ne pas réinventer une nouvelle trame, mettre à jour l'état de chaque gate avec preuve réelle.

**Objectif :** produire du contenu cambodgien original, exact, agréable à lire, illustré avec fidélité, homogène sur le site et les réseaux, et totalement révisable/validable par le propriétaire avant toute publication.
