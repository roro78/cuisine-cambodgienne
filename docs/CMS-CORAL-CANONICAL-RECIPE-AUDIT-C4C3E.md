# C4C3E — Concordance atelier / recette canonique

29 octobre 2026. Diagnostic privé, en lecture seule, sans visa culinaire, audio ni publication.

## Mode opératoire

Depuis l’aperçu d’un atelier enregistré, un lien explicite charge les index publics
social-feed.json, editorial-source-index.json et editorial-guided-fields.json.
Le Studio vérifie leur couverture et les empreintes SHA256 intégrales avant
d’afficher les portions et la liste des ingrédients de la recette source.
Ce chargement n’a lieu que sur demande et ne crée aucune version ni appel IA.

Pour les fiches du modèle Astro recipes, les quantités affichées correspondent
au nombre de portions canonique : elles ne sont pas recalculées en fonction
du nombre de participants de l’atelier. Les ingrédients éventuellement saisis
dans les phases sont rapprochés par égalité textuelle simple. Une différence
de libellé peut être une variante légitime et exige une décision humaine.

Pour le modèle historique restoredRecipes, aucune quantité ni portion n’est
extrapolée. Le panneau signale que cette famille nécessite un adaptateur dédié.

## Garanties

L’index absent, l’empreinte modifiée ou une recette non publiée provoquent
un refus sans dégrader le reste du Studio. Les données de recherche privées
ne sont pas copiées dans le rapport. Les résultats proviennent uniquement
des index du contenu publié, sans bibliographie ajoutée aux pages.

Le contrôle ne valide jamais l'exactitude des allergènes, substitutions,
cuissons, mesures, portions personnalisées ou gestes. Les flags
canonical_recipe_details_revalidated, audio_approved et publication_ready
restent TOUJOURS faux. Les visas de texte C4C3D ne changent pas ce principe.

## Tests et suite

Le smoke tests/php/editorial-canonical-recipe-audit-smoke.php utilise les
trois index réellement produits par le build Astro. Il contrôle l’empreinte
intégrale, les ingrédients, le cas historique et les refus d’index invalides.

Suite : visa culinaire humain distinct, ancré dans le SHA256 de la recette
source complète ; vérification des quantités, gestes et allergènes, sans
autoriser Coral TTS tant que toutes les étapes restent incomplètes.

Aucun OVH, n8n, TTS, MP3 ou publication modifiés.