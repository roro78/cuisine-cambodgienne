# V17 Accueil — D1 / MANIFESTE DES MÉDIAS ET ÉCARTS À LA MAQUETTE

**Mise à jour : 13 octobre 2026 · État D1 : INVENTAIRE PASS, SOURCING VISUEL INCOMPLET.**
**Maquette maître :** `voyage_culinaire_au_cambodge.png` (974 × 1615, SHA-256 `f775e6f3a483479f4a2d095406593d3d5dc354213b80d2a99839c6f23f4ddc71`). **Original conservé dans le livrable de conversation mais NON encore commité dans GitHub**, blocage de transfert binaire ; toute future branche de code doit d'abord sécuriser cet original.

## Photothèque réellement disponible dans `main`

Dossier `public/images/cuisine/` : huit familles réelles, les suffixes 480/800/1200/1600/2200 ne sont que des rendus responsive, **pas de nouveaux sujets**.

| Famille actuelle | Sujet attesté dans les crédits du site | Crédit déclaré dans `src/pages/credits-photos.astro` | Peut aider la V17 | Limite |
| --- | --- | --- | --- | --- |
| `amok-*` | Amok, poisson khmer | Ben Yapp — CC BY 2.0, Commons Fish Amok — Khmer specialty | Hero, si cadrage réellement compatible | Ne pas simuler un plat détouré généré à partir d’une autre photo |
| `amok-alt-*` | Amok Trey | MoonsMoon — CC BY 4.0, Commons Fish amok amok trei Khmer Cambodian food | Détail Amok hero | Plusieurs rendus sont **portraits**, voir ratio réel |
| `kep-market-*` | Marché au crabe de Kep | PsamatheM — CC BY-SA 4.0 | Scène marché au Cambodge | **Ne pas représenter comme marché flottant** ou Phnom Penh |
| `kampot-*` | Poivre de Kampot | Thalias — CC BY-SA 4.0 | Ingrédients | Objet unique, ne suffit pas à la palette complète |
| `kroeung-*` | Cha kroeung, plat cuisiné | Thomas Wanhoff — CC BY-SA 2.0 | Texture culinaire générique | **NE MONTRE PAS** une séquence de pilage au mortier : impossible de l'utiliser comme « vrai geste » |
| `lok-lak-*` | Lok Lak | Stefan Fussan — CC BY-SA 3.0 | Plats variés | Pas une photographie de table partagée |
| `tamarind-*` | Tamarin | Susan Slater — CC BY-SA 4.0 | Palette aromates | Une famille supplémentaire seulement |
| `prahok-*` | Prahok Ktis | Thomas Wanhoff — CC BY-SA 2.0 | Découverte culinaire | Ne pas assimiler à un dessert |

**Source interne :** [inventaire médias](./inventaire-medias-cuisine.md) et [crédits publics](../src/pages/credits-photos.astro). Les noms de fichiers ne prouvent pas seuls la nature d'un média ; toujours confronter photo, fiche Commons et légende.

## Sources historiques de la PR #45 : autorisation à revérifier avant réimport

L'ancien prototype contient des assets sourcés pour une maquette rejetée. **On ne réimporte aucun CSS/composant depuis #45**, mais la liste des photographies peut servir au **sourcing**, après revue licence, dimensions, cohérence et indépendance juridique :
- Wikimedia Commons `File:Chek_ktis.jpg` — attribution historique Marie / CC BY-SA 2.0.
- `File:Num_kom_sticky_rice_cake_Khmer_Cambodian_dessert.jpg` — attribution historique MoonsMoon / CC BY 4.0.
- `File:Galangal.jpg` — photographie de galanga **générique**, attribution historique Liza Daly / domaine public.
- `File:Red_Chili_Pepper_PNG.png` — piment transparent, attribution historique Spicy Anonymous / CC0.
- `File:Fish_Amok_with_Rice.jpg`, `File:Khmer_Borane_-_amazing_sampler_(8532779364).jpg` : exemples culinaires sources à requalifier.

Ces références doivent être revues sur Commons lors du sourcing final ; les licences copyleft (BY-SA) exigent un respect explicite des conditions, spécialement pour les transformations.

## Besoins par scène et niveau de préparation

