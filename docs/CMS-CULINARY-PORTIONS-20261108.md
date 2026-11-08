# Portions et contrôles culinaires partagés — réception du candidat

## Problèmes et comportement

Les ingrédients de la recette pouvaient être recalculés alors que les dosages
et contenants des étapes restaient ceux du rendement initial. Le contrôleur
d’atelier multipliait aussi les quantités marquées `scalable=false`.

`recipePortions.ts` fournit désormais le calcul et l’affichage partagés. Les
instructions utilisent des liaisons typées par emplacement, ingrédient et ancre
exacte. Les quantités viennent de la recette canonique ; une ancre ambiguë ou
périmée échoue au build. Les températures et durées ne sont jamais des slots
proportionnels. Amok conserve ses données historiques : réserve = 6 % prélevés
sur le lait de coco, contenants selon les portions, combava/basilic toujours
non proportionnels. La petite réserve est présentée avec une approximation
culinaire explicite, sans changer le calcul ni ajouter de coco au total.

Le rendu serveur affiche la référence cohérente sans JavaScript ; les deux
contrôleurs mettent à jour les quantités avec JavaScript. Le contrat public
`portionContract` est une projection en lecture seule : empreinte canonique,
indices, textes publics et ancres. Les validateurs PHP/Node refusent une
empreinte, un texte, un index, une forme ou une ancre incompatibles. Il ne
devient pas un champ éditable et ne contient aucun script vocal ou secret.

## Contrôles permanents dans le Studio existant

`cmsCulinaryAutomaticAudit` calcule cinq catégories : portions (1/2/4/8/12),
ingrédients des phases, durées, narrations et sécurité. Le rendu des créations,
modifications et du contrôle final les relance. Les divergences critiques
entrent dans le veto de `cmsCoralFinalAudit`, donc du visa final puis du TTS et
de ses vérifications de version. La version de politique et le contrat de
portions entrent dans le digest final. Aucun visa humain n’est attribué.

Les alertes lexicales ne prouvent pas l’exhaustivité sémantique. Les synonymes,
variantes, temps réels, goût, authenticité et étiquettes restent à examiner.
Les instructions historiques sans liaison restent signalées ; les chiffres
nouvellement modifiés nécessitent une liaison explicite. Une estimation de
phases différente du temps canonique est signalée, sans inventer si la finition
est incluse ou supplémentaire. Le brouillon peut être sauvegardé sans audio.

## Récupération des sources

Diagnostic en lecture seule depuis OVH : les deux sources répondaient 200 mais
la page Chef Nak dépassait 512 Kio. Le candidat borne cette URL à 1 Mio ;
l’autre garde 512 Kio. Les contrôles HTTPS, IPv4 publique épinglée, absence de
proxy/redirection, délais, MIME, mots attendus et empreintes restent actifs.
La validation PHP isolée récupère les deux vraies pages ; cela ne prouve pas
que ce correctif soit installé dans le contrôleur public OVH.

## Tests et limites de livraison

Tests des rendements 1/2/4/8/12 et changements répétés, plusieurs recettes,
conservation des règles non proportionnelles, ancres périmées, nouveau contenu,
base sans JS, clics Chrome 390/1440 px, protections d’export, règles PHP et
refus des températures insuffisantes. Les fixtures n’appellent aucun fournisseur.

La PR #231 demeure distincte et ne doit pas être fusionnée par cette mission.
Ce candidat est construit sur son SHA livré `35fd786`. Une nouvelle PR empilée
évite de recopier ou d’écraser son correctif. Aucune publication Astro ou fusion
n’est autorisée ici. Préparer le lot statique exact et les PHP/index associés,
les sauvegardes et le rollback ; demander l’autorisation sur ce lot avant
livraison. Les données privées Amok sont sauvegardées séparément par la fonction
commune et leurs textes restent hors de cette documentation publique.
