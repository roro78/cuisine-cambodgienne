# Social — chantier éditorial / visuels #121 (étape 1)

**État au 25 octobre 2026 :** parcours complet n8n Facebook + Instagram + PostgreSQL validé par la publication Kroeung. Les workflows demeurent inactifs pendant la reprise qualité.

## Diagnostic confirmé par le code
- `scripts/build-social-assets.mjs` fabriquait des JPEG carrés 1080 × 1080 avec `fit:'contain'` et un fond crème `#f4efe6`, donc les **bandes sont produites dans les fichiers sociaux** et non par les applications mobiles.
- `socialCatalog.ts` choisissait pour Kroeung la photo générique du plat présenté dans son article (`kroeung-1600.webp`), sans sujet centré sur la pâte d'aromates.
- Le nœud n8n `Vérifier et cadrer les textes` impose explicitement « Dans notre catalogue », « informations vérifiées » et « page associée ». C'est une limite de la source, pas une mauvaise formulation de Facebook/Instagram.

## Correction de ce lot — sans publier
- Social JPEG **1080 × 1350 (4:5)** en vrai plein cadre, recadrage sujet `sharp.strategy.attention`, aucune bande unie générée, aucune déformation.
- Source sociale du contenu Kroeung orientée sur un existant `v19-mortier-kroeung-1200.webp` (à valider visuellement avant production). **L'article d'origine et sa photo restent inchangés.**
- Test JPEG en mémoire vérifiant les dimensions, l'absence de bandes introduites par le générateur et la protection de l'article existant.
- Ce lot n'altère pas les images déjà publiées. Les JPEG sociaux sont reconstruits à l'étape `npm run build`, puis nécessitent **un déploiement manuel OVH** ; la fusion GitHub ne les publie pas.

## Étape suivante (pas encore activée)
- Revoir le validateur de légendes **sans perdre la vérification des faits** : accroche factuelle, une idée claire, bloc court, conclusion naturelle ; différencier Facebook et Instagram et éviter l'URL UTM visible.
- Préparer la migration n8n sous empreintes exactes (`fail-closed`) : la fusion des exports GitHub ne synchronise pas l'instance n8n.
- Revoir trois prévisualisations mobiles **ingrédient Kroeung, recette Amok, carnet culturel** avec leur image pour obtenir la validation humaine. Ne pas utiliser ces modifications pour republier le post de test Kroeung.
- Recontrôler que les images sources sont libres d'utilisation selon leur provenance et correspondent réellement au sujet avant déploiement.

**Gates :** CI PASS → validation des aperçus réels → déploiement OVH manuel → synchronisation contrôlée de n8n si validée → seulement ensuite activation des workflows. Aucun e-mail, aucune publication Meta ni modification PostgreSQL dans ce chantier.
