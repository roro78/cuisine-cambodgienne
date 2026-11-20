# Coral — candidat OpenAI Speech privé, NON DÉPLOYÉ (13 novembre 2026)

Ticket : GitHub #205. PR indépendante de la #235.

## Périmètre de la PR

- scripts/coral-speech-transport.mjs implémente le transport HTTPS vers
  POST https://api.openai.com/v1/audio/speech, modèle gpt-4o-mini-tts,
  voix féminine coral, vitesse 0.93 et instructions culinaires historiques.
- Le secret provient exclusivement du lecteur existant readCoralOpenAISecret
  (/run/secrets/cdc_coral_openai_key) ; aucun secret ajouté à GitHub ou au PHP.
- Le découpage conserve exactement les caractères, les espaces et les SHA.
  Aucune narration v4, aucun MP3 historique, aucun visa humain n'est ajouté
  ou modifié dans le dépôt par cette PR.
- Le transport refuse un appel en l'absence d'autorisation Studio courante,
  d'une réservation durable de budget et d'un marqueur d'essai irréversible.
  Une seule émission HTTP ; aucune relance en cas d'erreur, timeout ou coupure.
- La sortie WAV doit être du PCM mono, 24 kHz, 16 bits, et son SHA est calculé.
  L'API Speech ne fournit pas ici de reçu de coût réel exploitable : le coût
  reste inconnu et doit être rapproché du compte avant une nouvelle dépense.
- Les tests sont fictifs, sans clé ni requête OpenAI.

## Limites : aucune génération réelle ni activation

Le nouveau module est intentionnellement indépendant du worker Docker, du Studio
et de createSimulatedTtsJobs. Il est marqué enabled=false, qualified=false.
Il ne fournit PAS encore le parcours mobile de préécoute.

Avant une activation, il reste à :
1. Vérifier l'image/état réellement installés sur Orvekio.
2. Transférer le ZIP des 7 textes v4 vers un stockage 0700 privé et vérifier SHA.
3. Relier le contrôle d'autorité du Studio à chaque fragment, son stockage
   et le moteur TTS existant, sans changer Squaia ni ses clés.
4. Démontrer une réservation CUMULATIVE, conservative, durable et bornée par
   l'autorisation totale de 1 USD ; des flags true ne prouvent pas cela.
5. Vérifier l'accès du compte au modèle, la sortie, les coûts réels, le débit,
   les droits et l'absence de journaux de contenu ; un essai réel exige
   une autorisation de dépense distincte.
6. Générer une seule préécoute privée, recueillir une écoute humaine puis
   générer et assembler les sept chapitres avec leurs repères.
7. Recevoir séparément les autorisations de déploiement et publication.

La PR #235 corrige indépendamment un lien d'écoute historique, elle ne
déclenche aucun appel OpenAI.

Test isolé : node --test tests/coral-speech-transport.test.mjs


## Route préférée : Studio privé → HTTPS → worker existant (sans ZIP/SFTP)

Le blocage SFTP de Work vers Orvekio n'impose pas de transférer un ZIP :
les 7 textes restent dans le Studio privé OVH et le client de file HTTPS
authentifié existe déjà. Un transfert client → worker via ce canal doit être
livré APRÈS les contrôles de version, sept visas, revue culinaire, visa final
et « voice-rights » personnels de la PR #235.

Le module scripts/coral-real-speech-request.mjs prépare et valide
**hors réseau** la future demande : texte exact des 7 chapitres, SHA-256,
identité stable tenant compte des droits, ordre des 7 phases, budget autorisé
total d'1 USD, vitesse 0,93, provider réel séparé du simulateur. La projection
de vérification de droits ne contient **jamais** les textes. Il prévoit
une seule préécoute de l'introduction réutilisable, sans re-synthèse, puis
une pause pour accord humain avant de poursuivre.

Il assemble aussi plusieurs sorties WAV PCM d'un même chapitre sans
nouvel appel TTS. Les 7 chapitres complets peuvent ensuite passer à
l'assembleur MP3 existant et à son lecteur privé à repères.

