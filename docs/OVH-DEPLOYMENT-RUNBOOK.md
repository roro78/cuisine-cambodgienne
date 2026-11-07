# Runbook de référence — déployer Cuisine du Cambodge sur OVH / Orvekio

**RÉCEPTION TECHNIQUE CLOSE (6 novembre 2026) :** [procès-verbal Studio Coral](CMS-CORAL-STUDIO-RECEPTION-CLOTURE-20261106.md), preuves [#205](https://github.com/roro78/cuisine-cambodgienne/issues/205#issuecomment-6685255339). Studio PHP livré et reçu en session administrateur réelle depuis #220 ; une PR ouverte n'invalide pas le déploiement. Ne pas relivrer le même SHA ni relancer les précédents contrôles sans régression. Toute nouvelle modification de production nécessite néanmoins son propre diff et rollback ciblé.


**Statut : procédure et index de preuves, pas autorisation permanente de déployer.** Référence pour ChatGPT, Work, Codex et les agents opérant sur `roro78/cuisine-cambodgienne`. À lire **avant** toute action de publication, de livraison de Studio, d'installation Docker ou de restauration. Une PR fusionnée, une CI verte, un HTTP 200 de webhook ou un commit GitHub ne prouvent pas à eux seuls une version reçue en production.

## 1. Identifier sans ambiguïté la cible

| Cible demandée | Technologie/circuit | Où intervenir | Ce que ce circuit ne déploie PAS |
| --- | --- | --- | --- |
| Site public Astro statique | `main` (source) → workflow manuel `.github/workflows/deploy-ovh.yml` → `ovh-production` (artefacts) → intégration Git/webhook OVH mutualisé ou synchronisation contrôlée sur hébergement | GitHub, puis contrôle HTTP réel et, si requis et autorisé, compte mutualisé `cuisinedh` | Studio PHP, secrets, données privées, worker Coral |
| Studio privé PHP/JSON (dashboard, contenus, calendrier, préparation MP3) | Paquet **limité aux fichiers courants approuvés** via `scripts/package-cms-ovh-release.mjs`, puis transfert SFTP/SSH ou méthode de livraison ciblée validée | Hébergement **mutualisé**, chemin historique `/home/cuisinedh/www/cdc2017/` à revérifier ; données privées hors webroot | Publication Astro globale, bases, MP3 historiques, Docker VPS |
| Coral V2 / n8n / Ollama / Traefik | Worker Docker distinct sur VPS Orvekio, accès SSH/SFTP local Windows alias `orvekio-vps`, installation contrôlée | VPS OVH `146.59.146.46`, et non l'hébergement mutualisé | Site public et Studio PHP de l'hébergement mutualisé |

**Ne pas confondre le succès de Remote-SSH vers `orvekio-vps` avec un accès SSH/SFTP au mutualisé** `ssh.cluster102.hosting.ovh.net`. Un agent cloud n'hérite pas automatiquement de l'accès SSH du PC Windows.

## 2. La solution historique déjà trouvée dans ChatGPT

**Preuve reçue le 3 novembre 2026 :** la branche `ovh-production` a reçu un fichier témoin créé depuis ChatGPT, commit `775a0674a2908928f3092062db12264f876d9da3`, `test-deploiement-chatgpt-20261103.txt`. Le propriétaire a ouvert le fichier sur le **site public** et contrôlé l'identifiant `CDC-TEST-CHATGPT-20261103-B9E427`. Un événement webhook `push` sur `refs/heads/ovh-production` avait répondu HTTP 200. Cela confirme **un transport statique ponctuel ChatGPT → GitHub → OVH → URL publique**, pas un déploiement PHP ni la configuration actuelle du filtre de branche OVH. Source de référence : `docs/CMS-OVH-GIT-REPRISE-20261103.md` ; ticket #204.

**Autre circuit réellement utilisé :** transferts manuels **FileZilla/SFTP** de fichiers Studio sur l'hébergement mutualisé les 2–3 novembre (d'abord six fichiers, puis calendrier V2), avec réception du Studio signalée dans les échanges. Relever le paquet **actuel** avant tout nouveau transfert : les anciens lots de 6/7/8 fichiers sont dépassés par les révisions Coral ; les packages ne se remplacent pas sans rapprochement de l'état distant.

**Ce qu'on ne doit pas prétendre :** « aucun déploiement OVH n'a jamais eu lieu » (faux) ; « la CI/le webhook a déployé tous les fichiers » (non démontré) ; « `main` fusionné déploie automatiquement le site » (non : le workflow connu est manuel) ; « le VPS et l'hébergement mutualisé sont une seule machine » (faux).

## 3. Chemin A — publication statique (uniquement après approbation de livraison)

1. Lire `AGENTS.md`, le présent guide, `docs/release-runbook-2026-10-12.md`, `docs/CMS-OVH-GIT-REPRISE-20261103.md`, l'état de `main`, `ovh-production` et les tests du SHA proposé. **Ne pas fusionner `main` dans `ovh-production`** (historiques divergents).
2. Vérifier **avant toute écriture** la branche réellement associée au site OVH, la cible servie et l'effet d'un push de `ovh-production` (webhook potentiellement actif). Si le Manager Git renvoie 404, réutiliser les preuves historiques et chercher une confirmation indépendante non destructive ; un push de test n'est pas un diagnostic sans risque.
3. Le workflow `deploy-ovh.yml` est `workflow_dispatch` sur `main` avec `expected_source_sha` complet, CI/build et contrôle `scripts/check-ovh-publish-scope.mjs` **avant** l'écriture de la branche. Ce garde-fou refuse actuellement les builds contenant du CMS privé : **ne jamais le supprimer/contourner pour publier plus vite**. Ce workflow ne constitue donc pas une méthode universelle de livraison du Studio.
4. Si une release statique conforme est possible : inventorier la racine OVH servie, les fichiers suivis et non suivis ; **sauvegarder les fichiers présents hors webroot et vérifier restauration/empreintes** ; préparer diff, SHA de source et SHA de destination, rollback. Obtenir l'accord explicite sur ce lot et son éventuel déclenchement de webhook **avant** toute publication ou push. N'utiliser le workflow, l'API GitHub ou la synchronisation SSH qu'avec la preuve que le périmètre est sûr.
5. Après livraison approuvée : relever le SHA de `ovh-production` et celui réellement servi, tester les URLs, ressources, HTTP et empreintes. Consigner réception et éventuel rollback. Ne jamais faire `reset --hard`, `push --force`, `rsync --delete` ni écraser des fichiers non suivis.

