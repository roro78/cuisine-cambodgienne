# Récupération SEO des liens historiques — 18 octobre 2026

## Périmètre et source de vérité

Audit initial : fichier Excel `audit_backlinks_cuisine_du_cambodge_2026-10-18.xlsx` remis au propriétaire (onglets `Sources externes`, `URL 404 prioritaires`, `Méthode et limites`). Ce document conserve le statut technique dans le dépôt ; ne pas confondre liens HTML, références en texte, réseaux sociaux et historiques d'indexation.

La restauration SEO n'autorise **pas** des redirections vers des pages de thème différent ni une modification du contenu existant pour les besoins du crawl. Aucun impact attendu sur l'acquisition sociale (n8n, Meta, calendriers de publication et validations restent indépendants).

## Six URL 404 confirmées le 18 octobre 2026

| URL historique | Preuve/source | Décision actuelle |
| --- | --- | --- |
| `/recettes-cambodgiennes/` | Wikipédia « Cuisine khmère » | **301 vers `/recettes/`**. Même rubrique, vérifiée en HTTP 200. Règle dans `public/.htaccess`. |
| `/recettes/recettes_khmeres_poulet_curry.php` | Pays du Sourire, recette de poulet au curry | **301 en production depuis le 18 octobre 2026** vers `/recettes/curry-poulet-khmer/` ; recette adaptée et sourcée, sans la confondre avec l’amok. |
| `/nom-krob-totim-dessert-cambodgien-tapioca` | Forum du Routard (30 mai 2017) | **301 en production depuis le 18 octobre 2026** vers `/recettes/nom-krob-totim/` ; dessert reconstitué et distinct de Num Plae Ai. |
| `/recette-cambodgienne-samla-mchou-yuan` | Publication Instagram ancienne | **301 en production depuis le 18 octobre 2026** vers `/recettes/samla-mchou-yuon/` ; variante documentée avec poisson, tomate, ananas et herbes, distincte de la soupe généraliste. |
| `/le-riz-symbole-de-vie-au-cambodge/` | Document pédagogique Genially | **301 en production depuis le 18 octobre 2026** vers `/culture/le-riz-symbole-de-vie-au-cambodge/` ; article culturel original créé avec références FAO et UNESCO. |
| `/les-marches-cambodgiens-experience-incontournable-du-tourisme` | Wikipédia « Cynophagie » | **En attente** : vérifier le thème et le contexte original ; ne pas publier d'affirmations inexactes ni rediriger hors sujet. |

## Contrôle de l'implémentation

- `public/.htaccess` contient uniquement les redirections dont la correspondance est vérifiée (cinq à ce stade : catalogue, article riz, curry, dessert et soupe acidulée).
- `node scripts/check-seo-legacy-redirects.mjs` vérifie les cinq règles exactes, l'existence des pages de destination et (après compilation) que `dist/.htaccess` est réellement présent.
- CI GitHub effectue ce contrôle après le build ; les workflows CI et publication préservent explicitement `public/.htaccess` vers `dist/.htaccess` avant validation et avant de modifier `ovh-production`.
- L'existence de `dist/.htaccess` n'atteste **pas** de l'application des règles : vérifier après transfert OVH `curl -I https://www.cuisine-du-cambodge.com/recettes-cambodgiennes/` et attendre **301** avec `Location: https://www.cuisine-du-cambodge.com/recettes/`. Répéter pour chacune des quatre autres URL restaurées en contrôlant les cibles HTTP **200** correspondantes.
- Vérifier que `/recettes/` répond **200**, seul l'ancien article relatif aux marchés reste volontairement **404** faute de destination éditoriale confirmée, et que le `sitemap.xml` canonique conserve uniquement les URL définitives.
- Ne jamais déployer automatiquement sur une fusion ; respecter le workflow `deploy-ovh.yml` à SHA épinglé puis la synchronisation réelle OVH (cf. `docs/release-runbook-2026-10-12.md`).

Les trois fiches historiques supplémentaires sont séparées des 13 recettes classiques pour préserver les tests V18 et les contenus déjà publiés. La photo d’ingrédients utilisée sur le curry ne prétend pas montrer le plat terminé ; la fiche Nom Krob Totim ne prétend pas disposer d’une photographie non retrouvée. La fiche Samla M’Chou Yuon utilise une illustration de soupe proche, expressément signalée.

## Lot complémentaire : normalisation de l'hôte et du protocole

