"""
FORENSIC-X Backend — Scenario Loader
======================================
Seeds the database with the "Phantom Exfiltration" synthetic scenario.

Creates:
  - 1 Case (INS-2026-0042)
  - 2 Devices (Alice-WKS-01, Unknown USB Drive)
  - 1 Account (alice)
  - 3 Evidence items (syslog, file_access CSV, auth.log)
  - Automated Parsed Observations for all evidence items (Phase 6)
  - 5 Interconnected Entity Relationships (Phase 7)
  - 5 Epistemic Findings with Citations & Reasoning (Phase 8)
  - 5 Timeline Events reconstructing the exfiltration chain

Run with:
  python -m app.scripts.load_scenario [--force]

Status: FULLY IMPLEMENTED (Phases 1–8)
"""

import asyncio
import json
import shutil
import sys
from pathlib import Path
from datetime import datetime, timezone

# Ensure app modules resolve
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from sqlalchemy import select, delete
from app.db.engine import async_session_factory, engine
from app.db.base import Base
from app.models.models import (
    Case, CaseStatus, EvidenceItem, CustodyAction, Event, TimeQuality,
    Device, Account, Relationship, Finding, EpistemicTier, Observation,
)
from app.services.custody_service import append_custody_record
from app.services import observation_service
from app.core.hashing import compute_file_hash
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

CASE_ID = "e4f8d687-7a2e-4b68-80df-9c04df4a754b"
SYNTHETIC_DIR = Path(__file__).resolve().parent.parent.parent.parent / "data" / "synthetic"


