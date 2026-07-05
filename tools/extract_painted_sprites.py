from collections import deque
from pathlib import Path
from PIL import Image, ImageFilter
import json
import math

HERO_SOURCE = Path("/Users/I024148/.codex/generated_images/019f2df7-1577-7b63-a26c-c452243575bf/ig_0371b63e17b1286a016a49464fc45c8191b0b649a4ba47abc2.png")
GUIDE_SOURCE = Path("/Users/I024148/.codex/generated_images/019f2df7-1577-7b63-a26c-c452243575bf/ig_043ef24e6e0870fd016a49a87b18b0819198ba508f416f8586.png")
OUT_DIR = Path("assets/phaser")

FRAME_W = 192
FRAME_H = 220
PORTRAIT = 128
COLS = 8


def remove_edge_background(image, mode="paper"):
    image = image.convert("RGBA")
    pixels = image.load()
    width, height = image.size
    visited = set()
    queue = deque()
    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))

    def is_background(r, g, b):
        if mode == "green":
            return g > 145 and g > r * 1.25 and g > b * 1.25
        saturation = max(r, g, b) - min(r, g, b)
        bright = (r + g + b) / 3
        return bright > 172 and saturation < 46

    while queue:
        x, y = queue.popleft()
        if (x, y) in visited or x < 0 or y < 0 or x >= width or y >= height:
            continue
        r, g, b, a = pixels[x, y]
        if a == 0 or not is_background(r, g, b):
            continue
        visited.add((x, y))
        queue.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))

    alpha = Image.new("L", image.size, 255)
    alpha_pixels = alpha.load()
    for x, y in visited:
        alpha_pixels[x, y] = 0
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.45))
    image.putalpha(alpha)
    return image


def fit_to_frame(crop, frame_w=FRAME_W, frame_h=FRAME_H, bottom=208):
    bbox = crop.getbbox()
    if not bbox:
        return Image.new("RGBA", (frame_w, frame_h), (0, 0, 0, 0))
    crop = crop.crop(bbox)
    scale = min((frame_w - 16) / crop.width, (bottom - 8) / crop.height)
    new_size = (max(1, round(crop.width * scale)), max(1, round(crop.height * scale)))
    crop = crop.resize(new_size, Image.Resampling.LANCZOS)
    frame = Image.new("RGBA", (frame_w, frame_h), (0, 0, 0, 0))
    x = (frame_w - crop.width) // 2
    y = bottom - crop.height
    frame.alpha_composite(crop, (x, y))
    return frame


