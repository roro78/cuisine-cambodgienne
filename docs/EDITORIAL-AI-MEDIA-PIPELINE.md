# Cuisine du Cambodge — Pipeline éditorial IA, manuel et calendrier média

**Décision structurante : 28 octobre 2026.**  
**Statut : plan de réalisation et contrat de données du premier maillon. Pas un système de génération IA actif.**  
**À lire avec :** [Architecture du Studio éditorial](CMS-STUDIO-ARCHITECTURE.md) et [Plan CMS](CMS-EDITORIAL-PLAN-20261026.md).

## Intention produit

**Le pipeline commence avant n8n et Meta : il commence par la CRÉATION du contenu.**

Dans le Studio éditorial privé, l'administrateur doit pouvoir :
- proposer **manuellement** une recette, un nouvel atelier, un Carnet culturel, une fiche ingrédient ou une fiche technique ;
- demander à l'**IA** de proposer une idée ou de rédiger une première version dans les mêmes champs ;
- visualiser un **calendrier éditorial et média**, y compris les idées, relectures, contenus prêts et cibles de publication ;
- **modifier, refuser ou approuver** le contenu avant toute publication ;
- convertir la fiche approuvée en une **vraie page Astro** qui utilise exactement le gabarit public et le gabarit CMS verrouillés ;
- et **seulement après** publier sur le site et préparer ses déclinaisons Facebook/Instagram via les workflows n8n existants.

La saisie manuelle et la génération IA passent **par le même contrat et le même éditeur**. L'IA est un mode de saisie, pas une filière parallèle.

## Parcours cible

~~~text
VEILLE / IDÉE MANUELLE / PROPOSITION IA
           |
           v
Contrôle anti-doublons (pages en ligne + brouillons + programme média)
           |
           v
FICHE DE CRÉATION DANS LE STUDIO
  famille : recette | Carnet | atelier | ingrédient | technique
  brief / angle | texte | sections métier | médias envisagés
           |
           v
BROUILLON PRIVÉ VERSIONNÉ + APERÇU VRAI GABARIT
           |
           v
REVUE ÉDITORIALE HUMAINE
  faits, authenticité khmère, lexique, droit des images, SEO,
  anti-cannibalisation, vérification du modèle et de l'audio
           |
           v
APPROBATION POUR LE SITE (ne publie encore rien)
           |
           v
PR SOURCE ASTRO + TESTS + APPROBATION + DÉPLOIEMENT SITE
           |
           v
DÉCLINAISONS RÉSEAUX / CALENDRIER MÉDIA
           |
           v
AUTORISATION HUMAINE META + N8N 01/02/03 + MESURE
~~~

**Jamais d'autopublication** par la simple création d'un brouillon ou par une réponse IA.

## Familles de contenu, gabarit obligatoire

