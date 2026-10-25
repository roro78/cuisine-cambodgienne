# Cuisine du Cambodge — Espace privé de consultation sociale (P0, lecture seule)
**25 octobre 2026. Réalisation en PR #129 ; aucune mise en production.**

## Composant livré en code

`public/gestion-social/index.php` est une **première véritable page serveur privée**, distincte de la maquette HTML hors ligne. Sur un hébergement OVH PHP configuré, elle lit les lignes de `cuisine_social.posts` avec un rôle PostgreSQL ne disposant **que de SELECT**, puis affiche les miniatures compactes, légendes distinctes Facebook/Instagram, liens vers les pages réelles, statuts par plateforme et filtres.

- Connexion protégée HTTPS, session dédiée, mot de passe haché, jeton CSRF, expiration 30 min et limitation des échecs, headers anti-indexation et CSP.
- Photographies en 220 px max (190 px sur petit écran), JPEG d'origine inchangés ; texte et liens échappés, domaine Cuisine du Cambodge strictement contrôlé.
- Les filtres montrent le nombre de contenus par statut ; à la date de la lecture Supabase, l'onglet « À valider » ne contient aucun brouillon et l'onglet « Publiées » contient un post.
- Le portail réutilise **le fichier de configuration privé et les identifiants de l'espace d'import d'images** déjà développés, sans réutiliser son jeton GitHub.
- Sur absence de configuration, `pdo_pgsql` non disponible, DSN non chiffrée ou privilèges trop étendus, **HTTP 503 sans divulgation de secret**.
- Aucun appel vers l'API Meta, aucun envoi Resend, aucune insertion ni modification PostgreSQL.
- **La validation réelle reste actuellement dans le formulaire n8n `Wait` envoyé par Resend**. Un bouton Approver dans ce portail contournerait sinon l'état de l'exécution n8n ; il est volontairement absent.

## Configuration opérateur nécessaire (non committée)

1. Vérifier le support PHP + `pdo_pgsql` et la connectivité TCP/TLS de l'hébergement OVH mutualisé vers la base Supabase Cuisine. Si OVH bloque cette connexion, ne pas contourner via un endpoint public exposant un jeton : prévoir un proxy serveur authentifié dédié.
2. Provisionner un rôle PostgreSQL distinct, sans droit d'écriture ni héritage de `cuisine_n8n`, avec uniquement `USAGE` sur `cuisine_social` et `SELECT` sur `cuisine_social.posts`. **RLS est actif : une politique `FOR SELECT` propre au rôle est aussi indispensable**, faute de quoi le tableau semblera vide. Script de provisionnement **à examiner et à appliquer séparément** : `automation/n8n/sql/social-viewer-role-provisioning-REVIEW.sql` (aucun mot de passe intégré). Ne pas utiliser `postgres`, `cuisine_n8n`, `service_role` ou une clé Supabase dans le navigateur.
3. Dans `~/.cuisine-asset-portal/config.php`, **hors racine web**, compléter l'array existant avec les clés serveur :
   - `social_readonly_dsn` : DSN PHP PDO PostgreSQL (`sslmode=verify-full` de préférence, `require` accepté).
   - `social_readonly_user` : nom du rôle SELECT uniquement.
   - `social_readonly_password` : valeur secrète côté serveur, jamais dans GitHub/HTML/JS/chat.
   Le portail exige déjà `admin_user` et `password_hash` via cette configuration privée.
4. Vérifier les permissions du fichier privé, la connexion TLS, l'expiration de session, la déconnexion, les tests de mots de passe erronés et le rendu Android.
5. Vérifier que le build Astro copie le PHP dans le `dist` et que l'hébergement exécute PHP sous le chemin `/gestion-social/` ; ne rien publier tant que le test de contrôle d'accès n'est pas validé.
6. Tester l'absence de droits PostgreSQL `INSERT/UPDATE/DELETE` pour le compte de lecture. Le PHP contrôle explicitement ces droits et impose une session SQL en lecture seule.

## Observation Supabase réelle — lecture seule le 25 octobre 2026

Le projet `cuisine-du-cambodge` comporte `cuisine_social.posts` et `cuisine_social.validation_dispatches`, toutes deux avec RLS. Une seule ligne de `posts` est enregistrée : `published`, `human_decision=approved`, `fb_state=published`, `ig_state=published`, avec références de publication renseignées. Aucun brouillon en attente n'a été trouvé. La seule réservation de `validation_dispatches` reste `reserved` depuis le 21 octobre (environ 95 h au moment du contrôle), bien que le post soit `published`.

