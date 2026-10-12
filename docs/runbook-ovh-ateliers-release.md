# Mise en production OVH — Ateliers et Expériences

**Historique contrôlé le 10 octobre 2026 : lot A visible en ligne. Mise à jour du 12 octobre 2026 : la PR #24 historique a été clôturée comme remplacée ; le Grand Dîner est repris dans la PR #42, fusionnée uniquement en préproduction. La PR de livraison globale #44 reste ouverte, non fusionnée dans `main` et non publiée sur OVH.**

Ce guide décrit le déploiement manuel de la branche statique `ovh-production`. Il distingue les résultats **vérifiés sur le site public** du SHA exact du répertoire SSH OVH, qui doit encore être confirmé directement sur l'hébergement. Ne jamais considérer le succès de GitHub Actions comme une preuve suffisante du déploiement OVH.

## 1. Lot A : acquis en production

- **PR #20 — six ateliers pédagogiques gratuits :** fusionnée dans `main`. Le listing `/apprendre/` et les **six** fiches d'ateliers ont été contrôlés en HTTP 200 sur le domaine public.
- Les six routes vérifiées :
  - `/apprendre/piler-aromates-au-mortier/`
  - `/apprendre/equilibrer-une-sauce/`
  - `/apprendre/saisir-viande-poele/`
  - `/apprendre/fraicheur-herbes-agrumes/`
  - `/apprendre/bouillon-leger-savoureux/`
  - `/apprendre/composer-repas-cambodgien/`
- **Sitemap :** les six routes sont présentes dans `/sitemap.xml`.
- **Logo / navigation :** le nouveau PNG de marque et les éléments du menu mobile ont été constatés dans le HTML public ; cela ne remplace pas un contrôle visuel complet sur appareil.
- **PR #25 — sécurité alimentaire :** fusionnée dans `main` au commit `9cacbaab14adadfdef63cfc9c55dbd94a77efa14` et visible sur les pages publiques `/recettes/amok-trey/` et `/recettes/prahok-ktis/`.
- **Chaîne de build validée :** les workflows GitHub Actions CI et publication OVH relatifs à ce commit ont réussi.
- **Dernier artefact GitHub contrôlé :** branche `ovh-production` au commit `e59c104d4f356cf7f0077402430548fa4cd191f7`, message `deploy: 9cacbaab14adadfdef63cfc9c55dbd94a77efa14`.

**Le lot A n'est plus un prérequis bloquant à réaliser.** Ne pas republier par erreur l'ancien artefact `fe040096` : c'était l'état historique **avant** la PR #25. La présence du contenu attendu sur le site public ne démontre toutefois pas à elle seule que le HEAD local OVH vaut `e59c104` ; relever ce SHA via SSH lorsqu'un contrôle d'exploitation est nécessaire.

## 2. Chaîne de publication utilisée

Le workflow `.github/workflows/deploy-ovh.yml` utilise **uniquement `workflow_dispatch`**, après approbation de la release et fusion contrôlée dans `main`. Un push ou un merge dans `main` **ne publie plus automatiquement** le site. L'opérateur doit déclencher `Publish OVH static branch` en fournissant `expected_source_sha` (SHA complet de 40 caractères de `main`). Le workflow refuse un SHA différent, exécute les tests du site et du Grand Dîner puis, après succès, compile `dist/` et actualise la branche statique `ovh-production`.

**Procédure impérative depuis un terminal avec GitHub CLI authentifié, uniquement après validation humaine et CI de `main` PASS :**

```bash
git fetch origin main
RELEASE_SHA="$(git rev-parse origin/main)"
echo "$RELEASE_SHA"
gh workflow run deploy-ovh.yml -R roro78/cuisine-cambodgienne --ref main -f expected_source_sha="$RELEASE_SHA"
gh run list -R roro78/cuisine-cambodgienne --workflow deploy-ovh.yml --limit 3
```

Attendre **success** du workflow correspondant au SHA approuvé, puis noter le SHA de `ovh-production`. **Le succès GitHub ne synchronise pas à lui seul le répertoire réellement servi par OVH** : vérifier la connexion et le dossier cible avant toute commande `git pull --ff-only`. Voir également `docs/release-runbook-2026-10-12.md` pour la sauvegarde et le rollback.

