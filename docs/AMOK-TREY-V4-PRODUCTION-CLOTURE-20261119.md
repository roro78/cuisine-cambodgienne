# Amok Trey V4 — réception publique et clôture de synchronisation

Mise en production reçue le 19 novembre 2026 par transfert manuel FileZilla de cinq fichiers. La réception publique confirme les cinq empreintes du lot, HTTP 200 pour la page et le MP3, HTTP 206 sur 384 octets et sept chapitres. Chrome a validé lecture, pause, reprise et navigation au dernier chapitre sur ordinateur 1440 px et mobile tactile émulé 390 px. L’écoute intégrale a été confirmée par le propriétaire dans la conversation. La recette, le catalogue et le sitemap pointent vers l’atelier public.

La page publique est https://www.cuisine-du-cambodge.com/apprendre/pratique/amok-trey/.

## Fichiers reçus

| Chemin relatif | Octets | SHA-256 |
| --- | --- | --- |
| `audio/workshops/atelier-pratique-amok-trey/atelier-coral-v4.mp3` | 11436672 | `177ccaad9b45a18c11270d9a949e8d19f55516e8e045745615d32f5c2d4bceff` |
| `apprendre/pratique/amok-trey/index.html` | 70034 | `1d67834781edfec721fb381746bfeb5c2ae1e007fadab1f2d4ef04cb7d804770` |
| `recettes/amok-trey/index.html` | 33084 | `e005bb368c927ffae149bec19afb134e9074428daa883f51a535d3ec271e8efe` |
| `apprendre/index.html` | 19924 | `21fad1ca05b29bdb528e10ddd6ac8607f4b5e447f261cf77418b36d30a5525ac` |
| `sitemap.xml` | 4979 | `cba2ee07868f36c21825455b20c23ad9428649c837084fa29a77f3b1cac6f0dc` |

## Sauvegardes et restauration

La provenance FileZilla des trois anciennes copies reste non confirmée. Trois captures HTTP réalisées avant le transfert ont été retrouvées et leurs empreintes concordent avec les versions précédentes du manifeste. Elles sont conservées localement dans le dossier de livraison, sous `ORIGINAUX-HTTP-AVANT-TRANSFERT`, en conservant les chemins relatifs. Ces copies contiennent les octets publics antérieurs. Leur récupération repose sur les captures antérieures déjà présentes.

| Ancien fichier | SHA-256 vérifié |
| --- | --- |
| `recettes/amok-trey/index.html` | `7119fda5d8e0ee1e017195fd2b583155654022ec620783dd14e59b295125f946` |
| `apprendre/index.html` | `b1fd88330ed397222972b743982f13c215ab867d2c8be23bfd1925b1cd9767c1` |
| `sitemap.xml` | `4bd18f66e6fae65a7704aa2fa574d688305604dea048394589979381e969de7e` |

La restauration n’a pas été exécutée sur le serveur. Le plan local prévoit la remise en place des trois originaux et le retrait ciblé des deux nouveaux fichiers.

## Sources et reconstruction

Le candidat est préparé dans la branche de la PR #237. Le MP3 intégral public, le blueprint et le manifeste audio sont inclus. Les sept narrations passent le contrôle de leurs empreintes V4. Les fragments audio et le brouillon privé restent hors du commit. Les sources historiques de portions proviennent des commits `d8fc6e0` et `187eeb2`.

La réconciliation du 20 novembre 2026 distingue le build Astro courant et la reconstruction de la livraison datée. La recette publiée charge un module de portions qui importe les calculs depuis `recipePortions.C1MUzHzM.js`. Le graphe de modules actuel intègre ces calculs dans le script de recette, puis Vite intègre ce petit script directement dans le HTML. Les sources historiques des commits `d8fc6e0` et `187eeb2` préservent le comportement mais ne reproduisent pas à elles seules le découpage du build historique.

L’espacement provient de l’insertion initiale. Le bloc atelier avait été inséré immédiatement avant le glossaire, après les espaces déjà présents dans la référence HTML, avec un espace séparateur ajouté après le bloc. Le gabarit Astro courant place ce bloc dans son propre flux d’espaces.

Le procédé versionné `scripts/package-amok-v4-release.mjs` vérifie l’ancienne recette par empreinte, extrait le bloc atelier du nouveau build et rejoue exactement cette insertion. Le HTML final publié n’est pas utilisé comme entrée. Les deux modules publics historiques sont conservés par empreinte pour que l’export reconstruit reste autonome. Le contrat refuse tout changement d’une référence ou de l’une des cinq sorties avant écriture. La commande `npm run build:amok-v4` réalise la reconstruction. La procédure et la provenance des références figurent dans `releases/amok-trey-v4/README.md`.

Le verrou npm a été régénéré dans un dossier sans `node_modules`, avec les versions directes du build reçu et les versions Vite et Rollup fixées. Il comprend les variantes optionnelles Rollup et esbuild pour Linux et Windows. Une réinstallation propre avec `npm ci` et le build suivi du packaging reproduisent les cinq empreintes ci-dessus. Node 22.22.0 et npm 10.9.4 constituent l’environnement local de référence. La CI vérifie également les portions et les cinq sorties depuis son checkout propre Linux.

Les tests ciblés vérifient les portions pour 1, 2, 4, 8 et 12 personnes sur la référence historique, le build source et la recette publique en lecture seule. Les quinze cas ont les mêmes ingrédients et instructions. La réserve de coco vaut respectivement environ 4, 7,5, 15, 30 et 45 ml. Les ramequins valent 1, 2, 4, 8 et 12. Le combava et le basilic restent fixes conformément à la recette canonique. Le contrôle couvre également les autres quantités figurant dans les instructions et les ingrédients.

Les commandes de validation précédemment reçues restent la base de non-régression. La CI du candidat final réexécute ses contrôles habituels et ajoute la comparaison des portions et la reconstruction exacte. Les données, MP3 et gabarits des six ateliers historiques ne sont pas modifiés par cette correction. Le Studio PHP reste hors périmètre.

## Production et décision

Les six ateliers historiques répondent HTTP 200 et leurs six MP3 répondent HTTP 206 aux requêtes partielles. Le contrôle reste une réception réseau et lecteur, avec réserve sur les essais d’un téléphone physique. Les cinq empreintes publiques ont été relues pendant la clôture. Aucune écriture OVH ni modification de `ovh-production` n’a été effectuée pendant cette mission.

**CLÔTURE TECHNIQUE PASS pour la synchronisation des sources et la reconstruction de la livraison.** Les cinq empreintes sont identiques au manifeste et le comportement des portions est vérifié. La PR #237 peut être préparée pour fusion après succès de ses contrôles sur le commit final. La provenance FileZilla des anciennes copies et une restauration sur serveur restent non attestées. Les trois captures HTTP historiques vérifiées restent conservées comme éléments de retour arrière. Les essais mobiles précédents sont des essais Chrome émulés, sans qualification d’un appareil physique.
