# Cuisine du Cambodge — Plan directeur éditorial & média V1
**25 octobre 2026 — document de pilotage proposé, aucun déploiement ni automatisation activée.**

## 0. Mission et hiérarchie des objectifs

Construire une rédaction numérique orientée **gastronomie cambodgienne en français**, avec création originale, transmission des recettes et gestes, compréhension culturelle et acquisition de lecteurs qualifiés.

1. Acquisition mesurée : découvertes dans Google et sur les réseaux, sessions qualifiées sur les pages canoniques.
2. Fidélisation : parcours entre contenus, retours, partages, abonnements pertinents et interactions de qualité.
3. Communauté : discussions utiles, questions et réponses, intérêt répété, sans confondre abonnés, impressions et lecteurs actifs.

**Hypothèse à mesurer** : la communauté sociale existante peut contribuer à la croissance, mais aucune taille, aucun engagement, aucun volume de visites et aucune croissance chiffrée ne sont encore validés dans cette étude. Sans valeurs de référence, pas de promesse de « gros trafic ».

**Priorité de livraison** : P0 = finaliser le dashboard de validation connecté à n8n et PostgreSQL. Le système de planification/veille/génération décrit ici vient **après** cette réception. Cette spécification n'active rien.

## 1. Sources d'idées : veille + fond éditorial + audience

Trois flux alimentent la **file de suggestions**, jamais directement la publication :

- **Catalogue actuel** : recettes, ateliers, techniques, ingrédients, Carnets, pages stratégiques, leurs variantes déjà traitées, leur fraîcheur et leurs lacunes de contenu. Sources actuelles : `src/data/recipes.ts`, `src/data/restoredRecipes.ts`, `src/data/culture.ts`, `src/data/ingredients.ts`, `src/data/workshops.ts`, blueprints `src/data/atelier-recette-guides/`, `src/data/socialCatalog.ts`.
- **Demande du public** : Search Console (requêtes, pages, CTR, impressions), Google Trends (saisonnalité, recherches associées et en progression), questions et commentaires réels, mesures GA4 si ajoutées et conformes au consentement, statistiques Meta autorisées. Distinguer `données disponibles`, `à connecter` et `non mesuré`.
- **Actualité pertinente** : événements, saisons, fêtes, produits, cuisine cambodgienne, transmission et diaspora. Exiger au moins une source crédible et une date vérifiée **dans le registre interne de recherche**. Vérifier que le thème conserve une pertinence culinaire durable. Ne pas créer un Carnet sur un fait divers sans lien utile, ni réécrire sans valeur ajoutée une actualité d'autrui. Les pages publiques ne doivent pas afficher une bibliographie/sources si la ligne éditoriale du site l'exclut ; conserver cependant les preuves factuelles nécessaires à la validation interne et les mentions légales/crédits photographiques obligatoires.

Un sujet issu de l'actualité peut déclencher **un nouvel angle sur une page existante**, plutôt qu'une nouvelle URL.

## 2. Registre central anti-doublons — préalable obligatoire à toute génération

Créer à terme un index **versionné et exhaustif** du contenu vivant + brouillons + contenu planifié + contenu archivé/redirigé + historique des posts. La simple unicité de `socialCatalog.ts` sur `source_id` est insuffisante pour identifier des doublons sémantiques. Recréer l'index depuis le Git canonique pour que les changements éditoriaux ne dépendent pas d'un index vectoriel obsolète.

Données proposées pour une **entité éditoriale** :
- `content_id` stable, `kind` (recette / atelier / culture / ingrédient / technique), `slug`, URL canonique, version, statut, propriétaire, date, idées liées ;
- `culinary_identity` : nom et variantes khmères/françaises, famille du plat, ingrédients signature, méthode de cuisson, résultat attendu, zone culturelle quand vérifiée ;
- `learning_objective` : geste, niveau, préparation source pour ateliers ;
- `intent` : question principale de l'internaute, angle, promesse, requête SEO principale et pages couvrant déjà le besoin ;
- `parent_content_id` / `canonical_recipe_slug` pour les ateliers et déclinaisons, historique de toutes les publications sociales.

### Trois niveaux de contrôle, sans illusion de garantie absolue

**A — Déterministe et bloquant :** même `content_id`/slug/URL canonique, même recette source canonique sans réelle variante, titres normalisés et alias connus identiques, même objectif pédagogique pour le même geste, duplication exacte du corps ou des étapes.

