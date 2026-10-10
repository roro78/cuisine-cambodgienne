# Mise en production OVH — Ateliers et Expériences

**État contrôlé le 10 octobre 2026 : lot A EN LIGNE ; lot B (PR #24) toujours en attente de décision, non fusionné.**

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

Le workflow `.github/workflows/deploy-ovh.yml` s'exécute **sur un push vers `main`** : installation des dépendances, contrôle Astro, génération de `dist/`, puis publication de ce contenu statique dans la branche distincte `ovh-production`.

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

**État : PR ouverte, non fusionnée et non publiée.** Le lot A ayant été vérifié en ligne, il ne faut pas attendre un nouveau déploiement des ateliers pour poursuivre la revue du lot B.

1. **Contrôler la review et la CI de la tête courante** de la PR #24 : Astro/TypeScript, recettes, contrat de pré-lancement, pages compilées, navigateur Chrome desktop/mobile, choix du menu et impression A4.
2. Confirmer que les trois routes de démonstration restent `noindex` et hors sitemap : `/experiences/`, `/experiences/grand-diner-khmer/` et `/experiences/grand-diner-khmer/carnet-de-reception/`.
3. Effectuer les dernières vérifications humaines utiles (lecture d'écran, impression physique, rendu visuel) et distinguer celles-ci des **essais culinaires réels** : ces derniers sont exigés avant toute **commercialisation**, pas pour une éventuelle démonstration gratuite explicitement annoncée comme non testée.
4. **Merger uniquement sur instruction explicite**. Ce merge déclenchera le workflow de compilation/publication de l'artefact `ovh-production` ; il ne prouve pas à lui seul sa synchronisation sur le serveur OVH.
5. **Déployer sur OVH uniquement sur instruction explicite**, avec les vérifications et commandes ci-dessus, puis contrôler les trois routes publiées, leurs liens, le `noindex` et l'absence de vente/réservation.
6. Ne pas présenter le Grand Dîner Khmer comme un produit payé, un repas testé ou une prestation animée par un partenaire tant que ces éléments n'existent pas et n'ont pas été validés.

## 4. Traçabilité et informations restant à confirmer

À chaque future publication, consigner : SHA de `main`, SHA compilé `ovh-production`, SHA réellement présent sur OVH, état de l'arbre Git, URLs/HTTP de recette et résultat du contrôle visuel. Préparer un retour arrière **uniquement avec une sauvegarde connue et une procédure d'hébergement vérifiée**.

- **Confirmé :** pages ateliers et correctifs de recettes visibles en public ; workflows GitHub réussis ; dernière branche compilée du lot A `e59c104`.
- **À confirmer depuis OVH :** HEAD exact du dossier SSH, éventuelles modifications locales et capacité de restauration.
- **À ne pas faire dans cette PR #24 :** merge automatique, synchronisation SSH, activation de paiement ou de réservation.
