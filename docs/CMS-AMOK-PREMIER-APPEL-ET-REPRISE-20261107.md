# Amok : premier appel réel et reprise contrôlée — 7 novembre 2026

Suivi #205. #226 est fusionnée en `f3b3be885c4b3875d7f9339825c3a8c780d88e8c` ;
son arbre est identique au candidat approuvé `cf4b4c7`.
La CI de main #42385469914 est SUCCESS. Les anciens audits SSH, Docker et
réception Studio #221 sont réutilisés, sans les déclarer invalides.

## Production effectivement reçue

Trois PHP livrés : index, bibliothèque et module Coral du Studio commun.
Copie de rollback vérifiée hors webroot, lint, empreintes après transfert,
connexion200 et helpers403. Treize fichiers privés contrôlés inchangés.
Le nouveau worker garde le registre401, aucun port publié ; les treize autres
conteneurs ont gardé leur identité/démarrage/redémarrages/statut.
Les manifestes déjà installés sont conservés ; le template de dépôt non
guillemeté pour tmpfs n'a pas servi à la recréation.

Les archives `coral.enc` et `operations.enc` ont été téléchargées depuis
OneDrive par le propriétaire puis retrouvées dans Downloads avec le ZIP.
Leurs empreintes, y compris les entrées ZIP, correspondent aux originaux.
Ces copies ont été restaurées en tmpfs, sans réseau : sept entrées d'état
Coral et vingt-deux fichiers opérationnels, sans copie persistante en clair.
Les formats restent distincts ; le contrat strict de sauvegarde Coral n'est
pas élargi pour y faire entrer la configuration du Studio.

Le vrai brief Amok v1 reste privé, sans date inventée, reviewed=false.
La recette canonique est `recette:amok-trey`, empreinte
`67277bfaf88761c9ad5d5a79d1375052302192bb21eabd4ad98812fda26283b5`.
Kroeung, les autres brouillons, les MP3 et les données historiques sont intacts.

## Premier appel réel, puis arrêt

L'activation temporaire a repris les secrets existants et les adaptateurs
HTTPS du Studio. Aucun nouveau secret ou moteur. Un seul job a été soumis
par les fonctions installées du Studio, sur sa file existante :
`8dda4087657bfdd5095638215f39484e508134310700ae49`.
Il s'agit d'un appel opérateur par SSH aux fonctions communes, pas d'une
nouvelle preuve de navigation administrateur graphique.

OpenAI Responses / gpt-6-luna a répondu : 9959 tokens d'entrée et 2502 de sortie.
Coût calculé à partir de ces usages et des tarifs configurés : **0,002247 USD**.
Ce n'est pas une facture ni une lecture du dashboard OpenAI.
La sortie de phases fait 10670 octets, SHA256
`41fffcda45e5d6913e933ac6f81b7de6bc8393b6c2b1b187b00adb398747a33a`.
Elle reste privée et inchangée, avec sa tentative et son reçu.

Le validateur a arrêté le travail avant les sept textes :
`JOB_WORKSHOP_PROFILE`, reproduit sans réseau sur la sortie conservée.
Deux écarts : libellés `Poisson` / `Œufs` au lieu des minuscules singulières
attendues, et 55 minutes annoncées contre 58 pour 5+10+7+8+25+3.
Les six IDs et les noms/couverture des ingrédients passent le contrat.
Cela ne constitue ni un essai de cuisine ni une approbation éditoriale.

La génération a été refermée sur les deux hôtes, configuration Studio
antérieure restaurée. Aucun retry fournisseur ; aucune image, voix ou
publication. Le job FAILED et sa réservation de **0,06530007 USD** restent
conservés. Le GET /models403 antérieur n'empêche donc pas l'accès texte,
désormais reçu sur un vrai travail utile ; images/voix restent non reçues.

## Correctif proposé, pas encore livré

Les deux contrôles gardent leur rôle : l'absence d'un des allergènes reste
bloquante ; casse/pluriel français et graphie oe sont reconnus sans supprimer
de libellé. Le total estimé est dérivé des six durées, avec un reçu privé de
projection (55 déclaré → 58 dérivé). Aucun ingrédient, quantité, durée de phase
ou texte de sécurité n'est modifié. La réponse brute reste immuable.
La justesse des estimations et du contenu reste à relire humainement.