def fit_center(crop, frame_w, frame_h, padding=8):
    bbox = crop.getbbox()
    if not bbox:
        return Image.new("RGBA", (frame_w, frame_h), (0, 0, 0, 0))
    crop = crop.crop(bbox)
    scale = min((frame_w - padding * 2) / crop.width, (frame_h - padding * 2) / crop.height)
    new_size = (max(1, round(crop.width * scale)), max(1, round(crop.height * scale)))
    crop = crop.resize(new_size, Image.Resampling.LANCZOS)
    frame = Image.new("RGBA", (frame_w, frame_h), (0, 0, 0, 0))
    frame.alpha_composite(crop, ((frame_w - crop.width) // 2, (frame_h - crop.height) // 2))
    return frame


def clear_soft_box(image, box):
    left, top, right, bottom = box
    mask = Image.new("L", image.size, 0)
    mask_draw = Image.new("L", (right - left, bottom - top), 255)
    mask_draw = mask_draw.filter(ImageFilter.GaussianBlur(1.2))
    mask.paste(mask_draw, (left, top))
    transparent = Image.new("RGBA", image.size, (0, 0, 0, 0))
    return Image.composite(transparent, image, mask)


def paste_shifted(base, source, box, dx, dy):
    crop = source.crop(box)
    base.alpha_composite(crop, (box[0] + dx, box[1] + dy))


def clear_source_alpha_box(image, source, box):
    left, top, right, bottom = box
    alpha = source.crop(box).getchannel("A").filter(ImageFilter.GaussianBlur(0.7))
    mask = Image.new("L", image.size, 0)
    mask.paste(alpha, (left, top))
    transparent = Image.new("RGBA", image.size, (0, 0, 0, 0))
    return Image.composite(transparent, image, mask)


def make_computed_walk_cycle(base_frame, left_box, right_box):
    cycle = []
    offsets = [
        (-10, -2, 10, 3),
        (-6, 0, 6, 2),
        (0, 4, 0, -2),
        (8, 2, -8, 0),
        (10, 3, -10, -2),
        (6, 2, -6, 0),
        (0, -2, 0, 4),
        (-8, 0, 8, 2),
    ]
    for left_dx, left_dy, right_dx, right_dy in offsets:
        frame = base_frame.copy()
        paste_shifted(frame, base_frame, left_box, left_dx, left_dy)
        paste_shifted(frame, base_frame, right_box, right_dx, right_dy)
        cycle.append(frame)
    return cycle


def paste_frame(sheet, frame, index):
    sheet.alpha_composite(frame, ((index % COLS) * FRAME_W, (index // COLS) * FRAME_H))


def alpha_components(image, min_area=800):
    alpha = image.getchannel("A")
    pixels = alpha.load()
    width, height = image.size
    seen = set()
    boxes = []
    for y in range(height):
        for x in range(width):
            if (x, y) in seen or pixels[x, y] < 18:
                continue
            queue = deque([(x, y)])
            seen.add((x, y))
            min_x = max_x = x
            min_y = max_y = y
            area = 0
            while queue:
                px, py = queue.popleft()
                area += 1
                min_x = min(min_x, px)
                max_x = max(max_x, px)
                min_y = min(min_y, py)
                max_y = max(max_y, py)
                for nx, ny in ((px + 1, py), (px - 1, py), (px, py + 1), (px, py - 1)):
                    if nx < 0 or ny < 0 or nx >= width or ny >= height or (nx, ny) in seen:
                        continue
                    if pixels[nx, ny] >= 18:
                        seen.add((nx, ny))
                        queue.append((nx, ny))
            if area >= min_area:
                boxes.append((min_x, min_y, max_x + 1, max_y + 1, area))
    return sorted(boxes, key=lambda box: box[0])


def extract_hero():
    source = Image.open(HERO_SOURCE).convert("RGBA")
    front = remove_edge_background(source.crop((60, 34, 400, 690)), "paper")
    side_idle = remove_edge_background(source.crop((430, 38, 770, 690)), "paper")
    back = remove_edge_background(source.crop((800, 36, 1095, 690)), "paper")

    walk_row = remove_edge_background(source.crop((0, 690, source.width, 1024)), "paper")
    walk_boxes = alpha_components(walk_row, min_area=1100)[:8]
    walk_frames = []
    for left, top, right, bottom, _area in walk_boxes:
      pad = 8
      crop = walk_row.crop((max(0, left - pad), max(0, top - pad), min(walk_row.width, right + pad), min(walk_row.height, bottom + pad)))
      walk_frames.append(fit_to_frame(crop))

    front_frame = fit_to_frame(front)
    side_idle_frame = fit_to_frame(side_idle)
    back_frame = fit_to_frame(back)
    down_frames = [front_frame.copy() for _ in range(8)]
    up_frames = [back_frame.copy() for _ in range(8)]

    frames = []
    frames.extend(down_frames)
    frames.extend(up_frames)
    frames.extend(walk_frames)
    frames.extend([front_frame] * 8)
    frames.extend([back_frame] * 8)
    frames.extend([side_idle_frame] * 8)

    sheet = Image.new("RGBA", (FRAME_W * COLS, FRAME_H * 6), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        paste_frame(sheet, frame, index)
    sheet.save(OUT_DIR / "hero-painted-spritesheet.png")

    portrait_panel = remove_edge_background(source.crop((1020, 30, 1536, 620)), "paper")
    portrait_boxes = alpha_components(portrait_panel, min_area=900)
    portrait_boxes = [
        box for box in portrait_boxes
        if box[0] > 40 and (box[2] - box[0]) > 100 and (box[3] - box[1]) > 150
    ]
    portrait_boxes = sorted(portrait_boxes, key=lambda box: (0 if box[1] < 350 else 1, box[0]))[:6]
    portraits = Image.new("RGBA", (PORTRAIT * len(portrait_boxes), PORTRAIT), (0, 0, 0, 0))
    for index, (left, top, right, bottom, _area) in enumerate(portrait_boxes):
        pad = 8
        crop = portrait_panel.crop((max(0, left - pad), max(0, top - pad), min(portrait_panel.width, right + pad), min(portrait_panel.height, bottom + pad)))
        frame = fit_center(crop, PORTRAIT, PORTRAIT)
        portraits.alpha_composite(frame, (index * PORTRAIT, 0))
    portraits.save(OUT_DIR / "hero-painted-portraits.png")


def extract_guide():
    source = Image.open(GUIDE_SOURCE).convert("RGBA")
    width, height = source.size
    cell_w = width / 4
    cell_h = height / 3
    sheet = Image.new("RGBA", (FRAME_W * 4, FRAME_H * 3), (0, 0, 0, 0))
    for row in range(3):
        for col in range(4):
            box = (
                math.floor(col * cell_w),
                math.floor(row * cell_h),
                math.ceil((col + 1) * cell_w),
                math.ceil((row + 1) * cell_h),
            )
            crop = remove_edge_background(source.crop(box), "green")
            frame = fit_to_frame(crop)
            sheet.alpha_composite(frame, (col * FRAME_W, row * FRAME_H))
    complete_point = sheet.crop((2 * FRAME_W, 2 * FRAME_H, 3 * FRAME_W, 3 * FRAME_H))
    sheet.alpha_composite(complete_point, (3 * FRAME_W, 2 * FRAME_H))
    sheet.save(OUT_DIR / "guide-painted-spritesheet.png")


def frame_bbox(sheet, index, cols):
    left = (index % cols) * FRAME_W
    top = (index // cols) * FRAME_H
    return sheet.crop((left, top, left + FRAME_W, top + FRAME_H)).getchannel("A").getbbox()


def write_metadata():
    metadata = {
        "frameWidth": FRAME_W,
        "frameHeight": FRAME_H,
        "hero": {
            "file": "assets/phaser/hero-painted-spritesheet.png",
            "portraitFile": "assets/phaser/hero-painted-portraits.png",
            "animations": {
                "walkDown": [0, 7],
                "walkUp": [8, 15],
                "walkSide": [16, 23],
                "idleDown": 24,
                "idleUp": 32,
                "idleSide": 40
            }
        },
        "guide": {
            "file": "assets/phaser/guide-painted-spritesheet.png",
            "animations": {
                "idle": [0, 3],
                "talk": [4, 7],
                "point": [8, 11]
            }
        }
    }
    (OUT_DIR / "painted-sprite-metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    extract_hero()
    extract_guide()
    write_metadata()
    print("Wrote painted hero, guide, portraits, and metadata.")


if __name__ == "__main__":
    main()
