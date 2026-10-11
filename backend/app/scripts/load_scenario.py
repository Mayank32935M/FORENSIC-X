"""
FORENSIC-X Backend — Scenario Loader
======================================
Seeds the database with the "Phantom Exfiltration" synthetic scenario.

Creates:
  - 1 Case (INS-2026-0042)
  - 3 Evidence items (syslog, file_access CSV, auth.log)
  - Chain-of-custody records for each evidence item
  - 5 Timeline events reconstructing Alice's exfiltration

Run with:
  python -m app.scripts.load_scenario

Status: IMPLEMENTED
"""

import asyncio
import shutil
from pathlib import Path
from datetime import datetime, timezone

# Ensure app modules resolve
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from sqlalchemy import select
from app.db.engine import async_session_factory, engine
from app.db.base import Base
from app.models.models import (
    Case, CaseStatus, EvidenceItem, CustodyAction, Event, TimeQuality, Device,
)
from app.services.custody_service import append_custody_record
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


async def _case_exists(db) -> bool:
    stmt = select(Case).where(Case.id == CASE_ID)
    result = await db.execute(stmt)
    return result.scalars().first() is not None


async def load_scenario():
    """Load the complete Phantom Exfiltration scenario."""
    await _ensure_tables()

    async with async_session_factory() as db:
        if await _case_exists(db):
            print(f"[!] Scenario case {CASE_ID[:8]}... already exists. Skipping to avoid duplicates.")
            return

        print("=================================================================")
        print("  FORENSIC-X -- Loading Synthetic Scenario: The Phantom Exfiltration")
        print("=================================================================\n")

        # ─── 1. Create Case ──────────────────────────────────────────────
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

        # ─── 2. Create Devices ───────────────────────────────────────────
        wks = Device(
            id="dev-001",
            case_id=CASE_ID,
            name="Alice-WKS-01",
            device_type="laptop",
            os_info="Windows 11 Enterprise",
            description="Alice's corporate workstation",
        )
        usb = Device(
            id="dev-002",
            case_id=CASE_ID,
            name="Unknown USB Drive",
            device_type="usb",
            serial_number="USB-998877",
            description="SanDisk Ultra USB 3.0 — 30.8 GB",
        )
        db.add_all([wks, usb])
        await db.flush()
        print(f"[OK] Devices registered: {wks.name}, {usb.name} (S/N: {usb.serial_number})")

        # ─── 3. Ingest Evidence Files ────────────────────────────────────
        evidence_store = Path(settings.evidence_store_path) / CASE_ID
        evidence_store.mkdir(parents=True, exist_ok=True)

        evidence_files = [
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
        for ef in evidence_files:
            src = SYNTHETIC_DIR / ef["filename"]
            dst = evidence_store / ef["filename"]

            if not src.exists():
                print(f"  [FAIL] Synthetic file not found: {src}")
                continue

            # Copy to evidence store (immutable copy)
            shutil.copy2(src, dst)
            file_hash = compute_file_hash(dst)
            file_size = dst.stat().st_size

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
            created_evidence.append(ev)

            # Chain of custody: ACQUIRED
            await append_custody_record(
                db,
                case_id=CASE_ID,
                action=CustodyAction.ACQUIRED,
                evidence_item_id=ev.id,
                actor="local-investigator",
                description=f"Ingested {ef['filename']} ({file_size} bytes, SHA-256: {file_hash[:16]}...)",
            )
            print(f"  [OK] Evidence ingested: {ef['filename']} ({file_size:,} bytes) -- SHA-256: {file_hash[:16]}...")

        # ─── 4. Create Timeline Events ───────────────────────────────────
        print()
        timeline_events = [
            {
                "event_type": "authentication",
                "summary": "Alice authenticated via SSH from 10.0.1.55 to Alice-WKS-01",
                "event_time_utc": datetime(2026, 10, 10, 8, 0, 12, tzinfo=timezone.utc),
                "original_time_string": "Oct 10 08:00:12",
                "source_timezone": "UTC",
                "time_quality": TimeQuality.PRECISE,
            },
            {
                "event_type": "usb_connection",
                "summary": "USB mass storage device connected — SanDisk Ultra USB 3.0 (S/N: USB-998877, 30.8 GB)",
                "event_time_utc": datetime(2026, 10, 10, 8, 15, 3, tzinfo=timezone.utc),
                "original_time_string": "Oct 10 08:15:03",
                "source_timezone": "UTC",
                "time_quality": TimeQuality.PRECISE,
            },
            {
                "event_type": "file_access",
                "summary": "Alice accessed restricted file: \\\\fileserver\\restricted\\R&D\\algo_v2.py (48,230 bytes READ)",
                "event_time_utc": datetime(2026, 10, 10, 8, 20, 14, tzinfo=timezone.utc),
                "original_time_string": "2026-10-10T08:20:14Z",
                "source_timezone": "UTC",
                "time_quality": TimeQuality.PRECISE,
            },
            {
                "event_type": "file_copy",
                "summary": "Alice copied algo_v2.py to USB drive E:\\exfil_backup\\ (48,230 bytes COPY -> WRITE)",
                "event_time_utc": datetime(2026, 10, 10, 8, 22, 7, tzinfo=timezone.utc),
                "original_time_string": "2026-10-10T08:22:07Z",
                "source_timezone": "UTC",
                "time_quality": TimeQuality.PRECISE,
            },
            {
                "event_type": "usb_disconnection",
                "summary": "USB device disconnected from Alice-WKS-01",
                "event_time_utc": datetime(2026, 10, 10, 8, 25, 11, tzinfo=timezone.utc),
                "original_time_string": "Oct 10 08:25:11",
                "source_timezone": "UTC",
                "time_quality": TimeQuality.PRECISE,
            },
        ]

        for te in timeline_events:
            event = Event(case_id=CASE_ID, **te)
            db.add(event)
            print(f"  [OK] Event [{te['event_type']}] {te['event_time_utc'].strftime('%H:%M:%S')} -- {te['summary'][:70]}...")

        await db.commit()

        print("\n=================================================================")
        print(f"  [OK] Scenario loaded: {len(created_evidence)} evidence items, {len(timeline_events)} timeline events")
        print(f"  [OK] Case ID: {CASE_ID}")
        print(f"  [OK] Evidence store: {evidence_store}")
        print("=================================================================\n")


if __name__ == "__main__":
    asyncio.run(load_scenario())
