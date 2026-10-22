# Carnets du Cambodge — plan de refonte et journal de pilotage

> **SOURCE DE VÉRITÉ DU CHANTIER** — Ce fichier fait foi pour l'objectif, le périmètre, les décisions, l'avancement et la reprise entre conversations.  
> Dépôt : https://github.com/roro78/cuisine-cambodgienne  
> Site : https://www.cuisine-du-cambodge.com/culture/  
> **Chemin stable : docs/carnets/PLAN-REFONTE-CARNETS.md (branche main)**  
> Création : **22 octobre 2026** · Version du plan : **v2.1 (C04 amok culturel prêt en prévisualisation ; 4/7 brouillons)** · Responsable de validation : **propriétaire du site**  
> État du projet : **M2 EN COURS — C01 corrigé ; quatre brouillons culturels C02/C03/C04/C05 en prévisualisation, aucun publié**  
> **Étape active : M2 — frontière culture / ateliers / recettes désormais exigée ; C03 recadré histoire, C04 également reconstruit autour de patrimoine et pratiques sociales. AUCUN TEXTE FINAL ACCEPTÉ.**  
> Prochaine action : faire relire les [brouillons C02](./BROUILLON-C02-POIVRE-KAMPOT-2026-10-22.md), [C03 mémoire du kroeung](./BROUILLON-C03-KROEUNG-TRANSMISSION-2026-10-22.md), [C04 amok patrimonial](./BROUILLON-C04-AMOK-PATRIMOINE-2026-10-22.md) et [C05 Kep](./BROUILLON-C05-KEP-MARCHE-CRABES-2026-10-22.md). **Kep : photo CDN à importer en WebP local**, **C03 : photo culturelle et droits à trouver**, **C04 : image horizontale sous CC BY 2.0 à comparer avec son original**. Exécuter tests/CI, build, responsive ; arbitrer D2 et N01–N04 ; GSC puis visa D3 avant publication. **PR #97–#102 non fusionnées ; branche C04 empilée non publiée.**

## 1. Objectif final

Transformer la rubrique **Carnets** d'une collection essentiellement explicative en un magazine culturel documenté consacré à la cuisine cambodgienne, sans redondance avec **Recettes**, **Glossaire** et **Ateliers**.

Les Carnets racontent **les lieux, les personnes, les usages, l'histoire et la transmission** ; les Recettes expliquent **comment cuisiner** ; les Ateliers accompagnent **la pratique** ; le Glossaire définit **les termes et ingrédients**.

### Résultats attendus / définition de terminé (qualité, non promesse d'audience)

