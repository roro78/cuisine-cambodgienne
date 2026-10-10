# Cuisine du Cambodge — Plan d’implémentation consolidé

**Référence de pilotage — 10 octobre 2026.** Ce document rapproche les ambitions éditoriales, l’expérience « Grand Dîner Khmer », les futures activités commerciales et le code réellement présent. Il distingue **développement technique**, **validation visuelle**, **validation culinaire** et **commercialisation** : une CI verte ne vaut jamais réception du produit final.

**Statut actuel :** site éditorial et six ateliers publiés ; correctifs de sécurité Amok/Prahok (#25) publiés ; PR #24 « Expériences / Grand Dîner Khmer » ouverte, non fusionnée et **non publiée**. Dernière revue de la PR #24 résolue et CI réussie sur le commit 5db43ca (https://github.com/roro78/cuisine-cambodgienne/actions/runs/38081774271). Sa valeur démontrée est celle d’un **prototype gratuit**, pas d’une offre premium commercialisable.

## 1. Vision et décisions à préserver

Le site doit donner envie de **découvrir, comprendre, cuisiner et transmettre** la cuisine cambodgienne dans un univers premium mais chaleureux. Le contenu doit être gourmand, humain, précis, pédagogique et culturellement respectueux : pas d’expressions mécaniques ou absurdes, pas de répétitions d’images, pas de gros titres qui écrasent les recettes. L’accueil doit raconter une histoire **au défilement**, avec de vraies transitions et une richesse visuelle comparable en intention à la référence grail-app.com, sans en reproduire le contenu ni sacrifier lisibilité, mobile ou performance.

Décisions produit rappelées :
- **Préserver le site existant**, ses routes, recettes, ateliers gratuits, culture, glossaire, accès SEO et identité ; améliorer sans suppressions opportunistes.
- Construire un espace **Expériences distinct** de l’éditorial : en priorité « Le Grand Dîner Khmer », ensuite seulement des **ateliers accompagnés** et de possibles **coffrets gourmands**.
- L’activité numérique ne dépend **pas** du recrutement d’un chef. Aucun cuisinier partenaire, animation d’atelier, réservation, stock ou démonstration exclusive n’est présumé disponible.
- Choix éditorial actuel du pilote : **Amok Trey + Chek Ktis** ; **Prahok Ktis facultatif** à partager (pas une entrée obligatoire). Pour 2/4/6 personnes.
- **Hypothèses commerciales, non validées :** 39 € pour l’expérience numérique ; environ 49 € en ligne / 89 € en présentiel pour un atelier accompagné ; 59 € pour un coffret. Ces montants ne doivent pas être affichés comme tarifs définitifs ou offres disponibles.
- L’idée antérieure d’un **ebook « 7 plats cambodgiens pour se lancer et se régaler »**, avec photographie humaine et pédagogie, appartient au portefeuille de contenus à **réévaluer** ; ce n’est ni un livrable terminé ni une dépendance à la PR #24.
- Une future gamme physique doit résulter d’une étude d’intérêt, de coûts, de marge et d’expédition ; **ne pas imposer le kroeung comme produit phare** sans étude.
- Contrôle humain avant merge, mise en production, campagne automatisée, collecte marketing ou vente. Privilégier les outils gratuits / open source quand approprié.

## 2. Matrice d’avancement factuelle

Légende : **ACQUIS** = présent et vérifié ; **PARTIEL** = présent, mais réception du besoin initial incomplète ; **NON RÉALISÉ** = livrable absent ; **À VÉRIFIER** = pas de preuve suffisante pour déclarer terminé.

| Chantier | État | Preuves et limites | Ce qui manque pour réception |
| --- | --- | --- | --- |
| Accueil éditorial et storytelling au scroll | PARTIEL | Page d’accueil V16 et styles dédiés dans main, structure par chapitres existante. | Revue direction artistique « wow », transitions, cohérence des chapitres, rythme, gourmandise, visuels non répétitifs, audit mobile. |
| Navigation, logo, cohérence de marque | PARTIEL | Header avec logo PNG, menu mobile, correctifs précédents visibles ; pas de preuve de réception esthétique exhaustive. | Audit visuel du logo dans tous les contextes, taille/organisation du menu mobile, contraste et parcours clavier. |
| Catalogue et fiches recettes | PARTIEL | Recettes structurées, ingrédients ajustables, étapes guidées et pages existantes. | Pédagogie culinaire approfondie, variations/substitutions et quantités vérifiées, photographies pertinentes, langage naturel sur chaque fiche. |
| Six ateliers gratuits /apprendre | ACQUIS pour publication | Six pages de détail répondent en public, présentes au sitemap ; PR #20 publiée. | Évaluation pédagogique et esthétique facultative ; préserver ces acquis lors des prochaines PR. |
| Ingrédients et glossaire | PARTIEL | Pages /ingredients et /glossaire existantes ; glossaire privilégié dans la navigation. | Clarifier rôles/maillage, éviter un header ingrédients redondant, enrichir conseils pratiques et photographies utiles. |
| Culture et À propos | PARTIEL | Sections et textes existants. | Enrichir le fond, les récits, les sources, les gestes, l’identité du projet et la voix humaine ; vérifier absence de clichés ou tournures maladroites. |
| SEO et accessibilité de base | PARTIEL | Sitemap, balises et métadonnées existants ; noindex prévu pour Expériences non lancées. | Audit éditorial SEO, maillage, images, accessibilité réelle avec technologies d’assistance, performance et mobile. |
| Vitrine Expériences | PARTIEL / PR #24 | Page statique présentant numérique, ateliers accompagnés et coffrets avec statuts non commerciaux. | Design premium final, positionnement des offres, preuves réelles et future voie de contact vérifiée, sans formulaire fictif. |
| Grand Dîner : choix des convives et courses | ACQUIS techniquement / PR #24 | 2/4/6 convives ; consolidation depuis les recettes sources ; Prahok facultatif ; tests de calcul et Chrome. | Validation des quantités et situations de cuisine réelle ; meilleure pédagogie des portions et ustensiles. |
| Grand Dîner : planning | PARTIEL / PR #24 | Planning indicatif de l’Amok avec 15 min de marge ; temps du dessert/Prahok seulement séparés. | Véritable conducteur coordonné de plusieurs préparations, chevauchement, capacités du matériel, mises en place, cuisson, dressage, dessert ; essais physiques obligatoires. |
| Grand Dîner : guide pas à pas | PARTIEL / PR #24 | Navigation dans les étapes des fiches gratuites, progression par plat, sécurité alimentaire reprise. | Contenus exclusifs, repères photo/vidéo, erreurs réelles de débutants, mise en situation, assurance de qualité sur mobile. |
| Grand Dîner : pense-bête | PARTIEL / PR #24 | Export TXT local, copier/coller, menu et horaires synchronisés. | Fiche premium mise en page, expérience d’export/partage réellement désirable si validée, sans créer de compte inutile. |
| Carnet de réception | PARTIEL / PR #24 | Cinq chapitres + un facultatif, suivi de tâches, fiche de dégustation manuscrite, CSS impression A4 ; test de CSS sous Chrome. | Direction artistique finale, cohérence de l’ensemble du repas, vraie impression papier/A4, évaluation pédagogique et culinaire. |
| Sécurité alimentaire Amok/Prahok | ACQUIS pour correction rédactionnelle | PR #25 fusionnée et textes corrigés visibles sur les recettes publiques. | Compléter ultérieurement allergènes, conservation, cuisson sûre et substitutions avant produit commercial ; aucune validation sanitaire de menu complet encore réalisée. |
| Tests techniques de la PR #24 | ACQUIS sur HEAD contrôlé | Astro/TypeScript, contrats, build HTML, calculs et Chrome desktop/mobile (CI #38081774271, commit 5db43ca). | Les tests n’acceptent ni un design « premium » ni une recette physique ; revalider toute modification ultérieure sur son propre HEAD. |
| Menu gastronomique complet et essais | NON RÉALISÉ | Aucun menu testé physiquement comme expérience complète. | Six configurations réelles, mesures, photos, dégustation et corrections avant toute allégation de produit validé. |
| Médias pédagogiques exclusifs | NON RÉALISÉ | Principalement photographies déjà utilisées sur le site. | Storyboard, photographie variée, démonstrations de gestes/vidéos avec droits, sous-titres et alternatives accessibles. |
| Produit numérique premium prêt à vendre | NON RÉALISÉ | Prototype gratuit sans compte, paiement ni livraison commerciale. | Contenu exclusif validé, bénéfices prouvés, packaging, support, conformité, valeur distincte du gratuit, tarif justifié. |
| Ateliers payants accompagnés | NON RÉALISÉ | Présentation « partenaire recherché » uniquement. | Intervenant vérifié, programme, responsabilité, prix/coûts, lieu ou visioconférence, capacité, calendrier et réservation. |
| Coffrets physiques | NON RÉALISÉ | Présentation « à l’étude » uniquement. | Validation demande, produit(s), fournisseurs, prix de revient, marge, stockage, étiquetage, livraison et conformité. |
| Boutique / paiement / emails transactionnels | NON RÉALISÉ | Aucun tunnel de vente actif (volontaire). | Étude juridique et technique, solution compatible OVH, CGV/TVA/rétractation/consentements, tests en sandbox puis autorisation explicite. |
| Acquisition / réseaux sociaux avec IA | À CADRER | Sujet évoqué, aucune automatisation de publication vérifiée dans cette PR. | Positionnement, calendrier éditorial, coût nul/faible, production de contenus authentiques, validation humaine obligatoire, aucun calendrier actif sans décision. |

**Attention au vocabulaire :** « ACQUIS techniquement » n’équivaut pas à « expérience commercialisable » ; « non réalisé » ne doit jamais être présenté comme « presque terminé » sur la seule base d’un document d’intention.

## 3. Feuille de route ordonnée

### Phase 0 — Figer les acquis et les objectifs (priorité P0)

**État : partie factuelle réalisée, réception produit à clarifier.**
1. Maintenir PR #24 **ouverte, sans merge ni déploiement** tant que la décision de périmètre n’est pas prise.
2. Capturer les écarts constatés dans ce plan ; éviter de rouvrir des régressions déjà résolues par #20–#25.
3. Définir les critères d’acceptation distincts : technique, UX, éditorial, culinaire, commercial.
4. Conserver les pages existantes et la sécurité alimentaire corrigée.

**Sortie :** matrice des écarts validée comme référence, sans confusion entre prototype et produit final.

### Phase 1 — Réception du socle visuel et éditorial du site (priorité P1)

**Objectif :** le site doit être gourmand et premium dans **toutes** ses rubriques, pas uniquement Expériences.

Livrables :
- Audit page par page : accueil / recettes (listing + détails) / ateliers / glossaire / ingrédients / culture / à propos / desktop / mobile.
- Refonte ciblée de l’accueil : storyboard des chapitres, transitions maîtrisées au scroll, diversité d’images, typographies proportionnées, vrais CTA vers recettes et gestes ; respect de prefers-reduced-motion.
- Harmonisation des en-têtes de pages, marges, densité éditoriale, composants et états mobiles ; corriger notamment le menu mobile surdimensionné.
- Relecture humaine de toutes les accroches : retirer les formulations artificielles (exemple de tournure déjà rejetée : « Le Cambodge se mange tôt »), éviter les redites.
- Revue photos : cadrage, formats responsive, droits et légendes ; bannir les mêmes images répétées sans justification.
- Reprise de chaque recette comme support d’apprentissage : ce qu’on observe, pourquoi, erreurs fréquentes, ajustement des portions, liens vers techniques, achats/produits locaux si vérifiés.
- Enrichir Culture et À propos sans affirmations historiques non sourcées ni authenticité excessive.

**Critères d’acceptation :** parcours observé à 390 / 768 / 1440 px, clavier complet, contrastes et alternatives, absence de débordement, bonnes performances, validation visuelle humaine de la gourmandise/du récit. Travaux en **PR séparées et limitées par rubrique**, pour ne pas rendre la PR #24 impossible à relire.

### Phase 2 — Rendre le Grand Dîner cohérent de bout en bout (priorité P1)

**Objectif :** transformer le prototype en parcours pédagogique réellement utile.

1. Fixer la structure **réelle** du dîner : entrée éventuelle à décider après essais, Amok, Chek, Prahok facultatif ; ne pas inventer un menu testé.
2. Compléter le scénario utilisateur « je choisis → j’achète → je prépare → je cuisine → je dresse → je reçois → j’évalue », avec passage continu des choix 2/4/6 et de l’option Prahok.
3. Élaborer un calendrier intégrant toutes les préparations, leurs prérequis et le matériel nécessaire, en distinguant les horaires **indicatifs** des horaires validés en cuisine.
4. Prévoir les contrôles de difficulté, substitutions, quantités non connues, allergènes et rappels de sécurité ; ne jamais masquer l’incertitude derrière de faux calculs.
5. Étoffer les étapes guidées et le Carnet : photos de repères, conseils de présentation, tablées et service, accord des saveurs à confirmer ; état utilisateur cohérent et accessible.
6. Proposer un support imprimable réellement premium à partir du contenu validé, avec tests papier et pas seulement CSS.
7. Conserver les recettes sources accessibles gratuitement : la valeur future doit venir d’un **accompagnement exclusif et éprouvé**, pas d’un blocage artificiel de recettes existantes.

**Critères d’acceptation :** calculs exacts dans les six variantes ; aucun élément facultatif lorsqu’il est désactivé ; panier/liste/timing/étapes/carnet cohérents ; parcours mobile et impression testés ; zéro fausse promesse de cuisson coordonnée.

### Phase 3 — Essais culinaires réels et médias originaux (priorité P0 avant toute vente)

Six scénarios obligatoires, documentés dans docs/protocole-validation-grand-diner.md : **2, 4, 6 convives, chacun sans puis avec Prahok**. Pour chacun : quantités mesurées, matériel, temps de préparation/cuisson/dressage, bonne cuisson et conservation, équilibre gustatif, difficulté et substitutions, preuves photo/notes, correctifs puis nouveau test si nécessaire.

En parallèle, créer les médias originaux utiles : photographies de gestes, étapes clés, portraits humains quand pertinents, vidéos/démonstrations sous-titrées, autorisations des personnes et droits de diffusion. Ne pas prétendre disposer d’un chef partenaire.

**Sortie :** menu réellement éprouvé, contenus pédagogiques justifiés, tableau des temps et limites ; sans ces preuves, aucune assertion « menu testé », « prêt à servir à l’heure », « produit final ».

### Phase 4 — Produit premium et page de présentation (priorité P2 après phases 2–3)

- Définir précisément le **livrable acheté** (contenus exclusifs, format, durée d’accès, support, modalités d’actualisation), et la différence claire par rapport aux recettes/ateliers gratuits.
- Packaging éditorial : page de présentation premium, prévisualisation des contenus réellement produits, bénéfices démontrables, FAQ, conditions et preuves authentiques uniquement.
- Rechercher les coûts : création, médias, hébergement, service client, paiement, fiscalité. Tester la pertinence de l’hypothèse **39 €** sans l’annoncer comme tarif acquis.
- Tester l’intérêt avec validation humaine et indicateurs définis à l’avance, sans faux témoignages ni urgence inventée.
- Le potentiel ebook « 7 plats cambodgiens pour se lancer et se régaler » reste un **chantier éditorial distinct à arbitrer**, non couvert par #24.

**Sortie :** contenu réellement livrable, valeur spécifique défendable et offre décrite sans allégation non justifiée.

### Phase 5 — Ateliers accompagnés et coffrets (priorité P3, chantiers autonomes)

**Ateliers accompagnés :** trouver et qualifier un intervenant, définir programme/résultats, disponibilité, modalités légales, prix de revient, format, capacité, annulation. Les hypothèses **49 €/89 €** ne constituent pas un tarif disponible. Les six ateliers gratuits actuels restent accessibles sans confusion.

**Coffrets gourmands :** 10–15 pistes, présélection puis chiffrage comparatif (demande réelle, approvisionnement, réglementation, conservation, emballage, expédition, coût total, marge), sélection d’un MVP seulement ensuite. Hypothèse **59 €** non validée ; ne pas décider à l’avance d’un produit phare.

### Phase 6 — Vente, conformité et acquisition (priorité P3, dernier verrou)

Après accord explicite :
- Architecture compatible avec le site statique Astro/OVH ; paiement en **sandbox** avant réel, paiements et webhooks sécurisés, contrôle d’accès, commandes, remboursements et emails transactionnels.
- Vérifications CGV, droit de rétractation selon la nature du contenu numérique, TVA, informations précontractuelles, allergènes/étiquetage le cas échéant, RGPD et accessibilité.
- Suivi minimal utile, respect des choix de confidentialité ; aucun suivi nominatif ou formulaire marketing sans base légale et mise en place documentée.
- Calendrier de contenus et éventuelle automatisation IA à faible coût ; relecture humaine systématique ; **aucune diffusion automatique ou cadence activée sans accord**.

**Sortie :** parcours de test complet, contrôle des risques et décision de lancement humainement approuvée.

## 4. Séquence d’implémentation conseillée (PR courtes)

| Lot proposé | Périmètre | Dépendances | Validation |
| --- | --- | --- | --- |
| B0 — Décision sur PR #24 | Conserver le prototype ou demander des améliorations ciblées avant merge ; ne pas le qualifier de produit final | Review/CI actuelles vertes | Décision humaine de merge/publication distincte |
| B1 — Réception design du site | Audit et corrections premium accueil / menu / médias / rédaction | B0 non bloquant | QA visuelle + a11y et absence de régression |
| B2 — Recettes & culture | Enrichissement pédagogique et éditorial des pages existantes | Audit B1 | Validation contenu, cuisine et SEO |
| B3 — Grand Dîner v2 | Scénario complet, vrais choix, flux cohérents, carnet finalisable | Critères phases 2 et 3 | Tests de calcul + scénarios utilisateur + QA visuelle |
| B4 — Preuves culinaires et supports | Six essais, prises de vues/vidéos originales, révision | B3 pilote | Fiches d’essai documentées et validation des résultats |
| B5 — Packaging premium | Définition de l’offre, contenu propre, page de présentation | B4 | Valeur/perception, capacité à livrer, chiffrage |
| B6 — Vente contrôlée | Obligations, paiement/test, support, acquisition | B5 et validation juridique | Recette sandbox + autorisation de production |
| B7 — Ateliers / coffrets | Branches indépendantes après étude | Intervenants ou sourcing réel | Coût, conformité, disponibilité et décision spécifique |

**Méthode :** une PR et un objectif principal à la fois ; tests et revue avant merge ; ne pas élargir silencieusement #24 à tous les chantiers du site. Les lots de ce tableau sont des propositions d’organisation, **pas des PR existantes ni des publications programmées**.

## 5. Règles d’acceptation et gouvernance

Une fonctionnalité n’est **terminée** que si : (1) livrable identifiable, (2) tests adaptés réussis, (3) réception éditoriale/visuelle quand elle compte, (4) non-régression site existant, (5) statut de publication exact. Les dépendances commerciales nécessitent en plus **une validation réelle en cuisine, des supports originaux et les obligations légales applicables**.

Critères transverses : performance mobile, clavier/lecture d’écran, mouvement réduit, SEO, droits images, texte français naturel, sécurité alimentaire, traçabilité des validations, aucun coût SaaS récurrent non approuvé.

### Ce qui n’est pas autorisé automatiquement

- Merger ou publier la PR #24 ; changer la branche OVH ou lancer un pull SSH.
- Activer Stripe, réserver des ateliers, collecter des prospects, publier des annonces tarifaires, créer des témoignages, déclarer un menu testé.
- Déclencher des automatisations marketing, campagnes ou achats.
- Modifier MiHecho, AhoraGO ou l’infrastructure commune ORVAIKO : périmètre strictement **Cuisine du Cambodge**.

## 6. Prochaine décision utile

**Priorité immédiate :** adopter cette matrice comme référence de réception, puis **auditer visuellement le site et le Grand Dîner contre le niveau premium attendu**. Il sera alors possible de décider séparément :
1. si le prototype gratuit de la PR #24 peut être publié comme tel ;
2. quelles corrections visuelles et éditoriales lancer dans de petites PR ;
3. quelles exigences culinaire/média doivent être remplies **avant une offre payante**.

La validation technique de #24 est acquise sur son HEAD contrôlé ; **la réception globale de la vision du projet reste ouverte**.

### Preuves et références

- PR #24, périmètre du prototype : https://github.com/roro78/cuisine-cambodgienne/pull/24
- CI contrôlée pour le HEAD 5db43ca : https://github.com/roro78/cuisine-cambodgienne/actions/runs/38081774271
- Protocole de validation physique : docs/protocole-validation-grand-diner.md
- Plan commercial historique et décisions : docs/plan-commerce-experiences.md
- Runbook de déploiement : docs/runbook-ovh-ateliers-release.md
