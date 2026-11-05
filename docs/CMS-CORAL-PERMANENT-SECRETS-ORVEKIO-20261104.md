# Coral V2 — architecture permanente des identifiants API

4 novembre 2026. Architecture distincte du backend Render de SQUAIA et du Studio OVH mutualisé.

## Décision

Une identité OpenAI API propre au projet « Cuisine du Cambodge », avec un compte de service et des droits restreints. Son secret est installé exclusivement dans le service privé de tâches **Orvekio** par un montage de secret Docker Compose, et jamais dans PHP, le navigateur, le code GitHub, n8n ni le backend SQUAIA.

Le flux durable est : Studio PHP OVH → HTTPS authentifié Traefik → service de tâches Node privé Orvekio → API OpenAI. Le Studio utilise uniquement le jeton d'accès à sa file privée. Les sept textes sont des brouillons soumis aux visas humains. La synthèse audio des nouveaux ateliers nécessitera un déclencheur séparé après approbation. Les six MP3 déjà publiés sont protégés.

## Lecteur du secret (dans ce lot)

Le worker utilise scripts/coral-openai-secret.mjs pour charger la clé depuis **/run/secrets/cdc_coral_openai_key**, sans variable d'environnement contenant la clé. Il refuse les fichiers absents, les liens symboliques, les fichiers modifiables par groupe ou autres, les caractères parasites de copie et la taille invalide. Le contenu et le chemin ne sont pas journalisés. Le fournisseur Ollama par défaut et les cinq familles C2 ne changent pas.

Exemple Docker Compose indicatif, à adapter uniquement après inspection de l'installation actuelle :

```yaml
services:
  coral-job-worker:
    # conserver l'image et les réseaux réels du worker existant
    secrets:
      - cdc_coral_openai_key
    environment:
      CDC_EDITORIAL_JOB_PROVIDER: openai-coral
      CDC_CORAL_EXTERNAL_QUALIFIED: "false"
      CDC_CORAL_EXTERNAL_ENABLED: "false"
secrets:
  cdc_coral_openai_key:
    file: /opt/orvekio/private-secrets/cdc-coral-openai-key.txt
```

Le fichier d'origine reste hors dépôt, hors webroot et sous permissions adaptées. Un secret Compose monté ne chiffre pas automatiquement le fichier sur le disque hôte ; les sauvegardes et les autorisations système doivent aussi être sécurisées.

## Mission Work pour installation permanente

1. Ouvrir le **projet API déjà existant** « Cuisine du Cambodge » dans l'organisation correcte, avec authentification du propriétaire. **Ne pas recréer ce projet.** Captures du 4 novembre : limite appliquée de **1,00 USD** (0,00 USD consommé), alertes 80 %/100 %, seuls `gpt-6-luna` et `gpt-6.1-terra` sélectionnés ; aucun compte de service listé. Recontrôler ces réglages et vérifier les limites et rôles effectifs avant toute clé. Créer seulement un **compte de service dédié à ce projet**, distinct de SQUAIA et des clés personnelles ; réduire ensuite sa clé aux permissions de requêtes Responses nécessaires, pas d'audio à ce stade. Ne jamais reprendre la clé Render.
2. Conserver le plafond projet **1,00 USD appliqué**, avec alertes 80 %/100 % ; ne rien modifier sans accord. Vérifier l'option « Enforce a hard limit » sur le **bon projet** et les éventuelles limites de l'organisation, la disponibilité réelle et les prix à jour des deux modèles, ainsi que les réservations applicatives. Un plafond strict peut être appliqué avec retard ; aucune qualification payante n'est implicite.
3. Après validation du récepteur et du coffre indépendants, transférer la nouvelle clé depuis le **PC Windows** par le canal SSH/SFTP existant `orvekio-vps`, sans ressaisie manuelle dans KVM, sans paramètre de commande visible, et sans copier le secret dans le chat, le dépôt ou les logs. L'environnement Work n'hérite pas de cet accès ; si le circuit privé n'est pas disponible, ne pas contourner la protection.
4. Inspecter la topologie actuelle du VPS ; préparer une sauvegarde vérifiée. Monter le secret sur le worker Node uniquement, sans exposer Ollama ni le port du service, sans modifier le service SQUAIA. Vérifier la lecture du secret **sans afficher sa valeur** et qualifier l'authentification API sans génération facturable.
5. Refaire une nouvelle tentative **uniquement après autorisation payante séparée**, avec son propre registre, sans effacer le journal historique HTTP 401. Le plafond projet est de **1,00 USD**, pas une enveloppe de dépense autorisée ; vérifier les prix et le coût maximal de chaque essai avant d'envoyer la moindre requête. Comparer seulement les essais expressément approuvés et sélectionner après revue culinaire.
6. Ne basculer le routage HTTPS Studio -> worker qu'après authentification, tests de refus anonyme, disponibilité, rollback et sauvegarde vérifiée. Aucun workflow n8n n'est indispensable.
7. Le chemin TTS pour nouveaux ateliers (autorisation explicite, fichiers MP3 versionnés, écoute et réception) reste une étape de développement distincte. Ne jamais écraser les six MP3 historiques.

## Statut

Projet API **déjà créé** et plafond de 1,00 USD appliqué, d'après les captures du 4 novembre ; compte de service **non créé**, clé réelle non reçue. Le lecteur de secret, le paquet Docker et les garde-fous Traefik ont été **fusionnés dans `main`** via #215 et #217, mais **pas déployés**. Compte de service, circuit privé de clé, worker et route Traefik réels, restauration hors hôte, test API réel et nouveaux MP3 : **non réalisés ou non validés**. Lire aussi [`../deploy/coral/PREFLIGHT-SECRETS-ET-RESEAU.md`](../deploy/coral/PREFLIGHT-SECRETS-ET-RESEAU.md).

Sources :
- https://help.openai.com/en/articles/9186755-managing-projects-in-the-api-platform
- https://docs.docker.com/compose/how-tos/use-secrets
