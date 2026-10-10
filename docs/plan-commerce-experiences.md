# Cuisine du Cambodge — Plan de développement commercial

**Statut :** cadrage validé sur le principe, produit et ventes non lancés.  
**Date :** 2026-10-10  
**Périmètre :** `/experiences/` et futurs parcours marchands, en conservant intégralement le site éditorial.

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
