"""
FORENSIC-X Backend — Structured Logging
========================================
Sets up structlog for JSON-formatted structured logging.

WHY: Forensic systems need auditable, parseable logs. Structured
logging (JSON) is machine-readable and can be ingested by log
aggregation tools. Each log entry includes timestamp, level, and
a logger name tied to the module.

Status: IMPLEMENTED
"""

import logging
import sys

import structlog

from app.core.config import settings


def setup_logging() -> None:
    """Configure structlog with JSON output for production, pretty console for development."""

    # WHY: In development, human-readable console output is easier to work with.
    # In production, JSON is needed for log aggregation (ELK, CloudWatch, etc.)
    if settings.env == "development":
        renderer = structlog.dev.ConsoleRenderer()
    else:
        renderer = structlog.processors.JSONRenderer()

    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.processors.TimeStamper(fmt="iso", utc=True),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            renderer,
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    # Set root logger level
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, settings.log_level.upper(), logging.INFO),
    )


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    """Get a named logger instance.

    Usage:
        from app.core.logging import get_logger
        logger = get_logger(__name__)
        logger.info("something happened", case_id="C001")
    """
    return structlog.get_logger(name)
