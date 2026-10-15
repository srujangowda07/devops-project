from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from sqlalchemy import text
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db
from .routes import incidents, resources

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="CloudPulse Cloud Infrastructure & Incident Tracking API",
)

# Enable CORS for local Vite development and frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Expose Prometheus-compatible metrics at /metrics
Instrumentator().instrument(app).expose(app, endpoint="/metrics")

# Register domain resource and incident routers
app.include_router(resources.router)
app.include_router(incidents.router)


@app.get("/", tags=["system"])
def root():
    return {
        "service": settings.app_name,
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "ready": "/ready",
        "metrics": "/metrics",
    }


@app.get("/health", tags=["system"])
def health():
    """Liveness probe: verifies that the web application process is responsive."""
    return {"status": "healthy"}


@app.get("/ready", tags=["system"])
def ready(db: Session = Depends(get_db)):
    """Readiness probe: verifies that the backing relational database is reachable."""
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ready", "database": "connected"}
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database readiness check failed: {str(exc)}",
        ) from exc
