"""
FORENSIC-X — Observation Pydantic Schemas
==========================================
API contracts for Observations and parse results.

Status: IMPLEMENTED (Phase 6)
"""

from datetime import datetime
from pydantic import BaseModel


class ObservationRead(BaseModel):
    """Read-only representation of an extracted forensic observation."""
    id: str
    case_id: str
    evidence_item_id: str

    observation_type: str
    content: str

    # Source provenance
    source_file: str | None = None
    source_offset: str | None = None
    parser_name: str | None = None
    parser_version: str | None = None

    # Timestamps
    observed_time_utc: datetime | None = None
    original_time_string: str | None = None
    source_timezone: str | None = None
    time_quality: str | None = None

    processing_timestamp: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ParseResultResponse(BaseModel):
    """Result of a parse operation on an evidence artifact."""
    evidence_id: str
    status: str  # "parsed" | "already_parsed" | "no_parser"
    parser: str | None = None
    parser_version: str | None = None
    observation_count: int
    message: str
