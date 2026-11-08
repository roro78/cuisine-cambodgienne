# Export privé Coral : refus explicite des sessions expirées

Un clic d’export peut survenir après expiration de la connexion alors que le
jeton CSRF de la session reste valide. Sur la version #230, cette requête
retombait dans le rendu de connexion : HTTP 200, `text/html`, aucune pièce
jointe. Cette réponse a été reproduite sur OVH sans fabriquer une session
administrateur. Le propriétaire signale avoir obtenu du HTML par un clic dans
le Studio ; l’expiration explique le cas reproduit, sans prouver à elle seule
les conditions exactes de son téléchargement.

Les demandes d’export refusent maintenant une absence de connexion en HTTP 403
texte brut. Les erreurs CSRF, formulaire mixte et version périmée restent
bloquées ; aucune de ces branches ne rend la page HTML. Le succès conserve
`text/plain; charset=UTF-8`, `Content-Disposition: attachment`, le contrôle de
la dernière version et les sept textes exacts avec leurs SHA-256. Le nom du
fichier utilise le slug de la recette liée : `atelier-<recette>-7-narrations-vN.txt`.
L’identifiant technique privé a été retiré du texte exporté.

Le contrôle final partagé détecte aussi les dosages abrégés ou fractionnaires
et la formulation « la cuillerée prévue/réservée ». Ces alertes restent des
propositions à examiner, jamais des corrections automatiques : un contenant
singulier servant à mesurer la cuisson n’est pas un rendement fixe. Les
températures et durées techniques restent permises. La règle universelle est
déjà définie dans le référentiel de narration V2 et s’applique aux futurs ateliers.

## Vérification et limites

- Test Chrome local avec connexion normale à une fixture : clic et téléchargement
  réels à 1440 et 390 px, octets exacts, sept textes/SHA, MIME, disposition,
  absence de HTML et absence de modification du brouillon.
- Refus HTTP texte brut : session non connectée avec CSRF valide, mauvais CSRF,
  version périmée, formulaire contenant une autre action.
- Régression des visas : dosages bloqués ; prélèvement dans un ramequin et
  repères 72 °C/18–25 min autorisés ; permissions, versions et révocations
  conservées sur les fixtures.
- Ces tests ne valent pas réception Android physique ou connexion administrateur
  réelle sur OVH. Aucun accès de production n’est simulé.

La relecture des sept textes Amok et son comparatif restent dans les artefacts
privés locaux, hors de cette documentation publique. Une nouvelle version doit
être sauvegardée par `cmsCreationSave`, conserver les versions antérieures et
repasser le contrôle global ; aucun visa humain n’est inscrit par l’assistant.
Les comparaisons documentaires ne constituent pas un essai culinaire.

## Livraison ciblée autorisée dans la mission

Seuls `gestion-contenus/index.php`, `narrations-export.php` et
`publication-gap-audit.php` peuvent différer pour ce correctif. `.htaccess`
protège déjà les trois modules et reste inchangé. Avant transfert : comparaison
avec les fichiers réellement servis, sauvegarde hors webroot, empreintes et
restauration isolée vérifiées ; lint PHP distant des candidats ; renommages
atomiques, index en dernier, puis relecture des empreintes et contrôles HTTP.
En cas de régression : restaurer exclusivement les trois fichiers remplacés.
Conserver les données, configurations, MP3 et services.

Cette note décrit le correctif et sa recette ; elle n’est pas une preuve de
transfert. Le rapport de mission doit nommer séparément le SHA livré, les
empreintes distantes, la nouvelle version privée, la récupération des sources,
les contrôles navigateur effectués et ceux restant à recevoir. Aucun appel
fournisseur, visa humain, MP3, déploiement Astro ou réseau social n’est autorisé.
