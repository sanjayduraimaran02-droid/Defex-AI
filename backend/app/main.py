from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import Base, engine
from app.routers import auth, parts, machines, inspections, alerts, interlock, analytics, queue, hardware, vision
from app.routers.hardware import telemetry_websocket_endpoint

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Defex AI API",
    version=settings.VERSION,
    description="Defex AI — Industrial Visual Defect Triage & Automated Damage Prevention System",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory for raw and annotated images
app.mount("/uploads", StaticFiles(directory=str(settings.UPLOADS_DIR)), name="uploads")

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(parts.router, prefix=settings.API_V1_STR)
app.include_router(machines.router, prefix=settings.API_V1_STR)
app.include_router(inspections.router, prefix=settings.API_V1_STR)
app.include_router(alerts.router, prefix=settings.API_V1_STR)
app.include_router(queue.router, prefix=settings.API_V1_STR)
app.include_router(interlock.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(hardware.router, prefix=settings.API_V1_STR)
app.include_router(vision.router, prefix=settings.API_V1_STR)

# Real-Time Telemetry WebSockets
app.add_websocket_route("/ws/telemetry", telemetry_websocket_endpoint)
app.add_websocket_route("/api/ws/telemetry", telemetry_websocket_endpoint)


@app.get("/")
def root_status():
    return {
        "app": "Defex AI",
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "OPERATIONAL",
        "interlock_protocol": settings.PLC_PROTOCOL,
        "safety_sil_rating": "SIL 3 / Category 4 / PL e",
        "docs": "/docs"
    }
