# Cuisine du Cambodge — plan durable du CMS éditorial

Démarrage : 26 octobre 2026. Branche de travail isolée : cms/editorial-drafts-p0-20261026. Cette branche part de main et n'inclut pas la PR sociale #129 (dashboard distinct, non déployé).

## Objectif du CMS

Une interface unique pour consulter, modifier, préparer, mettre en brouillon, prévisualiser, approuver, publier et éventuellement dépublier recettes, Carnets, ateliers, ingrédients et techniques. Après publication validée sur le site, générer seulement des propositions sociales vers les workflows n8n 01/02/03 **existants**, via la décision humaine existante. Aucune duplication d'article ou d'atelier.

## Architecture réelle

Les pages sont structurées en TypeScript/Astro, non dans un CMS WordPress : src/data/recipes.ts ; restoredRecipes.ts ; culture.ts ; workshops.ts ; cookingWorkshopGuides.ts ; ingredients.ts ; recipeTechniques.ts. Les MP3 et photos ont leurs propres contrats. Toute modification future doit respecter ces modèles, les URLs existantes et l'intégrité des recettes.

L'artefact ovh-production expose 35 contenus sociaux (16 recettes, 7 Carnets, 6 ateliers, 4 ingrédients, 2 techniques), 32 avec JPEG social. Un seul post Supabase historique publié ingredient:kroeung. Ne jamais lui refaire une publication sociale.

## Jalons et statuts

P0A — **Implémenté sur branche CMS, à tester** : page PHP mobile privée /gestion-contenus/ ; authentification à l'aide du compte admin existant ; bibliothèque issue du flux social existant ; filtres ; propositions de titre, résumé et texte éditorial ; état privé Brouillon ou Prêt pour relecture ; aperçu échappé ; conservation de versions append-only sous ~/.cuisine-asset-portal/editorial-drafts/ avec verrouillage exclusif ; conflit de version et d'empreinte ; aucun changement du site, des posts ni de n8n.

P0B — À faire : adapter les formulaires à tous les champs réels par type (ingrédients, étapes, sections culturelles, guides atelier et MP3). Valider notamment la cohérence culinaire et l'éditorial historique.

P1 — À faire : compiler les changements sur une branche GitHub dédiée avec vérification de SHA, CI, prévisualisation réelle Astro, PR et approbation humaine, jamais modification automatique de main.

P2 — À faire : statut de publication des vraies pages / mode brouillon / dépublication sûre / versions et SEO conservés. Ne pas confondre dépublication du site et suppression d'un post Meta.

P3 — À faire : générateur IA, calendrier éditorial, images sociales, MP3 ateliers, contrôle de doublons strict, règles rédactionnelles validées.

P4 — À faire : raccorder les contenus publiés au **workflow 01 déjà existant**, emails Resend et Wait, puis workflows 02/03 inchangés. Aucun contournement du circuit de validation.

P5 — À faire : intégration UX dans l'unique espace administrateur et réception OVH/Android.

## Règles et limites de P0A

- Cette étape ne permet PAS de modifier réellement les fichiers Astro. Les champs édités sont des **propositions**, même s'ils ressemblent aux champs existants. Cela évite de casser recettes, guides audio et SEO.
- Stockage PHP privé hors racine web (répertoire créé avec permission 0700 ; fichiers versions en 0600). Chaque validation crée une version immuable et vérifie la version attendue ainsi que l'empreinte de la source en lecture seule.
- L'interface n'a aucune connexion écriture GitHub, Meta, Supabase ou n8n. Ni publication ni suppression de pages, ni activation de workflows.
- Authentification HTTPS, cookie sécurisé, CSRF, anti-bruteforce, mot de passe haché dans la configuration privée OVH déjà existante. Ne jamais exposer des secrets.
- La branche CMS et ses tests restent **distincts** de la PR #129.
- Le workflow GitHub Actions propre au CMS est uniquement un contrôle ciblé ; pas de déploiement automatique.
- En production il faudra fusion contrôlée, publication statique manuelle, synchronisation SSH OVH et test de permissions, **uniquement après accord**. La CI verte ne vaut pas une mise en ligne.


P0A — Amélioration de lisibilité : la bibliothèque identifie désormais pour chaque contenu une proposition déjà enregistrée, son état privé (Brouillon/Prêt pour relecture), sa version, et une alerte si l'empreinte publique a évolué. En cas de dérive, le formulaire refuse une sauvegarde tant que la source n'a pas été revue. Aucun effet sur la publication sociale.


## P0B — propositions structurées, 26 octobre 2026 (livraison partielle)

La PR #130 contient maintenant un validateur de patchs JSON partiels par type de contenu. Les propositions et leur schéma sont enregistrés dans les révisions privées, jamais dans Astro. Une valeur omise ne constitue **pas** une demande de suppression.

- **Recettes :** ingrédients objets détaillés (nom, quantité, unité, groupe, etc.) ou chaînes pour les anciennes fiches, étapes et temps, portions.
- **Carnets :** sections titrées avec paragraphes.
- **Ateliers :** étapes pédagogiques, phases avec actions et script audio proposés, sans remplacement MP3.
- **Ingrédients :** textes approfondis, usages, conseils.
- **Techniques :** matériel, étapes et alternatives.

**P0B NON TERMINÉ :** l'interface propose pour l'instant une saisie JSON validée destinée à préparer la transition ; elle ne charge pas encore le contenu Astro intégral sous forme de champs guidés. Il manque le manifeste canonique à SHA complet, l'éditeur de formulaires de tous les champs natifs, le diff GitHub épinglé et la revue build Astro. L'empreinte actuelle du social-feed, centrée sur les extraits sociaux, ne couvre pas exhaustivement les ingrédients/MP3. Il est donc interdit de considérer ces patchs comme applicables automatiquement à la production.

**Discipline PR :** #128 a été clôturée sans fusion, ses documents de pilotage conservés dans #127. #127 reste la revue d'images Carnets ; #129 la réception dashboard social ; #130 le CMS. Aucune nouvelle PR P0B, aucune activation ou publication de contenu.
