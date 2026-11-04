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

1. Ouvrir le bon compte OpenAI API avec authentification du propriétaire. Créer un projet API dédié « Cuisine du Cambodge » et un compte de service distinct de SQUAIA. Ne jamais reprendre la clé du service Render. Configurer les permissions Responses et, à terme, audio uniquement si nécessaire ; vérifier accès modèles et facturation.
2. Définir une limite de dépenses projet réellement contraignante (option « Enforce a hard limit » si disponible), des alertes, ainsi que les limites par tâche déjà intégrées à notre backend. Un hard limit peut être appliqué avec un léger retard : maintenir les verrous applicatifs.
3. Installer la nouvelle clé par un circuit de transfert **privé** fourni par Work, sans ressaisie manuelle dans KVM, sans paramètre de commande visible, et sans copier le secret dans le chat, le dépôt ou les logs. Si aucun circuit sûr n'existe, ne pas contourner la protection.
4. Inspecter la topologie actuelle du VPS ; préparer une sauvegarde vérifiée. Monter le secret sur le worker Node uniquement, sans exposer Ollama ni le port du service, sans modifier le service SQUAIA. Vérifier la lecture du secret **sans afficher sa valeur** et qualifier l'authentification API sans génération facturable.
5. Refaire une nouvelle tentative d'essai avec son **propre registre**, sans effacer le journal précédent du HTTP 401, dans le budget total de 1 EUR autorisé. Comparer un chapitre par modèle et sélectionner après revue culinaire.
6. Ne basculer le routage HTTPS Studio -> worker qu'après authentification, tests de refus anonyme, disponibilité, rollback et sauvegarde vérifiée. Aucun workflow n8n n'est indispensable.
7. Le chemin TTS pour nouveaux ateliers (autorisation explicite, fichiers MP3 versionnés, écoute et réception) reste une étape de développement distincte. Ne jamais écraser les six MP3 historiques.

## Statut

Lecteur de secret côté code et tests : en PR, non déployés. Projet API dédié, compte de service, copie du secret, worker en production, route Traefik, test API réel et nouveaux MP3 : **non réalisés et non validés**.

Sources :
- https://help.openai.com/en/articles/9186755-managing-projects-in-the-api-platform
- https://docs.docker.com/compose/how-tos/use-secrets