| ID | Résultat vérifiable | Cible de réception | Preuve attendue |
| --- | --- | --- | --- |
| O1 | Continuité éditoriale et SEO | **7/7 articles existants conservés sur leur URL**, sans perte des redirections historiques connues | Inventaire URL avant/après, requêtes HTTP et sitemap |
| O2 | Valeur éditoriale | **7/7 articles audités** puis enrichis selon un brief approuvé ; informations non banales, pas de doublons purs avec recettes/ateliers | Grille de lecture et diff éditorial par article |
| O3 | Découverte | **4 univers** visibles et navigables : Vie quotidienne ; Terroirs et marchés ; Gestes et transmission ; Fêtes et traditions | Contrôle fonctionnel page /culture/ mobile et desktop |
| O4 | Fiabilité | **100 % des affirmations sensibles** (origine, récompense, IG, pratiques, dates, conservation) reliées à des références **consultables dans le registre interne**, non affichées publiquement ; aucune histoire ou citation inventée | Registre interne des sources et contrôle éditorial |
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
| C01 | le-riz-symbole-de-vie-au-cambodge | **Le riz, au cœur de la vie cambodgienne** ; quotidien, rizières, variétés, fêtes, distinction internationale | Vie quotidienne | Consolider et enrichir visuels et maillage ; vérifier dates et prix cités | **Orientation D1 validée — article non enrichi** |
| C02 | poivre-de-kampot | **Le poivre de Kampot, de la plantation à la table** ; terroir, producteurs, récolte, IG | Terroirs et marchés | Histoire du territoire et des producteurs ; **ne pas détailler les étapes techniques de culture ou d'assaisonnement** | **Prévisualisation enrichie préparée — texte/média non validés** |
| C03 | comprendre-le-kroeung | **Le kroeung, une mémoire de la cuisine khmère** ; rupture historique, exil, diaspora, patrimoine | Mémoire et transmission | **AUCUNE technique du mortier, recette, aromate à détailler, tutoriel ou renvoi pratique** ; aucune origine angkorienne sans preuve ; photo culturelle à rechercher | **Orientation initiale annulée ; nouvelle prévisualisation historique NON VALIDÉE** |
| C04 | comprendre-amok | **L’amok, entre patrimoine et tables d’aujourd’hui** ; occasions particulières, identité, récit royal non prouvé, restaurants et diaspora | Mémoire culinaire | **Aucune technique de cuisson, texture à réussir ni ingrédients détaillés** ; histoire royale explicitement qualifiée ; photo horizontale CC BY 2.0 avec crédit obligatoire | **Prévisualisation rédigée — texte/média non validés** |
| C05 | kep-marche-crabe-poivre | **Kep, au marché des crabes, entre mer et poivre** ; pêche, commerce côtier, préservation | Terroirs et marchés | Texte reportage sans visite fictive ; ancienne photo faussement légendée ; visuel CC0 en CDN de staging à internaliser | **Prévisualisation enrichie — texte/média non validés** |
| C06 | prahok-fermentation-umami | **Prahok : conservation et mémoire culinaire** ; communautés de pêche, histoire des échanges, patrimoine | Mémoire culinaire | Raconter les métiers et la place sociale du prahok ; **aucun protocole de fermentation** ni cours d'umami | **Orientation D1 validée — article non enrichi** |
| C07 | construire-repas-cambodgien | **À table au Cambodge, le repas partagé** ; sociabilité, pratiques de table, diversité des milieux | Vie quotidienne | Récit de commensalité ; **aucun menu à construire ni conseil de dressage** | **Orientation D1 validée — article non enrichi** |

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
- **Liens** : références documentaires et URLs archivées **en interne** pour vérification, sans bibliographie ni citation des sources dans la page publique ; 1 ou plusieurs liens de navigation interne utiles (Carnet, Glossaire, Recette, Atelier), sans faux lien.
- **SEO et UX** : titre H1 unique, description spécifique, métadonnées cohérentes, URL stable, données structurées Article valides, contraste et navigation au clavier, mobile lisible.
- **Sécurité** : la fermentation du poisson, les aliments crus et les pratiques de conservation ne donnent lieu à aucune consigne domestique non validée.
- **Visa éditorial** : chaque Carnet reçoit un contrôle des faits, un contrôle des médias et une approbation avant publication.

Sources candidates à recouper, et **non réputées intégralement vérifiées** par ce document : FAO, UNESCO, OMPI/WIPO, Ministère du Tourisme du Cambodge, publications de recherche, organismes spécialisés et témoignages identifiables. Un site promotionnel seul ne suffit pas pour des affirmations historiques fortes.

## 7. Jalons, livrables, gates et indicateurs

Les jalons sont **séquentiels**, sans délai inventé. Commencer par M1, n'avancer qu'une fois son gate atteint.

