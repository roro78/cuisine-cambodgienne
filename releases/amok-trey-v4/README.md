# Reconstruction de la livraison Amok Trey V4

La livraison du 19 novembre 2026 a ajouté un bloc atelier Astro dans une recette HTML déjà servie. La référence `recipe-before.html` est la capture HTTP antérieure au transfert, vérifiée par SHA-256 `7119fda5d8e0ee1e017195fd2b583155654022ec620783dd14e59b295125f946`. Le HTML final publié est reconstruit à partir de cette référence et du bloc atelier issu d’un nouveau build. Le HTML final publié n’est pas stocké comme entrée du procédé.

La recette historique utilisait les sources de portions des commits `d8fc6e0` et `187eeb2`. Son module `DHUCnB41.js` importe trois fonctions du fichier partagé `recipePortions.C1MUzHzM.js`. Dans le graphe de modules actuel, ces fonctions sont intégrées au script de recette et celui-ci est assez petit pour être intégré au HTML par Vite. Reprendre uniquement le TypeScript historique préserve le calcul mais ne reproduit pas les décisions de découpage du build antérieur.

La seconde différence provient de la position d’insertion. Le procédé FileZilla insérait le bloc immédiatement avant la balise du glossaire, après les espaces déjà présents dans l’ancienne recette, puis ajoutait un espace séparateur. Le rendu direct du gabarit Astro produit un espacement différent. Le script rejoue cette insertion complète et conserve tous les octets de la référence autour du bloc.

## Commandes

Avec Node 22.22.0 et npm 10.9.4, exécuter depuis un checkout propre contenant le verrou npm complet.

```sh
npm ci --no-audit --no-fund
npm run build
node tests/amok-v4-portions-browser.mjs
npm run package:amok-v4
```

La commande `npm run build:amok-v4` réalise le build puis le packaging. Le test navigateur peut aussi être lancé avec `--live` pour comparer en lecture seule la recette publique aux deux versions locales. La CI fournit Chrome par `CHROME_BIN`.

Le packaging refuse également toute nouvelle empreinte du HTML source de recette. Une évolution du texte, des portions ou du JavaScript doit donc être revue et versionnée avant une nouvelle livraison.

Le packaging vérifie la référence, les deux modules historiques et les cinq sorties attendues avant écriture. Il remplace uniquement la recette dans `dist` et ajoute ses deux ressources JavaScript historiques aux chemins nécessaires. Il conserve les quatre autres fichiers. L’export reconstruit est autonome et ne dépend pas de fichiers manquants sur un hébergement préexistant.

La commande est idempotente. Toute nouvelle modification du bloc atelier, de l’une des quatre autres sorties ou d’une référence provoque un arrêt. Pour une livraison future, créer une nouvelle version explicite du contrat et faire revoir ses empreintes avant publication. Ne pas réutiliser le contrat daté pour écraser une fonctionnalité nouvelle.

## Origine des références

Le manifeste contient les empreintes de la capture historique, des deux modules publics observés lors de cette réconciliation et des cinq fichiers reçus le 19 novembre. Les références contiennent uniquement les octets publics nécessaires à la reproduction. Leurs fins de ligne sont conservées par `.gitattributes`.

Les anciennes captures HTTP restent des éléments de retour arrière de provenance HTTP. Leur provenance FileZilla et une restauration sur serveur ne sont pas attestées.

La comparaison octet par octet est enregistrée dans `byte-diff.json`. À l’offset 22117, deux espaces `20 20` du rendu direct deviennent les trois espaces historiques `20 20 20`. Le script intégré occupe 3010 octets à l’offset 28053, alors que la référence externe historique occupe 101 octets à l’offset 28054. Le remplacement de ces deux seules zones restitue exactement le HTML publié.
