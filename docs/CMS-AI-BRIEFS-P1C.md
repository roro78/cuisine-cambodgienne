# P1C-B — Brief IA privé dans le Studio commun

**28 octobre 2026 — premier lot P1C fusionné dans GitHub, non déployé sur OVH.** Le calendrier a été réceptionné par le propriétaire après le correctif `106537c`. Ce lot prépare les briefs ; la rédaction des champs métier complets reste le jalon C. Il ne publie ni page, ni média, ni audio, ni post social.

## Périmètre livré

`?new=1` conserve le formulaire manuel commun et propose un volet « Préparer un brief avec l'IA ». Lorsqu'un adaptateur serveur est configuré, le sujet, l'angle, l'objectif, un contexte explicite et une référence publique facultative servent à proposer quatre textes : titre, angle, résumé et notes de vérification privées. Pour un atelier, la référence doit être une recette publiée du catalogue. Le formulaire demande une confirmation de vérification humaine des variantes de noms et de l'intention éditoriale : cette confirmation d'idée **n'est pas une approbation du contenu**.

Les seuls textes validés sont enregistrés avec `cmsCreationSave`, dans les mêmes révisions privées `editorial-drafts/new-content`. Les champs métier restent vides, le statut est obligatoirement `draft`, `reviewed` reste `false`, le canal reste `site` et aucune date n'est déduite. Le titre, l'angle, le résumé et les notes sont ensuite modifiables dans l'éditeur commun. Le formulaire de la famille et la projection du calendrier restent partagés.

La provenance `origin: ai` et le brief d'entrée sont conservés dans les versions suivantes, y compris après une sauvegarde manuelle. Aucun champ POST ne peut choisir cette provenance ; elle provient du chemin serveur de génération. Le titre de travail initial reste un alias anti-doublon si le fournisseur propose un titre différent. Les versions manuelles déjà enregistrées restent intactes et ne sont pas migrées.

## Audit fournisseur et activation

L'export du workflow n8n 01 possède une rédaction de légendes via Ollama. Cela n'établit pas une API de briefs utilisable depuis OVH. Aucun service, accès, modèle de rédaction longue, coût ou transport OVH → fournisseur n'a été validé dans ce lot. Aucun workflow n8n n'est modifié ou exécuté.

**Par défaut, le volet annonce que l'assistance est indisponible et la saisie manuelle reste accessible.** Il n'affiche aucune réponse simulée en production. L'adaptateur est un callable PHP fourni exclusivement par la configuration privée déjà existante, hors webroot ; il n'est ni choisi ni décrit par le navigateur. Aucun nouveau serveur ou SDK n'est installé. Le raccordement effectif au fournisseur doit être implémenté/revu et réceptionné séparément avant activation.

Exemple de réglages **désactivés** à intégrer uniquement au `config.php` privé existant, sans remplacer ses autres clés :

```php
'editorial_ai_briefs' => [
    'enabled' => false,
    'model_label' => 'modele-editorial-a-valider',
    'max_attempts_per_day' => 3,
    // 'adapter' => $adaptateurServeurValide,
],
```

Avec `enabled: true`, l'adaptateur doit être callable, le libellé du modèle borné et la limite comprise entre 1 et 5. Une configuration incomplète échoue fermement ; elle ne bascule pas sur une simulation. Ne jamais mettre de clé, URL signée ou secret dans le libellé du modèle, dans les champs du brief, dans GitHub ou dans le navigateur.

## Contrat de l'adaptateur serveur

L'adaptateur reçoit un tableau `cdc-editorial-ai-brief-request-v1` contenant le brief explicitement soumis, une projection de la référence publique choisie (`id/kind/title/summary`), des consignes fixes et les bornes `max_output_tokens: 1200`, `timeout_seconds: 20`. Il **ne reçoit pas** la configuration privée, les sessions, les secrets, le catalogue des projets privés ou leurs notes. Aucun contenu privé déjà enregistré n'est envoyé au fournisseur.

