# Cuisine du Cambodge — back-office privé, validation sociale et acquisition

État au 25 octobre 2026. **Référence de conception, sans autorisation de publication ni de déploiement.**

## Décision produit

**Priorité P0 : un dashboard de validation opérationnel sur Android**, avant toute extension (analytics, éditeur de site, IA sur les commentaires). Ne pas confondre un fichier HTML de revue hors ligne avec une validation réelle. Le parcours cible doit être réutilisable pour chaque nouvelle recette, atelier, ingrédient, technique et Carnet. Ne jamais coder une liste de trois sujets en dur pour la production.

Le socle existe : `src/data/socialCatalog.ts`, `/social-feed.json`, `scripts/build-social-assets.mjs`, les trois workflows `automation/n8n/01-drafts-email-approval.json`, `02-publish-approved.json`, `03-reconcile-instagram.json`, et `cuisine_social.posts`. Les exports n8n GitHub sont `active:false`. L'interface de revue générée par `scripts/build-social-review.mjs` est **un simulateur sans publication** et ne doit pas devenir un endpoint public d'approbation.

## Jalon technique du 25 octobre — PR #129 (préparation P0)

**[PR #129 — prévisualisations dans l'e-mail et migration n8n ciblée](https://github.com/roro78/cuisine-cambodgienne/pull/129)** : workflow 01 export enrichi de deux cartes Facebook/Instagram et d'un bouton vers le formulaire humain n8n existant ; sauvegarde des adresses Resend et des credentials prévue dans une migration indépendante, GET-only par défaut. 14/14 tests ciblés réussis en isolation V8 ; CI Node, n8n live et vrai e-mail non exécutés. PR #129 reste en brouillon et ne met rien en production.

**Distinction maintenue :** visualiser les posts dans Resend avec le formulaire `Wait` déjà existant n'est **pas encore le dashboard privé** (liste, édition, versionnement et suivi en direct) décrit ci-dessous. Aucun déclenchement Meta autorisé pendant la phase de test. Le P0 sera terminé uniquement quand le parcours complet sera testé de manière authentifiée jusqu'à l'enregistrement effectif de la décision en base, sans publication externe.

## P0 — Validation humaine utilisable, contrat de réception

1. n8n 01 sélectionne une source publiée, photographie sociale et pages canoniques. Il enregistre une **version figée** (`source_id`, `source_fingerprint`, captions Facebook/Instagram, `image_url`, `destination_url`, identifiant du brouillon). Ne jamais dériver une approbation d'une nouvelle version du catalogue.
2. Resend envoie un lien unique et temporaire « Examiner cette publication » ; un lien GET ne peut pas approuver. La page doit présenter les deux prévisualisations côte à côte / par onglets sur mobile, image entière 1:1, vignette recadrée du profil Instagram, captions complètes, destination canonique cliquable, droits photo, état et délai d'expiration. **Les images doivent provenir de l'asset réel promis à Meta**.
3. L'accès aux données et la confirmation reposent sur un **backend autorisé** (n8n + couche d'accès sécurisée ou serveur privé). Authentification nécessaire, lien d'approbation lié à un brouillon et une version, jeton aléatoire stocké sous forme de hash, expiration, validation POST, protection contre CSRF et réutilisation, limites d'essais et historique d'audit. Ne jamais héberger une interface admin ouverte dans l'Astro statique sur OVH ; `noindex` n'est **pas** une barrière d'accès.
4. Trois décisions explicites : `approved`, `revision_requested` (commentaire non vide), `rejected`. Le backend enregistre atomiquement une décision seule et refuse les doubles validations, modifications concurrentes, données périmées ou liens expirés. Une correction de texte/photo exige un nouveau brouillon ou une nouvelle version et une nouvelle approbation.
5. Les workflows 02/03 existants consomment uniquement les brouillons `approved`. Exécutions idempotentes : ni nouvel envoi Facebook ni nouvel Instagram si appel Meta précédent ambigu. États visibles et indépendants pour les deux réseaux ; échecs réparables manuellement après vérification Meta.
6. Tests obligatoires : vrai e-mail sur destinataire autorisé, ouverture Android, 2 simulations Facebook/IG réelles avec cadrages, approbation/rejet/révision, post expiré, GET prélecture, double-clic, relecture n8n/Postgres, panne Meta après Facebook, photo absente, accessibilité/clavier. **Aucune publication avant validation utilisateur**.
7. Déploiement sécurisé séparé après preuve des tests ; maintien des workflows désactivés tant que leurs états n'ont pas été relus. Prévoir rollback et alertes.

