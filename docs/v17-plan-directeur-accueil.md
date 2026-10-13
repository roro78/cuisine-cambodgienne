# Cuisine du Cambodge — PLAN DIRECTEUR V17 : ACCUEIL VALIDÉ

**Statut : RÉFÉRENCE DE CONCEPTION VALIDÉE — IMPLÉMENTATION NON COMMENCÉE.**  
**Date de cadrage : 13 octobre 2026.**  
**Périmètre : nouvelle page d’accueil uniquement ; toutes les autres pages restent accessibles et fonctionnelles.**  
**Socle de départ : main, commit 2b7387bae6ef88e815befe44227bafc777e8fca2.**

> **RÈGLE ABSOLUE :** la dernière maquette visuelle approuvée par le commanditaire est la référence de composition, d'identité et de hiérarchie. Elle ne doit pas être remplacée par l’ancien prototype V17.6, par l’accueil V16 ou par de nouvelles maquettes non validées. En particulier, ne PAS recommencer à déplacer arbitrairement les titres ni changer les couleurs, l’illustration ou la composition générale.

## 0 — Référence visuelle et verrouillage de la direction artistique

- **Maquette canonique :** « voyage_culinaire_au_cambodge.png », dernière maquette desktop validée dans la conversation du projet Cuisine cambodgienne le 13/10/2026, après ajustements de la position des textes et CTA dans les quatre dernières sections.
- **Empreinte SHA-256 de la référence :** f775e6f3a483479f4a2d095406593d3d5dc354213b80d2a99839c6f23f4ddc71.
- **Dimensions du fichier de référence :** 974 × 1615 pixels. C’est une **planche composite**, pas une capture de site fonctionnel, ni une grille CSS à reproduire en hauteur fixe.
- **Conservation obligatoire :** joindre avant le développement le fichier PNG original au dossier de référence de la future branche d’implémentation sous docs/references/v17-accueil-maquette-validee.png ; contrôler son empreinte SHA-256 et enregistrer tout éventuel recadrage comme déclinaison (ne jamais écraser l’original). La version associée à cette discussion doit être sauvegardée comme livrable avec ce plan.
- **État GitHub :** PR #45 = ancien chantier expérimental V17, **draft**, non fusionné. Cette PR contient les prototypes artistiques rejetés ou incomplets ; **ne PAS développer à partir de ses CSS ni merger la PR en bloc**. La reconstruction doit repartir de main sur branche dédiée et PR distincte.
- **Ce que la maquette fixe :** univers culinaire lumineux et généreux, ivoire chaud + vert profond ponctuel + orange corail + jaune gourmand, typographie massive, motifs khmers stylisés et feuillages, illustrations originales, boutons arrondis jaunes, direction photographique immersive, séparateurs organiques, contrastes de rythme.
- **Ce que la maquette ne garantit pas :** exactitude documentaire de ses éléments générés, présence de ces photos libres de droits, fonctionnement mobile, performance, accessibilité, disponibilité commerciale ou exactitude des détails de recettes. Ce sont des tâches de production et des gates à vérifier.

### Principes non négociables

1. Ne plus changer la direction artistique validée sans une décision explicite ; les prochaines validations concernent **la fidélité d’intégration**, les vrais médias et les interactions.
2. **Aucune répétition systématique** titre à gauche / image à droite, ni sections toutes de même hauteur, ni carrés photographiques, ni effet Polaroïd répété.
3. **Respiration volontaire** : grandes masses photographiques, espaces négatifs, temps forts et transitions brèves, sans remplir chaque zone de stickers.
4. Les photographies utilisées sur le site réel doivent être authentiques, sourcées, utilisables selon leur licence et fidèles au plat/lieu décrit. La maquette générée est une **intention** ; ne pas présenter ses plats composites comme un reportage.
5. L’animation accompagne le récit ; **pas de scroll bloqué**, pas de vidéo autoplay obligatoire, pas de contenu masqué si JS absent ou si mouvement réduit.
6. **Navigation du site inchangée fonctionnellement**, sur desktop, mobile, footer et dans les pages existantes. Ni suppression ni renommage silencieux d’URL.
7. Une CI verte ne suffit pas : contrôle côte à côte des captures desktop/mobile avec la référence, recette UX et validation finale du commanditaire avant fusion/déploiement.

## 1 — L'architecture d'information reste intacte

Le dépôt existant est Astro 5, TypeScript, GSAP 3 et Playwright. Il comporte déjà une navigation centralisée dans src/components/SiteHeader.astro et un pied de page src/components/SiteFooter.astro. **Réutiliser ces deux composants ou leur proposer un habillage visuel compatible, sans dupliquer les menus ni modifier leurs destinations.**

### Navigation principale réellement présente dans main

| Emplacement existant | Libellé actuel | Destination exacte | Règle V17 |
| --- | --- | --- | --- |
| Logo | Accueil | / | Doit revenir à l’accueil depuis chaque page |
| Menu | Recettes | /recettes/ | Maintenir ; listing des 10 recettes |
| Menu | Glossaire | /glossaire/ | Maintenir, même si le visuel généré ne l'affiche pas explicitement |
| Menu | Ateliers | /apprendre/ | Maintenir ; listing des 6 ateliers |
| Menu | Carnets | /culture/ | Maintenir ; listing des 6 articles |
| Menu | À propos | /a-propos/ | Maintenir |
| Pied de page | Ingrédients | /ingredients/ | Maintenir ; 4 guides détaillés derrière le listing |
| Pied de page | Crédits photos | /credits-photos/ | Maintenir ; mettre à jour les crédits des nouveaux médias |
| Pied de page | Recettes, Culture, Apprendre, À propos, Glossaire | destinations ci-dessus | Tous préservés |

**Décision de correspondance maquette/menu :** la maquette illustre « Ingrédients » dans le header, alors que le menu public contient actuellement « Glossaire » ; **les deux rubriques existent**. Pour cette V17, préserver d’abord les cinq liens existants du header. Rendre /ingredients/ directement accessible depuis les scènes marché et produits, ainsi que le pied de page. Ajouter un sixième item « Ingrédients » au menu principal seulement après validation explicite de l’ergonomie et sans supprimer Glossaire. Ne pas remplacer /glossaire/ par /ingredients/ : ce sont deux destinations différentes.

### Conservation des listes et des pages détaillées

