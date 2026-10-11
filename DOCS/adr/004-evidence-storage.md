# ADR 004: Evidence Storage - Immutable File System + Hash Chain

## Status
Accepted

## Context
Evidence must remain untampered from the moment of ingestion. While metadata and analysis can live in a relational database, storing multi-gigabyte disk images in SQLite or PostgreSQL is inefficient. We also need a mechanism to prove that evidence metadata and lifecycle events (Chain of Custody) have not been retroactively altered.

## Decision
1. **File Storage:** Raw evidence artifacts are stored on the local file system in a designated, gitignored `evidence_store/` directory. They are set to read-only at the OS level upon ingestion.
2. **Metadata & Hash Chain:** Metadata (including the SHA-256 hash of the artifact) is stored in the database. Every action taken on the evidence (Acquired, Verified, Accessed) is recorded in an append-only `chain_of_custody_records` table, where each row contains a hash of the *previous* row.

## Consequences
- **Positive:** High performance for large files; tamper-evident audit logs; aligns with forensic best practices.
- **Negative:** System must ensure the filesystem and database stay in sync; database migrations must preserve the integrity of the hash chain.
