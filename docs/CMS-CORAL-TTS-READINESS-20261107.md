# Coral V2 — préparation avant installation, 7 novembre 2026

Suite de #205, PR #225 dépendante de #224 (`0d5a688f7184d556a51dd1981593300d9421826b`). Aucun accord de fusion ou d'installation ne découle de ce document. La réception historique du Studio (#221) reste clôturée ; aucun nouveau brouillon de production n'est utilisé.

## Périmètre et décisions

| Circuit | Fonctionnement | Intervention pendant cette mission |
|---|---|---|
| Astro / OVH mutualisé | Publication statique manuelle, branche `ovh-production` distincte | Aucune |
| Studio PHP / OVH mutualisé | Livraison SFTP ciblée, sauvegarde et accord spécifiques | Lecture seule ; paquet local de trois fichiers |
| Coral / Orvekio | Worker Docker existant, installation SSH contrôlée | Stat/inspect et un HEAD anonyme seulement |

Ni push sur cette branche, ni PR dépendante ne lance `deploy-ovh.yml`. Aucun workflow ajouté ne déploie un service : les images Docker de test sont éphémères, sans réseau ni secrets, sans volume de production. Aucun second moteur Coral, nouveau port ou cockpit. Les sauvegardes historiques, OneDrive, bases, calendriers et MP3 existants ne sont pas modifiés.

## Mémoire : changements et protocole reproductible

Les WAV longs synthétiques sont produits par blocs, puis écrits, hachés et synchronisés en flux. Le sondage ne charge plus un fichier entier. Les vérifications de reprise et du MP3 utilisent des blocs de 64 Kio. HTTP vérifie l'autorité puis l'intégrité complète avant de transmettre une plage depuis le même descripteur vérifié. L'API de test historique retournant un Buffer reste disponible ; le circuit HTTP utilise le flux.

Les écritures d'intention, WAV et reçus sont synchronisées avant l'étape suivante. Sur Linux, le répertoire est aussi synchronisé après création/renommage/lien. L'assemblage reste sans écrasement, à noms dérivés du SHA. Un fichier temporaire partiel est conservé en cas d'incertitude ; il ne devient jamais un fragment validé.

La CI `Coral audio readiness - offline only` compare le cœur immuable de #224 avec le cœur courant, avec **la même instrumentation**. Deux scénarios dérivés des manifestes JSON publics, sans ouverture de leurs MP3 : Kroeung médian (664,776 s) et stress ×2 Lok Lak (1 579,920 s). Chaque scénario optimisé est répété dans **deux cgroups neufs**, UID 1000, 0,5 CPU, RAM/swap 256 MiB, rootfs RO, zéro réseau, 64 PID maximum. La reprise traverse deux processus Node. Aucun Docker Desktop nécessaire.

La génération optimisée doit rester sous **192 MiB, soit au moins 25 % de marge** ; la sauvegarde/restauration doit rester sous 256 MiB. Les rapports distinguent `memory.peak`, anonyme/cache/noyau, RSS/anon/file des processus Node/FFmpeg/FFprobe, `memory.events`, pression mémoire et CPU, GNU time par opération. Les maxima échantillonnés ne sont pas des pics instantanés garantis ; le pic cgroup provient du noyau. Les mesures de production en charge ne sont pas simulées par cette preuve CI.

