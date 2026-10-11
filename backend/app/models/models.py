"""
FORENSIC-X Backend — ORM Models
=================================
All SQLAlchemy ORM models for the forensic data model.

Architecture layers (see docs/03-data-model.md):
  1. Raw Evidence (EvidenceItem) — immutable acquired artifacts
  2. Extracted Observations (Observation) — facts pulled from evidence
  3. Analytical Findings (Finding) — conclusions from observations
  4. AI Interpretations (AIInterpretation) — model-generated insights

Each layer references the one below it; later layers NEVER mutate earlier ones.

ADR Reference: docs/adr/004-evidence-storage.md, docs/adr/006-epistemic-tiers.md

Status: IMPLEMENTED (Case, EvidenceItem, ChainOfCustodyRecord, AuditLogEntry)
Status: SKELETON (Observation, Event, Finding, AIInterpretation, Device, Account, Relationship)
"""

import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum

from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.db.base import Base


# ─── Enums ────────────────────────────────────────────────────────────────────

class CaseStatus(str, PyEnum):
    """Lifecycle status of a forensic case."""
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    CLOSED = "closed"
    ARCHIVED = "archived"


class EpistemicTier(str, PyEnum):
    """Epistemic classification for findings and interpretations.

    WHY: Digital forensics requires explicit distinction between what is
    directly observed vs. what is inferred vs. what is hypothesized.
    See docs/adr/006-epistemic-tiers.md for full rationale.

    - VERIFIED_OBSERVATION: Directly supported by evidence (e.g., file hash match)
    - INFERENCE: Derived from observations with stated reasoning and supporting IDs
    - HYPOTHESIS: Needs further investigation, explicitly uncertain
    """
    VERIFIED_OBSERVATION = "verified_observation"
    INFERENCE = "inference"
    HYPOTHESIS = "hypothesis"


class TimeQuality(str, PyEnum):
    """Confidence in a parsed timestamp.

    WHY: Forensic timestamps come from many sources with varying reliability.
    A system clock might be skewed, a log format might be ambiguous.
    This flag makes the uncertainty explicit.
    """
    PRECISE = "precise"           # Directly from a trusted, synchronized source
    APPROXIMATE = "approximate"    # Parsed but source reliability unknown
    ESTIMATED = "estimated"        # Inferred or reconstructed
    UNKNOWN = "unknown"            # Could not determine quality


class CustodyAction(str, PyEnum):
    """Types of chain-of-custody actions."""
    ACQUIRED = "acquired"
    TRANSFERRED = "transferred"
    VERIFIED = "verified"
    ACCESSED = "accessed"
    EXPORTED = "exported"
    SEALED = "sealed"


# ─── Helper ───────────────────────────────────────────────────────────────────

def _gen_uuid() -> str:
    """Generate a new UUID4 string. Used as default for primary keys."""
    return str(uuid.uuid4())


def _utcnow() -> datetime:
    """Current UTC time. Used as default for timestamp columns."""
    return datetime.now(timezone.utc)


# ─── IMPLEMENTED Models ──────────────────────────────────────────────────────

class Case(Base):
    """A forensic investigation case.

    This is the top-level organizing entity. Evidence items, observations,
    findings, and all other entities reference a case.
    """
    __tablename__ = "cases"

    id = Column(String(36), primary_key=True, default=_gen_uuid)
    case_number = Column(String(50), unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(CaseStatus), nullable=False, default=CaseStatus.OPEN)
    created_at = Column(DateTime(timezone=True), nullable=False, default=_utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow)
    created_by = Column(String(100), nullable=False, default="local-investigator")

    # Relationships
    evidence_items = relationship("EvidenceItem", back_populates="case", cascade="all, delete-orphan")
    audit_log_entries = relationship("AuditLogEntry", back_populates="case", cascade="all, delete-orphan")
    custody_records = relationship("ChainOfCustodyRecord", back_populates="case", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Case {self.case_number}: {self.title}>"


class EvidenceItem(Base):
    """An acquired digital artifact (file, disk image, log export, etc.).

    Immutable once ingested. The original file is stored outside the database
    in the evidence_store directory. This record holds metadata and integrity info.

    WHY: Evidence integrity is foundational. We store SHA-256 (and the algorithm name)
    so verification is explicit. A matching hash proves integrity relative to a reference
    point, NOT authenticity before acquisition. See docs/08-security-and-privacy.md.
    """
    __tablename__ = "evidence_items"

    id = Column(String(36), primary_key=True, default=_gen_uuid)
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=False, index=True)
    original_filename = Column(String(500), nullable=False)
    file_size_bytes = Column(Integer, nullable=True)
    mime_type = Column(String(100), nullable=True)

    # Integrity
    hash_sha256 = Column(String(64), nullable=True, index=True)
    hash_algorithm = Column(String(20), nullable=False, default="sha256")

    # Acquisition metadata
    acquired_at = Column(DateTime(timezone=True), nullable=True)
    acquired_by = Column(String(100), nullable=True)
    acquisition_method = Column(String(200), nullable=True)
    storage_path = Column(String(1000), nullable=True)  # relative path in evidence_store

    # Provenance
    source_description = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), nullable=False, default=_utcnow)

    # Relationships
    case = relationship("Case", back_populates="evidence_items")
    custody_records = relationship("ChainOfCustodyRecord", back_populates="evidence_item")

    def __repr__(self) -> str:
        return f"<EvidenceItem {self.id[:8]}...: {self.original_filename}>"


