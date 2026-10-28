# P1C — Banc d'essai Ollama sur n8n et comparaison éditoriale

**28 octobre 2026 — protocole et code de test, NON une mesure de qualité déjà obtenue.**
Objectif : déterminer si notre service Ollama déjà référencé par le workflow social 01
peut produire de **bons briefs privés**, puis éventuellement des textes structurés,
sans multiplier les coûts API ni fragiliser le Studio.

## État vérifié (source GitHub)

- `automation/n8n/01-drafts-email-approval.json` possède déjà un nœud HTTP
  `Rédiger via Llama sur Ollama`, vers `http://ollama:11434/v1/chat/completions`,
  modèle `llama3.2:latest`. Ce code fait des **légendes sociales** fondées sur des
  faits du catalogue ; il ne prouve ni que le service fonctionne à présent ni qu'il
  sait écrire des fiches éditoriales longues.
- Les PR #146 (calendrier), #147 (brief IA privé) et #148 (adaptateur OpenAI
  facultatif) sont intégrées au dépôt. Aucune activation P1C sur OVH n'est attestée.
- Aucun accès administrateur au runtime n8n/Ollama, inventaire de modèles,
  CPU/GPU/RAM, réponse réelle ni coût énergétique n'est disponible dans cette
  livraison. **Aucune note de qualité n'est inventée.**
- L'architecture existante impose la même création versionnée dans le Studio,
  les cinq familles, l'anti-doublon, le contrôle humain et l'interdiction de
  publier automatiquement.

## Ce que ce lot ajoute (sans exécuter Ollama)

1. **Une matrice reproductible** : les trois candidats
   `llama3.2:latest`, `qwen3:8b`, `gemma3:12b` × les cinq familles.
   Les cinq briefs `tests/fixtures/editorial-ollama-benchmark.json` sont des
   cas **synthétiques de sécurité éditoriale**, pas des fiches à publier.
2. **Un exécuteur Node manuel et désactivé par défaut** :
   `scripts/benchmark-ollama-editorial.mjs`. Il vérifie les modèles présents
   via `GET /api/tags` et appelle l'API Ollama native `POST /api/chat`,
   uniquement sur `localhost`, `127.0.0.1` ou le nom Docker `ollama`,
   sur le port 11434. Jamais de téléchargement de modèle automatique, de cloud,
   de jeton ou d'écriture dans le CMS.
3. **Un export n8n totalement distinct** :
   `automation/n8n/04-ollama-editorial-benchmark-manual.json`.
   Inactif, déclenchement **manuel seulement**, un cas synthétique à la fois,
   sans webhook, programmation horaire, base, validation sociale ou publication.
   Il permet de vérifier **depuis n8n** la connectivité Ollama et la sortie JSON.
4. **Tests CI hors ligne** : schémas, matrice simulée 3×5, refus de modèles
   absents, host local obligatoire et isolation des nœuds n8n.

### Procédure de réception technique

Depuis n8n : **importer** le workflow 04 comme workflow séparé sans toucher aux
workflows 01, 02 ou 03. Vérifier qu'il reste inactif, puis utiliser *Execute
workflow* pour tester un seul cas. Dans le premier nœud Code, choisir la famille
et le modèle **effectivement installé**. Si `http://ollama:11434/api/chat`
n'est pas accessible depuis le conteneur n8n, **ne pas** exposer le port
11434 sur Internet : contrôler d'abord le réseau Docker privé et les noms de
service. Une exécution n8n peut être conservée dans son historique : les
prompts doivent rester exclusivement synthétiques durant ce test.

Depuis un environnement Node 22 ayant le dépôt et un accès **réseau local**
au service Ollama (sans ouvrir publiquement 11434) :

```bash
# Contrôle explicite des modèles installés, sans pull implicite :
ollama list

# La commande sans --run ne contacte aucun modèle :
node scripts/benchmark-ollama-editorial.mjs

# Uniquement après vérification du serveur et du budget machine :
node scripts/benchmark-ollama-editorial.mjs --run \
  --url http://127.0.0.1:11434 \
  --out artifacts/benchmark/ollama-20261028-essai1.json
```

