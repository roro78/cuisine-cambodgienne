# Carnets du Cambodge — M1 : inventaire, risques et sept briefs proposés

> Date de l'audit : **22 octobre 2026**. État : **7 fiches préparées — À VALIDER (aucun article modifié)**.
>
> Référentiel : [plan de pilotage](./PLAN-REFONTE-CARNETS.md).
> Baseline du code : branche main, commit **d18b1e7c1b4a3e52199108412b71863954fe7910** ; source éditoriale **src/data/culture.ts** (blob **1fc61e41f79afc7c342af4aa63c550f16380ea90**) ; routes **src/pages/culture/index.astro** et **src/pages/culture/[slug].astro**.
>
> Méthode : lecture des données Astro, des modèles de pages, de la photothèque/crédits et des redirections ; confrontation ponctuelle des références officielles en ligne. **Ce n'est ni un audit photographique binaire, ni une validation de toutes les affirmations, ni un test en production.**
>
> Protection : URLs, textes, images, redirections et données Culture d'origine **inchangés**. Les orientations ci-dessous sont des **propositions soumises au propriétaire**, et non des contenus approuvés.

> **Complément documentaire et correction P0 — 22/10/2026** : voir le [registre de preuves et arbitrages M2](./REGISTRE-SOURCES-DECISIONS-M2-2026-10-22.md). L'article C01 doit indiquer que le prix **World's Best Rice 2025 a été partagé avec le Vietnam (ST25)** : cette précision manque au texte actuel. La page AKP 2026 mentionne effectivement Phka Rumduol dans son corps, bien qu'elle porte d'abord sur les exportations de riz de 2025. La qualification « Ministère du Tourisme » de l'ancienne URL commune C02–C07 **ne doit plus être considérée comme une attribution officielle actuelle vérifiée**. Ces constats sont documentaires, **aucun texte publié n'a été corrigé**.
>
## A. Inventaire technique et SEO : constat au commit de référence

| ID | URL canonique : préfixe /culture/ et suffixe / | Sections H2 | Texte approx. (intro + paragraphes) | Durée affichée | Photo de tête | Sources déclarées | Gabarit de liens associés |
| --- | --- | ---: | ---: | --- | --- | ---: | --- |
| C01 | le-riz-symbole-de-vie-au-cambodge | 7 | 998 mots | 9 min | Wikimedia Commons externe ; galerie de 3 photos Commons | 5 | Recettes + glossaire + renvoi atelier conditionnel |
| C02 | poivre-de-kampot | 3 | 238 mots | 6 min | locale kampot-1600.webp | 2 | Ingrédient poivre + recette lok lak |
| C03 | comprendre-le-kroeung | 3 | 213 mots | 6 min | locale kroeung-1600.webp | 1 | Ingrédient kroeung + recettes kroeung jaune et amok |
| C04 | comprendre-amok | 3 | 175 mots | 5 min | locale amok-alt-1600.webp | 1 | Recette amok + ingrédient kroeung |
| C05 | kep-marche-crabe-poivre | 3 | 192 mots | 5 min | locale kep-market-1600.webp | 2 | Ingrédient poivre + recette lok lak |
| C06 | prahok-fermentation-umami | 3 | 180 mots | 5 min | locale prahok-1600.webp | 1 | Ingrédients prahok + kroeung |
| C07 | construire-repas-cambodgien | 3 | 192 mots | 5 min | locale v17-table-meal-1600.jpg | 1 | Recettes amok, lok lak, kroeung jaune |

**Comment lire ces chiffres :** comptage du texte visible depuis les champs intro et paragraphs, sans sources, titres ni chrome ; estimation de lecture à **220 mots/minute**, non test utilisateur : C01 ~5 min ; C02 ~2 min ; C03–C07 ~1 min. Cela **suggère** une surestimation systématique des champs readingTime ; mesurer selon la méthode éditoriale validée avant modification.

