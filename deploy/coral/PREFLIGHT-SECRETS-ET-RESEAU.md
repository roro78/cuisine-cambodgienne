# Coral V2 — préflight d'installation et de secrets (sans déploiement)

**Document de réception, pas autorisation.** Référence pour les agents Codex, Work et ChatGPT. Ce contrôle doit être rempli à partir de preuves **observées**, sans écrire de secret dans GitHub, la conversation ou les journaux. Lire aussi `AGENTS.md`, `docs/OVH-DEPLOYMENT-RUNBOOK.md`, `deploy/coral/README.md` et le ticket #205.

## État documenté au 4 novembre 2026

- Projet OpenAI API **« Cuisine du Cambodge » existe déjà** : ne pas recréer. Captures fournies par le propriétaire : **1,00 USD de plafond appliqué**, 0,00 USD consommé, alertes 80 % et 100 % ; seuls `gpt-6-luna` et `gpt-6.1-terra` affichés comme autorisés. « No spend limit set » vu antérieurement concernait le projet **Default**, pas celui-ci. Les montants et accès doivent être revérifiés avant utilisation réelle.
- Un membre est affiché comme **Organization Owner** ; aucun **service account** répertorié sur le projet. La création d'un compte de service et la réception privée de sa clé n'ont **pas** été faites.
- #215 (runtime Docker privé et sauvegarde) et #217 (IPAllowList, RateLimit, InFlightReq Traefik) sont fusionnées dans `main`. Le code, les tests et les contrats ne sont **pas** une installation sur le VPS ; le Studio PHP mutualisé ne dispose pas d'une route Coral reçue.
- L'accès SSH/SFTP **PC Windows → VPS Orvekio** a été validé via `orvekio-vps` ; l'environnement cloud d'un agent **n'hérite pas** de cet accès. L'accès mutualisé `cuisinedh@ssh.cluster102.hosting.ovh.net` est indépendant.
- Aucun secret réel, appel OpenAI payant, génération de sept textes, MP3 ou TTS reçu en production par ce lot.

## A — Compte de service API, projet EXISTANT

1. Dans une session authentifiée du propriétaire, sélectionner le projet **Cuisine du Cambodge**, et vérifier son identité (ne pas publier les identifiants), son budget *enforced* à 1,00 USD, ses modèles, éventuels plafonds organisationnels, limites de débit, rôles et autorisations.
2. **Après autorisation de création de compte uniquement** : `Project → Members → Service accounts → Create` (le libellé UI peut varier). Nom distinct de tout autre produit. La création émet une clé **affichée une seule fois** : **ne pas cliquer sur Create** avant qu'un récepteur privé, vérifié et disponible soit prêt. Ne jamais utiliser un champ de conversation, un commentaire GitHub ni une capture montrant la clé.
3. Les clés de compte de service ont par défaut des permissions larges ; immédiatement après l'émission, ouvrir **API Keys** du même projet et réduire les droits aux actions réellement nécessaires pour `POST /v1/responses`, selon la granularité effectivement disponible. Désactiver tout accès non indispensable (audio, fichiers, fine-tuning, autres projets). Vérifier le résultat en lecture. Si réduction impossible : **NO-GO activation** et révoquer la clé non conforme via la console.
4. Ne pas modifier le budget ni ajouter d'autres modèles par défaut. Vérifier la disponibilité et **les tarifs réels** des modèles sur le compte au moment de la qualification ; les constantes de coût dans le code sont des hypothèses qui doivent être comparées aux tarifs officiels avant toute dépense. Hard limit, réservations applicatives et absence de retry sont trois protections distinctes.

**État attendu :** projet vérifié, identité de service dédiée aux permissions minimales, preuve de réception privée de clé (sans jamais exposer la valeur), budget toujours appliqué. Aucune opération payante n'est incluse.

## B — Canal privé et stockage : prérequis avant émission de clé

1. Un canal existant est documenté : **Windows (VS Code/OpenSSH/SFTP) → Orvekio**, alias `orvekio-vps`. Réutiliser la connexion attestée, avec empreinte de serveur vérifiée. Aucun KVM ni nouvelle passerelle nécessaire pour la procédure normale.
2. Qualifier **avant création** le circuit d'une valeur **fictive** : réception locale masquée (pas de variable shell conservée ni d'historique), protection Windows DPAPI le temps du transfert si nécessaire, acheminement privé SSH/SFTP, écriture atomique exclusive dans un fichier privé sur VPS, owner **UID 1000**, permission **0400 ou 0600**. Ne pas copier le secret vers l'image Docker, `.env`, une commande visible, des logs ou GitHub.
3. Les secrets sont distincts : clé OpenAI, jeton de file CMS/worker, clé AES-GCM de sauvegarde. Le CMS PHP **n'obtient que le jeton de file**, jamais la clé OpenAI. Le worker n'obtient jamais la clé de sauvegarde.
4. Contrôler dans l'image isolée le montage Compose en lecture seule et la lecture par l'UID du worker, **sans afficher** la clé. La configuration doit refuser l'absence de fichier, les liens symboliques, droits trop larges, propriétaire incorrect et valeurs invalides.
5. Prévoir révocation/rotation et **coffre de secours indépendant du PC et du VPS** avant toute clé réelle. Une valeur perdue ou compromise doit être réémise/révoquée, pas exportée dans un rapport.

**NO-GO absolu** tant que le récepteur privé et le coffre de secours ne sont pas attestés. Il est permis de préparer et tester avec des secrets fictifs.

## C — Adresse de sortie du Studio PHP OVH mutualisé

Le DNS de `www.cuisine-du-cambodge.com` décrit l'adresse **d'entrée** du site, et ne prouve pas l'IP de sortie des appels `curl` PHP vers `n8n.orvekio.com`. Une IP publiée par une commande exécutée sur le **VPS Orvekio** n'est pas non plus l'IP de sortie du mutualisé.

