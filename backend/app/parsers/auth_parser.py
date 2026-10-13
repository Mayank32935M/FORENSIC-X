"""
FORENSIC-X — Auth Log Parser
===============================
Parses Linux auth.log / secure format entries.

Extracts:
  - SSH password/key authentication (accepted/failed)
  - PAM session open/close events
  - systemd-logind session events
  - Audit authentication records

Format: "MMM DD HH:MM:SS hostname process[pid]: message"

Status: IMPLEMENTED (Phase 6)
"""

import re
from datetime import datetime, timezone

from app.parsers.base import BaseParser, ParsedObservation


# ─── Regex Patterns ───────────────────────────────────────────────────────────

SYSLOG_HEADER = re.compile(
    r"^(?P<month>\w{3})\s+(?P<day>\d{1,2})\s+(?P<time>\d{2}:\d{2}:\d{2})\s+"
    r"(?P<host>[\w\-\.]+)\s+(?P<process>[\w\-\[\]\.]+):\s*(?P<message>.+)$"
)

# SSH accepted: "Accepted password for alice from 10.0.1.55 port 52341 ssh2"
SSH_ACCEPTED = re.compile(
    r"Accepted\s+(?P<method>\w+)\s+for\s+(?P<user>\w+)\s+from\s+"
    r"(?P<ip>[\d\.]+)\s+port\s+(?P<port>\d+)"
)

# SSH failed: "Failed password for alice from ..."
SSH_FAILED = re.compile(
    r"Failed\s+(?P<method>\w+)\s+for\s+(?:invalid user\s+)?(?P<user>\w+)\s+from\s+"
    r"(?P<ip>[\d\.]+)\s+port\s+(?P<port>\d+)"
)

# PAM session: "pam_unix(sshd:session): session opened for user alice(uid=1001) by (uid=0)"
PAM_SESSION = re.compile(
    r"pam_unix\((?P<service>[\w:]+)\):\s+session\s+(?P<action>opened|closed)\s+"
    r"for user\s+(?P<user>\w+)"
)

# systemd-logind new session: "New session 14 of user alice."
LOGIND_SESSION = re.compile(
    r"New session\s+(?P<session_id>\d+)\s+of user\s+(?P<user>\w+)"
)

# Audit auth record
AUDIT_AUTH = re.compile(
    r"audit:.*acct=\"(?P<user>\w+)\".*hostname=(?P<hostname>[\w\.\-]+)\s+"
    r"addr=(?P<addr>[\d\.]+).*res=(?P<result>\w+)"
)


class AuthLogParser(BaseParser):
    """Parser for Linux auth.log / secure format."""

    NAME = "auth-log-parser"
    VERSION = "1.0"
    SUPPORTED_TYPES = ["text/plain"]

    def parse(self, content: str, filename: str = "") -> list[ParsedObservation]:
        observations: list[ParsedObservation] = []
        byte_offset = 0

        for line_num, line in enumerate(content.splitlines(), start=1):
            line_stripped = line.strip()
            if not line_stripped:
                byte_offset += len(line) + 1
                continue

            header_match = SYSLOG_HEADER.match(line_stripped)
            if not header_match:
                byte_offset += len(line) + 1
                continue

            month = header_match.group("month")
            day = header_match.group("day")
            time_str = header_match.group("time")
            host = header_match.group("host")
            message = header_match.group("message")
            ts_string = f"{month} {day} {time_str}"

            try:
                parsed_time = datetime.strptime(
                    f"2026 {ts_string}", "%Y %b %d %H:%M:%S"
                ).replace(tzinfo=timezone.utc)
            except ValueError:
                parsed_time = None

            # ── SSH Accepted ──
            m = SSH_ACCEPTED.search(message)
            if m:
                obs = self._stamp(ParsedObservation(
                    observation_type="ssh_login_success",
                    content=f"SSH login accepted for user '{m.group('user')}' from {m.group('ip')}:{m.group('port')} via {m.group('method')} on {host}",
                    source_line=line_num,
                    source_offset_bytes=byte_offset,
                    raw_line=line_stripped,
                    observed_time_utc=parsed_time,
                    original_time_string=ts_string,
                    extracted_entities={
                        "username": m.group("user"),
                        "source_ip": m.group("ip"),
                        "source_port": m.group("port"),
                        "auth_method": m.group("method"),
                        "host": host,
                    },
                ))
                observations.append(obs)

            # ── SSH Failed ──
            m = SSH_FAILED.search(message)
            if m:
                obs = self._stamp(ParsedObservation(
                    observation_type="ssh_login_failed",
                    content=f"SSH login FAILED for user '{m.group('user')}' from {m.group('ip')}:{m.group('port')} via {m.group('method')} on {host}",
                    source_line=line_num,
                    source_offset_bytes=byte_offset,
                    raw_line=line_stripped,
                    observed_time_utc=parsed_time,
                    original_time_string=ts_string,
                    extracted_entities={
                        "username": m.group("user"),
                        "source_ip": m.group("ip"),
                        "auth_method": m.group("method"),
                        "host": host,
                    },
                ))
                observations.append(obs)

            # ── PAM Session ──
            m = PAM_SESSION.search(message)
            if m:
                action = m.group("action")
                obs = self._stamp(ParsedObservation(
                    observation_type=f"pam_session_{action}",
                    content=f"PAM session {action} for user '{m.group('user')}' via {m.group('service')} on {host}",
                    source_line=line_num,
                    source_offset_bytes=byte_offset,
                    raw_line=line_stripped,
                    observed_time_utc=parsed_time,
                    original_time_string=ts_string,
                    extracted_entities={
                        "username": m.group("user"),
                        "service": m.group("service"),
                        "host": host,
                    },
                ))
                observations.append(obs)

            # ── systemd-logind New Session ──
            m = LOGIND_SESSION.search(message)
            if m:
                obs = self._stamp(ParsedObservation(
                    observation_type="logind_session",
                    content=f"New login session #{m.group('session_id')} for user '{m.group('user')}' on {host}",
                    source_line=line_num,
                    source_offset_bytes=byte_offset,
                    raw_line=line_stripped,
                    observed_time_utc=parsed_time,
                    original_time_string=ts_string,
                    extracted_entities={
                        "username": m.group("user"),
                        "session_id": m.group("session_id"),
                        "host": host,
                    },
                ))
                observations.append(obs)

            # ── Audit Auth Record ──
            m = AUDIT_AUTH.search(message)
            if m:
                result = m.group("result")
                obs = self._stamp(ParsedObservation(
                    observation_type=f"audit_auth_{'success' if result == 'success' else 'failure'}",
                    content=f"Audit authentication for '{m.group('user')}' from {m.group('addr')} — result: {result}",
                    source_line=line_num,
                    source_offset_bytes=byte_offset,
                    raw_line=line_stripped,
                    observed_time_utc=parsed_time,
                    original_time_string=ts_string,
                    extracted_entities={
                        "username": m.group("user"),
                        "source_ip": m.group("addr"),
                        "hostname": m.group("hostname"),
                        "result": result,
                        "host": host,
                    },
                ))
                observations.append(obs)

            byte_offset += len(line) + 1

        return observations
