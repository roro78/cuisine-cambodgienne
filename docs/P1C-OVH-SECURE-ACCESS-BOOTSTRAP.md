# P1C — Accès technique sécurisé OVH depuis GitHub (préparation)

Statut : **préparé, non connecté, non déployé**. Aucun accès SSH, clé privée ou identifiant OVH n'a été obtenu dans cette branche.

## Contexte confirmé

- Le propriétaire accède au VPS via l'espace client OVHcloud, depuis Android.
- Les transferts du site Astro ont été effectués par FTP ; cet accès ne constitue pas un accès d'exécution au VPS Docker Orvekio.
- L'instance n8n authentifiée présente des workflows MiHecho/AhoraGO appelant `http://ollama:11434/v1/chat/completions`, mais la santé et les modèles Ollama ne sont pas qualifiés.
- Les cinq familles P1C doivent passer par le banc existant, avec validation PHP et revue éditoriale, avant toute activation.

## Principe d'accès recommandé

**Ne pas** configurer de connexion SSH root permanente depuis GitHub Actions. Créer un compte technique dédié sur le VPS avec une clé SSH **générée dans un environnement de confiance** et une commande autorisée limitée aux essais de qualification, puis stocker la clé privée uniquement dans les secrets GitHub de l'environnement protégé (jamais dans le dépôt, les logs, une issue ou le chat). Épingler la clé hôte SSH après vérification indépendante de son empreinte ; ne jamais utiliser `StrictHostKeyChecking=no`.

La console/KVM de secours éventuellement disponible dans l'espace client OVHcloud est une **possibilité à vérifier selon l'offre**, pas une session SSH ni une preuve d'accès administrateur. Une première intervention administrative reste indispensable pour créer le compte, enregistrer la clé publique et installer la commande autorisée. Aucun mot de passe ne doit être transmis au chat.

## Ordre de réalisation

1. Vérifier dans l'espace client OVHcloud le VPS concerné et la présence d'une console/KVM ; ne pas réinitialiser le serveur, ne pas modifier le pare-feu ni réinstaller l'OS.
2. Depuis une session d'administration déjà autorisée, sauvegarder la configuration SSH et créer un utilisateur de service sans privilèges root. Préférer une commande forcée `authorized_keys command=...`, restrictions de forwarding et de pseudo-terminal, et permissions minimales sur les volumes. Si le banc requiert Docker, éviter l'appartenance au groupe `docker` (équivalent à des privilèges élevés) : utiliser une commande de test isolée et précisément autorisée.
3. Mettre en place une clé dédiée, son empreinte hôte vérifiée et les secrets d'un environnement GitHub protégé, soumis à approbation humaine. Ne pas permettre aux PR non fiables d'accéder aux secrets. Fixer un délai d'expiration et une procédure de révocation.
4. Tester d'abord un simple diagnostic non sensible (identité de la commande autorisée, disponibilité réseau interne et inventaire du modèle via Ollama), sans sortie de secret et sans mutation.
5. Exécuter séquentiellement les cinq familles à l'aide des scripts **existants** : `scripts/benchmark-ollama-structured.mjs` et `scripts/editorial-ai-structured-benchmark.php`. Conserver les preuves privées hors Git et les rendre accessibles uniquement à l'administrateur ; ne pas publier les prompts/réponses dans les artefacts publics de CI.
6. Valider le JSON brut, les latences et la qualité éditoriale ; puis seulement qualifier le service authentifié compatible avec `cmsAiContentGatewayAdapter`, le repli manuel et la recette mobile.

## Critères d'arrêt

- Si seule une interface FTP de l'hébergement web est accessible, **ne pas prétendre** pouvoir exécuter les scripts sur le VPS.
- Si aucun accès administrateur VPS autorisé n'est disponible, **ne pas** créer de workflow GitHub Actions SSH inutilisable ni inventer une clé ; l'étape bloquante est l'amorçage de l'accès.
- Ne pas exposer Ollama publiquement, ouvrir 11434, copier des secrets ou toucher aux workflows sociaux 01/02/03, à Coral MP3 ou à la production.

## Reprise

À la prochaine session, vérifier l'option Console/KVM dans l'espace OVHcloud et la méthode d'authentification système disponible. Préparer ensuite le bootstrap concret correspondant à la distribution et aux droits réellement observés, plutôt qu'un script générique risquant de couper l'accès au VPS.
