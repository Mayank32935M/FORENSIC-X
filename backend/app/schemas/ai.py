"""
FORENSIC-X — AI Copilot & Interpretation Schemas
=================================================
Pydantic contracts for AI-assisted forensic analysis and interpretations.

Status: IMPLEMENTED (Phase 9)
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

from app.models.models import EpistemicTier


class CopilotCitation(BaseModel):
    """Specific evidence or observation cited by the AI copilot."""
    id: str
    kind: str  # "observation" | "evidence" | "event"
    type: str  # e.g., "usb_connect", "file_copy", "syslog"
    summary: str
    source_ref: Optional[str] = None  # e.g. "auth.log: line 1"


class CopilotQueryRequest(BaseModel):
    """Request payload sent to the forensic copilot."""
    query: str = Field(..., min_length=2, max_length=2000, description="Investigation question or analytical prompt")
    mode: str = Field(default="qa", description="Analysis mode: 'qa' | 'narrative' | 'anomaly' | 'hypothesis'")


class CopilotQueryResponse(BaseModel):
    """Structured response from the forensic copilot with strict epistemic metadata."""
    id: str
    case_id: str
    query: str
    mode: str
    answer: str
    epistemic_tier: EpistemicTier
    confidence_score: float = Field(default=0.85, ge=0.0, le=1.0)
    cited_evidence_ids: List[str] = []
    cited_observation_ids: List[str] = []
    citations: List[CopilotCitation] = []
    suggested_followups: List[str] = []
    model_name: str
    prompt_version: str
    created_at: datetime


class AIInterpretationRead(BaseModel):
    """Persisted AI interpretation record for audit review."""
    id: str
    case_id: str
    finding_id: Optional[str] = None
    model_name: str
    model_version: Optional[str] = None
    prompt_version: Optional[str] = None
    interpretation: str
    epistemic_tier: EpistemicTier
    confidence_score: Optional[float] = None
    cited_evidence_ids: List[str] = []
    cited_observation_ids: List[str] = []
    created_at: datetime

    model_config = {"from_attributes": True}
