# Prompt de continuation — Cinq ateliers complets Coral V2

**À copier dans Codex / une nouvelle conversation de travail.**  
**Projet unique : Cuisine du Cambodge. Mission d'implémentation autonome, pas simple audit.**  
**Référentiel V2 obligatoire : [REFERENTIEL-NARRATION-IMMERSIVE-V2.md](./REFERENTIEL-NARRATION-IMMERSIVE-V2.md).**

---

TU INTERVIENS COMME RESPONSABLE ÉDITORIAL CULINAIRE KHMER, INGÉNIEUR ASTRO/JS ET INGÉNIEUR AUDIO CORAL.

## Mission

Termine et vérifie **cinq ateliers complets V2** de Cuisine du Cambodge, avec la qualité déjà approuvée sur le **Lok Lak V2 (13 min 10 s)**. Tu disposes de l'autorisation d'avancer en autonomie : auditer, corriger, écrire les scripts complets, mettre à jour les fiches et le lecteur, adapter la génération Coral, lancer **une génération contrôlée par atelier**, mesurer les MP3 et produire **cinq vrais liens de préécoute**. Tu ne dois pas bloquer le chantier en demandant à l'utilisateur des commandes Git, des clés ou une approbation intermédiaire de rédaction.

**Limite à l'autonomie :** aucune personne ne peut être créditée d'une écoute ou dégustation qu'elle n'a pas réalisée. Les cinq MP3 générés resteront **en attente d'écoute humaine** ; ni merge, ni publication OVH, ni paiement client. Si une action externe non accessible bloque réellement le travail, fournis son diagnostic précis et arrête seulement l'item en cause ; poursuis les autres.

## Dépôt, état acquis et protection

Dépôt `roro78/cuisine-cambodgienne`. Branche de travail existante **`feat/ateliers-cinq-recettes-completes-20261020`**, **PR #92 DRAFT** : https://github.com/roro78/cuisine-cambodgienne/pull/92. Référentiel de structure PR #90 déjà fusionné ; le présent référentiel V2 est l'addendum obligatoire.

**Lok Lak V2 approuvé :** `src/data/atelier-recette-guides/lok-lak.json`, piste `public/audio/workshops/lok-lak-de-la-poele-a-l-assiette/atelier-coral-v2.mp3`, manifeste `src/data/atelier-recette-audio/lok-lak-v2.json`. Durée 789,936 s et SHA-256 `d3f5558c07f7aff5c4c57ccf7c662544079744dc0fa8223ec869a6b061d0912e`. L'utilisateur a validé son **rendu sonore uniquement**. **Ne pas re-synthétiser, modifier ou déclarer publié ce Lok Lak**, ni effacer sa V1.

**PR #89** gère les réseaux sociaux et n8n parallèlement : strictement **hors périmètre**, ne pas la modifier ni réécrire son historique. **PR #88** sauce tamarin est distincte ; ne pas la toucher. Préserver tous les anciens MP3, les six ateliers historiques, les recettes et articles d'origine, le SEO et le déploiement manuel OVH. Ne pas toucher aux secrets ni créer de nouveaux services Render, n8n, Meta, Resend ou Supabase.

Avant chaque série de commits, lire l'état réel de la PR #92, ses conflits éventuels, sa CI, les fichiers et les manifestes. Ne pas faire rebase/force push destructeur ; isoler les changements au besoin. **Un projet et un atelier à la fois.**

## Les cinq ateliers à finaliser — ordre proposé

1. **Kroeung jaune** : `src/data/atelier-recette-guides/kroeung-jaune.json` ; gestes de coupe des fibres, citronnelle/galanga/curcuma selon la recette réellement enregistrée, pilage graduel au mortier, texture à atteindre, conservation sûre et usage dans un plat. Pas un exposé abstrait sur les épices.
2. **Bai Sach Chrouk** : `.../bai-sach-chrouk.json` ; marinade du porc **si corroborée par la recette retenue**, coupe, cuisson, riz, pickles et dressage. Toutes les sous-préparations doivent être réellement expliquées. Température sûre et sécurité du riz cuit.
3. **Samlor Machu** : `.../samlor-machu.json` ; bouillon explicitement défini, découpe de la garniture, tamarin sous une forme précise, préparation, cuisson sûre, acidité équilibrée et corrections. Si le fond manque dans la recette, le documenter et résoudre sans inventer.
4. **Kuy Teav** : `.../kuy-teav.json` ; fabrication ou préparation précise du bouillon, porc/garnitures selon la recette, nouilles au bon moment, assaisonnement et service. Un « ajoutez votre bouillon » inexpliqué ne suffit pas.
5. **Num Banh Chok** : `.../num-banh-chok.json` ; vérifier **précisément** le statut du poisson, kroeung et lait de coco dans la recette choisie, créer les sous-préparations manquantes, cuire sauce/nouilles, préparer crudités/herbes et dresser. Ne pas assimiler toutes les variantes du plat à une même tradition.

