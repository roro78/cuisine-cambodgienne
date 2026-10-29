# C4C3B — Six phases détaillées d'atelier Coral V2

29 octobre 2026. Ajout **privé et humain** dans le Studio commun.
Aucune publication, génération IA réelle, MP3, vidéo ou modification des
workflows n8n/OVH.

## Modèle

`atelier_phase_details.version=1` suit l'ordre **fixe** des six phases
Coral V2 existantes : `installer`, `preparer`, `assembler`,
`maitriser`, `rectifier`, `terminer`. Pour chaque phase :

- référence exacte au titre et à l'objectif pédagogique du C2 ;
- durée en minutes (entier positif, 240 max par phase ; 600 max au total) ;
- ingrédients concernés (liste de travail **non validée** face à la recette) ;
- gestes à effectuer (liste ordonnée), observation, contrôle, erreur,
  correction, sécurité/allergènes, consigne de pause.

Chaque phase remplie porte son index, son identifiant stable, ses champs
source, le slug et l'empreinte de recette **publiée** sélectionnée en C4C3A.
Une sauvegarde de version modifiée (titre, objectif, recette, empreinte)
avec phase encore remplie est refusée au lieu de rattacher des conseils
à une étape incorrecte. Les anciens brouillons et clients sans le nouveau
champ conservent leur comportement ; si les sources ont changé, la
sauvegarde est refusée. Toute nouvelle phase est relue par une personne.

Le formulaire affiche les six parties dans des panneaux individuels
repliables, en plus du formulaire natif C2 ; une correction explicite des
éléments périmés reste nécessaire. Les données privées sont intégrées à
l'historique append-only, sans changer la réponse du fournisseur C2.

## Diagnostic et limites

`cmsAtelierPhaseDetailsComplete` vérifie la présence des six phases,
leurs durées, gestes, observations, contrôles, erreurs, corrections,
sécurité et pauses. `cmsAtelierBlueprintPreflight` expose
`phase_details_complete` et `ready_for_scripts_drafting`.
**Le résultat est un contrôle de complétude, pas une preuve de qualité
pédagogique ou culinaire.** En particulier les quantités, allergènes et
instructions doivent encore être rapprochés manuellement de la recette
canonique source ; l'empreinte courte n'en prouve pas l'identité intégrale.

Les flags suivants restent **toujours faux** :
`stable_phase_ids_ready` dans le blueprint final,
`seven_audio_scripts_approved`,
`canonical_recipe_details_revalidated`,
`publication_ready`. Les six IDs sont stockés mais leur existence ne
vaut pas visa de la structure native complète.

## Tests et futur C4C3C

`tests/php/editorial-atelier-phase-details-smoke.php` vérifie les six
noms d'étape, durées, données privées, anciennes versions, changements
de titre, empreintes modifiées, ID forgés, doublons et XSS sur le vrai
catalogue Astro généré.

Prochain lot : **sept scripts indépendants** (introduction + six phases),
avec attaches immuables aux phases / recette, relecture humaine et statut
non approuvé. Un fichier MP3 Coral ne sera produit qu'après une validation
séparée des scripts, des droits et des conditions de production.
