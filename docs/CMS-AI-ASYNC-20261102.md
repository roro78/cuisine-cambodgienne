# Texte IA : tâche privée asynchrone, activation toujours bloquée

Le pilote historique culture à 65 118 ms ne respecte pas C2 synchrone (20 s). Ce lot ajoute une orchestration optionnelle ; il ne transforme pas cet essai en qualification réussie. Aucun modèle téléchargé, service installé ou configuration OVH modifiée.

## Contrats conservés

`cmsAiContentPrepare` et `cmsAiContentComplete` extraient le contrôle d'entrée et de résultat du générateur existant. Le mode synchrone reste à 20 s. Les deux modes emploient `cmsAiContentRequest`, les cinq schémas, les mêmes contrôles de référence canonique, d'anti-doublons et de provenance, puis le candidat temporaire et `cmsAiContentSave`/`cmsCreationSave`. Aucun nouvel éditeur ou validateur éditorial.

Le mode asynchrone exige, dans la configuration privée existante, `enabled: true`, `mode: async`, `qualified: true`, deux callables `submit`/`poll`, les labels serveur et le quota existant. Les paramètres sont absents en production ; le module demeure désactivé. La qualification couvre le modèle, les cinq familles, la qualité humaine et le transport OVH. Le budget de 1 USD autorisé pour l'essai d'image n'autorise aucun appel texte payant.

## Parcours et absence de double génération

POST authentifié/CSRF + intention consommée → contrôle du brief et quota global verrouillé → soumission unique avec ID aléatoire utilisé comme clé d'idempotence → redirection 303 vers le suivi → GET de consultation → candidat validé → corrections dans le formulaire commun → sauvegarde privée explicite. Le suivi propose « Actualiser le suivi », sans génération déclenchée par le GET. Les champs locaux, notes et dates restent dans la session, sans être transmis au modèle. Trois tâches/candidats au plus par session, expiration 30 minutes. Une modification concurrente du brouillon ou de la référence refuse le résultat.

Un accusé de soumission perdu conserve l'ID et l'état `submission_unknown` : consulter cet ID est permis, le soumettre une deuxième fois automatiquement ne l'est pas. Une erreur terminale reste consommée ; aucun retry de génération. Une expiration de session ne supprime pas les preuves côté service et n'autorise aucune sauvegarde ou publication automatique.

## Service et transport préparés, non installés

`scripts/editorial-ai-job-gateway.mjs` est un service de tâches, pas un moteur éditorial. Il ne fait rien à l'import. Démarrage explicite uniquement avec `CDC_EDITORIAL_JOB_SERVICE_ENABLED=true`, `CDC_EDITORIAL_JOB_DIR` hors webroot, `CDC_EDITORIAL_JOB_TOKEN` privé (32 caractères minimum) et modèle installé `CDC_EDITORIAL_JOB_MODEL`. Écoute par défaut sur `127.0.0.1:18678`. Aucun accès public direct à Ollama.

La route prévue est `https://n8n.orvekio.com/editorial-ai/v1/jobs/<id>` : PUT idempotent de création et GET de consultation, Bearer constant, aucune route libre. Cette route n'existe pas encore ; le domaine existant ne prouve pas son installation. L'adaptateur PHP optionnel limite chaque opération à 3 s de connexion/10 s au total, vérifie TLS, refuse redirections/URL arbitraire et borne les réponses. Le compte lecteur Supabase et n8n 01/02/03 ne sont pas utilisés.

La file privée utilise 0700/0600, requêtes immuables, SHA-256 et un marqueur de démarrage exclusif avant l'appel. Deux workers ne peuvent réclamer la même tâche. Un processus interrompu laisse cette tâche en échec à son retour : jamais de reprise implicite d'un appel dont le résultat est inconnu. Une seule inférence à la fois par processus ; capacité totale 256 dossiers, nettoyage/rétention à décider explicitement avant exploitation. Aucun contenu privé n'est écrit dans les logs HTTP.