- **Recettes :** 10 slugs existants sous /recettes/[slug]/ : amok-trey, lok-lak, kroeung-jaune, bai-sach-chrouk, kuy-teav, num-banh-chok, num-pang, samlor-machu, prahok-ktis, chek-ktis. Le filtre, les portions ajustables et les étapes existantes restent opérationnels.
- **Ateliers :** 6 sous /apprendre/[slug]/ : piler-aromates-au-mortier, equilibrer-une-sauce, saisir-viande-poele, fraicheur-herbes-agrumes, bouillon-leger-savoureux, composer-repas-cambodgien.
- **Carnets :** 6 sous /culture/[slug]/ : poivre-de-kampot, comprendre-le-kroeung, comprendre-amok, kep-marche-crabe-poivre, prahok-fermentation-umami, construire-repas-cambodgien.
- **Guides ingrédients :** 4 sous /ingredients/[slug]/ : kroeung, poivre-de-kampot, tamarin, prahok ; le glossaire est une autre page autonome.
- **Pages complémentaires existantes :** /a-propos/, /credits-photos/, /404/, /experiences/ et les pages liées au Grand Dîner Khmer. Les pages /experiences/ sont actuellement en **préparation / noindex** et ne doivent pas devenir des offres commerciales publiques par inadvertance. Conserver leur accès et leur état éditorial actuels sans régression ; leur promotion dans la nouvelle homepage est hors périmètre de ce lot.
- **Sitemap :** conserver src/pages/sitemap.xml.ts et son inventaire actuel ; la prévisualisation V17 doit être noindex et absente du sitemap, tandis que / reste indexable à la livraison. Vérifier les canoniques/OG existants dans BaseLayout.

**Critère anti-page orpheline :** chaque listing garde ses liens vers tous les détails, chaque détail garde la navigation partagée, et les rubriques restent accessibles via header, footer et CTA de la home. Il n’est pas nécessaire d’empiler 26 liens détaillés sur l’accueil : les listing pages assurent cette découvrabilité.

## 2 — Storyboard figé de l'accueil (desktop)

Chaque scène a un rôle, une composition distincte, une intention de mouvement et un chemin utilisateur. Les proportions exactes seront dérivées en CSS fluide ; **ne pas recopier les pixels de la planche verticale comme des vh identiques**.

| # | Section validée | Mise en scène desktop | Hauteur / rythme relatif | CTA réel |
| --- | --- | --- | --- | --- |
| 0 | **« LE CAMBODGE DANS VOTRE ASSIETTE »** | Premier écran ivoire ; titre très puissant **à gauche**, grand Amok en composition libre **à droite**, aromates, feuilles, annotations manuscrites et sceau jaune. Photo dominante mais espace préservé ; vraie navigation. | **Ouverture ample** (proche hauteur écran utile, adaptable au contenu) | **Découvrir les recettes** → /recettes/ ; « Nos ateliers » du header → /apprendre/ |
| 1 | **« TOUT PART DES BONS PRODUITS »** | **Immense scène de marché** à gauche, bloc texte/CTA **à droite** sur vert forêt ; raccord organique avec scène précédente ; localisation géographique de la photo vérifiée. | **Transition panoramique plus courte**, pas une deuxième hero | **Explorer les ingrédients** → /ingredients/ ; lien complémentaire discret → /glossaire/ |
| 2 | **« UNE PALETTE D’INGRÉDIENTS D’EXCEPTION »** | **Texte et CTA au centre**, composition ouverte autour avec vraies prises de vue ou détourages de citronnelle, galanga, combava, piment, curcuma, poivre. Fond ivoire et beaucoup d’air. | **Pause éditoriale de respiration**, hauteur dictée par objets réels | **En savoir plus** → /glossaire/ ; liens contextuels vers /ingredients/kroeung/ et /ingredients/poivre-de-kampot/ |
| 3 | **« COUPER. PILER. SENTIR. »** | Photo vivante du mortier à gauche, texte **au centre-droit**, pictogrammes/consignes en trois étapes **tout à droite** ; annotation manuscrite discrète, cadrage authentique du geste. | **Moment pédagogique plus dense**, grille distincte | **Voir les étapes** → /apprendre/piler-aromates-au-mortier/ |
| 4 | **« DES PLATS QUI RASSEMBLENT »** | **Grand tableau photographique gourmand presque pleine largeur**, titres, description et CTA **centrés** sur zone protégée par dégradé lisible ; plats et repas authentiques ; aucune bande de cartes. | **Temps fort immersif**, plus ample que le marché | **Découvrir les recettes** → /recettes/ ; lien secondaire facultatif → /culture/construire-repas-cambodgien/ |
| 5 | **« DES DESSERTS TOUT EN FINESSE »** | Titre, texte et CTA **à gauche**, photographies culinaires de desserts au **centre / à droite**, contour organique, petits détails graphiques ; identification rigoureuse Chek Ktis / Num Kom. | **Moment plus léger et court**, sans carré ni répétition de composition | **Découvrir les desserts** → /recettes/ avec focus filtre dessert si mécanisme existant, sinon → /recettes/chek-ktis/ pour une vraie recette |
| 6 | **« CUISINEZ, PARTAGEZ, VOYAGEZ »** | **Finale immersive** inspirée de la maquette, paysage/silhouette d’Angkor sourcé avec droits vérifiés ; **titre et boutons centrés** ; zone visuelle volontairement sobre. | **Sortie émotionnelle** distincte ; pas de section identique aux autres | **Nos ateliers** → /apprendre/ ; **Toutes les recettes** → /recettes/ |

### Répartition des titres et CTA — validée et obligatoire

- Hero : **gauche**.
- Marché : **droite**.
- Aromates : **centre**.
- Gestes : **centre-droit**, les repères pédagogiques sur un axe indépendant.
- Repas : **centre en surimpression**.
- Desserts : **gauche**.
- Finale : **centre**.

**Interdit :** réaligner systématiquement les quatre dernières sections à gauche, ou remplacer toutes les scènes par « titre + image » inversé. Un seul contenu principal, des espaces négatifs et des intensités différentes.

### Rythme visuel et raccords

- Alterner **photographie spectaculaire → pause graphique → photographie de geste → tableau de repas → douceur → finale**, avec raccords organiques qui n’ajoutent pas 100vh artificiels.
- Découpes de transition (papier/feuillage/courbes) **subtiles et variées**, accessibles et découplées des médias.
- Le plat du hero reste le personnage principal ; les objets secondaires n’obstruent jamais le plat, titre, CTA ou navigation.
- Les éléments de marque (motifs, feuilles, annotations, tampons) sont des **éléments de soutien**, pas une décoration qui encombre chaque centimètre.
- Aucun carrousel automatique ni sliders génériques comme substitut à une direction artistique.

## 3 — Une vraie conception mobile, PAS une réduction du desktop