**Anomalie de réconciliation :** ne pas réinitialiser ni réexpédier automatiquement la réservation. Une confirmation indépendante dans Meta et Resend est nécessaire avant tout changement. Le schéma SQL versionné `automation/n8n/schema.sql` ne déclare pas actuellement `validation_dispatches` ; le runtime dispose donc d'une extension non représentée dans ce fichier. Réconcilier schéma/runtime avant migration, sans effacer la table.

Un rapport SQL purement SELECT figure dans `automation/n8n/sql/social-approval-readonly-diagnostics.sql`. Il affiche uniquement des agrégats.

## Tests et limites

- Contrats de sécurité statiques : `tests/social-private-dashboard-contract.test.mjs`.
- **PHP runtime/lint, connexion OVH↔Supabase et rendu Android non vérifiés** : la PR ne peut pas être qualifiée de déployable immédiatement.
- Le portail ne permet pas encore de modifier les légendes/photos ni de valider ; la future intégration nécessite une API de décision authentifiée, un verrouillage de version et une transition sûre du `Wait` n8n, avec tests d'idempotence.
- Le P0 existant **e-mail visuel + formulaire Wait**, introduit dans cette PR, conserve sa propre migration n8n fail-closed ; aucun lien de reprise secret n'est stocké dans `posts` ou affiché par le portail.

## Critères de suite

1. Test natif `php -l public/gestion-social/index.php`, Node CI + simulation d'une session non authentifiée, puis accès avec compte en lecture seule.
2. Test OVH sur environnement de préproduction avec contenu réel (aucune action Meta), idéalement une photo et un ancien post déjà publié.
3. Refondre le tunnel de décision afin d'avoir **un seul point de validation** dans le dashboard et d'éviter toute approbation enregistrée seulement en base pendant qu'une exécution `Wait` n8n attend.
4. Ensuite seulement : créer les brouillons issus du plan média et mesurer les publications par URL.

**État : code présent sur la branche PR #129, pas installé ni activé.**

## Reprise P0 — audit direct du 25 octobre 2026 (branche PR #129)

**Actions réalisées sans déploiement :** interrogation du HEAD GitHub et du schéma Supabase en SELECT, audit du PHP et des protections de la migration email, durcissement ciblé dans cette même PR. Aucun secret lu ou publié, aucune modification de données, aucun appel Meta/Resend.

### Découvertes vérifiées

- `cuisine_social_viewer` est **absent** de `pg_roles` : le lecteur ne peut actuellement pas se connecter en production. Il faut un provisionnement et des contrôles effectifs depuis OVH avant ouverture.
- `posts` et `validation_dispatches` disposent tous deux de RLS. Sur `posts`, les trois policies existantes ciblent `cuisine_n8n` (SELECT, INSERT et UPDATE). Aucune policy `cuisine_social_viewer`.
- `validation_dispatches` : **clé primaire `post_id`**, `idempotency_key` UNIQUE, FK vers `posts` avec DELETE RESTRICT ; états autorisés `reserved`, `accepted`, `uncertain`. Schéma versionné `automation/n8n/schema.sql` ne définit pas cette table : **drift** documenté, aucune DDL appliquée.
- Deux policies `validation_dispatches` visent *uniquement* `post_id=1` : SELECT et INSERT de la réservation `cuisine-social-validation/draft-1` pour `cuisine_n8n`. **Toute future généralisation de l'usage de cette table pour d'autres brouillons** exigera une politique tenant compte des nouveaux posts ; l'export actuel du workflow 01 envoie directement via Resend et ne référence pas cette table dans ses 12 nœuds. Ne pas prétendre que ces policies bloquent aujourd'hui le workflow 01. Ne surtout pas élargir avec `USING(true)` ou `WITH CHECK(true)` sans validation.
- Une réservation `post_id=1` reste `reserved` depuis le 21/10/2026 à 20:45:55 UTC, `resend_message_id IS NULL` et n'a pas changé depuis ~95 h lors du contrôle. Le post lié est `published`/approuvé en base pour FB et IG. **Preuve complémentaire Gmail en lecture seule** : le message de validation « Kroeung » existe dans la boîte connectée au 21/10/2026 à **20:45:56 UTC**, contient la proposition et un lien de formulaire Wait. La réception Gmail est attestée, **mais pas l'identifiant Resend de l'API**, ni la réalité des publications Meta. Ne pas réémettre, réinitialiser ou republier avant vérification indépendante.
- Le rôle du dashboard est maintenant contrôlé avant toute requête de posts : identité exacte, NON-superutilisateur, NON-`BYPASSRLS`, NON-héritage, aucune appartenance à d'autres rôles, RLS + policy dédiée, droits SELECT-only sur les posts et **aucun droit** sur les réservations. Échec fermé HTTP 503.
- Pagination SQL par tranches de 50 ajoutée pour consulter les futurs posts sans se limiter aux trois exemples ou aux 50 premières lignes.

