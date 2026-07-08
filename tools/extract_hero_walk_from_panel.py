"""Slice the hand-drawn 8-frame side walk cycle from the painted source panel.

The source panel `hero-spy-source-panel.png` already contains a complete,
professionally hand-drawn side walk cycle (bottom band, 8 frames). Earlier tools
tried to synthesise a walk by posing a 2D puppet in Blender, which produced
occlusion "sliver" legs and, once the legs were separated to avoid that, a
"doubled feet" look. Using the artist's real frames avoids all of that.

This tool crops those 8 frames, removes the cream background and the drop-shadow
smudge, then normalises each frame to a 192x220 cell aligned on a stable boot
baseline and body centre. It writes `walk_01.png ... walk_08.png` into an output
directory that `tools/blender/publish_hero_walk.py` consumes unchanged.
"""

import argparse
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets/james-bond/level-01-briefing/generated/hero-spy-source-panel.png"

FRAME_W = 192
FRAME_H = 220
COLS = 8

# Horizontal centres of the 8 walk figures in the source panel (detected from the
# foreground density peaks of the bottom walk band).
CENTERS = [172, 357, 520, 689, 879, 1061, 1233, 1404]
HALF_W = 95          # half crop width around each centre
BAND_TOP = 688       # clip the reference-pose row that bleeds in above frames 6-8
BAND_BOTTOM = 958

BG_COLOR = np.array([245, 242, 232])   # cream page background
BG_TOLERANCE = 42                      # colour distance treated as background

TARGET_BASELINE = 214    # y the lowest boot pixel lands on inside the 192x220 cell
TARGET_HEIGHT = 206      # figure height the tallest frame is scaled to fill


def remove_background(crop):
    """Flood-fill the cream page background to transparent from the crop border."""
    arr = np.array(crop)
    h, w = arr.shape[:2]
    dist = np.abs(arr[:, :, :3].astype(int) - BG_COLOR).sum(axis=2)
    is_bg = dist < BG_TOLERANCE
    seen = np.zeros((h, w), bool)
    dq = deque()
    for x in range(w):
        for y in (0, h - 1):
            if is_bg[y, x]:
                seen[y, x] = True
                dq.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if is_bg[y, x] and not seen[y, x]:
                seen[y, x] = True
                dq.append((y, x))
    while dq:
        y, x = dq.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not seen[ny, nx] and is_bg[ny, nx]:
                seen[ny, nx] = True
                dq.append((ny, nx))
    arr[seen, 3] = 0
    return Image.fromarray(arr)


def keep_largest_component(img, min_alpha=40):
    """Drop the drop-shadow smudge and any stray specks, keeping only the figure."""
    arr = np.array(img)
    solid = arr[:, :, 3] >= min_alpha
    h, w = solid.shape
    label = np.zeros((h, w), int)
    current = 0
    best_label, best_size = 0, 0
    for sy in range(h):
        for sx in range(w):
            if solid[sy, sx] and label[sy, sx] == 0:
                current += 1
                size = 0
                dq = deque([(sy, sx)])
                label[sy, sx] = current
                while dq:
                    y, x = dq.popleft()
                    size += 1
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        ny, nx = y + dy, x + dx
                        if 0 <= ny < h and 0 <= nx < w and solid[ny, nx] and label[ny, nx] == 0:
                            label[ny, nx] = current
                            dq.append((ny, nx))
                if size > best_size:
                    best_size, best_label = size, current
    arr[label != best_label, 3] = 0
    return Image.fromarray(arr)


def strip_ground_shadow(img):
    """Remove the artist's light drop-shadow speckle under the boots.

    The shadow is a light, faintly-coloured speckle at the very bottom of the
    crop that touches the boot sole, so it survives component cleanup. Only the
    boots occupy that bottom band and they are dark brown, so any light pixel in
    the lowest rows can be cleared without touching the scarf, skin or trousers
    higher up."""
    arr = np.array(img).astype(int)
    h = arr.shape[0]
    band_top = h - 48
    rgb = arr[:, :, :3]
    light = rgb.min(axis=2) > 150
    rows = np.arange(h)[:, None] >= band_top
    clear = light & rows & (arr[:, :, 3] > 0)
    arr[clear, 3] = 0
    return Image.fromarray(arr.astype(np.uint8))


def clean_frame(crop):
    return keep_largest_component(strip_ground_shadow(remove_background(crop)))


def extract_raw_frames(source):
    frames = []
    for cx in CENTERS:
        crop = source.crop((cx - HALF_W, BAND_TOP, cx + HALF_W, BAND_BOTTOM))
        frames.append(clean_frame(crop))
    return frames


def _anchor(frame):
    """Locate a stable horizontal anchor and the figure bounds for one frame.

    The full bounding box is a poor anchor for a walk cycle: it is dominated by
    the swinging arm and the striding legs, so centring on it re-anchors the
    whole body every frame and cancels the visible foot motion (the character
    just shuffles in place). The upper torso barely translates during a walk, so
    we anchor on the mean x of the torso band instead. That keeps the body
    planted while the arms and feet swing naturally."""
    alpha = np.array(frame.getchannel("A"))
    ys, xs = np.where(alpha > 40)
    y0, y1 = ys.min(), ys.max()
    x0, x1 = xs.min(), xs.max()
    height = y1 - y0
    top = y0 + int(height * 0.15)
    bot = y0 + int(height * 0.45)
    band = alpha[top:bot, :]
    band_xs = np.where(band > 40)[1]
    anchor_x = band_xs.mean()
    tight = frame.crop((x0, y0, x1 + 1, y1 + 1))
    return tight, anchor_x - x0, height


def normalise(frames):
    """Scale all frames by one global factor, then align each frame so its torso
    anchor sits at the cell centre and its lowest boot sits on the baseline."""
    anchors = [_anchor(frame) for frame in frames]
    tallest = max(height for _, _, height in anchors)
    scale = TARGET_HEIGHT / tallest
    out = []
    for tight, anchor_x, _ in anchors:
        nw = max(1, round(tight.width * scale))
        nh = max(1, round(tight.height * scale))
        resized = tight.resize((nw, nh), Image.LANCZOS)
        cell = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
        x = round(FRAME_W / 2 - anchor_x * scale)
        y = TARGET_BASELINE - nh
        cell.alpha_composite(resized, (x, y))
        out.append(cell)
    return out


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)

    source = Image.open(SRC).convert("RGBA")
    frames = normalise(extract_raw_frames(source))
    for index, frame in enumerate(frames):
        frame.save(args.output_dir / f"walk_{index + 1:02d}.png")
    print(f"Wrote {len(frames)} walk frames to {args.output_dir}")


if __name__ == "__main__":
    main()
