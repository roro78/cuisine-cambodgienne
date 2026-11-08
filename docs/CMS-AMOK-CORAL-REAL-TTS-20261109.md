# Amok Trey v4 — voix Coral réelle et préparation mobile

## État vérifié le 9 novembre 2026

Le brouillon privé `c-090c287895f1d8d8e306d871`, version 4, conserve ses sept
narrations approuvées, sa revue culinaire et son visa final courant. Ces décisions
ne sont ni reprises ni créées par l'agent. Elles ne valent pas droits audio,
autorisation de dépense ou réception de l'écoute.

Les six pistes historiques utilisent la voix standard OpenAI `coral`, le modèle
`gpt-4o-mini-tts`, une vitesse de 0,93 et une narration française chaleureuse.
La référence locale extraite de douze secondes est MP3 mono, 24 kHz, 128 kb/s ;
la piste source est intacte. L'identité exacte d'un snapshot historique et la
continuité perceptive entre modèles restent à vérifier, sans déduire l'identité
sonore du seul nom `coral`.

## Comparaison des circuits

| Circuit | Constat | Décision actuelle |
| --- | --- | --- |
| Squaia Render historique | `/api/tts` existe ; une requête vide renvoie 400 sans synthèse. Le code consulté protège les appels facturables par session Squaia signée et origine autorisée. La requête vide ne prouve pas cette protection en production pour une vraie synthèse. Le projet API et le budget du service ne sont pas établis. | Aucun appel vocal, aucune modification Squaia, aucun emprunt de clé ou session. |
| Worker Coral Orvekio existant | Sain, clé du projet existant montée en lecture seule. Liste des modèles : HTTP 403, accès vocal non établi. FFmpeg/FFprobe absents. Adaptateur Realtime toujours inerte ; bootstrap TTS non raccordé. Aucun job TTS antérieur trouvé. | Circuit à privilégier pour isoler Cuisine et conserver son projet/secrets. Aucun fournisseur réel activé. |

`gpt-4o-mini-tts` est annoncé en retrait le 6 janvier 2027. Le candidat de
migration `gpt-realtime-2.1-mini`, voix `coral`, utilise une autre API et exige
une comparaison sonore ainsi qu'une qualification complète. Aucun remplacement
automatique de modèle, de vitesse ou de voix. Aucun deuxième fournisseur développé.

Sources officielles consultées : [guide vocal](https://developers.openai.com/api/docs/guides/text-to-speech),
[modèle historique](https://developers.openai.com/api/docs/models/gpt-4o-mini-tts),
[tarifs](https://developers.openai.com/api/docs/pricing).

## Parcours permanent préparé dans le Studio commun

Le panneau apparaît pour les ateliers même lorsqu'aucun fournisseur n'est
configuré. Il affiche les visas, la revue culinaire, le visa final, les droits,
la référence historique et un ordre de grandeur de coût clairement estimatif.
Il permet la confirmation ou la révocation personnelle des droits pour le profil
`openai-speech-coral-093-v1` : modèle historique, voix Coral et vitesse 0,93.

Le journal `voice-rights` réutilise les mécanismes TTS existants et reste séparé
des droits `test-tone`. Il est append-only, chaîné, lié au brouillon exact et
refuse une approbation sans visa final courant, confirmation, session, CSRF et
version attendue. Une nouvelle décision identique est refusée. Le profil historique
ne peut plus recevoir d'approbation après sa date de retrait ; une révocation
reste possible. Une migration de profil demandera un nouveau consentement.

La création atomique d'un répertoire exclut les actions TTS concurrentes, car le
diagnostic OVH a montré que `flock()` seul était insuffisant. Une publication par
`link` refuse tout écrasement d'un événement. Un verrou laissé par un arrêt brutal
reste fermé et demande une inspection ; il n'est jamais volé automatiquement.

**Ce panneau ne produit aucune voix et ne déclare pas le chantier de génération
autonome terminé.** Aucun bouton actif de synthèse réelle n'est ajouté. Le message
de blocage explicite les prérequis restants. Les tests de simulation existants
restent identifiés comme simulation. Aucun faux MP3 n'est livré.

## Coût et décisions mobiles

Pour les 1 669 mots v4, une hypothèse de 140 mots/minute à vitesse 0,93 donne
environ 12,8 minutes de parole. Le coût indicatif historique est de l'ordre de
0,20 à 0,40 USD, sans valeur de facture ni plafond garanti. Les tarifs utilisés
sont 0,60 USD/M tokens texte entrants et 12 USD/M tokens audio sortants ; les
quantités de tokens restent estimées. Le budget texte du worker n'est pas une
autorisation de dépense audio. Un seuil de projet annoncé à 1 USD ne prouve pas
une limite réellement appliquée.

Depuis Android, le propriétaire peut relire l'état éditorial, écouter le début de
la référence historique, consigner/révoquer les droits et vérifier le compte API
existant : accès vocal, permissions du compte de service, crédit et plafonds. Un
accord de dépense doit être distinct et explicite. Ne jamais demander ni coller
une clé dans le Studio, le chat ou GitHub.

## Travail technique encore bloquant

La préparation mobile n'installe pas le fournisseur. Il reste à qualifier **un
seul** transport réel, son modèle et sa fidélité sonore ; intégrer ce transport au
worker et aux contrats de demande/autorité existants ; installer l'image audio
épinglée avec sauvegarde/rollback et les seules configurations/secrets nécessaires.
Une préécoute payante exige un accord explicite préalable et les droits courants.

Le futur parcours doit conserver les textes exacts, les intentions durables avant
appel, les reçus et empreintes, la réservation et le coût observé, le contrôle de
l'autorité à chaque fragment, l'absence de retry incertain et la reprise des seuls
fragments manquants. Un premier fragment confirmé doit être réutilisé dans le
chapitre complet. Sept fichiers ou une piste continue avec sept chapitres mesurés
et accessibles sont acceptables. Écoute humaine et publication restent distinctes.

## Réception et périmètre

Les tests locaux vérifient l'absence de fournisseur, les droits distincts de la
simulation, l'invalidation, la révocation, CSRF, version, double soumission,
reconnexion et rendu 390/1440 px. Les tests historiques de simulation sont
conservés. La CI inclut le nouveau test. Aucune preuve locale/CI ne vaut livraison
OVH ou écoute Android physique ; le rapport #205 précise le SHA effectivement
installé et les vérifications réalisées.

Un éventuel paquet Studio contient uniquement `index.php` et `coral-v2-ai.php`.
Aucun ancien MP3, recette, portion, contenu v4, visa, journal existant, base,
workflow social, Squaia ou service Orvekio n'est modifié par ce paquet.
