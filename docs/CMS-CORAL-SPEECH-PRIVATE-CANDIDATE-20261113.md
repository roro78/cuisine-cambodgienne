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
