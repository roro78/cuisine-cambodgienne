# Cuisine du Cambodge ? PLAN DIRECTEUR V17 : ACCUEIL VALID?

**Statut : R?F?RENCE DE CONCEPTION VALID?E ? IMPL?MENTATION NON COMMENC?E.**  
**Date de cadrage : 13 octobre 2026.**  
**P?rim?tre : nouvelle page d?accueil uniquement ; toutes les autres pages restent accessibles et fonctionnelles.**  
**Socle de d?part : main, commit 2b7387bae6ef88e815befe44227bafc777e8fca2.**

> **R?GLE ABSOLUE :** la derni?re maquette visuelle approuv?e par le commanditaire est la r?f?rence de composition, d'identit? et de hi?rarchie. Elle ne doit pas ?tre remplac?e par l?ancien prototype V17.6, par l?accueil V16 ou par de nouvelles maquettes non valid?es. En particulier, ne PAS recommencer ? d?placer arbitrairement les titres ni changer les couleurs, l?illustration ou la composition g?n?rale.

## 0 ? R?f?rence visuelle et verrouillage de la direction artistique

- **Maquette canonique :** ? voyage_culinaire_au_cambodge.png ?, derni?re maquette desktop valid?e dans la conversation du projet Cuisine cambodgienne le 13/10/2026, apr?s ajustements de la position des textes et CTA dans les quatre derni?res sections.
- **Empreinte SHA-256 de la r?f?rence :** f775e6f3a483479f4a2d095406593d3d5dc354213b80d2a99839c6f23f4ddc71.
- **Dimensions du fichier de r?f?rence :** 974 ? 1615 pixels. C?est une **planche composite**, pas une capture de site fonctionnel, ni une grille CSS ? reproduire en hauteur fixe.
- **Conservation obligatoire :** joindre avant le d?veloppement le fichier PNG original au dossier de r?f?rence de la future branche d?impl?mentation sous docs/references/v17-accueil-maquette-validee.png ; contr?ler son empreinte SHA-256 et enregistrer tout ?ventuel recadrage comme d?clinaison (ne jamais ?craser l?original). La version associ?e ? cette discussion doit ?tre sauvegard?e comme livrable avec ce plan.
- **?tat GitHub :** PR #45 = ancien chantier exp?rimental V17, **draft**, non fusionn?. Cette PR contient les prototypes artistiques rejet?s ou incomplets ; **ne PAS d?velopper ? partir de ses CSS ni merger la PR en bloc**. La reconstruction doit repartir de main sur branche d?di?e et PR distincte.
- **Ce que la maquette fixe :** univers culinaire lumineux et g?n?reux, ivoire chaud + vert profond ponctuel + orange corail + jaune gourmand, typographie massive, motifs khmers stylis?s et feuillages, illustrations originales, boutons arrondis jaunes, direction photographique immersive, s?parateurs organiques, contrastes de rythme.
- **Ce que la maquette ne garantit pas :** exactitude documentaire de ses ?l?ments g?n?r?s, pr?sence de ces photos libres de droits, fonctionnement mobile, performance, accessibilit?, disponibilit? commerciale ou exactitude des d?tails de recettes. Ce sont des t?ches de production et des gates ? v?rifier.

### Principes non n?gociables

1. Ne plus changer la direction artistique valid?e sans une d?cision explicite ; les prochaines validations concernent **la fid?lit? d?int?gration**, les vrais m?dias et les interactions.
2. **Aucune r?p?tition syst?matique** titre ? gauche / image ? droite, ni sections toutes de m?me hauteur, ni carr?s photographiques, ni effet Polaro?d r?p?t?.
3. **Respiration volontaire** : grandes masses photographiques, espaces n?gatifs, temps forts et transitions br?ves, sans remplir chaque zone de stickers.
4. Les photographies utilis?es sur le site r?el doivent ?tre authentiques, sourc?es, utilisables selon leur licence et fid?les au plat/lieu d?crit. La maquette g?n?r?e est une **intention** ; ne pas pr?senter ses plats composites comme un reportage.
5. L?animation accompagne le r?cit ; **pas de scroll bloqu?**, pas de vid?o autoplay obligatoire, pas de contenu masqu? si JS absent ou si mouvement r?duit.
6. **Navigation du site inchang?e fonctionnellement**, sur desktop, mobile, footer et dans les pages existantes. Ni suppression ni renommage silencieux d?URL.
7. Une CI verte ne suffit pas : contr?le c?te ? c?te des captures desktop/mobile avec la r?f?rence, recette UX et validation finale du commanditaire avant fusion/d?ploiement.

## 1 ? L'architecture d'information reste intacte

Le d?p?t existant est Astro 5, TypeScript, GSAP 3 et Playwright. Il comporte d?j? une navigation centralis?e dans src/components/SiteHeader.astro et un pied de page src/components/SiteFooter.astro. **R?utiliser ces deux composants ou leur proposer un habillage visuel compatible, sans dupliquer les menus ni modifier leurs destinations.**

### Navigation principale r?ellement pr?sente dans main

| Emplacement existant | Libell? actuel | Destination exacte | R?gle V17 |
| --- | --- | --- | --- |
| Logo | Accueil | / | Doit revenir ? l?accueil depuis chaque page |
| Menu | Recettes | /recettes/ | Maintenir ; listing des 10 recettes |
| Menu | Glossaire | /glossaire/ | Maintenir, m?me si le visuel g?n?r? ne l'affiche pas explicitement |
| Menu | Ateliers | /apprendre/ | Maintenir ; listing des 6 ateliers |
| Menu | Carnets | /culture/ | Maintenir ; listing des 6 articles |
| Menu | ? propos | /a-propos/ | Maintenir |
| Pied de page | Ingr?dients | /ingredients/ | Maintenir ; 4 guides d?taill?s derri?re le listing |
| Pied de page | Cr?dits photos | /credits-photos/ | Maintenir ; mettre ? jour les cr?dits des nouveaux m?dias |
| Pied de page | Recettes, Culture, Apprendre, ? propos, Glossaire | destinations ci-dessus | Tous pr?serv?s |

**D?cision de correspondance maquette/menu :** la maquette illustre ? Ingr?dients ? dans le header, alors que le menu public contient actuellement ? Glossaire ? ; **les deux rubriques existent**. Pour cette V17, pr?server d?abord les cinq liens existants du header. Rendre /ingredients/ directement accessible depuis les sc?nes march? et produits, ainsi que le pied de page. Ajouter un sixi?me item ? Ingr?dients ? au menu principal seulement apr?s validation explicite de l?ergonomie et sans supprimer Glossaire. Ne pas remplacer /glossaire/ par /ingredients/ : ce sont deux destinations diff?rentes.

### Conservation des listes et des pages d?taill?es

- **Recettes :** 10 slugs existants sous /recettes/[slug]/ : amok-trey, lok-lak, kroeung-jaune, bai-sach-chrouk, kuy-teav, num-banh-chok, num-pang, samlor-machu, prahok-ktis, chek-ktis. Le filtre, les portions ajustables et les ?tapes existantes restent op?rationnels.
- **Ateliers :** 6 sous /apprendre/[slug]/ : piler-aromates-au-mortier, equilibrer-une-sauce, saisir-viande-poele, fraicheur-herbes-agrumes, bouillon-leger-savoureux, composer-repas-cambodgien.
- **Carnets :** 6 sous /culture/[slug]/ : poivre-de-kampot, comprendre-le-kroeung, comprendre-amok, kep-marche-crabe-poivre, prahok-fermentation-umami, construire-repas-cambodgien.
- **Guides ingr?dients :** 4 sous /ingredients/[slug]/ : kroeung, poivre-de-kampot, tamarin, prahok ; le glossaire est une autre page autonome.
- **Pages compl?mentaires existantes :** /a-propos/, /credits-photos/, /404/, /experiences/ et les pages li?es au Grand D?ner Khmer. Les pages /experiences/ sont actuellement en **pr?paration / noindex** et ne doivent pas devenir des offres commerciales publiques par inadvertance. Conserver leur acc?s et leur ?tat ?ditorial actuels sans r?gression ; leur promotion dans la nouvelle homepage est hors p?rim?tre de ce lot.
- **Sitemap :** conserver src/pages/sitemap.xml.ts et son inventaire actuel ; la pr?visualisation V17 doit ?tre noindex et absente du sitemap, tandis que / reste indexable ? la livraison. V?rifier les canoniques/OG existants dans BaseLayout.

**Crit?re anti-page orpheline :** chaque listing garde ses liens vers tous les d?tails, chaque d?tail garde la navigation partag?e, et les rubriques restent accessibles via header, footer et CTA de la home. Il n?est pas n?cessaire d?empiler 26 liens d?taill?s sur l?accueil : les listing pages assurent cette d?couvrabilit?.

## 2 ? Storyboard fig? de l'accueil (desktop)

Chaque sc?ne a un r?le, une composition distincte, une intention de mouvement et un chemin utilisateur. Les proportions exactes seront d?riv?es en CSS fluide ; **ne pas recopier les pixels de la planche verticale comme des vh identiques**.

