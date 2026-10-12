# V17-01 — Direction artistique et prototype isolé

**Référence :** site V16 (commit `2b7387bae6ef88e815befe44227bafc777e8fca2`), dépôt `roro78/cuisine-cambodgienne`, audit public du 13 octobre 2026.

## Intention

**« Du premier parfum à la dernière bouchée »** : une expérience culinaire éditoriale, chaleureuse, utile, sans surcharge d'effets.

Le premier écran doit montrer un **plat** plutôt qu'un arrière-plan de marché très assombri. Le lecteur doit pouvoir rejoindre immédiatement les recettes et les ateliers. La progression suivante explique les produits et les gestes.

### Grammaire visuelle

- Ivoire `#F4ECDF` ; vert profond `#203127` ; terre cuite `#934A38` ; or discret `#C79B5B` ; encre `#1E1A15`.
- Titres sérif à contraste éditorial ; corps sans-serif lisible ; tailles réactives et largeur de ligne bornée.
- Photographier chaque sujet pour son usage, pas comme une banque d'images interchangeables.
- Cadrage vertical pour le plat d'ouverture ; alternance plans larges / détails d'ingrédients / résultat fini.
- Transitions en mouvement maîtrisé, jamais nécessaires pour lire le contenu.

### Storyboard cible de l'accueil définitif

| Scène | Image recherchée | Sens | Mouvement envisagé |
|---|---|---|---|
| 01. Premier parfum | Plat Amok authentiquement documenté, cadrage appétissant | Donner immédiatement faim | Zoom doux du sujet pendant le départ du scroll |
| 02. Marché | Produits frais + détail d'épices | Expliquer les ingrédients | Deux profondeurs photographiques, transition de cadrage |
| 03. Geste | Séquence réellement photographiée du pilon | Apprendre en regardant | Progression en trois textures, sans autoplay agressif |
| 04. Feu | Cuisson vraie, vapeur et sauces | Montrer le passage à la cuisson | Révélation d'image sans empilement d'effets |
| 05. Table | Repas réellement dressé | Montrer le partage | Ouverture progressive du cadre |
| 06. Cuisiner | Deux recettes photographiées distinctement | Orienter vers l'action | Retour à un catalogue stable et accessible |

## Ce qui est implémenté dans cette PR

La route **`/v17-preview/`** contient une démonstration responsive autonome : une vraie composition photo/texte de héros et quatre sections de transition. Elle utilise exclusivement **cinq photographies déjà présentes dans V16** et créditées sur `/credits-photos/`. Ce prototype ne prouve pas qu'il existe de nouvelles prises de vues, ni que les six transitions finales ont été produites.

- Route non indexée (`noindex`), non ajoutée au sitemap ou à la navigation.
- Nouveau CSS exclusivement préfixé `.v17-preview`, sans modifier l'accueil public.
- GSAP limité aux révélations discrètes et au mouvement de l'image sur écrans larges.
- Réduction du mouvement prise en compte ; aucun contenu caché sans JavaScript.
- CTAs directs vers recettes et ateliers existants.
- Aucun nouveau package, réseau, formulaire, paiement ou donnée utilisateur.

## Validation et garde-fous

Le contrôle automatisé `node scripts/check-v17-preview.mjs` est ajouté à la CI des branches de développement. Avant toute fusion, réaliser une **recette visuelle réelle** à 320, 360, 390, 768 et 1440 px, zoom 200 %, clavier (Tab, Entrée, Escape), mouvement réduit, réseau lent et Safari mobile.

Examiner notamment : logo/header, cadrage Amok (la source est un portrait), contraste de légende sur photo, temps de chargement, clics, absence de scroll horizontal et de CLS.

### Photothèque encore manquante

Au moins huit à douze prises de vues distinctes restent souhaitables : mortier en plusieurs états, vraie mise en place de l'Amok, feu, table dressée, nouilles/bouillon du matin, finitions Lok Lak, ingrédients frais, portraits de gestes avec consentement. Les images nouvelles nécessitent source, auteur, droits, légende et vérification factuelle. **Aucune image générée ne doit être présentée comme une photographie documentaire ou une recette testée.**

### Conditions de promotion vers l'accueil réel

1. Validation humaine de la direction artistique du prototype.
2. Validation des nouveaux médias, ou autorisation explicite d'utiliser les photos actuelles sans répétition.
3. Recette navigateur et Lighthouse des variantes desktop/mobile.
4. Reprise ciblée dans `src/pages/index.astro`, uniquement après accord et non-régression.
5. PR de promotion distincte, **jamais de merge ou déploiement automatique**.