**B — Similarité sémantique / structurée :** comparaison des ingrédients centraux, modes de préparation, résultat culinaire, intentions de recherche, techniques enseignées et titres normalisés. Possibilité d'embeddings/vector search, mais **pas** de confiance aveugle : des recettes partageant des ingrédients peuvent être différentes, et deux articles dont les titres diffèrent peuvent être redondants. Seuils et tests à calibrer sur le catalogue réel ; aucun chiffre de confiance inventé.

**C — Décision éditoriale :** le dashboard expose les pages proches, explique le recouvrement et propose :
- `BLOCK_DUPLICATE` : doublon prouvé ; pas de nouvelle page ;
- `ENRICH_EXISTING` : compléter/actualiser la page existante ; conserver URL, SEO et historique ;
- `SOCIAL_ANGLE` : préparer un nouveau post dirigé vers une page existante ;
- `NEW_CONTENT_REVIEW` : angle utile et réellement distinct, à approuver avant création ;
- `HUMAN_REVIEW` : incertitude non résolue, suspendre toute génération/publication.

**Règle** : jamais deux recettes de même préparation sans différence culinaire substantielle démontrée ; jamais deux ateliers remplissant le même objectif pédagogique sans progression ou public réellement distinct ; jamais deux Carnets qui racontent la même histoire par simple reformulation. Une relance sociale sur une page existante est autorisée avec **nouvel angle et contrôle de fatigue**, sans fabriquer une seconde page.

## 3. Politique de sélection : bénéfice avant quantité

Scorer qualitativement une idée (données réelles à recueillir) :
- A. Intérêt vérifié de l'audience (GSC/Trends/commentaires, non pas un mot-clé supposé) ;
- B. Complémentarité dans le catalogue / absence de recouvrement ;
- C. Qualité et authenticité culinaire démontrables (recette testable, typicité sourcée en interne) ;
- D. Faisabilité : disponibilité des ingrédients en France, photos fidèles et droits, coût/temps de validation ;
- E. Potentiel de parcours : page destination, liens internes recettes ↔ ateliers ↔ ingrédients ↔ Carnets ;
- F. Durabilité du sujet / saisonnalité utile (actualité seulement si pertinente et vérifiée).

**Exclusion** : idée opportuniste dont le seul argument est un pic d'actualité, des recherches volumineuses hors sujet ou une promesse de « viralité » spéculative.

## 4. Planning média éditorial glissant, non publication aveugle

- **Horizon 90 jours** : thématiques saisonnières, lacunes du catalogue, grands temps forts réellement pertinents. Revoir à partir des données.
- **Calendrier mensuel** : idées et priorités validées, destination canonique, canal, format (page/article/photo/carrousel/audio), production prévue, date cible, lien vers sources internes de vérification.
- **Revue hebdomadaire** : sélectionner un petit lot de briefs, vérifier recouvrement et capacité de validation humaine.
- **Mode réactif** : veille sur l'actualité et questions de la communauté; proposer des sujets, mais ne publier aucun contenu sans contrôle.
- **Rythme pilote proposé (hypothèse, non engagement)** : 1 nouvelle page enrichie par semaine au maximum et 2 à 4 propositions sociales exploitant aussi les pages existantes. Ajuster après 4–6 semaines selon effort, qualité et trafic attribuable ; le `1 post/jour` du workflow historique est une capacité technique, pas une cible éditoriale validée.
- **Pas de TTS systématique** : seulement pour un atelier valide et script explicitement approuvé, sinon aucun frais audio.
- **Pas de page systématique pour une idée** : d'abord enrichissement/réemploi des contenus actuels quand le besoin existe déjà.

## 5. Cycle de vie unique, deux validations et plusieurs canaux

`VEILLE -> PROPOSITION -> DEDUP_CHECK -> BRIEF_APPROUVE -> DRAFT_IA -> QA_CULINAIRE_SEO_VISUELS -> VALIDATION_EDITORIALE -> PR_BUILD_TEST -> DEPLOIEMENT_OVH_VERIFIE -> SOCIAL_QUEUE -> SOCIAL_DRAFT -> APPROBATION_SOCIALE -> META_FB_IG -> ANALYTICS`

