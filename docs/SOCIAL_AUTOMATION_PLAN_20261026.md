# Cuisine du Cambodge — Dashboard privé de validation (PR #129)

**Périmètre gelé au 26 octobre 2026 :** terminer l'interface de validation, sans refondre les workflows sociaux existants.

## Acquis et préservés

Les workflows **01 génération + e-mail de validation, 02 Facebook, 03 Instagram**
ont déjà fait l'objet des validations antérieures. Une publication Kroeung
est enregistrée en base comme approuvée et publiée sur Facebook et Instagram.
Le présent chantier **ne modifie aucun de ces trois exports**, n'active aucun
workflow, ne renvoie aucun e-mail et ne republie aucun contenu.

## Interface du dashboard

| Fonctionnalité | État |
|---|---|
| Accès PHP privé (login, CSRF, session et anti-bruteforce) | Code + tests natifs PASS |
| Aperçus Facebook/Instagram, titres, images, légendes | Code + tests PASS |
| Liste, filtres, états, décision humaine et références Meta | Code + tests PASS |
| Accès à l'**ancien formulaire n8n Wait** depuis l'interface | Code + tests PASS : URL signée depuis e-mail, vérifiée, redirection 303 |
| Décider directement sur la carte du brouillon sans coller l'URL | **Non réalisé** : URL de reprise non accessible dans `posts` |
| Déploiement et validation Android sur OVH | **Non réalisé** : environnement OVH non vérifié |

La décision humaine est toujours prise **dans le formulaire n8n déjà opérationnel** :
« Approuver », « Demander une modification » et « Refuser ». L'interface
nouvelle n'écrit pas dans `cuisine_social.posts` et ne crée pas de deuxième
circuit de publication.

### Derniers tests