**Breakpoints de travail :** 320, 360, 390, 430, 768, 1024, 1440 et 1920 px ; supports tactiles et clavier. Les mobiles n'ont pas besoin de reproduire la disposition desktop exactement, mais doivent respecter la même hiérarchie visuelle et les mêmes liens.

| Scène | Mobile attendu et critères UX |
| --- | --- |
| Hero | Logo/menu accessibles ; titre lisible sans débordement ; plat immédiatement visible et gourmand ; CTA recettes dans le premier parcours sans écran vide ; ingrédients flottants limités à 1–2 accents pour ne pas couvrir le texte |
| Marché | Photo panoramique large, texte posé dans une zone contrastée **sans cadrage impossible** ; bouton entier, visible et cliquable ; pas de long stickiness |
| Palette | Des ingrédients répartis en composition asymétrique autour d'un titre central ; pas d’empilement de carrés ; annotations adaptées à la taille utile |
| Gestes | Photographie du geste puis trois repères courts, lisibles et cliquables ; passage direct vers l’atelier ; aucun chevauchement avec la photo |
| Repas | Grande photo immersive en format vertical/étendu ; surimpression du texte seulement si contraste mesuré, sinon bloc adjacent ; CTA accessible |
| Desserts | Un visuel dominant, second en contrepoint (sans photo carrée), textes naturels et lien vers un dessert existant |
| Finale | Titre centré, deux CTA larges et espacés, paysage au bon cadrage ; bouton non recouvert par les décorations |
| Navigation | Reprendre le vrai menu mobile existant : dialogue, fermeture Échap/bouton, focus restitué et non-piégeage du scroll |

**Pas de hauteur fixe obligatoire pour un bandeau mobile.** La scène doit s’adapter au texte réel, au zoom 200 %, aux petits écrans, à la taille des images et aux typographies disponibles.

## 4 — Inventaire de production visuelle et règles de droits

La maquette contient des **images générées**, des illustrations et un rendu composite. Elle sert de guide **artistique**, pas de bibliothèque de photos factuelles directement publiables.

| Besoin | Média final requis | Contrôle indispensable |
| --- | --- | --- |
| Hero Amok | Véritable photo nette d'Amok cambodgien, détourable ou exploitable en composition avec feuilles | Plat conforme à la légende ; source/auteur/licence ; cadrage desktop/mobile |
| Marché | Grande photographie de marché **cambodgien identifiable** | Lieu prouvé ; ne pas utiliser un marché d’un autre pays sous légende « Cambodge » |
| Palette | Photos ou détourages citronnelle, galanga, piment, combava, curcuma, poivre | Pour images génériques de produits, ne pas inventer leur provenance ; détourages propres ; pas de logos étrangers |
| Mortier | Photo réellement montrant un mortier/un geste de préparation, sans simulation documentaire | Cohérence entre photo et consignes ; si photo indisponible, renoncer à prétendre voir le geste |
| Repas partagé | Grande prise de vue gourmande et crédible d’une table/plusieurs plats cambodgiens | Pas de photomontage qui réétiquette des plats d'autres cuisines |
| Desserts | Chek Ktis vérifié et éventuellement Num Kom ; photos spécifiques | Photo distincte du plat présenté ; **Chek Ktis existe en recette**, Num Kom pas en recette actuelle |
| Finale | Paysage ou illustration d'Angkor, photocomposition autorisée, silhouettes décoratives originales | Droits et provenance ; éviter les visuels trompeurs |
| Identité | Dessins/motifs khmers, flèches et annotations typographiques, séparateurs | Créations SVG originales, réutilisables, cohérentes et légères |

**Livrable média préalable :** créer un manifeste d'assets (nom, origine, auteur, licence, URL source, crédit visible, taille, alt text, usage, statut juridique), versions WebP/AVIF si utiles, photos responsive, et crédits au pied de page. Les éléments non sourcés restent en **placeholder explicite**, jamais transformés en faux reportage.

**Ne pas utiliser de police propriétaire copiée depuis les sites d'inspiration.** Sélectionner des polices web légalement utilisables et capables d'obtenir les effets de titrage sans sacrifier la lisibilité.

## 5 — Architecture technique recommandée

1. **Nouvelle branche d'implémentation issue de main**, indépendante de feat/v17-01-art-direction-preview, qui contient les prototypes rejetés.
2. **Référence maquette archivée** dans docs/references avant la première scène intégrée ; empreinte de l’original vérifiée.
3. Implémenter une **prévisualisation isolée** /v17-accueil-preview/ avec BaseLayout, le véritable SiteHeader et le véritable SiteFooter ; noindex et absence du sitemap/menu public. Pas de nouveau chantier commercial ni de renommage de routes.
4. Décomposer le contenu en composants Astro clairement nommés : V17Hero, V17Marche, V17Palette, V17Gestes, V17Table, V17Desserts, V17Finale ; ajouter si nécessaire V17SceneDivider et V17Decor uniquement pour les raccords communs.
5. Une feuille de style principale dédiée à cette nouvelle direction, avec tokens et styles composants ; **ne PAS superposer home-v17-preview.css, home-v17-air.css ou autres couches historiques**.
6. Rassembler les **liens dans une configuration de navigation / données validées**, ou directement par section avec un test d’intégrité automatique ; ne pas reconstruire les 10 recettes ou les 6 ateliers en les dupliquant dans le composant homepage.
7. GSAP ScrollTrigger uniquement après validation de la géométrie statique desktop/mobile ; chorégraphier la transition **in/settle/out**, ingrédients latéraux, photos, respiration, éléments graphiques, en respectant la hauteur variable.
8. Construire **sans dépendre de GSAP** : aucun texte, image informative ou lien indispensable ne doit rester invisible en cas d’erreur JS ou mouvement réduit.
9. Après réception de la preview, **remplacer uniquement** le contenu de src/pages/index.astro dans un lot contrôlé ; vérifier toujours l’ensemble des autres routes et conserver leurs composants.
10. Préserver le pipeline OVH existant, avec vérification du SHA de main, puis publication manuelle **après autorisation explicite** et recette publique.

### SEO / accessibilité / performance

- H1 unique, H2 par scène, landmarks main/header/footer/nav et descriptions d’image exactes.
- Conserver les métadonnées du BaseLayout, les liens canoniques, les données structurées pertinentes et la logique du sitemap ; prévisualisation noindex.
- Focus visible, menu mobile utilisable au clavier, boutons tactiles d'au moins 44 × 44 px, contrastes AA vérifiés, zoom 200 % sans masquage de contenu, lecteurs d'écran sur parcours clé.
- Respect strict du réglage réduit : scène statique complète, aucune dépendance à une révélation forcée.
- Responsive images (picture/srcset/sizes) et dimensions définies ; images secondaires en lazy-load, hero optimisé en priorité ; éviter que les gros composites visuels dégradent le LCP.
- Objectifs qualité indicatifs **à mesurer**, non validés à ce jour : LCP ≤ 2,5 s, CLS ≤ 0,1, INP ≤ 200 ms ; Lighthouse mobile performance ≥ 90, accessibilité ≥ 95, SEO ≥ 95 ; pas de promesse de score avant audit réel.

