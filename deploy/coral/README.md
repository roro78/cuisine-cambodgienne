# Coral V2 : paquet technique avant installation

Ce dossier prépare **le worker existant** `scripts/editorial-ai-job-gateway.mjs`.
Il ne déploie rien, ne crée aucun projet OpenAI et ne constitue pas un second moteur.
Une fusion de PR ne vaut pas autorisation d'installation, d'activation ou d'appel payant.

## Runtime et réseau

L'image minimale ne contient que sept modules MJS et Node. Le Dockerfile épingle
la base linux/amd64 par digest ; `images.lock.json` consigne les références résolues.
Construire depuis le commit revu avec `SOURCE_REVISION` égal à son SHA, enregistrer
l'ID d'image produit et le conserver dans `config/release.json`. Fournir cet ID
`sha256:…` (ou une référence de registre `…@sha256:…`) à `CDC_CORAL_WORKER_IMAGE`.
Le manifeste refuse une valeur absente ; le validateur refuse un tag mutable.
Ne pas utiliser une image de test marquée `isolated-worktree` pour une installation.

Le profil `runtime` de `compose.yaml` définit un seul worker : UID/GID 1000,
racine en lecture seule, aucune capability, `no-new-privileges`, 256 Mio,
0,5 CPU, 64 processus, sans redémarrage automatique ni port publié. `EXPOSE` et
le port interne 18678 du healthcheck ne publient aucun port hôte.

Trois bridges dédiés séparent l'entrée, Ollama et la sortie HTTPS. Le worker
ne rejoint jamais `n8n_default`, ne monte ni socket Docker, ni base, ni médias.
Le seul besoin Ollama est le contrat C2 déjà partagé par la file. Coral texte
utilise OpenAI uniquement après ses gates ; aucun traitement TTS n'est ajouté.
`llama3.2:latest`, modèle C2 déjà présent sur l'hôte contrôlé, reste inchangé.

Traefik est nécessaire si le client PHP existant utilise sa route HTTPS de file.
`compose.traefik.yaml` prépare uniquement cette route, sur le point d'entrée TLS
existant, avec authentification Bearer vérifiée par le worker. Il n'ajoute aucun
port hôte. La configuration de base garde `traefik.enable=false`.
`compose.orvekio-attachments.yaml` prépare les seuls raccordements de Traefik
et du service `ollama-cpu` aux deux réseaux internes. Sa fusion avec le compose
existant et le profil CPU a été comparée **sans application** : seuls leurs
champs `networks` changent, PostgreSQL et les autres services sont identiques.
Son application peut recréer ces conteneurs : elle requiert une autorisation
de production et une fenêtre approuvée. Ne pas exécuter `up` sur tout le projet
n8n, démarrer un autre profil Ollama, ou appliquer cet overlay pendant les tests.

## Secrets, permissions et démarrage

| Élément | Destination / usage | Accès prévu |
| --- | --- | --- |
| Clé OpenAI du projet existant | `/run/secrets/cdc_coral_openai_key` | worker seul, fichier 0400, propriétaire 1000 |
| Jeton aléatoire de file, indépendant de la clé | `/run/secrets/cdc_editorial_job_token` | worker et configuration PHP privée du client ; copies privées distinctes |
| Clé de sauvegarde AES, 32 octets aléatoires encodés en 64 hex minuscules | `/run/secrets/cdc_coral_backup_key` | maintenance hors ligne uniquement, jamais le worker |

Les parents des secrets doivent être privés, hors webroot et contexte de build.
Le lecteur exige fichier régulier, non symlink, propriétaire égal à l'UID actif,
sans **aucun** droit groupe/autres ; il accepte 0400 ou 0600. Les erreurs CLI
restent génériques. La clé OpenAI ne peut pas servir de jeton de file.
Ne placer aucune valeur secrète dans `.env`, arguments, historique, dépôt,
journaux, description de PR, rapport ou sortie `compose config`.
Seuls des **chemins** non secrets et les flags sont interpolés dans Compose.