Première comparaison au commit `1f130f102c1f3664bea6b8e4abf746da6d3d4d53`, run [42316852142](https://github.com/roro78/cuisine-cambodgienne/actions/runs/42316852142) :

| Scénario | Baseline #224 | Flux, essai 1 | Flux, essai 2 |
|---|---:|---:|---:|
| Représentatif | 128 909 312 octets | 95 105 024 | 93 892 608 |
| Stress | 267 575 296 octets | 149 860 352 | 150 949 888 |

Ces chiffres sont une preuve intermédiaire explicitement identifiée. Le rapport final de #205 donne le SHA final, les mesures après ajout de la sauvegarde et les résultats de toutes les CI. Les WAV et MP3 des preuves sont des sons fictifs, jamais une voix réelle.

## Sauvegarde média distincte et restauration fermée

`coral-media-backup.mjs` crée un **nouveau format** `CDCAUD1` AES-256-GCM en flux. Il ne change pas `coral-state-backup.mjs`, ses plafonds, ses anciens snapshots ou leur compatibilité. Aucun transfert OneDrive n'est lancé. Les clés des tests sont des octets fictifs publics, sans lien avec la clé AES réelle.

L'archive contient le MP3 final, manifeste/durée/chapitres, demande éditoriale strictement validée, reçus des sept chapitres, preuve de validation et reçus/plans des sous-fragments avec usage et empreintes. Aucun fichier secret, aucun WAV ou fichier arbitraire ; noms en liste fermée, tailles explicites (MP3 ≤ 32 Mo, archive ≤ 64 Mo, preuve des sous-fragments ≤ 1 Mio). Les textes de demande restent privés dans l'archive chiffrée. Les empreintes de visas/droits sont des preuves historiques, jamais une autorisation actuelle.

Le module vérifie le SHA et sonde/décode réellement le MP3 avant sauvegarde et après restauration. Le format chiffre une suite de cadres bornés avec SHA par entrée et authentifie l'en-tête/version. IV aléatoire neuf, publication exclusive par lien, fsync ; aucun remplacement d'une archive existante. Chaque sauvegarde est une nouvelle version immuable, identifiée par son SHA, et doit être exécutée en maintenance sérialisée, sans génération simultanée.

La restauration exige une cible neuve privée 0700 et une revue explicite. Les fichiers sont 0600, liens symboliques refusés, propriétaires contrôlés sur Linux. L'authentification GCM complète, tous les cadres, SHA, métadonnées et la lecture audio doivent réussir **avant** `restore-complete.json`. Toute erreur laisse un espace fermé avec `.restore-review-required` et sans marqueur de réussite. Aucun fichier historique n'est écrasé, aucun job ne rejoint la file. L'état archivé reste une pièce de preuve, pas un état opérationnel autorisé. Réautorisation serveur courante et revue humaine obligatoires avant toute utilisation ultérieure.

Rétention proposée : MP3 finaux, métadonnées et archives conservés immuables sans suppression automatique. Les WAV ne deviennent que **candidats à un nettoyage séparément revu**, au moins 30 jours après réussite, avec archive chiffrée et restauration authentifiée correspondant au même SHA. Un job interrompu, incertain ou incomplet conserve toujours tous ses fragments. Le code ne supprime aucun WAV. Une politique de purge des archives/offsite nécessite une décision distincte ; aucune archive historique n'est incluse dans cette politique nouvelle.

Les essais longs font génération → archive dédiée → indisponibilité simulée du répertoire de jobs → restauration dans `restored-audio` → SHA/sondage/décodage → lecture Chromium et seek des sept chapitres de chaque scénario. Le répertoire fictif original reste conservé pour comparaison. Le lecteur est hors de l'enveloppe du worker ; il ne prouve ni Android physique ni la qualité d'une voix Coral française.

## Sous-fragments : contrat fournisseur toujours inerte

`coral-tts-checkpoints.mjs` découpe le texte exact en fragments de 600 points de code maximum, sans changer le texte recomposé. Chaque fragment est lié à la demande/version/chapitre/empreintes/modèle/voix. Une intention durable précède l'échange ; un WAV et un reçu durable (ID réponse, empreinte texte/transcript/audio, taille, compteurs d'usage et coût) le suivent. Seuls des compteurs connus sont projetés depuis une réponse fournisseur ; aucun objet fournisseur arbitraire ni erreur brute n'est journalisé.

Une réponse incomplète ou un appel engagé sans reçu ⇒ **incertain, aucun nouvel essai**. Une interruption confirmée entre deux reçus permet une reprise explicite des seuls fragments manquants ; un second processus est testé. Autorité courante avant chaque sous-fragment et chaque reprise ; modification du texte, reçu corrompu ou perte d'autorité ⇒ refus. Le verrou du harnais est conservateur : un arrêt brutal laissant un verrou ne donne jamais une autorisation de replay ; sa résolution impose une revue de l'état et des intentions avant une éventuelle reprise. Aucun nettoyage automatique des traces incertaines.

Le test d'intégration utilise un adaptateur **explicitement fictif** dans la passerelle existante. L'adaptateur Realtime conserve `paid:true`, `qualified:false` ; le worker le refuse. `createCoralRealtimeProvider()` échoue toujours. Aucun WebSocket, transport OpenAI, clé, appel réel ou activation par simple variable d'environnement n'est introduit. Les autorisations `test-tone` ne valent jamais consentement pour `coral`.

## Coûts et projet OpenAI

