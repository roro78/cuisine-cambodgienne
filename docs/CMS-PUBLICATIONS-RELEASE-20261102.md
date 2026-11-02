# Publications — paquet privé distinct (2 novembre 2026)

Le dashboard reste sur `?publications=1` tant que `social_dashboard_received` n’est pas strictement vrai dans la configuration privée et que les cinq fichiers du module ne sont pas présents. Ne positionner cette attestation qu’après installation et recette privée réelles. Une présence de fichiers ou une CI verte ne vaut pas réception.

Le module contient `index.php`, `catalog-readonly.php`, `n8n-wait-readonly.php`, `diagnostic-cli.php` et `.htaccess`. Les helpers et le diagnostic sont bloqués en HTTP ; le diagnostic reste utilisable en CLI. PHP >= 8.1, sessions, curl et pdo_pgsql sont nécessaires. La configuration existante hors webroot est conservée et n’entre jamais dans le paquet.

Le compte PostgreSQL doit être strictement SELECT-only, sans héritage, BYPASSRLS, superuser ou droits de gestion. Le diagnostic existant vérifie droits, RLS et TLS dans une transaction READ ONLY. Le connecteur n8n de consultation reste GET-only ; les décisions demeurent dans le formulaire Wait existant. Aucun workflow social n’est modifié.

Audit OVH réellement exécuté : PHP, pdo_pgsql, curl et connexion administrateur configurés ; `PORTAL_READINESS_FAIL: VIEWER_CREDENTIALS_MISSING`. Les trois paramètres PostgreSQL dédiés sont absents. Le rôle effectif n’a donc pas pu être authentifié ou vérifié : ne pas affirmer qu’il existe, qu’il est absent, ou qu’il est conforme. Aucun rôle ni droit n’a été créé ou modifié. Le module `gestion-social/` est absent de la racine vérifiée.

Le diagnostic CLI accepte maintenant un identifiant non vide avant de vérifier son identité exacte selon le DSN : la vérification anticipée imposait le nom direct et refusait à tort la forme session-pooler autorisée par sa propre politique. La politique DSN/TLS et les restrictions de rôle restent intactes.

Préparer, après commit : `node scripts/package-social-dashboard-ovh.mjs SHA_COMPLET DOSSIER_NOUVEAU`. L’outil exporte les cinq blobs Git exacts, refuse un dossier existant et écrit un manifeste local. Il ne transfère rien et n’inclut ni configuration, ni SQL, ni index public, ni workflow. Les SHA-256 sont dans ce manifeste.

Livraison manuelle séparée après réception du dashboard : confirmer racine, sauvegarder les fichiers éventuellement présents, valider les prérequis privés, transférer seulement la liste autorisée, relire les SHA-256 et permissions, vérifier le refus HTTP des helpers, puis exécuter le diagnostic CLI et recevoir la connexion privée. Aucun transfert dans cette PR. La 404 de Publications n’est pas déclarée résolue en production.
