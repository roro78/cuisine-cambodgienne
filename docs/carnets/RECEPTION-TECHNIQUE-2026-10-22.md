# Carnets — réception technique transversale du 22 octobre 2026

> **Dossier de recette INTERNE, non affiché sur les pages du site.** Prévisualisation dans `docs/carnets-validation-20261022`, base `docs/carnets-c01-riz-patrimoine-20261022` (#106). Aucun merge, aucune publication OVH. Ce dossier documente ce qui a réellement été exécuté et ce qui reste interdit avant validation.

## Périmètre confirmé

- PR empilées #97 → #106 : toutes en brouillon, aucune fusion. Les 7 routes historiques C01–C07 sont conservées.
- L'ensemble des 7 Carnets a été enrichi, **aucun texte final validé D3**.
- Les pages Carnets sont **100 % culturelles** : aucun bloc Atelier, aucune carte Recette, aucune proposition d'Ingrédient ; le composant commun `GlossaryStrip`, qui contenait un renvoi vers des recettes et des conseils pratiques, a été **retiré de ces pages seulement**. Les pages Glossaire/Ateliers/Recettes elles-mêmes sont inchangées.
- Aucune bibliographie, citation documentaire, liste de sources ou renvoi externe de vérification dans les récits. Les **crédits des photographies sous licence CC** demeurent nécessaires sur les pages ou la page de crédits ; ils ne sont pas des sources éditoriales.

## Anomalies vérifiées et corrigées

| Problème | Constat direct | Correction QA |
| --- | --- | --- |
| Workflow CI absent des branches `docs/carnets-*` | Workflow `.github/workflows/ci.yml` ne couvre que `main`, `feat/**`, `fix/**`, `perf/**` | Workflow temporaire **`carnets-validation-once.yml`**, déclenché uniquement sur `docs/carnets-validation-20261022`. Aucun déploiement. |
| C06 prahok dimensions erronées | WebP réel `prahok-1600.webp` = **1600×2133** ; code annonçait **3000×4000** | Corrigé `imageWidth=1600`, `imageHeight=2133`. |
| C07 table dimensions erronées | WebP réel `v19-table-partage-desktop-1440.webp` = **1440×810** ; code annonçait **1440×960** | Corrigé `imageWidth=1440`, `imageHeight=810` ; variantes 800×450 et 1200×675 contrôlées. |
| C02 poivre / C05 Kep : suggestions recettes dans Culture | Gabarit contient encore `relatedContent` lié aux recettes et ingrédients | **Suppression de tout le module et de ses imports pour les 7 Carnets**. Contrats modifiés pour l'interdire globalement. |
| C04 amok : lien pratique encore présent au navigateur | **Premier run GitHub #39767416153**, Chromium à 390 px : échec `Recipe/workshop link in cultural article: comprendre-amok` ; `GlossaryStrip` contenait `entry.href` vers fiches culinaires et des usages « en cuisine » | **Composant `GlossaryStrip` retiré du seul gabarit Culture**, données du glossaire et autres rubriques préservées. Tests C03/C04/C06/C07 mis à jour. |
| CI tests `on: push` non exécutés sur les PR `docs/*` | Runs inexistants sur les branches de rédaction historiques | QA indépendante sur la branche de validation, hors production, conservant traces GitHub. |

## Preuves réellement exécutées

### Premier run GitHub : [#39767416153](https://github.com/roro78/cuisine-cambodgienne/actions/runs/39767416153)

- Dépendances npm install : **PASS**.
- `npm run check` : **PASS**.
- `npm run test:editorial` (tests des sept Carnets et contrats de contenus) : **PASS**.
- `npm run test:recipes` : **PASS**.
- `npm run build` : **PASS**, **48 pages générées** dont `/culture/` et les 7 Carnets.
- Chromium mobile : **FAIL ciblé** au C04, lien recette encore exposé par le Glossaire express, cause analysée puis corrigée après le run. Le premier run **ne vaut donc PAS validation finale**.
- La nouvelle CI est configurée pour vérifier `/culture/`, les 7 sous-pages, les liens, les images décodées, l'absence de débordement horizontal aux tailles **390×844 et 1366×900**, et enregistrer quelques captures. Un nouveau run déclenché par les correctifs doit être **revu** pour connaître son état réel.

### Bloquants média non résolus

1. **Kep C05** : couverture Commons de Mx. Granger sous CC0, véritable marché de Kep ; actuellement **URL CDN Wikimedia distante**, pas de fichier WebP local. **BLOCAGE avant D3**. La photo montre des étals, pas des crabes ; légende précise.
2. **C03 kroeung** : couverture originale `kroeung-1600.webp` représentant un plat ; **aucune photo historique identifiée/licenciée** dans la branche. Ne pas recycler une photo de l'atelier en faisant croire à un document culturel.
3. **C06 prahok** : photo existante d'une assiette de prahok ktis, **pas** reportage des femmes productrices ni du Tonlé Sap. Média documentaire souhaitable.
4. **C07 table** : image `v19-table-partage-desktop-1440.webp` = **illustration éditoriale**, pas reportage de famille réelle. Alt et légende le précisent. Les dimensions sont maintenant exactes.
5. **C01 riz** : couverture Commons et trois images en galerie encore hébergées hors du dépôt ; vérifier **HTTP, licences, taille, stabilité et recadrage** avant publication.
6. **C04 amok** : photo Ben Yapp CC BY 2.0, sous forme de WebP local, source et éventuelle conversion/recadrage à recouper au dossier de licence.
7. Les images de l'ensemble des Carnets demandent une **réception visuelle et juridique**, même lorsque des crédits sont déjà présents.

## Prochaine décision D2 et réception D3

- Le pilotage M2 recommande quatre univers éditoriaux. **D2 n'est pas arbitré**, la quatrième catégorie « Fêtes et traditions » ne compte encore aucun Carnet exclusivement dédié : **ne pas fabriquer une page vide ou déplacer artificiellement des Carnets** pour faire croire à une taxonomie complète.
- **D3 : 0/7 textes finaux approuvés**. Les changements sur GitHub restent dans des branches non fusionnées. Une réussite de CI ne constitue **pas** une autorisation de publication.
- Ne fusionner ni PR #97–#106, ni la branche QA ; ne pas toucher à n8n, Meta, aux workflows d'ateliers ni aux articles historiques de recettes.

## Deuxième run : QA complète après correction — **PASS**

**Preuve :** [GitHub Actions #39767993049](https://github.com/roro78/cuisine-cambodgienne/actions/runs/39767993049), branche `docs/carnets-validation-20261022`, commit `347bd874bb9b840490b9a32f3db6928847c4df56`, **conclusion success**, vérifié le 22 octobre 2026.

| Étape réellement exécutée | Résultat |
| --- | --- |
| Installation dépendances Node 22 | **PASS** |
| Astro `npm run check` | **PASS** |
| `npm run test:editorial`, sept contrats Carnets inclus | **PASS** |
| `npm run test:recipes` | **PASS** |
| Build Astro (48 pages, dont 7 Carnets et index) | **PASS** |
| Chromium mobile **390 × 844** et ordinateur **1366 × 900** | **PASS** : index + 7 Carnets, 7 slugs, titres, chapitres, images principales décodées, pas de débordement horizontal, **aucun lien recette/atelier** dans les Carnets |
| Captures de prévisualisation | **Artifact créé** : `carnets-previsualisation-mobile-desktop`, taille environ **6,45 Mo**, expiration **25 octobre 2026** ([run](https://github.com/roro78/cuisine-cambodgienne/actions/runs/39767993049)) |

**Interprétation :** l'échec réel du premier run a été résolu et **la régression est couverte par le test navigateur**. Le fait que les photos externes chargent depuis le runner à cette date **ne remplace pas un import local, une garantie de disponibilité future, un contrôle juridique ou une réception artistique**. Même avec toute la CI PASS, D3 demeure **NON VALIDÉ**, aucune mise en ligne autorisée.

**PR de QA :** [#107](https://github.com/roro78/cuisine-cambodgienne/pull/107), empilée sur #106 et non fusionnée. Les modifications apportées après le commit validé par le run ci-dessus sont uniquement **documentaires** (ce compte rendu et la nouvelle entrée du plan), sans changement de code ni de tests ; garder la preuve du commit testé.

## J17 — Photo de Kep importée localement sur branche QA

- **Exécution unique réelle** : [GitHub Actions #39769038550](https://github.com/roro78/cuisine-cambodgienne/actions/runs/39769038550) **conclusion success** ; source JPG **1280×960**, `Kep Crab Market.jpg`, Mx. Granger (CC0 1.0), https://commons.wikimedia.org/wiki/File:Kep_Crab_Market.jpg.
- **Quatre WebP créés et réellement présents dans GitHub** : `kep-crab-market-480.webp`, `kep-crab-market-800.webp`, `kep-crab-market-1200.webp`, `kep-crab-market-1280.webp`, commit `eccd91f5d7262ebeb0324918e193a8473af558b7` sur la seule branche de QA.
- **Raccordement C05** : image principale `/images/cuisine/kep-crab-market-1280.webp` avec tailles `[480,800,1200,1280]`, photo sous auvents du marché de Kep ; légende n'affirme pas montrer des crabes. Ancien fichier de sacs de poivre et image sociale conservés avec leurs crédits ; workflows Meta/n8n inchangés.
- **Effet :** plus de dépendance à Wikimedia CDN pour le visuel principal de **C05** ; les autres photos Commons de C01 restent externes, photographie C03/C06 et droits/choix final D3 toujours ouverts.
- **Statut :** preuves GitHub vérifiées ; exécution finale Astro et Chromium sur ce nouveau commit **à lire avant toute réception technique de la version localisée**. Aucun merge ou déploiement.
