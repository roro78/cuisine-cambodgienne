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
