"""
FORENSIC-X Backend — Application Entry Point
==============================================
FastAPI app configuration and router wiring.

Status: IMPLEMENTED
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.logging import setup_logging, get_logger
from app.core.errors import http_exception_handler, generic_exception_handler
from app.api.endpoints import router as api_router
from app.api.evidence_endpoints import router as evidence_router
from app.api.timeline_endpoints import router as timeline_router
from app.api.observation_endpoints import router as observation_router
from app.api.graph_endpoints import router as graph_router
from app.api.findings_endpoints import router as findings_router

setup_logging()
logger = get_logger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events for the FastAPI application."""
    logger.info("application_startup", version=settings.version, env=settings.env)
    yield
    logger.info("application_shutdown")


app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="FORENSIC-X Digital Forensics Framework API",
    lifespan=lifespan,
    docs_url="/docs",  # Swagger UI
    redoc_url="/redoc",
)

# CORS configuration
if settings.cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Exception handlers
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# Routers
app.include_router(api_router, prefix="/api")
app.include_router(evidence_router, prefix="/api")
app.include_router(timeline_router, prefix="/api")
app.include_router(observation_router, prefix="/api")
app.include_router(graph_router, prefix="/api")
app.include_router(findings_router, prefix="/api")
