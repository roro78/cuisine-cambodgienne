# Coral V2 — dossier de réception de l'autorité, à exécuter après autorisation

**Préparé uniquement. Livraison, secret, activation de route, installation de worker et appel fournisseur : non autorisés pendant la correction de #225.** La réception historique Studio (#221) et les sauvegardes historiques restent clôturées. Aucune synchronisation `main` / `ovh-production`.

## Références et périmètre fermé

- Chaîne de code : #220 → #222 → #223 → #224 → #225 ; aucune fusion automatique.
- [Manifeste public expurgé](../deploy/coral/authority-delivery.redacted.json) : exactement `index.php`, `coral-v2-ai.php`, `publication-gap-audit.php`, dans le Studio partagé. Leurs octets Git sont inchangés par la correction transcript de #225. Le manifeste indique la référence publique du payload ; il ne prétend pas prouver l'état actuel d'un hôte.
- Dépendances publiques conservées : `lib.php` et `.htaccess`. Index/catalogue et toutes les données privées restent en place. Les empreintes observées, chemins et paramètres privés restent dans le dossier local, jamais dans ce manifeste ou GitHub.
- Seules nouvelles capacités à autoriser ultérieurement : autorité en lecture, jeton dédié distinct de la file et d'OpenAI, ses seules configurations privées et un client de qualification ponctuel. Aucun changement Traefik/réseau, aucune base, aucun moteur supplémentaire, aucun port.

Le client ponctuel utilisera l'image candidate du SHA revu, identifiée par ID immuable et checksum d'archive, avec commande de contrôle HTTPS explicite, UID non privilégié, rootfs RO, ressources bornées et seul jeton d'autorité monté RO. Il n'écoute pas et ne possède ni file, données de jobs, clé OpenAI ou accès DB. **Son exécution temporaire doit être explicitement incluse dans le prochain accord** ; aucun conteneur de production n'est créé pendant cette préparation et aucun nouveau service permanent n'est prévu. La commande par défaut du candidat vérifie seulement ses outils ; elle n'est pas un bootstrap vocal installé.

## Vérifications locales déjà automatisées

```text
node scripts/coral-authority-install-preflight.mjs --verify-local <paquet-local>
node scripts/coral-authority-install-preflight.mjs --manifest-redacted <paquet-local>
```

Ces deux modes ne possèdent aucune fonction de livraison ou d'application distante. Le premier vérifie le candidat **et** le rollback public par SHA/taille. Le second projette exclusivement les noms et empreintes du candidat public et des conditions génériques ; aucun hash observé sur hôte, chemin privé, secret, propriétaire ou mode réel n'est exporté.

Le test `coral-authority-install-preflight.test.mjs` vérifie les trois fichiers du manifeste contre les octets Git canoniques, le refus d'une dérive, l'absence de cibles supplémentaires et l'expurgation. Les lint PHP disponibles sont exécutés sur le paquet local ; les CI PHP 8.3/8.4 et les contrats sur tous les contenus réels complètent cette preuve. Aucun nouveau composant local n'est installé.

## Séquence de la prochaine intervention

| Étape | Exécution prévue après accord | Preuve obligatoire / arrêt |
|---|---|---|
| 0 — accord | Accord couvrant trois fichiers publics, configurations privées d'autorité, jeton distinct, client ponctuel et recette privée dédiée | Sans cet accord, arrêt avant toute écriture, création de secret ou exécution sur hôte |
| 1 — relecture ciblée | SHA exact/CI, trois préimages et dépendances, PHP/extensions, modes/propriétaires et destination locale de rollback | Comparaison avec le dossier local ; toute dérive bloque. Pas de diagnostic SSH/Docker global |
| 2 — sauvegarde | Copies des seules préimages et configurations à changer, **sur hôte hors webroot**, avant livraison | Taille/SHA et modes vérifiés ; journal expurgé. Aucune config privée en clair dans un artefact/GitHub |
| 3 — jeton | Génération/réception privée via circuit sécurisé existant ; transfert SSH/SFTP vérifié ; dossiers 0700 et fichier 0600/0400 selon lecteur effectif | Jeton distinct, aucun argument/env/log/URL/chat, propriétaire contrôlé, lecture RO, récupération vérifiée. Aucun accès à la clé OpenAI |
| 4 — trois PHP | Livraison ciblée des seuls octets du manifeste, droits publics existants préservés | Readback SHA/taille, lint et dépendances ; échec ⇒ rollback ciblé |
| 5 — config d'autorité | Section privée fermée initialement, puis ouverture du **seul contrôle d'autorité** sous accord de qualification | Génération, fournisseur vocal et publication restent fermés ; aucune modification des autres services |
| 6 — fixture privée | Nouvelle fixture de recette dédiée à cette autorité, jamais le brouillon historique réceptionné ; droits/visas et confirmation humaine sous session/CSRF | Identités et version connues ; ni publication ni mutation d'un contenu réel. Sa création et ses journaux de tests doivent être couverts par l'accord |
| 7 — HTTPS | Client ponctuel, destination fixe, TLS/nom vérifiés, un challenge frais par contrôle ; aucun cache de décision | Matrice ci-dessous ; statut, challenge, identité et version expurgés, aucun Bearer dans les preuves |
| 8 — clôture | Désactiver la qualification si non reçue, terminer le client ponctuel, vérifier les trois empreintes et les drapeaux fermés | GO/NO-GO du contrôle d'autorité seulement ; aucune autorisation de synthèse ou dépense |

