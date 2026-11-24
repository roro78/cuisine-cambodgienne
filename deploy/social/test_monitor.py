from datetime import datetime, timezone
import json
from pathlib import Path
import tempfile
from unittest import TestCase
from unittest.mock import patch

from monitor import SCHEDULE, diagnose, monitor, previous_slot


class MonitorTest(TestCase):
    def setUp(self):
        self.now = datetime(2026, 11, 25, 11, 22, tzinfo=timezone.utc)
        self.armed = datetime(2026, 11, 25, 10, 30, tzinfo=timezone.utc)
        self.probe = {
            "queue":{"ok":True,"rows":[]}, "ollama":True, "graph":{"ok":True},
            "flows":[{"id":wid,"active":True,"versionId":"current","activeVersionId":"current"}
                     for wid in SCHEDULE],
            "triggers":[], "publicationService":False, "executions":[],
        }

    def test_legacy_publication_checks_real_trigger_at_the_expected_slot(self):
        incidents = diagnose(self.probe, self.now, self.armed)
        self.assertEqual(set(incidents), {"manque-02","manque-03"})
        for wid in list(SCHEDULE)[1:]:
            self.probe["executions"].append({
                "id":"500","workflowId":wid,"mode":"trigger","startedAt":"2026-11-25T11:00:10Z",
                "status":"success","category":None,
            })
        self.assertFalse(diagnose(self.probe,self.now,self.armed))

    def test_revocation_and_ambiguous_meta_are_reported_without_recovery_writes(self):
        self.probe["graph"] = {"ok":False,"revoked":True}
        self.probe["queue"]["rows"] = [{
            "id":"5","status":"publishing","fb_state":"published","ig_state":"submitting",
            "updated_at":"2026-11-25T10:00:00Z",
        }]
        incidents = diagnose(self.probe,self.now,self.armed)
        self.assertIn("meta", incidents)
        self.assertIn("ambigu-5", incidents)
        self.assertIn("avant toute reprise",incidents["ambigu-5"])

    def test_retry_uses_exactly_the_same_content_and_key_and_then_deduplicates(self):
        attempted = []
        def helper(path, mode, payload=None):
            if mode == "probe":
                return self.probe
            attempted.append(payload)
            if len(attempted)==1:
                raise RuntimeError("temporary_send_failure")
            return {"resendId":"receipt"}
        with tempfile.TemporaryDirectory() as scratch, patch("monitor.docker_probe", side_effect=helper):
            state = Path(scratch)/"incidents.json"
            with self.assertRaises(RuntimeError):
                monitor(Path("test"),state,self.armed,self.now)
            self.assertIsNotNone(json.loads(state.read_text())["batch"])
            monitor(Path("test"),state,self.armed,self.now)
            monitor(Path("test"),state,self.armed,self.now)
            self.assertEqual(len(attempted),2)
            self.assertEqual(attempted[0],attempted[1])

    def test_hourly_slot_follows_real_utc_instants_during_dst_change(self):
        utc = timezone.utc
        slot = previous_slot(datetime(2026,10,25,1,22,tzinfo=utc),range(24),
                             datetime(2026,10,25,0,0,tzinfo=utc))
        self.assertEqual(slot.astimezone(utc),datetime(2026,10,25,1,0,tzinfo=utc))
        self.assertEqual(slot.fold,1)
