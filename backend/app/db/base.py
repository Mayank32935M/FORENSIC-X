"""
FORENSIC-X Backend — SQLAlchemy Base Model
============================================
Declarative base for all ORM models.

Status: IMPLEMENTED
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all FORENSIC-X ORM models.

    All models inherit from this. Alembic uses Base.metadata
    to detect schema changes and generate migrations.
    """
    pass
