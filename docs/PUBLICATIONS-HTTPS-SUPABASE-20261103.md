# Publications HTTPS — candidat intégré, non déployé

## Alerte administrative du 3 novembre 2026 — mot de passe lecteur absent

Contrôle direct en lecture seule via l'API administrative Supabase, sur `pg_authid` sans consulter de hash : `cuisine_social_viewer` existe, LOGIN est actif, le compte n'est pas expiré, **mais `rolpassword IS NOT NULL = false`**. Les contrôles distincts de rôle, USAGE, SELECT-only, RLS et memberships sont PASS.

**Conséquence : NO-GO pour toute connexion PostgreSQL authentifiée**, y compris via une Edge Function. Le rôle lecteur n'a actuellement aucun mot de passe à utiliser. Ce fait n'a pas été démontré par la CI, qui emploie des fixtures.

Pour poursuivre : **attribuer pour la première fois** au rôle existant un mot de passe aléatoire fort avec un mécanisme privé permettant sa saisie et sa remise sécurisée au gestionnaire de secrets Edge. Il ne faut ni réinitialiser le mot de passe `postgres`, ni donner au lecteur des droits supplémentaires, ni écrire un mot de passe dans Git, des commandes enregistrées, les journaux ou cette conversation. N'effectuer aucune modification administrative avant la disponibilité et l'approbation du circuit sûr de conservation / transfert. Après cela, vérifier LOGIN, SELECT-only et RLS à nouveau, puis tester la connexion réelle.

Ce contrôle ne signifie pas que le serveur PostgreSQL a un problème : un rôle sans mot de passe est simplement inapte à l'authentification par mot de passe nécessaire à ce parcours.


Le module utilise son authentification privée existante, ses sessions, son CSRF,
ses filtres et les formulaires Wait n8n existants. Le client HTTPS est raccordé
dans `gestion-social/index.php` sous le drapeau privé strictement booléen
`social_readonly_https_enabled`, absent/false par défaut. Ce mode ne retombe
jamais sur un accès public REST, une clé anon/publishable ou un compte admin.
Le mode PDO existant reste utilisé lorsque le drapeau n'est pas true.

## Contrat et sécurité

- PHP → destination unique `https://kljbnfjxwloiodwlbrrz.supabase.co/functions/v1/cuisine-social-readonly` : GET, TLS/certificat/nom vérifiés, aucun redirect, connexion 5 s, total 12 s, réponse <= 1,6 Mo.
- Jeton dédié serveur uniquement dans `X-Cdc-Social-Read-Token`. Aucune clé publique Supabase ne donne accès aux publications.
- Fonction Edge : refus anonyme, méthodes autres que GET, paramètres inconnus/dupliqués, IDs et pagination hors bornes. Désactivée tant que `CDC_SOCIAL_READONLY_ENABLED` n'est pas `true`.
- Edge → pooler session officiel 5432, base postgres, utilisateur `cuisine_social_viewer.kljbnfjxwloiodwlbrrz` exclusivement. CA explicite, certificat et nom vérifiés, délais de connexion/requêtes, une connexion par requête.
- Transaction et session READ ONLY ; contrôles identité, attributs, appartenances, droits SELECT-only, RLS/politique dédiée et TLS vu par PostgreSQL avant lecture des posts. Aucun droit ni donnée modifié.
- Réponse versionnée, listes et types validés par PHP, au plus 50 posts/page, historique borné, brouillon lié à l'identité demandée. `source_snapshot` est du texte JSON, comme en PDO.
- Erreurs fixes, sans exception brute ni journalisation du jeton, de la connexion ou des publications.
- `https-readonly.php` est interne et interdit en HTTP par `.htaccess` ; le paquet social comprend désormais six fichiers. Le diagnostic reste exclusivement CLI.

`automation/supabase/config.toml` prépare `verify_jwt=false` pour cette seule
fonction : l'authentification applicative par jeton dédié reste obligatoire
avant toute connexion SQL. Le client n'utilise pas de JWT utilisateur, de clé
anon ni de service-role. Ce réglage n'a pas été appliqué sur Supabase.

