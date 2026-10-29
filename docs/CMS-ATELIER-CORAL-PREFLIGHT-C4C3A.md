# C4C3A — Atelier Coral V2 : recette canonique et précontrôle privé

29 octobre 2026 — **chantier préparatoire**, pas une génération d'atelier
complet, pas de nouvelle page ni de MP3.

## Pourquoi cette étape

Les ateliers publics utilisent déjà un blueprint de
`src/data/atelier-recette-guides/*.json` qui comporte une recette source,
des portions canoniques, **six phases pédagogiques avec ID stables** et
**sept narrations** (une introduction et six phases). Chaque champ audio,
média, sécurité, allergène, décision éditoriale et approbation de
publication fait l'objet de contraintes distinctes.

Le contrat C2 `creation-form-core-v1` ne dispose que d'un intitulé et
d'un objectif d'apprentissage par phase. Six lignes dans un brouillon ne
signifient pas qu'un atelier Coral V2 est prêt.

## Ce qui est ajouté au Studio commun

- Champ humain optionnel `atelier_reference.version=1`, renseignant
  `recipeSlug`. Le slug doit désigner une **recette déjà publiée**.
- À chaque sauvegarde privée, le serveur vérifie la recette avec le
  catalogue public et enregistre son empreinte de catalogue **16 hex**.
  Un ancien client qui n'envoie pas le champ conserve l'ancienne
  référence, mais la sauvegarde refuse une empreinte devenue périmée.
- L'empreinte 16 hex détecte des changements du catalogue : elle
  **ne remplace pas** l'empreinte SHA256 intégrale du modèle Astro et
  les contrôles de portions/ingrédients de la chaîne C2.
- `cmsAtelierBlueprintPreflight` vérifie la présence des six chapitres,
  leurs titres distincts, la recette canonique choisie et la cohérence
  avec une éventuelle référence IA C2.
- Le panneau privé du Studio affiche ces contrôles sans exposer
  de ressources non approuvées.

Même si tous les contrôles préparatoires sont positifs,
`seven_audio_scripts_approved=false`,
`stable_phase_ids_ready=false` et
`publication_ready=false`. Aucun chapitre audio, voix Coral, bruitage,
visuel ou autorisation n'est déduit de l'empreinte.

## Limites et lots suivants

**C4C3B :** documenter et enrichir les six phases avec identifiant stable,
durée, gestes, repères observables, contrôles, erreurs, récupération,
sécurité, allergènes et cohérence des ingrédients de la recette source.

**C4C3C :** écrire les sept scripts, créer un registre de validation
éditoriale par version, organiser éventuellement TTS Coral dans un
service dédié **après** visa humain, valider les MP3 réels et la
navigation par chapitre sur mobile. Ne pas écraser les six ateliers
ou les MP3 historiques.

**P2/P3 :** aperçu Astro fidèle après revue recette/visuels/droits ;
publication en PR distincte explicitement autorisée.

CI : `tests/php/editorial-atelier-canonical-preflight-smoke.php`
réutilise le **catalogue réel généré dans dist**, teste les versions privées,
les empreintes altérées, les faux liens, les six chapitres et les refus
d'approbation. PHP 8.3/8.4 et Astro/Node.

Aucun accès n8n, Ollama, OVH ou ordinateur nécessaire pour ce lot.
