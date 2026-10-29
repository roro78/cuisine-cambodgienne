# C4C3C — Sept brouillons narratifs privés Coral V2

29 octobre 2026. **Préparation textuelle**, sans enregistrement, TTS ou
transfert OVH. Les MP3 historiques approuvés ne sont jamais modifiés.

## Sept scripts distincts

Le Studio existant propose des panneaux repliables pour l'introduction
`intro` et les six identifiants de phase hérités de C4C3B
(`installer`, `preparer`, `assembler`, `maitriser`,
`rectifier`, `terminer`). Les textes humains et notes de relecture
restent dans `atelier_scripts.version=1`, dans une nouvelle révision privée.

Chaque brouillon utilise `bindingDigest` (SHA256 calculé côté serveur
depuis la recette source, son empreinte de catalogue, les six phases
détaillées et les champs pédagogiques principaux). Lorsque l'un de ces
éléments change, un script existant **ne peut être réutilisé ou déplacé
automatiquement** : la sauvegarde refuse le rattachement obsolète.
Il faut supprimer explicitement l'ancien texte puis rédiger un nouveau
brouillon pour la nouvelle base.

Le serveur refuse les indices en double, les identifiants de narration
forgés et les tentatives d'ajouter un statut `approved` depuis un formulaire
ou un fournisseur. Les révisions existantes sont immuables ; les anciens
clients conservent le texte et échouent en sécurité si sa source change.

## État de réception

`cmsAtelierBlueprintPreflight` expose
`script_draft_count`, `seven_scripts_drafted`,
`ready_for_audio_review`. Ce dernier n'est qu'un **signal de dossier
assez complet pour lancer une relecture**, jamais un visa.

Pour chaque narration, un texte d'au moins 120 caractères satisfait
la complétude technique ; cela **ne garantit ni la qualité de la narration
ni la cohérence des durées ou la fidélité culinaire**.

Les indicateurs `seven_audio_scripts_approved`,
`canonical_recipe_details_revalidated`,
`stable_phase_ids_ready` (visa du blueprint natif) et
`publication_ready` demeurent explicitement **faux**.
Aucun MP3, appareil audio, média, permis de publication ou choix de voix
n'est dérivé de ces brouillons.

## Conditions nécessaires avant un MP3 Coral

Réceptionner la recette canonique complète (portions, ingrédients,
allergènes, gestes), les six phases, les sept scripts et les minutages ;
faire approuver chacun des scripts et figer l'empreinte des textes.
Puis seulement envisager une génération Coral dans un pipeline séparé,
suivie de l'écoute, du contrôle des chapitres, du scroll synchronisé et
des tests mobile / desktop. **Ne jamais remplacer les MP3 validés** sans
autorisation écrite.

Tests automatisés : `tests/php/editorial-atelier-seven-scripts-smoke.php`
sur catalogue généré réel, versions privées, refus des textes périmés,
contrat IA C2 inchangé, absence de publication, XSS et injection d'approbation.
