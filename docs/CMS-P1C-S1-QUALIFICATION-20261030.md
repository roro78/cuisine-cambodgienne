# P1C — Traçabilité des essais structurés Ollama S1 (30 octobre 2026)

## Pourquoi ce lot

Le plan directeur `EDITORIAL-AI-MEDIA-PIPELINE.md` impose de qualifier un
fournisseur **avant** de le raccorder au Studio. Les scripts S1 existaient déjà,
mais `benchmark-ollama-structured.mjs` n'enregistrait que le JSON brut du modèle :
le modèle réellement utilisé, la latence, la provenance du contrat et les jetons
observés n'étaient pas conservés pour l'audit. Les tests simulés et la seule
conformité au schéma ne permettent pas de sélectionner un fournisseur.

## Évolution livrée dans cette PR

Un essai S1 manuel, explicitement déclenché par `--run`, conserve maintenant
**deux fichiers distincts privés**, dans `artifacts/benchmark/` (hors Git) :

- `<nom>.json` : réponse JSON brute, sans nettoyage, passée telle quelle au
  validateur PHP existant.
- `<nom>.evidence.json` : modèle, famille, horodatage, durée murale, octets,
  empreintes SHA-256 de la demande et réponse, métriques retournées par Ollama
  quand présentes (`eval_count`, `prompt_eval_count` et durées).

La preuve indique **`schema_validation: NOT_RUN`** et
**`editorial_review: NOT_RUN`** : la génération ne vaut pas validation.
Aucune écriture si un des fichiers de sortie existe déjà ; aucun écrasement
d'un rapport existant. Les deux fichiers sont locaux au processus d'essai.

## Essai autorisé, sans toucher au site

L'opérateur lance depuis l'environnement réseau interne ayant réellement
accès à Ollama, sur un modèle préalablement listé par `/api/tags` :

```bash
npm run build
umask 077
mkdir -p artifacts/benchmark && chmod 700 artifacts/benchmark
php scripts/editorial-ai-structured-benchmark.php request culture dist > artifacts/benchmark/culture-s1-request.json
node scripts/benchmark-ollama-structured.mjs --run --model llama3.2:latest --url http://ollama:11434 --request artifacts/benchmark/culture-s1-request.json --out artifacts/benchmark/culture-s1-result.json
php scripts/editorial-ai-structured-benchmark.php validate culture artifacts/benchmark/culture-s1-result.json
```

`llama3.2:latest` est **un candidat**, pas un fournisseur qualifié.
Si absent, l'essai échoue sans télécharger de modèle. Ne pas exposer le
port Ollama sur Internet ni modifier les workflows sociaux 01/02/03.

## Pour activer réellement l'IA dans le Studio

1. Vérifier dans l'environnement OVH/n8n la liste et la santé des modèles,
   le réseau privé et le coût opérationnel ; ne jamais copier de secret ici.
2. Mesurer sur les cinq familles, faire valider la sortie S1 par le même PHP
   que le CMS, puis une relecture factuelle, culinaire et documentaire humaine.
3. Qualifier un service authentifié compatible avec
   `cmsAiContentGatewayAdapter` (HTTPS, origine et schéma exacts). L'adaptateur
   facultatif fourni n'établit **aucun** webhook par lui-même.
4. Réceptionner la chaîne privée une fois, puis configurer côté serveur seulement
   `editorial_ai_content.enabled` et son adapter depuis la configuration privée.
   Conserver quota, garde-fous de version, anti-doublons, CSRF, et validation.
5. Tester dans le Studio réel avant mise en service, conserver le mode manuel
   en repli et une possibilité de désactivation immédiate.

**État attesté par cette PR : préparation de la preuve d'essai S1 uniquement.**
Pas de modèle réel évalué depuis GitHub, pas de connexion n8n/OVH,
pas d'activation, pas de génération MP3/image, pas de publication de page
ni de déclinaison Meta. Aucun résultat S1 ne constitue un PASS Astro S2.


## Reprise du 31 octobre — preuves et limites

