# Cuisine du Cambodge — Plan d'assainissement des PR ouvertes

> **Référentiel d'intégration — 22 octobre 2026.** Audit GitHub en lecture de `roro78/cuisine-cambodgienne`, **21 PR ouvertes** au moment de cet inventaire. Ce fichier est consigné sur la branche actuelle de [PR #108](https://github.com/roro78/cuisine-cambodgienne/pull/108) pour **ne pas créer une nouvelle PR de plan**. Il ne modifie ni `main`, ni `ovh-production`, ni n8n et **n'autorise aucune fusion, publication ou fermeture automatique**.
>
> **Sens des termes** : « CI PASS » = exécution historique réussie *sur la branche indiquée*, pas autorisation de publication ni garantie de compatibilité avec le `main` courant. « Fusionnable » selon GitHub ≠ approuvé. Les décisions de fermeture/archivage ci-dessous sont des **recommandations**, pas des actions déjà effectuées.

## 1. Instantané vérifié

- Branche `main` : `d231b1ac44dfcb8a9db54208bccd3d24847326d6`, CI GitHub `success` du 22/10/2026. Dernières PR Ateliers fusionnées : #90–#96, à la suite de #74 et autres livraisons audio/UI.
- Branche `ovh-production` : `44fc99b94586b14dbd31bfa6f2833c06a1a0928a`, **branche de site statique généré**, pas une branche à fusionner vers `main`. Les historiques divergent (comparaison GitHub : `main` 460 commits en avance, 62 en retard par rapport à `ovh-production`), cohérent avec la publication d'artefacts. **Ne pas utiliser `git merge ovh-production`**.
- Workflow de publication existant dans `main` : `.github/workflows/deploy-ovh.yml`, intitulé **« Publish OVH static branch »** ; uniquement `workflow_dispatch` sur `main` avec `expected_source_sha` exact de 40 caractères, puis tests, build et publication de `dist` sur `ovh-production`. Une PR fusionnée n'est **pas** automatiquement publiée.
- **21 PR ouvertes** : 12 Carnets (#97–#108), 5 Ateliers/Voix (#57, #63, #67, #87, #88), 2 Social/n8n (#83, #89), 1 Accueil (#46), 1 Hébergement (#50).
- Conflits Git vérifiés avec l'état courant : **#57, #67, #89** = `mergeable_state=dirty`; #83, #87, #88, #46, #50 et #108 = fusionnables pour leur **base actuelle**, sous réserve d'examen. Les 12 Carnets ne ciblent **pas** tous `main`.
- Les branches d'origine des vieilles PR ont été créées avant les fusions récentes ; **ne jamais réappliquer une vieille interface audio en écrasant la version mobile actuelle**.

## 2. Inventaire complet, une décision par PR

| PR | Domaine et fonction | Diagnostic actuel | Proposition | Priorité |
| --- | --- | --- | --- | --- |
| [#46](https://github.com/roro78/cuisine-cambodgienne/pull/46) | V17, plan directeur et manifeste médias **documentation uniquement** | Draft ancien du 13/10 ; indique 6 Carnets et 10 recettes, inventaire devenu obsolète ; des éléments V17 ont été fusionnés séparément ; pas de CI sur branche | **Archiver le plan historique, réutiliser seulement les orientations encore valides, puis clôturer si redondant**. Ne pas fusionner un statut obsolète en bloc | P4 |
| [#50](https://github.com/roro78/cuisine-cambodgienne/pull/50) | Déploiement OVH **SSH distant** préflight/deploy | Draft du 16/10 ; secrets et racine SSH non réceptionnés ; **workflow actuel de publication statique existe déjà** dans main | **Garder isolé / envisager clôture** si synchronisation SSH non nécessaire ; n'introduire jamais deux canaux de publication concurrents sans revue DevOps | P4 |
| [#57](https://github.com/roro78/cuisine-cambodgienne/pull/57) | Ancien prototype lecteur MP3, TTS et pack image mortier | **Conflits Git** ; MP3 et UI ont été remplacés/modernisés par de nombreuses PR fusionnées ensuite ; sources de médias pilotes non reçues dans cette PR | **Ne pas merger** ; comparer toute innovation réellement absente de main puis **clôturer comme remplacée** | P4 |
| [#63](https://github.com/roro78/cuisine-cambodgienne/pull/63) | Essai voix standard OpenAI `shimmer` | Prototype technique isolé, pas de MP3 validé, ancien au regard des six MP3 Coral désormais approuvés ; ancienne CI PASS | **Clôturer comme prototype abandonné**, scripts conservés dans Git | P4 |
| [#67](https://github.com/roro78/cuisine-cambodgienne/pull/67) | Premier dock audio mobile fixe | **Conflits Git** ; le lecteur mobile, les panneaux/chapitres et le scroll ont été livrés par #74, #93, #94, #95 | **Ne pas merger** ; fermer comme remplacé après dernière comparaison des comportements | P4 |
| [#83](https://github.com/roro78/cuisine-cambodgienne/pull/83) | Ajout des **trois recettes historiques** dans le catalogue social sans image utilisable | 1 fichier `src/data/socialCatalog.ts`, **14 lignes**, CI PASS du 18/10, fusionnable ; `main` n'a pas encore `restoredRecipes` dans le catalogue | **Petit lot autonome à intégrer sur main**, après CI revalidée sur la tête de main. Aucun visuel et aucune publication automatique | **P1** |
| [#87](https://github.com/roro78/cuisine-cambodgienne/pull/87) | Renommage des six ateliers audio existants | Draft « titres fidèles », CI historique PASS ; les ateliers et MP3 sont devenus V2 par #90–#96, possibles titres déjà dépassés | **Comparer aux H1 et narrations actuellement publiées**, ne retenir que les retouches encore pertinentes, puis clôturer si supplanté | P4 |
| [#88](https://github.com/roro78/cuisine-cambodgienne/pull/88) | Atelier guidé de sauce au tamarin + nouvelle route + MP3 Coral | Draft, **CI PASS** 20/10 ; MP3 Coral **réellement présent sur la branche**, mais route absente de `main`. `noindex`, photo finale non réceptionnée, dégustation réelle et écoute/QA finales en attente | **Lot autonome Ateliers**, ne pas fusionner tant que recette, six phases, photo/droits, MP3 et UI ne sont pas réceptionnés ; revue avec référentiel #90–#96 | P3 |
| [#89](https://github.com/roro78/cuisine-cambodgienne/pull/89) | Conditions de **validation humaine Meta/n8n** | **Conflits Git**, CI historique PASS ; les exports 02/03 de `main` n'ont pas les trois contrôles `human_decision`, `approved_at`, `decided_at` présents dans #89 ; **ne démontre pas l'état de l'instance n8n réelle** | **Priorité sécurité** : auditer workflows runtime inactifs et base, porter le garde sur exports `main` à jour, tests hors ligne et vrais essais sans publication, puis seulement intégrer. Aucune activation / aucun envoi Meta sans visa | **P0** |
| [#97](https://github.com/roro78/cuisine-cambodgienne/pull/97) | Carnets : audit M1 et brief éditorial | **Base main** ; racine de l'empilement de 12 PR | **Absorber dans un unique lot Carnets**, pas de merge unitaire suivi d'un autre merge de branche | P2 |
| [#98](https://github.com/roro78/cuisine-cambodgienne/pull/98) | Correction **ex æquo 2025** Phka Rumduol / ST25 | Base #97 ; seule provoquerait encore une mention de sources contraire à la consigne | Inclure dans lot consolidé avec #99, jamais isolément | P2 |
| [#99](https://github.com/roro78/cuisine-cambodgienne/pull/99) | Supprimer les **bibliographies documentaires publiques** | Base #98 ; conserver les crédits des photos sous licence et les conseils de sécurité | Inclure dans lot consolidé, contrôler l'ensemble des pages | P2 |
| [#100](https://github.com/roro78/cuisine-cambodgienne/pull/100) | C02 Poivre de Kampot | Base #99 | Inclure la version finale | P2 |
| [#101](https://github.com/roro78/cuisine-cambodgienne/pull/101) | C05 Kep, marché et pêche | Base #100 ; première photo externe remplacée depuis par WebP locaux au lot #107 | Ne garder que version finale après QA | P2 |
| [#102](https://github.com/roro78/cuisine-cambodgienne/pull/102) | C03 Kroeung, mémoire culinaire | Base #101 ; l'ancien récit mortier a été remplacé ; image désormais remplacée par couverture illustrative dans #108 | Inclure uniquement la **dernière** version C03, pas l'ancien atelier déguisé | P2 |
| [#103](https://github.com/roro78/cuisine-cambodgienne/pull/103) | C04 Amok, approche historique | Base #102, pas une recette de cuisson | Inclure la version finale, vérifier droits Ben Yapp CC BY | P2 |
| [#104](https://github.com/roro78/cuisine-cambodgienne/pull/104) | C06 Prahok, patrimoine Tonlé Sap | Base #103 ; image remplacée par illustration dans #108 | Inclure version finale | P2 |
| [#105](https://github.com/roro78/cuisine-cambodgienne/pull/105) | C07 Repas partagé | Base #104 ; pas de guide menu-type | Inclure version finale, légende de l'illustration explicite | P2 |
| [#106](https://github.com/roro78/cuisine-cambodgienne/pull/106) | C01 Riz : patrimoine, concours, fêtes | Base #105 ; préserve 7 sections, 4 photos | Inclure version finale | P2 |
| [#107](https://github.com/roro78/cuisine-cambodgienne/pull/107) | QA transversale : mobiles, recettes, source visibility, photo Kep locale | Base #106 ; [run #39769654837](https://github.com/roro78/cuisine-cambodgienne/actions/runs/39769654837) PASS | Conserver les tests/réparations et médias dans un **lot consolidé** ; nettoyer workflows one-shot devenus inutiles | P2 |
| [#108](https://github.com/roro78/cuisine-cambodgienne/pull/108) | Huit WebP C03/C06, tests et réception finale sur Carnets | Base #107 ; [run #39819573638](https://github.com/roro78/cuisine-cambodgienne/actions/runs/39819573638) **PASS** sur commit de livraison ; 52 fichiers dans le diff global `main` ↔ branche finale, dont 12 WebP (Kep et C03/C06) et 4 workflows d'import ponctuel | **Utiliser la branche finale comme source de consolidation**, pas fusionner ces 12 PR en chaîne. Nettoyer workflows/importeurs temporaires avant PR de livraison vers `main`, puis CI/main, droits, validations D2/D3 | P2 |

**Remarque :** les 12 PR Carnets sont un **empilement technique** (`#97 main`, puis chacune basée sur la branche précédente jusqu'à `#108`). Merger #108 dans #107, puis #107 dans #106, etc., ne livre pas forcément le résultat sur `main` et crée des validations inutiles. Préparer une **seule proposition consolidée** sur la base du `main` actuel, contenant la version finale et les tests nécessaires, et archiver les PR intermédiaires **après** intégration et comparaison de contenu.

## 3. Ordre d'intégration sans régression

### P0 — Sécurité Meta/n8n, indépendamment du site

1. Relever l'état **réel** des trois workflows n8n (ID, révision, actif/inactif), droits PostgreSQL et champs de décision, **lecture seule** ; ne pas récupérer ni afficher de secrets.
2. Comparer exports actuels de `main`, branche #89 et workflows installés ; les exports de `main` **ne suffisent pas** à prouver le statut runtime.
3. Reprendre les préconditions *côté SQL* : `status='approved'`, `human_decision='approved'`, timestamps `approved_at` / `decided_at` présents ; pour IG, confirmation de `fb_state='published'`. Vérifier que les mises à jour de statut sont atomiques/idempotentes.
4. Tests unitaires et chemins refusés (non approuvé, refusé, approbation périmée, appel répété, conteneur incomplet), **dry-run uniquement**, aucune publication Meta.
5. Brancher la correction nettoyée sur `main` via un lot dédié, faire passer la CI, puis synchronisation explicite en n8n **seulement après autorisation**. Ne jamais activer les workflows automatiquement.
6. Clore #89 **une fois** les protections présentes à la fois dans le dépôt et sur l'instance réelle, pas sur la seule base de CI historique.

### P1 — Catalogue social #83, lot léger

1. Rebaser le diff **14 lignes / 1 fichier** sur le `main` courant.
2. Vérifier que les trois recettes restaurées entrent dans le catalogue avec `imageRole='none'`, et qu'aucun visuel fictif ni calendrier de publication ne sont générés.
3. Faire `npm run check`, `npm run test:editorial`, `npm run test:recipes`, tests catalogue social, `npm run build`, puis fusion manuelle sur `main` après revue.
4. **Aucune activation n8n ou publication Facebook/Instagram.**

### P2 — Consolider la pile Carnets #97–#108 en une livraison

1. Figer la tête finale validée de #108 et le `main` cible ; `compare(main, #108)` indique **130 commits en avance et 2 en retard**, soit une base décalée à réconcilier. Ne pas confondre `mergeable=true` face à sa base #107 avec une validation de merge dans `main`.
2. Préparer **une branche de livraison depuis `main` à jour**, en récupérant la version finale du code, des 12 WebP et des tests de #108 ; ne pas rejouer les anciens brouillons progressivement. Conserver les documents éditoriaux internes utiles.
3. **Éliminer avant la release** les quatre workflows d'import/QA exécutables uniquement pour les anciennes branches, ainsi que les scripts importateurs temporaires devenus inutiles, après preuve que les actifs finaux et tests sont bien présents. Cela évite de laisser de l'automatisation morte dans `main`.
4. Surveiller **`src/data/socialCatalog.ts`** : ce fichier est modifié par les Carnets et par #83 ; intégrer d'abord #83 ou réconcilier explicitement le diff pour garder le catalogue social intact.
5. Gate éditoriale : **aucune source documentaire affichée sur le site**, pas de doublon Recettes/Ateliers, sept slugs et redirections intacts, exactitude des affirmations sensibles, légendes honnêtes des scènes illustrées et conservation des crédits légaux des photos. **D2 quatre univers** non validé : ne pas créer artificiellement une rubrique vide « Fêtes et traditions ». **D3 réception des 7 articles, visuels, droits et autorisation de publication** non franchi.
6. Gate technique depuis `main` : `npm run check`, `npm run test:motion`, `npm run test:recipes`, `npm run test:editorial`, `node scripts/audit-photo-coverage.mjs`, tests audio/MP3 déjà obligatoires dans CI, `npm run build`, contrôle SEO/sitemap/redirections, Chromium **390×844 et 1366×900**, puis revue visuelle des sept pages.
7. **Une seule PR de livraison Carnets vers `main`**, revue du diff, aucun doublon et fusion seulement après visa. Marquer ensuite #97–#108 comme « intégrées par consolidation » et fermer **sans les fusionner séparément**, en liant la PR canonique.
8. La publication OVH sera une **décision indépendante** : prendre SHA complet du nouveau `main`, déclencher manuellement `Publish OVH static branch` avec ce SHA après accord, puis vérifier HTTP 200, images, pages, SEO et retour arrière.

### P3 — Atelier Tamarin #88 (lot produit distinct)

1. Préserver le **MP3 Coral effectivement généré** sur la branche #88 ; ne pas relancer TTS (risque coût/quota).
2. Comparer manifeste des six phases, narration, recette canonique et gabarit V2 fusionné (#90–#96).
3. Faire réceptionner **vraie recette**, photographie finale et droits, écoute complète du MP3 et défilement mobile, test accessibilité, puis CI/browsers.
4. Garder `noindex` et non publié tant que le produit n'est pas approuvé. **Pas de mix avec PR Carnets ou #89**.

### P4 — Assainir les PR historiques

- Après comparaison avec `main` : **clôturer comme remplacées** #57, #63, #67 ; statuer sur #87 (titres actuellement pertinents ou non), et archiver #46 si son plan n'est plus source de vérité.
- #50 : décider si l'usage SSH distant reste utile ; le système de publication `ovh-production` existe déjà. **Ne pas ajouter une seconde méthode de publication sans besoin validé**.
- Ne pas supprimer les branches ni réécrire leur historique pour « faire propre » ; la fermeture d'une PR conserve sa traçabilité.
- Ne jamais considérer une PR à CI PASS comme terminée si les gates de contenu/audio/photo ou production sont explicitement incomplètes.

## 4. Tableau de bord des portes de décision

| Lot | Tests techniques | Recette fonctionnelle / métier | Fusion `main` | OVH / n8n | Verdict |
| --- | --- | --- | --- | --- | --- |
| Social #83 | CI historique PASS, **à revalider sur main actuel** | Vérifier aucune photo utilisable → pas de publication | NON | workflows inchangés | **CANDIDAT RAPIDE** |
| Sécurité #89 | CI historique PASS, **conflits Git** | État runtime, guards SQL et chemins refusés non comparés | NON | **AUCUNE activation** | **P0 BLOQUÉ** |
| Carnets #97–#108 | Suite QA finale #108 PASS sur sa branche, **52 fichiers / 130 commits** à consolider | **7/7 préparés, 0/7 approuvés définitivement**, D2/D3/SEO encore ouverts | NON | **AUCUN déploiement OVH** | **PRÊT À CONSOLIDER, PAS À PUBLIER** |
| Tamarin #88 | CI dédiée historique PASS, MP3 existe dans la branche | Photo, dégustation, écoute finale et alignement V2 non approuvés | NON | `noindex`, aucun OVH | **DRAFT / BLOQUÉ MÉTIER** |
| Historique #46/#50/#57/#63/#67/#87 | Hétérogène, parfois CI ancien PASS | Obsolescence / remplacement à établir avant clôture | NON | Sans objet | **ARCHIVER / COMPARER** |

**Terminé** n'a qu'un sens : contrôles actuels PASS + validation métier + fusion dans `main` si autorisée + publication sur le canal prévu **si demandée** + vérification des URL visibles. Les états « brouillon » et « bloqué » doivent être maintenus tant que ces étapes manquent.

## 5. Actions d'organisation

- **Aucun nouveau chantier en parallèle** pendant la reprise. Un lot = une PR canonique à la fois ; pas de troisième branche qui empile des brouillons.
- Étiquettes recommandées après choix du pilote : `P0-security`, `P1-ready`, `P2-consolidate`, `P3-product-gate`, `superseded-review` et `no-deploy`. Aucune étiquette n'a été appliquée automatiquement lors de cet audit.
- Conserver **ce référentiel** et une ligne d'état par jalon. Ne fermer aucune PR encore utile avant avoir identifié sa version intégrée ou l'avoir explicitement abandonnée.
- Lors de la prochaine décision, commencer par **sécuriser #89**, puis intégrer #83 ; ouvrir ensuite le lot consolidé Carnets. Ne pas toucher aux exports n8n installés, au `main`, à OVH ou aux PR existantes sans visa d'exécution.

*Audit préparatoire terminé : inventaire des 21 PR, références et dates vérifiés via GitHub le 22/10/2026. Toutes les décisions ci-dessus restent proposées tant qu'une action correspondante n'a pas été expressément autorisée.*
