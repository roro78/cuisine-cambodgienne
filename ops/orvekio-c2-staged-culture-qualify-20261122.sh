#!/usr/bin/env bash
# Single isolated qualification of the PR #245 C2 staged CULTURE provider.
# Does not stop/recreate the running worker, invoke gateway jobs, touch n8n,
# change Studio/flags, use paid APIs, run Coral/TTS, or publish anything.
set -Eeuo pipefail
umask 077

repo=/tmp/coral-check-6bda46f
base=ba41ea3618822fcc950608a6f0b2348e2534f83c
sha=16f3717429058983f32fcb805839ff23ee10eadb
worker=cdc-coral-coral-job-worker-1
network=cdc-coral-provider
root="$HOME/.local/state/cdc-c2-qualifications"
run="$root/culture-kep-pr245-$sha"

stop(){ echo "ARRET_$1" >&2; exit 1; }

[[ "$(id -un)" == debian ]] || stop UTILISATEUR_INATTENDU
[[ -d "$repo" ]] && git -C "$repo" cat-file -e "$sha^{commit}" ||
  stop COMMIT_NON_RECUPERE
git -C "$repo" merge-base --is-ancestor "$base" "$sha" ||
  stop BASE_WORKER_INCOMPATIBLE
expected=$(printf '%s\n' \
  public/gestion-contenus/index.php \
  scripts/editorial-ai-job-gateway.mjs \
  tests/editorial-ai-job-gateway.test.mjs)
[[ "$(git -C "$repo" diff --name-only "$base" "$sha")" == "$expected" ]] ||
  stop PERIMETRE_GIT_INATTENDU
git -C "$repo" diff --check "$base" "$sha" ||
  stop DIFFERENTIEL_NON_VALIDE

[[ "$(docker inspect -f '{{.State.Status}} {{.State.Health.Status}}' "$worker")" == 'running healthy' ]] ||
  stop WORKER_NON_SAIN
[[ "$(docker inspect -f '{{index .Config.Labels "org.opencontainers.image.revision"}}' "$worker")" == "$base" ]] ||
  stop WORKER_REVISION_INATTENDUE
docker network inspect "$network" >/dev/null || stop RESEAU_PRIVE_ABSENT

# The prior one-shot run may have deleted its temporary request.
# Reconstruct ONLY the versioned, public Kep fixture through the same
# existing PHP C2 request builder. Do not read any previous job or private draft.
# No other unfinished C2 job: no overlapping Ollama load due to this worker.
docker exec "$worker" node --input-type=module -e '
import {readdir} from "node:fs/promises";
import {join} from "node:path";
for (const entry of await readdir("/var/lib/cdc/jobs",{withFileTypes:true})){
  if (!entry.isDirectory()||!/^[a-f0-9]{48}$/.test(entry.name))
    throw Error("FILE_NON_LIBRE");
  const files=await readdir(join("/var/lib/cdc/jobs",entry.name));
  if (!files.includes("terminal.json")||
      files.some(x=>/^\..*operation\.lock$/.test(x)))
    throw Error("FILE_NON_LIBRE");
}
' >/dev/null || stop FILE_NON_LIBRE

# Verify a PHP CLI (host or pre-existing image) before claiming an attempt.
if command -v php >/dev/null 2>&1; then
  phpbuild(){ (cd "$build" && php "$@"); }
  phpvalidate(){ (cd "$run" && php "$@"); }
else
  phpimage=$(docker image ls --format '{{.Repository}}:{{.Tag}}' |
    awk '/(^|\/)php:8\.[3-9]([.-][a-zA-Z0-9.]+)*-cli(-[a-zA-Z0-9.]+)*$/ && !found++ {print}')
  [[ -n "$phpimage" ]] || stop PHP_CLI_NON_DISPONIBLE
  phpdir(){ local folder="$1"; shift
    docker run --rm --pull=never --network none --read-only \
      --user "$(id -u):$(id -g)" --cap-drop ALL --security-opt no-new-privileges \
      --mount "type=bind,src=$folder,dst=/bench,readonly" -w /bench \
      --entrypoint php "$phpimage" "$@"
  }
  phpbuild(){ phpdir "$build" "$@"; }
  phpvalidate(){ phpdir "$run" "$@"; }
