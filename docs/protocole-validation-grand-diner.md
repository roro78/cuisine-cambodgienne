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

## 3. Consignes de sécurité déjà corrigées et précautions à confirmer

- **Correction achevée :** la PR #25 a été fusionnée dans `main` (commit `9cacbaab`) puis déployée sur OVH. La recette publique Amok Trey impose désormais de rectifier l'assaisonnement **avant** l'incorporation d'œufs ou de poisson crus et interdit toute dégustation après leur ajout. Aucun nouveau correctif Amok n'est requis pour la PR #24.
- **Correction achevée :** la recette Prahok Ktis précise désormais de ne goûter et rectifier l'assaisonnement qu'après cuisson complète du porc et de la préparation.
- **À préserver pendant les essais :** ne jamais goûter une préparation contenant poisson ou œufs crus ni une préparation contenant du porc cru ou insuffisamment cuit.
- Préserver la séparation des aliments crus et des ustensiles/produits prêts à servir.
- Ne pas promettre de conservation ou de maintien au chaud, de température ni de durée non vérifiée.
- Établir la liste réelle des allergènes, substitutions et précautions de conservation dans les documents commerciaux avant une mise en vente.

## 4. Qualité de l'expérience numérique

Avant toute éventuelle publication de la PR #24, préserver les contrôles acquis :
- **Déjà validés :** CI Astro, TypeScript, contrats recettes/éditorial/animations, calculs des convives, planning et carnet ; recette automatisée Chrome desktop/mobile (CI #38078284525).
- **Vérification humaine complémentaire :** navigation clavier avec technologies d'assistance, contraste visuel, lecture d'écran, qualité des images et examen de la version imprimée réelle.
- Arrivée dans le carnet avec les paramètres `convives`, `service`, `partage` ; contrôle des valeurs invalides et des choix par défaut.
- Coches et progression : seulement les gestes du menu visible ; chapitre Prahok masqué s'il n'est pas sélectionné.
- Impression A4 : toutes les instructions, la fiche de dégustation et les bonnes données ; absence de composants de navigation gênants.
- Vérifier que le carnet, les expériences et les offres non lancées restent `noindex`, hors sitemap et sans paiement ni inscription.
- Photographies, démonstrations originales et autorisations de diffusion avant une exploitation commerciale.

## 5. Garde de livraison OVH

**Lot A — ACQUIS :** les six ateliers de la PR #20 sont fusionnés et leurs six pages sont accessibles sur le domaine public (HTTP 200 vérifié). La PR #25 de sécurité alimentaire est également fusionnée et ses consignes apparaissent sur les recettes publiques. Branche compilée OVH contrôlée : `e59c104`.

**Lot B — À DÉCIDER :** la PR #24 est ouverte et prête à la revue, **non fusionnée et non publiée**. Les tests automatiques du navigateur et du build sont passés ; une validation de publication distincte est nécessaire. Les essais culinaires physiques restent indispensables **avant toute commercialisation**, mais ne doivent pas être confondus avec la publication éventuelle d'une démonstration gratuite clairement annoncée comme non testée.

Les pages actuelles sont des **prototypes gratuits non marchands**. Elles ne doivent pas ouvrir de réservation ou de vente.
