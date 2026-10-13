# V17 — Fresh & Bold Cambodian Food
**Date :** 13 octobre 2026 · **Statut : prototype artistique en cours, non publié**

## Pourquoi cette rupture ?

La première direction V17-01 (serif Georgia, ivoire/vert sombre/terre cuite, alternance texte-photo) a été **rejetée artistiquement par le commanditaire**. Malgré les tests techniques PASS, le rendu ne répondait pas à l'objectif premium contemporain. Ce fichier devient la nouvelle direction de référence V17.

### Inspirations inspectées
- [Bucks Sauce](https://buckssauce.com/) : mise en scène ludique des ingrédients, emblème central, audace graphique et défilement animé.
- [Hungry Tiger](https://www.eathungrytiger.com/) : typographie massive sans-serif, sujet central, couleurs franches, transition d'une composition à l'autre.

**Pas de copie.** Cuisine du Cambodge n'est pas une marque de sauce : le service central reste de découvrir des plats et apprendre à les cuisiner. Le site doit rester rapide, utile et facilement navigable.

## Direction retenue — lumineuse et tonique

| Usage | Couleur |
| --- | --- |
| Base très claire | `#FFFDF7` |
| Noir typographique | `#181818` |
| Corail papaye | `#FF6339` |
| Jaune mangue | `#FFCF43` |
| Vert citronnelle | `#D9F16D` |
| Crème très claire pour les gestes | `#FFF3E4` |

- Titres **sans-serif massifs** plutôt que Georgia.
- Une **composition centrale** au-dessus du pli, avec photographie du plat dans un cercle accompagné d'illustrations vectorielles décoratives réalisées dans le code.
- Des scènes différenciées : ingrédients sur vert citronnelle, gestes sur crème, repas sur corail, choix de recette sur blanc.
- Les dessins de feuille et de piment **ne sont pas** des photographies.
- Les clichés Wikimedia/V16 sont des **documents sur des plats et produits** ; ils ne doivent pas être présentés comme des recettes testées par le site ou comme des photos faites spécialement pour V17.

## Storyboard de la maquette /v17-preview/

| Scène | Composition | Rôle et lien direct |
| --- | --- | --- |
| Accueil | « DU GOÛT. DU CAMBODGE. » en sans-serif noir/corail ; Amok central, grand cercle jaune, accents illustrés | Accéder immédiatement aux recettes et aux ateliers |
| Ingrédients | Grand « TOUT PART DES BONS PRODUITS. » ; collage photographique, vert citronnelle | Glossaire + carnet de Kep (sans affirmer que la photo a été prise à Kep) |
| Gestes | « COUPER. PILER. SENTIR. » ; carte des trois observations + photographie authentique d'une pâte terminée | Atelier de préparation des aromates |
| À table | Orange papaye, photographie d'un assortiment servi au restaurant à Phnom Penh | Carnet « comprendre le repas » |
| Cuisiner | Titres immenses + deux tuiles jaune/vert vers Amok et atelier | Démarrer une recette sans friction |

## Comportements
- Révélations progressives avec GSAP sans masquer le contenu nécessaire.
- Flottement léger des illustrations **seulement sur grand écran et sans réduction du mouvement**.
- Aucun défilement bloqué, `pin` ou lissage imposé.
- Le responsive est conçu comme une nouvelle composition verticale, pas comme une réduction mécanique du desktop.
- Navigation du site V16 réutilisée fonctionnellement, avec une présentation expérimentale propre à cette page.
- Route `/v17-preview/` **noindex**, absente de la navigation et du sitemap.

## Gates qualité
1. Compilation Astro/TypeScript et tests existants V16.
2. Screenshots **du vrai build** en 1440 et 390 px, plus contrôles 320, 360 et 768 px.
3. Liens, menu mobile + Escape, absence de débordement, photographies chargées.
4. Mode réduit et parcours sans JavaScript.
5. Inspection humaine de composition/cadrage ; correction si aspect dépassé, illustrations parasites ou insuffisamment gourmand.
6. Revue de code indépendante avant toute promotion vers l'accueil réel.
7. Mesures de performance mobile et revue accessibilité approfondie avant tout merge.

## Aucune diffusion de cette maquette
La PR #45 reste **draft** : ni `main`, ni `ovh-production`, ni GitHub Actions de publication manuelle ne doivent être modifiés/déclenchés. Les fonctionnalités V16 (recettes, portions, ateliers, glossaire, culture, Grand Dîner, admins) sont hors périmètre de cette maquette.

## Sources de photographies
Registre conservé et mis à jour dans [v17-sourcing-medias.md](./v17-sourcing-medias.md). Les quatre nouvelles prises de vue documentaires et la photographie V16 du poivre restent identifiées par leur provenance et leurs licences. Le besoin d'une campagne photographique culinaire homogène demeure **ouvert**.

## V17.2 — Photographies sans effet Polaroïd (13 octobre 2026)

Retour utilisateur : la direction **Fresh & Bold** est appréciée, mais les photographies inclinées et encadrées façon **Polaroïd** ne conviennent pas. Le traitement photo est donc corrigé **sans toucher à la palette ni à la typographie** :

- **Héros** : plat toujours central et rond, mais sans bordure noire, ombre dure ni rotation de la photographie. Le disque mangue est un décor plat derrière le plat, indépendant de la photo.
- **Ingrédients** : deux photographies en grille asymétrique, non superposées, sans tirage blanc, bordure ni ombre. Coins arrondis et légende en surimpression discrète.
- **Mortier** : photo du résultat final dans un visuel droit sans cadre, avec une légende clairement séparée. Badge décoratif conservé mais non assimilable à une photographie collée.
- **À table** : grande photo droite, sans contour ni ombre de Polaroïd, et marge mobile recalibrée pour protéger le texte suivant.
- **Mobile** : photographie de marché principale sur une rangée entière, secondaire dans une composition distincte ; pas d'empilement incliné.

**Contrat QA renforcé** : un test source interdit rotation, bordure épaisse et ombre des cadres photographiques, tandis que Chromium vérifie l'absence de bordure/rotation ainsi que de chevauchement des deux visuels du marché. L'identité Fresh & Bold, les licences, l'accessibilité et les interactions V16 restent inchangées.
