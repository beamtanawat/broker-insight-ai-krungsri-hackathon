"""Broker Insight AI — FastAPI application entry point with RBAC & Safe Error Handlers."""
from datetime import datetime, timezone
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.tracing import RequestTracingMiddleware
from app.ml.predict import predictor
from app.routers import auth, admin, customers, products, dashboard, scoring, insights, followup, audit, chat, mock, recommendations, model, analytics, pilot

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("startup", env=settings.APP_ENV)
    yield
    logger.info("shutdown")


app = FastAPI(
    title="Broker Insight AI API",
    description="FastAPI backend for Broker Insight AI — Krungsri Hackathon Prototype",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Tracing & Latency Middleware
app.add_middleware(RequestTracingMiddleware)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Safe Global Error Handlers (Do not expose internal stack traces)
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "status_code": exc.status_code},
    )


from fastapi.encoders import jsonable_encoder


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Use 422 directly or HTTP_422_UNPROCESSABLE_CONTENT to satisfy Starlette future versions
    status_code = getattr(status, "HTTP_422_UNPROCESSABLE_CONTENT", 422)
    return JSONResponse(
        status_code=status_code,
        content={"detail": "Invalid request payload", "errors": jsonable_encoder(exc.errors())},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error("unhandled_server_error", path=request.url.path, error=str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error. Please try again later."},
    )


# Standard endpoints (Direct & Prefixed)
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])

app.include_router(admin.router, prefix="/admin", tags=["admin"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])

app.include_router(customers.router, prefix="/customers", tags=["customers"])
app.include_router(customers.router, prefix="/api/v1/customers", tags=["customers"])

app.include_router(recommendations.customer_router, prefix="/customers", tags=["recommendations"])
app.include_router(recommendations.customer_router, prefix="/api/v1/customers", tags=["recommendations"])
app.include_router(recommendations.recommendation_direct_router, prefix="/recommendations", tags=["recommendations-direct"])
app.include_router(recommendations.recommendation_direct_router, prefix="/api/v1/recommendations", tags=["recommendations-direct"])

app.include_router(products.router, prefix="/products", tags=["products"])
app.include_router(products.router, prefix="/api/v1/products", tags=["products"])

app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["dashboard"])

app.include_router(scoring.router, prefix="/api/v1/score", tags=["scoring"])
app.include_router(insights.router, prefix="/api/v1/insight", tags=["insights"])
app.include_router(followup.router, prefix="/api/v1/followup", tags=["follow-up"])
app.include_router(audit.router, prefix="/api/v1/audit", tags=["audit"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["chat"])
app.include_router(mock.router, prefix="/api/v1/mock", tags=["mock-integrations"])
app.include_router(mock.router, prefix="/mock", tags=["mock-integrations"])

app.include_router(model.router, prefix="/model", tags=["model-monitoring"])
app.include_router(model.router, prefix="/api/v1/model", tags=["model-monitoring"])

app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])

app.include_router(pilot.router, prefix="/pilot", tags=["pilot-evaluation"])
app.include_router(pilot.router, prefix="/api/v1/pilot", tags=["pilot-evaluation"])


from sqlalchemy import text
from app.core import database


@app.get("/health/live", tags=["health"])
async def liveness_probe():
    """Liveness probe: verifies the ASGI web server is running and accepting HTTP requests."""
    return {
        "status": "alive",
        "service": "Broker Insight AI Backend",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/health/ready", tags=["health"])
async def readiness_probe():
    """Readiness probe: verifies live database connection and ML model readiness before routing traffic."""
    db_connected = False
    db_error = None
    try:
        async with database.AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
            db_connected = True
    except Exception as e:
        db_connected = False
        db_error = str(e)
        logger.error("readiness_db_connection_failed", error=db_error)

    ml_ready = hasattr(predictor, "_model") and predictor._model is not None
    if not ml_ready:
        try:
            predictor._ensure_loaded()
            ml_ready = predictor._model is not None
        except Exception as e:
            ml_ready = False

    is_ready = db_connected and ml_ready
    status_code = 200 if is_ready else 503

    payload = {
        "status": "ready" if is_ready else "degraded",
        "service": "Broker Insight AI Backend",
        "database": "connected" if db_connected else f"disconnected: {db_error}",
        "ml_model": {
            "ready": ml_ready,
            "name": getattr(predictor, "model_name", "LightGBM Priority Classifier"),
            "version": getattr(predictor, "model_version", "1.0.0"),
        },
        "env": settings.APP_ENV,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    return JSONResponse(status_code=status_code, content=payload)


@app.get("/health", tags=["health"])
@app.get("/api/v1/health", tags=["health"])
async def health():
    """Consolidated health check endpoint checking DB connectivity and ML model readiness."""
    db_status = "connected"
    try:
        async with database.AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"disconnected: {str(e)}"

    ml_status = "loaded" if hasattr(predictor, "_model") and predictor._model is not None else "ready"

    return {
        "status": "ok" if "connected" in db_status else "degraded",
        "service": "Broker Insight AI Backend",
        "database": db_status,
        "ml_model": {
            "status": ml_status,
            "name": getattr(predictor, "model_name", "LightGBM Priority Classifier"),
            "version": getattr(predictor, "model_version", "1.0.0"),
        },
        "env": settings.APP_ENV,
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


from fastapi.responses import Response
from app.core.metrics import metrics_collector


@app.get("/metrics", tags=["observability"])
@app.get("/api/v1/metrics", tags=["observability"])
async def get_prometheus_metrics():
    """Prometheus exposition format (/metrics) endpoint for container observability and APM."""
    content = metrics_collector.generate_prometheus_text()
    return Response(content=content, media_type="text/plain; version=0.0.4")