### Circuit de validation : écart P0 restant

Le formulaire humain `Wait` et l'UPDATE SQL de `01-drafts-email-approval.json` sont le **seul chemin autorisé** de décision. Il conserve un garde `status='draft'` et une seule transition par post, mais **ne compare pas encore une empreinte complète de la version revue au moment de la décision**. La table conserve `source_fingerprint`, captions et image ; aucune preuve de verrouillage de ces champs pendant les 72 h d'attente. Ajouter une action PHP directe créerait un second chemin non synchronisé : **interdit avant conception et réception de la transition unifiée n8n**.

Schéma cible d'intégration (non implémenté, pas de promesse de mise en production) :
1. À la création, conserver un snapshot signé ou une empreinte canonique `post_id + source_fingerprint + image_url + captions + URL`, un identifiant d'exécution Wait et une échéance, hors du navigateur et sans endpoint d'approbation par ID seul.
2. L'interface authentifiée soumettrait une décision via un **unique** point d'entrée backend connecté au Wait existant (ou sa migration coordonnée), sans modifier directement `posts`. Une réponse HTTP à un lien GET ne décide jamais.
3. Le nœud de persistance n8n exécuterait un `UPDATE ... WHERE status='draft' AND version_empreinte_attendue=... RETURNING ...`, enregistré atomiquement et idempotent ; la condition d'absence de résultats bloque toute publication.
4. Test préalable sur un clone isolé : approbation, révision avec commentaire obligatoire, refus, expiration, double-clic, mutation concurrente de photo/caption, panne après envoi. Ne pas activer 01/02/03 ni envoyer de vrai mail.

### Réception technique et limites

- **Statique** : contrats des autorisations, du rôle et de la pagination complétés en Node, en attente de leur exécution native sur le HEAD.
- **Natif et production** : `php -l`, `node --test`, disponibilité PHP et `pdo_pgsql` sur OVH, connectivité TLS OVH→Supabase, rendu Android et vrai workflow n8n restent à vérifier. La présence de PHP dans un environnement de développement ne prouve rien concernant OVH.
- **Retour arrière** : revenir aux commits précédents de la branche de revue ou restaurer uniquement les trois fichiers modifiés ; aucun SQL ni n8n réel modifié. La PR reste en brouillon et ne doit pas être fusionnée avant réception.

### CI native ciblée exécutée

