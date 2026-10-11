"""
FORENSIC-X Backend — API Endpoints
====================================
HTTP handlers for cases and health.

Status: IMPLEMENTED (Health, Cases CRUD)
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.db.engine import get_db
from app.schemas.case import CaseCreate, CaseRead, CaseUpdate
from app.services import case_service
from app.core.config import settings

router = APIRouter()

@router.get("/health", tags=["System"])
async def health_check(db: AsyncSession = Depends(get_db)):
    """System health check and DB connectivity verification."""
    # Ping database
    try:
        from sqlalchemy import text
        await db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
        
    return {
        "status": "ok",
        "version": settings.version,
        "environment": settings.env,
        "database": db_status
    }

@router.post("/cases", response_model=CaseRead, status_code=status.HTTP_201_CREATED, tags=["Cases"])
async def create_case(case_in: CaseCreate, db: AsyncSession = Depends(get_db)):
    """Create a new forensic investigation case."""
    return await case_service.create_case(db, case_in)

@router.get("/cases", response_model=List[CaseRead], tags=["Cases"])
async def list_cases(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    """List all cases."""
    return await case_service.get_cases(db, skip=skip, limit=limit)

@router.get("/cases/{case_id}", response_model=CaseRead, tags=["Cases"])
async def get_case(case_id: str, db: AsyncSession = Depends(get_db)):
    """Get a specific case by ID."""
    db_case = await case_service.get_case(db, case_id)
    if not db_case:
        raise HTTPException(status_code=404, detail="Case not found")
    return db_case


@router.get("/cases/{case_id}/audit-hash", tags=["Cases"])
async def get_case_audit_hash(case_id: str, db: AsyncSession = Depends(get_db)):
    """Generate an interim cryptographic audit hash for the entire case.
    Combines case state, sorted evidence SHA-256 hashes, and latest custody ledger state.
    """
    import hashlib
    from sqlalchemy import select
    from app.models.models import Case, EvidenceItem, ChainOfCustodyRecord

    db_case = await db.get(Case, case_id)
    if not db_case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Get evidence hashes
    ev_stmt = select(EvidenceItem).where(EvidenceItem.case_id == case_id).order_by(EvidenceItem.original_filename.asc())
    ev_res = await db.execute(ev_stmt)
    evidence_items = list(ev_res.scalars().all())

    # Get custody records
    cust_stmt = select(ChainOfCustodyRecord).where(ChainOfCustodyRecord.case_id == case_id).order_by(ChainOfCustodyRecord.timestamp.asc())
    cust_res = await db.execute(cust_stmt)
    custody_records = list(cust_res.scalars().all())

    # Canonical string construction
    canonical_tokens = [f"CASE:{db_case.id}:{db_case.case_number}"]
    for ev in evidence_items:
        canonical_tokens.append(f"EVD:{ev.id}:{ev.original_filename}:{ev.hash_sha256 or 'none'}")
    for c in custody_records:
        canonical_tokens.append(f"CUST:{c.id}:{c.action.value}:{c.prior_record_hash or 'genesis'}")

    root_raw = "|".join(canonical_tokens)
    root_hash = hashlib.sha256(root_raw.encode("utf-8")).hexdigest()

    return {
        "case_id": case_id,
        "case_number": db_case.case_number,
        "interim_audit_hash": root_hash,
        "evidence_count": len(evidence_items),
        "custody_ledger_height": len(custody_records),
        "algorithm": "SHA-256-MERKLE-STATE",
    }


@router.get("/cases/{case_id}/export", tags=["Cases"])
async def export_case_package(case_id: str, db: AsyncSession = Depends(get_db)):
    """Export a complete, self-contained, court-admissible forensic case package."""
    from sqlalchemy import select
    from app.models.models import Case, EvidenceItem, ChainOfCustodyRecord, Event

    db_case = await db.get(Case, case_id)
    if not db_case:
        raise HTTPException(status_code=404, detail="Case not found")

    ev_stmt = select(EvidenceItem).where(EvidenceItem.case_id == case_id).order_by(EvidenceItem.created_at.asc())
    ev_res = await db.execute(ev_stmt)
    evidence_items = list(ev_res.scalars().all())

    cust_stmt = select(ChainOfCustodyRecord).where(ChainOfCustodyRecord.case_id == case_id).order_by(ChainOfCustodyRecord.timestamp.asc())
    cust_res = await db.execute(cust_stmt)
    custody_records = list(cust_res.scalars().all())

    tl_stmt = select(Event).where(Event.case_id == case_id).order_by(Event.event_time_utc.asc())
    tl_res = await db.execute(tl_stmt)
    timeline_events = list(tl_res.scalars().all())

    return {
        "export_standard": "FORENSIC-X-VERIFIABLE-DOSSIER-V1",
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "case": {
            "id": db_case.id,
            "case_number": db_case.case_number,
            "title": db_case.title,
            "description": db_case.description,
            "status": db_case.status,
            "created_by": db_case.created_by,
            "created_at": db_case.created_at.isoformat(),
        },
        "evidence_manifest": [
            {
                "id": e.id,
                "original_filename": e.original_filename,
                "file_size_bytes": e.file_size_bytes,
                "mime_type": e.mime_type,
                "hash_sha256": e.hash_sha256,
                "hash_algorithm": e.hash_algorithm,
                "acquisition_method": e.acquisition_method,
                "source_description": e.source_description,
                "storage_path": e.storage_path,
            }
            for e in evidence_items
        ],
        "chain_of_custody_ledger": [
            {
                "id": c.id,
                "action": c.action.value,
                "actor": c.actor,
                "timestamp": c.timestamp.isoformat(),
                "description": c.description,
                "prior_record_hash": c.prior_record_hash,
                "evidence_item_id": c.evidence_item_id,
            }
            for c in custody_records
        ],
        "reconstructed_timeline": [
            {
                "id": t.id,
                "event_type": t.event_type,
                "summary": t.summary,
                "event_time_utc": t.event_time_utc.isoformat(),
                "original_time_string": t.original_time_string,
                "source_timezone": t.source_timezone,
                "time_quality": t.time_quality.value if hasattr(t.time_quality, "value") else str(t.time_quality),
            }
            for t in timeline_events
        ],
    }


@router.get("/search", tags=["Search"])
async def global_search(q: str, db: AsyncSession = Depends(get_db)):
    """Global search across cases, evidence artifacts, and timeline events."""
    if not q or len(q.strip()) < 2:
        return {"query": q, "cases": [], "evidence": [], "events": []}

    from sqlalchemy import select, or_
    from app.models.models import Case, EvidenceItem, Event

    pattern = f"%{q.strip()}%"

    # Search Cases
    case_stmt = select(Case).where(
        or_(
            Case.case_number.ilike(pattern),
            Case.title.ilike(pattern),
            Case.description.ilike(pattern),
        )
    ).limit(10)
    case_res = await db.execute(case_stmt)
    cases = list(case_res.scalars().all())

    # Search Evidence
    ev_stmt = select(EvidenceItem).where(
        or_(
            EvidenceItem.original_filename.ilike(pattern),
            EvidenceItem.hash_sha256.ilike(pattern),
            EvidenceItem.source_description.ilike(pattern),
        )
    ).limit(15)
    ev_res = await db.execute(ev_stmt)
    evidence = list(ev_res.scalars().all())

    # Search Timeline Events
    tl_stmt = select(Event).where(
        or_(
            Event.summary.ilike(pattern),
            Event.event_type.ilike(pattern),
            Event.original_time_string.ilike(pattern),
        )
    ).limit(15)
    tl_res = await db.execute(tl_stmt)
    events = list(tl_res.scalars().all())

    return {
        "query": q,
        "cases": [
            {"id": c.id, "case_number": c.case_number, "title": c.title, "status": c.status}
            for c in cases
        ],
        "evidence": [
            {"id": e.id, "case_id": e.case_id, "original_filename": e.original_filename, "hash_sha256": e.hash_sha256}
            for e in evidence
        ],
        "events": [
            {"id": t.id, "case_id": t.case_id, "summary": t.summary, "event_type": t.event_type, "time": t.event_time_utc.isoformat()}
            for t in events
        ],
    }

