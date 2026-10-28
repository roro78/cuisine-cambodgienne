# P1C-C1 — Contrat de brouillon structuré des cinq familles

**Mise à jour du 29 octobre :** #150 fusionnée au SHA `c0ab780`, CI de tête et
après fusion SUCCESS. Le [raccordement C2](CMS-STRUCTURED-GENERATION-P1C-C2.md)
est développé séparément dans #151. Les sections ci-dessous décrivent la livraison
C1 et ses limites ; elles ne prétendent pas à une génération réelle activée.

28 octobre 2026. **Préparation hors ligne dans une branche dédiée.** Ce lot ne
raccorde aucun moteur, n'ajoute aucune action à l'interface et ne sauvegarde pas
de sortie IA. Il prépare la réponse structurée du prochain raccordement dans le
Studio commun, au lieu de demander un article libre ou du code Astro au modèle.

## État constaté à la reprise

`main` local synchronisé par avance rapide sur
`46fef8caa03cc1beb6cc92f12996de90908e36f9`. PR #146, #147, #148 et #149 fusionnées,
aucune PR ouverte avant ce lot. [CI main #40777733812](https://github.com/roro78/cuisine-cambodgienne/actions/runs/40777733812)
terminée SUCCESS. Branches précédentes et `artifacts/` conservés.

| Capacité | Preuve disponible | Limite |
|---|---|---|
| Studio, création manuelle et versions | Code et smokes PHP des cinq familles sur catalogue réel | Une nouvelle réception connectée des cinq familles n'a pas été effectuée ici |
| Calendrier OVH | Réception déjà confirmée par le propriétaire : ouverture, filtres, versions | Incident clos ; ne pas refaire les correctifs |
| Protection OVH | GET actuel `CMS_OVH_RECEPTION_PASS`, trois index cohérents, login protégé, bibliothèque bloquée | Ne lit ni session ni configuration privée ; ne prouve pas le transfert des PR IA |
| Brief IA privé | #147 intégrée, quota et provenance serveur | Activation/déploiement OVH non attestés |
| Transport OpenAI optionnel | #148 intégrée, tests simulés | Aucun compte, modèle, coût ni appel réel vérifié |
| Benchmark Ollama/n8n | #149 intégrée, workflow 04 manuel isolé | Aucune mesure rédactionnelle réelle |

Le propriétaire dispose d'une **session n8n déjà connectée**. Les outils exposés
dans cette intervention ne permettent pas de piloter cette session. Aucune
variable d'accès n8n/Ollama/OpenAI n'est configurée dans l'environnement du
processus ; `GET http://127.0.0.1:11434/api/tags` est inaccessible, y compris hors
sandbox. Cela ne diagnostique **pas** le serveur Ollama distant. Aucun inventaire
de ses modèles, CPU/GPU/RAM ni réseau Docker n'est attesté. Les ressources du
processus Windows local ne décrivent pas cette infrastructure.

**Décision moteur : indéterminée.** Aucun modèle n'est recommandé sur sa seule
présence dans un export. Reprendre le [banc d'essai existant](BENCHMARK-OLLAMA-EDITORIAL-P1C.md)
depuis la session n8n ou le serveur privé, sans toucher aux workflows 01/02/03,
sans exposer 11434 et sans téléchargement de modèle implicite. Les quatre textes
de brief du benchmark ne suffisent pas à qualifier la rédaction longue.

## Code préparé, composants réutilisés

Les fonctions restent dans `public/gestion-contenus/lib.php` :

- `cmsAiContentSchema` dérive les clés et types de **`cmsCreationSchema`**, source
  unique du formulaire manuel. Objets fermés et clés obligatoires à chaque niveau,
  listes/tableaux bornés, portions entières entre 1 et 100 ; six lignes de phases
  pour le plan d'atelier. Aucun champ audio, média, source privée ou approbation.
- `cmsAiContentRequest` réutilise `cmsAiBriefInput` et son attestation humaine de
  revue de l'idée. Il projette uniquement le contexte explicitement saisi et la
  référence publique sélectionnée. Pour un atelier, un extrait social seul est
  refusé : recette structurée `recipes`, projection publique validée et empreinte
  canonique concordante obligatoires. Le format historique `restoredRecipes`
  reste exclu de cette référence d'atelier, faute de quantités structurées.
- Les consignes par famille appliquent les référentiels existants : récit culturel
  documentaire pour Carnets, six phases pour ateliers, cohérence ingrédients/gestes,
  prudence factuelle et alimentaire, recherches réservées aux notes privées.
  Les chemins `references` assurent la traçabilité ; ils ne donnent pas au modèle
  un accès aux documents. Le futur raccordement devra transmettre les prescriptions
  spécialisées utiles et vérifier leur respect. Ces consignes de contrat ne
  remplacent pas les référentiels complets ni une revue rédactionnelle.
- `cmsAiContentCandidate` contrôle le JSON (60 000 octets au maximum), ses types,
  clés, tailles et caractères ; il transforme listes et paragraphes vers les
  valeurs du formulaire commun puis repasse par **`cmsCreationCleanFields`** et
  **`cmsCreationReady`**. Les formes objet et tableau ne sont pas interchangeables.
  Les erreurs de réponse remontent uniquement `AI_CONTENT_RESPONSE`.
- Le candidat comprend `form_fields`, `fields`, les quatre textes éditoriaux,
  `requires_human_review: true` et `publication_ready: false`. Il ne possède aucun
  ID, version, état de publication ou provenance persistée. L'aperçu humain reste
  `cmsGuidedPreviewHtml`, les champs restent `cmsCreationFormHtml` et sont échappés.

**Ce contrat n'est pas appelé par `index.php`.** Aucun réseau, quota consommé,
fichier privé, brouillon, Astro, média, MP3 ou publication n'est modifié par ces
fonctions. Il n'y a ni réponse fictive servie en production ni nouveau formulaire.
L'adaptateur OpenAI des briefs ne prend pas ce contrat en charge : ses quatre
champs, son budget de sortie et sa limite de réponse restent inchangés.

## Écarts avec les véritables modèles Astro et le cahier des charges

Le périmètre porte le nom explicite `creation-form-core-v1`. Il ne faut jamais
l'afficher comme un « article complet prêt à publier ».

| Famille | Socle couvert par le formulaire commun | Compléments avant conversion Astro |
|---|---|---|
| Recette | Introduction, contexte, SEO descriptif, portions, temps, ingrédients quantité/unité/nom, étapes titre/texte, matériel | Typage numérique des quantités, groupes/notes/scalabilité, conseils/variantes/FAQ, taxonomie, liens, sécurité revue et médias vérifiés |
| Carnet | Rubrique, introduction, SEO, temps de lecture, sections et paragraphes | Contrôle documentaire interne, liens pertinents, médias/droits/crédits ; pas de bibliographie de travail publique |
| Atelier | Introduction, objectif, résultat, portions libellées, préparation, matériel, **plan** de six phases titre/apprentissage | Recette approuvée humainement, ingrédients/quantités dérivés, gestes, durées, repères, corrections, sécurité, sept scripts approuvés et audio réceptionné séparément |
| Ingrédient | Rôle, profil, usages, choix, conservation, accords, conseils, erreurs et SEO | Substitutions explicites selon sujet, liens, vérification des affirmations, identité exacte et médias |
| Technique | Présentation, préparation, rendement, fournitures, gestes, alternatives et questions | Repères/sécurité suffisamment précis dans les textes, liens recettes/atelier, visuels exacts |

`cmsCreationReady` mesure la complétude du formulaire de travail. Il ne certifie
ni authenticité, ni cohérence culinaire, ni conformité complète au type Astro.
Le nombre de six lignes ne prouve pas une pédagogie V2 correcte. Aucun contrôle
lexical ne peut remplacer la vérification réelle de l'utilisation de chaque
ingrédient. Les données publiques fournies à un modèle ne sont pas une nouvelle
approbation humaine de la recette ni une preuve de test culinaire.

## Validation et prochaine intégration

Le smoke PHP `editorial-ai-content-contract-smoke.php` utilise le catalogue,
l'index canonique et le manifeste guidé réellement générés. Il couvre les cinq
familles, schémas/champs communs, conversions de listes/paragraphes, aperçu échappé,
rejet des clés sensibles, types trompeurs, tailles excessives, phases manquantes,
sources périmées/incomplètes et absence d'export d'objet source entier. Il ne fait
aucun appel modèle et ne sauvegarde aucun candidat. Il est ajouté aux deux jobs
CI PHP 8.3 et 8.4. PHP n'est pas installé localement.

**Résultats locaux acquis :** 37 contrats Node PASS ; `npm run check` : 0 erreur,
0 warning, 24 hints ; `npm run build` : 48 pages ; `git diff --check` PASS.
Les preuves PHP et la CI complète sont à lire sur la
[PR #150](https://github.com/roro78/cuisine-cambodgienne/pull/150), pour son SHA
exact, sans assimiler ces contrôles hors ligne à une génération réelle.

Avant d'ajouter le déclenchement au Studio : mesurer le moteur réel, adapter son
transport à ce contrat et à un budget autorisé, contrôler les doublons **avant**
appel, réserver le quota persistant partagé avec les briefs, imposer timeout et
taille au transport sans retry, puis recontrôler les doublons sous le verrou
commun. Ajouter une provenance serveur propre aux contenus structurés et la
conserver dans les révisions de `cmsCreationSave`, sans migration des brouillons
existants. Les notes privées ne doivent pas rejoindre l'aperçu Astro public.
La génération complète devra ensuite combler les écarts ci-dessus, garder les
référentiels spécialisés et passer les gates éditoriaux/médias avant publication.

**OVH : aucun fichier de ce lot transféré, aucune configuration privée changée.**