| # | Section valid?e | Mise en sc?ne desktop | Hauteur / rythme relatif | CTA r?el |
| --- | --- | --- | --- | --- |
| 0 | **? LE CAMBODGE DANS VOTRE ASSIETTE ?** | Premier ?cran ivoire ; titre tr?s puissant **? gauche**, grand Amok en composition libre **? droite**, aromates, feuilles, annotations manuscrites et sceau jaune. Photo dominante mais espace pr?serv? ; vraie navigation. | **Ouverture ample** (proche hauteur ?cran utile, adaptable au contenu) | **D?couvrir les recettes** ? /recettes/ ; ? Nos ateliers ? du header ? /apprendre/ |
| 1 | **? TOUT PART DES BONS PRODUITS ?** | **Immense sc?ne de march?** ? gauche, bloc texte/CTA **? droite** sur vert for?t ; raccord organique avec sc?ne pr?c?dente ; localisation g?ographique de la photo v?rifi?e. | **Transition panoramique plus courte**, pas une deuxi?me hero | **Explorer les ingr?dients** ? /ingredients/ ; lien compl?mentaire discret ? /glossaire/ |
| 2 | **? UNE PALETTE D?INGR?DIENTS D?EXCEPTION ?** | **Texte et CTA au centre**, composition ouverte autour avec vraies prises de vue ou d?tourages de citronnelle, galanga, combava, piment, curcuma, poivre. Fond ivoire et beaucoup d?air. | **Pause ?ditoriale de respiration**, hauteur dict?e par objets r?els | **En savoir plus** ? /glossaire/ ; liens contextuels vers /ingredients/kroeung/ et /ingredients/poivre-de-kampot/ |
| 3 | **? COUPER. PILER. SENTIR. ?** | Photo vivante du mortier ? gauche, texte **au centre-droit**, pictogrammes/consignes en trois ?tapes **tout ? droite** ; annotation manuscrite discr?te, cadrage authentique du geste. | **Moment p?dagogique plus dense**, grille distincte | **Voir les ?tapes** ? /apprendre/piler-aromates-au-mortier/ |
| 4 | **? DES PLATS QUI RASSEMBLENT ?** | **Grand tableau photographique gourmand presque pleine largeur**, titres, description et CTA **centr?s** sur zone prot?g?e par d?grad? lisible ; plats et repas authentiques ; aucune bande de cartes. | **Temps fort immersif**, plus ample que le march? | **D?couvrir les recettes** ? /recettes/ ; lien secondaire facultatif ? /culture/construire-repas-cambodgien/ |
| 5 | **? DES DESSERTS TOUT EN FINESSE ?** | Titre, texte et CTA **? gauche**, photographies culinaires de desserts au **centre / ? droite**, contour organique, petits d?tails graphiques ; identification rigoureuse Chek Ktis / Num Kom. | **Moment plus l?ger et court**, sans carr? ni r?p?tition de composition | **D?couvrir les desserts** ? /recettes/ avec focus filtre dessert si m?canisme existant, sinon ? /recettes/chek-ktis/ pour une vraie recette |
| 6 | **? CUISINEZ, PARTAGEZ, VOYAGEZ ?** | **Finale immersive** inspir?e de la maquette, paysage/silhouette d?Angkor sourc? avec droits v?rifi?s ; **titre et boutons centr?s** ; zone visuelle volontairement sobre. | **Sortie ?motionnelle** distincte ; pas de section identique aux autres | **Nos ateliers** ? /apprendre/ ; **Toutes les recettes** ? /recettes/ |

### R?partition des titres et CTA ? valid?e et obligatoire

- Hero : **gauche**.
- March? : **droite**.
- Aromates : **centre**.
- Gestes : **centre-droit**, les rep?res p?dagogiques sur un axe ind?pendant.
- Repas : **centre en surimpression**.
- Desserts : **gauche**.
- Finale : **centre**.

**Interdit :** r?aligner syst?matiquement les quatre derni?res sections ? gauche, ou remplacer toutes les sc?nes par ? titre + image ? invers?. Un seul contenu principal, des espaces n?gatifs et des intensit?s diff?rentes.

### Rythme visuel et raccords

- Alterner **photographie spectaculaire ? pause graphique ? photographie de geste ? tableau de repas ? douceur ? finale**, avec raccords organiques qui n?ajoutent pas 100vh artificiels.
- D?coupes de transition (papier/feuillage/courbes) **subtiles et vari?es**, accessibles et d?coupl?es des m?dias.
- Le plat du hero reste le personnage principal ; les objets secondaires n?obstruent jamais le plat, titre, CTA ou navigation.
- Les ?l?ments de marque (motifs, feuilles, annotations, tampons) sont des **?l?ments de soutien**, pas une d?coration qui encombre chaque centim?tre.
- Aucun carrousel automatique ni sliders g?n?riques comme substitut ? une direction artistique.

## 3 ? Une vraie conception mobile, PAS une r?duction du desktop

**Breakpoints de travail :** 320, 360, 390, 430, 768, 1024, 1440 et 1920 px ; supports tactiles et clavier. Les mobiles n'ont pas besoin de reproduire la disposition desktop exactement, mais doivent respecter la m?me hi?rarchie visuelle et les m?mes liens.

| Sc?ne | Mobile attendu et crit?res UX |
| --- | --- |
| Hero | Logo/menu accessibles ; titre lisible sans d?bordement ; plat imm?diatement visible et gourmand ; CTA recettes dans le premier parcours sans ?cran vide ; ingr?dients flottants limit?s ? 1?2 accents pour ne pas couvrir le texte |
| March? | Photo panoramique large, texte pos? dans une zone contrast?e **sans cadrage impossible** ; bouton entier, visible et cliquable ; pas de long stickiness |
| Palette | Des ingr?dients r?partis en composition asym?trique autour d'un titre central ; pas d?empilement de carr?s ; annotations adapt?es ? la taille utile |
| Gestes | Photographie du geste puis trois rep?res courts, lisibles et cliquables ; passage direct vers l?atelier ; aucun chevauchement avec la photo |
| Repas | Grande photo immersive en format vertical/?tendu ; surimpression du texte seulement si contraste mesur?, sinon bloc adjacent ; CTA accessible |
| Desserts | Un visuel dominant, second en contrepoint (sans photo carr?e), textes naturels et lien vers un dessert existant |
| Finale | Titre centr?, deux CTA larges et espac?s, paysage au bon cadrage ; bouton non recouvert par les d?corations |
| Navigation | Reprendre le vrai menu mobile existant : dialogue, fermeture ?chap/bouton, focus restitu? et non-pi?geage du scroll |

**Pas de hauteur fixe obligatoire pour un bandeau mobile.** La sc?ne doit s?adapter au texte r?el, au zoom 200 %, aux petits ?crans, ? la taille des images et aux typographies disponibles.

## 4 ? Inventaire de production visuelle et r?gles de droits

La maquette contient des **images g?n?r?es**, des illustrations et un rendu composite. Elle sert de guide **artistique**, pas de biblioth?que de photos factuelles directement publiables.

| Besoin | M?dia final requis | Contr?le indispensable |
| --- | --- | --- |
| Hero Amok | V?ritable photo nette d'Amok cambodgien, d?tourable ou exploitable en composition avec feuilles | Plat conforme ? la l?gende ; source/auteur/licence ; cadrage desktop/mobile |
| March? | Grande photographie de march? **cambodgien identifiable** | Lieu prouv? ; ne pas utiliser un march? d?un autre pays sous l?gende ? Cambodge ? |
| Palette | Photos ou d?tourages citronnelle, galanga, piment, combava, curcuma, poivre | Pour images g?n?riques de produits, ne pas inventer leur provenance ; d?tourages propres ; pas de logos ?trangers |
| Mortier | Photo r?ellement montrant un mortier/un geste de pr?paration, sans simulation documentaire | Coh?rence entre photo et consignes ; si photo indisponible, renoncer ? pr?tendre voir le geste |
| Repas partag? | Grande prise de vue gourmande et cr?dible d?une table/plusieurs plats cambodgiens | Pas de photomontage qui r??tiquette des plats d'autres cuisines |
| Desserts | Chek Ktis v?rifi? et ?ventuellement Num Kom ; photos sp?cifiques | Photo distincte du plat pr?sent? ; **Chek Ktis existe en recette**, Num Kom pas en recette actuelle |
| Finale | Paysage ou illustration d'Angkor, photocomposition autoris?e, silhouettes d?coratives originales | Droits et provenance ; ?viter les visuels trompeurs |
| Identit? | Dessins/motifs khmers, fl?ches et annotations typographiques, s?parateurs | Cr?ations SVG originales, r?utilisables, coh?rentes et l?g?res |

**Livrable m?dia pr?alable :** cr?er un manifeste d'assets (nom, origine, auteur, licence, URL source, cr?dit visible, taille, alt text, usage, statut juridique), versions WebP/AVIF si utiles, photos responsive, et cr?dits au pied de page. Les ?l?ments non sourc?s restent en **placeholder explicite**, jamais transform?s en faux reportage.

**Ne pas utiliser de police propri?taire copi?e depuis les sites d'inspiration.** S?lectionner des polices web l?galement utilisables et capables d'obtenir les effets de titrage sans sacrifier la lisibilit?.

## 5 ? Architecture technique recommand?e

1. **Nouvelle branche d'impl?mentation issue de main**, ind?pendante de feat/v17-01-art-direction-preview, qui contient les prototypes rejet?s.
2. **R?f?rence maquette archiv?e** dans docs/references avant la premi?re sc?ne int?gr?e ; empreinte de l?original v?rifi?e.
3. Impl?menter une **pr?visualisation isol?e** /v17-accueil-preview/ avec BaseLayout, le v?ritable SiteHeader et le v?ritable SiteFooter ; noindex et absence du sitemap/menu public. Pas de nouveau chantier commercial ni de renommage de routes.
4. D?composer le contenu en composants Astro clairement nomm?s : V17Hero, V17Marche, V17Palette, V17Gestes, V17Table, V17Desserts, V17Finale ; ajouter si n?cessaire V17SceneDivider et V17Decor uniquement pour les raccords communs.
5. Une feuille de style principale d?di?e ? cette nouvelle direction, avec tokens et styles composants ; **ne PAS superposer home-v17-preview.css, home-v17-air.css ou autres couches historiques**.
6. Rassembler les **liens dans une configuration de navigation / donn?es valid?es**, ou directement par section avec un test d?int?grit? automatique ; ne pas reconstruire les 10 recettes ou les 6 ateliers en les dupliquant dans le composant homepage.
7. GSAP ScrollTrigger uniquement apr?s validation de la g?om?trie statique desktop/mobile ; chor?graphier la transition **in/settle/out**, ingr?dients lat?raux, photos, respiration, ?l?ments graphiques, en respectant la hauteur variable.
8. Construire **sans d?pendre de GSAP** : aucun texte, image informative ou lien indispensable ne doit rester invisible en cas d?erreur JS ou mouvement r?duit.
9. Apr?s r?ception de la preview, **remplacer uniquement** le contenu de src/pages/index.astro dans un lot contr?l? ; v?rifier toujours l?ensemble des autres routes et conserver leurs composants.
10. Pr?server le pipeline OVH existant, avec v?rification du SHA de main, puis publication manuelle **apr?s autorisation explicite** et recette publique.

