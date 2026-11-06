# Coral V2 — charge audio longue et coûts futurs

Cette qualification complète la preuve courte de #223. Aucun MP3 historique modifié et aucune voix réelle générée.

## Scénarios déduits des données

Le référentiel de narration V2 cite le Lok Lak à 13 min 10 s comme étalon de narration, sans imposer cette durée à tous les plats. Les six manifestes actuels V3 (Lok Lak V2) donnent 620,976 à 789,936 s. Le scénario représentatif reprend le manifeste médian réel `kroeung-jaune-v3.json`, chapitre par chapitre ; le stress borné double les durées et le volume de texte du plus long, `lok-lak-v2.json`. Ce doublement est une hypothèse de charge, pas une nouvelle norme éditoriale.

Le générateur produit des tons synthétiques PCM 24 kHz/16 bits mono ; chaque durée est ensuite **mesurée par FFprobe**, jamais attestée par un simple nombre de mots. Les guides historiques sont seulement lus pour dériver les métriques ; leurs textes ne sont pas envoyés à un fournisseur.

| Mesure locale Windows, processus séparés | Représentatif | Stress borné |
|---|---:|---:|
| Durée MP3 mesurée | 664,776 s | 1 579,920 s |
| Sept WAV, octets | 31 907 252 | 75 834 164 |
| MP3, octets | 5 318 840 | 12 639 992 |
| Dossier TTS final, octets | 37 230 567 | 88 478 689 |
| Maximum RSS du processus Node, KiB | 86 604 | 132 676 |
| CPU Node utilisateur+système, deux phases | 2 796 ms | 4 844 ms |
| Temps mural worker, deux phases | 36 516 ms | 52 274 ms |

Ce RSS et ce CPU sont ceux de **Node**, pas ceux de FFmpeg ni du conteneur entier. Le PC exécutait aussi d'autres validations ; ils ne sont pas un benchmark de production. La recette Linux mesure séparément FFprobe, assemblage et décodage avec `/usr/bin/time`, et le pic mémoire/CPU cgroup. Ses chiffres réels sont conservés dans `summary.json`/`report-*.json` de l'artefact CI.

## Enveloppe existante, limites distinctes

Le workflow `coral-tts-qualification.yml` exécute la même file dans un conteneur de **test éphémère**, sans réseau ni secret, non privilégié, lecture seule, CPU **0,5**, mémoire/swap **256 MiB**, 64 PIDs et `/tmp` de 16 MiB. Ce sont les bornes du worker existant. L'image de fixture contient FFmpeg et GNU time ; elle n'est ni publiée ni utilisée par Compose en production. Aucun Docker Desktop n'est utilisé.

| Borne existante | Périmètre réel | Résultat / conséquence |
|---|---|---|
| 32 000 000 octets | Lecture d'un WAV/MP3 privé et réponse audio Studio/worker | Les segments et les deux MP3 passent ; cette borne décimale n'est pas un quota global de disque |
| 7 200 s | Durée maximale d'un fichier mesuré | Les deux scénarios passent |
| 30 s | **Chaque** commande FFmpeg/FFprobe | Inchangé ; les commandes passent dans la recette locale, puis sont vérifiées sous le quota Linux |
| 90 000 / 120 000 octets | Requête job / métadonnées JSON | Ne transportent pas les octets MP3 ; limites conservées |
| 6 000 / 2 048 octets | Contrôle d'autorité / réponse | Aucune narration intégrale dans cette requête |
| 1 MiB/fichier | Backup chiffré `coral-state-backup.mjs` | **INCOMPATIBLE** avec les WAV et MP3 longs |
| 32 MiB total, 64 MiB archive | Même snapshot JSON chiffré | **INCOMPATIBLE** avec les deux dossiers TTS complets ; pas un quota du volume Docker |
| Volume de jobs | Bind mount privé existant | Pas de quota global déduit du code ; espace libre réel et rétention à qualifier avant installation |

La taille finale mesurée n'est pas une garantie de place libre : prévoir aussi fragments, versions, métadonnées et marge de traitement. L'assemblage écrit dans le volume de jobs, pas dans le petit tmpfs ; le renommage final par lien ne recopie pas le gros média. Aucun plafond, sauvegarde ou volume historique n'a été augmenté ou migré.

La recette s'interrompt après trois chapitres dans un premier processus ; un second ne synthétise que les quatre restants. Les sept SHA des WAV, la durée/les sept chapitres MP3 et le SHA final sont contrôlés. Un test Chromium lit les deux fichiers longs via l'API privée, puis cherche et lit chacun des sept chapitres, avec mesures de latence. Les requêtes partielles HTTP Range ont été ajoutées après un échec reproductible de seek sur la réponse intégrale ; chaque nouvelle tranche est réautorisée. Les buffers déjà reçus ne peuvent pas être révoqués à distance.

## Choix vocal vérifié, toujours inactif