**Attention : ces fonctions n'introduisent PAS encore un nouveau type de
job HTTP ni un bouton réel dans le Studio.** La preuve CI actuelle ne porte
que sur l'identité, la validation et l'assemblage audio **fictif**. Les
contraintes de budget durable, d'approbation de préécoute, de stockage
privé, de raccordement worker, du lecteur en production et de publication
restent des gates séparés. Ne surtout pas activer le fournisseur en
réduisant ces vérifications à des flags de configuration.


## Mise à jour du 20 novembre 2026 — Studio déjà partiellement raccordé

La description initiale du 13 novembre ci-dessus est historique : la PR #236
inclut désormais le pont `coral-real-speech-bridge.php`, le formulaire du
Studio, le contrat privé validé, la file HTTPS existante, le moteur réel
conditionnel dans `editorial-ai-job-gateway.mjs`, la préécoute et
`coral-speech-real-jobs.mjs` (sept chapitres + assemblage MP3). La chaîne reste
**désactivée en production** : les flags, les droits du projet, la qualification
du fournisseur et les preuves de dépenses ne sont pas établis par la CI.

Nouveau garde-fou côté Studio :

- Une fois le MP3 privé `succeeded`, le panneau permet de confirmer
  **séparément** l'écoute intégrale et l'ordre des sept chapitres.
- L'approbation et sa révocation utilisent le journal privé append-only
  `tts-real-listening-*.json`, séparé du journal audio simulé.
- Avant l'inscription du visa, le Studio revérifie l'identité de la
  création/version, le consentement et les droits courants, les sept repères
  ordonnés du manifeste, puis **télécharge et contrôle le SHA du MP3 exact**.
- Le visa porte le SHA-256 du média ; changer le fichier, le brouillon ou
  révoquer l'écoute rend le visa inopérant. CSRF, session admin, note humaine
  et déclaration explicite sont exigés par le contrôleur et le journal.
- Aucun visa d'écoute ne déclenche une publication ni un appel OpenAI.
- Les tests PHP 8.3 et 8.4 couvrent l'intégrité du journal, les refus,
  la révocation et l'invalidation par un changement de SHA ou de version.
- La reconnaissance des MP3 `-v4` dans la bibliothèque privée a été
  harmonisée avec la source Astro déjà déployée : six ateliers historiques
  plus Amok Trey V4. Aucun des sept médias existants n'est remplacé.

**Restent non résolus :** une recette complète du moteur sur un runtime
authentifié avec qualification réelle du budget et d'OpenAI Speech, la
commande de publication **explicite et distincte**, la préparation ciblée
d'une release Astro reproductible, la sauvegarde distante vérifiée, le
rollback testé et la réception sur mobile physique. La publication automatique
ne doit pas réutiliser `deploy-ovh.yml` pour contourner les dossiers PHP
protégés. Aucun accès mutualisé ni secret n'est nécessaire aux présents
contrôles isolés.


## 20 novembre 2026 — Liaison de l'approbation audio à la file privée de publication

**Le raccordement a été implémenté sur la PR #236, sans serveur nouveau :**

1. Dans le Studio privé, une fois l'écoute **intégrale et les sept repères** approuvés, une deuxième décision explicite autorise la **préparation** de la publication. Son journal `tts-real-publication-*.json` est append-only, versionné, révocable et lié au couple **SHA du MP3 + SHA du dernier événement de visa d’écoute**. Révoquer puis réapprouver l'écoute oblige donc à réautoriser la publication. Ce journal est distinct des droits TTS.
2. Le Studio forme une enveloppe `cdc-coral-studio-release-intent-v1` contenant **uniquement** l'identité et la version du brouillon, l'empreinte de liaison, les sept SHA de textes (sans textes privés), l'empreinte/taille/durée du MP3, les sept repères, et des chemins publics **candidats**. Elle contient explicitement `publication_ready:false` et `deployment_triggered:false`.
3. Le contrôleur PHP transmet cette enveloppe via **le même** jeton serveur-à-serveur HTTPS déjà utilisé pour Coral, sur `POST /editorial-ai/v1/jobs/<id>/release`. Le worker conserve un `release-intent.json` privé, durable et idempotent, sans appel TTS. Le suivi existant renvoie `release_staged`. Si l'accusé est incertain, le Studio montre un bouton pour renvoyer **le même** contrat ; il ne rejoue jamais une génération payante.
4. `scripts/package-coral-approved-release.mjs` lit l'intention, le MP3 privé déjà obtenu et **un build Astro ayant déjà le blueprint publié en candidat**. Il vérifie le SHA du MP3 et les liens sur les pages/recette/catalogue/sitemap, puis fabrique un lot isolé de **cinq fichiers maximum** avec manifeste de SHA. Ce script ne contacte ni GitHub ni OVH et ne modifie pas le site.
5. Les tests synthétiques PHP et Node contrôlent la séparation des visas, la révocation, la version, le SHA, la validation de l'enveloppe, la route HTTPS authentifiée, l'idempotence de la file et l'absence de publication. Le Dockerfile du worker inclut le validateur de contrat.