Vérification documentaire du 7 novembre 2026 : [tarifs](https://developers.openai.com/api/docs/pricing), [response.create](https://developers.openai.com/api/reference/resources/realtime/client-events/response/create), [voix Realtime](https://developers.openai.com/api/docs/guides/realtime-conversations), [dépréciations](https://developers.openai.com/api/docs/deprecations). Le candidat est `gpt-realtime-2.1-mini`, voix `coral`, PCM mono 24 kHz ; 2 048 tokens maximum par réponse de préparation, sous la borne documentée de 4 096. Les anciens modèles TTS annoncés en retrait au 6 janvier 2027 ne sont pas choisis pour une nouvelle installation.

Tarifs par million : texte entrant 0,60 USD, texte sortant 2,40 USD, audio sortant 20 USD. Estimation uniquement : caractères/3 pour le texte, 20 tokens audio/seconde, 200 tokens d'instruction **par sous-fragment**, contexte neuf, aucun rabais de cache, aucune entrée audio. Le plan calcule coût par chapitre, atelier entier et partie restante. Les reçus fictifs ne sont pas une lecture de facture OpenAI.

| Scénario | Fragments estimés | Atelier estimé | Avant interruption illustrative | Reprise estimée restante |
|---|---:|---:|---:|---:|
| 11 min | 19 | 0,277134 USD | 0,128147 après 9 fragments | 0,148987 USD |
| 26 min | 41 | 0,658564 USD | 0,335195 après 20 fragments | 0,323369 USD |

Pour les sept chapitres du scénario 11 min : 0,029727 / 0,038429 / 0,040756 / 0,042556 / 0,046014 / 0,043804 / 0,035848 USD. Les plafonds conditionnels de **sortie seulement** sont 0,778240 / 1,679360 USD. Ce ne sont pas des maxima de facture : les entrées et l'incertitude d'une réponse engagée restent à qualifier. Le maximum externe démontré et la réservation réelle restent `null` ; fournisseur fermé. La réservation de 7 000 micro-USD du test synthétique n'est pas transposable à une voix réelle. Aucun appel payant pendant cette mission.

Projet existant « Cuisine du Cambodge » seulement. Les captures historiques montrent 1 USD, « Limit enforced », alertes 80/100 %, et deux modèles texte autorisés ; elles ne prouvent pas les réglages actuels ni l'accès au candidat Realtime. Le navigateur pilotable ne répond pas lors de la nouvelle tentative. Permissions de projet/clé, modèles, compte de service, plafond réellement appliqué, consommation et alertes actuels restent donc à relire dans ce même projet, sans créer de projet, de clé ou de compte et sans changer une limite. Aucune clé existante n'est lue pour cette vérification.

## Hôtes : synthèse expurgée et paquet minimal

Une lecture ciblée des deux hôtes a été effectuée sans écriture : versions et dépendances, empreintes des fichiers publics, drapeaux fermés, modes/propriétaires, montages et protections de transport. Les observations techniques détaillées sont conservées dans une **annexe locale non publiée**, conformément au refus du contrôle automatique de publication de ces détails d'infrastructure. Aucun contenu de secret n'a été lu.

Conclusion utile à la décision : l'autorité nouvelle n'est pas installée ; la connectivité HTTPS anonyme est possible mais ne prouve pas son authentification ; les protections du trajet existant sont présentes et préservées. Aucun nouveau routeur public n'est nécessaire. L'image installée ne possède pas les dépendances audio nouvelles et le fournisseur est fermé. Aucun service n'a été modifié ou redémarré.

Paquet **local uniquement**, trois fichiers publics : `index.php`, `coral-v2-ai.php`, `publication-gap-audit.php`. Les dépendances en place et leur empreinte sont consignées dans le manifeste local. Les trois versions installées ont été téléchargées en lecture seule et leur copie locale de rollback vérifiée octet par octet. Les candidats proviennent des octets Git, pas d'un checkout Windows converti en CRLF. `coral-authority-install-preflight.mjs --verify-local <paquet>` vérifie candidat et rollback par SHA/taille ; il ne possède aucune capacité d'application distante. Le manifeste des hôtes et les configurations privées ne sont pas publiés.

## Protocole après une future autorisation de périmètre

1. Relire HEAD/CI exacts, absence de changement des trois fichiers et des deux dépendances depuis le manifeste. Arrêt à toute dérive. Présenter puis obtenir l'accord explicite pour ces fichiers, le secret d'autorité distinct et les seules deux configurations privées concernées. Les anciens accords de livraison/sonde ne couvrent pas cette route.
2. Avant écrasement : copie **sur l'hôte et hors webroot**, vérifiée par taille/SHA, des trois fichiers et des seules configurations privées à changer, modes/propriétaires inclus. Le rollback public local préparé ne remplace pas cette sauvegarde de dernière minute. Ne jamais télécharger une config privée en clair dans les artefacts ou GitHub.
3. Secret d'autorité neuf, distinct d'OpenAI et de la file : réception privée existante, jamais chat/arguments/environnement affiché/logs/presse-papiers historisé ; transfert SSH/SFTP à identité déjà vérifiée ; sous-dossiers 0700, fichiers 0600 ou 0400 selon lecteur, propriétaire effectif vérifié. Montage VPS RO, lecteur sans symlink, aucun secret dans l'image. Ne pas toucher à la clé OpenAI existante. Une récupération indépendante doit être vérifiée avant d'exiger ce nouveau secret.
4. Vérifier le candidat PHP 8.4, livrer les seuls trois fichiers avec substitutions contrôlées et préserver leurs modes publics. Configurer l'autorité en lecture seulement, génération toujours fermée. Pas de restart Traefik/n8n/DB. Le Dockerfile et l'image de production actuels ne contiennent pas FFmpeg, et le bootstrap n'injecte pas `ttsJobs` : **ne pas les présenter comme un service TTS installé**. Le nouveau `Dockerfile.audio-candidate` prépare séparément les bibliothèques et FFmpeg 5.1.9 épinglé, base Node par digest, UID 1000 ; sa commande par défaut vérifie seulement les outils, sans écouter ni traiter de job. La CI exporte/recharge son image, vérifie le même ID immuable et SHA d'archive, confirme le refus de démarrage sans configuration et fournit un paquet téléchargeable. Pas de publication registre ni installation. Les dépendances APT transitives peuvent évoluer lors d'une reconstruction : utiliser l'artefact identifié exact, jamais supposer une reconstruction identique. Toute installation future exige la qualification de ce digest et un bootstrap TTS explicitement revu ; aucun simple réglage ne doit activer une voix réelle.
5. Recette réelle de la nouvelle autorité, à drapeaux fournisseur fermés : jeton absent/erroné/rotaté, droits/version/textes changés, réponse partielle/timeout, contrôle frais sans cache, révocation et refus de lecture ; jamais de génération réelle. Le HEAD anonyme déjà obtenu ne suffit pas. Ne pas recycler le brouillon fictif de production historique.
6. Sauvegarde média réelle : destination nouvelle explicitement approuvée, clé AES fournie par le circuit sécurisé existant sans exposition, maintenance sérialisée, sauvegarde chiffrée versionnée puis récupération indépendante et restauration fermée à SHA identique. Aucun changement des anciennes archives/OneDrive ; aucune purge automatique. Ne pas activer la production avant que le circuit offsite de ce nouveau format ait été reçu.
7. Au moindre écart : fermer le seul drapeau d'autorité nouvellement activé, restaurer les trois fichiers/configurations exacts depuis la sauvegarde vérifiée et relire SHA/modes ; aucun rollback des bases, MP3, brouillons ou calendriers. La désactivation du client/route doit échouer fermée sans génération/retry. En cas d'état d'appel incertain, conserver intentions, reçus et fragments ; ne pas restaurer une file susceptible de rejouer un fournisseur.

## Conditions de décision

GO des mécanismes isolés uniquement après toutes les CI du SHA final : mémoire avec marge répétée, autorité/permissions/HTTPS fictifs, concurrence de la passerelle, sous-fragments/reprise, sauvegarde/restauration/lecture, contrats PHP sur contenus réels et non-régression. Les étapes conditionnelles CI non applicables ne sont pas comptées comme tests réussis.

NO-GO d'installation/raccordement nouveau tant que l'autorisation précise, la sauvegarde privée de dernière minute et la recette Bearer réelle manquent. NO-GO de voix réelle tant que l'accès au projet/modèle, les droits adaptés, le budget/réservation/max externe, l'image/bootstrap audio, le stockage offsite et la recette humaine/Android restent non qualifiés. Une fusion de code, toujours soumise à décision explicite, ne vaut aucune de ces autorisations.
