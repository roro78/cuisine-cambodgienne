# Synchronisation OVH depuis GitHub Actions

Le workflow manuel `Sync approved static release to OVH` transfère la branche statique déjà publiée vers `~/www/cdc2017` via SSH. Il ne reconstruit pas le site et ne relance pas la CI.

## Préparer les accès

1. Dans GitHub, créer le secret de dépôt `OVH_DEPLOY_SSH_KEY` avec une **clé privée dédiée** dont la clé publique est autorisée pour `cuisinedh` sur OVH. Ne placer la clé privée ni dans un commit, ni dans une issue, ni dans une conversation.
2. Vérifier l'empreinte de la clé d'hôte SSH OVH par un canal indépendant (interface ou support OVH). Créer `OVH_SSH_KNOWN_HOSTS` avec la ligne `known_hosts` correspondante pour `ssh.cluster102.hosting.ovh.net`. Ne pas accepter automatiquement une clé découverte pendant l'exécution.
3. Vérifier dans l'interface OVH que la racine servie par le domaine public est bien `~/www/cdc2017`. Le simple nom du dossier ne prouve pas cette correspondance.
4. Vérifier que `origin` du dépôt présent sur OVH peut lire `roro78/cuisine-cambodgienne` sans interaction. Le workflow s'arrête sinon. Le dépôt est public : une URL HTTPS GitHub suffit.

## Exécuter

1. Relever le SHA complet actuel de `ovh-production`. Pour cette livraison : `e6dda993bdb2e5351383888ada7c0b14ff88e4d2`. Vérifier qu'il est toujours le HEAD de la branche avant chaque exécution.
2. Déclencher le workflow sur `main` avec `mode=preflight` et ce SHA. Il contrôle la connexion SSH, la clé d'hôte, le dossier, l'arbre Git, la branche, le dépôt distant, la capacité de lecture du SHA et l'espace pour sauvegarder. Il ne modifie pas OVH.
3. Lire le rapport de précontrôle et confirmer la racine servie dans OVH. Si un contrôle échoue, corriger la cause et relancer seulement le précontrôle.
4. Déclencher le même workflow avec `mode=deploy`, le même SHA et `public_root_confirmed=true`. Il refait les contrôles, crée une archive vérifiée sous `~/backup-cdc`, avance le dépôt uniquement en fast-forward jusqu'au SHA épinglé, puis contrôle le HEAD et l'arbre Git.
5. Comparer les pages publiques avec la livraison attendue : `/`, `/recettes/`, `/recettes/amok-trey/`, `/apprendre/`, `/experiences/`, `/experiences/grand-diner-khmer/`, `/experiences/grand-diner-khmer/carnet-de-reception/` et `/sitemap.xml`. Vérifier les statuts HTTP, les liens, les assets, le menu mobile, les balises `noindex` des expériences et l'absence de vente ou réservation. Noter l'heure, le SHA OVH, le nom de sauvegarde et les résultats.

Un succès du workflow ne remplace pas le contrôle du site public. En cas de divergence, arrêter ; ne pas forcer Git ni supprimer le contenu du dossier.