Le jeton ne donne aucun droit éditorial ou de publication. La route et les journaux serveur reconstruisent toujours l'état courant. Le limiteur privé fait partie du fonctionnement de cette route ; son état nouveau et les seuls journaux de la fixture doivent être identifiés dans l'accord, sans toucher aux données historiques.

## Matrice de réception prévue

| Cas contrôlé, sans synthèse | Résultat exigé |
|---|---|
| Route encore fermée / méthode ou origine non admise | Refus, aucun état éditorial modifié |
| Bearer absent / erroné / ancien après rotation | Refus ; aucun secret ni détail privé dans la réponse |
| Bearer correct, état serveur confirmé, identité/version exactes | Réponse positive bornée, ID et challenge exacts |
| Challenge ancien, remplacé ou réutilisé par le faux client | Le client refuse ; aucun accord mis en cache |
| Fiche/version/recette/texte différent ou confirmation humaine absente | Refus malgré les affirmations du JSON |
| Droit/visa révoqué, puis nouvelle lecture | Refus immédiat au prochain contrôle, y compris accès audio ultérieur |
| TLS non fiable, redirection, réponse trop grande/partielle, délai ou perte réseau | Refus fermé, erreur générique, pas de fallback ou retry fournisseur |
| Concurrence / limiteur | Échec fermé si plafond/lock indisponible ; aucune modification des protections réseau existantes |

Les erreurs TLS/HTTP sont déjà éprouvées dans les fixtures isolées ; leur injection sur le serveur réel ne doit jamais nécessiter une modification de réseau/service. Les défauts de réponse se simulent dans le client de recette, ou restent marqués « simulés » si non reproductibles en sécurité sur l'hôte. Ne pas présenter une réponse anonyme HTTPS comme une réussite Bearer, ni les tests CI comme une installation.

## Rollback ciblé

Déclencheurs : empreinte inattendue, lint/dépendance incompatible, contrôle d'autorité incorrect, fuite de détail ou recette non conforme. Fermer le seul drapeau de qualification nouvellement activé ; restaurer les trois préimages et les seules configurations concernées depuis la copie vérifiée ; relire SHA/taille/modes et contrôles négatifs. Terminer uniquement le client ponctuel. **Aucun rollback de base, MP3, catalogue, brouillon historique, calendrier ou autre service.** Les traces de la fixture privée restent privées et ne sont pas effacées automatiquement.

Un appel fournisseur ou un checkpoint incertain ne doit jamais être réactivé par restauration. Les reçus corrigés de #225 portent `transcript_normalization=ecmascript-whitespace-v1`, avec SHA source exact distinct du transcript canonique. Les anciens reçus non étiquetés ne sont ni réécrits ni rejoués automatiquement.

## Décisions indépendantes

1. Correction #225 et fusion de sa chaîne : décision de code après CI du SHA exact et résolution du fil P2.
2. Réception réelle de l'autorité : accord de périmètre et preuves de la matrice ci-dessus, **pas encore exécutée**.
3. Installation/activation vocale : toujours NO-GO jusqu'au projet OpenAI existant vérifié, modèles/permissions/plafond actuels, droits de vraie voix, coût maximal/réservation démontrés, bootstrap vocal revu, offsite du nouveau format et recette humaine. Aucun de ces accords n'est implicite dans le précédent.
