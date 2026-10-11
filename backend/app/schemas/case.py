"""
FORENSIC-X Backend — Pydantic Schemas
=======================================
API contracts for Case entities.
"""

from datetime import datetime
from pydantic import BaseModel, Field

from app.models.models import CaseStatus


class CaseBase(BaseModel):
    title: str = Field(..., max_length=255, description="Title of the case")
    description: str | None = Field(default=None, description="Detailed case description")


class CaseCreate(CaseBase):
    case_number: str = Field(..., max_length=50, description="Unique case identifier/number")


class CaseRead(CaseBase):
    id: str
    case_number: str
    status: CaseStatus
    created_at: datetime
    updated_at: datetime
    created_by: str

    model_config = {"from_attributes": True}


class CaseUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    description: str | None = Field(default=None)
    status: CaseStatus | None = Field(default=None)
