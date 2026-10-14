# V17 — D8 : plan de bascule contrôlée de l'accueil

État préparatoire du 14 octobre 2026. **Ce document n'autorise aucune fusion ni mise en production.**

## Pourquoi une nouvelle étape est obligatoire

- `src/pages/v17-accueil-preview.astro` est une prévisualisation isolée avec `noindex`, canonique `/v17-accueil-preview/`, titre « V17 — Prévisualisation » et script GSAP dédié.
- `src/pages/index.astro` est **toujours la home V16 publique**. La fusion de la PR #47, seule, ne fait pas passer V17 sur `/`.
- `main` et `ovh-production` sont deux représentations différentes : la deuxième contient l'artefact statique compilé. Même une CI `main` réussie ne prouve pas que le serveur OVH sert cette version.
- Le workflow de publication `.github/workflows/deploy-ovh.yml` est **manuel**, verrouillé par le champ `expected_source_sha`. Ne jamais déclencher sur le seul succès d'une CI.

## D7 : critères d'entrée avant D8

- [x] Contrat Astro et tests Chromium sur les 9 largeurs de 320 à 1920 px, version sans JS et mouvement réduit (preuve : CI de la PR #47).
- [x] Test de visibilité des mots réels en 320/360/390/430 px ; aucun texte hors écran lors de la dernière CI verte.
- [x] Source du marché IA contrôlée par une empreinte SHA-256 et explicitement qualifiée comme illustration fictive.
- [x] Analyse Lighthouse mobile 12.8.2 exécutée, et problèmes d'accessibilité automatisés documentés. Dernière CI technique : [#38597112654](https://github.com/roro78/cuisine-cambodgienne/actions/runs/38597112654), accessibilité 100/100, performance 80/100, LCP 5,34 s, CLS 0. **Les objectifs LCP ≤ 2,5 s et performance ≥ 90 restent non atteints dans le laboratoire, sans métriques terrain.**
- [ ] Vérification réelle Safari/iOS et VoiceOver (ou NVDA), zoom navigateur à 200 % et contraste du texte sur photographies.
- [ ] Original de la maquette approuvée archivé sur GitHub, avec SHA-256 recalculé et comparé à la référence D0.
- [ ] **Validation explicite de la composition finale** par le propriétaire sur desktop/mobile. La CI verte ne remplace pas cette réception.
- [ ] Revue exhaustive des licences et crédits des images réellement utilisées.

## D8 : lot de promotion à créer seulement après réception D7

1. Relever et sauvegarder les SHA source de `main`, de la PR #47, et de l'ancienne `ovh-production`. Vérifier le HEAD réel de la racine servie OVH par SSH en lecture seule.
2. Créer une **PR de promotion distincte** à partir d'une base propre actualisée (ne jamais fusionner un ancien prototype) pour remplacer **uniquement** `src/pages/index.astro` avec la composition V17 et ses styles/scripts. Garder les autres pages et composants.
3. Dans la page publique, mettre le titre et la description finaux, supprimer le `noindex` et le langage de « prévisualisation », garder un seul H1, et vérifier la canonique `/`, l'URL OG et les deux schémas JSON-LD.
4. Conserver la prévisualisation `/v17-accueil-preview/` explicitement `noindex` ou la supprimer dans un changement distinct et vérifié. Ne jamais lui donner la même canonique que `/`.
5. Ajouter au test de release une assertion qui vérifie que `dist/index.html` affiche bien la composition V17 et qu'il n'est pas `noindex`, tout en conservant les routes recettes, ateliers, glossaire, culture, à propos et expériences protégées.
6. Exécuter la CI complète **sur le SHA exact** du candidat, puis vérifier mobile, clavier, images, crédits et défilement. Demander le feu vert de publication.
7. Après **accord explicite**, fusionner la PR de promotion et attendre la CI de `main` sur son nouveau SHA exact. Déclencher **manuellement** la publication GitHub avec `expected_source_sha`, puis vérifier le SHA statique de `ovh-production`.
8. Vérifier le répertoire servi par OVH et sa branche ; faire une sauvegarde vérifiable ; n'autoriser qu'un `git pull --ff-only origin ovh-production` si l'arbre est propre et le bon répertoire confirmé.
9. Recetter le site public sur mobile et desktop : accueil V17, CTA, recettes, ateliers, crédits, sitemap, robots/canonique et fonctionnalités historiques. Noter SHA serveur + URLs et résultats.

**Procédure technique OVH et restauration déjà vérifiée/documentée :** [`docs/release-runbook-2026-10-12.md`](./release-runbook-2026-10-12.md). Réutiliser le workflow `Restore previous OVH static release` en cas de retour arrière (SHA statique avant/après) ; ne pas réécrire l'historique avec `git reset --hard` ou `push -f`.

## Arrêts obligatoires

Aucun merge de PR #47 ou PR de promotion, aucune mise à jour du dossier OVH et aucune déclaration « production PASS » tant que l'approbation finale, les contrôles matériels bloquants et la procédure de retour arrière ne sont pas établis. Ne jamais inventer le SHA réellement servi par OVH.
