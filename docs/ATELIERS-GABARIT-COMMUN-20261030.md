# Cuisine du Cambodge — Gabarit commun des ateliers-recettes

## Décision et périmètre

Les six ateliers-recettes actuellement publiables partagent désormais
**une seule page Astro** : `src/pages/apprendre/pratique/[slug].astro`.

- Les blueprints culinaires restent dans
  `src/data/atelier-recette-guides/*.json`. Ils ne sont pas modifiés.
- Le registre `src/data/cookingWorkshopGuides.ts` référence explicitement ces
  blueprints (un import et une entrée, sans nouveau fichier Astro).
  **Seuls les blueprints `release_ready`** génèrent des pages publiques.
  Un nouveau JSON privé ou non approuvé ne doit pas produire de page publique.
- Le contrat de sortie conserve une recette canonique, six phases, un
  lecteur audio facultatif qui ne charge **que le MP3 de l'asset vérifié**,
  un sélecteur de portions et des protections SEO `noindex` pour les
  statuts non publiés.
- Le gabarit spécifique `kroeung-jaune.astro` est retiré. La **même
  URL publique historique** `/apprendre/pratique/kroeung-jaune/`
  continue d'être produite depuis le gabarit commun.
- La configuration `src/data/workshopPresentation.ts` stocke les
  exceptions d'affichage liées au produit (ex. portions en petits pots,
  légende de photo et lien de fin d'atelier). Elle ne duplique ni le
  gabarit Astro ni les données de la recette.

## Comportement attendu pour un nouvel atelier

1. Préparer la recette source et son blueprint au **format déjà validé**
   par `scripts/check-workshop-blueprints.mjs`.
2. Vérifier les six phases, les sources, les allergènes, les ingrédients,
   l'image et les données d'accès (audio éventuellement facultatif).
3. Conserver `draft` / `review` jusqu'aux validations humaines réelles.
   Aucune page publiée n'est générée par une simple sauvegarde Studio.
4. Après approbation et modification explicite des sources Git avec une
   version `release_ready`, la construction Astro génère la page dans
   le gabarit commun, sans nouveau fichier `[atelier].astro`.
5. CI, contrôle du rendu téléphone/ordinateur, contrôle des assets et
   approbation de livraison **distincts** avant transfert OVH.

Le constructeur Astro n'est **pas** lié automatiquement aux brouillons
privés du CMS : le pont typé de conversion d'un brouillon approuvé vers un
blueprint Astro complet reste un chantier à part. Pas de publication
automatique, d'envoi n8n, de médias inventés ni de génération MP3.

## Contrôle de non-régression

Les tests `tests/atelier-kroeung-page.test.mjs` et
`tests/atelier-kroeung-browser.test.mjs` vérifient que Kroeung
garde son URL, ses six phases, son affichage d'ingrédients, les
**petits pots**, la sécurité, son image et le comportement du lecteur
sur 360/390/768/1440 pixels. Les cinq autres conservent leur
contrat de rendu et de quantités via la même page dynamique.

Le référencement historique des six ateliers n'est pas réinitialisé
quand un nouveau JSON de brouillon est ajouté au registre.

## Livraison

Aucun transfert OVH automatique. Les modifications concernent les
**sources Astro et la sortie statique générée**, pas le code PHP
`gestion-contenus/`. Après fusion et CI verte, identifier les chemins
`dist/` affectés et les assets nécessaires, sauvegarder ces fichiers
et suivre les procédures OVH existantes, avec manifeste SHA256 et
restauration. Ne jamais recopier simplement les sources `.astro` sur
le serveur statique.

La revue visuelle physique Android et les tests des six URL de
production restent à effectuer après transfert explicite.
