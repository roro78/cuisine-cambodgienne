# Migration des six ateliers — préparation du 21 octobre 2026

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
- Après bascule validée, le script retire uniquement les six anciens MP3 du
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

La CI utilise `scripts/simulate-six-workshop-release.mjs` pour **simuler de manière temporaire** les six statuts `release_ready`, vérifier une reconstruction complète, les 301, les PDF/MP3 indexables, la suppression des vieux médias du dossier construit et les six nouveaux liens sociaux. La simulation restaure strictement les guides et les fichiers `dist` initiaux dans tous les cas. Elle ne constitue **pas** une publication ou une validation humaine réelle.
