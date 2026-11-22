# C2 — Requalification éditoriale du Carnet culturel (22 novembre 2026)

## Point de départ vérifié

GitHub [#121, premier résultat](https://github.com/roro78/cuisine-cambodgienne/issues/121#issuecomment-7084505808) : un seul job C2 sur Orvekio a obtenu `queued → running → succeeded` après **81 446 ms**, avec `llama3.2:latest`, puis `cmsAiContentCandidate('culture', …)` a validé le schéma S1 (cinq champs ; relecture humaine obligatoire). La [relecture](https://github.com/roro78/cuisine-cambodgienne/issues/121#issuecomment-7084521635) est **NO-GO éditorial** : répétition des sections, consignes de test dans les champs publics, SEO qui recycle l’angle, temps de lecture peu crédible, faits généraux non sourcés. Le candidat brut reste privé sur Orvekio et ne se trouve pas dans GitHub.

### Diagnostic contradictoire

Le contrat PHP `cmsAiContentRequest` fournit une liste `references` de **chemins de documents**, mais le fournisseur Ollama C2 reçoit seulement `brief`, `reference`, `rules`. Les documents ne sont **pas** lus ni transmis au modèle : ne pas considérer ce tableau comme un corpus documentaire disponible. Le test synthétique historique dit explicitement qu’aucune enquête ni source datée n’est transmise. Une amélioration de style du prompt seul ne peut ni fabriquer de faits ni qualifier l’exactitude.

## Correctif limité proposé dans cette PR (non déployé)

1. **Prompt du fournisseur C2 seulement** : distinguer les textes publics de `research_note`, ne pas recycler les instructions de benchmark, refuser les fausses citations et les extrapolations nationales ; imposer des sections culturelles complémentaires, une description SEO distincte, et une durée de lecture proportionnée. Le schéma S1, le modèle, les délais, le stockage, la file, l’absence de relance, les routes, Coral et la sélection des fournisseurs sont inchangés.
2. **Cas documentaire opt-in** dans `tests/fixtures/editorial-culture-documented-kep.json`. Aucun remplacement du cas historique `culture-no-tutorial`. La commande de préparation du cas est `php scripts/editorial-ai-structured-benchmark.php request culture catalogue documented`, où `catalogue` contient les trois index publics du Studio ; validation normale `php scripts/editorial-ai-structured-benchmark.php validate culture candidat.json`.
3. **Tests simulés** JS/PHP pour prouver le prompt, l’isolation des autres familles, le nouveau contexte et le refus des usages non autorisés du cas documentaire. Une CI verte ne prouve pas la qualité du français produit par le modèle.

## Dossier de preuves du cas Kep (référence publique, pas reportage)

**Source utilisée :** [MPSEZ — tourisme à Kep](https://www.mpsez.gov.kh/coastal-industries/coastal-tourisim/tourisim-at-kep-province), consultée le 22/11/2026. La page présente explicitement Psar Kdam comme « Crab Market », mentionne les produits de la mer et associe le crabe au poivre de Kampot à l’offre culinaire locale. Ce constat recoupe le registre interne `docs/carnets/REGISTRE-SOURCES-DECISIONS-M2-2026-10-22.md`, rubrique C05.

**Limites indispensables :** communication territoriale touristique, pas enquête ethnographique ni preuve des conditions économiques des vendeurs ; aucune statistique, observation de terrain, citation de commerçant, origine des prises ni analyse nationale vérifiée. Un exemple à Kep ne démontre rien sur **tous** les marchés cambodgiens. Éviter tout doublon avec le Carnet historique C05 : **ce candidat n’est qu’un essai isolé**, non une nouvelle page à publier.

## Requalification future, explicitement conditionnelle

- Maintenir le candidat historique, les cinq familles et `editorial_ai_content.enabled/qualified` inchangés.
- Exécuter **une seule fois** le nouveau cas avec le worker **correctement équipé du patch testé**, sous ID inédit (ne jamais rejouer le premier ID), absence de file concurrente, token privé, aucun TTS payant, sans publication. Ne pas utiliser le tag Docker de production pour supposer que le patch GitHub y est déjà installé.
- Mesurer durée, HTTP, sortie brute privée, validité du schéma puis relecture **humaine** : faits attribuables à la source, paragraphes non répétitifs, rubriques publiques sans consignes internes, durée plausible, absence de généralisation abusive.
- Si NO-GO, ne pas activer le bouton. Si GO éditorial sur ce cas, **cela ne qualifie que la portée S1 culture de ce cas**, pas les cinq familles ni le contenu complet Astro S2 ; le test PHP-FPM puis sauvegarde privée du Studio demandent encore une réception isolée.
- Aucun changement OVH, n8n/Meta, MP3, Coral, Compose, secrets, index ou données de production dans cette PR.
