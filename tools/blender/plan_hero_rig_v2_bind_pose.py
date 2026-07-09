"""Create a static rig-v2 bind-pose and pivot debug sheet from extracted parts."""

import json
import math
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[2]
RIG_DIR = ROOT / "assets/james-bond/level-01-briefing/rig-v2"
METADATA = RIG_DIR / "hero-rig-v2.json"
OUT_DIR = ROOT / "test-results/hero-rig-v2/bind-pose"
FRAME_W = 192
FRAME_H = 220


LAYOUT = {
    "head": {"height": 64, "pivot": (0.52, 0.84), "anchor": (91, 66), "rotation": 0, "depth": 12},
    "torso": {"height": 86, "pivot": (0.53, 0.12), "anchor": (92, 72), "rotation": 0, "depth": 6},
    "bag": {"height": 48, "pivot": (0.52, 0.18), "anchor": (74, 91), "rotation": -4, "depth": 2},
    "rear_upper_arm": {"height": 43, "pivot": (0.46, 0.11), "anchor": (78, 88), "rotation": -12, "depth": 3},
    "rear_forearm": {"height": 29, "pivot": (0.10, 0.52), "anchor": (74, 120), "rotation": -7, "depth": 4},
    "rear_thigh": {"height": 60, "pivot": (0.50, 0.07), "anchor": (89, 128), "rotation": 8, "depth": 1},
    "rear_shin": {"height": 54, "pivot": (0.50, 0.08), "anchor": (81, 165), "rotation": -8, "depth": 1},
    "rear_boot": {"height": 28, "pivot": (0.22, 0.18), "anchor": (74, 205), "rotation": -6, "depth": 1},
    "front_thigh": {"height": 60, "pivot": (0.50, 0.07), "anchor": (103, 128), "rotation": -9, "depth": 8},
    "front_shin": {"height": 54, "pivot": (0.50, 0.08), "anchor": (111, 165), "rotation": 8, "depth": 9},
    "front_boot": {"height": 28, "pivot": (0.22, 0.18), "anchor": (117, 205), "rotation": 4, "depth": 10},
    "front_upper_arm": {"height": 43, "pivot": (0.46, 0.11), "anchor": (103, 88), "rotation": 12, "depth": 13},
    "front_forearm": {"height": 29, "pivot": (0.10, 0.52), "anchor": (111, 120), "rotation": 6, "depth": 14},
}


def scaled_part(part, height):
    image = Image.open(ROOT / part["path"]).convert("RGBA")
    width = round(image.width * (height / image.height))
    return image.resize((max(1, width), height), Image.Resampling.LANCZOS)


def paste_rotated(canvas, image, anchor, pivot, rotation):
    px = pivot[0] * image.width
    py = pivot[1] * image.height
    pad = max(image.width, image.height)
    padded = Image.new("RGBA", (image.width + pad * 2, image.height + pad * 2), (0, 0, 0, 0))
    padded.alpha_composite(image, (pad, pad))
    rotated = padded.rotate(rotation, resample=Image.Resampling.BICUBIC, center=(pad + px, pad + py))
    canvas.alpha_composite(rotated, (round(anchor[0] - pad - px), round(anchor[1] - pad - py)))


def draw_marker(draw, xy, fill, outline):
    x, y = xy
    draw.ellipse((x - 3, y - 3, x + 3, y + 3), fill=fill, outline=outline, width=1)


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    metadata = json.loads(METADATA.read_text(encoding="utf-8"))
    parts = {part["name"]: part for part in metadata["parts"]}
    missing = [name for name in LAYOUT if name not in parts]
    if missing:
        raise RuntimeError(f"Missing rig parts: {missing}")

    canvas = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    debug = Image.new("RGBA", (FRAME_W, FRAME_H), (210, 218, 200, 255))
    draw = ImageDraw.Draw(debug)

    for name, spec in sorted(LAYOUT.items(), key=lambda item: item[1]["depth"]):
        image = scaled_part(parts[name], spec["height"])
        paste_rotated(canvas, image, spec["anchor"], spec["pivot"], spec["rotation"])

    debug.alpha_composite(canvas)
    for name, spec in LAYOUT.items():
        draw_marker(draw, spec["anchor"], (40, 120, 255, 230), (255, 255, 255, 255))
        draw.text((spec["anchor"][0] + 5, spec["anchor"][1] - 5), name.split("_")[0], fill=(20, 50, 90, 255))

    canvas.save(OUT_DIR / "bind-pose.png")
    debug.save(OUT_DIR / "bind-pose-debug.png")

    row = Image.new("RGBA", (FRAME_W * 2, FRAME_H), (0, 0, 0, 0))
    row.alpha_composite(canvas, (0, 0))
    row.alpha_composite(debug, (FRAME_W, 0))
    row.save(OUT_DIR / "bind-pose-comparison.png")
    print(OUT_DIR / "bind-pose.png")
    print(OUT_DIR / "bind-pose-debug.png")
    print(OUT_DIR / "bind-pose-comparison.png")


if __name__ == "__main__":
    main()
