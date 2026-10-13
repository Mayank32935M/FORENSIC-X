"""
FORENSIC-X — Evidence Parsers Package
=======================================
Automated log parsers that extract structured forensic observations
from raw evidence artifacts.

Each parser implements the BaseParser interface and produces a list
of ParsedObservation records with source provenance (line numbers,
byte offsets, original timestamp strings).

Status: IMPLEMENTED (Phase 6)
"""

from app.parsers.base import BaseParser, ParsedObservation
from app.parsers.syslog_parser import SyslogParser
from app.parsers.auth_parser import AuthLogParser
from app.parsers.csv_parser import CsvAuditParser

# Registry: maps MIME type / filename heuristics to parser classes
PARSER_REGISTRY: dict[str, type[BaseParser]] = {
    "syslog": SyslogParser,
    "auth": AuthLogParser,
    "csv": CsvAuditParser,
}


def detect_parser(filename: str, mime_type: str | None = None) -> type[BaseParser] | None:
    """Auto-detect the best parser for a given evidence file.

    Strategy (in order):
      1. Filename pattern matching (most reliable for forensic files)
      2. MIME type fallback
    """
    fn_lower = filename.lower()

    # Exact filename patterns
    if "auth.log" in fn_lower or "auth_" in fn_lower:
        return AuthLogParser
    if fn_lower.endswith(".csv"):
        return CsvAuditParser
    if "syslog" in fn_lower or "kern.log" in fn_lower or "messages" in fn_lower:
        return SyslogParser

    # MIME fallback
    if mime_type == "text/csv":
        return CsvAuditParser

    return None
