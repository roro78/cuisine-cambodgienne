# Coral V2 — génération texte externe sécurisée, sans nouveau moteur CMS

4 novembre 2026. Complément du ticket #205. **Code non activé en production**.

## Choix technique

Le test réel du VPS a confirmé que `llama3.2:latest` sur 4 vCPU consacre le délai disponible au traitement d'un prompt d'environ 38 148 caractères. La comparaison externe porte sur le **même chapitre « assembler » de Lok Lak**, avec recette canonique et adaptation pédagogique intégrales, et les deux référentiels d'origine.

Modèles documentés au 4 novembre 2026 :

| Modèle | Entrée / 1 M tokens | Sortie / 1 M tokens |
| --- | ---: | ---: |
| `gpt-6-luna` | 0,10 $ | 0,50 $ |
| `gpt-6.1-terra` | 1,00 $ | 5,00 $ |

Source primaire : https://developers.openai.com/api/docs/pricing. Les montants sont des tarifs standards en USD, pas une garantie de disponibilité du modèle sur le compte.

La qualification manuelle `scripts/qualify-coral-external-text.mjs` :
- `--dry-run` sans clé ni réseau par défaut ;
- `--run` avec `OPENAI_API_KEY` injectée en variable d'environnement dans une session Work/VPS authentifiée ;
- **maximum deux tentatives**, une par modèle, documentées **avant** les requêtes dans des fichiers `0600` hors webroot ;
- réserve le coût maximal calculé sur la taille des requêtes et les 1 800 tokens de sortie, **plafond conservateur 0,25 USD au total**, nettement inférieur aux 1 EUR autorisés pour ce diagnostic ;
- un échec ambigu ne déclenche ni réessai ni second modèle ; les textes restent des brouillons **sans visa** et aucune sortie MP3 n'est créée.

Ce plafond applicatif ne remplace pas un plafond budgétaire configuré au niveau du compte API. Ne pas utiliser d'identifiant ou de clé appartenant à un autre produit sans autorisation de l'administrateur.

## Raccordement au service existant

`scripts/coral-external-job-provider.mjs` implémente sept appels texte dans **le même** service `scripts/editorial-ai-job-gateway.mjs`, sans n8n comme moteur d'inférence, avec les schémas et contrôles vocaux existants. Le code est désactivé par défaut et conserve l'ancien fournisseur Ollama.

Pour envisager une activation *après* une qualification réelle et revue humaine :
- `CDC_EDITORIAL_JOB_PROVIDER=openai-coral`
- `CDC_CORAL_EXTERNAL_QUALIFIED=true` **uniquement après GO motivé**
- `CDC_CORAL_EXTERNAL_ENABLED=true` **uniquement sur l'environnement autorisé**
- `CDC_CORAL_EXTERNAL_MODEL` : l'un des deux identifiants allowlistés
- `OPENAI_API_KEY` : secret serveur, jamais dans le dépôt ou le chat
- `CDC_CORAL_EXTERNAL_BUDGET_DIR` : répertoire privé `0700`, hors webroot
- `CDC_CORAL_EXTERNAL_DAILY_USD` : montant en USD strictement positif, maximum **0,75** ; chaque tâche réserve **toutes ses sept demandes** avant de commencer, même si elle échoue ensuite

Le service reste lié à `127.0.0.1:18678`, comme avant. Une route HTTPS **authentifiée et vérifiée** devra être raccordée par Traefik depuis l'hébergement OVH mutualisé vers le service Node, sans ouvrir Ollama ou la file en direct. Utiliser le routeur existant si possible, sans workflow n8n. La qualification externe ne prouve pas que cette route est opérationnelle.

## Frontière de sécurité et travail restant

- Les candidats issus du modèle doivent encore passer par le brouillon du Studio, les **sept visas humains**, la validation culinaire, les droits et le contrôle de source.
- La génération audio **pour de nouveaux ateliers** n'est **pas** encore connectée au bouton « Valider et générer ». Ne jamais détourner la passerelle historique limitée aux six ateliers complets.
- Zéro appel payant, zéro TTS, zéro déploiement OVH pendant cette modification. Les six MP3 historiques restent inchangés.
- Le laboratoire de qualification doit mesurer coût réel retourné par l'API, durée et contenu de chaque candidat ; après relecture, choisir un seul modèle ou NO-GO.
- Si aucun compte API/authentification/budget réel n'est disponible dans l'environnement Work, arrêter le test, consigner précisément le blocage et conserver les modes désactivés.
