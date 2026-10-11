"""
FORENSIC-X Backend — Evidence API Endpoints
=============================================
HTTP handlers for evidence ingestion, retrieval, and integrity verification.

Status: IMPLEMENTED
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.db.engine import get_db
from app.schemas.evidence import (
    EvidenceItemRead,
    EvidenceItemCreate,
    CustodyRecordRead,
    CustodyVerifyResponse,
)
from app.services import evidence_service, custody_service
from app.models.models import CustodyAction

router = APIRouter()


# ─── Evidence Items ──────────────────────────────────────────────────────────

@router.post(
    "/cases/{case_id}/evidence",
    response_model=EvidenceItemRead,
    status_code=201,
    tags=["Evidence"],
)
async def upload_evidence(
    case_id: str,
    file: UploadFile = File(...),
    source_description: str = Form(default=None),
    acquisition_method: str = Form(default="manual-upload"),
    db: AsyncSession = Depends(get_db),
):
    """Upload and ingest an evidence file for a case.

    The file is:
      1. Stored immutably in the evidence store.
      2. SHA-256 hashed on write.
      3. Recorded in the database.
      4. Logged in the chain of custody as ACQUIRED.
    """
    return await evidence_service.ingest_evidence(
        db,
        case_id=case_id,
        file=file,
        source_description=source_description,
        acquisition_method=acquisition_method,
    )


@router.post(
    "/cases/{case_id}/evidence/metadata",
    response_model=EvidenceItemRead,
    status_code=201,
    tags=["Evidence"],
)
async def create_evidence_metadata(
    case_id: str,
    evidence_in: EvidenceItemCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create an evidence record without file upload (metadata only).
    Used for synthetic data or when the file is already in the store.
    """
    return await evidence_service.create_evidence_record(db, case_id, evidence_in)


@router.get(
    "/cases/{case_id}/evidence",
    response_model=List[EvidenceItemRead],
    tags=["Evidence"],
)
async def list_case_evidence(
    case_id: str,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    """List all evidence items for a specific case."""
    return await evidence_service.get_evidence_items(db, case_id, skip=skip, limit=limit)


@router.get(
    "/evidence",
    response_model=List[EvidenceItemRead],
    tags=["Evidence"],
)
async def list_all_evidence(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    """List all evidence items across all cases."""
    return await evidence_service.get_all_evidence(db, skip=skip, limit=limit)


@router.get(
    "/evidence/{evidence_id}",
    response_model=EvidenceItemRead,
    tags=["Evidence"],
)
async def get_evidence(
    evidence_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific evidence item by ID."""
    item = await evidence_service.get_evidence_item(db, evidence_id)
    if not item:
        raise HTTPException(status_code=404, detail="Evidence item not found")
    return item


@router.get(
    "/evidence/{evidence_id}/verify",
    tags=["Evidence"],
)
async def verify_evidence(
    evidence_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Verify the integrity of an evidence file by re-hashing and comparing."""
    return await evidence_service.verify_evidence_integrity(db, evidence_id)


@router.get(
    "/evidence/{evidence_id}/content",
    tags=["Evidence"],
)
async def get_evidence_content(
    evidence_id: str,
    max_bytes: int = Query(default=65536, ge=1, le=1048576),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve raw text or hex inspection preview of an evidence artifact and log access."""
    return await evidence_service.get_evidence_content(db, evidence_id, max_bytes=max_bytes)


@router.get(
    "/cases/{case_id}/evidence/stats",
    tags=["Evidence"],
)
async def evidence_stats(
    case_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get summary statistics for evidence in a case."""
    return await evidence_service.get_evidence_stats(db, case_id)


# ─── Chain of Custody ────────────────────────────────────────────────────────

@router.get(
    "/cases/{case_id}/custody",
    response_model=List[CustodyRecordRead],
    tags=["Chain of Custody"],
)
async def list_custody_records(
    case_id: str,
    db: AsyncSession = Depends(get_db),
):
    """List all chain-of-custody records for a case."""
    from sqlalchemy import select
    from app.models.models import ChainOfCustodyRecord

    stmt = (
        select(ChainOfCustodyRecord)
        .where(ChainOfCustodyRecord.case_id == case_id)
        .order_by(ChainOfCustodyRecord.timestamp.asc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get(
    "/cases/{case_id}/custody/verify",
    response_model=CustodyVerifyResponse,
    tags=["Chain of Custody"],
)
async def verify_custody_chain(
    case_id: str,
    evidence_item_id: str = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    """Verify the integrity of the chain-of-custody hash chain."""
    from sqlalchemy import select, func
    from app.models.models import ChainOfCustodyRecord

    is_valid = await custody_service.verify_chain(db, case_id, evidence_item_id)

    # Count records
    stmt = select(func.count()).select_from(ChainOfCustodyRecord).where(
        ChainOfCustodyRecord.case_id == case_id
    )
    if evidence_item_id:
        stmt = stmt.where(ChainOfCustodyRecord.evidence_item_id == evidence_item_id)
    result = await db.execute(stmt)
    count = result.scalar() or 0

    return CustodyVerifyResponse(
        case_id=case_id,
        evidence_item_id=evidence_item_id,
        chain_valid=is_valid,
        record_count=count,
        message="Chain of custody is intact." if is_valid else "CHAIN BROKEN — tampering detected!",
    )
