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
