# Audit de cohérence des six ateliers audio Coral — 18 octobre 2026

## Méthode et limites
Référence : `main` après PR #75, commit `ca73a466c805c24b56ee7f352be5cc983f33050f`. Comparaison de `src/data/workshops.ts`, `src/data/workshopLearning.ts`, des six scripts de narration `src/data/workshop-audio/*.json`, des recettes et des nouveaux guides de préparation.
Le run CI [39128533104](https://github.com/roro78/cuisine-cambodgienne/actions/runs/39128533104) a validé les fichiers MP3 et leurs horodatages, mais **n'a pas fait une transcription acoustique indépendante**. Les JSON sont les scripts déclarés de la génération audio, non une preuve mot à mot du son écouté.

## Verdict atelier par atelier
| Atelier | Cohérence recettes/narration | Action |
| --- | --- | --- |
| 01 Mortier | Les gestes, aromates et critères de texture concordent avec le kroeung. Le combava fait partie de la recette complète et pas du petit exercice au mortier. | Conserver le MP3 ; quantifier la préparation écrite. |
| 02 Sauce | Quatre bols, un témoin, des corrections séparées au citron/tamarin, sucre et sel. La « base » n'était pas définie. | Conserver le MP3 ; proposer 120 ml de base sans cru, divisés en quatre bols. |
| 03 Saisie | Les fournées puis la sauce en fin de cuisson sont cohérentes avec le lok lak. La nécessité de cuisson complète est rappelée dans la narration. | Conserver le MP3 ; préciser quantité de bœuf, huile et sauce des essais. |
| 04 Fraîcheur | Jus et zeste de citron vert, coriandre et menthe utilisés conformément à la narration. | Conserver le MP3 ; rendre le matériel précis. |
| 05 Bouillon | **L'audio enseigne l'ajustement d'un bouillon préexistant**, pas sa fabrication à partir d'os ou légumes. L'intitulé et la liste de matériel pouvaient créer une attente erronée. | Conserver le MP3 ; préciser les 400 ml déjà préparés, le périmètre des 50 min, et relier le guide de bouillon maison. |
| 06 Repas | Riz + plat cuit + élément frais + condiment à part, cohérents avec les recettes liées. | Conserver le MP3 ; fournir des exemples de quantités et aliments. |

## Politique de modification
- 6 MP3 conservés, **aucun appel TTS**.
- Les 30 textes de chapitres, les métadonnées de durée, les horodatages et les lecteurs audio sont **intacts**.
- Les clarifications se trouvent dans le matériel écrit, sans contredire les quatre étapes ou leurs scripts.
- Pour vérifier une divergence **réellement prononcée** par Coral, un contrôle d'écoute reste nécessaire.
- Si un jour une phrase de narration change : régénérer seulement le MP3 de cet atelier, synchroniser les 5 chapitres sur les trames réelles puis retester mobile/desktop. Ne jamais modifier une transcription JSON seule pour masquer un ancien enregistrement.

## Référencement
Le guide `/techniques/bouillon-leger-maison/` fournit une méthode complète distincte de l'atelier de dégustation. Le lien explicite permet de répondre au besoin « comment préparer le bouillon de départ ? » sans dupliquer le texte de la page ni altérer l'expérience audio.
