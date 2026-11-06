# Coral V2 — parcours MP3 privé simulé

Chantier distinct de la réception OVH déjà close : #205, #220, clôture #221. Cette branche dépend de #222 (`5fbf732299a0d47305509a07af4f191bd6876f51`). Aucune fusion ou livraison implicitement autorisée.

## Ce qui fonctionne en test

Le même Studio reçoit une fiche atelier enregistrée, sa recette canonique, les six phases détaillées et les sept textes. Les visas existants 7/7 et le journal culinaire sont relus, puis un journal humain distinct atteste voix/contenu/audio privé. La confirmation de génération est une action POST séparée, protégée par session et CSRF. La génération reste facultative ; enregistrer une fiche ne dépend jamais de l'audio.

La simulation utilise le signal `test-tone` / `simulated-tone-v1`, pas une imitation de Coral. Les droits accordés pour cette simulation ne peuvent pas autoriser une autre voix ou un fournisseur payant. Les validations fictives des tests sont confinées dans des dossiers temporaires nommés et n'existent jamais en production.

## Réutilisation et lacunes comblées

| Composant existant | Réutilisation / ajout ciblé |
|---|---|
| `cmsCreationSave`, source_binding et versions privées | Inchangés ; le serveur relit la version réellement sauvegardée |
| Sept narrations et empreinte pédagogique | Réutilisées, avec empreinte complète de fiche/recette et SHA de chaque texte |
| Journaux des visas et revue culinaire | Réutilisés sans second système d'approbation |
| Droits audio et écoute | Journaux append-only compatibles, chaînés par SHA, versionnés et révocables |
| `createJobGateway` | Même file, même jeton, même répertoire et même ordonnanceur ; opération TTS optionnelle, fermée par défaut |
| `reserveCoralBudget` | Réservation préalable conservée ; verrou global et plafond mensuel commun ajoutés |
| Générateur historique `bridge-cooking-workshops-coral.mjs` | Conserve ses fichiers et autorisations ; principes de fragments/empreintes/FFmpeg réutilisés, aucun appel Render |
| Lecteur | Élément audio natif du Studio, source privée sous la même session ; pas de second moteur de lecture |

L'ancienne porte `cmsCoralTtsPreproductionGate` reste diagnostique et fermée. La nouvelle action ne l'interprète jamais comme une autorisation : elle exige en plus le journal de droits, la configuration strictement simulée et la confirmation. Le fournisseur de texte et ses trois flags ne sont pas activés.

## Contrats et autorité

Les schémas se trouvent dans `contracts/coral-tts-request-v1.schema.json` et `coral-tts-result-v1.schema.json`. Les validateurs réels imposent aussi ordre des IDs, SHA des textes, identité déterministe et limites de taille. Une requête contient seulement identité/version, empreintes, sept textes destinés au TTS, voix, fournisseur et réservation simulée. Notes privées, secrets et objet Astro complet sont exclus.

`request_id = SHA256(id, version, liaison, recette, 7 SHA texte, voix, reçu de droits, reçus de revue, fournisseur)[:48]`, composants séparés par LF. PHP et Node produisent la même identité. Un autre ID, un texte modifié, une ancienne version ou un reçu différent sont refusés.

Le worker exige un callback **serveur** `authorize(request)` et le relit avant chaque chapitre, avant assemblage et avant finalisation. Le test utilise les vrais journaux PHP via une fixture CLI privée, sans croire les booléens de la requête. Une révocation ou une modification arrête les chapitres suivants et ferme la lecture. Un appel déjà engagé ne peut pas être annulé rétroactivement ; aucun suivant n'est émis.

Le raccordement d'une telle autorité aux deux hôtes réels n'est pas installé : il devra être qualifié avant une voix payante. La suite de #223 prépare une [route d'autorité HTTPS fermée par défaut](CMS-CORAL-TTS-AUTHORITY-QUALIFICATION-20261106.md), testée sur le vrai PHP en isolation ; elle n'est pas livrée en production.

## File, fragments et reprise

L'API authentifiée existante accepte les requêtes TTS uniquement lorsqu'un gestionnaire simulé est injecté explicitement. `PUT /editorial-ai/v1/jobs/{id}` est idempotent, `GET` observe seulement, `POST .../{id}/resume` exige une reprise explicite et `GET .../{id}/audio` lit l'artefact privé. Aucune nouvelle écoute réseau ou instance Docker n'est ajoutée.

Dans le même dossier de tâche : `request.json`, marqueurs de démarrage conservés, sous-dossier privé `tts/` avec intentions, WAV, reçus, réservation, état et manifeste. Dossiers 0700 et fichiers 0600 sur Linux. Verrou de contrôle interprocessus et démarrage exclusif empêchent deux workers ou reprises simultanées. Un verrou abandonné échoue fermé ; pas de suppression automatique.