| Jalon | Livrable | Critère de passage | Statut initial |
| --- | --- | --- | --- |
| **M0 — Pilotage** | Plan versionné et accès depuis le dépôt | Fichier sur main, lien lisible, étape active explicite | **FAIT le 22/10/2026** |
| **M1 — Audit et briefs** | Inventaire C01–C07 : source, photos, liens, H1, SEO, fiche par article ; baseline GSC si disponible ; briefs proposés | **7 fiches** + écarts consignés ; aucun contenu original touché ; briefs soumis à validation | **VALIDÉ pour les 7 orientations, en PR ; GSC non disponible** |
| **M2 — Validation éditoriale** | Angles/titres/plans/sources cibles validés, modèle commun fixé ; priorités N01–N04 confirmées | Décisions écrites ; refus et inconnues documentés | **EN COURS : D1 sept orientations + erratum C01 acceptés ; D2/modèle/priorités N01–N04 à arbitrer** |
| **M3 — Enrichissement C01–C07** | Sept articles préparés par petits lots, changements tracés, médias sourcés | **7/7** fiches contrôlées et acceptées ; URLs inchangées ; aucun contenu inventé | **À faire : C02/C03/C04/C05 pré-rédigés en PR non fusionnées, gate M2 non franchi** |
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
| Briefs audités/validés | **7/7 orientations validées (D1) en PR ; 0/7 articles réécrits validés** |
| Carnets enrichis/validés | **4/7 brouillons en prévisualisation (C02/C03/C04/C05) ; 0/7 articles finalisés/validés** |
| Nouveaux Carnets publiés | **0/4** |
| Univers implémentés sur /culture/ | **0/4** au sens de filtres structurés |
| Index refondu/validé | **Non** |
| Référence GSC chiffrée | **Non collectée** |
| Tests de la refonte | **Non exécutés** |
| Publication de la refonte | **Aucune** |

## 10. Journal chronologique immuable

### 2026-10-22 — J11 — Carnet C04 Amok refondu comme un récit culturel, sans tutoriel
- **Réalisation :** rédaction et intégration sur `docs/carnets-c04-amok-patrimoine-20261022` de C04 `/culture/comprendre-amok/` « **L’amok, entre patrimoine et tables d’aujourd’hui** », six chapitres, 18 paragraphes, ~935 mots. Sujet **culturel seulement** : emblème, occasions particulières dans le témoignage de Kethana Dunnett, feuilles de bananier et images du plat, origine royale **non prouvée**, pratiques contemporaines diverses, présence de l'amok en Californie attestée dans la presse dès mai 1990.
- **Aucun doublon :** suppression des explications de vapeur, textures et recette de C04 ; aucun carrousel de recette/ingrédient sur cette fiche et glossaire réduit au mot « amok ». Les pratiques de cuisine restent dans les rubriques Recettes et Ateliers.
- **Références internes uniquement** : Audrey Gillan 2017, ambassade Cambodge 2022 (tradition royale **non démontrée**), Chef Nak, Phil Lees 2007, Los Angeles Times 1990, ARTE 2025 ; [registre documentaire du brouillon C04](./BROUILLON-C04-AMOK-PATRIMOINE-2026-10-22.md). **Aucune référence documentaire visible dans les pages publiques.**
- **Média principal C04 :** l'ancien `amok-alt-1600.webp` est une photo verticale avec très grand fond rouge, peu adaptée à une couverture. Prévisualisation avec `amok-1600.webp`, photographie horizontale du service avec riz et feuilles (Ben Yapp, **CC BY 2.0**), déjà créditée sur `/credits-photos/`. Ancien visuel préservé pour les actifs sociaux, `socialImageRole:'article'` préserve la classification de photo documentaire. **Correspondance source WebP et mention de transformation encore à vérifier avant visa photo.**
- **Contrôle :** nouveau `tests/carnets-c04-contract.test.mjs` raccordé à `npm run test:editorial`. Tests npm et build Astro **non exécutés à cette étape** ; les contrôles statiques ne sont pas un PASS CI. Aucune publication.
- **Programme :** M2 **EN COURS** ; 4/7 brouillons C02/C03/C04/C05, **0/7 articles finalisés/validés** ; D2 taxonomie et D3 textes/médias/publication ouverts ; aucun merge, OVH, n8n ou Meta modifié. Blocages restants : photo Kep distante à localiser, photo C03 à autoriser.
- **Prochaine action :** revue C04 et vérification des médias, CI et contrôle mobile ; recherche puis rédaction C06/C07 si histoire culturelle suffisamment étayée.

