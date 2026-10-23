"""
FORENSIC-X — VIGÍA Cases Loader Script
======================================
CLI tool to ingest real-world DFIR benchmark cases from
https://github.com/annatchijova/vigia-cases into the FORENSIC-X database.

Usage:
  python -m app.scripts.load_vigia_cases [--all | --case CASE_ID] [--force]
"""

import argparse
import asyncio
import sys
from pathlib import Path

# Ensure backend root is on path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from app.db.engine import async_session_factory, engine
from app.db.base import Base
from app.services.vigia_service import (
    load_vigia_index, ingest_vigia_case, evaluate_vigia_case
)


async def _ensure_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def main():
    parser = argparse.ArgumentParser(description="Ingest VIGÍA real-world DFIR benchmark cases.")
    parser.add_argument("--all", action="store_true", help="Ingest all 10 VIGÍA cases")
    parser.add_argument("--case", type=str, default=None, help="Specific case ID to ingest (e.g. VIGIA-REAL-001)")
    parser.add_argument("--force", action="store_true", help="Force reload existing cases")
    parser.add_argument("--evaluate", action="store_true", help="Run evaluation after ingestion")
    args = parser.parse_args()

    await _ensure_tables()
    index_data = load_vigia_index()
    available_cases = [c["case_id"] for c in index_data.get("cases", [])]

    if args.case:
        cases_to_load = [args.case.upper()]
    elif args.all:
        cases_to_load = available_cases
    else:
        # Default: load primary score_against cases + false positive gate
        cases_to_load = ["VIGIA-REAL-001", "VIGIA-REAL-002", "VIGIA-REAL-005", "VIGIA-REAL-007"]

    print("\n=================================================================")
    print("  FORENSIC-X — Ingesting Real-World VIGÍA Benchmark Cases")
    print("=================================================================\n")

    async with async_session_factory() as db:
        for cid in cases_to_load:
            print(f"[*] Ingesting {cid}...")
            try:
                case_uuid = await ingest_vigia_case(db, cid, force_reload=args.force)
                print(f"    [+] Successfully ingested as Case UUID: {case_uuid}")

                if args.evaluate:
                    print(f"    [*] Evaluating {cid} against Ground Truth...")
                    eval_result = await evaluate_vigia_case(db, cid)
                    print(f"        Verdict: {eval_result['agent_verdict']} (Expected: {eval_result['expected_verdict']}) — Correct: {eval_result['correct']}")
                    print(f"        TTP Coverage: {eval_result['ttp_coverage']*100:.1f}%, IOC Recall: {eval_result['ioc_recall']*100:.1f}%")
            except Exception as e:
                print(f"    [!] Error ingesting {cid}: {e}")

    print("\n[+] Ingestion complete.\n")


if __name__ == "__main__":
    asyncio.run(main())