Une intention est écrite et synchronisée **avant** le fournisseur ; le fragment et son reçu sont sauvegardés avant de passer au suivant. Une tentative sans reçu est `uncertain` : aucune relance, même explicite. Après une interruption entre chapitres, une nouvelle instance/processus vérifie empreintes, format et durées, puis traite uniquement les fragments absents. Une somme de contrôle incorrecte bloque, sans écraser le fichier.

Un marqueur exclusif dans le même stockage fixe aussi l'unicité atelier/version/texte/voix indépendamment des reçus de droits : révoquer puis réaccorder les droits ne permet pas de contourner l'interdiction d'une seconde synthèse de la même version. Une nouvelle édition nécessite une nouvelle version et ses validations.

## Audio réellement produit

Sept WAV PCM signés 16 bits, mono 24 kHz, tons déterministes distincts. FFprobe mesure chaque fichier ; les textes ne donnent jamais sa durée. FFmpeg concatène les sept PCM dans l'ordre et encode un MP3 unique avec sept chapitres ID3. FFprobe vérifie codec, durées et repères ; FFmpeg décode intégralement le résultat. Le MP3 porte un nom dérivé de son SHA et n'écrase aucun enregistrement historique.

Les chapitres utilisent les offsets mesurés des PCM ; la tolérance vérifiée de durée finale couvre le padding de l'encodeur MP3. Les preuves exportent segments, MP3 et manifeste. Il s'agit d'une preuve de traitement audio, pas de prononciation, de qualité vocale ou de cours culinaire.

## Budget et secrets

Simulation : réservation fixe 7 000 micro-USD, sept reçus à 1 000 micro-USD, coût réel fournisseur **0**. Ce chiffre artificiel teste le plafond ; ce n'est **pas** un tarif OpenAI. Le registre partagé réserve avant tout appel et conserve la réservation après interruption/incertitude, sans remboursement supposé. Limite quotidienne bornée à 0,75 USD et mensuelle à 1 USD, verrou commun à tous les jours. Les répertoires et registres corrompus ou non privés bloquent.

Avant chaque fragment, le reçu est recoupé avec le registre et ses plafonds. Une réservation d'une autre tâche ou d'une autre journée UTC ne finance pas une reprise : la tâche s'arrête pour réconciliation humaine. Le déplacement d'une dépense potentielle d'un jour/mois à un autre n'est jamais supposé gratuit.

Aucune clé n'est nécessaire. Aucun adaptateur payant n'est instanciable ici : le type de fournisseur est strictement simulé. La clé réelle reste sur Orvekio, jamais dans PHP, le dépôt ou les journaux. Les erreurs fournisseur sont remplacées par des codes contrôlés ; pas de message brut ni de texte privé dans les réponses de diagnostic.

## Interface et approbation

Dans la fiche commune, le panneau affiche les validations, droits manquants, voix de test et réservation. Le bouton « Valider et générer le MP3 » est disponible seulement en mode simulé configuré et après contrôles. États : en attente, génération en cours, nombre de chapitres terminés, interruption, incertitude, prêt pour écoute, approbation privée. Un GET ne soumet jamais de tâche.

Le flux audio exige la session, l'appartenance de la demande à la fiche, les droits courants et le SHA du fichier exact. La CSP autorise seulement `media-src 'self'`. L'écoute/approbation est un journal distinct lié au SHA exact ; la simulation peut être marquée reçue techniquement, jamais comme vraie voix Coral validée. La publication reste absente.

## Exécuter sans dépense

Prérequis locaux : Node 22, PHP 8.3/8.4 (mbstring), FFmpeg/FFprobe et Chromium via Playwright Core existant. Aucun Docker Desktop.

```sh
npm run build
node --test --test-concurrency=1 tests/coral-tts-jobs.test.mjs tests/coral-tts-studio-e2e.test.mjs
```

`PHP_BIN`, `CHROME_BIN`, `TTS_TEST_DIST` et `TTS_EVIDENCE_DIR` permettent de sélectionner les outils/dossiers de test. Les serveurs de fixture n'écoutent que sur 127.0.0.1. Le workflow `coral-tts-simulation.yml` exécute les tests Linux et conserve les seuls artefacts synthétiques. Aucun secret GitHub, serveur externe ou appel payant.

## Limites et qualification future

Pas de voix OpenAI qualifiée, de coût réel mesuré, d'écoute humaine de voix, d'Android physique ou de publication. Le factory TTS n'est pas activé dans le bootstrap de production. Le Dockerfile inclut les dépendances JS pour conserver son démarrage, sans installer FFmpeg ni activer TTS. L'image de production devra être préparée/qualifiée séparément si ce traitement y est autorisé.

Les petits artefacts de test entrent dans les plafonds actuels du backup chiffré (1 MiB/fichier, 32 MiB au total). Les longues voix réelles nécessiteront une qualification de capacité et du stockage/sauvegarde des médias : les plafonds existants n'ont pas été affaiblis et aucune sauvegarde OneDrive n'a été relancée.

Voir [qualification future OpenAI](CMS-CORAL-TTS-OPENAI-QUALIFICATION-20261106.md). **GO pour expérimentation isolée simulée seulement ; NO-GO pour production ou appel facturable.**
