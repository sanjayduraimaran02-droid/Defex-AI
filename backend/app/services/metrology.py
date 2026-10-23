from typing import Any, Dict, List, Optional, Tuple
import math
import random


class MetrologyEngine:
    """
    Precision Metrology Engine for 1D/2D Laser Profilometers and CMM sensors.
    Validates measured workpiece dimensions against nominal values and tight engineering tolerances.
    """

    def validate_measurements(
        self,
        nominal_dims: Dict[str, Any],
        tolerances: Dict[str, Any],
        measured_values: Optional[Dict[str, float]] = None,
        preset_type: Optional[str] = None
    ) -> Tuple[Dict[str, Any], str, float]:
        """
        Validates measured dimensions against nominal and tolerance specs.
        Returns:
            (evaluated_measurements_dict, overall_metrology_status ['PASS', 'FAIL', 'BORDERLINE'], worst_deviation_ratio)
        """
        nominal_dims = nominal_dims or {}
        tolerances = tolerances or {}
        unit = nominal_dims.get("unit", "mm")

        # Standard keys to inspect
        keys = [k for k in ["length", "width", "height"] if k in nominal_dims or k in tolerances]
        if not keys:
            keys = ["length", "width", "height"]

        evaluated: Dict[str, Any] = {}
        worst_ratio = 0.0
        has_fail = False
        has_borderline = False

        for dim in keys:
            nominal = float(nominal_dims.get(dim, 100.0) or 100.0)
            tol = float(tolerances.get(dim, 0.05) or 0.05)
            tol = max(tol, 0.001)  # prevent division by zero

            # Determine measured value
            if measured_values and dim in measured_values and measured_values[dim] is not None:
                measured = float(measured_values[dim])
            else:
                # Generate realistic measurement based on preset or nominal
                if preset_type == "fail_tolerance" and dim == "length":
                    # Out of tolerance by +0.12mm when tol is 0.05mm
                    measured = round(nominal + tol * 2.4, 4)
                elif preset_type == "uncertain_borderline" and dim == "width":
                    # Exactly on the borderline (95% of tolerance)
                    measured = round(nominal + tol * 0.94, 4)
                else:
                    # Healthy Gaussian within 30% of tolerance band
                    delta = random.gauss(0, tol * 0.25)
                    measured = round(nominal + delta, 4)

            deviation = round(measured - nominal, 4)
            abs_dev = abs(deviation)
            ratio = round(abs_dev / tol, 3)

            if ratio > worst_ratio:
                worst_ratio = ratio

            if ratio > 1.0:
                status = "FAIL"
                has_fail = True
            elif ratio >= 0.85:
                status = "BORDERLINE"
                has_borderline = True
            else:
                status = "PASS"

            evaluated[dim] = {
                "nominal": nominal,
                "measured": measured,
                "tolerance": tol,
                "deviation": deviation,
                "ratio_pct": round(ratio * 100, 1),
                "status": status,
                "unit": unit,
                "upper_limit": round(nominal + tol, 4),
                "lower_limit": round(nominal - tol, 4),
            }

        if has_fail:
            overall_status = "FAIL"
        elif has_borderline:
            overall_status = "BORDERLINE"
        else:
            overall_status = "PASS"

        return evaluated, overall_status, worst_ratio

    def generate_laser_profilometer_stream(
        self,
        length: float = 150.0,
        height: float = 45.0,
        has_defect: bool = False,
        num_points: int = 60
    ) -> List[Dict[str, float]]:
        """
        Generates simulated 2D Laser Triangulation Profilometer cross-section data points (X, Z).
        Useful for live profilometer chart display.
        """
        points = []
        step = length / num_points
        defect_idx = num_points // 2

        for i in range(num_points):
            x = round(i * step, 2)
            # Baseline height with microscopic surface roughness
            roughness = random.gauss(0, 0.008)
            z = height + roughness

            # Add chamfer at edges
            if x < 10:
                z -= (10 - x) * 0.3
            elif x > length - 10:
                z -= (x - (length - 10)) * 0.3

            # Add defect crater/pit if requested
            if has_defect and abs(i - defect_idx) < 3:
                depth = 0.35 * (1 - abs(i - defect_idx) / 3)
                z -= depth

            points.append({
                "x_position_mm": x,
                "z_height_mm": round(z, 4),
                "roughness_ra": round(0.4 + random.uniform(-0.05, 0.08), 2)
            })

        return points


metrology_engine = MetrologyEngine()
