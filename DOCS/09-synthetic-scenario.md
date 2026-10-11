# Scenario: "The Phantom Exfiltration"

## Overview
This synthetic scenario simulates an insider threat data exfiltration event. It is designed to test FORENSIC-X's ability to ingest evidence, track chain of custody, and allow investigators to build a timeline of events.

## Threat Actor
- **Name:** Alice (Employee)
- **Objective:** Exfiltrate the proprietary algorithm source code (`algo_v2.py`) before resigning.

## Timeline of Synthetic Events
1. **08:00 UTC:** Alice logs into her workstation.
2. **08:15 UTC:** Alice connects an unauthorized USB drive (Serial: `USB-998877`).
3. **08:20 UTC:** Alice accesses `algo_v2.py` from the restricted network share.
4. **08:22 UTC:** Alice copies `algo_v2.py` to the USB drive.
5. **08:25 UTC:** Alice ejects the USB drive.

## Required Synthetic Evidence Artifacts
To properly test the system, the following mock files will be provided in `data/synthetic/`:
1. `syslog_snippet.log`: Contains USB connection and disconnection events.
2. `file_access.csv`: Contains the file read/copy events.
3. `auth.log`: Contains the initial login event.

These artifacts will be used to generate the initial Database fixtures for end-to-end testing.
