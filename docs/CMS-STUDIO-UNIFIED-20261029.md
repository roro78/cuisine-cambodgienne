# Studio unifié — édition publiée et contrôles Coral V2

29 octobre 2026. Base synchronisée : `2430da63fd49911c9e59c54f1cbbe06bc0f0e2a7`
(#174), branche `fix/cms-unified-workshop-studio-20261029`.
Le propriétaire signale un transfert manuel du Studio V2 sur OVH ce jour.
Ce lot ne transfère rien et ne certifie pas l’installation distante.

## Audit et décision

`index.php` chargeait les modifications de fiches publiées par `?id=...`
avec `cmsSave`, `cmsVersions` et la projection publique guidée. Les panneaux
Coral étaient dans `?new=1&cid=...`, qui utilise `cmsCreationSave`.
Il ne s’agissait donc pas d’un panneau caché par CSS.

Les stockages sont volontairement différents :

| Stockage privé | Identité et protection | Utilisation |
|---|---|---|
| `editorial-drafts/<sha256-id>.<version>.json` | ID public, empreinte catalogue, SHA256 canonique pour les modifications structurées | Propositions historiques de modification |
| `editorial-drafts/new-content/c-<id>.<version>.json` | ID privé, verrou global `catalog.lock`, provenance serveur et compléments de famille | Créations et désormais révisions Coral explicitement liées |

Aucune migration automatique, aucun remplacement des anciennes versions.
Le même template PHP, les mêmes composants et les deux contrats existants sont
conservés. Les cinq familles reçoivent les mêmes sections : informations,
contenu, aperçu, qualité, historique/publication. Les contrôles propres à une
création complète ne sont pas artificiellement appliqués à une projection
historique partielle d’une autre famille.

## Parcours atelier publié

1. Bibliothèque → atelier → **Contrôles qualité**.
2. L’écran indique les neuf vérifications non évaluées et les données manquantes.
   L’existence des MP3 publics ne prouve pas la conformité d’une nouvelle révision.
3. Enregistrer d’abord les changements éventuels du formulaire historique.
4. Confirmer **Préparer le brouillon Coral V2 lié**. POST authentifié/CSRF,
   numéro exact de version et deux empreintes obligatoires ; aucun GET ne crée.
5. Le formulaire commun `cmsCreationFormHtml` reprend uniquement les champs
   pédagogiques compatibles et vérifiés de la projection guidée et de la
   dernière version enregistrée. Les listes deviennent les entrées du formulaire
   commun ; seuls les titres/apprentissages des six phases sont repris.
6. Choisir et vérifier humainement la recette publiée ; son lien n’est pas
   déduit du titre ou du slug de l’atelier. Compléter les gestes, contrôles,
   sécurité et sept narrations, puis enregistrer des versions privées.
7. Retrouver les visas de texte, l’audit canonique, le visa culinaire et le
   tableau Coral dans la section qualité, avec leurs protections antérieures.
8. L’ouverture ultérieure de l’ID publié rejoint automatiquement ce brouillon.
   Le lien « versions historiques de la fiche » ouvre `?id=...&history=1` en
   lecture seule ; le formulaire historique ne peut plus créer de révision
   concurrente, même par POST direct.

La bibliothèque projette le statut et le numéro de la dernière version liée ;
ses filtres « brouillon / à relire / source modifiée » utilisent cette projection,
y compris en cas de changement de l’empreinte canonique complète. Cette vue ne
réécrit et ne fusionne aucun fichier des deux historiques.

`source_binding` est une métadonnée **serveur**, non un champ éditable ni une
sortie IA. Elle conserve l’ID publié, ses deux empreintes et la version/hash
du snapshot historique de départ. Le slug du brouillon reste privé ; son
changement ne crée ni ne désigne une nouvelle URL publique.

La transition prend d’abord le verrou historique puis le verrou de création.
Le contrôle d’unicité de relation et l’anti-doublon sont répétés sous verrou.
Seule l’identité publique explicitement liée est exclue de l’anti-doublon :
les autres pages et tous les autres projets restent contrôlés. Deux clics,
versions concurrentes ou POST rejoués ne produisent pas deux projets liés.

Les notes/consignes historiques restent dans leur historique ; elles ne sont
pas transformées en contenu public ou en texte de narration. Aucun script,
MP3, source documentaire privée, visa ou droit média n’est importé.

## Échec fermé et limites

- Un modèle historique `workshops`, des phases réordonnées, une structure
  incompatible, une version périmée ou une empreinte absente bloquent la
  transition ; aucune adaptation approximative n’est effectuée.
- Un changement de l’empreinte canonique **complète** de l’atelier lié bloque
  sauvegarde, affichage de visas actifs et actions de validation. Le brouillon
  et son historique sont conservés ; une réconciliation humaine est requise,
  sans réancrage silencieux de la relation.
- Les invalidations des narrations après changement pédagogique, des visas
  après nouvelle version et du visa culinaire après changement de recette
  restent celles de C4C3B–G. La recette publique n’est jamais modifiée.
- Aucun visa, TTS, média, publication site ou Meta n’est autorisé par cette
  transition. Les quatre gates médias/voix, écoute MP3, mesures audio et
  synchronisation mobile restent bloquées dans le tableau existant.
- L’aperçu est une **relecture simplifiée des champs enregistrés**. Un rendu
  fidèle demande encore une projection privée complète dans le gabarit Astro,
  avec médias et lecteur audio contrôlés ; pas de copie de page publique ni
  d’accès à une source Astro privée depuis ce PHP.
- Les ancres de section gardent la saisie dans le document ; un avertissement
  protège une navigation réelle avec changements non enregistrés. Les détails
  restent dépliables, le bouton de sauvegarde reste accessible en bas du
  formulaire, le JSON expert reste replié dans l’aperçu historique.

## Validation

- `npm run check` : 0 erreur, 0 warning (24 hints préexistants).
- `npm run build` : PASS, 48 pages ; les trois index conservent leurs identités.
- Contrats Node CMS/index/guidé/planification/paquet : 23/23 PASS.
- `tests/php/editorial-studio-unified-smoke.php dist` : six ateliers réels,
  relation immuable, historique conservé, anti-doublon, rejeu, source périmée,
  aucune validation inventée, sept champs et calendrier.
- `tests/editorial-studio-browser.test.mjs` : vrai serveur PHP loopback et session
  synthétique, connexion, CSRF réel, navigation bibliothèque → atelier,
  transition, sauvegarde, réouverture, historique, cinq familles, calendrier,
  mobile 360/390 px et desktop, sans débordement ni appel fournisseur/audio.
- PHP portables officiels 8.3.36 et 8.4.27 : lint PASS. Tests de transition
  exécutés dans une copie temporaire avec adaptation des bits POSIX sous
  Windows ; **cela ne certifie pas les permissions POSIX**. Le navigateur
  Windows utilise la même adaptation de fixture, jamais dans le code livré.
- CI obligatoire : contrats existants, tests PHP exacts sur Linux 8.3/8.4 et
  smoke sur tous les contenus générés ; nouveau navigateur ajouté à la CI.
  Les captures synthétiques sont un artifact de test, jamais un fichier web.

## Livraison manuelle et réception Android

Les seuls fichiers de production modifiés par ce lot sont :

- `gestion-contenus/index.php`
- `gestion-contenus/lib.php`

Ils supposent le paquet C4C3G **déjà complet** : module
`publication-gap-audit.php`, `.htaccess` et trois index compatibles.
Ne pas déduire leur présence distante d’une CI. Le paquet complet de sept
fichiers reste disponible via le mécanisme existant si nécessaire, après
comparaison et sauvegarde distinctes.

Avant transfert : vérifier le SHA fusionné et la CI, identifier la vraie racine
OVH, télécharger les deux fichiers PHP existants et leurs permissions dans
un dossier daté hors webroot, vérifier taille et SHA256 de chaque sauvegarde.
Ne pas toucher à `config.php`, aux brouillons, aux journaux ou aux médias.
Transférer uniquement ces deux PHP, puis les retélécharger pour comparer
leurs SHA256 au paquet issu de Git. Garder manifeste/README hors site.
En cas d’échec, restaurer uniquement ces deux sauvegardes vérifiées.

Recette Android réelle après ce transfert contrôlé :

1. Connexion HTTPS, catégorie ateliers, ouverture de Bai Sach Chrouk.
2. Section qualité visible, données manquantes explicites, neuf contrôles.
3. Après sauvegarde et confirmation personnelle, un seul brouillon lié,
   mêmes titres pédagogiques, aucun MP3 copié ou lancé.
4. Vérifier recette liée, six phases, sept narrations et visas absents au départ.
   Ne pas approuver sans vraie relecture ; ne pas générer d’audio.
5. Modifier un champ, naviguer par sections, vérifier la conservation de la
   saisie et l’enregistrement d’une nouvelle version.
6. Retour bibliothèque puis atelier : retrouver ce même brouillon ; consulter
   les anciennes versions et le calendrier. Vérifier les quatre autres familles.
7. Contrôler le lecteur et les MP3 publics existants séparément, sans mutation.

La recette automatisée simule des dimensions mobiles ; **elle ne remplace pas
un essai sur un téléphone Android physique connecté à OVH**. Aucune installation
OVH de ce lot ni réception Android physique n’est annoncée.
