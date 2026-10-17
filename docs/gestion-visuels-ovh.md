# Gestion des visuels — espace éditorial

Page prévue après activation sur OVH : `https://www.cuisine-du-cambodge.com/gestion-visuels/`.

## Parcours

Connexion administrateur, choix de la page, de la section et de l'étape, dépôt de 1 à 10 images. Les originaux sont enregistrés dans la branche `assets/cuisine-inbox`, sous `asset-inbox/<identifiant>/`. Un fichier `manifest.json` indique le nom canonique, la page, l'étape, la version, les dimensions et le SHA-256. Aucun import n'est publié automatiquement sur le site.

Exemple de nom : `atelier__piler-aromates-au-mortier__etape-02__v01.webp`.

## Conditions de mise en service

Le site OVH doit interpréter le PHP. Un fichier de configuration privé, extérieur à la racine Web, doit exister dans `~/.cuisine-asset-portal/config.php`, avec les paramètres `admin_user`, `password_hash` et `github_token`. Le mot de passe est enregistré uniquement sous forme hachée. Le jeton GitHub doit être restreint au seul dépôt et au droit Contents: Read/Write. Ne saisir aucun secret dans le chat ou dans GitHub.

Le fichier privé nécessite les permissions propriétaire uniquement (dossier 0700, fichier 0600). La page **refuse toute connexion et tout upload tant que la configuration n'est pas présente**.

Avant ouverture aux utilisateurs, activer ce fichier dans la session SSH OVH, vérifier PHP, HTTPS, le refus d'accès anonyme, puis effectuer un envoi test réel. L'assistant présent ne dispose pas d'une session OVH directe.

## Confidentialité

La page est protégée par authentification, mais le dépôt GitHub de destination est public : les fichiers reçus ne sont pas automatiquement en ligne sur le site, mais peuvent être vus sur GitHub. Réserver ce portail aux illustrations destinées à publication, pas à des documents confidentiels. Un stockage réellement privé nécessiterait un dépôt privé autorisé ou un espace privé relié aux outils.

## Intégration

Dans un échange ultérieur, demander de lire les nouveaux manifestes de la branche `assets/cuisine-inbox`. L'assistant peut récupérer les images et préparer un commit/PR pour les placer sur les pages désignées. **Ne pas fusionner automatiquement les nouvelles images** : vérifier la cohérence, puis publier selon le circuit habituel OVH.
