# P1C-C4A — Diagnostic des écarts vers les vrais modèles Astro

29 octobre 2026. **Lot privé et non publiant.** Ce travail complète le raccordement
C2 et le benchmark structuré C3 sans activer de fournisseur ni déployer sur OVH.

## Problème résolu

Un candidat C2 peut satisfaire `cmsCreationReady` : cela signifie uniquement
que les champs du formulaire commun `creation-form-core-v1` sont suffisamment
renseignés pour une relecture. Ce contrôle **n'autorise jamais** une publication
Astro, ni un atelier Coral V2.

Le nouvel inventaire `cmsAstroPublicationCoverage` dans
`public/gestion-contenus/publication-gap-audit.php` distingue, pour chacune des
cinq familles, les champs non couverts par le formulaire actuel et les étapes
humaines/techniques restant à vérifier.

Le rapport `cmsAstroPublicationGapReport` :
- accepte une création privée déjà enregistrée ;
- indique si ses champs de formulaire sont complets pour le **socle C1/C2** ;
- expose les groupes de champs absents de ce socle pour le modèle Astro cible ;
- indique les autorisations et contrôles manquants ;
- retourne toujours `publication_ready: false`, même pour une révision `review`
  ou si un champ de provenance prétend le contraire.

L'interface du Studio commun affiche ces écarts dans un panneau repliable sous
l'aperçu des nouvelles créations. Elle n'écrit aucun état, ne convertit pas les
données Astro et ne déclenche ni réseau, IA, audio ou publication.

## Cibles vérifiées dans le dépôt

| Famille | Source cible | Manques prioritaires du formulaire |
|---|---|---|
| Recette | `src/data/recipes.ts` | difficulté, catégorie, tags ; quantités numériques et métadonnées ingrédients/gestes ; liens, FAQ et visuels |
| Carnet | `src/data/culture.ts` | sources documentaires structurées, image et dimensions, galerie/crédits si nécessaires |
| Atelier | `src/data/atelier-recette-guides/*.json` | recette canonique, durées, sécurité, six phases détaillées, scripts et dossier Coral V2, droits et autorisations |
| Ingrédient | `src/data/ingredients.ts` | média, dimensions, provenance et vérifications documentaires |
| Technique | `src/data/recipeTechniques.ts` | liens recettes/ateliers et média, contrôle sécurité |

**Nuance :** cette liste est un inventaire des lacunes du formulaire, pas la preuve
que ces valeurs sont réellement absentes de toute ressource existante. Certains
champs Astro sont facultatifs et certains médias peuvent être réutilisés après
contrôle des droits. Il faudra distinguer les champs obligatoires, facultatifs
et dérivables au moment de créer le convertisseur typé.

## Livraison OVH future — dépendance obligatoire

Le contrôleur `public/gestion-contenus/index.php` inclut désormais
`publication-gap-audit.php`. **Ne jamais transférer le nouvel `index.php`
sans ce fichier et la version cohérente de `lib.php`** : sinon le CMS
répondrait en erreur dès son chargement, y compris à la connexion anonyme.

Le smoke HTTP C2 en copie temporaire a été étendu pour embarquer ce helper
et contrôler la présence du diagnostic sur une création sauvegardée.
Aucune livraison OVH n'est autorisée par cette PR.

## Garanties

- Même `index.php`, même parcours et même stockage pour les cinq familles.
- Aucun champ généré automatiquement n'est marqué comme approuvé.
- Un formulaire complet reste explicitement **non publiable**.
- Les anciennes révisions restent intactes ; pas de migration.
- La narration et les MP3 Coral existants restent intouchés.
- Les données de recherche privées ne sont jamais envoyées dans un rendu public.

Tests : `tests/php/editorial-astro-publication-gap-smoke.php` avec les cinq
familles, statut `review` même forcé, champs incomplets et inconnus, garde-fou
sur le rendu du Studio. Exécution par la CI en PHP 8.3 et 8.4.

## Suite nécessaire

**C4B** : établir pour chaque modèle un contrat de conversion typé/versionné
avec champs obligatoires, optionnels, dérivables et références canoniques ;
ajouter les champs dans le Studio commun en préservant les anciennes versions
et les sorties du fournisseur C2, puis tester une création privée complète.

**C4C** : enrichir la pédagogie atelier Coral V2 sous contrôle de la recette
source, avec sept scripts approuvables séparément. Aucun MP3 n'est généré ici.

**P2** : construire l'aperçu Astro fidèle au type et au rendu actuel ;
**P3** : préparer la PR de publication uniquement après les visas éditoriaux,
médias, CI et autorisation explicite.

Ce C4A n'est donc ni un convertisseur, ni un workflow de publication et ne
réceptionne pas la qualité du contenu généré par un moteur IA réel.
