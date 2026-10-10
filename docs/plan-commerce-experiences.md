# Cuisine du Cambodge — Plan de développement commercial

**Statut :** cadrage validé sur le principe, produit et ventes non lancés.  
**Date :** 2026-10-10  
**Périmètre :** `/experiences/` et futurs parcours marchands, en conservant intégralement le site éditorial.

## 0. Dépendance de livraison OVH : ateliers déjà validés

- La PR #20 (`feat: create dedicated workshop learning pages`) est **fusionnée sur main** depuis le 5 octobre 2026, commit `096ceccd9881d87dcbc27352648fa16ce13c1bd3`.
- Au cadrage du 10 octobre 2026, le dernier `main` connu est `b1977a9b6937da0a5af1becd41fee0aca045fb41` ; il contient les correctifs du logo et de la navigation mobile en plus des ateliers.
- **Le déploiement manuel sur OVH de ces ateliers détaillés reste à effectuer ou confirmer.** L'accès au seul listing `/apprendre/` ne suffit pas à valider les six pages de détail.
- **Lot A : synchroniser manuellement sur OVH la branche `ovh-production` déjà compilée**, puis tester les six ateliers avant tout merge de la PR commerciale #24. Dernière branche de publication vérifiée : `fe0400966df384222a3e8141deead2d761ac1bc4` (`deploy: b1977a9b...`).
- **Lot B : merger et déployer séparément la PR #24** après revue et smoke tests de la version ateliers.
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
- **Vérification réalisée : 16 cas unitaires PASS sur copies fidèles et isolées des deux modules JS dans Node 22**, le 10 octobre 2026. Ce résultat n'est pas une exécution du build Astro GitHub ni une validation navigateur/OVH.

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
