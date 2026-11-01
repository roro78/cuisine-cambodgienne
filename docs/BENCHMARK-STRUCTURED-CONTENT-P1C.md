# Protocole distinct — rédaction structurée et contenu complet

29 octobre 2026. Préparation uniquement : aucune exécution réelle ni note attribuée.
Le [benchmark existant](BENCHMARK-OLLAMA-EDITORIAL-P1C.md) mesure quatre textes de
**brief**. Un modèle conforme à ce test n'est pas réputé capable de rédiger un
article complet, respecter une recette ou produire un atelier conforme Coral V2.

## Deux portées à qualifier séparément

- **S1 — socle C2** : même contrat `creation-form-core-v1`, mêmes champs du
  formulaire actuel, candidat privé sans publication. Les ateliers ont un plan
  de six phases seulement. Ce test peut réceptionner le raccordement C2.
- **S2 — contenu Astro complet** : ne démarrer qu'après extension versionnée des
  champs manquants recensés dans C1. Recettes entièrement cohérentes, ateliers
  complets avec recette validée et sept scripts à approuver, liens et médias
  requis. Aucun résultat S1 ne vaut PASS S2. Aucun appel TTS ou image à ce stade.

## Corpus et conditions reproductibles

1. Utiliser les cinq sujets synthétiques de
   `tests/fixtures/editorial-ollama-benchmark.json` pour conserver une comparaison
   avec les briefs, en préparant les informations vérifiées **avant** l'essai.
   Ajouter ensuite des sujets distincts sans collision, relus par le propriétaire.
2. Pour chaque famille, figer un brief, son empreinte, les faits autorisés,
   inconnues, intentions et sources internes datées. Pour l'atelier, choisir une
   vraie recette canonique et figer son empreinte et ses champs publics. Aucun
   secret, brouillon tiers, historique privé ou note interne non choisie transmis.
3. Inventorier les modèles réellement installés, versions/quantifications et
   environnement CPU/GPU/RAM/VRAM. Vérifier le réseau privé depuis n8n ; pas de
   port 11434 public, téléchargement, nouveau serveur ou changement des workflows
   01/02/03 pour rendre un candidat disponible artificiellement.
4. Comparer sur le même corpus les moteurs effectivement accessibles. Consigner
   modèle, paramètres, limite de sortie/temps, version du contrat et instructions
   spécialisées effectivement fournies. Prévoir un ordre alterné afin de séparer
   charge et échauffement ; mesurer le premier appel à froid séparément.
5. Une sortie par appel explicite, séquentiel et budgété. Pas de réparation JSON
   silencieuse, retry ou nouveau coût après résultat ambigu. Arrêter après un
   incident de budget ou transport ; conserver son statut technique comme échec.

## Registre local de chaque essai

Conserver hors `public/`, `dist/` et `src/`, sans écraser un rapport existant :
identifiant d'essai, portée S1/S2, empreintes brief/référence/contrat, modèle réel,
horodatage, durée de bout en bout, temps de chargement si fourni, nombre de tokens
entrée/sortie si disponible, sortie validée ou code d'échec expurgé, et revue humaine.
Les réponses brutes ne sont conservées que si nécessaires à la revue, dans un
dossier privé, sans secrets d'en-tête ni données de session. Ne rien publier.

Noter CPU/GPU/RAM observés avant/pendant/après depuis l'environnement du modèle,
en explicitant l'outil et la période. Une mesure Windows locale ne décrit pas le
serveur distant. Une température de génération ou une conformité JSON n'est pas
une mesure de qualité factuelle.

**Coût** : pour une API, utiliser consommation retournée et tarif vérifié au jour
de l'essai, avec devise/date et éventuels échecs facturables. Pour Ollama, distinguer
temps machine, ressource réellement allouée et coût d'hébergement/énergie documenté.
Sans ces données, noter `NON_MESURE` ; ne jamais conclure « coût nul ».

## Évaluation technique indépendante

Appliquer le validateur PHP du contrat exact, sans nettoyage préalable : JSON,
types, clés fermées, longueur, objets/tableaux, cohérence avec le formulaire et
référence correcte. Conserver les refus et les erreurs de conversion. Vérifier
que les états d'approbation, médias, code exécutable ou clés privées sont refusés.

Les tests automatisés de C2 utilisent des fournisseurs simulés : ils prouvent
des contrôles de transport/sauvegarde et de non-publication, pas ces mesures réelles.
Pour S2, ajouter les validateurs du véritable modèle Astro et des ateliers V2
avant d'affirmer la complétude du résultat.

## Revue éditoriale humaine, idéalement à l'aveugle

Noter chaque axe de 0 à 5 et conserver les corrections requises :

| Axe | Vérification |
|---|---|
| Français | Lisibilité, précision, naturel et vocabulaire des référentiels |
| Famille et intention | Carnet documentaire distinct d'une recette/atelier ; apport utile |
| Exactitude | Faits étayés, incertitudes signalées, aucune référence/citation inventée |
| Cuisine | Chaque ingrédient utilisé, quantités/unités/portions et sous-préparations cohérentes |
| Atelier | Fidélité à la recette canonique, phases/gestes/repères/corrections ; profondeur adaptée à la portée |
| Exploitabilité | Champs modifiables, structure utile, quantité réelle de travail humain restante |

