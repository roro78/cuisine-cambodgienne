# Réception du workflow éditorial — 7 novembre 2026

Mission #205, référence `main` : `6a57b3d7520184e4f82998f554b88dec545d2e51`.
**Chantier en cours. Aucun atelier complet nouveau reçu. Aucun déploiement.**

## Atelier retenu et patrimoine préservé

Le calendrier privé a été lu par le SFTP déjà authentifié, sans écriture.
Il comporte trois projets : une qualification technique explicitement privée,
une modification liée à Bai Sach Chrouk sans date et une modification liée au
kroeung datée du 12 novembre. Le propriétaire a explicitement exclu le kroeung :
son brouillon, ses textes, ses images et ses MP3 restent intacts. Les projets
liés à une identité publiée ne sont pas des commandes de nouvelle génération.
La qualification technique n'est jamais recyclée en contenu réel.

Il ne reste donc aucun atelier nouveau éligible programmé. Le candidat demandé
est **Amok Trey — Réussir un poisson au lait de coco à la vapeur**. Il n'a encore
ni identité de brouillon réel, ni date cible : ne pas en inventer.
La recette existante `recette:amok-trey` est présente dans les trois index réels ;
son empreinte canonique relevée est
`67277bfaf88761c9ad5d5a79d1375052302192bb21eabd4ad98812fda26283b5`.
La revue sémantique humaine reste distincte des collisions exactes.

L'image historique a été inspectée : elle montre une feuille de bananier.
Son texte alternatif est fidèle à cette image, tandis que la recette utilise
quatre ramequins. Ne pas lui donner un faux texte alternatif « ramequins ».
Conserver cet actif et prévoir des illustrations privées distinctes montrant
les ramequins et les véritables gestes de la recette. Aucune image générée
ne vaut photographie documentaire ou preuve d'un essai de cuisine.

## État des maillons et preuves

| Maillon | État vérifié | Limite |
| --- | --- | --- |
| Studio/dashboard/formulaire/calendrier | Réception #221 réutilisée, inventaire privé actuel lu | Ne pas refaire sa livraison ou son réseau |
| Recette Amok | Canonique existante, 600 g poisson, 250 ml coco, 3 c. à soupe kroeung, 2 œufs, assaisonnement, combava/basilic | L'atelier ne peut changer ces quantités ni ajouter une dégustation après les ingrédients crus |
| Sélection | Sélecteur hors ligne ajouté au module éditorial existant | Aucun cron ni déclencheur automatique installé ; une date seule ne démarre rien |
| Texte éditorial | Configuration distante existante, `enabled=false`, `qualified=false` | C2 produit seulement un canevas, pas un atelier complet avec détails et scripts |
| Reprise de tâche | Correction du journal de soumission dans le Studio commun | À qualifier en Linux/CI puis en session authentifiée après livraison autorisée |
| Visuels | Adaptateur présent dans le code, configuration distante absente | Pas de génération ni de média reçu |
| Narrations | Contrat et formulaires intégrés, génération réelle désactivée | Aucun nouveau texte IA ni visa humain créé |
| MP3 | Contrats/checkpoints/backup intégrés par #225 | Fournisseur Realtime inerte ; démarrage réel et raccordement TTS non livrés |
| n8n | Workflows sociaux existants distincts de l'orchestration éditoriale | Clé API de lecture non configurée dans le Studio, inventaire distant actuel non vérifié |
| Publication | Circuit existant à préserver | Jamais autorisée par une date, une génération ou cette PR |

Les fichiers de preuve locale `live-planning.json`, `selection.json` et
`runtime-readonly.json` restent privés ; aucun export brut de configuration,
secret, brouillon ou identifiant technique n'est publié avec ce rapport.
Le relevé distant a effectué zéro écriture et zéro génération.

## Corrections proposées

`selectNextEditorialWorkshop` utilise les dernières révisions du même Studio,
ordonne les dates, préserve les identités publiées, applique les exclusions
explicites et vérifie la recette par son empreinte complète. Une référence
manquante, des doublons exacts ou plusieurs projets concurrents bloquent la
sélection. Un projet sans date existant est réutilisé ; un candidat ne reçoit
ni faux ID persistant ni fausse programmation. Ce sélecteur ne fait aucun appel.

Les soumissions asynchrones C2 et des sept narrations Coral utilisent maintenant un ID stable pour le brief exact,
la version de création, la source et le fournisseur. Le journal privé avec
verrou et intention écrite avant transport évite une seconde soumission et une
seconde réservation après perte de session ou d'accusé. La reprise ne rouvre
qu'une fenêtre de consultation GET du même job. Une corruption bloque ; elle
n'autorise jamais un nouvel essai fournisseur.

Le test C2 lance deux processus PHP concurrents avec un transport fictif : une
seule intention, une seule réservation et un seul appel, y compris lors de la
première création du répertoire de journal. Le contrat Coral vérifie aussi la
perte de session et d'accusé sans second appel des sept narrations. Ce sont des
preuves isolées, pas des productions éditoriales ou vocales.

