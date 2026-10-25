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
- Deux policies `validation_dispatches` visent *uniquement* `post_id=1` : SELECT et INSERT de la réservation `cuisine-social-validation/draft-1` pour `cuisine_n8n`. L'automatisation générique de nouveaux brouillons est **bloquée côté réservation tant que les privilèges/policies ne sont pas repensés et testés**. Ne surtout pas élargir avec `USING(true)` ou `WITH CHECK(true)` sans validation.
- Une réservation `post_id=1` reste `reserved` depuis le 21/10/2026 à 20:45:55 UTC, `resend_message_id IS NULL` et n'a pas changé depuis ~95 h lors du contrôle. Le post lié est `published`/approuvé en base pour FB et IG. **Ce n'est ni une preuve d'envoi Resend ni une preuve de publication Meta réelle.** Ne pas réémettre, réinitialiser ou republier avant vérification indépendante.
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
