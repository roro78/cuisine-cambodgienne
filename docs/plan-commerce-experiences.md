# Cuisine du Cambodge — Plan de développement commercial

> **Référence de pilotage actuelle :** [Plan d’implémentation consolidé](./plan-implementation-consolide.md). Ce document conserve les décisions et la chronologie du cadrage commercial ; les statuts d’avancement, critères de réception et dépendances à jour se trouvent dans le plan consolidé. Ne pas conclure à un produit commercial prêt du seul fait que la PR #24 a une CI verte.

**Statut :** cadrage validé sur le principe, produit et ventes non lancés.  
**Date :** 2026-10-10  
**Périmètre :** `/experiences/` et futurs parcours marchands, en conservant intégralement le site éditorial.

## 0. Dépendance de livraison OVH : ateliers déjà validés

- La PR #20 (`feat: create dedicated workshop learning pages`) est **fusionnée sur main** depuis le 5 octobre 2026, commit `096ceccd9881d87dcbc27352648fa16ce13c1bd3`.
- La branche `main` est désormais au commit `9cacbaab` : les ateliers, le logo, la navigation mobile et la correction de sécurité alimentaire de la PR #25 y sont intégrés.
- **Lot A déployé et contrôlé :** les six pages de détail des ateliers sont accessibles sur le site public en HTTP 200 ; elles apparaissent dans le sitemap.
- **Branche OVH de référence :** `ovh-production` au commit `e59c104d4f356cf7f0077402430548fa4cd191f7` (`deploy: 9cacbaab...`), incluant la correction publiée Amok/Prahok.
- **Lot B :** la PR #24 est techniquement vérifiée mais toujours ouverte, non fusionnée et non publiée ; un merge et tout éventuel déploiement devront être décidés séparément. Le pré-lancement gratuit restera sans paiement ni réservation.
- Pipeline existant vérifié : `main → GitHub Actions (Astro build) → ovh-production → ~/www/cdc2017`. Voir `docs/runbook-ovh-ateliers-release.md` pour les commandes de synchronisation SSH non destructives et la recette post-déploiement.

## 0 bis. Prototype commercial désormais créé

- `/experiences/` : vitrine des offres au statut exact.
- `/experiences/grand-diner-khmer/` : concept éditorial immersif, démonstration accessible 2/4/6 convives et renvoi vers les ressources gratuites.
- Ces pages ne livrent **ni produit final, ni panier, ni paiement**, et restent `noindex`.
- Nouveau contrat `npm run test:experiences` intégré à la CI sur la branche commerciale.
- Le menu final, les quantités réelles, les vidéos et la mise en vente resteront des chantiers spécifiques.

## 0 ter. Avancement du prototype numérique — PR #24

Un aperçu interactif réel est désormais construit **sans cuisinier partenaire** :

- Composant `src/components/DinnerPreview.astro` sur la page `/experiences/grand-diner-khmer/`.
- Les deux **recettes gratuites existantes** servant de démonstration sont `amok-trey` et `chek-ktis`, récupérées directement de `src/data/recipes.ts`. Il ne s'agit **pas** d'affirmer que le menu complet à trois préparations est finalisé.
- Calcul des ingrédients pour 2, 4 et 6 convives à partir de `baseServings`; ingrédients identiques et même unité regroupés sans estimer les quantités non indiquées.
- Checklist des courses et copie de la liste en texte, sans compte utilisateur, sans formulaire, sans stockage tiers.
- Navigation vers les deux recettes gratuites ; informations sur la nature provisoire du produit visibles.
- Tests `tests/dinner-preview.test.mjs` (unitaires) + `scripts/check-experiences-contract.mjs` (non-régression) intégrés au workflow CI.
- Les tests de calcul ont été reproduits et exécutés dans un environnement Node local isolé (8 cas validés le 10/10/2026). La compilation et l'intégration navigateur de la branche restent soumises à la CI complète et aux contrôles visuels.

**Différenciation future du produit payant** (pas encore implémentée) :

