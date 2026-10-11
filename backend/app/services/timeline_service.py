"""
FORENSIC-X Backend — Timeline Service
========================================
Business logic for timeline events.

Provides queries over the Event model for building chronological
views of forensic investigations.

Status: IMPLEMENTED
"""

from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.models import Event, TimeQuality
from app.core.logging import get_logger

logger = get_logger(__name__)


async def create_event(
    db: AsyncSession,
    case_id: str,
    event_type: str,
    summary: str,
    event_time_utc: datetime,
    original_time_string: str | None = None,
    source_timezone: str | None = None,
    time_quality: TimeQuality = TimeQuality.PRECISE,
    source_observation_ids: str | None = None,
) -> Event:
    """Create a timeline event for a case."""
    event = Event(
        case_id=case_id,
        event_type=event_type,
        summary=summary,
        event_time_utc=event_time_utc,
        original_time_string=original_time_string,
        source_timezone=source_timezone,
        time_quality=time_quality,
        source_observation_ids=source_observation_ids,
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    logger.info("event_created", event_id=event.id, event_type=event_type, case_id=case_id)
    return event


async def get_timeline(
    db: AsyncSession, case_id: str, skip: int = 0, limit: int = 200
) -> list[Event]:
    """Get all timeline events for a case, ordered chronologically."""
    stmt = (
        select(Event)
        .where(Event.case_id == case_id)
        .order_by(Event.event_time_utc.asc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_all_events(
    db: AsyncSession, skip: int = 0, limit: int = 200
) -> list[Event]:
    """Get all timeline events across all cases, chronologically."""
    stmt = (
        select(Event)
        .order_by(Event.event_time_utc.asc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())
