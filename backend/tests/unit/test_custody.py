import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.models.models import Case, EvidenceItem, ChainOfCustodyRecord, CustodyAction
from app.services.custody_service import append_custody_record, verify_chain

# Create in-memory SQLite database for testing
DATABASE_URL = "sqlite+aiosqlite:///:memory:"
engine = create_async_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession, expire_on_commit=False)

@pytest_asyncio.fixture
async def db_session():
    # Setup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Yield session
    async with TestingSessionLocal() as session:
        yield session
        
    # Teardown
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.mark.asyncio
async def test_custody_chain_integrity(db_session: AsyncSession):
    # 1. Create a Case
    case = Case(case_number="TEST-001", title="Test Case")
    db_session.add(case)
    await db_session.commit()
    await db_session.refresh(case)

    # 2. Append records to chain
    record1 = await append_custody_record(db_session, case.id, CustodyAction.ACQUIRED, description="Initial acquisition")
    record2 = await append_custody_record(db_session, case.id, CustodyAction.VERIFIED, description="Hash check")
    
    assert record1.prior_record_hash is None
    assert record2.prior_record_hash is not None

    # 3. Verify valid chain
    is_valid = await verify_chain(db_session, case.id)
    assert is_valid is True

    # 4. Tamper with the first record to simulate an integrity breach
    # Bypassing the service layer to simulate direct DB manipulation
    record1.description = "Tampered data"
    db_session.add(record1)
    await db_session.commit()

    # 5. Verify chain is now invalid
    is_valid = await verify_chain(db_session, case.id)
    assert is_valid is False