Le template source tmpfs est aussi guillemeté pour conserver un seul montage.
Le contrôle Docker porte désormais sur la vraie sortie Compose : une seule
entrée tmpfs avec les options privées, et non sept éléments YAML. Ce changement
de source ne remplace pas les manifestes de production déjà installés.

La continuation est une **nouvelle tâche explicitement demandée dans la même
file**, liée au job source et à l'empreinte de sa sortie. Aucun nouveau moteur,
port ou fournisseur. Elle refuse avant appel : source différente, origine déjà
continuée, job non FAILED, reçu incomplet/corrompu, autre modèle, absence de
réservation, phase invalide ou toute tentative de chapitre déjà présente.
Une projection préexistante doit elle aussi correspondre exactement.

L'opérateur fournit la référence de continuation dans la configuration privée,
jamais dans des champs éditoriaux publics. Le Studio vérifie son journal
original : même brief/version/source/fournisseur et absence de sauvegarde.
La même tentative d'atelier conserve son quota original ; le worker réserve
séparément les sept appels et réclame exclusivement le checkpoint sous verrou
durable. Deux continuations ne peuvent pas générer deux séries de textes.
La perte de session ne crée pas un nouvel ID ; aucun retry automatique.

La phase conservée est relue, projetée et validée localement ; elle n'est pas
redemandée à OpenAI. Seuls les sept chapitres encore non tentés sont générés.
Leur provenance indique la source, l'empreinte et la projection. Toute nouvelle
incertitude arrête la série. Cette première reprise ne prétend pas réparer
automatiquement un chapitre déjà tenté, ni autoriser des chaînes de reprises.

## Budget et preuves

L'accord du propriétaire reste **0,75 USD maximum pour Amok complet**.
L'ancienne réserve n'est ni effacée ni remboursée. La continuation réserve
au maximum **0,05530007 USD** pour les sept appels, soit **0,12060014 USD** de
réservations prudentes cumulées avant images/audio. Cela ne représente pas une
nouvelle facture. Toutes les limites journalières/mensuelles existantes restent
appliquées avant appel ; si les étapes suivantes ne tiennent plus dans le
reliquat, elles sont bloquées avant dépense.

Tests hors production : profil réel relu sans API et validé après projection ;
fixtures synthétiques pour la suite, concurrence de continuations, sept appels
uniques, journal et ancien reçu intacts, refus de rejeu/corruption/incertitude,
plafond avant appel, sauvegarde/restauration et formulaire commun PHP.
Les résultats CI exacts doivent être cités dans #205 après exécution ; aucune
preuve fictive n'est assimilée à sept narrations réelles.

## Livraison suivante et décisions

Périmètre proposé : nouveau module PHP Coral seul, image du worker existant,
réglage privé de continuation/bail. Index, bibliothèque PHP, Traefik, bases,
Ollama, n8n et médias restent hors transfert. Sauvegarder l'état avec les
nouveaux reçus/ledger/journal avant modification, dans une nouvelle archive,
puis vérifier restauration et conservation hors site. Ne pas réutiliser un
état antérieur au paiement pour reprendre une tâche.

Une autorisation de fusion/livraison sur le nouveau SHA reste nécessaire :
l'accord pour #226 ne vaut pas déploiement d'un autre code. Après accord,
réactiver la portée limitée, soumettre la continuation une seule fois,
recevoir/corriger puis sauvegarder explicitement la v2 du même brief via le
formulaire et le stockage communs ; reviewed=false, sans date ou visa inventé.
Refermer la génération et demander la validation humaine des sept textes.

Rollback : fermer les flags et restaurer le transport antérieur ; garder
image compatible et données. Ne jamais effacer une réserve, un reçu, le job
FAILED ou sa provenance pour relancer. Aucune restauration de base ou MP3.

**GO accès texte réel. Correctif à qualifier sur son SHA final. NO-GO reprise
avant CI, sauvegarde et autorisation de livraison. NO-GO atelier complet,
audio et publication.** Les cinq illustrations et le MP3 restent une étape
ultérieure ; aucun audio ou visuel n'est autorisé dans cette livraison.
