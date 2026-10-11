"""
FORENSIC-X Backend — Case Service
===================================
Business logic for Case entities.

Status: IMPLEMENTED
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

from app.models.models import Case, AuditLogEntry
from app.schemas.case import CaseCreate, CaseUpdate
from app.core.logging import get_logger

logger = get_logger(__name__)


async def get_case(db: AsyncSession, case_id: str) -> Case | None:
    return await db.get(Case, case_id)


async def get_cases(db: AsyncSession, skip: int = 0, limit: int = 100) -> list[Case]:
    stmt = select(Case).order_by(Case.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def create_case(db: AsyncSession, case_in: CaseCreate, actor: str = "local-investigator") -> Case:
    # Check if case number exists
    stmt = select(Case).where(Case.case_number == case_in.case_number)
    result = await db.execute(stmt)
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Case number already exists")

    db_case = Case(
        case_number=case_in.case_number,
        title=case_in.title,
        description=case_in.description,
        created_by=actor
    )
    db.add(db_case)
    
    # Audit log
    db.add(AuditLogEntry(
        action="CREATE_CASE",
        entity_type="Case",
        entity_id=db_case.id,
        actor=actor,
        detail=f"Created case {db_case.case_number}"
    ))
    
    await db.commit()
    await db.refresh(db_case)
    logger.info("case_created", case_id=db_case.id, case_number=db_case.case_number)
    return db_case
