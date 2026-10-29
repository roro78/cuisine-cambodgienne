# Studio UX V3 — audit et décision

Base : `7b06335775d8b095282ec473244e8fd7c9493043`, main synchronisé le 29 octobre 2026.
Branche : `feat/studio-ux-v3`. Aucun transfert OVH autorisé dans ce chantier.

## Audit avant codage

Audit des routes et composants réels, avec Bai Sach Chrouk comme référence,
sans recréer ses textes ni ses MP3. La recette navigateur locale complète cet
audit de code ; aucune session OVH ni réception Android physique n'est attestée.

| Parcours | Difficulté constatée | Décision |
|---|---|---|
| Recette publiée | Empreintes et contrôles avant les champs | Replier les données techniques, présenter l'édition en premier |
| Atelier publié lié | Nom Coral V2 confondu avec une obligation audio | Nommer le brouillon par son usage ; séparer le guide facultatif |
| Nouvel atelier | Tous les champs de lignes visibles, étapes nommées « Élément » | Groupes descriptifs dépliables, titres des étapes visibles |
| Carnet | Long formulaire de paragraphes et métadonnées | Même composant de groupes dépliables |
| Enregistrer | Sauvegarde après contenu et narration sans séparation | Bouton commun conservé, explication du brouillon privé |
| Retrouver | Bibliothèque, filtre et relation publique déjà opérationnels | Conserver les identités, filtres, versions et redirections |
| Qualité | Empreintes, visas et contrôles audio mêlés | Résumé orienté actions, contrôles complets en mode avancé |

## Plan UX

Trois activités dans le même document : modifier le contenu, préparer le guide
audio facultatif (ateliers), vérifier ce qu'il reste à faire. Conserver aperçu,
historique et sauvegarde. Aucun onglet ne détruit ou remplace les champs.
Replier notes et planification, données techniques et contrôles détaillés.
Le guide présente ses sept chapitres et distingue texte absent, rédigé à relire
et texte à reprendre ; ces états de rédaction ne constituent aucune approbation.
Les contrôles et décisions humaines existants gardent seuls leur autorité.

Mobile : liens de sections sur plusieurs lignes, éléments réductibles, champs
pleine largeur, sauvegarde accessible et confirmation avant perte de saisie.
Vérifier 360, 390, 768 et 1440 px. Aperçu lisible des champs enregistrés ; le
gabarit public fidèle reste une capacité distincte et ne sera pas simulé.

## Invariants

Aucun schéma de stockage, validateur, verrou, anti-doublon, contrôle CSRF,
empreinte, invalidation ou approbation modifié. Aucun appel IA, TTS, Meta ou n8n.
Les guides et scripts existants restent intacts. Un brouillon sans narration
reste enregistrable avec les validations de contenu déjà applicables.

## Vérification et limites

Le navigateur utilise un serveur PHP loopback avec authentification et CSRF
réels, des données publiques issues du build et un stockage privé synthétique.
Sous Windows, seule la copie temporaire de fixture adapte les bits POSIX ; la
CI Linux PHP 8.3/8.4 vérifie les permissions véritables et les contrats complets.
Les captures dans `artifacts/cms-unified-review` sont des preuves de test local.
L'aperçu reste une lecture des champs enregistrés, sans images ni lecteur public.
Il ne prétend pas être une prévisualisation fidèle du gabarit Astro.

## Livraison ciblée et retour arrière

Seuls `gestion-contenus/index.php` et `gestion-contenus/lib.php` changent en
production. Le module d'audit, les index publics et les protections du paquet
précédent doivent être présents et compatibles ; leur présence OVH n'est pas
certifiée par la CI. Le paquet final doit être extrait des blobs du commit
fusionné, avec manifeste SHA256, pour éviter une conversion CRLF locale.

1. Après accord de déploiement distinct, identifier la vraie racine publique OVH.
2. Télécharger les deux PHP actuels dans un dossier daté hors webroot. Conserver
   permissions, tailles et empreintes ; vérifier que les sauvegardes sont lisibles.