## 4. Chemin B — livraison ciblée du Studio PHP/JSON

1. Partir du ticket #204, `docs/CMS-OVH-GIT-REPRISE-20261103.md`, `docs/CMS-OVH-RECEPTION-20261027.md`, des changements effectivement fusionnés et du **package généré aujourd'hui** (pas d'ancien ZIP). Vérifier que `.htaccess` protège tous les JSON/helpers privés ; comparer les index aux contenus publics.
2. Via le circuit mutualisé effectivement accessible (FileZilla/SFTP, SSH authentifié, ou circuit de livraison ciblée dûment qualifié), **inventorier les chemins réellement servis et les fichiers présents, y compris non suivis par Git**. Ne demander aucun mot de passe ni clé privée dans le chat. Le fait qu'un agent n'ait pas accès au navigateur OVH ne justifie pas de recréer une infrastructure.
3. Avant transfert : sauvegarde sélective **hors webroot**, droits/tailles/SHA256, restauration contrôlée ; arrêter si une preuve manque. Transférer **uniquement** les chemins approuvés, en préservant les données/drafts, configurations, secrets, MP3, bases, journaux et fichiers non suivis. Garder la page PHP principale pour la fin si le plan de migration l'exige.
4. Vérifier syntaxe PHP, contrôle HTTPS anonyme, protection des helpers, connexion admin/CSRF, nombre de contenus, dashboard à quatre boutons, calendrier, fiches ateliers et la conservation de leurs MP3 ; journaliser le résultat. Rollback ciblé depuis sauvegarde si échec.
5. **Jamais** utiliser la publication statique globale comme raccourci pour écraser le Studio.

## 5. Chemin C — worker Coral V2 / VPS Orvekio

- Le canal SSH/SFTP local **Windows → VPS** est validé, avec alias `orvekio-vps` (ticket #205), mais l'accès cloud peut rester indisponible. Le projet OpenAI API existant ne doit pas être recréé.
- Consulter `deploy/coral/README.md` et la PR #215 (si elle n'est pas encore fusionnée) ; les tests Docker/Linux en environnement isolé ne sont pas une installation réelle.
- Avant installation : avis sur route Traefik (authentification, accès, débit/concurrence), plafonds effectifs OpenAI (le constat « No spend limit set » est un blocage), modèle/permissions, transfert privé des clés, coffre externe, droits montages, sauvegarde/restauration et **autorisation explicite**. L'installation n'autorise ni appel payant, ni TTS, ni publication.
- Aucune modification à PostgreSQL, n8n, Ollama, Traefik, Qdrant, MP3 ni aux sauvegardes en l'absence du périmètre autorisé.

## 6. Comportement obligatoire de l'agent et preuve de livraison

- **À chaque mission**, identifier la cible, ouvrir ce runbook et sélectionner le circuit **déjà existant** ; ne pas repartir sur un débat « avons-nous une méthode OVH ? ». Les choix techniques sont dans le dépôt, les décisions d'écriture restent humaines.
- Distinguer **préparé**, **publié sur GitHub**, **transféré sur OVH**, **servi publiquement**, **recetté avec authentification** ; ne jamais marquer « PROD PASS » sans preuve au bon niveau.
- Si un accès manque, expliciter exactement le privilège ou la preuve absent(e) et utiliser une méthode déjà vérifiée, sans contourner l'authentification, l'empreinte SSH ni les sauvegardes.
- Garder dans le ticket GitHub : date, cible, PR, SHA source, SHA statique si applicable, SHA/fichiers distants, chemin, sauvegarde+preuve de restauration, tests HTTP/PHP, décision humaine, action effectuée, risques et rollback.
- La fusion de PR de **code** et la décision de **déploiement** sont toujours deux autorisations distinctes. Aucun push vers `ovh-production`, upload SFTP ou `docker compose up` sans accord explicite portant sur cette production.

## Sources internes et statut des preuves

- [Ticket #204](https://github.com/roro78/cuisine-cambodgienne/issues/204) : état de déploiement du Studio, fichier témoin et limites.
- [Ticket #205](https://github.com/roro78/cuisine-cambodgienne/issues/205) : worker Coral, SSH Windows, limites de production.
- [Commit statique témoin du 3 novembre](https://github.com/roro78/cuisine-cambodgienne/commit/775a0674a2908928f3092062db12264f876d9da3) : preuve GitHub.
- `docs/CMS-OVH-GIT-REPRISE-20261103.md` : **confirmation rapportée du propriétaire** du fichier témoin affiché sur le site, branche et webhook ; ne pas confondre avec une revalidation actuelle.
- `docs/release-runbook-2026-10-12.md` et `docs/runbook-ovh-ateliers-release.md` : procédure de publication statique manuelle historique.
- `docs/CMS-OVH-RECEPTION-20261027.md` : réception Studio ciblée, sécurité et inventaire.
- `.github/workflows/deploy-ovh.yml` : mécanisme actuel, déclenché manuellement et gardé par contrôle de périmètre.