Compose autonome monte ses secrets de source fichier en lecture seule, mais
ne transforme pas leurs UID/GID/modes : préparer et contrôler les fichiers sur
l'hôte Linux, ne pas se fier à un override `uid/gid/mode` de secret Compose.
Les répertoires persistants `jobs`, `budget` et `config` sont 0700, UID 1000 ;
les fichiers d'état sont 0600. Les bind mounts refusent la création implicite
de répertoires. `jobs` et `budget` doivent être inscriptibles par le worker,
distincts ; un budget absent, public, symlink, mal possédé ou non inscriptible
interdit le démarrage externe. Une file restaurée porte un verrou de revue.

Circuit à qualifier avant toute vraie clé : lecture authentifiée du **projet
existant**, compte de service limité au besoin Responses, émission autorisée,
réception dans une interface locale masquée, protection utilisateur Windows
DPAPI, transfert mémoire par l'accès SSH déjà vérifié, réception distante
exclusive, vérification de l'UID/mode puis montage. Ne jamais demander la clé
dans une conversation. Les primitives DPAPI/SSH ont été reçues sur donnée fictive
dans le rapport antérieur ; la réception d'une clé depuis le compte et son
acquisition complète restent non reçues. Aucun secret réel n'est requis pour
les tests de cette PR. La sauvegarde des secrets applicatifs se fait par
réémission/révocation documentée et coffre indépendant, hors archives d'état.

Le service reste désactivé tant que `CDC_CORAL_START_APPROVED`,
`CDC_CORAL_MODEL_QUALIFIED` et `CDC_CORAL_ACTIVATION_APPROVED` ne valent pas
explicitement `true`. Cela provoque un **refus de démarrage**, pas une attente
saine. Le modèle autorisé et le plafond journalier doivent être fournis ; le
code conserve ses limites existantes, ses réservations avant appel et l'absence
de retry/remboursement automatique. Un plafond journalier ne remplace pas un
budget de projet. Le registre historique HTTP 401 reste conservé et inchangé.

## Sauvegarde, restauration et rollback

L'état persistant nécessaire est le suivant :

- `jobs/` entier : requêtes, empreintes, dates, résultats, `started.json`, états
  terminaux, fichiers temporaires et marqueurs. Ne pas rejouer un job commencé.
- `budget/` entier : réservations journalières, verrous et écritures temporaires.
  Une réservation incertaine reste comptée ; un verrou ancien demande un audit.