La documentation officielle reconsultée confirme la dépréciation de `tts-1`, `tts-1-hd`, `gpt-4o-mini-tts`, avec arrêt le 6 janvier 2027. Pour une nouvelle intégration, retenir comme **candidat** `gpt-realtime-2.1-mini` via WebSocket serveur Realtime, et non comme simple modèle de `/v1/audio/speech`. Voix `coral` publiée pour Realtime, sortie PCM mono 24 kHz, texte français fourni comme entrée. La fidélité d'une narration non interactive reste à recevoir réellement. [Dépréciation/TTS](https://developers.openai.com/api/docs/guides/text-to-speech), [voix](https://developers.openai.com/api/docs/guides/realtime-conversations#voice-options), [connexion serveur](https://developers.openai.com/api/docs/guides/voice-websockets?api=realtime).

`coral-tts-realtime-contract.mjs` prépare un `response.create` hors conversation (`conversation=none`), sans outils, voix Coral et PCM. Son harness **fictif** décode les vrais octets PCM des faux événements et exige ID cohérent, fin audio, réponse `completed`, transcript intégral identique et usage tarifable reconnu. Erreur, timeout, troncature, transcript différent, usage inconnu ou flux coupé ⇒ résultat incertain sans relance. La fabrique de production lève toujours `CORAL_REAL_PROVIDER_DISABLED` ; aucun client WebSocket, clé ou transport OpenAI n'est implémenté/instancié. Le worker simulé refuse son type payant/non qualifié.

Realtime publie `max_output_tokens` entier de 1 à 4 096 par réponse (ou `inf`) ; le modèle publie un maximum plus élevé, ce qui n'autorise pas à inventer un réglage entier supérieur au schéma API. Le stress dépasse même la capacité cumulée de sept réponses bornées à 4 096 tokens. De futurs sous-fragments exigeraient leurs checkpoints durables, réservations et droits propres dans le moteur existant ; pas de boucle cachée ou reconnexion automatique. [Schéma response.create](https://developers.openai.com/api/reference/resources/realtime/client-events#response.create), [fiche modèle](https://developers.openai.com/api/docs/models/gpt-realtime-2.1-mini).

## Coûts : quatre notions distinctes

Tarifs officiels Realtime Mini : par million, entrée texte **0,60 USD**, sortie texte **2,40 USD**, entrée audio **10 USD**, sortie audio **20 USD**. Aucun input audio, outil ou session antérieure n'est prévu dans le candidat ; aucune remise cache n'est supposée. Les connexions/bande passante Realtime ne sont pas actuellement facturées séparément ; les autres opérations/modèles ne sont pas inclus sans preuve. [Tarifs](https://developers.openai.com/api/docs/pricing), [facturation Realtime](https://developers.openai.com/api/docs/guides/voice-latency-cost?api=realtime).

Le guide officiel indique environ un token audio assistant par 50 ms (20/s), plus tokens spéciaux. Le calcul **estimatif** prend les durées ci-dessus, caractères/3 pour le texte français et 200 tokens d'instructions par chapitre. Ce ratio n'est ni une tokenisation réelle ni une borne de facture. [Mesure des tokens](https://developers.openai.com/api/docs/guides/voice-latency-cost?api=realtime).

| Notion | Représentatif | Stress borné |
|---|---:|---:|
| Source texte | 1 471 mots / 8 932 caractères | 3 628 mots / 21 626 caractères (hypothèse ×2) |
| Estimation texte tokens | 2 978 | 7 209 |
| Coût total estimé, sept chapitres | **0,275666 USD** | **0,654416 USD** |
| Plafond conditionnel de la seule sortie, sept × 4 096 tokens au tarif maximal audio | 0,573440 USD | 0,573440 USD, capacité insuffisante pour ce scénario |
| Maximum externe **démontré** | **Non établi** | **Non établi** |
| Réserve interne réelle autorisée | **Aucune : fournisseur bloqué** | **Aucune : fournisseur bloqué** |

Le plafond de sortie n'inclut pas l'entrée, les éventuels tokens supplémentaires ni une qualification du comptage du modèle. Une interruption peut déjà avoir facturé tous les fragments engagés ; la réserve du job complet doit rester retenue tant que les reçus ne permettent pas une réconciliation. Un appel incertain n'est jamais présumé gratuit. Les faux reçus sont testés ; aucune facture réelle n'a été mesurée.

Le registre de simulation reste à 0,007 USD **artificiel**, sans rapport avec ces tarifs. Le dernier écran fourni par le propriétaire montrait le projet existant à 0/1 USD, `Limit enforced`, alertes 80/100 %. **Pas de relecture actuelle** : le pilotage du navigateur a expiré deux fois sans obtenir d'interface ; aucun réglage du compte n'a été consulté ou modifié. Modèle autorisé, compte de service, plafond et application stricte doivent être relus avant tout essai. Aucun nouveau projet ni secret.

## Décision

**GO de qualification isolée seulement après CI verte**, avec artefacts de ressources et seek. **NO-GO fournisseur réel et installation de ce parcours** : coût maximal externe non démontré, capacité/stratégie de sauvegarde longue incompatible et non modifiée, raccordement réel non installé, image multimédia de production non reçue, permissions du projet non relues, fidélité/qualité de voix et Android physique non testés. Une future installation et un unique essai facturable nécessitent des accords distincts.
