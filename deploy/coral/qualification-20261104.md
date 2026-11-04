# Qualification technique Coral V2 — 4 novembre 2026

Reprise du rapport NO-GO préalable et du dernier commentaire de #205, sur la base
`fdaa254c848edd3869651cce11cd10f4240efc7c`, dans un worktree séparé. Les services
de production, données et médias ne sont pas déployés/modifiés par ce lot.

**GO technique pour le paquet et sa recette isolée. NO-GO pour une installation
avec secrets réels ou une activation en production tant que les conditions
ci-dessous ne sont pas reçues et expressément autorisées.** Les checks de PR
doivent être verts sur le commit effectivement présenté avant toute fusion.

## 1. Corrections implémentées

- Bootstrap existant : loopback par défaut, écoute Docker explicitement choisie,
  jeton privé depuis un fichier, erreurs génériques, arrêt sur configuration
  invalide. Contrôles UID/modes/liens et volumes inscriptibles avant l'écoute.
- Image Node 22 linux/amd64 épinglée par digest, worker non root, stockage et
  secrets séparés, montages RO, aucune publication de port, aucun réseau ou
  volume PostgreSQL. Les gates et réservations existants restent en place.
- Route Traefik et raccordements privés préparés ; overlay non appliqué.
- Sauvegarde chiffrée hors ligne, restauration exclusive dans un nouvel état,
  verrou de revue empêchant un redémarrage/rejeu automatique, rollback documenté.
- CI de non-régression existante complétée et recette Docker isolée ajoutée.

## 2. Tests réellement exécutés

Sur le VPS, uniquement dans des ressources de test créées pour cette mission :

| Preuve | Résultat |
| --- | --- |
| Tests Node dans l'image Linux épinglée, réseau `none` | 27 pass, 0 fail, 0 skip, Node 22.23.4 |
| Recette Docker/TLS | 28 contrôles passants, dont conservation de 8 conteneurs préexistants |
| Authentification | 401 anonyme, soumission C2 fictive authentifiée 202, résultat via faux Ollama |
| Permissions/démarrage | refus secret 0644, mauvais propriétaire, volume de file RO, flags externes absents ; clé fictive lue sans génération |
| Secrets/réseau | fichiers montés RO, aucune clé/jeton dans l'environnement ou les logs vérifiés ; aucun port hôte ; aucun réseau de production |
| Sauvegarde/restauration | AES-GCM, nouvel état, 0700/0600, réservation conservée, redémarrage bloqué par revue |
| Nettoyage | 9 conteneurs et les deux réseaux propres à la recette supprimés |
| Overlay réel, profil CPU, comparaison en lecture seule | seuls les champs réseaux Traefik/Ollama changeraient ; PostgreSQL identique |
| Conservation indépendante du diagnostic précédent | 8 conteneurs, 3 configurations et 2 fichiers du registre HTTP 401 inchangés |

Les tests Node couvrent aussi les secrets non réguliers/symlinks, le budget privé,
le refus de restauration sur une cible existante, la clé de chiffrement erronée,
l'altération d'archive et la traversée de chemins. Le registre 401 n'est ni remis
à zéro ni rejoué. Aucun MP3 ou volume historique n'est monté dans les tests.
Le PC Windows n'utilise pas Docker Desktop pour cette recette.
Les reçus détaillés et empreintes sont conservés localement ; la CI republie
un reçu expurgé pour le commit qu'elle teste. Les essais initiaux du banc de test
ont été corrigés avant la recette finale passante.

## 3. Tests non effectués et limites

Pas de vraie clé, lecture actuelle du compte OpenAI, appel payant, génération de
chapitre réel, TTS, modèle Ollama réel invoqué, ou publication. Les modèles/prix
du fournisseur ne sont pas requalifiés par ce lot. La réception de la clé depuis
le compte et la récupération du coffre réel après perte du PC restent à recevoir.

Le test Traefik utilise une copie isolée de la même version avec provider fichier
et CA éphémère vérifiée. La vraie découverte Docker/ACME, le raccordement PHP
hébergé et le parcours HTTPS de production exigent une réception autorisée après
installation. La comparaison Compose ne l'applique pas. Les tests de conservation
prouvent l'absence de reconfiguration/redémarrage provoqué, sans constituer une
recette métier exhaustive des services de production.

## 4. Blocages restants

1. Confirmer le projet API existant, ses rôles/scopes, plafonds effectifs, modèles
   et comptes/clés éventuels ; ne pas recréer le projet.
2. Qualifier le circuit complet de réception privée de la clé et le coffre de
   secours ; émettre et transférer seulement après autorisation dédiée.
3. Faire approuver modèle, budget et éventuelle qualification payante séparée.
4. Préparer et recevoir les vrais chemins/UID/modes, coffre et copie d'archive
   hors hôte ; aucun timer ni emplacement réel n'est créé dans cette mission.

## 5. Intervention humaine nécessaire

Validation du compte dans une session authentifiée, décisions de budget et
autorisations explicites. Si la session de compte n'est pas pilotable, une simple
ouverture graphique du projet existant suffit comme point d'entrée ; aucune
saisie de commande KVM n'est demandée. Aucun secret à transmettre en conversation.

## 6. Conditions pour autoriser l'installation

Revue de cette unique PR et CI verte sur le SHA retenu ; levée des quatre points
précédents ; image construite depuis ce SHA et ID immuable consigné ; sauvegarde
avant toute modification ; fenêtre de raccordement Traefik/Ollama approuvée ;
plan de rollback accepté ; autorisation d'installation distincte d'une autorisation
d'appel payant. Après installation autorisée, recevoir sans génération les vrais
montages, healthcheck, TLS/401 et client PHP avant d'envisager une activation.

Le [guide opératoire](README.md) décrit les manifests, données persistantes,
procédures de sauvegarde/restauration et limites du rollback. Cette qualification
ne déclenche aucune fusion, installation ni reprise automatique de Coral.