Si l'outil s'exécute *dans un conteneur* relié au service Docker, remplacer
l'URL par `http://ollama:11434`. Les modèles **non installés** sont notés
`NOT_INSTALLED` ; le script ne les télécharge pas. Une exécution peut être
lente, notamment sans GPU. Prévoir de vérifier RAM/VRAM, stockage, disponibilité
et charge avant de télécharger un gros modèle. Les fichiers de résultats sont
locaux, créés en mode privé sans écraser un résultat existant ; ne pas les
copier dans `public/` ou les pousser dans GitHub.

### Lecture des résultats — qualité versus conformité

Les contrôles automatiques relèvent **seulement** :
- présence ou absence d'un modèle ;
- requête achevée ou en erreur, durée mesurée ;
- JSON syntaxiquement valide, quatre champs obligatoires de type texte,
  absence de champs supplémentaires et respect de la longueur maximale ;
- compteurs techniques renvoyés par Ollama si disponibles.

Ils ne prouvent **jamais** qu'un texte est juste, original, référencé,
culturellement approprié, conforme à une recette ni publiable.

**Grille de notation humaine (0 à 5 par axe, idéalement à l'aveugle et
sur les mêmes données pour tous les modèles) :**

| Axe | Vérification |
|---|---|
| Français et lisibilité | précision, naturel, absence de tournures artificielles |
| Respect de la famille | recette ≠ Carnet ≠ atelier ≠ ingrédient ≠ technique |
| Exactitude et prudence | faits non fournis signalés, aucune source inventée |
| Utilité de l'angle | apporte une intention éditoriale distincte, pas du remplissage |
| Actionnabilité du brief | points à contrôler et structure exploitables dans le Studio |

Pour **chaque** cas, noter aussi si l'erreur est *critique* (invention de quantités,
témoignage inventé, référence canonique inventée, risque alimentaire, promesse
médicale, faux MP3, confusion de contenu). Une erreur critique suffit à refuser
l'automatisation de la famille concernée, même avec un bon score moyen.

**Critère pilote proposé, à confirmer après observation** : cinq sorties sur cinq
au schéma correct, aucune erreur critique et moyenne humaine >= 4/5 dans
chaque famille ; une autre campagne et un échantillon plus large restent
nécessaires avant généralisation. Aucune sortie n'est sauvegardée en tant
que contenu du site par ce banc d'essai.

| Modèle | Structure 5/5 | Évaluation humaine | Verdict |
|---|---|---|---|
| llama3.2:latest | **Non mesurée** | **Non mesurée** | À tester |
| qwen3:8b | **Non mesurée** | **Non mesurée** | À tester si compatible machine |
| gemma3:12b | **Non mesurée** | **Non mesurée** | À tester si compatible machine |

## Décision d'architecture après mesure

- **Si Ollama est suffisamment qualitatif** : développer un adaptateur serveur
  distinct pour la chaîne P1C, via une **entrée n8n authentifiée et restreinte**,
  une liste blanche de modèles et le même contrat de quatre champs. **Pas**
  d'appel OVH vers le service Docker non authentifié sur 11434.
- **Si les performances sont insuffisantes** : garder Ollama pour les tâches
  simples et utiliser, avec plafond de dépenses et relecture, l'adaptateur API
  existant comme solution de repli ; conserver la provenance du modèle par
  brouillon et les mêmes contrôles de doublons.
- **La génération des champs métier complets** des cinq familles sera un jalon
  ultérieur à part : leurs vrais schémas Astro, la recette canonique des ateliers,
  les vérifications factuelles et la relecture sont indispensables avant toute
  capacité de publication. Ce banc d'essai teste des **briefs**, pas la qualité
  finale des fiches ni la génération d'images. L'audio Coral approuvé est intouchable.
- Aucun n8n 01/02/03, Supabase, Meta, Resend, Astro, OVH ou historique privé
  n'est modifié par les tests. Aucun workflow nouveau ne doit être activé par
  une simple fusion GitHub.

### Références internes permanentes
- `docs/REFERENTIEL-GENERATION-IA-EDITORIALE-VISUELLE.md`
- `docs/CMS-STUDIO-ARCHITECTURE.md`
- `docs/EDITORIAL-AI-MEDIA-PIPELINE.md`
- `docs/CMS-AI-BRIEFS-P1C.md`
