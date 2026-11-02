# IA structurée du Studio — verdict du 2 novembre 2026

**NO-GO activation. Le mode manuel et les garde-fous existants restent inchangés. Aucun fournisseur activé.**

## Contrat conservé

Le Studio continue d’utiliser exclusivement `cmsAiContentSettings`, `cmsAiContentGenerate`, les cinq schémas et `content-gateway-adapter.php`. Délai du contrat CMS : 20 s ; sortie 30 000 octets ; budget 6 000 tokens ; quota partagé avec les briefs, double anti-doublon, candidat temporaire corrigible puis sauvegarde humaine explicite. Aucun prompt libre parallèle, nouvel éditeur ou assouplissement des contrats.

## Audit réel en lecture seule

- Le conteneur n8n a reçu HTTP 200 de `http://ollama:11434/api/tags` en 146 ms. Le réseau interne n8n → Ollama est donc joignable pour ce GET. Seul `llama3.2:latest` est listé (2 019 393 189 octets). Aucun modèle téléchargé, chargé par génération ou remplacé.
- Les conteneurs n8n et Ollama existaient et tournaient déjà. Aucun redémarrage, modification d’environnement ou lancement de workflow.
- Sur OVH, aucune section littérale `editorial_ai_content` n’a été trouvée dans la configuration privée inspectée ; le transport `gestion-contenus/content-gateway-adapter.php` est absent. Aucun secret n’a été affiché, enregistré dans ce rapport ou modifié. Le chargement récapitulatif PHP n’a pas fourni de résultat confirmé ; cette limite est conservée et ne vaut pas preuve d’une configuration callable valide.
- Aucune preuve d’un endpoint HTTPS authentifié conforme au transport C2 ni d’une réception privée mobile n’a été obtenue. La joignabilité interne du modèle ne démontre pas l’existence de la passerelle OVH.

## Réutilisation des preuves S1 existantes

Aucune campagne redondante n’a été lancée. Les fichiers déjà présents sur Orvekio ont été lus pour leurs seuls codes de sortie et métadonnées, sans exporter les propositions privées.

| Preuve existante | Résultat observé | Conséquence |
| --- | --- | --- |
| `cdc-s1-425fecf-20261101`, recette | sortie 1 ; abort/timeout | Non qualifiée |
| même série, atelier | sortie 1 ; abort/timeout | Non qualifiée |
| même série, culture | sortie 1 ; abort/timeout | Non qualifiée |
| même série, ingrédient | sortie 1 ; abort/timeout | Non qualifiée |
| même série, technique | sortie 1 ; abort/timeout | Non qualifiée |
| `cdc-s1-pr187-96a34fb-20261101`, culture | réponse 1 616 octets, **65 118 ms**, validation PHP S1 réussie, revue humaine requise, `publication_ready: false` | Conformité mécanique acquise pour cet essai seulement ; délai incompatible avec C2 et qualification cinq familles absente |

Le fichier de provenance du pilote culture conserve `schema_validation: NOT_RUN` : le résultat du validateur ultérieur est attesté séparément par `php-validation.json` (`schema_valid: true`, sortie PHP 0). Ne pas réécrire cette provenance ni transformer ce PASS mécanique en approbation éditoriale.

Les PR #180 et #182–#189 restent ouvertes et empilées. #187 porte un délai d’essai optionnel de 180 s, tout en gardant le contrat CMS à 20 s. Ces modifications non fusionnées ne sont pas réintroduites silencieusement dans main. La proposition de triage #189 ne valide ni les faits ni la publication.

## Blocages exacts et suite conditionnelle

1. Absence de qualification réussie des cinq familles dans le délai CMS ; le seul pilote mécanique réussi observé dure 65,1 s.
2. Adaptateur facultatif absent d’OVH et aucune preuve de passerelle HTTPS/Bearer compatible avec les plafonds C2.
3. Configuration privée callable/quotas non attestée et recette privée humaine non disponible.

Conserver la génération désactivée. Après réception du dashboard puis de Publications, choisir un raccordement qui respecte réellement les 20 s, réutiliser toutes les preuves encore valides et ne qualifier que les écarts manquants. Une modification du contrat de délai doit être discutée et testée séparément ; ne pas augmenter le timeout pour présenter l’ancien pilote comme conforme. N’activer la configuration privée qu’après ces gates, sauvegarde et décision dédiée.

Aucun appel de génération pendant cet audit, aucune écriture de brouillon, aucun changement n8n social, Supabase, Ollama, Meta, MP3 ou configuration OVH. Le diagnostic en lecture seule est distinct d’une fonctionnalité active.
