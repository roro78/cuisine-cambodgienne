# C4B3 — Détails des ingrédients et des étapes de recette

29 octobre 2026. Extension **privée** du même formulaire CMS, sans générateur
activé ni publication.

## Compléments humains

Sous `recipe_astro_details.version=1`, une version privée peut ajouter
pour les ingrédients `note`, `group` et `scalable` et, pour les étapes,
`duration`, `cue` et `mistake`. L'interface réutilise la liste existante
des ingrédients et des étapes ; les lignes nouvelles créées dans la même
saisie pourront être enrichies lors de l'édition suivante.

Chaque complément non vide conserve l'**index** ainsi que le nom d'ingrédient
ou titre d'étape exact. Si l'IA change la proposition, ou si un humain modifie
l'ordre ou l'identité d'une ligne, les compléments ne sont jamais réaffectés
silencieusement à une autre ligne : le serveur refuse la sauvegarde si la
correspondance n'est plus valable.

Les champs restent facultatifs, typés strictement et intégrés au stockage
immuable `cmsCreationSave`. Les anciennes créations ne sont pas migrées.
Un ancien formulaire qui omet cette section conserve la dernière version
des métadonnées, sous réserve que les lignes sources n'aient pas changé.
Le contrat d'entrée et de sortie du fournisseur C2 demeure inchangé.

La projection `cmsRecipeAstroDraftProjection` prend en compte les compléments
validés pour créer en mémoire les propriétés correspondantes de `Recipe`.
Les valeurs `scalable` sont des booléens explicites (oui/non) ; une réponse
vide ne les invente pas.

## Sécurité / réception

Aucune donnée de recherche privée ne sort dans la projection ; l'affichage est
échappé. Le champ `publication_ready` reste `false` et les paramètres
d'approbation forgés sont refusés.

Tests : `tests/php/editorial-recipe-astro-details-smoke.php`, mise à jour du
smoke HTTP de génération, CI Astro + PHP 8.3/8.4.

**Hors périmètre** : visuels à droits vérifiés, liens canoniques, FAQ et
`keyPoints`, validation culinaire des quantités/gestes, véritable aperçu
Astro, publication, n8n et Coral V2. Les extensions seront livrées par
lots indépendants après réception.
