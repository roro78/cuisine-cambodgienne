# V17.5 — Storyboard directeur : le récit vivant de Cuisine du Cambodge

**13 octobre 2026 — Prototype isolé — PR #45 (draft) — non déployé**

## Référence validée
- Maquette **1** retenue par le commanditaire : identité lumineuse, illustrations de produits et titres expressifs.
- À corriger : répétition du placement « titre à gauche / image à droite » et absence de vraie chorégraphie liée au scroll.
- Comparaisons d'ambition (non copiées) : Bucks Sauce, Hungry Tiger, Crav Burgers.
- Les maquettes générées sont **conceptuelles** : elles ne constituent pas des photographies culinaires documentaires.

## Grammaire de scène — sept compositions réellement différentes

| Rôle | Traitement desktop | Traitement mobile | Animation et fonction |
| --- | --- | --- | --- |
| 00. **Le manifeste** | Typographie géante + photographie centrale du plat dans un décor simple ; `assiette` en italique comme signature | Plat centré sous le titre, CTA visible dès le premier écran si possible | Parallaxe très doux du plat et des feuilles ; première promesse immédiatement lisible |
| 01. **Le marché** | **Titre centré au-dessus d'une composition panoramique sombre**, photo large et détail vertical en contrepoint | Titre centré puis photo panoramique ; pas de cartes carrées | Masque photographique qui s'ouvre dans le sens du défilement |
| 02. **Les parfums** | **Composition radiale** avec texte central et trois ingrédients qui convergent | Les trois produits se succèdent en grille légère, sans position absolue | Entrées gauche / haut / droite, recentrage progressif (grand écran) |
| 03. **Les gestes** | **Triptyque horizontal 01/02/03** sous la photographie panoramique du kroeung | Grande photo puis liste verticale de trois gestes, sans faux reportage en images | Titres venant d'une direction différente, puis lecture des repères. Aucun nouvel échantillon visuel présenté comme une étape photographiée |
| 04. **Le repas** | **Photographie immersive pleine largeur, titre centré superposé**, puis bande CTA contrastée | Photo portrait au grand format et texte en surimpression lisible ; le CTA reste sous la photo | Progression légère du cadrage et révélation du titre au scroll |
| 05. **Les douceurs** | **Titre aligné à droite**, photographie Chek Ktis en panorama + Num Kom vertical, annotation façon carnet | Titre à droite, panorama horizontal et second portrait dans une composition asymétrique | Deux desserts entrent de côtés opposés, sans rotation Polaroïd |
| 06. **L'invitation** | **Grande phrase centrée** sur fond mangue ; recettes et atelier comme deux chemins clairs | Phrase centrée, accès empilés et larges | Entrée verticale discrète et CTA immédiatement fonctionnels |

### Transitions scénographiques
- Le marché passe aux parfums via un **petit connecteur typographique** (pas un bloc commercial), puis la préparation rejoint le repas grâce à un second raccord de narration.
- Le vert forêt du marché est un **contrepoint ponctuel** à l'ensemble majoritairement clair ; ne pas reconstituer un site sombre.
- Les variations reposent sur **la position des titres, les proportions, le rapport image/texte et les mouvements** ; pas sur une accumulation d'animations décoratives.
- Les photographies restent sous licences déclarées et correctement créditées, sans prétendre montrer une préparation du site.

### Principes techniques
- Astro statique ; GSAP et ScrollTrigger déjà présents ; aucun nouveau package.
- Respect de `prefers-reduced-motion`, lecture intacte sans JavaScript, zéro scroll hijacking, pas de `pin` obligatoire.
- Mobile : pas de longues sections sticky ; les titres ont une entrée discrète si l'utilisateur autorise le mouvement.
- QA sur 320, 360, 390, 768, 1440 px ; contrôle images/CTA, absence de débordement, non-régression V16.
- Maintenir `/v17-preview/` en `noindex`, absent de la navigation et du sitemap.

## Conditions de validation
1. Le lecteur doit identifier **sept silhouettes de mise en scène distinctes** à partir de captures de chaque scène.
2. Le titre **n'est plus automatiquement à gauche** : manifest central, marché centré, parfums radiaux, gestes en frise, repas en surimpression, desserts à droite, finale au centre.
3. Les scènes les plus immersives doivent montrer **une vraie image de cuisine cambodgienne** déjà documentée, pas une image IA déguisée en photographie.
4. Le motion design est évalué via un enregistrement réel du scroll, pas par le seul succès de la CI.
5. Revue créative du commanditaire **avant** tout merge et déploiement.

**Statut du présent lot : design + intégration sur branche de preview seulement, puis recette GitHub CI.**
