"""
FORENSIC-X — Entity Graph Endpoints
====================================
HTTP handlers for forensic entity knowledge graph queries.

Status: IMPLEMENTED (Phase 7)
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.engine import get_db
from app.schemas.graph import GraphDataResponse
from app.services import graph_service

router = APIRouter()


@router.get(
    "/cases/{case_id}/graph",
    response_model=GraphDataResponse,
    tags=["Graph"],
)
async def get_case_entity_graph(
    case_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve the full entity knowledge graph and interconnected provenance for a case."""
    return await graph_service.get_case_graph(db, case_id)