## Configuration privée à préparer

OVH : ajouter uniquement au tableau existant de
`/home/cuisinedh/.cuisine-asset-portal/config.php`, après sauvegarde privée et
autorisation d'écriture :

- `social_readonly_https_enabled`: **false** jusqu'à qualification autorisée.
- `social_readonly_https_endpoint`: destination exacte ci-dessus.
- `social_readonly_https_token`: jeton aléatoire dédié de 32–256 caractères base64url, identique à celui de la fonction, jamais envoyé au navigateur.
- Conserver `social_dashboard_received=false` jusqu'à réception effective.

Supabase, mécanisme Secrets de la fonction/projet autorisé :

- `CDC_SOCIAL_REVIEW_TOKEN` : jeton dédié commun, sans réutiliser une clé API.
- `CDC_SOCIAL_READONLY_PG_URL` : URL du rôle lecteur existant, identifiant suffixé du projet, mot de passe existant encodé, hôte officiel, port **5432**, base **postgres**, sans paramètres supplémentaires.
- `CDC_SOCIAL_READONLY_PG_CA` : PEM de la CA officielle validée pour le pooler.
- `CDC_SOCIAL_READONLY_ENABLED` : **false** jusqu'au test de qualification autorisé.

Saisir les secrets via l'outil privé autorisé ou une requête administrative
en mémoire ; jamais en arguments de commande, Git, artefacts, journaux ou
conversation. Ne pas réinitialiser de mot de passe PostgreSQL. Si le mot de
passe lecteur n'est pas disponible, arrêter la configuration et le signaler.

La CA publique utilisée par le dashboard Supabase est référencée dans son code
officiel : `https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt`.
La CA est publique ; les autres valeurs restent privées. Le rôle déjà confirmé
et sa politique ne doivent pas être recréés/modifiés.

## Vérifications et livraison minimale

Les tests PHP 8.3/8.4 exercent les erreurs, les réponses adverses, le dashboard
authentifié, CSRF, filtres, pagination et handoff Wait avec des fixtures locales.
Les tests Deno utilisent une base simulée et interdisent les lectures si un
contrôle rôle/RLS/TLS échoue ; ils ne prouvent pas une connexion Edge réelle.
La CI complète doit réussir au SHA final avant toute livraison.

La qualification réelle exige la disponibilité de la fonction et des secrets
privés : refus sans/mauvais jeton, puis lecture authentifiée de posts connus,
filtres/pages et reprise Wait sans décision ni publication. Le contrôle
`pg_stat_ssl` doit réussir aussi sur le lien pooler→PostgreSQL ; ne pas retirer
ce garde en cas d'échec. Aucun déploiement Supabase/OVH n'est inclus ici.

Après autorisation de la qualification réelle et ses prérequis, préparer le
déploiement Supabase avec la configuration située sous `automation/supabase/`.
Après connexion réelle et tests de sécurité validés, sauvegarder les fichiers
OVH puis transférer ensemble les six fichiers `gestion-social/` issus du même
commit. Ne pas redéployer le Studio, les contenus, les brouillons ou les MP3.

Le diagnostic CLI existant sélectionne le mode selon le drapeau privé. En mode
HTTPS il exige une réponse conforme avec attestation READ ONLY ; en mode PDO
il conserve ses contrôles historiques :

```sh
/usr/local/php8.4/bin/php /home/cuisinedh/www/cdc2017/gestion-social/diagnostic-cli.php
```

Exiger `READY_FOR_PRIVATE_ANDROID_TEST`, puis recevoir la consultation privée
et le lien Studio. L'attestation `social_dashboard_received=true` constitue
une étape finale séparée. Le lecteur n'exécute jamais de publication et les
workflows 01/02/03 restent inchangés.

Références : https://supabase.com/docs/guides/functions/auth ;
https://supabase.com/docs/guides/functions/secrets ;
https://supabase.com/docs/guides/functions/connect-to-postgres .
