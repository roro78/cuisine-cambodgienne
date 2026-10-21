# Publication — clic sur un chapitre → section de recette

AUTORISATION_NAVIGATION_CHAPITRES=OUI

Le propriétaire a explicitement demandé la correction dans les six ateliers
le 21 octobre 2026. L'objectif : après un clic sur un chapitre, repositionner
la narration MP3 et faire glisser la page vers l'étape correspondante, même
si le suivi automatique de la lecture a été désactivé.

- PR #95 fusionnée : https://github.com/roro78/cuisine-cambodgienne/pull/95
- Commit de fusion : `b490c177b6d87648fd707545137184901af10c57`
- CI complète de branche : `39670465732` — SUCCESS, 52 contrôles
- CI de main : `39671058506` — SUCCESS, 52 contrôles

Le panneau mobile se referme avant le scroll ; les réglages de suivi restent
inchangés. Le desktop conserve son design, et sa navigation de chapitre
déclenche également le déplacement explicite.

Aucun MP3 régénéré, aucune modification des fiches, de n8n, de Meta ou du SEO.

Le déclencheur unique `.github/workflows/publish-chapter-to-section-once-20261021.yml` délègue exclusivement au workflow
manuel officiel `deploy-ovh.yml`, avec le SHA exact de cette version.
Aucune planification ni republication de contenus sociaux.
