from PIL import Image, ImageDraw
import json
from pathlib import Path

SCALE = 3
FRAME_W = 96
FRAME_H = 128
COLS = 8


def sc(value):
    if isinstance(value, tuple):
        return tuple(sc(v) for v in value)
    return int(round(value * SCALE))


def color(hex_value, alpha=255):
    hex_value = hex_value.lstrip("#")
    return tuple(int(hex_value[i:i + 2], 16) for i in (0, 2, 4)) + (alpha,)


def draw_ellipse(draw, box, fill, outline=None, width=1):
    draw.ellipse(sc(box), fill=fill, outline=outline, width=sc(width))


def draw_rect(draw, box, fill, outline=None, width=1):
    draw.rounded_rectangle(sc(box), radius=sc(2), fill=fill, outline=outline, width=sc(width))


def draw_line(draw, points, fill, width=2):
    draw.line([sc(point) for point in points], fill=fill, width=sc(width), joint="curve")


def draw_poly(draw, points, fill, outline=None):
    draw.polygon([sc(point) for point in points], fill=fill)
    if outline:
        draw.line([sc(point) for point in points + [points[0]]], fill=outline, width=sc(1))


def add_painted_marks(draw, cx, bob=0, side=False):
    highlight = color("#f1c178", 82)
    warm_shadow = color("#5a3924", 70)
    cool_shadow = color("#173837", 42)
    if side:
        draw_line(draw, [(cx - 9, 51 + bob), (cx + 4, 81 + bob)], highlight, 2)
        draw_line(draw, [(cx + 10, 52 + bob), (cx + 18, 78 + bob)], warm_shadow, 2)
        draw_line(draw, [(cx - 18, 68 + bob), (cx - 26, 84 + bob)], cool_shadow, 2)
    else:
        draw_line(draw, [(cx - 15, 49 + bob), (cx - 6, 82 + bob)], highlight, 2)
        draw_line(draw, [(cx + 11, 49 + bob), (cx + 18, 83 + bob)], warm_shadow, 2)
        draw_line(draw, [(cx - 24, 66 + bob), (cx - 33, 86 + bob)], cool_shadow, 2)


def frame_canvas():
    return Image.new("RGBA", (FRAME_W * SCALE, FRAME_H * SCALE), (0, 0, 0, 0))


