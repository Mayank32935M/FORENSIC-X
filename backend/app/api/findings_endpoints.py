"""
FORENSIC-X — Findings API Endpoints
====================================
HTTP handlers for analytical findings with epistemic tiers.

Status: IMPLEMENTED (Phase 8)
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.engine import get_db
from app.models.models import EpistemicTier
from app.schemas.finding import (
    FindingCreate,
    FindingRead,
    FindingUpdate,
    FindingsSummaryResponse,
)
from app.services import findings_service

router = APIRouter()


@router.get(
    "/cases/{case_id}/findings",
    response_model=List[FindingRead],
    tags=["Findings"],
)
async def list_findings(
    case_id: str,
    tier: Optional[EpistemicTier] = Query(default=None, description="Filter by epistemic tier"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all analytical findings for a case with optional tier filter."""
    return await findings_service.get_findings(
        db, case_id=case_id, epistemic_tier=tier, skip=skip, limit=limit
    )


@router.get(
    "/cases/{case_id}/findings/summary",
    response_model=FindingsSummaryResponse,
    tags=["Findings"],
)
async def get_findings_summary(
    case_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get epistemic distribution metrics and citation coverage for a case."""
    return await findings_service.get_findings_summary(db, case_id)


@router.post(
    "/cases/{case_id}/findings",
    response_model=FindingRead,
    status_code=status.HTTP_201_CREATED,
    tags=["Findings"],
)
async def create_finding(
    case_id: str,
    finding_in: FindingCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new analytical finding with assigned epistemic tier."""
    return await findings_service.create_finding(db, case_id, finding_in)


@router.get(
    "/findings/{finding_id}",
    response_model=FindingRead,
    tags=["Findings"],
)
async def get_finding(
    finding_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a single finding by ID."""
    finding = await findings_service.get_finding(db, finding_id)
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    return finding


@router.patch(
    "/findings/{finding_id}",
    response_model=FindingRead,
    tags=["Findings"],
)
async def update_finding(
    finding_id: str,
    finding_in: FindingUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update finding details, tier, or citations."""
    return await findings_service.update_finding(db, finding_id, finding_in)


@router.delete(
    "/findings/{finding_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Findings"],
)
async def delete_finding(
    finding_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Delete a finding."""
    await findings_service.delete_finding(db, finding_id)
    return None
