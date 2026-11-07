# Réception du workflow éditorial — 7 novembre 2026

Mission #205, PR #226, base main : `6a57b3d7520184e4f82998f554b88dec545d2e51`.
**État initial de préparation de #226.** La livraison et le premier appel réel
sont actualisés dans [le rapport Amok et reprise contrôlée](CMS-AMOK-PREMIER-APPEL-ET-REPRISE-20261107.md).
L'atelier complet reste non reçu.

## Atelier réel retenu

La lecture du calendrier privé a trouvé trois projets : qualification technique,
modification liée à Bai Sach Chrouk sans date, modification liée au kroeung
datée du 12 novembre. Kroeung est explicitement exclu et intégralement conservé.
Les identités publiées ne sont pas des commandes de nouvelle génération.

Aucun nouvel atelier éligible n'était programmé. Le repli demandé est
**Amok Trey — Réussir un poisson au lait de coco à la vapeur**.
Un vrai brief privé **v1** a été créé par `cmsCreationSave`, recette explicitement
liée, sans date inventée, origine manuelle, reviewed=false. Les huit versions
historiques conservent leurs empreintes. Ce brief n'est pas une production IA.
Reçu local privé : `private-brief-receipt.json`.
Empreinte de l'enregistrement :
`69148d476191b5bd36a46b40f160623e821bd543f28468c4130153428a8897d0`.

La recette `recette:amok-trey` figure dans les trois index réels. Empreinte :
`67277bfaf88761c9ad5d5a79d1375052302192bb21eabd4ad98812fda26283b5`.
600 g poisson, 250 ml coco, trois cuillères à soupe kroeung, deux œufs,
assaisonnements, combava/basilic, quatre ramequins. Goûter la base avant les
œufs et le poisson crus, jamais ensuite. L'image historique montre une feuille
de bananier : conserver son alt fidèle et l'actif. Les futures illustrations
privées doivent montrer les ramequins et les vrais gestes ; elles ne constituent
pas des photos documentaires ni la preuve d'une recette essayée.

## Corrections implémentées, non livrées

- Sélection dans le module éditorial et le calendrier existants : dates
  prioritaires, identités publiées/exclusions préservées, recette explicite,
  doublons bloqués. Aucun cron, second CMS ou moteur parallèle. Une date seule
  ne déclenche rien ; lancement authentifié par le bouton commun et CSRF.
- Contrat fermé `cdc-coral-v2-workshop-request-v1` : champs éditoriaux communs,
  six phases détaillées, difficulté/durée/allergènes/sécurité et sept textes.
  Le profil est explicitement projeté dans la préparation initiale éditable ;
  résumé SEO et provenance privée distincts.
- Une proposition de phases puis sept chapitres bornés : huit appels maximum,
  référentiels permanents et recette liés par empreintes, recherche préalable
  d'au moins deux sources indépendantes, absence d'essai culinaire explicite.
  Ingrédients, ordre, durée et lexique contrôlés ; justesse culinaire et
  quantités restent à relire humainement.
- Journal durable avant transport, y compris anciens C2/sept narrations :
  concurrence, perte de session/accusé et relance ne resoumettent pas.
  Corruption ou intention incertaine bloquent ; aucun retry fournisseur.
- Proposition dans le formulaire commun puis sauvegarde explicite append-only
  d'une v2 du même ID. Aucun autosave, visa humain ou publication automatique.
- Activation fermée par défaut ; modèle, ID et source bornés, bail de 48 h
  maximum dans le même mois UTC, plafond mensuel worker 0,75 USD.
  Autorité revérifiée avant chaque appel et réservation des huit avant le premier.
  Tentatives, sorties et usages privés conservés ; coûts incertains non libérés.
- Image de base immuable, UID1000, secrets existants en fichiers séparés,
  aucun nouveau port ni changement Traefik/DB/n8n. CI : paquet Docker inerte
  avec SHA source, ID d'image et empreinte d'archive, sans registre ni déploiement.

## Preuves et limites

Tests isolés Node/PHP : réservation avant appel, huit reçus, réponse invalide,
révocation, plafond, refus du rejeu et sauvegarde AES/restauration des nouvelles
sorties fictives, avec marqueur bloquant de revue après restauration.
Navigateur local à **390 et 1400 px** : authentification/CSRF, quatre boutons,
calendrier → une tâche → six phases/sept textes → formulaire commun → v2 explicite,
v1 et ancien brouillon intacts, aucune approbation, aucun débordement horizontal.
**Toutes ces générations sont fictives, sans vraie clé ni appel fournisseur.**
Les contrôles Windows ne remplacent pas les permissions POSIX Linux ou OVH.

Les résultats Linux/Docker/CI seront cités sur le SHA final dans #205.
Les six workflows verts de `2d26db34` précèdent le contrat complet :
ils ne constituent pas sa preuve.