### SEO / accessibilit? / performance

- H1 unique, H2 par sc?ne, landmarks main/header/footer/nav et descriptions d?image exactes.
- Conserver les m?tadonn?es du BaseLayout, les liens canoniques, les donn?es structur?es pertinentes et la logique du sitemap ; pr?visualisation noindex.
- Focus visible, menu mobile utilisable au clavier, boutons tactiles d'au moins 44 ? 44 px, contrastes AA v?rifi?s, zoom 200 % sans masquage de contenu, lecteurs d'?cran sur parcours cl?.
- Respect strict du r?glage r?duit : sc?ne statique compl?te, aucune d?pendance ? une r?v?lation forc?e.
- Responsive images (picture/srcset/sizes) et dimensions d?finies ; images secondaires en lazy-load, hero optimis? en priorit? ; ?viter que les gros composites visuels d?gradent le LCP.
- Objectifs qualit? indicatifs **? mesurer**, non valid?s ? ce jour : LCP ? 2,5 s, CLS ? 0,1, INP ? 200 ms ; Lighthouse mobile performance ? 90, accessibilit? ? 95, SEO ? 95 ; pas de promesse de score avant audit r?el.

## 6 ? Plan de r?alisation ordonn?, d?pendances et gates

| Lot | Intention / livrable | D?pendance | D?finition de termin? |
| --- | --- | --- | --- |
| **D0 ? Plan directeur** | Ce document, inventaire des routes, r?f?rences, principes, contraintes | Aucun | Relu, li? depuis le plan consolid? ; aucune modification applicative |
| **D1 ? Matrice visuelle + m?dias** | Maquette canonique archiv?e, manifeste d'assets et sourcing complet, fonts/illustrations autoris?es | D0 | Tous les visuels identifi?s, licences v?rifi?es ; d?ficits explicit?s |
| **D2 ? Syst?me visuel + squelette** | Tokens, typo, header/footer r?utilis?s, preview noindex, composants vides structur?s, vraie navigation | D0, D1 partiel | 7 sc?nes diff?rentes d?s le wireframe, aucun retour vers les CSS #45 |
| **D3 ? Hero + march?** | Fid?lit? premier ?cran et premi?re transition desktop/mobile | D1, D2 | Captures compar?es ? la r?f?rence ; liens r?ellement cliquables |
| **D4 ? Ingr?dients + gestes** | Composition centrale + sc?ne atelier authentique | D1, D3 | Deux silhouettes distinctes, aucun carr? ni faux geste, acc?s glossaire/atelier |
| **D5 ? Repas + desserts + finale** | Tableau immersif, photos de desserts, final centr? et 2 CTA | D1, D4 | Six derniers CTA r?els, diversit? des hauteurs/positions |
| **D6 ? Chor?graphie** | Transitions de sc?nes, parallax mesur?, entr?es/recentrages, SVG l?gers | D3?D5 visuellement valid?s | Vid?o de scroll Chrome desktop, mobile sans scroll hijacking, r?duction du mouvement |
| **D7 ? R?ception compl?te** | Tests r?gression, UX, a11y, responsive, SEO/perf, sourcing et relecture | D2?D6 | CI PASS **et** capture desktop/mobile valid?es par le commanditaire |
| **D8 ? Publication contr?l?e** | Remplacement de / uniquement, revue finale, merge puis publication OVH autoris?e | D7 + accord explicite | main/OVH v?rifi?s, pages existantes v?rifi?es, retour arri?re pr?t |

**Ordre imp?ratif : D0 ? D1 ? D2 ? D3 ? D4 ? D5 ? D6 ? D7 ? D8.** Si les m?dias sont incomplets, on peut d?velopper une composition statique avec placeholders identifi?s, mais **pas** d?clarer la sc?ne photographiquement valid?e.

### D?tail des recettes automatis?es ? pr?parer

- **SiteHeader** : logo Accueil, Recettes, Glossaire, Ateliers, Carnets, ? propos ; comportement identique desktop/mobile.
- **SiteFooter** : Recettes, Ingr?dients, Culture, Apprendre, ? propos, Glossaire, Cr?dits photos.
- **Accueil V17** : v?rifier tous les liens du tableau du storyboard en HTTP 200 ; aucun chemin invent?.
- **Listing et d?tails** : v?rifier les 10 routes de recettes, les 6 ateliers, les 6 carnets et les 4 guides ingr?dients (plus glossaire, culture, ? propos, cr?dits).
- **Recettes** : filtres, quantit?s ajustables, listes de courses/?tapes et ?ventuel balisage schema ne doivent pas r?gresser.
- **Ateliers** : conserver les parcours p?dagogiques ind?pendants des recettes et leurs contenus.
- **Exp?riences** : aucune mise en vente/activation ni changement de leur statut noindex ; pas de promesse commerciale nouvelle.
- **Responsive** : captures desktop 1440 et 1920 ; tablette 768 et 1024 ; mobiles 320/360/390/430 ; absence de d?bordement, chevauchements, boutons masqu?s ou sections de hauteur uniforme artificielle.
- **Visuel** : pour chacune des 7 sections, r?aliser une capture, comparer avec la **maquette canonique**, noter les ?carts et obtenir PASS esth?tique ; ne pas confondre les variables CSS correctes avec une fid?lit? artistique r?elle.
- **Motion** : v?rifier rendu sans JS, reduced-motion, focus/keyboard, scroll au trackpad et tactile, et vid?o compl?te de la vraie preview.
- **Production** : ne pas merger et ne pas lancer GitHub Publish OVH avant approbation explicite ; fournir rollback vers le commit V16 stable.

## 7 ? Gouvernance anti-r?gression et d?cisions

### D?cisions closes

- Maquette finale mentionn?e en section 0 **valid?e** comme univers de r?f?rence.
- Les quatre derni?res sc?nes desktop ont des alignements vari?s : gestes centre-droit, repas centre, desserts gauche, finale centre.
- La homepage est le seul p?rim?tre de refonte pour l'instant ; toutes les pages existantes et leurs fonctionnalit?s sont conserv?es.
- Aucune cr?ation d'URL de recette ou d'atelier fictive ; les CTA pointent vers des routes r?ellement existantes.
- Pas de r?utilisation des CSS des prototypes #45 ni de fusion de la PR #45 en bloc.
- Pas de modifications de production sans accord.

### Questions non bloquantes ? trancher pendant D1/D2

1. Le menu peut-il accueillir visuellement ? Ingr?dients ? en **plus** des cinq entr?es actuelles, sans sacrifier Glossaire et sans surcharger le mobile ? Par d?faut **conserver les cinq liens actuels** ; les ingr?dients sont accessibles par les sections et le footer.
2. Pour ? D?couvrir les desserts ?, utiliser la recette Chek Ktis directement ou cr?er un **vrai filtre dessert partageable** dans /recettes/ (ce serait alors un lot ind?pendant v?rifi?, non une URL fictive).
3. Les assets de la maquette sont des inspirations : quels clich?s documentaires de m?me impact visuel seront retenus, quelles substitutions resteront annonc?es comme telles ?
4. L?inspiration Angkor ? la fin doit-elle ?tre une photographie v?rifi?e ou une illustration originale ? Les deux peuvent respecter la maquette, sous r?serve des droits et d?une validation de fid?lit?.

### Modalit?s de livraison et crit?res de refus

Chaque lot de code pr?sente : commit/PR, diff?rences visuelles desktop/mobile face ? la r?f?rence, captures **r?elles**, vid?o d?s la phase motion, liste des URL touch?es, QA ex?cut?e, performances mesur?es et limitations honn?tement report?es. Les probl?mes de direction artistique, texte approximatif, faux visuel cambodgien, lien cass?, animation impos?e, pages existantes cass?es ou retour aux compositions r?p?titives **bloquent la promotion**.

**En une phrase : reproduire fid?lement la maquette valid?e, restaurer ses compositions et son rythme sur un vrai site Astro sans sacrifier la navigation, le contenu et les fonctionnalit?s V16.**


## 8 ? JOURNAL D'AVANCEMENT (mise ? jour ? chaque lot)

> Les mentions PASS ci-dessous concernent **uniquement les livrables cit?s**, pas le produit final. Les blocages sont consign?s et ne peuvent ?tre masqu?s par une CI verte.

### 13 octobre 2026 ? D0 puis D1