**Limites non masquées :** la nouvelle création n'est toujours pas convertie automatiquement en blueprint Astro natif et inscrite dans `cookingWorkshopGuides.ts` ; la qualification des droits visuels n'est pas remplacée par le visa audio ; aucune chaîne vérifiée ne sauvegarde/restaure les fichiers OVH et ne transfère de lot ciblé en production. La branche `ovh-production` ne doit pas être poussée depuis une simple intention de publication. **Le worker n'exécute aucun déploiement**, y compris quand `release_staged:true`. Le code est un candidat non installé sur le VPS ni le Studio.

Pour atteindre le véritable « Publier » sans FileZilla : terminer la projection Astro depuis le CMS, choisir et qualifier une méthode de livraison OVH authentifiée, avec inventaire, sauvegarde réelle, comparaison de SHA, rollback et accusé HTTP. Cela nécessite une réception technique propre et **ne se déduit pas** d'une CI verte.


## 20 novembre 2026 — Projections Astro + sauvegarde/rollback mutualisé (nouveau code)

Les deux modules suivants ont été **ajoutés à la PR #236 et testés hors production**.

### Fiche Astro native depuis le Studio

`scripts/project-coral-studio-blueprint.mjs` convertit les six phases, sept scripts exacts et données d'atelier *déjà approuvés* en fiche `cooking-workshop` utilisable par le gabarit Astro partagé, en vérifiant chaque empreinte de script, l'identité du brouillon, la recette canonique, les minutes et le manifeste audio.

Il **ne peut pas inventer les données absentes du formulaire initial**. Un profil éditorial explicitement revu par un humain (`cdc-coral-studio-reviewed-blueprint-v1`) est requis pour la sécurité, les allergènes, l'image et ses droits, la QA mobile/ordinateur et les visas. Ce profil **n'est pas encore fourni automatiquement par l'interface Studio** : le script de conversion est donc un composant validable, pas encore un flux 100 % autonome sur OVH. Le script écrit seulement un JSON privé, sans appel IA, sans écriture dans le dépôt, sans publication.

### Publication ciblée exécutée sur le même hébergement OVH

`public/gestion-contenus/coral-scoped-publisher.php` exploite le fait que le **Studio PHP se trouve déjà sur le mutualisé qui sert le site** : un futur appel authentifié pourra y déployer les fichiers approuvés sans ouvrir de canal SSH/SFTP depuis Chat ou Orvekio.

Le module est **include-only, protégé en HTTP par `.htaccess`**, et n'est pour l'instant invoqué par aucune route publique. Il vérifie : manifeste limité exactement aux cinq chemins autorisés, SHA-256 des fichiers sources, versions actuellement servies, absence de liens symboliques, décision du Studio réexaminée avant écriture, copie vérifiée des originaux hors webroot, remplacements locaux par renommages et vérification de chaque SHA final. Une exception provoque une restauration des originaux ; les tests injectent une panne après le troisième fichier pour prouver le retour arrière des cinq cibles. Un reçu privé est émis, avec `httpReceptionVerified:false` : il ne prétend pas qu'une recette fonctionne dans un vrai navigateur.

Les nouveaux champs de preuve sont **bloquants** : `sourceCommitVerified`, `nativeBlueprintVerified`, `mediaRightsVerified` doivent tous être vrais pour entrer dans la transaction. Le paquet préparatoire généré côté Node les laisse à **false** : personne ne peut transformer une simple CI verte en publication OVH sans contrôles réellement effectués.

Le paquet Studio CMS-only inclut désormais le module protégé, dans un périmètre de **14 fichiers** ; il faut encore installer cette version sur OVH pour en bénéficier, après sauvegarde vérifiée des fichiers Studio actuels. Aucun transfert OVH n'a été initié par cette PR.