Un seul GET gratuit `/v1/models` depuis le chargeur de secret existant a répondu403.
Cela ne démontre ni clé invalide ni modèle absent. Le propriétaire confirme
graphiquement l'autorisation de `gpt-image-1-mini` et
`gpt-realtime-2.1-mini` dans le projet existant ; endpoints de génération encore
non reçus. Aucun secret créé/copié/affiché, aucun appel payant effectué.

## Recherche et devis

Sources primaires consultées le 7 novembre :
[Chef Nak](https://chefnak.squarespace.com/cambodian-fish-amok),
[Ambassade du Cambodge / Eleven One Kitchen](https://www.cambodiaembassyuk.org/fish-amok-recipe/),
[FoodSafety.gov](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures).
Les recettes externes sont des variantes, pas une substitution à la canonique.
Seuils officiels : poisson63°C, plats aux œufs71°C. Le seuil supérieur pour le
mélange est une proposition conservatrice à valider, pas un essai culinaire.
Le paquet opérationnel privé doit être borné, lié à la source et réel ;
ne jamais installer les sources fictives des tests.

Le propriétaire a autorisé **0,75 USD maximum pour Amok seul** : textes,
cinq illustrations privées, sept chapitres complets. **Cet accord n'autorise
ni livraison ni publication ; les sept textes exacts doivent être validés avant l'audio.**

| Poste | Hypothèses | Estimation USD |
| --- | --- | --- |
| Texte | gpt-6-luna, huit appels bornés, sans retry | réservation maximale 0,0653 |
| Images | cinq gpt-image-1-mini, low1536×1024, prompts courts | environ0,05 |
| Audio | gpt-realtime-2.1-mini, Coral, environ12–18min | environ0,32–0,47 |
| Total de travail | à recalculer sur scripts exacts et sorties bornées | environ0,50–0,65 |

Sources : [tarifs](https://developers.openai.com/api/docs/pricing),
[images](https://developers.openai.com/api/docs/guides/image-generation).
Devis, pas facture. Si les bornes maximales dépassent le reliquat de0,75,
bloquer avant appel. Le plafond de projet1USD rapporté antérieurement ne
remplace pas la limite de mission ou sa réservation.

## Livraison proposée et rollback

Première étape à autoriser séparément : trois PHP Studio (`index.php`,
`lib.php`, `coral-v2-ai.php`), contrat public généré seulement si son empreinte
diffère, image du seul worker existant, paramètres privés non secrets de portée
Amok/source/bail et recherche réelle. Images, TTS et publication restent fermés.

Avant transfert : empreintes installées, copie ciblée vérifiée hors webroot,
configuration privée/brouillons/journal inclus, nouvelle sauvegarde sans toucher
aux archives historiques. État Coral sauvegardé hors ligne après gel autorisé
du seul worker : jobs, budgets, tentatives, reçus/sorties, autorisations et
checkpoints. Chiffrement existant, nouvelle archive hors site, empreinte comparée,
restauration isolée sans appel avant activation. Une copie à chaud ne vaut pas
sauvegarde hors ligne cohérente.

Retour arrière : fermer la génération, revenir à l'ancienne image/configuration
du seul worker, préserver budgets/intentions sans rejeu. L'ancien PHP #220 ne
comprend pas le nouveau scope de provenance pour l'édition : préférer le Studio
compatible avec flags fermés. Si retour PHP indispensable, garder le nouveau
brouillon intact et en lecture seule jusqu'au rétablissement compatible.
Ne pas maquiller la provenance, supprimer des versions ou effacer une dépense.
Aucun down-v, prune, restauration de base ou remplacement des MP3.

## Verdicts

**Code :** revue et CI sur le SHA final avant proposition de livraison.
**Texte réel : NO-GO tant que livraison ciblée et sauvegarde ne sont pas autorisées/vérifiées.**
**Audio : NO-GO** : fournisseur Realtime encore inerte, raccordement/réservations
communes à achever et qualifier, sept textes exacts à recevoir puis valider.
**Visuels : non reçus** : adaptateur existant, configuration distante absente,
cinq médias privés versionnés avec provenance/droits à produire.
**Publication : NO-GO**, approbation séparée obligatoire.

n8n actuel non inventorié : clé de lecture absente du Studio et interfaces
graphiques indisponibles. Aucun workflow social modifié ou activé. Le parcours
utile réutilise calendrier/file existants sans revendiquer une preuve n8n.

Suite : livraison autorisée, vrai travail texte utile, sauvegarde explicite,
revue éditoriale/culinaire, cinq visuels privés, validation des sept textes,
qualification puis audio complet utile, assemblage/mesures, sauvegardes,
écoute intégrale mobile/desktop et préparation de diffusion. Aucun mini-test
vocal payant. L'objectif métier reste ouvert jusqu'à ces preuves réelles.
