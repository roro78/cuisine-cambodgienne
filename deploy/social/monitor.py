#!/usr/bin/env python3
"""Read-only supervision of the three Cuisine workflows, with Resend notifications."""
import argparse
from datetime import datetime, timedelta, timezone
import hashlib
import json
from pathlib import Path
import subprocess
from zoneinfo import ZoneInfo

PARIS = ZoneInfo("Europe/Paris")
SCHEDULE = {
    "G7jJCMw6bLQE7dD4": ("01", (7,)),
    "AVEoRlWHNF5oBlkS": ("02", (12,)),
    "JGqZbuNzma9ZpD7H": ("03", tuple(range(24))),
}
LINK = "https://www.cuisine-du-cambodge.com/gestion-social/"


def timestamp(value):
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def previous_slot(now, hours, armed):
    if len(hours) == 24:
        slot = (now - timedelta(minutes=20)).replace(minute=0, second=0, microsecond=0)
        return slot.astimezone(PARIS) if slot >= armed else None
    local = now.astimezone(PARIS)
    slots = [
        (local - timedelta(days=days)).replace(hour=hour, minute=0, second=0, microsecond=0)
        for days in (0, 1) for hour in hours
    ]
    eligible = [
        slot for slot in slots
        if slot.astimezone(timezone.utc) >= armed
        and now - slot.astimezone(timezone.utc) >= timedelta(minutes=20)
    ]
    return max(eligible, default=None)


def diagnose(data, now, armed):
    incidents = {}
    if not data["graph"]["ok"]:
        incidents["meta"] = "Le credential Meta est révoqué ou inutilisable." if data["graph"].get("revoked") else "Le contrôle des comptes Meta a échoué."
    if not data["ollama"]:
        incidents["ollama"] = "Ollama ou le modèle attendu est indisponible."
    if not data["queue"]["ok"]:
        incidents["supabase"] = "La lecture PostgreSQL Cuisine a échoué."
    else:
        for row in data["queue"]["rows"]:
            age = now - timestamp(row["updated_at"])
            post = row["id"]
            if "manual_review" in (row["status"], row["fb_state"], row["ig_state"]):
                incidents[f"review-{post}"] = f"Publication n° {post} à examiner. Vérifier les identifiants Meta avant toute reprise."
            elif age > timedelta(minutes=25) and (
                row["fb_state"] == "submitting" or row["ig_state"] in ("creating", "checking", "submitting")
            ):
                incidents[f"ambigu-{post}"] = f"Publication n° {post} bloquée pendant une opération. Examiner Meta avant toute reprise."
            elif age > timedelta(hours=2) and row["ig_state"] == "container_created":
                incidents[f"conteneur-{post}"] = f"Le conteneur Instagram du n° {post} attend depuis plus de deux heures."
    for wid,(label,hours) in SCHEDULE.items():
        flow = next(row for row in data["flows"] if row["id"] == wid)
        active = flow["active"] and flow["activeVersionId"] == flow["versionId"]
        registered = not data.get("publicationService") or any(
            row["workflowId"] == wid and row["versionId"] == flow["activeVersionId"]
            and row["status"] == "activated" for row in data["triggers"]
        )
        if not active or not registered:
            incidents[f"desactive-{label}"] = f"Le workflow {label} ou son déclencheur est inactif."
        runs = sorted(
            (run for run in data["executions"] if run["workflowId"] == wid
             and run["mode"] == "trigger" and timestamp(run["startedAt"]) >= armed),
            key=lambda run: timestamp(run["startedAt"]), reverse=True,
        )
        if runs and runs[0]["status"] in ("error", "crashed"):
            run = runs[0]
            category = run["category"] or "n8n"
            incidents[f"echec-{label}-{category}"] = f"Le workflow {label} a échoué ({category}), exécution {run['id']}."
        slot = previous_slot(now, hours, armed)
        if active and registered and slot and not any(
            slot.astimezone(timezone.utc) <= timestamp(run["startedAt"]) <
            slot.astimezone(timezone.utc) + timedelta(minutes=20) for run in runs
        ):
            incidents[f"manque-{label}"] = f"Déclenchement {label} non observé à {slot:%d/%m %H:%M} (Paris)."
    return incidents


def docker_probe(path, mode, payload=None):
    args = ["docker", "exec", "-i", "n8n", "node", "-", mode]
    if payload is not None:
        args.append(json.dumps(payload, ensure_ascii=False))
    with path.open("rb") as script:
        result = subprocess.run(args, stdin=script, capture_output=True, timeout=25)
    if result.returncode:
        raise RuntimeError("probe_n8n_indisponible")
    records = [line for line in result.stdout.decode().splitlines() if line.startswith("CDC_SOCIAL_MONITOR ")]
    if len(records) != 1:
        raise RuntimeError("rapport_n8n_absent")
    return json.loads(records[0].split(" ", 1)[1])


def write_state(path, state):
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(state), encoding="utf-8")
    temporary.chmod(0o600)
    temporary.replace(path)


def monitor(probe, state_path, armed, now):
    state = json.loads(state_path.read_text()) if state_path.exists() else {"sent": [], "batch": None}
    data = docker_probe(probe, "probe")
    incidents = diagnose(data, now, armed)
    sent = set(state["sent"]).intersection(incidents)
    batch = state["batch"]
    if batch is not None:
        # An ambiguous Resend response must reuse the very same body and key.
        if now - timestamp(batch["created"]) >= timedelta(hours=23):
            raise RuntimeError("alerte_resend_ambigue_a_reconcilier")
    else:
        pending = sorted(set(incidents) - sent)
        if pending:
            text = "\n".join(incidents[key] for key in pending) + "\n\nTableau de bord : " + LINK
            stamp = now.isoformat()
            key = "cdc-social-" + hashlib.sha256((stamp+"\n"+text).encode()).hexdigest()
            batch = {"created": stamp, "incidents": pending, "key": key, "text": text}
    write_state(state_path, {"sent": sorted(sent), "batch": batch})
    if batch is not None:
        receipt = docker_probe(probe, "send", {"key":batch["key"], "text":batch["text"]})
        sent |= set(batch["incidents"]).intersection(incidents)
        write_state(state_path, {"sent":sorted(sent),"batch":None})
        print("alerte_accepted",receipt["resendId"])
    print("surveillance_ok",len(incidents))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("mode", choices=("probe", "test", "watch"))
    ap.add_argument("--base", type=Path, default=Path("/usr/local/libexec/cuisine-social-monitor"))
    ap.add_argument("--state", type=Path, default=Path("/var/lib/cuisine-social-monitor"))
    opts = ap.parse_args()
    probe = opts.base / "probe.cjs"
    now = datetime.now(timezone.utc)
    if opts.mode == "probe":
        print(json.dumps(docker_probe(probe,"probe")))
    elif opts.mode == "test":
        result = docker_probe(probe, "send", {
            "key":"cdc-social-test-production-20261125",
            "test":True,
            "text":"Test unique de surveillance sociale. Aucun brouillon ni publication ne résulte de cet e-mail. "+LINK,
        })
        print("test_accepted",result["resendId"])
    else:
        armed = timestamp((opts.state/"armed-at").read_text().strip())
        monitor(probe,opts.state/"incidents.json",armed,now)


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, RuntimeError, subprocess.TimeoutExpired) as error:
        raise SystemExit("surveillance_non_terminee:"+str(error)) from None
