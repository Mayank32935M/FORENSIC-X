"""
FORENSIC-X — CSV Audit Log Parser
====================================
Parses structured CSV audit exports from file servers or SIEM systems.

Extracts:
  - File access events (READ, WRITE, COPY, DELETE)
  - Network file share operations
  - Data transfer records with byte counts

Expected columns: timestamp_utc, user, action, file_path,
                  source_host, destination, bytes_transferred, status

Status: IMPLEMENTED (Phase 6)
"""

import csv
import io
from datetime import datetime, timezone

from app.parsers.base import BaseParser, ParsedObservation


# Canonical column name mappings (case-insensitive)
TIMESTAMP_COLS = {"timestamp_utc", "timestamp", "time", "datetime", "date_time"}
USER_COLS = {"user", "username", "account", "actor"}
ACTION_COLS = {"action", "operation", "event_type", "type"}
PATH_COLS = {"file_path", "filepath", "path", "object", "target"}
HOST_COLS = {"source_host", "host", "hostname", "source"}
DEST_COLS = {"destination", "dest", "target_path", "target_host"}
BYTES_COLS = {"bytes_transferred", "bytes", "size", "file_size"}
STATUS_COLS = {"status", "result", "outcome"}


def _find_col(headers: list[str], candidates: set[str]) -> str | None:
    """Find the first matching column header (case-insensitive)."""
    for h in headers:
        if h.lower().strip() in candidates:
            return h
    return None


class CsvAuditParser(BaseParser):
    """Parser for CSV-format audit log exports."""

    NAME = "csv-audit-parser"
    VERSION = "1.0"
    SUPPORTED_TYPES = ["text/csv"]

    def parse(self, content: str, filename: str = "") -> list[ParsedObservation]:
        observations: list[ParsedObservation] = []

        reader = csv.DictReader(io.StringIO(content))
        if not reader.fieldnames:
            return []

        headers = list(reader.fieldnames)
        ts_col = _find_col(headers, TIMESTAMP_COLS)
        user_col = _find_col(headers, USER_COLS)
        action_col = _find_col(headers, ACTION_COLS)
        path_col = _find_col(headers, PATH_COLS)
        host_col = _find_col(headers, HOST_COLS)
        dest_col = _find_col(headers, DEST_COLS)
        bytes_col = _find_col(headers, BYTES_COLS)
        status_col = _find_col(headers, STATUS_COLS)

        # Calculate byte offset of first data line (after header)
        header_line = content.split("\n", 1)[0]
        byte_offset = len(header_line) + 1  # +1 for newline

        for line_num_0, row in enumerate(reader):
            line_num = line_num_0 + 2  # +1 for 0-index, +1 for header

            # Extract fields
            ts_raw = row.get(ts_col, "") if ts_col else ""
            user = row.get(user_col, "unknown") if user_col else "unknown"
            action = row.get(action_col, "unknown") if action_col else "unknown"
            file_path = row.get(path_col, "") if path_col else ""
            host = row.get(host_col, "") if host_col else ""
            dest = row.get(dest_col, "") if dest_col else ""
            bytes_str = row.get(bytes_col, "0") if bytes_col else "0"
            status = row.get(status_col, "") if status_col else ""

            # Parse timestamp
            parsed_time = None
            if ts_raw:
                for fmt in [
                    "%Y-%m-%dT%H:%M:%SZ",
                    "%Y-%m-%dT%H:%M:%S%z",
                    "%Y-%m-%d %H:%M:%S",
                    "%m/%d/%Y %H:%M:%S",
                ]:
                    try:
                        parsed_time = datetime.strptime(ts_raw, fmt)
                        if parsed_time.tzinfo is None:
                            parsed_time = parsed_time.replace(tzinfo=timezone.utc)
                        break
                    except ValueError:
                        continue

            # Parse bytes
            try:
                bytes_val = int(bytes_str)
            except (ValueError, TypeError):
                bytes_val = 0

            # Build raw line string for provenance
            raw_line = ",".join(row.get(h, "") for h in headers)

            # Determine observation type based on action
            action_upper = action.upper()
            if action_upper in ("READ", "OPEN"):
                obs_type = "file_access"
            elif action_upper in ("COPY", "MOVE"):
                obs_type = "file_copy"
            elif action_upper in ("WRITE", "CREATE"):
                obs_type = "file_write"
            elif action_upper in ("DELETE", "REMOVE"):
                obs_type = "file_delete"
            else:
                obs_type = f"file_{action_upper.lower()}"

            # Format bytes human-readable
            if bytes_val >= 1_048_576:
                bytes_display = f"{bytes_val / 1_048_576:.1f} MB"
            elif bytes_val >= 1024:
                bytes_display = f"{bytes_val / 1024:.1f} KB"
            else:
                bytes_display = f"{bytes_val:,} bytes"

            # Build content
            content_str = f"{user} performed {action} on {file_path}"
            if dest:
                content_str += f" → {dest}"
            content_str += f" ({bytes_display})"
            if status:
                content_str += f" [{status}]"

            obs = self._stamp(ParsedObservation(
                observation_type=obs_type,
                content=content_str,
                source_line=line_num,
                source_offset_bytes=byte_offset,
                raw_line=raw_line,
                observed_time_utc=parsed_time,
                original_time_string=ts_raw,
                extracted_entities={
                    "username": user,
                    "action": action,
                    "file_path": file_path,
                    "host": host,
                    "destination": dest,
                    "bytes": bytes_val,
                    "status": status,
                },
            ))
            observations.append(obs)

            byte_offset += len(raw_line) + 1

        return observations