fi

[[ ! -e "$run" && ! -L "$run" ]] || stop ESSAI_DEJA_CONSIGNE
mkdir -p -m 700 "$root"
[[ "$(stat -c %a "$root")" == 700 ]] || stop ETAT_QUALIFICATION_PERMISSIONS

build=$(mktemp -d "$HOME/cdc-c2-staged-build.XXXXXXXX")
git -C "$repo" archive "$sha" scripts deploy/coral/Dockerfile \
  public/gestion-contenus/lib.php \
  tests/fixtures/editorial-culture-documented-kep.json |
  tar -xf - -C "$build"
echo "CONSTRUCTION_CANDIDAT_ISOLE"
if ! docker build --pull=false --build-arg "SOURCE_REVISION=$sha" \
    -f "$build/deploy/coral/Dockerfile" --iidfile "$build/image-id" \
    "$build" >"$build/build.log" 2>&1; then
  tail -n 15 "$build/build.log" >&2
  stop CONSTRUCTION_IMAGE_ECHOUEE
fi
image=$(cat "$build/image-id")
[[ "$(docker image inspect -f '{{index .Config.Labels "org.opencontainers.image.revision"}}' "$image")" == "$sha" ]] ||
  stop IMAGE_REVISION_NON_CONFORME
[[ "$(docker inspect -f '{{index .Config.Labels "org.opencontainers.image.revision"}}' "$worker")" == "$base" ]] ||
  stop IMAGE_ACTIVE_MODIFIEE

# Generate the same documented Kep case from the immutable Git fixture,
# using the installed CMS request schema. No network and no private historical
# request involved. This is done BEFORE claiming the one-use run directory.
if ! phpbuild -r '
require_once "public/gestion-contenus/lib.php";
$f=json_decode((string)file_get_contents(
  "tests/fixtures/editorial-culture-documented-kep.json"),
  true,16,JSON_THROW_ON_ERROR);
$sources=$f["sources"]??[];
$facts=$f["verified_facts"]??[];
$checks=$f["checks"]??[];
if(($f["kind"]??null)!=="culture"||count($sources)!==2
  ||count($facts)!==4||count($checks)!==5
  ||$sources[0]!=="https://www.mpsez.gov.kh/coastal-industries/coastal-tourisim/tourisim-at-kep-province"
  ||$sources[1]!=="https://www.wipo.int/fr/web/lisbon-system/w/news/2021/news_0001")
  throw new RuntimeException("DOCUMENTED_FIXTURE_INVALID");
$context="Sources : ".implode(" ; ",$sources)."\n"
  ."Faits autorisés : ".implode(" ; ",$facts)."\n"
  ."Points à vérifier : ".implode(" ; ",$checks);
$request=cmsAiContentRequest([
  "kind"=>"culture","title"=>$f["title"],"angle"=>$f["angle"],
  "objective"=>$f["objective"],"context"=>$context,
  "reference_id"=>"","semantic_review"=>"1"
],[],[],[]);
$request["timeout_seconds"]=20;
$request["max_output_tokens"]=6000;
$request["response_max_bytes"]=30000;
echo json_encode($request,JSON_UNESCAPED_UNICODE|
  JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR)."\n";
' > "$build/request.json"; then
  stop REQUETE_DOCUMENTEE_NON_RECONSTRUITE
fi
[[ -s "$build/request.json" && $(stat -c %s "$build/request.json") -lt 30000 ]] ||
  stop REQUETE_DOCUMENTEE_INVALIDE
chmod 600 "$build/request.json"
echo "REQUETE_KEP_RECONSTRUITE_SANS_HISTORIQUE"

# Exactly one isolated attempt, no Gateway token, private volumes, sockets or
# ports. This directory records the attempt BEFORE calling the model.
mkdir -m 700 "$run" || stop ESSAI_DEJA_CONSIGNE
cp -- "$build/request.json" "$run/request.json"
chmod 600 "$run/request.json"
git -C "$repo" archive "$sha" scripts/editorial-ai-structured-benchmark.php \
  public/gestion-contenus/lib.php |
  tar -xf - -C "$run"
