# C4C2 — Structure privée des ingrédients et techniques

29 octobre 2026. Ce lot enrichit **le Studio commun existant**, sans nouvelle
interface, fournisseur IA ni publication.

## Ingrédients

Le modèle `IngredientGuide` de `src/data/ingredients.ts` reprend déjà
l'essentiel des rubriques du formulaire privé : introduction, SEO, rôle,
approfondissements, profil, usages, conseils, choix, conservation, accords,
erreurs et mots-clés. `cmsIngredientAstroDraftProjection` construit en
mémoire une projection **à relire**, sans sources internes, sans médias ni
droits supposés acquis. Les listes et chaînes sont vérifiées ; une fiche
incomplète est refusée pour la projection, mais peut rester brouillon.

À ce stade, il faut encore vérifier manuellement les durées de conservation,
les substitutions, les termes culinaires et l'absence d'allégations
médicales. Le chemin de photo, les tailles responsive, les crédits et les
droits ne sont pas générés ni approuvés.

## Techniques

`cmsTechniqueAstroDraftProjection` prépare les rubriques existantes du
modèle `RecipeTechniqueGuide` de `src/data/recipeTechniques.ts` :
description, introduction, durée et rendement, fournitures, étapes,
alternatives et FAQ. La projection reste **strictement non publiable**.

Un complément `technique_links.version=1` permet à l'humain d'indiquer
jusqu'à 12 slugs de recettes publiées et un slug d'atelier publié.
`cmsTechniqueLinksClean` vérifie la syntaxe et, **à chaque sauvegarde
privée**, l'existence de chaque cible dans le catalogue canonique du site.
Les liens vers des brouillons ou des cibles absentes sont refusés. Les
anciennes versions sans ce complément restent lisibles et les anciens
clients conservent les liens précédemment validés ; si une cible du
catalogue a disparu, la sauvegarde échoue en sécurité.

La sélection et les slugs restent un choix humain, séparé du contrat
`creation-form-core-v1` de génération IA C2. Même les liens conformes
doivent être revalidés à partir du catalogue **au moment d'une éventuelle
publication**. Aucun champ `publication_ready` fourni par le navigateur
ou l'IA n'est accepté comme autorisation.

## Tests et limites

`tests/php/editorial-native-ingredient-technique-smoke.php` vérifie :
projection typée des deux familles, absence des notes privées et médias,
anciens brouillons et versions immuables, lien recette/atelier canonique,
refus des liens inventés ou doublons, approbation forgée, échappement HTML
et compatibilité du contrat IA C2.

La CI exécute les tests PHP 8.3 et 8.4 en plus des tests Astro/Node. Aucune
page statique n'est générée, aucun droit d'image n'est inventé, aucun MP3
Coral V2 n'est modifié, aucun transfert OVH ou appel n8n/Ollama réel.

## Étape suivante

Compléter le **blueprint atelier Coral V2** dans le même Studio en prenant
pour référence une recette canonique existante, six phases, sept scripts et
un flux d'approbation humain par média. Préparer ensuite les aperçus
fidèles et les droits des images par famille, sans automatiser la publication.
