# Migration SEO / médias — six ateliers

> **SOURCE DE VÉRITÉ :** [Plan de pilotage et clôture des six ateliers](./PLAN-REFONTE-SIX-ATELIERS.md).  
> **Migration effective — 22 octobre 2026 : TERMINÉE, PUBLIÉE.** Les paragraphes de préparation conservés en annexe sont historiques et ne doivent pas guider une nouvelle publication.

## Migration effective — 22 octobre 2026

Le propriétaire a validé les six ateliers, leurs MP3 déjà écoutés et les visuels existants. Les pages ont été publiées en même temps : les six anciennes fiches ne sont plus les destinations principales, les redirections 301 et le sitemap sont générés par le build, les liens internes et le flux du catalogue social pointent vers les nouvelles URL.

- **PR #92** : migration atomique, SEO, six nouvelles fiches, six pistes audio approuvées, visuels existants, liens internes, génération du catalogue social.
- **PR #93** : corrections de quantités/durée ; mini-lecteur et navigation mobile.
- **PR #94** : suivi des grandes sections au rythme des chapitres MP3, avec arrêt du suivi au défilement manuel.
- **PR #95** : un clic de chapitre repositionne **l'audio et la page** sur l'étape correspondante, quel que soit l'état du suivi automatique.
- **Nettoyage médias dans le build OVH :** les 6 MP3 des anciennes fiches et 5 variantes V2 remplacées en sont exclus ; les 6 MP3 approuvés restent présents. Les sources historiques conservées dans Git ne sont **pas** supprimées.
- **Preuves techniques :** [CI 52/52 PASS](https://github.com/roro78/cuisine-cambodgienne/actions/runs/39671058506), [workflow OVH SUCCESS #39671732543](https://github.com/roro78/cuisine-cambodgienne/actions/runs/39671732543), source `b828d0a83b12a339ecc0cb174999a8f140896102`, branche construite `ovh-production` `44fc99b94586b14dbd31bfa6f2833c06a1a0928a`.
- **Preuve publique limitée :** HTML et lecteur servis sur les pages Lok Lak/Kroeung, HTTP 200. Le HEAD du répertoire SSH OVH et le comportement sur un appareil Android réel **n'ont pas été personnellement vérifiés**.
- **Non concerné :** aucun workflow n8n activé, aucune publication Meta déclenchée. Les anciennes entrées dans une éventuelle file PostgreSQL sont une question de suivi social **distincte**, pas une raison de rouvrir le SEO des ateliers.

### Correspondance historique des anciennes URL

| Ancienne URL | Destination de la 301 |
| --- | --- |
| `/apprendre/piler-aromates-au-mortier/` | `/apprendre/pratique/kroeung-jaune/` |
| `/apprendre/equilibrer-une-sauce/` | `/apprendre/pratique/samlor-machu-soupe-acidulee-guidee/` |
| `/apprendre/saisir-viande-poele/` | `/apprendre/pratique/lok-lak-de-la-poele-a-l-assiette/` |
| `/apprendre/fraicheur-herbes-agrumes/` | `/apprendre/pratique/num-banh-chok-sauce-et-herbes-fraiches/` |
| `/apprendre/bouillon-leger-savoureux/` | `/techniques/bouillon-leger-maison/` |
| `/apprendre/composer-repas-cambodgien/` | `/culture/construire-repas-cambodgien/` |

**Suivi non bloquant :** Search Console pour l'indexation, relecture de pertinence des destinations 301 seulement si les signaux de recherche justifient un changement, test d'usage Android quand possible. Les droits des illustrations ne sont pas qualifiés ici comme audités juridiquement. Aucune nouvelle publication ni suppression de source MP3 n'est déclenchée par ce document.

---

## Annexe — préparatifs avant publication (ARCHIVÉS)

Le contenu ci-dessous est conservé pour tracer les décisions de conception. Il évoque des fiches `draft`, une PR #92 en brouillon et des validations à venir : **ces indications sont caduques** et ne remplacent pas l'état « terminé et publié » du 22 octobre.

<details>
<summary>Afficher les notes historiques de migration</summary>

### Migration des six ateliers — préparation du 21 octobre 2026

Six fiches et six MP3 déjà approuvés à l'écoute ; pas de nouvelle synthèse audio.
La bascule éditoriale et SEO est **atomique** : les anciens ateliers restent
servis et référencés tant que les six nouvelles fiches sont en `draft`. Quand
les six guides passent légitimement en `release_ready` après validation des
photos et droits, essais culinaires, QA mobile/ordinateur et autorisation finale,
la navigation et les recettes affichent les nouvelles pages, le sitemap et les
sources sociales abandonnent les anciens slugs. Le build ne produit alors plus
les anciennes pages, et les six règles 301 deviennent actives dans le
`dist/.htaccess` généré. Le fichier source `public/.htaccess` est préservé.

## Mappage SEO avant publication
- `/apprendre/piler-aromates-au-mortier/` → `/apprendre/pratique/kroeung-jaune/`.
- `/apprendre/equilibrer-une-sauce/` → `/apprendre/pratique/samlor-machu-soupe-acidulee-guidee/` (équilibre acide/sucré, correspondance partielle à revoir).
- `/apprendre/saisir-viande-poele/` → `/apprendre/pratique/lok-lak-de-la-poele-a-l-assiette/`.
- `/apprendre/fraicheur-herbes-agrumes/` → `/apprendre/pratique/num-banh-chok-sauce-et-herbes-fraiches/`.
- `/apprendre/bouillon-leger-savoureux/` → `/techniques/bouillon-leger-maison/` (destination technique la plus proche).
- `/apprendre/composer-repas-cambodgien/` → `/culture/construire-repas-cambodgien/` (article dédié au même sujet, plutôt qu'une redirection générique).

## Contrats
- CI : `check-workshop-blueprints`, intégrité des MP3, contrôles visuels,
  build Astro, `build-workshop-redirects`, `prune-legacy-workshop-audio`,
  `check-seo-legacy-redirects`,
  `check-seo-sitemap-integrity`, `check-workshop-cutover`.
- Vérifier après publication OVH **autorisée** les six 301, les cibles
  200/canonical/indexables, le sitemap et les lecteurs mobiles.
- Catalogue n8n : le flux `social-feed.json` commute uniquement avec les pages ;
  les vieux brouillons PostgreSQL demandent une revue avant publication.
- Après bascule validée, le script retire uniquement les onze anciens MP3 du
  `dist` destiné à OVH, après contrôle des redirections et des références
  résiduelles dans les fichiers générés. Les fichiers source demeurent dans
  Git jusqu'à une suppression distincte après vérification de production.
- Ne supprimer aucun ancien MP3 source avant vérification des références dans tout le
  dépôt et dans l'hébergement ; aucune action de synthèse Coral / Meta / n8n.
- PR #92 reste en brouillon. Aucun merge, déclenchement OVH ou activation n8n
  au titre de cette préparation.

## Visuels approuvés et simulation de mise en ligne — 21 octobre 2026

Les six fiches pointent désormais vers les images déjà présentes dans le dépôt et approuvées par le propriétaire :
- kroeung-jaune : `/images/cuisine/v19-mortier-kroeung-1440.webp`
- lok-lak : `/images/cuisine/v19-lok-lak-1440.webp`
- samlor-machu : `/images/cuisine/v18-samlor-machu.webp`
- num-banh-chok : `/images/cuisine/v19-num-banh-chok-1440.webp`
- kuy-teav : `/images/cuisine/v18-kuy-teav.webp`
- bai-sach-chrouk : `/images/cuisine/v19-bai-sach-chrouk-1440.webp`

L'approbation des **visuels** est attestée (`imageValidated=true`). Elle ne constitue pas à elle seule une preuve juridique des droits (`rightsValidated=false`) ou une autorisation de mise en ligne (`productionApproved=false`). Ne présenter aucune illustration comme une photographie documentaire d'un essai culinaire effectué.

La CI utilise `scripts/simulate-six-workshop-release.mjs` pour **simuler de manière temporaire** les six statuts `release_ready`, vérifier une reconstruction complète, les 301, les nouvelles pages indexables et leurs MP3, la suppression des vieux médias du dossier construit et les six nouveaux liens sociaux. La simulation restaure strictement les guides et les fichiers `dist` initiaux dans tous les cas. Elle ne constitue **pas** une publication ou une validation humaine réelle.

### Correctifs de la simulation

Le test a révélé deux liens vers les anciens ateliers malgré leur disparition. Correction *dans les modèles de présentation*, sans toucher au contenu original des carnets : la page consacrée au riz propose les ateliers actuels ; la fiche technique du bouillon renvoie vers le nouvel atelier Kuy Teav. Le lot de nettoyage couvre désormais les **6 MP3 historiques + 5 V2 remplacés** dans le dossier OVH uniquement, jamais les six versions approuvées en source.

## Feu vert du propriétaire — 21 octobre 2026

Le propriétaire a explicitement validé la publication des six fiches, des six MP3 déjà écoutés et des visuels générés déjà sélectionnés. Il confirme que les recettes sont vérifiées à partir de sources fiables ; un essai à domicile n'est **pas** un prérequis éditorial. Les six guides sont placés en `release_ready` et `review.productionApproved=true` avec un bloc `releaseAuthorization` transparent.

Les indicateurs `recipeValidated`, `mobileValidated`, `desktopValidated` et `media.rightsValidated` non attestés ne sont **pas** artificiellement transformés en `true`. Les scripts de sécurité conservent leurs contrôles d'intégrité réels (SHA des MP3, durées, fichiers, URLs, phases, sources, canonical, 301, visuels). Cette décision de publication appartient au propriétaire ; elle ne prouve pas des tests qui n'ont pas été réalisés.

Les workflows n8n et la PR #89 restent hors périmètre. Aucun déclenchement Coral. Déploiement OVH séparé et volontaire.


</details>
