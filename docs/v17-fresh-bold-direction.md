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

## V17.3 — Le récit s'élargit (13 octobre 2026)

**Retour déterminant :** une belle page ne peut pas se limiter aux clichés existants, aux marchés et aux plats. Le site doit orchestrer **les ingrédients, leur transformation, le repas et les desserts** avec une progression visuelle : photographies, formes éditoriales, pictogrammes, transitions et mouvements du scroll.

### Nouveau storyboard de production

1. **Du goût / du Cambodge** : plat central avec un vrai piment détouré. Les éléments décoratifs réagissent légèrement au scroll.
2. **Sur les étals** : image de marché localisée avec prudence, poivre de Kampot, lien glossaire.
3. **Chaque ingrédient compte** : nouveau chapitre lumineux. Galanga en photo documentaire générique, dessin vectoriel de citronnelle et piment détouré **convergent visuellement** depuis la gauche, le haut et la droite vers la composition des parfums. L'affirmation reste générale : leurs clichés ne sont pas présentés comme pris au Cambodge.
4. **Couper / piler / sentir** : les trois consignes entrent alternativement depuis gauche/droite pendant le scroll, sans imiter une séquence photographique de gestes non disponible.
5. **À table** : photographie du repas réel et mouvement discret de cadrage.
6. **Place au sucré** : deux vrais desserts khmers, **Chek Ktis** (banane-coco, recette existante) et **Num Kom** (gâteaux de riz gluant dans des feuilles de bananier, présentés pour découverte, sans inventer de fiche recette). Leurs photos apparaissent depuis des côtés opposés, autour d'un pictogramme coco réalisé en SVG.
7. **À vous de jouer** : chemins directs vers les recettes et ateliers existants.

### Principes d'animation

- **GSAP ScrollTrigger lié au scroll** : ouverture des ingrédients depuis des directions différentes puis recentrage, progression des gestes par étape, arrivée des desserts en sens opposés.
- **Aucun pin, aucune interception du scroll, aucun autoplay de carrousel** : on suit les gestes du lecteur, pas un diaporama qui tourne sans contrôle.
- Au-dessous de 761 px et pour `prefers-reduced-motion`, **compositions statiques entièrement lisibles**. Idem sans JS. Les contenus restent dans le DOM avec de véritables balises `figure`, `figcaption`, titres et liens.
- Photos libres ou sous licence vérifiée et **illustrations originales SVG clairement décoratives**, sans confusion de provenance géographique.
- Respect des composants V16 : la maquette reste isolée sur `/v17-preview/`.

### Limitations restantes

- Cette étape est une **première chorégraphie réelle**, pas encore une expérience de marque visuellement terminée. Les photographies sont historiquement hétérogènes et le mouvement ne remplace pas une vraie production de séquences de préparation et de cuisson.
- Aucune publication sans contrôle du rendu en navigateur, test des transform au scroll, photos chargées, mobile, reduced-motion, sans JS et revue artistique.
- Le profil de galanga est une photographie **générique de rhizome**, pas un reportage cambodgien ; le piment détouré est **CC0** ; la citronnelle est un **pictogramme**.