3. Transférer uniquement les deux PHP du paquet. Ne jamais transférer ce rapport,
   le manifeste, la configuration, les brouillons privés, `dist` ou les médias.
4. Retélécharger les deux fichiers et comparer leur SHA256 au manifeste.
5. En cas d'échec, restaurer uniquement les deux sauvegardes vérifiées, contrôler
   de nouveau leurs empreintes et la connexion. Aucun brouillon à supprimer.

## Recette Android après transfert autorisé

- Ouvrir Bai Sach Chrouk depuis la bibliothèque, accéder aux étapes, modifier une
  consigne et enregistrer ; retrouver le même brouillon et sa nouvelle version.
- Ouvrir le guide facultatif et vérifier les sept intitulés et états de rédaction.
  Ne pas approuver un texte sans relecture ni produire de MP3 pour cet essai.
- Enregistrer un brouillon sans narration ; vérifier la présence dans le calendrier.
- Ouvrir les contrôles avancés puis l'historique ; vérifier les quatre autres familles.
- Vérifier lisibilité, absence de débordement et avertissement avant perte de saisie.
- Vérifier séparément le lecteur public et ses MP3 existants, sans les modifier.

Le navigateur simulé ne remplace pas cette réception Android physique sur OVH.

## Résultats locaux du lot V3

- Astro check : 0 erreur, 0 avertissement, 24 hints préexistants ; build : 48 pages.
- 21 contrats Node CMS/canonique/guidé/patch/réception : PASS.
- PHP 8.3.36 et 8.4.27 : lint, 35 contenus réels, six ateliers liés, détails
  des phases et sept scripts : PASS. Tests d'écriture dans une copie temporaire
  adaptée à Windows ; le test manuel de permissions POSIX exige Linux et reste
  obligatoire dans la CI, sans adaptation du code livré.
- Navigateur : connexion, CSRF, sauvegarde d'une consigne sans audio, retour et
  réouverture du même brouillon, historique, calendrier, cinq familles, nouvel
  atelier sans narration, recette choisie par titre, contrôles avancés repliés,
  sept chapitres accessibles et source périmée refusée : PASS.
- Dimensions 360/390/768/1440 px : pas de débordement. Captures des six étapes
  relues sur mobile. Aucune narration ni approbation inventée.

Les liens PR, SHA fusionné, CI finale et manifeste exact figurent dans le rapport
accompagnant le paquet local de livraison. Aucun transfert OVH dans cette mission.


## V3.1 — Reprendre les modifications dès l'ouverture (29/10/2026)

Retour de réception sur OVH : pour retrouver un brouillon de travail, l'accès
restait relégué en bas de la fiche. Le correctif V3.1 modifie uniquement la
présentation et les liens de navigation du Studio :

- encart « Modifications en cours » en tête de fiche et des brouillons enregistrés ;
- accès principal « Reprendre le brouillon de travail » depuis l'atelier publié,
  ou directement depuis sa carte dans la bibliothèque quand un brouillon lié existe ;
- si le brouillon lié n'existe pas encore, formulaire de transition
  historique en haut de fiche (confirmation, protection de version,
  provenance et CSRF inchangés) ;
- cas « Source à vérifier » clairement distingué, sans rendre la sauvegarde possible ;
- accès secondaire à l'historique et à l'aperçu, sans confondre modification,
  approbation humaine et publication.

Tests navigateur étendus aux cinq familles, à l'encart d'atelier, à la reprise
d'un brouillon lié depuis la bibliothèque, à la conservation du même identifiant
et aux protections de sauvegarde. Aucun schéma, brouillon, MP3, index, publication,
workflows ou API modifié.

**Livraison OVH V3.1 : uniquement** gestion-contenus/index.php (après CI
et vérification de la PR). Sauvegarde et empreintes du fichier distant obligatoires
avant transfert. La fusion GitHub ne déploie pas le site. Recette Android réelle
à refaire sur la nouvelle interface.