L'ordre peut être ajusté sur la base de dépendances réelles, avec justification. Ne pas lancer cinq synthèses en parallèle. Les versions actuelles durent environ **1 min 50 à 2 min 17** : ce sont des **capsules provisoires, pas des cours V2 validés**.

## Phase A — Audit contradictoire de chacune des cinq recettes

Pour chacun des cinq, fais une matrice : ingrédients/quantités de la recette source, ustensiles, préparations, tâches et sous-recettes, ordre, cuisson/marinade/repos, risques alimentaires, variantes, sources et incohérences voix/page/audio. Ouvre les vraies données `src/data/recipes.ts`, fiches d'atelier, pages Astro et MP3 existants. **Vérifie sur Internet au moins deux sources culinaires fiables**, notamment cambodgiennes ou d'auteurs connaissant la cuisine khmère, avec URLs consultables et date. Distingue ce qui est établi, variante, inconnu et choix pédagogique.

**Ne réécris pas les recettes historiques.** Si un ingrédient, un bouillon, un condiment, une matière grasse ou une sous-recette manque, corrige/complète la **nouvelle fiche atelier** de manière explicite et traçable. Si une recette canonique est matériellement non réalisable, crée une fiche recette nouvelle et sourcée dans la catégorie appropriée plutôt que de prétendre qu'elle est correcte. Les textes et quantités de l'atelier doivent être utilisables par l'élève.

## Phase B — Cinq scripts **intégraux**, pas cinq résumés

**Lis intégralement** `docs/ateliers/REFERENTIEL-NARRATION-IMMERSIVE-V2.md` et le script approuvé `docs/ateliers/scripts/lok-lak-coral-v2-preproduction.md`.

Écris pour chaque plat les textes des **sept chapitres fixes** : `intro, installer, preparer, assembler, maitriser, rectifier, terminer`. Une **vraie cuisinière façon influenceuse culinaire**, chaleureuse, professionnelle, rassurante et encourageante ; accroche et conclusion variées. Elle doit permettre de cuisiner entièrement avec l'audio après mise en place, sans regarder sans cesse l'écran. Chaque manipulation : **comment, pourquoi, repère concret, erreur fréquente, récupération, sécurité**, avec transitions et reprises naturelles.

À l'oral, **zéro quantité de portion figée** : les convives choisissent leur nombre sur la fiche ; les noms d'ingrédients et les mesures de gestes invariantes restent prononçables. Annoncer le **matériel au début**, sans inventer quatre bols/assiettes fixes. Les pauses sont seulement dites (« vous pouvez mettre sur pause… ») ; le MP3 continue réellement tant que l'utilisateur ne le met pas sur pause. **Ne jamais présenter Coral comme une interaction live.**