La sauvegarde explicite reste `cmsCreationSave`, append-only et privée. Le
journal lie cette opération au même ID/version ; un rejeu identique retrouve
le même enregistrement. Un engagement de sauvegarde sans reçu final exige
une revue, sans création aveugle d'un second brouillon. Les erreurs de validation
des champs restent corrigeables ; les incertitudes de stockage restent fermées.
Ces garanties n'autorisent ni génération payante, ni validation, ni publication.

## Modèles et préparation du coût

Un seul `GET /v1/models`, non génératif, a été tenté depuis le worker et son
chargeur de secret existant : HTTP 403. Cela ne démontre ni une clé invalide,
ni l'absence d'un modèle, ni un refus des endpoints de génération. Le propriétaire
confirme ensuite depuis le projet existant que `gpt-image-1-mini` et
`gpt-realtime-2.1-mini` sont autorisés. Il s'agit d'une vérification graphique
rapportée, pas d'une génération qualifiée. Aucun secret créé, copié ou affiché.

Estimation préparatoire pour Amok, **sans appel** :

| Poste | Hypothèses | Estimation USD |
| --- | --- | --- |
| Texte | `gpt-6-luna`, contexte court ; enveloppe de préparation/rédaction des phases et sept scripts, sans nouvelle tentative payante | jusqu'à 0,12 |
| Images | cinq illustrations privées `gpt-image-1-mini`, low, 1536×1024 ; sortie 0,006 chacune et prompts courts | environ 0,05 avec entrées |
| Audio | `gpt-realtime-2.1-mini`, Coral, 12–18 minutes estimées ; 20 tokens audio/seconde, texte et instructions inclus dans la marge | environ 0,32–0,47 |
| Total de travail | ni facture ni borne externe démontrée ; à recalculer sur les scripts exacts | environ 0,50–0,65 |

Sources officielles consultées le 7 novembre : [tarifs](https://developers.openai.com/api/docs/pricing)
et [génération d'images](https://developers.openai.com/api/docs/guides/image-generation).
Une enveloppe de **0,75 USD** est proposée au propriétaire, sans l'assimiler à
un accord acquis, une autorisation de livraison ou une capacité technique.
Le devis définitif et les réservations doivent couvrir les sorties bornées et
conserver tout montant incertain sans rejeu. S'ils dépassent l'accord disponible,
bloquer avant appel. La durée finale ne peut être déduite des temps de cuisine.
Le dernier écran utilisateur à 1 USD avec limite appliquée ne constitue pas
une autorisation de cette nouvelle dépense ni une relecture actuelle de facture.

Le journal `editorial-drafts/ai-content-jobs` doit être inclus dans la sauvegarde
privée du Studio lors d'une future livraison. Dossiers 0700, fichiers 0600,
liens refusés, propriétaire contrôlé quand l'API POSIX est disponible. Pas de
purge automatique. Une restauration conserve les intentions ; ne pas effacer
un journal pour réémettre un travail incertain.

## Conditions de suite, sans consentement implicite

1. Vérifier la CI exacte de cette PR et les tests PHP Linux sur les contenus
   réels ; une réussite locale ne vaut pas livraison OVH.
2. Compléter le contrat de génération des six phases détaillées et sa provenance
   dans le formulaire commun. Le canevas C2 actuel n'est pas cette réception.
3. Raccorder explicitement la sélection au lancement autorisé et à la file
   existante. L'automatisation doit respecter exclusions, identité/version,
   limites, décision de coût et absence de nouvelle génération sur relance.
4. Réceptionner l'inventaire n8n avec une authentification autorisée en lecture,
   sans modifier/activer les workflows sociaux ni dévoiler de clé.
5. Préparer le coût total texte + images + sept chapitres audio avec les modèles
   réellement accessibles. Obtenir l'accord explicite sur le montant avant le
   premier appel facturable. Les anciens accords et le plafond du projet ne
   constituent pas cet accord pour Amok.
6. Préparer le diff de livraison ciblé, sauvegarde vérifiée et rollback ;
   obtenir une autorisation de déploiement distincte. Aucun push
   `ovh-production`, transfert SFTP ou changement de service dans cette mission.
7. Recevoir le vrai brouillon puis les visuels et sept textes ; corrections et
   décisions éditoriales/culinaires/droits humaines, empreintes exactes.
8. Achever et qualifier le fournisseur Coral existant et son autorité serveur,
   la réservation commune des coûts, les checkpoints et sauvegardes réelles.
   Aucun mini-test vocal payant ; premier appel vocal utile à l'atelier approuvé.
9. Générer une seule fois, mesurer/assembler et sauvegarder le MP3 privé ;
   demander écoute intégrale et recette réelle mobile/desktop.
10. Préparer le site et les déclinaisons sociales ; publication par approbations
    séparées. Aucun média ni validation historique n'est repris automatiquement.

**Verdicts à ce stade :** code proposé à tester/revoir ; génération éditoriale
réelle **NON VALIDÉE** ; génération audio **NO-GO** ; publication **NO-GO**.
L'objectif métier reste ouvert tant que les maillons réels n'ont pas leurs preuves.
