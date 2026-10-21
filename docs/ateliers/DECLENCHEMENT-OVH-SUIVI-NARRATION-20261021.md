# Cuisine du Cambodge — publication du suivi de narration mobile

AUTORISATION_SUIVI_NARRATION=OUI

Le 21 octobre 2026, le propriétaire a confirmé que le lecteur MP3 devait faire
défiler automatiquement la page atelier entre les grandes étapes correspondant
aux chapitres. Il a demandé de continuer le correctif déjà en cours.

PR #94 : `https://github.com/roro78/cuisine-cambodgienne/pull/94`
Validation CI de la branche : `39665113329`, SUCCESS.
CI du merge commit `501c790c725ae7138bc646bd57fd0dea0957ad64` : `39665751389`, SUCCESS.

Changement autorisé : lecture mobile = suivi de la page activé automatiquement ;
la phase d'introduction rejoint la préparation des ingrédients puis chaque
chapitre principal rejoint son étape. Le défilement manuel désactive ce suivi
sans interrompre la narration. Le suivi proportionnel facultatif des paroles
dans le panneau coulissant est conservé. Le desktop reste inchangé.

Aucune génération audio, aucun changement du contenu éditorial, du référencement,
de n8n ou de Meta.

Déclenchement ponctuel unique dans
`.github/workflows/publish-narration-scroll-once-20261021.yml` :
il appelle le workflow OVH existant `deploy-ovh.yml` avec le SHA exact du
commit portant ce marqueur. Ni planification ni publication Meta.
