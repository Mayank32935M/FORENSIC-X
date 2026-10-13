"""
FORENSIC-X — Finding Pydantic Schemas
=====================================
API contracts for Analytical Findings with Epistemic Tiers.

Status: IMPLEMENTED (Phase 8)
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

from app.models.models import EpistemicTier


class FindingBase(BaseModel):
    title: str = Field(..., max_length=255, description="Concise forensic finding summary")
    description: str = Field(..., description="Detailed analytical description of the finding")
    epistemic_tier: EpistemicTier = Field(
        ...,
        description="Epistemic tier: verified_observation, inference, or hypothesis",
    )
    confidence_score: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Heuristic confidence rating (0.0 - 1.0)",
    )
    supporting_observation_ids: List[str] = Field(
        default_factory=list,
        description="IDs of extracted observations cited as factual basis",
    )
    reasoning: Optional[str] = Field(
        default=None,
        description="Required logic explaining how observations lead to this inference",
    )


class FindingCreate(FindingBase):
    pass


class FindingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    epistemic_tier: Optional[EpistemicTier] = None
    confidence_score: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    supporting_observation_ids: Optional[List[str]] = None
    reasoning: Optional[str] = None


class FindingRead(BaseModel):
    id: str
    case_id: str
    title: str
    description: str
    epistemic_tier: EpistemicTier
    confidence_score: Optional[float] = None
    supporting_observation_ids: List[str] = []
    reasoning: Optional[str] = None
    created_at: datetime
    created_by: str

    model_config = {"from_attributes": True}


class FindingsSummaryResponse(BaseModel):
    case_id: str
    total_findings: int
    verified_observations: int
    inferences: int
    hypotheses: int
    citation_coverage_pct: float