| Gate | Statut v?rifi? | R?sultat / preuve | Suite |
| --- | --- | --- | --- |
| **D0 ? Plan directeur** | **PASS ? en revue, PR #46 draft** | Plan fond? sur la maquette retenue et sur les routes existantes ; historique des anciens prototypes isol? | Ne pas fusionner sans revue |
| **D1.1 ? Maquette source** | **PASS LOCAL / ARCHIVAGE GITHUB OUVERT** | Original de 974?1615 contr?l? par SHA-256 `f775e6f3a483479f4a2d095406593d3d5dc354213b80d2a99839c6f23f4ddc71` ; archive t?l?chargeable fournie dans la conversation | Int?grer le vrai PNG original dans la future branche d'impl?mentation (le connecteur GitHub texte n'accepte pas ce transfert binaire depuis le conteneur). Ne pas annoncer ? archiv? sur GitHub ? |
| **D1.2 ? Inventaire des m?dias** | **PASS** | [Manifest m?dias V17](./v17-media-manifeste.md) : 8 familles V16, licences publi?es et besoins sc?ne par sc?ne | Examiner candidats autoris?s / nouvelles photos |
| **D1.3 ? M?dias finaux** | **PARTIAL ? gate ouvert** | Manquent principalement vrai pilage au mortier, table cambodgienne, visuel final Angkor et harmonie des photographies | Acheter/produire/sourcer les m?dias sous licence avant la r?ception des sc?nes |
| **D2 ? Squelette Astro** | **PASS TECHNIQUE / R?CEPTION ARTISTIQUE OUVERTE** | [PR #47](https://github.com/roro78/cuisine-cambodgienne/pull/47) issue de main, 7 sc?nes, 7 largeurs, noJS, reduced motion ; [CI #38395986812](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38395986812) SUCCESS, vraies captures desktop/mobile | Refaire les m?dias et mesurer l'?cart r?el ? la maquette ; pas de validation graphique implicite |
| **D3 ? H?ros/march? + D5 partiel, m?dias r?els** | **PASS TECHNIQUE ; FID?LIT? ARTISTIQUE EN ATTENTE** | [PR #47](https://github.com/roro78/cuisine-cambodgienne/pull/47), commit `0cfa7b8a51146347eb32d06305115d5d5d6db997`, [CI #38398110796 PASS](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38398110796), clich?s Amok, march?, table, Chek Ktis, Num Kom et Angkor | Revue esth?tique, licences finales, photo mortier et documentation des m?dias ; pas de merge |\n| **D4 et D6?D8** | **NON D?MARR?S / GATES OUVERTS** | Photo de pilage r?elle, s?quences GSAP, revue artistique, tests profonds et validation finale manquants | Avancer seulement apr?s r?ception des pr?requis |

**R?gle d'autonomie :** avancer sur les sous-lots techniques isol?s qui ne n?cessitent pas d'inventer une photo documentaire ; ne jamais publier, merger la page ou annoncer une fid?lit? artistique compl?te pendant que les m?dias source ou la r?ception du commanditaire manquent.


### 13 octobre 2026 ? Point de contr?le D2 : **PASS technique ; design ? reprendre**

- Branche `feat/v17-accueil-reconstruction` cr??e **sur main**, pas sur l'ancienne PR #45 ; [PR #47 draft](https://github.com/roro78/cuisine-cambodgienne/pull/47).
- `src/pages/v17-accueil-preview.astro`, `src/styles/v17-accueil-rebuild.css`, contrat Node et test Chromium d?di?s ; ajout dans **CI** uniquement (aucune modification du pipeline OVH).
- [Run #38395986812](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38395986812) **SUCCESS** avec sc?narios 320, 360, 390, 430, 768, 1024, 1440 px ; noJS et reduced-motion ; menu mobile ?chap ; liens de l'accueil et ancienne homepage intacts.
- **Revue r?elle des captures** : premier squelette D2 encore trop ?loign? de la maquette : photographies h?t?rog?nes, mortier/desserts/finale trop simplifi?s, photo de march? peu fid?le. Le gate de fid?lit? artistique est **FAIL/OUVERT**, m?me si la CI passe. Ces captures ne doivent pas ?tre vendues comme une nouvelle proposition d'illustration valid?e.
- **Lot suivant** : r?cup?ration de photos authentiques/cit?es des anciens assets de #45 (sans code/styles) pour Amok, march?, assortiment ? Phnom Penh, Chek Ktis et Num Kom ; aucune r?gression des autres pages.
- **Gates toujours ouverts** : maquette PNG original non encore commit? dans GitHub ; photo authentique de mains au mortier ; photographie finale et campagne photo coh?rente ; comparaison visuelle supervis?e ; animations GSAP ; publication.

### 13 octobre 2026 ? D3 : images authentiques reprises et nouvelle photo Angkor

- **Commit final v?rifi? :** `0cfa7b8a51146347eb32d06305115d5d5d6db997` sur la [PR #47](https://github.com/roro78/cuisine-cambodgienne/pull/47). Aucun composant ni fichier CSS historique de la PR #45 n'a ?t? r?utilis?. **Seuls des fichiers photo document?s ont ?t? repris par leurs blobs**, sous r?serve des v?rifications de licence finales.
- Photos d'**Amok**, ?tal de fruits au Cambodge, **assortiment khmer ? Phnom Penh**, **Chek Ktis**, **Num Kom**, galanga et piment d?tour? int?gr?es ? la preview. Les auteurs, licences et sources Wikimedia sont lisibles dans l'aside de pr?visualisation.
- **Angkor Wat** : nouvelle photographie authentique de Radek Kucharski prise en 2015 au coucher du soleil, depuis [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Angkor_Wat_Reflection_(46810498612).jpg) sous [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/), vignette 1600?900 (simple redimensionnement, affichage CSS recadr?). Cr?dit visible dans la finale. La photo remplace le SVG de silhouette.
- **D?fauts visualis?s puis corrig?s** : photographie du repas initialement cach?e derri?re un calque d'arri?re-plan ; titre de cette sc?ne trop grand sur mobile. Tests Playwright renforc?s : ordre des calques et contr?le du d?bordement interne du titre.
- [**Run GitHub CI #38398110796 : SUCCESS**](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38398110796) : build Astro, tests anciens V16, contrat de la nouvelle page, Chromium 320/360/390/430/768/1024/1440, menu mobile/Escape, reduced motion et sans JavaScript. Captures `v17-accueil-d2-screenshots` de ce run inspect?es sur **desktop et mobile** ; photo de table et d'Angkor d?sormais r?ellement visibles.
- **Gate cr?atif = ouvert :** la page r?elle est encore moins ?labor?e que la maquette ma?tre ; le mortier reste une illustration, les photos gourmandes ne sont pas homog?nes, le logo et l'?chelle de la typographie demandent une r?ception. **CI PASS ? validation de la maquette.**
- **? venir en autonomie :** sourcing autoris? d'une vraie s?quence de geste, am?lioration de la fid?lit? visuelle et tests m?dias (dont Safari/zoom) ; GSAP ne d?marre qu'apr?s stabilisation des compositions.
- **Intouchables** : main, ovh-production, page `/` actuellement V16, header/footer des autres pages et pipeline de publication manuelle. Aucun merge ni d?ploiement.



### 13 octobre 2026 ? Reprise contr?l?e de la PR #47, D6 et preuves D7

- **Situation contr?l?e ? la reprise :** PR [#47](https://github.com/roro78/cuisine-cambodgienne/pull/47) ouverte et draft, commit `1a56f6285fff351d1f01b68b96eb84a95c756750`, dont le parent est `4708fddf9e10e3fed5df7e60b66d76a35e04a7ef`. La [CI #38405432354](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38405432354) de ce HEAD est **SUCCESS**. Le nouveau fichier `src/scripts/v17AccueilMotion.ts` anime certaines images/illustrations avec GSAP ScrollTrigger ; ses s?quences sont actuellement r?serv?es aux ?crans de plus de 760 px sans r?duction du mouvement. **D6 = IMPL?MENTATION TECHNIQUE PARTIELLE**, pas une r?ception visuelle du mouvement ni du mobile.
- **Preuves visualis?es :** les captures GitHub Actions du commit `1a56f628`, dont le grand format 1440 px et le mobile 390 px, ont ?t? r?cup?r?es et examin?es. L'accueil pr?sente les sept silhouettes distinctes attendues. La sc?ne ? Gestes ? repose encore sur une illustration de mortier et une vraie photo de p?te pr?par?e, non sur une photographie de mains en train de piler. **Aucune comparaison m?trique fiable ? la maquette approuv?e n'est revendiqu?e** : l'original de 974 ? 1615 px (SHA-256 `f775e6f3a483479f4a2d095406593d3d5dc354213b80d2a99839c6f23f4ddc71`) n'a pas pu ?tre rouvert dans la session de reprise ni retrouv? dans le d?p?t.
- **D7 ? Compl?ment de preuves commit?s, EN COURS DE CI :** [commit `94d84a0`](https://github.com/roro78/cuisine-cambodgienne/commit/94d84a0b0dae0a33b9aa00a5b3624169b1c84da5) ajoute la capture int?grale aux sept viewports et un enregistrement vid?o WebM **du navigateur r?ellement d?fil?** ? 1440 et 390 px, sans capturer une animation synth?tique ; [commit `2a8db18`](https://github.com/roro78/cuisine-cambodgienne/commit/2a8db18532bdc5c4c815082781ea51704bb77c2a) inclut les preuves `.png` et `.webm` dans les artifacts CI. [Run #38411567305](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38411567305) d?clench? ; **r?sultat ? consigner apr?s ex?cution**, aucune nouvelle r?ussite anticip?e.
- **Statut des gates :** D2 technique PASS ant?rieur ; D3?D5 fid?lit? artistique **NON R?CEPTIONN?E** ; D6 mouvement **PARTIEL / ? visualiser** ; D7 QA **EN COURS** ; D8 **INTERDIT sans approbation**. Aucun merge, aucune modification de `main`, de V16, du pipeline OVH de publication ou de `ovh-production`.
- **Prochaine action utile :** obtenir l'original exact de la maquette (ne pas le redessiner de m?moire), examiner les nouvelles captures et vid?os produites sur le HEAD, puis chiffrer les diff?rences de silhouettes, tailles et cadrages avant toute retouche artistique. Sourcer une photographie cr?dible du geste de pilage ; terminer les revues de licences, le contr?le mobile des animations et les audits accessibilit?/performances avant D7 PASS.


### 13 octobre 2026 ? Cl?ture du sous-lot preuves navigateur (D7.1)

- **PR #47 commit `83c477b6636c268f791e33dd4400b46b12ff41b8` ; [CI #38411926018 SUCCESS](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38411926018)**. La premi?re tentative [#38411567305](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38411567305) avait ?chou? parce que l'encodeur FFmpeg Playwright manquait. Le [correctif `83c477b`](https://github.com/roro78/cuisine-cambodgienne/commit/83c477b6636c268f791e33dd4400b46b12ff41b8) installe uniquement ce binaire dans le job CI, sans modification du produit.
- **Evidence effectivement produite et t?l?charg?e** : artifact GitHub `v17-accueil-d7-browser-evidence` (ID `11821492949`, expiration GitHub annonc?e 20/10/2026). **Sept PNG r?els** aux largeurs 320, 360, 390, 430, 768, 1024 et 1440 px. **Deux enregistrements WebM** de d?filement de la page en Chrome aux viewports 390 ? 844 et 1440 ? 900, dur?es v?rifi?es **5,44 s et 7,60 s**. Les images initiales et finales extraites de chaque vid?o ont des pixels diff?rents, confirmant que le viewport a d?fil?.
- **Tests ex?cut?s sur CI :** `npm run check`, contrats de r?gression motion/recettes/?ditorial/ateliers et parcours exp?riences, build Astro, contrat V17, Chrome responsive 7 largeurs, mode sans JavaScript, `prefers-reduced-motion` et menu mobile, toutes ?tapes termin?es avec succ?s selon la CI. Les tests ne prouvent pas des crit?res non automatis?s (performance mesur?e, Safari, lecture d'?cran, conformit? exacte de la maquette ou licences finales).
- **Verdict : D7.1 PREUVES NAVIGATEUR = PASS TECHNIQUE ; D7 GLOBAL = OUVERT.** La vid?o du scroll n'est pas une comparaison avec l'original du design et ne constitue **aucune validation artistique**. La maquette PNG reste ? rendre accessible pour analyse image/image, en conservant l'empreinte `f775e6f3a483479f4a2d095406593d3d5dc354213b80d2a99839c6f23f4ddc71`.
- **Suite prioritaire :** r?ception du PNG source exact, comparaison minutieuse sections desktop/mobile, correction de la seule PR #47 suivant ?carts document?s ; source fiable de mortier en situation, QA motion sur mobile, audit a11y/perf/SEO et cr?dits. Aucun merge ni d?ploiement.


### 13 octobre 2026 ? Contr?le comparatif avec la planche transmise ? nouveau

- **R?f?rence re?ue dans la nouvelle conversation :** image nomm?e `2399.png`, **octets JPEG**, dimensions **926 ? 1536 px**, SHA-256 `fbe345f9984f3ba06bab438202de5afcadec37e0eca9608c0ebdc5be2a3316ff`. Cette image constitue une **copie visuelle exploitable de la maquette**, mais elle n'est **pas** l'original PNG 974 ? 1615 px au SHA-256 `f775e6f3a483479f4a2d095406593d3d5dc354213b80d2a99839c6f23f4ddc71`. Ne pas enregistrer cette copie comme l'original. Ne pas d?clarer la comparaison pixel-?-pixel canonique valid?e.
- **?carts constat?s sur la capture Chrome 1440 px du HEAD `83c477b` :** hero bien structur? mais plat trop petit et photographie moins expressive que la planche ; march? = ?tal de fruits photographi? plut?t que la grande sc?ne de march? en mouvement ; aromates trop peu pr?sents autour du titre ; mortier = illustration/texture pr?par?e, non v?ritable geste ; tabl?e sombre/moins gourmande ; desserts = deux petites photos s?par?es ; finale Angkor r?elle mais ciel diurne et atmosph?re tr?s diff?rente du coucher de soleil de la maquette. **Ce sont des constats de comparaison, pas une direction artistique r?invent?e.**
- **Lot CSS cibl? PR #47 :** [commit `fac99b4`](https://github.com/roro78/cuisine-cambodgienne/commit/fac99b45a8c720db1998e721b7e50b113f337336) : composition et ampleur du plat hero, meilleure occupation p?riph?rique des aromates, mortier mieux mis en sc?ne (toujours illustr?), am?lioration de l'exposition/contraste du repas, dessert principal dominant et second en contrepoint. Aucune photo remplac?e sans provenance v?rifi?e ; aucun changement de direction, route, menu ou production.
- **D?faut d?tect? par le test** : [CI #38415971253](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38415971253) **FAIL** sur le d?bordement du H1 hero ? 1440 px (`scrollWidth=616`, `clientWidth=572`). **Correctif apport?** par [`de50bc8`](https://github.com/roro78/cuisine-cambodgienne/commit/de50bc8a2aa5b43f4554f8fe21d6a97b1078dd04), r?duction de la seule taille de titre dans la tranche desktop >1100 px.
- **CI de contr?le du correctif :** [#38416298228](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38416298228), ?tat **? confirmer avant PASS**. Nouvelle capture visuelle ? relire avant toute qualification d'am?lioration finale.
- **R?ception artistique : TOUJOURS OUVERTE.** Les photographies de march?, mortier, repas, dessert et coucher de soleil sont des questions de sourcing/accord documentaire et de qualit? artistique non closes ; aucune photo de la planche composite ne peut ?tre pr?sent?e comme photographie documentaire v?rifi?e.
- **Prochaine ?tape :** v?rifier les nouveaux PNG CI desktop/mobile et les deux captures de scroll ; juger les gains/r?gressions de composition puis poursuivre le sourcing l?gal et les corrections limit?es. Aucun merge, aucune production V16 modifi?e.


### 13 octobre 2026 ? Cl?ture technique du premier lot apr?s r?ception de la copie JPEG

- **P?rim?tre r?ellement modifi? :** `src/styles/v17-accueil-rebuild.css`, `src/pages/v17-accueil-preview.astro`, `tests/v17-accueil-browser-smoke.mjs` sur la branche `feat/v17-accueil-reconstruction`, PR #47 uniquement. Aucune modification de `src/pages/index.astro`, de `main`, de V16 ni d'OVH.
- **Correction de proportions [`fac99b4`](https://github.com/roro78/cuisine-cambodgienne/commit/fac99b45a8c720db1998e721b7e50b113f337336) :** plat h?ro plus ample, ingr?dients repositionn?s, photo et illustration du geste mieux distribu?es sans pr?tendre montrer le pilage, contraste du repas moins ?crasant, dessert principal mieux mis en sc?ne. **Une retouche de proportion ne remplace pas la phototh?que manquante et ne vaut pas r?ception artistique.**
- **Bugs r?els d?tect?s et corrig?s :** titre h?ro d?bordant ? 1440 ([CI #38415971253 FAIL](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38415971253), correctif `de50bc8`) ; titre touchant encore la photo d'environ 5,6 px, identifi? par le nouveau garde-fou g?om?trique ([CI #38417961630 FAIL](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38417961630), correctif `9b7c0f7`) ; phrase en pied de hero couverte par la vague et par les illustrations, retir?e comme doublon ?ditorial (`83f2280`).
- **Dernier HEAD v?rifi? :** [`9b7c0f7f490b5c47918807df0caea7ae88dfa377`](https://github.com/roro78/cuisine-cambodgienne/commit/9b7c0f7f490b5c47918807df0caea7ae88dfa377), [**CI #38418387837 SUCCESS**](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38418387837) : build, contrats de non-r?gression, Chromium 320/360/390/430/768/1024/1440, sans JS et reduced-motion, nouvelle assertion s?paration du texte/plat PASS. Artifact `v17-accueil-d7-browser-evidence` (ID `11824354987`) t?l?charg?, sept PNG et deux vid?os r?elles du scroll disponibles, conservation GitHub limit?e.
- **Relecture r?elle de l'ultime capture hero 1440 px :** photographie agrandie, titre d?sormais enti?rement distinct, CTA lisible, phrase superflue disparue. La diff?rence avec la maquette est encore forte : photo Amok non d?tour?e, sc?ne march? non immersive, illustrations d'ingr?dients insuffisantes, geste de mortier non document?, photos tabl?e/desserts et atmosph?re Angkor ? am?liorer.
- **Gates :** lot de corrections g?om?triques **PASS TECHNIQUE** ; fid?lit? de la maquette **PARTIELLE / NON VALID?E** ; sour?age/licences **OUVERT** ; D6 animations mobiles **OUVERT** ; D7 complet et D8 **NON VALID?S**. La copie JPEG n'a toujours pas l'empreinte du PNG canonique.
- **Prochaine priorit? :** photographie de mortier r?ellement contextualis?e (droits et provenance), remplacement des photos les plus ?loign?es de la planche par des images r?ellement autoris?es, enrichissement mesur? de la palette, puis comparaison nouvelle capture/maquette et mesures d'accessibilit?/performances. **Aucun merge, aucune publication.**


### 13 octobre 2026 ? D?cision de r?ception ? la maquette fait foi (priorit? absolue)

**D?cision explicite du commanditaire :** la pr?visualisation actuelle **ne ressemble pas suffisamment ? la maquette accept?e** ; elle est **REFUS?E artistiquement**. Les tests CI d?j? PASS prouvent seulement l'int?grit? technique. Ne plus pr?senter une retouche ponctuelle CSS, une composition reconstruite approximativement ou des d?corations comme une r?ception cr?ative. Il ne faut pas demander une nouvelle direction artistique : la planche re?ue dans la conversation le 13 octobre reste la r?f?rence approuv?e.

**Diagnostic contr?l? :** comparaison entre la planche de r?f?rence (copie visuelle JPEG 926?1536 fournie par l'utilisateur) et une capture de la preview 1440 px issue des artifacts du commit `e868a106e421217eb8e2043f69fdf84b9d401a8e`. La page reste sensiblement moins dense en m?dias : plat principal en photographie de riz/Amok non d?tour?e, ?tal de fruits au lieu de sc?ne de march? anim?e, ingr?dients trop peu nombreux, illustration de mortier plut?t que v?ritable geste, photo d'assortiment peu gourmande, dessert dans un bol bleu et Angkor sous une ambiance bleue au lieu de l'atmosph?re rouge/orange de la planche. **D3?D5 = FAIL ARTISTIQUE / ouverts.**

**Lots techniques post-d?cision sur PR #47 :**
- `56f5c640` : rep?res manuscrits limit?s et sceau final int?gr? aux sept sc?nes, sans contenu indispensable masqu?.
- `83a21b9d` : original SVG `public/images/brand/v17-spice-bowls.svg` (bols de poivre et curcuma ; dessin vectoriel, pas photo documentaire).
- `639c24bc` : composition hero en trois plans sur ?cran large, rythme des sc?nes maintenu distinct, mise en sc?ne des ingr?dients, gestes et finale.
- `b9149aa3` : extension du contrat de test pour les SVG, annotations et sceau.
- `e868a106` : correction du dimensionnement CSS du SVG pour ?viter un zoom g?ant.
- [CI #38421607441](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38421607441) **SUCCESS** pour la structure responsive/noJS/reduced-motion/r?gression. Artifacts photographiques r?els de test r?cup?r?s (captures 1440/390) ; **aucune fid?lit? artistique d?duite de cette CI**.

**R?ception visuelle des derniers ajustements : toujours REFUS?E / non atteinte.** Ils peuvent am?liorer quelques ?l?ments de la composition, mais l'?cart photographique principal demeure. Ne pas ajouter de dizaines de stickers pour cacher un d?faut de sourcing ou un manque de vraies sc?nes culinaires.

**Conditions de poursuite prioritaires et bloquantes avant r?ception artistique :**
1. Rechercher, inspecter et acqu?rir **des photos authentiques autoris?es** avec sujet/location v?rifiables (march? vivant au Cambodge, mains au mortier document?es, tabl?e khm?re, desserts cr?dibles, Angkor dans la bonne lumi?re). En l'absence d'une photo appropri?e, conserver un placeholder reconnu, sans tromper.
2. Reconstituer la hi?rarchie photographique du storyboard : Amok r?ellement dominant ? droite, march? plein format, ingr?dients autour du texte central, mortier illustrant le geste r?el, tabl?e immersive, dessert gourmand dominant ? droite, Angkor au coucher de soleil. Pr?server les sept dispositions de texte/CTA et le contenu fonctionnel.
3. Comparer de nouvelles captures 1440/390/320 px ? la maquette **sc?ne par sc?ne**, signaler chaque diff?rence r?siduelle ; ne pas utiliser un simple score CI comme verdict visuel.
4. Reprendre ensuite le mouvement GSAP et les contr?les D7 approfondis. Garder `/v17-accueil-preview/` noindex ; **ne pas merger, d?ployer, modifier la V16 ou appeler D8**.

**Important :** la copie JPEG partag?e est visuellement suffisante pour guider les compositions ; le d?faut d'archivage du PNG original est un probl?me documentaire distinct, **pas une raison de demander au commanditaire de choisir une nouvelle maquette**.


### 13 octobre 2026 ? Ex?cution autonome des lots m?dias?motion

**Consigne ex?cut?e :** r?aliser les lots sans validation interm?diaire, mais conserver la r?ception esth?tique de la maquette comme gate ind?pendant. Tous les changements applicatifs sont **sur la PR #47 draft, branche `feat/v17-accueil-reconstruction`**. Aucune fusion, aucune mise en ligne et aucun changement de `/index.astro` V16.

| Lot | Livrables r?ellement enregistr?s | ?tat de contr?le |
| --- | --- | --- |
| **L1 ? Photos** | Import r?plicable de quatre JPEG locaux via [Action #38424609626](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38424609626), commit `2fa0cdb3`. March? de Phnom Penh, mortier avec mains (photo g?n?rique), repas photographi? ? Siem Reap, Angkor au cr?puscule ; manifeste licences/auteurs mis ? jour. | **Import PASS**, pertinence artistique incompl?te, aucune fausse localisation du pilage |
| **L2 ? Composition** | [`fc1c42cd`](https://github.com/roro78/cuisine-cambodgienne/commit/fc1c42cde358f9eed8578b6ae74d6b7db82294e0) : photos r?ellement reli?es aux quatre sc?nes ; mortier vectoriel remplac? par une vraie photo de mains, p?te kroeung distincte ; deux photos de repas d?clar?es comme montage ?ditorial. | **Int?gration committ?e**, r?ception artistique encore ? faire |
| **L3 ? Immersion / hauteur** | [`419d3103`](https://github.com/roro78/cuisine-cambodgienne/commit/419d310335a7cd4ed9513bc6efccfa976bcca854) : sc?nes principales entre ~89svh et ~100svh sur desktop large, hauteurs MINIMALES (jamais fixes), rythme diff?rent, photo dominante par sc?ne ; [`782d0fdc`](https://github.com/roro78/cuisine-cambodgienne/commit/782d0fdc1155007108b7972df42c51e1e8491941) pr?serve la grandeur des desserts sur mobile. | **Code committ?**, g?om?trie/scroll ? confirmer par screenshot et tests r?els |
| **L4 ? GSAP** | [`8b293e28`](https://github.com/roro78/cuisine-cambodgienne/commit/8b293e28cad81a0bc67ad6bac324c98ac6b06e4f) : parallax discret hero, march?, mortier, tabl?e et finale, ingr?dients depuis plusieurs directions, version mobile sans pin ni hijacking, `prefers-reduced-motion` respect?. [`a0f7626b`](https://github.com/roro78/cuisine-cambodgienne/commit/a0f7626bd25f1d326bad528f4c00fc532f912827) simplifie le param?trage. | **Code committ?**, rendu motion ? relire sur vid?os |
| **L5 ? Tests/revue** | [`a7070f89`](https://github.com/roro78/cuisine-cambodgienne/commit/a7070f8955d69b9d0329df5c8706f3d13b76158c) : garde-fous quatre m?dias existants, cr?dits et geste non document? comme cambodgien. ?chec [CI #38425640916](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38425640916) d? ? une ancienne assertion sur le texte de la table, corrig?e par [`77ff6e29`](https://github.com/roro78/cuisine-cambodgienne/commit/77ff6e292bf2cb479aed88172e0d06604a5f8e20). | **CI #38425910680 ? recevoir** : PASS non anticip? |

**R?gles de r?ception et suites :** attendre la CI sur le HEAD ; t?l?charger les sept captures et les deux vid?os r?elles de scroll ; comparer s?par?ment desktop et mobile ? la maquette fournie, en noter les d?fauts. V?rifier la coh?rence des cr?dits (Pexels, CC BY et CC BY-SA), les CTA r?els, WCAG/contrastes, performance et toutes les routes V16. **Le retour exact de la photographie composite n'est pas encore prouv?** : les quatre nouveaux clich?s sont r?els et l?galement sourc?s, mais ne sont pas n?cessairement les photos sources de la maquette. Ne pas confondre coh?rence visuelle am?lior?e et approbation d?finitive du commanditaire.

**Aucune approbation finale sollicit?e pour fusion ou production**, ces ?tapes restent hors p?rim?tre.


### 13 octobre 2026 ? cl?ture QA technique des cinq lots autonomes et revue de code

**HEAD V17 v?rifi? :** [`46a65ad32ba0d3b81ba619345fd22f1aaec7b5e9`](https://github.com/roro78/cuisine-cambodgienne/commit/46a65ad32ba0d3b81ba619345fd22f1aaec7b5e9), PR [#47](https://github.com/roro78/cuisine-cambodgienne/pull/47) **ouverte, draft, non fusionn?e**. [**GitHub Actions CI #38427628038 : SUCCESS**](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38427628038). Tous les changements applicatifs concernent exclusivement la branche V17 ; l'accueil V16 `src/pages/index.astro`, ses composants partag?s et le d?ploiement OVH n'ont pas ?t? modifi?s.

**Preuves de navigateur produites et r?cup?r?es :** artifact `v17-accueil-d7-browser-evidence` (ID `11829426943`), contenant **7 captures pleine page r?elles**, 320, 360, 390, 430, 768, 1024 et 1440 px, et **2 WebM du scroll r?el**, 390 et 1440 px. Une planche de comparaison des **7 sc?nes** (image de la maquette ? gauche / capture Astro 1440 ? droite) a ?galement ?t? produite apr?s extraction de l'artifact ; cette planche **n'est pas un rendu g?n?r?** et ne constitue pas une r?ception artistique. La capture mobile 390 a ?t? examin?e : la photo du mortier est maintenant visible et correctement charg?e apr?s correction du test de lazy-load `c061c3bb`.

**Corrections au fil des CI :** [#38425640916 FAIL](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38425640916) (ancien test de texte de l?gende de la tabl?e ; corrig? `77ff6e29`), [#38425910680 FAIL](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38425910680) (sc?nes tablette trop uniformes ; correction des hauteurs diff?renci?es `4619ccab`), puis [#38426252253 SUCCESS](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38426252253). Corrections suppl?mentaires `c061c3bb` (charger r?ellement photo de mortier pour capture mobile), `3a121050` (amplitude Amok / feuillage), `46a65ad3` (coh?rence du parallax et de l'?chelle du plat) ; la CI finale sur ce dernier SHA est SUCCESS.

**Revue de code finale du lot :**
- **PASS p?rim?tre / s?curit? de livraison :** diff PR #47 contient uniquement preview `/v17-accueil-preview/`, CSS, script GSAP, assets propres, tests, importeur m?dia et workflows de CI ; aucune modification du composant partag? SiteHeader/SiteFooter, de `src/pages/index.astro`, de `main`, `ovh-production` ou de publication. Preview toujours `noindex`.
- **PASS contr?les automatis?s r?els :** build Astro et check types, contrats ?ditoriaux/recettes/exp?riences et V17, Chromium multi-r?solutions, contr?le d?bordement horizontal et t?te hero/photo, menu mobile/?chap, mode sans JS, `prefers-reduced-motion`, chargement des images, animation GSAP au scroll sur desktop, captures et vid?os.
- **PASS garanties de narration :** sc?nes hautes mais hauteur *minimale* sans d?coupe impos?e, scroll natif sans pin/hijacking, illustrations d?coratives, CTA existants, lien d'atelier r?el, texte source accessible sans JS. Sur mobile, parallax uniquement discret, pas de masquage n?cessaire pour lire la page.
- **? V?RIFIER / NON RE?U :** conformit? artistique exacte ? la planche, photographie h?ro Amok et desserts trop diff?rentes, tableau repas encore un montage de clich?s distincts, composition du march? plus documentaire que la maquette composite ; absence d'un test r?ellement effectu? sur Safari et au lecteur d'?cran, pas de mesure de LCP/CLS/INP ni de Lighthouse consign?e. Les conditions exactes d'adaptation (notamment CC BY-SA 4.0), cr?dits et qualit? de chaque photographie doivent ?tre rev?rifi?s humainement avant une publication. Maquette originale PNG au SHA `f775e6f3...` non archiv?e ; la copie re?ue (JPEG) reste une r?f?rence visuelle.
- **Risque technique/qualit? identifi? :** certaines photographies ont actuellement un seul JPEG responsive (march? 1,2 Mo, mortier, repas, Angkor) : envisager des variantes WebP/AVIF et `srcset` avant le gate final performance. L'importeur r?seau doit rester circonscrit ? la branche et ne jamais ?tre d?clench? automatiquement en production.

**Verdict honn?te au 13/10 : LOTS 1?5 D?VELOPP?S, CI/QA AUTOMATIS?E PASS ; R?CEPTION ARTISTIQUE = NON VALID?E ; D7 COMPLET (Safari, WCAG approfondie, perf/licences) = PARTIEL ; D8 (merge/d?ploiement) = NON AUTORIS?.** La planche de comparaison montre encore un ?cart photographique significatif, pas une reproduction exacte.

**Suite rationnelle :** ne pas multiplier les retouches de CSS ou les stickers ; retravailler prioritairement les deux sc?nes dont les m?dias principaux restent insuffisants (Amok et desserts), homog?n?iser la tabl?e, optimiser les formats d'image et r?aliser l'audit WCAG/performance ; revenir ? la maquette pour une **validation artistique humaine** avant toute promotion de la V17.


### 13 octobre 2026 ? Reprise post-retour utilisateur : correction photographique cibl?e et PR consolid?es

- **PR #45 cl?tur?e SANS FUSION**, car prototype V17 historiquement rejet?. PR ouvertes maintenant : [#46 documentation](https://github.com/roro78/cuisine-cambodgienne/pull/46) et [#47 accueil](https://github.com/roro78/cuisine-cambodgienne/pull/47). Les deux restent non fusionn?es et la production V16 n'est pas modifi?e.
- **Diagnostic fondamental confirm?** : la maquette transmise est une composition aplatie ; les photographies exactes qui ont servi ? son montage ne sont pas disponibles s?par?ment comme fichiers sources. Un r?sultat identique ne peut donc pas ?tre garanti par simple remplacement CSS. N'int?grer que des photos r?elles ? provenance contr?l?e. Des candidats Commons ont ?t? examin?s et **refus?s** visuellement (Amok en noix de coco, assortiment de douceurs emball?es, Amok en casserole) ; aucun de ces candidats n'a ?t? s?lectionn? comme image h?ro ou dessert affich?e.
- **PR #47 commits cibl?s** : [`3d78ca27`](https://github.com/roro78/cuisine-cambodgienne/commit/3d78ca27bb7da8e0a210c002010c3b3c164bdf9d) rapproche le cadrage du plat principal (moins de riz visible) et renforce les volumes des ingr?dients et desserts sans nouveaux stickers ; [`ee63b4f2`](https://github.com/roro78/cuisine-cambodgienne/commit/ee63b4f2f32ff406c3895a6a8f962dffa11dbd2d) harmonise la motion GSAP au nouveau cadrage.
- **Importeur fiabilis?** : saute les m?dias d?j? acquis pour ?viter des mises ? jour non intentionnelles. Un double lancement a provoqu? un push non-fast-forward refus? (pas de force-push) ; une ex?cution ult?rieure est pass?e. **? nettoyer avant merge :** fichiers candidats non utilis?s et d?clencheur d'import automatique ? d?sactiver apr?s sourcing final.
- **Contr?le en cours** : [CI #38434784883](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38434784883) d?marr?e sur `ee63b4f2` ; captures du nouvel ?tat et test de chevauchement du h?ro **? r?ceptionner apr?s ex?cution**. Aucune r?ussite pr?sum?e, aucune validation artistique accord?e.
- **Prochaine action** : inspecter 1440/390 en comparaison directe ? la maquette, corriger d'abord les d?fauts r?els apparus, retirer les m?dias rejet?s du d?p?t et finaliser la recette visuelle des sept sc?nes. Maintenir l'interdiction de merge et de d?ploiement OVH jusqu'? validation du commanditaire.


### 13 octobre 2026 ? Lot de fid?lit? D5.3 : r?ception technique et visuelle interm?diaire

- **P?rim?tre** : PR [#47](https://github.com/roro78/cuisine-cambodgienne/pull/47), branche `feat/v17-accueil-reconstruction`, dernier commit [`5941782e3e64be3510929d921eedec3a9382c31a`](https://github.com/roro78/cuisine-cambodgienne/commit/5941782e3e64be3510929d921eedec3a9382c31a). Aucun merge ni d?ploiement, V16 inchang?e. **PR #45 ferm?e sans fusion** ; PR #46 et #47 restent ouvertes.
- **Photos candidates** : des fichiers Wikimedia Commons contr?l?s ont ?t? t?l?charg?s ? titre d'examen, puis les deux photos d'Amok alternatives et une photographie de douceurs emball?es **?cart?es du rendu** car non conformes ? l'impact photographique attendu. Le code Astro continue de r?f?rencer la photographie r?elle `v17-amok-rice-1920.jpg` ; la s?lection photo parfaite reste ouverte.
- **Modifications effectives** : `3d78ca27` : cadrage nettement plus serr? de l'Amok pour r?duire le poids visuel du riz, photographies et illustrations d'ingr?dients plus amples, dessert plus g?n?reux sur desktop ; `ee63b4f2` : mouvement GSAP synchronis? avec les nouveaux cadrages ; `5941782e` : carte d'appoint du march? repositionn?e en tablette pour rester dans sa photo.
- **Tests r?ellement ex?cut?s** : [CI #38434784883 FAIL](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38434784883), d?faut de 4 px de la carte de march? ? 768 px (test de confinement pr?cis, aucun assouplissement artificiel). Correctif sur `5941782e`, puis [**CI #38435337599 SUCCESS**](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38435337599), incluant Astro check/build, recettes/ateliers et non-r?gressions historiques, Chromium 320/360/390/430/768/1024/1440, lazy-loaded images, clavier/menu, mode sans JS et `prefers-reduced-motion`. Artifact `v17-accueil-d7-browser-evidence`, ID `11833310918` : **7 vraies captures compl?tes et 2 vid?os WebM du scrolling**, r?cup?r?es et v?rifi?es.
- **Preuve visuelle** : planche avant/apr?s du premier ?cran cr??e depuis les captures Chrome, et captures compl?tes desktop/mobile conserv?es ; l'Amok est d?sormais plus central, mais la photographie, les illustrations, l'ambiance des desserts et la tabl?e restent **sensiblement diff?rentes** de la maquette ma?tresse.
- **Verdict** : **PASS TECHNIQUE du lot D5.3** ; **R?CEPTION ARTISTIQUE = NON VALID?E** ; D7 complet (Lighthouse/Safari/WCAG avanc?e, licence de chaque d?riv?) en attente ; aucun passage ? D8.
- **Nettoyage n?cessaire avant fusion future** : suppression des assets candidats non utilis?s et d?sactivation de l'importeur automatique apr?s fin du sourcing ; all?ger les surcharges CSS r?p?t?es, r??valuer le poids des images pour les mobiles.


### 13 octobre 2026 ? D5.4 autonome ici : photographie desserts et nettoyage

**D?cision du client :** poursuivre les corrections V17 directement avec l'assistant ici, sans passer par l'IDE local et sans ouvrir de nouveau chantier ou PR.

**Livraison sur [PR #47](https://github.com/roro78/cuisine-cambodgienne/pull/47)**, HEAD `075a54f6005b517c9471a9c8a2cb4d0b7fc50235` :
- `1547aa53` : remplacement de la photo principale de dessert peu valorisante (Chek Ktis dans un bol) par une photo de Num Plae Ai **document?e comme cambodgienne** (Hyzuko, CC BY-SA 4.0), l?gendes et cr?dits exacts, vraie route Chek Ktis conserv?e pour le CTA.
- `b3bee58a` : composition ?ditoriale dessert plus g?n?reuse sur desktop/tablette et mobile, photo principale sur feuille de bananier, Num Kom en contrepoint, botanique d'accompagnement.
- `a058121e` / `178d4f86` / `f2af06a53` / `4cb7b727` / `7565752e` : suppression des trois photos rejet?es et de l'import automatis? associ?, sans effet sur les quatre photographies utiles pr?c?demment sourc?es.
- `158b8c25` : suppression d'une constante Astro devenue inutilis?e.
- `2da7cb2e` : test contractuel explicite sur le fichier Num Plae Ai, le cr?dit Hyzuko CC BY-SA 4.0 et l'absence de r?f?rences ? des images rejet?es.
- `075a54f6` : correction des deux l?gendes coup?es par les arrondis, d?tect?e ? l'examen d'une vraie capture desktop.

**Validation v?rifi?e :** [CI #38439231403 SUCCESS](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38439231403), 7 captures navigateur (320/360/390/430/768/1024/1440 px) + deux vid?os WebM scroll 390/1440, artifact `v17-accueil-d7-browser-evidence` ID `11833859469`. Captures 1440/390 examin?es, avant/apr?s dessert r?alis? directement ? partir des captures r?elles, l?gendes d?sormais lisibles. Revue de diff PR #47 : ni `src/pages/index.astro`, ni les composants partag?s `SiteHeader/SiteFooter`, ni le workflow OVH n'ont ?t? modifi?s.

**Verdict : PASS TECHNIQUE DU LOT / ?VOLUTION VISUELLE CONSTAT?E / R?CEPTION ARTISTIQUE COMPL?TE TOUJOURS NON VALID?E.** Le r?sultat n'est pas une reproduction photo identique de la planche. Prochaine priorit? artistique : hero Amok, desserts plus proches encore de la composition, finale et tabl?e ; ensuite optimiser CSS (surcharges historiques ~55 Ko), LCP/CLS/images et contr?ler Safari/accessibilit?/attributions avant D8. **Interdiction maintenue : merge, d?ploiement OVH, modification V16.**
### 13 octobre 2026 ? D5.5 : hero monumental et tableau desserts int?gr?

- **Livraison applicative :** commit [`3db9dff4`](https://github.com/roro78/cuisine-cambodgienne/commit/3db9dff408037d7512b9b90fb882160b3e22c700) sur la PR [#47](https://github.com/roro78/cuisine-cambodgienne/pull/47), toujours draft et non fusionn?e. La photo Amok devient un plan monumental ? masque asym?trique, sans ellipse ; la sc?ne desserts devient un tableau unique, domin? par Num Plae Ai avec Num Kom imbriqu? sans bordure de carte.
- **D?cision m?dia :** aucun nouveau fichier photographique int?gr?. Deux nouvelles pistes Commons (Amok trey ? Phnom Penh et Amok servi dans une noix de coco) ont ?t? v?rifi?es puis refus?es apr?s comparaison visuelle ; la photographie `v17-amok-rice-1920.jpg`, plus gourmande et d?j? document?e CC0, est conserv?e.
- **Preuves locales r?elles :** captures compl?tes avant/apr?s ? 320, 360, 390, 430, 768, 1024 et 1440 px, vid?os de scroll ? 390/1440 et comparatifs cibl?s hero/desserts. Contr?les PASS : contrat V17, Astro check/build, suites historiques, smoke Chromium V17 multi-largeurs, reduced-motion, sans JavaScript et smoke navigateur des exp?riences.
- **Verdict :** am?lioration visuelle constat?e et lot techniquement pr?t pour r?ception artistique humaine. La fid?lit? exacte ? la maquette composite reste **PARTIELLE** ; le PNG ma?tre canonique n'est toujours pas archiv?. Aucun merge, d?ploiement ou changement V16 autoris? ou effectu?.
**Cl?ture CI D5.5 :** la premi?re ex?cution distante sur `3db9dff4` a d?tect? sous Linux un contact de 1,55 px entre le premier mot du titre et le cadre photo ? 1440 px. L'assertion n'a pas ?t? affaiblie : le cadre a ?t? d?cal? de 8?12 px dans [`0fa91987`](https://github.com/roro78/cuisine-cambodgienne/commit/0fa919870e2da06d51ee5dc6092be940c54a42c8). Le smoke multi-largeurs a repass? localement, puis [GitHub Actions #38453574484](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38453574484) a termin? **SUCCESS** sur le HEAD exact `0fa919870e2da06d51ee5dc6092be940c54a42c8`.

### 13 octobre 2026 — D5.6 — révision ciblée hero / table et preuves par section

**Demande utilisateur :** continuer le chantier directement ici sur la PR #47, sans nouveau prompt IDE, sans nouvelle PR, sans merge ni déploiement tant que la réception artistique n'a pas été faite.

**Implémentation réelle sur [PR #47](https://github.com/roro78/cuisine-cambodgienne/pull/47)**, HEAD `67c777269e145ec798038296e2d02abc8d12d9f4` :
- **Hero Amok** : le découpage photographique polygonal a été remplacé par un masque progressif sur desktop/tablette/mobile afin de fondre la photo dans le papier crème, puis son cadrage GSAP a été resserré et l'annotation manuscrite « Amok Trey » repositionnée pour ne plus être coupée.
- **Scène À table** : l'assemblage discordant « table quasi vide + assiette ovale flottante » a été retiré. La photographie réelle de l'assortiment khmer `v17-khmer-table-1280.webp` (Jason Eppink, CC BY 2.0, déjà présente et sourcée) est dorénavant le fond plein cadre. Texte central avec voile de contraste gradué. L'ancienne référence Bahnfrend non affichée a été supprimée des crédits de preview ; pas d'allégation d'une photographie créée par l'équipe.
- **Nettoyage code / garde-fous** : retrait de la timeline GSAP de l'assiette incrustée, suppression des anciens contrats du montage, assertion navigateur sur la présence d'une **seule photo immersive** sans inset, prise de six captures ciblées supplémentaires `{1440,390} × {hero,table,dessert}` dans les preuves CI.
- **Tests réellement effectués** : premier run [#38457650516 FAIL](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38457650516) : ancienne assertion exigeait un `clip-path` différent de `none`, désormais corrigée pour accepter un `mask-image` réel tout en conservant les contraintes de ratio, taille et absence de contact du H1. [#38457858228 SUCCESS](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38457858228) puis [**#38458930660 SUCCESS**](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38458930660) sur dernier SHA après ajustement du cadrage. La CI exécute build, contrats anciens, Chromium 320/360/390/430/768/1024/1440, noJS, reduced motion, menu mobile, captures complètes et deux vidéos scroll.
- **Preuves récupérées et inspectées** : artifact du run #38458930660 `v17-accueil-d7-browser-evidence` ID `11843874652`, 13 PNG (7 fullpage + 6 scènes) et 2 WebM. Une planche avant/après et storyboard original avec les scènes hero/table a été produite à partir des véritables captures.
- **Réception artistique** : **AMÉLIORATION CONFIRMÉE, MAIS NON CONFORMITÉ EXACTE À LA MAQUETTE**. Le hero reste une photo documentaire de vrai Amok, avec une nappe et du riz ; les aliments et l'intégration florale ne reproduisent pas la scène composée de la maquette. La tablée est plus gourmande et cohérente, mais son cadrage/photo reste différent de la grande table de plats. Les desserts sont inchangés dans ce lot ; la variante reste un tableau photographique, pas le montage original. Ne pas déclarer le design achevé ou approuvé par le propriétaire.
- **À faire avant D8** : comparatif artistique approfondi des autres scènes, révision image hero/table si meilleur média autorisé, consolidation du CSS V17 (~62 ko de règles itératives), audits Safari/lecteur d'écran et performance/LCP/CLS, vérification des dérivés et crédits BY-SA et migration contrôlée de la route preview vers `/`. **Aucune production modifiée.**


### 13 octobre 2026 — livraison du lot images IA réellement intégrées

**État final vérifiable : cinq illustrations IA WebP PHYSIQUEMENT PRÉSENTES ET AFFICHÉES** dans le dépôt et la preview V17. Commit objets binaires `0abb8b962b00b8fbe520666299fa3e1f54894c20`; dernier commit testé `b8b7e635043a23ccb65140404c93fb71cf39b2f5`. [CI #38465721313 SUCCESS](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38465721313). Se référer au manifeste média mis à jour pour les cinq chemins, dimensions, tailles et déclarations de provenance.

**Travail effectif** :
- Remplacement du héros photographique par la composition générée Amok Trey. CSS dédié `v17-generated-media.css`, image WebP servie localement (pas de CDN), GSAP adapté aux proportions et `prefers-reduced-motion`.
- Remplacement de la table documentaire par le visuel IA de festin convivial en pleine largeur ; rappel explicite du caractère illustratif.
- Remplacement des deux vignettes desserts par la composition générée unique mangue/riz gluant/coco, accessible avec alt et légende.
- Mise en image des recettes Lok Lak et Num Banh Chok (fiche et grille). L'image Num Banh Chok manquait auparavant ; les nouvelles images évitent les variantes `srcset` inexistantes.
- Adaptation des tests V17 et des mentions de crédits, conservation des photos documentaires pour les scènes restantes.

**QA** : tests CI PASS, Chromium 7 largeurs 320, 360, 390, 430, 768, 1024, 1440, sans JS et mouvement réduit ; téléchargements 7 captures complètes, 6 captures ciblées (hero, table, dessert en desktop/mobile) et 2 vidéos WebM (artifact `11848322729`). Captures desktop/mobile du hero, repas et desserts inspectées : images réellement présentes et chargées.

**Décision** : `PR47 = DRAFT, CI PASS, VISUELS INTÉGRÉS`. **La réception artistique complète, Safari, a11y/performance et la migration de la preview vers `/` restent à clôturer avant toute production.** PR46 = documentation, PR47 = développement. Aucun merge ni déploiement OVH ; site V16 en place inchangé.
