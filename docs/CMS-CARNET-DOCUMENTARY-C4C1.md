# C4C1 — Dossier documentaire privé des Carnets culturels

29 octobre 2026. Ce lot étend le **Studio existant** sans créer un CMS
parallèle, sans toucher aux articles publics, ni activer un fournisseur IA.

## But éditorial

Un Carnet culturel raconte un usage, un territoire, une histoire ou une
pratique, **sans devenir une recette détaillée ou un atelier déguisé**.
La relecture doit pouvoir justifier les affirmations historiques et
culturelles, identifier les nuances et dater les vérifications.

## Dossier interne versionné

Un brouillon de type `culture` peut recevoir `culture_evidence.version=1`
avec jusqu'à 12 entrées :

- `claim` : l'affirmation, la nuance ou le fait à vérifier.
- `source_label` et `source_url` : référence documentaire de travail
  **privée** ; seuls les liens HTTPS publics sans identifiants sont acceptés.
- `status` : `pending` / `checked` / `disputed`.
- `checked_on` : date de la vérification humaine, requise avec `checked`.
- `note` : prudences, réserves ou synthèses de travail, obligatoire si contesté.

Le contrôle refuse les dates impossibles, valeurs ou clés inconnues, les
doublons de couple affirmation/lien, les URL non HTTPS, intranet et
déclarations de publication forgées. Les lignes de formulaire vides sont
ignorées ; un ancien brouillon sans dossier continue à fonctionner.
La sauvegarde utilise le même verrou et le même historique immuable que C2.

Une mention « vérifié » constitue une information de relecture saisie par
l'humain ; **elle n'est pas une approbation du contenu** et ne rend jamais le
Carnet publiable. Le moteur IA C2 ne peut pas produire ni approuver ce dossier.

## Frontière public/privé

`cmsCultureAstroDraftProjection` ne reprend **que** le titre, le slug, la
rubrique, l'introduction, la description SEO, le temps de lecture et les
sections du Carnet. Les URL, labels, notes, vérifications et preuves internes
restent hors du candidat de rendu. La réponse indique systématiquement
`requires_human_review=true` et `publication_ready=false`.

La structure complète du modèle `src/data/culture.ts` demande encore
médias, textes alternatifs, dimensions et gestion des droits. Le champ
`sources` du modèle existant ne donne **aucune autorisation d'afficher une
bibliographie ou les sources de recherche sur une page publique**. Ce lot
ne génère pas de nouvelle page et ne modifie pas les gabarits publics.

Le Studio montre seulement le nombre de contrôles documentaires privés et
le statut de complétude structurelle. La consultation des références se
fait dans le formulaire authentifié. Aucune URL privée dans la projection.

## Tests

`tests/php/editorial-culture-evidence-smoke.php` vérifie des révisions
privées append-only, conservation par d'anciens clients, champs du
fournisseur IA C2 inchangés, absence d'exposition publique, blocage
d'approbations forgées et validation des dates/URL/XSS.

La CI couvre PHP 8.3, PHP 8.4, Astro et les parcours existants. Aucune
validation de qualité historique réelle n'est prétendue.

## Suite

Étendre les métadonnées médias et droits sous revue humaine ; préparer la
prévisualisation fidèle du Carnet et les liens internes pertinents, puis
les catégories ingrédients, techniques et ateliers Coral V2. Les éventuels
visuels ne doivent jamais faire croire qu'une illustration IA constitue
une photographie documentaire ou un reportage authentique.

**Non effectué ici :** connexion n8n, TTS, publication, transfert OVH,
synchronisation Windows ni benchmark réel Ollama.
