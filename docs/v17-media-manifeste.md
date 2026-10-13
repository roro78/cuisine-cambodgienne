# V17 Accueil ? D1 / MANIFESTE DES M?DIAS ET ?CARTS ? LA MAQUETTE

**Mise ? jour : 13 octobre 2026 ? ?tat D1 : INVENTAIRE PASS, SOURCING VISUEL INCOMPLET.**
**Maquette ma?tre :** `voyage_culinaire_au_cambodge.png` (974 ? 1615, SHA-256 `f775e6f3a483479f4a2d095406593d3d5dc354213b80d2a99839c6f23f4ddc71`). **Original conserv? dans le livrable de conversation mais NON encore commit? dans GitHub**, blocage de transfert binaire ; toute future branche de code doit d'abord s?curiser cet original.

## Phototh?que r?ellement disponible dans `main`

Dossier `public/images/cuisine/` : huit familles r?elles, les suffixes 480/800/1200/1600/2200 ne sont que des rendus responsive, **pas de nouveaux sujets**.

| Famille actuelle | Sujet attest? dans les cr?dits du site | Cr?dit d?clar? dans `src/pages/credits-photos.astro` | Peut aider la V17 | Limite |
| --- | --- | --- | --- | --- |
| `amok-*` | Amok, poisson khmer | Ben Yapp ? CC BY 2.0, Commons Fish Amok ? Khmer specialty | Hero, si cadrage r?ellement compatible | Ne pas simuler un plat d?tour? g?n?r? ? partir d?une autre photo |
| `amok-alt-*` | Amok Trey | MoonsMoon ? CC BY 4.0, Commons Fish amok amok trei Khmer Cambodian food | D?tail Amok hero | Plusieurs rendus sont **portraits**, voir ratio r?el |
| `kep-market-*` | March? au crabe de Kep | PsamatheM ? CC BY-SA 4.0 | Sc?ne march? au Cambodge | **Ne pas repr?senter comme march? flottant** ou Phnom Penh |
| `kampot-*` | Poivre de Kampot | Thalias ? CC BY-SA 4.0 | Ingr?dients | Objet unique, ne suffit pas ? la palette compl?te |
| `kroeung-*` | Cha kroeung, plat cuisin? | Thomas Wanhoff ? CC BY-SA 2.0 | Texture culinaire g?n?rique | **NE MONTRE PAS** une s?quence de pilage au mortier : impossible de l'utiliser comme ? vrai geste ? |
| `lok-lak-*` | Lok Lak | Stefan Fussan ? CC BY-SA 3.0 | Plats vari?s | Pas une photographie de table partag?e |
| `tamarind-*` | Tamarin | Susan Slater ? CC BY-SA 4.0 | Palette aromates | Une famille suppl?mentaire seulement |
| `prahok-*` | Prahok Ktis | Thomas Wanhoff ? CC BY-SA 2.0 | D?couverte culinaire | Ne pas assimiler ? un dessert |

**Source interne :** [inventaire m?dias](./inventaire-medias-cuisine.md) et [cr?dits publics](../src/pages/credits-photos.astro). Les noms de fichiers ne prouvent pas seuls la nature d'un m?dia ; toujours confronter photo, fiche Commons et l?gende.

## Sources historiques de la PR #45 : autorisation ? rev?rifier avant r?import

L'ancien prototype contient des assets sourc?s pour une maquette rejet?e. **On ne r?importe aucun CSS/composant depuis #45**, mais la liste des photographies peut servir au **sourcing**, apr?s revue licence, dimensions, coh?rence et ind?pendance juridique :
- Wikimedia Commons `File:Chek_ktis.jpg` ? attribution historique Marie / CC BY-SA 2.0.
- `File:Num_kom_sticky_rice_cake_Khmer_Cambodian_dessert.jpg` ? attribution historique MoonsMoon / CC BY 4.0.
- `File:Galangal.jpg` ? photographie de galanga **g?n?rique**, attribution historique Liza Daly / domaine public.
- `File:Red_Chili_Pepper_PNG.png` ? piment transparent, attribution historique Spicy Anonymous / CC0.
- `File:Fish_Amok_with_Rice.jpg`, `File:Khmer_Borane_-_amazing_sampler_(8532779364).jpg` : exemples culinaires sources ? requalifier.

Ces r?f?rences doivent ?tre revues sur Commons lors du sourcing final ; les licences copyleft (BY-SA) exigent un respect explicite des conditions, sp?cialement pour les transformations.

