# Cuisine du Cambodge — Réception isolée CMS OVH (27 octobre 2026)

## État vérifié — pas de mise en production

- Dépôt : `roro78/cuisine-cambodgienne`. La CI de `main` avant cette modification était **SUCCESS** (run `40461257000`).
- Exécution de préparation et de réception anonyme : [GitHub Actions #40464816381](https://github.com/roro78/cuisine-cambodgienne/actions/runs/40464816381).
- Construction et contrôles locaux **PASS** : `social-feed.json` (35 fiches), `editorial-source-index.json` (35), `editorial-guided-fields.json` (22). Tests du PHP et de la cohérence des index réussis.
- Paquet isolé **préparé** : artifact GitHub Actions `cms-ovh-scoped-release` (ID `12716027503`), six fichiers de production + manifeste SHA-256/retour arrière dans l'archive.
- **Lecture distante du serveur OVH : NON CONFORME.** Une vraie requête HTTPS effectuée depuis le runner GitHub a reçu **HTTP 404 sur `https://www.cuisine-du-cambodge.com/editorial-source-index.json`**, le 27 octobre 2026. Le test s'arrête immédiatement ; les index suivants et l'interface CMS ne sont donc pas encore attestés.
- **Pas de déploiement effectué** ; aucune modification `ovh-production`, aucune publication n8n/Meta, aucun e-mail envoyé. Le paquet GitHub ne s'installe pas automatiquement.

## Contenu exact du paquet

Les trois fichiers à placer à la racine publique :
- `social-feed.json`
- `editorial-source-index.json`
- `editorial-guided-fields.json`

Les trois fichiers à placer dans la route PHP **`/gestion-contenus/`** :
- `gestion-contenus/index.php`
- `gestion-contenus/lib.php`
- `gestion-contenus/.htaccess`

**Ne pas publier** `CMS-OVH-MANIFEST.json` ni `README.txt` sur le site : ces fichiers sont des aides de transfert et de restauration. Ne pas envoyer tout `dist/`, `public/`, les ateliers, les médias ou la branche `ovh-production` sans nouvelle revue de contenu : certains visuels du carnet du riz restent en attente de réception (issue #121).

## Procédure sécurisée avant d'activer le formulaire

1. **Contrôler le chemin webroot OVH effectif** et la configuration de PHP/Apache. Le site source suppose que le répertoire confidentiel `~/.cuisine-asset-portal/` est **hors racine web**, avec un `config.php` privé contenant les clés `admin_user` et `password_hash`, et les permissions requises. Ne jamais saisir ou partager les secrets via ChatGPT ou dans des logs.
2. **Sauvegarder les éventuels six fichiers déjà présents** (contenu + droits + arborescence). Le mécanisme de sauvegarde et l'accès FTP/SFTP/SSH doivent être sous le contrôle de l'administrateur OVH. Aucune autre page ni média ne doit être modifié.
3. Copier **uniquement** les six fichiers ci-dessus à leur emplacement respectif, en conservant `.htaccess` et le traitement PHP. Vérifier les SHA-256 avec `CMS-OVH-MANIFEST.json`, sans déposer ce manifeste dans la racine web.
4. Contrôler les permissions du stockage hors webroot `~/.cuisine-asset-portal/editorial-drafts/` (répertoire 0700, fichiers 0600) et le compte administrateur existant. Ne pas créer d'utilisateur supplémentaire pour cette étape.
5. Exécuter la commande de réception **en lecture seule** depuis un environnement autorisé :
   ```bash
   node scripts/check-cms-ovh-readiness.mjs --url https://www.cuisine-du-cambodge.com/
   ```
   La réussite attendue est `CMS_OVH_RECEPTION_PASS`. Le contrôle vérifie les trois index, les empreintes intégrales, la page de connexion non authentifiée, les en-têtes de protection et le refus d'accès direct à `lib.php`. Il n'envoie ni identifiant, ni mot de passe, ni POST.
6. En navigateur Android, effectuer séparément une **réception privée** : connexion HTTPS, CSRF, formulaire lisible, création d'un brouillon d'essai sans effet public, conservation d'une version, déconnexion, comportement d'une fiche périmée. Un compte admin réel est indispensable ; cette action ne peut pas être validée par l'outil anonyme.
7. **En cas d'échec** : restaurer exclusivement les six fichiers sauvegardés et bloquer l'accès CMS tant que la protection Apache/PHP ou l'index complet n'est pas opérationnel. Ne pas restaurer la base PostgreSQL et ne pas redémarrer les workflows sociaux.

## Utilisation et limites

- Ce paquet **ne lance pas de publication automatique du site ou des réseaux sociaux**.
- La modification Astro des recettes passe uniquement par l'export d'un brouillon relu, le script local SHA-épinglé, `git diff`, tests, PR et décision humaine. Ne pas donner un accès GitHub en écriture au PHP OVH pour contourner ce circuit.
- Ce lot règle la **préparation et la vérification de réception** ; il **ne prouve pas le transfert** sur OVH.
- Une exécution GitHub programmée ou déclenchée manuellement du workflow `CMS OVH isolated reception and scoped package` pourra reproduire le constat depuis un réseau externe sans secrets de déploiement.
- Prochain jalon une fois OVH réceptionné : rendre le contrôle et l'ouverture de PR pratique pour les recettes sans supprimer les validations humaines. Ateliers et MP3 restent sur un chantier séparé.

## Discipline PR

Une seule branche de livraison a été utilisée : `feat/cms-ovh-reception-20261027`. Pas de nouvelle interface concurrente, pas de flux n8n créé et aucun accès à Meta.
