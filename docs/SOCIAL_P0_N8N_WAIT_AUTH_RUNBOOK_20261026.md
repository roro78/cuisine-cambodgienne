# Cuisine du Cambodge — réception sécurisée du formulaire de validation n8n (P0)

**État : PROCÉDURE PRÉPARÉE, NON EXÉCUTÉE.**  
**Référence :** PR #129, branche `review/social-approval-email-preview-20261025`.  
**Périmètre :** workflow « Cuisine du Cambodge - 01 - Brouillon IA et validation email », et uniquement son nœud « Attendre une décision via formulaire ».  
**Interdits :** n8n ne doit pas être activé ni exécuté pendant cette installation ; pas d’envoi Resend, pas de publication Facebook/Instagram, pas de modification des contenus approuvés ni de la réservation existante Kroeung, pas de mutation Supabase, pas de déploiement OVH.

## 1. Conditions préalables — toute anomalie interrompt l'opération

1. Vérifier sur l'interface réelle de n8n la version installée et le mode `Wait` : `resume=form`, type de nœud `n8n-nodes-base.wait`, version du nœud 1.1 ; trois choix existants « Approuver », « Demander une modification », « Refuser » ; délai 72 heures. La présence d'une option dans les sources n8n 2.32.7 ne prouve pas son fonctionnement sur l'instance.
2. Vérifier que les workflows 01, 02 et 03 sont bien inactifs. Empêcher **effectivement** tout déclenchement de 01 le temps de la maintenance, y compris une exécution manuelle. La simple lecture de `active=false` ne suffit pas à prévenir les exécutions manuelles.
3. Dans n8n, vérifier indépendamment qu'aucune exécution de 01 n'est en attente/active, y compris les reprises `Wait` non visibles à cause des politiques de rétention. L'absence de résultat API ne suffit pas.
4. Vérifier que la validation Kroeung déjà effectuée n'a pas une reprise encore active. Ne pas renvoyer de mail, requalifier `validation_dispatches`, réessayer ou republier.
5. L'API n8n doit autoriser la lecture des workflows, exécutions et métadonnées de credentials. Un refus 401/403 ou un champ absent impose l'arrêt. Aucun secret ne doit être envoyé dans GitHub, le chat ou les logs CI.

## 2. Credential dédié (manuellement dans n8n)

Créer ou retrouver **un seul** credential n8n de type **HTTP Basic Auth** portant exactement le nom :

`Cuisine du Cambodge - Validation formulaire (Basic Auth)`

Choisir un identifiant de connexion spécifique à ce formulaire et un mot de passe fort et unique dans l'interface n8n, enregistrés uniquement dans le coffre n8n / gestionnaire privé de l'opérateur. Ne pas partager les valeurs et ne pas réutiliser les credentials Meta ou Resend.

Relever uniquement l'**ID opaque** du credential dans n8n (ce n'est pas son mot de passe). Si un credential portant ce nom existe déjà, en confirmer le type et l'usage ; ne pas en créer un second silencieusement.

## 3. Audit GET-only (sur un poste privé avec Node 22 et le dépôt à jour)

La clé API doit être saisie et chargée **localement**, hors terminal enregistré/loggé et hors chat. Variables attendues : `N8N_API_KEY`, `N8N_WAIT_BASIC_CREDENTIAL_ID` ; éventuellement `N8N_BASE_URL=https://n8n.orvekio.com`.

À exécuter sans autre argument :

```sh
node scripts/audit-cuisine-social-wait-form-auth.mjs
```

Cet audit :
- recense le workflow par nom exact, y compris pagination ;
- refuse les exécutions `waiting/running`, puis énumère sans filtre tous les états conservés avec pagination bornée ;
- refuse les états non terminés/inconnus, les curseurs répétés et les lignes n'appartenant pas au workflow ;
- vérifie l'ID, le nom et le type du credential **sans jamais lire son secret** ;
- compare le nœud Wait et le graphe avec le référentiel versionné et vérifie le contenu de l'email déjà configuré ;
- **ne dispose d'aucune opération d'écriture**.