Il doit retourner une **chaîne JSON** avec exactement quatre chaînes :

| Clé | Maximum de caractères |
|---|---:|
| `title` | 180 |
| `angle` | 700 |
| `summary` | 2000 |
| `research_note` | 3000 |

La réponse est limitée à 16 000 octets avant décodage et à une profondeur JSON bornée. Clés supplémentaires, structures, valeurs vides, types inattendus, JSON invalide et dépassements sont refusés. Aucun PHP, TypeScript, modèle source complet ou autorisation de publication n'est accepté. L'affichage reprend les composants d'échappement existants.

**Responsabilité du futur transport :** respecter lui-même le timeout HTTP de 20 secondes, le plafond de sortie, la vérification TLS et l'absence de relance automatique. Le wrapper rejette une réponse tardive mais ne peut pas interrompre de force un callable PHP bloqué ; ce lot n'est donc pas une preuve de timeout réseau ou de budget monétaire réel. Ces points sont à tester avec le véritable adaptateur avant activation.

## Garde-fous exécutés côté serveur

- Authentification, HTTPS et CSRF communs du Studio, avant le chemin de génération ; aucune route publique supplémentaire.
- Comparaison des titres/slugs avec le catalogue publié, les dernières créations privées et les anciens sujets de briefs IA **avant** de réserver un appel. Revue humaine obligatoire pour les alias khmers, la similarité et l'intention ; aucune garantie d'unicité sémantique automatique.
- Vérification des doublons répétée sous le verrou du catalogue après la réponse, y compris si un projet est créé pendant l'appel ou si le fournisseur propose un autre titre.
- Quota global persistant, partagé entre sessions, dans `editorial-drafts/ai-brief-attempts.json` (0600, dossier 0700), verrouillé avant réservation : 1 à 5 tentatives par fenêtre glissante de 24 h et au moins 60 secondes entre deux réservations.
- Une tentative en erreur ou avec réponse invalide reste consommée. Aucun retry automatique, aucune remise à zéro silencieuse d'un quota corrompu. Un plafond d'appels n'est pas une estimation du coût facturé.
- Messages d'erreur fixes et non sensibles ; aucune réponse brute ou exception du fournisseur dans l'interface ou les logs. Une combinaison des actions manuelle/IA dans le même POST est rejetée sans sauvegarde.

## Preuves et réception restant à obtenir

Les smokes PHP 8.3/8.4 utilisent uniquement des adaptateurs simulés et le vrai catalogue du build. Ils couvrent les cinq familles, référence recette pour atelier, absence de fuite de configuration/brouillons, refus avant appel, schéma de sortie, XSS, quotas, erreur sans retry, course entre projets, provenance et historique, formulaire commun et calendrier sans date. Les contrats Node existants restent obligatoires.

**Première preuve acquise :** [CI #40768379266](https://github.com/roro78/cuisine-cambodgienne/actions/runs/40768379266), commit `c53cbd89719ea3a56c4c3784c10de6481f130abd`, **SUCCESS** pour le job principal et PHP 8.3/8.4, avec `CMS_AI_BRIEFS_OFFLINE_PASS` sur les cinq familles. La [PR #147](https://github.com/roro78/cuisine-cambodgienne/pull/147) a été réévaluée sur `main` après fusion de #146 et intégrée après CI réussie (reprise PHP 8.3/8.4).

**Aucun appel à un vrai modèle, aucun test privé mobile de cette interface, aucune configuration OVH et aucun déploiement P1C ne sont attestés par ces smokes.** La réception du calendrier du jalon A reste acquise séparément.

Suite : examiner le [transport OpenAI optionnel et sa recette contrôlée](CMS-OPENAI-ADAPTER-P1C.md) (non activé), puis réaliser le jalon C (champs métier des cinq familles). Direction artistique, génération d'images, aperçu Astro, conversion/publication et calendrier média avancé restent leurs propres étapes.
