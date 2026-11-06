# Studio — préparation des sept narrations Coral V2 avec un seul bouton

**NOTE HISTORIQUE :** ce document décrit la situation du 4 novembre. La [réception du Studio sur OVH du 6 novembre est clôturée](CMS-CORAL-STUDIO-RECEPTION-CLOTURE-20261106.md) ; le bouton s'intitule désormais « Préparer les 7 narrations ». Les ateliers publiés peuvent être repris en brouillon lié selon PR #220. La préparation automatique des narrations et le TTS sont toujours désactivés. Ne pas utiliser les anciens NO-GO pour rouvrir l'installation.


**4 novembre 2026 · correctif technique sans activation de fournisseur**

## Parcours attendu

Depuis un **nouvel atelier enregistré**, associé à une recette canonique et doté de six phases complètes, un seul bouton visible **« Préparer le MP3 »** soumet une demande au **moteur de tâches éditoriales existant**. La demande transmet la vraie recette, les phases enregistrées et les deux référentiels originaux **en entier**, depuis un fichier privé compilé. Elle ne produit **aucun MP3**, seulement sept textes parlés (introduction + six étapes), qui s'affichent dans les champs de brouillon à relire. Les textes ne sont enregistrés que par **« Enregistrer une nouvelle version privée »**, puis soumis aux visas humains existants. La synthèse Coral reste une étape indépendante.

Le même bouton n'est **pas** proposé pour les ateliers publiés : ils montrent leurs textes et MP3 historiques en lecture seule (PR #206). Une modification de l'un de ces ateliers exige un nouveau parcours explicite et une nouvelle révision, sans réutiliser les anciens visas.

## Source de vérité réutilisée

- `docs/ateliers/REFERENTIEL-ATELIER-CUISINE-ET-MP3.md` (entier).
- `docs/ateliers/REFERENTIEL-NARRATION-IMMERSIVE-V2.md` (entier, prioritaire pour la voix).
- Les vrais blueprints V2/V3 et leurs MP3 déjà publiés restent intacts, y compris Lok Lak V2.
- Le fichier `gestion-contenus/coral-v2-contract.json` est généré depuis ces documents, avec SHA-256, **jamais public** ; refus HTTP Apache. Aucun cahier des charges parallèle à maintenir à la main.

## Moteur existant, pas un nouveau backend

Les fonctions `cmsCoralRequest`, `cmsCoralCandidate`, `cmsCoralStart` et `cmsCoralPoll` sont dans un seul include PHP protégé `coral-v2-ai.php`. Elles partagent la configuration existante `editorial_ai_content`, les appels asynchrones `submit`/`poll` du service `editorial-ai-job-gateway.mjs`, la limitation des tentatives et ses clés d'idempotence. Aucun nouveau secret. Une seule soumission par intention, puis suivi en lecture seule ; un doute sur l'accusé interdit une resoumission automatique.

**Activation conditionnelle** : le bouton reste désactivé tant que `editorial_ai_content` n'est pas configuré et qualifié en mode asynchrone **et** `editorial_ai_content.coral_v2_qualified !== true`. Aucun fournisseur n'a été qualifié ni activé par ce correctif. Le service de tâches préparé sur Orvekio n'est pas présumé installé.

## Contrôles bloquants

La demande nécessite un brouillon réel enregistré, une recette publiée correspondant aux empreintes canoniques, les ingrédients et étapes correspondants et les six phases complètes. La présence de scripts existants empêche toute nouvelle génération destructrice. Un clic transmet uniquement le **brouillon sauvegardé**, jamais les modifications en cours dans le navigateur. Le candidat est lié à l'empreinte de la source et à sa version ; une version modifiée ou une tâche expirée bloque sa récupération.

La sortie exige exactement sept textes de 300 à 7000 caractères (minimum 400 sur les phases), avec IDs fixes. Refus : vocabulaire de fabrication/BTP, liste récitée, quantité variable prononcée en grammes/volume/ingrédients comptés et fausse interaction temps réel. **Ces tests mécaniques ne prouvent ni la justesse culinaire ni la sécurité alimentaire**. L'approbation humaine reste indispensable et le mot « Valider et générer » ne doit être relié au TTS qu'après qualification Coral complète.

## Réception à mener avant production

- CI Astro/Node, PHP 8.3/8.4, génération de l'artefact contrôlé et tests navigateur.
- Test d'intégration avec une tâche simulée, sans appel Ollama réel ni dépenses.
- Test réel sur le fournisseur existant **à part**, après mise en service/authentification sécurisée du service Orvekio et qualification de latence/qualité humaine. Le modèle local historique était trop lent pour promettre les sept textes complets en un appel ; risque de dépassement de la limite de 300 secondes.
- Audit de la réponse par un humain, protection des documents complets, refus 403 anonyme des deux nouveaux fichiers.
- Un paquet manuel OVH comporte désormais **dix chemins stricts** (sept initiaux + snapshot historique #206 + code Coral V2 privé + référentiels compilés). Sauvegarde FileZilla vérifiée avant écrasement, et aucune mutation PostgreSQL, n8n/Meta, ni MP3.

**État : code sous PR, pas de production ni de génération vocale activée.**
