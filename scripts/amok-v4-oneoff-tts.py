#!/usr/bin/env python3
"""One-off, fail-closed Amok Trey v4 Coral MP3 generator.

Runs ONLY on the owner's Orvekio VPS. No source text, secret or output is
stored in GitHub. Not a replacement for the Studio production workflow.
"""
import datetime as dt
import hashlib
import http.client
import json
import os
from pathlib import Path
import re
import secrets
import ssl
import stat
import sys
import zipfile

CREATION = "c-090c287895f1d8d8e306d871"
IDS = ("intro", "installer", "preparer", "assembler", "maitriser", "rectifier", "terminer")
SHAS = (
    "fd1f4022a253e757abffb5fbc24c908e50aa626e72400ac4861b44ce424aceed",
    "cacc48a57242a0aa650593747640c8815caef804c10e6ed288b73213dee1c0a6",
    "f9f23eda9d4b45d25635f55a04d0463a7a46e67af1f3c27963bb597ad1bcadf8",
    "3484beab7f59494234039371bd9ffb1e77568b96a7194216c2b985c4f90d8bad",
    "16bdff10707585457f7ec608264bcbfddbb7f7f528776b02fa176c248ad6afa5",
    "90ec800ef92355c02586570b9919c403bc81a6d28c45ac47a96ffc7183252376",
    "c4607199043c3dff3abf467e25a6997b0019619b881479461a003293502b4a8b",
)
HOME = Path.home()
ROOT = HOME / ".local/share/cdc-coral/amok-v4-once"
SRC = ROOT / "source.json"
OUT = ROOT / "mp3"
KEY = HOME / ".config/cdc-coral/secrets/cdc_coral_openai_key"
LEDGER = HOME / ".local/share/cdc-coral/state/budget"
MODEL = "gpt-4o-mini-tts"
JOB = hashlib.sha256(("amok-v4-coral-oneoff\n" + "\n".join(SHAS)).encode()).hexdigest()[:48]
INSTRUCTIONS = (
    "Narration culinaire naturelle en français de France. "
    "Voix féminine Coral chaleureuse et spontanée. "
    "Expliquer le geste comme une vraie cuisinière encourageante, "
    "avec un rythme convivial. Ne pas inventer de quantités."
)


def abort(why):
    raise RuntimeError(why)


def private(p, kind):
    st = p.lstat()
    if st.st_uid != os.getuid() or (st.st_mode & 0o077):
        abort("DROITS_PRIVES_INCORRECTS")
    if kind == "file" and not stat.S_ISREG(st.st_mode):
        abort("SOURCE_NON_REGULIERE")
    if kind == "dir" and not stat.S_ISDIR(st.st_mode):
        abort("DOSSIER_NON_REGULIER")
    return st


def sha(value):
    return hashlib.sha256(value).hexdigest()


def source():
    private(ROOT, "dir")
    info = private(SRC, "file")
    if info.st_size < 1000 or info.st_size > 100000:
        abort("SOURCE_TAILLE_INVALIDE")
    data = json.loads(SRC.read_text(encoding="utf-8"))
    if data.get("id") != CREATION or data.get("version") != 4 or data.get("kind") != "atelier":
        abort("MAUVAIS_ATELIER_OU_VERSION")
    rows = data.get("atelier_scripts", {}).get("chapters")
    if not isinstance(rows, list) or len(rows) != 7:
        abort("SEPT_NARRATIONS_ABSENTES")
    texts = []
    for i, row in enumerate(rows):
        if not isinstance(row, dict) or row.get("id") != IDS[i] or str(row.get("index")) != str(i):
            abort("ORDRE_DES_NARRATIONS_INVALIDE")
        s = row.get("text")
        if not isinstance(s, str) or not 120 <= len(s) <= 4096:
            abort("TEXTE_NON_COMPATIBLE")
        if sha(s.encode("utf-8")) != SHAS[i]:
            abort("EMPREINTE_NARRATION_INCORRECTE")
        texts.append(s)
    return texts