class ChainOfCustodyRecord(Base):
    """An append-only record of evidence handling.

    WHY: Chain of custody is critical for legal admissibility. Records form a
    simple hash chain: each record stores the hash of the previous record,
    making tampering detectable (but not impossible — this is tamper-evident,
    not tamper-proof). See docs/adr/004-evidence-storage.md.

    ENFORCEMENT: The service layer (not the ORM) enforces append-only behavior.
    Updates and deletes are rejected by the CustodyService. This is tested.
    """
    __tablename__ = "chain_of_custody_records"

    id = Column(String(36), primary_key=True, default=_gen_uuid)
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=False, index=True)
    evidence_item_id = Column(String(36), ForeignKey("evidence_items.id"), nullable=True, index=True)

    action = Column(Enum(CustodyAction), nullable=False)
    actor = Column(String(100), nullable=False, default="local-investigator")
    description = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, default=_utcnow)

    # Hash chain: SHA-256 of the previous record's content for tamper detection
    prior_record_hash = Column(String(64), nullable=True)  # null for first record

    def __repr__(self) -> str:
        return f"<CustodyRecord {self.action.value} by {self.actor} at {self.timestamp}>"

    # Relationships
    case = relationship("Case", back_populates="custody_records")
    evidence_item = relationship("EvidenceItem", back_populates="custody_records")


class AuditLogEntry(Base):
    """System-wide audit log for all significant actions.

    WHY: Every action in a forensic system must be auditable. This covers
    not just evidence handling (that's ChainOfCustody) but all system actions:
    case creation, config changes, login events, etc.
    """
    __tablename__ = "audit_log_entries"

    id = Column(String(36), primary_key=True, default=_gen_uuid)
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=True, index=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=False)  # e.g., "Case", "EvidenceItem"
    entity_id = Column(String(36), nullable=True)
    actor = Column(String(100), nullable=False, default="local-investigator")
    detail = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, default=_utcnow)

    # Relationships
    case = relationship("Case", back_populates="audit_log_entries")

    def __repr__(self) -> str:
        return f"<AuditLog {self.action} on {self.entity_type} by {self.actor}>"


# ─── SKELETON Models (PLANNED — interfaces only) ─────────────────────────────
# These models define the schema but are not yet used by any service or API.
# They are here so the data model documentation and migrations are complete.

class Device(Base):
    """A device involved in a case (laptop, phone, server, USB drive).
    Status: SKELETON
    """
    __tablename__ = "devices"

    id = Column(String(36), primary_key=True, default=_gen_uuid)
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    device_type = Column(String(50), nullable=True)  # laptop, phone, usb, server
    serial_number = Column(String(200), nullable=True)
    os_info = Column(String(200), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=_utcnow)


