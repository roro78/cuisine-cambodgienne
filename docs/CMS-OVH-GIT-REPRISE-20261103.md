# Cuisine du Cambodge — reprise contrôlée GitHub → OVH (3 novembre 2026)

> **Sécurisation supplémentaire (3 novembre) :** le workflow historique `.github/workflows/deploy-ovh.yml` produit `dist/` puis remplace les fichiers suivis de `ovh-production`. Le dossier Astro comprend actuellement des routes PHP privées, ainsi que des index CMS qui doivent rester couplés à leur version de PHP. Le garde-fou `scripts/check-ovh-publish-scope.mjs`, exécuté juste avant la mutation de branche, refuse désormais une publication intégrale qui inclut `gestion-contenus/`, `gestion-social/`, `gestion-visuels/`, les trois index CMS ou des chemins de configuration/secrets. **Cela bloque volontairement les publications globales tant que ces fichiers sont inclus dans le build.** Le test précédent de fichier témoin depuis ChatGPT vers `ovh-production` n'est pas affecté : il ne lance pas ce workflow. Ne pas contourner le garde-fou pour obtenir une publication rapide ; préparer une stratégie distincte pour les fichiers publics et les fichiers PHP, avec sauvegarde préalable vérifiée. Ce correctif est une mesure de protection, pas une livraison du Studio ni une preuve que les fichiers non suivis sont préservés sur OVH.

## Résultat confirmé et limites