## Besoins par sc?ne et niveau de pr?paration

| Sc?ne | M?dia n?cessaire pour une vraie fid?lit? | Statut | Repli autoris? dans PREVIEW |
| --- | --- | --- | --- |
| S0 ? Amok | Photo d?tour?e gastronomique majeure + feuillage/citron/piment | **PARTIEL** : amok r?el disponible, composition maquette non disponible | vraie photo Amok dans un conteneur HTML clairement exp?rimental, sans reconstituer de plat documentaire fictif |
| S1 ? March? | Photo panoramique de march? cambodgien ? ?nergie vivante | **PARTIEL** : march? de Kep pr?sent, nature de la sc?ne diff?rente | vrai march? Kep avec l?gende ? march? au crabe de Kep ? exacte |
| S2 ? Palette | Citronnelle, galanga, combava, piment, poivre, curcuma, photos d?tour?es/illustrations | **PARTIEL** : Kampot, tamarin ; candidats Commons ? v?rifier | SVG botanique original explicitement illustratif + photos d'ingr?dients identifi?es |
| S3 ? Gestes | Vraie prise de vue main + mortier + p?te kroeung/texture ? diff?rents moments | **BLOQU? M?DIA** : aucune photo r?elle du mortier dans main | carte illustrative de technique sans pr?tendre montrer l'acte photographi? |
| S4 ? Repas | Table cambodgienne authentique, plusieurs plats, image paysage | **BLOQU? M?DIA** | photo l?gend?e selon sujet r?ellement repr?sent?, ou visuel de rep?rage non publi? |
| S5 ? Desserts | Chek Ktis r?el + Num Kom + d?tail coco | **CANDIDATS SOURC?S** dans la PR #45, non int?gr?s dans main | mention ? images d'?tude ? jusqu'? v?rification licences et cr?dits |
| S6 ? Finale | Angkor Wat au coucher du soleil, photo v?rifi?e et cr?dit?e | **PHOTO R?ELLE ACQUISE** : Radek Kucharski, CC BY 2.0, 1600?900 | Contr?ler la fid?lit? artistique et conserver son cr?dit lors du passage production |

## Livrables m?dia ? cl?turer pour passer D1 int?gralement

- [x] Maquette exacte contr?l?e sur disque local et empreinte SHA-256 confirm?e.
- [x] Huit familles de main inventori?es et licences existantes relev?es.
- [x] Cartographie sc?ne ? image ? d?ficit, sans inventer de photographie.
- [x] Bibliographie des candidats historiques #45 s?par?e du code rejet?.
- [ ] Original PNG stock? dans le d?p?t GitHub avec sa vraie empreinte (transfert binaire requis ; **ne pas substituer un JPG optimis?** en pr?tendant que c?est l?original).
- [ ] Droits/qualit? des candidats Commons revus et attestations enregistr?es (date/source/licence/transformations/alt).
- [ ] Images fortes pour un vrai geste au mortier et une table partag?e acquises l?galement. La photo d'Angkor (Radek Kucharski, CC BY 2.0) est int?gr?e ? la preview ; fid?lit? de son cadrage et respect final des conditions de licence encore ? recevoir.
- [ ] Planche d'assets **r?els** jug?e assez proche de la maquette pour lancer les sc?nes photo.

**Gate :** D1 = PARTIAL (inventaire termin?e, acquisition et d?p?t ma?tre non termin?s). Cela permet de d?velopper le squelette D2 avec placeholders identifi?s, pas de d?clarer l'int?gration artistique finale conforme.

## Compl?ment du 13 octobre 2026 ? Nouvelle ressource finale D3

