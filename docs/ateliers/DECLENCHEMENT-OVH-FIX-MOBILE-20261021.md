# Corrections UX des ateliers — publication OVH ponctuelle

AUTORISATION_CORRECTIONS_ATELIERS=OUI

Le 21 octobre 2026, le propriétaire a demandé l'application directe des corrections
des fiches ateliers montrées sur Android, sans recours à Codex.

Validation préalable :
- PR #93 fusionnée : `afa1183ef7c35ce26c00ac47e0b6e87a0c19495f` ;
- CI de branche : `39660890576` — PASS ;
- CI du commit de fusion : `39661443903` — PASS.

Périmètre : suppression de l'affichage redondant des portions, reformulation
du repère de durée, lecteur audio mobile compact fixé en bas avec navigation
dans un panneau coulissant. Le lecteur ordinateur reste inchangé.
Six MP3, recettes éditoriales, n8n et Meta inchangés.

Ce fichier déclenche une seule fois le workflow
`.github/workflows/publish-atelier-ui-once-20261021.yml`.
Celui-ci lance `deploy-ovh.yml` sur SHA exact, sans calendrier, avec
les contrôles habituels de publication et la protection anti-modification de main.
