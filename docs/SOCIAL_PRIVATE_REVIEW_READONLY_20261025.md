# Dashboard privé de validation — trace de reprise

Ce document remplace le journal technique tentaculaire de la PR #129.
**Le circuit n8n 01/02/03 existant reste la référence et n'est pas modifié.**

## Réception du code
Le PHP `public/gestion-social/index.php` est une application privée de
consultation : connexion sécurisée, rendus FB et Instagram, historique des
décisions et états, accès au formulaire de validation **n8n Wait existant**
grâce à un lien signé copié depuis le courriel de validation.

La redirection utilise une action POST avec CSRF, session authentifiée,
validation HTTPS / origine `n8n.orvekio.com` / chemin `/form-waiting/` /
signature, et HTTP 303. Aucune copie du lien n'est conservée en base.
La décision elle-même est laissée à n8n.

## Non terminé
Aucune liaison automatique entre `posts.id` et les liens de reprise Wait
n'existe dans la base de données de consultation, donc les trois actions
sur une carte ne peuvent pas encore envoyer une décision directement.
Le support PHP/pdo_pgsql réel et le provisionnement SQL de lecture seule
sur OVH/Supabase ne sont pas réceptionnés. Ne pas prétendre être en prod.

## Préservation
Les scripts et SQL expérimentaux d'authentification n8n et de réservation
ont été exclus du **diff** de PR #129 ; les précédents commits et tests restent
retrouvables dans l'historique Git. Aucun workflow live, secret, e-mail ou
publication Meta n'a été modifié par cette réduction de périmètre.

[Plan de réception du dashboard](SOCIAL_AUTOMATION_PLAN_20261026.md).
