# Amok Trey V4 — réception publique et réserve de clôture

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

La construction isolée utilise Node 22.22.0, Astro 5.18.2 et Vite 6.4.4. Après réinstallation des dépendances et build, quatre fichiers correspondent exactement au lot public. La recette reconstruite diffère encore par son module JavaScript de portions et par l’espacement précédant le bloc atelier. La version publiée avait été préparée en insérant uniquement le bloc Astro dans le HTML public existant, afin de conserver les portions déjà servies. Cette divergence est identifiée et empêche de certifier une reconstruction exacte des cinq fichiers depuis les sources seules.

Le verrou npm créé depuis l’installation Windows a été retiré du candidat Git après un échec de CI Linux sur une dépendance optionnelle Rollup manquante. Son exemplaire local est conservé pour l’audit. Les versions ci-dessus décrivent l’environnement effectivement testé.

Les commandes `npm run check`, `npm run test:recipes`, `npm run test:editorial`, `npm run test:experiences`, `node scripts/check-workshop-blueprints.mjs` et `npm run build` ont réussi dans la copie isolée après récupération du contrat historique des portions. Les fins de ligne de cette copie ont été normalisées pour les tests textuels Windows. La comparaison des données et MP3 historiques ne relève aucune modification après normalisation des fins de ligne des JSON.

## Production et décision

Les six ateliers historiques répondent HTTP 200 et leurs six MP3 répondent HTTP 206 aux requêtes partielles. Le contrôle reste une réception réseau et lecteur, avec réserve sur les essais d’un téléphone physique. Les cinq empreintes publiques ont été relues pendant la clôture. Aucune écriture OVH ni modification de `ovh-production` n’a été effectuée pendant cette mission.

**CLÔTURE TECHNIQUE NO-GO.** La réception du site public est acquise. La fusion de la synchronisation reste suspendue à la reproduction exacte du HTML de recette et à la revue du périmètre des sources de portions récupérées. La sauvegarde de provenance FileZilla et un essai de restauration sur serveur restent non confirmés. Les copies HTTP historiques vérifiées restent disponibles pour un retour arrière ciblé.