Contrôles statiques :
- **7 slugs distincts**, générés automatiquement par getStaticPaths ; un H1 est rendu pour chaque article, à partir du titre du catalogue ; SEO description spécifique et schémas Article/BreadcrumbList définis par le gabarit. **Le rendu HTML, les en-têtes HTTP, le sitemap construit et la validité enrichie Google restent à tester au gate technique.**
- **6/6 photos principales locales trouvées** dans l'arbre Git de main ; la photo principale du riz est externe et possède une page de provenance Commons identifiable ; la galerie du riz contient **3 photos** avec crédit et lien de licence dans le gabarit.
- Les liens associés sont générés dans le gabarit depuis les catalogues recettes et ingrédients, dont les slugs principaux consultés sont présents en source. **Les sorties HTTP 200 de toutes les cibles n'ont pas été contrôlées**. Aucune navigation directe **entre deux Carnets** ne figure dans ce gabarit.
- La rubrique /culture/ possède actuellement **4 « moments »** (réveil, marché, mortier, table) — et non 4 catégories éditoriales ; **C05 Kep est explicitement le carnet à la une**. Une grille reprend les autres articles. Ne pas confondre « moments » et univers de classement.
- La **301 historique de /le-riz-symbole-de-vie-au-cambodge/** vers /culture/le-riz-symbole-de-vie-au-cambodge/ est toujours présente dans **public/.htaccess** sur main : à conserver et à revérifier à la livraison.
- Les crédits des photographies sont centralisés dans **src/pages/credits-photos.astro**. Pour les photos locales, **le fichier existe** et une attribution peut être décrite par la page de crédits ; **l'identité visuelle réelle et la concordance fichier/source/licence ne sont pas attestées par le contrôle de présence**.

### Références explorées le 22/10/2026 : état exact

| Référence | Usage actuel | Résultat de consultation | Réserve |
| --- | --- | --- | --- |
| FAO — Hand-in-Hand Cambodge, https://www.fao.org/hand-in-hand/previous-editions/hih-IF-2024/cambodia/en | C01 agriculture/riz | Contenu accessible, décrit le riz comme filière agricole prioritaire | Données datées : éviter chiffres non contextualisés |
| FAO — Cambodia at a glance, https://www.fao.org/cambodia/our-office/cambodia-at-a-glance/en | C01 agriculture | Contenu accessible | Présente des données macro non nécessairement récentes ; ne pas en extrapoler une statistique 2026 |
| AKP, 09/11/2025, https://www.akp.gov.kh/fr/post/detail/352733 | C01 concours du riz 2025 | Contenu accessible ; confirme 2025 et le décompte de 7 titres déclaré par AKP | Source nationale à attribuer ; ne pas interpréter comme palmarès permanent |
| AKP, 05/01/2026, https://akp.gov.kh/fr/post/detail/358182 | C01 filière riz | Contenu accessible sur exportations 2025 | Titre du lien dans le catalogue parle de Phka Rumduol ; **la pertinence exacte de ce titre doit être corrigée ou étayée** |
| OMPI/WIPO, https://www.wipo.int/fr/web/lisbon-system/w/news/2021/news_0001 | C02 et C05 IG poivre | Contenu accessible : protection du poivre de Kampot et territoire Kampot/Kep | Ne démontre pas à lui seul les pratiques de récolte ni tous les profils organoleptiques |
| Guide gastronomique relayé par le ministère, https://tourismcambodia.org/public/index.php/official-activities/new-beginnings-a-gourmet-guide-to-cambodia | C02–C07, réutilisé **6 fois** | **Échec d'accès direct à l'URL lors du contrôle (404)** ; une version indexée reste consultable par moteur | **SOURCE À RÉPARER / REMPLACER** avant enrichissement ; source touristique/portrait, insuffisante seule pour toutes les assertions |
| UNESCO, https://ich.unesco.org/en/RL/tugging-rituals-and-games-01080 | C01 rituels rizicoles | Accès automatisé limité par protection anti-bot | **Non validée** comme preuve de la relation spécifique entre ambok et fête de l'Eau ; trouver source directement pertinente |
| Wikimedia Commons, https://commons.wikimedia.org/wiki/File:Cambodia%27s_rice_fields.jpg ; https://commons.wikimedia.org/wiki/File:Cambodian_farmers_planting_rice.jpg ; https://commons.wikimedia.org/wiki/File:Cambodia_rice.jpg ; https://commons.wikimedia.org/wiki/File:Ak_Ambok.jpg | C01 photo principale + trois illustrations | Pages de fichiers accessibles, indications de licence visibles (CC BY-SA 4.0, CC BY 2.0 suivant les fichiers) | Au visa médias : contrôler recadrages, attributions, versions de fichiers et liens des licences exactes |

**Baseline Search Console (O9) : NON COLLECTÉE.** Aucun accès/export GSC n'a été fourni par ce périmètre d'audit ; sans données, ne pas inventer impressions, clics, CTR ou classements. Obtenir export daté par page et requête sur période de 28 jours comparable **avant publication**, puis J+28/J+90.

## B. Sept fiches d'orientation éditoriale à valider

### C01 — Le riz au cœur de la vie cambodgienne (Vie quotidienne)

**URL préservée :** /culture/le-riz-symbole-de-vie-au-cambodge/  
**Existant :** 7 sections sur vie quotidienne, petits déjeuners, travail des rizières, types de riz, distinction 2025, fêtes et découverte gustative. C'est déjà le plus complet ; pas de réécriture totale justifiée.
**Question du lecteur :** comment le riz relie-t-il alimentation, agriculture, fêtes et économie des familles ?  
**Plan proposé (7 sections) :** (1) un bol au fil de la journée ; (2) diversité des plats et textures ; (3) saisons, eau et travail des rizières ; (4) variétés/Phka Rumduol/Malys Angkor : terminologie rigoureuse ; (5) portée réelle du prix de 2025 ; (6) fêtes et ambok avec source directe ; (7) poursuivre la découverte sans transformer ce Carnet en recette.
**Preuves/gates :** vérifier concours, noms de variétés, lien entre ambok et fête, description de l'agriculture ; recadrage et licence des 4 images ; relire le lien atelier à l'aune de l'état courant des six ateliers.
**Maillage candidat :** C07 repas partagé ; N01 petits déjeuners après publication ; glossaire riz ; recette bai sach chrouk. Ne jamais lier une page non encore créée.
**Décision suggérée :** **conserver l'essentiel**, consolider références et photographies avant de changer le texte.

### C02 — Le poivre de Kampot, de la plantation à la table (Terroirs et marchés)

**URL préservée :** /culture/poivre-de-kampot/  
**Existant :** 3 sections sur IG, types de poivres et association avec Kep ; photo locale de grappes ; 2 sources. Très proche d'une fiche ingrédient.
**Question du lecteur :** que protège exactement le nom « poivre de Kampot » et quel travail distingue ce terroir ?
**Plan proposé (6 sections) :** (1) où sont Kampot et Kep ; (2) géographie et producteurs ; (3) récolte/maturité **à documenter** ; (4) tri/séchage et travail en exploitation **à documenter** ; (5) origine protégée, cahier des charges, contrôles et lutte contre la fraude ; (6) usages culinaires et liens utiles.
**Preuves/gates :** texte OMPI pour IG ; organisme IG/indication locale pour cahier des charges et récoltes ; ne pas inventer rencontre ni citation de producteur.
**Maillage candidat :** C05 Kep, fiche ingrédient poivre, recette lok lak.
**Médias :** image locale existante ; prioriser série réelle plante → récolte → tri → grains, chaque vue créditée.
**Décision suggérée :** recentrer sur le terroir et éviter de dupliquer un lexique des couleurs.

### C03 — Le kroeung, une mémoire de la cuisine khmère (nouvelle orientation du propriétaire)

**URL préservée :** /culture/comprendre-le-kroeung/  
**Décision :** la première proposition (mortier, ingrédients, geste, suite à l'atelier) faisait **doublon**. Elle est **abandonnée et remplacée**, même si les sept orientations avaient été globalement acceptées au départ.  
**Question culturelle seule :** comment une préparation du répertoire khmer peut-elle devenir un repère de mémoire et de transmission dans l'histoire récente, notamment pour des familles déplacées et la diaspora ?  
**Plan corrigé (5 sections) :** (1) place dans la culture culinaire ; (2) origines non datées, refus d'une fausse chronologie angkorienne ; (3) ruptures du XXe siècle ; (4) récits singuliers de diaspora et de mémoire ; (5) documentation actuelle sans figer une « recette authentique ».
**Références internes à vérifier :** Tenement Museum (récit contemporain de la diaspora ciblant le kroeung), Mekong Review 2018 (histoire récente), Journal of Ethnic Foods 2019 (rôle du kroeung), analyse du lexique ancien par Saveros Pou 1992 (**ne date pas l'invention**).
**Interdits dans la page publique :** dosage, noms détaillés d'aromates, pilage, texture, guide pas à pas, suggestion de recette ou d'atelier, sources visibles et « tradition datant d'Angkor » sans preuve.
**Médias :** l'ancien visuel `kroeung-1600.webp` illustre un plat et non l'histoire ; le visuel mortier est retiré car il reproduisait l'Atelier. **Chercher une photographie contextualisée et dont les droits sont vérifiés**, sans inventer un portrait de famille.
**Statut :** brouillon culturel v2 préparé en PR #102, **non validé et non publié**. Si le dossier de preuves ne soutient pas suffisamment une histoire distincte, **supprimer cette entrée de la sélection Culture** plutôt que revenir à un tutoriel.

### C04 — L'amok, un plat et ses interprétations (Gestes et transmission)

**URL préservée :** /culture/comprendre-amok/  
**Existant :** 3 sections centrées sur texture, vapeur, gestes de cuisson ; 1 source générale, photo locale verticale.
**Question du lecteur :** comment l'amok est-il servi et interprété, selon les sources et les contextes, au-delà de sa recette ?
**Plan proposé (6 sections) :** (1) ce que recouvre « amok » ; (2) places et modes de service documentés ; (3) aromates, coco, feuilles et contenants ; (4) variations attestées ; (5) tradition et représentations contemporaines avec prudence historique ; (6) retrouver la recette/atelier.
**Preuves/gates :** ne pas affirmer une origine royale unique sans étude solide ; vérifier composition et service selon témoignages identifiés.
**Maillage candidat :** C03, recette amok trei et glossaire amok.
**Médias :** photo actuelle à confronter à la variante décrite ; photos documentaires de service si droits suffisants.
**Décision suggérée :** transférer les détails de cuisson à la recette plutôt que les réécrire dans un deuxième tutoriel.

### C05 — Kep, le marché, le crabe et le poivre (Terroirs et marchés)

**URL préservée :** /culture/kep-marche-crabe-poivre/  
**Existant :** 3 sections vagues sur marché, association crabe/poivre, « leçons de cuisine » ; 2 sources ; photo locale du marché ; article actuellement mis « à la une ».
**Question du lecteur :** pourquoi l'association crabe et poivre raconte-t-elle un lieu précis, entre pêche, marché et arrière-pays ?
**Plan proposé (6 sections) :** (1) localisation de Kep ; (2) pêche et arrivages, faits recoupés ; (3) marché et vente des crabes ; (4) lien territorial avec le poivre de Kampot ; (5) plats et pratiques décrits dans des sources attribuées ; (6) autres lectures et plats.
**Preuves/gates :** photos datées/localisées, dénominations de crabes validées, aucun présent de reportage à la première personne, pas de prix ou d'horaires inventés.
**Maillage candidat :** C02, fiche poivre, recette adaptée documentée si elle existe réellement (pas créer un faux lien crabe).
**Médias :** contrôler la provenance du fichier local et compléter par des vues de marché sous licence.
**Décision suggérée :** potentiel très bon pour un vrai Carnet, **mais refuser les scènes inventées**.

### C06 — Prahok : conservation et mémoire culinaire (Gestes et transmission)

**URL préservée :** /culture/prahok-fermentation-umami/  
**Existant :** 3 sections sur odeur, umami, dosage, accompagnements ; 1 source ; visuel local « prahok ktis » (préparation précise).
**Question du lecteur :** comment un condiment issu de la transformation du poisson a-t-il pris place dans l'alimentation et la mémoire culinaire ?
**Plan proposé (6 sections) :** (1) nom, produit et distinction avec plats à base de prahok ; (2) ressource halieutique et saisonnalité ; (3) histoire de conservation à documenter ; (4) usages régionaux/familiaux sans règle universelle ; (5) saveurs et accompagnements ; (6) sécurité et pistes de lecture.
**Preuves/gates :** publications FAO/recherche pêche et transformation, vocabulaire précis ; **aucun protocole de fermentation domestique non validé**, ni conseils de dégustation risqués.
**Maillage candidat :** fiche prahok, C07 ; atelier uniquement s'il traite réellement d'un geste pertinent.
**Médias :** ne pas faire passer une photo de prahok ktis pour une preuve visuelle du produit brut.
**Décision suggérée :** priorité fact-check + sécurité avant recherche de longueur.

### C07 — À table au Cambodge : le repas partagé (Vie quotidienne)

**URL préservée :** /culture/construire-repas-cambodgien/  
**Existant :** 3 sections « rôle du riz », associations de goûts et composition maison ; une source touristique ; photo locale de table.
**Question du lecteur :** comment s'organise une table cambodgienne selon les lieux, moments, familles et convives ?
**Plan proposé (6 sections) :** (1) diversité des habitudes selon les foyers ; (2) place du riz ; (3) plats partagés, soupe et accompagnements ; (4) gestes et service à table ; (5) différences quotidiennes/fêtes, ville/campagne ; (6) poursuivre avec recette ou atelier de composition.
**Preuves/gates :** sources ethnographiques ou récits attribués ; éviter les formules « tous les Cambodgiens… » ; distinguer observation documentée et conseil contemporain.
**Maillage candidat :** C01, N01 seulement quand publié, recette amok et atelier du repas.
**Médias :** contrôler que la photo représente précisément les plats nommés.
**Décision suggérée :** rendre la dimension culturelle centrale, laisser la composition pratique à l'atelier.

## C. Écarts transversaux, classement et recommandations pour M2

| Sévérité | Écart démontré ou limite | Action avant passage |
| --- | --- | --- |
| **P1** | Guide touristique commun C02–C07 non résolu en accès direct ; source unique pour C03, C04, C06, C07 | Réparer l'URL ; diversifier vers sources primaires/études, vérifier chaque affirmation sensible |
| **P1** | 6 textes d'environ 175–238 mots pour des durées de 5–6 min | Redéfinir les angles, enrichir seulement sur preuve ; recalculer la durée |
| **P1** | Textes C03/C04/C06 proches d'un tutoriel ou d'une fiche d'ingrédient | Séparer Culture, Recettes, Glossaire et Ateliers |
| **P1** | GSC absente et UX réelle non testée | Obtenir une référence chiffrée GSC avant toute publication ; tester navigateur à M4/M6 |
| **P1** | Droits et concordance des six héros locaux pas contrôlés jusqu'aux fichiers d'origine | Visa médias avant réutilisation, modification ou nouvelle galerie |
| **P2** | Aucune navigation directe entre Carnets dans le gabarit individuel | Préparer des liens contextuels après validation |
| **P2** | Index avec quatre « moments » mais sans quatre univers | Prévoir univers au jalon M4, après validation de maquette D2 |
| **P2** | Citation UNESCO ne prouve pas à elle seule ambok/Bon Om Touk ; titre AKP 2026 imprécis | Corriger/compléter après recoupement documentaire |
| **P2** | Poivre de Kampot et Kep partagent un thème | C02 = terroir/producteurs/IG ; C05 = marché littoral/crabe, sans duplications |

**Répartition cible proposée (sans modification du catalogue) :**
- Vie quotidienne : C01, C07 ; plus tard N01 petits déjeuners.
- Terroirs et marchés : C02, C05 ; plus tard N02 Tonlé Sap et N04 sucre de palme.
- Gestes et transmission : C03, C04, C06.
- Fêtes et traditions : **aucun des sept existants** (ne pas inventer un article juste pour remplir un filtre) ; N03 desserts à classer ici **uniquement si son angle porte réellement sur rites/fêtes**. Sinon revoir la taxonomie à M2.

**Proposition de séquence M3 après validation :** lot A C01+C07 (quotidien), lot B C02+C05 (terroir), lot C C03+C04+C06 (gestes), sans chevauchement avec les autres chantiers ; chaque lot fait l'objet de diff et de visa.

## D. Gate M1, preuves et limites

- [x] 7/7 slugs, H1 par gabarit, descriptions, rubriques, sources déclarées et médias identifiés **dans le code**
- [x] 7/7 briefs proposant une question, un plan, les preuves à chercher et le maillage
- [x] Risques éditoriaux, droits, liens, SEO et sécurité consignés
- [x] Collisions GitHub : **9 PR ouvertes examinées, aucune ne modifie les fichiers Carnets ciblés** à la date du contrôle
- [x] Textes historiques et autres produits laissés inchangés
- [ ] Avis du propriétaire sur les 7 orientations, titres et priorités (D1 — obligatoire avant M3)
- [ ] Validation externe complète des faits/médias, export GSC, HTTP/sitemap, contrôles responsive et tests : **non réalisés**, gates ultérieurs ou dépendance avant publication

**Conclusion : M1 (production des livrables) terminé, statut de réception « À valider » ; M2 non franchi.** L'absence de GSC ne prouve ni performance ni absence de trafic. Aucune création de nouveau Carnet, aucun changement d'UI et aucune publication ne sont autorisés par ce document.

## E. Prochain geste

Soumettre les sept briefs au propriétaire (D1), confirmer le modèle et la taxonomie (M2), rechercher/remplacer les sources insuffisantes, obtenir si possible l'export Search Console avant la première mise en production. Après décision, ouvrir des petits lots sur des branches Carnets distinctes ; **ne jamais fusionner/déployer OVH implicitement**.