| Scène | Média nécessaire pour une vraie fidélité | Statut | Repli autorisé dans PREVIEW |
| --- | --- | --- | --- |
| S0 — Amok | Photo détourée gastronomique majeure + feuillage/citron/piment | **PARTIEL** : amok réel disponible, composition maquette non disponible | vraie photo Amok dans un conteneur HTML clairement expérimental, sans reconstituer de plat documentaire fictif |
| S1 — Marché | Photo panoramique de marché cambodgien à énergie vivante | **PARTIEL** : marché de Kep présent, nature de la scène différente | vrai marché Kep avec légende « marché au crabe de Kep » exacte |
| S2 — Palette | Citronnelle, galanga, combava, piment, poivre, curcuma, photos détourées/illustrations | **PARTIEL** : Kampot, tamarin ; candidats Commons à vérifier | SVG botanique original explicitement illustratif + photos d'ingrédients identifiées |
| S3 — Gestes | Vraie prise de vue main + mortier + pâte kroeung/texture à différents moments | **BLOQUÉ MÉDIA** : aucune photo réelle du mortier dans main | carte illustrative de technique sans prétendre montrer l'acte photographié |
| S4 — Repas | Table cambodgienne authentique, plusieurs plats, image paysage | **BLOQUÉ MÉDIA** | photo légendée selon sujet réellement représenté, ou visuel de repérage non publié |
| S5 — Desserts | Chek Ktis réel + Num Kom + détail coco | **CANDIDATS SOURCÉS** dans la PR #45, non intégrés dans main | mention « images d'étude » jusqu'à vérification licences et crédits |
| S6 — Finale | Angkor Wat au coucher du soleil, photo vérifiée et créditée | **PHOTO RÉELLE ACQUISE** : Radek Kucharski, CC BY 2.0, 1600×900 | Contrôler la fidélité artistique et conserver son crédit lors du passage production |

## Livrables média à clôturer pour passer D1 intégralement

- [x] Maquette exacte contrôlée sur disque local et empreinte SHA-256 confirmée.
- [x] Huit familles de main inventoriées et licences existantes relevées.
- [x] Cartographie scène → image → déficit, sans inventer de photographie.
- [x] Bibliographie des candidats historiques #45 séparée du code rejeté.
- [ ] Original PNG stocké dans le dépôt GitHub avec sa vraie empreinte (transfert binaire requis ; **ne pas substituer un JPG optimisé** en prétendant que c’est l’original).
- [ ] Droits/qualité des candidats Commons revus et attestations enregistrées (date/source/licence/transformations/alt).
- [ ] Images fortes pour un vrai geste au mortier et une table partagée acquises légalement. La photo d'Angkor (Radek Kucharski, CC BY 2.0) est intégrée à la preview ; fidélité de son cadrage et respect final des conditions de licence encore à recevoir.
- [ ] Planche d'assets **réels** jugée assez proche de la maquette pour lancer les scènes photo.

**Gate :** D1 = PARTIAL (inventaire terminée, acquisition et dépôt maître non terminés). Cela permet de développer le squelette D2 avec placeholders identifiés, pas de déclarer l'intégration artistique finale conforme.

## Complément du 13 octobre 2026 — Nouvelle ressource finale D3

