from PIL import Image, ImageChops, ImageStat
from pathlib import Path
import json
import sys

ASSETS = {
    "hero": {
        "path": Path("assets/phaser/hero-painted-spritesheet.png"),
        "frameWidth": 192,
        "frameHeight": 220,
        "columns": 8,
        "frameCount": 48,
        "walkRows": {
            "walkSide": range(16, 24),
        },
        "maxBaselineDrift": 3,
        "maxCenterDrift": 6,
        "minFeetMotion": 18,
    },
    "guide": {
        "path": Path("assets/phaser/guide-painted-spritesheet.png"),
        "frameWidth": 192,
        "frameHeight": 220,
        "columns": 4,
        "frameCount": 12,
        "walkRows": {},
        "maxBaselineDrift": 3,
        "maxCenterDrift": 6,
    },
    "james_bond_hero": {
        "path": Path("assets/james-bond/level-01-briefing/generated/hero-spy-balanced-phaser-spritesheet.png"),
        "frameWidth": 192,
        "frameHeight": 220,
        "columns": 8,
        "frameCount": 40,
        "requiredFrames": [0, 1, 2, *range(16, 27), 32],
        "walkRows": {
            "walkSide": range(16, 24),
        },
        "maxBaselineDrift": 5,
        "maxCenterDrift": 14,
        "minFeetMotion": 18,
    },
}


def frame_bbox(sheet, index):
    raise RuntimeError("frame_bbox requires an asset spec")


def frame_bbox_for_spec(sheet, index, spec):
    frame_w = spec["frameWidth"]
    frame_h = spec["frameHeight"]
    cols = spec["columns"]
    left = (index % cols) * frame_w
    top = (index // cols) * frame_h
    alpha = sheet.crop((left, top, left + frame_w, top + frame_h)).getchannel("A")
    return alpha.getbbox()


def frame_metrics(sheet, index, spec):
    bbox = frame_bbox_for_spec(sheet, index, spec)
    if not bbox:
        return None
    left, top, right, bottom = bbox
    return {
        "index": index,
        "bbox": [left, top, right, bottom],
        "baseline": spec["frameHeight"] - bottom,
        "centerX": (left + right) / 2,
        "height": bottom - top,
    }


def frame_crop(sheet, index, spec):
    frame_w = spec["frameWidth"]
    frame_h = spec["frameHeight"]
    cols = spec["columns"]
    left = (index % cols) * frame_w
    top = (index // cols) * frame_h
    return sheet.crop((left, top, left + frame_w, top + frame_h))


def diff_score(frame_a, frame_b, box):
    diff = ImageChops.difference(frame_a.crop(box), frame_b.crop(box)).convert("RGBA")
    return sum(ImageStat.Stat(diff).mean[:3])


def validate_asset(name, spec):
    errors = []
    warnings = []
    path = spec["path"]
    if not path.exists():
        return {"name": name, "ok": False, "errors": [f"Missing {path}"], "warnings": warnings}

    sheet = Image.open(path).convert("RGBA")
    expected_rows = (spec["frameCount"] + spec["columns"] - 1) // spec["columns"]
    expected_size = (spec["frameWidth"] * spec["columns"], spec["frameHeight"] * expected_rows)
    if sheet.size != expected_size:
        errors.append(f"{path} has size {sheet.size}, expected {expected_size}")

    metrics = []
    required_frames = set(spec.get("requiredFrames") or range(spec["frameCount"]))
    for index in range(spec["frameCount"]):
        metric = frame_metrics(sheet, index, spec)
        if metric is None:
            if index in required_frames:
                errors.append(f"{name} frame {index} is empty")
        else:
            metrics.append(metric)
            if metric["baseline"] > 12:
                warnings.append(f"{name} frame {index} floats high: baseline gap {metric['baseline']}px")

    for row_name, indexes in spec["walkRows"].items():
        row_metrics = [m for m in metrics if m["index"] in indexes]
        baselines = [m["baseline"] for m in row_metrics]
        centers = [m["centerX"] for m in row_metrics]
        if baselines:
            baseline_drift = max(baselines) - min(baselines)
            if baseline_drift > spec["maxBaselineDrift"]:
                errors.append(f"{name} {row_name} baseline drift is {baseline_drift}px")
        if centers:
            center_drift = max(centers) - min(centers)
            if center_drift > spec["maxCenterDrift"]:
                errors.append(f"{name} {row_name} center drift is {center_drift:.2f}px")
        frames = [frame_crop(sheet, index, spec) for index in indexes]
        feet_box = (20, int(spec["frameHeight"] * 0.63), spec["frameWidth"] - 20, spec["frameHeight"])
        feet_scores = [diff_score(a, b, feet_box) for a, b in zip(frames, frames[1:])]
        if feet_scores:
            average_feet_motion = sum(feet_scores) / len(feet_scores)
            if average_feet_motion < spec.get("minFeetMotion", 0):
                errors.append(f"{name} {row_name} feet motion is too low: {average_feet_motion:.2f}")

    return {
        "name": name,
        "path": str(path),
        "ok": not errors,
        "errors": errors,
        "warnings": warnings,
        "sampleMetrics": metrics[:4],
    }


def main():
    report = {"assets": [validate_asset(name, spec) for name, spec in ASSETS.items()]}
    report["ok"] = all(asset["ok"] for asset in report["assets"])
    print(json.dumps(report, indent=2))
    if not report["ok"]:
        sys.exit(1)


if __name__ == "__main__":
    main()