## 6 — Plan de réalisation ordonné, dépendances et gates

| Lot | Intention / livrable | Dépendance | Définition de terminé |
| --- | --- | --- | --- |
| **D0 — Plan directeur** | Ce document, inventaire des routes, références, principes, contraintes | Aucun | Relu, lié depuis le plan consolidé ; aucune modification applicative |
| **D1 — Matrice visuelle + médias** | Maquette canonique archivée, manifeste d'assets et sourcing complet, fonts/illustrations autorisées | D0 | Tous les visuels identifiés, licences vérifiées ; déficits explicités |
| **D2 — Système visuel + squelette** | Tokens, typo, header/footer réutilisés, preview noindex, composants vides structurés, vraie navigation | D0, D1 partiel | 7 scènes différentes dès le wireframe, aucun retour vers les CSS #45 |
| **D3 — Hero + marché** | Fidélité premier écran et première transition desktop/mobile | D1, D2 | Captures comparées à la référence ; liens réellement cliquables |
| **D4 — Ingrédients + gestes** | Composition centrale + scène atelier authentique | D1, D3 | Deux silhouettes distinctes, aucun carré ni faux geste, accès glossaire/atelier |
| **D5 — Repas + desserts + finale** | Tableau immersif, photos de desserts, final centré et 2 CTA | D1, D4 | Six derniers CTA réels, diversité des hauteurs/positions |
| **D6 — Chorégraphie** | Transitions de scènes, parallax mesuré, entrées/recentrages, SVG légers | D3–D5 visuellement validés | Vidéo de scroll Chrome desktop, mobile sans scroll hijacking, réduction du mouvement |
| **D7 — Réception complète** | Tests régression, UX, a11y, responsive, SEO/perf, sourcing et relecture | D2–D6 | CI PASS **et** capture desktop/mobile validées par le commanditaire |
| **D8 — Publication contrôlée** | Remplacement de / uniquement, revue finale, merge puis publication OVH autorisée | D7 + accord explicite | main/OVH vérifiés, pages existantes vérifiées, retour arrière prêt |

**Ordre impératif : D0 → D1 → D2 → D3 → D4 → D5 → D6 → D7 → D8.** Si les médias sont incomplets, on peut développer une composition statique avec placeholders identifiés, mais **pas** déclarer la scène photographiquement validée.

### Détail des recettes automatisées à préparer

- **SiteHeader** : logo Accueil, Recettes, Glossaire, Ateliers, Carnets, À propos ; comportement identique desktop/mobile.
- **SiteFooter** : Recettes, Ingrédients, Culture, Apprendre, À propos, Glossaire, Crédits photos.
- **Accueil V17** : vérifier tous les liens du tableau du storyboard en HTTP 200 ; aucun chemin inventé.
- **Listing et détails** : vérifier les 10 routes de recettes, les 6 ateliers, les 6 carnets et les 4 guides ingrédients (plus glossaire, culture, À propos, crédits).
- **Recettes** : filtres, quantités ajustables, listes de courses/étapes et éventuel balisage schema ne doivent pas régresser.
- **Ateliers** : conserver les parcours pédagogiques indépendants des recettes et leurs contenus.
- **Expériences** : aucune mise en vente/activation ni changement de leur statut noindex ; pas de promesse commerciale nouvelle.
- **Responsive** : captures desktop 1440 et 1920 ; tablette 768 et 1024 ; mobiles 320/360/390/430 ; absence de débordement, chevauchements, boutons masqués ou sections de hauteur uniforme artificielle.
- **Visuel** : pour chacune des 7 sections, réaliser une capture, comparer avec la **maquette canonique**, noter les écarts et obtenir PASS esthétique ; ne pas confondre les variables CSS correctes avec une fidélité artistique réelle.
- **Motion** : vérifier rendu sans JS, reduced-motion, focus/keyboard, scroll au trackpad et tactile, et vidéo complète de la vraie preview.
- **Production** : ne pas merger et ne pas lancer GitHub Publish OVH avant approbation explicite ; fournir rollback vers le commit V16 stable.

## 7 — Gouvernance anti-régression et décisions

### Décisions closes

- Maquette finale mentionnée en section 0 **validée** comme univers de référence.
- Les quatre dernières scènes desktop ont des alignements variés : gestes centre-droit, repas centre, desserts gauche, finale centre.
- La homepage est le seul périmètre de refonte pour l'instant ; toutes les pages existantes et leurs fonctionnalités sont conservées.
- Aucune création d'URL de recette ou d'atelier fictive ; les CTA pointent vers des routes réellement existantes.
- Pas de réutilisation des CSS des prototypes #45 ni de fusion de la PR #45 en bloc.
- Pas de modifications de production sans accord.

### Questions non bloquantes à trancher pendant D1/D2

1. Le menu peut-il accueillir visuellement « Ingrédients » en **plus** des cinq entrées actuelles, sans sacrifier Glossaire et sans surcharger le mobile ? Par défaut **conserver les cinq liens actuels** ; les ingrédients sont accessibles par les sections et le footer.
2. Pour « Découvrir les desserts », utiliser la recette Chek Ktis directement ou créer un **vrai filtre dessert partageable** dans /recettes/ (ce serait alors un lot indépendant vérifié, non une URL fictive).
3. Les assets de la maquette sont des inspirations : quels clichés documentaires de même impact visuel seront retenus, quelles substitutions resteront annoncées comme telles ?
4. L’inspiration Angkor à la fin doit-elle être une photographie vérifiée ou une illustration originale ? Les deux peuvent respecter la maquette, sous réserve des droits et d’une validation de fidélité.

### Modalités de livraison et critères de refus

Chaque lot de code présente : commit/PR, différences visuelles desktop/mobile face à la référence, captures **réelles**, vidéo dès la phase motion, liste des URL touchées, QA exécutée, performances mesurées et limitations honnêtement reportées. Les problèmes de direction artistique, texte approximatif, faux visuel cambodgien, lien cassé, animation imposée, pages existantes cassées ou retour aux compositions répétitives **bloquent la promotion**.

**En une phrase : reproduire fidèlement la maquette validée, restaurer ses compositions et son rythme sur un vrai site Astro sans sacrifier la navigation, le contenu et les fonctionnalités V16.**


