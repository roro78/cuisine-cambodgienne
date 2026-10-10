# Grand Dîner Khmer — protocole de recette culinaire avant commercialisation

**État : NON TESTÉ EN CUISINE — protocole à exécuter, preuves à réunir.**
**Périmètre :** `/experiences/grand-diner-khmer/` et `/experiences/grand-diner-khmer/carnet-de-reception/`.
Ce protocole est une grille de validation ; son existence ne prouve ni la qualité du menu ni son temps réel de préparation.

## 1. Menu pilote réellement documenté

| Élément | Recette source | Statut | Information actuelle |
| --- | --- | --- | --- |
| Amok Trey | `src/data/recipes.ts#amok-trey` | Pilote plat | Préparation 30 min ; cuisson 25 min ; repères de la fiche |
| Chek Ktis | `src/data/recipes.ts#chek-ktis` | Pilote dessert | Préparation 10 min ; cuisson 15 min ; cuisson douce |
| Prahok Ktis | `src/data/recipes.ts#prahok-ktis` | Accompagnement **facultatif** | Préparation 25 min ; cuisson 25 min ; porc, prahok, coco, crudités |

Les quantités sont dérivées des fiches gratuites selon `baseServings`. Pour l'Amok, la quantité de ramequins mentionnée dans les équipements correspond à la recette de base : elle doit être ajustée au nombre de convives.

Le scénario propose des contrastes aromatiques, mais **aucun accord ni enchaînement n'a été validé en dégustation réelle**.

## 2. Six essais nécessaires et critères de réception

| Essai | Convives | Menu | Validation attendue |
| --- | ---: | --- | --- |
| A | 2 | Amok + Chek | Quantités, vapeur, portion, équilibre coco/aromates |
| B | 4 | Amok + Chek | Quantités de base, matériel disponible, temps et texture |
| C | 6 | Amok + Chek | Capacité du panier vapeur, taille du service, temps réels |
| D | 2 | Avec Prahok | Temps additionnel, organisation sans conflit, crudités |
| E | 4 | Avec Prahok | Charge de travail d'une personne, ajustement des assaisonnements |
| F | 6 | Avec Prahok | Capacité du matériel, volumes, organisation de trois préparations |

Pour chaque essai, relever **séparément** les durées de préparation, cuisson, dressage, service et dégustation. Ne pas extrapoler un horaire coordonné à partir de la somme des seules durées des recettes.

### Modèle de fiche d'essai (à reproduire pour chaque essai)

- Date / essai : ______________
- Nombre de convives : ______________
- Matériel réellement utilisé : ______________
- Heure de début / préparation / cuisson / service / dessert : ______________
- Résultat du poisson après cuisson complète : ______________
- Résultat du porc (si Prahok choisi) après cuisson complète : ______________
- Texture, puissance des aromates, équilibre, présentation : ______________
- Ingrédients manquants, substitutions, portions : ______________
- Ajustements et mesures à vérifier au prochain essai : ______________
- Décision : **À RETESTER / VALIDÉ APRÈS PREUVES** (une seule)
- Personne ayant effectivement réalisé l'essai et preuves : ______________

## 3. Points de sécurité / rédaction à corriger

- L'assaisonnement de l'Amok doit être goûté **avant** l'incorporation d'œufs et de poisson crus. La consigne source actuelle demande une correction éditoriale dans une PR séparée une fois le lot Ateliers publié sur OVH.
- Ne jamais proposer de goûter une préparation contenant poisson ou œufs crus.
- Pour le Prahok Ktis, vérifier la cuisson complète du porc **avant** toute dégustation/rectification de l'assaisonnement.
- Préserver la séparation des aliments crus et des ustensiles/produits prêts à servir.
- Ne pas promettre de conservation ou de maintien au chaud, de température ni de durée non vérifiée.
- Établir la liste réelle des allergènes, substitutions et précautions de conservation dans les documents commerciaux avant une mise en vente.

## 4. Qualité de l'expérience numérique

Avant toute fusion / publication de la PR #24, vérifier :
- CI Astro, TypeScript, contrats recettes/éditorial/animations, calculs des convives, planning et carnet.
- Navigation clavier, lecture d'écran (annonces de progression), contraste sur petits mobiles, images et liens.
- Arrivée dans le carnet avec les paramètres `convives`, `service`, `partage` ; contrôle des valeurs invalides et des choix par défaut.
- Coches et progression : seulement les gestes du menu visible ; chapitre Prahok masqué s'il n'est pas sélectionné.
- Impression A4 : toutes les instructions, la fiche de dégustation et les bonnes données ; absence de composants de navigation gênants.
- Vérifier que le carnet, les expériences et les offres non lancées restent `noindex`, hors sitemap et sans paiement ni inscription.
- Photographies, démonstrations originales et autorisations de diffusion avant une exploitation commerciale.

## 5. Garde de livraison OVH

**Lot A d'abord** : les six pages Ateliers de la PR #20 sont déjà fusionnées ; leur branche compilée `ovh-production` a été préparée. Attendre la synchronisation manuelle OVH et ses smoke tests.

**Lot B ensuite** : PR #24 reste en brouillon tant que le lot A n'est pas déclaré LIVE, que la QA navigateur n'est pas terminée et que les essais culinaires ne permettent pas de présenter le produit comme validé.

Les pages actuelles sont des **prototypes gratuits non marchands**. Elles ne doivent pas ouvrir de réservation ou de vente.
