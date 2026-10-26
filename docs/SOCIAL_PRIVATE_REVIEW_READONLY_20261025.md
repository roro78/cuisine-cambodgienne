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

## Réception complémentaire — 25 octobre 2026 : rôle viewer + HTTP PHP réels en CI

**HEAD fonctionnel reçu :** `90882ac5e81b4dc2e5941a55d118fb91300cd71a`.
**CI ciblée :** https://github.com/roro78/cuisine-cambodgienne/actions/runs/40243239329 — SUCCESS.

**Correction démontrée :** le script `automation/n8n/sql/social-viewer-role-provisioning-REVIEW.sql` contenait deux délimiteurs PostgreSQL `DO $` non valides ; les contrats statiques initiaux n'avaient pas détecté cette erreur. Les blocs ont été corrigés, avec protection également contre l'octroi du rôle viewer à un autre rôle (appartenances entrantes et sortantes).

**Nouvel essai PostgreSQL 17 réel mais isolé :** le même conteneur jetable crée les tables `posts` et `validation_dispatches` (cette seconde table étant seulement une fixture de test), active RLS, charge le **script de provisionnement réel**, puis `SET ROLE cuisine_social_viewer`. Résultat : deux publications visibles avec RLS et `SELECT`, aucun privilège en écriture et aucune lecture des réservations, tentative `UPDATE` refusée. Marqueur CI `CUISINE_SOCIAL_VIEWER_ROLE_PASS (2 readable, 0 writable)`. Le test précédent d'immutabilité demeure PASS. **Ce résultat ne prouve pas la connectivité PostgreSQL depuis OVH**.

**Dashboard amélioré :** après authentification, la requête inclut les décisions humaines, notes, dates et identifiants de publication FB et IG ; les notes et identifiants sont échappés avant rendu. États Facebook/Instagram présentés par libellés français avec conservation des valeurs brutes inconnues. Les légendes sont désormais affichées entièrement sans un défilement dans chaque bloc en petit écran, toujours sans approbation directe.

**Nouveau test PHP HTTP isolé :** serveur PHP natif local, configuration de test temporaire et mot de passe fictif, aucun accès Supabase/Meta/n8n. Contrôle du rejet d'une requête HTTP sans TLS simulé, du jeton CSRF, des mauvais identifiants, de l'ouverture de session et de sa fermeture, et de l'échec fermé `503` après connexion en l'absence de base configurée. L'indicateur TLS utilisé est exclusivement dans le routeur de test : **aucun contournement TLS n'est ajouté au portail livré**.

**Preuves** : 65/65 tests Node natifs PASS ; test HTTP PHP isolé PASS ; `php -l` PASS ; PostgreSQL 17 / RLS / provisioning PASS ; PostgreSQL 17 / immutabilité PASS. Aucun réel envoi Resend, aucune publication Meta, aucune activation n8n.

**Situation Supabase confirmée par nouvelle requête SELECT** : 1 post, 0 brouillon, 1 réservation `reserved`, aucun rôle `cuisine_social_viewer`, aucun trigger d'immutabilité en production. Aucun schéma n'a été modifié.

**Statut P0 : partiel.** Le code PHP est audité et testable localement, mais sa validation dans OVH et l'approbation *depuis* le dashboard via l'unique Wait n8n demeurent indisponibles sans accès runtime authentifié. Ne pas confondre la simulation PHP avec la réception Android en production. Conserver la PR en brouillon et garder workflows désactivés.

## 26 octobre 2026 — raccordement du schéma réel et contrôle d'accès

Un SELECT d'introspection du projet Supabase `cuisine-du-cambodge` a confirmé les **six colonnes exactes** de `cuisine_social.validation_dispatches` : `post_id`, `idempotency_key`, `state`, `resend_message_id`, `created_at`, `updated_at`. Les contraintes observées sont : clé primaire `post_id`, clé étrangère `ON DELETE RESTRICT`, idempotency_key unique et de longueur 1–256, état limité à `reserved`, `accepted`, `uncertain`. RLS est active sur `posts` et `validation_dispatches`; les deux policies dispatch de production ne concernent encore que le brouillon 1. **Aucune évolution de politiques RLS génériques ni réconciliation réelle n'a été effectuée.**

Le schéma de référence `automation/n8n/schema.sql` définit désormais la table de réservation avec `CREATE TABLE IF NOT EXISTS` et active RLS pour les deux tables, **sans GRANT ni politique permissive**. Ne pas confondre cette mise à jour documentaire avec une migration de la production. Les fixtures et le test PostgreSQL éphémère utilisent désormais la même DDL plutôt que de recréer séparément une structure pouvant dériver ; le schéma et le script de provisionnement sont joués deux fois pour tester l'idempotence.

Le portail `public/gestion-social/index.php` refuse maintenant les héritages et les **délégations entrantes** du rôle lecteur, exige le libellé exact `USING (true)` de sa policy RLS et rejette les DSN PostgreSQL avec paramètres dupliqués (notamment `sslmode`), options non reconnues ou mots de passe intégrés. Il accepte uniquement `host`, `port`, `dbname`, `sslmode` et `sslrootcert`, ainsi que `require`, `verify-ca`, `verify-full` pour TLS. `verify-full` reste préférable une fois la chaîne de certificats hébergeur vérifiée. Ces règles doivent être confrontées à la configuration OVH réelle avant déploiement.