def read_key():
    info = private(KEY, "file")
    if not 24 <= info.st_size <= 1024:
        abort("CLE_INVALIDE")
    key = KEY.read_text(encoding="ascii").strip()
    if not re.fullmatch(r"sk-[A-Za-z0-9_-]{18,}", key):
        abort("CLE_INVALIDE")
    return key


def reserve_once():
    """Use the worker's existing monthly ledger and exact mkdir lock protocol."""
    private(LEDGER, "dir")
    global_lock = LEDGER / ".budget.lock"
    daily = dt.datetime.now(dt.timezone.utc).date().isoformat()
    day_path = LEDGER / ("budget-" + daily + ".json")
    day_lock = LEDGER / ("budget-" + daily + ".lock")
    # A stale/active lock is a hard stop; never bypass another worker.
    global_lock.mkdir(mode=0o700)
    day_locked = False
    try:
        day_lock.mkdir(mode=0o700)
        day_locked = True
        total = 0.0
        day_total = 0.0
        found = False
        old = {"contract": "cdc-coral-daily-reservations-v1", "day": daily, "requests": []}
        for p in LEDGER.glob("budget-????-??-??.json"):
            if p.name[:14] != ("budget-" + daily[:7]):
                continue
            if p.lstat().st_size > 200000:
                abort("BUDGET_CORROMPU")
            private(p, "file")
            obj = json.loads(p.read_text(encoding="utf-8"))
            if (obj.get("contract") != "cdc-coral-daily-reservations-v1"
                    or ("budget-" + str(obj.get("day")) + ".json") != p.name
                    or not isinstance(obj.get("requests"), list)
                    or len(obj["requests"]) > 500):
                abort("BUDGET_CORROMPU")
            if p == day_path:
                old = obj
            for x in obj["requests"]:
                cost = x.get("reservedUsd")
                if not isinstance(cost, (int, float)) or isinstance(cost, bool) or not 0 < cost <= 0.75:
                    abort("BUDGET_CORROMPU")
                total += cost
                if p == day_path:
                    day_total += cost
                if x.get("jobId") == JOB:
                    if x.get("model") != MODEL or cost != 0.75 or found:
                        abort("RESERVATION_CONFLICTUELLE")
                    found = True
        if found:
            print("RESERVATION_EXISTANTE_REUTILISEE")
            return
        if total + 0.75 > 1.00000001 or day_total + 0.75 > 0.75000001:
            abort("PLAFOND_BUDGET_LOCAL")
        old["requests"].append({
            "jobId": JOB, "model": MODEL, "reservedUsd": 0.75,
            "at": dt.datetime.now(dt.timezone.utc).isoformat(),
            "state": "unknown-after-reservation",
        })
        tmp = LEDGER / (".reserve-" + secrets.token_hex(12))
        with tmp.open("x", encoding="utf-8") as f:
            json.dump(old, f, separators=(",", ":"))
            f.flush()
            os.fsync(f.fileno())
        tmp.replace(day_path)
        print("RESERVATION_LOCALE_0_75_USD")
    finally:
        if day_locked:
            day_lock.rmdir()
        global_lock.rmdir()


def mp3_ok(p):
    if not p.is_file() or p.is_symlink() or p.stat().st_size < 1024:
        return False
    with p.open("rb") as f:
        b = f.read(3)
    return b == b"ID3" or (len(b) >= 2 and b[0] == 255 and (b[1] & 224) == 224)