### NO-GO persistants — ce qui manque encore au bouton final

- Raccorder le formulaire de revue/médias du Studio au profil natif (actuellement requis par l'adaptateur, mais pas disponible en formulaire).
- Construire Astro sur un environnement contrôlé à partir du blueprint approuvé, lier les fichiers de sortie et vérifier le SHA du commit source exact.
- Transférer automatiquement le lot de cinq fichiers de la file privée du worker vers un **dossier de staging privé sur OVH** ; le publisher local ne peut pas lire les fichiers situés seulement sur Orvekio.
- Créer dans le contrôleur Studio l'action de publication réelle, avec session/CSRF, double vérification des droits et préconditions HTTP, et qualifier sa réception sur **le vrai hébergement**.
- Vérifier la restauration après interruption brutale en plus des exceptions simulées, puis réception HTTP/mobile physique.

Le statut correct est **CODE CANDIDAT / CI uniquement, PROD NON MODIFIÉE**. Aucune clé OpenAI, nouveau fournisseur, MP3 historique ou environnement OVH n'est changé.


## 20 novembre 2026 — Formulaire de revue Astro natif, médias et appareils

Le composant **`public/gestion-contenus/coral-astro-review.php`** est maintenant branché sur le formulaire **du Studio existant**, exclusivement pour un atelier avec MP3 réel `succeeded` et écoute intégrale déjà approuvée. Aucune nouvelle application ni base de données n'a été créée.

### Champs réellement raccordés

- Difficulté pédagogique et consignes de sécurité.
- Déclaration des allergènes (liste explicite ou décision humaine « aucun identifié »).
- Choix d'une image **déjà présente dans `/images/cuisine/`**, WebP vérifié, avec justificatif des droits de diffusion.
- Compte rendu du contrôle de la recette, des quantités, des six phases et des sept narrations.
- Compte rendu **réel** des essais sur téléphone physique et sur ordinateur ; ces contrôles ne sont pas cochés automatiquement.
- Neuf cases de confirmation humaine explicite et commentaire de validation/retrait.

### Sécurité et liens avec la chaîne existante

- Le POST `astro_review_action` utilise la **session et le CSRF existants**, la dernière version enregistrée et le même identifiant du job Speech.
- La revue humaine produit le contrat `cdc-coral-studio-reviewed-blueprint-v1` attendu par `scripts/project-coral-studio-blueprint.mjs`. Elle est conservée dans un **journal privé append-only**, vérifié événement par événement, et révocable.
- La décision est liée au **SHA du MP3, au dernier événement de consentement d'écoute, à la version et au binding du brouillon**. Une nouvelle version ou une révocation invalide le visa.
- Le SHA-256 **des octets de l'image WebP approuvée** est inscrit dans le profil ; son remplacement, même avec une URL identique, bloque la revue. Le convertisseur Astro vérifie à nouveau cette empreinte dans le checkout public.
- L'URL `?astro_review_profile=<job>&cid=<id>` donne au propriétaire connecté un **export JSON privé** du profil exact (sans secret) pour sa projection Astro ; pas de publication ni de synthèse TTS.
- La décision distincte `approve_real_publication` du Studio est désormais **refusée** tant que le profil natif n'est pas actuel. Le visa de diffusion ne contourne donc pas les droits des médias ni les contrôles du lecteur.
- Le module PHP est inaccessible en HTTP direct via `.htaccess`, ajouté au paquet CMS-only (maintenant **15 fichiers**), et couvert par les tests PHP 8.3/8.4 ainsi que le paquet OVH.
- La fixture du test navigateur copie désormais ce module, sans accès à des médias personnels ou à un fournisseur payant.

**Restriction explicite :** le profil garde une **attestation humaine**, ce n'est pas une licence vérifiée automatiquement par un tiers. L'interface demande une image déjà publiée ; elle ne publie pas encore de nouveau visuel privé. La transformation native Astro reste un script préparatoire, non un serveur de build sur OVH.

**Pour le véritable bouton final**, il faut encore : expédier sans exposition du texte privé la source du brouillon et le profil au builder Astro authentifié, installer le nouveau Studio PHP sur OVH avec sauvegarde vérifiée, mettre le bundle ciblé en staging privé sur OVH, puis qualifier un chemin de publication `CSRF → session → autorité courante → sauvegarde réelle → 5 SHA → rollback → réception HTTP/mobile`. Le module same-host publisher est codé, mais sa route d'exécution de production reste volontairement désactivée.


## 20 novembre 2026 — transit du brouillon privé et builder Astro épinglé (code, non déployé)

Sur la PR #236, le même transport HTTPS Bearer du Studio vers Coral reçoit après `/release` un second POST `/build-inputs`. Le Studio relit la version privée courante, les visas humains et l'empreinte de l'image avant de transmettre **uniquement** l'atelier, ses six phases, ses sept textes, le profil de revue et l'intention de publication. Le worker vérifie les sept SHA-256 de narration par rapport à la demande Speech originale, la liaison version/job/profil, la présence de l'intention exacte et l'autorité du Studio. Il écrit `real-tts/private-build-inputs.json` de façon exclusive/idempotente dans son stockage existant. Il ne renvoie ni textes ni autorisations au navigateur ; un résultat `build_inputs_staged` ne vaut **pas** autorisation de publier.

`scripts/build-coral-private-astro-release.mjs` prend ces données et le MP3 **déjà généré** dans un checkout Git **jetable, propre, épinglé** au SHA explicite. Le checkout doit disposer de `npm ci`, `git` et `ffprobe`. Le constructeur projette le blueprint, contrôle l'image exacte et l'audio, enregistre temporairement le guide et le manifeste audio dans ce checkout isolé, complète le registre Astro partagé sans modifier ses six anciens imports, lance les contrôles culinaires, le build Astro et prépare exclusivement les cinq fichiers cibles du packager. Il n'envoie pas les narrations à GitHub et ne déclenche ni déploiement OVH ni synthèse payante.

La route publique du nouvel atelier suit le **slug public** fourni par le Studio, distinct du répertoire MP3 préfixé `atelier-pratique-`. Cela corrige une divergence préalable entre la projection et `getStaticPaths()`.

**Conditions bloquantes et non couvertes par ces tests :** provisionner le checkout privé épinglé et fournir les entrées au builder sur Orvekio ; prouver un build réel sur des données authentiquement approuvées ; transférer les cinq fichiers et le manifeste dans le staging privé du mutualisé OVH ; associer le contrôleur Studio au publisher avec un rappel **frais** des visas après staging ; inventorier les SHA de production, sauvegarder hors webroot, qualifier la restauration après crash et réceptionner HTTP/audio sur téléphone physique. Aucune de ces opérations n'a été réalisée en production depuis ce code candidat. La PR doit rester DRAFT et le bouton Publier inactif jusque-là.


## 20 novembre 2026 — staging HTTPS privé et bouton final conditionnel

Le code candidat dispose désormais du circuit suivant :
`Studio PHP (visas humains actuels)` → `Coral V2 worker /build-inputs` (brouillon privé, sept textes et revue) → `builder Astro isolé` (checkout Git propre épinglé) → `transfer-coral-bundle-to-ovh.mjs` → `POST /gestion-contenus/?coral_stage=1` (HTTPS Bearer indépendant) → `coral-scoped-staging.php` (cinq fichiers et manifeste hors webroot, par fragments vérifiés) → **bouton final du Studio** → `coral-scoped-studio-release.php` → `coral-scoped-publisher.php`.

**Le parcours n'est pas encore opérationnel sur OVH.** Le builder n'est pas provisionné comme processus réel sur Orvekio et les nouveaux fichiers du Studio ne sont pas installés. Le dépôt conserve toutes les actions de publication désactivées par défaut. Le code ne lance ni la synthèse Speech ni n8n/Meta et ne modifie pas les autres ateliers.

### Barrières techniques

- L'upload machine `?coral_stage=1` n'est disponible qu'en POST HTTPS JSON, sans session d'administrateur ni exposition des fichiers privés ; il exige un **jeton dédié** de 64 caractères hexadécimaux, stocké dans un fichier privé du mutualisé et dans un fichier privé du runner, sans jamais être commité. Il ne reprend **pas** le secret OpenAI ou l'ancien jeton Coral. Le Studio doit avoir `coral_scoped_staging_enabled=true`, `coral_scoped_staging_token_file` pointant vers son fichier secret sous la racine privée et `coral_scoped_source_commit` égal au SHA-1 Git approuvé. Un premier transfert reste impossible sans cette configuration authentifiée.
- Le builder privé est limité à un checkout jetable, propre et **descendant de la fusion de référence Amok V4 `c0eb5d2`**. Il refuse de modifier la recette historique Amok V4 via un nouveau lot automatique et vérifie les SHA du MP3 et de la page Amok V4 et les liens du catalogue/sitemap après compilation. Cette exigence empêche un checkout ancien de supprimer un atelier déjà publié. La PR #236 a été synchronisée avec `main` et préserve le contrôle de portions de #237.
- La réception OVH n'accepte que les **cinq chemins** attendus pour une page d'atelier (MP3, page, page recette, catalogue, sitemap). Les fichiers arrivent en fragments de 240 Kio maximum au runner, 256 Kio maximum au récepteur. Le récepteur vérifie empreintes, ordre, offsets et liens HTML ; les deux nouvelles ressources (page et MP3) doivent être absentes et les trois fichiers partagés doivent exister, avec empreintes initiales enregistrées. Aucun fichier PHP ni texte narratif privé n'entre dans le lot public.
- Le bouton `Publier cet atelier` est masqué tant que le lot n'est pas scellé, le modèle exact pas vérifié et les indicateurs `coral_scoped_publish_enabled=true` et `coral_scoped_restore_qualified=true` pas explicitement définis. **Ces deux indicateurs ne sont pas des preuves** : n'activer `coral_scoped_restore_qualified` qu'après une réception et restauration testées sur l'hébergement cible. Une fois le bouton visible, la session, le CSRF et deux confirmations sont obligatoires.
- Le publisher revalide **deux fois** l'autorité du Studio sur la version actuelle, la revue visuelle, les sept empreintes audio, le consentement distinct et le job worker. Il compare l'empreinte de chaque fichier public à son état inventorié, sauvegarde hors webroot, écrit par rename et vérifie chaque SHA. Une erreur contrôlée restaure les cinq fichiers. L'action distincte `Restaurer la version précédente` traite une interruption brutale uniquement si tous les fichiers courants correspondent encore aux anciens SHA ou aux nouveaux SHA autorisés, et refuse toute modification étrangère. Un rollback ne déclenche aucun TTS.
- Le reçu local ne vaut **jamais** réception HTTP externe : `httpReceptionVerified=false`, `rollbackTestedOnLiveServer=false` tant qu'aucun essai réel n'a eu lieu. Les téléphones physiques, le cache/CDN éventuel, les pages HTTP 200 et le MP3 HTTP Range 206 doivent encore être réceptionnés.

### Séquence opérateur privée, sans nouveaux secrets sur GitHub

1. Installer **uniquement le paquet Studio CMS de 17 fichiers**, après inventaire, sauvegarde privée, vérification du retour arrière et validation des protections Apache. Ne pas remplacer le site Astro entier.
2. Préparer sur Orvekio un runner privé capable d'accéder en lecture aux sources validées et à l'audio final du worker, ainsi qu'à un checkout Git propre épinglé au commit homologué (y compris Amok V4), avec `npm ci`, Node 22, `ffprobe` et le build Astro. Exécuter `scripts/build-coral-private-astro-release.mjs` avec les paramètres documentés dans son en-tête. Les fichiers d'entrée demeurent privés.
3. Transférer le **lot public uniquement** avec `scripts/transfer-coral-bundle-to-ovh.mjs --bundle <dossier-prive> --token-file <fichier-prive>`. L'upload est idempotent ; le contrat ne contient pas les sept narrations privées.
4. Vérifier la présence de `sealed` et la version courante dans le Studio, puis réaliser les vérifications réelles de restauration et du site cible **avant** d'activer les indicateurs de publication. Une fois reçu, publier avec le bouton du Studio et effectuer immédiatement la réception HTTP/mobile. Une sauvegarde et un reçu privés doivent être conservés.

**État attestable en CI seulement :** flux de validation PHP, simulateur de transfert, publication locale et restauration sur répertoires synthétiques, gardes de provenance Amok V4. Aucun essai sur le VPS Orvekio ou sur le mutualisé OVH n'est inféré des tests.
