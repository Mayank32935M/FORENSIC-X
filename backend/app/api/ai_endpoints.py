"""
FORENSIC-X — AI Copilot API Endpoints
======================================
HTTP handlers for AI forensics copilot and explainable interpretations.

Status: IMPLEMENTED (Phase 9)
"""

from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.engine import get_db
from app.schemas.ai import (
    CopilotQueryRequest, CopilotQueryResponse, AIInterpretationRead
)
from app.services import ai_copilot_service

router = APIRouter()


@router.post(
    "/cases/{case_id}/copilot/query",
    response_model=CopilotQueryResponse,
    tags=["AI Copilot"],
)
async def query_copilot(
    case_id: str,
    request: CopilotQueryRequest,
    db: AsyncSession = Depends(get_db),
):
    """Query the forensic AI copilot with natural language or analytical requests.
    
    Returns structured analytical deductions with strict epistemic tiers
    (INFERENCE or HYPOTHESIS) and precise observation citations.
    """
    return await ai_copilot_service.process_copilot_query(db, case_id, request)


@router.get(
    "/cases/{case_id}/copilot/history",
    response_model=List[AIInterpretationRead],
    tags=["AI Copilot"],
)
async def get_copilot_history(
    case_id: str,
    limit: int = Query(default=50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve audit history of all AI interpretations generated for this case."""
    return await ai_copilot_service.get_copilot_history(db, case_id, limit=limit)


@router.post(
    "/cases/{case_id}/copilot/narrative",
    response_model=CopilotQueryResponse,
    tags=["AI Copilot"],
)
async def generate_incident_narrative(
    case_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Synthesize a formal Incident Reconstruction Brief with chronological deltas ($T_0$)."""
    request = CopilotQueryRequest(
        query="Synthesize complete incident reconstruction narrative",
        mode="narrative"
    )
    return await ai_copilot_service.process_copilot_query(db, case_id, request)


@router.post(
    "/cases/{case_id}/copilot/anomalies",
    response_model=CopilotQueryResponse,
    tags=["AI Copilot"],
)
async def scan_for_anomalies(
    case_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Execute automated anomaly scanning across temporal windows, byte transfers, and identities."""
    request = CopilotQueryRequest(
        query="Run forensic anomaly scan",
        mode="anomaly"
    )
    return await ai_copilot_service.process_copilot_query(db, case_id, request)


@router.post(
    "/cases/{case_id}/copilot/hypotheses",
    response_model=CopilotQueryResponse,
    tags=["AI Copilot"],
)
async def formulate_hypotheses(
    case_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Formulate investigative hypotheses with corroboration checklists."""
    request = CopilotQueryRequest(
        query="Formulate investigative hypotheses",
        mode="hypothesis"
    )
    return await ai_copilot_service.process_copilot_query(db, case_id, request)