**Sécurité :** aucun SQL n'a été envoyé en écriture au Supabase de production et aucune activation/édition live n8n n'a été tentée. L'approbation depuis le dashboard reste volontairement absente jusqu'à la réception de l'interface sécurisée vers le Wait existant.

### Réception des correctifs de schéma et de privilèges

- Commit `82573458940165d7a105082c1423ba4d69c23041` — [CI native ciblée #40247137712](https://github.com/roro78/cuisine-cambodgienne/actions/runs/40247137712) : **SUCCESS**.
- **68/68 tests Node PASS**, sans appel extérieur durant ces tests.
- Le même conteneur PostgreSQL 17 exécute deux fois le schéma corrigé et le script de création du lecteur : **idempotence validée**. Le test des états FB/IG approuvés, RLS, `SELECT` (2 lignes) et interdiction d'écriture reste **PASS**.
- `php -l` et l'essai HTTP local du portail (session/CSRF/logout/TLS factice limité au routeur de test) restent PASS. La version réelle OVH de PHP et ses extensions ne sont toujours pas connues.
- **Contrôle négatif ajouté** : refus de configuration `sslmode` dupliquée et de délégation entrante du rôle lecteur. La policy RLS ne doit pas dériver de son expression attendue.
- Aucun DDL sur Supabase ; la réservation de Kroeung n'a pas été modifiée ; aucune modification de l'instance n8n ou publication Meta.

### Décision de sécurité — intégration unique dans le dashboard

La documentation officielle du nœud Wait de n8n distingue deux mécanismes :
- `On Form Submitted` : formulaire généré par n8n, utilisé aujourd'hui, mais **sans paramètre d'authentification documenté pour ce mode** ;
- `On Webhook Call` : URL de reprise unique `$execution.resumeUrl`, avec paramètres explicites d'authentification Basic/Header/JWT.

Il serait trompeur d'ajouter trois boutons dans PHP et de les considérer « sécurisés » s'ils transmettent simplement vers le lien public du formulaire existant. L'accès privé au dashboard n'authentifie pas le destinataire du lien de reprise n8n distribué par email.

**Option d'intégration à évaluer après audit GET-only du runtime** : convertir le *même* nœud Wait vers `On Webhook Call` authentifié par Header Auth, avec un unique relais serveur depuis le dashboard qui vérifie la session et les champs du brouillon, puis transmet la décision vers l'URL n8n stockée uniquement côté serveur. La persistance atomique reste le même nœud SQL n8n, sans second UPDATE depuis PHP. Cela nécessiterait une migration coordonnée et des tests de protocole HTTP sur le runtime 2.x, des gardes anti-double clic et une preuve d'absence d'exécution en attente avant application. **Aucun changement de type du Wait n'a été effectué** ; il ne faut pas promettre d'approbation directement depuis le dashboard avant ces contrôles.

Documentation du fournisseur : https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.wait/

## 26 octobre 2026 — Authentification Basic du Wait « formulaire » sans changement de mode

La comparaison du **code source n8n@2.32.7** révèle que `incomingAuthentication: 'basicAuth'` est pris en charge par le nœud `Wait` lorsque `resume: 'form'`. Le type de credential requis est `httpBasicAuth`. Références upstream figées :
- https://raw.githubusercontent.com/n8n-io/n8n/n8n%402.32.7/packages/nodes-base/nodes/Wait/Wait.node.ts
- https://raw.githubusercontent.com/n8n-io/n8n/n8n%402.32.7/packages/nodes-base/nodes/Webhook/description.ts

**Rectification du plan précédent :** Il n'est pas nécessaire de basculer vers `On Webhook Call` uniquement pour sécuriser le formulaire n8n existant. Une conversion de type est plus invasive et pourrait casser les anciens liens reçus. La validation depuis les boutons du dashboard reste un chantier séparé et ne doit pas être implémentée par une simple URL publique non authentifiée.

Un module de planification pur `scripts/cuisine-social-wait-form-auth-plan.mjs` et un audit `scripts/audit-cuisine-social-wait-form-auth.mjs` ont été ajoutés. Le second ne comporte **aucune opération d'écriture**, effectue des **GET-only**, refuse les exécutions `waiting/running`, les changements de workflow, le mauvais credential ou toute dérive des paramètres et du formulaire Wait. Il ne publie ni n'active rien. Aucun username/password de Basic Auth n'est stocké en dépôt : uniquement une référence de credential (ID et nom), à configurer dans n8n.

Préconditions de mise en service : (1) vérification humaine de la version et du nœud déployé, (2) création d'un credential Basic Auth propre à Cuisine du Cambodge, avec mot de passe fort et unique saisi **uniquement dans n8n**, (3) confirmation qu'aucune exécution Wait n'attend une décision, (4) test contrôlé de GET et POST du formulaire sans authentification (refusés) puis avec authentification (autorisés) sur une exécution de test sans publication, (5) sauvegarde et migration séparée approuvée. Un changement de credential au niveau du Wait d'une exécution déjà en cours est interdit.

**Aucun paramètre du Wait actuellement exporté n'a été changé et aucune mutation n8n n'a été déclenchée.** Le statut du chantier demeure `PR DRAFT / P0 NON REÇU`.

### CI de réception du garde Basic Auth — 26 octobre 2026

La [CI ciblée #40248395057](https://github.com/roro78/cuisine-cambodgienne/actions/runs/40248395057) s'est terminée **SUCCESS** : **76 tests Node / 76 PASS**, essais HTTP PHP local, création du lecteur PostgreSQL RLS/SELECT-only (2 lignes visibles, aucune écriture), test d'immuabilité PostgreSQL 17 et lint PHP PASS. Commit de réception `3b03e23a8660433519789256cbdc6a860530840c`.

L'audit n8n en GET-only consulte aussi `/api/v1/credentials` (métadonnées **sans secrets** : identifiant, nom, type), avec pagination. Si le credential n'existe pas, n'est pas un `httpBasicAuth`, possède un autre nom ou n'est pas visible avec les permissions disponibles, il refuse le plan. Aucun identifiant ni clé API n'est affiché en console. Le compte API doit avoir une permission de **lecture des métadonnées credentials** ; un refus 403 constitue un résultat sûr, et non une invitation à contourner les permissions.

**Frontière de cette réception :** les 76 tests prouvent le *plan et l'audit simulés*, pas le comportement HTTP Basic du formulaire réel de n8n 2.32.7. Le formulaire actuellement exporté reste `resume=form` sans `incomingAuthentication=basicAuth` ; le déploiement reste bloqué faute de credential réel et de preuve runtime GET-only. Il n'existe toujours aucun bouton d'approbation actif dans le dashboard PHP.

**Commande prévue uniquement sur un poste/runner privé disposant déjà d'une clé API n8n autorisée (ne partager aucune valeur dans un chat) :**

```bash
N8N_API_KEY="$N8N_API_KEY" N8N_WAIT_BASIC_CREDENTIAL_ID="$N8N_WAIT_BASIC_CREDENTIAL_ID" node scripts/audit-cuisine-social-wait-form-auth.mjs
```

Cette commande **ne peut pas écrire** dans n8n : aucun argument d'application n'est accepté. Après validation du rapport, toute pose du credential Basic Auth devra être une opération séparée avec revue, sauvegarde et procédure de rollback, en conservant le seul `Wait` existant.


### Jalon de sécurité supplémentaire — contrôle d'exécutions exhaustif

L'audit GET-only ne se contente plus des requêtes n8n filtrées `status=waiting/running` : il recense aussi **sans filtre de statut** toutes les exécutions conservées pour le workflow 01, avec pagination bornée, rejet des curseurs répétés, vérification de `workflowId` sur chaque ligne et liste blanche des états terminés (`success`, `error`, `canceled`, `crashed`). Les états `running`, `waiting`, `new` et inconnus sont bloquants, même lorsqu'une API défaillante renvoie zéro résultat aux filtres. Si la liste est trop longue pour être parcourue complètement, le contrôle échoue fermé. **Attention : l'absence d'exécutions dans l'historique conservé n'est pas la preuve définitive qu'aucune reprise Wait n'existe au runtime** ; un contrôle humain dans n8n reste obligatoire avant toute édition.

### Préparation d'un déploiement Basic Auth ultérieur — revue seulement

Le script `scripts/migrate-cuisine-social-wait-form-auth.mjs` installe **uniquement** la référence du credential `httpBasicAuth` sur le nœud `Wait` existant. Son mode par défaut est GET-only ; l'application exige ensemble `--apply --approve-single-wait-auth-update`, plus `N8N_FORM_AUTH_MAINTENANCE_CONFIRMED=YES_NO_RUNNING_WAITS` posé par l'opérateur **après vérification manuelle du runtime**. Il recoupe la liste des exécutions et la version n8n **deux fois**, refuse le credential ou le graphe dérivés, crée une sauvegarde privée 0600 avant tout PUT et relit le serveur après le PUT. L'outil ne publie, n'active ou n'exécute aucun workflow. Un rollback ne doit jamais être automatique si une lecture de contrôle échoue.

**Risques non couverts par les tests :** n8n public API PUT ne garantit pas nécessairement de contrôle de concurrence atomique malgré le re-GET/versionId ; un nouveau `Wait` peut naître entre le dernier GET et le PUT. Exiger une **fenêtre de maintenance effective**, aucune exécution `Wait` en cours confirmée dans l'UI/DB n8n, puis essais de formulaire GET/POST non authentifié/authentifié dans un environnement contrôlé. Une API qui a purgé des exécutions ne constitue pas une preuve suffisante. Les identifiants Basic Auth restent exclusivement dans n8n. Script **non exécuté**, pas de modification du runtime.