- Le propriétaire a vu le fichier `test-deploiement-chatgpt-20261103.txt` depuis le site public. Son contenu identifiait exactement `CDC-TEST-CHATGPT-20261103-B9E427`. Le commit est `775a0674a2908928f3092062db12264f876d9da3`, sur `ovh-production`. Cette **réception réelle d'un fichier statique** établit le transport ChatGPT → GitHub → OVH → URL publique.
- Le webhook `push` vers OVH a répondu HTTP 200 pour le dernier changement précédent, sur `refs/heads/ovh-production`. HTTP 200 prouve la réception du webhook, pas à lui seul la bonne exécution applicative.
- Au début de cette reprise, `main` était à `790800855f6d5461f11dad638d0249f9bedc95e0` (PR #199, calendrier mensuel). Le dernier `ovh-production` contrôlé était `775a0674`.
- La **branche Git** `ovh-production` contient les fichiers du site compilé et **ne suit pas** les routes PHP `gestion-contenus/` ou `gestion-social/`. Cette absence Git **ne prouve pas leur absence sur OVH** : des fichiers ont été transférés auparavant par d'autres moyens et peuvent y être non suivis par Git.
- Le workflow existant `.github/workflows/deploy-ovh.yml` efface le contenu suivi de la branche de livraison puis le remplace par `dist/` et pousse un nouveau commit. **Ne pas l'utiliser comme outil de mise à jour ciblée du Studio** sans revue complète du contenu, de l'état OVH et de la politique de sauvegarde. Ne pas fusionner `main` directement dans `ovh-production`.

## État des chantiers

| Sujet | État vérifié sur GitHub | Ce qui manque |
| --- | --- | --- |
| Dashboard « Créer / Mes contenus / Publications / Calendrier » | PR #191 fusionnée dans `main` | Réception de cette version exacte sur OVH |
| Grille mensuelle du calendrier | PR #199 fusionnée dans `main` | Tests authentifiés Android/OVH sur le fichier réellement servi |
| Paquet CMS isolé | Script `package-cms-ovh-release.mjs` existant ; 3 index JSON et 4 fichiers PHP/Apache ; contrôle de cohérence source | Réconciliation des fichiers OVH en place et sauvegarde privée avant transfert |
| IA texte Ollama | PR #197 de suivi asynchrone en brouillon ; essais S1 antérieurs techniquement exécutés | Qualité éditoriale des cinq familles, service sécurisé et recette de bout en bout |
| Visuels | PR #196 en brouillon ; essai technique d'image distinct documenté | Qualification éditoriale, droits et activation explicite |
| Publications / Supabase | PR #200 en brouillon, CI réussie | Premier mot de passe du rôle `cuisine_social_viewer`, géré uniquement par un circuit de secrets sûr ; connexion Edge réelle et tests RLS/TLS |
| MP3 ateliers | Cahier de parcours approuvé : préparer depuis la fiche atelier, puis valider et générer | Implémentation/réception du parcours, sans activation TTS automatique |

La CI verte n'est ni une réception applicative sur OVH, ni une approbation de fusion des PR en brouillon.

## Lot de reprise engagé — contrôles sans mise en production

1. Compléter `public/gestion-contenus/.htaccess` pour bloquer aussi les appels HTTP directs à `content-gateway-adapter.php` et `openai-brief-adapter.php`. Les trois autres modules déjà identifiés (`lib.php`, `publication-gap-audit.php`, `visual-provider-adapter.php`) restent protégés.
2. Étendre `scripts/check-cms-ovh-readiness.mjs` : contrôle local du .htaccess des cinq helpers et contrôle distant anonyme qui exige une réponse autre que HTTP 200, sans source PHP exposée. Aucun secret, aucune authentification, aucune modification.
3. Aligner `tests/cms-ovh-reception.test.mjs` : cinq modules, neuf GET du parcours de recette, fichier de paquet protégé.
4. Rendre le workflow `cms-ovh-reception.yml` exécutable sur les PR CMS, sans pousser vers OVH. Il prépare un artefact local et rapporte le résultat du test anonyme du site. Ce test distant est **informatif**, un échec ne donne pas autorisation de forcer le déploiement.
5. Produire ce rapport d'état avant tout geste de production.

### Périmètre exact du paquet du Studio

Le paquet actuellement prévu par `scripts/package-cms-ovh-release.mjs` contient **exactement sept fichiers**, après build Astro et validation de leurs empreintes :

- Racine publique : `social-feed.json`, `editorial-source-index.json`, `editorial-guided-fields.json`.
- Sous `gestion-contenus/` : `index.php`, `lib.php`, `publication-gap-audit.php`, `.htaccess`.

Le paquet ne comprend **pas** `gestion-social/`, les configurations `~/.cuisine-asset-portal/`, les brouillons, la bibliothèque privée, les secrets, les données Supabase, les ateliers/MP3, les pages Astro de tout le site ni les adaptateurs facultatifs de génération IA. La configuration IA demeure désactivée.

Les manifestes et README de livraison ne sont **jamais** déposés dans la racine publique.

## Contrat de livraison pour la suite (NO-GO tant qu'un prérequis manque)

**Avant d'écrire sur `ovh-production` :**

1. Obtenir depuis l'hébergement autorisé, **en lecture seule**, l'inventaire des sept chemins cibles, leur SHA-256 actuel, les protections PHP/Apache et la preuve que le dossier Git `/www/cdc2017` est bien la racine servie. Ne jamais lire ni copier un secret.
2. Sauvegarder de manière vérifiable les fichiers existants sous un emplacement **privé hors webroot**, avec droits/tailles/empreintes. Si une sauvegarde ne peut pas être garantie, stopper la livraison.
3. Compiler le commit `main` **exactement épinglé** et attendre une CI complète réussie, fabriquer le paquet isolé, contrôler la liste stricte de sept chemins et les SHA-256 du manifeste.
4. Réconcilier l'état Git de `ovh-production` avec les fichiers déjà présents sur OVH. Si les chemins sont non suivis ou modifiés localement, ne pas utiliser `force`, `reset --hard` ou une synchronisation destructrice.
5. Préparer une PR dédiée **vers** `ovh-production`, à partir de sa dernière tête Git, avec **uniquement** les sept chemins exacts et aucun fichier de configuration. Examiner la différence complète. La fusion est un déploiement réel : elle ne doit intervenir qu'après les quatre étapes précédentes.
6. Vérifier en production PHP, `.htaccess`, refus anonyme des cinq helpers, cohérence des trois index (35 contenus actuels, sans seuil figé), authentification HTTPS, CSRF, vues quatre boutons, calendrier novembre 2026 et conservation des brouillons/versions. Conserver une procédure de rollback sélective.
7. Refaire les essais mobiles Android sur le site réel. Ne pas activer la génération IA ni le module Publications à l'occasion de ce lot.

**Indicateurs GO :** état distant comparé, sauvegarde réversible prouvée, artefact contrôlé, CI du SHA épinglé réussie, aucune différence hors périmètre, recette privée et anonyme PASS. Sinon **NO-GO**, aucun déploiement forcé.

## Suite du chantier, après ce lot

- Publications (#200) : rester en lecture seule, demander un circuit sécurisé pour créer puis conserver le **premier** mot de passe du lecteur Supabase sans le mettre dans GitHub, la conversation, les journaux ni des arguments de commande ; qualifier la vraie liaison HTTPS Edge → PostgreSQL avec TLS et RLS avant fusion et déploiement.
- IA texte (#197) : distinguer succès technique, qualité éditoriale humaine et installation du service de tâches ; ne jamais relancer automatiquement une inférence longue après perte d'accusé.
- Visuels (#196) : garder la sélection manuelle et la version approuvée avant publication ; aucun coût ni appel supplémentaire sans borne explicite.
- Audio : un bouton `Préparer le MP3` sur une fiche atelier, puis `Valider et générer` ; ne pas réintroduire un second Studio Coral obligatoire.

**État final de cette PR :** préparation et tests du périmètre uniquement. **Pas de publication OVH ni de migration des données.**
