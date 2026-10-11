"""
FORENSIC-X Backend — Timeline API Endpoints
=============================================
HTTP handlers for timeline events.

Status: IMPLEMENTED
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.db.engine import get_db
from app.schemas.evidence import TimelineEventRead
from app.services import timeline_service

router = APIRouter()


@router.get(
    "/cases/{case_id}/timeline",
    response_model=List[TimelineEventRead],
    tags=["Timeline"],
)
async def get_case_timeline(
    case_id: str,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=200, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
):
    """Get chronologically ordered timeline events for a case."""
    return await timeline_service.get_timeline(db, case_id, skip=skip, limit=limit)


@router.get(
    "/timeline",
    response_model=List[TimelineEventRead],
    tags=["Timeline"],
)
async def get_all_timeline(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=200, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
):
    """Get all timeline events across all cases, chronologically."""
    return await timeline_service.get_all_events(db, skip=skip, limit=limit)
