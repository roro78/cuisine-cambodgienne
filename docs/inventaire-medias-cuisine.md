# Audit de la photothèque — Cuisine du Cambodge

**État au 11 octobre 2026 — inventaire du dépôt `main` avant toute commande de nouvelles images.**

## Ce qui est disponible

Le dossier `public/images/cuisine/` comporte **huit familles de photographies distinctes** : `amok`, `amok-alt`, `kampot`, `kep-market`, `kroeung`, `lok-lak`, `prahok` et `tamarind`. Les fichiers `-480`, `-800`, `-1200`, `-1600` et `-2200` sont des **variantes de résolution**, pas de nouveaux sujets. Plusieurs pages utilisent les mêmes familles, ce qui explique le sentiment de répétition.

Le script `node scripts/audit-photo-coverage.mjs` produit un inventaire reproductible des fichiers référencés par les principales pages/données et signale les images manquantes. Il ne publie rien, ne récupère aucun fichier externe et n'invente ni crédits ni licences.

## Première correction de contenu de cette PR

Le visuel d'ouverture de la page `/recettes/` utilisait encore la grande photo du marché de Kep, déjà dominante dans l'accueil. Il est remplacé par `amok-alt-1600.webp`, une photographie culinaire déjà disponible en résolutions responsives et directement pertinente pour la découverte des recettes.

**Limite :** le remplacement reste une amélioration sémantique ciblée ; il ne constitue pas une diversification réelle de la photothèque.

## Images manquantes à créer ou documenter avant une refonte premium

Priorité à **8 à 12 prises de vues réellement distinctes**, si possible originales et avec droits de diffusion vérifiés. Ne pas employer de photos trompeuses d'un plat ni des images générées pour prétendre documenter une recette ou un essai réellement réalisé.

| Priorité | Sujet souhaité | Usage | Vérification avant intégration |
| --- | --- | --- | --- |
| P1 | Gestuelle au mortier en 3 ou 4 états de texture | Accueil, kroeung et atelier | Les photos correspondent aux vrais gestes |
| P1 | Mise en place Amok : assaisonnement, ramequins, cuisson complète | Recette et guide du dîner | Images issues de préparation réelle ; aucun conseil dangereux |
| P1 | Table cambodgienne réelle avec plats et accompagnements | Accueil « À table » | Éviter schémas abstraits répétitifs |
| P1 | Riz et bouillon / nouilles kuy teav | Chronologie matinale et recettes | Plat correctement identifié |
| P2 | Finitions Lok Lak | Recette et contrastes chaud/frais | Cuisson et ingrédients cohérents |
| P2 | Étapes dessert Chek Ktis | Parcours premium | Démonstration fidèle à la recette testée |
| P2 | Légumes, produits et herbes sur un marché | Culture et ingrédients | Lieux et légendes exacts |
| P2 | Portraits ou transmission de gestes | À propos et carnets | Consentement, autorisation et rôle exact |
| P2 | Un ensemble de produits frais (citronnelle, galanga, combava) | Glossaire et fiches ingrédients | Identification botanique/culinaire correcte |

**Ne pas publier d'image non vérifiée.** Pour chaque futur média conserver la provenance, la licence, la date et le crédit approprié dans les ressources du projet. C'est un **plan de production média**, non la promesse que ces photographies existent déjà.

## Réception

- `npm run check`, `npm run test:recipes`, `npm run build` : PASS.
- Vérifier sur desktop et mobile que la photo du hero Recettes a un cadrage gourmand et n'est pas excessivement recadrée.
- Inspecter la sortie de `node scripts/audit-photo-coverage.mjs`.
- Ce lot ne touche ni aux routes ni à la PR #24 ; aucun merge ni déploiement implicite.