def paste_frame(sheet, frame, index):
    frame = frame.resize((FRAME_W, FRAME_H), Image.Resampling.LANCZOS)
    sheet.alpha_composite(frame, ((index % COLS) * FRAME_W, (index // COLS) * FRAME_H))


def limb_poly(cx, top, length, width, swing, fill):
    return [
        (cx - width / 2 + swing, top),
        (cx + width / 2 + swing, top),
        (cx + width / 2 + swing * 0.5, top + length),
        (cx - width / 2 + swing * 0.5, top + length),
    ]


def draw_face(draw, cx, cy, expression, side=False):
    ink = color("#172321")
    skin_shadow = color("#8e5336")
    if side:
        draw_ellipse(draw, (cx + 3, cy - 12, cx + 25, cy + 14), color("#b97850"), skin_shadow)
        draw_ellipse(draw, (cx + 16, cy - 2, cx + 29, cy + 7), color("#b97850"))
        draw_ellipse(draw, (cx + 18, cy - 3, cx + 21, cy), ink)
        if expression == "surprised":
            draw_ellipse(draw, (cx + 18, cy + 7, cx + 23, cy + 12), color("#5b2a1d"))
        elif expression == "thinking":
            draw_line(draw, [(cx + 16, cy + 7), (cx + 24, cy + 5)], color("#5b2a1d"), 2)
        else:
            draw_line(draw, [(cx + 17, cy + 8), (cx + 24, cy + 10)], color("#5b2a1d"), 2)
        return

    draw_ellipse(draw, (cx - 15, cy - 14, cx + 15, cy + 15), color("#b97850"), skin_shadow)
    eye_y = cy - 4
    if expression == "surprised":
        draw_ellipse(draw, (cx - 8, eye_y - 2, cx - 4, eye_y + 3), ink)
        draw_ellipse(draw, (cx + 5, eye_y - 2, cx + 9, eye_y + 3), ink)
        draw_ellipse(draw, (cx - 3, cy + 6, cx + 4, cy + 13), color("#5b2a1d"))
    elif expression == "thinking":
        draw_line(draw, [(cx - 12, eye_y - 4), (cx - 4, eye_y - 6)], ink, 2)
        draw_line(draw, [(cx + 4, eye_y - 6), (cx + 12, eye_y - 4)], ink, 2)
        draw_ellipse(draw, (cx - 7, eye_y - 1, cx - 4, eye_y + 2), ink)
        draw_ellipse(draw, (cx + 4, eye_y - 1, cx + 7, eye_y + 2), ink)
        draw_line(draw, [(cx - 4, cy + 10), (cx + 6, cy + 8)], color("#5b2a1d"), 2)
    elif expression == "curious":
        draw_line(draw, [(cx - 11, eye_y - 7), (cx - 3, eye_y - 9)], ink, 2)
        draw_line(draw, [(cx + 4, eye_y - 7), (cx + 12, eye_y - 5)], ink, 2)
        draw_ellipse(draw, (cx - 7, eye_y - 1, cx - 4, eye_y + 2), ink)
        draw_ellipse(draw, (cx + 4, eye_y - 1, cx + 7, eye_y + 2), ink)
        draw_line(draw, [(cx - 3, cy + 9), (cx + 5, cy + 11)], color("#5b2a1d"), 2)
    else:
        draw_ellipse(draw, (cx - 7, eye_y - 1, cx - 4, eye_y + 2), ink)
        draw_ellipse(draw, (cx + 4, eye_y - 1, cx + 7, eye_y + 2), ink)
        mouth_w = 12 if expression == "smile" else 8
        draw.arc(sc((cx - mouth_w / 2, cy + 4, cx + mouth_w / 2, cy + 13)), 8, 172, fill=color("#5b2a1d"), width=sc(2))


def draw_hero_frame(direction, step=0, expression="normal"):
    img = frame_canvas()
    draw = ImageDraw.Draw(img)
    cx = 48
    foot_y = 121
    bob = -2 if step in (1, 5) else 0
    swing = [-8, -3, 6, 3, -6, -3, 8, 3][step % 8] if direction.startswith("walk") else 0
    side = direction in ("walk_side", "idle_side")
    back = direction in ("walk_up", "idle_up")

    boot = color("#2e2927")
    pants = color("#3d3936")
    jacket = color("#a96e3d")
    jacket_dark = color("#775033")
    shirt = color("#f0d39a")
    strap = color("#3b2b21")
    hat = color("#8a5b30")
    hat_top = color("#d29a3e")
    scarf = color("#d84b34")

    if side:
        leg_a = limb_poly(cx - 7, 80 + bob, 35, 8, swing * 0.55, pants)
        leg_b = limb_poly(cx + 4, 82 + bob, 33, 8, -swing * 0.4, pants)
    else:
        leg_a = limb_poly(cx - 9, 80 + bob, 35, 9, swing * 0.45, pants)
        leg_b = limb_poly(cx + 9, 80 + bob, 35, 9, -swing * 0.45, pants)
    draw_poly(draw, leg_a, pants)
    draw_poly(draw, leg_b, pants)
    draw_rect(draw, (cx - 17 + swing * 0.24, foot_y - 7, cx - 3 + swing * 0.24, foot_y - 1), boot)
    draw_rect(draw, (cx + 3 - swing * 0.24, foot_y - 7, cx + 17 - swing * 0.24, foot_y - 1), boot)

    if side:
        draw_poly(draw, [(cx - 18, 47 + bob), (cx + 9, 43 + bob), (cx + 18, 63 + bob), (cx + 10, 90 + bob), (cx - 14, 88 + bob), (cx - 22, 63 + bob)], jacket, jacket_dark)
        draw_poly(draw, [(cx + 4, 47 + bob), (cx + 17, 61 + bob), (cx + 10, 82 + bob), (cx - 1, 59 + bob)], jacket_dark)
        draw_line(draw, [(cx - 10, 48 + bob), (cx + 8, 86 + bob)], strap, 5)
        draw_rect(draw, (cx - 33, 66 + bob, cx - 16, 86 + bob), color("#7a4f2e"), color("#402d21"))
        draw_line(draw, [(cx - 13, 56 + bob), (cx - 29 + swing * 0.3, 83 + bob)], color("#a96a43"), 8)
        if expression == "thinking":
            draw_line(draw, [(cx + 12, 55 + bob), (cx + 22, 42 + bob)], color("#a96a43"), 8)
            draw_ellipse(draw, (cx + 20, 36 + bob, cx + 26, 42 + bob), color("#b97850"))
        else:
            draw_line(draw, [(cx + 14, 55 + bob), (cx + 28 - swing * 0.35, 80 + bob)], color("#a96a43"), 8)
        draw_face(draw, cx - 3, 34 + bob, expression, side=True)
        draw_ellipse(draw, (cx - 20, 18 + bob, cx + 39, 31 + bob), hat_top)
        draw_rect(draw, (cx - 15, 6 + bob, cx + 17, 25 + bob), hat)
        add_painted_marks(draw, cx, bob, side=True)
    else:
        draw_ellipse(draw, (cx - 20, 45 + bob, cx + 20, 88 + bob), jacket)
        draw_rect(draw, (cx + 2, 47 + bob, cx + 18, 85 + bob), jacket_dark)
        draw_poly(draw, [(cx - 8, 45 + bob), (cx + 8, 45 + bob), (cx + 3, 76 + bob), (cx - 3, 76 + bob)], shirt)
        if not back:
            draw_poly(draw, [(cx - 17, 42 + bob), (cx - 4, 42 + bob), (cx - 13, 58 + bob)], scarf)
        draw_line(draw, [(cx - 18, 47 + bob), (cx + 14, 86 + bob)], strap, 5)
        draw_rect(draw, (cx + 18, 65 + bob, cx + 37, 86 + bob), color("#7a4f2e"), color("#402d21"))
        draw_line(draw, [(cx - 24, 55 + bob), (cx - 33 + swing * 0.35, 84 + bob)], color("#a96a43"), 8)
        draw_line(draw, [(cx + 24, 55 + bob), (cx + 33 - swing * 0.35, 84 + bob)], color("#a96a43"), 8)
        if back:
            draw_ellipse(draw, (cx - 15, 20 + bob, cx + 15, 49 + bob), color("#8f5738"), color("#70422e"))
            draw_rect(draw, (cx - 18, 7 + bob, cx + 18, 27 + bob), hat)
            draw_ellipse(draw, (cx - 31, 18 + bob, cx + 31, 31 + bob), hat_top)
            draw_rect(draw, (cx - 16, 57 + bob, cx + 16, 86 + bob), color("#6d4a2e"), color("#402d21"))
        else:
            draw_face(draw, cx, 34 + bob, expression)
            draw_ellipse(draw, (cx - 31, 18 + bob, cx + 31, 31 + bob), hat_top)
            draw_rect(draw, (cx - 17, 7 + bob, cx + 17, 27 + bob), hat)
            draw_ellipse(draw, (cx + 6, 71 + bob, cx + 14, 79 + bob), color("#ffd45e"))
            if expression == "thinking":
                draw_line(draw, [(cx + 22, 56 + bob), (cx + 10, 38 + bob)], color("#a96a43"), 8)
                draw_ellipse(draw, (cx + 6, 34 + bob, cx + 13, 41 + bob), color("#b97850"))
        add_painted_marks(draw, cx, bob, side=False)
    return img


def draw_guide_frame(mode="idle", step=0):
    img = frame_canvas()
    draw = ImageDraw.Draw(img)
    cx = 48
    foot_y = 121
    bob = -1 if step % 4 in (1, 2) else 0
    talk = mode == "talk"
    point = mode == "point"
    arm_raise = 10 if point else (6 if talk and step % 2 else 0)
    skin = color("#9f623c")
    ink = color("#172321")

    draw_poly(draw, limb_poly(cx - 9, 80 + bob, 36, 10, 0, color("#352f2d")), color("#352f2d"))
    draw_poly(draw, limb_poly(cx + 9, 80 + bob, 36, 10, 0, color("#352f2d")), color("#352f2d"))
    draw_rect(draw, (cx - 17, foot_y - 7, cx - 3, foot_y - 1), color("#241f1d"))
    draw_rect(draw, (cx + 3, foot_y - 7, cx + 17, foot_y - 1), color("#241f1d"))
    draw_ellipse(draw, (cx - 24, 43 + bob, cx + 24, 91 + bob), color("#2d655b"), color("#173837"))
    draw_line(draw, [(cx - 11, 45 + bob), (cx + 17, 91 + bob)], color("#f0b74f"), 7)
    draw_line(draw, [(cx - 28, 55 + bob), (cx - 37, 84 - arm_raise + bob)], skin, 8)
    draw_line(draw, [(cx + 28, 55 + bob), (cx + 40, 78 - arm_raise * 1.9 + bob)], skin, 8)
    draw_ellipse(draw, (cx - 16, 19 + bob, cx + 16, 51 + bob), skin, color("#70422e"))
    draw_ellipse(draw, (cx - 17, 11 + bob, cx + 17, 24 + bob), color("#2d2019"))
    draw_rect(draw, (cx - 20, 22 + bob, cx + 20, 28 + bob), color("#d84b34"))
    draw_ellipse(draw, (cx - 7, 33 + bob, cx - 4, 36 + bob), ink)
    draw_ellipse(draw, (cx + 4, 33 + bob, cx + 7, 36 + bob), ink)
    if talk:
        mouth_h = 10 if step % 2 else 5
        draw_ellipse(draw, (cx - 5, 41 + bob, cx + 6, 42 + mouth_h + bob), color("#5a2f23"))
        draw_ellipse(draw, (cx - 12, 39 + bob, cx - 8, 43 + bob), color("#cf8a56", 115))
        draw_ellipse(draw, (cx + 8, 39 + bob, cx + 12, 43 + bob), color("#cf8a56", 115))
    else:
        draw.arc(sc((cx - 8, 38 + bob, cx + 8, 49 + bob)), 10, 172, fill=color("#5a2f23"), width=sc(2))
    draw_line(draw, [(cx - 13, 47 + bob), (cx - 3, 86 + bob)], color("#5a8b7e", 76), 2)
    draw_line(draw, [(cx + 10, 49 + bob), (cx + 18, 83 + bob)], color("#153e39", 70), 2)
    return img


def write_sheet(path, frames, rows):
    sheet = Image.new("RGBA", (FRAME_W * COLS, FRAME_H * rows), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        paste_frame(sheet, frame, index)
    sheet.save(path)


def bbox_for_frame(sheet, index):
    left = (index % COLS) * FRAME_W
    top = (index // COLS) * FRAME_H
    frame = sheet.crop((left, top, left + FRAME_W, top + FRAME_H))
    alpha = frame.getchannel("A")
    return alpha.getbbox()


def build_metadata(sheet_path, frame_count):
    sheet = Image.open(sheet_path).convert("RGBA")
    frames = []
    for index in range(frame_count):
        bbox = bbox_for_frame(sheet, index)
        if not bbox:
            frames.append({"index": index, "empty": True})
            continue
        left, top, right, bottom = bbox
        frames.append({
            "index": index,
            "bbox": [left, top, right, bottom],
            "bottomGap": FRAME_H - bottom,
            "centerX": round((left + right) / 2, 2),
        })
    return frames


def main():
    out_dir = Path("assets/phaser")
    out_dir.mkdir(parents=True, exist_ok=True)

    hero_frames = []
    for step in range(8):
        hero_frames.append(draw_hero_frame("walk_down", step))
    for step in range(8):
        hero_frames.append(draw_hero_frame("walk_up", step))
    for step in range(8):
        hero_frames.append(draw_hero_frame("walk_side", step))
    for expression in ["normal", "curious", "smile", "surprised", "thinking", "focused", "normal", "smile"]:
        hero_frames.append(draw_hero_frame("idle_down", 0, expression))
    for _ in range(8):
        hero_frames.append(draw_hero_frame("idle_up", 0))
    for expression in ["normal", "curious", "smile", "surprised", "thinking", "focused", "normal", "smile"]:
        hero_frames.append(draw_hero_frame("idle_side", 0, expression))

    guide_frames = []
    for step in range(4):
        guide_frames.append(draw_guide_frame("idle", step))
    for step in range(4):
        guide_frames.append(draw_guide_frame("talk", step))
    for step in range(4):
        guide_frames.append(draw_guide_frame("point", step))
    for step in range(4):
        guide_frames.append(draw_guide_frame("idle", step))

    hero_path = out_dir / "hero-spritesheet.png"
    guide_path = out_dir / "guide-spritesheet.png"
    write_sheet(hero_path, hero_frames, 6)
    write_sheet(guide_path, guide_frames, 2)

    metadata = {
        "frameWidth": FRAME_W,
        "frameHeight": FRAME_H,
        "columns": COLS,
        "hero": {
            "file": str(hero_path),
            "animations": {
                "walkDown": [0, 7],
                "walkUp": [8, 15],
                "walkSide": [16, 23],
                "idleDown": 24,
                "idleDownExpressions": {
                    "normal": 24,
                    "curious": 25,
                    "smile": 26,
                    "surprised": 27,
                    "thinking": 28,
                    "focused": 29
                },
                "idleUp": 32,
                "idleSideExpressions": {
                    "normal": 40,
                    "curious": 41,
                    "smile": 42,
                    "surprised": 43,
                    "thinking": 44,
                    "focused": 45
                }
            },
            "frames": build_metadata(hero_path, len(hero_frames))
        },
        "guide": {
            "file": str(guide_path),
            "animations": {
                "idle": [0, 3],
                "talk": [4, 7],
                "point": [8, 11]
            },
            "frames": build_metadata(guide_path, len(guide_frames))
        }
    }
    (out_dir / "sprite-metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(f"Wrote {hero_path}, {guide_path}, and sprite-metadata.json")


if __name__ == "__main__":
    main()
