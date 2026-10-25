# Cuisine du Cambodge — Espace privé de consultation sociale (P0, lecture seule)
**25 octobre 2026. Réalisation en PR #129 ; aucune mise en production.**

## Composant livré en code

`public/gestion-social/index.php` est une **première véritable page serveur privée**, distincte de la maquette HTML hors ligne. Sur un hébergement OVH PHP configuré, elle lit les lignes de `cuisine_social.posts` avec un rôle PostgreSQL ne disposant **que de SELECT**, puis affiche les miniatures compactes, légendes distinctes Facebook/Instagram, liens vers les pages réelles, statuts par plateforme et filtres.

- Connexion protégée HTTPS, session dédiée, mot de passe haché, jeton CSRF, expiration 30 min et limitation des échecs, headers anti-indexation et CSP.
- Photographies en 220 px max (190 px sur petit écran), JPEG d'origine inchangés ; texte et liens échappés, domaine Cuisine du Cambodge strictement contrôlé.
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
