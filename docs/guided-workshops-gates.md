# Ateliers guidés — lot pilote sauce au tamarin (isolation des chantiers)

Date : 19/10/2026. Branche : feat/atelier-guide-sauce-tamarin-pilote-20261019.

## État vérifié au démarrage

- main : bb535a9b9d13d3a4035e29af899957e1e10aad1d (PR #86 fusionnée).
- PR #87 : en brouillon ; uniquement renommage des leçons historiques ; ne pas fusionner en l'état.
- PR #83 : évolution du catalogue social ; ne pas toucher à src/data/socialCatalog.ts.
- PR #67, #63 et #57 : lecteur et voix ; ne pas modifier les composants ou manifests audio existants.
- Six pages /apprendre/{slug}/ et six MP3 Coral préexistants : intouchables dans le lot.

## Périmètre technique livré dans cette branche

Nouveaux fichiers indépendants seulement :
- src/data/guidedWorkshops.ts : modèle typé, données et scripts narratifs de travail.
- src/pages/apprendre/pratique/sauce-tamarin.astro : démonstrateur responsive.
- tests/guided-workshop-contract.test.mjs : contrôles contractuels.
- .github/workflows/guided-pilot.yml : CI dédiée (sans déploiement).
- docs/guided-workshops-gates.md : gates et suivi.

Pas de nouveau lien injecté dans les pages historiques ou la page /apprendre/.
Pas d'intégration au flux social avant les vérifications culinaires, image et audio.
En cas de déploiement accidentel, la page est en noindex et explicitement marquée « pilote ».

## Gates restant obligatoires

G0 — Protection : confirmer que la branche ne modifie aucune des six narrations, routes ou images existantes.

G1 — Culinaire : une personne indépendante exécute toute la recette du pilote ; consigner masse de pulpe, quantité de filtrat réellement obtenue, assaisonnement final, rendement, goût avec accompagnement, éventuels allergènes. Corriger après cet essai, pas en inventant sa réussite.

G2 — Média : photographie véridique de la sauce finie et visuels de gestes. Vérifier licences et droits de réutilisation. L'image historique de tamarin utilisée actuellement est explicitement légendée comme image d'ingrédient, pas comme résultat final.

G3 — Coral : après G1, valider puis générer le nouveau fichier audio uniquement pour cette page avec la voie Coral déjà retenue. Mesurer les trames MP3 et chapitres réels, synchroniser étape par étape sans réutiliser un MP3 historique.

G4 — SEO : publier uniquement une fois G1-G3 acquis ; passer status=validated ; créer Recipe JSON-LD fidèle, vérifier image du plat fini, canonical, sitemap, liens internes, absence de cannibalisation.

G5 — Réseaux : intégrer l'atelier au catalogue social après publication de la page et revue de sa photo ; tenir compte de PR #83 et du planning éditorial. Aucune activation de workflow, envoi Resend ou publication Meta dans ce lot.

G6 — Livraison : review de la PR, tests Astro et mobile, fusion et déploiement OVH sur SHA validé sans perturber les autres chantiers. Vérifier les URL historiques et les six MP3 après mise en production.

## Limites assumées

Une version codée, même complète sur le plan textuel, ne prouve pas la réussite culinaire.
Le brouillon narratif n'est pas un MP3. Aucun test de lecture mobile avec une nouvelle narration n'est revendiqué à ce stade.
Les recettes nouvelles ne sont pas des restaurations de recettes traditionnelles historiques. Les anciennes pages ne sont ni déplacées ni écrasées.