- [CI de l'intégration minimale #40304409166](https://github.com/roro78/cuisine-cambodgienne/actions/runs/40304409166) : **SUCCESS** (86/86 anciens tests, incluant la redirection HTTP signée).
- La PR a ensuite été **réduite intentionnellement** pour ne pas emporter les
  migrations et les modifications exploratoires n8n/Supabase accumulées.
  Une nouvelle CI ciblée uniquement sur le dashboard doit être verte avant fusion.
- La suppression des fichiers non fusionnés du diff ne touche ni `main`
  ni le n8n / OVH / Supabase réels. Leur historique reste consultable dans Git.

## Objectif de réception

**Depuis Android**, accéder au portail privé, visualiser un brouillon,
ouvrir son formulaire de validation n8n existant et vérifier que sa décision
apparaît ensuite dans l'historique du dashboard.

**Limite fonctionnelle assumée pour ce jalon :** une copie manuelle du lien
d'e-mail est encore nécessaire. Pour des boutons directs sur chaque carte,
il faudra identifier **un mécanisme minimal de lecture sécurisée de l'URL Wait**
associée à chaque brouillon, qui n'altère pas les workflows sociaux existants.
Ne pas inventer ni activer une seconde API de décision.

## Conditions d'ouverture OVH

1. PHP avec `pdo_pgsql`, TLS vers le bon projet Supabase.
2. Rôle `cuisine_social_viewer` de consultation, privilèges vérifiés,
   credential créé localement sans le communiquer à ChatGPT.
3. Tests manuels Android : connexion, filtres, aperçus, formulaire original,
   déconnexion, refus d'URL incorrecte ; aucun e-mail ou Meta réel de test.
4. PR #129 relue et fusionnée **uniquement sur ce périmètre** ; déploiement
   manuel OVH après contrôles de l'hébergement.

Les autres chantiers (plans média, recettes et ateliers IA, migrations
générales des réservations) sont **hors périmètre** et ne conditionnent pas
ce dashboard.


## Origine réelle des futures propositions : audit code du 26 octobre 2026

La question de « quelle est la source qui entre dans le pipeline ? » est résolue
par lecture des modules existants sur `main`, sans modification n8n :

1. **Auteur du site / IA éditoriale** : un article, une recette ou un atelier
   est intégré dans la collection structurée correspondante du site
   (`src/data/recipes.ts`, `restoredRecipes`, `culture.ts`,
   `workshops.ts` ou `cookingWorkshopGuides.ts` après leur gate
   `release_ready`). Une page Astro isolée qui n'est pas référencée
   dans ces collections ne sera **pas** automatiquement découverte.
2. **Agrégation du catalogue** : `src/data/socialCatalog.ts` rassemble
   également ingrédients et techniques, fabrique un `source.id` stable
   (`recette:slug`, `culture:slug`, `atelier:slug`) et une empreinte
   éditoriale `fingerprint`. `src/pages/social-feed.json.ts` expose
   `/social-feed.json`, généré lors du build/déploiement statique.
3. **Workflow 01 existant** : à 07:00 Europe/Paris, GET
   `https://www.cuisine-du-cambodge.com/social-feed.json`. Il consulte
   l'historique de `cuisine_social.posts` puis **choisit un seul sujet**,
   en donnant priorité aux sources inédites et aux catégories selon le jour.
   Critère bloquant : `imageUrl` JPEG
   `https://www.cuisine-du-cambodge.com/social-assets/…jpg` valide.
   **Pas de déclenchement immédiat à chaque création de page**, et une
   source du catalogue n'est pas nécessairement un post proposé ce jour.
4. **Transformation en post à valider** : uniquement après
   `INSERT INTO cuisine_social.posts` réussi, le post prend
   `status=draft`. Le workflow envoie le mail Resend et passe dans
   l'ancien `Wait` n8n (72 heures). Le dashboard est une **vue sur
   cette table**, pas une seconde source ou une file recréée.
5. **Décision** : `draft` apparaît dans le filtre « À valider » ;
   `revision_requested` dans « À corriger », `approved` puis
   `published` continuent dans les workflows existants 02/03.

**Écart fonctionnel à arbitrer ultérieurement, sans régression :** si l'on
souhaite « nouvelle page validée ⇒ proposition immédiate dans le dashboard »,
un déclencheur de nouveauté ou un scan sur événement de déploiement serait à
ajouter. Il n'existe **pas** actuellement. Avant de l'implémenter, conserver
la règle d'une seule proposition quotidienne et les protections d'idempotence,
pour ne pas réémettre des mails ni déclencher plusieurs posts.

**Amélioration P0 dashboard incluse dans cette PR :** explication concise
de cette origine, compteurs À valider/À corriger, catégories Recette/Carnet/
Atelier/Ingrédient/Technique sur chaque carte, et état vide explicite.
Aucune connexion externe ni exécution n8n supplémentaire.


## Livraison en cours — onglet sources réelles du site (26/10)

Le dashboard comporte désormais un filtre **Sources du site** qui lit
exclusivement le **`/social-feed.json` effectivement déployé**,
comme le workflow 01 à 07 h, puis rapproche en lecture seule les
`source_id`, `source_fingerprint` et états déjà présents en base
`cuisine_social.posts`. Affichage mobile par recette, carnet, atelier,
ingrédient ou technique avec les états **disponible mais non proposée**,
**modifiée depuis la dernière proposition**, **sans JPEG éligible**,
**déjà proposée**.

Un contenu apparu dans les collections `socialCatalog.ts` doit encore
être buildé et déployé sur le site pour apparaître dans ce flux. Même
ensuite, **le workflow existant ne crée pas immédiatement un brouillon** ;
il sélectionne un sujet à chaque passage. Les sources en attente ne sont
pas considérées comme des demandes de validation et le dashboard n'envoie
aucun e-mail. Ceci évite la fausse promesse « article créé = post draft ».

Le chargement HTTP est limité à une destination HTTPS fixe
`www.cuisine-du-cambodge.com/social-feed.json`, redirects interdits,
vérification TLS, 5 s max et 512 Kio max ; la réponse est strictement
validée avant affichage et les titres sont échappés en HTML. Si le
réseau/extension cURL est indisponible, l'onglet indique clairement
que le catalogue n'a pas pu être chargé, sans bloquer la file des posts.

**Deuxième raccordement (URL Wait automatique)** : le formulaire existant
n8n fabrique `$execution.resumeFormUrl` dans le nœud de notification
Resend. Ce jeton n'existe **ni dans le catalogue public**, ni dans les
colonnes du post consultées par le dashboard. On ne peut pas reconstruire
une URL signée fiable depuis `post_id` ou `source_id`. Pour ajouter un
bouton direct à chaque brouillon, il faudra une transmission serveur
contrôlée de cette URL par le workflow 01 **uniquement lors de la création
d'une demande de validation**, avec stockage privé chiffré/court terme
et liaison stricte au brouillon. Aucun appel n8n 02/03, aucune décision
alternative ni mutation de `posts` ne sont requis. Cette interface
n'est **pas encore branchée** ; ne pas afficher de boutons factices.


## Pont direct vers le Wait existant : OPTION READ-ONLY

Le module `public/gestion-social/n8n-wait-readonly.php` utilise,
**uniquement si des variables privées sont disponibles sur OVH**,
la **public API n8n en GET uniquement** :
1. `GET /api/v1/workflows/{id}` pour vérifier le nom du workflow 01 et son
   nœud `Attendre une décision via formulaire` en mode `form`.
2. `GET /api/v1/executions?workflowId={id}&status=waiting&includeData=true&limit=100`
   pour récupérer les seules exécutions Wait non terminées, avec leur
   contexte sauvegardé.
3. Appariement **strict** de `Enregistrer le brouillon → id`,
   `Vérifier et cadrer les textes → sourceId/fingerprint/date/légendes/image`,
   et des métadonnées signées
   `Attendre une décision via formulaire.metadata.resumeFormUrl`.
   Toute ambiguïté, redaction, valeur absente ou dérive fait disparaître
   le bouton direct. Le jeton n'est jamais rendu en HTML ni enregistré
   dans la base ; l'utilisateur authentifié déclenche seulement
   **un POST CSRF et une 303** vers n8n, qui reste l'autorité finale.

Configuration **facultative** dans `.cuisine-asset-portal/config.php`
hors webroot : `n8n_readonly_api_key` (droits de lecture workflows/executions,
pas de droit d'écriture), `n8n_social_workflow_id` (ID du workflow 01).
Ne pas communiquer ni committer ces valeurs. L'absence de configuration
laisse le formulaire e-mail disponible ; rien n'est activé côté n8n.
La requête serveur ne cible que `https://n8n.orvekio.com`, exige TLS,
interdit les redirections, taille max 1 MiB et délai max 7 secondes.

**Important : adaptation fondée sur le contrat n8n 2.x mais non encore
réceptionnée dans notre runtime.** Le format de `metadata.resumeFormUrl`
peut dépendre des données sauvegardées et des permissions de redaction API :
sans preuve de conformité de l'exécution en attente, aucun bouton direct
ne doit apparaître. La base de production n'a actuellement aucun brouillon
`draft`, donc la fonction ne peut pas être testée de bout en bout en live
sans nouveau brouillon explicitement autorisé. Pas de workflow 01/02/03 modifié.


### Réception du pont Wait — lecture détaillée sans mutation

Le pont n8n sépare maintenant les **GET metadata** de l'API publique :
- `GET /api/v1/executions?workflowId=…&status=waiting&limit=21` (liste légère),
- `GET /api/v1/executions/{id}?includeData=true` **uniquement pour les exécutions réellement en attente**, après validation de l'ID, du workflow et du statut.

Il refuse tout affichage de bouton si la liste dépasse 20 exécutions, est paginée, contient des IDs dupliqués, si le détail manque ou si le statut change entre les GET. Il ne crée aucune exécution ; les tests simulent une liste sans données puis une lecture détaillée, les états périmés, réponses tronquées, autres workflows et IDs erronés. En cas d'échec, le lien de validation déjà envoyé par e-mail reste utilisable.

**Invariant permanent :** nouveau contenu du catalogue → proposition sociale du workflow 01 (selon son planning existant) → file `draft` → décision humaine via le même `Wait` → workflows 02/03 inchangés. Ne pas modifier les exports 01/02/03, ni générer de nouveau mail, ni publier en production au cours de cette livraison.


### Anti-régression automatique sur la PR #129

La CI ciblée exécute désormais `scripts/verify-social-dashboard-scope.mjs` sur le vrai diff `origin/main...HEAD`. La liste d'autorisations contient uniquement **le PHP du dashboard, les tests, le diagnostic SQL en lecture seule et la documentation**. Toute modification de `automation/n8n/01-drafts-email-approval.json`, de `02`, de `03`, du schéma n8n, de `src/data/socialCatalog.ts` ou de `src/pages/social-feed.json.ts` fait **échouer la CI**. Ce garde-fou ne protège pas le runtime n8n lui-même : il protège le périmètre des commits GitHub de cette PR, sans toucher à la production.


### Garde de reprise sur un brouillon déjà décidé ou en publication (26/10)

Le rapprochement n8n affiche désormais un bouton seulement si **tous** les contrôles métier sont satisfaits : `posts.status=draft`, `fb_state=pending`, `ig_state=pending`, aucune décision, aucune date de décision/approbation/publication, aucun ID Facebook, Instagram ou conteneur Instagram. Les champs absents, identités BIGINT dupliquées et incohérences font disparaître l'accès direct. La requête SQL ciblée lors du clic relit aussi ces champs : pas de confiance dans les données de la page déjà affichée. Ceci renforce uniquement le portail, ne modifie pas les états de la base ni les workflows 01/02/03.


## Test unique accepté — sans publication Meta (26 octobre 2026)

**Objectif permanent** : contenu existant → sélection par n8n 01 → post `draft` → e-mail Resend → décision humaine via le `Wait` original → historique du même post dans le dashboard. Le périmètre CMS (éditer/dépublier) vient APRÈS cette réception, sur les collections existantes ; ne pas créer une seconde automatisation.

**Preflight production en lecture seule le 26/10** :
- `cuisine_social.posts` : exactement **1 publication `published` approuvée**, **0 draft**. Pas de formulaire à tester en live pour le moment.
- `cuisine_social.validation_dispatches` : **1 état `reserved`** ; **ne pas re-tenter** cet e-mail sans diagnostic de livraison pour éviter un doublon.
- RLS de `posts` : actif ; rôle SQL `cuisine_social_viewer` : **absent** en production. La réception du dashboard privé sur OVH est impossible sans provisionnement contrôlé du seul rôle lecteur et configuration serveur.
- Code exporté du workflow 01 : Schedule 07:00 Europe/Paris, insertion `ON CONFLICT (scheduled_date) DO NOTHING`, Resend puis Wait (72h), choix `Demander une modification` exige un commentaire, écrit `revision_requested` uniquement sur `status=draft`.
- Aucun accès n8n runtime privé/OVH depuis ce diagnostic : activation réelle et gestion des credentials **non vérifiées**. L'export GitHub contient des placeholders pour Resend, qui peuvent différer du runtime déjà configuré.

**Test automatisé ajouté** : `tests/social-one-shot-decision-flow.test.mjs` lit et exécute réellement (VM Node isolée) les deux nœuds Code EXISTANTS `Choisir un contenu original` et `Interpréter la décision`, avec des données fictives. Vérifie une seule source éligible, image absente exclue, formulaire original, e-mail avec `resumeFormUrl`, 72h, idempotence SQL et décision de demande de modification liée au BIGINT précis. Zéro appel n8n/SQL/Resend/Meta. Ce test **n'est pas** une validation du runtime live.

**Étapes du seul essai réel, après raccordements** :
1. Réceptionner l'accès au dashboard OVH (rôle SELECT-only, configuration privée et tests Android).
2. Vérifier que le Workflow 01 réel est actif/configuré ; utiliser **une seule exécution normale à 7h**, sans relancer la réservation d'e-mail historique et sans déclencheur concurrent.
3. Contrôler l'arrivée d'**un unique brouillon** et d'un unique e-mail Resend ; accéder depuis Android au dashboard et au Wait existant.
4. Choisir **« Demander une modification »** en saisissant « Test unique de validation — aucune publication autorisée » ; vérifier `revision_requested`, `human_note`, `decided_at`, FB et IG toujours `pending`.
5. Vérifier 0 nouvelles références Facebook/Instagram pour ce post. Ne pas valider « Approuver » pendant cet essai.
6. **STOP** sur toute dérive, doublon, erreur de credential, délai expiré ou indisponibilité. Pas d'activation de tâche ou d'envoi automatique sans contrôle.

**Ensuite seulement** : la bibliothèque pourra ajouter progressivement « Corriger », « Mettre en brouillon » et « Dépublier » pour les contenus du site, avec versions, aperçu et déploiement contrôlé, **sans confondre dépublication d'une page et suppression d'un post Meta**.


### Provisionnement en production : lecteur Supabase — 26 octobre 2026

Avec accord utilisateur, la migration `cuisine_social_viewer_read_only_20261026` a été appliquée au seul projet Cuisine du Cambodge. Rôle `cuisine_social_viewer` LOGIN/NOINHERIT sans mot de passe initial ni attribut élevé. Permissions revérifiées : `USAGE` du schéma, `SELECT` de `cuisine_social.posts`, aucun `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE` ni accès aux réservations `validation_dispatches`. La policy RLS de lecture est dédiée ; les cinq policies n8n initiales restent inchangées. Le post historique est conservé.

Supabase attribue automatiquement l'appartenance administrative `postgres → cuisine_social_viewer` avec `ADMIN=true, INHERIT=false, SET=false`. Le dashboard et le script de provisionnement REVIEW acceptent désormais uniquement cette appartenance administrative sans héritage ni prise de rôle, tout en refusant toute autre relation à un rôle. Aucune appartenance supplémentaire n'a été ajoutée ni retirée.

Le dashboard OVH n'est pas encore raccordé : mot de passe du rôle non configuré (volontairement), secrets à conserver hors webroot, compatibilité PHP/pdo_pgsql/TLS et expérience Android encore à réceptionner. Aucun workflow n8n ni publication Meta modifié.


## Diagnostic OVH réel — CLI strict, sans donnée sensible (26 octobre 2026)

Le rôle lecteur a été créé et vérifié au niveau des privilèges/RLS Supabase.
Le compte ne possède **aucun mot de passe initial**, et aucun moyen d'exécuter
`SET ROLE cuisine_social_viewer` depuis `postgres` n'a été accordé :
Supabase a explicitement mis `SET=false` à cette appartenance administrative.
L'essai de `SET LOCAL ROLE` a échoué comme prévu. **Cela ne remplace PAS**
une connexion réellement établie sous le rôle lecteur.

Un outil CLI **`public/gestion-social/diagnostic-cli.php`** permet de
réceptionner le portail sur OVH **après installation**, sans divulguer le
mot de passe : `php gestion-social/diagnostic-cli.php` depuis la racine du
site. Il refuse une requête HTTP (404), vérifie la version PHP, les extensions
`pdo_pgsql` et `curl`, la présence du fichier secret
`~/.cuisine-asset-portal/config.php`, le DSN PostgreSQL et les
autorisations réelles sous `cuisine_social_viewer`, l'absence de droits
sur les réservations Resend, la RLS, la présence de TLS sur la connexion
ainsi qu'une lecture `SELECT COUNT(*)` des posts. **Il n'exécute aucune
écriture** et n'affiche ni DSN, ni secret, ni message brut PDO/PostgreSQL.
Il affiche uniquement `PORTAL_READINESS_PASS: ...` ou
`PORTAL_READINESS_FAIL: ...`.

**Préparation privée (action opérateur, pas via le chat ou GitHub) :**

1. Depuis un terminal de confiance, se connecter à la base Cuisine du
   Cambodge avec `psql`, puis exécuter `\password cuisine_social_viewer`.
   Cette commande interactive demande deux fois le nouveau mot de passe
   **sans l'écrire en clair dans la requête SQL ou dans l'historique shell**.
   N'utiliser ni le service-role Supabase, ni le credential `cuisine_n8n`.
2. Sur OVH, conserver le mot de passe du lecteur exclusivement dans
   `~/.cuisine-asset-portal/config.php` hors webroot (mode 0600).
   Conserver les clés `admin_user` et `password_hash` existantes et
   ajouter seulement `social_readonly_dsn`,
   `social_readonly_user='cuisine_social_viewer'`, et
   `social_readonly_password`. Le DSN doit imposer TLS et le serveur
   direct du projet ou le pooler Supabase approuvé.
3. Ne déployer que les fichiers de la PR après revue/fusion, puis lancer
   `php gestion-social/diagnostic-cli.php` via SSH depuis le bon répertoire.
   N'activer la page privée /gestion-social/ que si le dernier indicateur
   est `READY_FOR_PRIVATE_ANDROID_TEST`. Éviter l'affichage du mot de
   passe dans les captures et journaux.
4. Vérifier l'affichage depuis Android, et **ensuite seulement** effectuer
   un seul test supervisé `Demander une modification`, jamais
   `Approuver` lors du test. Les exports n8n 01/02/03 restent inchangés.

**Limite :** cet outil ne garantit pas à lui seul l'envoi de Resend,
l'accessibilité des exécutions Wait ou une publication Meta ; il vérifie
uniquement la disponibilité et les privilèges du **lecteur** privé.


## Dernier correctif de raccordement OVH : IPv4 Supabase (26 octobre 2026)

La documentation Supabase précise que les connexions PostgreSQL **directes** utilisent la connexion IPv6 par défaut avec utilisateur `cuisine_social_viewer`, mais que le **pooler partagé en session (IPv4)** exige `cuisine_social_viewer.kljbnfjxwloiodwlbrrz` ; son port est `5432`. Le dashboard et le diagnostic refusaient ce nom de connexion, rendant une installation OVH IPv4-only impossible malgré des grants corrects.

**Corrigé sans toucher aux droits SQL** : le DSN doit pointer exclusivement vers `db.kljbnfjxwloiodwlbrrz.supabase.co:5432` avec l'utilisateur `cuisine_social_viewer`, **ou** vers le serveur `*.pooler.supabase.com:5432` copié depuis le panneau « Connect → Session pooler » du vrai projet avec l'utilisateur `cuisine_social_viewer.kljbnfjxwloiodwlbrrz`. Base `postgres` obligatoire ; port 6543 interdit (transaction-pooling incompatible avec certaines propriétés de session / requêtes préparées). TLS obligatoire. Après connexion, la session SQL doit toujours répondre `current_user = cuisine_social_viewer` et rester strictement SELECT-only. Aucun identifiant complet de connexion ni mot de passe ne doit être commité.

**Important** : le hostname réel du pooler doit être copié depuis le panneau Connect du projet. Ne pas le déduire de la région ; plusieurs clusters existent. L'endpoint IPv4 n'est pas encore testé depuis OVH et ce code reste sur la PR #129.


### Réconciliation catalogue de production GitHub et Supabase, 26 octobre — 20 h 28

Audit **en lecture seule** sur la branche statique GitHub `ovh-production`, artefact `social-feed.json` : **35 sources** indexées (16 recettes, 4 ingrédients, 7 Carnets culturels, 6 ateliers, 2 techniques). Pour **32** sources, le flux expose une URL JPEG sociale et l'artefact `ovh-production` contient bien le fichier JPEG correspondant ; **3 recettes** historiques n'ont aucune image sociale : `curry-poulet-khmer`, `nom-krob-totim`, `samla-mchou-yuon`.

Relecture Supabase : `cuisine_social.posts` ne contient toujours qu'un historique `ingredient:kroeung` en `published` Facebook et Instagram, avec empreinte identique au catalogue statique. **31 sources avec JPEG n'ont jamais été proposées**, 3 sont dépourvues d'image et 1 est déjà proposée/publiée. Ce résultat explique pourquoi la file `À valider` n'affiche pas 35 éléments : elle contient **uniquement les `draft` réellement créés par le workflow 01**, actuellement aucun.

Le tableau de bord affiche désormais dans « Sources du site » les décomptes `available / changed / missing_image / seen` en lecture seule et une **vignette JPEG de 88×88 px** pour chaque source à URL validée ; sans JPEG, un carré avec `JPEG social absent`. Image `loading=lazy`, affichage mobile compact, sans création de brouillon ou appel Meta. Les données du flux sont déclaratives : l'existence des JPEG a été vérifiée dans l'artefact GitHub, mais **pas au niveau HTTP du serveur réellement servi**.
