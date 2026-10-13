"""
FORENSIC-X — Parser Unit Tests
==============================
Tests for Syslog, Auth, and CSV log parsers.
"""

from app.parsers.syslog_parser import SyslogParser
from app.parsers.auth_parser import AuthLogParser
from app.parsers.csv_parser import CsvAuditParser
from app.parsers import detect_parser


def test_detect_parser():
    assert detect_parser("syslog_snippet.log") == SyslogParser
    assert detect_parser("auth.log") == AuthLogParser
    assert detect_parser("file_access.csv") == CsvAuditParser
    assert detect_parser("unknown.bin") is None


def test_syslog_parser():
    sample = (
        "Oct 10 08:15:03 Alice-WKS-01 kernel: [ 3412.102] usb 2-1.3: new high-speed USB device number 5 using xhci_hcd\n"
        "Oct 10 08:15:03 Alice-WKS-01 kernel: [ 3412.210] usb 2-1.3: New USB device found, idVendor=0781, idProduct=5583\n"
        "Oct 10 08:15:03 Alice-WKS-01 kernel: [ 3412.211] usb 2-1.3: New USB device strings: Mfr=1, Product=2, SerialNumber=3\n"
        "Oct 10 08:15:03 Alice-WKS-01 kernel: [ 3412.212] usb 2-1.3: Product: Ultra USB 3.0\n"
        "Oct 10 08:15:03 Alice-WKS-01 kernel: [ 3412.213] usb 2-1.3: Manufacturer: SanDisk\n"
        "Oct 10 08:15:03 Alice-WKS-01 kernel: [ 3412.214] usb 2-1.3: SerialNumber: USB-998877\n"
    )
    parser = SyslogParser()
    observations = parser.parse(sample, "syslog_snippet.log")
    assert len(observations) >= 2
    types = [o.observation_type for o in observations]
    assert "usb_connect" in types
    assert "usb_device_identified" in observations[1].observation_type


def test_auth_parser():
    sample = "Oct 10 08:00:12 Alice-WKS-01 sshd[14201]: Accepted password for alice from 10.0.1.55 port 52341 ssh2\n"
    parser = AuthLogParser()
    observations = parser.parse(sample, "auth.log")
    assert len(observations) == 1
    assert observations[0].observation_type == "ssh_login_success"
    assert observations[0].extracted_entities.get("username") == "alice"
    assert observations[0].extracted_entities.get("source_ip") == "10.0.1.55"


def test_csv_parser():
    sample = (
        "timestamp,user,action,file_path,bytes_transferred,source_ip,destination\n"
        "2026-10-10T08:20:14Z,alice,READ,\\\\fileserver\\restricted\\R&D\\algo_v2.py,48230,10.0.1.55,Alice-WKS-01\n"
        "2026-10-10T08:22:07Z,alice,COPY,\\\\fileserver\\restricted\\R&D\\algo_v2.py,48230,Alice-WKS-01,E:\\exfil_backup\\algo_v2.py\n"
    )
    parser = CsvAuditParser()
    observations = parser.parse(sample, "file_access.csv")
    assert len(observations) == 2
    assert observations[0].observation_type == "file_access"
    assert observations[1].observation_type == "file_copy"
    assert observations[0].source_line == 2
    assert observations[1].source_line == 3
