"""
FORENSIC-X Backend — API Endpoints
====================================
HTTP handlers for cases and health.

Status: IMPLEMENTED (Health, Cases CRUD)
"""

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
