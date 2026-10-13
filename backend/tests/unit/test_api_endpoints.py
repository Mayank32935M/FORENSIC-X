"""
FORENSIC-X — API Endpoints Unit Tests
======================================
Tests for Observations, Knowledge Graph, and Epistemic Findings endpoints.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

CASE_ID = "e4f8d687-7a2e-4b68-80df-9c04df4a754b"


@pytest.mark.asyncio
async def test_health_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "ok"


@pytest.mark.asyncio
async def test_observations_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get(f"/api/cases/{CASE_ID}/observations")
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert "observation_type" in data[0]
        assert "content" in data[0]


@pytest.mark.asyncio
async def test_graph_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get(f"/api/cases/{CASE_ID}/graph")
        assert res.status_code == 200
        data = res.json()
        assert "nodes" in data
        assert "edges" in data
        assert "metrics" in data
        assert len(data["nodes"]) >= 5
        assert len(data["edges"]) >= 3


@pytest.mark.asyncio
async def test_findings_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get(f"/api/cases/{CASE_ID}/findings")
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)
        assert len(data) >= 3

        summary_res = await client.get(f"/api/cases/{CASE_ID}/findings/summary")
        assert summary_res.status_code == 200
        sum_data = summary_res.json()
        assert sum_data["total_findings"] >= 3
        assert sum_data["citation_coverage_pct"] > 50


@pytest.mark.asyncio
async def test_global_search_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/search?q=algo")
        assert res.status_code == 200
        data = res.json()
        assert "observations" in data
        assert "findings" in data
