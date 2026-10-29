# C4B2 — Projection technique privée du modèle Recipe

29 octobre 2026. Ce lot complète le profil C4B1 et **ne publie aucun contenu**.

## Conversion strictement contrôlée

`cmsRecipeAstroDraftProjection` utilise uniquement un brouillon de recette
privé **déjà sauvegardé** et les valeurs `recipe_astro` rédigées par l'humain.
Il crée en mémoire une projection des champs nécessaires à l'interface
`Recipe` de `src/data/recipes.ts`.

Les quantités textuelles du formulaire sont converties en nombres lorsque
leur forme est strictement numérique (entiers ou décimaux français/anglais).
Une valeur ambiguë telle que `1/2`, `à volonté` ou une quantité négative
est refusée, **sans deviner la valeur correcte**. Une quantité absente reste
absente dans le type, mais apparaît parmi les points à vérifier par l'éditeur.

La projection ne reprend ni notes de recherche privées, ni réponses brutes du
fournisseur, ni fichiers média non validés, ni secrets. Elle ne modifie pas
les recettes publiques ou les anciennes révisions ; elle ne produit pas de
code TypeScript et ne réalise pas le transfert OVH.

## Studio

Dans l'aperçu d'une création privée de type recette, une section repliable
indique le nombre d'ingrédients, d'étapes et de tags projetés ainsi que les
contrôles restant ouverts. Si la structure ou les quantités sont incompatibles,
la projection est bloquée et propose une correction manuelle.

**Ce n'est pas encore un aperçu Astro fidèle**. La projection n'est ni une
relecture culinaire, ni une autorisation média, ni une autorisation de mise
en ligne. `publication_ready` demeure toujours `false`, quels que soient
les indicateurs d'approbation présents dans un record d'entrée.

## Tests

`tests/php/editorial-recipe-astro-projection-smoke.php` couvre les décimaux
avec virgule et point, les champs incomplets, les refus d'ambiguïté, la
non-divulgation des notes privées et l'impossibilité d'auto-approuver.
CI PHP 8.3 et PHP 8.4 en plus des régressions existantes.

Prochaine phase : métadonnées détaillées des ingrédients et étapes, médias
à droits vérifiés et liens canoniques, puis vrai rendu Astro responsive.
