"""
Defex AI — Hardware Communication & Real-Time WebSocket Telemetry Router
Provides live telemetry WebSockets, IoT ingestion endpoints, and camera streaming.
"""

import asyncio
import json
import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Response, Request, HTTPException
from fastapi.responses import StreamingResponse

from app.hardware_bridge import hardware_bridge

logger = logging.getLogger("defex.hardware_router")
router = APIRouter(prefix="/hardware", tags=["Hardware Bridge & Industrial Telemetry"])


class TelemetryConnectionManager:
    """Manages active WebSocket telemetry streaming connections."""
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self._loop: Optional[asyncio.AbstractEventLoop] = None

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"[WebSocket] Client connected. Total active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"[WebSocket] Client disconnected. Total active: {len(self.active_connections)}")

    async def broadcast_json(self, message: Dict[str, Any]):
        """Broadcasts payload to all live WebSocket subscribers."""
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                dead_connections.append(connection)
        
        for dead in dead_connections:
            self.disconnect(dead)

    def dispatch_from_thread(self, payload: Dict[str, Any]):
        """Thread-safe dispatcher called by hardware bridge background poller."""
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.run_coroutine_threadsafe(self.broadcast_json(payload), loop)
        except Exception:
            pass


ws_manager = TelemetryConnectionManager()

# Hook hardware bridge broadcast to WebSocket manager
hardware_bridge.register_subscriber(ws_manager.dispatch_from_thread)


@router.get("/status")
def get_hardware_status():
    """Returns current hardware communication and PLC interlock telemetry."""
    return {
        "status": "OPERATIONAL",
        "demo_mode": hardware_bridge.config.demo_mode,
        "plc_connected": hardware_bridge.plc_connected,
        "plc_protocol": hardware_bridge.config.plc.get("protocol", "MODBUS_TCP"),
        "plc_latency_ms": hardware_bridge.last_plc_ping_ms,
        "interlock_state": hardware_bridge.interlock_state,
        "digital_outputs": hardware_bridge.digital_outputs,
        "machines": hardware_bridge.machine_telemetry
    }


@router.post("/telemetry")
async def ingest_iot_telemetry(payload: Dict[str, Any]):
    """
    Ingestion endpoint for IoT microcontrollers (ESP32, Raspberry Pi, Arduino, Edge IPC).
    Accepts: { device_id, machine_code, spindle_rpm, vibration_g, temperature_c, status }
    """
    res = hardware_bridge.ingest_iot_telemetry(payload)
    return res


@router.post("/interlock")
def control_hardware_interlock(request: Dict[str, Any]):
    """
    Directly triggers or resets the physical SIL 3 hardware safety relay.
    Payload: { "action": "EMERGENCY_STOP" | "RESET", "reason": "...", "machine_code": "CNC-MILL-001" }
    """
    action = request.get("action", "EMERGENCY_STOP")
    reason = request.get("reason", "API Hardware Trigger")
    machine_code = request.get("machine_code")
    return hardware_bridge.trigger_safety_interlock(action, reason, machine_code)


@router.get("/video_feed")
def get_camera_video_feed():
    """
    Streams live MJPEG camera feed from GigE / RTSP / USB camera with real-time laser overlay.
    """
    def frame_generator():
        while True:
            frame_bytes = hardware_bridge.get_live_frame_bytes()
            if frame_bytes:
                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n"
                )
            asyncio_sleep = 0.04  # ~25 FPS
            import time
            time.sleep(asyncio_sleep)

    return StreamingResponse(
        frame_generator(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


@router.get("/capture")
def capture_camera_snapshot():
    """Captures a single high-resolution image frame from the active metrology camera."""
    frame_bytes = hardware_bridge.get_live_frame_bytes()
    return Response(content=frame_bytes, media_type="image/jpeg")


# =============================================================================
# WebSocket Pipeline (/ws/telemetry)
# =============================================================================
async def telemetry_websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        # Send initial state snapshot immediately
        initial_state = {
            "type": "connection_established",
            "message": "Connected to Defex AI Industrial Telemetry Bridge",
            "demo_mode": hardware_bridge.config.demo_mode,
            "plc_connected": hardware_bridge.plc_connected,
            "plc_latency_ms": hardware_bridge.last_plc_ping_ms,
            "interlock_state": hardware_bridge.interlock_state,
            "digital_outputs": hardware_bridge.digital_outputs,
            "machines": hardware_bridge.machine_telemetry
        }
        await websocket.send_text(json.dumps(initial_state))

        while True:
            # Receive client ping or commands (e.g. acknowledge alert, test interlock)
            data_text = await websocket.receive_text()
            try:
                cmd = json.loads(data_text)
                if cmd.get("action") == "PING":
                    await websocket.send_text(json.dumps({"type": "PONG", "timestamp": cmd.get("timestamp")}))
                elif cmd.get("action") == "TRIGGER_ESTOP":
                    hardware_bridge.trigger_safety_interlock("EMERGENCY_STOP", cmd.get("reason", "Operator WebSocket E-STOP"))
                elif cmd.get("action") == "RESET_INTERLOCK":
                    hardware_bridge.trigger_safety_interlock("RESET", "Operator WebSocket Reset")
            except Exception:
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.debug(f"WebSocket error: {e}")
        ws_manager.disconnect(websocket)