**Ne pas dépasser cette étape** tant que l'opérateur n'a pas confirmé séparément l'état des exécutions en cours dans l'interface n8n.

## 4. Application, distincte de l'audit — non autorisée automatiquement

Après maintenance effective, vérification humaine et validation explicite d'une mise à jour **unique** :

```sh
N8N_FORM_AUTH_MAINTENANCE_CONFIRMED=YES_NO_RUNNING_WAITS \
node scripts/migrate-cuisine-social-wait-form-auth.mjs \
  --apply --approve-single-wait-auth-update
```

*Cette commande est un exemple pour un shell POSIX ; dans Windows PowerShell, définir d'abord la variable d'environnement localement puis exécuter `node ...`.*

Le script refait les audits GET, revérifie la version du workflow, sauvegarde le snapshot dans `~/.local/share/cuisine-n8n-backups` avec permissions **0600**, change uniquement `incomingAuthentication=basicAuth` et l'identifiant du credential `httpBasicAuth` du **même Wait**, puis vérifie le graphe reçu en lecture. Il n'active ni n'exécute le workflow.

**Limite importante :** la mise à jour via API REST n8n peut ne pas être transactionnelle malgré le `versionId` comparé. Seule une fenêtre de maintenance effective protège contre une exécution créée entre le dernier GET et le PUT.

## 5. Vérification obligatoire après mise à jour (en environnement contrôlé)

Comparer le Wait reçu à sa version de référence ; les champs et choix du formulaire doivent être inchangés. Confirmer `active=false`, l'absence de changement des connexions et des credentials Resend/Meta. Le lien de formulaire issu **d'une exécution de test isolée, sans aucun trajet vers Resend/Meta/Supabase**, doit :

- Refuser l'affichage GET sans Basic Auth (401).
- Refuser la soumission POST non authentifiée (401).
- Autoriser la consultation authentifiée ; vérifier dans le navigateur et sur Android qu'une soumission contrôlée suit seulement le circuit Wait prévu et que les autres méthodes ne permettent pas d'approuver.
- Ne jamais laisser une URL de reprise, un identifiant de connexion ou une capture contenant des tokens dans un log, un ticket ou GitHub.

**Attention :** une soumission POST authentifiée à un véritable lien Wait peut déclencher la décision ; ne jamais la tester sur un brouillon de production déjà existant.

## 6. Retour arrière et critères de réception

En cas d'échec après PUT : bloquer toute nouvelle exécution, préserver la sauvegarde et les journaux **sans secrets**, comparer manuellement les nœuds et la présence de reprises Wait. **Ne pas restaurer automatiquement** un snapshot si une validation est déjà en cours ou si le workflow a évolué ; préparer alors une restauration ciblée soumise à revue.

L'étape **Wait Basic Auth** est reçue seulement si tous les contrôles suivants sont réunis : credential unique et dédié, absence réelle de reprises en attente, snapshot privé, écart limité au seul nœud Wait, forme GET/POST vérifiée sans publication, workflow toujours inactif, audit de la réservation Resend historique inchangé.

L'étape **dashboard approuver/modifier/refuser** n'est PAS couverte : le portail PHP reste en lecture seule. Les futurs boutons devront accéder au circuit Wait authentifié avec un lien **versionné et contrôlé côté serveur**, jamais publier ni écrire directement dans `posts` depuis le navigateur.

## 7. Situation connue au 26 octobre 2026

Le GitHub Actions [P0 #40298571003](https://github.com/roro78/cuisine-cambodgienne/actions/runs/40298571003) est **SUCCESS** : 85/85 tests Node, tests HTTP PHP du blocage après cinq échecs + refus du compteur corrompu, lint PHP, et PostgreSQL 17 éphémère (RLS/SELECT-only et immutabilité) PASS.

Ces résultats concernent uniquement des environnements de test. L'authentification du Wait **n'est pas encore installée sur le runtime**, le poste OVH réel n'a pas été testé, et aucun contenu n'a été publié par ce chantier.
