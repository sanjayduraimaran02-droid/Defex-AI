"""
Defex AI — Real-Time Vision Inspection & Camera Stream Router
Endpoints for live MJPEG video streaming, camera configuration,
part matching verification, and safety interlock controls.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Response, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.vision_service import vision_service

router = APIRouter(prefix="/vision", tags=["Vision Inspection Station"])


class VisionConfigInput(BaseModel):
    source_type: Optional[str] = Field(None, description="'webcam', 'rtsp', or 'simulated'")
    device_index: Optional[int] = Field(None, description="Camera index e.g. 0 or 1")
    rtsp_url: Optional[str] = Field(None, description="RTSP URL e.g. rtsp://192.168.1.55:554/stream1")
    target_part_code: Optional[str] = Field(None, description="Catalog part code e.g. PRT-BRK-01")
    auto_inspect: Optional[bool] = Field(None, description="Enable continuous automatic inspection")
    simulate_defect_mode: Optional[str] = Field(
        None, description="'none', 'wrong_part', 'crack', 'burr', 'porosity'"
    )


@router.get("/feed")
def get_live_vision_feed():
    """
    High-performance, low-latency MJPEG live video stream.
    Directly streams live camera video with industrial AI HUD reticle overlays,
    bounding boxes, match %, and PASS/FAIL safety badge.
    """
    return StreamingResponse(
        vision_service.generate_mjpeg_stream(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


@router.get("/status")
def get_vision_status():
    """Returns instantaneous vision service telemetry and inspection state."""
    return vision_service.get_status()


@router.post("/configure")
def configure_vision(config: VisionConfigInput):
    """
    Configures vision parameters: camera source (Webcam/RTSP/Simulated),
    target catalog part, auto-inspect mode, or defect simulation.
    """
    return vision_service.configure(
        source_type=config.source_type,
        device_index=config.device_index,
        rtsp_url=config.rtsp_url,
        target_part_code=config.target_part_code,
        auto_inspect=config.auto_inspect,
        simulate_defect_mode=config.simulate_defect_mode
    )


@router.post("/verify")
def manual_verify():
    """
    Triggers manual capture and verification of the current frame against the target part.
    """
    return vision_service.manual_verify()


@router.post("/reset-interlock")
def reset_interlock():
    """
    Resets the safety interlock and clears any simulated defect overrides.
    """
    return vision_service.reset_interlock()


@router.get("/snapshot")
def get_snapshot():
    """Returns the current raw frame as a JPEG image."""
    with vision_service._frame_lock:
        data = vision_service._current_jpeg

    if not data:
        raise HTTPException(status_code=503, detail="Camera frame not ready")

    return Response(content=data, media_type="image/jpeg")