async def _ensure_tables():
    """Create all tables if they don't exist (idempotent)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def load_scenario(force: bool = False):
    """Load the complete Phantom Exfiltration scenario."""
    await _ensure_tables()

    async with async_session_factory() as db:
        existing_case = await db.get(Case, CASE_ID)

        if existing_case and not force:
            print(f"[*] Scenario case {CASE_ID[:8]}... already exists.")
            print("    Checking if Phase 6 observations, Phase 7 graph, and Phase 8 findings need seeding...")
        elif existing_case and force:
            print(f"[!] Force reloading scenario {CASE_ID}...")
            # Clear existing data for case
            await db.execute(delete(Observation).where(Observation.case_id == CASE_ID))
            await db.execute(delete(Finding).where(Finding.case_id == CASE_ID))
            await db.execute(delete(Relationship).where(Relationship.case_id == CASE_ID))
            await db.execute(delete(Account).where(Account.case_id == CASE_ID))
            await db.execute(delete(Event).where(Event.case_id == CASE_ID))
            await db.execute(delete(Device).where(Device.case_id == CASE_ID))
            await db.execute(delete(EvidenceItem).where(EvidenceItem.case_id == CASE_ID))
            await db.execute(delete(Case).where(Case.id == CASE_ID))
            await db.commit()
            existing_case = None

        print("=================================================================")
        print("  FORENSIC-X -- Loading Synthetic Scenario: The Phantom Exfiltration")
        print("=================================================================\n")

        # ─── 1. Case ────────────────────────────────────────────────────────
        if not existing_case:
            case = Case(
                id=CASE_ID,
                case_number="INS-2026-0042",
                title="Unauthorized Access to HR System",
                description=(
                    "Investigating potential data exfiltration by exiting employee Alice. "
                    "Target: algo_v2.py from restricted R&D share. "
                    "USB device USB-998877 connected to Alice-WKS-01."
                ),
                status=CaseStatus.IN_PROGRESS,
                created_by="local-investigator",
            )
            db.add(case)
            await db.flush()
            print(f"[OK] Case created: {case.case_number} -- {case.title}")
        else:
            case = existing_case
            print(f"[OK] Case exists: {case.case_number}")

        # ─── 2. Devices ──────────────────────────────────────────────────────
        wks_stmt = select(Device).where(Device.id == "dev-001")
        wks = (await db.execute(wks_stmt)).scalar_one_or_none()
        if not wks:
            wks = Device(
                id="dev-001",
                case_id=CASE_ID,
                name="Alice-WKS-01",
                device_type="laptop",
                os_info="Windows 11 Enterprise",
                description="Alice's corporate workstation",
            )
            db.add(wks)

        usb_stmt = select(Device).where(Device.id == "dev-002")
        usb = (await db.execute(usb_stmt)).scalar_one_or_none()
        if not usb:
            usb = Device(
                id="dev-002",
                case_id=CASE_ID,
                name="Unknown USB Drive",
                device_type="usb",
                serial_number="USB-998877",
                description="SanDisk Ultra USB 3.0 — 30.8 GB",
            )
            db.add(usb)
        await db.flush()
        print(f"[OK] Devices active: dev-001 (Alice-WKS-01), dev-002 (SanDisk USB-998877)")

        # ─── 3. Account ──────────────────────────────────────────────────────
        acc_stmt = select(Account).where(Account.id == "acc-001")
        acc = (await db.execute(acc_stmt)).scalar_one_or_none()
        if not acc:
            acc = Account(
                id="acc-001",
                case_id=CASE_ID,
                username="alice",
                account_type="os_user",
                display_name="Alice Smith (Senior R&D Engineer)",
                associated_device_id="dev-001",
            )
            db.add(acc)
            await db.flush()
        print(f"[OK] Account registered: {acc.username} ({acc.display_name})")

        # ─── 4. Ingest Evidence Files ────────────────────────────────────────
        evidence_store = Path(settings.evidence_store_path) / CASE_ID
        evidence_store.mkdir(parents=True, exist_ok=True)

        evidence_specs = [
            {
                "filename": "syslog_snippet.log",
                "mime_type": "text/plain",
                "source": "Extracted from Alice-WKS-01 kernel syslog — USB connect/disconnect events",
                "method": "live-acquisition",
            },
            {
                "filename": "file_access.csv",
                "mime_type": "text/csv",
                "source": "File server audit log export — restricted share access records",
                "method": "log-export",
            },
            {
                "filename": "auth.log",
                "mime_type": "text/plain",
                "source": "Alice-WKS-01 authentication subsystem — SSH login records",
                "method": "live-acquisition",
            },
        ]

        created_evidence = []
        for ef in evidence_specs:
            src = SYNTHETIC_DIR / ef["filename"]
            dst = evidence_store / ef["filename"]

            if not src.exists():
                print(f"  [FAIL] Synthetic file not found: {src}")
                continue

            shutil.copy2(src, dst)
            file_hash = compute_file_hash(dst)
            file_size = dst.stat().st_size

            ev_stmt = select(EvidenceItem).where(
                EvidenceItem.case_id == CASE_ID,
                EvidenceItem.original_filename == ef["filename"],
            )
            ev = (await db.execute(ev_stmt)).scalar_one_or_none()

            if not ev:
                ev = EvidenceItem(
                    case_id=CASE_ID,
                    original_filename=ef["filename"],
                    file_size_bytes=file_size,
                    mime_type=ef["mime_type"],
                    hash_sha256=file_hash,
                    hash_algorithm="sha256",
                    acquired_at=datetime(2026, 10, 10, 9, 0, 0, tzinfo=timezone.utc),
                    acquired_by="local-investigator",
                    acquisition_method=ef["method"],
                    storage_path=str(dst.relative_to(Path(settings.evidence_store_path).parent.parent)),
                    source_description=ef["source"],
                )
                db.add(ev)
                await db.flush()

                # Custody: ACQUIRED
                await append_custody_record(
                    db,
                    case_id=CASE_ID,
                    action=CustodyAction.ACQUIRED,
                    evidence_item_id=ev.id,
                    actor="local-investigator",
                    description=f"Ingested {ef['filename']} ({file_size} bytes, SHA-256: {file_hash[:16]}...)",
                )
                print(f"  [OK] Ingested evidence: {ef['filename']} ({file_size:,} bytes) SHA-256: {file_hash[:16]}...")
            else:
                print(f"  [OK] Evidence item present: {ef['filename']}")

            created_evidence.append(ev)

        # ─── 5. Phase 6: Automated Observation Parsing ──────────────────────
        print("\n[*] Phase 6: Parsing evidence artifacts into observations...")
        parsed_observations = []
        for ev in created_evidence:
            parse_res = await observation_service.parse_evidence(
                db, evidence_id=ev.id, force=True, actor="automated-forensic-engine"
            )
            print(f"  [OK] {ev.original_filename}: {parse_res['observation_count']} observations extracted via {parse_res.get('parser', 'parser')}")

        # Fetch observations to link to findings
        obs_stmt = select(Observation).where(Observation.case_id == CASE_ID)
        obs_res = await db.execute(obs_stmt)
        all_observations = list(obs_res.scalars().all())
        obs_map = {o.observation_type: o.id for o in all_observations}
        print(f"  [OK] Total database observations loaded: {len(all_observations)}")

        # ─── 6. Phase 7: Seed Entity Relationships (Graph) ──────────────────
        print("\n[*] Phase 7: Populating knowledge graph relationships...")
        rel_specs = [
            {
                "id": "rel-001",
                "source_type": "account",
                "source_id": "acc-001",
                "target_type": "device",
                "target_id": "dev-001",
                "rel_type": "authenticated_to",
                "label": "AUTHENTICATED TO",
                "source_label": "alice (Account)",
                "target_label": "Alice-WKS-01",
                "evidence_ref": "auth.log: line 1",
                "timestamp": "2026-10-10T08:00:12Z",
                "desc": "SSH remote authentication from 10.0.1.55 to Alice-WKS-01",
            },
            {
                "id": "rel-002",
                "source_type": "ip",
                "source_id": "ip-10.0.1.55",
                "target_type": "account",
                "target_id": "acc-001",
                "rel_type": "remote_login_origin",
                "label": "REMOTE ORIGIN",
                "source_label": "10.0.1.55 (Workstation Subnet)",
                "target_label": "alice (Account)",
                "evidence_ref": "auth.log: line 1",
                "timestamp": "2026-10-10T08:00:12Z",
                "desc": "IPv4 origin of successful SSH session",
            },
            {
                "id": "rel-003",
                "source_type": "device",
                "source_id": "dev-002",
                "target_type": "device",
                "target_id": "dev-001",
                "rel_type": "mounted_on",
                "label": "INSERTED INTO",
                "source_label": "SanDisk USB-998877",
                "target_label": "Alice-WKS-01",
                "evidence_ref": "syslog_snippet.log: lines 1-6",
                "timestamp": "2026-10-10T08:15:03Z",
                "desc": "Physical USB 3.0 device enumeration on bus 2-1.3",
            },
            {
                "id": "rel-004",
                "source_type": "account",
                "source_id": "acc-001",
                "target_type": "file",
                "target_id": "file-algo-v2",
                "rel_type": "accessed_read",
                "label": "READ ACCESS",
                "source_label": "alice (Account)",
                "target_label": "algo_v2.py (Restricted R&D)",
                "evidence_ref": "file_access.csv: record 1",
                "timestamp": "2026-10-10T08:20:14Z",
                "desc": "SMB read operation on \\\\fileserver\\restricted\\R&D\\algo_v2.py (48,230 bytes)",
            },
            {
                "id": "rel-005",
                "source_type": "file",
                "source_id": "file-algo-v2",
                "target_type": "device",
                "target_id": "dev-002",
                "rel_type": "exfiltrated_copied",
                "label": "COPIED TO MEDIA",
                "source_label": "algo_v2.py",
                "target_label": "SanDisk USB-998877",
                "evidence_ref": "file_access.csv: record 2",
                "timestamp": "2026-10-10T08:22:07Z",
                "desc": "File write operation to removable storage target E:\\exfil_backup\\algo_v2.py",
            },
        ]

        for r_spec in rel_specs:
            existing_rel = await db.get(Relationship, r_spec["id"])
            if not existing_rel:
                rel = Relationship(
                    id=r_spec["id"],
                    case_id=CASE_ID,
                    source_entity_type=r_spec["source_type"],
                    source_entity_id=r_spec["source_id"],
                    target_entity_type=r_spec["target_type"],
                    target_entity_id=r_spec["target_id"],
                    relationship_type=r_spec["rel_type"],
                    metadata_json=json.dumps({
                        "label": r_spec["label"],
                        "source_label": r_spec["source_label"],
                        "target_label": r_spec["target_label"],
                        "evidence_ref": r_spec["evidence_ref"],
                        "timestamp": r_spec["timestamp"],
                        "description": r_spec["desc"],
                    }),
                )
                db.add(rel)
                print(f"  [OK] Graph edge: {r_spec['source_label']} --[{r_spec['label']}]--> {r_spec['target_label']}")
        await db.flush()

        # ─── 7. Phase 8: Epistemic Findings & Truth Tiers ───────────────────
        print("\n[*] Phase 8: Seeding analytical findings with epistemic tiers...")
        ssh_obs_ids = [o.id for o in all_observations if "ssh" in o.observation_type or "pam" in o.observation_type]
        usb_obs_ids = [o.id for o in all_observations if "usb" in o.observation_type or "scsi" in o.observation_type]
        file_obs_ids = [o.id for o in all_observations if "file" in o.observation_type]
        all_obs_ids = [o.id for o in all_observations]

        finding_specs = [
            {
                "id": "fnd-001",
                "title": "USB Mass Storage Attached (SanDisk Ultra 30.8 GB)",
                "description": (
                    "Syslog kernel messages confirm physical attachment of SanDisk Ultra USB 3.0 "
                    "(Serial Number: USB-998877, Vendor ID: 0781, Product ID: 5583) to Alice-WKS-01 on bus 2-1.3."
                ),
                "epistemic_tier": EpistemicTier.VERIFIED_OBSERVATION,
                "confidence_score": 1.0,
                "citations": usb_obs_ids[:3],
                "reasoning": None,
            },
            {
                "id": "fnd-002",
                "title": "Interactive Remote SSH Login by Account 'alice'",
                "description": (
                    "Auth subsystem recorded accepted SSH password authentication for account 'alice' "
                    "from IP 10.0.1.55 on port 52341 at 08:00:12 UTC, followed by PAM session initialization."
                ),
                "epistemic_tier": EpistemicTier.VERIFIED_OBSERVATION,
                "confidence_score": 1.0,
                "citations": ssh_obs_ids[:2],
                "reasoning": None,
            },
            {
                "id": "fnd-003",
                "title": "Unauthorized Access to Proprietary Core Algorithm (algo_v2.py)",
                "description": (
                    "File server audit logs verify access to \\\\fileserver\\restricted\\R&D\\algo_v2.py "
                    "by user 'alice' at 08:20:14 UTC. File payload size: 48,230 bytes."
                ),
                "epistemic_tier": EpistemicTier.VERIFIED_OBSERVATION,
                "confidence_score": 1.0,
                "citations": file_obs_ids[:1],
                "reasoning": None,
            },
            {
                "id": "fnd-004",
                "title": "Data Exfiltration of Trade Secret Source Code to Removable Media",
                "description": (
                    "Analytical synthesis indicates unauthorized exfiltration of proprietary R&D source code "
                    "to external storage media USB-998877. The file algo_v2.py was read from the secure network "
                    "share and immediately written to destination E:\\exfil_backup\\algo_v2.py."
                ),
                "epistemic_tier": EpistemicTier.INFERENCE,
                "confidence_score": 0.95,
                "citations": [
                    *file_obs_ids,
                    *usb_obs_ids[:2],
                    *ssh_obs_ids[:1],
                ],
                "reasoning": (
                    "Temporal correlation: USB device was connected at 08:15:03 UTC. algo_v2.py was read at "
                    "08:20:14 UTC (48,230 bytes) and written to mount point E:\\exfil_backup at 08:22:07 UTC (48,230 bytes). "
                    "The device was disconnected at 08:25:11 UTC. Identical byte size transfer within 1 minute 53 seconds "
                    "proves direct copy from secure share to external media."
                ),
            },
            {
                "id": "fnd-005",
                "title": "Hypothesized Pre-Resignation Intellectual Property Theft Scheme",
                "description": (
                    "The deliberate selection of algo_v2.py without accompanying general development activity "
                    "suggests planned insider harvesting rather than inadvertent policy non-compliance."
                ),
                "epistemic_tier": EpistemicTier.HYPOTHESIS,
                "confidence_score": 0.74,
                "citations": all_obs_ids[:4],
                "reasoning": (
                    "Hypothesis requires corroboration against HR exit interview records, employee badge access logs, "
                    "and git repository commit history to determine whether Alice recently submitted resignation notice."
                ),
            },
        ]

        for f_spec in finding_specs:
            existing_fnd = await db.get(Finding, f_spec["id"])
            if not existing_fnd:
                fnd = Finding(
                    id=f_spec["id"],
                    case_id=CASE_ID,
                    title=f_spec["title"],
                    description=f_spec["description"],
                    epistemic_tier=f_spec["epistemic_tier"],
                    confidence_score=f_spec["confidence_score"],
                    supporting_observation_ids=json.dumps(f_spec["citations"]),
                    reasoning=f_spec["reasoning"],
                    created_by="local-investigator",
                )
                db.add(fnd)
                print(f"  [OK] Finding [{f_spec['epistemic_tier'].value.upper()}]: {f_spec['title'][:60]}... ({len(f_spec['citations'])} citations)")
        await db.flush()

        # ─── 8. Timeline Events ──────────────────────────────────────────────
        print("\n[*] Seeding timeline events...")
        tl_stmt = select(Event).where(Event.case_id == CASE_ID)
        existing_events = (await db.execute(tl_stmt)).scalars().all()

        if not existing_events:
            timeline_events = [
                {
                    "event_type": "authentication",
                    "summary": "Alice authenticated via SSH from 10.0.1.55 to Alice-WKS-01",
                    "event_time_utc": datetime(2026, 10, 10, 8, 0, 12, tzinfo=timezone.utc),
                    "original_time_string": "Oct 10 08:00:12",
                    "source_timezone": "UTC",
                    "time_quality": TimeQuality.PRECISE,
                    "source_observation_ids": json.dumps(ssh_obs_ids[:1]),
                },
                {
                    "event_type": "usb_connection",
                    "summary": "USB mass storage device connected — SanDisk Ultra USB 3.0 (S/N: USB-998877, 30.8 GB)",
                    "event_time_utc": datetime(2026, 10, 10, 8, 15, 3, tzinfo=timezone.utc),
                    "original_time_string": "Oct 10 08:15:03",
                    "source_timezone": "UTC",
                    "time_quality": TimeQuality.PRECISE,
                    "source_observation_ids": json.dumps(usb_obs_ids[:2]),
                },
                {
                    "event_type": "file_access",
                    "summary": "Alice accessed restricted file: \\\\fileserver\\restricted\\R&D\\algo_v2.py (48,230 bytes READ)",
                    "event_time_utc": datetime(2026, 10, 10, 8, 20, 14, tzinfo=timezone.utc),
                    "original_time_string": "2026-10-10T08:20:14Z",
                    "source_timezone": "UTC",
                    "time_quality": TimeQuality.PRECISE,
                    "source_observation_ids": json.dumps(file_obs_ids[:1]),
                },
                {
                    "event_type": "file_copy",
                    "summary": "Alice copied algo_v2.py to USB drive E:\\exfil_backup\\ (48,230 bytes COPY -> WRITE)",
                    "event_time_utc": datetime(2026, 10, 10, 8, 22, 7, tzinfo=timezone.utc),
                    "original_time_string": "2026-10-10T08:22:07Z",
                    "source_timezone": "UTC",
                    "time_quality": TimeQuality.PRECISE,
                    "source_observation_ids": json.dumps(file_obs_ids[1:2]),
                },
                {
                    "event_type": "usb_disconnection",
                    "summary": "USB device disconnected from Alice-WKS-01",
                    "event_time_utc": datetime(2026, 10, 10, 8, 25, 11, tzinfo=timezone.utc),
                    "original_time_string": "Oct 10 08:25:11",
                    "source_timezone": "UTC",
                    "time_quality": TimeQuality.PRECISE,
                    "source_observation_ids": json.dumps(usb_obs_ids[-1:]),
                },
            ]

            for te in timeline_events:
                event = Event(case_id=CASE_ID, **te)
                db.add(event)
                print(f"  [OK] Event [{te['event_type']}] {te['event_time_utc'].strftime('%H:%M:%S')} -- {te['summary'][:65]}...")
        else:
            print(f"  [OK] Timeline events already loaded ({len(existing_events)} events)")

        await db.commit()

        print("\n=================================================================")
        print(f"  [OK] Complete scenario loaded successfully for Case {CASE_ID}")
        print("  [OK] Phase 6 Observations, Phase 7 Graph, Phase 8 Findings ACTIVE")
        print("=================================================================\n")


if __name__ == "__main__":
    force_reload = "--force" in sys.argv
    asyncio.run(load_scenario(force=force_reload))
