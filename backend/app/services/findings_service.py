"""
FORENSIC-X — Findings Service
==============================
Business logic for managing analytical findings with strict epistemic tiers.

Status: IMPLEMENTED (Phase 8)
"""

import json
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from fastapi import HTTPException

from app.models.models import Finding, EpistemicTier, Observation, Case
from app.schemas.finding import FindingCreate, FindingUpdate, FindingRead, FindingsSummaryResponse
from app.core.logging import get_logger

logger = get_logger(__name__)


def _model_to_read(finding: Finding) -> FindingRead:
    obs_ids = []
    if finding.supporting_observation_ids:
        try:
            obs_ids = json.loads(finding.supporting_observation_ids)
            if not isinstance(obs_ids, list):
                obs_ids = []
        except Exception:
            obs_ids = [s.strip() for s in finding.supporting_observation_ids.split(",") if s.strip()]

    return FindingRead(
        id=finding.id,
        case_id=finding.case_id,
        title=finding.title,
        description=finding.description,
        epistemic_tier=finding.epistemic_tier,
        confidence_score=finding.confidence_score,
        supporting_observation_ids=obs_ids,
        reasoning=finding.reasoning,
        created_at=finding.created_at,
        created_by=finding.created_by,
    )


async def get_findings(
    db: AsyncSession,
    case_id: str,
    epistemic_tier: Optional[EpistemicTier] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[FindingRead]:
    """Retrieve analytical findings for a case with optional tier filter."""
    stmt = (
        select(Finding)
        .where(Finding.case_id == case_id)
        .order_by(Finding.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    if epistemic_tier:
        stmt = stmt.where(Finding.epistemic_tier == epistemic_tier)

    result = await db.execute(stmt)
    findings = result.scalars().all()
    return [_model_to_read(f) for f in findings]


async def get_finding(db: AsyncSession, finding_id: str) -> Optional[FindingRead]:
    """Get a single finding by ID."""
    finding = await db.get(Finding, finding_id)
    if not finding:
        return None
    return _model_to_read(finding)


async def create_finding(
    db: AsyncSession,
    case_id: str,
    finding_in: FindingCreate,
    created_by: str = "local-investigator",
) -> FindingRead:
    """Create a new analytical finding.

    Validates that:
      - Case exists
      - Inferences have explicit reasoning
    """
    case = await db.get(Case, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    if finding_in.epistemic_tier == EpistemicTier.INFERENCE and not finding_in.reasoning:
        raise HTTPException(
            status_code=400,
            detail="Inferences require an explicit 'reasoning' field explaining the analytical leap from observations.",
        )

    json_obs_ids = json.dumps(finding_in.supporting_observation_ids)

    finding = Finding(
        case_id=case_id,
        title=finding_in.title,
        description=finding_in.description,
        epistemic_tier=finding_in.epistemic_tier,
        confidence_score=finding_in.confidence_score,
        supporting_observation_ids=json_obs_ids,
        reasoning=finding_in.reasoning,
        created_by=created_by,
    )
    db.add(finding)
    await db.commit()
    await db.refresh(finding)

    logger.info("finding_created", finding_id=finding.id, tier=finding.epistemic_tier.value)
    return _model_to_read(finding)


async def update_finding(
    db: AsyncSession,
    finding_id: str,
    finding_in: FindingUpdate,
) -> FindingRead:
    """Update an existing analytical finding."""
    finding = await db.get(Finding, finding_id)
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    if finding_in.title is not None:
        finding.title = finding_in.title
    if finding_in.description is not None:
        finding.description = finding_in.description
    if finding_in.epistemic_tier is not None:
        finding.epistemic_tier = finding_in.epistemic_tier
    if finding_in.confidence_score is not None:
        finding.confidence_score = finding_in.confidence_score
    if finding_in.supporting_observation_ids is not None:
        finding.supporting_observation_ids = json.dumps(finding_in.supporting_observation_ids)
    if finding_in.reasoning is not None:
        finding.reasoning = finding_in.reasoning

    if finding.epistemic_tier == EpistemicTier.INFERENCE and not finding.reasoning:
        raise HTTPException(
            status_code=400,
            detail="Inferences require an explicit 'reasoning' field.",
        )

    await db.commit()
    await db.refresh(finding)
    return _model_to_read(finding)


async def delete_finding(db: AsyncSession, finding_id: str) -> bool:
    """Delete a finding."""
    finding = await db.get(Finding, finding_id)
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    await db.delete(finding)
    await db.commit()
    return True


async def get_findings_summary(db: AsyncSession, case_id: str) -> FindingsSummaryResponse:
    """Compute epistemic breakdown and citation metrics for a case."""
    findings = await get_findings(db, case_id=case_id, limit=500)
    total = len(findings)
    verified = sum(1 for f in findings if f.epistemic_tier == EpistemicTier.VERIFIED_OBSERVATION)
    inferences = sum(1 for f in findings if f.epistemic_tier == EpistemicTier.INFERENCE)
    hypotheses = sum(1 for f in findings if f.epistemic_tier == EpistemicTier.HYPOTHESIS)

    cited = sum(1 for f in findings if len(f.supporting_observation_ids) > 0)
    coverage = round((cited / total * 100.0) if total > 0 else 0.0, 1)

    return FindingsSummaryResponse(
        case_id=case_id,
        total_findings=total,
        verified_observations=verified,
        inferences=inferences,
        hypotheses=hypotheses,
        citation_coverage_pct=coverage,
    )