Erreur critique : conseil alimentaire dangereux, fait sensible inventé, faux
témoignage/reportage, ingrédients/portions changés dans l'atelier sans décision,
promesse médicale, source/photographie/MP3 faussement validés. Une erreur critique
refuse le passage de la famille concernée, indépendamment du score moyen.
Les recherches restent en privé ; les crédits photographiques légaux restent dus.

## Décision et réception contrôlée

Rapporter par moteur **et famille** conformité technique, erreurs critiques,
notes humaines, effort de correction, latence à froid/chaud et coût documenté.
Une petite campagne sert au pilote, pas à une généralisation sans nouvelle revue.
Proposer les seuils après observation avec le responsable éditorial ; ne pas
fabriquer un classement à partir de modèles simplement disponibles ou gratuits.

Après qualification et autorisation, réaliser une recette privée C2 : générer
un seul candidat non sensible, corriger, sauvegarder explicitement, relire la
provenance et deux versions, vérifier refus des doublons/quota et absence de
publication. Désactiver le fournisseur jusqu'au visa de mise en service.

**État au 29 octobre :** accès runtime non pilotable ici, modèles/ressources,
latence, qualité et coûts non mesurés. Aucun fournisseur retenu, aucune exécution
n8n ou publication. La génération réelle du Studio reste désactivée.

## Pont CLI S1 reproductible — prêt pour évaluation, sans appel fournisseur

Le lot C3 ajoute `scripts/editorial-ai-structured-benchmark.php`, qui réutilise
**le contrat C2 et `cmsAiContentCandidate`** (aucun schéma JSON parallèle).
Les essais réels restent à effectuer sur l'infrastructure autorisée : le pont
ne lance ni Ollama ni n8n, ne réserve aucun quota, ne sauvegarde aucun brouillon.

Depuis un environnement PHP 8.3/8.4 disposant du build Astro et du dépôt :

```bash
npm run build
umask 077
mkdir -p artifacts/benchmark
# Préparer un seul cas S1 synthétique et son schéma exact.
php scripts/editorial-ai-structured-benchmark.php request culture dist > artifacts/benchmark/culture-s1-request.json
# Après un appel explicite au modèle, enregistrer uniquement son JSON de réponse
# dans un fichier local privé, puis valider le candidat sans le publier :
php scripts/editorial-ai-structured-benchmark.php validate culture artifacts/benchmark/culture-s1-result.json
```

Les modes `request` et `validate` acceptent chacune des cinq familles ; pour
l'atelier, la préparation impose une vraie recette du catalogue public `recipes`
avec projection guidée et empreinte canonique concordantes. Cette préparation
utilise uniquement le corpus synthétique existant, les index publics du build
et les règles par famille. Elle n'est **pas** une mesure d'exactitude des recettes
ni une autorisation d'utiliser le contenu en production.

La sortie de validation ne contient que `schema_valid`, la famille, la portée
S1 et des indicateurs non sensibles ; en échec, aucun texte brut du modèle
n'est affiché. Toute sortie doit être présentée à un relecteur pour l'évaluation
factuelle et culinaire, indépendamment des contrôles mécaniques.

La CI ajoute le smoke PHP `editorial-ai-structured-benchmark-smoke.php`
sur les cinq familles, les refus d'approbation forgée et d'entrée malformée,
ainsi que l'absence d'appels fournisseur. PHP 8.3/8.4 est requis.

**Limite au 29 octobre 2026 :** aucun benchmark de modèle réel n'a été exécuté
par cette livraison. Le transport Ollama/n8n demeure non accessible ; le socle
S1 ne démontre jamais la conformité Astro complète S2 ou Coral V2.

## C3B — Essai structuré local Ollama (préparé, non exécuté)

Un exécuteur manuel supplémentaire (scripts/benchmark-ollama-structured.mjs)
utilise le JSON synthétique produit par le pont PHP C2 et le transmet, uniquement
sur réseau interne, à un modèle Ollama déjà installé. Il vérifie le modèle par
/api/tags avant l'appel. Aucun appel sans --run, aucune installation ou
publication, aucun changement aux workflows n8n 01/02/03.

Procédure reproductible depuis un environnement ayant accès à Ollama :

```bash
npm run build
mkdir -p artifacts/benchmark && chmod 700 artifacts/benchmark
php scripts/editorial-ai-structured-benchmark.php request culture dist > artifacts/benchmark/culture-s1-request.json
node scripts/benchmark-ollama-structured.mjs --run --model llama3.2:latest --request artifacts/benchmark/culture-s1-request.json --out artifacts/benchmark/culture-s1-result.json
php scripts/editorial-ai-structured-benchmark.php validate culture artifacts/benchmark/culture-s1-result.json
```

Le résultat brut est écrit une seule fois en local dans le dossier privé
artifacts/benchmark/ (désormais exclu de Git), sans être affiché en clair.
La validation de schéma reste celle du CMS PHP et la revue éditoriale humaine
reste impérative. Aucune connexion n8n OVH, durée réelle, modèle disponible,
qualité, coût ou résultat mesuré ne peut être attesté depuis cette conversation.