Le worker appelle seulement `http://ollama:11434/api/chat` (ou loopback explicitement injecté), avec le schéma C2, 6 000 tokens maximum, une réponse bornée et 120 s de transport distincts des 20 s synchrones. Ce plafond est destiné à mesurer une exécution en tâche après le pilote de 65 s ; ce n'est pas une preuve de qualité ni une garantie de délai. Sortie tronquée, trop volumineuse ou erreur : échec sans retry. PHP reste l'autorité de validation éditoriale.

## Réception et livraison séparées

Avant toute installation : valider le raccordement du reverse proxy existant vers le service privé, son réseau réel et ses secrets, ses permissions, son redémarrage sans double appel et sa politique de rétention. Le mode loopback livré ne constitue pas une configuration Traefik/Docker prête à appliquer. Ne pas modifier les services existants automatiquement. Tester HTTPS authentifié depuis OVH et refus anonyme ; qualifier les écarts des cinq familles et faire relire les propositions. Aucun coût texte payant n'est engagé dans ce lot.

Fichiers OVH : `gestion-contenus/index.php`, `lib.php`, `content-gateway-adapter.php`. Dépendances déjà reçues : `.htaccess` protégeant l'adaptateur, `publication-gap-audit.php`, les trois index publics et le stockage privé. Le service JavaScript est un livrable Orvekio séparé, jamais à déposer dans le webroot OVH. Les brouillons existants ne sont ni migrés ni modifiés.

Les paquets texte et visuels touchent les mêmes composants partagés : ils ne doivent pas s'écraser depuis deux branches divergentes. Ils sont conservés comme candidats de revue. Après fusion autorisée et CI du SHA intégré, réexporter les fichiers communs depuis ce SHA avant transfert manuel et sauvegarde vérifiée. Aucune fusion ou activation dans ce lot.

Tests ajoutés : file durable, requêtes HTTP authentifiées, concurrence de deux workers, échec/interruption sans retry, cinq familles PHP 8.3/8.4, session/CSRF, suivi et correction/sauvegarde explicite, navigateur 360/390/1440. Les fournisseurs synthétiques ne qualifient pas Ollama ; les permissions réelles restent testées en CI Linux.

## Cause des délais : métriques réelles conservées relues le 2 novembre

Le GET de l'état du modèle depuis n8n prend 157 ms. `llama3.2:latest` reste chargé, `size_vram=0`, sur un hôte à quatre CPU et environ 2,6 Go de mémoire disponible lors du contrôle. Sur le pilote #187 : 65 101,6 ms côté modèle, dont 64 711,5 ms d'évaluation pour 455 tokens (environ 7,0 tokens/s), 366,1 ms de prétraitement et 3,3 ms de chargement. Le client mesure 65 118 ms. Le pilote #182 avait déjà consacré 37 084 ms à 310 tokens. Ces mesures attribuent l'essentiel du délai observé à l'inférence ; rallonger un timeout ou recharger un modèle déjà chaud ne le résout pas. L'absence de VRAM est observée ; les effets d'un autre modèle ou d'un GPU ne sont pas mesurés. Aucun essai redondant n'a été relancé. Le pilote #183 ajoute un prétraitement de 19,9 s : taille/contenu du prompt et cache comptent également selon le cas.

La conformité mécanique ultérieure de culture et les remarques de revue #188/#189 ne prouvent aucune qualification éditoriale générale. Les quatre autres familles, la sécurité du transport réel et la recette connectée OVH demeurent à qualifier ; aucune activation.

Alternative à étudier si la qualité d'Ollama reste insuffisante : un adaptateur texte authentifié vers `gpt-4.1-mini`, avec les mêmes schémas et validations C2. Aux [tarifs standard vérifiés](https://developers.openai.com/api/docs/pricing), 3 000 tokens entrants à 0,40 USD/million et 6 000 sortants à 1,60 USD/million donnent 0,0108 USD par demande, soit 1,08 USD pour 100 demandes de cette taille. Ce scénario n'est ni un devis, ni une mesure réelle de consommation, latence ou qualité. Aucun abonnement, clé de production ou appel texte payant autorisé/exécuté. La clé locale et le budget d'essai image ne sont pas réutilisés pour le texte.
