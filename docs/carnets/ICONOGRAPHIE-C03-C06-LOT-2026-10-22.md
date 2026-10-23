# C03/C06 — intégration des deux couvertures éditoriales validées (lot binaire)

> **INTÉGRATION GITHUB TERMINÉE — 22 octobre 2026 ; NON FUSIONNÉE et NON DÉPLOYÉE.** Les deux images validées ont été importées sur la branche de PR #108, avec 8 fichiers WebP réels et liaisons C03/C06 vérifiées. Workflow final [#39819573638](https://github.com/roro78/cuisine-cambodgienne/actions/runs/39819573638) **PASS**.

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

## Procédure sécurisée de réception — exécutée et conservée pour audit

1. **Téléverser l'archive intacte, sans extraire**, à la racine de la **branche de PR uniquement** : `docs/carnets-c03-c06-images-editoriales-20261022`, sous le nom exact `carnets_cambodge_2_couvertures_webp.zip`.
2. L'action `.github/workflows/carnets-images-import-once.yml` se déclenche **uniquement sur ce nom de fichier et cette branche**. Elle extrait uniquement les 8 WebP autorisés, vérifie leurs SHA-256 et dimensions avec Sharp, puis met à jour les images et les alts de **C03/C06 seulement**. Les anciens visuels restent enregistrés dans `socialImage`, rôle `article` : ne pas modifier n8n, Meta, les Recettes ou les Ateliers.
3. L'action exécute `npm run check`, `npm run test:editorial`, `npm run test:recipes`, `npm run build` et la QA Chromium sur l'index et les 7 pages Carnets à **390 et 1366 px**. **Elle ne commite les nouvelles références que si tous les tests PASS.**
4. L'action commit les 8 WebP et les corrections limitées, retire le ZIP temporaire du dépôt pour éviter le stockage doublonné, et préserve la PR en **brouillon**. Aucune publication automatique sur OVH.
5. Vérifier **le run concluant PASS**, les fichiers réellement présents et l'affichage des 2 pages avant de considérer l'intégration GitHub terminée.

## Statut de réception — 22 octobre 2026, final GitHub

- **Images générées et validées pour prévisualisation : OUI.**
- **Huit WebP effectivement présents dans GitHub : OUI**, fichiers `public/images/cuisine/carnet-{kroeung-memoire,prahok-tonle-sap}-{480,800,1200,1536}.webp`, quatre par sujet. Empreintes SHA-256 contrôlées pendant la CI.
- **Références publiques de la branche PR : OUI**, `image` C03/C06 = fichiers 1536 WebP locaux, `imageWidths` avec quatre tailles, `imageAlt` et légende « illustration éditoriale » ; **pas de source documentaire affichée**.
- **Anciennes photographies sociales conservées : OUI**, `socialImage` et rôle `article`, sans changement n8n/Meta.
- **ZIP provisoire retiré : OUI**, absence vérifiée dans le dépôt après commit.
- **Exécution finale :** [GitHub Actions #39819573638](https://github.com/roro78/cuisine-cambodgienne/actions/runs/39819573638) **PASS**, check, contrats éditoriaux, recettes, build, Chromium mobile/ordinateur ; **commit GitHub réalisé**.
- **Captures :** [artifact de QA](https://github.com/roro78/cuisine-cambodgienne/actions/runs/39819573638), expiration **25/10/2026**.
- **PR #108 :** ouverte en brouillon, fusionnable, non fusionnée. **main / OVH inchangés** ; pas de publication automatique.
- **D2/D3, revue du contenu des Carnets, licences des autres photos et validation de la production OVH : EN ATTENTE**.

### Historique de l'incident technique

Le premier run **#39819304663** a passé tous les tests, mais a été bloqué uniquement par `git diff --cached --check` sur une ancienne double espace de fin de ligne Markdown du plan. Le workflow a été corrigé, puis le **run #39819573638** a passé les tests et effectué le commit. Cela n'a nécessité aucun nouvel upload utilisateur.
