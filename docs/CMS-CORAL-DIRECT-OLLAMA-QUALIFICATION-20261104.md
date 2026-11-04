# Qualification directe d'Ollama pour les ateliers Coral V2

**4 novembre 2026 — protocole expérimental, pas une mise en production.**

## Architecture retenue

La génération des sept textes peut passer directement par le service **privé** `ollama:11434` sur le VPS Orvekio. **Aucun workflow n8n n'est nécessaire** : la passerelle existante `scripts/editorial-ai-job-gateway.mjs` dialogue déjà avec Ollama en réseau Docker. Dans le Studio, le bouton unique nécessite néanmoins un transport HTTPS authentifié entre l'OVH mutualisé et le service asynchrone ; le module `content-gateway-adapter.php` est actuellement figé sur l'hôte `n8n.orvekio.com` et la route `/editorial-ai/v1/jobs`. Cette route HTTP doit être routée par Traefik **vers le service de tâches, et non vers n8n**, si l'architecture déployée l'autorise. Elle n'est **pas attestée installée**.

Ne pas exposer le port Ollama `11434`, le port de tâches `18678` ou un token public. Ne pas toucher à PostgreSQL, Supabase, Meta, n8n ni aux MP3 historiques.

## Blocage et objectif

Le dernier essai observé le 1er novembre sur `llama3.2:latest` quantifié sur CPU avait produit 455 tokens en 65,1 s, soit environ **7 tokens/s**. La demande actuelle inclut les **deux référentiels complets**, la recette, les six phases et sept chapitres narratifs : sa taille et sa latence peuvent excéder la fenêtre de 300 s, sans garantie de justesse culinaire. Aucun benchmark synthétique ne remplace un appel au **vrai modèle sur le VPS**.

Le script `scripts/qualify-coral-ollama-direct.mjs` est un **outil de qualification** ; il lit les mêmes documents normatifs que le Studio, reprend un atelier Lok Lak réel sans fournir ses scripts audio comme sortie attendue, et appelle **directement l'API privée Ollama**. Il refuse toute URL publique. Il génère au plus **un chapitre** par défaut. Aucun appel TTS et aucune mutation des textes/MP3 du site.

## Exécution après accès authentifié au VPS

Sur une machine qui possède déjà ce dépôt et qui peut accéder à Ollama en local :

```bash
node scripts/qualify-coral-ollama-direct.mjs --probe
```

Pour lancer une seconde phase après contrôle humain du premier résultat et validation de la durée/coût CPU, la commande explicite suivante produit **sept appels séparés**, un par chapitre, en s'arrêtant dès le premier contrôle mécanique invalide :

```bash
node scripts/qualify-coral-ollama-direct.mjs --full --approve-seven-calls
```

Le résultat est écrit dans un dossier temporaire privé (permissions 0600). La console affiche les durées, le débit mesuré, les incidents mécaniques et l'emplacement du rapport, **jamais les narrations brutes**. Ne pas transférer ce dossier sur GitHub, dans les logs publics ni dans le répertoire web.

## Réception et décision

1. Modèle trouvé, API locale répond, aucune redirection vers n8n, zéro appel audio ; confirmer mémoire et CPU par relevé opérateur.
2. Rapports directs avec `realProviderCalls > 0`, durées et tokens/s mesurés ; aucun résultat tronqué.
3. Sur l'essai complet, exactement sept textes, ordre imposé, lexique culinaire conforme, sans quantités inventées ni récitation de formulaire.
4. **Relecture humaine obligatoire** : exactitude de la recette, sécurité alimentaire, allergènes, gestes, erreurs/rattrapages, qualité orale et respect des deux référentiels. Les regex/tailles ne valent **jamais** visa humain.
5. **NO-GO** si demande refusée, timeout, qualité insuffisante, CPU excessif, référence ignorée, modèle indisponible ou incohérence dans une phase. Ne pas activer `coral_v2_qualified=true` sur la base d'un simple test syntaxique.
6. Pour la synthèse audio, les visas de sept textes et la revue culinaire existent déjà dans le Studio, mais **l'autorisation de génération et le traitement de nouveaux ateliers sont distincts**. Le script historique `bridge-cooking-workshops-coral.mjs` est verrouillé pour les six ateliers existants. Ne pas détourner ce verrou pour sonoriser une nouvelle création ; réaliser ensuite une passerelle dédiée, versionnée, avec décision `Valider et générer` et retour audio sous un nouveau chemin privé.

## État du jour

La qualification **réelle sur Orvekio** n'a pas été exécutée depuis cette conversation : ni terminal VPS authentifié ni service de tâches connecté n'étaient disponibles. Les tests GitHub couvrent uniquement un fournisseur synthétique direct, sans n8n, sans audio. Le résultat de ces tests ne permet donc pas l'activation de l'IA Coral ni le déploiement OVH.

**Référentiels immuables** : `docs/ateliers/REFERENTIEL-ATELIER-CUISINE-ET-MP3.md` et `docs/ateliers/REFERENTIEL-NARRATION-IMMERSIVE-V2.md`. Exemples réels conservés sous `src/data/atelier-recette-guides/`.
