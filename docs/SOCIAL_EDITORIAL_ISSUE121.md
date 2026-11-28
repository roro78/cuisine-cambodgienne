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

## Révision du 26 novembre 2026

Les douze JPEG `-v20261126.jpg` sont des recadrages plein cadre des originaux autorisés. La version précédente reste accessible à son URL habituelle pour les décisions déjà scellées. Le sélecteur 01 conserve le contrat du flux public et pointe les nouvelles propositions vers les nouvelles URL, avec leur SHA-256 et l’empreinte des originaux. Les JPEG des illustrations internes portent le type de source numérique IPTC `trainedAlgorithmicMedia`. Le formulaire et le journal privé conservent la provenance. Les légendes publiques conservent l’attribution CC BY-SA des photos tierces.

Chaque sujet dispose de deux angles relus. Les phrases de référence sont conservées avec chaque angle et contrôlées contre l’empreinte et les faits du catalogue. Ollama choisit un angle par réseau. Le formateur accepte uniquement ces deux identifiants et conserve les preuves de chaque texte dans le brouillon. Une réponse invalide ou un modèle indisponible entraîne le choix des angles de repli. Si le catalogue évolue, les angles relus deviennent inéligibles et le repli factuel existant s’applique.

Livraison uniquement après vérification des douze URL en HTTPS, de leurs empreintes, de la restauration isolée et des contrôles réels sur Orvekio. Le changement du 01 porte sur le sélecteur, le prompt et le formateur. Les définitions 02 et 03, le calendrier, le sceau et les décisions enregistrées restent hors du lot. Les tests locaux n’émettent aucune demande Resend ou Meta.

## Révision du 27 novembre 2026

La photo du marché de Kep de Mx. Granger (Wikimedia Commons, CC0 1.0) est déjà
servie par le site pour le Carnet. Le nouveau JPEG est un recadrage plein cadre
de cette photo en 1080 × 1080. Le sélecteur associe le même identifiant de source
au nouvel actif versionné, avec son empreinte et sa provenance complète.
L'ancien JPEG et le chemin d'entrée du flux restent disponibles pour l'historique.

À catégorie quotidienne égale, les médias CC0 et les créations internes passent
en premier parmi les sources inédites qualifiées. Le crédit reste dans la
proposition privée et sur le site. Pour les photos CC BY-SA 4.0 du tamarin et du
poivre de Kampot, le lien Facebook conduit directement à la légende de la photo
de l'article. Elle identifie la photo et son auteur, donne les liens de l'original
et de la licence, et documente le recadrage et sa licence. Instagram garde
l'attribution explicite. Les médias et canaux sans voie d'attribution vérifiée
conservent la mention directe.

Livrer par le canal ciblé OVH le JPEG, la page Crédits photos et les deux fiches
ingrédient. Vérifier en HTTPS le JPEG, l'empreinte et les deux blocs complets de
crédit avant de rendre la définition 01 effective. Le 01 garde son horaire et le
circuit de qualification et d'approbation existants.

Pour le brouillon n° 7, la commande locale `node scripts/prepare-social-kep-revision.cjs
01-candidat.json social-feed.json 01-revision-kep.json` prépare la relance
ponctuelle dans la définition du 01. Elle n'appelle aucun service. Tester
l'import et le retour à la définition quotidienne en isolation avant activation.
La relance vérifie à nouveau le JPEG, met à jour la ligne n° 7 par une condition
atomique, préserve son instantané initial et envoie le formulaire de la nouvelle
version si une seule ligne a été modifiée. Un brouillon déjà approuvé, une autre
ligne de la même source ou une deuxième relance ne peuvent pas déclencher l'envoi.
L'approbation de la nouvelle version requiert le nouveau formulaire et conserve
le sceau de publication. Après réception du courriel et constat de l'exécution
en attente, remettre la définition quotidienne sans le déclencheur ponctuel,
en conservant les données de l'exécution qui attend la décision.
