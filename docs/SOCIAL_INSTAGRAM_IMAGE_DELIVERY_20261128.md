# #121 — Distribution des images sociales, incident du 28 novembre 2026

## Synchronisation du correctif effectivement publié

Source de réception : https://github.com/roro78/cuisine-cambodgienne/issues/121#issuecomment-7238681071

Le workflow 02 publié sous la version a14e8351-63f5-4fc2-8a6e-8fd98996758f utilise deux expressions identiques à celles du rapport. Elles routent 11 JPEG approuvés vers le commit immuable 93ffd3eea5e0724af226263f8c69571d769cb153, puis contrôlent le SHA-256 avant les écritures Meta. Facebook conserve l'URL et la légende approuvées. Le routage ne change ni l'approbation, ni les réservations, ni les horaires, ni les workflows 01/03. Il ne faut pas réimporter cet export de dépôt sur l'instance active : les paramètres et credentials du runtime sont spécifiques à l'installation.

Les tests hors réseau vérifient les 11 chemins, les chemins hors liste, la conservation de la légende et les contrôles d'intégrité. L'exécution réelle de Lok Lak a réussi après reprise Instagram uniquement ; aucun rejeu n'est autorisé. Le prochain passage automatique de 02 reste à réceptionner.

## Limites

Le miroir GitHub est un contournement opérationnel, pas un service média qualifié pour l'exploitation durable. Le HTTP 429 a été reproduit avec le profil Meta-ExternalAgent mais la réponse exacte de midi et la règle OVH en cause ne sont pas prouvées. Les images hors liste, notamment Kep v2, ne bénéficient pas du miroir. Ne pas étendre le regex par simple ajout de noms ni remplacer par une URL de branche mutable.

## Lot suivant : distribution générique (non déployé)

1. Examiner les journaux et la configuration OVH ; déterminer si la règle peut être corrigée de manière ciblée, sans affaiblir les protections du site. Qualifier les possibilités de distribution déjà présentes sur Orvekio (isolation stricte des autres projets). Comparer coût, disponibilité, capacité, quotas et conditions d'usage. Ne pas créer de nouvel abonnement ni utiliser GitHub comme CDN permanent par défaut.
2. Choisir un hôte HTTPS public stable, dédié au périmètre Cuisine du Cambodge, et une URL immuable adressée par SHA-256. Un média doit être déclaré éligible seulement après contrôle des droits, JPEG, dimensions, empreinte et récupération externe. Aucun proxy générique d'URL arbitraire, aucune exposition d'un stockage privé.
3. Enregistrer la provenance et le transport média dans les métadonnées vérifiées (de préférence droits/instantané scellés). Conserver le contrat des anciennes approbations ; une modification du contenu ou des droits impose une nouvelle validation. Vérifier que le fichier envoyé à Meta correspond au digest approuvé. Ne pas faire confiance à une URL fournie librement par Ollama.
4. Supprimer la liste figée seulement après recette d'au moins un nouveau JPEG hors liste (sans publication de test non approuvée). Vérifier l'accès depuis une source extérieure, y compris les restrictions de robots, en-têtes MIME, redirections, expiration, indisponibilité, fichier altéré, URL hors périmètre. Une sonde ne garantit pas la récupération par Meta ; observer le prochain cycle autorisé.
5. Pour les erreurs Instagram après Facebook, distinguer rejet de création explicite et résultat ambigu. Ne reprendre que si la réservation exclusive, l'approbation scellée et l'absence de doublon sont établies. Aucun rejeu Facebook. En cas d'incertitude, revue manuelle. Tester l'idempotence, les écritures concurrentes et l'échec après une réponse Meta.

Ne pas publier Kep v2 ou Lok Lak pour la recette. Ne pas modifier le runtime partagé avant comparaison exacte des versions et sauvegarde/restauration vérifiée. Le présent lot n'installe aucun composant, ne crée aucune publication et ne déclenche aucun workflow.

## Préparation générique hors production

Le dépôt possède déjà `scripts/build-social-assets.mjs`, le catalogue typé `src/data/socialCatalog.ts`, les droits qualifiés du sélecteur 01 et les tests Sharp. Le routage Traefik existant est documenté pour le worker Coral ; cela ne prouve pas que le reverse proxy et le réseau réels sont adaptés à une route média publique. Ne pas modifier le routeur Coral, n8n ou les autres projets pour ce lot.

Le nouveau packager **réutilise le sélecteur 01 réel**, appliqué indépendamment à chaque source du catalogue local. Les sources sans droits vérifiés sont exclues, même si le feed prétend fournir des droits. Le choix quotidien et l'historique ne sont pas modifiés : le packager ne sélectionne aucun post à publier.

Depuis un checkout du SHA qualifié, avec les dépendances existantes :

```bash
node scripts/package-social-media.mjs /tmp/cdc-social-media-new
```

Le dossier de sortie doit être inexistant, hors racine publique. Il contient :

- `assets/<sha256>.jpg` : les octets **identiques** au JPEG approuvable, sans réencodage, avec contrôle de la source, du SHA-256 du JPEG et de son original, du format, des dimensions 1080 × 1080 et du décodage intégral. Aucune liste de noms de transport supplémentaire ; un futur JPEG éligible sera traité par le même mécanisme.
- `manifest.json` : inventaire privé des entrées qualifiées et exclues. N'exposer que le sous-dossier `assets/`, jamais le manifeste ni l'arborescence du VPS. Aucune clé, légende, approbation ou donnée PostgreSQL ne transite dans ce lot.
- Le packager ne transforme pas un média non qualifié en média autorisé. Il ne rend pas encore le registre des droits ou les angles éditoriaux automatiquement extensibles.

