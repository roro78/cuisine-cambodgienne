#!/usr/bin/env bash
# One authorized, private, real Ollama inference for the documented Kep C2 case.
# No TTS, no Studio flag changes, no publishing, and no automatic retries.
set -Eeuo pipefail
umask 077

worker=cdc-coral-coral-job-worker-1
checkout=/tmp/coral-check-6bda46f
revision=ba41ea3618822fcc950608a6f0b2348e2534f83c
stop(){ printf 'ARRET_%s\n' "$1" >&2; exit 1; }

[[ "$(docker inspect -f '{{.State.Status}} {{.State.Health.Status}}' "$worker")" == 'running healthy' ]] || stop WORKER_NON_SAIN
[[ "$(docker inspect -f '{{index .Config.Labels "org.opencontainers.image.revision"}}' "$worker")" == "$revision" ]] || stop REVISION_ACTIVE_INATTENDUE
if systemctl is-active --quiet cdc-coral-private-release.service; then stop SERVICE_CORAL_ACTIF; fi
git -C "$checkout" cat-file -e "$revision^{commit}" 2>/dev/null || stop CODE_CORRECTIF_ABSENT

private=$(mktemp -d "$HOME/cdc-c2-kep-reel.XXXXXXXX")
mkdir "$private/catalogue"
git -C "$checkout" archive "$revision" \
  scripts/editorial-ai-structured-benchmark.php \
  public/gestion-contenus/lib.php \
  tests/fixtures/editorial-ollama-benchmark.json \
  tests/fixtures/editorial-culture-documented-kep.json |
  tar -xf - -C "$private"

if command -v php >/dev/null 2>&1; then
  phpcli(){ (cd "$private" && php "$@"); }
else
  image=$(docker image ls --format '{{.Repository}}:{{.Tag}}' |
    awk '/(^|\/)php:8\.[3-9]([.-][a-zA-Z0-9.]+)*-cli(-[a-zA-Z0-9.]+)*$/ && !found++ {print}')
  [[ -n "$image" ]] || stop PHP_CLI_ABSENT_AUCUN_JOB_SOUMIS
  phpcli(){ docker run --rm --pull=never --network none --read-only \
    --user "$(id -u):$(id -g)" \
    -v "$private:/bench:ro" -w /bench --entrypoint php "$image" "$@"; }
fi

for f in social-feed.json editorial-source-index.json editorial-guided-fields.json; do
  curl -fsS --max-time 16 --max-filesize 5000000 \
    "https://www.cuisine-du-cambodge.com/$f" -o "$private/catalogue/$f" ||
    stop CATALOGUE_INDISPONIBLE_AUCUN_JOB_SOUMIS
done
bench=scripts/editorial-ai-structured-benchmark.php
phpcli "$bench" request culture catalogue documented > "$private/request.json" ||
  stop REQUETE_DOCUMENTEE_INVALIDE_AUCUN_JOB_SOUMIS

echo "DOSSIER_CANDIDAT_PRIVE=$private"
since=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
set +e
docker exec -i "$worker" node --input-type=module -e '
import {readdir} from "node:fs/promises";
import {join} from "node:path";
import {createHash} from "node:crypto";
import {setTimeout as pause} from "node:timers/promises";
import {readEditorialJobToken} from "/app/scripts/private-runtime-secret.mjs";
import {validateJobRequest} from "/app/scripts/editorial-ai-job-gateway.mjs";