class Account(Base):
    """A user account or identity observed in evidence.
    Status: SKELETON
    """
    __tablename__ = "accounts"

    id = Column(String(36), primary_key=True, default=_gen_uuid)
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=False, index=True)
    username = Column(String(255), nullable=False)
    account_type = Column(String(50), nullable=True)  # os_user, email, chat, cloud
    display_name = Column(String(255), nullable=True)
    associated_device_id = Column(String(36), ForeignKey("devices.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=_utcnow)


class Observation(Base):
    """An extracted fact from an evidence item.

    Observations are the bridge between raw evidence and analysis.
    Each observation cites exactly where in the evidence it came from.

    Status: SKELETON
    """
    __tablename__ = "observations"

    id = Column(String(36), primary_key=True, default=_gen_uuid)
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=False, index=True)
    evidence_item_id = Column(String(36), ForeignKey("evidence_items.id"), nullable=False)

    observation_type = Column(String(100), nullable=False)  # file_access, usb_connect, etc.
    content = Column(Text, nullable=False)

    # Source location within the artifact
    source_file = Column(String(500), nullable=True)
    source_offset = Column(String(100), nullable=True)  # line number, byte offset, record index
    parser_name = Column(String(100), nullable=True)
    parser_version = Column(String(50), nullable=True)

    # Timestamp from the original evidence
    observed_time_utc = Column(DateTime(timezone=True), nullable=True)
    original_time_string = Column(String(200), nullable=True)
    source_timezone = Column(String(50), nullable=True)
    time_quality = Column(Enum(TimeQuality), nullable=True, default=TimeQuality.UNKNOWN)

    processing_timestamp = Column(DateTime(timezone=True), nullable=False, default=_utcnow)
    created_at = Column(DateTime(timezone=True), nullable=False, default=_utcnow)


class Event(Base):
    """A normalized timeline entry derived from one or more observations.
    Status: SKELETON
    """
    __tablename__ = "events"

    id = Column(String(36), primary_key=True, default=_gen_uuid)
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=False, index=True)
    event_type = Column(String(100), nullable=False)
    summary = Column(Text, nullable=False)
    event_time_utc = Column(DateTime(timezone=True), nullable=False)
    original_time_string = Column(String(200), nullable=True)
    source_timezone = Column(String(50), nullable=True)
    time_quality = Column(Enum(TimeQuality), nullable=True, default=TimeQuality.UNKNOWN)
    source_observation_ids = Column(Text, nullable=True)  # JSON list of observation IDs
    created_at = Column(DateTime(timezone=True), nullable=False, default=_utcnow)


class Relationship(Base):
    """A typed edge between any two entities in the case.
    This is the relational-table approach to a graph workload.
    Status: SKELETON
    """
    __tablename__ = "relationships"

    id = Column(String(36), primary_key=True, default=_gen_uuid)
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=False, index=True)
    source_entity_type = Column(String(50), nullable=False)
    source_entity_id = Column(String(36), nullable=False)
    target_entity_type = Column(String(50), nullable=False)
    target_entity_id = Column(String(36), nullable=False)
    relationship_type = Column(String(100), nullable=False)  # e.g., "accessed", "transferred_to"
    metadata_json = Column(Text, nullable=True)  # JSON blob for extra attributes
    created_at = Column(DateTime(timezone=True), nullable=False, default=_utcnow)


class Finding(Base):
    """An analytical result derived from observations.

    Each finding carries an epistemic tier and, if inferred, the list of
    supporting observation IDs and the reasoning.

    Status: SKELETON
    """
    __tablename__ = "findings"

    id = Column(String(36), primary_key=True, default=_gen_uuid)
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    epistemic_tier = Column(Enum(EpistemicTier), nullable=False)
    confidence_score = Column(Float, nullable=True)  # 0.0–1.0, labeled as heuristic
    supporting_observation_ids = Column(Text, nullable=True)  # JSON list
    reasoning = Column(Text, nullable=True)  # for INFERENCE tier
    created_at = Column(DateTime(timezone=True), nullable=False, default=_utcnow)
    created_by = Column(String(100), nullable=False, default="local-investigator")


class AIInterpretation(Base):
    """A model-generated interpretation of evidence or findings.

    WHY: AI outputs must be clearly separated from human analysis and
    direct observations. Each interpretation records the model used,
    the prompt version, and which evidence was cited, enabling review
    and reproducibility. Evidence content is untrusted input — see
    docs/08-security-and-privacy.md for prompt-injection policy.

    Status: SKELETON
    """
    __tablename__ = "ai_interpretations"

    id = Column(String(36), primary_key=True, default=_gen_uuid)
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=False, index=True)
    finding_id = Column(String(36), ForeignKey("findings.id"), nullable=True)
    model_name = Column(String(100), nullable=False)
    model_version = Column(String(50), nullable=True)
    prompt_version = Column(String(50), nullable=True)
    interpretation = Column(Text, nullable=False)
    epistemic_tier = Column(Enum(EpistemicTier), nullable=False, default=EpistemicTier.HYPOTHESIS)
    confidence_score = Column(Float, nullable=True)
    cited_evidence_ids = Column(Text, nullable=True)  # JSON list of evidence item IDs
    cited_observation_ids = Column(Text, nullable=True)  # JSON list
    created_at = Column(DateTime(timezone=True), nullable=False, default=_utcnow)
