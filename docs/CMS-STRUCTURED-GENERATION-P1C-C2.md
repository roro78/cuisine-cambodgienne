# P1C-C2 — Générer, relire puis enregistrer explicitement

29 octobre 2026 — [PR #151](https://github.com/roro78/cuisine-cambodgienne/pull/151).
Raccordement du socle `creation-form-core-v1` dans le Studio commun. Fournisseur
réel désactivé par défaut ; aucun transfert OVH ni appel modèle réel effectué.
La [PR #150](https://github.com/roro78/cuisine-cambodgienne/pull/150) a été revue
et fusionnée sur autorisation explicite du propriétaire : `main` synchronisé sur
`c0ab78054af9610a47ae9cb3536b74ef2858d43b`,
[CI après fusion SUCCESS](https://github.com/roro78/cuisine-cambodgienne/actions/runs/40785051928).
Les branches antérieures, `artifacts/`, historiques et configurations sont conservés.

## Parcours et composants partagés

1. Ouvrir une nouvelle création ou un projet/brief existant, choisir la famille.
2. Dans **le même formulaire `cms-new-editor`**, utiliser titre/angle et saisir
   objectif, contexte explicitement transmissible et référence publique.
3. Confirmer la revue des doublons/intentions et le droit de transmettre ce brief.
4. Un POST sous authentification/CSRF consomme une intention à usage unique,
   contrôle la version du brief, les doublons et la référence, puis réserve le
   quota commun avant d'appeler l'adaptateur serveur une seule fois.
5. La réponse devient un candidat validé par `cmsAiContentCandidate`, jamais
   directement une révision. Un redirect 303 ouvre sa relecture en GET : un
   rafraîchissement ne redemande pas une génération.
6. `cmsCreationFormHtml` permet de corriger les mêmes champs que le mode manuel ;
   `cmsGuidedPreviewHtml` fournit l'aperçu humain échappé. Les notes de recherche
   restent hors des champs destinés à l'aperçu public.
7. **Enregistrer une nouvelle version privée** appelle `cmsAiContentSave`, puis
   `cmsCreationSave` sous son verrou existant. La première sauvegarde d'un candidat
   est un `draft`, `reviewed: false`, canal `site` ; aucune publication ni audio.
8. Écarter une proposition restaure la saisie précédente dans ce formulaire,
   sans réécrire les révisions déjà enregistrées.

Les candidats sont bornés à trois par session, valables **au plus** 30 minutes et
dépendants de la durée réelle de la session PHP. Ils ne sont pas des brouillons
durables avant l'enregistrement explicite. Les liens des propositions en attente
sont visibles depuis la création. Un conflit de version ou une erreur conserve
les valeurs soumises ; il faut comparer la dernière version, pas relancer l'IA
automatiquement. La dernière ouverture du formulaire renouvelle son intention ;
un ancien formulaire d'un autre onglet peut être refusé sans appel fournisseur.
Le fonctionnement principal ne dépend pas de JavaScript ; le message de
génération en cours est une amélioration progressive, sans tâche de fond.

## Adaptateur indépendant et limites

Configuration privée existante, section facultative `editorial_ai_content` :

```php
'editorial_ai_content' => [
    'enabled' => false,
    'provider_label' => 'fournisseur-a-qualifier',
    'model_label' => 'modele-a-qualifier',
    'max_attempts_per_day' => 2,
    // 'adapter' => $adaptateurServeurQualifie,
],
```

Ne pas remplacer le `config.php`, ses comptes ou ses autres clés par cet exemple.
Une configuration absente/incomplète désactive l'outil et conserve la saisie
manuelle. Aucun endpoint, jeton, fournisseur ou modèle n'est lu depuis POST.
L'adaptateur reçoit le contrat C1, `timeout_seconds: 20`,
`max_output_tokens: 6000`, `response_max_bytes: 30000` et retourne uniquement le
JSON éditorial. Le modèle et le budget réels doivent être autorisés avant usage.

Le transport **facultatif** `content-gateway-adapter.php` prépare une future
passerelle n8n authentifiée : HTTPS, hôte fixé à `n8n.orvekio.com`, chemin webhook
borné, aucun paramètre d'URL/port/identifiant, TLS vérifié, pas de redirection,
connexion 5 s, total 20 s et réponse 30 000 octets maximum. Le secret Bearer reste
hors webroot et hors corps éditorial. L'accès direct à ce fichier renvoie 404.

**Aucun webhook correspondant n'a été créé, importé, activé ou appelé.** Ce
transport n'est pas une preuve de connectivité OVH/n8n, de qualité ou de coût ;
les workflows 01/02/03 et le workflow de benchmark 04 sont inchangés. L'adaptateur
OpenAI des briefs conserve son contrat à quatre textes ; il n'accepte pas C2.
Un autre adaptateur serveur peut être utilisé sans modifier les champs métier.

Un callable PHP personnalisé doit imposer lui-même son timeout réseau/TLS/plafond
de sortie. Le wrapper refuse une réponse tardive, mais ne peut pas interrompre
de force un callable bloqué. La passerelle cURL fournie impose les limites sur
son transport ; tout autre transport doit être revu/testé avant activation.
Il n'y a aucune relance automatique après timeout, réponse invalide ou exception.

## Quota, concurrence et références

- `cmsAiDailyLimit` prend la plus petite limite des modules actifs (1 à 5 par
  fenêtre glissante de 24 h). Briefs et contenus utilisent **le même fichier**
  privé `ai-brief-attempts.json`, son verrou exclusif et le délai minimal de 60 s.
  Une tentative échouée reste consommée ; ce plafond d'appels n'est pas un coût
  monétaire mesuré. Une configuration de quota active incohérente échoue fermement.
- Deux contrôles de doublons avant/après appel, sur titre d'entrée et titre
  proposé ; dernier contrôle du titre final et des alias IA sous le verrou du
  stockage commun. Les cas sémantiques proches exigent toujours un arbitrage.
  Des candidats temporaires d'autres sessions peuvent ne pas encore exister dans
  le catalogue privé ; la sauvegarde finale empêche la collision des projets.
- La version du brief sélectionné est vérifiée avant/après génération, puis à
  l'enregistrement. Un changement concurrent n'est jamais écrasé.
- Un atelier exige une recette `recipes` de la projection publique C1 ; son
  empreinte est conservée et comparée à l'index actuel lors de la sauvegarde.
  Les ingrédients et portions transmis viennent de cette référence, jamais
  d'un objet source entier. Cette référence publique ne vaut pas visa culinaire.
- La confirmation de transmission ne constitue ni une licence média vérifiée,
  ni une approbation historique/culinaire, ni une autorisation de publication.

## Provenance et versions privées

`cmsCreationSave` reçoit la provenance structurée **comme argument serveur**.
La section `ai_content` conserve fournisseur/modèle configurés, date, versions
des contrats et portée, ID/version/empreinte du brief, titre d'entrée servant
d'alias, référence/empreinte canonique et **proposition éditoriale validée**.
Le contexte d'entrée n'est pas recopié inutilement ; son empreinte permet de
tracer le brief. Aucune réponse brute, en-tête HTTP, secret ou log fournisseur.

`ai_content_edits` désigne les champs modifiés par rapport à cette proposition ;
chaque révision conserve ses valeurs et l'original proposé. Une sauvegarde
manuelle suivante maintient la provenance IA. Les anciens `ai_brief` peuvent
coexister ; un ancien projet manuel conserve ses versions originales et devient
IA seulement lors de la sauvegarde explicite d'une proposition structurée.
Les champs POST `origin`, `ai_content`, modèle et fournisseur ne font pas autorité.

Le plafond existant de 100 000 octets par révision et les permissions 0700/0600
sont conservés. Une correction trop volumineuse est refusée sans écrasement et
reste dans le formulaire. Aucun brouillon historique n'est migré ou supprimé.

## Réception et preuves à consulter

Local : 37 contrats Node PASS ; Astro 0 erreur/0 warning (24 hints) ; build
48 pages ; diff check. PHP absent sur Windows : la preuve PHP est exclusivement
la CI de la [PR #151](https://github.com/roro78/cuisine-cambodgienne/pull/151), au SHA exact.

Les nouveaux tests PHP 8.3/8.4 couvrent :

| Critère | Test |
|---|---|
| Cinq familles, nouveau candidat ou brief existant, save explicite, provenance et révisions | `editorial-ai-content-generation-smoke.php` |
| Quota partagé, deux processus concurrents, échec consommé sans retry, doublons et conflits | même smoke, fichiers temporaires uniquement |
| Référence atelier périmée, malformations/types/taille, champ sensible refusé et XSS | smokes C1 et C2 sur les vrais index du build |
| Authentification, CSRF, POST/redirect/GET, anti-rejeu, sauvegarde et abandon | `editorial-ai-content-controller-smoke.php` |
| Erreur JSON/réseau simulée avec formulaire et version antérieure conservés ; mode manuel désactivant l'IA | même parcours HTTP |
| Formulaires guidés de tout le catalogue, création manuelle, calendrier, briefs et transport historique | smokes existants conservés |

Le parcours HTTP lance un vrai serveur PHP sur loopback avec le contrôleur et
ses fonctions de session/CSRF. Seules les lectures des trois index publics et
l'adaptateur modèle sont remplacés dans une copie temporaire ; HTTPS est
**simulé**, pas réceptionné sur OVH. Cela ne constitue pas une QA visuelle mobile
ou une preuve TLS réelle. Aucun appel à un fournisseur réel n'est effectué.

## Visuels, moteur et étapes suivantes

`cmsVisualBriefDraft` prépare uniquement les données du futur lot visuel : sujet,
famille, description, fidélité, format, droits/provenance et type distinct
photo documentaire/photo réelle/illustration IA/visuel pédagogique. Le statut
reste `pending` ; aucune génération, sauvegarde média ou validation automatique.

L'accès n8n signalé reste une session connectée non pilotable avec les outils
exposés ici. Aucun accès IA configuré dans le processus, Ollama local inaccessible
au GET ; cela ne prouve pas l'indisponibilité du service distant. Aucun moteur
retenu et aucun résultat qualitatif ou coût inventé. Reprendre le benchmark des
briefs puis le [protocole structuré distinct](BENCHMARK-STRUCTURED-CONTENT-P1C.md).

Les [écarts Astro du socle C1](CMS-STRUCTURED-CONTENT-P1C-C1.md) restent applicables :
ce ne sont pas des articles complets ou des blueprints Coral V2 publiables.
La suite est qualification du fournisseur/recette contrôlée, compléments métier,
briefs visuels, aperçu Astro fidèle, puis publication après revue et autorisation.
Pour un futur déploiement, préparer un paquet ciblé cohérent, sauvegarder et
vérifier les fichiers distants. Le transport facultatif constitue un fichier
supplémentaire à livrer seulement s'il est explicitement retenu ; il ne fait pas
partie de l'ancien paquet à six fichiers. **Aucun transfert OVH dans ce lot.**
