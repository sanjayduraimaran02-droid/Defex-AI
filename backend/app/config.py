import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOADS_DIR = BASE_DIR / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
ANNOTATIONS_DIR = UPLOADS_DIR / "annotated"
ANNOTATIONS_DIR.mkdir(parents=True, exist_ok=True)
PRESETS_DIR = UPLOADS_DIR / "presets"
PRESETS_DIR.mkdir(parents=True, exist_ok=True)


class Settings(BaseSettings):
    PROJECT_NAME: str = "Defex AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "defex-super-secret-industrial-key-2026-secure-token"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/defex.db")
    
    # Uploads
    UPLOADS_DIR: Path = UPLOADS_DIR
    ANNOTATIONS_DIR: Path = ANNOTATIONS_DIR
    PRESETS_DIR: Path = PRESETS_DIR
    
    # PLC / Hardware Interlock Simulation Settings
    PLC_ENABLED: bool = True
    PLC_PROTOCOL: str = "OPC-UA / Modbus-TCP"
    PLC_IP: str = "192.168.1.120"
    PLC_CYCLE_TIMEOUT_MS: int = 35

    class Config:
        case_sensitive = True


settings = Settings()
