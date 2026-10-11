# ADR 001: Architecture Style - Local-First Single-Node Service

## Status
Accepted

## Context
FORENSIC-X is designed for digital forensics investigations. Investigators frequently operate in air-gapped environments or on specialized workstations where external network connectivity is restricted or unavailable. Furthermore, evidentiary data is highly sensitive and often legally encumbered.

## Decision
We will build FORENSIC-X as a single-node, local-first service consisting of a decoupled frontend (React) and backend (FastAPI/Python), communicating via HTTP over localhost.

## Consequences
- **Positive:** No cloud dependencies; easy deployment on investigator laptops; absolute control over data residency.
- **Negative:** Limited scalability beyond a single machine; no out-of-the-box collaborative multiplayer mode.
