# C4C3F — Visa humain de concordance culinaire

29 octobre 2026 — **relecture humaine** des données culinaires d'un atelier
Coral V2, indépendante des sept visas de texte C4C3D. Ce lot ne certifie
pas la sécurité alimentaire et ne permet aucun MP3.

## Dans le Studio privé

Depuis un atelier enregistré, afficher sur demande la recette canonique
Astro (C4C3E) : SHA256 complet, portions d'origine, ingrédients et
quantités pour le modèle natif `recipes`. Les éventuels écarts de noms
entre la recette et les phases restent des **points à examiner**.

L'éditeur confirme séparément :
1. nombre de portions et rendement ;
2. ingrédients, quantités, unités et substitutions ;
3. allergènes et contaminations croisées ;
4. gestes, températures, cuissons et sécurité.

La décision requiert une note privée explicative (20 caractères min.),
une confirmation personnelle, une session administrateur valide et CSRF.
Le même panneau permet ensuite de **révoquer** ce visa avec un motif,
sans redemander les quatre contrôles culinaires.

## Historique et invalidation

Les décisions sont dans le journal privé
`culinary-visa-<id>.<séquence>.json`, distinct du journal des sept textes.
Chaque événement écrit sous le verrou commun `catalog.lock` contient
la version exacte du brouillon, le **SHA256 intégral de la recette
canonique** et le SHA256 du binding des six phases et sept narrations,
les portions, le nombre d'ingrédients, les confirmations, une note et
le hash de l'événement précédent. Les anciennes décisions ne sont
jamais écrasées.

Une nouvelle version du brouillon, même identique, un changement du
SHA256 de la recette source ou une révocation **invalident immédiatement**
le visa. Le statut échoue en sécurité si le catalogue, l'index public,
les scripts, le journal ou ses empreintes sont incohérents. Les modèles
historiques `restoredRecipes` ne sont pas éligibles à la comparaison
chiffrée et n'obtiennent aucun visa par défaut.

Une réponse IA ou un champ de formulaire ne peut créer un événement
d'approbation sans passer par l'action de serveur authentifiée.

## Frontière de sécurité

Le résultat documente une **attestation humaine**, pas une vérification
objective des allergènes ou de la cuisson. Il ne transforme pas les
indicateurs historiques d'approbation audio en vérités :
`authorizes_tts=false`, `audio_approved=false`,
`publication_ready=false`. Le MP3 Coral reste un chantier différent :
droits, validation du contenu, écoute, minutage des sept chapitres,
navigation mobile et autorisation explicite de production.

Ne jamais écraser les MP3 validés, ni déployer OVH, ni modifier n8n.

## Réception CI

`tests/php/editorial-coral-culinary-review-smoke.php` exerce la
référence réelle de recette `recipes` sur les index du build Astro,
quatre confirmations, authentification, cas d'échec, révocation,
réapprobation, changement de version, SHA256 altéré, recette historique,
forgerie de champs IA et corruption de journal. PHP 8.3 / 8.4,
tests Astro et navigateur requis avant fusion.
