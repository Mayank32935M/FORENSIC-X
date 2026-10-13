"""
FORENSIC-X — Syslog Parser
=============================
Parses Linux syslog / kern.log format entries.

Extracts:
  - USB device connections (vendor, product, serial, capacity)
  - USB disconnections
  - Kernel device enumeration events
  - SCSI device attachments

Format: "MMM DD HH:MM:SS hostname process[pid]: message"

Status: IMPLEMENTED (Phase 6)
"""

import re
from datetime import datetime, timezone

from app.parsers.base import BaseParser, ParsedObservation


# ─── Regex Patterns ───────────────────────────────────────────────────────────

# Standard syslog header: "Oct 10 08:15:03 Alice-WKS-01 kernel:"
SYSLOG_HEADER = re.compile(
    r"^(?P<month>\w{3})\s+(?P<day>\d{1,2})\s+(?P<time>\d{2}:\d{2}:\d{2})\s+"
    r"(?P<host>[\w\-\.]+)\s+(?P<process>[\w\-\[\]\.]+):\s*(?P<message>.+)$"
)

# USB device found: idVendor=0781, idProduct=5583
USB_DEVICE_FOUND = re.compile(
    r"New USB device found,\s*idVendor=(?P<vendor>[0-9a-fA-F]{4}),\s*"
    r"idProduct=(?P<product>[0-9a-fA-F]{4})"
)

# USB product/manufacturer/serial
USB_PRODUCT = re.compile(r"usb [\d\-\.]+: Product:\s*(?P<product>.+)")
USB_MANUFACTURER = re.compile(r"usb [\d\-\.]+: Manufacturer:\s*(?P<mfr>.+)")
USB_SERIAL = re.compile(r"usb [\d\-\.]+: SerialNumber:\s*(?P<serial>.+)")

# USB mass storage detected
USB_MASS_STORAGE = re.compile(r"USB Mass Storage device detected")

# SCSI disk capacity: (30.8 GB/28.6 GiB)
SCSI_CAPACITY = re.compile(
    r"\[(?P<dev>sd\w)\]\s+\d+\s+\d+-byte logical blocks:\s*\((?P<capacity>[^)]+)\)"
)

# USB disconnect
USB_DISCONNECT = re.compile(r"usb [\d\-\.]+: USB disconnect, device number (?P<devnum>\d+)")

# New high-speed USB device
USB_NEW_DEVICE = re.compile(
    r"usb (?P<bus>[\d\-\.]+): new (?P<speed>[\w\-]+) USB device number (?P<devnum>\d+)"
)

# SCSI attached
SCSI_ATTACHED = re.compile(r"\[(?P<dev>sd\w)\] Attached SCSI removable disk")


