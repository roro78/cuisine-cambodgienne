# Instructions de travail pour les agents du dépôt

## Référentiel prioritaire — Studio éditorial

**Lire `docs/CMS-STUDIO-ARCHITECTURE.md` avant toute création, refonte ou modification d'une page de CMS.** Il constitue une décision d'architecture globale, pas une amélioration limitée à Bai Sach Chrouk ou à un atelier.

- **UN modèle de Studio pour TOUT le catalogue** (recettes, Carnets, ateliers, ingrédients, techniques) et toutes les nouvelles fiches.
- Pas de pages d'administration ad hoc par contenu : garder `public/gestion-contenus/index.php` et les composants de rendu, formulaire, prévisualisation et validation de `lib.php` partagés.
- Toute nouvelle fiche enregistrée dans une collection existante doit figurer avec la même identité dans les trois index (social, canonique, guidé) ; la CI et le contrôle OVH doivent bloquer un index guidé incomplet, sans quantité de pages figée.
- Un nouveau modèle doit être explicitement projeté en champs éditables publics et autorisé dans les validateurs ; jamais d'export de l'objet source complet (secrets, sources privées, MP3/audioScript, autorisations).
- UX commune mobile : filtres persistants, champs lisibles, groupes descriptifs dépliables, accès rapide, brouillon privé versionné et aperçu humain, JSON réservé au mode expert.
- Pas de mutation silencieuse de sources Astro, pas de publication sociale, pas de remplacement des images/MP3 Coral. Sauvegarde et approbation obligatoires avant déploiement OVH.
- Les changements d'architecture ou de gabarit doivent passer les contrats Node et les tests PHP sur **tous les contenus réels** après build, puis la CI complète. Aucune PR cassée à fusionner.

## Nouveau premier maillon — création éditoriale avant réseaux sociaux

Lire `docs/EDITORIAL-AI-MEDIA-PIPELINE.md` pour les chantiers de création manuelle/IA et calendrier média.

- Le CMS doit permettre de **créer** de nouvelles fiches des cinq familles, en plus d'éditer les fiches existantes ; même gabarit et mêmes composants pour le mode manuel ou IA.
- La création manuelle P1B s'effectue avec le formulaire commun `cmsCreationFormHtml` et le stockage privé de `cmsCreationSave`; jamais en écrivant directement dans les sources Astro. Ne pas confondre « prêt pour relecture » avec « approuvé », et préserver l'historique déjà présent.
- Le module `scripts/editorial-content-pipeline.mjs` fixe le premier contrat d'idées, vérification anti-doublons et revue humaine. Ce n'est pas une API IA ni un outil de publication.
- Aucun nouveau contenu ou plan social sans vérification des titres et slugs déjà publiés **et** des propositions non publiées ; la similarité sémantique requiert aussi une revue.
- Toute réponse IA est un **brouillon** ; ni une date du calendrier ni un statut de génération ne valent autorisation de publication.
- Le calendrier privé `?calendar=1` projette les **dernières versions de création manuelle** pour organiser le mois et les tâches sans date ; une date cible ne déclenche aucun traitement en tâche de fond ni aucune publication.
- Les pages et ateliers nouvellement approuvés doivent rejoindre les mêmes données Astro, gabarits, contrôles et médias que les anciennes ; ne jamais inventer une filière parallèle d'édition/publication.

## Autres garde-fous

Utiliser une seule PR par chantier. Ne pas modifier `main` directement ; ne jamais perdre le travail local. Ne pas présenter une CI GitHub verte comme preuve d'un transfert OVH. Les brouillons privés existants en production sont conservés et non migrés sans décision spécifique.

Voir également `docs/CMS-EDITORIAL-PLAN-20261026.md` pour l'état du chantier et `docs/CMS-OVH-RECEPTION-20261027.md` pour la livraison ciblée.
