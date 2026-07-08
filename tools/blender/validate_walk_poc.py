"""Validate Blender POC assets after rendering and packing."""

from pathlib import Path
from PIL import Image


FRAME_W = 192
FRAME_H = 220
COLS = 8
ROOT = Path(__file__).resolve().parents[2] / "assets/james-bond/level-01-briefing/blender-poc"


def assert_png(path, expected_size):
    image = Image.open(path).convert("RGBA")
    if image.size != expected_size:
        raise RuntimeError(f"{path} has size {image.size}, expected {expected_size}")
    if not image.getchannel("A").getbbox():
        raise RuntimeError(f"{path} is fully transparent")
    corners = [
        image.getpixel((0, 0))[3],
        image.getpixel((image.width - 1, 0))[3],
        image.getpixel((0, image.height - 1))[3],
        image.getpixel((image.width - 1, image.height - 1))[3],
    ]
    if any(corners):
        raise RuntimeError(f"{path} has non-transparent corner pixels: {corners}")
    return image


def main():
    frames = sorted((ROOT / "frames").glob("walk_*.png"))
    if len(frames) != COLS:
        raise RuntimeError(f"Expected {COLS} rendered frames, found {len(frames)}")
    for frame in frames:
        assert_png(frame, (FRAME_W, FRAME_H))
    assert_png(ROOT / "agent-walk-row.png", (FRAME_W * COLS, FRAME_H))
    assert_png(ROOT / "agent-phaser-spritesheet.png", (FRAME_W * COLS, FRAME_H * 6))
    print("Blender POC assets validated")


if __name__ == "__main__":
    main()