| Famille | Champs de création ciblés | Contrainte |
|---|---|---|
| Recette | titre, introduction, contexte, portions, temps, ingrédients structurés, étapes, conseils, FAQ, visuels | Conversion typée vers \`recipes\` / \`restoredRecipes\`, pas de JSON brut côté utilisateur |
| Atelier | objectif pédagogique, préparation, matériel, chapitres, exercices, repères, média et guide audio en option | Audio narré et MP3 Coral **exclus du pipeline automatique** tant qu'ils n'ont pas été générés, réceptionnés et approuvés |
| Carnet culturel | angle historique, introduction, sections et paragraphes, pistes iconographiques, SEO | Zéro recette déguisée en Carnet, éviter doublon avec atelier ; sources de recherche conservées **en privé**, pas citées dans les pages |
| Ingrédient | rôle, profil aromatique, usage, conservation, choix, accords, erreurs, médias | Cohérence avec fiches ingrédients et recette |
| Technique | préparation, matériel, étapes, variantes, questions, visuels | Une seule fiche canonique par technique |

Toutes ces fiches doivent être **éditables depuis le gabarit unique** décrit dans \`CMS-STUDIO-ARCHITECTURE.md\`. Les nouvelles pages publiques héritent des mêmes composants, styles, balises SEO, adaptations mobile et navigation que les pages existantes. **Pas de second thème ni de page indépendante créée par l'IA.**

## Donnée d'entrée commune — premier contrat livré

\`scripts/editorial-content-pipeline.mjs\` définit \`cdc-editorial-content-intake-v1\`.

Champs de la fiche de planification :
- \`kind\` : les cinq familles existantes ;
- \`origin\` : \`manual\` ou \`ai\` ; provenance conservée ;
- \`title\`, \`slug\`, \`angle\`, \`summary\`, \`sections\` ;
- \`channels\` : inclut toujours \`site\`, puis Facebook/Instagram au besoin ;
- \`target_date\` : date **de planification éditoriale**, pas un déclencheur automatique ;
- \`research_note\` : notes de vérification **privées**, à exclure du rendu public ;
- \`stage\` : \`idea → draft → review → approved → scheduled → published\` ;
- preuve d'approbation humaine et preuve de publication pour franchir les états correspondants.

Le module et ses tests sont **hors du navigateur public**. Il ne contient aucun jeton, n'appelle pas d'API IA, ne modifie aucun fichier Astro et n'envoie rien à Meta. Une future interface PHP devra valider les mêmes champs et contrôler la version/CSRF avant de sauvegarder dans le stockage privé existant. Ne pas recopier arbitrairement la validation JavaScript en production sans test de parité PHP.

### Anti-doublons : double contrôle obligatoire

1. **Bloquer** titre ou slug exact normalisé d'une même famille dans le catalogue **et dans les créations déjà prévues**.
2. **Signaler** les sujets très proches (plusieurs titres avec forte similarité) pour arbitrage humain.
3. Autoriser un thème commun à deux familles uniquement si l'**angle éditorial est réellement différent** : par exemple l'histoire du Kroeung dans les Carnets et la recette de préparation dans la cuisine.
4. Rechercher aussi synonymes, traductions khmères, cannibalisation SEO et sujets proches par une **revue sémantique IA + humaine**, car une similarité textuelle ne démontre pas l'absence d'un doublon.

**L'IA ne doit pas décider seule qu'un doublon est absent.** Les contenus existants et les créations non publiées sont les deux sources de contrôle.

## Calendrier média IA — règles de fonctionnement

Le calendrier est un **outil de pilotage**, pas un minuteur de publication directe :
- vues semaine / mois par famille, canal, responsable, état et date cible ;
- idées proposées par la veille, demandes manuelles, propositions IA et relectures en retard ;
- recommandations de sujets selon saisonnalité, actualité, sujets déjà traités, performance et temps de production ;
- répartition éditoriale équilibrée ; éviter d'enchaîner des recettes voisines ou des visuels presque identiques ;
- lien entre un **contenu canonique** et ses déclinaisons sociales, pour empêcher les publications concurrentes et relier les performances à l'article source ;
- dates et légendes sociales recalées sur les formats réels et **jamais** envoyées à n8n sans consentement.

Le planning peut proposer des dates, mais aucune date par défaut n'est une autorisation de publication.

## Phases ordonnées (sans détour par la diffusion sociale)

| Jalon | Résultat testable | État |
|---|---|---|
| P0 — Architecture universelle | Gabarit Studio commun, 35 fiches du catalogue éditables en proposition, contrôle des futurs IDs | **Acquis** (PR #137), déploiement OVH des dernières corrections à confirmer |
| **P1A — Contrat de création** | Identité des cinq familles, provenance IA/manuelle, anti-doublons, états, calendrier et preuves de validation ; tests sur vrai catalogue | **Implémenté en branche** (à intégrer seulement si CI PASS) |
| **P1B — Créer manuellement** | Bouton « Nouveau contenu » dans le Studio, formulaires par famille, blocs de texte ajoutables, stockage privé versionné, projets et anti-doublons publiés + projets | **Implémentation en PR** — réception OVH, aperçu Astro fidèle et publication encore distincts |
| **P1C — Générer avec IA** | Même formulaire prérempli par IA après brief, retour en brouillon, contrôles factuels, citations de travail internes et validation humaine ; aucun jeton dans navigateur | **À développer** |
| P2 — Aperçu éditorial fidèle | Prévisualisation réelle Astro au format du type choisi, médias à valider et comparaison source/brouillon | **À développer** |
| P3 — Conversion et mise en ligne du site | Génération de données Astro sur branche, PR, CI et déploiement **après approbation**, contrôle de non-régression sur SEO/audio/médias | **À développer** |
| P4 — Calendrier média | Planning glissant, génération de variantes sociales contrôlées et validations | **À développer** |
| P5 — n8n / Meta | Rebrancher workflows existants **uniquement** après restauration des accès Meta et preuves de publication/non-doublon ; suivi performances | **Bloqué accès Meta**, indépendant du développement P1 |

### Critères de réception du premier véritable module Studio (P1B)

- Depuis un téléphone : « Nouveau contenu », choix de chacune des cinq familles, rédaction, brouillon sauvegardé et historique consultable.
- Le même gabarit commun se voit dans un nouvel article et dans une fiche existante.
- Création possible **sans IA** et sans manipulation JSON.
- Titre identique à une fiche publiée ou à un projet existant **refusé** avec explication ; sujet proche **signalé**.
- Des champs incomplets restent en brouillon de préparation ; pas d'export ni d'approbation tant que le schéma typé est incomplet.
- Aucun texte généré ne devient une page visible sans les deux validations : éditoriale puis technique.
- Les six MP3 Coral et scripts approuvés restent inchangés.
- Tests de création, doublons, sécurité, sauvegarde et publication négative : **zéro push Meta/n8n**.

## Jalons de sécurité et limites

- Stocker les propositions **hors webroot** et dans des révisions immuables ; CSRF, authentification, contrôle de versions.
- Une IA de rédaction doit recevoir des consignes et des données publiques autorisées, pas les secrets CMS ni les brouillons privés indiscriminément.
- Vérification humaine de toute affirmation historique, d'un conseil de sécurité alimentaire et des droits médias.
- Aucun doublon « garanti à 100 % » sans revue sémantique humaine ; le contrat technique couvre les collisions exactes et un premier signalement des titres proches.
- Les documents de travail peuvent référencer des sources pour vérification, mais **aucune source ne doit être affichée sur nos pages publiques**, conformément à la ligne éditoriale.
- Pas de fabrication d'images, MP3 ou pages publiques sans validation dédiée.
- Travailler en une PR par étape, sans modifier directement \`main\`, avec CI avant fusion et livraison OVH manuelle ciblée après sauvegarde.

**Ce plan est le point de reprise principal du chantier « création IA + calendrier média », y compris après changement de conversation.**

### P1B — Contrat de réception intermédiaire du Studio de création manuelle

La création manuelle prépare une **nouvelle fiche privée** et non un changement sur une page existante. Ses révisions sont stockées dans `editorial-drafts/new-content` sous la racine privée du CMS. Un bouton « Nouveau contenu » ouvre les cinq familles déjà prises en charge ; les champs et les composants visuels sont issus d'un seul rendu partagé. Les tableaux structurés (étapes, sections, ingrédients, chapitres) admettent l'ajout ou le retrait de lignes **dans le formulaire**, jamais dans une source Astro directement.

L'éditeur distingue `Brouillon` (champs partiels autorisés) de `Soumettre à relecture` (champs requis). Une sauvegarde ajoute une version immuable, sans écraser les anciennes. Les collisions exactes de titre/slug de **même catégorie** avec le catalogue publié ou un autre projet privé sont bloquées ; des titres proches sont signalés. Différentes familles peuvent traiter un thème commun avec des angles différents.

**Limites à respecter :** la fiche créée n'est pas encore une entrée `recipes`/`culture`/`ingredients`/`workshops`/`recipeTechniques` d'Astro. Une révision prête à relire n'est ni une approbation finale ni une page publiable. Le prochain jalon doit convertir le contenu en source typée complète avec médias obligatoires, aperçus publics et PR/CI — uniquement après contrôle humain. L'IA ne rédige encore aucun contenu depuis le CMS. Le calendrier graphique reste à développer. Les MP3 Coral et les données des ateliers publiés demeurent intacts.

**Déploiement :** cette étape ne change que les fichiers `public/gestion-contenus/index.php` et `public/gestion-contenus/lib.php`. Le paquet de 6 fichiers existant demeure compatible, mais après une fusion CI complète il faudra sauvegarder et transférer ces deux PHP uniquement sur OVH, puis vérifier le nouveau flux en Android. Ne pas confondre tests GitHub et réception de production.
