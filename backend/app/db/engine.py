"""
FORENSIC-X Backend — Database Engine & Session
================================================
Async SQLAlchemy engine and session factory.

WHY: Using async SQLAlchemy with aiosqlite keeps the API non-blocking.
The engine/session are configured once here and imported everywhere.
Switching to PostgreSQL later is a config change (database_url) only.

ADR Reference: docs/adr/003-database-choice.md

Status: IMPLEMENTED
"""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

# WHY: echo=False in production to avoid logging every SQL statement.
# In development with DEBUG=true, you can set echo=True for debugging.
engine = create_async_engine(
    settings.database_url,
    echo=settings.debug and settings.env == "development",
    future=True,
)

# WHY: expire_on_commit=False prevents lazy-load errors after commit
# when accessing attributes on returned objects in async context.
async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncSession:
    """FastAPI dependency that yields an async database session.

    Usage in route handlers:
        @router.get("/items")
        async def list_items(db: AsyncSession = Depends(get_db)):
            ...

    The session is automatically closed after the request completes.
    """
    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()