### Limite de l'outil de démonstration local

Un fichier HTML téléchargé peut montrer les onglets, les destinataires et recueillir des choix locaux. Il ne peut **pas valider dans n8n/PostgreSQL** sans intégration authentifiée ni vérifier le rendu exact des applications Meta. Ne jamais assimiler `Exporter mon avis` à `Approuver et publier`.

## P1 — Publications et acquisition mesurables

Conserver un `post_id` stable, le contenu source, la destination canonique et les identifiants Facebook/Instagram. Définir **avant publication** les liens suivis (Facebook : `utm_source=facebook&utm_medium=organic_social&utm_campaign=<identifiant>&utm_content=<post_id>`). GA4 doit être installé, configuré, testé et conforme au consentement avant toute remontée réelle. Distinguer sessions attribuées au post, clics, visites, interactions et portée. Google Search Console couvre le trafic de recherche, pas l'attribution sociale.

Instagram : liens des légendes généralement non cliquables ; prévoir lien de profil, page d'atterrissage dédiée ou canal adéquat, et tenir compte de l'attribution imparfaite lorsque plusieurs posts partagent le même lien. Afficher « non disponible » en l'absence de mesure, **jamais zéro inventé**.

## P2 — Éditeur privé des contenus du site

Unifier une structure de contenus versionnée pour recettes, Carnets, ateliers, ingrédients, photos et métadonnées SEO. Astro actuel importe des tableaux TypeScript : **ne pas écrire directement des changements d'interface dans la base de production tout en gardant Astro statique** sans pipeline de reconstruction. Deux options à étudier avant d'investir :
- CMS Git-backed avec interface et droits, commits/reviews Git et build OVH contrôlé (préserve Astro et l'historique) ;
- modèle de contenu dans un CMS/BDD avec export vers Astro (migration plus lourde).

Exiger prévisualisation, historique, validations, gestion des droits des photographies, sauvegarde et réversion. Pour que l'IA respecte la structure, imposer un schéma versionné et des API stables ; toute migration de schéma nécessite revue, tests et sauvegarde, pas de mutation libre du modèle de données.

## P2 bis — Production éditoriale IA en amont (proposition du 25 octobre)

**Plan directeur complémentaire de la rédaction et des médias :** [Plan éditorial & média V1 — acquisition, veille, contrôle anti-doublons et calendrier](./PLAN-EDITORIAL-MEDIA-ACQUISITION-20261025.md). Ce document donne les règles permanentes de sélection avant toute génération, couvre les contenus existants, les brouillons et le contrôle sémantique, et fixe les conditions d'acquisition mesurable. Les initiatives d'actualité ou de création ne doivent jamais contourner P0.

**Objectif** : le back-office devient le point d'entrée commun de création manuelle, assistée par IA et planifiée, sans publier directement sous l'impulsion de l'IA. Ce chantier est **postérieur au P0** de validation sociale réellement connectée.

### Chaîne fonctionnelle à deux approbations

`idée / calendrier -> brief avec type de contenu -> génération brouillon -> contrôles de schéma, langue culinaire, faits, sécurité -> validation éditoriale -> construction Astro / PR Git -> tests -> publication OVH confirmée -> synchronisation du catalogue social -> brouillons Facebook et Instagram -> validation sociale -> publication Meta -> mesure`.

- Deux plannings distincts : **calendrier de création** (IA prépare des brouillons) et **calendrier de diffusion** (publication des contenus validés). Une proposition programmée ne doit pas publier automatiquement une page ou déclencher une synthèse MP3 payante.
- Les types admissibles sont `recette`, `culture` (Carnet), `atelier`, `ingredient`, `technique` ; chaque type possède un schéma éditorial versionné, des champs requis, un aperçu et un `source_id` stable. La génération IA produit seulement ces données contrôlées, **pas des modifications arbitraires aux composants Astro ou au back-office**.
- Source culinaire canonique unique : ingrédients, quantités de base, portions, étapes, temps et mises en garde proviennent de la **recette validée**. L'atelier pédagogique et son script MP3 référencent une version et une empreinte de cette source. Un changement de recette impactant ces éléments invalide les approbations en aval.
- Reprise obligatoire des référentiels : `docs/ateliers/REFERENTIEL-ATELIER-CUISINE-ET-MP3.md`, `docs/ateliers/REFERENTIEL-NARRATION-IMMERSIVE-V2.md`, `scripts/check-culinary-lexicon.mjs`, `scripts/check-workshop-blueprints.mjs`. Six phases pratiques et sept textes parlés ; approbation humaine explicite des textes **avant** toute TTS Coral ; écoute et intégrité MP3 **après** génération. Jamais de TTS à la simple création d'un brouillon ou d'un calendrier.
- Le contrôle culinaire porte sur réalisme des quantités/temps, disponibilité française des ingrédients avec substitutions indiquées, allergènes, cuisson sécuritaire, contextes culturels non inventés. Une variante créée par l'IA ne peut pas être présentée comme recette traditionnelle attestée sans vérification. « Testée en cuisine » n'est pas une affirmation automatique.
- Photographies : correspondance obligatoire au plat/étape, droits vérifiés, distinction entre photographie du plat réellement préparé et **illustration générée par IA**. Les scènes culturelles ne peuvent pas prétendre documenter un événement ou un lieu réel sans preuve. Les dérivés WebP du site et JPEG sociaux proviennent de médias approuvés, avec recadrages contrôlés.
- SEO : titre, description, liens internes, URL canonique, données structurées `Recipe` si approprié, dates et sitemap ; contrôles de qualité, d'originalité et de valeur pour l'utilisateur avant multiplication de pages générées.
- GitHub/Astro demeure la source publiée actuelle (recettes et Carnets en données TypeScript ; ateliers également en fichiers JSON) : **pas de CMS supposé déjà fonctionnel**. Comparer migration graduelle vers données structurées à schéma stable et éditeur Git-backed ; passage par PR + tests + déploiement OVH contrôlé. Ne pas donner à Ollama ni à n8n le droit de réécrire librement `src/pages`, les schémas ou le dashboard.
- Réutiliser, après audit de configuration et de déploiement, le portail existant `public/gestion-visuels/index.php` pour l'import de médias ; il propose déjà authentification, CSRF et une file d'envoi vers GitHub. **Ne pas présumer qu'il soit déployé ou correctement configuré**.
- Déclenchement social **uniquement après publication sur le site vérifiée**, pas à la génération du brouillon IA. La synchronisation `social-feed.json` doit surveiller les nouvelles versions, conserver l'historique et ne pas réactiver un post déjà publié à la suite d'un simple changement de photo.
- Gardes de coûts et de réputation : une exécution par idée et par version, déduplication éditoriale/SEO, budgets plafonnés (texte, image, TTS, CI), journal d'audit, limites de création ; aucun envoi Resend ou Meta lors des simulations.
- Test d'acceptation prioritaire **après P0** : 2 recettes distinctes -> brouillons générés selon le schéma existant -> vérification qualité -> approbation éditoriale d'une seule -> publication de cette recette en environnement de test -> découverte dans le catalogue social -> aperçu Facebook et Instagram en attente d'approbation -> aucun Meta sans validation explicite. Un atelier lié à une recette vient ensuite, en testant script/empreinte/audio séparément.

**Décision de cadence** : commencer par suggestions et génération **à la demande**, puis programmation de brouillons (par semaine/mois) après mesure des coûts, du taux de corrections humaines et du trafic utile ; ne pas confondre volume de pages et acquisition démontrée.

## P3 — Engagement et IA commentaires

Récupérer les indicateurs autorisés Meta (likes, commentaires, partages/portée selon accès), créer une file de réponses avec liens vers les publications. D'abord **IA propose / humain approuve** et seulement ensuite éventuelles catégories automatiques limitées. API Meta, permissions, volume et utilité économique à vérifier.

## Gouvernance des branches

Conserver la PR #127 dédiée aux photographies diverses et au carnet du riz ; conserver la PR #128 dédiée à la présentation compacte et à la prévisualisation. Ne pas fusionner par anticipation les travaux de P1–P3. La validation finale de P0 doit devenir la condition pour activer les workflows n8n. Ne pas toucher aux articles d'origine lors de ce chantier.

## État du présent document

Spécification et priorisation uniquement. **Pas de serveur d'administration sécurisé déployé, pas de base migrée, pas de workflow n8n activé, pas d'email de validation envoyé, pas de publication Meta ni d'intégration GA4 vérifiée.**
