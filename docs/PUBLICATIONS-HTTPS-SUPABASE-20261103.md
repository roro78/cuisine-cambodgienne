# Publications — adaptation HTTPS Supabase (brouillon non déployé)

## Vérifications

Le 3 novembre 2026, depuis le shell SSH de l'hébergement web OVH, l'URL REST du projet Supabase a répondu avec HTTP 401 et une validation TLS réussie. Sans authentification, ce code est attendu. La connexion PostgreSQL directe sur 5432/6543 est refusée depuis OVH ; elle fonctionne au niveau TCP depuis le PC et Orvekio.

## Proposition

Studio PHP (connexion privée existante) → HTTPS → fonction Edge Supabase → connexion PostgreSQL avec le rôle lecteur existant → table cuisine_social.posts.

La fonction Edge est un composant Supabase et ne nécessite aucun nouveau service sur le VPS Orvekio. Aucun accès public aux tables ni modification des workflows n8n n'est prévu.

## Conditions de recette

- Fonction Edge utilisable uniquement par des requêtes serveur à serveur authentifiées ; refus des requêtes anonymes.
- Base interrogée sous le rôle cuisine_social_viewer, avec contrôle des privilèges en lecture seule et RLS.
- Paramètres bornés et validés ; liste limitée, sortie JSON de taille bornée, absence de mutations.
- Connexions TLS et contrôle du certificat obligatoires.
- Ne pas exposer les données des publications dans le navigateur sans la session privée et le contrôle CSRF déjà existants.
- Aucun redéploiement OVH ou activation automatique sur cette branche.
- Vérifier la disponibilité réelle de la fonction, les réponses invalides et les erreurs réseau avant tout raccordement au dashboard.
- Conserver les parcours n8n 01/02/03 et les formulaires de décision existants.
- L'indicateur social_dashboard_received doit rester false jusqu'à réception manuelle.

## État des livrables

- automation/supabase/functions/cuisine-social-readonly/index.ts : candidat fonction Edge non déployé.
- public/gestion-social/https-readonly.php : client PHP en attente d'intégration, non appelé par index.php.
- Aucune connexion authentifiée fonction Edge vers la base n'a été testée.
- Aucune mise à jour de la production ou des rôles Supabase réalisée.

Docs de référence :
- https://supabase.com/docs/guides/functions/connect-to-postgres
- https://supabase.com/docs/guides/functions/secrets
- https://supabase.com/docs/guides/functions/auth
