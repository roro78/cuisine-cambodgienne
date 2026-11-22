#!/usr/bin/env bash
# Fail-closed one-shot upgrade of only the existing Coral job worker.
# No MP3, inference, deployment of other services, or automatic job submission.
set -Eeuo pipefail
umask 077

worker=cdc-coral-coral-job-worker-1
service=coral-job-worker
base_rev=6bda46f97e0bf59e3deb18968bdffd107191436b
next_rev=c604c344b5fb6cd6d735854c6e3c360dbbf94ee4
previous=sha256:710765dca9c8a4009e879e64e4de4d5ac2ad8276d3702cd2e0f6b0185ff4f4c1
candidate=sha256:c937c79672473a4a69960011fd9f0a4c0071fa0d53aea183465e3fd8c5c47fc2
back="$HOME/cdc-c2-rollback.U2Q27ae4"
state="$HOME/.local/share/cdc-coral/state"

die(){ printf 'ARRET_%s\n' "$1" >&2; exit 1; }
wait_healthy(){
  local wanted="$1" n actual health
  for ((n=0;n<60;n++)); do
    actual=$(docker inspect -f '{{.Image}}' "$worker" 2>/dev/null || true)
    health=$(docker inspect -f '{{.State.Status}} {{.State.Health.Status}}' "$worker" 2>/dev/null || true)
    if [[ "$actual" == "$wanted" && "$health" == 'running healthy' ]]; then return 0; fi
    sleep 1
  done
  return 1
}
changed=0
rollback(){
  local rc=$? actual
  trap - EXIT
  if (( changed )); then
    echo 'ECHEC_OPERATION_RETOUR_ARRIERE_EN_COURS' >&2
    actual=$(docker inspect -f '{{.Image}}' "$worker" 2>/dev/null || true)
    if [[ "$actual" == "$previous" ]]; then
      docker start "$worker" >/dev/null 2>&1 || true
    else
      "${compose[@]}" -f "$back/image-previous.yaml" \
        up -d --no-deps --no-build --pull never --force-recreate "$service" \
        >"$back/rollback.log" 2>&1 || true
    fi
    if wait_healthy "$previous"; then
      echo 'RETOUR_ARRIERE_WORKER_CONFIRME' >&2
    else
      echo 'ALERTE_RETOUR_ARRIERE_NON_CONFIRME_CONTACTER_SUPPORT' >&2
    fi
    echo 'AUCUNE_RESTAURATION_D_ETAT_SUR_PRODUCTION' >&2
  fi
  exit "$rc"
}
trap rollback EXIT

[[ "$(id -u):$(id -g)" == '1000:1000' ]] || die UTILISATEUR_INATTENDU
[[ -d "$back" && ! -L "$back" && -f "$back/old-image-id" && -f "$back/new-image-id" && -f "$back/compose-paths" ]] || die REPERTOIRE_ROLLBACK_ABSENT
[[ "$(cat "$back/old-image-id")" == "$previous" ]] || die ANCIENNE_IMAGE_INATTENDUE
[[ "$(cat "$back/new-image-id")" == "$candidate" ]] || die NOUVELLE_IMAGE_INATTENDUE
for p in "$state" "$state/jobs" "$state/budget"; do
  [[ -d "$p" && ! -L "$p" && "$(stat -c '%u:%g %a' "$p")" == '1000:1000 700' ]] || die ETAT_PERMISSIONS_INATTENDUES
done
command -v docker >/dev/null || die DOCKER_ABSENT
docker compose version >/dev/null 2>&1 || die DOCKER_COMPOSE_ABSENT
command -v python3 >/dev/null || die PYTHON_ABSENT
command -v openssl >/dev/null || die OPENSSL_ABSENT
[[ "$(docker inspect -f '{{.Image}}' "$worker")" == "$previous" ]] || die IMAGE_ACTIVE_DIFFERENTE
[[ "$(docker inspect -f '{{.State.Status}} {{.State.Health.Status}}' "$worker")" == 'running healthy' ]] || die WORKER_NON_SAIN
[[ "$(docker inspect -f '{{index .Config.Labels "org.opencontainers.image.revision"}}' "$worker")" == "$base_rev" ]] || die REVISION_ACTIVE_DIFFERENTE
[[ "$(docker image inspect -f '{{index .Config.Labels "org.opencontainers.image.revision"}}' "$candidate")" == "$next_rev" ]] || die IMAGE_CANDIDATE_NON_VERIFIEE
docker image inspect "$previous" >/dev/null || die ANCIENNE_IMAGE_ABSENTE
if systemctl is-active --quiet cdc-coral-private-release.service; then die RUNNER_CORAL_ACTIF; fi
if systemctl is-active --quiet cdc-coral-private-release.timer; then die TIMER_CORAL_ACTIF; fi

