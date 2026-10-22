# Carnets du Cambodge — plan de refonte et journal de pilotage

> **SOURCE DE VÉRITÉ DU CHANTIER** — Ce fichier fait foi pour l'objectif, le périmètre, les décisions, l'avancement et la reprise entre conversations.  
> Dépôt : https://github.com/roro78/cuisine-cambodgienne  
> Site : https://www.cuisine-du-cambodge.com/culture/  
> **Chemin stable : docs/carnets/PLAN-REFONTE-CARNETS.md (branche main)**  
> Création : **22 octobre 2026** · Version du plan : **v1.1 (préparation M1 en PR, non fusionnée)** · Responsable de validation : **propriétaire du site**  
> État du projet : **M1 — 7 FICHES D'AUDIT ET BRIEFS PRÉPARÉS EN BRANCHE ; AUCUNE REFONTE PUBLIÉE**  
> **Étape active : M1 — livrables préparés, À VALIDER ; M2 non franchi.**  
> Prochaine action : examiner les sept briefs du [rapport d'audit M1](./AUDIT-M1-BRIEFS-2026-10-22.md), obtenir les décisions D1/M2, réparer les références faibles et obtenir la baseline GSC avant tout déploiement. Aucun article original modifié.

## 1. Objectif final

Transformer la rubrique **Carnets** d'une collection essentiellement explicative en un magazine culturel documenté consacré à la cuisine cambodgienne, sans redondance avec **Recettes**, **Glossaire** et **Ateliers**.

Les Carnets racontent **les lieux, les personnes, les usages, l'histoire et la transmission** ; les Recettes expliquent **comment cuisiner** ; les Ateliers accompagnent **la pratique** ; le Glossaire définit **les termes et ingrédients**.

### Résultats attendus / définition de terminé (qualité, non promesse d'audience)

| ID | Résultat vérifiable | Cible de réception | Preuve attendue |
| --- | --- | --- | --- |
| O1 | Continuité éditoriale et SEO | **7/7 articles existants conservés sur leur URL**, sans perte des redirections historiques connues | Inventaire URL avant/après, requêtes HTTP et sitemap |
| O2 | Valeur éditoriale | **7/7 articles audités** puis enrichis selon un brief approuvé ; informations non banales, pas de doublons purs avec recettes/ateliers | Grille de lecture et diff éditorial par article |
| O3 | Découverte | **4 univers** visibles et navigables : Vie quotidienne ; Terroirs et marchés ; Gestes et transmission ; Fêtes et traditions | Contrôle fonctionnel page /culture/ mobile et desktop |
| O4 | Fiabilité | **100 % des affirmations sensibles** (origine, récompense, IG, pratiques, dates, conservation) reliées à des sources consultables ; aucune histoire ou citation inventée | Registre des sources et contrôle éditorial |
| O5 | Médias | **100 % des nouveaux médias publiés** avec droits/provenance vérifiés, alt descriptif et légende exacte quand nécessaire | Inventaire médias / licences et QA images |
| O6 | Maillage | **7/7 Carnets** avec au moins un lien pertinent vers une autre ressource existante ; aucun lien cassé | Contrôle des liens et vérification manuelle |
| O7 | Accessibilité | Aucun défaut bloquant détecté lors de la revue clavier, mobile et desktop ; titres structurés, images et contrastes contrôlés | Rapport de recette avec captures |
| O8 | Nouveaux sujets | **4 nouveaux Carnets prioritaires** publiés seulement après validation documentaire et éditoriale | Quatre URL, quatre dossiers de sources, revue |
| O9 | Mesure | État de référence Search Console enregistré **avant** déploiement et comparaison à J+28 et J+90 si données disponibles | Export GSC daté, périodes comparables |
| O10 | Traçabilité | Chaque jalon et lot publié fait l'objet d'une mise à jour de ce fichier **dans la même PR**, puis suivi sur main une fois fusionné | Historique GitHub et journal de décisions |

**Attention :** les objectifs O1–O10 sont des critères de réception visés et non des résultats déjà obtenus. Aucun objectif de trafic ou de position Google n'est promis en l'absence de base mesurée.

## 2. État initial connu au 22 octobre 2026

Constaté dans la branche **main** au moment de la création de ce plan :

- Les sept Carnets sont déclarés dans **src/data/culture.ts** ; génération dans **src/pages/culture/[slug].astro** et index dans **src/pages/culture/index.astro**.
- La page index propose actuellement quatre « moments », un carnet à la une, une grille, un parcours kroeung et un manifeste ; **aucun filtrage par quatre univers n'est encore implémenté**.
- Le modèle d'article gère textes, image principale, sources, glossaire et liens associés, avec un cas particulier enrichi en photos pour le riz.
- Une ancienne URL d'article « riz » bénéficie d'une redirection 301 documentée dans **docs/seo-historique-backlinks-2026-10-18.md**. Préserver cet héritage.
- Guide rédactionnel existant : **docs/guide-redaction-culinaire.md** ; inventaire médias : **docs/inventaire-medias-cuisine.md**.
- Les chiffres réels Search Console, les droits et disponibilités de toutes les photos, la qualité UX mesurée et la validité actuelle de chaque source **ne sont pas encore audités ici**.
- **Aucune modification de contenu, de code, de branche de production, de n8n, de Meta ou de Supabase n'est autorisée par la seule création de ce plan.**

**Contrainte éditoriale :** protéger les textes/articles historiques. Avant réécriture, capturer une version de référence, préserver slugs/URLs et redirections, présenter le nouveau brief, puis modifier uniquement après validation explicite du contenu concerné. Ne jamais effacer un original pour faciliter une refonte.

## 3. Répartition éditoriale des sept URL existantes

| ID | URL canonique existante (slug) | Orientation proposée | Univers | Travail attendu | Statut |
| --- | --- | --- | --- | --- | --- |
| C01 | le-riz-symbole-de-vie-au-cambodge | **Le riz, au cœur de la vie cambodgienne** ; quotidien, rizières, variétés, fêtes, distinction internationale | Vie quotidienne | Consolider et enrichir visuels et maillage ; vérifier dates et prix cités | **À valider — brief M1 en PR** |
| C02 | poivre-de-kampot | **Le poivre de Kampot, de la plantation à la table** ; terroir, producteurs, récolte, IG | Terroirs et marchés | Sortir du format fiche ingrédient ; illustrer les étapes | **À valider — brief M1 en PR** |
| C03 | comprendre-le-kroeung | **Le kroeung, des gestes qui se transmettent** ; mortier, variations, usages familiaux | Gestes et transmission | Distinction du tutoriel et renvoi à l'atelier existant | **À valider — brief M1 en PR** |
| C04 | comprendre-amok | **L'amok, un plat et ses interprétations** ; contexte, ingrédients, service, variations attestées | Gestes et transmission | Vérifier les assertions d'origine ; garder la technique dans la recette | **À valider — brief M1 en PR** |
| C05 | kep-marche-crabe-poivre | **Kep, le marché, le crabe et le poivre** ; territoire, commerce, cuisine du littoral | Terroirs et marchés | Traitement reportage **sans prétendre y être allé** ; contrôle photos | **À valider — brief M1 en PR** |
| C06 | prahok-fermentation-umami | **Prahok : conservation et mémoire culinaire** ; pêche, transformations, usages | Gestes et transmission | Documentation et prudence sanitaire ; pas de protocole amateur risqué | **À valider — brief M1 en PR** |
| C07 | construire-repas-cambodgien | **À table au Cambodge, le repas partagé** ; rythmes, compositions, différences familiales | Vie quotidienne | Approche culturelle plutôt que mode d'emploi culinaire | **À valider — brief M1 en PR** |

Les titres sont **des propositions à valider**, pas des renommages effectués. Les **slugs restent inchangés** sauf décision documentée contraire et stratégie SEO spécifique.

## 4. Backlog des nouveaux Carnets

| ID | Priorité | Titre de travail | Univers | État |
| --- | --- | --- | --- | --- |
| N01 | P1 | Les petits déjeuners cambodgiens | Vie quotidienne | Brief et sources à préparer |
| N02 | P1 | Le Tonlé Sap, le lac qui nourrit le Cambodge | Terroirs et marchés | Brief et sources à préparer |
| N03 | P1 | Les desserts traditionnels khmers | Fêtes et traditions | Brief et sources à préparer |
| N04 | P1 | Le sucre de palme cambodgien | Terroirs et marchés | Brief et sources à préparer |
| N05 | P2 | Les marchés de Phnom Penh | Terroirs et marchés | Non démarré |
| N06 | P2 | Les plats des fêtes cambodgiennes | Fêtes et traditions | Non démarré |
| N07 | P2 | Les nouilles de riz, une histoire de gestes | Gestes et transmission | Non démarré |
| N08 | P2 | La cuisine cambodgienne entre générations | Gestes et transmission | Non démarré |

**Ne pas ajouter huit pages d'un seul coup.** N01–N04 forment la première vague ; N05–N08 sont un vivier à reclasser d'après la qualité des sources et les retours de lecture.

## 5. Architecture cible de la page /culture/

1. **Hero éditorial** : « Carnets du Cambodge — Derrière chaque plat, une histoire à découvrir », photographie crédible et introduction culturelle.
2. **À la une** : un récit majeur avec média immersif (choix éditorial explicite, pas dépendance implicite à l'ordre des données).
3. **Explorer par univers** : quatre catégories accessibles, avec libellés et filtres clavier/mobile ou ancres robustes ; ne pas créer d'URL de catégorie inutile.
4. **Tous les Carnets** : cartes harmonisées (titre, univers, résumé utile, durée de lecture vérifiée, photo, lien clair).
5. **Parcours de découverte** : enchaînement pertinent de deux à trois Carnets, vers un ingrédient, un atelier et une recette lorsque justifié.
6. **Sur mobile** : lecture prioritaire ; pas de carrousel obligatoire ni de filtres invisibles ; comportement testé à 360, 390 et 768 px, puis 1280/1440 px.

**Exigence** : conserver la cohérence graphique du site, ne pas modifier le design des autres rubriques dans ce chantier.

## 6. Référentiel obligatoire pour chaque Carnet

- **Angle unique** : question à laquelle répond l'article, intérêt culturel concret, frontière avec Recette/Atelier/Glossaire.
- **Titre clair, chapô documentaire, lieu/période** quand pertinent ; plan lisible avec sous-titres descriptifs.
- **5 à 7 sections utiles** comme repère éditorial adaptable ; souvent **900 à 1 500 mots** si la matière le justifie. Ne pas allonger artificiellement.
- **Preuves** : origines, noms khmers, dates, distinction, réglementation, données et citations factuelles contrôlés ; signaler les variantes régionales et incertitudes. Aucun faux témoignage, aucune visite fictive, aucune histoire « ancestrale » sans preuve.
- **Médias** : photo principale pertinente, photos de chapitre si fiables, crédits/licences/droits, légendes, dimensions, texte alternatif. Pas de fausse photographie documentaire.
- **Liens** : sources externes vérifiées, 1 ou plusieurs connexions internes utiles (autre Carnet, Glossaire, Recette, Atelier) ; aucun faux lien.
- **SEO et UX** : titre H1 unique, description spécifique, métadonnées cohérentes, URL stable, données structurées Article valides, contraste et navigation au clavier, mobile lisible.
- **Sécurité** : la fermentation du poisson, les aliments crus et les pratiques de conservation ne donnent lieu à aucune consigne domestique non validée.
- **Visa éditorial** : chaque Carnet reçoit un contrôle des faits, un contrôle des médias et une approbation avant publication.

Sources candidates à recouper, et **non réputées intégralement vérifiées** par ce document : FAO, UNESCO, OMPI/WIPO, Ministère du Tourisme du Cambodge, publications de recherche, organismes spécialisés et témoignages identifiables. Un site promotionnel seul ne suffit pas pour des affirmations historiques fortes.

## 7. Jalons, livrables, gates et indicateurs

Les jalons sont **séquentiels**, sans délai inventé. Commencer par M1, n'avancer qu'une fois son gate atteint.

| Jalon | Livrable | Critère de passage | Statut initial |
| --- | --- | --- | --- |
| **M0 — Pilotage** | Plan versionné et accès depuis le dépôt | Fichier sur main, lien lisible, étape active explicite | **FAIT le 22/10/2026** |
| **M1 — Audit et briefs** | Inventaire C01–C07 : source, photos, liens, H1, SEO, fiche par article ; baseline GSC si disponible ; briefs proposés | **7 fiches** + écarts consignés ; aucun contenu original touché ; briefs soumis à validation | **À valider — 7 fiches documentées en PR ; GSC absente** |
| **M2 — Validation éditoriale** | Angles/titres/plans/sources cibles validés, modèle commun fixé ; priorités N01–N04 confirmées | Décisions écrites ; refus et inconnues documentés | À faire |
| **M3 — Enrichissement C01–C07** | Sept articles préparés par petits lots, changements tracés, médias sourcés | **7/7** fiches contrôlées et acceptées ; URLs inchangées ; aucun contenu inventé | À faire |
| **M4 — Index Carnets** | Refonte /culture/ avec quatre univers et nouveaux parcours | Navigation accessible, responsive, cohérence avec les sept Carnets | À faire |
| **M5 — Première vague N01–N04** | Quatre nouveaux dossiers, articles et visuels | **4/4** validés, sources et média vérifiés ; publication par lot possible | À faire |
| **M6 — Recette technique et publication** | Tests éditoriaux, build, liens, SEO, photos, mobile/desktop, vérification OVH | Aucun défaut bloquant ; accord propriétaire avant fusion/déploiement ; compte-rendu HTTP après mise en production | À faire |
| **M7 — Mesure et itérations** | Comparatifs GSC J+28/J+90, retours et backlog N05–N08 | Observations mesurées, décisions de correction documentées | À faire |

**Clarification du gate M6** : des PR de préparation peuvent être créées avant M6 ; leur fusion et surtout le **déploiement OVH** nécessitent une validation explicite de l'utilisateur. Ne pas interpréter l'approbation du plan comme une autorisation de publier.

### Contrôles techniques à exécuter pendant M3–M6

- Inspecter les scripts existants dans package.json plutôt qu'inventer des commandes.
- Tester les contraintes éditoriales, les routes générées, les liens internes, les six ateliers existants et les recettes associées, le build Astro et la CI.
- Contrôler les anciennes redirections (dont celle de l'article riz) et le sitemap ; ne pas changer l'hôte canonique.
- Captures et navigation réelle à 360/390/768/1280/1440 px ; vérifier focus, états de filtre, stabilité des images, performance raisonnable.
- Comparer la version publiée OVH **après** déploiement, pas seulement le build ou la branche ovh-production.

## 8. Frontières et chantiers parallèles

**Autorisé ici :** documentation Carnets, contenus Culture, index /culture/, éléments UI exclusivement nécessaires, médias et tests de cette rubrique.

**Exclus sans autorisation distincte :** recettes historiques, les six Ateliers, MP3 et lecteur narratif, n8n, Meta, Supabase, Resend, déploiement OVH, suppression média globale, redirections existantes, configuration des autres produits.

**Règles anti-conflits :**
1. Avant toute modification, vérifier la branche main, les PR en cours et les fichiers modifiés par d'autres chantiers.
2. Utiliser des branches/PR dédiées Carnets pour les travaux ultérieurs ; un seul lot cohérent par PR.
3. Ne jamais écraser du travail parallèle ni réécrire des fichiers d'un autre chantier sans diagnostic.
4. Garder ce document à jour **dans les mêmes PR que les changements Carnets** pour que l'état déclaré corresponde au code. Si la PR n'est pas fusionnée, préciser que l'avancement reste « en PR » et **pas en production**.
5. **Pas de modification, de merge ou de déploiement automatiques** sur simple changement de conversation.

## 9. Pilotage, états et preuves

### États autorisés pour un jalon ou un Carnet

**À faire → En cours → À valider → Validé → Publié → Mesuré.**

État spécial **Bloqué** : noter cause, preuve et décision nécessaire.  
**Validé ≠ fusionné ≠ publié** ; une PR CI PASS ≠ validation UX réelle.

### Mise à jour obligatoire après chaque étape clé

À la fin de **chaque jalon**, de **chaque lot de Carnets** et de **chaque décision de publication** :

1. Mettre à jour l'**en-tête** (date, version du plan, étape active, statut global, prochaine action).
2. Modifier les **statuts de la matrice** C01–C07 / N01–N08 et du tableau des jalons.
3. Ajouter une entrée datée au **journal** ci-dessous, avec : actions réelles, faits vérifiés, tests/résultats, URL de PR/commit/captures ou rapport, risques, décisions/autorisation, prochain geste.
4. Documenter tout changement de périmètre, de priorité, de slug, de média ou de source.
5. Mettre le document à jour **dans la PR de travail avant merge** ; après fusion, vérifier que le lien stable sur main affiche bien la version la plus récente.
6. Si la tâche échoue, écrire **BLOQUÉ**, l'erreur exacte et l'état des travaux. Ne pas écrire PASS sans preuve.
7. Conserver l'historique Git et les entrées de journal ; ne jamais réécrire le passé pour masquer une régression.

### Tableau de bord synthétique

| Indicateur | Situation au 22/10/2026 |
| --- | --- |
| Carnets existants au catalogue main | **7** (constaté dans src/data/culture.ts) |
| Briefs audités/validés | **7/7 préparés pour examen ; 0/7 validés** (en PR uniquement) |
| Carnets enrichis/validés | **0/7** |
| Nouveaux Carnets publiés | **0/4** |
| Univers implémentés sur /culture/ | **0/4** au sens de filtres structurés |
| Index refondu/validé | **Non** |
| Référence GSC chiffrée | **Non collectée** |
| Tests de la refonte | **Non exécutés** |
| Publication de la refonte | **Aucune** |

## 10. Journal chronologique immuable

### 2026-10-22 — J01 — audit M1 et briefs v1.1 (branche dédiée, non fusionnée)
- **Réalisé :** audit statique des 7 URL, titres/H1 de gabarit, textes, descriptions SEO, médias, sources déclarées, liens associés et redirection historique ; comptage indicatif des mots ; 7 briefs de réorientation consignés dans [AUDIT-M1-BRIEFS-2026-10-22.md](./AUDIT-M1-BRIEFS-2026-10-22.md). Vérification des 9 PR ouvertes : aucune collision avec les fichiers du chantier Carnets visés.
- **Vérifications externes ponctuelles :** références FAO, AKP et OMPI consultées ; guide gastronomique touristique en échec d'accès direct (404 dans le contrôle, version indexée disponible) ; accès UNESCO protégé par anti-bot ; pages Commons riz consultables. Aucun constat ne vaut validation générale des faits ou licences de tous les médias.
- **Risques :** durées de lecture probablement surestimées, six articles courts très proches de fiches pratiques, dépendance majeure à une source touristique, aucune mesure GSC collectée, contrôles HTTP/rendu/mobile non réalisés. Aucun contenu éditorial d'origine touché.
- **Décisions en attente :** D1 et M2 (titres, angles, plans, sources cibles et taxonomie), approbation des futurs médias. **Cette mise à jour n'est pas sur main tant que la PR n'est pas fusionnée** ; zéro fusion et zéro déploiement autorisés.
- **État :** M1 « À valider » (livrables 7/7 produits) ; M2–M7 « À faire » ; **0/7 enrichi, 0/4 nouveau, 0 publication**.
- **Prochaine action :** transmettre les sept briefs au propriétaire, recevoir ses décisions, puis préparer le premier petit lot approuvé. Baseline GSC à collecter avant publication.
- **Preuve :** rapport M1 versionné et historique de cette branche/PR.

### 2026-10-22 — J00 — création du plan v1.0
- **Réalisé :** recensement des sept entrées du catalogue Culture et des trois fichiers source principaux ; existence des docs Ateliers, guide éditorial et héritage SEO identifiés ; objectifs, périmètre, jalons et règles de suivi définis.
- **Non réalisé :** aucune réécriture, création de nouveaux Carnets, refonte UI, mesure GSC, test de production ou déploiement.
- **Décision :** plan central sur main comme source de vérité trans-conversations ; les travaux futurs passent par leurs propres branches/PR.
- **Prochaine action :** M1, audit unitaire des sept articles puis proposition de briefs.
- **Preuve :** historique Git du présent fichier.

> Ajouter chaque nouvelle entrée **au-dessus** de la précédente sans modifier les faits historiques.

## 11. Reprise dans une nouvelle conversation / Codex / Work

**Toujours ouvrir d'abord :**  
https://github.com/roro78/cuisine-cambodgienne/blob/main/docs/carnets/PLAN-REFONTE-CARNETS.md

**Prompt de reprise prêt à coller :**

> Reprends le chantier **Carnets du Cambodge** du dépôt GitHub **roro78/cuisine-cambodgienne**. Lis d'abord **docs/carnets/PLAN-REFONTE-CARNETS.md** sur la branche **main** ; c'est la source de vérité, pas un résumé de conversation. Identifie la version, le jalon actif, les gates passés, le prochain geste et les éventuelles PR Carnets ouvertes. Ne refais pas les étapes déjà prouvées ; vérifie seulement les écarts réels par rapport au dépôt. Continue l'étape active de façon autonome dans le périmètre autorisé, sans toucher aux articles historiques ni aux chantiers parallèles avant leur validation. Ne fusionne ni ne déploie sans mon accord explicite. Mets à jour ce même plan lors de chaque étape clé, avec preuves, état précis et prochain geste. Termine par un bilan **FAIT / EN COURS / BLOQUÉ**, les références GitHub et ce qui reste à valider.

**Si plusieurs versions divergent :** la version fusionnée la plus récente sur **main** est le référentiel accepté ; une PR ouverte peut contenir du travail plus avancé **non encore validé**. Lire les deux et signaler la différence, sans affirmer que la branche main reflète une PR non fusionnée.

## 12. Points de décision à soumettre au propriétaire

- **D1 (avant M3)** : valider les nouvelles orientations, titres et réécritures de C01–C07 après lecture des briefs.
- **D2 (avant M4)** : valider la maquette et les filtres des quatre univers sur mobile/desktop.
- **D3 (avant chaque publication)** : valider le contenu et les visuels réellement produits ; ne pas publier sans autorisation.
- **D4 (à M7)** : décider de lancer N05–N08 sur la base de preuves éditoriales et d'usage, plutôt qu'en suivant mécaniquement le backlog.

**Toute décision non reçue reste ouverte et ne doit pas être présentée comme acceptée.**
