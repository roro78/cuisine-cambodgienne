# Cuisine du Cambodge — back-office privé, validation sociale et acquisition

État au 25 octobre 2026. **Référence de conception, sans autorisation de publication ni de déploiement.**

## Décision produit

**Priorité P0 : un dashboard de validation opérationnel sur Android**, avant toute extension (analytics, éditeur de site, IA sur les commentaires). Ne pas confondre un fichier HTML de revue hors ligne avec une validation réelle. Le parcours cible doit être réutilisable pour chaque nouvelle recette, atelier, ingrédient, technique et Carnet. Ne jamais coder une liste de trois sujets en dur pour la production.

Le socle existe : `src/data/socialCatalog.ts`, `/social-feed.json`, `scripts/build-social-assets.mjs`, les trois workflows `automation/n8n/01-drafts-email-approval.json`, `02-publish-approved.json`, `03-reconcile-instagram.json`, et `cuisine_social.posts`. Les exports n8n GitHub sont `active:false`. L'interface de revue générée par `scripts/build-social-review.mjs` est **un simulateur sans publication** et ne doit pas devenir un endpoint public d'approbation.

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

## P3 — Engagement et IA commentaires

Récupérer les indicateurs autorisés Meta (likes, commentaires, partages/portée selon accès), créer une file de réponses avec liens vers les publications. D'abord **IA propose / humain approuve** et seulement ensuite éventuelles catégories automatiques limitées. API Meta, permissions, volume et utilité économique à vérifier.

## Gouvernance des branches

Conserver la PR #127 dédiée aux photographies diverses et au carnet du riz ; conserver la PR #128 dédiée à la présentation compacte et à la prévisualisation. Ne pas fusionner par anticipation les travaux de P1–P3. La validation finale de P0 doit devenir la condition pour activer les workflows n8n. Ne pas toucher aux articles d'origine lors de ce chantier.

## État du présent document

Spécification et priorisation uniquement. **Pas de serveur d'administration sécurisé déployé, pas de base migrée, pas de workflow n8n activé, pas d'email de validation envoyé, pas de publication Meta ni d'intégration GA4 vérifiée.**
