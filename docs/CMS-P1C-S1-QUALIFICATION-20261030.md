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
