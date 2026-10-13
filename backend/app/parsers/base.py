"""
FORENSIC-X — Base Parser Interface
====================================
Abstract base class and data structures for evidence parsers.

Every parser MUST:
  1. Accept raw file content (bytes or text)
  2. Yield ParsedObservation records with full source provenance
  3. Never modify the evidence file or database directly

Status: IMPLEMENTED (Phase 6)
"""

from __future__ import annotations

import abc
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class ParsedObservation:
    """A single forensic observation extracted from an evidence artifact.

    Every field here maps 1:1 to the Observation ORM model so the service
    layer can bulk-insert without transformation.
    """

    observation_type: str       # e.g. "ssh_login", "usb_connect", "file_access"
    content: str                # Human-readable summary of what was observed

    # Source provenance — WHERE in the evidence this came from
    source_line: int | None = None          # 1-indexed line number
    source_offset_bytes: int | None = None  # Byte offset from start of file
    raw_line: str = ""                      # The original line verbatim

    # Timestamp extraction — WHEN this event occurred
    observed_time_utc: datetime | None = None
    original_time_string: str = ""
    source_timezone: str = "UTC"
    time_quality: str = "precise"  # precise | approximate | estimated | unknown

    # Parser metadata — WHO/HOW this was extracted
    parser_name: str = ""
    parser_version: str = "1.0"

    # Optional entity extraction for graph population (Phase 7)
    extracted_entities: dict = field(default_factory=dict)
    # e.g. {"username": "alice", "ip": "10.0.1.55", "device": "Alice-WKS-01"}


class BaseParser(abc.ABC):
    """Abstract base class for all evidence file parsers."""

    NAME: str = "base"
    VERSION: str = "1.0"
    SUPPORTED_TYPES: list[str] = []

    @abc.abstractmethod
    def parse(self, content: str, filename: str = "") -> list[ParsedObservation]:
        """Parse file content and return a list of extracted observations.

        Args:
            content: The full text content of the evidence file.
            filename: Original filename for context.

        Returns:
            List of ParsedObservation records.
        """
        ...

    def _stamp(self, obs: ParsedObservation) -> ParsedObservation:
        """Stamp parser metadata onto an observation."""
        obs.parser_name = self.NAME
        obs.parser_version = self.VERSION
        return obs
