"""
FORENSIC-X Backend — Evidence Service
=======================================
Business logic for evidence ingestion, file storage, and integrity verification.

WHY: Evidence ingestion is the critical entry point. Every file that enters
the system must be:
  1. Written to the immutable evidence store (never overwritten).
  2. SHA-256 hashed on write.
  3. Recorded in the database with metadata.
  4. Logged in the chain of custody as an ACQUIRED action.

Status: IMPLEMENTED
"""

import os
import shutil
from pathlib import Path
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException, UploadFile

from app.models.models import EvidenceItem, Case, CustodyAction, Event, TimeQuality
from app.schemas.evidence import EvidenceItemCreate
from app.services.custody_service import append_custody_record
from app.core.hashing import compute_file_hash
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


async def ingest_evidence(
    db: AsyncSession,
    case_id: str,
    file: UploadFile,
    source_description: str | None = None,
    acquisition_method: str = "manual-upload",
    actor: str = "local-investigator",
) -> EvidenceItem:
    """Ingest an evidence file: store it, hash it, record it, and log custody.

    Steps:
      1. Verify the case exists.
      2. Write the uploaded file to evidence_store/<case_id>/<filename>.
      3. Compute SHA-256 of the stored file.
      4. Create an EvidenceItem record in the database.
      5. Append a chain-of-custody ACQUIRED record.

    Returns:
        The created EvidenceItem.
    """
    # 1. Verify case exists
    case = await db.get(Case, case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

    # 2. Write file to evidence store
    store_dir = Path(settings.evidence_store_path) / case_id
    store_dir.mkdir(parents=True, exist_ok=True)

    # Prevent overwrites: if file exists, append a counter
    dest_path = store_dir / file.filename
    if dest_path.exists():
        stem = dest_path.stem
        suffix = dest_path.suffix
        counter = 1
        while dest_path.exists():
            dest_path = store_dir / f"{stem}_{counter}{suffix}"
            counter += 1

    # Stream-write the uploaded file
    with open(dest_path, "wb") as out:
        while chunk := await file.read(8192):
            out.write(chunk)

    file_size = dest_path.stat().st_size
    logger.info("evidence_file_stored", path=str(dest_path), size=file_size)

    # 3. Compute SHA-256
    file_hash = compute_file_hash(dest_path)

    # 4. Create database record
    # Store relative path from project root for portability
    relative_path = str(dest_path.relative_to(Path(settings.evidence_store_path).parent.parent))

    evidence = EvidenceItem(
        case_id=case_id,
        original_filename=file.filename,
        file_size_bytes=file_size,
        mime_type=file.content_type or "application/octet-stream",
        hash_sha256=file_hash,
        hash_algorithm="sha256",
        acquired_at=datetime.now(timezone.utc),
        acquired_by=actor,
        acquisition_method=acquisition_method,
        storage_path=relative_path,
        source_description=source_description,
    )
    db.add(evidence)
    await db.flush()  # Get the ID before committing

    # 5. Chain-of-custody: ACQUIRED
    await append_custody_record(
        db,
        case_id=case_id,
        action=CustodyAction.ACQUIRED,
        evidence_item_id=evidence.id,
        actor=actor,
        description=f"Ingested {file.filename} ({file_size} bytes, SHA-256: {file_hash[:16]}...)",
    )

    await db.commit()
    await db.refresh(evidence)

    logger.info(
        "evidence_ingested",
        evidence_id=evidence.id,
        filename=file.filename,
        hash=file_hash[:16],
        case_id=case_id,
    )
    return evidence


async def create_evidence_record(
    db: AsyncSession,
    case_id: str,
    evidence_in: EvidenceItemCreate,
    actor: str = "local-investigator",
) -> EvidenceItem:
    """Create an evidence record without file upload (metadata-only).
    Used when the file is already in the evidence store or for synthetic data.
    """
    case = await db.get(Case, case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

    evidence = EvidenceItem(
        case_id=case_id,
        original_filename=evidence_in.original_filename,
        mime_type=evidence_in.mime_type,
        source_description=evidence_in.source_description,
        acquisition_method=evidence_in.acquisition_method,
        acquired_by=evidence_in.acquired_by or actor,
        acquired_at=datetime.now(timezone.utc),
    )
    db.add(evidence)
    await db.flush()

    await append_custody_record(
        db,
        case_id=case_id,
        action=CustodyAction.ACQUIRED,
        evidence_item_id=evidence.id,
        actor=actor,
        description=f"Registered evidence: {evidence_in.original_filename}",
    )

    await db.commit()
    await db.refresh(evidence)
    return evidence


async def get_evidence_items(
    db: AsyncSession, case_id: str, skip: int = 0, limit: int = 100
) -> list[EvidenceItem]:
    """Get all evidence items for a case."""
    stmt = (
        select(EvidenceItem)
        .where(EvidenceItem.case_id == case_id)
        .order_by(EvidenceItem.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_all_evidence(
    db: AsyncSession, skip: int = 0, limit: int = 100
) -> list[EvidenceItem]:
    """Get all evidence items across all cases."""
    stmt = (
        select(EvidenceItem)
        .order_by(EvidenceItem.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_evidence_item(db: AsyncSession, evidence_id: str) -> EvidenceItem | None:
    """Get a single evidence item by ID."""
    return await db.get(EvidenceItem, evidence_id)


async def verify_evidence_integrity(db: AsyncSession, evidence_id: str) -> dict:
    """Re-hash the evidence file on disk and compare to the stored hash.

    Returns a dict with the verification result.
    """
    evidence = await db.get(EvidenceItem, evidence_id)
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence item not found")

    if not evidence.storage_path:
        return {
            "evidence_id": evidence.id,
            "verified": False,
            "message": "No storage path recorded — cannot verify file integrity.",
        }

    # Resolve the full path
    full_path = Path(settings.evidence_store_path).parent.parent / evidence.storage_path
    if not full_path.is_file():
        return {
            "evidence_id": evidence.id,
            "verified": False,
            "message": f"File not found at {evidence.storage_path}",
        }

    current_hash = compute_file_hash(full_path)
    is_match = current_hash == evidence.hash_sha256

    # Log custody event for the verification
    await append_custody_record(
        db,
        case_id=evidence.case_id,
        action=CustodyAction.VERIFIED,
        evidence_item_id=evidence.id,
        actor="system-integrity-check",
        description=f"Integrity check: {'PASS' if is_match else 'FAIL'} (disk={current_hash[:16]}..., db={evidence.hash_sha256[:16]}...)",
    )

    return {
        "evidence_id": evidence.id,
        "verified": is_match,
        "stored_hash": evidence.hash_sha256,
        "current_hash": current_hash,
        "message": "Integrity verified — hashes match." if is_match else "INTEGRITY FAILURE — file has been modified since ingestion!",
    }


async def get_evidence_stats(db: AsyncSession, case_id: str) -> dict:
    """Get summary statistics for evidence in a case."""
    items = await get_evidence_items(db, case_id, limit=1000)
    total_size = sum(e.file_size_bytes or 0 for e in items)
    return {
        "case_id": case_id,
        "total_items": len(items),
        "total_size_bytes": total_size,
        "items_with_hash": sum(1 for e in items if e.hash_sha256),
    }
