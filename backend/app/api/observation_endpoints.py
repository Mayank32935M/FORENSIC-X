"""
FORENSIC-X — Observation & Graph API Endpoints
================================================
HTTP handlers for observations, entity graph, and findings.

Status: IMPLEMENTED (Phase 6)
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.db.engine import get_db
from app.schemas.observation import ObservationRead, ParseResultResponse
from app.services import observation_service

router = APIRouter()


# ─── Parse Evidence ─────────────────────────────────────────────────────────

@router.post(
    "/evidence/{evidence_id}/parse",
    response_model=ParseResultResponse,
    tags=["Observations"],
)
async def parse_evidence(
    evidence_id: str,
    force: bool = Query(default=False, description="Force re-parse, clearing existing observations"),
    db: AsyncSession = Depends(get_db),
):
    """Trigger automated parsing of an evidence artifact.

    Runs the appropriate parser (syslog, auth, CSV) and extracts
    structured forensic observations with full source provenance.
    """
    result = await observation_service.parse_evidence(db, evidence_id, force=force)
    return result


# ─── List Observations ──────────────────────────────────────────────────────

@router.get(
    "/cases/{case_id}/observations",
    response_model=List[ObservationRead],
    tags=["Observations"],
)
async def list_observations(
    case_id: str,
    evidence_id: str = Query(default=None, description="Filter by evidence item"),
    observation_type: str = Query(default=None, description="Filter by observation type"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=200, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
):
    """List extracted observations for a case, with optional filters."""
    return await observation_service.get_observations(
        db, case_id,
        evidence_id=evidence_id,
        observation_type=observation_type,
        skip=skip,
        limit=limit,
    )


# ─── Get Single Observation ─────────────────────────────────────────────────

@router.get(
    "/observations/{observation_id}",
    response_model=ObservationRead,
    tags=["Observations"],
)
async def get_observation(
    observation_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific observation by ID."""
    obs = await observation_service.get_observation(db, observation_id)
    if not obs:
        raise HTTPException(status_code=404, detail="Observation not found")
    return obs


# ─── Observation Types (Facets) ──────────────────────────────────────────────

@router.get(
    "/cases/{case_id}/observations/types",
    tags=["Observations"],
)
async def observation_types(
    case_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get distinct observation types with counts for a case."""
    return await observation_service.get_observation_types(db, case_id)


# ─── Observation Count ──────────────────────────────────────────────────────

@router.get(
    "/cases/{case_id}/observations/count",
    tags=["Observations"],
)
async def observation_count(
    case_id: str,
    evidence_id: str = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    """Get count of observations for a case, optionally filtered by evidence item."""
    count = await observation_service.get_observation_count(
        db, case_id=case_id, evidence_id=evidence_id
    )
    return {"case_id": case_id, "evidence_id": evidence_id, "count": count}
