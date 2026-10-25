# Social #121 — moteur de légendes naturelles, sans invention (proposition non déployée)

En octobre 2026, l'essai Kroeung avait révélé une génération mécanique : « informations vérifiées », « dans notre catalogue », et un lien Facebook bourré de paramètres UTM visibles.

Ce lot remplace **seulement** le prompt Ollama et le formateur de texte du workflow 01 dans l'export GitHub. Le catalogue, les recettes, les carnets et leurs faits restent intacts.

## Contrat éditorial

- **Accroche courte selon le type** (recette, ingrédient, atelier, culture, technique) et adaptée Facebook/Instagram.
- **Faits copiés du catalogue** : seules des propositions factuelles présentes textuellement dans `source.facts` sont autorisées au centre de la légende. Pas de reformulation automatique libre, car la validation hors réseau ne prouve pas l'absence d'invention.
- **Facebook** : un lien canonique lisible vers la vraie page, sans UTM public.
- **Instagram** : nom du site court, sans URL de tracking.
- **Fallback déterministe** même si Ollama échoue : il choisit des extraits factuels courts et évite les listes d'ingrédients/temps techniques.
- **Approbation humaine obligatoire** ; aucun automatisme ne peut publier un brouillon non validé.
- L'IA ne reçoit aucune permission de publier, modifier la base ou créer des faits.
- **Gates de qualité** : pas de slogans de validation internes dans les textes publics, pas d'URL externe, pas de long bloc de recettes affiché comme une publication.

## Migration sécurisée n8n — PAS APPLIQUÉE

Avant de toucher au runtime, **vérifier l'export GitHub, la CI et les aperçus humains**. `scripts/sync-cuisine-n8n-runtime.mjs` reconnaît strictement les empreintes de la version installée du workflow 01 :
- prompt actuel `4a5b94ea6e0335d52212ee0f58ebc24f7e45e3ab9e0fda2a84fa68052799c46b`
- code validateur actuel `7d77b62fecff17a9cdae33c6053fc1e6ca457badfc21f3f0a3aa7fa793a48189`

Toutes les autres versions restent refusées (fail-closed). Le script reste dry-run par défaut ; `--apply` exigerait une autorisation distincte.

**Aucune publication, email, activation, modification PostgreSQL, credential ou déploiement OVH n'est déclenché par cette PR.**

Après validation utilisateur : présenter trois aperçus ingrédients/recettes/culture avec photo, revoir la justesse photographique et éditoriale, puis planifier la migration contrôlée.
