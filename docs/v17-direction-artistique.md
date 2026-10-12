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

La route **`/v17-preview/`** contient une démonstration responsive autonome : une composition photo/texte de héros, une étude graphique honnête du geste non photographié et quatre sections de transition. Elle utilise **deux photographies déjà présentes dans V16**, avec crédits sur `/credits-photos/`, et **deux nouvelles photographies** (Amok CC0 et fruits de marché CC BY 2.0) avec lien direct à la source Wikimedia Commons sur la page prototype. Ce prototype ne prouve pas qu'il existe de nouvelles prises de vues, ni que les six transitions finales ont été produites.

- Route non indexée (`noindex`), non ajoutée au sitemap ou à la navigation.
- Nouveau CSS exclusivement préfixé `.v17-preview`, sans modifier l'accueil public.
- GSAP limité aux révélations discrètes et au mouvement de l'image sur écrans larges.
- Réduction du mouvement prise en compte ; aucun contenu caché sans JavaScript.
- CTAs directs vers recettes et ateliers existants.
- Aucun nouveau package, réseau, formulaire, paiement ou donnée utilisateur.

## Validation et garde-fous

Le contrôle automatisé `node scripts/check-v17-preview.mjs` est ajouté à la CI des branches de développement. Avant toute fusion, réaliser une **recette visuelle réelle** à 320, 360, 390, 768 et 1440 px, zoom 200 %, clavier (Tab, Entrée, Escape), mouvement réduit, réseau lent et Safari mobile.

Examiner notamment : logo/header, cadrage de la nouvelle photo Amok (source paysage), contraste de légende sur photo, temps de chargement, clics, absence de scroll horizontal et de CLS.

### Réception initiale des captures simulées (13 octobre 2026)

Une prévisualisation HTML/CSS **locale, non équivalente à un build Astro**, a été capturée à 1440×900 et 390×844. L'essai avec le visuel V16 `amok-alt` a révélé une nappe rouge et une prise de vue trop frontale. Le prototype a d'abord essayé une photographie existante de Prahok Ktis, puis **a intégré un nouveau cliché documentaire d'Amok Trey avec riz, sous CC0**, sélectionné dans Wikimedia Commons. Sa qualité finale et son cadrage restent soumis à réception visuelle. La photo `kroeung` du dépôt représente un plat cuisiné, pas un pilon au mortier : elle est remplacée ici par une étude graphique explicite pour ne pas illustrer faussement un geste. Le premier rendu mobile plaçait les accès recettes hors écran ; l'image a été raccourcie de `55svh` à `40svh` pour rapprocher les actions. Il faudra encore vérifier sur un **vrai build Astro + navigateur**.

**Gate média P0 :** une première photographie d'Amok est ajoutée avec provenance et licence vérifiées ; les autres scènes restent à enrichir avec des prises de vue cohérentes, originales ou réellement autorisées. Aucun photomontage ou visuel synthétique ne doit être présenté comme documentaire.

### Photothèque encore manquante

Au moins huit à douze prises de vues distinctes restent souhaitables : mortier en plusieurs états, vraie mise en place de l'Amok, feu, table dressée, nouilles/bouillon du matin, finitions Lok Lak, ingrédients frais, portraits de gestes avec consentement. Les images nouvelles nécessitent source, auteur, droits, légende et vérification factuelle. **Aucune image générée ne doit être présentée comme une photographie documentaire ou une recette testée.**

### Conditions de promotion vers l'accueil réel

1. Validation humaine de la direction artistique du prototype.
2. Validation des nouveaux médias, ou autorisation explicite d'utiliser les photos actuelles sans répétition.
3. Recette navigateur et Lighthouse des variantes desktop/mobile.
4. Reprise ciblée dans `src/pages/index.astro`, uniquement après accord et non-régression.
5. PR de promotion distincte, **jamais de merge ou déploiement automatique**.

## Nouvelle sélection média — Amok et riz (13 octobre 2026)

Photographie de **sharonang**, intitulée « Fish Amok with Rice », prise à Siem Reap le 6 septembre 2015. La page Wikimedia Commons indique **CC0 1.0** (vérification de la source Pixabay confirmée par un réviseur Commons le 15 juillet 2025). La page prototype intègre une attribution volontaire vers la source ; elle ne prétend pas montrer notre propre préparation. Variantes JPEG responsives 960 × 640 et 1920 × 1280. Détails et URL de licence : [inventaire de sourcing V17](./v17-sourcing-medias.md).

## Nouveau média de marché (13 octobre 2026)

La photo générique du marché de Kep, montrant principalement des grains de poivre emballés, est remplacée **dans le prototype seulement** par un étal de fruits photographié entre Phnom Penh et Siem Reap par **McKay Savage** (31 décembre 2008, Wikimedia Commons / Flickr, CC BY 2.0). Deux versions responsives sont servies, et le cliché est crédité avec licence. Le carnet de Kep reste un **lien vers un autre marché**, il n'est pas présenté comme le lieu photographié. Voir `docs/v17-sourcing-medias.md`.