- **Création sur le site** : jamais avant revue éditoriale ; Astro reste source de vérité jusqu'à migration CMS contractuelle, aucune modification directe du code de composants par IA.
- **Atelier** : recette canonique validée, six phases, sept textes parlés et validation explicite du script avant Coral ; audio approuvé à l'écoute après génération. Respecter `docs/ateliers/REFERENTIEL-ATELIER-CUISINE-ET-MP3.md`, `docs/ateliers/REFERENTIEL-NARRATION-IMMERSIVE-V2.md`.
- **Publication sociale** : uniquement si URL et média réels disponibles sur OVH, bonne image et légendes figées, consentement explicite dans le dashboard et version immuable ; utiliser les workflows `01`, `02`, `03` existants, avec idempotence et états par plateforme.
- **Réemploi** : une nouvelle campagne sociale possède son propre `social_post_id` et `creative_angle_id`, mais renvoie au même `content_id`/URL canonique. Ne pas considérer une simple mise à jour de texte ou d'image comme une nouvelle recette.
- Un échec de publication Meta est traité plateforme par plateforme : aucun double Facebook après une réponse Instagram ambiguë.

## 6. Dashboard produit, architecture sans casse

Navigation future :
1. `À valider` (P0, en premier) : aperçus Facebook/Instagram sur vraies images, modifications, approbation humanisée.
2. `Plan média` : calendrier éditorial vs calendrier de publication, files de sujets et priorités, jalons, budget et statut.
3. `Idées & veille` : signaux de recherche, actualité sourcée en interne, questions communauté, proposition IA justifiée.
4. `Bibliothèque de contenus` : recettes, ateliers, Carnets, médias, versions, doublons potentiels, liens internes.
5. `Studio IA` : générer un brouillon selon un contrat, jamais une page directement publiée ; prévisualisation complète.
6. `Performances` : funnel et attributs de campagne, commentaires, décision d'actualiser ou de promouvoir une page.

Un **même référentiel versionné** alimente l'interface humaine et l'IA ; l'IA n'a pas le droit de changer les schémas, permissions, workflows d'approbation ou UI par une génération éditoriale.

## 7. Instrumentation et critères de croissance

- Avant promesses : relever baseline 28 jours + 90 jours sur Search Console (clics, impressions, CTR, pages/queries), Meta (abonnés/réactions/commentaires/portée si accès) et analytics de visite du site (si installé/consentement).
- GA4 ou solution analytique autorisée : sessions attribuées à `utm_source`, `utm_medium`, `utm_campaign`, `utm_content=<social_post_id>`, pages vues / parcours / engagement ; ne jamais affirmer qu'une impression ou un like est une visite. Instagram : légendes ordinaires non cliquables, attribuer seulement les parcours techniquement mesurables.
- KPI opérationnels : 0 doublon confirmé publié, ratio propositions bloquées/enrichies, taux de révision, coûts et temps par contenu, exactitude média-légende, refus/erreurs Meta ; mesurer séparément l'acquisition et la fidélisation.
- Revue après 4–6 semaines : conserver/renforcer/abandonner les types de contenus **sur la base de données**, sans pivoter à cause d'un post viral isolé.
- Seuils chiffrés de succès à fixer **après baseline**, pas inventés dans ce plan.

## 8. Gates de réception et limites de réalisation

1. **P0 prioritaire** : dashboard de validation relié à Resend/n8n/PostgreSQL, vérifications d'authentification et version, tests approval/revision/rejection; aucune publication sans accord.
2. Prototype anti-doublons en lecture seule sur **catalogue actuel complet** + brouillons existants avant rédaction, cas tests « Amok » et « variantes de l'Amok », ainsi que ateliers de gestes proches et Carnets culturels proches.
3. Mode `propose-only` pour veille et calendrier ; aucune génération ni création d'issue/PR automatique non autorisée.
4. Générer 2 briefs; accepter l'un, bloquer ou enrichir l'autre; vérifier qualité culinaires/SEO et origine des médias.
5. Après publication contrôlée d'un contenu de test : validation sociale séparée; vérifier l'absence de doublons et les bonnes URL sources.
6. Activer ensuite au besoin la proposition de brouillons sur calendrier ; aucun déploiement du site, synthèse Coral, e-mail Resend ou publication Meta déclenché pendant la phase de conception.

## Références de méthode — internes au chantier

- Google Search Central : `https://developers.google.com/search/docs/fundamentals/creating-helpful-content` ; `https://developers.google.com/search/docs/essentials/spam-policies`.
- Search Console : `https://support.google.com/webmasters/answer/7576553?hl=fr` ; Google Trends : `https://support.google.com/trends/answer/4355000?hl=fr`.
- Rapports GA4 : `https://support.google.com/analytics/answer/11242841?hl=fr`.
- Référentiel déjà créé : `docs/SOCIAL_BACKOFFICE_VALIDATION_ROADMAP_20261025.md`.

**État de ce document : planification uniquement. Aucune mesure d'audience récupérée, aucun test sémantique exécuté et aucune automatisation créée/activée.**
