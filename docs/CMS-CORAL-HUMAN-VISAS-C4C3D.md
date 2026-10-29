# C4C3D — Visas humains des sept textes Coral V2 (hors audio)

29 octobre 2026. Le Studio privé conserve les six phases et sept brouillons
C4C3B/C. Ce lot ajoute une **décision humaine explicite, par narration**,
qui ne peut être introduite par une réponse d'IA.

## Parcours

Depuis l'aperçu d'un brouillon d'atelier complet, la personne connectée
consulte l'intégralité du texte d'un chapitre puis coche une confirmation
explicite et choisit **« Valider ce texte uniquement »**. La révocation se
fait au même endroit. L'action exige HTTPS, session authentifiée, jeton CSRF
et numéro **exact** de la version enregistrée.

Les décisions sont inscrites dans un journal privé append-only
`script-visa-<id>.<numéro>.json`, distinct du contenu de l'atelier.
Chaque événement mémorise uniquement la version, le chapitre, son SHA256
de texte, le SHA256 du binding pédagogique, une date UTC, l'action et
l'empreinte de l'événement précédent. Aucun texte, mot de passe ou
référence documentaire ne figure dans ce journal.

L'accès concurrent aux modifications et aux visas utilise le même verrou
`catalog.lock`. Une nouvelle version de brouillon, **même identique**,
invalide les visas précédents. Une révocation produit un nouvel événement,
sans supprimer l'historique. Les événements altérés, manquants ou hors ordre
rendent le calcul de statut indisponible, jamais « validé ».

La revue n'est proposée que pour un atelier disposant d'un
`ready_for_audio_review` strictement vrai, sur le catalogue actuel.
Chaque panneau expose le texte complet soumis à décision.

## Distinctions cruciales

`all_seven_texts_reviewed=true` signifie **sept textes relus par l'humain
pour cette version précise**, et rien de plus.

`authorizes_tts=false`, `audio_approved=false`,
`publication_ready=false` restent **invariants**, quel que soit le
nombre de visas. Les marqueurs du blueprint original
`seven_audio_scripts_approved` et
`canonical_recipe_details_revalidated` ne sont pas modifiés.

Un second contrôle, distinct et documenté, devra valider les doses et
les gestes contre la recette Astro intégrale, les droits d'utilisation,
l'écoute, les minutages et la synchronisation des chapitres. Un futur
service Coral n'a **aucune autorisation** de lancer la synthèse du seul fait
de la présence de ces visas.

Pas de déploiement OVH, aucun accès n8n/Ollama, aucune production ou
écrasement de MP3, aucune publication.

## Réception

`tests/php/editorial-coral-human-visa-smoke.php` couvre les sept visas,
révocation, réapprobation, concurrence de version, refus d'utilisateur
non authentifié et de confirmation absente, journal append-only,
invalidation après nouvelle version, rejet de marqueur d'approbation
forgé et corruption du journal. La CI l'exécute en PHP 8.3 et 8.4.
