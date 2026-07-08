"""Build layered 2D puppet textures from the painted spy hero side pose."""

import importlib.util
import json
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "assets/james-bond/level-01-briefing/blender-puppet"
LAYER_DIR = OUT_DIR / "layers"
FRAME_W = 192
FRAME_H = 220


def load_side_pose():
    spec = importlib.util.spec_from_file_location("walk", ROOT / "tools/build_spy_walk_cycle.py")
    walk = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(walk)
    source = Image.open(ROOT / walk.SRC).convert("RGBA")
    return walk.fit_to_frame(source.crop(walk.SIDE_BOX))


def polygon_mask(points):
    mask = Image.new("L", (FRAME_W, FRAME_H), 0)
    ImageDraw.Draw(mask).polygon(points, fill=255)
    return mask


def ellipse_mask(box):
    mask = Image.new("L", (FRAME_W, FRAME_H), 0)
    ImageDraw.Draw(mask).ellipse(box, fill=255)
    return mask


def save_layer(source, name, mask, pivot, depth, tint=1.0):
    layer = Image.new("RGBA", source.size, (0, 0, 0, 0))
    layer.alpha_composite(source)
    alpha = Image.composite(source.getchannel("A"), Image.new("L", source.size, 0), mask)
    layer.putalpha(alpha)
    bbox = layer.getbbox()
    if not bbox:
        raise RuntimeError(f"{name} layer is empty")
    crop = layer.crop(bbox)
    if tint != 1.0:
        r, g, b, a = crop.split()
        scale = Image.eval(Image.new("L", crop.size, 255), lambda _v: int(255 * tint))
        r = Image.eval(r, lambda v: int(v * tint))
        g = Image.eval(g, lambda v: int(v * tint))
        b = Image.eval(b, lambda v: int(v * tint))
        crop = Image.merge("RGBA", (r, g, b, a))
    path = LAYER_DIR / f"{name}.png"
    crop.save(path)
    return {
        "name": name,
        "path": str(path.relative_to(ROOT)),
        "bbox": list(bbox),
        "pivot": list(pivot),
        "depth": depth,
    }


def main():
    LAYER_DIR.mkdir(parents=True, exist_ok=True)
    side = load_side_pose()
    side.save(OUT_DIR / "side-fit-source.png")

    layers = []
    # Both legs are cut from the fully-visible near (front) leg so each is a
    # complete, chunky cargo-trouser leg with a full boot. The old thin polygon
    # slices left the back leg as a skeletal sliver. The back leg reuses the same
    # full silhouette, darkened, and is drawn behind the torso for depth.
    full_leg = [
        (72, 122), (120, 122), (120, 150), (118, 176),
        (121, 194), (117, 208), (93, 208), (90, 190),
        (86, 176), (80, 150),
    ]
    layers.append(save_layer(
        side,
        "back_leg",
        polygon_mask(full_leg),
        (96, 127),
        -0.04,
        tint=0.82,
    ))
    layers.append(save_layer(
        side,
        "front_leg",
        polygon_mask(full_leg),
        (96, 127),
        -0.02,
    ))
    layers.append(save_layer(
        side,
        "rear_arm",
        polygon_mask([(68, 76), (91, 82), (88, 153), (75, 155), (66, 105)]),
        (78, 83),
        -0.01,
    ))
    layers.append(save_layer(
        side,
        "torso_bag",
        polygon_mask([(55, 56), (112, 56), (128, 132), (108, 146), (71, 144), (55, 118)]),
        (92, 128),
        0.0,
    ))
    layers.append(save_layer(
        side,
        "front_arm",
        polygon_mask([(96, 78), (113, 85), (116, 151), (103, 154), (94, 106)]),
        (104, 86),
        0.02,
    ))
    layers.append(save_layer(
        side,
        "head",
        ellipse_mask((61, 5, 130, 72)),
        (93, 67),
        0.03,
    ))

    metadata = {
        "frame_width": FRAME_W,
        "frame_height": FRAME_H,
        "layers": layers,
    }
    (OUT_DIR / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(f"Wrote {OUT_DIR}")


if __name__ == "__main__":
    main()