## 8 — JOURNAL D'AVANCEMENT (mise à jour à chaque lot)

> Les mentions PASS ci-dessous concernent **uniquement les livrables cités**, pas le produit final. Les blocages sont consignés et ne peuvent être masqués par une CI verte.

### 13 octobre 2026 — D0 puis D1

| Gate | Statut vérifié | Résultat / preuve | Suite |
| --- | --- | --- | --- |
| **D0 — Plan directeur** | **PASS — en revue, PR #46 draft** | Plan fondé sur la maquette retenue et sur les routes existantes ; historique des anciens prototypes isolé | Ne pas fusionner sans revue |
| **D1.1 — Maquette source** | **PASS LOCAL / ARCHIVAGE GITHUB OUVERT** | Original de 974×1615 contrôlé par SHA-256 `f775e6f3a483479f4a2d095406593d3d5dc354213b80d2a99839c6f23f4ddc71` ; archive téléchargeable fournie dans la conversation | Intégrer le vrai PNG original dans la future branche d'implémentation (le connecteur GitHub texte n'accepte pas ce transfert binaire depuis le conteneur). Ne pas annoncer « archivé sur GitHub » |
| **D1.2 — Inventaire des médias** | **PASS** | [Manifest médias V17](./v17-media-manifeste.md) : 8 familles V16, licences publiées et besoins scène par scène | Examiner candidats autorisés / nouvelles photos |
| **D1.3 — Médias finaux** | **PARTIAL — gate ouvert** | Manquent principalement vrai pilage au mortier, table cambodgienne, visuel final Angkor et harmonie des photographies | Acheter/produire/sourcer les médias sous licence avant la réception des scènes |
| **D2 — Squelette Astro** | **PASS TECHNIQUE / RÉCEPTION ARTISTIQUE OUVERTE** | [PR #47](https://github.com/roro78/cuisine-cambodgienne/pull/47) issue de main, 7 scènes, 7 largeurs, noJS, reduced motion ; [CI #38395986812](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38395986812) SUCCESS, vraies captures desktop/mobile | Refaire les médias et mesurer l'écart réel à la maquette ; pas de validation graphique implicite |
| **D3 — Héros/marché + D5 partiel, médias réels** | **PASS TECHNIQUE ; FIDÉLITÉ ARTISTIQUE EN ATTENTE** | [PR #47](https://github.com/roro78/cuisine-cambodgienne/pull/47), commit `0cfa7b8a51146347eb32d06305115d5d5d6db997`, [CI #38398110796 PASS](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38398110796), clichés Amok, marché, table, Chek Ktis, Num Kom et Angkor | Revue esthétique, licences finales, photo mortier et documentation des médias ; pas de merge |\n| **D4 et D6–D8** | **NON DÉMARRÉS / GATES OUVERTS** | Photo de pilage réelle, séquences GSAP, revue artistique, tests profonds et validation finale manquants | Avancer seulement après réception des prérequis |

**Règle d'autonomie :** avancer sur les sous-lots techniques isolés qui ne nécessitent pas d'inventer une photo documentaire ; ne jamais publier, merger la page ou annoncer une fidélité artistique complète pendant que les médias source ou la réception du commanditaire manquent.


### 13 octobre 2026 — Point de contrôle D2 : **PASS technique ; design à reprendre**

- Branche `feat/v17-accueil-reconstruction` créée **sur main**, pas sur l'ancienne PR #45 ; [PR #47 draft](https://github.com/roro78/cuisine-cambodgienne/pull/47).
- `src/pages/v17-accueil-preview.astro`, `src/styles/v17-accueil-rebuild.css`, contrat Node et test Chromium dédiés ; ajout dans **CI** uniquement (aucune modification du pipeline OVH).
- [Run #38395986812](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38395986812) **SUCCESS** avec scénarios 320, 360, 390, 430, 768, 1024, 1440 px ; noJS et reduced-motion ; menu mobile Échap ; liens de l'accueil et ancienne homepage intacts.
- **Revue réelle des captures** : premier squelette D2 encore trop éloigné de la maquette : photographies hétérogènes, mortier/desserts/finale trop simplifiés, photo de marché peu fidèle. Le gate de fidélité artistique est **FAIL/OUVERT**, même si la CI passe. Ces captures ne doivent pas être vendues comme une nouvelle proposition d'illustration validée.
- **Lot suivant** : récupération de photos authentiques/citées des anciens assets de #45 (sans code/styles) pour Amok, marché, assortiment à Phnom Penh, Chek Ktis et Num Kom ; aucune régression des autres pages.
- **Gates toujours ouverts** : maquette PNG original non encore commité dans GitHub ; photo authentique de mains au mortier ; photographie finale et campagne photo cohérente ; comparaison visuelle supervisée ; animations GSAP ; publication.

### 13 octobre 2026 — D3 : images authentiques reprises et nouvelle photo Angkor

- **Commit final vérifié :** `0cfa7b8a51146347eb32d06305115d5d5d6db997` sur la [PR #47](https://github.com/roro78/cuisine-cambodgienne/pull/47). Aucun composant ni fichier CSS historique de la PR #45 n'a été réutilisé. **Seuls des fichiers photo documentés ont été repris par leurs blobs**, sous réserve des vérifications de licence finales.
- Photos d'**Amok**, étal de fruits au Cambodge, **assortiment khmer à Phnom Penh**, **Chek Ktis**, **Num Kom**, galanga et piment détouré intégrées à la preview. Les auteurs, licences et sources Wikimedia sont lisibles dans l'aside de prévisualisation.
- **Angkor Wat** : nouvelle photographie authentique de Radek Kucharski prise en 2015 au coucher du soleil, depuis [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Angkor_Wat_Reflection_(46810498612).jpg) sous [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/), vignette 1600×900 (simple redimensionnement, affichage CSS recadré). Crédit visible dans la finale. La photo remplace le SVG de silhouette.
- **Défauts visualisés puis corrigés** : photographie du repas initialement cachée derrière un calque d'arrière-plan ; titre de cette scène trop grand sur mobile. Tests Playwright renforcés : ordre des calques et contrôle du débordement interne du titre.
- [**Run GitHub CI #38398110796 : SUCCESS**](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38398110796) : build Astro, tests anciens V16, contrat de la nouvelle page, Chromium 320/360/390/430/768/1024/1440, menu mobile/Escape, reduced motion et sans JavaScript. Captures `v17-accueil-d2-screenshots` de ce run inspectées sur **desktop et mobile** ; photo de table et d'Angkor désormais réellement visibles.
- **Gate créatif = ouvert :** la page réelle est encore moins élaborée que la maquette maître ; le mortier reste une illustration, les photos gourmandes ne sont pas homogènes, le logo et l'échelle de la typographie demandent une réception. **CI PASS ≠ validation de la maquette.**
- **À venir en autonomie :** sourcing autorisé d'une vraie séquence de geste, amélioration de la fidélité visuelle et tests médias (dont Safari/zoom) ; GSAP ne démarre qu'après stabilisation des compositions.
- **Intouchables** : main, ovh-production, page `/` actuellement V16, header/footer des autres pages et pipeline de publication manuelle. Aucun merge ni déploiement.



### 13 octobre 2026 — Reprise contrôlée de la PR #47, D6 et preuves D7

- **Situation contrôlée à la reprise :** PR [#47](https://github.com/roro78/cuisine-cambodgienne/pull/47) ouverte et draft, commit `1a56f6285fff351d1f01b68b96eb84a95c756750`, dont le parent est `4708fddf9e10e3fed5df7e60b66d76a35e04a7ef`. La [CI #38405432354](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38405432354) de ce HEAD est **SUCCESS**. Le nouveau fichier `src/scripts/v17AccueilMotion.ts` anime certaines images/illustrations avec GSAP ScrollTrigger ; ses séquences sont actuellement réservées aux écrans de plus de 760 px sans réduction du mouvement. **D6 = IMPLÉMENTATION TECHNIQUE PARTIELLE**, pas une réception visuelle du mouvement ni du mobile.
- **Preuves visualisées :** les captures GitHub Actions du commit `1a56f628`, dont le grand format 1440 px et le mobile 390 px, ont été récupérées et examinées. L'accueil présente les sept silhouettes distinctes attendues. La scène « Gestes » repose encore sur une illustration de mortier et une vraie photo de pâte préparée, non sur une photographie de mains en train de piler. **Aucune comparaison métrique fiable à la maquette approuvée n'est revendiquée** : l'original de 974 × 1615 px (SHA-256 `f775e6f3a483479f4a2d095406593d3d5dc354213b80d2a99839c6f23f4ddc71`) n'a pas pu être rouvert dans la session de reprise ni retrouvé dans le dépôt.
- **D7 — Complément de preuves commités, EN COURS DE CI :** [commit `94d84a0`](https://github.com/roro78/cuisine-cambodgienne/commit/94d84a0b0dae0a33b9aa00a5b3624169b1c84da5) ajoute la capture intégrale aux sept viewports et un enregistrement vidéo WebM **du navigateur réellement défilé** à 1440 et 390 px, sans capturer une animation synthétique ; [commit `2a8db18`](https://github.com/roro78/cuisine-cambodgienne/commit/2a8db18532bdc5c4c815082781ea51704bb77c2a) inclut les preuves `.png` et `.webm` dans les artifacts CI. [Run #38411567305](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38411567305) déclenché ; **résultat à consigner après exécution**, aucune nouvelle réussite anticipée.
- **Statut des gates :** D2 technique PASS antérieur ; D3–D5 fidélité artistique **NON RÉCEPTIONNÉE** ; D6 mouvement **PARTIEL / à visualiser** ; D7 QA **EN COURS** ; D8 **INTERDIT sans approbation**. Aucun merge, aucune modification de `main`, de V16, du pipeline OVH de publication ou de `ovh-production`.
- **Prochaine action utile :** obtenir l'original exact de la maquette (ne pas le redessiner de mémoire), examiner les nouvelles captures et vidéos produites sur le HEAD, puis chiffrer les différences de silhouettes, tailles et cadrages avant toute retouche artistique. Sourcer une photographie crédible du geste de pilage ; terminer les revues de licences, le contrôle mobile des animations et les audits accessibilité/performances avant D7 PASS.


### 13 octobre 2026 — Clôture du sous-lot preuves navigateur (D7.1)

- **PR #47 commit `83c477b6636c268f791e33dd4400b46b12ff41b8` ; [CI #38411926018 SUCCESS](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38411926018)**. La première tentative [#38411567305](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38411567305) avait échoué parce que l'encodeur FFmpeg Playwright manquait. Le [correctif `83c477b`](https://github.com/roro78/cuisine-cambodgienne/commit/83c477b6636c268f791e33dd4400b46b12ff41b8) installe uniquement ce binaire dans le job CI, sans modification du produit.
- **Evidence effectivement produite et téléchargée** : artifact GitHub `v17-accueil-d7-browser-evidence` (ID `11821492949`, expiration GitHub annoncée 20/10/2026). **Sept PNG réels** aux largeurs 320, 360, 390, 430, 768, 1024 et 1440 px. **Deux enregistrements WebM** de défilement de la page en Chrome aux viewports 390 × 844 et 1440 × 900, durées vérifiées **5,44 s et 7,60 s**. Les images initiales et finales extraites de chaque vidéo ont des pixels différents, confirmant que le viewport a défilé.
- **Tests exécutés sur CI :** `npm run check`, contrats de régression motion/recettes/éditorial/ateliers et parcours expériences, build Astro, contrat V17, Chrome responsive 7 largeurs, mode sans JavaScript, `prefers-reduced-motion` et menu mobile, toutes étapes terminées avec succès selon la CI. Les tests ne prouvent pas des critères non automatisés (performance mesurée, Safari, lecture d'écran, conformité exacte de la maquette ou licences finales).
- **Verdict : D7.1 PREUVES NAVIGATEUR = PASS TECHNIQUE ; D7 GLOBAL = OUVERT.** La vidéo du scroll n'est pas une comparaison avec l'original du design et ne constitue **aucune validation artistique**. La maquette PNG reste à rendre accessible pour analyse image/image, en conservant l'empreinte `f775e6f3a483479f4a2d095406593d3d5dc354213b80d2a99839c6f23f4ddc71`.
- **Suite prioritaire :** réception du PNG source exact, comparaison minutieuse sections desktop/mobile, correction de la seule PR #47 suivant écarts documentés ; source fiable de mortier en situation, QA motion sur mobile, audit a11y/perf/SEO et crédits. Aucun merge ni déploiement.


### 13 octobre 2026 — Contrôle comparatif avec la planche transmise à nouveau

- **Référence reçue dans la nouvelle conversation :** image nommée `2399.png`, **octets JPEG**, dimensions **926 × 1536 px**, SHA-256 `fbe345f9984f3ba06bab438202de5afcadec37e0eca9608c0ebdc5be2a3316ff`. Cette image constitue une **copie visuelle exploitable de la maquette**, mais elle n'est **pas** l'original PNG 974 × 1615 px au SHA-256 `f775e6f3a483479f4a2d095406593d3d5dc354213b80d2a99839c6f23f4ddc71`. Ne pas enregistrer cette copie comme l'original. Ne pas déclarer la comparaison pixel-à-pixel canonique validée.
- **Écarts constatés sur la capture Chrome 1440 px du HEAD `83c477b` :** hero bien structuré mais plat trop petit et photographie moins expressive que la planche ; marché = étal de fruits photographié plutôt que la grande scène de marché en mouvement ; aromates trop peu présents autour du titre ; mortier = illustration/texture préparée, non véritable geste ; tablée sombre/moins gourmande ; desserts = deux petites photos séparées ; finale Angkor réelle mais ciel diurne et atmosphère très différente du coucher de soleil de la maquette. **Ce sont des constats de comparaison, pas une direction artistique réinventée.**
- **Lot CSS ciblé PR #47 :** [commit `fac99b4`](https://github.com/roro78/cuisine-cambodgienne/commit/fac99b45a8c720db1998e721b7e50b113f337336) : composition et ampleur du plat hero, meilleure occupation périphérique des aromates, mortier mieux mis en scène (toujours illustré), amélioration de l'exposition/contraste du repas, dessert principal dominant et second en contrepoint. Aucune photo remplacée sans provenance vérifiée ; aucun changement de direction, route, menu ou production.
- **Défaut détecté par le test** : [CI #38415971253](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38415971253) **FAIL** sur le débordement du H1 hero à 1440 px (`scrollWidth=616`, `clientWidth=572`). **Correctif apporté** par [`de50bc8`](https://github.com/roro78/cuisine-cambodgienne/commit/de50bc8a2aa5b43f4554f8fe21d6a97b1078dd04), réduction de la seule taille de titre dans la tranche desktop >1100 px.
- **CI de contrôle du correctif :** [#38416298228](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38416298228), état **à confirmer avant PASS**. Nouvelle capture visuelle à relire avant toute qualification d'amélioration finale.
- **Réception artistique : TOUJOURS OUVERTE.** Les photographies de marché, mortier, repas, dessert et coucher de soleil sont des questions de sourcing/accord documentaire et de qualité artistique non closes ; aucune photo de la planche composite ne peut être présentée comme photographie documentaire vérifiée.
- **Prochaine étape :** vérifier les nouveaux PNG CI desktop/mobile et les deux captures de scroll ; juger les gains/régressions de composition puis poursuivre le sourcing légal et les corrections limitées. Aucun merge, aucune production V16 modifiée.


### 13 octobre 2026 — Clôture technique du premier lot après réception de la copie JPEG

- **Périmètre réellement modifié :** `src/styles/v17-accueil-rebuild.css`, `src/pages/v17-accueil-preview.astro`, `tests/v17-accueil-browser-smoke.mjs` sur la branche `feat/v17-accueil-reconstruction`, PR #47 uniquement. Aucune modification de `src/pages/index.astro`, de `main`, de V16 ni d'OVH.
- **Correction de proportions [`fac99b4`](https://github.com/roro78/cuisine-cambodgienne/commit/fac99b45a8c720db1998e721b7e50b113f337336) :** plat héro plus ample, ingrédients repositionnés, photo et illustration du geste mieux distribuées sans prétendre montrer le pilage, contraste du repas moins écrasant, dessert principal mieux mis en scène. **Une retouche de proportion ne remplace pas la photothèque manquante et ne vaut pas réception artistique.**
- **Bugs réels détectés et corrigés :** titre héro débordant à 1440 ([CI #38415971253 FAIL](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38415971253), correctif `de50bc8`) ; titre touchant encore la photo d'environ 5,6 px, identifié par le nouveau garde-fou géométrique ([CI #38417961630 FAIL](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38417961630), correctif `9b7c0f7`) ; phrase en pied de hero couverte par la vague et par les illustrations, retirée comme doublon éditorial (`83f2280`).
- **Dernier HEAD vérifié :** [`9b7c0f7f490b5c47918807df0caea7ae88dfa377`](https://github.com/roro78/cuisine-cambodgienne/commit/9b7c0f7f490b5c47918807df0caea7ae88dfa377), [**CI #38418387837 SUCCESS**](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38418387837) : build, contrats de non-régression, Chromium 320/360/390/430/768/1024/1440, sans JS et reduced-motion, nouvelle assertion séparation du texte/plat PASS. Artifact `v17-accueil-d7-browser-evidence` (ID `11824354987`) téléchargé, sept PNG et deux vidéos réelles du scroll disponibles, conservation GitHub limitée.
- **Relecture réelle de l'ultime capture hero 1440 px :** photographie agrandie, titre désormais entièrement distinct, CTA lisible, phrase superflue disparue. La différence avec la maquette est encore forte : photo Amok non détourée, scène marché non immersive, illustrations d'ingrédients insuffisantes, geste de mortier non documenté, photos tablée/desserts et atmosphère Angkor à améliorer.
- **Gates :** lot de corrections géométriques **PASS TECHNIQUE** ; fidélité de la maquette **PARTIELLE / NON VALIDÉE** ; sourçage/licences **OUVERT** ; D6 animations mobiles **OUVERT** ; D7 complet et D8 **NON VALIDÉS**. La copie JPEG n'a toujours pas l'empreinte du PNG canonique.
- **Prochaine priorité :** photographie de mortier réellement contextualisée (droits et provenance), remplacement des photos les plus éloignées de la planche par des images réellement autorisées, enrichissement mesuré de la palette, puis comparaison nouvelle capture/maquette et mesures d'accessibilité/performances. **Aucun merge, aucune publication.**


### 13 octobre 2026 — Décision de réception — la maquette fait foi (priorité absolue)

**Décision explicite du commanditaire :** la prévisualisation actuelle **ne ressemble pas suffisamment à la maquette acceptée** ; elle est **REFUSÉE artistiquement**. Les tests CI déjà PASS prouvent seulement l'intégrité technique. Ne plus présenter une retouche ponctuelle CSS, une composition reconstruite approximativement ou des décorations comme une réception créative. Il ne faut pas demander une nouvelle direction artistique : la planche reçue dans la conversation le 13 octobre reste la référence approuvée.

**Diagnostic contrôlé :** comparaison entre la planche de référence (copie visuelle JPEG 926×1536 fournie par l'utilisateur) et une capture de la preview 1440 px issue des artifacts du commit `e868a106e421217eb8e2043f69fdf84b9d401a8e`. La page reste sensiblement moins dense en médias : plat principal en photographie de riz/Amok non détourée, étal de fruits au lieu de scène de marché animée, ingrédients trop peu nombreux, illustration de mortier plutôt que véritable geste, photo d'assortiment peu gourmande, dessert dans un bol bleu et Angkor sous une ambiance bleue au lieu de l'atmosphère rouge/orange de la planche. **D3–D5 = FAIL ARTISTIQUE / ouverts.**

**Lots techniques post-décision sur PR #47 :**
- `56f5c640` : repères manuscrits limités et sceau final intégré aux sept scènes, sans contenu indispensable masqué.
- `83a21b9d` : original SVG `public/images/brand/v17-spice-bowls.svg` (bols de poivre et curcuma ; dessin vectoriel, pas photo documentaire).
- `639c24bc` : composition hero en trois plans sur écran large, rythme des scènes maintenu distinct, mise en scène des ingrédients, gestes et finale.
- `b9149aa3` : extension du contrat de test pour les SVG, annotations et sceau.
- `e868a106` : correction du dimensionnement CSS du SVG pour éviter un zoom géant.
- [CI #38421607441](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38421607441) **SUCCESS** pour la structure responsive/noJS/reduced-motion/régression. Artifacts photographiques réels de test récupérés (captures 1440/390) ; **aucune fidélité artistique déduite de cette CI**.

**Réception visuelle des derniers ajustements : toujours REFUSÉE / non atteinte.** Ils peuvent améliorer quelques éléments de la composition, mais l'écart photographique principal demeure. Ne pas ajouter de dizaines de stickers pour cacher un défaut de sourcing ou un manque de vraies scènes culinaires.

**Conditions de poursuite prioritaires et bloquantes avant réception artistique :**
1. Rechercher, inspecter et acquérir **des photos authentiques autorisées** avec sujet/location vérifiables (marché vivant au Cambodge, mains au mortier documentées, tablée khmère, desserts crédibles, Angkor dans la bonne lumière). En l'absence d'une photo appropriée, conserver un placeholder reconnu, sans tromper.
2. Reconstituer la hiérarchie photographique du storyboard : Amok réellement dominant à droite, marché plein format, ingrédients autour du texte central, mortier illustrant le geste réel, tablée immersive, dessert gourmand dominant à droite, Angkor au coucher de soleil. Préserver les sept dispositions de texte/CTA et le contenu fonctionnel.
3. Comparer de nouvelles captures 1440/390/320 px à la maquette **scène par scène**, signaler chaque différence résiduelle ; ne pas utiliser un simple score CI comme verdict visuel.
4. Reprendre ensuite le mouvement GSAP et les contrôles D7 approfondis. Garder `/v17-accueil-preview/` noindex ; **ne pas merger, déployer, modifier la V16 ou appeler D8**.

**Important :** la copie JPEG partagée est visuellement suffisante pour guider les compositions ; le défaut d'archivage du PNG original est un problème documentaire distinct, **pas une raison de demander au commanditaire de choisir une nouvelle maquette**.


### 13 octobre 2026 — Exécution autonome des lots médias–motion

**Consigne exécutée :** réaliser les lots sans validation intermédiaire, mais conserver la réception esthétique de la maquette comme gate indépendant. Tous les changements applicatifs sont **sur la PR #47 draft, branche `feat/v17-accueil-reconstruction`**. Aucune fusion, aucune mise en ligne et aucun changement de `/index.astro` V16.

| Lot | Livrables réellement enregistrés | État de contrôle |
| --- | --- | --- |
| **L1 — Photos** | Import réplicable de quatre JPEG locaux via [Action #38424609626](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38424609626), commit `2fa0cdb3`. Marché de Phnom Penh, mortier avec mains (photo générique), repas photographié à Siem Reap, Angkor au crépuscule ; manifeste licences/auteurs mis à jour. | **Import PASS**, pertinence artistique incomplète, aucune fausse localisation du pilage |
| **L2 — Composition** | [`fc1c42cd`](https://github.com/roro78/cuisine-cambodgienne/commit/fc1c42cde358f9eed8578b6ae74d6b7db82294e0) : photos réellement reliées aux quatre scènes ; mortier vectoriel remplacé par une vraie photo de mains, pâte kroeung distincte ; deux photos de repas déclarées comme montage éditorial. | **Intégration committée**, réception artistique encore à faire |
| **L3 — Immersion / hauteur** | [`419d3103`](https://github.com/roro78/cuisine-cambodgienne/commit/419d310335a7cd4ed9513bc6efccfa976bcca854) : scènes principales entre ~89svh et ~100svh sur desktop large, hauteurs MINIMALES (jamais fixes), rythme différent, photo dominante par scène ; [`782d0fdc`](https://github.com/roro78/cuisine-cambodgienne/commit/782d0fdc1155007108b7972df42c51e1e8491941) préserve la grandeur des desserts sur mobile. | **Code committé**, géométrie/scroll à confirmer par screenshot et tests réels |
| **L4 — GSAP** | [`8b293e28`](https://github.com/roro78/cuisine-cambodgienne/commit/8b293e28cad81a0bc67ad6bac324c98ac6b06e4f) : parallax discret hero, marché, mortier, tablée et finale, ingrédients depuis plusieurs directions, version mobile sans pin ni hijacking, `prefers-reduced-motion` respecté. [`a0f7626b`](https://github.com/roro78/cuisine-cambodgienne/commit/a0f7626bd25f1d326bad528f4c00fc532f912827) simplifie le paramétrage. | **Code committé**, rendu motion à relire sur vidéos |
| **L5 — Tests/revue** | [`a7070f89`](https://github.com/roro78/cuisine-cambodgienne/commit/a7070f8955d69b9d0329df5c8706f3d13b76158c) : garde-fous quatre médias existants, crédits et geste non documenté comme cambodgien. Échec [CI #38425640916](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38425640916) dû à une ancienne assertion sur le texte de la table, corrigée par [`77ff6e29`](https://github.com/roro78/cuisine-cambodgienne/commit/77ff6e292bf2cb479aed88172e0d06604a5f8e20). | **CI #38425910680 à recevoir** : PASS non anticipé |

**Règles de réception et suites :** attendre la CI sur le HEAD ; télécharger les sept captures et les deux vidéos réelles de scroll ; comparer séparément desktop et mobile à la maquette fournie, en noter les défauts. Vérifier la cohérence des crédits (Pexels, CC BY et CC BY-SA), les CTA réels, WCAG/contrastes, performance et toutes les routes V16. **Le retour exact de la photographie composite n'est pas encore prouvé** : les quatre nouveaux clichés sont réels et légalement sourcés, mais ne sont pas nécessairement les photos sources de la maquette. Ne pas confondre cohérence visuelle améliorée et approbation définitive du commanditaire.

**Aucune approbation finale sollicitée pour fusion ou production**, ces étapes restent hors périmètre.
