"""
FORENSIC-X — Observation Service
===================================
Business logic for running parsers on evidence and storing extracted observations.

This service orchestrates the entire extraction pipeline:
  1. Load evidence file content from disk
  2. Auto-detect the appropriate parser
  3. Run the parser to extract ParsedObservations
  4. Persist observations to the database with full provenance
  5. Log the parsing action in the chain of custody

Status: IMPLEMENTED (Phase 6)
"""

import json
from pathlib import Path
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from fastapi import HTTPException

from app.models.models import (
    EvidenceItem, Observation, Case, CustodyAction, TimeQuality,
)
from app.parsers import detect_parser, PARSER_REGISTRY
from app.parsers.base import ParsedObservation
from app.services.custody_service import append_custody_record
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


# Map parser time_quality strings to our TimeQuality enum
_TIME_QUALITY_MAP = {
    "precise": TimeQuality.PRECISE,
    "approximate": TimeQuality.APPROXIMATE,
    "estimated": TimeQuality.ESTIMATED,
    "unknown": TimeQuality.UNKNOWN,
}


async def parse_evidence(
    db: AsyncSession,
    evidence_id: str,
    force: bool = False,
    actor: str = "local-investigator",
) -> dict:
    """Run the appropriate parser on an evidence artifact and store observations.

    Args:
        db: Database session
        evidence_id: ID of the evidence item to parse
        force: If True, delete existing observations and re-parse
        actor: Who initiated the parse

    Returns:
        Dict with parse results summary
    """
    evidence = await db.get(EvidenceItem, evidence_id)
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence item not found")

    if not evidence.storage_path:
        raise HTTPException(
            status_code=400,
            detail="No physical storage path — cannot parse a metadata-only record",
        )

    # Check for existing observations
    existing_count_stmt = (
        select(func.count())
        .select_from(Observation)
        .where(Observation.evidence_item_id == evidence_id)
    )
    existing_result = await db.execute(existing_count_stmt)
    existing_count = existing_result.scalar() or 0

    if existing_count > 0 and not force:
        return {
            "evidence_id": evidence_id,
            "status": "already_parsed",
            "observation_count": existing_count,
            "message": f"Evidence already has {existing_count} observations. Use force=true to re-parse.",
        }

    # If forcing, delete existing observations first
    if force and existing_count > 0:
        del_stmt = delete(Observation).where(Observation.evidence_item_id == evidence_id)
        await db.execute(del_stmt)
        logger.info("observations_cleared", evidence_id=evidence_id, cleared=existing_count)

    # Auto-detect parser
    parser_class = detect_parser(evidence.original_filename, evidence.mime_type)
    if parser_class is None:
        return {
            "evidence_id": evidence_id,
            "status": "no_parser",
            "observation_count": 0,
            "message": f"No parser available for '{evidence.original_filename}' (MIME: {evidence.mime_type})",
        }

    # Read file content
    full_path = Path(settings.evidence_store_path).parent.parent / evidence.storage_path
    if not full_path.is_file():
        raise HTTPException(
            status_code=404,
            detail=f"Evidence file not found on disk at {evidence.storage_path}",
        )

    try:
        content = full_path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        content = full_path.read_bytes().decode("utf-8", errors="replace")

    # Run parser
    parser = parser_class()
    parsed: list[ParsedObservation] = parser.parse(content, filename=evidence.original_filename)

    # Store observations in database
    created_observations = []
    for p in parsed:
        obs = Observation(
            case_id=evidence.case_id,
            evidence_item_id=evidence_id,
            observation_type=p.observation_type,
            content=p.content,
            source_file=evidence.original_filename,
            source_offset=f"line:{p.source_line}" + (f",byte:{p.source_offset_bytes}" if p.source_offset_bytes else ""),
            parser_name=p.parser_name,
            parser_version=p.parser_version,
            observed_time_utc=p.observed_time_utc,
            original_time_string=p.original_time_string,
            source_timezone=p.source_timezone,
            time_quality=_TIME_QUALITY_MAP.get(p.time_quality, TimeQuality.UNKNOWN),
        )
        db.add(obs)
        created_observations.append(obs)

    await db.flush()

    # Log custody event
    await append_custody_record(
        db,
        case_id=evidence.case_id,
        action=CustodyAction.ACCESSED,
        evidence_item_id=evidence_id,
        actor=actor,
        description=f"Parsed with {parser.NAME} v{parser.VERSION}: extracted {len(created_observations)} observations",
    )

    await db.commit()

    logger.info(
        "evidence_parsed",
        evidence_id=evidence_id,
        parser=parser.NAME,
        observations=len(created_observations),
    )

    return {
        "evidence_id": evidence_id,
        "status": "parsed",
        "parser": parser.NAME,
        "parser_version": parser.VERSION,
        "observation_count": len(created_observations),
        "message": f"Extracted {len(created_observations)} observations using {parser.NAME}",
    }


async def get_observations(
    db: AsyncSession,
    case_id: str,
    evidence_id: str | None = None,
    observation_type: str | None = None,
    skip: int = 0,
    limit: int = 200,
) -> list[Observation]:
    """Get observations for a case, optionally filtered."""
    stmt = (
        select(Observation)
        .where(Observation.case_id == case_id)
        .order_by(Observation.observed_time_utc.asc().nullslast())
        .offset(skip)
        .limit(limit)
    )
    if evidence_id:
        stmt = stmt.where(Observation.evidence_item_id == evidence_id)
    if observation_type:
        stmt = stmt.where(Observation.observation_type == observation_type)

    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_observation(db: AsyncSession, observation_id: str) -> Observation | None:
    """Get a single observation by ID."""
    return await db.get(Observation, observation_id)


async def get_observation_count(
    db: AsyncSession,
    case_id: str | None = None,
    evidence_id: str | None = None,
) -> int:
    """Count observations, optionally filtered."""
    stmt = select(func.count()).select_from(Observation)
    if case_id:
        stmt = stmt.where(Observation.case_id == case_id)
    if evidence_id:
        stmt = stmt.where(Observation.evidence_item_id == evidence_id)
    result = await db.execute(stmt)
    return result.scalar() or 0


async def get_observation_types(db: AsyncSession, case_id: str) -> list[dict]:
    """Get distinct observation types with counts for a case."""
    stmt = (
        select(Observation.observation_type, func.count().label("count"))
        .where(Observation.case_id == case_id)
        .group_by(Observation.observation_type)
        .order_by(func.count().desc())
    )
    result = await db.execute(stmt)
    return [{"type": row[0], "count": row[1]} for row in result.all()]
