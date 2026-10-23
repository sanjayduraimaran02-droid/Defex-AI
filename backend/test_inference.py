import os
import sys
import numpy as np
from PIL import Image

# Ensure backend root is on path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.inference import (
    DefectDetectionAdapter,
    DimensionValidator,
    InspectionOutcome,
    DimensionStatus,
    DefectSeverity,
)

def test_defect_detection_adapter():
    print("Testing DefectDetectionAdapter...")
    adapter = DefectDetectionAdapter(target_size=(800, 600))

    # 1. Test image preprocessing on raw RGB numpy array
    dummy_img = np.zeros((720, 1280, 3), dtype=np.uint8)
    dummy_img[200:500, 300:900] = [120, 130, 140]  # metallic rectangle
    enhanced_rgb, normalized, meta = adapter.preprocess(dummy_img)

    assert enhanced_rgb.shape == (600, 800, 3), f"Unexpected shape: {enhanced_rgb.shape}"
    assert normalized.shape == (600, 800, 3)
    assert 0.0 <= normalized.min() and normalized.max() <= 1.0
    assert meta["original_dimensions"] == [1280, 720]
    assert meta["resized_dimensions"] == [800, 600]
    print("  [OK] Preprocessing: Resizing, CLAHE, and Normalization verified.")

    # 2. Test Detection: Preset 'fail_crack'
    res_crack = adapter.detect(dummy_img, scenario_preset="fail_crack", part_code="PRT-CAM-08")
    assert res_crack.outcome == InspectionOutcome.FAIL
    assert len(res_crack.defects) == 1
    assert res_crack.defects[0].defect_class == "crack"
    assert res_crack.defects[0].severity == DefectSeverity.CRITICAL
    assert res_crack.defects[0].bbox.area > 0
    assert res_crack.annotated_image is not None
    print(f"  [OK] Detection: Crack detected -> Outcome: {res_crack.outcome.value}, Confidence: {res_crack.confidence*100:.1f}%, BBox: {res_crack.defects[0].bbox.to_list()}.")

    # 3. Test Detection: Preset 'fail_burr'
    res_burr = adapter.detect(dummy_img, scenario_preset="fail_burr")
    assert res_burr.outcome == InspectionOutcome.FAIL
    assert res_burr.defects[0].defect_class == "burr"
    print("  [OK] Detection: Burr detected -> Outcome: FAIL.")

    # 4. Test Detection: Preset 'fail_porosity'
    res_porosity = adapter.detect(dummy_img, scenario_preset="fail_porosity")
    assert res_porosity.outcome == InspectionOutcome.FAIL
    assert res_porosity.defects[0].defect_class == "porosity"
    print("  [OK] Detection: Porosity detected -> Outcome: FAIL.")

    # 5. Test Detection: Preset 'uncertain_borderline'
    res_uncertain = adapter.detect(dummy_img, scenario_preset="uncertain_borderline")
    assert res_uncertain.outcome == InspectionOutcome.UNCERTAIN
    assert res_uncertain.defects[0].defect_class == "scratch"
    assert res_uncertain.defects[0].severity == DefectSeverity.WARNING
    print(f"  [OK] Detection: Borderline Scratch -> Outcome: UNCERTAIN (Confidence {res_uncertain.confidence*100:.1f}%).")

    # 6. Test Detection: Preset 'pass' (Clean part)
    res_pass = adapter.detect(dummy_img, scenario_preset="pass")
    assert res_pass.outcome == InspectionOutcome.PASS
    assert len(res_pass.defects) == 0
    assert res_pass.confidence >= 0.95
    print("  [OK] Detection: Clean part -> Outcome: PASS (Zero defects).")


def test_dimension_validator():
    print("\nTesting DimensionValidator...")
    validator = DimensionValidator(borderline_ratio_threshold=0.85)

    nominals = {
        "length": 150.0,
        "width": 80.0,
        "height": 45.0,
        "runout": 0.0,
    }
    tolerances = {
        "length": 0.05,
        "width": 0.05,
        "height": 0.08,
        "runout": 0.015,
    }

    # Case 1: All Dimensions IN_SPEC -> Outcome: PASS
    readings_pass = {
        "length": 150.015,   # dev: +0.015 (30% tol)
        "width": 79.988,     # dev: -0.012 (24% tol)
        "height": 45.020,    # dev: +0.020 (25% tol)
        "runout": 0.005,     # dev: +0.005 (33% tol)
    }
    res_pass = validator.validate(nominals, tolerances, readings_pass)
    assert res_pass.outcome == InspectionOutcome.PASS
    assert res_pass.status == DimensionStatus.IN_SPEC
    assert not res_pass.is_out_of_spec
    print("  [OK] Metrology IN_SPEC: All measurements within bounds -> Outcome: PASS.")

    # Case 2: One dimension BORDERLINE (92% of tolerance) -> Outcome: UNCERTAIN
    readings_borderline = {
        "length": 150.015,
        "width": 80.046,     # dev: +0.046 (92% of 0.05 tol) -> BORDERLINE!
        "height": 45.020,
        "runout": 0.005,
    }
    res_borderline = validator.validate(nominals, tolerances, readings_borderline)
    assert res_borderline.outcome == InspectionOutcome.UNCERTAIN
    assert res_borderline.status == DimensionStatus.BORDERLINE
    assert res_borderline.dimension_checks["width"].status == DimensionStatus.BORDERLINE
    assert not res_borderline.is_out_of_spec
    print("  [OK] Metrology BORDERLINE: Width at 92% tolerance -> Outcome: UNCERTAIN.")

    # Case 3: Runout EXCEEDS tolerance -> OUT_OF_SPEC -> Overrides outcome strictly to FAIL
    readings_runout_fail = {
        "length": 150.010,
        "width": 80.010,
        "height": 45.010,
        "runout": 0.022,     # dev: 0.022 > 0.015 tol (146.7% ratio) -> OUT_OF_SPEC!
    }
    res_runout_fail = validator.validate(nominals, tolerances, readings_runout_fail)
    assert res_runout_fail.outcome == InspectionOutcome.FAIL
    assert res_runout_fail.status == DimensionStatus.OUT_OF_SPEC
    assert res_runout_fail.is_out_of_spec == True
    assert res_runout_fail.dimension_checks["runout"].status == DimensionStatus.OUT_OF_SPEC
    print(f"  [OK] Metrology OUT_OF_SPEC (Runout): Runout {readings_runout_fail['runout']}mm > 0.015mm -> Outcome OVERRIDDEN TO FAIL.")

    # Case 4: Length EXCEEDS tolerance -> OUT_OF_SPEC -> Overrides outcome strictly to FAIL
    readings_length_fail = {
        "length": 150.120,   # dev: +0.120 > 0.05 tol -> OUT_OF_SPEC!
        "width": 80.010,
        "height": 45.010,
        "runout": 0.005,
    }
    res_len_fail = validator.validate(nominals, tolerances, readings_length_fail)
    assert res_len_fail.outcome == InspectionOutcome.FAIL
    assert res_len_fail.status == DimensionStatus.OUT_OF_SPEC
    assert res_len_fail.is_out_of_spec == True
    print(f"  [OK] Metrology OUT_OF_SPEC (Length): Length deviation +0.120mm > 0.05mm -> Outcome OVERRIDDEN TO FAIL.")


if __name__ == "__main__":
    test_defect_detection_adapter()
    test_dimension_validator()
    print("\nALL INFERENCE & METROLOGY SERVICE TESTS PASSED 100%!")