1. Menu complet testé, choix d'entrée, accord des saveurs, quantités validées et substitutions fiables.
2. Calendrier de préparation du dîner et coordination des cuissons validés en pratique.
3. Tutoriels pédagogiques produits ou illustrés, avec le droit d'utilisation des images/vidéos sécurisé.
4. Parcours pas à pas, mode cuisine mobile et fiche de dressage cohérents avec ce menu.
5. Livraison numérique et espace client sécurisé, uniquement lorsque le produit est complet.
6. Tunnel de vente, CGV/TVA/rétractation et paiement après validation produit et juridique.

La page actuelle est **une démonstration gratuite fonctionnelle, pas un produit à 39 € déjà disponible**.

## 0 quater. Planning indicatif et état de test (10 octobre 2026)

- Le composant `src/components/DinnerTimeline.astro` est intégré à la page `/experiences/grand-diner-khmer/`.
- Choix de l'heure de service entre 19 h et 21 h, par tranches de 30 minutes.
- Calcul des heures de préparation et cuisson de l'Amok Trey depuis `prepTime` et `cookTime` du catalogue, avec marge organisationnelle de 15 min **signalée comme hypothèse**.
- Temps du Chek Ktis affiché séparément : pas de promesse de service coordonné complet avant une recette d'essai validée.
- Tableau de programme accessible au clavier, avec `<time datetime>` et annonce en lecture d'écran après sélection.
- Aucun stockage, aucune réservation ni paiement, et aucun impact sur la page Ateliers gratuite.
- `tests/dinner-timeline.test.mjs` et `npm run test:timeline` ajoutés à la CI de la PR.
- **Validation actualisée :** tests unitaires, compilation Astro et parcours navigateur Chrome desktop/mobile validés par la CI #38078284525 ; les durées culinaires réelles ne sont pas encore validées.

## 0 quinquies. Mode cuisine guidé — aperçu (10 octobre 2026)

- Nouvelle composante `src/components/DinnerKitchenGuide.astro` sur le Grand Dîner : choix du plat ou du dessert, une étape à la fois, navigation précédent/suivant et indication des repères sensoriels/erreurs à éviter issus des recettes gratuites.
- Progression cochable par étape ; elle reste distincte pour chaque recette et est conservée pendant la consultation de la page **sans stockage persistant ni compte utilisateur**.
- `src/utils/dinnerKitchenGuide.mjs` fabrique les étapes depuis `src/data/recipes.ts`, sans dupliquer artificiellement les recettes ni prétendre fournir la future prestation payante.
- **Sécurité corrigée dans la recette publique :** la PR #25 (fusionnée et déployée) impose désormais la rectification de l'Amok avant l'ajout des œufs et du poisson crus, et interdit de goûter après. Le mode cuisine guidée conserve par précaution un rappel explicite cohérent avec cette source corrigée.
- `tests/dinner-kitchen-guide.test.mjs` ajouté, ainsi que `npm run test:kitchen` dans la CI.
- **Validation actualisée :** les tests Node natifs, contrats et compilation Astro sont exécutés sur la branche dans la CI #38078284525 (SUCCESS).
- **Contrôles restant humains :** audit visuel qualitatif, lecture d'écran et revue du rendu imprimé réel ; la CI et la recette automatisée Chrome desktop/mobile sont déjà passées.

## 0 sexies. Mode cuisine guidé (10 octobre 2026)

Le prototype non marchand comprend désormais un troisième module interactif.

**Sources et fonctionnalités**

- `src/components/DinnerKitchenGuide.astro` et `src/utils/dinnerKitchenGuide.mjs`, avec déclarations TypeScript.
- Deux recettes gratuites comme seules sources : `amok-trey` et `chek-ktis`.
- Navigation d'une étape à l'autre ; choix plat/dessert ; progression par recette et repères (cue, mistake, durée) lorsque renseignés dans les données existantes.
- Suivi de progression **uniquement en mémoire dans l'onglet**, sans compte, cookies ou écriture en stockage local. L'état n'est pas conservé après rechargement.
- Boutons accessibles au clavier, progression native `<progress>`, états `aria-pressed` et annonces de changement.
- **Défense en profondeur :** le guide reprend la consigne corrigée dans la recette Amok publique : assaisonnement avant introduction des œufs et du poisson crus, sans dégustation de la préparation crue.

