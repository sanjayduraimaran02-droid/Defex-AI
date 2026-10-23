"""
Defex AI - App Level Proxy for Vision Service
"""
import sys
from pathlib import Path

# Add backend directory to sys.path if not present
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from vision_service import VisionInspectionService, vision_service

__all__ = ["VisionInspectionService", "vision_service"]
