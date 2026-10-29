# Cuisine du Cambodge — ARCHITECTURE VERROUILLÉE du Studio éditorial

**Statut : référence permanente, applicable aux contenus présents et futurs.**  
Décision du 28 octobre 2026, à la suite de la réception Android du Studio V2.  
**Le cas Bai Sach Chrouk a servi de test ; ce n'est pas un modèle réservé à cet atelier.**

**29 octobre — parcours d’édition unifié :** [décision et contrat de transition](CMS-STUDIO-UNIFIED-20261029.md).
Les deux stockages append-only ne sont pas fusionnés : un atelier publié peut
ouvrir, sur confirmation explicite, un brouillon Coral V2 dans le formulaire
commun, lié à l’ID public et à ses empreintes par métadonnée serveur. L’ancien
éditeur devient alors un historique en lecture seule ; bibliothèque et
calendrier retrouvent le même brouillon. Les cinq familles partagent les cinq
sections du Studio ; aucun visa, MP3 ou droit de publication n’est importé.

## 1. Principe non négociable

**Un seul Studio, un seul rendu d'édition, une seule logique de brouillon et d'aperçu pour l'ensemble du catalogue éditorial.** Chaque page éditoriale (recette, Carnet, atelier, ingrédient, technique), présente ou créée dans le futur, hérite du même **parcours**. Aucun écran « spécial Bai Sach Chrouk », aucun formulaire codé séparément pour une recette, aucun retour automatique au JSON brut pour une nouvelle page.

Le contenu d'une rubrique reste adapté à son modèle (ingrédients pour la recette, sections pour le Carnet, chapitres pour l'atelier), mais **le gabarit d'administration** et ses composants sont communs.

## 2. Source de vérité technique et composants communs

- **Catalogue public / identités** : `src/data/socialCatalog.ts` → `social-feed.json`.
- **Empreintes canoniques complètes (SHA-256)** : `src/pages/editorial-source-index.json.ts` → `editorial-source-index.json`.
- **Projection des champs publics réellement éditables** : `src/pages/editorial-guided-fields.json.ts` → `editorial-guided-fields.json`, contrat `approved-public-form-fields-v2`. Aucun script audio, MP3, source documentaire privée, secret ou autorisation de publication.
- **Template PHP universel**, **non dupliqué par contenu** : `public/gestion-contenus/index.php`.
- **Composants récursifs partagés et échappement** : `cmsGuidedHtml`, `cmsGuidedRowTitle`, `cmsGuidedLabel`, `cmsGuidedPreviewHtml` dans `public/gestion-contenus/lib.php`.
- **Sauvegarde privée, historique, versions et contrôles** : `cmsBuildGuidedPatch`, `cmsSave`, `cmsVersions`, `cmsAssertGuidedCoverage`.
- **Réception GitHub + OVH** : `scripts/check-cms-ovh-readiness.mjs`, tests PHP et Node ci-dessous.

Aucun nouveau fichier PHP de formulaire par fiche. On adapte **le schéma / la projection** au modèle et les libellés partagés si nécessaire, pas une copie du template.

## 3. Parcours et expérience partagés (mobile d'abord)

Pour toutes les familles :
1. Bibliothèque avec les mêmes filtres `kind`, `q`, `status`, conservation du contexte de navigation.
2. Identité de la fiche / consultation de la page actuellement publiée.
3. Titre et résumé du catalogue **distincts** des champs métier (ex. objectif pédagogique) ; formulation générique, jamais « cet atelier » pour toutes les familles.
4. Éditeur guidé à champs lisibles (multilignes pour textes), listes repliables avec **intitulés descriptifs**, groupes sémantiques.
5. Notes générales optionnelles repliées, raccourcis « champs / enregistrer / aperçu ».
6. Brouillon privé versionné et horodaté, **aucune publication directe**.
7. Aperçu de relecture **humain** (titres, sections, paragraphes, listes), pas de JSON brut imposé. JSON technique uniquement dans un espace expert replié.
8. Mobile : lisibilité, champs non tronqués, sans défilement horizontal ni interface spécialisée par article.

## 4. Garantie pour les nouvelles pages

**Les tests sont dynamiques : aucune assertion de quantité fixe « 35 »**. La correspondance suivante doit toujours être exacte :

`IDs du catalogue = IDs de l'index canonique = IDs du manifeste guidé`.

Toute nouvelle fiche d'un modèle déjà pris en charge entre dans le manifeste via la collection Astro correspondante et reçoit automatiquement le template commun.

Tout nouveau **type de contenu** ou champ d'un type existant exige une mise à jour explicite de sa projection publique et de l'autorisation PHP/Node, puis ses tests, avant la fusion. Ne jamais exposer arbitrairement un objet Astro complet pour « automatiser » l'édition.

**Échec fermé** : si une nouvelle page est sans manifeste guidé, avec empreinte périmée, clés inconnues ou modèle non autorisé, le contrôle CI/paquet OVH échoue (`GUIDED_COVERAGE_INCOMPLETE` ou erreur de source). En production, une alerte explique l'indisponibilité plutôt que de présenter silencieusement un éditeur complet.