À la fin, préférer « bon appétit » ou une formule variée appropriée au résultat réel (un kroeung cru n'est pas dégusté tel quel). Les anecdotes culturelles sont sourcées et discrètes. Aucun script copié avec uniquement des substitutions de noms.

Durée : pas de chronomètre artificiel de 2 minutes, ni de remplissage. **Le script doit décrire les gestes suffisants**, comme le Lok Lak V2 ; utiliser une durée adaptée à chaque recette. Les sept textes doivent être **branchés dans `src/data/atelier-recette-guides/*.json`**, pas laissés dans une note isolée.

## Phase C — Portions et expérience page ↔ voix

Généraliser le sélecteur de portions sur les **cinq ateliers**, sans modifier les recettes sources ; tester concrètement les quantités fractionnaires, sauces, unités, garnitures et allergènes. Ne jamais afficher une quantité « quatre personnes » fixe lorsque le visiteur en choisit deux.

Synchroniser le lecteur avec les **sept vrais chapitres audio**, mais faire défiler la page **uniquement au changement d'une des six grandes phases**, et uniquement avec « Suivre la narration » actif. Le déplacement manuel désactive le suivi sans couper le son. Le mini-lecteur mobile, les pauses, les sauts et le mode sans JS restent fonctionnels. Vérifier 360, 480, 800 et 1440 px, clavier et tactile. Aucun chapitre obligatoire ne se limite à l'écran sans explication orale.

## Phase D — Adapter l'infrastructure **existante** Coral V2

La V2 du script `scripts/bridge-cooking-workshops-coral.mjs` est actuellement **codée pour le Lok Lak uniquement**. Refactoriser proprement pour les cinq autres **sans lever les garde-fous** :
- `storyboardVersion: 2` pour chaque nouvelle fiche ; narration cohérente avec le storyboard ;
- `--plan` et `--check` sans appel réseau ; contrôles de complétude, conservation de source, sécurité des noms de fichiers et versions ;
- sous-segments avec empreinte du texte ; checkpoints GitHub Actions sous le **slug complet** ; faire échouer un upload sans fichier ;
- **une seule synthèse séquentielle par atelier**, sans relance automatique d'une requête dont le résultat est incertain ; reprise uniquement depuis de vrais MP3/artefacts vérifiés ;
- chaque sortie V2 `atelier-coral-v2.mp3`, manifeste `<slug-recette>-v2.json`, timestamps des **sept grands chapitres** mesurés `ffprobe`, SHA256, empreinte du texte ; **jamais d'écrasement de V1 ni de Lok Lak** ;
- utiliser uniquement la voix Coral et le backend Render existant, sans nouveaux identifiants, sans workflows permanents ou publication OVH ;
- CI technique **ne crée pas** d'appels Coral. Les workflows de génération sont dédiés et manuels/explicitement déclenchés seulement après QA du script correspondant. L'autorisation d'aller jusqu'aux cinq MP3 de préécoute est donnée pour cette mission ; pas de publication ni d'écoute humaine présumée.

Si un backend atteint un timeout, **ne pas boucler**. Sauvegarder les sous-pistes confirmées et fournir un compte rendu concret pour ce seul atelier. Ne pas répéter inutilement des appels déjà facturés ou réalisés.

## Phase E — Vérifications, autonomes puis preuves

Pour **chaque** atelier :
1. Vérifier la cohérence complète de la recette, les sources et la sécurité, y compris les préparations intermédiaires.
2. Exécuter les contrats de blueprint/storyboard/portions et la suite de tests Node.
3. Vérifier `npm run check`, `npm run build`, QA navigateur mobile et desktop (portions, scroll, Play/Pause, navigation des chapitres, noindex, sans JS).
4. Exécuter la génération Coral V2 dans un workflow isolé ; prouver vrai fichier MP3, durée `ffprobe`, signature, empreinte SHA256, manifestes et horodatages complets.
5. Lancer la CI complète sur le **SHA final** et corriger les régressions documentées (ne pas confondre « cancelled » et PASS).
6. Produire un **lien de préécoute direct par MP3**, une grille de comparaison entre les sept chapitres, le résumé des vérifications et les réserves. Les 5 nouveaux MP3 restent `review_pending` tant que l'utilisateur ne les a pas effectivement approuvés à l'oreille.
7. Ne déclarer **aucun** test réel de cuisine, photographie et droits, revue acoustique ou autorisation de mise en ligne que tu ne peux pas prouver.

## Livraison attendue

Une seule **PR #92**, en DRAFT, avec cinq fiches complètes V2, cinq MP3 **nouveaux** (si la synthèse aboutit), cinq manifestes V2, lecteurs et portions cohérents, tests et CI. Conserver le Lok Lak V2 et les archives intacts.

Ajoute une **matrice finale sur six ateliers** : Lok Lak étalon + cinq nouveaux, donnant pour chacun `sources, script, ingrédients et portions, MP3, durée, CI, UX mobile/desktop, écoute humaine, essai réel, photo/droits, statut publication`. Fournis les liens directs d'écoute du lot et le suivi des blocages.

**Niveau de vérité attendu :** PASS seulement avec résultat vérifié ; UNKNOWN si aucune preuve ; BLOCKED si difficulté réelle ; DRAFT tant que l'utilisateur n'a pas approuvé la partie humaine. Le rendu vocal peut être prêt pour écoute et techniquement complet **sans** être autorisé à la vente ni à la publication.

**NE PAS SOLLICITER L'UTILISATEUR APRÈS CHAQUE ÉTAPE :** avance, corrige, vérifie et documente ; fais un bilan clair uniquement quand les MP3 sont prêts à écouter ou qu'un blocage non contournable empêche réellement de finir. Aucun secret, aucune commande manuelle inutile et aucune action hors projet.
