"""Rebuild a real side-walk cycle for the painted hero sprite.

The AI-generated source walk frames are all the same wide-stance "split" pose:
both boots stay planted on the ground and never lift or pass each other, so the
character looks like it is sliding rather than walking.

This script takes one clean side pose (the idle-side frame), segments the two
legs at the shorts hem, and animates them as opposite-phase pendulums about the
hip with an alternating foot lift. The torso is composited on top so the hip
seam stays hidden. The resulting 8 frames replace the side-walk row (frames
16-23) in the painted spritesheet, which is what the game plays for every
walk direction.
"""

from collections import deque
from pathlib import Path
import math

from PIL import Image

SHEET = Path("assets/phaser/hero-painted-spritesheet.png")
BACKUP = Path("assets/phaser/hero-painted-spritesheet.backup.png")
FRAME_W = 192
FRAME_H = 220
COLS = 8

# Source pose (idle-side) and destination row (side walk).
BASE_INDEX = 40
SIDE_WALK_START = 16

# Segmentation / rig parameters (in frame coordinates).
HEM_Y = 161          # cut line where the two legs separate below the shorts
ALPHA_MIN = 90       # ignore soft ground shadow when finding leg blobs
SWING_DEG = 34.0     # peak leg swing angle
FOOT_LIFT = 15       # peak vertical lift of the swinging foot (px)


def frame_box(index):
    return ((index % COLS) * FRAME_W, (index // COLS) * FRAME_H,
            (index % COLS) * FRAME_W + FRAME_W, (index // COLS) * FRAME_H + FRAME_H)


def leg_components(base):
    """Find connected leg blobs below the hem line."""
    alpha = base.getchannel("A").load()
    seen = set()
    blobs = []
    for y in range(HEM_Y, FRAME_H):
        for x in range(FRAME_W):
            if (x, y) in seen or alpha[x, y] < ALPHA_MIN:
                continue
            queue = deque([(x, y)])
            seen.add((x, y))
            pixels = []
            while queue:
                px, py = queue.popleft()
                pixels.append((px, py))
                for nx, ny in ((px + 1, py), (px - 1, py), (px, py + 1), (px, py - 1)):
                    if (0 <= nx < FRAME_W and HEM_Y <= ny < FRAME_H
                            and (nx, ny) not in seen and alpha[nx, ny] >= ALPHA_MIN):
                        seen.add((nx, ny))
                        queue.append((nx, ny))
            if len(pixels) >= 400:
                blobs.append(pixels)
    return blobs


def layer_from_pixels(base, pixels):
    """Create a full-frame RGBA layer containing only the given pixels, plus a
    short overlap strip just above the hem so a rotated leg stays attached to
    the torso."""
    layer = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    src = base.load()
    dst = layer.load()
    xs = [p[0] for p in pixels]
    x0, x1 = min(xs), max(xs)
    # Copy the leg pixels.
    for x, y in pixels:
        dst[x, y] = src[x, y]
    # Copy a small overlap band above the hem within this leg's x-range so the
    # top of the leg has material to rotate under the shorts.
    for y in range(HEM_Y - 10, HEM_Y):
        for x in range(x0, x1 + 1):
            if src[x, y][3] > 0:
                dst[x, y] = src[x, y]
    pivot = ((x0 + x1) / 2, HEM_Y - 4)
    return layer, pivot


def torso_layer(base, leg_blobs):
    """Torso = the base with the leg pixels erased (shorts remain to cover hips)."""
    torso = base.copy()
    dst = torso.load()
    for pixels in leg_blobs:
        for x, y in pixels:
            dst[x, y] = (0, 0, 0, 0)
    return torso


def render_cycle(base):
    blobs = leg_components(base)
    if len(blobs) < 2:
        raise SystemExit(f"Expected 2 legs, found {len(blobs)} - adjust HEM_Y/ALPHA_MIN")
    # Keep the two largest blobs, order by x (front = larger x for right-facing).
    blobs = sorted(blobs, key=len, reverse=True)[:2]
    blobs = sorted(blobs, key=lambda pix: sum(p[0] for p in pix) / len(pix))
    back_leg, front_leg = blobs[0], blobs[1]
    back_layer, back_pivot = layer_from_pixels(base, back_leg)
    front_layer, front_pivot = layer_from_pixels(base, front_leg)
    torso = torso_layer(base, blobs)

    frames = []
    for i in range(8):
        phase = i / 8.0
        s = math.sin(2 * math.pi * phase)
        c = math.cos(2 * math.pi * phase)
        # Opposite-phase pendulum swing. Positive PIL angle rotates CCW; a
        # negative angle swings the hanging foot toward +x (screen right).
        front_angle = -SWING_DEG * s
        back_angle = SWING_DEG * s
        # A foot lifts while it swings forward (rear -> front half of its cycle).
        front_lift = max(0.0, c) * FOOT_LIFT
        back_lift = max(0.0, -c) * FOOT_LIFT

        frame = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
        back_r = back_layer.rotate(back_angle, resample=Image.BICUBIC,
                                   center=back_pivot, translate=(0, -back_lift))
        front_r = front_layer.rotate(front_angle, resample=Image.BICUBIC,
                                     center=front_pivot, translate=(0, -front_lift))
        # Back leg behind torso, front leg in front of torso for depth.
        frame.alpha_composite(back_r)
        frame.alpha_composite(torso)
        frame.alpha_composite(front_r)
        frames.append(frame)
    return frames


def main():
    sheet = Image.open(SHEET).convert("RGBA")
    if not BACKUP.exists():
        sheet.save(BACKUP)
        print(f"Backed up original sheet -> {BACKUP}")
    base = sheet.crop(frame_box(BASE_INDEX))
    frames = render_cycle(base)

    # Preview artifacts.
    preview = Image.new("RGBA", (FRAME_W * 8, FRAME_H), (25, 25, 25, 255))
    for i, f in enumerate(frames):
        preview.alpha_composite(f, (i * FRAME_W, 0))
    preview.save("/tmp/walk_cycle_preview.png")
    gif = [f.convert("RGBA") for f in frames]
    bg = Image.new("RGBA", (FRAME_W, FRAME_H), (200, 210, 190, 255))
    gif = [Image.alpha_composite(bg, f).convert("P", palette=Image.ADAPTIVE) for f in gif]
    gif[0].save("/tmp/walk_cycle_preview.gif", save_all=True,
                append_images=gif[1:], duration=100, loop=0, disposal=2)
    print("Wrote /tmp/walk_cycle_preview.png and .gif")

    if "--write" in __import__("sys").argv:
        for i, f in enumerate(frames):
            box = frame_box(SIDE_WALK_START + i)
            sheet.paste(f, (box[0], box[1]))
        sheet.save(SHEET)
        print(f"Updated side-walk frames {SIDE_WALK_START}-{SIDE_WALK_START + 7} in {SHEET}")


if __name__ == "__main__":
    main()