Le 18 octobre 2026, les trois variantes `http://cuisine-du-cambodge.com/`, `https://cuisine-du-cambodge.com/` et `http://www.cuisine-du-cambodge.com/` ont chacune été observées en HTTP 200, au lieu d'une redirection 301 vers `https://www.cuisine-du-cambodge.com/`. Les balises canoniques ne remplacent pas l'intérêt d'une redirection serveur explicite.

Sur la branche `fix/seo-canonical-www-https-20261018`, les cinq `RedirectMatch` sont rassemblées sous `mod_rewrite`, en préservant les mêmes cibles. Les règles supplémentaires redirigent uniquement les deux variantes de l'hôte Cuisine et le protocole HTTP vers HTTPS + www ; les paramètres de suivi UTM restent intacts.

**Contrôle local effectué avec Apache 2.4 :** cinq anciennes URL vers leur destination correcte en un saut 301, HTTP www vers HTTPS www, HTTP et HTTPS sans www vers HTTPS www, paramètres UTM préservés, hôte simulé non-Cuisine non redirigé. Cela ne remplace pas le contrôle après déploiement OVH (HTTPS et domaines configurés côté hébergeur).

**Critères de réception OVH :** obtenir 301 + `Location` sur les trois variantes d'accueil et sur les anciennes URL, puis vérifier HTTP 200 sur la destination canonique. Conserver le sitemap sur `https://www.cuisine-du-cambodge.com/`. Tester au minimum :
```bash
curl -I http://cuisine-du-cambodge.com/
curl -I https://cuisine-du-cambodge.com/
curl -I http://www.cuisine-du-cambodge.com/
curl -I 'http://cuisine-du-cambodge.com/recettes/lok-lak/?utm_source=facebook'
curl -I http://cuisine-du-cambodge.com/recettes/recettes_khmeres_poulet_curry.php
curl -I https://www.cuisine-du-cambodge.com/recettes-cambodgiennes/
```

Si la nouvelle configuration crée une boucle, une réponse serveur 500, un domaine tiers redirigé ou une perte du trafic social, restaurer le `.htaccess` précédent avant de poursuivre.

## Sources externes de l'audit

- Wikipédia, cuisine khmère : https://fr.wikipedia.org/wiki/Cuisine_khm%C3%A8re
- Wikipédia, cynophagie : https://fr.wikipedia.org/wiki/Cynophagie
- Le Routard, discussion dessert : https://www.routard.com/forums/t/recherche-nom-dun-dessert/177773/5
- Pays du Sourire : https://paysdusourire.wifeo.com/cuisine-cambodgienne.php
- Genially : https://view.genially.com/6049f0fd42ac330d8f4cd439
- Instagram : https://www.instagram.com/p/BMzhlVJjA73/

## Limites

Inventaire exploratoire de **26 références** dans l'Excel initial, dont **9 balises HTML directement vérifiées** lors de l'audit. Ce n'est ni un profil Ahrefs/Majestic complet ni une preuve de récupérations de classements. Restent à obtenir : Search Console, anciens sitemaps, archives Wayback, ensemble des URL référentes perdues, métriques de recherche avant/après. Les résultats IA / ChatGPT ne sont pas garantis par l'âge des backlinks.

## Sources vérifiées pour les recettes restaurées

- [Poulet curry khmer — Pays du Sourire](https://paysdusourire.wifeo.com/cuisine-cambodgienne.php) : mention de l’ancienne URL et détails de la préparation.
- [Nom Krob Totim — Routard, 2017](https://www.routard.com/forums/t/recherche-nom-dun-dessert/177773) et [Provence Town, 2017](https://provencetown.wordpress.com/category/recettes/) : ingrédients et méthode. Quantités rééquilibrées et signalées.
- [Samla Machou Yuon — Phnomenon, 2006](https://www.phnomenon.com/index.php/cambodian-food/recipes/samla-machou-yuon-the-y-word/) et [Provence Town, 2017](https://provencetown.wordpress.com/category/recettes/) : variante fruitée au poisson, historique et lexique contextualisés.

**État au 18 octobre 2026 :** PR #79 fusionnée au commit `f1706841c8001c580ceeb3bd0e1adc8d3179c29e` ; workflow OVH #51 réussi ; les cinq anciennes URL redirigent publiquement vers les cibles attendues et les nouvelles pages répondent 200. Cela ne démontre aucune récupération de classement Google.