La PR #180 est ouverte en brouillon sur `main` `fb4beda`, sans review ni thread
bloquant soumis au moment de la vérification. La tête initiale `3c62ee7` a les
jobs Astro/Node, PHP 8.3 et PHP 8.4 en SUCCESS
([CI](https://github.com/roro78/cuisine-cambodgienne/actions/runs/41141845821)) ;
Supabase Preview est SKIPPED, ce qui n'est pas un test de génération.
Ces résultats ne valent pas CI du complément ultérieur ni qualification réelle.

Le contrôle du dossier privé se faisait après l'appel modèle. Il se fait
maintenant **avant lecture de la demande et avant tout appel réseau**. La demande
doit aussi être un fichier privé ordinaire, sans lien symbolique. Le dossier doit
préexister avec permissions 0700 (procédure ci-dessus, `umask 077`). Le script ne
corrige pas silencieusement les permissions d'un dossier existant.

Les tests isolés utilisent de vrais fichiers temporaires et un transport simulé :
dossier trop ouvert, lien symbolique du dossier ou de la demande, demande trop
ouverte, collision de chemins, réponse/preuve préexistante, permissions 0600,
empreintes exactes et compétition d'écriture. Un refus de précontrôle effectue
**zéro appel fournisseur**. Une preuve créée concurremment est conservée et la
réponse créée par cet essai incomplet est retirée. Le même exécuteur S1 et le même
validateur PHP restent utilisés ; aucun moteur éditorial ajouté.

### Mesures réelles : non exécutées

| Famille | Ollama réel | Validation PHP de sortie réelle | Revue humaine |
|---|---|---|---|
| recette | NON_EXÉCUTÉ | NON_EXÉCUTÉ | NON_EXÉCUTÉ |
| atelier | NON_EXÉCUTÉ | NON_EXÉCUTÉ | NON_EXÉCUTÉ |
| culture | NON_EXÉCUTÉ | NON_EXÉCUTÉ | NON_EXÉCUTÉ |
| ingredient | NON_EXÉCUTÉ | NON_EXÉCUTÉ | NON_EXÉCUTÉ |
| technique | NON_EXÉCUTÉ | NON_EXÉCUTÉ | NON_EXÉCUTÉ |

La connexion sécurisée n8n a réussi jusqu'à la liste des workflows ; l'ouverture
de l'éditeur a ensuite affiché une erreur d'initialisation 401. Après un
rechargement, le navigateur est revenu à la connexion : session non durable.
Une route de nouveau workflow a été ouverte, sans enregistrement attesté,
sans nœud ajouté ni exécuté. Aucun accès SSH/API Orvekio configuré ici.
Aucun modèle ni ressource distante inspecté, aucune requête de génération
envoyée au serveur. Cela ne démontre pas une panne Ollama. Ne jamais transmettre un mot de
passe ou un jeton dans une PR, un commentaire ou les rapports.

**Réception restant nécessaire :** cinq essais réels séquentiels, sans retry
silencieux, sur modèles effectivement installés, avec validation PHP brute,
latences et revue éditoriale ; service HTTPS authentifié compatible avec
`cmsAiContentGatewayAdapter` ; puis recette mobile du Studio et repli manuel.
Aucun déploiement de production sans validation. La PR reste en brouillon tant
que la recette réelle attendue dans sa description n'est pas satisfaite.


**Contrôles locaux du complément :** 13 tests Node ciblés PASS ; `npm run check`
termine avec zéro erreur et 23 indications non bloquantes ; `npm run build`
termine avec succès (48 pages). Le pont PHP S1 existant a ensuite été exécuté
avec un runtime PHP 8.3.6 local isolé (extensions mbstring, iconv et ctype) :
`CMS_S1_BENCHMARK_BRIDGE_PASS`, cinq familles, zéro appel fournisseur, zéro
sauvegarde privée et `astro_s2_validated: false`. Il utilise des fixtures,
pas des sorties réelles d'Ollama. Les jobs PHP 8.3/8.4 de la nouvelle CI restent
des preuves distinctes. Aucun de ces contrôles ne constitue un essai distant.