Limite de capacité actuelle : jusqu'à 250 entrées pour les index/manifestes (autres bornes de taille HTTPS toujours en vigueur). En approchant de ces bornes, revoir performance, cache et limites ensemble avant d'accroître le volume.

## 5. Sécurité et périmètre immuables

- HTTPS, session, CSRF et contrôle des empreintes/version attendue.
- Journal privé des versions append-only ; les anciennes versions, notamment le brouillon **Bai Sach Chrouk v1**, ne sont ni réécrites ni migrées par une mise à jour d'interface.
- Pas d'effacement implicite de lignes/sections ; pas de modifications d'ID de phases ni du réglage `scalable`.
- Scripts vocaux et MP3 Coral approuvés **intouchables** ; images et médias protégés.
- Pas de modification automatique des sources Astro, du site publié ou des données sociales depuis une simple sauvegarde.
- Pas de duplication de recette, Carnet ou atelier. Toute proposition de création future doit être comparée au catalogue, puis passer par validation.
- Aucun déclenchement n8n/Meta, aucune écriture Supabase lors de l'édition.

L'édition guidée universelle **n'est pas** une publication universelle : publier dans toutes les familles, ajouter/supprimer des étapes, importer des médias ou produire des MP3 exige d'autres développements validés.

## 6. Tests obligatoires à chaque changement CMS ou ajout de contenu

- `tests/editorial-guided-fields.test.mjs` : équivalence réelle entre toutes les empreintes et tous les IDs.
- `tests/cms-ovh-reception.test.mjs` : simulation d'une **nouvelle page** et refus du manifeste incomplet.
- `tests/php/editorial-all-guided-smoke.php dist` après build : toutes les fiches réellement générées passent dans le **même** formulaire, le même validateur et le même aperçu ; aucun compteur codé en dur.
- `tests/cms-studio-architecture.test.mjs` : assure le point d'entrée, les composants, les protections et le parcours partagé ; interdit les libellés métier en dur dans le template universel.
- CI Astro/TypeScript, audit mobile, recettes et MP3 inchangés.
- Réception OVH réelle après sauvegarde, **avec permission explicite** avant remplacement ; un contrôle anonyme ne prouve pas à lui seul la sauvegarde d'un brouillon.

**Tout changement qui casse ce contrat doit échouer en CI et être corrigé avant fusion.** Les adaptations de design restent possibles, mais doivent être réalisées **sur le composant partagé** et testées pour l'ensemble du catalogue, jamais sur une seule fiche.

## 6 bis. Création de nouveaux contenus (P1B)

L'éditeur de page publiée et le formulaire de nouvelle page restent dans **un seul Studio**. `?new=1` propose les cinq types dans un formulaire de création basé sur les composants de `cmsCreationFormHtml` (PHP), sans aucune page PHP supplémentaire, aucune duplication par recette et aucun JS dépendant d'un service externe. Les propositions utilisent `cmsCreationSave` et le stockage privé append-only `editorial-drafts/new-content`, séparé du stockage des propositions de modification SHA-locked. Le titre identique de même famille est refusé ; les titres proches restent soumis à une revue humaine.

Un statut « Prêt pour relecture » ne vaut **pas** publication, validation de source, création de page Astro, génération audio ou autorisation Meta. Le contrat d'entrée commun manuel / IA est décrit dans `EDITORIAL-AI-MEDIA-PIPELINE.md`.

## 7. Cycle standard de création de contenu

**Raccordement C2 (29 octobre, en PR #151) :** le [contrat C1 fusionné #150](CMS-STRUCTURED-CONTENT-P1C-C1.md)
alimente le même formulaire manuel, sous forme de candidat temporaire. Une action
explicite sauvegarde ensuite avec `cmsCreationSave`, provenance serveur et historique
conservés. Quota global partagé avec les briefs ; aucune ouverture GET ne génère.
Le fournisseur reste désactivé tant qu'il n'est pas qualifié et autorisé. Voir
[les limites, la recette C2 et les écarts Astro](CMS-STRUCTURED-GENERATION-P1C-C2.md).

**Premier lot P1C-B, en branche/PR :** les [briefs IA privés](CMS-AI-BRIEFS-P1C.md) empruntent `cmsCreationSave`, le même formulaire et le même calendrier. La provenance IA est déterminée côté serveur et conservée au fil des versions. Les quatre textes du brief ne constituent pas une page complète ni une approbation ; l'adaptateur reste désactivé par défaut tant que le fournisseur n'est pas raccordé et réceptionné.

1. Vérifier anti-doublon, angle éditorial et autorisations médias/audio.
2. Ajouter la fiche dans la collection TypeScript appropriée.
3. Vérifier que catalogue, empreinte canonique et manifeste éditorial ont le même ID.
4. Lancer CI, notamment la simulation d'une future page et le smoke PHP sur tous les contenus.
5. Faire relire le contenu ; la création ou la publication n'est **pas automatique**.
6. Déployer par paquet ciblé et sauvegarde, puis réception mobile et fonctionnelle.

**Ce document est le référentiel à consulter avant tout chantier CMS, y compris dans une nouvelle conversation ou dans l'IDE.**
