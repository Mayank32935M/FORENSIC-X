"""
FORENSIC-X Backend — Evidence Pydantic Schemas
================================================
API contracts for EvidenceItem and Chain-of-Custody entities.

Status: IMPLEMENTED
"""

from datetime import datetime
from pydantic import BaseModel, Field


# ─── Evidence Item ────────────────────────────────────────────────────────────

class EvidenceItemRead(BaseModel):
    """Read-only representation of an ingested evidence artifact."""
    id: str
    case_id: str
    original_filename: str
    file_size_bytes: int | None = None
    mime_type: str | None = None
    hash_sha256: str | None = None
    hash_algorithm: str = "sha256"
    acquired_at: datetime | None = None
    acquired_by: str | None = None
    acquisition_method: str | None = None
    storage_path: str | None = None
    source_description: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class EvidenceItemCreate(BaseModel):
    """Manual evidence creation (without file upload)."""
    original_filename: str = Field(..., max_length=500)
    mime_type: str | None = Field(default=None, max_length=100)
    source_description: str | None = None
    acquisition_method: str | None = Field(default=None, max_length=200)
    acquired_by: str | None = Field(default="local-investigator", max_length=100)


# ─── Chain-of-Custody ────────────────────────────────────────────────────────

class CustodyRecordRead(BaseModel):
    """Read-only representation of a chain-of-custody entry."""
    id: str
    case_id: str
    evidence_item_id: str | None = None
    action: str
    actor: str
    description: str | None = None
    timestamp: datetime
    prior_record_hash: str | None = None

    model_config = {"from_attributes": True}


class CustodyVerifyResponse(BaseModel):
    """Result of a chain-of-custody integrity verification."""
    case_id: str
    evidence_item_id: str | None = None
    chain_valid: bool
    record_count: int
    message: str


# ─── Timeline Events ─────────────────────────────────────────────────────────

class TimelineEventRead(BaseModel):
    """Read-only representation of a timeline event."""
    id: str
    case_id: str
    event_type: str
    summary: str
    event_time_utc: datetime
    original_time_string: str | None = None
    source_timezone: str | None = None
    time_quality: str | None = None
    source_observation_ids: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
