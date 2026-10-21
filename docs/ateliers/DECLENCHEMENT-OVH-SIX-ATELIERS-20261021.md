# Publication OVH du 21 octobre 2026 — six ateliers

AUTORISATION_FINALE=OUI

Autorisation explicite du propriétaire en conversation du 21 octobre 2026 :
publier les six ateliers culinaires, les six MP3 déjà validés à l'écoute et les
illustrations existantes approuvées. Les recettes s'appuient sur des références
documentaires ; aucune exigence d'essai culinaire à domicile n'est ajoutée.

Dernier commit testé dans la PR #92 : `e361d2b10d9d6ce349530b9e273c6b86f3d296c8`.
Commit de fusion validé par CI : `7a104f5daaa38327ab2e28807df5c83b70730344`.

Ce fichier est un déclencheur ponctuel du workflow
`.github/workflows/publish-six-workshops-once-20261021.yml`. Il n'active
aucun lancement planifié ni aucune publication Meta/n8n.

La publication est confiée au workflow existant `deploy-ovh.yml`, avec le SHA
exact du commit contenant ce marqueur. Tous les contrôles de déploiement et la
publication sur `ovh-production` restent dans le workflow d'origine. Toute
modification future de ce fichier ne déclenchera pas de nouveau déploiement :
le job exige le message de commit ponctuel exact.
