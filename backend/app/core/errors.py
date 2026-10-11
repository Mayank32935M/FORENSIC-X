"""
FORENSIC-X Backend — Error Handling
====================================
Consistent error response format for all API endpoints.

WHY: Forensic tools must report failures clearly and consistently.
A standardized error envelope ensures the frontend can always parse
errors the same way, and logs contain structured error context.

Status: IMPLEMENTED
"""

from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.core.logging import get_logger

logger = get_logger(__name__)


class ErrorResponse(BaseModel):
    """Standard error response body returned by all API errors."""

    error: str
    detail: str
    status_code: int
    path: str | None = None


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle FastAPI HTTPException with a consistent JSON envelope."""
    logger.warning(
        "http_error",
        status_code=exc.status_code,
        detail=exc.detail,
        path=str(request.url),
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error=f"HTTP {exc.status_code}",
            detail=str(exc.detail),
            status_code=exc.status_code,
            path=str(request.url.path),
        ).model_dump(),
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all for unhandled exceptions. Logs full traceback, returns safe message."""
    logger.error(
        "unhandled_exception",
        exc_type=type(exc).__name__,
        exc_msg=str(exc),
        path=str(request.url),
        exc_info=True,
    )
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="Internal Server Error",
            detail="An unexpected error occurred. Check server logs for details.",
            status_code=500,
            path=str(request.url.path),
        ).model_dump(),
    )