printf '%s\n' "$sha" > "$run/revision.txt"
printf '%s\n' "ESSAI_CONSOMME_SANS_REESSAI" > "$run/attempt.txt"

echo "QUALIFICATION_UNIQUE_CULTURE"
echo "PAS_DE_REDEMARRAGE_PAS_DE_MP3_PAS_DE_PUBLICATION"

set +e
timeout --signal=TERM --kill-after=10s 345s \
docker run --rm --pull=never --network "$network" --read-only -i \
  --user 1000:1000 --cap-drop ALL --security-opt no-new-privileges \
  --pids-limit 64 --memory 384m --cpus 0.5 \
  --entrypoint node "$image" --input-type=module -e '
import {ollamaJobProvider,validateJobRequest,cultureEvidenceFromBrief} from "/app/scripts/editorial-ai-job-gateway.mjs";
let raw="";
process.stdin.setEncoding("utf8");
for await(const chunk of process.stdin)raw+=chunk;
let calls=0;
try {
  const request=validateJobRequest(JSON.parse(raw));
  if(request.brief?.kind!=="culture")throw Error("CULTURE_REQUIRED");
  const evidence=cultureEvidenceFromBrief(request.brief);
  if(!evidence||evidence.facts.length!==4||evidence.sources.length!==2)
    throw Error("DOSSIER_DOCUMENTAIRE_INATTENDU");
  if(!evidence.sources.some(x=>x.startsWith("https://www.wipo.int/"))||
     !evidence.sources.some(x=>x.startsWith("https://www.mpsez.gov.kh/")))
    throw Error("REFERENCES_DOCUMENTAIRES_INATTENDUES");
  const provider=ollamaJobProvider({fetcher:async(url,options)=>{
    calls++;
    if(calls>3)throw Error("TROP_D_APPELS");
    console.error("ETAPE_OLLAMA="+calls+"/3");
    return fetch(url,options);
  }});
  const result=await provider(request);
  if(calls!==3)throw Error("ETAPES_INCOMPLETES");
  if(Buffer.byteLength(result,"utf8")>30000)throw Error("CANDIDAT_TROP_LONG");
  JSON.parse(result);
  process.stdout.write(result);
} catch(e){
  const code=String(e?.message||"ERREUR_INCONNUE");
  const safe=/^(CULTURE_[A-Z_]+|JOB_PROVIDER_HTTP_[0-9]{3}|JOB_RESPONSE(?:_SIZE)?|PROVIDER_TIMEOUT|TROP_D_APPELS|ETAPES_INCOMPLETES|DOSSIER_DOCUMENTAIRE_INATTENDU|REFERENCES_DOCUMENTAIRES_INATTENDUES|CANDIDAT_TROP_LONG)$/.test(code)
    ?code:e?.name==="TimeoutError"?"PROVIDER_TIMEOUT":"ERREUR_MODELE_NON_DETAILLEE";
  console.error("ARRET_MODELE="+safe);
  process.exitCode=1;
}
' < "$run/request.json" > "$run/candidat.json"
rc=$?
set -e

if ((rc!=0)); then
  echo "NO_GO_GENERATION_OU_DELAI_RC=$rc"
  echo "REESSAI_INTERDIT"
  echo "DOSSIER_PRIVE=$run"
  exit "$rc"
fi
if ! phpvalidate scripts/editorial-ai-structured-benchmark.php validate culture candidat.json; then
  echo "NO_GO_SCHEMA"
  echo "REESSAI_INTERDIT"
  echo "DOSSIER_PRIVE=$run"
  exit 1
fi
sha256sum "$run/candidat.json"
echo "CANDIDAT_PRIVE=$run/candidat.json"
echo "SCHEMA_S1_OK_REVUE_HUMAINE_REQUISE"
echo "WORKER_PRODUCTION_INCHANGE"
echo "AUCUN_MP3_AUCUNE_PUBLICATION"
