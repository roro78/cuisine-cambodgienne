# Coral V2 — autorité courante Studio ↔ worker

Suite de #223 (`112b32c15e85d1ec565e8faf4378459dc8f7ce38`), dépendante de #222 et #220. La réception Studio clôturée par #221 reste acquise. Ce document et cette PR ne sont pas une autorisation de fusion, de livraison ou d'appel payant.

## Circuit opérationnel testé

Le worker réutilise la passerelle de tâches, son stockage et le callback `authorize` existants. `createStudioTtsAuthority` fournit ce callback par **POST HTTPS** vers le même `index.php` du Studio, `?tts_authority=1`. Pas de nouveau service ni port. Le sens habituel Studio → Traefik → worker reste inchangé ; ce contrôle suit le sens worker → hébergement OVH, sur le HTTPS existant.

Le client n'envoie que l'identité, la version et les empreintes : aucun texte, note privée ou clé OpenAI. Le contrat est `contracts/coral-tts-authority-v1.schema.json` ; les validateurs imposent aussi l'ordre des sept chapitres et l'identifiant dérivé de leurs empreintes.

À chaque contrôle, le serveur :

1. Authentifie un Bearer **distinct** du jeton de file et de la clé OpenAI.
2. Recharge les index publics courants, puis verrouille le même catalogue privé que les sauvegardes du Studio.
3. Relit la fiche courante, la recette, les sept textes et empreintes, les sept visas, la revue culinaire et le journal révocable de droits.
4. Reconstruit la demande depuis cet état serveur ; les déclarations du JSON ne donnent aucun droit.
5. Exige en plus le fichier immuable de demande créé par la **confirmation humaine de génération**, sous session et CSRF. Des textes visés et des droits seuls ne suffisent pas.
6. Compare exactement les données reconstruites et retourne seulement un booléen, l'ID et le challenge de ce contrôle.

Les droits et contrats restent limités à `test-tone` / `simulated-tone-v1`. Ils ne peuvent jamais autoriser `coral` ou le futur fournisseur réel.

## Fraîcheur, révocation et arrêt sûr

Le client tire un nouveau challenge aléatoire de 256 bits **pour chaque requête**, n'accepte que sa réponse et n'en conserve aucune autorisation. Aucun JWT réutilisable ou délai de validité ne masque une révocation. Le serveur répond `Cache-Control: no-store`, sans session administrateur ni cookie. Un token retiré/rotaté est relu au contrôle suivant.

Le worker recontrôle avant chaque chapitre, assemblage/finalisation, reprise et téléchargement. Réseau indisponible, TLS invalide, token incorrect, réponse trop grande, redirection, challenge erroné, source/version changée ou journal révoqué ⇒ refus. Une révocation après le troisième fragment empêche le quatrième. Les fragments vérifiés restent conservés ; aucune répétition d'un appel incertain.

Il existe une frontière de concurrence explicite : une révocation ne peut pas annuler rétroactivement un appel déjà engagé ni récupérer les octets déjà téléchargés ou tamponnés dans un lecteur. Le prochain contrôle échoue ; ce mécanisme ne promet pas l'effacement à distance d'un audio chargé.

## Protections HTTP et secrets

- Hôte client fixé à `www.cuisine-du-cambodge.com`, chemin exact, HTTPS 443, certificat/nom vérifiés ; pas de redirection, identifiants dans l'URL ou destination fournie par le job. L'autorité de certification de test n'est acceptée qu'en mode explicitement fictif sur 127.0.0.1.
- POST JSON ≤ 6 000 octets, réponse ≤ 2 048 octets, délai client 3 s (borne maximale 5 s), schémas fermés. Pas d'autorisation basée sur `authorized` fourni par l'appelant.
- Route fermée par défaut : `editorial_tts_authority.enabled` **et** `qualified` doivent être explicitement vrais dans la configuration privée. Une origine navigateur est refusée ; le Bearer ne donne accès qu'au contrôle en lecture, jamais à la session, l'édition ou la publication.
- Secret régulier hors webroot, dans le répertoire privé 0700 ; fichier 0600 avec propriétaire cohérent sur Linux. Client : lecteur privé existant avec `O_NOFOLLOW`, contrôle d'inode/propriétaire. Aucun token dans une URL ou un message d'erreur.
- Limiteur privé verrouillé : 120 contrôles authentifiés/minute. Corruption/verrou indisponible ⇒ échec fermé. Ce limiteur ne remplace pas une protection DDoS de l'hébergeur ; la protection native OVH devra être appréciée avant exposition réelle de la route.
- Audio : support borné d'un seul `Range: bytes=…` dans le worker **et** le Studio. Réponses 200/206/416, SHA du fichier entier et autorité vérifiés avant toute tranche. Multipart refusé ; aucun contournement de session/Bearer. Cache toujours interdit.

Exemple de configuration **documentaire**, non chargé et fermé :

```php
$cfg['editorial_tts_authority'] = [
    'enabled' => false,
    'qualified' => false,
    'token_file' => $private.'/tts-authority-token',
];
```

Après une future autorisation spécifique, le circuit existant de transfert privé pourra installer ce jeton d'autorité sur les deux hôtes, avec permissions vérifiées et montage VPS en lecture seule. La clé OpenAI reste exclusivement dans son mécanisme existant sur Orvekio. Aucun secret réel n'a été lu, créé, transféré ou ajouté à la configuration pendant cette mission.

## Preuves et qualification

Les tests utilisent deux processus distincts (Node et le vrai PHP partagé), un frontal TLS loopback avec certificat de fixture et les vrais journaux PHP temporaires. Ils couvrent confirmation absente, état valide, sélection falsifiée, source/recette/version modifiée, visas/droits révoqués, token incorrect/rotaté, TLS non fiable, redirection, taille/délai, HTTP, perte de connexion et révocation en cours de traitement, puis refus d'accès au MP3 complet. Les tests #223 sont conservés.

Un **seul HEAD anonyme** depuis le conteneur Coral existant vers le Studio existant a répondu **HTTP 200 avec TLS vérifié**. Il confirme la faisabilité du trajet sortant sur 443. Il ne prouve ni l'installation de cette nouvelle route, ni ses permissions/curl/limites sur l'hébergement réel. Aucun changement réseau, restart ou déploiement n'a été effectué.

Le bootstrap de production n'injecte toujours aucun `ttsJobs`. Les bibliothèques préparées sont incluses dans le Dockerfile source, sans activer de traitement ni ajouter FFmpeg à l'image de production. Les configurations de production sont préservées.

**GO du mécanisme en isolation après CI verte. NO-GO de raccordement réel/installé** tant que la route, les deux configurations privées et le transport de secrets n'ont pas été autorisés, installés puis reçus au bon niveau de preuve. L'activation réelle du fournisseur vocal reste une décision distincte et actuellement impossible dans ce code.