La cible OVH précédemment utilisée est `~/www/cdc2017` sur `ssh.cluster102.hosting.ovh.net`.

### Commandes SSH de vérification et synchronisation, uniquement lors d'une publication autorisée

Depuis un terminal disposant des accès OVH :

```bash
ssh cuisinedh@ssh.cluster102.hosting.ovh.net -p 22
```

Sur OVH, **commencer en lecture seule** :

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

Ne continuer **que si** le dossier est bien la racine servie, l'arbre de travail est propre, la branche active est `ovh-production`, le `remote` correspond au dépôt attendu et le nouveau SHA distant a été inspecté. Pour la publication **déjà validée du lot A**, le SHA de référence historique est `e59c104` ; pour **toute nouvelle publication**, relever le HEAD actuel et les commits avant de tirer, sans utiliser aveuglément ce SHA comme cible.

Après **autorisation explicite de déploiement** seulement :

```bash
git pull --ff-only origin ovh-production
git log -1 --oneline
```

En cas de conflits, de modifications locales ou de divergence : **arrêter**. Ne jamais utiliser `--force`, `reset --hard` ou écraser les fichiers de production. Le `git fetch` ne publie rien ; le `git pull` modifie effectivement le site et ne doit pas être déclenché pendant une simple revue.

## 3. Lot B : PR #24 — Grand Dîner Khmer

**État au 12 octobre : PR #24 historique clôturée comme remplacée, sans merge dans `main`.** Son contenu a été adapté au socle actuel dans la **PR #42**, fusionnée uniquement dans `fix/preprod-phase1-20261012`. La **PR finale #44** reste ouverte en attente de validation : le Grand Dîner n'est donc pas publié par cette opération.

1. **Contrôler la revue finale de la PR #44 et la CI du HEAD exact** : Astro/TypeScript, recettes, contrat de pré-lancement, pages compilées, navigateur Chrome desktop/mobile, choix du menu et impression A4.
2. Confirmer que les trois routes de démonstration restent `noindex` et hors sitemap : `/experiences/`, `/experiences/grand-diner-khmer/` et `/experiences/grand-diner-khmer/carnet-de-reception/`.
3. Effectuer les dernières vérifications humaines utiles (lecture d'écran, impression physique, rendu visuel) et distinguer celles-ci des **essais culinaires réels** : ces derniers sont exigés avant toute **commercialisation**, pas pour une éventuelle démonstration gratuite explicitement annoncée comme non testée.
4. **Fusionner la PR #44 uniquement sur instruction explicite** et après résolution des revues. Cette fusion **ne déclenche pas la publication** : il faut contrôler la CI de `main` puis déclencher manuellement `deploy-ovh.yml` avec `expected_source_sha`. Aucun artefact neuf n'existe tant que ce workflow n'a pas réussi.
5. **Déployer sur OVH uniquement sur instruction explicite**, avec les vérifications et commandes ci-dessus, puis contrôler les trois routes publiées, leurs liens, le `noindex` et l'absence de vente/réservation.
6. Ne pas présenter le Grand Dîner Khmer comme un produit payé, un repas testé ou une prestation animée par un partenaire tant que ces éléments n'existent pas et n'ont pas été validés.

## 4. Traçabilité et informations restant à confirmer

À chaque future publication, consigner : SHA de `main`, SHA compilé `ovh-production`, SHA réellement présent sur OVH, état de l'arbre Git, URLs/HTTP de recette et résultat du contrôle visuel. Préparer un retour arrière **uniquement avec une sauvegarde connue et une procédure d'hébergement vérifiée**.

- **Confirmé :** pages ateliers et correctifs de recettes visibles en public ; workflows GitHub réussis ; dernière branche compilée du lot A `e59c104`.
- **À confirmer depuis OVH :** HEAD exact du dossier SSH, éventuelles modifications locales et capacité de restauration.
- **À ne pas faire avant validation de la PR #44 :** merge automatique, déclenchement du workflow manuel, synchronisation SSH, activation de paiement ou de réservation.
