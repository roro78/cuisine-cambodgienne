# Reprise du Studio — 28 octobre 2026

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

## Calendrier OVH — diagnostic encore ouvert

Le dernier incident rapporté reste un 503 `CALENDAR_RUNTIME_ERROR` sous PHP 8.4. La PR #145 protège une catégorie non textuelle et distingue moteur à vide / données privées. Cela ne démontre pas que la cause réelle OVH est réparée. Les empreintes des deux PHP en production, l'état OPcache et le nouveau diagnostic connecté ne sont pas disponibles dans cette reprise.

L'accès indiqué par le propriétaire est **FileZilla « cdc » uniquement**. Conserver `ftp.cluster002.hosting.ovh.net` et vérifier le dossier `www/cdc2017/gestion-contenus/`. Aucun accès SFTP fonctionnel n'est présumé. Aucun outil de contrôle de la session FileZilla ou d'une session Studio connectée n'est disponible dans cette intervention. **Aucune sauvegarde distante, aucun transfert et aucune mutation des brouillons n'ont été effectués.** Ne pas recopier d'identifiant secret, de cookie ni de contenu privé dans les rapports.

Le code utilise toujours l'authentification HTTPS, la session sécurisée, le CSRF avant traitement des POST et le stockage privé append-only avec contrôle de version. Les droits 0700/0600 sont exigés par les helpers ; leur valeur réelle sur OVH reste à constater. La projection `cmsCalendarPlan` n'écrit pas dans les révisions. Aucun correctif PHP supplémentaire n'est appliqué sur une cause de production non prouvée.

### Vérification PHP explicite ajoutée dans cette PR

La CI historique dépend du PHP préinstallé du runner sans sélectionner 8.4. Cette PR ajoute deux jobs explicites PHP **8.3 / 8.4**, après le build validé. Ils téléchargent exclusivement les trois index **publics** de ce build, exécutent les tests de toutes les fiches, de création manuelle et du calendrier ; le calendrier est aussi testé sans `php.ini` (`php -n`). L'action de sélection est documentée par [setup-php](https://github.com/shivammathur/setup-php).

Le smoke de création prend désormais une empreinte de chaque révision temporaire et de ses permissions avant/après lecture du calendrier : projets datés/sans date, mois sans projet daté, filtres et dernière version seulement. Les dates invalides sont refusées sans modifier l'entrée. Les fixtures sont éphémères dans le répertoire temporaire du runner ; ce test ne lit pas les données OVH.

**Preuve acquise :** [CI #40756940900](https://github.com/roro78/cuisine-cambodgienne/actions/runs/40756940900), commit de tests `0ca255f2b9b2937056d64f4e9db2da7ba258c4d5`, **SUCCESS** pour le job principal et les deux jobs PHP 8.3 / 8.4, y compris `php -n`. [PR #146](https://github.com/roro78/cuisine-cambodgienne/pull/146) ouverte, non fusionnée. Les deux PHP testés n'ont aucun écart avec `1264e7d` ; cette preuve technique ne réceptionne toujours pas le calendrier OVH connecté.

## Paquet ciblé disponible localement

Paquet : `artifacts/cms-calendar-ovh-1264e7d-20261028-exact.zip`, avec dossier décompressé de même nom. Les deux PHP sont extraits de `1264e7d` par `git -c core.autocrlf=false -c core.eol=lf archive`. Une première archive de préparation avait subi la conversion CRLF Windows ; elle est conservée sous le nom `*.CRLF-DO-NOT-TRANSFER.zip` et son dossier porte un avertissement. **Utiliser exclusivement la livraison `-exact`.** Ses empreintes sont vérifiées indépendamment avec PowerShell `Get-FileHash`, et ses identifiants `git hash-object --no-filters` correspondent exactement aux deux blobs du commit :

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

1. **Terminer A — réception du calendrier.** Obtenir les deux empreintes OVH après sauvegarde/transfert contrôlé via « cdc », puis tester le calendrier en vraie session. Si erreur : transmettre seulement le nouveau code constant `CALENDAR_*`. `ENGINE_RUNTIME_ERROR` oriente vers moteur/environnement/cache ; `RECORD_RUNTIME_ERROR` impose l'analyse privée de l'enregistrement déclencheur, sans l'effacer. Ces codes localisent, sans prouver une cause. A n'est terminé qu'après calendrier fonctionnel et historique intact.
2. **B — P1C, brief IA privé.** Une PR dédiée après A : brief commun sujet/titre, angle, objectif, contexte, famille et référence canonique facultative. Réutiliser le contrat et les contrôles anti-doublons existants sur le catalogue et les dernières créations privées ; exiger une revue des alias khmers, de l'intention et des sujets proches avant appel coûteux. Examiner la réutilisation d'Ollama sans modifier n8n 01/02/03. S'il n'existe pas de service utilisable, fournir une interface indépendante et un adaptateur serveur désactivé par défaut, avec simulations uniquement dans les tests.
3. **C — remplissage IA du formulaire commun.** Même `cmsCreationFormHtml`, validation des seules clés autorisées des cinq modèles, `cmsCreationSave`, provenance IA conservée au fil des versions, brouillon uniquement. Authentification/CSRF, plafond persistant partagé des appels et du budget, timeout sans relance automatique facturable, erreur constante sans secret, réponse bornée et schéma strict. Aucun brouillon privé non nécessaire ne part au fournisseur. Tester refus des doublons avant appel, XSS, clés inconnues, réponse malformée, quotas/concurrence, versions immuables et absence d'effet public. Le fournisseur doit rester configurable uniquement côté serveur hors webroot.
4. **D — brief visuel et contrôle.** Sujet exact, photo/illustration déclarée, composition variée, droits/provenance, alt et dimensions du vrai composant. Variantes site et JPEG social 1080×1080 conformes aux composants existants. Génération effective et réception humaine dans un jalon distinct ; audio Coral séparé.
5. **E puis F — aperçu et publication contrôlée.** Véritable gabarit Astro, données typées complètes, revue humaine contenu/médias, PR et CI, sauvegarde, autorisation OVH et smoke public. Un statut `review` n'est jamais une approbation ni une publication.
6. **G — calendrier média avancé.** Semaine/mois/90 jours et déclinaisons sociales seulement après page vérifiée ; réutilisation des workflows existants avec autorisation Meta distincte, contrôles de doublons et performances réellement mesurées. Aucune date ne déclenche de publication.

Une seule PR pour la réception A dans cette reprise. Aucune fusion ni publication n'est exécutée ; le développement P1C reste derrière la réception A, conformément au prompt de reprise. Les étapes B–G ci-dessus sont des travaux restants, pas des fonctions opérationnelles.