**Correction éditoriale déjà réalisée (PR #25)**

- La correction ciblée de `src/data/recipes.ts` sur l'Amok et le Prahok Ktis a été fusionnée dans `main` puis déployée sur OVH. La PR #24 incorpore cette version corrigée sans modification supplémentaire des recettes publiques.

**Tests et qualité**

- `tests/dinner-kitchen-guide.test.mjs` : 7 tests source, progression et sécurité ; `npm run test:kitchen` intégré à la CI.
- Exécution indépendante de **23 tests JS** des trois modules et du contrat de pré-lancement à partir du code récupéré de la branche GitHub dans un moteur V8 isolé : **PASS**.
- Déjà validés : `npm run check`, `npm run build`, tests Node/CI et interactions Chrome sur mobile et desktop. Restent une revue humaine des contrastes, de l'accessibilité assistée et du rendu réellement imprimé.
- La PR #24 est ouverte **Ready for review**, sans merge. Aucun bouton de vente, réservation ou préinscription n'est autorisé sur ces prototypes.

## 0 septies. Feuille de route locale et téléchargeable (10 octobre 2026)

- Nouveau `src/components/DinnerPack.astro` sur `/experiences/grand-diner-khmer/` : la page présente une synthèse des 2 recettes du prototype, des convives, de l'heure du service, des jalons horaires et du nombre de produits à prévoir.
- `src/utils/dinnerPack.mjs` combine uniquement les deux modules existants de calcul (`dinnerPreview.mjs`, `dinnerTimeline.mjs`) et le matériel listé dans les recettes gratuites.
- Sélections synchronisées sans nouveau formulaire : les modules courses et planning émettent les événements `dinner:guests` et `dinner:time` ; la feuille de route les écoute.
- Export facultatif en fichier `.txt` créé localement via `Blob` et URL temporaire, sans serveur, tracking, courriel ni cookies ; alternative de copie dans le presse-papiers.
- Chaque téléchargement est clairement marqué comme **aperçu gratuit de deux recettes existantes**, pas comme un produit premium final.
- Les quantités inconnues ne sont pas inventées ; une marge de préparation explicite est conservée ; le dessert reste non intégré au planning du plat.
- Les contenus non exclusifs, recettes, fiches et liens restent accessibles gratuitement.
- `tests/dinner-pack.test.mjs` (7 scénarios : données réelles, calculs, groupements, matériel, export, erreurs) et `npm run test:pack` sont intégrés à la CI.
- **Validation actualisée :** tests Node natifs, compilation Astro et parcours Chrome desktop/mobile PASS sur CI #38078284525 ; contrôle visuel humain des contrastes toujours recommandé.

## 0 octies. Pense-bête téléchargeable — quatrième module (10 octobre 2026)

- Nouveau `src/components/DinnerPack.astro` dans la page `/experiences/grand-diner-khmer/` ; module autonome et non marchand, avec résumé lisible (convives, heure de service, nombre d'ingrédients et jalons).
- Contrôles sans duplication : `DinnerPreview` émet `dinner:guests`, `DinnerTimeline` émet `dinner:time` ; `DinnerPack` écoute ces événements et se recalcule instantanément.
- `src/utils/dinnerPack.mjs` centralise les calculs en réutilisant exclusivement `buildPilotShoppingList` et `buildPilotServicePlan` déjà testés. Aucun nouveau contenu culinaire inventé.
- Export `.txt` dans le navigateur via `Blob` et URL temporaire libérée, avec bouton « Copier » alternatif. Aucun serveur de téléchargement, inscription, suivi, API tierce ou newsletter.
- Le texte téléchargé comprend les liens vers les **deux recettes gratuites**, une liste de courses par quantité, un planning de l'Amok **indicatif**, le temps de préparation du dessert **séparé** et le matériel signalé dans les recettes. Les quantités non disponibles ne sont pas inventées, et les ramequins/matériels de la recette de base doivent être adaptés aux convives.
- Les avertissements de sécurité (ne pas goûter après introduction de composants crus) et le statut de démonstration gratuite figurent dans le fichier.
- `tests/dinner-pack.test.mjs` (7 cas) et `npm run test:pack` ajoutés à la CI. Dans le moteur V8 isolé, exécution **30/30** tests des 4 utilitaires réussie sur les sources récupérées depuis GitHub. Contrat de pré-lancement exécuté sur les sources récupérées : **PASS**.
- **Contrôles techniques terminés :** build Astro, CI GitHub Actions et tests automatisés Chrome desktop/mobile incluant les événements inter-composants. Revue humaine clavier/lecture d'écran et examen des détails visuels toujours souhaitables avant publication.
- La condition préalable du **lot A Ateliers (PR #20)** est désormais satisfaite : six pages en production, HTTP 200 et sitemap contrôlé. La publication de la PR #24 reste une décision indépendante.

## 0 nonies. Menu à choix et troisième plat réellement optionnel (10 octobre 2026)

- La démonstration ne se limite plus à deux plats figés : elle propose en supplément un **Prahok Ktis à partager**, provenant uniquement de la recette gratuite publiée `prahok-ktis`.
- Ce plat est désactivé par défaut : il ne s'agit ni d'une entrée obligatoire ni d'un dîner composé par un cuisinier externe.
- Lorsqu'il est coché, le composant `DinnerPreview.astro` ajoute ses ingrédients pour 2/4/6 personnes ; le lait de coco commun à plusieurs recettes est correctement consolidé selon les unités, et les ingrédients sans quantité restent non chiffrés.
- Le changement est propagé par `dinner:side` vers `DinnerPack.astro` : le fichier texte, les liens des recettes et la liste de courses sont cohérents avec le menu choisi.
- Le planning principal de l'Amok n'absorbe **pas** les durées du Prahok Ktis : un avertissement visible dans le téléchargement explique que l'accompagnement doit être organisé séparément avant toute promesse de service coordonné.
- Le mode `DinnerKitchenGuide.astro` propose désormais les étapes de la vraie recette du Prahok Ktis uniquement si ce plat est choisi. Son onglet est masqué par défaut, disparaît au retrait, et les progressions distinctes sont conservées tant que la page reste ouverte.
- Trois tests supplémentaires et des contrôles de non-régression ont été ajoutés à `test:dinner`, `test:pack` et `test:kitchen`.
- Ce parcours gratuit reste un **prototype fonctionnel**, pas une formation premium vendue. Il n'existe toujours ni réservation, ni collecte d'inscrits, ni paiement.

## 0 decies. Grande étape — Carnet de réception complet (10 octobre 2026)

**Développement effectivement réalisé, sans commercialisation :**

- Nouvelle route statique `/experiences/grand-diner-khmer/carnet-de-reception/` en `noindex`, liée à la page existante du Grand Dîner et au pense-bête personnel.
- Nouvelle création éditoriale originale : présentation du menu, conducteur de service de l'Amok calculé depuis les durées publiées, cinq chapitres pédagogiques à cocher (« Un menu qui respire », « Tout préparer avant la vapeur », « Respecter le rythme du plat », « Servir avec générosité », « Finir sur une note douce ») et un sixième chapitre facultatif Prahok Ktis.
- Le lecteur peut choisir 2/4/6 convives, une heure de service entre 19 h et 21 h et l'accompagnement facultatif ; ces choix sont transmis depuis le Grand Dîner par paramètres d'URL non personnels et validés dans le navigateur. Le calcul est dérivé des utilitaires existants, sans nouvelle recette inventée.
- Suivi local des gestes effectués et progression avec annonce accessible, sans compte ni données envoyées ; l'accompagnement ne se retrouve ni dans la progression ni dans le contenu si désactivé.
- Nouvelle **fiche de dégustation originale** à imprimer et remplir au crayon : aromates, texture de l'Amok, contraste facultatif Prahok, douceur du Chek Ktis, améliorations pour un autre essai. Le formulaire n'enregistre aucune donnée en ligne.
- Mise en page dédiée responsive et impression A4 avec masquage des menus du site, des éléments interactifs et des images décoratives.
- Nouveau modèle `src/utils/dinnerReception.mjs` et déclarations TypeScript ; `tests/dinner-reception.test.mjs` couvre sources, chronologie indicative, scénario à trois plats, progressions, données invalides et rappel de sécurité.
- Nouveau contrat de pré-lancement et étape `npm run test:reception` dans la CI existante.
- **Référentiel d'essais réels** : `docs/protocole-validation-grand-diner.md` impose six configurations (2/4/6 convives, avec ou sans Prahok), des mesures culinaires et critères de validation avant tout discours commercial.

**Limite substantielle :** il existe désormais un carnet numérique imprimable et un récit de dîner cohérent, mais **aucun essai culinaire physique n'a été effectué**. Le projet ne dispose pas de chef partenaire confirmé. Le calcul des horaires est une estimation et ne prouve pas un service coordonné. Les supports exclusifs, médias originaux finalisés et la vente restent à concevoir après validation.

**Livraison** : le lot A (ateliers et correction de sécurité #25) est LIVE ; la PR #24 a réussi la CI et les tests Chrome et reste ouverte sans merge ni publication. Une décision explicite reste nécessaire pour le lot B. Les essais culinaires sont toujours indispensables avant commercialisation.

## 1. Décisions confirmées

- Ne supprimer **aucune** recette, page culture, entrée de glossaire, atelier pédagogique ou route existante.
- Optimiser l'existant uniquement si cela apporte un bénéfice mesurable et sans régression.
- Créer un espace commercial **séparé** du site éditorial, avec une identité premium cohérente avec les couleurs et la typographie du site.
- Développer en premier **Le Grand Dîner Khmer**, une expérience numérique guidée à préparer chez soi.
- Ne pas conditionner la création du numérique à la présence d'un chef, cuisinier partenaire ou intervenant spécialisé.
- Prévoir, **ultérieurement seulement**, des ateliers accompagnés : recrutement d'un cuisinier/intervenant à étudier.
- Prévoir plus tard une ligne de coffrets physiques, soumise à validation des fournisseurs, des marges, de la logistique et des obligations alimentaires.
- **Aucune vente, réservation, prétendu stock, avis client ou témoignage non vérifié** avant que le produit correspondant soit réellement disponible.
- **Aucune activation** des paiements, campagnes, automatisations emails ou diffusion en production sans validation préalable.

## 2. États de catalogue et langage public

| Offre | Statut initial | Affichage honnête | État des paiements |
| --- | --- | --- | --- |
| Le Grand Dîner Khmer | En conception | Expérience numérique en préparation | Désactivés |
| Ateliers accompagnés | Partenaire recherché | Nous recherchons un cuisinier partenaire ou un intervenant spécialisé pour de futurs ateliers. Aucune date n'est ouverte | Désactivés |
| Coffrets gourmands | À l'étude | Coffrets en réflexion, sans engagement de disponibilité | Désactivés |

Ne pas confondre les six **ateliers pédagogiques en autonomie déjà gratuits** (`/apprendre/`) avec les futurs **ateliers animés payants**. Les liens vers les pages actuelles restent valides.

Pour la recherche de partenaires, ne pas afficher d'adresse email, formulaire ou canal de candidature inventé. Ajouter un CTA de contact **uniquement après configuration et vérification** d'un canal utilisable.

## 3. Page de pré-lancement

Route : `/experiences/`

- Première version statique sous Astro, avec `noindex` pendant le développement.
- Explication des trois futurs types d'expériences et de leurs vrais statuts.
- Appel à partenaires descriptif pour la partie ateliers, sans contact fictif.
- CTA uniquement vers les recettes et ressources gratuites existantes.
- Pas d'annonce de prix, de lien de paiement, de formulaire marketing, d'analytics nouveau, de faux compte à rebours ni de promesse de dates.
- Header/footer partagés pour respecter la marque, CSS isolé pour éviter les régressions.
- Pas de modification des menus existants dans cette première étape. L'entrée de navigation sera discutée au lancement public.
- Photographies existantes réutilisées provisoirement avec chemins vérifiés par le code source ; prévoir un shooting ou de nouveaux visuels pertinents avant commercialisation.

## 4. Produit numérique — chemin critique

1. Choisir et tester un menu cohérent : entrée, plat, dessert. Valider durée, gestes, substitutions, allergènes et quantités.
2. Définir la différence réelle entre contenus gratuits et payants : organisation complète du dîner, parcours séquencé, planning, liste de courses et démonstrations originales.
3. Réaliser des prototypes du parcours et des démonstrations, sans se prévaloir de la présence d'un chef.
4. Tester en usage réel avec des personnes débutantes, recueillir les points d'échec et corriger.
5. Fixer le contenu, le mode de livraison, la durée d'accès et le tarif sur des coûts vérifiés. Le prix de **39 € n'est qu'une hypothèse commerciale**.
6. Créer la page de vente riche et son prototype de paiement **non connecté à la production**.
7. Ajouter le paiement et la livraison uniquement après validation des obligations légales, sécurité et suivi de commande.
8. Lancer un nombre limité de ventes réelles puis suivre taux de conversion, satisfaction, remboursements et rentabilité.

## 5. Ateliers et coffrets — chantiers séparés

**Ateliers :** recherche d'un intervenant compétent à considérer quand les ateliers payants deviennent une priorité, vérification du format (présentiel/en ligne), contrat, coûts, responsabilité, calendrier, capacité, système de réservation. Aucun atelier payant animé tant que la prestation n'existe pas.

**Coffrets :** sélection d'ingrédients, fournisseurs, coût d'achat, règles de composition/étiquetage/allergènes, emballage, conservation, livraison et retours. Aucun stock ni précommande fictive.

## 6. Architecture et dépendances

- Site actuel : Astro 5 en mode `output: 'static'`. Ne pas ajouter de route serveur Astro sans décider d'abord d'une architecture d'hébergement compatible.
- Pages marketing : Astro statique et CSS dédié ; animations progressives et désactivables.
- Backend de paiement et commandes : composant isolé à définir ; prise en compte des webhooks sécurisés, idempotence, états de commande, contrôle d'accès et logs.
- Checkout : Stripe Checkout **envisagé**, pas encore installé ni configuré.
- Emails : transactions utiles après paiement ; prospection seulement avec base légale adaptée et preuve du consentement si nécessaire.
- Monitoring : pas de nouvelles traces contenant des données personnelles sans conformité et décision explicite.

## 7. Garde-fous qualité et mise en production

- Routes préexistantes inchangées ; pas de suppression de contenu éditorial.
- Tests de build Astro + `astro check` + contrats éditoriaux/recettes/motion.
- Vérifier le rendu sur mobile et desktop, navigation clavier, accessibilité, contraste, chargement d'images et mouvement réduit.
- Réaliser une revue de PR avant merge, sans déclencher de déploiement en production.
- La page est en **préparation**, pas un produit déjà lancé.
- Pas de merge ni déploiement sans validation explicite.

## 8. Décisions ultérieures

- Contact vérifié pour les candidatures de partenaires.
- Disponibilité réelle du produit numérique et preuves issues de tests.
- Choix du prestataire de paiement et architecture compatible OVH.
- Prix définitifs et conditions de vente après chiffrage.
- Calendrier éventuel des ateliers et de la ligne de coffrets.
