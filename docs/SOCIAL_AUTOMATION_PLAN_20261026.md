# Cuisine du Cambodge — Dashboard privé de validation (PR #129)

**Périmètre gelé au 26 octobre 2026 :** terminer l'interface de validation, sans refondre les workflows sociaux existants.

## Acquis et préservés

Les workflows **01 génération + e-mail de validation, 02 Facebook, 03 Instagram**
ont déjà fait l'objet des validations antérieures. Une publication Kroeung
est enregistrée en base comme approuvée et publiée sur Facebook et Instagram.
Le présent chantier **ne modifie aucun de ces trois exports**, n'active aucun
workflow, ne renvoie aucun e-mail et ne republie aucun contenu.

## Interface du dashboard

| Fonctionnalité | État |
|---|---|
| Accès PHP privé (login, CSRF, session et anti-bruteforce) | Code + tests natifs PASS |
| Aperçus Facebook/Instagram, titres, images, légendes | Code + tests PASS |
| Liste, filtres, états, décision humaine et références Meta | Code + tests PASS |
| Accès à l'**ancien formulaire n8n Wait** depuis l'interface | Code + tests PASS : URL signée depuis e-mail, vérifiée, redirection 303 |
| Décider directement sur la carte du brouillon sans coller l'URL | **Non réalisé** : URL de reprise non accessible dans `posts` |
| Déploiement et validation Android sur OVH | **Non réalisé** : environnement OVH non vérifié |

La décision humaine est toujours prise **dans le formulaire n8n déjà opérationnel** :
« Approuver », « Demander une modification » et « Refuser ». L'interface
nouvelle n'écrit pas dans `cuisine_social.posts` et ne crée pas de deuxième
circuit de publication.

### Derniers tests

- [CI de l'intégration minimale #40304409166](https://github.com/roro78/cuisine-cambodgienne/actions/runs/40304409166) : **SUCCESS** (86/86 anciens tests, incluant la redirection HTTP signée).
- La PR a ensuite été **réduite intentionnellement** pour ne pas emporter les
  migrations et les modifications exploratoires n8n/Supabase accumulées.
  Une nouvelle CI ciblée uniquement sur le dashboard doit être verte avant fusion.
- La suppression des fichiers non fusionnés du diff ne touche ni `main`
  ni le n8n / OVH / Supabase réels. Leur historique reste consultable dans Git.

## Objectif de réception

**Depuis Android**, accéder au portail privé, visualiser un brouillon,
ouvrir son formulaire de validation n8n existant et vérifier que sa décision
apparaît ensuite dans l'historique du dashboard.

**Limite fonctionnelle assumée pour ce jalon :** une copie manuelle du lien
d'e-mail est encore nécessaire. Pour des boutons directs sur chaque carte,
il faudra identifier **un mécanisme minimal de lecture sécurisée de l'URL Wait**
associée à chaque brouillon, qui n'altère pas les workflows sociaux existants.
Ne pas inventer ni activer une seconde API de décision.

## Conditions d'ouverture OVH

1. PHP avec `pdo_pgsql`, TLS vers le bon projet Supabase.
2. Rôle `cuisine_social_viewer` de consultation, privilèges vérifiés,
   credential créé localement sans le communiquer à ChatGPT.
3. Tests manuels Android : connexion, filtres, aperçus, formulaire original,
   déconnexion, refus d'URL incorrecte ; aucun e-mail ou Meta réel de test.
4. PR #129 relue et fusionnée **uniquement sur ce périmètre** ; déploiement
   manuel OVH après contrôles de l'hébergement.

Les autres chantiers (plans média, recettes et ateliers IA, migrations
générales des réservations) sont **hors périmètre** et ne conditionnent pas
ce dashboard.


## Origine réelle des futures propositions : audit code du 26 octobre 2026

La question de « quelle est la source qui entre dans le pipeline ? » est résolue
par lecture des modules existants sur `main`, sans modification n8n :

1. **Auteur du site / IA éditoriale** : un article, une recette ou un atelier
   est intégré dans la collection structurée correspondante du site
   (`src/data/recipes.ts`, `restoredRecipes`, `culture.ts`,
   `workshops.ts` ou `cookingWorkshopGuides.ts` après leur gate
   `release_ready`). Une page Astro isolée qui n'est pas référencée
   dans ces collections ne sera **pas** automatiquement découverte.
2. **Agrégation du catalogue** : `src/data/socialCatalog.ts` rassemble
   également ingrédients et techniques, fabrique un `source.id` stable
   (`recette:slug`, `culture:slug`, `atelier:slug`) et une empreinte
   éditoriale `fingerprint`. `src/pages/social-feed.json.ts` expose
   `/social-feed.json`, généré lors du build/déploiement statique.
3. **Workflow 01 existant** : à 07:00 Europe/Paris, GET
   `https://www.cuisine-du-cambodge.com/social-feed.json`. Il consulte
   l'historique de `cuisine_social.posts` puis **choisit un seul sujet**,
   en donnant priorité aux sources inédites et aux catégories selon le jour.
   Critère bloquant : `imageUrl` JPEG
   `https://www.cuisine-du-cambodge.com/social-assets/…jpg` valide.
   **Pas de déclenchement immédiat à chaque création de page**, et une
   source du catalogue n'est pas nécessairement un post proposé ce jour.
4. **Transformation en post à valider** : uniquement après
   `INSERT INTO cuisine_social.posts` réussi, le post prend
   `status=draft`. Le workflow envoie le mail Resend et passe dans
   l'ancien `Wait` n8n (72 heures). Le dashboard est une **vue sur
   cette table**, pas une seconde source ou une file recréée.
5. **Décision** : `draft` apparaît dans le filtre « À valider » ;
   `revision_requested` dans « À corriger », `approved` puis
   `published` continuent dans les workflows existants 02/03.

**Écart fonctionnel à arbitrer ultérieurement, sans régression :** si l'on
souhaite « nouvelle page validée ⇒ proposition immédiate dans le dashboard »,
un déclencheur de nouveauté ou un scan sur événement de déploiement serait à
ajouter. Il n'existe **pas** actuellement. Avant de l'implémenter, conserver
la règle d'une seule proposition quotidienne et les protections d'idempotence,
pour ne pas réémettre des mails ni déclencher plusieurs posts.

**Amélioration P0 dashboard incluse dans cette PR :** explication concise
de cette origine, compteurs À valider/À corriger, catégories Recette/Carnet/
Atelier/Ingrédient/Technique sur chaque carte, et état vide explicite.
Aucune connexion externe ni exécution n8n supplémentaire.