if ! docker exec "$worker" node --input-type=module -e '
import {readdir} from "node:fs/promises";
import {join} from "node:path";
const root="/var/lib/cdc/jobs";
for(const entry of await readdir(root,{withFileTypes:true})){
  if(!/^[a-f0-9]{48}$/.test(entry.name)||!entry.isDirectory())throw Error("FILE_NON_LIBRE");
  const files=await readdir(join(root,entry.name));
  if(!files.includes("terminal.json")||files.some(f=>/^\..*operation\.lock$/.test(f)))throw Error("FILE_NON_LIBRE");
}
' >/dev/null 2>&1; then die FILE_NON_LIBRE; fi

while IFS= read -r cid; do
  [[ -n "$cid" ]] || continue
  [[ "$cid" == "$(docker inspect -f '{{.Id}}' "$worker")" ]] && continue
  while IFS= read -r src; do
    case "$src" in "$state"|"$state/"*) die AUTRE_CONTENEUR_SUR_ETAT ;; esac
  done < <(docker inspect -f '{{range .Mounts}}{{println .Source}}{{end}}' "$cid")
done < <(docker ps -q --no-trunc)

project=$(docker inspect -f '{{index .Config.Labels "com.docker.compose.project"}}' "$worker")
workdir=$(docker inspect -f '{{index .Config.Labels "com.docker.compose.project.working_dir"}}' "$worker")
current_files=$(docker inspect -f '{{index .Config.Labels "com.docker.compose.project.config_files"}}' "$worker")
[[ "$project" == cdc-coral && "$workdir" == "$HOME"/.local/share/cdc-coral/releases/* && -d "$workdir" ]] || die PROJET_COMPOSE_INATTENDU
[[ -n "$current_files" && "$current_files" == "$(paste -sd, "$back/compose-paths")" ]] || die COMPOSE_CHEMINS_MODIFIES
mapfile -t paths < "$back/compose-paths"
[[ "${#paths[@]}" == 6 ]] || die NOMBRE_COMPOSE_INATTENDU
compose=(docker compose --project-directory "$workdir" -p "$project" --profile runtime)
i=0
for f in "${paths[@]}"; do
  ((i+=1))
  [[ -f "$f" && ! -L "$f" ]] && cmp -s "$f" "$back/compose-$i.yaml" || die COMPOSE_MODIFIE
  compose+=(-f "$f")
done
printf 'services:\n  %s:\n    image: %s\n' "$service" "$previous" > "$back/image-previous.yaml"
printf 'services:\n  %s:\n    image: %s\n' "$service" "$candidate" > "$back/image-candidate.yaml"
chmod 600 "$back/image-previous.yaml" "$back/image-candidate.yaml"

python3 - "$worker" "$previous" "$candidate" "$back/image-previous.yaml" "$back/image-candidate.yaml" "${compose[@]}" <<'PY'
import copy,json,subprocess,sys
worker,old,new,old_overlay,new_overlay,*cmd=sys.argv[1:]
def run(args):
    return subprocess.check_output(args,stderr=subprocess.DEVNULL)
try:
    before=json.loads(run(cmd+['-f',old_overlay,'config','--format','json']))
    after=json.loads(run(cmd+['-f',new_overlay,'config','--format','json']))
    live=json.loads(run(['docker','inspect',worker]))[0]
    a=before['services']['coral-job-worker'];b=after['services']['coral-job-worker']
    assert a['image']==old and b['image']==new
    assert live['Image']==old
    ca=copy.deepcopy(before);cb=copy.deepcopy(after)
    ca['services']['coral-job-worker']['image']='SAME_IMAGE'
    cb['services']['coral-job-worker']['image']='SAME_IMAGE'
    assert ca==cb
    env={k:v for k,v in (s.split('=',1) for s in live['Config']['Env'] if '=' in s)}
    declared=a.get('environment') or {}
    if isinstance(declared,list):
        declared={k:v for k,v in (x.split('=',1) for x in declared)}
    for k,v in declared.items():
        assert env.get(k)==str(v)
    assert env.get('CDC_CORAL_REAL_TTS_ENABLED','false').lower() in ('false','0','')
    for flag in ('CDC_CORAL_EXTERNAL_ENABLED','CDC_CORAL_ACTIVATION_APPROVED'):
        assert env.get(flag,'false').lower() not in ('true','1')
    mounts={m['Destination']:m['Source'] for m in live['Mounts']}
    for v in a.get('volumes',[]):
        if v.get('type')=='bind':
            assert mounts.get(v['target'])==v['source']
    networks=set(live['NetworkSettings']['Networks'])
    for n in a.get('networks',{}):
        net=before['networks'].get(n,{})
        assert net.get('name',before['name']+'_'+n) in networks
    print('COMPOSE_IMAGE_SEULE_CHANGEMENT')
    print('COMPOSE_RUNTIME_COHERENT')
except Exception:
    print('ARRET_COMPOSE_RUNTIME_NON_EQUIVALENT',file=sys.stderr)
    sys.exit(1)
PY

mkdir -m 700 "$back/state-archive" "$back/restoration"
[[ ! -e "$back/backup-key.hex" && ! -e "$back/state-archive/coral.enc" && ! -e "$back/restoration/new-state" ]] || die ARCHIVE_DEJA_EXISTANTE
openssl rand -hex 32 > "$back/backup-key.hex"
chmod 600 "$back/backup-key.hex"

changed=1
docker stop --time 20 "$worker" >/dev/null || die ARRET_WORKER_ECHOUE
[[ "$(docker inspect -f '{{.State.Status}}' "$worker")" == exited ]] || die WORKER_NON_ARRETE

run_backup(){
  docker run --rm --pull=never --network none --read-only --user 1000:1000 \
    --cap-drop ALL --security-opt no-new-privileges --pids-limit 32 \
    --memory 512m --cpus 0.5 --entrypoint node \
    --mount "type=bind,src=$state,dst=/state,readonly" \
    --mount "type=bind,src=$back/state-archive,dst=/archives" \
    --mount "type=bind,src=$back/backup-key.hex,dst=/key,readonly" \
    "$previous" /app/scripts/coral-state-backup.mjs \
    backup --offline --state-dir /state --archive /archives/coral.enc --key-file /key
}
run_restore(){
  docker run --rm --pull=never --network none --read-only --user 1000:1000 \
    --cap-drop ALL --security-opt no-new-privileges --pids-limit 32 \
    --memory 512m --cpus 0.5 --entrypoint node \
    --mount "type=bind,src=$back/state-archive,dst=/archives,readonly" \
    --mount "type=bind,src=$back/restoration,dst=/restore" \
    --mount "type=bind,src=$back/backup-key.hex,dst=/key,readonly" \
    "$previous" /app/scripts/coral-state-backup.mjs \
    restore --offline --state-dir /restore/new-state --archive /archives/coral.enc --key-file /key
}
run_backup || die SAUVEGARDE_DONNEES_ECHOUEE
[[ -f "$back/state-archive/coral.enc" && -f "$back/backup-key.hex" ]] || die ARCHIVE_ABSENTE
[[ "$(stat -c %a "$back/state-archive/coral.enc")" == 600 ]] || die ARCHIVE_PERMISSIONS
run_restore || die RESTAURATION_TEST_ECHOUEE
[[ -f "$back/restoration/new-state/jobs/.restore-review-required" ]] || die RESTAURATION_NON_VALIDE
[[ "$(stat -c %a "$back/restoration/new-state/jobs/.restore-review-required")" == 600 ]] || die RESTAURATION_PERMISSIONS
echo 'SAUVEGARDE_CHIFFREE_ET_RESTAURATION_ISOLEE_OK'

if ! "${compose[@]}" -f "$back/image-candidate.yaml" \
  up -d --no-deps --no-build --pull never --force-recreate "$service" \
  >"$back/deploy.log" 2>&1; then die INSTALLATION_WORKER_REFUSEE; fi
if ! wait_healthy "$candidate"; then die NOUVEAU_WORKER_NON_SAIN; fi
if ! docker exec "$worker" node --input-type=module -e '
const r=await fetch("http://127.0.0.1:18678/",{signal:AbortSignal.timeout(2500)});
if(r.status!==401)process.exit(1);
' >/dev/null 2>&1; then die CONTROLE_AUTHENTIFICATION_ECHOUE; fi
changed=0
printf 'DEPLOIEMENT_C2_WORKER_HEALTHY\nREVISION=%s\n' "$next_rev"
printf 'CORAL_TTS_PAYANT_NON_ACTIVE\nAUCUNE_GENERATION_MP3\nETAT_PRIVE_INCHANGE\n'
printf 'IMAGE_HISTORIQUE_PRESERVEE\nRETOUR_ARRIERE=%s\n' "$back"
