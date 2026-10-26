# Carnets — imagerie corrigée des cartes & du catalogue social (25-10-2026)

## Défaut de raccordement confirmé
Dans `src/pages/culture/index.astro`, deux cartes (« Le repas, un moment de vie » et « Le kroeung, une mémoire de famille ») utilisaient **le même** `v17-table-meal-1600.jpg` alors que leurs articles ont chacun une illustration adaptée. Le catalogue social réutilisait aussi des visuels historiques non pertinents. Ce n'était pas un problème de génération d'image seulement.

## Corrections préparées
- Les 4 cartes « regards sur les lieux et la mémoire » dérivent maintenant leur image, dimensions, alt, srcset, lien depuis **le même article que leur titre**. Un doublon d'image fait échouer la construction.
- **Kroeung / mémoire** : photo éditoriale des deux générations et de la sélection des aromates (`carnet-kroeung-memoire-1536.webp`) ; elle est une **illustration** et non une photographie documentaire.
- **Le repas partagé** : personnes et mains autour des plats (`v19-table-partage-desktop-1440.webp`), sans l'ancienne photo de restaurant ; illustration éditoriale.
- **Le riz** : la photographie des rizières **déjà présente dans l'article** est conservée sur la fiche. Pour le catalogue social, `/images/cuisine/v17-khmer-table-1280.webp` (riz blanc photographié à plat sur nappe à carreaux colorée) est seulement une **proposition de remplacement** plus pertinente que l'ancienne table de restaurant ; aucune validation utilisateur de cette variante.
- **Kroeung ingrédient & Amok recette** : les visuels sociaux approuvés dans #126 ne sont pas modifiés.
- Les descriptions et textes des 7 Carnets, leurs slugs et les crédits existants ne changent pas.

## États et prochaine gate
- [x] Éliminer la réutilisation accidentelle de la même photo dans les cartes.
- [x] Réconcilier images des deux récits et du catalogue social.
- [ ] **Examen réel sur mobile des nouveaux aperçus sociaux** pour les trois Carnets, particulièrement le riz.
- [ ] Accord éditorial pour la photo du riz avant toute publication.
- [ ] Déploiement manuel OVH une fois approuvé.
- [ ] Dry-run GET-only n8n puis application séparément autorisée : aucun workflow à activer pendant le contrôle.

**Aucun déploiement OVH, aucune mutation PostgreSQL, aucun e-mail, aucune publication Meta** n'est déclenché par ce correctif GitHub.

## Prévisualisation étendue

La validation sociale inclut désormais 5 sujets × 2 réseaux = 10 cartes (Kroeung ingrédient / Amok recette déjà validés, Riz culturel candidat, Kroeung culturel, Repas partagé). Artefact CI `cuisine-social-preview-ten-posts`. Réception humaine nécessaire pour les 3 carnets ; aucune activation de n8n.

## Correction de l'aperçu sur téléphone (retour utilisateur)
La page de revue v3 affichait les carrés en pleine largeur des cartes, sans représentation réaliste de l'interface et sans contrôle de taille. Cette erreur induisait en erreur sur le rendu Facebook et Instagram. Correction v4 :
- JPEG social **inchangé** 1080 × 1080, aucun nouveau recadrage au sein des posts.
- Maquette de fil **compacte à 300 CSS px** par défaut, ou **370 CSS px** sur demande, limitée à la largeur de l'écran ; il s'agit d'une simulation adaptable et non d'une capture pixel-perfect officielle.
- Facebook : légende d'abord puis photo ; Instagram : image puis légende, avec actions simulées et dépliage du texte.
- Sur Instagram : aperçu secondaire miniature de la **grille du profil (3:4)** qui peut rogner les côtés d'un carré. Ne pas confondre ce recadrage miniature avec le fil.
- Test navigateur mobile 393 CSS px : 298 px de photographie en compact, 368 px en mode fil, sans débordement horizontal, filtre Instagram et dépliage fonctionnels.
- Aucun n8n/Meta/OVH/PostgreSQL modifié. La candidate photo du carnet Riz **reste non validée** et la PR demeure en brouillon.