- Validation GitHub Actions ciblée **SUCCESS** sur le commit `b4ffa39ab10a6a3d80434348bcb17ee5ddcd8bf9` : [Run #40231525774](https://github.com/roro78/cuisine-cambodgienne/actions/runs/40231525774).
- `php -l` validé pour `public/gestion-social/index.php` et `public/gestion-visuels/index.php` dans le runner Ubuntu. `node --check` validé pour les deux scripts de migration et le contrat dashboard ; 23 tests Node ciblés natifs **PASS** (e-mail visuel, migration, sécurité du lecteur).
- Premier run échoué uniquement sur un test trop large : recherche du mot SQL `TRUNCATE` dans une vérification de privilèges ; ce n'était pas une instruction destructive. Contrat corrigé et second run complet PASS. Aucun échec PHP.
- Aucune validation `pdo_pgsql`/connexion OVH, aucune session Android sur site réel et aucun parcours d'approbation n8n en bout de chaîne ; conserver la PR **DRAFT**.

### Étape 25/10 — verrouillage de version préparé dans le workflow 01, sans mutation du runtime

L'export de la PR #129 exige désormais une **égalité atomique de la version éditoriale complète**, sans migration SQL : ID BIGINT en chaîne, source ID, empreinte, snapshot JSONB, date, légendes FB/IG, image, états des deux plateformes et références Meta absentes. Toute décision inconnue ou incompletement encadrée échoue explicitement. L'UPDATE `WHERE status='draft' AND ...` interdit le double clic et la modification de la photo ou de la légende entre e-mail et approbation. L'ancienne décision reste utilisée en runtime tant qu'une migration dédiée n'est pas approuvée.

La migration existante d'e-mail visuel est découplée : elle peut examiner l'ancien contrat de décision **ou** le nouveau, mais ne modifie toujours que le corps de l'e-mail Resend. Toute combinaison mixte SQL/Code est refusée. Le précédent exact est stocké dans `tests/fixtures/social-version-approval-predecessor.json`. **Ne pas utiliser la migration e-mail pour installer le nouveau contrat de décision.** Une migration distincte versionnée avec contrôle GET-only et sauvegarde privée reste obligatoire avant la réception live.

Limite non résolue : un UPDATE correct n'empêche pas un autre écrivain disposant de droits SQL de muter un post **après** son approbation. Une politique d'immuabilité en base, ou une version approuvée indépendante contrôlée lors du claim 02, doit être validée avant publication automatique.


## Jalon P0 — 25 octobre 2026, réception CI native et PostgreSQL éphémère

**Commit testé :** `673c390621a9104fa0f39c5cd2852d57eb061111`.
**CI native ciblée :** [GitHub Actions run #40241203161](https://github.com/roro78/cuisine-cambodgienne/actions/runs/40241203161) — **SUCCESS**.

- `php -l` sous PHP CLI 8.3.6 (runner GitHub) : les deux portails PHP sont syntaxiquement valides. **La disponibilité de PHP/pdo_pgsql sur OVH n'est pas vérifiée.**
- **63 tests Node natifs / 63 PASS**, incluant le routage n8n, les images/légendes, l'ancienne migration Resend, les décisions versionnées, les tests BigInt et la migration de sécurité en lecture seule. Aucun appel réseau vers Meta, Resend, n8n ou Supabase pendant ces tests.
- **PostgreSQL 17 éphémère : PASS**, avec conteneur Docker isolé sans port publié. Les tests chargent le vrai `automation/n8n/schema.sql`, appliquent exclusivement au conteneur `social-approved-content-immutability-REVIEW.sql`, puis simulent : correction d'un brouillon, interdiction d'une approbation modifiant simultanément la photo, refus des changements de photo/légende/source/décision après approbation, autorisation des transitions techniques FB/IG, interdiction de remettre un post publié dans la file d'approbation, refus d'insertion pré-approuvée et interdiction de recycler un brouillon refusé ou à réviser.
- La migration SQL d'immutabilité reste un fichier **REVIEW ONLY** avec commandes de retour arrière commentées. **Rien n'a été appliqué au projet Supabase**. La comparaison PostgreSQL réelle n'a pas encore été validée pour toutes les procédures manuelles de réconciliation ; ne pas activer le garde-fou en production sans un audit de ces procédures.
- Nouveau migrateur ciblé : `scripts/migrate-cuisine-social-versioned-decision.mjs`. Par défaut, il effectue seulement des GET API n8n et vérifie le modèle de workflow ainsi que les exécutions `waiting/running`. En cas de dérive, appel indisponible, statut ambigu ou credentials manquants : arrêt. L'option de mutation exige les deux drapeaux `--apply --approve-single-workflow-update`, **non exécutés**. Ne pas interpréter un résultat vide de l'API publique comme une preuve exhaustive d'absence d'exécutions `Wait` : inspection additionnelle obligatoire côté n8n.
- La migration Resend et la migration du garde de décision sont **séparées**, toutes deux inactives en production. Aucune nouvelle transmission Gmail/Resend, Meta, ni opération n8n n'a été lancée.
- Les données Supabase précédemment observées restent : une ligne `published`/approuvée, zéro `draft`, une réservation de validation `reserved`. La boîte Gmail contient bien le courriel historique, mais la réconciliation API Resend/Meta n'est pas terminée.

### Critères manquants avant réception P0 complète

1. Depuis l'environnement OVH réel : PHP/pdo_pgsql, connexion PostgreSQL chiffrée, sécurité sessions/cookies/CSRF, rôle `cuisine_social_viewer` et RLS, chargement des JPEG, vrais essais Android.
2. n8n 01 : diagnostic authentifié GET-only, absence d'exécution Wait en cours confirmée indépendamment, vérification des credentials Resend conservés, migration approuvée puis contrôlée. Ne pas activer ni exécuter pendant cette réception.
3. Unifier l'action authentifiée « approuver / demander une correction / refuser » depuis le dashboard avec l'instance Wait EXISTANTE. Aujourd'hui **seul le formulaire n8n envoyé par mail peut valider**, le PHP restant lecture seule. Toute implémentation nécessite de synchroniser l'identifiant et la version du brouillon, le délai d'expiration et un secret côté serveur. Aucun endpoint public basé sur le simple ID n'est acceptable.
4. Avant d'autoriser le pipeline Meta automatique : migration SQL d'immutabilité après vérification d'impact, scénario de rejet/double clic/concurrence sur une base isolée, et validation humaine des publications individuelles.
5. Réconcilier `validation_dispatches` sans renvoyer le mail ni publier de nouveau.

**Verdict : PASS pour les contrôles locaux/CI ciblés ; P0 END-TO-END NON REÇU ; PR #129 toujours DRAFT.**