class SyslogParser(BaseParser):
    """Parser for Linux syslog/kern.log format."""

    NAME = "syslog-parser"
    VERSION = "1.0"
    SUPPORTED_TYPES = ["text/plain"]

    def parse(self, content: str, filename: str = "") -> list[ParsedObservation]:
        observations: list[ParsedObservation] = []
        byte_offset = 0

        # Accumulate USB device context across lines
        usb_context: dict = {}

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

            # Parse timestamp (assume current year since syslog omits it)
            try:
                parsed_time = datetime.strptime(
                    f"2026 {ts_string}", "%Y %b %d %H:%M:%S"
                ).replace(tzinfo=timezone.utc)
            except ValueError:
                parsed_time = None

            # ── USB new device connection ──
            m = USB_NEW_DEVICE.search(message)
            if m:
                obs = self._stamp(ParsedObservation(
                    observation_type="usb_connect",
                    content=f"New {m.group('speed')} USB device #{m.group('devnum')} connected on bus {m.group('bus')} at {host}",
                    source_line=line_num,
                    source_offset_bytes=byte_offset,
                    raw_line=line_stripped,
                    observed_time_utc=parsed_time,
                    original_time_string=ts_string,
                    extracted_entities={"host": host, "usb_bus": m.group("bus"), "usb_devnum": m.group("devnum")},
                ))
                observations.append(obs)
                usb_context = {"host": host}

            # ── USB device identifiers ──
            m = USB_DEVICE_FOUND.search(message)
            if m:
                usb_context["vendor_id"] = m.group("vendor")
                usb_context["product_id"] = m.group("product")

            m = USB_PRODUCT.search(message)
            if m:
                usb_context["product_name"] = m.group("product").strip()

            m = USB_MANUFACTURER.search(message)
            if m:
                usb_context["manufacturer"] = m.group("mfr").strip()

            m = USB_SERIAL.search(message)
            if m:
                serial = m.group("serial").strip()
                usb_context["serial_number"] = serial
                # Emit a consolidated device identification observation
                mfr = usb_context.get("manufacturer", "Unknown")
                prod = usb_context.get("product_name", "Unknown")
                obs = self._stamp(ParsedObservation(
                    observation_type="usb_device_identified",
                    content=f"USB device identified: {mfr} {prod} (S/N: {serial}, Vendor: {usb_context.get('vendor_id', '?')}, Product: {usb_context.get('product_id', '?')})",
                    source_line=line_num,
                    source_offset_bytes=byte_offset,
                    raw_line=line_stripped,
                    observed_time_utc=parsed_time,
                    original_time_string=ts_string,
                    extracted_entities={
                        "host": usb_context.get("host", host),
                        "serial_number": serial,
                        "manufacturer": mfr,
                        "product": prod,
                    },
                ))
                observations.append(obs)

            # ── USB Mass Storage detected ──
            if USB_MASS_STORAGE.search(message):
                obs = self._stamp(ParsedObservation(
                    observation_type="usb_mass_storage",
                    content=f"USB Mass Storage device detected on {host}",
                    source_line=line_num,
                    source_offset_bytes=byte_offset,
                    raw_line=line_stripped,
                    observed_time_utc=parsed_time,
                    original_time_string=ts_string,
                    extracted_entities={"host": host},
                ))
                observations.append(obs)

            # ── SCSI disk capacity ──
            m = SCSI_CAPACITY.search(message)
            if m:
                obs = self._stamp(ParsedObservation(
                    observation_type="disk_capacity",
                    content=f"SCSI disk /dev/{m.group('dev')} capacity: {m.group('capacity')} on {host}",
                    source_line=line_num,
                    source_offset_bytes=byte_offset,
                    raw_line=line_stripped,
                    observed_time_utc=parsed_time,
                    original_time_string=ts_string,
                    extracted_entities={"host": host, "device": f"/dev/{m.group('dev')}", "capacity": m.group("capacity")},
                ))
                observations.append(obs)

            # ── SCSI attached ──
            m = SCSI_ATTACHED.search(message)
            if m:
                obs = self._stamp(ParsedObservation(
                    observation_type="scsi_attached",
                    content=f"SCSI removable disk attached as /dev/{m.group('dev')} on {host}",
                    source_line=line_num,
                    source_offset_bytes=byte_offset,
                    raw_line=line_stripped,
                    observed_time_utc=parsed_time,
                    original_time_string=ts_string,
                    extracted_entities={"host": host, "device": f"/dev/{m.group('dev')}"},
                ))
                observations.append(obs)

            # ── USB disconnect ──
            m = USB_DISCONNECT.search(message)
            if m:
                obs = self._stamp(ParsedObservation(
                    observation_type="usb_disconnect",
                    content=f"USB device #{m.group('devnum')} disconnected from {host}",
                    source_line=line_num,
                    source_offset_bytes=byte_offset,
                    raw_line=line_stripped,
                    observed_time_utc=parsed_time,
                    original_time_string=ts_string,
                    extracted_entities={"host": host, "usb_devnum": m.group("devnum")},
                ))
                observations.append(obs)

            byte_offset += len(line) + 1  # +1 for newline

        return observations
