import os
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import cv2

from app.config import settings


class CVInspectionEngine:
    """
    Industrial Computer Vision Inspection Engine.
    Implements OpenCV & NumPy processing with realistic defect bounding box generation,
    edge/flaw analysis, and high-visibility industrial annotation overlays.
    """

    def __init__(self):
        self.defect_color_map = {
            "crack": (239, 68, 68),       # Red #EF4444
            "porosity": (245, 158, 11),   # Amber #F59E0B
            "scratch": (59, 130, 246),    # Blue #3B82F6
            "dent": (234, 88, 12),        # Orange
            "burr": (220, 38, 38),        # Deep Red
            "micro-crack": (225, 29, 72), # Rose
            "coating void": (168, 85, 247) # Purple
        }

    def process_workpiece_image(
        self,
        image_bytes: Optional[bytes] = None,
        preset_type: Optional[str] = None,
        part_code: str = "PRT-BRK-01",
        defect_classes_allowed: Optional[List[str]] = None
    ) -> Tuple[str, str, List[Dict[str, Any]], float]:
        """
        Processes workpiece image, detects defects, produces original and annotated images,
        and returns:
        (image_url, annotated_image_url, defect_list, overall_visual_confidence)
        """
        img_id = uuid.uuid4().hex[:12]
        orig_filename = f"part_{part_code}_{img_id}_raw.png"
        annot_filename = f"part_{part_code}_{img_id}_annotated.png"

        orig_path = settings.UPLOADS_DIR / orig_filename
        annot_path = settings.ANNOTATIONS_DIR / annot_filename

        # Load or synthesize image
        if image_bytes:
            # Decode image from bytes
            nparr = np.frombuffer(image_bytes, np.uint8)
            cv_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if cv_img is None:
                cv_img = self._generate_synthetic_workpiece(part_code)
        else:
            cv_img = self._generate_synthetic_workpiece(part_code)

        # Save raw image
        cv2.imwrite(str(orig_path), cv_img)

        # Detect defects based on image analysis and preset behavior
        defects, visual_confidence = self._detect_flaws(
            cv_img, preset_type, defect_classes_allowed
        )

        # Generate industrial annotated overlay
        annotated_img = self._draw_annotations(cv_img, defects, part_code, visual_confidence)
        cv2.imwrite(str(annot_path), annotated_img)

        # Build relative URLs
        raw_url = f"/uploads/{orig_filename}"
        annot_url = f"/uploads/annotated/{annot_filename}"

        return raw_url, annot_url, defects, visual_confidence

    def _generate_synthetic_workpiece(self, part_code: str) -> np.ndarray:
        """Generates a realistic industrial metallic machined part background."""
        width, height = 800, 600
        # Dark slate metallic backdrop
        img = np.full((height, width, 3), (25, 30, 40), dtype=np.uint8)

        # Machined billet metallic core
        center_x, center_y = width // 2, height // 2
        cv2.rectangle(img, (140, 100), (660, 500), (90, 100, 115), -1)
        cv2.rectangle(img, (140, 100), (660, 500), (140, 155, 175), 3)

        # Chamfers & milling tool paths
        for offset in range(120, 480, 25):
            cv2.line(img, (150, offset), (650, offset), (105, 115, 130), 1)

        # CNC bored holes with high-precision bevels
        holes = [(260, 220), (540, 220), (400, 300), (260, 400), (540, 400)]
        for hx, hy in holes:
            cv2.circle(img, (hx, hy), 45, (40, 45, 55), -1)
            cv2.circle(img, (hx, hy), 45, (160, 175, 195), 2)
            cv2.circle(img, (hx, hy), 20, (15, 18, 22), -1)
            cv2.circle(img, (hx, hy), 20, (120, 135, 155), 1)

        # Subtle Gaussian noise simulating sensor CMOS grain
        noise = np.random.normal(0, 4, img.shape).astype(np.int16)
        noisy_img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
        return noisy_img

    def _detect_flaws(
        self,
        cv_img: np.ndarray,
        preset_type: Optional[str],
        allowed_classes: Optional[List[str]]
    ) -> Tuple[List[Dict[str, Any]], float]:
        """
        Determines defects based on real edge/contour characteristics or targeted preset.
        """
        defects: List[Dict[str, Any]] = []
        h, w = cv_img.shape[:2]

        if preset_type == "fail_crack":
            defects.append({
                "class": "crack",
                "confidence": 0.96,
                "bbox": [280, 170, 460, 250],
                "severity": "CRITICAL",
                "area_px": 1420,
                "description": "High-severity structural fatigue fracture crossing stress riser"
            })
            confidence = 0.96

        elif preset_type == "fail_burr":
            defects.append({
                "class": "burr",
                "confidence": 0.91,
                "bbox": [135, 310, 195, 470],
                "severity": "CRITICAL",
                "area_px": 860,
                "description": "Excessive machining flash / burr protruding beyond tolerance zone"
            })
            confidence = 0.91

        elif preset_type == "fail_porosity":
            defects.append({
                "class": "porosity",
                "confidence": 0.89,
                "bbox": [430, 260, 520, 360],
                "severity": "CRITICAL",
                "area_px": 620,
                "description": "Cluster of sub-surface gas voids exposed during face milling"
            })
            confidence = 0.89

        elif preset_type == "uncertain_borderline":
            defects.append({
                "class": "scratch",
                "confidence": 0.64,
                "bbox": [330, 360, 480, 410],
                "severity": "WARNING",
                "area_px": 310,
                "description": "Borderline surface tooling witness mark near sealing gasket plane"
            })
            confidence = 0.64

        elif preset_type == "pass":
            confidence = 0.985
            # Clean part with no defects

        else:
            # Algorithmic detection on image using edge and contrast analysis
            gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
            # Find high gradient anomalies
            edges = cv2.Canny(gray, 120, 220)
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

            suspicious_count = 0
            for c in contours:
                area = cv2.contourArea(c)
                if 200 < area < 5000:
                    x, y, cw, ch = cv2.boundingRect(c)
                    # Check if not the main outer boundary or centered standard holes
                    if 180 < x < w - 180 and 140 < y < h - 140:
                        suspicious_count += 1
                        defect_cls = "scratch" if cw > ch * 1.5 else "porosity"
                        defects.append({
                            "class": defect_cls,
                            "confidence": 0.84,
                            "bbox": [int(x), int(y), int(x + cw), int(y + ch)],
                            "severity": "WARNING",
                            "area_px": int(area),
                            "description": f"Detected anomalous surface discontinuity ({defect_cls})"
                        })
                        if len(defects) >= 3:
                            break

            if defects:
                confidence = float(np.mean([d["confidence"] for d in defects]))
            else:
                confidence = 0.972

        return defects, confidence

    def _draw_annotations(
        self,
        img: np.ndarray,
        defects: List[Dict[str, Any]],
        part_code: str,
        confidence: float
    ) -> np.ndarray:
        """
        Draws high-contrast industrial inspection heads-up display overlay.
        """
        annotated = img.copy()
        h, w = annotated.shape[:2]

        # Industrial HUD overlay: top telemetry bar
        cv2.rectangle(annotated, (0, 0), (w, 42), (15, 23, 42), -1)
        cv2.line(annotated, (0, 42), (w, 42), (23, 62, 165), 2)  # Royal Blue line

        status_text = "PASS" if not defects else ("UNCERTAIN" if confidence < 0.75 else "FAIL")
        status_color = (16, 185, 129) if status_text == "PASS" else ((245, 158, 11) if status_text == "UNCERTAIN" else (239, 68, 68))
        # BGR for OpenCV:
        bgr_status = (status_color[2], status_color[1], status_color[0])

        # Header titles
        cv2.putText(
            annotated,
            f"DEFEX AI // STATION INSPECT // {part_code}",
            (16, 26),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (220, 230, 242),
            1,
            cv2.LINE_AA
        )
        cv2.putText(
            annotated,
            f"STATUS: {status_text} ({confidence * 100:.1f}%)",
            (w - 280, 26),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            bgr_status,
            2,
            cv2.LINE_AA
        )

        # Crosshair optical alignment reticle in center
        cx, cy = w // 2, h // 2
        cv2.line(annotated, (cx - 20, cy), (cx + 20, cy), (100, 116, 139), 1)
        cv2.line(annotated, (cx, cy - 20), (cx, cy + 20), (100, 116, 139), 1)
        cv2.circle(annotated, (cx, cy), 15, (100, 116, 139), 1)

        # Draw defect bounding boxes and labels
        for idx, defect in enumerate(defects):
            bbox = defect.get("bbox", [0, 0, 0, 0])
            x1, y1, x2, y2 = bbox
            d_cls = defect.get("class", "defect").upper()
            d_conf = defect.get("confidence", 0.0)
            d_sev = defect.get("severity", "CRITICAL")

            rgb = self.defect_color_map.get(defect.get("class", "").lower(), (239, 68, 68))
            bgr = (rgb[2], rgb[1], rgb[0])

            # Semi-transparent defect shading
            sub_overlay = annotated.copy()
            cv2.rectangle(sub_overlay, (x1, y1), (x2, y2), bgr, -1)
            cv2.addWeighted(sub_overlay, 0.25, annotated, 0.75, 0, annotated)

            # High-visibility neon border
            cv2.rectangle(annotated, (x1, y1), (x2, y2), bgr, 2)

            # Corner brackets for precision reticle aesthetic
            arm_len = min(15, (x2 - x1) // 3, (y2 - y1) // 3)
            # Top-left
            cv2.line(annotated, (x1, y1), (x1 + arm_len, y1), (255, 255, 255), 2)
            cv2.line(annotated, (x1, y1), (x1, y1 + arm_len), (255, 255, 255), 2)
            # Bottom-right
            cv2.line(annotated, (x2, y2), (x2 - arm_len, y2), (255, 255, 255), 2)
            cv2.line(annotated, (x2, y2), (x2, y2 - arm_len), (255, 255, 255), 2)

            # Label badge
            label = f"[{idx+1}] {d_cls} {d_conf*100:.0f}% ({d_sev})"
            label_y = max(y1 - 8, 20)
            cv2.rectangle(annotated, (x1, label_y - 18), (x1 + len(label) * 9 + 10, label_y + 4), bgr, -1)
            cv2.putText(
                annotated,
                label,
                (x1 + 4, label_y - 4),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.45,
                (255, 255, 255),
                1,
                cv2.LINE_AA
            )

        # Bottom status bar with timestamp & scale calibration
        cv2.rectangle(annotated, (0, h - 28), (w, h), (15, 23, 42), -1)
        cv2.putText(
            annotated,
            "OPTICAL SCALE: 0.024 mm/px | TELECENTRIC LENS CALIBRATED | ZERO CRASH INTERLOCK ACTIVE",
            (16, h - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.4,
            (148, 163, 184),
            1,
            cv2.LINE_AA
        )

        return annotated


cv_engine = CVInspectionEngine()
