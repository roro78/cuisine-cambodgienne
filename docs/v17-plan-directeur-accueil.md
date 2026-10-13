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