Une fois **un endpoint HTTPS effectivement qualifié**, avec accord distinct pour toute installation ou route nouvelle, vérifier depuis une machine extérieure :

```bash
node scripts/probe-social-media.mjs /tmp/cdc-social-media-new/manifest.json https://hote-medias-valide.example/sha256/
```

L'adresse est un exemple, pas un service existant. Chaque requête GET vérifie HTTP 200 sans redirection, MIME JPEG, longueur bornée et SHA-256, avec un agent standard puis le profil Meta-ExternalAgent. Aucun jeton ni appel Meta, aucun retry automatique. Ce profil ne représente pas une preuve d'accès depuis les serveurs Meta.

### Conditions restantes avant bascule

- Qualification réelle de la cause OVH et du candidat Traefik (ou d'une solution existante mieux adaptée) : lectures de configuration et mesures disque/CPU, capacité et exposition strictement limitées à une route statique de lecture. Ne pas ouvrir de port direct, ajouter de stockage payant, exposer de volume privé ni affaiblir les protections existantes. Vérifier conditions de service, disponibilité, rétention, permissions et restauration.
- Transfert des seuls JPEG qualifiés, en chemins immuables, sans écrasement ; comparer les empreintes locales/distantes. Anciennes URL conservées. Tester les refus de chemins non média et de fichier non qualifié, les deux profils HTTP et au moins un média hors des onze noms actuels.
- Adapter **ensuite** le transport du 02 à une URL déterministe construite à partir du SHA-256 déjà scellé (pas du texte d'Ollama ni d'un hôte issu du feed). Tester les deux branches anciennes/nouvelles, les échecs de disponibilité **avant** les écritures Meta, le contrat d'approbation et la correspondance entre l'URL vérifiée et celle effectivement envoyée à chaque réseau. Ne pas modifier un brouillon approuvé. Le correctif actuellement déployé reste en service jusqu'à réception du remplacement. Les nouveaux médias doivent rester inéligibles tant que leurs droits et leur transport ne sont pas qualifiés.
- Reprise Instagram sécurisée et non automatique des écritures ambiguës : chantier suivant, distinct de ce package.

Ce lot ne contient ni serveur HTTP ni modification Traefik/n8n/PostgreSQL. La recette hors réseau utilise les fichiers réels et une fixture de nouveau sujet ; le prochain cycle reste indépendant. Aucun redéploiement de Kep ou de Lok Lak.

## Candidat Orvekio en attente de réception externe

Le VPS dispose de Traefik et d'une image Nginx. Le Nginx existant expose un
chemin TikTok partagé. Le candidat `deploy/social/media/` définit donc un
service Cuisine distinct, sur un réseau dédié relié à Traefik et sans port
hôte. Il reprend le domaine HTTPS existant et isole
`/cdc-social-media/sha256/`. Seuls les fichiers JPEG portant un nom SHA-256
sont servis par GET ou HEAD. Le manifeste, la configuration et les autres
volumes restent hors de la racine exposée.

Une fois le périmètre et le rollback autorisés selon le
[runbook](OVH-DEPLOYMENT-RUNBOOK.md) :

1. Relever les routeurs actifs et leurs empreintes, le résolveur TLS,
   le réseau et les versions réelles. Préparer le retour à l'état initial
   et vérifier qu'il retire uniquement le service et le raccordement
   Cuisine. La déclaration persistante du raccordement Traefik est à
   intégrer au circuit de maintenance du VPS pour survivre à sa recréation.
2. Générer le paquet avec le sélecteur et le catalogue du même SHA. Garder
   le manifeste hors du volume servi. Après avoir vérifié le répertoire
   dédié, ajouter les objets par empreinte avec
   `node scripts/install-social-media-assets.mjs BUNDLE_DIR ASSETS_DIR`.
   Chaque lien apparaît après écriture et vérification complètes. Un objet
   existant et conforme est réutilisé. Une incohérence bloque le lot.
3. Démarrer uniquement le service statique avec l'image Nginx déjà
   qualifiée et épinglée. Garder les configurations des autres services,
   leurs réseaux et l'URL actuelle du 02. Vérifier le certificat, les deux
   profils et tous les SHA-256 avec `probe-social-media.mjs`, y compris Kep V2.
   Vérifier les refus du manifeste, d'un nom inconnu et d'une méthode d'écriture.
4. Recevoir le transport à part. Contrôler que chaque approbation en attente
   cible un objet disponible avant de changer le 02. L'inventaire du catalogue
   courant peut exclure un JPEG d'une version antérieure encore approuvée.
   Vérifier de nouveau les droits et l'empreinte de ces objets avant un ajout.

Le rollback du candidat retire sa route en arrêtant son seul conteneur et
déconnecte son raccordement dédié. Le répertoire privé et ses empreintes
sont conservés pour comparaison. Une recette de l'URL ne déclenche aucune
écriture Meta. La réception de l'ingestion réelle attend un cycle approuvé.
