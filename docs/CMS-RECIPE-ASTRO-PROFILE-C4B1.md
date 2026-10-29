# C4B1 — Profil de recette Astro dans le Studio commun

29 octobre 2026. Développement privé sans déploiement OVH, fournisseur réel ni publication.

## Portée exacte

Le contrat de génération C2 `cdc-editorial-ai-content-request-v1` conserve le
socle `creation-form-core-v1` **à l'identique**. On n'y ajoute pas de champs
obligatoires susceptibles de casser les fournisseurs ou les brouillons existants.

Le formulaire commun `public/gestion-contenus/index.php` propose désormais,
**pour les recettes uniquement**, une section « Compléments recette pour Astro » :

- **Difficulté** : `Facile`, `Intermédiaire` ou `Avancé` ;
- **Catégorie** : valeurs définies par `src/data/recipes.ts` ;
- **Mots-clés éditoriaux** : jusqu'à 12 textes distincts, maximum 50 caractères.

Ces champs humains sont enregistrés sous `recipe_astro`, avec `version:1`,
dans les nouvelles versions privées de `cmsCreationSave`. Ils ne changent
pas le modèle public, ne sont jamais publiés ou transmis au fournisseur IA,
et ne représentent aucun visa de qualité.

## Compatibilité sans migration

- Une révision historique sans `recipe_astro` reste lisible et inchangée.
- Une saisie depuis un ancien client qui ne transmet pas ce champ **hérite
  du dernier profil enregistré** pour éviter une suppression involontaire.
- Le Studio conserve le profil dans le formulaire après erreur ; la proposition
  IA en session en conserve une copie dans `before_form` pour restauration.
- L'IA ne fournit pas difficulté, catégorie ou tags. Seule la saisie humaine
  enregistre ces informations ; la provenance IA C2 reste distincte.
- Les valeurs inconnues, clés ajoutées (dont des approbations forgées),
  versions de profil illégitimes et doublons de tags sont rejetés.
- Les autres familles continuent avec leur schéma et leurs versions existants.

## Diagnostics et limites

`cmsAstroPublicationGapReport` expose un booléen distinct
`recipe_astro_profile_complete`. Un profil complet peut supprimer le
rappel « difficulty/category/tags » de la liste des lacunes ; il ne peut
**jamais** passer `publication_ready` à `true`.

Il manque encore notamment : quantités d'ingrédients converties en nombres
validés, notes/groupes de chaque ingrédient, repères/corrections des étapes,
liens internes, médias fiables et droits, vérifications culinaires et
sécurité alimentaire. Il n'y a ni convertisseur Astro final, ni aperçu
fidèle de page publique dans ce lot.

## Tests et réception

- `tests/php/editorial-recipe-astro-profile-smoke.php` : vieux brouillon
  intouché, sauvegardes versions 1/2/3, profil typé, refus des approbations
  forgées et valeurs invalides, formulaire HTML échappé, contrat C2 préservé.
- `tests/php/editorial-ai-content-controller-smoke.php` : connexion/CSRF,
  proposition C2, conservation et sauvegarde HTTP avec profil recette.
- Le reste des tests, notamment les cinq familles et le calendrier,
  demeure obligatoire dans CI PHP 8.3/8.4 et Astro.

Pour OVH, `index.php`, `lib.php` et `publication-gap-audit.php` doivent
être livrés **ensemble** après autorisation et recette. Aucun transfert ici.

## C4B2 / suites

Élargir les métadonnées d'ingrédients et d'étapes de recette sans
transformer le contrat C2 rétroactivement ; ajouter validation numérique
quantités/portions et vérification des sous-préparations.
Ensuite, couvrir Carnets, ingrédients, techniques, puis les blueprints
complets ateliers Coral V2. Un brouillon « à relire » n'est jamais
un contenu publiable.