### 2026-10-22 — J10 — demande explicite du propriétaire : fin des doublons entre Carnets, Recettes et Ateliers
- **Avis du propriétaire :** « le carnet consacré au Krung, ça fait pas doublon avec l'atelier et la recette ? [...] OK pour la recette ou dans les ateliers, mais pas dans la culture. Et si on en parle, on n'aura pas de recette. On parlera de son histoire ». Cette décision **corrige et remplace la validation antérieure D1-C03 « gestes et transmission »** ; aucun visa du texte final n'est donné.
- **Principe transversal acté :** **Carnets = histoire, société, mémoire, territoires, traditions** ; **Ateliers = apprentissage d'un geste** ; **Recettes = ingrédients, quantités, méthode** ; Glossaire = définition. Interdiction des doublons éditoriaux. Si un sujet ne possède pas de matière historique/culturelle vérifiable, **ne pas créer de Carnet** sur ce seul sujet ; l'intégrer plutôt aux Ateliers/Recettes/Glossaire. Les sources ne sont pas visibles publiquement.
- **C03 remanié dans PR #102** : ancien brouillon axé sur les aromates, le mortier et le geste **abandonné** (consultable seulement dans l'historique Git). Nouveau H1 **« Le kroeung, une mémoire de la cuisine khmère »**, cinq sections sur sa place culinaire, ses origines non datées, les ruptures de 1975–1979, diaspora, mémoire familiale et documentation actuelle ; témoignage patrimonial individuel et analyses dans le **registre interne**. **Aucune origine angkorienne sans preuve, aucune recette ou instruction de pilage.**
- **Index culturel rectifié** : suppression du parcours « lire → piler → cuisiner », de l'accès direct à l'atelier ou à la recette depuis la page /culture/, remplacé par un parcours **riz/mémoire/marché** entre Carnets uniquement. La fiche C03 n'affiche plus les suggestions de recettes et ingrédients ; son glossaire est limité au mot kroeung.
- **Média C03** : retrait du visuel mortier partagé avec l'Atelier. Restauration provisoire du visuel original de plat sauté, **qui n'a pas valeur de photographie historique** ; la couverture culturelle et les droits restent à instruire avant publication.
- **Contrôle** : contrat C03 et contrat éditorial global actualisés ; **exécution npm/build/CI/contrôle visuel non attestée** à cette étape. Six autres Carnets et leurs slugs préservés, aucune fusion, aucun déploiement, PR #97–#102 en brouillon.
- **Prochaine action** : réception du texte culturel et audit photo, tests complets, et retour au plan M2 avant d'ouvrir un nouveau sujet.

### 2026-10-22 — J09 — contrôle visuel préliminaire C04 avant prochaine rédaction
- **Inspection directe du fichier existant** `public/images/cuisine/amok-alt-1600.webp` (C04 /culture/comprendre-amok/) : image verticale présentant quatre portions d'amok sur une assiette, avec grand fond rouge occupant une grande partie du cadre. Elle semble représenter le plat, mais **qualité de couverture et adaptation panoramique à réexaminer** ; droits, localisation et provenance non attestés ici. Ne pas remplacer automatiquement le média original avant dossier de provenance et revue de direction artistique.
- **Prochaine rédaction C04 :** reprendre l'angle M1 validé « L'amok, un plat et ses interprétations », éviter de refaire le guide de cuisson, vérifier les usages de la feuille de bananier, les variantes et la place du plat sans histoire royale inventée. Préparer un petit lot de texte hors publication.
- **Blocages inchangés :** droits visuel C03 `rightsValidated=false`, photo Kep externe non importée en WebP local, M2/D2/D3 et CI/build non franchis ; les trois textes complets C02/C03/C05 attendent réception. Aucune fusion et aucun déploiement.