## Audit post-pilote #187 — porte éditoriale S1 (1 novembre 2026)

**Portée et nomenclature.** Le pilote culture de #187 sur `96a34fbc33e32d7cd9efd508792a05117244ba01` a reçu un JSON complet en 65,118 s (65,950 s de bout en bout), validé par PHP. La qualité éditoriale a échoué. La porte décrite ici reste une **qualification éditoriale S1**, et non une nouvelle implémentation « S2 » : dans ce document, S2 désigne déjà le **contenu Astro complet**. Aucun résultat S1 ne constitue un visa S2.

### Composants existants à réutiliser, sans moteur parallèle

| Élément | Contrôle réellement couvert | Ce qu'il ne prouve pas |
|---|---|---|
| `cmsAiContentSchema` et `cmsAiContentCandidate` dans `public/gestion-contenus/lib.php` | Schéma fermé, champs et types, limites, transformation vers le formulaire, complétude de travail | Exactitude des faits, attribution des sources, couverture F1–F6, qualité du récit |
| `scripts/editorial-ai-structured-benchmark.php validate` | Passage du JSON brut par le validateur PHP existant, `schema_valid`, revue humaine et publication interdite | Qualité éditoriale ou aptitude à publier |
| `scripts/benchmark-ollama-structured.mjs` | Appel Ollama interne, délai fournisseur séparé, conservation des empreintes et métriques | Contrôle factuel ou lecture des sources par le modèle |
| `scripts/editorial-content-pipeline.mjs` | Contrat d'intake, étapes, approbation humaine et détection indicative de doublons | Détection des affirmations inventées |
| Référentiel éditorial et Carnets | Règles métier et exigences de vérification humaine | Vérification automatique du sens d'une phrase |

### Cas de régression observés dans le texte du pilote #187

- **F1–F4 :** couverts dans le texte reçu ; ne pas assimiler cette couverture partielle à un PASS.
- **F5 :** vendeurs de la rue 13 en fin d'après-midi omis.
- **F6 :** proximité du fleuve et partie ancienne omises.
- **Affirmations hors corpus :** « dans le cœur de Phnom Penh », les marchés qui « se côtoient », « habitudes de consommation » ; chacune nécessite une preuve distincte ou sa suppression.
- **Structure :** une comparaison de deux marchés est annoncée, mais une seule section développe Phsar Thmei.
- **Traçabilité :** `research_note` recopie des consignes sans restituer les références ; la provenance du corpus doit rester privée et vérifiable.
- **Style :** français globalement correct mais répétitions.

### Protocole minimal proposé, hors ligne et sans nouvel appel fournisseur

1. **Figer les preuves.** Lire la réponse privée #187 et la demande F1–F6 depuis le dossier de preuves existant, sans déplacer les données dans le dépôt. Ne jamais ajouter le texte brut ni les URL privées à un artefact public.
2. **Garder le validateur PHP comme porte technique.** `schema_valid:true` n'est pas un verdict éditorial. La sortie reste non publiable et soumise à revue humaine.
3. **Établir une grille de revue explicite :** pour chacun de F1–F6, noter `présent / absent / déformé`, avec extrait et emplacement ; pour chaque affirmation nouvelle, noter `source vérifiée / non étayée / à examiner`. Relever séparément sections manquantes, références absentes et répétitions.
4. **Automatiser uniquement ce qui est déterministe :** présence des sections attendues et champs de provenance, séparation des notes privées et publiques, absence de marqueurs de travail dans le rendu. Un contrôle lexical peut **signaler** une absence probable, jamais certifier l'exactitude ou l'exhaustivité des faits.
5. **Tests hors ligne :** un cas de référence entièrement couvert, puis les régressions #187 (F5/F6 absents, trois affirmations non étayées, comparaison unilatérale, note sans références). Toute assertion de détection sémantique automatique doit être justifiée par un test fiable ; sinon, conserver `REVIEW_REQUIRED`.
6. **Gates :** `TECHNICAL_PASS` et `EDITORIAL_PASS` sont indépendants. Sans revue documentaire humaine positive, verdict `EDITORIAL_FAIL` ou `REVIEW_REQUIRED`, jamais `publication_ready:true`. Pas d'activation Studio.

### Limites et prochaine décision

Le corpus F1–F6 provient de pages d'un même éditeur touristique : il permet un contrôle de fidélité **au corpus**, pas une corroboration indépendante. La comparaison ne peut être réputée documentée si les deux marchés ne sont pas effectivement traités. La performance #187 est presque entièrement assistée par le cache (1 074/1 075 jetons) : elle ne garantit pas une latence acceptable à froid.

**Étape suivante avant code de contrôle :** extraire une grille de revue expurgée des preuves privées #187, la faire réceptionner, puis ajouter uniquement des assertions déterministes au banc S1 existant. Ne pas créer de second validateur PHP, de service éditorial autonome, de pipeline concurrent ou de déclenchement Studio.
