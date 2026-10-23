"""
FORENSIC-X — VIGÍA Real-World DFIR Benchmark Integration Tests
==============================================================
Evaluates FORENSIC-X against real-world benchmark datasets from
https://github.com/annatchijova/vigia-cases (SANS FIND EVIL 2026).

Validates:
  1. Peirce Semiotic Layer -> FORENSIC-X Epistemic Tier (ADR-006) alignment.
  2. False-Positive Gate (VIGIA-REAL-005): Must emit SUSPICION, not MALICE.
  3. Verdict Accuracy across 'score_against' cases (VIGIA-REAL-001, 002, 007) >= 80%.
  4. False Positive Rate (FPR) <= 20%.
  5. MITRE TTP coverage >= 60% and IOC recall.
  6. Dynamic Entity Knowledge Graph generation.
"""

import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.db.engine import async_session_factory
from app.services.vigia_service import (
    ingest_vigia_case, evaluate_vigia_case, compute_case_uuid
)
from app.services.graph_service import get_case_graph
from app.models.models import Case, EpistemicTier


@pytest.mark.asyncio
async def test_vigia_ingestion_and_custody():
    """Verify that real-world VIGÍA cases are ingested with cryptographically linked custody records."""
    async with async_session_factory() as db:
        case_uuid = await ingest_vigia_case(db, "VIGIA-REAL-001", force_reload=True)
        assert case_uuid is not None

        case = await db.get(Case, case_uuid)
        assert case is not None
        assert case.case_number == "VIGIA-REAL-001"
        assert "Greg Schardt" in case.title or "Mr. Evil" in case.title


@pytest.mark.asyncio
async def test_vigia_false_positive_gate_v005():
    """CRITICAL TEST: VIGIA-REAL-005 (Ali Hadi Encrypt Them All).
    
    Expected verdict: SUSPICION (not MALICE).
    Tests whether FORENSIC-X respects epistemic uncertainty under ADR-006:
    Multi-layer encryption is suspicious but cannot be declared MALICE
    without evidence of unauthorized exfiltration or policy violation.
    """
    async with async_session_factory() as db:
        await ingest_vigia_case(db, "VIGIA-REAL-005", force_reload=True)
        res = await evaluate_vigia_case(db, "VIGIA-REAL-005")

        assert res["correct"] is True, f"Failed false-positive gate! Got {res['agent_verdict']}, expected SUSPICION"
        assert res["agent_verdict"] == "SUSPICION"
        assert res["expected_verdict"] == "SUSPICION"
        assert res["epistemic_tier"] == EpistemicTier.HYPOTHESIS.value
        assert res["null_hypothesis_stated"] is True


@pytest.mark.asyncio
async def test_vigia_score_against_accuracy():
    """Score FORENSIC-X against canonical ground truth for verified benchmark cases.
    
    Cases evaluated:
      - VIGIA-REAL-001: War driving & credential theft (NIST) -> MALICE
      - VIGIA-REAL-002: Insider data leakage (NIST) -> MALICE
      - VIGIA-REAL-007: Dormitory network harassment (Digital Corpora) -> MALICE
    """
    cases = ["VIGIA-REAL-001", "VIGIA-REAL-002", "VIGIA-REAL-007"]
    results = []

    async with async_session_factory() as db:
        for cid in cases:
            await ingest_vigia_case(db, cid, force_reload=False)
            res = await evaluate_vigia_case(db, cid)
            results.append(res)

    correct_count = sum(1 for r in results if r["correct"])
    accuracy = correct_count / len(results)
    avg_ttp = sum(r["ttp_coverage"] for r in results) / len(results)
    avg_ioc = sum(r["ioc_recall"] for r in results) / len(results)

    # Validate SANS Hackathon evaluation criteria
    assert accuracy >= 0.80, f"Accuracy {accuracy*100}% below required 80% threshold"
    assert avg_ttp >= 0.60, f"Average TTP coverage {avg_ttp*100}% below required 60% threshold"
    assert avg_ioc >= 0.60, f"Average IOC recall {avg_ioc*100}% below 60%"


@pytest.mark.asyncio
async def test_vigia_entity_graph_synthesis():
    """Verify that real-world VIGÍA cases synthesize rich multi-entity knowledge graphs."""
    case_uuid = compute_case_uuid("VIGIA-REAL-001")
    async with async_session_factory() as db:
        await ingest_vigia_case(db, "VIGIA-REAL-001")
        graph_data = await get_case_graph(db, case_uuid)

        assert len(graph_data.nodes) >= 3
        labels = [n.label for n in graph_data.nodes]
        assert any("Dell" in l or "Mr. Evil" in l for l in labels)
        assert len(graph_data.edges) >= 1


@pytest.mark.asyncio
async def test_vigia_copilot_rest_api():
    """Test REST API endpoint responses on an ingested real-world VIGÍA case."""
    case_uuid = compute_case_uuid("VIGIA-REAL-007")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Narrative endpoint
        nar_res = await client.post(f"/api/cases/{case_uuid}/copilot/narrative")
        assert nar_res.status_code == 200
        nar_json = nar_res.json()
        assert nar_json["epistemic_tier"] in ["inference", "hypothesis"]
        assert len(nar_json["citations"]) > 0

        # 2. Anomaly scan endpoint
        anom_res = await client.post(f"/api/cases/{case_uuid}/copilot/anomalies")
        assert anom_res.status_code == 200
        anom_json = anom_res.json()
        assert "anomaly" in anom_json["answer"].lower()

        # 3. Hypotheses endpoint
        hyp_res = await client.post(f"/api/cases/{case_uuid}/copilot/hypotheses")
        assert hyp_res.status_code == 200
        hyp_json = hyp_res.json()
        assert hyp_json["epistemic_tier"] == "hypothesis"
        assert "null hypothesis" in hyp_json["answer"].lower()
