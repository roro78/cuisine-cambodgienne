# C03/C06 — intégration des deux couvertures éditoriales validées (lot binaire)

> **Préparation conditionnelle, non déployée — 22 octobre 2026.** Les deux images sont validées par l'utilisateur dans cette conversation et disponibles dans une archive WebP produite par ChatGPT. **L'archive binaire n'a pas encore été transmise au dépôt GitHub** : ne pas prétendre que les couvertures sont en ligne ni modifier les références du site sans les huit fichiers réels.

## Choix éditorial

| Carnet | Couverture préparée | Sens et légende | Interdiction |
| --- | --- | --- | --- |
| C03 `/culture/comprendre-le-kroeung/` | `carnet-kroeung-memoire-1536.webp` | **Illustration éditoriale** de deux générations autour d'une table et d'aromates : mémoire et transmission culinaire, **sans pilon, ni tutoriel au mortier** | Ne pas la présenter comme une photographie d'une vraie famille identifiée ni un reportage historique. |
| C06 `/culture/prahok-fermentation-umami/` | `carnet-prahok-tonle-sap-1536.webp` | **Illustration éditoriale** inspirée des communautés lacustres, des pêcheurs et du marché aux poissons : vie sociale autour du Tonlé Sap | Ne pas affirmer qu'elle documente un village, un port, des pêcheurs ou une vente réellement photographiés. |

Les images **ne portent aucun texte**, et les pages de Culture ne mentionnent **aucune source documentaire**. Le champ `imageAlt` et la légende doivent annoncer un **visuel illustratif** et non une photographie de reportage. Les droits des images précédentes, notamment Thomas Wanhoff sous CC BY-SA, continuent d'être conservés sur la page générale des crédits tant que les fichiers restent utilisés.

## Préparation des fichiers

- Archive mise à disposition dans la conversation : `carnets_cambodge_2_couvertures_webp.zip` (**9 fichiers, 1,1 Mo**).
- Fichiers `public/images/cuisine/carnet-kroeung-memoire-{480,800,1200,1536}.webp`.
- Fichiers `public/images/cuisine/carnet-prahok-tonle-sap-{480,800,1200,1536}.webp`.
- Déclinaisons de 480×320, 800×533, 1200×800 et 1536×1024 px. Qualité WebP 83, contrôlée à l'export.
- Manifest `MANIFEST_IMAGES.json` dans l'archive ; 8 empreintes **SHA-256** précises reprises dans `scripts/apply-carnets-editorial-images.mjs`.

## Procédure sécurisée de réception

1. **Téléverser l'archive intacte, sans extraire**, à la racine de la **branche de PR uniquement** : `docs/carnets-c03-c06-images-editoriales-20261022`, sous le nom exact `carnets_cambodge_2_couvertures_webp.zip`.
2. L'action `.github/workflows/carnets-images-import-once.yml` se déclenche **uniquement sur ce nom de fichier et cette branche**. Elle extrait uniquement les 8 WebP autorisés, vérifie leurs SHA-256 et dimensions avec Sharp, puis met à jour les images et les alts de **C03/C06 seulement**. Les anciens visuels restent enregistrés dans `socialImage`, rôle `article` : ne pas modifier n8n, Meta, les Recettes ou les Ateliers.
3. L'action exécute `npm run check`, `npm run test:editorial`, `npm run test:recipes`, `npm run build` et la QA Chromium sur l'index et les 7 pages Carnets à **390 et 1366 px**. **Elle ne commite les nouvelles références que si tous les tests PASS.**
4. L'action commit les 8 WebP et les corrections limitées, retire le ZIP temporaire du dépôt pour éviter le stockage doublonné, et préserve la PR en **brouillon**. Aucune publication automatique sur OVH.
5. Vérifier **le run concluant PASS**, les fichiers réellement présents et l'affichage des 2 pages avant de considérer l'intégration GitHub terminée.

## Statut

- **Images générées et validées dans la conversation : OUI.**
- **Huit WebP et archive prêts dans la conversation : OUI.**
- **Fichiers binaires actuellement présents dans GitHub : NON — import à effectuer par téléversement de l'archive.**
- **Références C03/C06 du site actuellement remplacées : NON**, pour éviter les images cassées.
- **Tests sur ces nouvelles images / CI Chromium : NON EFFECTUÉS** tant que l'archive manque.
- **D2/D3 et publication OVH : EN ATTENTE**, en continuité du plan v2.8.

**Important :** ne pas fusionner cette PR conditionnelle, ni les précédentes, tant que les images n'ont pas été réellement importées puis vérifiées en CI.
