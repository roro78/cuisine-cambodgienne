# Reprise du Studio — 28 octobre 2026

## Reprise du 29 octobre — C1 fusionné, raccordement C2

Revue complète de #150 : aucun blocage identifié, tête `0eea28f` et CI complète
#40782642281 SUCCESS. Fusion squash expressément demandée par le propriétaire,
réalisée au SHA `c0ab78054af9610a47ae9cb3536b74ef2858d43b` ; `main` local synchronisé
sans perte. [CI main #40785051928 SUCCESS](https://github.com/roro78/cuisine-cambodgienne/actions/runs/40785051928).
Les filtres des anciens déclencheurs OVH ont été vérifiés ; aucun déploiement lancé.

Le [raccordement P1C-C2](CMS-STRUCTURED-GENERATION-P1C-C2.md) est développé dans
la [PR #151](https://github.com/roro78/cuisine-cambodgienne/pull/151) : même formulaire,
candidat temporaire à relire, sauvegarde privée explicite, provenance serveur et
versions immuables, quota partagé, contrôles de doublons/références/concurrence et
échecs sans retry. Fournisseur réel désactivé ; transport de passerelle facultatif
préparé sans créer de webhook. Une interface de données de brief visuel reste
`pending`, sans génération d'images. Aucun changement Astro, média, MP3 ou n8n 01/02/03.

Local : 37 contrats Node PASS, Astro 0 erreur/0 warning (24 hints), build 48 pages.
Les smokes C2 cinq familles et le parcours HTTP PHP avec sessions/CSRF sont ajoutés
à la matrice 8.3/8.4 ; lire la CI au SHA final de #151. Le modèle y est simulé,
HTTPS simulé sur loopback ; aucune recette OVH privée ou visuelle n'est déduite.

Blocage moteur confirmé : aucune variable d'accès IA du processus, Ollama local
inaccessible, pas d'outil exposé pour piloter la session n8n connectée signalée.
Aucun test distant ni résultat/coût inventé. Un [protocole distinct de rédaction
structurée](BENCHMARK-STRUCTURED-CONTENT-P1C.md) complète celui des briefs.

Suite : qualifier le moteur et la passerelle privée, recette contrôlée après
autorisation, combler les écarts Astro, briefs visuels, aperçu fidèle et publication
validée. La réception calendrier est acquise. **Aucun transfert C2 sur OVH.**

## État de reprise actuel — après les PR #146 à #149

Cet état prévaut sur les instantanés historiques ci-dessous. `main` local est
synchronisé sur `46fef8caa03cc1beb6cc92f12996de90908e36f9`, PR #146–#149 fusionnées,
[CI #40777733812 SUCCESS](https://github.com/roro78/cuisine-cambodgienne/actions/runs/40777733812).
Les branches et `artifacts/` sont conservés. Le calendrier OVH reste réceptionné
par le propriétaire ; le GET public actuel est PASS. Aucun déploiement des lots
IA ni activation de fournisseur n'est attesté par cette reprise.

Le propriétaire signale une session n8n connectée, mais aucun outil de cette
session ne permet de la piloter. Aucun accès IA n'est configuré dans le processus ;
l'inventaire Ollama local est inaccessible. **Aucun benchmark réel, classement de
qualité, coût ou modèle distant installé n'est attesté.** Ce blocage d'accès
n'empêche pas la préparation du [contrat structuré P1C-C1](CMS-STRUCTURED-CONTENT-P1C-C1.md),
dans une branche/PR séparée : champs issus du formulaire commun pour les cinq
familles, validation stricte et références publiques canoniques pour ateliers.
Ce contrat ne déclenche ni modèle ni sauvegarde et n'est pas raccordé à l'interface.

Suite prioritaire : essai du moteur depuis l'infrastructure n8n/Ollama existante,
puis transport et sauvegarde avec provenance/quota partagés, compléments des vrais
modèles Astro, briefs visuels, aperçu Astro fidèle, publication approuvée et
calendrier média avancé. Les décisions et preuves historiques restent conservées
ci-dessous ; leurs mentions « PR ouverte » ou « calendrier à recevoir » sont datées.

## État vérifié et limites de preuve

Le dépôt local a été synchronisé par avance rapide de `c13023b6015f709411854d8738bf7a694be17af0` vers `1264e7d45b948623be323d724daf94b457ff856a`. Les fichiers non suivis de `artifacts/` et les anciennes livraisons sont conservés. Les travaux de réception sont sur la branche isolée `fix/cms-calendar-php84-reception-20261028`, sans modification directe de `main`.

Les PR #139, #140, #141, #143, #144 et #145 sont intégrées dans ce commit. La [CI après fusion #40754204071](https://github.com/roro78/cuisine-cambodgienne/actions/runs/40754204071) est **SUCCESS**, et non plus en cours. Ses logs confirment :

- lint des deux fichiers PHP et `CMS_PRIVATE_DRAFTS_APPEND_ONLY_PASS` ;
- `CMS_GUIDED_REAL_DATA_PASS` sur toutes les fiches réelles (35 au moment du contrôle) ;
- `CMS_CREATION_MANUAL_PASS`, cinq familles, révisions privées et refus des doublons ;
- `CMS_CALENDAR_PRIVATE_PASS` ;
- Astro, build et contrats recettes, médias et MP3 réussis. Plusieurs recettes navigateur conditionnelles d'autres branches sont **SKIPPED**, pas réceptionnées par ce run.

Contrôles locaux exécutés sur le code synchronisé : `npm run check` (**0 erreur, 0 warning, 23 hints**), `npm run build` (**48 pages**), les sept contrats Node CMS/canonique/guidé/patch/architecture/pipeline/réception (**26/26**), et `git diff --check` (**PASS**). PHP n'est pas installé localement ; aucun composant système n'a été installé. Les résultats PHP cités ci-dessus proviennent de GitHub Actions, pas de Windows.

Le contrôle HTTPS distant `node scripts/check-cms-ovh-readiness.mjs --url https://www.cuisine-du-cambodge.com/` retourne **`CMS_OVH_RECEPTION_PASS`** : trois index de même couverture, connexion protégée, accès direct à `lib.php` refusé. **Ce contrôle public ne teste ni la session administrateur, ni le calendrier privé, ni la sauvegarde ou les permissions des brouillons sur OVH.**

## Calendrier OVH — cause corrigée, réception confirmée

**Réception du 28 octobre confirmée par le propriétaire :** transfert du paquet correctif `106537c`, puis « Calendrier ouvert, filtres et versions existantes vérifiés » après ouverture directe de `?calendar=1`. Le contrôle public GET exécuté après le transfert retourne également `CMS_OVH_RECEPTION_PASS` (trois index cohérents, connexion protégée, accès direct à la bibliothèque PHP refusé). La réception connectée est une preuve rapportée par l'opérateur ; elle n'a pas été pilotée dans un navigateur par l'agent. La sauvegarde distante et le retéléchargement des deux fichiers du correctif n'ont pas été vérifiés indépendamment par l'agent.

**CI du correctif :** [run #40764488613](https://github.com/roro78/cuisine-cambodgienne/actions/runs/40764488613), SHA `106537cc7c9675aaf8ed926f6180c811571418b9`, **SUCCESS** pour le job principal et PHP 8.3/8.4. Les deux runtimes confirment `CMS_CALENDAR_PRE_FIX_TYPE_ERROR_REPRODUCED` sur l'ancien fichier et `CMS_CALENDAR_REQUEST_DEFAULTS_PASS` sur le correctif. **Le jalon A du calendrier est réceptionné ; P1C peut commencer sur une branche et une PR distinctes.** Cela ne fusionne pas automatiquement la PR #146 et ne vaut pas réception de tous les autres parcours du Studio.

**Cause identifiée après le dernier retour du propriétaire : `RUNTIME_DIAG_V1_TYPE_ERROR_UNKNOWN_LIB_1095_PHP_8_4_27`.** Les deux SHA-256 rapportés correspondent exactement à la livraison `c51e35e` (index `94d2ce9ad6e6c12955195a47e96daefab7ffdc54e20d5de063fcbcc074fe3ab8`, bibliothèque `3c8104348e34c7d608a0574edad217021118afd9e946088c5b79f95ebc466dcf`). Dans cette version, la ligne 1095 est la **déclaration typée** de `cmsCalendarPlan`, avant lecture des projets.

Le lien initial `?calendar=1` omet `calendar_status`. Le code évaluait `in_array($_GET['calendar_status'] ?? 'all', ['all','draft','review'], true)` à vrai, puis lisait **`$_GET['calendar_status']` sans défaut** dans la branche positive. Il transmettait donc `null` au quatrième argument déclaré `string`. Cela produit un `TypeError` à l'entrée de la fonction, même avec `[]`. Les tests du helper passaient car ils fournissaient directement une chaîne ou utilisaient le paramètre par défaut de la fonction ; ils ne traversaient pas l'initialisation de la page. Ni les brouillons ni une fonction PHP désactivée ne sont nécessaires pour reproduire ce défaut.

**Correction dans la même PR #146 :** `cmsCalendarStatus` normalise uniquement `all/draft/review` et renvoie toujours une chaîne ; l'entrée de la page lui transmet la valeur ou son défaut. Le test `editorial-calendar-request-smoke.php` exécute le **bloc réel d'initialisation de la page**, isolé de l'authentification, du réseau et du stockage privé, sur onze requêtes (filtre absent, partiel, valide, null ou invalide), puis projette un calendrier vide. Les jobs PHP 8.3/8.4 vérifient aussi la reproduction du `TypeError` à partir du fichier exact de `c51e35e`. Le code testé par `eval` appartient au dépôt ; aucun contenu reçu du navigateur ou d'un brouillon n'est exécuté.

Les empreintes initialement rapportées identifiaient les fichiers `c51e35e` sur disque, sans certifier indépendamment OPcache. La validation du correctif et la réception du calendrier sont désormais documentées ci-dessus.

### Complément de diagnostic de la même PR #146

La vue d'erreur authentifiée propose désormais « Référence technique pour le diagnostic ». Elle ne crée aucun endpoint ni page d'administration supplémentaire. Le contrôle à vide conserve son code principal et ajoute :

- un vocabulaire fermé `RUNTIME_DIAG_V1_*` : classe générale de l'erreur, opération connue uniquement, numéro de ligne dans la bibliothèque publique si l'erreur vient effectivement de celle-ci et version PHP ;
- les SHA-256 **sur disque** de `index.php` et `lib.php`, sans lire le fichier de configuration ni les brouillons ; ces empreintes ne certifient pas le code déjà mis en cache par OPcache ;
- `DIAGNOSTIC_HELPER_MISSING` si la bibliothèque chargée ne possède pas le nouveau helper, même si les fichiers présents sur disque ont été transférés.

Le message brut, la trace, le chemin serveur et les données des projets ne sont jamais affichés ni journalisés. Une fonction absente n'est identifiée que si son nom appartient à la liste fermée des dépendances du calendrier. Une exception inconnue reste `UNKNOWN`, sans divulgation de texte.

Pour reproduire **une catégorie possible** d'échec du moteur (sans prétendre reproduire la configuration OVH), les deux jobs PHP 8.3/8.4 désactivent séparément `array_sum`, `array_map`, `usort` et `ksort` dans des processus CLI de test. Ils vérifient que le véritable appel à vide échoue et que le diagnostic identifie précisément la fonction absente. Le comportement PHP 8 des fonctions désactivées est décrit dans la [documentation PHP](https://www.php.net/manual/en/ini.core.php#ini.disable-functions). Des exceptions contenant des titres et chemins privés synthétiques doivent rester expurgées. Aucune configuration OVH n'est modifiée par ces tests.

**Réception suivante :** après sauvegarde et livraison de la paire PHP du nouveau commit validé, relever la référence `RUNTIME_DIAG_V1_*` et les deux empreintes dans ce volet. Cela permet d'identifier la dépendance ou la ligne réelle avant de corriger. Si `DIAGNOSTIC_HELPER_MISSING` apparaît, vérifier la paire transférée et le mécanisme hébergeur de renouvellement du cache. Ne pas utiliser d'endpoint public `phpinfo` ou de reset OPcache.

L'accès indiqué par le propriétaire est **FileZilla « cdc » uniquement**. Conserver `ftp.cluster002.hosting.ovh.net` et vérifier le dossier `www/cdc2017/gestion-contenus/`. Aucun accès SFTP fonctionnel n'est présumé. Aucun outil de contrôle de la session FileZilla ou d'une session Studio connectée n'est disponible dans cette intervention. **Aucune sauvegarde distante, aucun transfert et aucune mutation des brouillons n'ont été effectués.** Ne pas recopier d'identifiant secret, de cookie ni de contenu privé dans les rapports.

Le code utilise toujours l'authentification HTTPS, la session sécurisée, le CSRF avant traitement des POST et le stockage privé append-only avec contrôle de version. Les droits 0700/0600 sont exigés par les helpers ; leur valeur réelle sur OVH reste à constater. La projection `cmsCalendarPlan` n'écrit pas dans les révisions. Aucun correctif PHP supplémentaire n'est appliqué sur une cause de production non prouvée.

### Vérification PHP explicite ajoutée dans cette PR

La CI historique dépend du PHP préinstallé du runner sans sélectionner 8.4. Cette PR ajoute deux jobs explicites PHP **8.3 / 8.4**, après le build validé. Ils téléchargent exclusivement les trois index **publics** de ce build, exécutent les tests de toutes les fiches, de création manuelle et du calendrier ; le calendrier est aussi testé sans `php.ini` (`php -n`). L'action de sélection est documentée par [setup-php](https://github.com/shivammathur/setup-php).

Le smoke de création prend désormais une empreinte de chaque révision temporaire et de ses permissions avant/après lecture du calendrier : projets datés/sans date, mois sans projet daté, filtres et dernière version seulement. Les dates invalides sont refusées sans modifier l'entrée. Les fixtures sont éphémères dans le répertoire temporaire du runner ; ce test ne lit pas les données OVH.

**Preuve acquise :** [CI #40756940900](https://github.com/roro78/cuisine-cambodgienne/actions/runs/40756940900), commit de tests `0ca255f2b9b2937056d64f4e9db2da7ba258c4d5`, **SUCCESS** pour le job principal et les deux jobs PHP 8.3 / 8.4, y compris `php -n`. [PR #146](https://github.com/roro78/cuisine-cambodgienne/pull/146) ouverte, non fusionnée. Les deux PHP testés n'ont aucun écart avec `1264e7d` ; cette preuve technique ne réceptionne toujours pas le calendrier OVH connecté.

## Paquet ciblé disponible localement

**Livraison précédente, avant le complément `RUNTIME_DIAG_V1` :** `artifacts/cms-calendar-ovh-1264e7d-20261028-exact.zip`, avec dossier décompressé de même nom. Elle ne fournit pas le nouveau volet technique. Les deux PHP sont extraits de `1264e7d` par `git -c core.autocrlf=false -c core.eol=lf archive`. Une première archive de préparation avait subi la conversion CRLF Windows ; elle est conservée sous le nom `*.CRLF-DO-NOT-TRANSFER.zip` et son dossier porte un avertissement. Les empreintes de la livraison précédente `-exact` sont vérifiées indépendamment avec PowerShell `Get-FileHash`, et ses identifiants `git hash-object --no-filters` correspondent exactement aux deux blobs du commit :

| Fichier distant | Octets | SHA-256 |
|---|---:|---|
| `gestion-contenus/index.php` | 49832 | `845b8d2e05535c4f86f55dcb0b23acfae6e2ef44f3eea509e388fdfb7ec54048` |
| `gestion-contenus/lib.php` | 58690 | `72c32887ffbf26cd7cc7cd83fd4b929f19e6dc297b17c02be5755628c915ec62` |

Le manifeste et le README accompagnent les deux fichiers ; **ne pas les transférer dans la racine publique**. Le paquet de réception de cette reprise ne comprend ni Astro, ni index à remplacer, ni médias, ni configuration privée. Les anciennes livraisons restent intactes.

Avant remplacement, télécharger les deux PHP OVH dans une sauvegarde neuve, relever droits/tailles/empreintes et confirmer la destination. Après validation du remplacement, transférer les deux fichiers ensemble, les retélécharger dans un autre dossier neuf et comparer leurs SHA-256. Vérifier ensuite Studio, bibliothèque, création des cinq familles, calendrier mensuel vide/dates/sans date, filtres et conservation des versions existantes. Ne jamais supprimer un brouillon pour faire passer le calendrier. La sauvegarde et la réception privée restent **NON TESTÉES** ici.

## Audit IA et médias — aucun service activé

La lecture de `public/gestion-contenus/index.php`, `lib.php`, du contrat `scripts/editorial-content-pipeline.mjs` et de l'export `automation/n8n/01-drafts-email-approval.json` établit :

- **Création manuelle P1B :** implémentée et validée par les smokes CI pour les cinq familles ; stocke une proposition privée `draft/review`, sans créer de page Astro. La réception réelle de toutes les familles sur OVH reste distincte.
- **IA rédactionnelle :** aucune route/adaptateur d'appel IA dans le Studio. Le contrat Node accepte déjà une provenance IA mais ne génère rien. `cmsCreationSave` marque encore ses créations `origin: manual` ; ne pas transformer une sortie IA en création manuelle sans évolution contrôlée de la provenance.
- **Composant existant :** le workflow 01 possède « Rédiger via Llama sur Ollama », destiné aux légendes sociales à partir du catalogue. Sa présence dans l'export ne démontre ni sa disponibilité réelle, ni sa capacité à rédiger les cinq modèles complets. Aucun appel modèle ni test du runtime n8n n'est lancé.
- **Visuels :** référentiel et outils de variantes responsive présents ; aucun module de génération d'image raccordé au Studio. Brief photographique et validation restent à développer avant toute génération effective.
- **Audio :** Coral existant et MP3 approuvés conservés. Aucune synthèse, aucune régénération.
- **Calendrier média :** la vue mensuelle actuelle projette les nouvelles créations privées ; semaine, horizon 90 jours, propositions IA, adaptations sociales et mesures ne sont pas encore livrés.

## Suite du chantier, dans l'ordre

1. **A — réception du calendrier terminée.** Transfert et fonctionnement des filtres/versions confirmés par le propriétaire, contrôle public GET PASS ; conserver les sauvegardes et les preuves. Ne pas refaire ce chantier à chaque reprise. La fusion de la PR #146 reste une action distincte.
2. **B — P1C, brief IA privé.** Une PR dédiée après A : brief commun sujet/titre, angle, objectif, contexte, famille et référence canonique facultative. Réutiliser le contrat et les contrôles anti-doublons existants sur le catalogue et les dernières créations privées ; exiger une revue des alias khmers, de l'intention et des sujets proches avant appel coûteux. Examiner la réutilisation d'Ollama sans modifier n8n 01/02/03. S'il n'existe pas de service utilisable, fournir une interface indépendante et un adaptateur serveur désactivé par défaut, avec simulations uniquement dans les tests.
3. **C — remplissage IA du formulaire commun.** Même `cmsCreationFormHtml`, validation des seules clés autorisées des cinq modèles, `cmsCreationSave`, provenance IA conservée au fil des versions, brouillon uniquement. Authentification/CSRF, plafond persistant partagé des appels et du budget, timeout sans relance automatique facturable, erreur constante sans secret, réponse bornée et schéma strict. Aucun brouillon privé non nécessaire ne part au fournisseur. Tester refus des doublons avant appel, XSS, clés inconnues, réponse malformée, quotas/concurrence, versions immuables et absence d'effet public. Le fournisseur doit rester configurable uniquement côté serveur hors webroot.
4. **D — brief visuel et contrôle.** Sujet exact, photo/illustration déclarée, composition variée, droits/provenance, alt et dimensions du vrai composant. Variantes site et JPEG social 1080×1080 conformes aux composants existants. Génération effective et réception humaine dans un jalon distinct ; audio Coral séparé.
5. **E puis F — aperçu et publication contrôlée.** Véritable gabarit Astro, données typées complètes, revue humaine contenu/médias, PR et CI, sauvegarde, autorisation OVH et smoke public. Un statut `review` n'est jamais une approbation ni une publication.
6. **G — calendrier média avancé.** Semaine/mois/90 jours et déclinaisons sociales seulement après page vérifiée ; réutilisation des workflows existants avec autorisation Meta distincte, contrôles de doublons et performances réellement mesurées. Aucune date ne déclenche de publication.

Une seule PR pour la réception A : #146, sans fusion automatique. Le transfert du correctif a été réalisé par l'opérateur, pas par l'agent. A réceptionné autorise le démarrage du développement P1C ; les étapes B–G restent des travaux à réaliser, pas des fonctions opérationnelles.