const env=process.env;
let phase="PREFLIGHT";
const stop=code=>{throw Error(code);};
try{
  if(env.CDC_EDITORIAL_JOB_DIR!=="/var/lib/cdc/jobs")stop("FILE_INATTENDUE");
  if((env.CDC_EDITORIAL_JOB_MODEL||"llama3.2:latest")!=="llama3.2:latest")stop("MODELE_INATTENDU");
  if(!["ollama","openai-coral"].includes(env.CDC_EDITORIAL_JOB_PROVIDER||"ollama"))stop("ROUTAGE_INATTENDU");
  if(env.CDC_CORAL_REAL_TTS_ENABLED==="true")stop("TTS_PAYANT_ACTIF");
  let input="";
  process.stdin.setEncoding("utf8");
  for await(const chunk of process.stdin) input+=chunk;
  const request=validateJobRequest(JSON.parse(input));
  if(request.contract!=="cdc-editorial-ai-content-request-v1"||request.brief.kind!=="culture"
    ||!request.brief.context?.includes("Psar Kdam")
    ||!request.brief.context?.includes("https://www.wipo.int/"))
    stop("CONTRAT_DOCUMENTAIRE_INATTENDU");

  const id=createHash("sha256").update("cdc-c2-kep-doc-pr242-third-final-20261122-v1")
    .digest("hex").slice(0,48);
  const token=readEditorialJobToken(env,env.CDC_EDITORIAL_JOB_BIND_HOST||"127.0.0.1");
  const api=(job,method="GET",body)=>fetch("http://127.0.0.1:18678/editorial-ai/v1/jobs/"+job,{
    method,headers:{authorization:"Bearer "+token,"content-type":"application/json"},
    body,signal:AbortSignal.timeout(5000)
  });

  console.error("JOB_ID="+id);
  let probe=await api(id);
  if(probe.status===200)stop("JOB_DEJA_UTILISE_AUCUNE_RESOUMISSION");
  if(probe.status!==404)stop("SONDE_HTTP_"+probe.status);

  for(const item of await readdir("/var/lib/cdc/jobs",{withFileTypes:true})){
    if(!item.isDirectory()||!/^[a-f0-9]{48}$/.test(item.name))stop("FILE_NON_LIBRE");
    const entries=await readdir(join("/var/lib/cdc/jobs",item.name));
    if(!entries.includes("terminal.json")||entries.some(f=>/^\..*operation\.lock$/.test(f)))
      stop("FILE_NON_LIBRE");
  }

  const model=await fetch("http://ollama:11434/api/tags",{signal:AbortSignal.timeout(4000)});
  if(!model.ok)stop("OLLAMA_INDISPONIBLE");
  if(!(await model.json()).models.some(x=>(x.name||x.model)==="llama3.2:latest"))
    stop("MODELE_ABSENT");

  phase="SUBMIT";
  const start=Date.now();
  const submitted=await api(id,"PUT",JSON.stringify(request));
  if(submitted.status!==202)stop("SOUMISSION_HTTP_"+submitted.status);
  console.error("SOUMISSION_HTTP=202");
  phase="POLL";
  let previous;
  while(Date.now()-start<290000){
    const response=await api(id);
    if(!response.ok)stop("SUIVI_HTTP_"+response.status);
    const state=await response.json();
    if(state.status!==previous)console.error("STATUT="+state.status);
    previous=state.status;
    if(state.status==="succeeded"){
      if(typeof state.result!=="string")stop("CANDIDAT_ABSENT");
      console.error("DUREE_MS="+(Date.now()-start));
      process.stdout.write(state.result);
      break;
    }
    if(state.status==="failed")stop("JOB_ECHOUE");
    if(!["queued","running"].includes(state.status))stop("ETAT_INATTENDU");
    await pause(1000);
  }
  if(previous!=="succeeded")stop("DELAI_OBSERVATION_DEPASSE");
}catch(error){
  const message=error?.message||"INCONNU";
  console.error("ARRET_PHASE="+phase+" CAUSE="+
    (/^[A-Z_0-9]+$/.test(message)?message:"ERREUR_NON_DETAILLEE"));
  process.exitCode=1;
}
' < "$private/request.json" > "$private/candidat.json"
rc=$?
set -e
if ((rc!=0)); then
  echo "GENERATION_NON_VALIDEE_REESSAI_INTERDIT"
  docker logs --since "$since" --tail 1000 "$worker" 2>/dev/null |
    sed -nE 's/^.*CDC_C2_JOB_FAILED_REASON=(PROVIDER_TIMEOUT|JOB_PROVIDER_HTTP_[0-9]{3}|JOB_PROVIDER|JOB_RESPONSE|JOB_RESPONSE_SIZE|PROVIDER_FAILURE).*$/RAISON_WORKER=\1/p' |
    tail -n 1 || true
  exit "$rc"
fi

phpcli "$bench" validate culture candidat.json ||
  stop VALIDATION_SCHEMATIQUE_ECHOUEE
sha256sum "$private/candidat.json"
echo "CANDIDAT_PRIVE=$private/candidat.json"
echo "VALIDATION_S1_EFFECTUEE_SANS_PUBLICATION"