1. Depuis une session **SSH authentifiée du mutualisé** (ou un outil équivalent autorisé), mesurer en lecture seule la sortie IPv4/IPv6 **du même contexte réseau** que l'appel cURL PHP. On peut faire une requête HTTPS sans jeton vers un service d'écho d'IP reconnu, en informant le propriétaire que le service d'écho verra l'IP source. Privilégier un test PHP CLI contrôlé depuis le même serveur, sans déposer d'endpoint de diagnostic public ni de fichier permanent sous webroot.
2. Confirmer la stabilité des sorties sur plusieurs essais ; vérifier tout proxy/NAT/CDN et le chemin effectif vu par Traefik. Une IP provenant du DNS public ou d'un simple en-tête `X-Forwarded-For` non fiable est insuffisante. En présence d'un proxy, appliquer une stratégie IP conforme à la topologie des **proxies de confiance** et contrôler les IP réellement vues, sans élargir aveuglément la liste.
3. Inscrire **uniquement dans la configuration privée** `CDC_CORAL_ALLOWED_SOURCE_CIDRS` les sorties vérifiées, avec le périmètre le plus étroit raisonnable. Le validateur rejette les CIDR trop larges. **Jamais** `0.0.0.0/0` ou `::/0`.
4. Avant installation, tester sur un Traefik isolé puis, après autorisation d'installation uniquement, vérifier : IP refusée → accès refusé, IP admise sans bearer → 401, bearer invalide → 401, requêtes trop rapides/simultanées limitées, GET/PUT autorisés uniquement, pas de fuite de jeton. Les seuils de 120/min, rafale 12, 4 en vol sont **provisoires** : les ajuster sur le vrai polling du client PHP.
5. Les réglages Traefik du VPS (provider Docker, ACME, labels, réseau) doivent être comparés au runtime effectivement en place avant raccordement ; **aucune ouverture d'un port hôte** ni changement global du service n'est autorisé par cette procédure.

**NO-GO** si l'IP de sortie réelle et la topologie de proxy ne sont pas déterminées et testées.

## D — État persistant, sauvegarde hors hôte et reprise

1. Relever en **lecture seule** les chemins réels et propriétaires UID/GID de `jobs/`, `budget/`, `config/` ; relever les conteneurs/réseaux Traefik et Ollama existants et les paramètres attendus, sans modifier de service. Ne jamais altérer PostgreSQL, n8n, Qdrant, les contenus, MP3 ou le registre historique 401.
2. Avant installation : préparer un nouvel emplacement privé pour l'état Coral et un répertoire d'archives distinct, **sans effacer les sauvegardes existantes**. Vérifier la capacité, les permissions, une clé de sauvegarde à conservation indépendante et la configuration de l'image par **digest immuable**.
3. Sur données **fictives** uniquement, recevoir un cycle hors ligne : backup AES-256-GCM → SHA-256 → copie vers coffre extérieur à Orvekio → récupération sur machine isolée → restauration dans **un nouveau répertoire** → comparaison des réservations de budget et du marqueur `.restore-review-required`. La restauration ne doit jamais relancer des jobs ni rembourser des réservations incertaines.
4. Documenter le plan de rollback avant toute écriture : fermer les soumissions, arrêter seulement Coral, conserver son état, retirer sa route après validation du diff, revenir à l'absence du service lors de la première installation. Ne jamais faire `docker compose down -v`, `prune`, `reset --hard` ni restaurer PostgreSQL pour ce lot.
5. Sauvegarde **réelle** et restauration isolée sont des étapes distinctes du test fictif. Le matériel de sauvegarde et les emplacements persistants ne peuvent être déclarés « reçus » sans vérification pratique.

## E — Décisions séparées (ne jamais les regrouper)

| Décision | Condition de passage | Effet autorisé |
| --- | --- | --- |
| Fusion GitHub | SHA, revue, CI verte, accord du propriétaire | Code dans `main` **seulement** |
| Préinstallation non sensible | Inventaires/contrats, tests fictifs et lecture seule | **Aucun** secret, conteneur réel ou route |
| Création compte de service / clé | Accord spécifique, récepteur privé et coffre prêts | Une clé scellée, pas d'appel payant |
| Installation Docker/réseau | Sauvegarde + restauration, route privée qualifiée, modèles/budget, rollback, **accord explicite distinct** | Installation sous drapeaux désactivés, aucun appel API |
| Qualification API facturable | Montant max vérifié, budget et modèle qualifiés, **accord payant distinct** | Un essai strictement borné et tracé |
| Validation des sept chapitres / TTS | Relecture culinaire et visa humain, autorisation audio séparée | Nouveau contenu versionné, jamais écrasement des MP3 historiques |

**Rapport de sortie exigé :** statut PASS/FAIL/UNKNOWN par ligne, preuves datées avec SHA, secrets expurgés, prochaine action minimale. Un avis « GO installation » ne doit jamais être extrapolé d'une réussite CI ou d'un test Docker isolé.

### Sources normatives

- [Gestion des projets et comptes de service API OpenAI](https://help.openai.com/en/articles/9186755-managing-projects-in-the-api-platform) : compte de service lié au projet, clé secrète affichée une seule fois, permission par défaut large à restreindre ensuite, plafond avec délai d'application possible.
- [Traefik IPAllowList](https://doc.traefik.io/traefik/middlewares/http/ipallowlist/) : sélection de l'IP du client et comportement des proxies.
- [Secrets Docker Compose](https://docs.docker.com/compose/how-tos/use-secrets/) : montages ; le fichier hôte reste sous responsabilité de l'opérateur.
