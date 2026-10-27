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


## 27 octobre — empreinte exhaustive du modèle Astro (P0B / garde avant écriture)

Ajout de `/editorial-source-index.json`, **index public non confidentiel contenant uniquement** les identifiants, familles, noms de modèles et SHA-256 des **enregistrements complets**. Les ingrédients, toutes les étapes, scripts d'atelier, liens médias et références internes contribuent au SHA-256, **mais ne figurent pas dans le JSON transmis**. Aucun contenu éditorial original n'est dupliqué dans cette URL ; pas d'impact sur `social-feed.json` ni sur la logique des trois workflows n8n.

Le CMS PHP confronte chaque proposition structurée à cet index complet et vérifie :
- présence de chaque `source_id` du catalogue, unicité et modèle autorisé ;
- empreinte exacte affichée à l'ouverture et soumise à l'enregistrement ;
- absence de variation depuis la révision privée précédente (blocage fail-closed) ;
- rejet d'une suppression silencieuse de la structure d'un brouillon ;
- conservation de l'historique append-only et du circuit distinct pour les seules propositions textuelles.

**Compatibilité :** si `editorial-source-index.json` n'a pas encore été déployé sur OVH, le CMS permet encore les propositions textuelles P0A, mais **refuse toute sauvegarde structurée**. Il ne doit jamais inventer une empreinte ou se rabattre sur celle du catalogue social. Les anciens brouillons structurés sans empreinte canonique nécessitent une réconciliation éditoriale explicite, pas un écrasement automatique.

**Limites :** cet index est calculé lors du build et décrit la version du site servi par OVH, pas nécessairement le `main` actuel après de nouveaux commits. L'étape ultérieure de génération de PR doit vérifier l'identité du blob GitHub source et la version du contenu canonique **au moment de l'application**, puis reconstruire/tester Astro. L'interface P0B reste une édition de propositions JSON, pas encore une édition guidée de tous les champs ni un éditeur de MP3. Aucun déploiement ni lancement n8n/Meta/Resend n'est autorisé par ce jalon.

**Tests :** ajout des contrôles PHP de refus des index absents, modifiés ou dupliqués et des tests Node construisant le vrai catalogue Astro pour vérifier les identifiants et les variations de digest lors du changement d'une quantité, d'une narration ou d'une référence MP3. Les tests rejoignent la CI principale. Si elle échoue, ne pas fusionner.


## 27 octobre — P1A, circuit de modification contrôlée des recettes

**Objectif :** faire passer une proposition structurée déjà marquée *Prêt pour relecture* dans un fichier de demande de modification contrôlé, puis un patch GitHub sur une branche isolée. Ce jalon ne touche qu'aux **recettes classiques et historiques** : les MP3 Coral, les ateliers, les Carnets, l'automatisation IA et la publication OVH restent exclus.

### Exécution en deux zones de confiance
1. Après authentification, le CMS compare `source_id`, l'empreinte sociale, l'empreinte SHA-256 de la fiche Astro entière, son modèle et le dernier numéro de version. Il n'exporte que les propositions de recettes en état `review`, depuis une requête POST avec CSRF. Un GET ne valide rien et n'exporte pas.
2. Le téléchargement `cms-recipe-<slug>-v<version>.json` comporte uniquement un **contrat de demande**, sans token GitHub, sans droit d'écriture ni état de publication.
3. Dans une copie locale du dépôt ou dans une exécution contrôlée, utiliser `scripts/apply-reviewed-recipe-request.mjs` : le script reconstitue la vraie recette à partir de TypeScript, contrôle le SHA-256 complet, l'identité de la fiche, les champs modifiables, le nombre d'étapes/ingrédients et les propriétés non éditables. Aucune modification de la source si le SHA ne correspond pas.
4. **Simulation par défaut** (affiche les anciennes/nouvelles valeurs, aucun fichier modifié). Pour écrire, spécifier `--write`, être sur une branche propre de la forme `cms/content-...`, avoir un `main` local **épinglé** au commit demandé et une branche créée sur ce commit. Aucun commit, push, PR, fusion ni déploiement n'est effectué par ce script.
5. Une personne vérifie `git diff`, les quantités, les allergènes et le contexte de la recette, lance `npm run check`, `npm run test:recipes` et `npm run build`, puis ouvre une PR GitHub. Re-vérifier la base `main` avant la fusion, et effectuer séparément le déploiement manuel OVH.

**Commandes en local sur copie Git de confiance :**

```bash
git fetch origin main
git switch main
git pull --ff-only
git switch -c cms/content-recette-REVUE
SHA="$(git rev-parse main)"
node scripts/apply-reviewed-recipe-request.mjs --request /chemin/prive/cms-recipe-v3.json --base-sha "$SHA"
# Après contrôle du résultat simulé :
node scripts/apply-reviewed-recipe-request.mjs --request /chemin/prive/cms-recipe-v3.json --base-sha "$SHA" --write
git diff --check
git diff -- src/data/recipes.ts src/data/restoredRecipes.ts
npm run check && npm run test:recipes && npm run build
# Commit et PR GitHub uniquement après examen du diff.
```

**Réserves structurantes :** le champ `title`, `summary` ou `editorial_text` du brouillon ne s'applique pas implicitement à la recette ; seul le patch structuré est compilé. Les tests empêchent les suppressions de lignes, l'ajout de propriétés arbitraires, la mutation de métadonnées de mise à l'échelle ou le changement de slug/média. Une demande JSON exportée n'est pas une preuve cryptographique d'approbation : le diff et la décision humaine restent obligatoires. Pas de publication automatique depuis le CMS ni de credential GitHub dans le CMS. Le pipeline « bouton -> PR automatique -> review » n'est **pas encore développé**.

**Conditions avant réception OVH :** les flux `social-feed.json`, `editorial-source-index.json` et `editorial-guided-fields.json` doivent être cohérents et disponibles sur le serveur public ; la session administrateur HTTPS/CSRF et la conservation privée des brouillons doivent être testées sur OVH. Ne pas annoncer la production sans ces preuves.
