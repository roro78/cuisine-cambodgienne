# Récupération SEO des liens historiques — 18 octobre 2026

## Périmètre et source de vérité

Audit initial : fichier Excel `audit_backlinks_cuisine_du_cambodge_2026-10-18.xlsx` remis au propriétaire (onglets `Sources externes`, `URL 404 prioritaires`, `Méthode et limites`). Ce document conserve le statut technique dans le dépôt ; ne pas confondre liens HTML, références en texte, réseaux sociaux et historiques d'indexation.

La restauration SEO n'autorise **pas** des redirections vers des pages de thème différent ni une modification du contenu existant pour les besoins du crawl. Aucun impact attendu sur l'acquisition sociale (n8n, Meta, calendriers de publication et validations restent indépendants).

## Six URL 404 confirmées le 18 octobre 2026

| URL historique | Preuve/source | Décision actuelle |
| --- | --- | --- |
| `/recettes-cambodgiennes/` | Wikipédia « Cuisine khmère » | **301 vers `/recettes/`**. Même rubrique, vérifiée en HTTP 200. Règle dans `public/.htaccess`. |
| `/recettes/recettes_khmeres_poulet_curry.php` | Pays du Sourire, recette de poulet au curry | **En attente** : restaurer une véritable recette de curry khmer, puis 301 vers sa nouvelle URL ; ne pas envoyer vers amok. |
| `/nom-krob-totim-dessert-cambodgien-tapioca` | Forum du Routard (30 mai 2017) | **En attente** : recette dessert châtaignes d'eau/tapioca à reconstruire et contrôler ; distincte de num plae ai. |
| `/recette-cambodgienne-samla-mchou-yuan` | Publication Instagram ancienne | **En attente** : la soupe aigre `/recettes/samlor-machu/` ne documente pas nécessairement la variante « yuan » ; comparer la recette avant toute 301. |
| `/le-riz-symbole-de-vie-au-cambodge/` | Document pédagogique Genially | **301 programmée** vers `/culture/le-riz-symbole-de-vie-au-cambodge/` ; article culturel original créé avec références FAO et UNESCO. |
| `/les-marches-cambodgiens-experience-incontournable-du-tourisme` | Wikipédia « Cynophagie » | **En attente** : vérifier le thème et le contexte original ; ne pas publier d'affirmations inexactes ni rediriger hors sujet. |

## Contrôle de l'implémentation

- `public/.htaccess` contient uniquement les redirections dont la correspondance est vérifiée (deux à ce stade : catalogue des recettes, article riz restauré).
- `node scripts/check-seo-legacy-redirects.mjs` vérifie les deux règles exactes, l'existence des pages de destination et (après compilation) que `dist/.htaccess` est réellement présent.
- CI GitHub effectue ce contrôle après le build ; les workflows CI et publication préservent explicitement `public/.htaccess` vers `dist/.htaccess` avant validation et avant de modifier `ovh-production`.
- L'existence de `dist/.htaccess` n'atteste **pas** de l'application des règles : vérifier après transfert OVH `curl -I https://www.cuisine-du-cambodge.com/recettes-cambodgiennes/` et attendre **301** avec `Location: https://www.cuisine-du-cambodge.com/recettes/`. Répéter pour l'ancienne URL sur le riz en contrôlant une redirection vers `/culture/le-riz-symbole-de-vie-au-cambodge/`, qui doit répondre **200**.
- Vérifier que `/recettes/` répond **200**, les quatre autres anciennes pages restent **404** tant qu'elles ne sont pas éditorialement restaurées, et que le `sitemap.xml` canonique conserve uniquement les URL définitives.
- Ne jamais déployer automatiquement sur une fusion ; respecter le workflow `deploy-ovh.yml` à SHA épinglé puis la synchronisation réelle OVH (cf. `docs/release-runbook-2026-10-12.md`).

## Sources externes de l'audit

- Wikipédia, cuisine khmère : https://fr.wikipedia.org/wiki/Cuisine_khm%C3%A8re
- Wikipédia, cynophagie : https://fr.wikipedia.org/wiki/Cynophagie
- Le Routard, discussion dessert : https://www.routard.com/forums/t/recherche-nom-dun-dessert/177773/5
- Pays du Sourire : https://paysdusourire.wifeo.com/cuisine-cambodgienne.php
- Genially : https://view.genially.com/6049f0fd42ac330d8f4cd439
- Instagram : https://www.instagram.com/p/BMzhlVJjA73/

## Limites

Inventaire exploratoire de **26 références** dans l'Excel initial, dont **9 balises HTML directement vérifiées** lors de l'audit. Ce n'est ni un profil Ahrefs/Majestic complet ni une preuve de récupérations de classements. Restent à obtenir : Search Console, anciens sitemaps, archives Wayback, ensemble des URL référentes perdues, métriques de recherche avant/après. Les résultats IA / ChatGPT ne sont pas garantis par l'âge des backlinks.
