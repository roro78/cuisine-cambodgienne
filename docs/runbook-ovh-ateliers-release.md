# Mise en production OVH — Ateliers pédagogiques (PR #20)

**État au 10 octobre 2026 : validation GitHub acquise, déploiement OVH à faire/confirmer.**  
**Dépendance obligatoire avant la mise en production du chantier commercial PR #24.**

## Faits vérifiés

- PR #20 : https://github.com/roro78/cuisine-cambodgienne/pull/20 — fermée après fusion le 5 octobre 2026.
- Commit de fusion des pages ateliers : `096ceccd9881d87dcbc27352648fa16ce13c1bd3`.
- `main` au moment du cadrage : `b1977a9b6937da0a5af1becd41fee0aca045fb41`, fusion PR #23 (logo et menu mobile). `main` contient donc également les PR #21–23.
- La page listing `/apprendre/` est accessible sur le site public. L'accessibilité des nouvelles pages de détail et leur code exact côté OVH n'ont pas été confirmés.
- **Ne pas déduire du listing accessible que tous les ateliers détaillés sont déployés.**

## Ordre impératif des livraisons

### Lot A — Version existante des ateliers / menu / logo

1. Avant toute opération, noter le **nouveau SHA réel de `main`** et faire un état de la cible OVH : répertoire servi, version en place, mécanisme de déploiement, éventuelles modifications locales non versionnées.
2. S'assurer que le code de `main` à publier contient la PR #20 ; si `main` a évolué, inspecter les nouveaux commits avant publication.
3. Exécuter / confirmer `npm run check`, `npm run test:motion`, `npm run test:recipes`, `npm run test:editorial`, `npm run build`.
4. Générer le dossier statique `dist/`, si la voie utilisée passe par une compilation locale. Ne **pas** copier `src/` en production à la place du build.
5. Déployer en utilisant la configuration OVH actuelle vérifiée (intégration Git existante ou transfert statique). Ne pas inventer le chemin FTP/SFTP ou réutiliser un webhook non confirmé.
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
- Chemin du document root, identifiants SSH et mécanisme actuel du déploiement : non confirmés.
- Existence d'une sauvegarde précédente et capacité de rollback : à vérifier.
- Aucun envoi automatique en production exécuté dans cette PR.
