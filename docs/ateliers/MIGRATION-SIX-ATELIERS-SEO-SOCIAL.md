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
- `/apprendre/composer-repas-cambodgien/` → `/apprendre/` (correspondance générique potentiellement faible SEO à revoir).

## Contrats
- CI : `check-workshop-blueprints`, intégrité des MP3, contrôles visuels,
  build Astro, `build-workshop-redirects`, `check-seo-legacy-redirects`,
  `check-seo-sitemap-integrity`, `check-workshop-cutover`.
- Vérifier après publication OVH **autorisée** les six 301, les cibles
  200/canonical/indexables, le sitemap et les lecteurs mobiles.
- Catalogue n8n : le flux `social-feed.json` commute uniquement avec les pages ;
  les vieux brouillons PostgreSQL demandent une revue avant publication.
- Ne supprimer aucun ancien MP3 avant vérification des références dans tout le
  dépôt et dans l'hébergement ; aucune action de synthèse Coral / Meta / n8n.
- PR #92 reste en brouillon. Aucun merge, déclenchement OVH ou activation n8n
  au titre de cette préparation.
