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

G1 — Provenance et quantités : **PASS documentaire le 19/10/2026**. Recette de base retrouvée : https://cambodiarecipe.com/tamarind-sauce/ (2023), avec 2 c. à soupe de tamarin, 1/3 tasse d’eau (80 ml), 2 c. à soupe de sucre et 2 c. à soupe de sauce de poisson, ail et piment facultatifs. Recoupements : CamboKitchen et Cambodianess (liens enregistrés dans src/data/guidedWorkshops.ts). Le brouillon précédent à 180 ml d’eau, 10 g de sucre et 10 ml de sauce de poisson a été corrigé. Les quatre coupelles sont notre ajout pédagogique. Essai gustatif indépendant facultatif mais conseillé : sa réalisation n’est pas prétendue.

G2 — Média : photographie véridique de la sauce finie et visuels de gestes. Vérifier licences et droits de réutilisation. L'image historique de tamarin utilisée actuellement est explicitement légendée comme image d'ingrédient, pas comme résultat final.

G3 — Coral : **script six chapitres préparé et exportable hors ligne**, sans TTS ni coût. Après G1 documentaire validé, générer le nouveau fichier audio uniquement pour cette page avec la voie Coral déjà retenue. Mesurer les trames MP3 et chapitres réels, synchroniser étape par étape sans réutiliser un MP3 historique.

G4 — SEO : publier uniquement une fois G1-G3 acquis ; passer status=validated ; créer Recipe JSON-LD fidèle, vérifier image du plat fini, canonical, sitemap, liens internes, absence de cannibalisation.

G5 — Réseaux : intégrer l'atelier au catalogue social après publication de la page et revue de sa photo ; tenir compte de PR #83 et du planning éditorial. Aucune activation de workflow, envoi Resend ou publication Meta dans ce lot.

G6 — Livraison : review de la PR, tests Astro et mobile, fusion et déploiement OVH sur SHA validé sans perturber les autres chantiers. Vérifier les URL historiques et les six MP3 après mise en production.

## Limites assumées

La recette publiée permet de valider la provenance et les proportions de base, pas de prétendre à une dégustation réalisée.
Le brouillon narratif n'est pas un MP3. Aucun test de lecture mobile avec une nouvelle narration n'est revendiqué à ce stade.
Les recettes nouvelles ne sont pas des restaurations de recettes traditionnelles historiques. Les anciennes pages ne sont ni déplacées ni écrasées.

La validation documentaire G1 ne déclenche ni fusion, ni déploiement, ni création d’un MP3. G2 image et G3 audio restent à mener indépendamment, sans modifier les six contenus historiques.

## Lot d'isolation suivant

Le 19 octobre, le correctif du test « Eau potable » a été préparé : le test vérifie désormais un libellé présent et la quantité au lieu de la longueur artificielle du libellé. Les durées affichées sont alignées sur les six étapes et couvertes par un contrôle. Le script d'export Coral reste **hors ligne**, sans accès au service TTS et sans MP3 généré. Voir `docs/atelier-pratique-tamarin-coral.md`.

## UX et tests navigateur indépendants — 19 octobre

Le parcours pilote comporte maintenant six validations manuelles par case à cocher, un indicateur de progression limité à la visite en cours, des liens d'étape et des astuces dépliables accessibles au clavier. Les scripts de narration restent dans le modèle exportable Coral, **jamais dans le HTML de visite**. Aucun stockage de progression, réseau supplémentaire ni modification des lecteurs existants.

La CI dédiée exécute désormais le smoke-test Chromium à 360/390/768/1440 px : absence de débordement horizontal, affichage de la source, passage des étapes, conseils, compteur, image d'ingrédient, `noindex`, aucune lecture parasite d'ancien MP3. Le résultat doit être constaté sur GitHub ; la documentation ne préjuge pas du verdict.

## Audit pédagogique complémentaire — 20 octobre 2026

Avant toute nouvelle synthèse, le pilote a été corrigé pour être reproductible : incorporation effective de l'ail/piment facultatifs dans la casserole, réserves séparées de sucre (1 c. à café) et de sauce de poisson (5 ml) en plus des doses de base, jus de tamarin prélevé avant assaisonnement, et eau de dilution éventuelle (15 ml distincts des 80 ml d'origine). Les six scripts vocaux restent dérivés de `src/data/guidedWorkshops.ts` et les chapitres 3, 4 et 5 ont été alignés sur les gestes. Les 28 minutes couvrent les gestes, sans garantir le temps de tiédissement. Les mentions du prestataire vocal ont été retirées de la page publique du pilote.

**G3 audio toujours BLOCKED** : le workflow TTS antérieur a expiré sur un appel Render de 100 s. Ne pas relancer ce workflow à l'aveugle : d'abord vérifier la récupération de l'introduction sauvegardée et la durée d'attente côté backend ; après un nouvel essai autorisé, sauvegarder chaque chapitre une fois généré, mesurer l'assemblage MP3 et contrôler à l'écoute avant toute intégration. La CI de cette correction ne doit jamais appeler l'API TTS.
