# Mise en production OVH — Ateliers pédagogiques (PR #20)

**État au 10 octobre 2026 : validation GitHub acquise, déploiement OVH à faire/confirmer.**  
**Dépendance obligatoire avant la mise en production du chantier commercial PR #24.**

## Faits vérifiés

- PR #20 : https://github.com/roro78/cuisine-cambodgienne/pull/20 — fermée après fusion le 5 octobre 2026.
- Commit de fusion des pages ateliers : `096ceccd9881d87dcbc27352648fa16ce13c1bd3`.
- `main` au moment du cadrage : `b1977a9b6937da0a5af1becd41fee0aca045fb41`, fusion PR #23 (logo et menu mobile). `main` contient donc également les PR #21–23.
- La page listing `/apprendre/` est accessible sur le site public. L'accessibilité des nouvelles pages de détail et leur code exact côté OVH n'ont pas été confirmés.
- **Ne pas déduire du listing accessible que tous les ateliers détaillés sont déployés.**

## Chaîne de publication confirmée

Le dépôt contient le workflow `.github/workflows/deploy-ovh.yml` : sur un push `main`, GitHub Actions réalise le build statique `dist/`, puis publie les fichiers compilés sur la branche distincte **`ovh-production`**. La cible OVH utilisée précédemment est `~/www/cdc2017` sur le cluster SSH `ssh.cluster102.hosting.ovh.net`.

**Dernière branche de publication vérifiée le 10 octobre 2026 :**

- `ovh-production` HEAD = `fe0400966df384222a3e8141deead2d761ac1bc4`
- Message : `deploy: b1977a9b6937da0a5af1becd41fee0aca045fb41`
- Cette branche contient les six fichiers `apprendre/<slug>/index.html` et le header/menu à jour.
- Le fait qu'ils soient sur GitHub **ne prouve pas** que le répertoire OVH a été synchronisé avec cette version.

### Commandes de synchronisation utilisées pour cet hébergement

Depuis un terminal local autorisé (pas depuis une console inexistante) :

```bash
ssh cuisinedh@ssh.cluster102.hosting.ovh.net -p 22
```

Une fois connecté sur l'hébergement OVH :

```bash
cd ~/www/cdc2017
pwd
git status --short
git branch --show-current
git remote -v
git log -1 --oneline
git fetch origin ovh-production
git rev-parse origin/ovh-production
```

**Seulement si** le répertoire est le bon, l'arbre Git est propre, la branche active est `ovh-production` et le remote correspond au dépôt connu :

```bash
git pull --ff-only origin ovh-production
git log -1 --oneline
```

La tête attendue, au dernier contrôle, est `fe040096`. Si le SHA a changé depuis, inspecter la nouvelle publication avant de l'adopter. En cas de conflits ou d'un statut sale, **arrêter** ; ne jamais utiliser `--force`, `reset --hard` ou écraser les fichiers de production.

## Ordre impératif des livraisons

### Lot A — Version existante des ateliers / menu / logo

1. Avant toute opération, noter le **nouveau SHA réel de `main`** et faire un état de la cible OVH : répertoire servi, version en place, mécanisme de déploiement, éventuelles modifications locales non versionnées.
2. S'assurer que le code de `main` à publier contient la PR #20 ; si `main` a évolué, inspecter les nouveaux commits avant publication.
3. Contrôler que le build GitHub Actions ayant alimenté `ovh-production` correspond à la version à livrer (le workflow actuel vérifie Astro et génère `dist/`). Aucun build Node n'est nécessaire sur OVH pour cette chaîne.
4. Vérifier l'état du répertoire OVH et la branche avant la synchronisation. S'arrêter si l'arbre n'est pas propre.
5. Synchroniser via `git pull --ff-only origin ovh-production` après les vérifications préalables ci-dessus, puis confirmer le SHA déployé.
6. Vérifier après déploiement :
   - `/apprendre/` : six ateliers gratuits visibles, liens vers détails ;
   - `/apprendre/piler-aromates-au-mortier/` : page dédiée affichée, sans 404 ;
   - les **cinq** autres slugs à récupérer depuis `src/data/workshops.ts` (six ateliers au total) ;
   - `/recettes/` puis une recette reliée à un atelier et navigation retour ;
   - `/sitemap.xml` contient les six URLs d'ateliers ;
   - navigation et logo en desktop et mobile, aucune casse CSS.
7. Capturer les résultats (date, SHA, URL, HTTP, capture d'écran si possible) puis seulement déclarer le lot A LIVE.
8. Si échec, restaurer le dernier artefact statique OVH **préalablement sauvegardé** selon la procédure d'hébergement effectivement disponible. Ne pas faire de `git reset --hard` aveugle sur un répertoire de prod.

### Lot B — Nouvelle page Expériences (PR #24)

1. Laisser la PR #24 en brouillon tant que le lot A n'est pas reconnu LIVE.
2. Terminer revue, vérifications Astro, contrat de pré-lancement, contrôle responsive et images.
3. Réévaluer l'écart de la branche #24 avec le `main` réellement déployé.
4. Merger sur demande explicite, seulement après le lot A.
5. Déployer le nouveau `main` via la même voie que le lot A et tester `/experiences/` + `/experiences/grand-diner-khmer/`.
6. Ne pas annoncer une ouverture commerciale : `noindex`, paiement et réservation désactivés.

## Pourquoi deux lots ?

Si PR #24 est mergée avant la livraison OVH du lot A, le prochain `main` inclura les ateliers, les correctifs du header **et** la nouvelle page Expériences. On perdra la possibilité d'isoler simplement l'origine d'une régression en production. Deux mises en production successives, vérifiées, rendent le diagnostic beaucoup plus sûr.

## Points laissés volontairement inconnus

- Version/commit exact actuellement servi par OVH : non prouvé.
- Chemin cible et accès SSH utilisés précédemment : `~/www/cdc2017`, `cuisinedh@ssh.cluster102.hosting.ovh.net`. Il faut **vérifier sur l'hébergement** qu'ils sont toujours corrects avant d'écrire.
- Existence d'une sauvegarde précédente et capacité de rollback : à vérifier.
- Aucun envoi automatique en production exécuté dans cette PR.