- `public/images/cuisine/v17-angkor-sunset-1600.jpg` (1600 ? 900, JPEG, 571 521 octets) : [Angkor Wat Reflection (46810498612).jpg](https://commons.wikimedia.org/wiki/File:Angkor_Wat_Reflection_(46810498612).jpg).
- Auteur : **Radek Kucharski**, photographie **3 d?cembre 2015 ? 17 h 16**, Angkor Wat au coucher du soleil.
- Licence : [Creative Commons Attribution 2.0 Generic](https://creativecommons.org/licenses/by/2.0/) ; source Commons revue et lien attribution sur la maquette publique.
- Transformation : version redimensionn?e par l'API Commons, **recadrage responsive en CSS** pour la finale (pas de faux ciel ou silhouettes ajout?s).
- Usage : section finale de la route noindex `/v17-accueil-preview/`, **ne pas d?ployer avant revue g?n?rale**.

Les photos d'Amok, d'?tal de fruits, de table khm?re, Chek Ktis, Num Kom, galanga et piment ont ?galement ?t? reprises depuis les blobs m?dias sourc?s de la PR #45 **sans aucun code ni style de cet ancien prototype**. Leur enregistrement des auteurs et licences est pr?sent dans la pr?visualisation, mais la validation finale des obligations de r?utilisation et de d?rivation reste un gate de publication.

Le m?dia **mortier r?el pendant le geste** manque toujours ; ne pas le remplacer par une photo non cr?dible de cuisine ?trang?re sous une l?gende cambodgienne.


### Reprise du 13 octobre 2026 ? ?tat des preuves

- Source ma?tresse PNG : **introuvable dans les fichiers accessibles de la nouvelle session**, empreinte connue mais copie originale ? fournir pour un contr?le visuel et archivage GitHub ; ne pas cr?er de substitut ni de maquette reconstruite.
- Photos de la preview : contr?les de chargement et de pr?sence couverts par les recettes CI connues ; l'ad?quation documentaire et les conditions de d?rivation restent une **revue manuelle ouverte**.
- Mortier r?el : **NON ACQUIS** ; conserver le rep?re illustratif honn?te jusqu'? l'obtention d'un m?dia fiable.
- Captures desktop/mobile de la CI du commit `1a56f628` effectivement r?cup?r?es, mais **ne prouvent pas l'?quivalence avec l'original valid?**.


### Planche visuelle re?ue de nouveau ? 13 octobre 2026

- **Copie exploitable :** fichier nomm? `2399.png`, mais octets **JPEG** 926 ? 1536 ; SHA-256 `fbe345f9984f3ba06bab438202de5afcadec37e0eca9608c0ebdc5be2a3316ff`. **Ne pas confondre** avec la maquette originale PNG 974 ? 1615, SHA-256 `f775e6f3a483479f4a2d095406593d3d5dc354213b80d2a99839c6f23f4ddc71`. La comparaison visuelle avec la copie est autoris?e, la comparaison d'empreinte canonique et l'archivage du ma?tre demeurent ouverts.
- La planche composite montre des compositions culinaires id?alis?es ; elle n'atteste pas les droits ni la provenance d'une image documentaire individuelle. **Ne pas extraire** directement ses morceaux en pr?tendant disposer des photographies r?elles (march?, mortier, tabl?e, desserts).
- Reprise de comparaison : photographie h?ro Amok r?elle mais cadrage diff?rent, march? r?el d'?tal fixe, palette trop peu fournie, mortier actuellement illustr?, tabl?e r?elle moins lumineuse, desserts r?els mais diff?rents des arrangements g?n?r?s, Angkor r?el en ambiance diurne diff?rente de la planche.
- **Aucun nouvel asset non sourc? introduit** dans le lot CSS `fac99b4` ? `be7764f`. Les droits des fichiers Commons d?j? pr?sents devront ?tre revalid?s avant publication. La recherche d'une photographie du pilage khmer document? demeure prioritaire.


### Sourcing compl?mentaire apr?s refus artistique explicite ? 13 octobre 2026

La copie transmise est une **r?f?rence de composition**. L'actuel assemblage de photos sur la PR #47 n'est toujours pas re?u. Les images ci-dessous sont uniquement des **pistes v?rifi?es sur leurs fiches Wikimedia Commons**, pas des m?dias int?gr?s ni des substitutions artistiques accept?es.

| Sc?ne | Candidat r?el | Auteur / statut d?clar? sur Commons | R?ception |
| --- | --- | --- | --- |
| March? plus vivant | [Market in Cambodia.jpg](https://commons.wikimedia.org/wiki/File:Market_in_Cambodia.jpg), l?gumes ? Phnom Penh | Justin Watt, ?uvre plac?e dans le domaine public | **Candidat**, cadrage/dynamique artistique ? comparer ? la maquette |
| March? avec pr?sence humaine | [Market Woman in Kep Cambodia.JPG](https://commons.wikimedia.org/wiki/File:Market_Woman_in_Kep_Cambodia.JPG), femme au march? de Kep | Adam Jones, CC BY 3.0, attribution demand?e explicitement | **Candidat**, contexte et licence ? enregistrer dans les cr?dits |
| Gestes / cuisine | [Traditional Khmer kitchen.jpg](https://commons.wikimedia.org/wiki/File:Traditional_Khmer_kitchen.jpg) | Turaids, photographie d'une cuisine khm?re traditionnelle ? Siem Reap, 2021 | **Contexte uniquement**, ne montre PAS un geste r?el de pilage : insuffisant pour valider la sc?ne |
| Mortier g?n?rique | [Mortar & Pestle.jpg](https://commons.wikimedia.org/wiki/File:Mortar_%26_Pestle.jpg) | Saankav, mortier indien, photographie r?elle | **REJET? comme photo de geste cambodgien**, ne pas l?gender comme kroeung |
| Finale atmosph?re cr?pusculaire | [Angkor wat sunrise.jpg](https://commons.wikimedia.org/wiki/File:Angkor_wat_sunrise.jpg) | Cambodiancab, photographie lever de soleil 2017 | **Candidat**, angle/valeurs et licence ? r?examiner |
| D?j? acquis en preview | [Angkor Wat Reflection.jpg](https://commons.wikimedia.org/wiki/File:Angkor_Wat_Reflection_(46810498612).jpg) | Radek Kucharski, CC BY 2.0 | **Acquis juridiquement sous r?serve de respect des conditions**, mais rendu actuel plus bleu que la r?f?rence |

**Illustration ajout?e** : `public/images/brand/v17-spice-bowls.svg` (poivre et curcuma), dessin original r?alis? dans la PR #47 ; il ne doit pas ?tre d?crit comme photographie ou aliment r?el photographi?.

**Gate m?dia = NON SATISFAIT.** Tant que des photographies r?elles assez proches de la sc?ne de march?, du pilage de kroeung et de la tabl?e n'ont pas ?t? s?lectionn?es, inspect?es et obtenues en r?solution de production, il est interdit de d?clarer D3?D5 fid?les. En particulier, une photo d'un autre pays ne devient pas documentaire cambodgien par le seul changement de sa l?gende.


## Import effectif des quatre nouveaux JPEG ? 13 octobre 2026

**Source de preuve :** [import GitHub Actions #38424609626](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38424609626), SUCCESS, commit `2fa0cdb3d92827646c856b79a9295049f9d8dc71` sur `feat/v17-accueil-reconstruction`, jamais sur `main`. Script reproductible : `scripts/import-v17-licensed-media.mjs`. JPEG valid?s par signature, seuil de taille, et t?l?chargement effectif ; aucune d?pendance externe au navigateur pour l'affichage.

| Sc?ne | Asset r?ellement ajout? au d?p?t | Auteur / source / licence | R?alit? documentaire et limites |
| --- | --- | --- | --- |
| March? | `v17-market-live-1800.jpg` (1 234 542 octets) | [Market in Phnom Penh.jpg](https://commons.wikimedia.org/wiki/File:Market_in_Phnom_Penh.jpg), Rados?aw Botev / Fundacja Nomos, [CC BY 3.0 PL](https://creativecommons.org/licenses/by/3.0/pl/deed.en), version r?duite | March? authentiquement photographi? ? Phnom Penh ; pas une sc?ne flottante, ni le m?me cadrage que la maquette g?n?r?e |
| Gestes | `v17-mortar-hands-1600.jpg` (399 151 octets) | [Woman Hands Holding Mortar](https://www.pexels.com/photo/woman-hands-holding-mortar-21937648/), Filipp Romanovski, [licence Pexels](https://www.pexels.com/license/), format JPEG optimis? | Mains utilisant r?ellement un mortier ; **photographie g?n?rique**, origine cambodgienne et fabrication de kroeung NON affirm?es |
| Repas | `v17-table-meal-1600.jpg` (441 452 octets) | [Khmer Family Restaurant, 2018 (03)](https://commons.wikimedia.org/wiki/File:Khmer_Family_Restaurant,_2018_(03).jpg), Bahnfrend, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), version r?duite | Repas r?el photographi? ? Siem Reap ; combin? ?ditorialement avec l'assortiment de Phnom Penh. Ce montage n'est PAS une photographie d'une tabl?e unique. Respecter les conditions BY-SA applicables aux adaptations. |
| Finale | `v17-angkor-dusk-1800.jpg` (568 746 octets) | [Angkor Wat at dusk, Siem Reap, Cambodia](https://commons.wikimedia.org/wiki/File:Angkor_Wat_at_dusk,_Siem_Reap,_Cambodia.jpg), Eric Hossinger, [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/), version r?duite | Angkor authentique au cr?puscule ; couleurs et placement de la maquette non garantis. |

**Statut D1 m?dias :** import et licence des quatre nouvelles sources document?s = **PASS TECHNIQUE**. ?quivalence photographique exacte ? la planche composite = **NON VALID?E**. En particulier, l'Amok h?ro et les desserts ne sont pas ceux visibles sur la maquette ; ne pas pr?tendre les avoir retrouv?s.

**Contr?le avant ?ventuelle publication :** attribution visible et liens sources, conformit? de l'ensemble des d?riv?s aux licences, autorisations ?ventuelles de personnes identifiables, versions d'image correctes, revue art direction compar?e ? la maquette valid?e. Aucune production V16 modifi?e.


### 13 octobre 2026 ? D5.4 : dessert photographi? sur feuille de bananier

- **Nouveau visuel retenu et int?gr? r?ellement dans la PR #47 :** `public/images/cuisine/v17-num-plae-ai-641.jpg`, photo de Num Plae Ai (boules de riz gluant garnies de coco, servies dans une feuille de bananier), **Hyzuko, CC BY-SA 4.0**, [Wikimedia Commons ? fiche d'origine](https://commons.wikimedia.org/wiki/File:Num_Plae_Ai.jpg). L'authenticit? cambodgienne est ?tablie par la notice Commons ; la photographie n'est pas l'image exacte du dessert g?n?r? dans la maquette.
- **Composition :** Num Plae Ai en image principale, photo Num Kom conserv?e ? droite en contrepoint avec libell?s explicites. Le CTA ? D?couvrir le Chek Ktis ? m?ne toujours vers une vraie recette publi?e ; la photo principale ne pr?tend pas montrer le Chek Ktis.
- **Photo rejet?es / nettoyage ex?cut? :** `v17-amok-coconut-1800.jpg`, `v17-khmer-sweets-1400.jpg`, `v17-num-krouch-1400.jpg` supprim?es de la branche car non choisies. Le script `scripts/import-v17-licensed-media.mjs` et le workflow `v17-import-media.yml` supprim?s apr?s l'import valid? pour ?liminer les ex?cutions automatiques r?p?t?es. L'ancien JPEG Chek Ktis demeure comme archive dans le dossier V17, sans ?tre l'image principale actuelle.
- **Licences :** cr?dit Hyzuko et lien source pr?sents dans les d?tails ? Sources photographiques ? de la preview ; une v?rification finale des modalit?s BY-SA et des autres cr?dits est requise AVANT mise en production.
- **?tat photographique :** **DESSERTS AM?LIOR?S, PAS IDENTIQUES ? LA MAQUETTE**. L'Amok h?ro reste une photographie documentaire originale recadr?e, non le montage composite du storyboard.
### 13 octobre 2026 ? Revue m?dia D5.5, sans nouvel import

| Candidat contr?l? | Auteur / licence d?clar?e | D?cision |
| --- | --- | --- |
| [Fish Amok with Rice](https://commons.wikimedia.org/wiki/File:Fish_Amok_with_Rice.jpg), fichier actuellement utilis? | sharonang, CC0 | **Conserv?** : meilleur impact gourmand parmi les fichiers compar?s ; recadrage et masque CSS uniquement |
| [2016 Phnom Penh, Amok trey (01)](https://commons.wikimedia.org/wiki/File:2016_Phnom_Penh,_Amok_trey_(01).jpg) | Marcin Konsek, CC BY-SA 4.0 | **Refus?** : document? mais cadrage moins adapt? au hero monumental |
| [Tasty fish amok in a coconut](https://commons.wikimedia.org/wiki/File:Tasty_fish_amok_in_a_coconut_(15941045359).jpg) | yashima, CC BY-SA 2.0 | **Refus?** : pr?sentation r?elle mais composition moins proche de la direction artistique attendue |

Aucun de ces deux candidats refus?s n'a ?t? ajout? ? `public/`. Le commit V17 `3db9dff4` modifie seulement la composition CSS, la motion et les assertions de r?gression ; les auteurs, licences et fichiers m?dias publi?s ne changent pas. **Gate m?dia / r?ception artistique : toujours PARTIEL**, et validation humaine requise avant toute publication.