- `config/` : seulement `compose.yaml` expurgé, `runtime.json` sans secrets,
  `images.lock.json` et `release.json` (commit, ID d'image, date). Conserver aussi
  séparément le diff réseau de production approuvé et sa configuration initiale.

`scripts/coral-state-backup.mjs` produit une archive AES-256-GCM authentifiée,
exclusive, 0600, avec manifeste et empreintes. Il refuse liens, permissions
publiques, emplacements non autorisés et tailles excessives. La clé de chiffrement
doit avoir un dépôt de secours hors du VPS et du PC ; perdre cette clé empêche
la récupération. Les archives ne contiennent ni fichiers secrets, ni bases, ni MP3.

Procédure, seulement lors d'une maintenance autorisée :

1. Fermer les nouvelles soumissions côté client, arrêter **le seul worker**,
   confirmer son arrêt et l'absence d'autre processus écrivant dans cet état.
   Conserver tout marqueur d'appel commencé/incertain. `--offline` atteste cette
   vérification opérateur : le script seul ne peut pas prouver l'arrêt du service.
2. Préparer un **nouveau** répertoire d'archive privé 0700, distinct de l'état et
   des sauvegardes historiques. Utiliser le service `coral-backup` du manifeste
   maintenance, avec le même ID d'image revu. Le réseau est `none`, l'état est
   monté RO et seule la clé de sauvegarde est fournie. `coral.enc` existant ne
   peut pas être écrasé. Consigner son SHA256 hors de l'archive et copier l'archive
   chiffrée vers le dépôt de secours. Ne pas modifier les anciens timers/archives.
3. Tester avec `coral-restore` dans un parent de récupération séparé 0700. La
   destination `new-state` doit être absente. Aucun état courant n'est écrasé ;
   vérifier authentification, empreintes, modes 0700/0600 et réservations.
4. La restauration crée `jobs/.restore-review-required` **avant** les données.
   Le bootstrap refuse alors de démarrer. Rapprocher chaque job et toute dépense
   possible avec les registres courants, y compris le registre 401 historique.
   Une archive ancienne ne doit jamais effacer des réservations plus récentes.
   Préserver les jobs commencés, neutraliser les jobs en attente non réautorisés
   et conserver la décision de revue. Aucune suppression automatique du verrou
   ni reprise automatique des jobs restaurés n'est fournie.
5. Pour rollback, garder les soumissions fermées, arrêter le nouveau worker et
   retirer uniquement sa route. Conserver état et archives. Revenir à l'ID d'image
   antérieur seulement s'il est compatible et autorisé ; en première installation,
   revenir à l'absence du service. Les réseaux dédiés encore attachés à Traefik ou
   Ollama peuvent rester inutilisés ; leur détachement/recréation est une autre
   modification de production, à autoriser. Aucune restauration de base, aucun
   `down -v`, prune global, effacement de budget ou reprise TTS ne fait partie
   du rollback.

Prévoir une sauvegarde hors ligne avant chaque changement Coral et une cadence
approuvée selon le RPO attendu. Aucune planification système n'est installée par
cette PR. La conservation externe et la récupération après perte du PC restent
à recevoir sur le vrai coffre, sans manipuler de clé dans les tests.

## Recette reproductible et limites

Les tests Node sont sans dépendance externe :

```sh
node --test tests/editorial-job-runtime.test.mjs tests/coral-state-backup.test.mjs tests/coral-compose.test.mjs tests/coral-openai-secret.test.mjs tests/editorial-ai-job-gateway.test.mjs tests/coral-external-job-provider.test.mjs
node scripts/test-coral-runtime-docker.mjs
```

Le second nécessite un Docker Linux local et OpenSSL, pas Docker Desktop sur le
PC Windows. Il refuse les endpoints Docker distants ; sur un daemon partagé avec
la production, il exige l'opt-in explicite `CORAL_TEST_ALLOW_SHARED_DAEMON=1`.
Il crée uniquement des noms/labels temporaires propres, deux réseaux internes,
des volumes fictifs, un faux Ollama et un Traefik sans socket/ACME/port hôte.
Toutes les sondes TLS vérifient une CA éphémère ; aucune vérification TLS n'est
désactivée. Aucun conteneur de test ne rejoint un réseau de production.
CPU/RAM/processus sont bornés. L'initialisation/nettoyage de la seule fixture
utilise un conteneur root aux capabilities limitées ; le worker reste non root.

La recette normalise les deux manifests avec le vrai Compose, puis teste les
conteneurs avec les mêmes contraintes. Elle ne fait pas `compose up` sur les
manifests d'installation. Elle teste le provider Traefik fichier dans une copie
isolée de la version installée ; le provider Docker/ACME et le client PHP réels
restent une réception post-installation autorisée. Le parcours C2 utilise un faux
Ollama ; le démarrage externe lit une fausse clé **sans soumission Coral**, sans
accès réseau externe. La qualité des sept chapitres, le vrai compte API, la
facturation, la livraison OVH et le TTS ne sont pas prouvés par cette recette.

La CI dédiée répète cette recette sans secret GitHub, sur runner jetable et publie
un reçu expurgé. Le rapport avant installation doit distinguer ces preuves d'une
autorisation d'exécution sur la production.

Références : [secrets Compose](https://docs.docker.com/compose/how-tos/use-secrets/),
[réseaux Compose](https://docs.docker.com/reference/compose-file/services/#networks).