- `public/images/cuisine/v17-angkor-sunset-1600.jpg` (1600 × 900, JPEG, 571 521 octets) : [Angkor Wat Reflection (46810498612).jpg](https://commons.wikimedia.org/wiki/File:Angkor_Wat_Reflection_(46810498612).jpg).
- Auteur : **Radek Kucharski**, photographie **3 décembre 2015 à 17 h 16**, Angkor Wat au coucher du soleil.
- Licence : [Creative Commons Attribution 2.0 Generic](https://creativecommons.org/licenses/by/2.0/) ; source Commons revue et lien attribution sur la maquette publique.
- Transformation : version redimensionnée par l'API Commons, **recadrage responsive en CSS** pour la finale (pas de faux ciel ou silhouettes ajoutés).
- Usage : section finale de la route noindex `/v17-accueil-preview/`, **ne pas déployer avant revue générale**.

Les photos d'Amok, d'étal de fruits, de table khmère, Chek Ktis, Num Kom, galanga et piment ont également été reprises depuis les blobs médias sourcés de la PR #45 **sans aucun code ni style de cet ancien prototype**. Leur enregistrement des auteurs et licences est présent dans la prévisualisation, mais la validation finale des obligations de réutilisation et de dérivation reste un gate de publication.

Le média **mortier réel pendant le geste** manque toujours ; ne pas le remplacer par une photo non crédible de cuisine étrangère sous une légende cambodgienne.


### Reprise du 13 octobre 2026 — état des preuves

- Source maîtresse PNG : **introuvable dans les fichiers accessibles de la nouvelle session**, empreinte connue mais copie originale à fournir pour un contrôle visuel et archivage GitHub ; ne pas créer de substitut ni de maquette reconstruite.
- Photos de la preview : contrôles de chargement et de présence couverts par les recettes CI connues ; l'adéquation documentaire et les conditions de dérivation restent une **revue manuelle ouverte**.
- Mortier réel : **NON ACQUIS** ; conserver le repère illustratif honnête jusqu'à l'obtention d'un média fiable.
- Captures desktop/mobile de la CI du commit `1a56f628` effectivement récupérées, mais **ne prouvent pas l'équivalence avec l'original validé**.


### Planche visuelle reçue de nouveau — 13 octobre 2026

- **Copie exploitable :** fichier nommé `2399.png`, mais octets **JPEG** 926 × 1536 ; SHA-256 `fbe345f9984f3ba06bab438202de5afcadec37e0eca9608c0ebdc5be2a3316ff`. **Ne pas confondre** avec la maquette originale PNG 974 × 1615, SHA-256 `f775e6f3a483479f4a2d095406593d3d5dc354213b80d2a99839c6f23f4ddc71`. La comparaison visuelle avec la copie est autorisée, la comparaison d'empreinte canonique et l'archivage du maître demeurent ouverts.
- La planche composite montre des compositions culinaires idéalisées ; elle n'atteste pas les droits ni la provenance d'une image documentaire individuelle. **Ne pas extraire** directement ses morceaux en prétendant disposer des photographies réelles (marché, mortier, tablée, desserts).
- Reprise de comparaison : photographie héro Amok réelle mais cadrage différent, marché réel d'étal fixe, palette trop peu fournie, mortier actuellement illustré, tablée réelle moins lumineuse, desserts réels mais différents des arrangements générés, Angkor réel en ambiance diurne différente de la planche.
- **Aucun nouvel asset non sourcé introduit** dans le lot CSS `fac99b4` → `be7764f`. Les droits des fichiers Commons déjà présents devront être revalidés avant publication. La recherche d'une photographie du pilage khmer documenté demeure prioritaire.


### Sourcing complémentaire après refus artistique explicite — 13 octobre 2026

La copie transmise est une **référence de composition**. L'actuel assemblage de photos sur la PR #47 n'est toujours pas reçu. Les images ci-dessous sont uniquement des **pistes vérifiées sur leurs fiches Wikimedia Commons**, pas des médias intégrés ni des substitutions artistiques acceptées.

| Scène | Candidat réel | Auteur / statut déclaré sur Commons | Réception |
| --- | --- | --- | --- |
| Marché plus vivant | [Market in Cambodia.jpg](https://commons.wikimedia.org/wiki/File:Market_in_Cambodia.jpg), légumes à Phnom Penh | Justin Watt, œuvre placée dans le domaine public | **Candidat**, cadrage/dynamique artistique à comparer à la maquette |
| Marché avec présence humaine | [Market Woman in Kep Cambodia.JPG](https://commons.wikimedia.org/wiki/File:Market_Woman_in_Kep_Cambodia.JPG), femme au marché de Kep | Adam Jones, CC BY 3.0, attribution demandée explicitement | **Candidat**, contexte et licence à enregistrer dans les crédits |
| Gestes / cuisine | [Traditional Khmer kitchen.jpg](https://commons.wikimedia.org/wiki/File:Traditional_Khmer_kitchen.jpg) | Turaids, photographie d'une cuisine khmère traditionnelle à Siem Reap, 2021 | **Contexte uniquement**, ne montre PAS un geste réel de pilage : insuffisant pour valider la scène |
| Mortier générique | [Mortar & Pestle.jpg](https://commons.wikimedia.org/wiki/File:Mortar_%26_Pestle.jpg) | Saankav, mortier indien, photographie réelle | **REJETÉ comme photo de geste cambodgien**, ne pas légender comme kroeung |
| Finale atmosphère crépusculaire | [Angkor wat sunrise.jpg](https://commons.wikimedia.org/wiki/File:Angkor_wat_sunrise.jpg) | Cambodiancab, photographie lever de soleil 2017 | **Candidat**, angle/valeurs et licence à réexaminer |
| Déjà acquis en preview | [Angkor Wat Reflection.jpg](https://commons.wikimedia.org/wiki/File:Angkor_Wat_Reflection_(46810498612).jpg) | Radek Kucharski, CC BY 2.0 | **Acquis juridiquement sous réserve de respect des conditions**, mais rendu actuel plus bleu que la référence |

**Illustration ajoutée** : `public/images/brand/v17-spice-bowls.svg` (poivre et curcuma), dessin original réalisé dans la PR #47 ; il ne doit pas être décrit comme photographie ou aliment réel photographié.

**Gate média = NON SATISFAIT.** Tant que des photographies réelles assez proches de la scène de marché, du pilage de kroeung et de la tablée n'ont pas été sélectionnées, inspectées et obtenues en résolution de production, il est interdit de déclarer D3–D5 fidèles. En particulier, une photo d'un autre pays ne devient pas documentaire cambodgien par le seul changement de sa légende.
