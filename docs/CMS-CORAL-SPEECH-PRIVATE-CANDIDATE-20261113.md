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

1. Dans le Studio privé, une fois l'écoute **intégrale et les sept repères** approuvés, une deuxième décision explicite autorise la **préparation** de la publication. Son journal `tts-real-publication-*.json` est append-only, versionné, lié au SHA du MP3, révocable, distinct de l'écoute et des droits TTS.
2. Le Studio forme une enveloppe `cdc-coral-studio-release-intent-v1` contenant **uniquement** l'identité et la version du brouillon, l'empreinte de liaison, les sept SHA de textes (sans textes privés), l'empreinte/taille/durée du MP3, les sept repères, et des chemins publics **candidats**. Elle contient explicitement `publication_ready:false` et `deployment_triggered:false`.
3. Le contrôleur PHP transmet cette enveloppe via **le même** jeton serveur-à-serveur HTTPS déjà utilisé pour Coral, sur `POST /editorial-ai/v1/jobs/<id>/release`. Le worker conserve un `release-intent.json` privé, durable et idempotent, sans appel TTS. Le suivi existant renvoie `release_staged`. Si l'accusé est incertain, le Studio montre un bouton pour renvoyer **le même** contrat ; il ne rejoue jamais une génération payante.
4. `scripts/package-coral-approved-release.mjs` lit l'intention, le MP3 privé déjà obtenu et **un build Astro ayant déjà le blueprint publié en candidat**. Il vérifie le SHA du MP3 et les liens sur les pages/recette/catalogue/sitemap, puis fabrique un lot isolé de **cinq fichiers maximum** avec manifeste de SHA. Ce script ne contacte ni GitHub ni OVH et ne modifie pas le site.
5. Les tests synthétiques PHP et Node contrôlent la séparation des visas, la révocation, la version, le SHA, la validation de l'enveloppe, la route HTTPS authentifiée, l'idempotence de la file et l'absence de publication. Le Dockerfile du worker inclut le validateur de contrat.

**Limites non masquées :** la nouvelle création n'est toujours pas convertie automatiquement en blueprint Astro natif et inscrite dans `cookingWorkshopGuides.ts` ; la qualification des droits visuels n'est pas remplacée par le visa audio ; aucune chaîne vérifiée ne sauvegarde/restaure les fichiers OVH et ne transfère de lot ciblé en production. La branche `ovh-production` ne doit pas être poussée depuis une simple intention de publication. **Le worker n'exécute aucun déploiement**, y compris quand `release_staged:true`. Le code est un candidat non installé sur le VPS ni le Studio.

Pour atteindre le véritable « Publier » sans FileZilla : terminer la projection Astro depuis le CMS, choisir et qualifier une méthode de livraison OVH authentifiée, avec inventaire, sauvegarde réelle, comparaison de SHA, rollback et accusé HTTP. Cela nécessite une réception technique propre et **ne se déduit pas** d'une CI verte.
