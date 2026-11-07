# OpenAI vocal — préparation de qualification, aucun appel

Suite de #223 : voir la [qualification longue et chiffrée](CMS-CORAL-TTS-LOAD-COST-20261106.md) et le [contrôle d'autorité HTTPS](CMS-CORAL-TTS-AUTHORITY-QUALIFICATION-20261106.md). Le harness Realtime préparé est inexécutable en production ; aucune clé ou voix réelle n'est utilisée.

Vérification documentaire du 6 novembre 2026 via documentation officielle. Ne pas confondre disponibilité publiée, autorisation du projet « Cuisine du Cambodge », droits humains et qualité réellement reçue. Aucun projet, compte, clé, limite ou modèle du compte n'a été modifié.

## Changement à prendre en compte avant un nouvel adaptateur

Les modèles `tts-1`, `tts-1-hd`, `gpt-4o-mini-tts` et leurs snapshots sont dépréciés, avec arrêt annoncé le **6 janvier 2027**. OpenAI recommande `gpt-realtime-2.1-mini` via **Realtime**, pas en remplaçant simplement le modèle de `/v1/audio/speech`. Un adaptateur Speech nouveau figé sur ce modèle déprécié n'est donc pas activé. [Calendrier officiel](https://developers.openai.com/api/docs/deprecations#2026-10-01-text-to-speech-models), [guide vocal](https://developers.openai.com/api/docs/guides/text-to-speech).

## Capacités publiées, encore à qualifier pour ce compte

- Speech historique : MP3, Opus, AAC, FLAC, WAV, PCM ; PCM brut mono 24 kHz, 16 bits little-endian. La liste des voix comprend `coral`, avec disponibilité dépendante du modèle. Le français est pris en charge, les voix étant optimisées pour l'anglais. Avertissement utilisateur obligatoire sur l'origine IA de la voix. [Guide officiel](https://developers.openai.com/api/docs/guides/text-to-speech).
- `gpt-4o-mini-tts` : maximum d'entrée publié de **2 000 tokens** ; une limite de caractères ne remplace pas le contrôle des tokens. Le schéma simulé accepte des textes plus longs : cela n'autorise pas à les envoyer tels quels à ce modèle. [Fiche modèle](https://developers.openai.com/api/docs/models/gpt-4o-mini-tts).
- Remplacement recommandé : `gpt-realtime-2.1-mini`, endpoint Realtime, fenêtre 128 000 tokens et sortie maximale publiée 32 000 tokens. Cela ne vaut pas qualification d'une narration fidèle et finie ; voix, événements de fin, quotas et sortie PCM/WAV doivent être testés sur le compte existant. [Fiche officielle](https://developers.openai.com/api/docs/models/gpt-realtime-2.1-mini).
- Les voix personnalisées créées depuis un enregistrement requièrent un circuit de consentement spécifique ; aucun clonage ni création de voix n'est prévu par cette mission. Les droits `test-tone` ne valent jamais consentement pour `coral` ou une personne réelle. [Voix personnalisées](https://developers.openai.com/api/docs/guides/custom-voices).

## Tarifs vérifiés et calcul, pas de garantie externe

Tarifs affichés, par million de tokens sauf indication :

| Modèle | Entrée texte | Sortie audio |
|---|---:|---:|
| gpt-4o-mini-tts (déprécié) | 0,60 USD | 12 USD |
| gpt-realtime-2.1-mini | 0,60 USD | 20 USD |

Pour Realtime, la sortie texte éventuelle est tarifée 2,40 USD/M tokens et l'entrée audio 10 USD/M ; les modalités effectivement facturées doivent figurer dans le reçu. Source : [tarification officielle](https://developers.openai.com/api/docs/pricing).

Formule de réserve future : somme des tokens maximaux de **chaque modalité facturable** multipliés par son tarif, divisée par 1 000 000, pour tous les fragments, marge conservatrice et arrondi vers le haut. Elle n'est calculable comme maximum fiable qu'après vérification des limites réellement imposables à la réponse, de l'overhead de contexte et des compteurs d'usage. Aucun ratio caractères/minutes n'est considéré comme plafond garanti. Les 0,007 USD du simulateur sont un chiffre artificiel sans rapport avec ces prix.

Un budget applicatif ne garantit jamais le plafond de facturation externe. Il faudra vérifier à nouveau les limites effectives du projet existant, les alertes, le compte de service et les modèles autorisés, sans recréation. Aucun paramètre du compte n'a été relu ou modifié pour cette implémentation isolée.

## Erreurs et livraison audio

La référence Speech documente 400, 401, 403, 429, 500 et 503. Timeout, déconnexion ou réponse incomplète après émission ne prouvent pas l'absence de facturation : conserver l'intention et la réserve, ne pas réessayer. La reprise exige un artefact et un reçu vérifiables, sinon intervention humaine. [Référence officielle](https://developers.openai.com/api/reference/resources/audio/subresources/speech/methods/create).

Le choix interne WAV/PCM puis assemblage FFmpeg est démontré avec le simulateur, pas avec le fournisseur réel. Un futur adaptateur devra préserver tous les échantillons, vérifier le format et la fin de réponse, traiter les éventuels sous-fragments avec des checkpoints propres, mesurer les durées, puis produire un seul MP3 privé et sept repères. Pas de simple concaténation supposée correcte de MP3 distants.

## Configuration préparée, volontairement inexécutable

```json
{
  "enabled": false,
  "qualified": false,
  "provider": "openai-realtime-unqualified",
  "candidate_model": "gpt-realtime-2.1-mini",
  "candidate_voice": "coral",
  "maximum_verified_cost_microusd": null,
  "authority_transport_qualified": false,
  "explicit_paid_test_authorization": false
}
```

Ce bloc est documentaire ; aucun bootstrap ne le charge. Avant installation : journal de droits pour la vraie voix et version, autorité serveur synchronisée entre Studio et worker et révoquable pendant le traitement, compte/modèle permis, réservation bornée vérifiée, FFmpeg/image et capacités de stockage qualifiés, puis accord explicite pour un essai facturable unique. La clé reste exclusivement dans le mécanisme de fichier secret existant sur Orvekio ; jamais dans PHP ou un formulaire du Studio.
