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
