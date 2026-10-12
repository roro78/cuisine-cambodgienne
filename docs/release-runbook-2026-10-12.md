# Mise en production contrôlée — Cuisine du Cambodge (12 octobre 2026)

Ce guide est un **mode opératoire**, pas une preuve de mise en ligne. Une CI verte sur GitHub ne prouve pas que l'hébergement OVH sert cette version. Les commandes OVH ci-dessous demandent les accès du propriétaire ; ne jamais communiquer de mot de passe dans GitHub ni dans ce document.

## Préconditions et périmètre

- La PR de livraison `fix/preprod-phase1-20261012 → main` est validée par le propriétaire, fusionnable et accompagnée d'une **CI intégrée réussie**.
- Les corrections éditoriales (#32–#39) et le Grand Dîner réconcilié (#42) sont inclus dans le même candidat ; #5 est une ancienne version de la home **remplacée**, à ne pas fusionner.
- Les trois pages « Expériences » sont publiées uniquement comme **prototype gratuit sans commande ni paiement** et restent `noindex` tant que la validation culinaire n'est pas acquise.
- Le workflow `.github/workflows/deploy-ovh.yml` a été converti en **déclenchement manuel** sur `main` avec `expected_source_sha`. Ne jamais publier sur un simple push vers main.
- Préparer une sauvegarde du dossier OVH et relever le SHA de l'ancienne branche `ovh-production` pour une restauration testable.

## Étape 1 — Depuis le PC : validation et fusion de la release

Dans le terminal local, dans le dépôt du site (ou depuis un clone), avec GitHub CLI déjà connecté :

```bash
gh auth status
git fetch origin main ovh-production
git status --short
git rev-parse origin/main
git rev-parse origin/ovh-production
gh pr view NUMERO_PR_RELEASE --json state,mergeable,statusCheckRollup
```

**Ne pas fusionner si les tests sont rouges ou la revue bloquée.** Après accord du propriétaire :

```bash
gh pr merge NUMERO_PR_RELEASE --squash
git fetch origin main
RELEASE_SHA="$(git rev-parse origin/main)"
echo "Commit release = $RELEASE_SHA"
gh run list --workflow ci.yml --commit "$RELEASE_SHA" --limit 5
```

Attendre que la CI `main` sur **ce SHA exact** soit complètement PASS.

## Étape 2 — Publication GitHub, volontaire et verrouillée

```bash
gh workflow run deploy-ovh.yml --ref main -f expected_source_sha="$RELEASE_SHA"
gh run list --workflow deploy-ovh.yml --limit 3
```

Depuis GitHub Actions, attendre **Publish OVH static branch = success** sur le SHA approuvé. Le dernier commit de la branche `ovh-production` est une **version statique compilée**, et non le commit source de `main`.

```bash
git fetch origin ovh-production
git rev-parse origin/ovh-production
git log -1 --format='%h %s' origin/ovh-production
```

Conserver les **deux SHA statiques** (avant et après publication).

## Étape 3 — Contrôle OVH avant toute modification publique

**Depuis un terminal ayant les accès OVH :**

```bash
ssh -p 22 cuisinedh@ssh.cluster102.hosting.ovh.net
```

**Sur le serveur OVH**, commencer en lecture seule :

```bash
cd ~/www/cdc2017
pwd
git status --short
git branch --show-current
git remote -v
git log -1 --oneline
git ls-remote origin ovh-production
```

S'assurer que ce dossier est **bien la racine réellement servie**. Il doit être sur `ovh-production`, son arbre de travail doit être propre et son remote doit viser le bon dépôt GitHub. **Arrêter** si l'une des conditions n'est pas remplie (notamment erreur de clé SSH GitHub, dépôt absent, fichiers modifiés localement, autre branche ou autre racine).

Créer une sauvegarde **avant** la synchronisation, après vérification de l'espace disponible :

```bash
mkdir -p "$HOME/backup-cdc"
BACKUP="$HOME/backup-cdc/cdc-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf "$BACKUP" -C "$HOME/www" cdc2017
ls -lh "$BACKUP"
```

Ne poursuivre que lorsque la sauvegarde est lisible, le commit public actuel est connu et le nouveau SHA GitHub correspond bien à la livraison approuvée.

## Étape 4 — Mise à jour OVH, exclusivement après autorisation

**Toujours sur OVH :**

```bash
cd ~/www/cdc2017
git fetch origin ovh-production
git pull --ff-only origin ovh-production
git log -1 --oneline
git status --short
```

**Si le pull ne peut pas avancer en fast-forward, arrêter immédiatement.** Ne jamais utiliser `git reset --hard`, `git push -f` ou `rsync --delete` comme raccourci. Ne pas modifier le remote Git sans diagnostic du problème de connexion OVH/GitHub.

## Étape 5 — Contrôle public obligatoire

Ouvrir dans le navigateur : accueil, recettes, 2 recettes de référence (Amok et Kroeung), les ateliers, Culture, À propos, glossaire, crédits photos et les trois routes Expériences.

Vérifier en particulier : liens, menu mobile, affichage, scroll, quantités, étapes, sécurité alimentaire, image, `/sitemap.xml`, absence de vente, et `noindex` sur les routes Expériences. Conduire une recette clavier/mobile avant de déclarer la livraison terminée.

## Étape 6 — Restauration si nécessaire

Ne pas improviser de remise en place sur OVH. Si une régression bloquante apparaît, noter le SHA statique avant publication, puis déclencher dans GitHub Actions `Restore previous OVH static release` sur `main` en fournissant :

- `expected_current_static_sha` : SHA **actuel** de `ovh-production`.
- `previous_static_sha` : SHA **ancien** de la branche statique préalablement vérifié.

Le workflow crée **un nouveau commit qui remet les anciens fichiers statiques** (sans réécrire l'historique). Après succès, reprendre l'étape 3, puis utiliser `git pull --ff-only origin ovh-production` et contrôler de nouveau les routes publiques. Si le rollback automatique échoue, arrêter et passer à une restauration OVH manuelle encadrée par la sauvegarde connue.

## Traces de réception

Conserver : date, PR et commit `main`, commit `ovh-production` précédent/nouveau, commit constaté par SSH, nom de sauvegarde, résultats CI, contrôles mobile et desktop, décision humaine et éventuel retour arrière.
