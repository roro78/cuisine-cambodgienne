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
| S6 — Finale | Angkor photographié ou illustré légitimement avec droits/lieu exact | **BLOQUÉ MÉDIA** | illustration de silhouettes khmères originale et signalée comme illustrative, jamais « photo d'Angkor » inventée |

## Livrables média à clôturer pour passer D1 intégralement

- [x] Maquette exacte contrôlée sur disque local et empreinte SHA-256 confirmée.
- [x] Huit familles de main inventoriées et licences existantes relevées.
- [x] Cartographie scène → image → déficit, sans inventer de photographie.
- [x] Bibliographie des candidats historiques #45 séparée du code rejeté.
- [ ] Original PNG stocké dans le dépôt GitHub avec sa vraie empreinte (transfert binaire requis ; **ne pas substituer un JPG optimisé** en prétendant que c’est l’original).
- [ ] Droits/qualité des candidats Commons revus et attestations enregistrées (date/source/licence/transformations/alt).
- [ ] Images fortes pour mortier, vraie table partagée et finale Angkor acquises légalement.
- [ ] Planche d'assets **réels** jugée assez proche de la maquette pour lancer les scènes photo.

**Gate :** D1 = PARTIAL (inventaire terminée, acquisition et dépôt maître non terminés). Cela permet de développer le squelette D2 avec placeholders identifiés, pas de déclarer l'intégration artistique finale conforme.
