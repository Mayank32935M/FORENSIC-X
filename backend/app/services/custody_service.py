"""
FORENSIC-X Backend — Chain of Custody Service
===============================================
Business logic for immutable evidence tracking.

Status: IMPLEMENTED (append-only logic)
"""

import hashlib
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

from app.models.models import ChainOfCustodyRecord, CustodyAction, EvidenceItem
from app.core.logging import get_logger

logger = get_logger(__name__)


def _compute_hash(data: str) -> str:
    """Compute SHA-256 hash of a string."""
    return hashlib.sha256(data.encode('utf-8')).hexdigest()

def _serialize_record(record: ChainOfCustodyRecord) -> str:
    """Serialize a record to a canonical string for hashing.
    Includes ID, case_id, evidence_item_id, action, actor, timestamp, and description.
    """
    ev_id = record.evidence_item_id or ""
    desc = record.description or ""
    # Format timestamp to ISO format string
    ts_str = record.timestamp.isoformat() if record.timestamp else ""
    return f"{record.id}|{record.case_id}|{ev_id}|{record.action.value}|{record.actor}|{desc}|{ts_str}"

async def append_custody_record(
    db: AsyncSession, 
    case_id: str,
    action: CustodyAction,
    evidence_item_id: str | None = None,
    actor: str = "local-investigator",
    description: str | None = None
) -> ChainOfCustodyRecord:
    """Append a new record to the chain of custody.
    Enforces the hash chain by linking to the previous record's hash.
    """
    # 1. Get the most recent record for this case/evidence (or just case if case-level)
    stmt = select(ChainOfCustodyRecord).where(
        ChainOfCustodyRecord.case_id == case_id
    )
    if evidence_item_id:
        stmt = stmt.where(ChainOfCustodyRecord.evidence_item_id == evidence_item_id)
    
    stmt = stmt.order_by(ChainOfCustodyRecord.timestamp.desc()).limit(1)
    result = await db.execute(stmt)
    latest_record = result.scalars().first()

    # 2. Calculate prior hash if a prior record exists
    prior_hash = None
    if latest_record:
        prior_hash = _compute_hash(_serialize_record(latest_record))

    # 3. Create new record
    new_record = ChainOfCustodyRecord(
        case_id=case_id,
        evidence_item_id=evidence_item_id,
        action=action,
        actor=actor,
        description=description,
        prior_record_hash=prior_hash
    )
    
    db.add(new_record)
    await db.commit()
    await db.refresh(new_record)
    
    logger.info("custody_record_appended", record_id=new_record.id, action=action.value, case_id=case_id)
    return new_record


async def verify_chain(db: AsyncSession, case_id: str, evidence_item_id: str | None = None) -> bool:
    """Verify the integrity of a chain of custody hash chain."""
    stmt = select(ChainOfCustodyRecord).where(
        ChainOfCustodyRecord.case_id == case_id
    )
    if evidence_item_id:
        stmt = stmt.where(ChainOfCustodyRecord.evidence_item_id == evidence_item_id)
        
    stmt = stmt.order_by(ChainOfCustodyRecord.timestamp.asc())
    result = await db.execute(stmt)
    records = list(result.scalars().all())
    
    if not records:
        return True # Empty chain is valid
        
    expected_prior_hash = None
    for record in records:
        if record.prior_record_hash != expected_prior_hash:
            logger.error("chain_of_custody_broken", record_id=record.id, expected=expected_prior_hash, actual=record.prior_record_hash)
            return False
            
        expected_prior_hash = _compute_hash(_serialize_record(record))
        
    return True