### 2026-10-22 — J08 — C03 Kroeung complet ; confirmation des blocages photographiques
- **Rédaction en branche dépendante :** C03 `/culture/comprendre-le-kroeung/`, H1 « Le kroeung, des gestes qui se transmettent », 6 chapitres, 18 paragraphes, environ 950 mots. Références de Chef Nak, Cambodianess et recettes cambodgiennes dans [le dossier de preuve interne](./BROUILLON-C03-KROEUNG-TRANSMISSION-2026-10-22.md), **aucune bibliographie visible**. Aucun souvenir familial, interview ou lieu prétendument observé inventé. Le texte renvoie aux ateliers/recettes existants pour la pratique, sans en dupliquer les étapes.
- **Média C03 :** l'ancien fichier `kroeung-1600.webp` montre un plat sauté, pas le geste du mortier. Réutilisation du visuel déjà présent dans l'atelier `v19-mortier-kroeung-1440.webp`, montrant des mains pilant des aromates, alt descriptif prudent. Les formats existants 800/1200/1440 sont préservés. **L'atelier marque `media.imageValidated=true` mais `media.rightsValidated=false` ; D3 média NON VALIDÉ**, aucune affirmation de photographie documentaire.
- **Social :** `socialImage` C03 préexistant conservé et `socialImageRole:'article'` pour ne pas changer silencieusement les actifs du catalogue social ; workflows n8n inchangés.
- **Kep photo :** Wikimedia Commons confirme Mx. Granger, janvier 2020 et CC0 ; l'image CDN s'affiche lors du contrôle web. **L'import binaire en WebP local GitHub n'a PAS abouti** (accès au téléchargement impossible dans l'environnement connecté) ; ne pas déclarer la correction photo finie ni publier une URL distante comme définitive.
- **Tests :** nouveau `tests/carnets-c03-contract.test.mjs` raccordé à `npm run test:editorial`. Vérifications statiques d'inventaire possibles ; **CI, build et rendu navigateur du site non exécutés**. Ne pas confondre un contrôle du code avec un PASS visuel/technique.
- **Gate :** M2 EN COURS, 3/7 brouillons préparés, 0/7 textes finaux réceptionnés ; D2 taxonomie/UX et D3 médias/publication **EN ATTENTE**. Aucun merge, aucun déploiement OVH.
- **Prochaines actions :** valider les trois textes et médias, obtenir image Kep locale et droits photo C03, exécuter CI/build, arbitrer D2 avant M4. Si les médias restent bloquants, poursuivre exclusivement la préparation de contenus internes sans publication.

### 2026-10-22 — J07 — C05 Kep rédigé ; erreur de photographie prouvée et image provisoire remplacée
- **Réalisé :** brouillon intégral C05 **6 chapitres / 18 paragraphes, ~1 000 mots** : géographie de Kep, pêche et vente, place du crabe, mariage au poivre, ressources côtières et initiatives de préservation 2026, métiers du marché. Intégré à `src/data/culture.ts` sur `docs/carnets-c05-kep-editorial-20261022` ; slug historique conservé. Aucune visite, interview, saison, prix ou horaire inventé.
- **Recherche interne :** FAO du 15/06/2026 sur opérations de restauration du crabe nageur (y compris Kep), SEAFDEC (2020 et Angkaol), Travelfish (2025, témoignage touristique limité), OMPI. Aucune source affichée dans les pages publiques ; le registre figure dans [le brouillon C05](./BROUILLON-C05-KEP-MARCHE-CRABES-2026-10-22.md).
- **Constat visuel prouvé :** le fichier historique `kep-market-1600.webp` montre des **sacs de poivre**, visuellement identiques au recadrage Commons `06-Kep Crab Market Cambodia-nX-3 (cropped).jpg`, sans crabe. Le blog photo était bien localisé à Kep mais la légende suggérait une scène de vente de produits frais sans le préciser : erreur éditoriale. La photo de C02 `kampot-1600.webp` montre une plante de poivre et reste cohérente.
- **Correction en prévisualisation :** photo du **marché de Kep** prise par Mx. Granger le 27/01/2020 (Commons **CC0**), correctement légendée comme **étals sous les auvents** (elle ne montre pas spécifiquement des crabes). Image externe temporaire 1280×960. Son **import en WebP local avec contrôle de chargement HTTP, droits et rendu** reste à faire AVANT publication ; éviter un hébergement tiers permanent et un transfert d'image non vérifié.
- **Compatibilité :** sur l'index Carnets, `srcset` conditionnel pour éviter un `srcset=""` si image externe sans déclinaisons. `socialImage` historique local explicitement conservé ; le champ optionnel `socialImageRole: 'article'` évite de reclasser cette photographie en illustration dans le catalogue social, sans modifier les workflows n8n. **Visuel social non approuvé pour future publication C05**. Crédits photo distinguant le nouveau visuel CC0 de l'ancien dérivé CC BY-SA. Nouveau test `tests/carnets-c05-contract.test.mjs` lié à `npm run test:editorial`, **non encore attesté exécuté**.
- **État :** M2 en cours, texte final C05 et visuel soumis à approbation ; D2 (univers/maquette) et D3 (validation publication) toujours ouverts. PR #97–#100 non fusionnées. **0 fusion / 0 déploiement OVH**.
- **Prochain geste :** contrôle CI/build/rendu de C02 et C05 ; revue humaine de leurs deux textes ; obtenir WebP local réellement adapté à Kep avant toute fusion/déploiement.

### 2026-10-22 — J06 — premier Carnet rédigé et préparé en prévisualisation, C02
- **Réalisation :** rédaction du texte complet C02 « Le poivre de Kampot, de la plantation à la table » en sept sections et vingt-et-un paragraphes ; intégration isolée dans `src/data/culture.ts` sur la branche `docs/carnets-c02-brouillon-editorial-20261022`. Conservés : slug `poivre-de-kampot`, image principale existante, autres six Carnets et redirections. Durée provisoire : 5 min à partir d'environ 1 100 mots, à confirmer dans le rendu.
- **Sources internes (aucun affichage public) :** FAO (2022), OMPI (2021), association KPPA, cahier des charges officiel cambodgien (PDF sections III et VI contrôlées visuellement). Constat contradictoire documenté : correspondance « petites/grandes feuilles » inversée selon la page de la KPPA et le cahier des charges officiel ; cette précision n'est **pas** insérée au texte lecteur. Éviter une date de reconnaissance cambodgienne tant que les sources historiques sont réconciliées.
- **Preuve :** [brouillon C02 et registre de faits](./BROUILLON-C02-POIVRE-KAMPOT-2026-10-22.md), fichier `src/data/culture.ts` et nouveau test `tests/carnets-c02-contract.test.mjs` raccordé à `npm run test:editorial`. **Ces tests ne sont pas encore réputés exécutés**.
- **État/gate :** travail **anticipé en prévisualisation** avant passage formel de M2 ; aucun nouveau texte validé/accepté, aucun nouveau visuel ni publication. Le propriétaire a validé l'angle C02, pas chaque formulation. D2 et D3 restent ouverts.
- **Prochaine action :** revue contradictoire du texte C02 et des droits du visuel ; réception de la maquette/taxonomie D2 ; autres Carnets par petits lots après gate M2.
- **Publication :** **aucune fusion ni déploiement OVH** ; éviter d'importer en production le contenu de cette branche avant autorisation.

### 2026-10-22 — J05 — décision du propriétaire : pas de sources visibles sur les pages publiques
- **Instruction explicite :** « Aucune source ne doit être mentionnée dans nos pages » (22/10/2026). Application : **aucun bloc de bibliographie documentaire sur les Carnets, Recettes, Ateliers et À propos**, y compris les liens de sources documentaires (riz/VNA), bien que ces URLs restent conservées pour contrôles internes.
- **Exception juridique et technique :** les crédits de photographies soumis à licences (auteurs, licences, liens d'attribution) sont distincts des sources éditoriales et restent visibles sur la page `/credits-photos/` ainsi que dans les légendes qui l'exigent ; aucune suppression des avertissements culinaires et sanitaires.
- **Réalisation :** [PR #99, branche dédiée dépendante du correctif #98](https://github.com/roro78/cuisine-cambodgienne/pull/99) : suppression des bibliographies de `src/pages/culture/[slug].astro`, `src/components/RestoredRecipe.astro`, `src/pages/apprendre/pratique/[slug].astro`, `src/pages/apprendre/pratique/kroeung-jaune.astro` ; harmonisation de `src/pages/a-propos.astro`, `src/pages/recettes/index.astro` et des libellés de la page crédits photo. Les fichiers de données de sources restent conservés. Ajout d'un test de non-affichage, sans publication automatique.
- **Statut :** aucune fusion, aucun déploiement ; PR #97/#98/#99 restent en brouillon ; test statique ajouté au script `npm run test:editorial`, CI et contrôle visuel non exécutés/vérifiés à cette étape. M2 demeure **EN COURS** et D2/D3 sans visa. PR #57 touche aussi `package.json` : vérifier les différences si elle est fusionnée séparément, sans écraser le travail parallèle.
- **Prochaine action :** contrôler le code en PR, obtenir verdict CI, poursuivre les Carnets à partir des briefs acceptés, sans bibliographies publiques.

### 2026-10-22 — J04 — correction C01-P0 préparée dans une PR dédiée (non fusionnée)
- **Réalisation :** sur une branche issue de la PR documentaire #97 (pour ne pas créer un conflit de plan parallèle), modification d'un seul paragraphe de `src/data/culture.ts` : le prix 2025 est indiqué comme **partagé** entre Malys Angkor/Phka Rumduol (Cambodge) et ST25 (Vietnam). Ajout de la référence Vietnam News Agency du 10/11/2025 dans les sources du C01 ; autres contenus des sept Carnets préservés.
- **Fondement :** approbation explicite du propriétaire (J03) ; contrôle contradictoire AKP du 09/11/2025 et VNA du 10/11/2025, confirmés par VOV du 09/11/2025. Aucune interprétation comme classement permanent.
- **État :** patch sur branche `fix/carnets-riz-world-best-rice-ex-aequo-20261022`, **dépendante de la PR #97**, non fusionnée ; pas d'édition de la production, pas de publication OVH, M2 toujours EN COURS. Cette branche portera sa PR spécifique vers la branche de #97, puis devra être retargetée vers main une fois la PR documentaire fusionnée sur autorisation.
- **Contrôles :** vérifier la comparaison Git du fichier et la présence de la source ; CI GitHub / tests de rendu non attestés tant que non exécutés. Aucun visa de publication reçu.
- **Prochain geste :** réception du patch, préparation de petits lots d'enrichissement C01–C07, décision D2 et validation des textes/visuels avant M3 complet.

### 2026-10-22 — J03 — décision explicite du propriétaire : D1 et correction C01-P0
- **Décision reçue :** réponse « Oui » à la question « Valides-tu les sept orientations proposées et la correction de l'ex æquo du riz 2025 ? ». **Accord pour les angles C01–C07 et pour corriger factuellement le paragraphe C01 relatif au prix 2025**. Cela ne signifie ni visa final des sept articles enrichis, ni approbation D2 pour le design/taxonomie, ni permission de fusionner ou de publier.
- **État exact :** M1 briefs acceptés éditorialement mais **uniquement enregistrés dans la PR #97** ; M2 **EN COURS**, modèles complets et 4 univers encore à arbitrer ; tous les articles publiés inchangés à l'instant de cette inscription.
- **Réalisation préparée :** correction P0 à effectuer sur une branche/PR distincte dépendante de ce plan. Sources factuelles croisées : AKP 09/11/2025 et Vietnam News Agency 10/11/2025 et VOV 09/11/2025, qui confirment le titre partagé avec ST25 vietnamien.
- **Prochaine action :** versionner le correctif minimal C01 et sa source vietnamienne, vérifier le diff, laisser PR en brouillon, ne pas déployer.
- **Preuve :** décision de validation du propriétaire dans la conversation de pilotage du 22/10/2026 ; [PR #97](https://github.com/roro78/cuisine-cambodgienne/pull/97).

### 2026-10-22 — J02 — vérifications croisées, erratum du riz et décisions M2 v1.2 (en PR)
- **Réalisé :** recherche documentaire avec consultation directe (FAO, AKP, OMPI, DEFRA, Chef Nak, KQED, PLOS ONE, UNESCO, site du sommet francophonie, source institutionnelle de Kep), et recherche indexée lorsque l'accès direct était refusé (EUR-Lex 2025, étude Taylor & Francis). [Registre de sources et propositions D1/D2](./REGISTRE-SOURCES-DECISIONS-M2-2026-10-22.md) ajouté sur branche Carnets.
- **Correction P0 découverte :** le texte C01 doit préciser que **le Cambodge et le Vietnam (ST25) ont partagé le titre World's Best Rice 2025**. AKP (09/11/2025) cite le titre cambodgien sans cet ex æquo ; la dépêche VNA (10/11/2025) et VOV (09/11/2025) précisent les deux lauréats. Proposition de phrase dans le registre, **pas de modification d'article faute de visa**.
- **Découvertes :** l'ancienne URL touristique commune aux six Carnets renvoie 404 ; son statut de source ministérielle actuelle n'est pas prouvé. Soumettre une substitution par preuves distinctes. Le quatrième univers Fêtes et traditions n'a aucun Carnet principal assigné parmi C01–C07 : arbitrage de classement requis avant M4.
- **Risques et limites :** documents UE/étude prahok partiellement indexés et non lus intégralement ; aucune licence photo nouvellement autorisée ; aucune donnée GSC, tests HTTP, responsive ni CI exécutés sur ce travail documentaire. Les sept contenus publiés restent intacts.
- **Gate :** M1 À valider ; M2 **NON VALIDÉ** ; D1/D2/D3 en attente ; 0/7 enrichi, 0/4 nouveau ; aucune fusion, aucun déploiement.
- **Preuve :** [PR #97](https://github.com/roro78/cuisine-cambodgienne/pull/97) ; voir le registre sourcé du 22/10/2026.
- **Prochaine action :** obtenir le visa sur la correction P0 C01 et les orientations C01–C07 ; préparer le correctif isolé uniquement après accord.

### 2026-10-22 — J01 — audit M1 et briefs v1.1 (branche dédiée, non fusionnée)
- **Réalisé :** audit statique des 7 URL, titres/H1 de gabarit, textes, descriptions SEO, médias, sources déclarées, liens associés et redirection historique ; comptage indicatif des mots ; 7 briefs de réorientation consignés dans [AUDIT-M1-BRIEFS-2026-10-22.md](./AUDIT-M1-BRIEFS-2026-10-22.md). Vérification des 9 PR ouvertes : aucune collision avec les fichiers du chantier Carnets visés.
- **Vérifications externes ponctuelles :** références FAO, AKP et OMPI consultées ; guide gastronomique touristique en échec d'accès direct (404 dans le contrôle, version indexée disponible) ; accès UNESCO protégé par anti-bot ; pages Commons riz consultables. Aucun constat ne vaut validation générale des faits ou licences de tous les médias.
- **Risques :** durées de lecture probablement surestimées, six articles courts très proches de fiches pratiques, dépendance majeure à une source touristique, aucune mesure GSC collectée, contrôles HTTP/rendu/mobile non réalisés. Aucun contenu éditorial d'origine touché.
- **Décisions en attente :** D1 et M2 (titres, angles, plans, sources cibles et taxonomie), approbation des futurs médias. **Cette mise à jour n'est pas sur main tant que la PR n'est pas fusionnée** ; zéro fusion et zéro déploiement autorisés.
- **État :** M1 « À valider » (livrables 7/7 produits) ; M2–M7 « À faire » ; **0/7 enrichi, 0/4 nouveau, 0 publication**.
- **Prochaine action :** transmettre les sept briefs au propriétaire, recevoir ses décisions, puis préparer le premier petit lot approuvé. Baseline GSC à collecter avant publication.
- **Preuve :** [PR brouillon #97](https://github.com/roro78/cuisine-cambodgienne/pull/97), [audit M1 et briefs](./AUDIT-M1-BRIEFS-2026-10-22.md), commits f29e50a et 830e2f9. La branche main a reçu entre-temps deux commits sur la documentation des Ateliers ; comparaison GitHub : aucun fichier Carnets partagé et PR fusionnable, sans fusion effectuée.

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