def generate(i, text, key):
    name = f"{i:02d}-{IDS[i]}.mp3"
    target = OUT / name
    marker = OUT / f"{i:02d}-{IDS[i]}.attempt.json"
    if target.exists():
        if not mp3_ok(target):
            abort("MP3_EXISTANT_INVALIDE_" + name)
        print("DEJA_GENERE", name, sha(target.read_bytes()))
        return
    if marker.exists():
        abort("TENTATIVE_INCERTAINE_SANS_RELANCE_" + name)
    # Durable marker BEFORE billable network call: never retry uncertain results.
    with marker.open("x", encoding="utf-8") as f:
        json.dump({"source_sha256": SHAS[i], "model": MODEL, "voice": "coral",
                   "speed": 0.93, "at": dt.datetime.now(dt.timezone.utc).isoformat()}, f)
        f.flush()
        os.fsync(f.fileno())
    payload = json.dumps({
        "model": MODEL, "voice": "coral", "speed": 0.93,
        "response_format": "mp3", "instructions": INSTRUCTIONS,
        "input": text,
    }, ensure_ascii=False).encode("utf-8")
    conn = http.client.HTTPSConnection("api.openai.com", context=ssl.create_default_context(), timeout=120)
    try:
        conn.request("POST", "/v1/audio/speech", body=payload, headers={
            "Authorization": "Bearer " + key, "Content-Type": "application/json",
            "Accept": "audio/mpeg", "Cache-Control": "no-store",
        })
        r = conn.getresponse()
        if r.status != 200:
            abort("OPENAI_HTTP_" + str(r.status) + "_AUCUNE_RELANCE")
        ct = r.getheader("content-type", "").split(";", 1)[0].strip().lower()
        if ct not in ("audio/mpeg", "audio/mp3", "application/octet-stream"):
            abort("REPONSE_AUDIO_INATTENDUE")
        chunks = []
        size = 0
        while True:
            piece = r.read(65536)
            if not piece:
                break
            size += len(piece)
            if size > 20000000:
                abort("REPONSE_AUDIO_TROP_GRANDE")
            chunks.append(piece)
        audio = b"".join(chunks)
    finally:
        conn.close()
    tmp = OUT / ("." + name + "." + secrets.token_hex(8))
    with tmp.open("xb") as f:
        f.write(audio)
        f.flush()
        os.fsync(f.fileno())
    if not mp3_ok(tmp):
        abort("MP3_FORMAT_INVALIDE")
    tmp.replace(target)
    print("MP3_GENERE", name, "SHA256", sha(audio), "OCTETS", len(audio))


def main():
    os.umask(0o077)
    if len(sys.argv) != 2 or sys.argv[1] not in ("status", "preview", "finish"):
        abort("USAGE: python3 amok-v4-oneoff-tts.py status|preview|finish")
    mode = sys.argv[1]
    texts = source()
    OUT.mkdir(mode=0o700, exist_ok=True)
    private(OUT, "dir")
    print("SOURCE_V4_7_SUR_7_SHA256_OK")
    if mode == "status":
        for i, chapter in enumerate(IDS):
            name = f"{i:02d}-{chapter}.mp3"
            print(name, "OK" if mp3_ok(OUT / name) else "ABSENT")
        return
    if mode == "finish" and not mp3_ok(OUT / "00-intro.mp3"):
        abort("PREMIERE_ECOUTE_REQUISE")
    key = read_key()
    reserve_once()
    if mode == "preview":
        generate(0, texts[0], key)
        print("PRE-ECOUTE_A_VALIDER: ", OUT / "00-intro.mp3")
        return
    for i in range(1, 7):
        generate(i, texts[i], key)
    files = [OUT / f"{i:02d}-{chapter}.mp3" for i, chapter in enumerate(IDS)]
    if not all(mp3_ok(p) for p in files):
        abort("SEPT_MP3_INCOMPLETS")
    archive = OUT / "amok-trey-v4-coral-7-mp3.zip"
    if not archive.exists():
        with zipfile.ZipFile(archive, "x", compression=zipfile.ZIP_STORED) as z:
            for p in files:
                z.write(p, arcname=p.name)
    private(archive, "file")
    print("SEPT_MP3_OK", str(archive))
    for p in files:
        print("SHA256", p.name, sha(p.read_bytes()))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        # Never print text content, API bodies or credentials.
        if isinstance(exc, RuntimeError):
            print("ARRET_SECURITE", str(exc), file=sys.stderr)
        else:
            print("ARRET_SECURITE", type(exc).__name__, file=sys.stderr)
        sys.exit(1)
